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
mkdir -p "$STANDALONE/packages/db/prisma" "$STANDALONE/packages/db/scripts"
cp -r "packages/db/prisma/." "$STANDALONE/packages/db/prisma/"
cp "packages/db/scripts/migrate.mjs" "$STANDALONE/packages/db/scripts/migrate.mjs"
[ -f "$STANDALONE/apps/$APP/server.js" ] || { echo "FATAL: $STANDALONE/apps/$APP/server.js missing after assemble"; exit 1; }

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
