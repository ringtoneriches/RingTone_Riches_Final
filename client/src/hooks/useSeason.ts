import { useEffect, useState } from "react";
import {
  SEASON_CLASSES,
  readSeasonOverride,
  seasonClass,
  seasonFor,
  type Season,
} from "@/lib/season";

/**
 * The season the site is currently wearing, and the <html> class that carries
 * it.
 *
 * The class goes on <html> rather than a wrapper for the same reason the admin
 * theme does: Radix renders dialogs, selects and toasts into portals at the
 * end of <body>, and anything scoped to a wrapper would miss them.
 *
 * The date is re-checked periodically rather than only at mount. A shop like
 * this has sessions left open overnight, and the season should turn over on
 * its own instead of waiting for a reload — 31 October is exactly the night
 * that matters.
 */

const RECHECK_MS = 10 * 60 * 1000;

function currentSeason() {
  return seasonFor(new Date(), readSeasonOverride());
}

export function useSeason() {
  const [season, setSeason] = useState<Season | null>(() => {
    // Guard against SSR and any non-browser render path.
    if (typeof window === "undefined") return null;
    return currentSeason();
  });

  useEffect(() => {
    const tick = () => setSeason(currentSeason());
    tick();
    const timer = window.setInterval(tick, RECHECK_MS);
    // A machine waking from sleep can cross midnight without a timer firing.
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // Remove every season before adding one, so switching never leaves two on.
    root.classList.remove(...SEASON_CLASSES);
    const next = seasonClass(season);
    if (next) root.classList.add(next);
    return () => root.classList.remove(...SEASON_CLASSES);
  }, [season]);

  return { season, isSeasonal: season !== null };
}
