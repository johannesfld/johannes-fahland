#!/usr/bin/env bash
# Build, assemble and deploy ONE app's standalone bundle to the Pi, then reclaim disk.
#
# Disk-frugal by design: this Pi is a 6.8 GB SD card with ~1.5 GB free. The webpack
# build tree (apps/<app>/.next, ~300 MB incl. cache) is the disk hog; the deployed
# standalone is only ~60 MB. By building, deploying and then deleting .next for EACH
# app in turn, the two apps' build trees never coexist on the card.
#
# Usage: bash .github/scripts/build-deploy-app.sh <hub|turnier>
#
# Expects these env vars (set by deploy.yml):
#   ACTIVE_SITE       e.g. /home/johannes/apps/active-site
#   SHARED_DB_DIR     e.g. /home/johannes/apps/data   (must be OUTSIDE active-site)
#   DATABASE_URL      build-time dummy db (file:/tmp/...)
#   NODE_OPTIONS      heap cap, scoped to the build

set -euo pipefail

APP="${1:?usage: build-deploy-app.sh <hub|turnier>}"
case "$APP" in
  hub|turnier) ;;
  *) echo "FATAL: unknown app '$APP' (expected hub or turnier)"; exit 1;;
esac

: "${ACTIVE_SITE:?ACTIVE_SITE not set}"
: "${SHARED_DB_DIR:?SHARED_DB_DIR not set}"

STANDALONE="apps/$APP/.next/standalone"

echo "===== [$APP] mem before build ====="; free -h || true
echo "===== [$APP] disk before build ====="; df -h /home || true

# 1) Build with the legacy webpack compiler (lower peak RSS than the Turbopack default).
echo "----- [$APP] next build --webpack -----"
pnpm --filter "$APP" exec next build --webpack

# 2) Drop the webpack build cache immediately — it is the single biggest chunk of .next
#    (~250 MB) and is never needed at runtime. Frees the card before we copy anything.
rm -rf "apps/$APP/.next/cache" || true
echo "===== [$APP] disk after build (cache dropped) ====="; df -h /home || true

# 3) Assemble: Next standalone does NOT copy public/ or .next/static/ (it assumes a CDN);
#    we serve them from the same node server, so copy them into the bundle. Also drop the
#    prisma schema + migrate script next to the traced packages/db for the migrate step.
[ -d "$STANDALONE" ] || { echo "FATAL: $STANDALONE missing — build produced no standalone output"; exit 1; }
mkdir -p "$STANDALONE/apps/$APP/.next/static"
cp -r "apps/$APP/.next/static/." "$STANDALONE/apps/$APP/.next/static/"
if [ -d "apps/$APP/public" ]; then
  mkdir -p "$STANDALONE/apps/$APP/public"
  cp -r "apps/$APP/public/." "$STANDALONE/apps/$APP/public/"
fi

# 3b) Self-heal the server runtime. Next's file tracer decides per-file what lands in the
#     standalone; an over-broad outputFileTracingExcludes once stripped .next/server/
#     webpack-runtime.js, which every page.js requires via ../webpack-runtime.js, crashing
#     the deployed app with MODULE_NOT_FOUND at first request. Mirror the freshly-built
#     .next/server (minus the dropped cache) into the standalone so the runtime is ALWAYS
#     complete, independent of tracer quirks.
if [ -d "apps/$APP/.next/server" ]; then
  mkdir -p "$STANDALONE/apps/$APP/.next/server"
  cp -r "apps/$APP/.next/server/." "$STANDALONE/apps/$APP/.next/server/"
fi

# 3b-2) Self-heal the NATIVE runtime deps. Next's tracer does not reliably follow the pnpm
#       symlink layout for packages it can't statically analyse: better-sqlite3 (native .node
#       loaded via a dynamic require) and the Prisma client/adapter were MISSING from the
#       standalone node_modules entirely. Statically-rendered hub survived (its root never
#       touches the DB at runtime), but dynamically-rendered turnier crashed with
#       "Could not locate the bindings file ... better_sqlite3.node" / could not resolve
#       @prisma/client. Copy the real pnpm package dirs into the standalone and recreate the
#       top-level node_modules symlinks Node needs to resolve `require('better-sqlite3')` etc.
SA_NM="$STANDALONE/node_modules"
mkdir -p "$SA_NM/.pnpm"
# (a) copy each needed package's .pnpm/<pkg@ver> dir verbatim (carries build/Release/*.node etc.)
for srcpnpm in \
  node_modules/.pnpm/better-sqlite3@* \
  node_modules/.pnpm/bindings@* \
  node_modules/.pnpm/file-uri-to-path@* \
  node_modules/.pnpm/@prisma+client@* \
  node_modules/.pnpm/@prisma+adapter-better-sqlite3@* \
  node_modules/.pnpm/@prisma+driver-adapter-utils@* \
  node_modules/.pnpm/@prisma+client-runtime-utils@* \
  node_modules/.pnpm/@prisma+debug@*; do
  [ -d "$srcpnpm" ] || continue
  base="$(basename "$srcpnpm")"
  [ -d "$SA_NM/.pnpm/$base" ] || cp -r "$srcpnpm" "$SA_NM/.pnpm/$base"
