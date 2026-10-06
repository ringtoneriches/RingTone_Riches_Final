import { describe, expect, it } from "vitest";
import { winnerPrizeDescription, winnerPrizeValue } from "./golden-ticket-winner";

/**
 * The winners page reads cash-vs-points out of the string itself, so these
 * mirror client/src/pages/past-winners.tsx. If that convention ever changes,
 * these are the tests that should fail.
 */
const extractCashValue = (prizeValue: string): number => {
  const match = prizeValue.match(/£\s*([\d,.]+)/);
  return match ? parseFloat(match[1].replace(/,/g, "")) : 0;
};
const extractPoints = (prizeValue: string): number => {
  if (prizeValue.includes("£")) return 0;
  const match = prizeValue.match(/([\d,.]+)/);
  return match ? parseFloat(match[1].replace(/,/g, "")) : 0;
};

describe("winnerPrizeValue", () => {
  it("marks a cash prize as cash, not points", () => {
    // The bug this exists to prevent: "50.00" reads as 50 POINTS on the card.
    const value = winnerPrizeValue({ prizeType: "cash", prizeName: "£50 Cash", prizeValue: "50.00" });
    expect(value).toBe("£50");
    expect(extractCashValue(value)).toBe(50);
    expect(extractPoints(value)).toBe(0);
  });

  it("would have been read as points without the £", () => {
    expect(extractPoints("50.00")).toBe(50);
    expect(extractCashValue("50.00")).toBe(0);
  });

  it("treats site credit as cash, because it is paid in pounds", () => {
    const value = winnerPrizeValue({ prizeType: "credit", prizeName: "1000 Ringtone Points", prizeValue: "10.00" });
    expect(value).toBe("£10");
    expect(extractCashValue(value)).toBe(10);
  });

  it("keeps the pennies when there are any", () => {
    expect(winnerPrizeValue({ prizeType: "cash", prizeName: "x", prizeValue: "12.50" })).toBe("£12.50");
    expect(winnerPrizeValue({ prizeType: "cash", prizeName: "x", prizeValue: 7.05 })).toBe("£7.05");
  });

  it("drops trailing zeros on a whole-pound prize", () => {
    expect(winnerPrizeValue({ prizeType: "cash", prizeName: "x", prizeValue: "30.00" })).toBe("£30");
  });

  it("names a physical prize rather than pricing it", () => {
    // The stored value on a physical prize is for admin reporting only.
    const value = winnerPrizeValue({
      prizeType: "physical",
      prizeName: "Nintendo Switch OLED",
      prizeValue: "250.00",
    });
    expect(value).toBe("Nintendo Switch OLED");
    expect(extractCashValue(value)).toBe(0);
  });

  it("falls back to the name when there is no usable amount", () => {
    expect(winnerPrizeValue({ prizeType: "cash", prizeName: "Mystery Prize", prizeValue: null })).toBe("Mystery Prize");
    expect(winnerPrizeValue({ prizeType: "cash", prizeName: "Mystery Prize", prizeValue: "0" })).toBe("Mystery Prize");
    expect(winnerPrizeValue({ prizeType: "cash", prizeName: "Mystery Prize", prizeValue: "nonsense" })).toBe("Mystery Prize");
  });

  it("handles every campaign currently live in production", () => {
    const live = [
      { prizeType: "cash", prizeName: "£50 Cash", prizeValue: "50.00", expect: "£50" },
      { prizeType: "cash", prizeName: "£30 Takeaway Spend", prizeValue: "30.00", expect: "£30" },
      { prizeType: "cash", prizeName: "£50 CASH!", prizeValue: "50.00", expect: "£50" },
      { prizeType: "credit", prizeName: "1000 Ringtone Points", prizeValue: "10.00", expect: "£10" },
      { prizeType: "cash", prizeName: "£10 Golden Ticket", prizeValue: "10.00", expect: "£10" },
    ];
    for (const row of live) {
      expect(winnerPrizeValue(row)).toBe(row.expect);
    }
  });
});

describe("winnerPrizeDescription", () => {
  it("uses the campaign name, which is what the player was told", () => {
    expect(winnerPrizeDescription({ prizeType: "cash", prizeName: "£50 Cash", prizeValue: "50" })).toBe("£50 Cash");
  });

  it("never leaves the card blank", () => {
    expect(winnerPrizeDescription({ prizeType: "cash", prizeName: "   ", prizeValue: "50" })).toBe("Golden Ticket");
  });
});
