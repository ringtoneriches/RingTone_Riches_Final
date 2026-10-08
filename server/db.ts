import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import { POOL_SAFETY } from "./services/db-pool-safety";

dotenv.config();

console.log("Database connection configured");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

/**
 * The connection pool.
 *
 * Every setting below exists to stop one stuck operation taking the whole site
 * down, which is what happened on 6 October 2026. The pool had no limits at
 * all, so it took node-postgres' defaults: ten connections, and an infinite
 * wait when they are all busy.
 *
 * A single piece of code asked the pool for a second connection while already
 * holding one inside a transaction. Ten of those at once emptied the pool, and
 * every one of them then waited forever for a connection that only they could
 * release. The site stayed up and answered anything that did not need the
 * database -- which is why it looked alive while every real page hung -- until
 * someone restarted it.
 *
 * None of these settings fix that bug; `getMaxTicketsPerOrder` does. They make
 * the next one of its kind survivable: a request fails in seconds with a real
 * error instead of hanging silently, and a transaction left open is cut loose
 * rather than holding its locks indefinitely.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // More room than the default ten, so ordinary bursts never queue.
  max: POOL_SAFETY.max,

  // The important one. Without it a request that cannot get a connection waits
  // for ever and takes its transaction with it. Now it throws, the request
  // 500s, and the connection it was holding goes back to the pool.
  connectionTimeoutMillis: POOL_SAFETY.connectionTimeoutMillis,
  idleTimeoutMillis: POOL_SAFETY.idleTimeoutMillis,

  // Server-side backstops, enforced by Postgres rather than by us.
  //   statement_timeout cuts off a runaway query.
  //   idle_in_transaction_session_timeout is the one that matches the outage:
  //   a transaction open with no query running, holding its locks while the
  //   application waits on something else. Postgres ends it instead.
  // Migrations are unaffected: scripts/migrate.mjs opens its own pg.Client.
  statement_timeout: POOL_SAFETY.statementTimeoutMs,
  idle_in_transaction_session_timeout: POOL_SAFETY.idleInTransactionTimeoutMs,

  ...(isProduction
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {}),
});

/**
 * An idle client erroring must never take the process down.
 *
 * node-postgres emits 'error' on the pool when a pooled connection dies while
 * nobody is using it -- a database restart, a dropped network link. With no
 * listener that is an unhandled 'error' event, which ends the process.
 */
pool.on("error", (err) => {
  console.error("[db] idle client error (connection will be replaced):", err.message);
});

/**
 * The same protection for a client that is CHECKED OUT.
 *
 * pool.on("error") only covers clients sitting idle in the pool. A client being
 * used emits its errors on itself, and when there is no query in flight to
 * reject -- a transaction that is open but running nothing -- the event has
 * nowhere to go. Node ends the process on an unhandled "error" event.
 *
 * That is not hypothetical. On 8 October a settlement on staging left a
 * transaction idle past idle_in_transaction_session_timeout; Postgres closed
 * the connection with a FATAL, the event was unhandled, and the container
 * restarted mid-purchase. The order rolled back and was retried twice, so the
 * customer waited two and a half minutes and got three confirmation emails for
 * one order.
 *
 * The timeouts above are deliberate and stay: a transaction nobody is driving
 * should be cut loose. What must not happen is the whole process going with
 * it. Every connection gets a listener as it is created, so the error is
 * logged and the pool quietly replaces the connection.
 */
pool.on("connect", (client) => {
  client.on("error", (err: Error) => {
    console.error("[db] client error (connection will be replaced):", err.message);
  });
});

export const db = drizzle(pool, { schema });

/** Exposed for the health check, so pool exhaustion is visible before it bites. */
export function poolStats() {
  return { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount };
}