done
# (b) recreate the top-level resolution entries Node walks for a bare `require('<pkg>')`.
#     Copy the real (symlink-resolved) package dir so the bundle is self-contained — no
#     dangling symlinks after rsync to the Pi.
link_pkg() {
  pkg="$1"; real="$2"
  [ -d "$real" ] || { echo "WARN: native dep source missing: $real"; return 0; }
  dest="$SA_NM/$pkg"
  [ -e "$dest" ] && return 0
  mkdir -p "$(dirname "$dest")"
  cp -rL "$real" "$dest" 2>/dev/null || cp -r "$real" "$dest"
}
link_pkg better-sqlite3 "$(ls -d node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 2>/dev/null | head -1)"
link_pkg @prisma/client "$(ls -d node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client 2>/dev/null | head -1)"
link_pkg @prisma/adapter-better-sqlite3 "$(ls -d node_modules/.pnpm/@prisma+adapter-better-sqlite3@*/node_modules/@prisma/adapter-better-sqlite3 2>/dev/null | head -1)"
# .prisma/client (generated client) lives at node_modules/.prisma — copy if present.
if [ -d node_modules/.prisma ]; then
  [ -e "$SA_NM/.prisma" ] || cp -rL node_modules/.prisma "$SA_NM/.prisma" 2>/dev/null || cp -r node_modules/.prisma "$SA_NM/.prisma"
fi

# 3b-3) Place the native binary where `bindings` ACTUALLY looks. Webpack bundles
#       better-sqlite3's `bindings('better_sqlite3.node')` call into the server chunk, and
#       `bindings` resolves relative to the CALLING module's dir — i.e. the bundle's
#       apps/<app>/.next, NOT node_modules. So at runtime it searches
#       apps/<app>/.next/build/Release/better_sqlite3.node (and ../build/, etc.) and a copy
#       sitting only under node_modules is never found -> "Could not locate the bindings
#       file" -> 500 on every DB-backed (dynamically rendered) route. Drop the arm64 .node
#       into the exact build/Release path the search list checks first.
BS3_SRC="$(find node_modules/.pnpm -name 'better_sqlite3.node' -path '*build/Release*' 2>/dev/null | head -1)"
if [ -n "$BS3_SRC" ]; then
  mkdir -p "$STANDALONE/apps/$APP/.next/build/Release"
  cp "$BS3_SRC" "$STANDALONE/apps/$APP/.next/build/Release/better_sqlite3.node"
fi

mkdir -p "$STANDALONE/packages/db/prisma" "$STANDALONE/packages/db/scripts"
cp -r "packages/db/prisma/." "$STANDALONE/packages/db/prisma/"
cp "packages/db/scripts/migrate.mjs" "$STANDALONE/packages/db/scripts/migrate.mjs"

# 3c) Hard verification BEFORE deploy: the entrypoint, the webpack runtime that every route
#     requires, AND the native better-sqlite3 binary must be present, or the app would boot
#     and then crash on first request. Fail here (build tree intact, active-site untouched)
#     instead of in the smoke test after PM2 already reloaded.
[ -f "$STANDALONE/apps/$APP/server.js" ] || { echo "FATAL: $STANDALONE/apps/$APP/server.js missing after assemble"; exit 1; }
[ -f "$STANDALONE/apps/$APP/.next/server/webpack-runtime.js" ] \
  || { echo "FATAL: webpack-runtime.js missing from standalone — app would crash with MODULE_NOT_FOUND"; exit 1; }
# The binary MUST exist at the path `bindings` searches (.next/build/Release), not just
# somewhere under node_modules — that is the whole point of step 3b-3.
BS3_NODE="$STANDALONE/apps/$APP/.next/build/Release/better_sqlite3.node"
[ -f "$BS3_NODE" ] || { echo "FATAL: better_sqlite3.node missing at $BS3_NODE — DB-backed routes would 500 ('Could not locate the bindings file')"; exit 1; }
file "$BS3_NODE" | grep -qE 'aarch64|ARM aarch64' \
  || { echo "FATAL: bundled better_sqlite3.node is not arm64: $(file "$BS3_NODE")"; exit 1; }
echo "[$APP] native runtime OK: $BS3_NODE"

du -sh "$STANDALONE" 2>/dev/null || true

# 4) Deploy: rsync the standalone CONTENTS into the fixed active-site path (stable across
#    runner _work-dir rotations, so PM2's cwd/script paths stay valid forever).
#    Guard: the shared DB must NOT live under active-site, or --delete could nuke it.
case "$SHARED_DB_DIR" in
  "$ACTIVE_SITE"/*) echo "FATAL: SHARED_DB_DIR ($SHARED_DB_DIR) is under ACTIVE_SITE ($ACTIVE_SITE) — rsync --delete would destroy the DB"; exit 1;;
esac
mkdir -p "$ACTIVE_SITE/$APP"
# --exclude protects an EXISTING active-site/<app>/.env from BOTH transfer and --delete.
rsync -a --delete --exclude='.env' --exclude='.env.*' \
  "$STANDALONE/" "$ACTIVE_SITE/$APP/"
[ -f "$ACTIVE_SITE/$APP/apps/$APP/server.js" ] || { echo "FATAL: deployed server.js missing at $ACTIVE_SITE/$APP/apps/$APP/server.js"; exit 1; }
echo "[$APP] deployed -> $ACTIVE_SITE/$APP/apps/$APP/server.js"

# 5) Reclaim disk: delete this app's whole .next so the next app builds with maximum free
#    space. The deployed copy in active-site is independent of this build tree.
rm -rf "apps/$APP/.next"
echo "===== [$APP] disk after deploy (.next removed) ====="; df -h /home || true
echo "[$APP] done."
