#!/usr/bin/env bash
# Replaces x64 native binaries in a standalone bundle with arm64 prebuilds.
# Required because CI builds on ubuntu-latest (x64) but the Pi is arm64.
#
# Usage: bash scripts/install-arm64-natives.sh <app>
#   <app>  →  "hub" or "turnier"

set -euxo pipefail

APP="${1:?usage: install-arm64-natives.sh <app>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STANDALONE="$ROOT/apps/$APP/.next/standalone"
NM_ROOT="$STANDALONE/node_modules"

if [ ! -d "$NM_ROOT" ]; then
  echo "ERROR: standalone node_modules not at $NM_ROOT — run deploy-assemble.sh first"
  exit 1
fi

# Stage 1: pull arm64 prebuilds into a tmp area via npm with cpu/os flags.
# This also gives us an INTACT prebuild-install CLI — the copy inside the
# Next standalone bundle is incomplete (output-file-tracing drops bin.js,
# since it's never require()d at runtime), so running it from there throws
# MODULE_NOT_FOUND. We always invoke the tmp copy instead.
TMP_DIR="$(mktemp -d)"
trap "rm -rf $TMP_DIR" EXIT

cd "$TMP_DIR"
cp "$ROOT/packages/db/package.json" .
# bring in the workspace lockfile context so npm doesn't try to resolve workspaces
npm install --cpu=arm64 --os=linux --libc=glibc --ignore-scripts 2>/dev/null || true
# Guarantee a usable prebuild-install regardless of the line above
npm install --no-save --ignore-scripts prebuild-install@^7 2>/dev/null || true

PREBUILD_BIN="$TMP_DIR/node_modules/prebuild-install/bin.js"
if [ ! -f "$PREBUILD_BIN" ]; then
  echo "ERROR: prebuild-install CLI not found at $PREBUILD_BIN"
  exit 1
fi

# Stage 2: replace every better-sqlite3 binary in the bundle with the arm64 prebuild.
# pnpm with node-linker=hoisted still scatters multiple copies through the
# .pnpm content-addressed store, so we walk them all.
BS3_BIN_FOUND=0
mapfile -t BS3_PKGS < <(find "$NM_ROOT" -path '*/better-sqlite3/package.json' -not -path '*/node_modules/.pnpm/*better-sqlite3*/node_modules/better-sqlite3/node_modules/*')

