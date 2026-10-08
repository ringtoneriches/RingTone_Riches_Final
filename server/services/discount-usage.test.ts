import { describe, it, expect } from "vitest";
import {
  classifyUsage,
  summariseUsages,
  canApplyCode,
  refusalMessage,
  RESERVATION_HOLD_MINUTES,
  type UsageRow,
} from "./discount-usage";

const NOW = new Date("2026-09-28T12:00:00Z");

function minutesAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 60000);
}

function row(over: Partial<UsageRow> = {}): UsageRow {
  return {
    userId: "u1",
    orderId: "o1",
    usedAt: minutesAgo(1),
    orderStatus: "pending",
    ...over,
  };
}

describe("classifyUsage", () => {
  it("counts a paid order as a real use", () => {
    expect(classifyUsage(row({ orderStatus: "completed" }), NOW)).toBe("confirmed");
  });

  it("counts a paid order as used however old it is", () => {
    const old = row({ orderStatus: "completed", usedAt: minutesAgo(60 * 24 * 365) });
    expect(classifyUsage(old, NOW)).toBe("confirmed");
  });

  it("holds the code while a checkout is still fresh", () => {
    expect(classifyUsage(row({ usedAt: minutesAgo(5) }), NOW)).toBe("reserved");
  });

  it("hands the code back once the checkout goes stale", () => {
    const stale = row({ usedAt: minutesAgo(RESERVATION_HOLD_MINUTES + 1) });
    expect(classifyUsage(stale, NOW)).toBe("released");
  });

  it("treats the hold window as exclusive at its edge", () => {
    const exactly = row({ usedAt: minutesAgo(RESERVATION_HOLD_MINUTES) });
    expect(classifyUsage(exactly, NOW)).toBe("released");
  });

  it("hands the code back when the payment failed", () => {
    expect(classifyUsage(row({ orderStatus: "failed" }), NOW)).toBe("released");
  });

  it("hands the code back when the order expired", () => {
    expect(classifyUsage(row({ orderStatus: "expired" }), NOW)).toBe("released");
  });

  it("hands the code back when the order is gone", () => {
    expect(classifyUsage(row({ orderStatus: null }), NOW)).toBe("released");
  });

  it("keeps a legacy row with no order counted, rather than guessing", () => {
    const legacy = row({ orderId: null, orderStatus: null, usedAt: minutesAgo(9999) });
    expect(classifyUsage(legacy, NOW)).toBe("confirmed");
  });

  it("does not hold a pending order with no timestamp", () => {
    expect(classifyUsage(row({ usedAt: null }), NOW)).toBe("released");
  });

  it("ignores an unparseable timestamp rather than throwing", () => {
    expect(classifyUsage(row({ usedAt: "not a date" }), NOW)).toBe("released");
  });

  it("accepts a timestamp that arrived as a string", () => {
    const asString = row({ usedAt: minutesAgo(2).toISOString() });
    expect(classifyUsage(asString, NOW)).toBe("reserved");
  });
});

describe("summariseUsages", () => {
  it("separates what was paid for from what is merely held", () => {
    const rows = [
      row({ userId: "a", orderStatus: "completed" }),
      row({ userId: "b", orderStatus: "completed" }),
      row({ userId: "c", usedAt: minutesAgo(2) }),
      row({ userId: "d", usedAt: minutesAgo(90) }),
      row({ userId: "e", orderStatus: "failed" }),
    ];
    expect(summariseUsages(rows, NOW)).toEqual({ confirmed: 2, reserved: 1 });
  });

  it("is zero for a code nobody has touched", () => {
    expect(summariseUsages([], NOW)).toEqual({ confirmed: 0, reserved: 0 });
  });

  it("reproduces the bug the owner reported: four applied, one paid", () => {
    const rows = [
      row({ userId: "ellie", orderStatus: "completed" }),
      row({ userId: "b", usedAt: minutesAgo(200) }),
      row({ userId: "c", usedAt: minutesAgo(300) }),
      row({ userId: "d", usedAt: minutesAgo(400) }),
    ];
    expect(summariseUsages(rows, NOW).confirmed).toBe(1);
  });
});

