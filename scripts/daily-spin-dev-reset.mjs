#!/usr/bin/env node
/**
 * LOCAL DEV ONLY. Gets the Free Daily Spin back into a spinnable state:
 *
 *   - makes sure an active prize pool exists (creates one if not)
 *   - turns the wheel on
 *   - clears today's spin so you can spin again
 *
 * Usage:
 *   node scripts/daily-spin-dev-reset.mjs                 clear everyone's spin for today
 *   node scripts/daily-spin-dev-reset.mjs me@example.com  clear just that member's
 *
 * Refuses to run against anything other than a local database — clearing spins
 * on production would hand out free points, so the guard is deliberate.
 */
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const host = (() => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
})();

if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error(`Refusing to run: DATABASE_URL points at "${host}", not a local database.`);
  console.error("This script clears spins and would give away free points on a real environment.");
  process.exit(1);
}

// Clockwise from the top, matching the wheel artwork. Keep in step with
// DEFAULT_PRIZE_TIERS in server/services/daily-spin-pool.ts.
const TIERS = [
  [10, 2000],
  [500, 5],
  [25, 1500],
  [150, 70],
  [75, 400],
  [100, 200],
  [50, 800],
  [250, 25],
];

const email = process.argv[2];

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  // 1. An active pool with prizes left.
  let [cycle] = (
    await client.query(
      `SELECT c.id, c.status,
              COALESCE((SELECT SUM(p.remaining) FROM daily_spin_prizes p WHERE p.cycle_id = c.id), 0)::int AS remaining
       FROM daily_spin_cycles c
       WHERE c.status IN ('active','paused','draft')
       ORDER BY c.created_at DESC LIMIT 1`,
    )
  ).rows;

  if (!cycle || cycle.remaining <= 0) {
    const { rows } = await client.query(
      `INSERT INTO daily_spin_cycles (name, status, activated_at)
       VALUES ($1, 'active', now()) RETURNING id`,
      [`Dev pool ${new Date().toISOString().slice(0, 10)}`],
    );
    cycle = { id: rows[0].id };
    for (let i = 0; i < TIERS.length; i++) {
      await client.query(
        `INSERT INTO daily_spin_prizes (cycle_id, points_value, quantity, remaining, segment_index)
         VALUES ($1,$2,$3,$3,$4)`,
        [cycle.id, TIERS[i][0], TIERS[i][1], i],
      );
    }
    console.log("created a fresh pool (5,000 spins) and activated it");
  } else {
    await client.query(
      `UPDATE daily_spin_cycles SET status='active', activated_at=COALESCE(activated_at, now()), updated_at=now()
       WHERE id=$1`,
      [cycle.id],
    );
    console.log(`reused the existing pool (${cycle.remaining.toLocaleString()} spins left) and set it active`);
  }

  // 2. Wheel visible.
  await client.query(
    `INSERT INTO platform_settings (id, daily_spin_enabled) VALUES ('active', true)
     ON CONFLICT (id) DO UPDATE SET daily_spin_enabled = true, updated_at = now()`,
  );
  console.log("wheel turned on");

  // 3. Free up today's spin. The unique index on (user_id, spin_date) is what
  //    blocks a second spin, so removing the row is all that is needed.
  const cleared = email
    ? await client.query(
        `DELETE FROM daily_spin_results
         WHERE user_id IN (SELECT id FROM users WHERE email = $1)`,
        [email],
      )
    : await client.query("DELETE FROM daily_spin_results");

  console.log(
    email
      ? `cleared ${cleared.rowCount} spin(s) for ${email}`
      : `cleared ${cleared.rowCount} spin(s) for all members`,
  );
  console.log("\nReload /daily-spin and you can spin again.");
} catch (err) {
  console.error("reset failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