if [ ${#BS3_PKGS[@]} -eq 0 ]; then
  echo "ERROR: no better-sqlite3 found in standalone bundle"
  exit 1
fi

for PKG_JSON in "${BS3_PKGS[@]}"; do
  BS3_DIR="$(dirname "$PKG_JSON")"
  echo "→ prebuild-install arm64 into: $BS3_DIR"
  # Run the INTACT tmp CLI with CWD=BS3_DIR: prebuild-install reads the target
  # package.json from $PWD and writes build/Release/ there, but its own code is
  # loaded from the complete tmp copy (not the stripped bundle copy).
  (
    cd "$BS3_DIR"
    node "$PREBUILD_BIN" --platform=linux --arch=arm64 --runtime=node \
      || node "$PREBUILD_BIN" --platform=linux --arch=arm64
  )
  BIN="$BS3_DIR/build/Release/better_sqlite3.node"
  if [ -f "$BIN" ] && file "$BIN" | grep -qE 'ARM aarch64|aarch64'; then
    BS3_BIN_FOUND=1
  fi
done

if [ "$BS3_BIN_FOUND" -eq 0 ]; then
  echo "ERROR: no better-sqlite3 arm64 binary verified after prebuild-install"
  exit 1
fi

# Stage 3: drop in arm64 sharp + swc prebuilds (Next image-opt + compiler).
for pkg in @img/sharp-linux-arm64 @img/sharp-libvips-linux-arm64 \
           @next/swc-linux-arm64-gnu @next/swc-linux-arm64-musl; do
  SRC="$TMP_DIR/node_modules/$pkg"
  if [ -d "$SRC" ]; then
    # Find where the corresponding @img / @next path exists in standalone
    while IFS= read -r dest; do
      mkdir -p "$dest"
      cp -r "$SRC/." "$dest/"
    done < <(find "$NM_ROOT" -type d -name "${pkg##*/}" -path "*${pkg%/*}*")
    # Always also place it at the top-level node_modules so resolvers find it
    mkdir -p "$NM_ROOT/$pkg"
    cp -r "$SRC/." "$NM_ROOT/$pkg/"
  fi
done

# Stage 4: slim the bundle so the self-hosted Pi runner can actually pull it.
# The raw standalone is ~330 MB (mostly foreign-platform prebuilds, build
# intermediates and source maps), which times out the artifact download over a
# home connection. None of the removals below are needed at runtime or by
# migrate.mjs (which talks to the DB through the arm64 better_sqlite3.node).
SIZE_BEFORE="$(du -sh "$STANDALONE" 2>/dev/null | cut -f1)"

# 4a. Foreign-platform native dirs (keep only linux-arm64).
for pat in '*linux-x64*' '*linux-x64-gnu*' '*linux-x64-musl*' '*win32*' '*darwin*' \
           '*linux-arm-*' '*android*' '*freebsd*' '*linuxmusl-x64*'; do
  find "$NM_ROOT" -type d -name "$pat" -prune -exec rm -rf {} + 2>/dev/null || true
done
# Leftover @img / @next / @esbuild / @rollup platform packages that are not arm64.
find "$NM_ROOT" -type d -regextype posix-extended \
     -regex '.*/(@img|@next|@esbuild|@rollup)/[^/]*(linux-x64|darwin|win32|wasm32|android|freebsd|linux-arm[^6]).*' \
     -prune -exec rm -rf {} + 2>/dev/null || true

# 4b. better-sqlite3 build intermediates — keep build/Release/*.node, drop the rest.
while IFS= read -r bs3; do
  rm -rf "$bs3/deps" "$bs3/src" "$bs3/build/Release/obj" "$bs3/build/Release/obj.target" \
         "$bs3/build/deps" "$bs3/build/Makefile" "$bs3/build/binding.Makefile" \
         "$bs3/build/config.gypi" "$bs3/build/gyp-mac-tool" 2>/dev/null || true
  find "$bs3/build" -name '*.o' -delete 2>/dev/null || true
done < <(find "$NM_ROOT" -type d -path '*/better-sqlite3' 2>/dev/null)

# 4c. Prisma: the app uses the better-sqlite3 driver adapter, so the engine
# binaries / CLI download caches are dead weight. Keep @prisma/client + .prisma.
rm -rf "$NM_ROOT/@prisma/engines" "$NM_ROOT/prisma" \
       "$NM_ROOT/.pnpm"/prisma@*/node_modules/prisma 2>/dev/null || true
find "$NM_ROOT" -type d -path '*/@prisma/engines*' -prune -exec rm -rf {} + 2>/dev/null || true
find "$NM_ROOT" -type f \( -name 'libquery_engine*' -o -name 'query-engine*' \
     -o -name 'schema-engine*' -o -name 'migration-engine*' \) -delete 2>/dev/null || true

# 4d. Universal dead weight: source maps, build-time docs, test fixtures, caches.
find "$NM_ROOT" -type f -name '*.map' -delete 2>/dev/null || true
find "$STANDALONE" -type d -name 'cache' -path '*/.next/*' -prune -exec rm -rf {} + 2>/dev/null || true
find "$NM_ROOT" -type f \( -name '*.md' -o -name '*.markdown' -o -name 'LICENSE*' \
     -o -name 'CHANGELOG*' -o -name '*.ts' ! -name '*.d.ts' \) -delete 2>/dev/null || true
find "$NM_ROOT" -type d \( -name 'test' -o -name 'tests' -o -name '__tests__' \
     -o -name 'docs' -o -name 'example' -o -name 'examples' \) -prune -exec rm -rf {} + 2>/dev/null || true

SIZE_AFTER="$(du -sh "$STANDALONE" 2>/dev/null | cut -f1)"
echo "── bundle slimmed: $SIZE_BEFORE → $SIZE_AFTER ($APP)"
echo "── top 20 remaining dirs in bundle:"
du -h "$STANDALONE" 2>/dev/null | sort -rh | head -20 || true

echo "arm64 native binaries installed for $APP"
