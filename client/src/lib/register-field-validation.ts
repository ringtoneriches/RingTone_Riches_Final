/** Matches server-side name rules in registerUserSchema / validateFieldContent. */
export const ALLOWED_NAME_CHARS = /^[a-zA-Z\s\-'., ]+$/;

export function validateRegisterNameField(
  value: string,
  fieldName: "First name" | "Last name",
): string | null {
  if (!value || value.trim().length === 0) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length > 50) {
    return `${fieldName} is too long (maximum 50 characters)`;
  }

  if (!ALLOWED_NAME_CHARS.test(trimmed)) {
    return `${fieldName} contains invalid characters (only letters, spaces, hyphens, and apostrophes allowed)`;
  }

  const letters = trimmed.match(/[a-zA-Z]/g) || [];
  if (letters.length < 2) {
    return `${fieldName} must contain at least 2 letters`;
  }

  return null;
}
