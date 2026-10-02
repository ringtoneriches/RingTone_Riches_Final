import { describe, it, expect } from "vitest";
import {
  shouldAttemptRecovery,
  selectRecoverable,
  RECOVERY_MIN_AGE_MINUTES,
  RECOVERY_MAX_AGE_HOURS,
} from "./payment-recovery";

const NOW = new Date("2026-10-02T12:00:00Z");
const minsAgo = (n: number) => new Date(NOW.getTime() - n * 60000);

const p = (over: Partial<{ id: string; status: string | null; createdAt: Date | string | null }> = {}) => ({
  id: "p1",
  status: "pending" as string | null,
  createdAt: minsAgo(10) as Date | string | null,
  ...over,
});

describe("shouldAttemptRecovery", () => {
  it("chases a pending payment that has gone quiet", () => {
    expect(shouldAttemptRecovery(p(), NOW)).toBe(true);
  });

  it("leaves a payment alone while the webhook is probably still coming", () => {
    expect(shouldAttemptRecovery(p({ createdAt: minsAgo(0.5) }), NOW)).toBe(false);
    expect(shouldAttemptRecovery(p({ createdAt: minsAgo(1) }), NOW)).toBe(false);
  });

  it("starts chasing exactly at the minimum age", () => {
    expect(shouldAttemptRecovery(p({ createdAt: minsAgo(RECOVERY_MIN_AGE_MINUTES) }), NOW)).toBe(true);
  });

  it("gives up on an abandoned checkout rather than re-reading history forever", () => {
    const tooOld = minsAgo(RECOVERY_MAX_AGE_HOURS * 60 + 1);
    expect(shouldAttemptRecovery(p({ createdAt: tooOld }), NOW)).toBe(false);
  });

  it("ignores anything already settled or failed", () => {
    expect(shouldAttemptRecovery(p({ status: "completed" }), NOW)).toBe(false);
    expect(shouldAttemptRecovery(p({ status: "failed" }), NOW)).toBe(false);
    expect(shouldAttemptRecovery(p({ status: null }), NOW)).toBe(false);
  });

  it("does not chase a row with a missing or unreadable timestamp", () => {
    expect(shouldAttemptRecovery(p({ createdAt: null }), NOW)).toBe(false);
    expect(shouldAttemptRecovery(p({ createdAt: "not a date" }), NOW)).toBe(false);
  });

  it("accepts a timestamp that arrived as a string", () => {
    expect(shouldAttemptRecovery(p({ createdAt: minsAgo(10).toISOString() }), NOW)).toBe(true);
  });

  it("honours custom bounds", () => {
    const young = p({ createdAt: minsAgo(3) });
    expect(shouldAttemptRecovery(young, NOW, { minAgeMinutes: 5 })).toBe(false);
  });
});

describe("selectRecoverable", () => {
  it("returns the oldest first so a backlog drains in order", () => {
    const rows = [
      p({ id: "new", createdAt: minsAgo(3) }),
      p({ id: "oldest", createdAt: minsAgo(90) }),
      p({ id: "middle", createdAt: minsAgo(30) }),
    ];
    expect(selectRecoverable(rows, NOW).map((r) => r.id)).toEqual(["oldest", "middle", "new"]);
  });

  it("filters out everything not due", () => {
    const rows = [
      p({ id: "due", createdAt: minsAgo(10) }),
      p({ id: "tooYoung", createdAt: minsAgo(0.2) }),
      p({ id: "settled", status: "completed" }),
      p({ id: "ancient", createdAt: minsAgo(RECOVERY_MAX_AGE_HOURS * 60 + 60) }),
    ];
    expect(selectRecoverable(rows, NOW).map((r) => r.id)).toEqual(["due"]);
  });

  it("caps how many it takes in one pass", () => {
    const rows = Array.from({ length: 100 }, (_, i) => p({ id: `p${i}`, createdAt: minsAgo(10 + i) }));
    expect(selectRecoverable(rows, NOW)).toHaveLength(25);
    expect(selectRecoverable(rows, NOW, { limit: 5 })).toHaveLength(5);
  });

  it("returns nothing when there is nothing to do", () => {
    expect(selectRecoverable([], NOW)).toEqual([]);
  });
});
