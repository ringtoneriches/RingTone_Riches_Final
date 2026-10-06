/**
 * The connection-pool limits, kept apart from server/db.ts so they can be
 * tested: db.ts opens a real connection the moment it is imported.
 *
 * On 6 October 2026 the site stopped serving anything that needed the database
 * while continuing to answer everything that did not. It was not a crash --
 * memory and CPU were almost idle. The pool had no settings, so it used
 * node-postgres' defaults: ten connections, and an unlimited wait for one.
 *
 * Code inside a transaction asked the pool for a second connection. Ten of
 * those at once took every connection, and each then waited for an eleventh
 * that only it could free. Nothing timed out because nothing was configured
 * to. A restart cleared it in under two seconds.
 */
export const POOL_SAFETY = {
  /** Connections per instance. The default of 10 was the ceiling we hit. */
  max: 20,

  /**
   * How long a request waits for a connection before giving up.
   *
   * This is the setting that turns a site-wide hang into a handful of failed
   * requests. Long enough to ride out a normal burst, short enough that a
   * customer sees an error rather than a page that never loads.
   */
  connectionTimeoutMillis: 10_000,

  /** Return idle connections to the database rather than holding them open. */
  idleTimeoutMillis: 30_000,

  /**
   * Postgres-side cutoff for a single query.
   *
   * Deliberately generous: this is a backstop against a runaway query, not a
   * performance budget, and some admin reporting reads are legitimately slow.
   */
  statementTimeoutMs: 60_000,

  /**
   * Postgres-side cutoff for a transaction that is open but running nothing.
   *
   * This is the one that matches the outage. The stuck transactions showed up
   * in pg_stat_activity as `idle in transaction` / `ClientRead`: open, holding
   * their locks, with the application waiting on something that was never
   * going to arrive. Postgres now ends them instead of waiting with us.
   */
  idleInTransactionTimeoutMs: 60_000,
} as const;

export type PoolSnapshot = { total: number; idle: number; waiting: number };

/**
 * Whether the pool is in the state that preceded the outage.
 *
 * `waiting` is the number of requests queued for a connection. Healthy traffic
 * returns connections fast enough that this stays at zero; a sustained queue
 * means something is holding connections and not giving them back, which is
 * exactly what nobody could see on the night.
 */
export function poolIsSaturated(snapshot: PoolSnapshot, max: number = POOL_SAFETY.max): boolean {
  return snapshot.waiting > 0 && snapshot.idle === 0 && snapshot.total >= max;
}

/** One line for the health endpoint and the logs. */
export function describePool(snapshot: PoolSnapshot, max: number = POOL_SAFETY.max): string {
  const state = poolIsSaturated(snapshot, max) ? "SATURATED" : "ok";
  return `pool ${state}: ${snapshot.total}/${max} open, ${snapshot.idle} idle, ${snapshot.waiting} waiting`;
}
