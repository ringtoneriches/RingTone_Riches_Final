import { describe, expect, it } from "vitest";
import {
  GoldenTicketError,
  closureAfterPlay,
  drawOrder,
  fulfilmentFor,
  isPlayEligible,
  isWinningPosition,
  pickDropPositions,
} from "./golden-ticket-draw";

/** Deterministic stand-in for Math.random. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const campaign = {
  status: "active",
  startsAt: null,
  endsAt: null,
  eligibleGameTypes: [] as string[],
  eligibleCompetitionIds: [] as string[],
  minSpend: null,
  includeFreePlays: false,
  ticketCount: 1,
  dropWindow: 1000,
  dropPositions: [742],
};

describe("pickDropPositions", () => {
  it("picks the requested number of distinct positions inside the window", () => {
    const positions = pickDropPositions(5, 100, seeded(1));
    expect(positions).toHaveLength(5);
    expect(new Set(positions).size).toBe(5);
    expect(Math.min(...positions)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...positions)).toBeLessThanOrEqual(100);
  });

  it("returns them sorted, so a sealed campaign reads sensibly", () => {
    const positions = pickDropPositions(8, 500, seeded(7));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("handles a single ticket, which is the common case", () => {
    expect(pickDropPositions(1, 10_000, seeded(3))).toHaveLength(1);
  });

  it("still returns distinct positions when tickets nearly fill the window", () => {
    // This crosses into the shuffle branch rather than rejection sampling.
    const positions = pickDropPositions(9, 10, seeded(11));
    expect(new Set(positions).size).toBe(9);
    expect(positions.every((p) => p >= 1 && p <= 10)).toBe(true);
  });

  it("can fill the window exactly", () => {
    expect(pickDropPositions(4, 4, seeded(5))).toEqual([1, 2, 3, 4]);
  });

  it("refuses more tickets than the window can hold", () => {
    expect(() => pickDropPositions(11, 10)).toThrow(GoldenTicketError);
  });

  it("refuses a campaign with no tickets", () => {
    expect(() => pickDropPositions(0, 10)).toThrow(GoldenTicketError);
  });
});

describe("isPlayEligible", () => {
  const paid = { gameType: "spin", competitionId: "c1", spend: 0.99, userId: "u1" };

  it("accepts a paid play on a live campaign", () => {
    expect(isPlayEligible(campaign, paid).eligible).toBe(true);
  });

  it("excludes guests, who have no account to credit", () => {
    expect(isPlayEligible(campaign, { ...paid, userId: null }).reason).toBe("no_account");
  });

  it("ignores campaigns that are not active", () => {
    expect(isPlayEligible({ ...campaign, status: "draft" }, paid).reason).toBe("campaign_not_active");
  });

  it("excludes free plays unless the campaign opts in", () => {
    const free = { ...paid, spend: 0 };
    expect(isPlayEligible(campaign, free).reason).toBe("free_play_excluded");
    expect(isPlayEligible({ ...campaign, includeFreePlays: true }, free).eligible).toBe(true);
  });

  it("applies a minimum spend", () => {
    const c = { ...campaign, minSpend: "1.00" };
    expect(isPlayEligible(c, paid).reason).toBe("below_min_spend");
    expect(isPlayEligible(c, { ...paid, spend: 1 }).eligible).toBe(true);
  });

  it("treats an empty game list as every game, not none", () => {
    expect(isPlayEligible(campaign, { ...paid, gameType: "voltz" }).eligible).toBe(true);
  });

  it("restricts to the listed games when the list is set", () => {
    const c = { ...campaign, eligibleGameTypes: ["voltz"] };
    expect(isPlayEligible(c, paid).reason).toBe("game_not_eligible");
    expect(isPlayEligible(c, { ...paid, gameType: "voltz" }).eligible).toBe(true);
  });

  it("restricts to specific competitions when the list is set", () => {
    const c = { ...campaign, eligibleCompetitionIds: ["c2"] };
    expect(isPlayEligible(c, paid).reason).toBe("competition_not_eligible");
    expect(isPlayEligible(c, { ...paid, competitionId: "c2" }).eligible).toBe(true);
  });

  it("respects the scheduled window", () => {
    const now = new Date("2026-10-01T12:00:00Z");
    const early = { ...campaign, startsAt: "2026-10-02T00:00:00Z" };
    const over = { ...campaign, endsAt: "2026-09-30T00:00:00Z" };
    expect(isPlayEligible(early, paid, now).reason).toBe("not_started");
    expect(isPlayEligible(over, paid, now).reason).toBe("ended");
  });
});

describe("isWinningPosition", () => {
  it("wins only on a sealed position", () => {
    expect(isWinningPosition(campaign, 742)).toBe(true);
    expect(isWinningPosition(campaign, 741)).toBe(false);
  });
});

describe("closureAfterPlay", () => {
  it("stays open mid-window with tickets left", () => {
    expect(closureAfterPlay(campaign, 500, 0)).toBeNull();
  });

  it("completes once every ticket is awarded", () => {
    expect(closureAfterPlay(campaign, 742, 1)).toBe("completed");
  });

  it("expires when the window runs out with tickets unawarded", () => {
    expect(closureAfterPlay(campaign, 1000, 0)).toBe("expired");
  });

  it("prefers completed over expired on the very last play", () => {
    // Landing the final ticket on the final play is a completion, not an expiry.
    expect(closureAfterPlay(campaign, 1000, 1)).toBe("completed");
  });
});

describe("fulfilmentFor", () => {
  it("credits cash and site credit automatically", () => {
    expect(fulfilmentFor("cash")).toBe("auto_credited");
    expect(fulfilmentFor("credit")).toBe("auto_credited");
  });

  it("sends physical prizes to a human", () => {
    expect(fulfilmentFor("physical")).toBe("awaiting_fulfilment");
  });
});

describe("drawOrder", () => {
  it("puts the earliest activation first", () => {
    const order = drawOrder([
      { id: "b", activatedAt: "2026-02-01T00:00:00Z" },
      { id: "a", activatedAt: "2026-01-01T00:00:00Z" },
    ]);
    expect(order.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("breaks ties by id so the order never depends on row ordering", () => {
    const same = "2026-01-01T00:00:00Z";
    const order = drawOrder([
      { id: "z", activatedAt: same },
      { id: "a", activatedAt: same },
    ]);
    expect(order.map((c) => c.id)).toEqual(["a", "z"]);
  });
});
