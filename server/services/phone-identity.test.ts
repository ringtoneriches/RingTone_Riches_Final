import { describe, expect, it } from "vitest";
import { PHONE_MATCH_KEY_SQL, phoneMatchKey, samePhone } from "./phone-identity";

describe("phoneMatchKey", () => {
  it("sees through every format the signup field accepts", () => {
    // The field allows + digits spaces dashes brackets, so one line can be
    // typed many ways. All of these are the same number.
    const forms = [
      "07359126899",
      "+447359126899",
      "+44 7359 126899",
      "0044 7359 126899",
      "447359126899",
      "(07359) 126899",
      "07359-126-899",
      "  07359126899  ",
    ];
    const keys = forms.map(phoneMatchKey);
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toBe("359126899");
  });

  it("does not confuse two numbers that differ by one digit", () => {
    // The real pair: three accounts on ...899, two more on ...898.
    expect(phoneMatchKey("07359126899")).not.toBe(phoneMatchKey("07359126898"));
  });

  it("returns null when there is nothing to compare", () => {
    // Null must mean "cannot tell", so that short or empty values do not all
    // collide with each other and lock out genuine signups.
    expect(phoneMatchKey("")).toBeNull();
    expect(phoneMatchKey(null)).toBeNull();
    expect(phoneMatchKey(undefined)).toBeNull();
    expect(phoneMatchKey("12345")).toBeNull();
    expect(phoneMatchKey("+44")).toBeNull();
    expect(phoneMatchKey("not a phone")).toBeNull();
  });

  it("takes the last nine digits once there are enough", () => {
    expect(phoneMatchKey("123456789")).toBe("123456789");
    expect(phoneMatchKey("0123456789")).toBe("123456789");
  });
});

describe("samePhone", () => {
  it("matches the duplicate accounts that prompted this", () => {
    expect(samePhone("07359126899", "+44 7359 126899")).toBe(true);
    expect(samePhone("+44 7348 683233", "07348683233")).toBe(true);
  });

  it("separates different lines", () => {
    expect(samePhone("07359126899", "07359126898")).toBe(false);
    expect(samePhone("07938460814", "07348683233")).toBe(false);
  });

  it("never matches on an unusable number", () => {
    // Two users who both left it blank are not the same person.
    expect(samePhone("", "")).toBe(false);
    expect(samePhone(null, null)).toBe(false);
    expect(samePhone("123", "123")).toBe(false);
  });
});

describe("PHONE_MATCH_KEY_SQL", () => {
  it("is the expression the migration indexes", () => {
    // If this is edited, migrations/0031_users_phone_match_key.sql has to be
    // re-created to match, or the lookup silently stops using the index.
    expect(PHONE_MATCH_KEY_SQL).toBe(
      `RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 9)`
    );
  });

  it("keeps the same digit count as the TypeScript key", () => {
    const n = Number(PHONE_MATCH_KEY_SQL.match(/,\s*(\d+)\)$/)?.[1]);
    expect(n).toBe(phoneMatchKey("07359126899")!.length);
  });
});
