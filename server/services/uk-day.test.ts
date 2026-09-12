import { describe, expect, it } from "vitest";
import { ukDayStart } from "./uk-day";

const start = (iso: string) => ukDayStart(new Date(iso)).toISOString();

describe("ukDayStart", () => {
  it("uses 23:00 UTC the previous evening during BST", () => {
    expect(start("2026-09-11T12:55:51Z")).toBe("2026-09-10T23:00:00.000Z");
  });

  it("uses 00:00 UTC in winter (GMT)", () => {
    expect(start("2026-12-15T10:00:00Z")).toBe("2026-12-15T00:00:00.000Z");
  });

  it("rolls over at UK midnight, not UTC midnight", () => {
    // 00:30 UK on 11 Sep is still 10 Sep in UTC
    expect(start("2026-09-10T23:30:00Z")).toBe("2026-09-10T23:00:00.000Z");
    // 23:59:59 UK on 10 Sep belongs to the 10 Sep UK day
    expect(start("2026-09-10T22:59:59Z")).toBe("2026-09-09T23:00:00.000Z");
  });

  it("handles the day the clocks go forward (29 Mar 2026)", () => {
    // Midnight was still GMT; by noon it is BST
    expect(start("2026-03-29T12:00:00Z")).toBe("2026-03-29T00:00:00.000Z");
  });

  it("handles the day the clocks go back (25 Oct 2026)", () => {
    // Midnight was still BST; by noon it is GMT
    expect(start("2026-10-25T12:00:00Z")).toBe("2026-10-24T23:00:00.000Z");
  });
});
