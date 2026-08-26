export function apiErrorMessage(error: unknown, fallback = "Something went wrong") {
  const raw = error instanceof Error ? error.message : String(error || "");
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart));
      return parsed.message || parsed.error || fallback;
    } catch {
      /* keep raw */
    }
  }
  const stripped = raw.replace(/^\d+:\s*/, "").trim();
  return stripped || fallback;
}
