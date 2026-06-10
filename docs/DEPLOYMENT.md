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

## Native Build am Pi — Architektur (seit 2026-06)

Der Deploy baut **nativ auf dem Pi** (kein Cross-Arch-Artefakt-Download mehr — der 288-MB-Download
über die Heimleitung war die Ursache aller Fehlschläge nach dem Rebrand). Ein einziger
self-hosted Job: `pnpm install` (kompiliert better-sqlite3 nativ für arm64) → pro App seriell
`build-deploy-app.sh` (webpack-Build → `.next/cache` löschen → assemble → rsync ~60 MB Standalone
nach `active-site` → `.next` löschen, damit nie zwei Build-Bäume gleichzeitig auf der Karte liegen)
→ Migration → PM2-Reload → Smoke-Test.

**Pi-Eckdaten (real, Stand 2026-06):** Raspberry Pi, aarch64, 4 Cores, **905 MB RAM + ~2–4 GB Swap**,
**6.8-GB-SD-Karte** (eng!). Deshalb: `next build --webpack` (nicht der Next-16-Turbopack-Default —
Turbopacks nativer Rust-Heap würde auf 905 MB thrashen), Heap-Cap 1536, serielles build+deploy.

**Webpack-Standalone-Falle:** `outputFileTracingExcludes` darf **niemals** `apps/<app>/.next/**`
enthalten — dieser Glob schließt unter Linux die eigene Server-Runtime (`.next/server/webpack-runtime.js`,
von jedem `page.js` via `require("../webpack-runtime.js")` geladen) mit aus → Laufzeit-Crash
`MODULE_NOT_FOUND`. `build-deploy-app.sh` spiegelt `.next/server` zusätzlich selbstheilend ins
Bundle und verifiziert `webpack-runtime.js` hart vor dem Deploy.

## Wartung — SD-Karte freihalten (wichtig!)

Die 6.8-GB-Karte läuft voll, wenn man nichts tut. Die Pipeline räumt bei **jedem** Run automatisch
runner-eigene Caches auf (pnpm store, npm/node-gyp cache, alte `_work/.next`, PM2-Logs). Was **root**
braucht, muss **einmalig/gelegentlich manuell** per SSH passieren:

```bash
ssh johannes@pi-server
df -h /                              # Kontrolle: wie voll?
sudo apt-get clean                   # apt-Paket-Cache (oft mehrere 100 MB)
sudo journalctl --vacuum-time=3d     # systemd-Journal auf 3 Tage kürzen
du -sh ~/actions-runner/_work/* 2>/dev/null | sort -rh | head   # größte Workspaces finden
# ggf. ältesten Runner-Workspace komplett löschen (wird beim nächsten Run neu geklont):
# rm -rf ~/actions-runner/_work/johannes-fahland/johannes-fahland   # NUR wenn nötig
df -h /                              # Ziel: >= ~1.5 GB frei
```

Der Preflight bricht **bewusst** ab, wenn < 900 MB auf `/home` frei sind — das schützt vor einem
ENOSPC mitten im Build (halb geschriebenes, nicht-bootfähiges Bundle = kaputte Seite).

## Bekannte Spezialitäten

- **Node 24 + Corp-Proxy lokal:** `prebuild-install` und `prisma generate` brauchen
  ggf. `NODE_TLS_REJECT_UNAUTHORIZED=0` (lokales Cert-Problem, **nicht in CI** nötig).
- **PWA-Cache:** Bei jedem Brand-/Asset-Wechsel `CACHE_NAME` in `apps/hub/public/sw.js`
  bumpen (`spielbrett-v2`, …), sonst kleben alte Installs am Vibecode-Bundle.
- **Schema-Änderungen:** `pnpm --filter @spielbrett/db exec prisma migrate dev --name <name>`
  erstellt eine Migration. Im CI/Deploy reicht der `scripts/migrate.mjs`-Apply.
- **Hub ↔ Turnier-Datenkommunikation:** Hub schreibt nur in `User`/`Session`, Turnier nur
  in `Tournament*`/`Round*`/`Match*` — disjunkt, kein Lock-Konflikt.
