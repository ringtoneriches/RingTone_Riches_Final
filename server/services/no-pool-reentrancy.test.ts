import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Guards against the bug that took the site down on 6 October 2026.
 *
 * A function that already holds a transaction must not call a helper that
 * reads through the global `db`, because that asks the connection pool for a
 * *second* connection while holding one. Enough of those at once and every
 * connection is held by something waiting for a connection, which only they
 * can release. Nothing errors; the site simply stops reaching the database.
 *
 * It took a restart to clear, and from the outside it looked like a crash.
 *
 * This is a source scan rather than a runtime test because the failure needs
 * real concurrency against a real pool to reproduce, and by then it is live.
 * The shape is easy to see in the source, so it is checked there.
 */

const FILE = join(process.cwd(), "server/services/instant-win-pool.ts");

/**
 * Files that run inside a caller's transaction and must not reach for a second
 * connection while it is open.
 *
 * cart-card-payment.ts was not listed here until it caused the thing this file
 * exists to prevent: it took the caller's transaction, then looked the user up
 * through the global `db` to address a confirmation email. On 8 October that
 * left the settlement transaction idle for sixty seconds until Postgres closed
 * it, and the request died at 60,430ms with the customer still watching
 * "Confirming your payment".
 */
const TX_AWARE_FILES = [
  "server/services/instant-win-pool.ts",
  "server/cart-card-payment.ts",
];

type Fn = { name: string; start: number; end: number; takesTx: boolean; body: string };

/** Line index for a character offset, so a match can be attributed to a function. */
function lineOf(src: string, index: number): number {
  return src.slice(0, index).split("\n").length - 1;
}

function parseFunctions(src: string): Fn[] {
  const lines = src.split("\n");
  const re = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/;
  const found: { name: string; start: number; takesTx: boolean }[] = [];
  lines.forEach((line, i) => {
    const m = re.exec(line);
    if (m) found.push({ name: m[1], start: i, takesTx: /\btx\b/.test(m[2]) });
  });
  return found.map((f, i) => {
    const end = i + 1 < found.length ? found[i + 1].start : lines.length;
    return { ...f, end, body: lines.slice(f.start, end).join("\n") };
  });
}

/**
 * Uses the module-level `db` rather than a passed-in transaction.
 *
 * The whitespace matters. Drizzle calls are usually written broken over lines
 * -- `db\n  .select()` -- and an earlier version of this pattern required
 * `db.select` to be adjacent, so it silently skipped most of the file.
 * evaluateAutoActivation was one of the functions it missed, which is how the
 * deferred-call bug reached production.
 */
const USES_GLOBAL_DB = /(?<![.\w])db\s*\.\s*(select|insert|update|delete|execute|transaction|query)\b/;

