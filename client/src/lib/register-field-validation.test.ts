import { describe, expect, it } from "vitest";
import { validateRegisterNameField } from "./register-field-validation";

describe("validateRegisterNameField", () => {
  it("accepts common 8+ letter first names blocked by old bot heuristics", () => {
    for (const name of ["Muhammad", "Mohammed", "Christopher", "Jonathan", "Elizabeth"]) {
      expect(validateRegisterNameField(name, "First name")).toBeNull();
    }
  });

  it("accepts typical valid names", () => {
    for (const name of ["Ali", "Ahmed", "Tayyab", "Mary-Jane", "O'Brien", "Anne Marie"]) {
      expect(validateRegisterNameField(name, "First name")).toBeNull();
    }
  });

  it("rejects names that are too short or invalid", () => {
    expect(validateRegisterNameField("J", "First name")).toMatch(/at least 2 letters/);
    expect(validateRegisterNameField("José", "First name")).toMatch(/invalid characters/);
    expect(validateRegisterNameField("https://spam.test", "First name")).toMatch(/invalid characters/);
  });

  it("rejects names over 50 characters", () => {
    expect(validateRegisterNameField("A".repeat(51), "Last name")).toMatch(/too long/);
  });

  it("returns null for empty values (required check is separate)", () => {
    expect(validateRegisterNameField("", "First name")).toBeNull();
    expect(validateRegisterNameField("   ", "Last name")).toBeNull();
  });
});