describe("canApplyCode", () => {
  it("lets a new person use a code with room left", () => {
    const decision = canApplyCode({ userId: "new", maxUses: 5, rows: [], now: NOW });
    expect(decision.ok).toBe(true);
  });

  it("refuses someone who already paid with it", () => {
    const rows = [row({ userId: "u1", orderStatus: "completed" })];
    const decision = canApplyCode({ userId: "u1", maxUses: 5, rows, now: NOW });
    expect(decision).toMatchObject({ ok: false, reason: "already_used" });
  });

  it("refuses someone holding it on another unpaid order", () => {
    const rows = [row({ userId: "u1", usedAt: minutesAgo(3) })];
    const decision = canApplyCode({ userId: "u1", maxUses: 5, rows, now: NOW });
    expect(decision).toMatchObject({ ok: false, reason: "already_applied" });
  });

  it("lets someone try again after they abandoned a checkout", () => {
    const rows = [row({ userId: "u1", usedAt: minutesAgo(120) })];
    expect(canApplyCode({ userId: "u1", maxUses: 5, rows, now: NOW }).ok).toBe(true);
  });

  it("lets someone try again after their card was declined", () => {
    const rows = [row({ userId: "u1", orderStatus: "failed" })];
    expect(canApplyCode({ userId: "u1", maxUses: 5, rows, now: NOW }).ok).toBe(true);
  });

  it("refuses once the paid uses reach the limit", () => {
    const rows = [
      row({ userId: "a", orderStatus: "completed" }),
      row({ userId: "b", orderStatus: "completed" }),
    ];
    const decision = canApplyCode({ userId: "new", maxUses: 2, rows, now: NOW });
    expect(decision).toMatchObject({ ok: false, reason: "limit_reached" });
  });

  it("stops the last use being taken by two people at once", () => {
    const rows = [row({ userId: "first", usedAt: minutesAgo(1) })];
    const decision = canApplyCode({ userId: "second", maxUses: 1, rows, now: NOW });
    expect(decision).toMatchObject({ ok: false, reason: "limit_reached" });
  });

  it("frees the limit again when the holder walks away", () => {
    const rows = [row({ userId: "first", usedAt: minutesAgo(31) })];
    expect(canApplyCode({ userId: "second", maxUses: 1, rows, now: NOW }).ok).toBe(true);
  });

  it("does not let abandoned checkouts exhaust a code", () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      row({ userId: `ghost${i}`, usedAt: minutesAgo(60 + i) }),
    );
    expect(canApplyCode({ userId: "real", maxUses: 4, rows, now: NOW }).ok).toBe(true);
  });

  it("treats a null limit as unlimited", () => {
    const rows = Array.from({ length: 50 }, (_, i) =>
      row({ userId: `p${i}`, orderStatus: "completed" }),
    );
    expect(canApplyCode({ userId: "new", maxUses: null, rows, now: NOW }).ok).toBe(true);
  });

  it("reports the counts alongside the refusal", () => {
    const rows = [
      row({ userId: "a", orderStatus: "completed" }),
      row({ userId: "b", usedAt: minutesAgo(1) }),
    ];
    const decision = canApplyCode({ userId: "new", maxUses: 2, rows, now: NOW });
    expect(decision.summary).toEqual({ confirmed: 1, reserved: 1 });
  });

  it("honours a custom hold window", () => {
    const rows = [row({ userId: "first", usedAt: minutesAgo(10) })];
    const tight = canApplyCode({ userId: "second", maxUses: 1, rows, now: NOW, holdMinutes: 5 });
    expect(tight.ok).toBe(true);
  });
});

