import { describe, expect, it } from "vitest";
import { normaliseOverride, seasonClass, seasonFor } from "./season";

const on = (iso: string) => new Date(`${iso}T12:00:00`);

describe("seasonFor", () => {
  it("has no season for most of the year", () => {
    expect(seasonFor(on("2026-03-15"))).toBeNull();
    expect(seasonFor(on("2026-07-04"))).toBeNull();
    expect(seasonFor(on("2026-09-30"))).toBeNull();
  });

  it("turns Halloween on for October", () => {
    expect(seasonFor(on("2026-10-01"))).toBe("halloween");
    expect(seasonFor(on("2026-10-31"))).toBe("halloween");
  });

  it("keeps Halloween through the morning after", () => {
    // Traffic on the 1st is still Halloween traffic; switching back overnight
    // reads as a bug to anyone who was on the site an hour earlier.
    expect(seasonFor(on("2026-11-01"))).toBe("halloween");
    expect(seasonFor(on("2026-11-02"))).toBe("halloween");
    expect(seasonFor(on("2026-11-03"))).toBeNull();
  });

  it("handles a window that crosses new year", () => {
    expect(seasonFor(on("2026-12-01"))).toBe("christmas");
    expect(seasonFor(on("2026-12-25"))).toBe("christmas");
    expect(seasonFor(on("2027-01-01"))).toBe("christmas");
    expect(seasonFor(on("2027-01-02"))).toBe("christmas");
    expect(seasonFor(on("2027-01-03"))).toBeNull();
  });

  it("works the same in any year", () => {
    expect(seasonFor(on("2029-10-15"))).toBe("halloween");
    expect(seasonFor(on("2031-10-15"))).toBe("halloween");
  });

  it("lets an override force a season out of season", () => {
    expect(seasonFor(on("2026-03-15"), "halloween")).toBe("halloween");
  });

  it("lets an override turn a season off early", () => {
    // How you end a season without shipping a code change.
    expect(seasonFor(on("2026-10-31"), "none")).toBeNull();
    expect(seasonFor(on("2026-10-31"), "off")).toBeNull();
  });

  it("ignores an override it does not recognise rather than trusting it", () => {
    // The value can come from a query string, so it is not trusted input.
    expect(seasonFor(on("2026-10-15"), "<script>")).toBe("halloween");
    expect(seasonFor(on("2026-03-15"), "easter")).toBeNull();
  });

  it("ignores blank and whitespace overrides", () => {
    expect(seasonFor(on("2026-03-15"), "")).toBeNull();
    expect(seasonFor(on("2026-03-15"), "   ")).toBeNull();
    expect(seasonFor(on("2026-10-15"), null)).toBe("halloween");
  });

  it("is not case sensitive about overrides", () => {
    expect(seasonFor(on("2026-03-15"), "Halloween")).toBe("halloween");
    expect(seasonFor(on("2026-10-15"), "NONE")).toBeNull();
  });
});

describe("normaliseOverride", () => {
  it("tells 'no override' apart from 'forced off'", () => {
    // undefined means fall back to the calendar; null means explicitly plain.
    expect(normaliseOverride(undefined)).toBeUndefined();
    expect(normaliseOverride("nonsense")).toBeUndefined();
    expect(normaliseOverride("none")).toBeNull();
  });
});

describe("seasonClass", () => {
  it("names the class the stylesheet hangs off", () => {
    expect(seasonClass("halloween")).toBe("rr-season-halloween");
  });

  it("is empty with no season, so nothing is added to <html>", () => {
    expect(seasonClass(null)).toBe("");
  });
});
