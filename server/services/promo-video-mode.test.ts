import { afterEach, describe, expect, it, vi } from "vitest";

describe("promo-video-mode", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
    vi.resetModules();
  });

  async function load() {
    return import("./promo-video-mode-env");
  }

  it("is off unless PROMO_VIDEO_MODE=true", async () => {
    process.env.PROMO_VIDEO_MODE = "false";
    process.env.APP_URL = "https://ringtonericheslive-staging.up.railway.app";
    const mod = await load();
    expect(mod.isPromoVideoModeEnabled()).toBe(false);
  });

  it("enables on staging host when flag is true", async () => {
    process.env.PROMO_VIDEO_MODE = "true";
    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://ringtonericheslive-staging.up.railway.app";
    const mod = await load();
    expect(mod.isPromoVideoModeEnabled()).toBe(true);
  });

  it("never enables on live production domain even with flag", async () => {
    process.env.PROMO_VIDEO_MODE = "true";
    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://www.ringtoneriches.co.uk";
    const mod = await load();
    expect(mod.isPromoVideoModeEnabled()).toBe(false);
  });

  it("enables in local development when flag is true", async () => {
    process.env.PROMO_VIDEO_MODE = "true";
    process.env.NODE_ENV = "development";
    delete process.env.APP_URL;
    const mod = await load();
    expect(mod.isPromoVideoModeEnabled()).toBe(true);
  });
});
