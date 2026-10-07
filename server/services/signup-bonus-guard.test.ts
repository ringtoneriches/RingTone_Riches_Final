import { describe, expect, it } from "vitest";
import {
  SIGNUP_BONUS_IP_LIMIT,
  SIGNUP_BONUS_IP_WINDOW_DAYS,
  bonusWindowStart,
  signupBonusDecision,
} from "./signup-bonus-guard";

const base = {
  enabled: true,
  cash: 5,
  points: 100,
  alreadyGrantedAt: null,
  priorGrantsFromIp: 0,
  ipLimit: SIGNUP_BONUS_IP_LIMIT,
};

describe("signupBonusDecision", () => {
  it("pays a first-time account on a quiet address", () => {
    expect(signupBonusDecision(base)).toEqual({ grant: true });
  });

  it("never pays twice for the same account", () => {
    // The verification endpoint can be called again; it must not re-credit.
    expect(signupBonusDecision({ ...base, alreadyGrantedAt: new Date() })).toEqual({
      grant: false,
      reason: "already_granted",
    });
    expect(
      signupBonusDecision({ ...base, alreadyGrantedAt: "2026-10-08T00:00:00Z" })
    ).toEqual({ grant: false, reason: "already_granted" });
  });

  it("checks already-granted before anything else", () => {
    // Even with the bonus switched off or the IP over its limit, a paid
    // account reports why it is being skipped as "already paid", so a replay
    // is never mistaken for abuse in the logs.
    expect(
      signupBonusDecision({
        ...base,
        alreadyGrantedAt: new Date(),
        enabled: false,
        priorGrantsFromIp: 99,
      })
    ).toEqual({ grant: false, reason: "already_granted" });
  });

  it("respects the platform switch", () => {
    expect(signupBonusDecision({ ...base, enabled: false })).toEqual({
      grant: false,
      reason: "bonus_disabled",
    });
  });

  it("does nothing when the bonus is set to zero", () => {
    expect(signupBonusDecision({ ...base, cash: 0, points: 0 })).toEqual({
      grant: false,
      reason: "nothing_to_give",
    });
  });

  it("still pays when only one half of the bonus is set", () => {
    expect(signupBonusDecision({ ...base, cash: 0, points: 50 })).toEqual({ grant: true });
    expect(signupBonusDecision({ ...base, cash: 2.5, points: 0 })).toEqual({ grant: true });
  });

  it("lets a household share a connection", () => {
    // Two earlier bonuses on this address is ordinary; the third is allowed.
    expect(signupBonusDecision({ ...base, priorGrantsFromIp: 2 })).toEqual({ grant: true });
  });

  it("withholds the bonus once an address is over its limit", () => {
    expect(signupBonusDecision({ ...base, priorGrantsFromIp: 3 })).toEqual({
      grant: false,
      reason: "ip_limit",
    });
    expect(signupBonusDecision({ ...base, priorGrantsFromIp: 40 })).toEqual({
      grant: false,
      reason: "ip_limit",
    });
  });

  it("treats a limit of zero or less as no cap", () => {
    // Same convention as the daily spin's IP limit, so the two read alike.
    expect(signupBonusDecision({ ...base, priorGrantsFromIp: 999, ipLimit: 0 })).toEqual({
      grant: true,
    });
    expect(signupBonusDecision({ ...base, priorGrantsFromIp: 999, ipLimit: -1 })).toEqual({
      grant: true,
    });
  });

  it("would have stopped the observed pattern", () => {
    // ~45 accounts from one person. The first three in a window still pay --
    // the rest get nothing.
    const paid = Array.from({ length: 45 }, (_, i) =>
      signupBonusDecision({ ...base, priorGrantsFromIp: i })
    ).filter((d) => d.grant).length;
    expect(paid).toBe(SIGNUP_BONUS_IP_LIMIT);
  });
});

describe("bonusWindowStart", () => {
  it("reaches back exactly the window", () => {
    const now = new Date("2026-10-08T12:00:00Z");
    expect(bonusWindowStart(now).toISOString()).toBe("2026-09-08T12:00:00.000Z");
  });

  it("defaults to the documented window", () => {
    expect(SIGNUP_BONUS_IP_WINDOW_DAYS).toBe(30);
    const now = new Date("2026-10-08T12:00:00Z");
    const days = (now.getTime() - bonusWindowStart(now).getTime()) / 86_400_000;
    expect(days).toBe(SIGNUP_BONUS_IP_WINDOW_DAYS);
  });
});
