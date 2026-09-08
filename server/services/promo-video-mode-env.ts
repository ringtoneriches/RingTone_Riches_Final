function hostHints(): string {
  return [
    process.env.APP_URL,
    process.env.SITE_URL,
    process.env.PUBLIC_APP_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN,
    process.env.RAILWAY_STATIC_URL,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** True on staging Railway, staging URLs, or local dev — never on live customer domain. */
export function isPromoVideoStagingHost(): boolean {
  const hints = hostHints();
  if (hints.includes("staging")) return true;
  if (process.env.RAILWAY_ENVIRONMENT?.toLowerCase() === "staging") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export function isPromoVideoProductionBlocked(): boolean {
  const hints = hostHints();
  const liveDomain =
    hints.includes("ringtoneriches.co.uk") || hints.includes("www.ringtoneriches");
  return liveDomain && !hints.includes("staging");
}

/** Staging-only promo filming: every controlled-pool ticket plays as the top jackpot. */
export function isPromoVideoModeEnabled(): boolean {
  if (process.env.PROMO_VIDEO_MODE !== "true") return false;
  if (isPromoVideoProductionBlocked()) return false;
  return isPromoVideoStagingHost();
}

export function getPromoVideoModeStatus() {
  return {
    enabled: isPromoVideoModeEnabled(),
    envFlag: process.env.PROMO_VIDEO_MODE === "true",
    stagingHost: isPromoVideoStagingHost(),
    productionBlocked: isPromoVideoProductionBlocked(),
    hostHints: hostHints() || "(none set)",
  };
}