describe("codes that belong to one person", () => {
  it("lets the owner use their own prize code", () => {
    const d = canApplyCode({ userId: "winner", maxUses: 1, rows: [], now: NOW, assignedUserId: "winner" });
    expect(d.ok).toBe(true);
  });

  it("refuses anyone else, even with uses left", () => {
    const d = canApplyCode({ userId: "someone-else", maxUses: 1, rows: [], now: NOW, assignedUserId: "winner" });
    expect(d).toMatchObject({ ok: false, reason: "not_yours" });
  });

  it("leaves shared codes alone", () => {
    for (const assigned of [null, undefined]) {
      const d = canApplyCode({ userId: "anyone", maxUses: 5, rows: [], now: NOW, assignedUserId: assigned });
      expect(d.ok).toBe(true);
    }
  });

  it("checks ownership before the usage limit, so a shared screenshot cannot even reserve it", () => {
    const rows = [row({ userId: "winner", usedAt: minutesAgo(1) })];
    const d = canApplyCode({ userId: "thief", maxUses: 1, rows, now: NOW, assignedUserId: "winner" });
    expect(d.reason).toBe("not_yours");
  });
});

describe("refusalMessage", () => {
  it("has wording for every refusal", () => {
    for (const reason of ["already_used", "already_applied", "limit_reached", "not_yours"] as const) {
      expect(refusalMessage(reason).length).toBeGreaterThan(0);
    }
  });

  it("does not tell someone they used a code when they only applied it", () => {
    expect(refusalMessage("already_applied")).not.toMatch(/already used/i);
  });
});

/**
 * The boundary the checkout's hand-off depends on.
 *
 * /api/checkout/apply-discount treats exactly one refusal -- "already_applied"
 * -- as permission to take the code off the person's own unpaid order and put
 * it on the one they are looking at now. Without that, winning a prize and
 * then rebuilding your basket locks you out of it for the length of the hold,
 * which is how the first 50% winner came to pay full price with her prize
 * still unspent.
 *
 * Everything below pins the cases that must NOT be read that way. If a paid
 * order ever started reporting "already_applied", the checkout would hand back
 * a code that had already been spent.
 */
describe("the hand-off boundary at checkout", () => {
  const me = "user-1";
  const them = "user-2";
  const now = new Date("2026-10-08T12:00:00Z");
  const minsAgo = (n: number) => new Date(now.getTime() - n * 60_000);

  it("says already_applied for my own unpaid order, which is safe to hand off", () => {
    const d = canApplyCode({
      userId: me,
      maxUses: 1,
      rows: [{ userId: me, orderId: "order-a", usedAt: minsAgo(2), orderStatus: "pending" }],
      now,
    });
    expect(d.ok).toBe(false);
    expect(d.reason).toBe("already_applied");
  });

  it("says already_used for my own PAID order, which must never be handed off", () => {
    const d = canApplyCode({
      userId: me,
      maxUses: 1,
      rows: [{ userId: me, orderId: "order-a", usedAt: minsAgo(2), orderStatus: "completed" }],
      now,
    });
    expect(d.ok).toBe(false);
    expect(d.reason).toBe("already_used");
  });

  it("never says already_applied because of somebody else's checkout", () => {
    // Would otherwise let one person strip another's reservation.
    const d = canApplyCode({
      userId: me,
      maxUses: 1,
      rows: [{ userId: them, orderId: "order-b", usedAt: minsAgo(2), orderStatus: "pending" }],
      now,
    });
    expect(d.reason).not.toBe("already_applied");
  });

  it("refuses a prize that belongs to someone else before anything else", () => {
    const d = canApplyCode({
      userId: me,
      maxUses: 1,
      rows: [{ userId: them, orderId: "order-b", usedAt: minsAgo(2), orderStatus: "pending" }],
      now,
      assignedUserId: them,
    });
    expect(d.reason).toBe("not_yours");
  });

  it("lets my own stale order go without needing the hand-off at all", () => {
    // Past the hold, the existing release already frees it.
    const d = canApplyCode({
      userId: me,
      maxUses: 1,
      rows: [{ userId: me, orderId: "order-a", usedAt: minsAgo(45), orderStatus: "pending" }],
      now,
    });
    expect(d.ok).toBe(true);
  });
});
