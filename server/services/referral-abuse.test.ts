import { describe, expect, it } from "vitest";
import {
  assessReferral,
  normaliseEmail,
  normalisePhone,
  pickWeeklyWinners,
  weekStartFor,
} from "./referral-abuse";

const person = (over: Partial<Parameters<typeof assessReferral>[0]> = {}) => ({
  id: "u1",
  email: "alice@example.com",
  phoneNumber: "07700900001",
  firstName: "Alice",
  lastName: "Smith",
  ips: ["1.1.1.1"],
  cardFingerprints: ["card-a"],
  ...over,
});

describe("normaliseEmail", () => {
  it("strips sub-addressing, which is the usual way round a unique email", () => {
    expect(normaliseEmail("john+1@gmail.com")).toBe("john@gmail.com");
    expect(normaliseEmail("john+anything@outlook.com")).toBe("john@outlook.com");
  });

  it("ignores dots only for Google, who ignore them", () => {
    expect(normaliseEmail("j.o.h.n@gmail.com")).toBe("john@gmail.com");
    expect(normaliseEmail("j.o.h.n@outlook.com")).toBe("j.o.h.n@outlook.com");
  });

  it("treats googlemail as gmail", () => {
    expect(normaliseEmail("john@googlemail.com")).toBe("john@gmail.com");
  });

  it("is case and whitespace insensitive", () => {
    expect(normaliseEmail("  JOHN@Example.COM ")).toBe("john@example.com");
  });

  it("survives nonsense without throwing", () => {
    expect(normaliseEmail(null)).toBe("");
    expect(normaliseEmail("not-an-email")).toBe("not-an-email");
  });
});

describe("normalisePhone", () => {
  it("treats every way of writing a UK mobile as the same number", () => {
    const forms = ["07700 900123", "+447700900123", "00447700900123", "7700900123"];
    const normalised = forms.map(normalisePhone);
    expect(new Set(normalised).size).toBe(1);
  });

  it("returns empty for nothing", () => {
    expect(normalisePhone(null)).toBe("");
    expect(normalisePhone("")).toBe("");
  });
});

describe("assessReferral — things that cannot innocently happen", () => {
  it("blocks referring yourself", () => {
    const me = person();
    expect(assessReferral(me, { ...me }).decision).toBe("block");
  });

  it("blocks the same inbox behind different addresses", () => {
    const a = person({ email: "john@gmail.com" });
    const b = person({ id: "u2", email: "j.ohn+bonus@gmail.com", phoneNumber: "07700900002" });
    const v = assessReferral(a, b);
    expect(v.decision).toBe("block");
    expect(v.signals).toContain("same_email");
  });

  it("blocks the same mobile written differently", () => {
    const a = person({ phoneNumber: "07700900123" });
    const b = person({ id: "u2", email: "b@example.com", phoneNumber: "+44 7700 900123" });
    expect(assessReferral(a, b).decision).toBe("block");
  });

  it("blocks both accounts topping up with the same card", () => {
    const a = person({ cardFingerprints: ["fp-1"] });
    const b = person({ id: "u2", email: "b@example.com", phoneNumber: "07700900002", cardFingerprints: ["fp-1"] });
    const v = assessReferral(a, b);
    expect(v.decision).toBe("block");
    expect(v.signals).toContain("same_card");
  });
});

describe("assessReferral — things that can", () => {
  const other = (over = {}) => person({
    id: "u2", email: "bob@example.com", phoneNumber: "07700900002",
    firstName: "Bob", lastName: "Jones", cardFingerprints: ["card-b"], ...over,
  });

  it("allows two ordinary customers", () => {
    expect(assessReferral(person(), other()).decision).toBe("allow");
  });

  it("does not block a shared IP on its own — UK mobile networks share them", () => {
    const v = assessReferral(person(), other({ ips: ["1.1.1.1"] }));
    expect(v.decision).toBe("allow");
    expect(v.signals).toContain("shared_ip");
  });

  it("flags a shared IP combined with a missing phone", () => {
    const v = assessReferral(person(), other({ ips: ["1.1.1.1"], phoneNumber: null }), {
      requirePhone: true,
    });
    expect(v.decision).toBe("flag");
    expect(v.signals).toEqual(expect.arrayContaining(["shared_ip", "no_phone"]));
  });

  it("flags rather than blocks a shared name — families exist", () => {
    const v = assessReferral(person(), other({ firstName: "Alice", lastName: "Smith" }));
    expect(v.decision).toBe("flag");
    expect(v.signals).toContain("same_name");
  });

  it("never blocks on soft signals alone", () => {
    const v = assessReferral(person(), other({ ips: ["1.1.1.1"], firstName: "Alice", lastName: "Smith" }));
    expect(v.decision).not.toBe("block");
  });
});

describe("weekStartFor", () => {
  it("returns the Monday of that week", () => {
    expect(weekStartFor(new Date("2026-09-24T12:00:00Z"))).toBe("2026-09-21");
    expect(weekStartFor(new Date("2026-09-21T00:00:00Z"))).toBe("2026-09-21");
  });

  it("puts Sunday in the week that started the Monday before", () => {
    expect(weekStartFor(new Date("2026-09-27T23:59:00Z"))).toBe("2026-09-21");
    expect(weekStartFor(new Date("2026-09-28T00:00:00Z"))).toBe("2026-09-28");
  });
});

describe("pickWeeklyWinners", () => {
  const counts = [
    { userId: "a", referrals: 5 },
    { userId: "b", referrals: 5 },
    { userId: "c", referrals: 2 },
  ];

  it("pays everyone on the top score, rather than splitting it", () => {
    expect(pickWeeklyWinners(counts, 1).map((w) => w.userId)).toEqual(["a", "b"]);
  });

  it("respects the minimum, so a quiet week pays nobody", () => {
    expect(pickWeeklyWinners([{ userId: "c", referrals: 2 }], 3)).toEqual([]);
  });

  it("returns nothing when there were no referrals at all", () => {
    expect(pickWeeklyWinners([], 1)).toEqual([]);
  });

  it("never pays on zero, whatever the minimum is set to", () => {
    expect(pickWeeklyWinners([{ userId: "a", referrals: 0 }], 0)).toEqual([]);
  });
});
