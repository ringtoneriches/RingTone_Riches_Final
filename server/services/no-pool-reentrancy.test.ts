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

type Fn = { name: string; start: number; end: number; takesTx: boolean; body: string };

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

/** Uses the module-level `db` rather than a passed-in transaction. */
const USES_GLOBAL_DB = /(?<![.\w])db\.(select|insert|update|delete|execute)\b/;

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

  it("getMaxTicketsPerOrder can read through a caller's transaction", () => {
    // The specific fix: the call site inside issuePlayTicketsInner passes tx.
    const fn = fns.find((f) => f.name === "getMaxTicketsPerOrder");
    expect(fn?.body).toMatch(/getMaxTicketsPerOrder\s*\(\s*tx\?\s*:/);
    const inner = fns.find((f) => f.name === "issuePlayTicketsInner");
    expect(inner?.body).toContain("getMaxTicketsPerOrder(tx)");
  });
});
