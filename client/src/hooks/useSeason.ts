import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SEASON_CLASSES,
  normaliseOverride,
  readSeasonOverride,
  seasonClass,
  type Season,
  type SeasonSetting,
} from "@shared/season";

/**
 * The season the site is currently wearing.
 *
 * The answer comes from the server, not the browser's clock: an admin chooses
 * it in the panel and every visitor has to see the same thing. A machine with
 * the wrong date should not get a different site.
 *
 * Reading the season and applying it are deliberately separate. Several
 * components need to know the season, but only one may own the class on
 * <html> — when every caller applied it, the first component to unmount took
 * the class away with it, so leaving the home page stripped the theme off the
 * rest of the site. useSeasonTheme is therefore called once, in App.
 */

type SeasonResponse = { season: Season | null; setting: SeasonSetting };

export function useSeason() {
  const { data } = useQuery<SeasonResponse>({
    queryKey: ["/api/season"],
    // The season changes when an admin changes it, which is rare. Long enough
    // to stay out of the way, short enough that a switch reaches open tabs.
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    // A failure here must never stop the page rendering; the site simply
    // stays on its normal theme.
    retry: 1,
  });

  // ?season=halloween previews one without changing anything for anyone else,
  // and ?season=none shows the normal site. Ignored unless it names a season
  // we actually have, since it is untrusted input from a URL.
  const preview = normaliseOverride(readSeasonOverride());
  const season = preview !== undefined ? preview : data?.season ?? null;

  return { season, isSeasonal: season !== null, setting: data?.setting ?? "off" };
}

/**
 * Puts the season's class on <html>, and takes it off again.
 *
 * On <html> rather than a wrapper for the same reason the admin theme is:
 * Radix renders dialogs, selects and toasts into portals at the end of <body>,
 * which a wrapper would never reach.
 *
 * Call this in exactly one place. Read the season anywhere with useSeason.
 */
export function useSeasonTheme() {
  const { season } = useSeason();

  useEffect(() => {
    const root = document.documentElement;
    // Clear every season before adding one, so switching never leaves two on.
    root.classList.remove(...SEASON_CLASSES);
    const next = seasonClass(season);
    if (next) root.classList.add(next);
    return () => root.classList.remove(...SEASON_CLASSES);
  }, [season]);

  return season;
}
