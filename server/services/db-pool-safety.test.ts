import { describe, expect, it } from "vitest";
import { POOL_SAFETY, describePool, poolIsSaturated } from "./db-pool-safety";

describe("POOL_SAFETY", () => {
  // The outage was caused by these being unset, so node-postgres' defaults
  // applied: max 10, and an unlimited wait for a connection.
  it("raises the ceiling above the default of 10 that was hit", () => {
    expect(POOL_SAFETY.max).toBeGreaterThan(10);
  });

  it("never waits for ever for a connection", () => {
    // This is the setting that turns a site-wide hang into a failed request.
    expect(POOL_SAFETY.connectionTimeoutMillis).toBeGreaterThan(0);
    expect(POOL_SAFETY.connectionTimeoutMillis).toBeLessThanOrEqual(30_000);
  });

  it("lets Postgres end a transaction left open with nothing running", () => {
    // The stuck transactions showed as `idle in transaction` / ClientRead,
    // holding locks while the app waited on something else.
    expect(POOL_SAFETY.idleInTransactionTimeoutMs).toBeGreaterThan(0);
  });

  it("keeps the query cutoff generous, since it is a backstop not a budget", () => {
    // Some admin reporting reads are legitimately slow; this must not cut them.
    expect(POOL_SAFETY.statementTimeoutMs).toBeGreaterThanOrEqual(30_000);
  });

  it("gives up on a connection long before Postgres gives up on a query", () => {
    // Otherwise a saturated pool would stack requests behind a slow query
    // instead of failing them.
    expect(POOL_SAFETY.connectionTimeoutMillis).toBeLessThan(POOL_SAFETY.statementTimeoutMs);
  });
});

describe("poolIsSaturated", () => {
  it("spots the shape the pool was in during the outage", () => {
    // Every connection taken, none idle, requests queued behind them.
    expect(poolIsSaturated({ total: 20, idle: 0, waiting: 6 })).toBe(true);
  });

  it("is quiet when the pool is merely busy", () => {
    expect(poolIsSaturated({ total: 20, idle: 0, waiting: 0 })).toBe(false);
    expect(poolIsSaturated({ total: 20, idle: 3, waiting: 2 })).toBe(false);
    expect(poolIsSaturated({ total: 5, idle: 5, waiting: 0 })).toBe(false);
  });

  it("is quiet on an idle site", () => {
    expect(poolIsSaturated({ total: 0, idle: 0, waiting: 0 })).toBe(false);
  });

  it("honours a custom ceiling", () => {
    expect(poolIsSaturated({ total: 10, idle: 0, waiting: 4 }, 10)).toBe(true);
    expect(poolIsSaturated({ total: 10, idle: 0, waiting: 4 }, 20)).toBe(false);
  });
});

describe("describePool", () => {
  it("says plainly when the pool is in trouble", () => {
    expect(describePool({ total: 20, idle: 0, waiting: 6 })).toContain("SATURATED");
  });

  it("reports the numbers someone would need at 2am", () => {
    const line = describePool({ total: 7, idle: 4, waiting: 0 });
    expect(line).toContain("ok");
    expect(line).toContain("7/20");
    expect(line).toContain("4 idle");
    expect(line).toContain("0 waiting");
  });
});
