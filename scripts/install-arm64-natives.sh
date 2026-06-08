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

# Stage 1: pull arm64 prebuilds into a tmp area via npm with cpu/os flags
TMP_DIR="$(mktemp -d)"
trap "rm -rf $TMP_DIR" EXIT

cd "$TMP_DIR"
cp "$ROOT/packages/db/package.json" .
# bring in the workspace lockfile context so npm doesn't try to resolve workspaces
npm install --cpu=arm64 --os=linux --libc=glibc --ignore-scripts 2>/dev/null || true

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
  (
    cd "$BS3_DIR"
    npx --yes prebuild-install --platform=linux --arch=arm64 --runtime=node \
      || npx --yes prebuild-install --platform=linux --arch=arm64
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

# Stage 4: strip x64-specific binaries to shrink artifact size
find "$NM_ROOT" -type d -name '*linux-x64*' -prune -exec rm -rf {} + 2>/dev/null || true
find "$NM_ROOT" -type d -name '*win32*'     -prune -exec rm -rf {} + 2>/dev/null || true
find "$NM_ROOT" -type d -name '*darwin*'    -prune -exec rm -rf {} + 2>/dev/null || true

echo "arm64 native binaries installed for $APP"
