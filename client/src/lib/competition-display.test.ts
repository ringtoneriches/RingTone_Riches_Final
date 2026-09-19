import { describe, expect, it } from "vitest";
import { getDefaultQuantity, quantityCapFor } from "./competition-display";

describe("quantityCapFor", () => {
  it("uses the global maximum when the competition has no per-person limit", () => {
    expect(quantityCapFor({ maxTicketsPerUser: null }, 500)).toBe(500);
    expect(quantityCapFor({ maxTicketsPerUser: 0 }, 500)).toBe(500);
    expect(quantityCapFor({}, 250)).toBe(250);
  });

  it("drops to the per-person limit when that is lower", () => {
    expect(quantityCapFor({ maxTicketsPerUser: 2 }, 500)).toBe(2);
  });

  it("keeps the global maximum when it is the tighter of the two", () => {
    expect(quantityCapFor({ maxTicketsPerUser: 900 }, 250)).toBe(250);
  });

  it("uses what the account has left, when that is known", () => {
    // Detail page: limit 2, one already held, so only one more.
    expect(quantityCapFor({ maxTicketsPerUser: 2 }, 500, 1)).toBe(1);
  });

  it("never offers less than 1, even with nothing left", () => {
    // The server refuses with an explanation; a stepper stuck on zero reads
    // worse than one that lets you try and be told why.
    expect(quantityCapFor({ maxTicketsPerUser: 2 }, 500, 0)).toBe(1);
  });

  it("ignores a missing remaining count rather than treating it as zero", () => {
    expect(quantityCapFor({ maxTicketsPerUser: 5 }, 500, undefined)).toBe(5);
    expect(quantityCapFor({ maxTicketsPerUser: 5 }, 500, null)).toBe(5);
  });
});

describe("getDefaultQuantity under a per-person limit", () => {
  const cap = (limit: number | null, globalMax = 500) =>
    quantityCapFor({ maxTicketsPerUser: limit }, globalMax);

  it("caps a large configured default down to the limit", () => {
    // The case that prompted this: admin sets 10 on the card-quantity page,
    // competition allows 2, so the cart must not open at 10 and then fail.
    expect(getDefaultQuantity({ defaultQuantity: 10 }, cap(2))).toBe(2);
    expect(getDefaultQuantity({ defaultQuantity: 5 }, cap(2))).toBe(2);
  });

  it("leaves a smaller default alone", () => {
    // Capping only. A default of 1 is not raised to the limit.
    expect(getDefaultQuantity({ defaultQuantity: 1 }, cap(2))).toBe(1);
  });

  it("is unchanged when the competition has no limit", () => {
    expect(getDefaultQuantity({ defaultQuantity: 10 }, cap(null))).toBe(10);
  });

  it("still honours the global maximum", () => {
    expect(getDefaultQuantity({ defaultQuantity: 999 }, cap(null, 250))).toBe(250);
  });
});
