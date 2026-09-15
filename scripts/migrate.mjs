#!/usr/bin/env node
/**
 * Applies the hand-written SQL migrations in migrations/*.sql, in order, once each.
 *
 * Plain JavaScript on purpose: tsx is a devDependency and is not guaranteed to
 * exist in the deployed image, but `pg` and `dotenv` are production deps.
 *
 * Usage:
 *   node scripts/migrate.mjs               apply anything outstanding
 *   node scripts/migrate.mjs --dry-run     show what would happen, change nothing
 *   node scripts/migrate.mjs --status      list applied/pending and exit
 *   node scripts/migrate.mjs --baseline-to=0012
 *                                          on a first run, record only up to 0012
 *                                          as already-applied and actually run the
 *                                          rest (for a database that is behind)
 *
 * First run against a database that already has tables records every migration as
 * "baselined" WITHOUT executing it, because 0000 creates 55 tables unguarded and
 * would fail instantly against a live database. Later runs apply only new files.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");
// Any constant works; it just has to be the same for every copy of this script.
const ADVISORY_LOCK_KEY = 8274531;

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const STATUS_ONLY = argv.includes("--status");
const baselineArg = argv.find((a) => a.startsWith("--baseline-to="));
const BASELINE_TO = baselineArg ? baselineArg.split("=")[1].trim() : null;

const log = (...a) => console.log("[migrate]", ...a);

function readMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .map((file) => {
      const version = file.split("_")[0];
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      return {
        version,
        file,
        sql,
        checksum: crypto.createHash("sha256").update(sql).digest("hex").slice(0, 16),
        // Escape hatch for statements Postgres refuses to run in a transaction
        // (CREATE INDEX CONCURRENTLY, ALTER TYPE ... ADD VALUE on older servers).
        noTransaction: /^\s*--\s*migrate:no-transaction\s*$/im.test(sql),
      };
    })
    // Zero-padded numeric prefixes, so lexicographic order is numeric order.
    .sort((a, b) => a.version.localeCompare(b.version));
}

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version      text PRIMARY KEY,
      name         text NOT NULL,
      checksum     text NOT NULL,
      applied_at   timestamptz NOT NULL DEFAULT now(),
      execution_ms integer,
      baselined    boolean NOT NULL DEFAULT false
    )
  `);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[migrate] DATABASE_URL is not set");
    process.exit(1);
  }

  const migrations = readMigrations();
  if (migrations.length === 0) {
    log("no migration files found; nothing to do");
    return;
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ...(process.env.NODE_ENV === "production" ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  await client.connect();

  let locked = false;
  try {
    // Serialise concurrent runners (overlapping deploys, multiple replicas).
    await client.query("SELECT pg_advisory_lock($1)", [ADVISORY_LOCK_KEY]);
    locked = true;

    // --dry-run and --status must not write anything at all, so only create the
    // tracking table when we are actually going to record something.
    const tracking = await client.query("SELECT to_regclass('public.schema_migrations') AS t");
    const trackingExists = tracking.rows[0].t !== null;
    if (!trackingExists && !DRY_RUN && !STATUS_ONLY) {
      await ensureTable(client);
    }

    const appliedRows = trackingExists
      ? (await client.query("SELECT version, checksum, baselined FROM schema_migrations")).rows
      : [];
    const applied = new Map(appliedRows.map((r) => [r.version, r]));

    // Warn if a file changed after it was applied. Not fatal: it cannot corrupt
    // anything by itself, and failing a deploy over a whitespace edit is worse.
    for (const m of migrations) {
      const prev = applied.get(m.version);
      if (prev && !prev.baselined && prev.checksum !== m.checksum) {
        log(`WARNING: ${m.file} changed since it was applied (recorded ${prev.checksum}, now ${m.checksum})`);
      }
    }

    const pending = migrations.filter((m) => !applied.has(m.version));

    if (STATUS_ONLY) {
      log(`${applied.size} applied, ${pending.length} pending`);
      for (const m of migrations) {
        const prev = applied.get(m.version);
        log(`  ${prev ? (prev.baselined ? "baselined" : "applied   ") : "PENDING   "}  ${m.file}`);
      }
      return;
    }

    if (pending.length === 0) {
      log(`database is up to date (${applied.size} migrations recorded)`);
      return;
    }

    // A database that already has application tables predates this runner. Its
    // migrations were applied by hand, so record them rather than replay them.
    const isFirstRun = applied.size === 0;
    const existing = await client.query("SELECT to_regclass('public.users') AS t");
    const hasAppTables = existing.rows[0].t !== null;

    if (isFirstRun && hasAppTables) {
      const cutoff = BASELINE_TO || migrations[migrations.length - 1].version;
      const toBaseline = pending.filter((m) => m.version.localeCompare(cutoff) <= 0);
      const toRun = pending.filter((m) => m.version.localeCompare(cutoff) > 0);

      log(`existing database detected (public.users present)`);
      log(`baselining ${toBaseline.length} migration(s) up to ${cutoff} — these will NOT be executed:`);
      for (const m of toBaseline) log(`    ${m.file}`);
      if (toRun.length) {
        log(`and will then APPLY ${toRun.length} migration(s):`);
        for (const m of toRun) log(`    ${m.file}`);
      }

      if (DRY_RUN) {
        log("dry run — nothing written");
        return;
      }

      for (const m of toBaseline) {
        await client.query(
          `INSERT INTO schema_migrations (version, name, checksum, baselined)
           VALUES ($1,$2,$3,true) ON CONFLICT (version) DO NOTHING`,
          [m.version, m.file, m.checksum],
        );
      }
      log(`baselined ${toBaseline.length} migration(s)`);
      await applyAll(client, toRun);
      return;
    }

    log(`${pending.length} migration(s) to apply:`);
    for (const m of pending) log(`    ${m.file}`);
    if (DRY_RUN) {
      log("dry run — nothing written");
      return;
    }
    await applyAll(client, pending);
  } finally {
    if (locked) {
      await client.query("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]).catch(() => {});
    }
    await client.end().catch(() => {});
  }
}

async function applyAll(client, list) {
  for (const m of list) {
    const started = Date.now();
    const useTx = !m.noTransaction;
    try {
      if (useTx) await client.query("BEGIN");
      await client.query(m.sql);
      const ms = Date.now() - started;
      // Recorded inside the same transaction, so a failure rolls back both the
      // schema change and its bookkeeping. No half-applied state.
      await client.query(
        `INSERT INTO schema_migrations (version, name, checksum, execution_ms)
         VALUES ($1,$2,$3,$4)`,
        [m.version, m.file, m.checksum, ms],
      );
      if (useTx) await client.query("COMMIT");
      log(`applied ${m.file} (${ms}ms)`);
    } catch (err) {
      if (useTx) await client.query("ROLLBACK").catch(() => {});
      console.error(`[migrate] FAILED on ${m.file}: ${err.message}`);
      throw err;
    }
  }
  log(`done — ${list.length} migration(s) applied`);
}

main().catch((err) => {
  console.error("[migrate] error:", err.message);
  process.exit(1);
});
