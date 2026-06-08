#!/usr/bin/env node
// Applies Prisma migrations manually via better-sqlite3 — no prisma CLI needed.
// Reads migration SQL files from prisma/migrations/ and runs them in order,
// tracking applied migrations in the _prisma_migrations table (same as prisma migrate deploy).
import { createRequire } from 'module';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const dbPath = dbUrl.replace(/^file:/, '');
const resolvedDbPath = dbPath.startsWith('/') ? dbPath : join(appRoot, dbPath);

console.log(`DB: ${resolvedDbPath}`);

const db = new Database(resolvedDbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )
`);

const migrationsDir = join(appRoot, 'prisma', 'migrations');
const migrations = readdirSync(migrationsDir)
  .filter(f => existsSync(join(migrationsDir, f, 'migration.sql')))
  .sort();

const applied = new Set(
  db.prepare('SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL').all().map(r => r.migration_name)
);

let count = 0;
for (const name of migrations) {
  if (applied.has(name)) continue;
  const sql = readFileSync(join(migrationsDir, name, 'migration.sql'), 'utf8');
  console.log(`Applying: ${name}`);
  db.exec(sql);
  db.prepare(
    `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)
     VALUES (lower(hex(randomblob(16))), '', datetime('now'), ?, 1)`
  ).run(name);
  count++;
}

db.close();
console.log(count > 0 ? `Done — ${count} migration(s) applied.` : 'Nothing to migrate.');
