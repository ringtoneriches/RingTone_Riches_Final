import { describe, expect, it } from "vitest";
import { checkTicketLimit, hasPerUserLimit, ticketLimitNote, ticketsRemainingForUser } from "./ticket-limits";

describe("hasPerUserLimit", () => {
  it("treats null, undefined and 0 as no limit", () => {
    // Every competition that already exists has no value here, so these must
    // keep behaving exactly as before.
    expect(hasPerUserLimit(null)).toBe(false);
    expect(hasPerUserLimit(undefined)).toBe(false);
    expect(hasPerUserLimit(0)).toBe(false);
    expect(hasPerUserLimit(-5)).toBe(false);
  });

  it("recognises a real limit", () => {
    expect(hasPerUserLimit(2)).toBe(true);
  });
});

describe("ticketsRemainingForUser", () => {
  it("is unlimited when there is no cap", () => {
    expect(ticketsRemainingForUser(null, 500)).toBe(Infinity);
  });

  it("counts down as the account takes tickets", () => {
    expect(ticketsRemainingForUser(2, 0)).toBe(2);
    expect(ticketsRemainingForUser(2, 1)).toBe(1);
    expect(ticketsRemainingForUser(2, 2)).toBe(0);
  });

  it("never goes negative, even if an account is already over", () => {
    // The competition that prompted this had an account holding 13 against an
    // intended limit of 2.
    expect(ticketsRemainingForUser(2, 13)).toBe(0);
  });
});

describe("checkTicketLimit", () => {
  it("allows anything when the competition has no cap", () => {
    expect(checkTicketLimit({ maxTicketsPerUser: null, alreadyHeld: 900, requested: 100 }))
      .toEqual({ allowed: true });
  });

  it("allows a purchase inside the allowance", () => {
    expect(checkTicketLimit({ maxTicketsPerUser: 2, alreadyHeld: 0, requested: 2 }))
      .toEqual({ allowed: true });
    expect(checkTicketLimit({ maxTicketsPerUser: 2, alreadyHeld: 1, requested: 1 }))
      .toEqual({ allowed: true });
  });

  it("blocks the purchase that would cross the limit", () => {
    // The real failure: two separate orders of 2, which a per-ORDER cap misses.
    const r = checkTicketLimit({ maxTicketsPerUser: 2, alreadyHeld: 2, requested: 2 });
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.remaining).toBe(0);
      expect(r.limit).toBe(2);
      expect(r.alreadyHeld).toBe(2);
    }
  });

  it("blocks a single oversized order too", () => {
    const r = checkTicketLimit({ maxTicketsPerUser: 2, alreadyHeld: 0, requested: 13 });
    expect(r.allowed).toBe(false);
  });

  it("tells the customer how many they can still take", () => {
    const r = checkTicketLimit({ maxTicketsPerUser: 5, alreadyHeld: 3, requested: 4 });
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.remaining).toBe(2);
      expect(r.message).toContain("limit of 5 per person");
      expect(r.message).toContain("2 tickets more");
    }
  });

  it("says so plainly when the allowance is used up", () => {
    const r = checkTicketLimit({ maxTicketsPerUser: 2, alreadyHeld: 2, requested: 1 });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.message).toContain("which is the limit of 2 per person");
  });

  it("gets the singular right", () => {
    const r = checkTicketLimit({ maxTicketsPerUser: 1, alreadyHeld: 1, requested: 1 });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.message).toContain("1 ticket for this competition");
  });

  it("holds the line for an account already over the limit", () => {
    const r = checkTicketLimit({ maxTicketsPerUser: 2, alreadyHeld: 13, requested: 1 });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.remaining).toBe(0);
  });
});

describe("ticketLimitNote", () => {
  it("says nothing when there is no limit", () => {
    expect(ticketLimitNote({ maxTicketsPerUser: null })).toBeNull();
    expect(ticketLimitNote({ maxTicketsPerUser: 0 })).toBeNull();
  });

  it("generates wording so a limit is never silent", () => {
    expect(ticketLimitNote({ maxTicketsPerUser: 2 })).toBe("Limit 2 tickets per person.");
    expect(ticketLimitNote({ maxTicketsPerUser: 1 })).toBe("Limit 1 ticket per person.");
  });

  it("says 'free' on giveaways, which is how customers describe them", () => {
    // The competition this came from was a 100%-off giveaway whose terms lived
    // only in the title.
    expect(ticketLimitNote({ maxTicketsPerUser: 2, isFree: true })).toBe(
      "Limit 2 free tickets per person.",
    );
  });

  it("prefers the admin's own wording", () => {
    expect(
      ticketLimitNote({ maxTicketsPerUser: 2, custom: "Two free entries each — be fair!" }),
    ).toBe("Two free entries each — be fair!");
  });

  it("ignores whitespace-only wording and falls back to the default", () => {
    expect(ticketLimitNote({ maxTicketsPerUser: 2, custom: "   " })).toBe(
      "Limit 2 tickets per person.",
    );
  });

  it("does not invent a note from custom text when there is no limit", () => {
    // An admin may leave wording behind after clearing the number.
    expect(ticketLimitNote({ maxTicketsPerUser: null, custom: "" })).toBeNull();
  });
});
