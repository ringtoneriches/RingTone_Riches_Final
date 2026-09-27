import { useEffect, useState } from "react";
import { useSeason } from "@/hooks/useSeason";

/**
 * Which Halloween treatment to show, chosen from the URL.
 *
 * Deliberately not an admin setting. These are alternatives to look at and
 * argue about, not something to ship four of — once one is chosen the rest
 * come out and the winner becomes the theme.
 *
 *   ?hw=v1  the trail, over the painted graveyard
 *   ?hw=v2  the trail, over a drawn sky instead of a photograph
 *   ?hw=v3  lanterns instead of a trail
 *   ?hw=v4  no props at all — the descent
 *
 * Remembered for the session, so moving between pages does not drop it.
 *
 * Only ever applied while the site is actually wearing Halloween. The class
 * repaints the page — v2 replaces the backdrop, v4 darkens every section — so
 * left on out of season it would follow a visitor around a site that is not
 * supposed to be dark at all, for the rest of their session.
 */
export type HalloweenVariant = "v1" | "v2" | "v3" | "v4";

const VARIANTS: HalloweenVariant[] = ["v1", "v2", "v3", "v4"];
const KEY = "rr-hw-variant";
const DEFAULT: HalloweenVariant = "v1";

function readVariant(): HalloweenVariant {
  if (typeof window === "undefined") return DEFAULT;
  const asked = new URLSearchParams(window.location.search).get("hw");
  if (asked && VARIANTS.includes(asked as HalloweenVariant)) {
    try {
      window.sessionStorage.setItem(KEY, asked);
    } catch {
      /* Private browsing. The URL still works for this page. */
    }
    return asked as HalloweenVariant;
  }
  try {
    const saved = window.sessionStorage.getItem(KEY);
    if (saved && VARIANTS.includes(saved as HalloweenVariant)) {
      return saved as HalloweenVariant;
    }
  } catch {
    /* Ignore. */
  }
  return DEFAULT;
}

export function useHalloweenVariant(): HalloweenVariant {
  const { season } = useSeason();
  const [variant, setVariant] = useState<HalloweenVariant>(readVariant);

  useEffect(() => {
    const sync = () => setVariant(readVariant());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  // The class drives everything CSS-side, so a variant can restyle the page
  // without every component having to know which one is on.
  useEffect(() => {
    const root = document.documentElement;
    VARIANTS.forEach((v) => root.classList.remove(`rr-hw-${v}`));
    if (season !== "halloween") return;
    root.classList.add(`rr-hw-${variant}`);
    return () => root.classList.remove(`rr-hw-${variant}`);
  }, [variant, season]);

  return variant;
}
