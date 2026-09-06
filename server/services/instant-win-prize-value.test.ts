import { describe, expect, it } from "vitest";
import { instantWinValueFromTablePrize } from "./instant-win-prize-value";

describe("instantWinValueFromTablePrize", () => {
  it("uses ringtonePoints for points prizes", () => {
    expect(
      instantWinValueFromTablePrize(
        { prizeValue: "2.00", ringtonePoints: 200 },
        "points"
      )
    ).toBe(200);
  });

  it("uses prizeValue for cash prizes", () => {
    expect(
      instantWinValueFromTablePrize(
        { prizeValue: "50.00", ringtonePoints: 0 },
        "cash"
      )
    ).toBe(50);
  });

  it("falls back to prizeValue when ringtonePoints is zero", () => {
    expect(
      instantWinValueFromTablePrize(
        { prizeValue: "10.00", ringtonePoints: 0 },
        "points"
      )
    ).toBe(10);
  });
});
