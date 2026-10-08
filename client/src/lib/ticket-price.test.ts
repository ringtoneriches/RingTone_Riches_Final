import { describe, expect, it } from "vitest";
import { nextBundleTier } from "./ticket-price";

describe("nextBundleTier", () => {
  it("points at the next tier and what reaching it is worth", () => {
    // Two more entries takes 13 to the 15 tier and its 15% rate.
    expect(nextBundleTier(13, 0.99)).toEqual({ at: 15, add: 2, percent: 15, saves: 2.23 });
  });

  it("counts from zero", () => {
    expect(nextBundleTier(0, 0.99)).toEqual({ at: 5, add: 5, percent: 5, saves: 0.25 });
  });

  it("moves to the tier above once one is reached", () => {
    // Sitting exactly on 10 means the next thing to aim at is 15.
    expect(nextBundleTier(10, 0.99)?.at).toBe(15);
    expect(nextBundleTier(5, 0.99)?.at).toBe(10);
  });

  it("says nothing once the tiers run out", () => {
    // Above the largest tier there is no better rate to honestly offer.
    expect(nextBundleTier(15, 0.99)).toBeNull();
    expect(nextBundleTier(40, 0.99)).toBeNull();
    expect(nextBundleTier(60, 1.25)).toBeNull();
  });

  it("says nothing for a free or unpriced game", () => {
    expect(nextBundleTier(1, 0)).toBeNull();
    expect(nextBundleTier(1, Number.NaN)).toBeNull();
  });

  it("scales the saving with the ticket price", () => {
    // Voltz at £1.25: fifteen entries at 15% is £2.81.
    expect(nextBundleTier(14, 1.25)).toEqual({ at: 15, add: 1, percent: 15, saves: 2.81 });
  });

  it("handles a fractional or negative quantity without lying", () => {
    expect(nextBundleTier(-5, 0.99)?.at).toBe(5);
    expect(nextBundleTier(9.7, 0.99)?.at).toBe(10);
  });
});
