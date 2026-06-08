# Spielbrett — Deployment

Hub (Spielbrett) auf `johannes-fahland.com` und Turnier (Turnierleitung) auf
`turnier.johannes-fahland.com` laufen als zwei PM2-Prozesse am Raspberry Pi.
Build läuft in GitHub Actions auf `ubuntu-latest`, Deploy auf dem self-hosted
Pi-Runner via rsync. ARM64-Native-Binaries werden im Build-Job nachgezogen.

## Architektur

```
Cloudflare-Tunnel
  ├─ johannes-fahland.com         → localhost:3000 (PM2: hub)
  └─ turnier.johannes-fahland.com → localhost:3001 (PM2: turnier)

Beide Apps teilen sich:
  /home/johannes/apps/data/spielbrett.db   (SQLite, WAL-Mode)
```

## Erste-Inbetriebnahme — User-TODOs

### 1. Cloudflare CNAME für Subdomain

1. **dash.cloudflare.com** → Zone `johannes-fahland.com` → **DNS** → **Records** → **Add record**.
2. Werte:
   - **Type:** `CNAME`
   - **Name:** `turnier`
   - **Target:** der gleiche Wert wie im bestehenden `johannes-fahland.com`-Record (typischerweise `<tunnel-uuid>.cfargotunnel.com`).
   - **Proxy status:** Proxied (orange Wolke).
   - **TTL:** Auto.
3. Speichern. Propagiert sofort über das Cloudflare-Backbone.

### 2. Cloudflare-Tunnel Ingress am Pi

Tunnel-Config liegt am Pi unter `/home/johannes/.cloudflared/config.yml` (oder
`/etc/cloudflared/config.yml`). Reihenfolge: spezifische Hostnames zuerst.

```yaml
tunnel: <bestehende-tunnel-uuid>
credentials-file: /home/johannes/.cloudflared/<bestehende-tunnel-uuid>.json

ingress:
  - hostname: turnier.johannes-fahland.com
    service: http://localhost:3001
  - hostname: johannes-fahland.com
    service: http://localhost:3000
  - service: http_status:404
```

Reload:
```bash
sudo systemctl restart cloudflared
# oder bei user-service:
systemctl --user restart cloudflared
```

Verifikation:
```bash
curl -sI https://turnier.johannes-fahland.com/ | head -3
# erwarte HTTP/2 200 sobald PM2 turnier auf :3001 lauscht
```

### 3. Pi-Verzeichnisse + .env + PM2

Einmalig am Pi:

```bash
sudo -u johannes mkdir -p \
  /home/johannes/apps/active-site/hub \
  /home/johannes/apps/active-site/turnier \
  /home/johannes/apps/data

# .env pro App (werden vom rsync via --exclude='.env' nie überschrieben)
echo 'DATABASE_URL=file:/home/johannes/apps/data/spielbrett.db' \
  > /home/johannes/apps/active-site/hub/.env
echo 'DATABASE_URL=file:/home/johannes/apps/data/spielbrett.db' \
  > /home/johannes/apps/active-site/turnier/.env

# Alten Single-Prozess löschen (falls noch da)
pm2 delete active-site 2>/dev/null || true
pm2 save

# Ecosystem-Datei am Pi ablegen (Vorlage aus dem Repo)
cp <pfad-zum-checkout>/docs/ecosystem.config.cjs.example \
   /home/johannes/apps/ecosystem.config.cjs

# Erster Start (anschließend übernimmt der Workflow)
pm2 startOrReload /home/johannes/apps/ecosystem.config.cjs
pm2 save
```

## Deploy-Flow (automatisch via GitHub Actions)

Push zu `master` triggert `.github/workflows/deploy.yml`:

1. **Build (ubuntu-latest, Matrix [hub, turnier]):**
   - `pnpm install --frozen-lockfile`
   - `pnpm --filter @spielbrett/db generate`
   - `pnpm --filter <app> build` → Standalone-Bundle in `apps/<app>/.next/standalone/`
   - `scripts/deploy-assemble.sh` kopiert `public/`, `.next/static/`, Prisma-Migrations ins Bundle
   - `scripts/install-arm64-natives.sh` ersetzt x64-Binaries (better-sqlite3, sharp, swc) durch arm64-Prebuilds
   - Upload als Artifact `pi-release-<app>`

2. **Deploy (self-hosted am Pi):**
   - Download beide Artifacts
   - `rsync -a --delete --exclude='.env' --exclude='data/'` nach `~/apps/active-site/{hub,turnier}/`
   - Verify: `file` auf `better_sqlite3.node` muss `aarch64` zeigen
   - Prisma-Migration: `node ~/apps/active-site/hub/packages/db/scripts/migrate.mjs` (idempotent, shared DB)
   - `pm2 startOrReload ~/apps/ecosystem.config.cjs --update-env` + `pm2 save`
   - Smoke-Test: beide Ports müssen 200 antworten

## Lokale Entwicklung

```bash
# Hub (Port 3000)
pnpm dev:hub

# Turnier (Port 3001)
pnpm dev:turnier

# Beide parallel (Vorsicht: pnpm-Parallel-Output ist verwirrend)
pnpm dev:all

# Prisma
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

Pro App gibt es eine `.env` mit `DATABASE_URL`. Lokal teilen sich Hub und Turnier
die `packages/db/dev.db` (WAL-Mode erlaubt N Reader + 1 Writer).

## Bekannte Spezialitäten

- **Node 24 + Corp-Proxy lokal:** `prebuild-install` und `prisma generate` brauchen
  ggf. `NODE_TLS_REJECT_UNAUTHORIZED=0` (lokales Cert-Problem, **nicht in CI** nötig).
- **PWA-Cache:** Bei jedem Brand-/Asset-Wechsel `CACHE_NAME` in `apps/hub/public/sw.js`
  bumpen (`spielbrett-v2`, …), sonst kleben alte Installs am Vibecode-Bundle.
- **Schema-Änderungen:** `pnpm --filter @spielbrett/db exec prisma migrate dev --name <name>`
  erstellt eine Migration. Im CI/Deploy reicht der `scripts/migrate.mjs`-Apply.
- **Hub ↔ Turnier-Datenkommunikation:** Hub schreibt nur in `User`/`Session`, Turnier nur
  in `Tournament*`/`Round*`/`Match*` — disjunkt, kein Lock-Konflikt.
