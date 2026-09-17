import { describe, expect, it } from "vitest";
import { accountCanSpin, ipWithinDailyLimit } from "./daily-spin-eligibility";

describe("accountCanSpin", () => {
  it("lets a verified member spin", () => {
    expect(accountCanSpin({ emailVerified: true, isGuestAccount: false })).toEqual({ eligible: true });
  });

  it("refuses guests, who are not signed in at all", () => {
    const r = accountCanSpin(null);
    expect(r).toMatchObject({ eligible: false, reason: "not_signed_in" });
  });

  it("refuses guest checkout accounts", () => {
    // These are created without email verification, so they would otherwise be
    // a way to collect points without owning a real inbox.
    const r = accountCanSpin({ emailVerified: false, isGuestAccount: true });
    expect(r).toMatchObject({ eligible: false, reason: "guest_account" });
  });

  it("refuses a guest account even if it somehow shows as verified", () => {
    const r = accountCanSpin({ emailVerified: true, isGuestAccount: true });
    expect(r).toMatchObject({ eligible: false, reason: "guest_account" });
  });

  it("refuses an unverified account", () => {
    const r = accountCanSpin({ emailVerified: false, isGuestAccount: false });
    expect(r).toMatchObject({ eligible: false, reason: "email_not_verified" });
  });

  it("treats missing flags as not verified rather than assuming the best", () => {
    expect(accountCanSpin({})).toMatchObject({ eligible: false, reason: "email_not_verified" });
    expect(accountCanSpin({ emailVerified: null })).toMatchObject({
      eligible: false,
      reason: "email_not_verified",
    });
  });

  it("always explains itself, so the UI never has to invent wording", () => {
    const r = accountCanSpin({ emailVerified: false, isGuestAccount: false });
    expect(r.eligible).toBe(false);
    if (!r.eligible) expect(r.message.length).toBeGreaterThan(10);
  });
});

describe("ipWithinDailyLimit", () => {
  it("allows spins below the cap", () => {
    expect(ipWithinDailyLimit(0, 12)).toBe(true);
    expect(ipWithinDailyLimit(11, 12)).toBe(true);
  });

  it("blocks once the cap is reached", () => {
    expect(ipWithinDailyLimit(12, 12)).toBe(false);
    expect(ipWithinDailyLimit(50, 12)).toBe(false);
  });

  it("is disabled by a limit of zero or nothing", () => {
    // Households and mobile networks share IPs, so switching the cap off has to
    // be possible without touching code.
    expect(ipWithinDailyLimit(999, 0)).toBe(true);
    expect(ipWithinDailyLimit(999, null)).toBe(true);
    expect(ipWithinDailyLimit(999, undefined)).toBe(true);
    expect(ipWithinDailyLimit(999, -1)).toBe(true);
  });
});
