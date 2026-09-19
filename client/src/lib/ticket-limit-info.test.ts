import { describe, expect, it } from "vitest";
import { capFromLimit, isLimited, overLimitLines, type TicketLimitMap } from "./ticket-limit-info";

const info = (limit: number | null, held = 0) => ({
  limit,
  note: limit ? `Limit ${limit} tickets per person.` : null,
  held,
  remaining: limit === null ? null : Math.max(0, limit - held),
});

describe("capFromLimit", () => {
  it("falls back to the global maximum when the limits are unknown", () => {
    // The limits request can fail; the basket still has to work, and the
    // server refuses anything over the limit at checkout regardless.
    expect(capFromLimit(undefined, 500)).toBe(500);
  });

  it("leaves a competition with no limit alone", () => {
    expect(capFromLimit(info(null), 500)).toBe(500);
  });

  it("caps at the limit when the account holds nothing", () => {
    expect(capFromLimit(info(2), 500)).toBe(2);
  });

  it("caps at what is left when the account already holds some", () => {
    expect(capFromLimit(info(2, 1), 500)).toBe(1);
  });

  it("still offers 1 when the allowance is used up", () => {
    // A stepper stuck on zero reads worse than one that lets you try and be
    // told why; the server refuses with an explanation.
    expect(capFromLimit(info(2, 2), 500)).toBe(1);
  });

  it("keeps the global maximum when it is the tighter of the two", () => {
    expect(capFromLimit(info(900), 250)).toBe(250);
  });
});

describe("isLimited", () => {
  it("is false for unknown, absent and zero limits", () => {
    expect(isLimited(undefined)).toBe(false);
    expect(isLimited(info(null))).toBe(false);
    expect(isLimited(info(0))).toBe(false);
  });

  it("is true for a real limit", () => {
    expect(isLimited(info(2))).toBe(true);
  });
});

describe("overLimitLines", () => {
  const limits: TicketLimitMap = { a: info(2), b: info(null), c: info(5, 4) };

  it("finds a line above the limit and says what it should be", () => {
    // The basket was filled when the limit was 10 and an admin lowered it.
    expect(overLimitLines([{ competitionId: "a", quantity: 10, title: "Pop" }], limits)).toEqual([
      { competitionId: "a", title: "Pop", from: 10, to: 2 },
    ]);
  });

  it("leaves a line already inside the limit alone", () => {
    expect(overLimitLines([{ competitionId: "a", quantity: 2 }], limits)).toEqual([]);
    expect(overLimitLines([{ competitionId: "a", quantity: 1 }], limits)).toEqual([]);
  });

  it("ignores competitions with no limit", () => {
    expect(overLimitLines([{ competitionId: "b", quantity: 400 }], limits)).toEqual([]);
  });

  it("ignores competitions whose limit is not known yet", () => {
    // Before the limits load, nothing should be silently reduced.
    expect(overLimitLines([{ competitionId: "zzz", quantity: 400 }], limits)).toEqual([]);
  });

  it("accounts for tickets the customer already holds", () => {
    // Limit 5, holds 4, so the basket may only carry 1.
    expect(overLimitLines([{ competitionId: "c", quantity: 3 }], limits)).toEqual([
      { competitionId: "c", title: undefined, from: 3, to: 1 },
    ]);
  });

  it("checks every line, not just the first", () => {
    const over = overLimitLines(
      [
        { competitionId: "b", quantity: 50 },
        { competitionId: "a", quantity: 9 },
      ],
      limits,
    );
    expect(over.map((line) => line.competitionId)).toEqual(["a"]);
  });
});
