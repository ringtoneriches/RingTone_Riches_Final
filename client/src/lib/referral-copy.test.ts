import { describe, it, expect } from "vitest";
import { pointsAsPounds, POINTS_PER_POUND } from "./referral-copy";

describe("pointsAsPounds", () => {
  it("converts at a hundred points to the pound", () => {
    expect(POINTS_PER_POUND).toBe(100);
    expect(pointsAsPounds(300)).toBe("worth £3");
  });

  it("drops the trailing zeros on a whole number of pounds", () => {
    expect(pointsAsPounds(500)).toBe("worth £5");
    expect(pointsAsPounds(2000)).toBe("worth £20");
  });

  it("keeps the pence when there are any", () => {
    expect(pointsAsPounds(250)).toBe("worth £2.50");
    expect(pointsAsPounds(1575)).toBe("worth £15.75");
  });

  it("never puts a pound sign directly against the points figure", () => {
    // The bug this guards: 300 points rendered as "£300".
    expect(pointsAsPounds(300)).not.toContain("£300");
  });

  it("handles zero and nonsense without printing NaN", () => {
    expect(pointsAsPounds(0)).toBe("worth £0");
    expect(pointsAsPounds(-50)).toBe("worth £0");
    expect(pointsAsPounds(Number.NaN)).toBe("worth £0");
    expect(pointsAsPounds(Number.POSITIVE_INFINITY)).toBe("worth £0");
  });

  it("copes with the smallest meaningful award", () => {
    expect(pointsAsPounds(1)).toBe("worth £0.01");
  });
});
