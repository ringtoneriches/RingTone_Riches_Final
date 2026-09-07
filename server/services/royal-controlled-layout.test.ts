import { describe, expect, it } from "vitest";
import {
  buildRoyalReelStops,
  reelStopForMiddleSymbol,
  royalSymbolFromPrize,
  ROYAL_SYMBOL_TAPE,
} from "./royal-controlled-layout";

describe("royal-controlled-layout", () => {
  it("maps cash and points prizes to slot symbols", () => {
    expect(
      royalSymbolFromPrize({
        isWin: true,
        rewardType: "cash",
        rewardValue: 500,
        prizeName: "Seven — £500 Cash",
      })
    ).toBe("RSeven");

    expect(
      royalSymbolFromPrize({
        isWin: true,
        rewardType: "points",
        rewardValue: 99,
        prizeName: "Coin — 99 Points",
      })
    ).toBe("RCoin");

    expect(
      royalSymbolFromPrize({
        isWin: true,
        rewardType: "cash",
        rewardValue: 50,
        prizeName: "Bar — £50 Cash",
      })
    ).toBe("RBar");
  });

  it("aligns middle row to the winning symbol", () => {
    const stop = reelStopForMiddleSymbol(ROYAL_SYMBOL_TAPE, "RBar");
    const middle = ROYAL_SYMBOL_TAPE[(stop + 1) % ROYAL_SYMBOL_TAPE.length];
    expect(middle).toBe("RBar");

    const [a, b, c] = buildRoyalReelStops(true, "RSeven");
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(ROYAL_SYMBOL_TAPE[(a + 1) % ROYAL_SYMBOL_TAPE.length]).toBe("RSeven");
  });

  it("builds non-matching middle row for losses", () => {
    const [p0, p1, p2] = buildRoyalReelStops(false, null);
    const m0 = ROYAL_SYMBOL_TAPE[(p0 + 1) % ROYAL_SYMBOL_TAPE.length];
    const m1 = ROYAL_SYMBOL_TAPE[(p1 + 1) % ROYAL_SYMBOL_TAPE.length];
    const m2 = ROYAL_SYMBOL_TAPE[(p2 + 1) % ROYAL_SYMBOL_TAPE.length];
    expect(m0 === m1 && m1 === m2).toBe(false);
  });
});
