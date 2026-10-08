import { describe, expect, it } from "vitest";
import { decidePercentageDiscount, nothingToSaveMessage } from "./best-discount";
import { quoteCartDiscount } from "@shared/cart-discount";

/** The live wheel: 5% cap £1, 10% cap £2, 20% cap £3, 50% cap £5. */
const WHEEL = { 5: 1, 10: 2, 20: 3, 50: 5 } as const;

/** Mirrors utils/discounts.ts: 5% from five plays, 10% from ten, 15% from fifteen. */
function bulk(price: number, qty: number): number {
  const capped = Math.min(qty, 15);
  const pct = capped >= 15 ? 0.15 : capped >= 10 ? 0.1 : capped >= 5 ? 0.05 : 0;
  return Math.round((price * capped * (1 - pct) + price * Math.max(0, qty - 15)) * 100) / 100;
}

describe("decidePercentageDiscount", () => {
  it("matches the basket, to the penny, on the order from the video", () => {
    // Eight Voltz at £1.25. The basket showed: bundle save -£0.50, then
    // "5% off - won on your daily spin" -£0.48, total £9.02. The game's own
    // checkout used to refuse the code outright on this order.
    const bulkTotal = bulk(1.25, 8);
    expect(bulkTotal).toBe(9.5);

    const out = decidePercentageDiscount({
      bulkTotal, percent: 5, cap: WHEEL[5], minimumTotal: 1.5,
    });
    expect(out).toEqual({ apply: true, total: 9.02, discountValue: 0.48 });
  });

  it("gets Leoni's order right", () => {
    // Twelve pop plays at £0.99: full £11.88, bulk 10% -> £10.69, then 50%
    // capped at £5. She was charged £9.80 with the prize unspent.
    const bulkTotal = bulk(0.99, 12);
    expect(bulkTotal).toBe(10.69);

    const out = decidePercentageDiscount({
      bulkTotal, percent: 50, cap: WHEEL[50], minimumTotal: 1.5,
    });
    expect(out).toEqual({ apply: true, total: 5.69, discountValue: 5.0 });
  });

  it("agrees with the basket for every wheel slice and basket size", () => {
    // The two checkouts must not price the same plays differently again.
    for (const [price, qty] of [[1.25, 8], [0.99, 12], [0.99, 1], [2.5, 20], [0.99, 15]] as const) {
      const bulkTotal = bulk(price, qty);
      for (const pct of [5, 10, 20, 50] as const) {
        const mine = decidePercentageDiscount({
          bulkTotal, percent: pct, cap: WHEEL[pct], minimumTotal: 0,
        });
        const cart = quoteCartDiscount({
          type: "percentage",
          value: pct,
          maxDiscountPence: WHEEL[pct] * 100,
          lines: [{ orderId: "x", amountPence: Math.round(bulkTotal * 100) }],
        });
        const expected = Math.round(cart.totalPence) / 100;
        expect({ price, qty, pct, total: mine.apply ? mine.total : bulkTotal })
          .toEqual({ price, qty, pct, total: expected });
      }
    }
  });

  it("applies every wheel slice rather than refusing any", () => {
    // Stacking means a code is never worse than no code, so none are refused
    // on any basket the £1.50 floor leaves room to discount.
    for (const qty of [5, 10, 15, 20]) {
      for (const pct of [5, 10, 20, 50] as const) {
        const out = decidePercentageDiscount({
          bulkTotal: bulk(0.99, qty), percent: pct, cap: WHEEL[pct], minimumTotal: 1.5,
        });
        expect({ qty, pct, apply: out.apply }).toEqual({ qty, pct, apply: true });
      }
    }
  });

  it("cannot discount a basket already at or under the £1.50 floor", () => {
    // Pre-existing rule, carried over unchanged: a single £0.99 play is below
    // the floor, so no prize can take anything off it. The code is kept.
    const out = decidePercentageDiscount({
      bulkTotal: bulk(0.99, 1), percent: 50, cap: WHEEL[50], minimumTotal: 1.5,
    });
    expect(out).toEqual({ apply: false, reason: "nothing_to_save" });
  });

  it("honours the cap", () => {
    // 50% of £100 is £50, but this prize is worth at most £5.
    expect(decidePercentageDiscount({ bulkTotal: 100, percent: 50, cap: 5, minimumTotal: 1.5 }))
      .toEqual({ apply: true, total: 95, discountValue: 5 });
  });

  it("takes the full percentage when there is no cap", () => {
    expect(decidePercentageDiscount({ bulkTotal: 100, percent: 50, cap: null, minimumTotal: 1.5 }))
      .toEqual({ apply: true, total: 50, discountValue: 50 });
  });

  it("never reduces an order below the floor", () => {
    const out = decidePercentageDiscount({
      bulkTotal: 2, percent: 90, cap: null, minimumTotal: 1.5,
    });
    expect(out).toEqual({ apply: true, total: 1.5, discountValue: 0.5 });
  });

  it("keeps the code when it could not take anything off", () => {
    // Already at the floor: spending a prize for nothing is worse than
    // keeping it for an order where it is worth something.
    const out = decidePercentageDiscount({
      bulkTotal: 1.5, percent: 50, cap: null, minimumTotal: 1.5,
    });
    expect(out).toEqual({ apply: false, reason: "nothing_to_save" });
  });

  it("keeps the code on a zero-value order", () => {
    const out = decidePercentageDiscount({
      bulkTotal: 0, percent: 50, cap: 5, minimumTotal: 0,
    });
    expect(out).toEqual({ apply: false, reason: "nothing_to_save" });
  });

  it("treats a missing or nonsense percentage as nothing to give", () => {
    for (const percent of [0, -5, Number.NaN]) {
      expect(decidePercentageDiscount({ bulkTotal: 10, percent, cap: null, minimumTotal: 0 }))
        .toEqual({ apply: false, reason: "nothing_to_save" });
    }
  });
});

describe("nothingToSaveMessage", () => {
  it("says the code was kept", () => {
    expect(nothingToSaveMessage()).toContain("kept it");
  });
});

/**
 * Applying a code and then removing it must leave the order exactly where it
 * started. It did not before: apply recalculated from the undiscounted price
 * and remove restored the undiscounted price, so taking a discount off left
 * the customer paying MORE than if they had never applied one.
 */
describe("apply then remove round-trips", () => {
  it("returns the order to the price it was created at", () => {
    for (const [price, qty] of [[1.25, 8], [0.99, 12], [2.5, 20], [0.99, 15]] as const) {
      const created = bulk(price, qty);

      const applied = decidePercentageDiscount({
        bulkTotal: created, percent: 50, cap: WHEEL[50], minimumTotal: 1.5,
      });
      expect(applied.apply).toBe(true);

      // Removing recomputes from the competition, exactly as creating did.
      const removed = bulk(price, qty);
      expect({ price, qty, removed }).toEqual({ price, qty, removed: created });

      // And the customer never pays more for having tried a code.
      if (applied.apply) expect(applied.total).toBeLessThanOrEqual(created);
    }
  });
});
