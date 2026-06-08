#!/usr/bin/env bash
# Assembles a Next.js standalone bundle for deployment.
#
# Next-standalone copies the server + traced node_modules into `.next/standalone/`,
# but NOT `public/` or `.next/static/` (those are expected on a CDN). For our
# Pi-Deploy we serve them via the same Next-server, so we copy them in here.
#
# In a monorepo with `outputFileTracingRoot = repo-root`, the standalone bundle
# mirrors the workspace layout. Public/static go under apps/<app>/...
#
# Usage: bash scripts/deploy-assemble.sh <app>
#   <app>  →  "hub" or "turnier"

set -euo pipefail

APP="${1:?usage: deploy-assemble.sh <app>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/apps/$APP"
STANDALONE="$APP_DIR/.next/standalone"

if [ ! -d "$STANDALONE" ]; then
  echo "ERROR: $STANDALONE not found — did you run 'pnpm --filter $APP build' first?"
  exit 1
fi

# Static assets (CSS/JS chunks) → under .next/static in bundle
mkdir -p "$STANDALONE/apps/$APP/.next/static"
cp -r "$APP_DIR/.next/static/." "$STANDALONE/apps/$APP/.next/static/"

# Public assets (manifest, icons, sw.js, …) → under public/ in bundle
if [ -d "$APP_DIR/public" ]; then
  mkdir -p "$STANDALONE/apps/$APP/public"
  cp -r "$APP_DIR/public/." "$STANDALONE/apps/$APP/public/"
fi

# Prisma artifacts (schema + migrations + the migrate script) → under packages/db
mkdir -p "$STANDALONE/packages/db/prisma" "$STANDALONE/packages/db/scripts"
cp -r "$ROOT/packages/db/prisma/." "$STANDALONE/packages/db/prisma/"
cp "$ROOT/packages/db/scripts/migrate.mjs" "$STANDALONE/packages/db/scripts/migrate.mjs"

echo "Assembled standalone bundle: $STANDALONE"