describe("no connection-pool reentrancy", () => {
  const fns = parseFunctions(readFileSync(FILE, "utf8"));

  it("finds the functions to check", () => {
    // If the parse breaks, the test below would pass vacuously.
    expect(fns.length).toBeGreaterThan(20);
    expect(fns.some((f) => f.name === "getMaxTicketsPerOrder")).toBe(true);
    expect(fns.some((f) => f.takesTx)).toBe(true);
  });

  it("no transaction-holding function calls a helper that opens its own connection", () => {
    // Helpers that grab a connection of their own.
    const selfConnecting = fns
      .filter((f) => USES_GLOBAL_DB.test(f.body))
      .map((f) => f.name);

    const offences: string[] = [];
    for (const caller of fns.filter((f) => f.takesTx)) {
      for (const callee of selfConnecting) {
        if (callee === caller.name) continue;
        // A call to the helper that does not pass a transaction through.
        const call = new RegExp(`(?<![.\\w])${callee}\\s*\\(\\s*\\)`);
        if (call.test(caller.body)) {
          offences.push(`${caller.name}(tx, ...) calls ${callee}() without passing tx`);
        }
      }
    }

    expect(offences).toEqual([]);
  });

  /**
   * The shape this test missed the first time.
   *
   * The rule above looks for a direct call. Deferring the same call does not
   * make it safe: setImmediate runs on the next tick, and when the caller
   * passed its own transaction in, that transaction is still open on the next
   * tick. issuePlayTickets did exactly this with evaluateAutoActivation, and
   * on 8 October a settlement left a transaction idle past
   * idle_in_transaction_session_timeout, Postgres closed the connection, and
   * the container restarted mid-purchase.
   */
  /**
   * The shape this file missed the first time.
   *
   * The rule above looks for a direct call. Deferring the same call does not
   * make it safe: setImmediate runs on the next tick, and when the caller
   * passed its own transaction in, that transaction is still open then.
   * issuePlayTickets did exactly this with evaluateAutoActivation, and on
   * 8 October a settlement left a transaction idle past
   * idle_in_transaction_session_timeout. Postgres closed the connection and
   * the container restarted mid-purchase: one order, three confirmation
   * emails, two and a half minutes on "Confirming your payment".
   *
   * Deferring is allowed only from the named helpers, which exist to be called
   * after a commit.
   */
  it("does not defer a self-connecting helper from transaction-holding code", () => {
    const src = readFileSync(FILE, "utf8");
    const selfConnecting = new Set(
      fns.filter((f) => USES_GLOBAL_DB.test(f.body)).map((f) => f.name),
    );
    const SCHEDULERS = ["scheduleAutoActivation", "runAutoActivationAfterCommit"];

    const offences: string[] = [];
    const defer = /(setImmediate|setTimeout|queueMicrotask)\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = defer.exec(src))) {
      const window = src.slice(m.index, m.index + 300);
      for (const name of selfConnecting) {
        if (!window.includes(`${name}(`)) continue;
        const owner = fns.filter((f) => f.start <= lineOf(src, m!.index)).pop();
        if (owner && SCHEDULERS.includes(owner.name)) continue;
        offences.push(`${name}() deferred from ${owner?.name ?? "top level"}`);
      }
    }

    expect(offences).toEqual([]);
  });

  it("only starts auto-activation when it owns the transaction", () => {
    // When the caller passes tx, the flag goes back to them instead.
    const fn = fns.find((f) => f.name === "issuePlayTickets");
    expect(fn?.body).toMatch(/needsAutoActivation\s*&&\s*!opts\.tx/);
    expect(fn?.body).toContain("needsAutoActivation");
  });

  /**
   * cart-card-payment.ts, which is where this went wrong on 8 October.
   *
   * fulfillCartCardPayment accepts the caller's transaction. It then looked
   * the user up through the global `db` to address a confirmation email --
   * a second connection asked for from inside the first. The settlement
   * transaction sat idle for sixty seconds until Postgres closed it, and the
   * request died at 60,430ms with the customer watching "Confirming your
   * payment".
   *
   * A broad scan of the file was tried first and flagged every ordinary
   * db.transaction() call, so this checks the two specific things instead.
   */
  const CART = readFileSync(join(process.cwd(), "server/cart-card-payment.ts"), "utf8");

  /** Just fulfillCartCardPayment: the route handlers below it hold no caller tx. */
  const FULFIL = CART.slice(
    CART.indexOf("export async function fulfillCartCardPayment"),
    CART.indexOf("export function registerCartCardPaymentRoutes"),
  );

  it("reads the email address through the caller's transaction", () => {
    expect(FULFIL).toMatch(/const runner = opts\.tx \?\? db;/);
    expect(FULFIL).toContain("runner.select().from(users)");
    // The form that caused it.
    expect(FULFIL).not.toMatch(/const \[user\] = await db\.select\(\)\.from\(users\)/);
  });

  it("only starts auto-activation when it opened the transaction itself", () => {
    // Awaiting run(opts.tx) does not commit the caller's transaction, so
    // deferring the work to the next tick still lands inside it.
    expect(CART).toMatch(/if \(!opts\.tx\) runAutoActivationAfterCommit/);
  });

  /**
   * Every helper the card-settlement transaction awaits must be able to run
   * inside it.
   *
   * creditCardCashback opened a transaction of its own unconditionally. Cart
   * settlement awaits it while holding the caller's transaction, so a second
   * connection was taken from inside the first, and it then went for a row the
   * first was holding. The settlement sat idle until Postgres closed it sixty
   * seconds later: "Confirming your payment" for a full minute, a 500, and a
   * duplicate confirmation email when the retry finally worked.
   */
  it("every helper in the settlement path can take a caller's transaction", () => {
    const SETTLEMENT_HELPERS = [
      ["server/services/card-cashback.ts", "creditCardCashback"],
      ["server/cart-card-payment.ts", "fulfillCartCardPayment"],
      ["server/services/instant-win-pool.ts", "issuePlayTickets"],
    ] as const;

    const offences: string[] = [];
    for (const [rel, name] of SETTLEMENT_HELPERS) {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      const from = src.indexOf(`export async function ${name}`);
      expect(from, `${name} not found in ${rel}`).toBeGreaterThan(-1);
      // To the next top-level export, not a fixed window: fulfillCartCardPayment
      // is long enough that a window truncated the part that matters.
      const after = src.slice(from + 10).search(/\nexport (async )?function /);
      const body = after === -1 ? src.slice(from) : src.slice(from, from + 10 + after);
      // It must honour a transaction it is handed...
      if (!/opts\.tx/.test(body)) offences.push(`${name} ignores opts.tx`);
      // ...and must not open one regardless of being given one.
      const opens = /(?<![.\w])db\s*\.\s*transaction\s*\(/.test(body);
      const conditional = /opts\.tx\s*\?|if \(opts\.tx\)/.test(body);
      if (opens && !conditional) offences.push(`${name} always opens its own transaction`);
    }
    expect(offences).toEqual([]);
  });

  it("getMaxTicketsPerOrder can read through a caller's transaction", () => {
    // The specific fix: the call site inside issuePlayTicketsInner passes tx.
    const fn = fns.find((f) => f.name === "getMaxTicketsPerOrder");
    expect(fn?.body).toMatch(/getMaxTicketsPerOrder\s*\(\s*tx\?\s*:/);
    const inner = fns.find((f) => f.name === "issuePlayTicketsInner");
    expect(inner?.body).toContain("getMaxTicketsPerOrder(tx)");
  });
});
