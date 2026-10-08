import { describe, expect, it } from "vitest";
import { decidePercentageDiscount, worseThanBulkMessage } from "./best-discount";

/** The live wheel: 5% cap £1, 10% cap £2, 20% cap £3, 50% cap £5. */
const WHEEL = { 5: 1, 10: 2, 20: 3, 50: 5 } as const;

/** Mirrors utils/discounts.ts at the £0.99 play price. */
const PRICE = 0.99;
function bulk(qty: number): number {
  const capped = Math.min(qty, 15);
  const pct = capped >= 15 ? 0.15 : capped >= 10 ? 0.1 : capped >= 5 ? 0.05 : 0;
  return Math.round((PRICE * capped * (1 - pct) + PRICE * Math.max(0, qty - 15)) * 100) / 100;
}
const decide = (qty: number, percent: 5 | 10 | 20 | 50) =>
  decidePercentageDiscount({
    fullTotal: Math.round(PRICE * qty * 100) / 100,
    bulkTotal: bulk(qty),
    percent,
    cap: WHEEL[percent],
    minimumTotal: 1.5,
  });

describe("decidePercentageDiscount", () => {
  it("refuses a 5% code that would cost the customer money", () => {
    // 15 plays: bulk saves £2.23, the code saves £0.74. Applying it would have
    // charged £1.49 more AND spent the prize.
    const out = decide(15, 5);
    expect(out.apply).toBe(false);
    if (!out.apply) {
      expect(out.bulkTotal).toBe(12.62);
      expect(out.codeTotal).toBe(14.11);
    }
  });

  it("refuses a 10% code on a ten-play basket, where bulk is already 10%", () => {
    // Identical price either way, so keep the prize.
    const out = decide(10, 10);
    expect(out.apply).toBe(false);
  });

  it("applies the 50% code, which beats bulk on every basket", () => {
    for (const qty of [5, 10, 12, 15, 20]) {
      const out = decide(qty, 50);
      expect(out.apply).toBe(true);
    }
  });

  it("gets Leoni's order right", () => {
    // 12 plays, 50% capped at £5. Full £11.88, bulk £10.69.
    const out = decide(12, 50);
    expect(out).toEqual({ apply: true, total: 6.88, discountValue: 5.0 });
  });

  it("honours the cap", () => {
    // 50% of £100 is £50, but the prize is worth at most £5.
    const out = decidePercentageDiscount({
      fullTotal: 100, bulkTotal: 85, percent: 50, cap: 5, minimumTotal: 1.5,
    });
    expect(out).toEqual({ apply: false, reason: "worse_than_bulk", bulkTotal: 85, codeTotal: 95 });
  });

  it("applies with no cap when there is none", () => {
    const out = decidePercentageDiscount({
      fullTotal: 100, bulkTotal: 85, percent: 50, cap: null, minimumTotal: 1.5,
    });
    expect(out).toEqual({ apply: true, total: 50, discountValue: 50 });
  });

  it("never reduces an order below the floor", () => {
    const out = decidePercentageDiscount({
      fullTotal: 2, bulkTotal: 2, percent: 90, cap: null, minimumTotal: 1.5,
    });
    expect(out.apply).toBe(true);
    if (out.apply) expect(out.total).toBe(1.5);
  });

  it("treats a tie as not worth spending the prize on", () => {
    const out = decidePercentageDiscount({
      fullTotal: 10, bulkTotal: 9, percent: 10, cap: null, minimumTotal: 1.5,
    });
    expect(out.apply).toBe(false);
  });

  it("falls back to full price when there is no bulk discount", () => {
    const out = decidePercentageDiscount({
      fullTotal: 4.95, bulkTotal: 4.95, percent: 20, cap: 3, minimumTotal: 1.5,
    });
    expect(out).toEqual({ apply: true, total: 3.96, discountValue: 0.99 });
  });

  it("covers the whole live wheel against the real bulk tiers", () => {
    // The table from the investigation: ✗ = code loses to bulk.
    const expected: Record<number, Record<number, boolean>> = {
      5:  { 5: false, 10: true,  20: true, 50: true },
      10: { 5: false, 10: false, 20: true, 50: true },
      15: { 5: false, 10: false, 20: true, 50: true },
      20: { 5: false, 10: false, 20: true, 50: true },
    };
    for (const qty of [5, 10, 15, 20] as const) {
      for (const pct of [5, 10, 20, 50] as const) {
        expect({ qty, pct, apply: decide(qty, pct).apply })
          .toEqual({ qty, pct, apply: expected[qty][pct] });
      }
    }
  });
});

describe("worseThanBulkMessage", () => {
  it("says what they keep and what it would have cost", () => {
    const msg = worseThanBulkMessage(12.62, 14.11);
    expect(msg).toContain("£12.62");
    expect(msg).toContain("£14.11");
    expect(msg).toContain("kept your code");
  });
});
