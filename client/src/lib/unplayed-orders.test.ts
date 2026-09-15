import { describe, expect, it } from "vitest";
import { isPlayExpired, playWindowMs, type UnplayedOrder } from "./unplayed-orders";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function order({
  type = "pop",
  createdAgoMs,
  ticketsIssuedAgoMs,
}: {
  type?: string;
  createdAgoMs: number;
  ticketsIssuedAgoMs?: number[];
}): UnplayedOrder {
  const now = Date.now();
  return {
    competitions: { type },
    orders: {
      id: "o1",
      competitionId: "c1",
      quantity: 4,
      status: "completed",
      createdAt: new Date(now - createdAgoMs).toISOString(),
    },
    tickets: ticketsIssuedAgoMs?.map((ago) => ({
      createdAt: new Date(now - ago).toISOString(),
    })),
    remainingPlays: 4,
  };
}

describe("play window", () => {
  it("measures the window from when tickets were issued, not when the order row was created", () => {
    // The order row is created at checkout, before payment. A customer who sat on
    // the card page must not lose that time from their window.
    const o = order({ createdAgoMs: 90 * MINUTE, ticketsIssuedAgoMs: [5 * MINUTE] });

    expect(isPlayExpired(o)).toBe(false);
    // ~1h55m left, measured from the ticket, not the 90-minute-old order row.
    expect(playWindowMs(o)).toBeGreaterThan(110 * MINUTE);
  });

  it("does not resurrect a genuinely expired order", () => {
    const o = order({ createdAgoMs: 4 * HOUR, ticketsIssuedAgoMs: [3 * HOUR] });
    expect(isPlayExpired(o)).toBe(true);
  });

  it("uses the earliest ticket when an order has several", () => {
    const o = order({
      createdAgoMs: 3 * HOUR,
      ticketsIssuedAgoMs: [30 * MINUTE, 150 * MINUTE, 60 * MINUTE],
    });
    // Earliest ticket is 150m ago, which is past the 2h window.
    expect(isPlayExpired(o)).toBe(true);
  });

  it("falls back to the order date when there are no tickets", () => {
    expect(isPlayExpired(order({ createdAgoMs: 3 * HOUR, ticketsIssuedAgoMs: [] }))).toBe(true);
    expect(isPlayExpired(order({ createdAgoMs: 30 * MINUTE }))).toBe(false);
  });

  it("never expires game types that have no play window", () => {
    for (const type of ["slot", "royal", "instant"]) {
      const o = order({ type, createdAgoMs: 30 * 24 * HOUR, ticketsIssuedAgoMs: [30 * 24 * HOUR] });
      expect(isPlayExpired(o)).toBe(false);
    }
  });

  it("accepts Date objects as well as strings", () => {
    // Drizzle returns Date objects; the API serialises them to strings.
    const o = order({ createdAgoMs: 5 * HOUR });
    o.tickets = [{ createdAt: new Date(Date.now() - 10 * MINUTE) }];
    expect(isPlayExpired(o)).toBe(false);
  });

  it("is not tripped up by a malformed ticket timestamp", () => {
    const o = order({ createdAgoMs: 10 * MINUTE });
    o.tickets = [{ createdAt: "not-a-date" }, { createdAt: null }];
    // Ignores the junk and falls back to the order date rather than expiring.
    expect(isPlayExpired(o)).toBe(false);
  });
});
