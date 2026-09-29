import { describe, it, expect } from "vitest";
import {
  cashSpend,
  isInstantWinType,
  buildUserFinancials,
  INSTANT_WIN_TYPES,
  POINTS_PER_POUND,
} from "./user-spend";

describe("isInstantWinType", () => {
  it("counts every game as an instant win", () => {
    for (const t of INSTANT_WIN_TYPES) expect(isInstantWinType(t)).toBe(true);
  });

  it("does not count the ticketed prize competition", () => {
    // `instant` is the "win a £100 voucher" draw, bought through /checkout.
    expect(isInstantWinType("instant")).toBe(false);
  });

  it("handles a missing or unknown type", () => {
    expect(isInstantWinType(null)).toBe(false);
    expect(isInstantWinType(undefined)).toBe(false);
    expect(isInstantWinType("bingo")).toBe(false);
  });
});

describe("cashSpend", () => {
  it("is the whole order when no points were used", () => {
    expect(cashSpend({ totalValue: "10.00", pointsValue: "0" })).toBe(10);
  });

  it("is zero when points paid for all of it", () => {
    // The shape seen in production: a £0.45 order stores points_amount 45.
    expect(cashSpend({ totalValue: "0.45", pointsValue: "45.00" })).toBe(0);
  });

  it("subtracts only the points-funded part of a mixed payment", () => {
    // £4.05 order, 63 points (£0.63) plus £3.42 from the wallet.
    expect(cashSpend({ totalValue: "4.05", pointsValue: "63.00" })).toBe(3.42);
  });

  it("treats points_amount as a points count, not pounds", () => {
    // If 45 were read as £45 this would go hugely negative.
    expect(cashSpend({ totalValue: "0.45", pointsValue: "45" })).not.toBeLessThan(0);
    expect(POINTS_PER_POUND).toBe(100);
  });

  it("clamps the penny of rounding overshoot rather than going negative", () => {
    expect(cashSpend({ totalValue: "1.00", pointsValue: "101" })).toBe(0);
  });

  it("copes with nulls, blanks and nonsense", () => {
    expect(cashSpend({ totalValue: null, pointsValue: null })).toBe(0);
    expect(cashSpend({ totalValue: undefined, pointsValue: undefined })).toBe(0);
    expect(cashSpend({ totalValue: "abc", pointsValue: "xyz" })).toBe(0);
  });

  it("accepts numbers as well as decimal strings", () => {
    expect(cashSpend({ totalValue: 12.5, pointsValue: 250 })).toBe(10);
  });

  it("rounds to the penny", () => {
    expect(cashSpend({ totalValue: "10.00", pointsValue: "333" })).toBe(6.67);
  });
});

describe("buildUserFinancials", () => {
  const deposits = [
    { userId: "a", totalCashflow: "10.00" },
    { userId: "b", totalCashflow: "0" },
  ];
  const spend = [
    { userId: "a", totalValue: "9.01", totalPoints: "110", gameValue: "8.01", gamePoints: "110" },
  ];

  it("puts deposits and spend on one record", () => {
    const [a] = buildUserFinancials(deposits, spend).filter((u) => u.userId === "a");
    expect(a).toEqual({
      userId: "a",
      totalCashflow: 10,
      instantPlaySpend: 6.91,
      totalSpend: 7.91,
    });
  });

  it("keeps a depositor who has never played, at zero spend", () => {
    const b = buildUserFinancials(deposits, spend).find((u) => u.userId === "b");
    expect(b).toMatchObject({ totalCashflow: 0, instantPlaySpend: 0, totalSpend: 0 });
  });

  it("keeps a player who never deposited, at zero cashflow", () => {
    const rows = buildUserFinancials([], spend);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId: "a", totalCashflow: 0, totalSpend: 7.91 });
  });

  it("never reports game spend above total spend", () => {
    const rows = buildUserFinancials(deposits, spend);
    for (const r of rows) expect(r.instantPlaySpend).toBeLessThanOrEqual(r.totalSpend);
  });

  it("returns nothing for no input", () => {
    expect(buildUserFinancials([], [])).toEqual([]);
  });
});
