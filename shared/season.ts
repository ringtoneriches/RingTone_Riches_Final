/**
 * Which seasonal skin the site is wearing.
 *
 * Shared because the server decides this now — an admin picks the season in
 * the panel and every visitor gets the same answer — while the client still
 * needs the class names and the preview override. Both sides reading one file
 * is what stops them drifting apart.
 *
 * Kept pure and free of React so the windows are covered by tests: getting
 * these wrong means the site is dressed for Halloween in March.
 *
 * A season is a closed range of calendar days, compared without years so the
 * same window works every year. Ranges that cross new year are supported.
 */

export type Season = "halloween" | "christmas";

/**
 * What the admin panel stores. "off" is the default and means the normal
 * site; "auto" follows the calendar windows below, so a season arrives on its
 * own next year without anyone remembering.
 */
export type SeasonSetting = "off" | "auto" | Season;

export const SEASON_SETTINGS: SeasonSetting[] = ["off", "auto", "halloween", "christmas"];

/** Labels for the admin panel, kept next to the values they describe. */
export const SEASON_SETTING_LABELS: Record<SeasonSetting, string> = {
  off: "Default theme",
  auto: "Automatic (follow the calendar)",
  halloween: "Halloween",
  christmas: "Christmas",
};

/** Narrows anything stored or posted to a setting we actually support. */
export function parseSeasonSetting(value: unknown): SeasonSetting | null {
  const candidate = typeof value === "string" ? value.trim().toLowerCase() : "";
  return (SEASON_SETTINGS as string[]).includes(candidate)
    ? (candidate as SeasonSetting)
    : null;
}

/**
 * The season an admin's choice produces on a given date.
 *
 * Only "auto" consults the calendar. A named season stays on until someone
 * changes it, which is what makes the panel the authority rather than a hint.
 */
export function seasonFromSetting(setting: SeasonSetting, date: Date): Season | null {
  if (setting === "off") return null;
  if (setting === "auto") return seasonFor(date);
  return setting;
}

type SeasonWindow = {
  season: Season;
  /** [month (1-12), day] inclusive */
  from: [number, number];
  to: [number, number];
};

/**
 * Ordered by priority: the first match wins, so overlapping windows are
 * resolved predictably rather than by whichever happens to be checked first.
 */
const WINDOWS: SeasonWindow[] = [
  // Through to the 2nd so the morning after Halloween still feels like it.
  { season: "halloween", from: [10, 1], to: [11, 2] },
  // Crosses new year, which is why the wrap case below exists.
  { season: "christmas", from: [12, 1], to: [1, 2] },
];

/** Day of year as a comparable number: 10-31 becomes 1031. */
function stamp(month: number, day: number) {
  return month * 100 + day;
}

function withinWindow(window: SeasonWindow, month: number, day: number) {
  const now = stamp(month, day);
  const from = stamp(...window.from);
  const to = stamp(...window.to);

  // A window that ends before it starts has wrapped around new year, so it
  // matches either side of the boundary instead of between the two values.
  return from <= to ? now >= from && now <= to : now >= from || now <= to;
}

/**
 * The season for a given date, or null outside every window.
 *
 * `override` wins outright, so a season can be previewed or forced on out of
 * season. "none" forces the normal look, which is how you turn a season off
 * early without shipping a code change.
 */
export function seasonFor(date: Date, override?: string | null): Season | null {
  const forced = normaliseOverride(override);
  if (forced !== undefined) return forced;

  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const window of WINDOWS) {
    if (withinWindow(window, month, day)) return window.season;
  }
  return null;
}

/**
 * Reads an override, returning undefined when there isn't a usable one so the
 * caller can tell "no override" apart from "forced off".
 */
export function normaliseOverride(override?: string | null): Season | null | undefined {
  const value = override?.trim().toLowerCase();
  if (!value) return undefined;
  if (value === "none" || value === "off") return null;
  if (value === "halloween" || value === "christmas") return value;
  return undefined; // anything unrecognised is ignored rather than trusted
}

/** The class that carries a season's skin on <html>. */
export function seasonClass(season: Season | null) {
  return season ? `rr-season-${season}` : "";
}

export const SEASON_CLASSES = ["rr-season-halloween", "rr-season-christmas"];

/** Where a manual override is kept, so it survives a reload while testing. */
export const SEASON_OVERRIDE_KEY = "rr-season";

export function readSeasonOverride(): string | null {
  try {
    // A query string wins over stored state, so a link can show someone the
    // seasonal look without them changing anything.
    const fromUrl = new URLSearchParams(window.location.search).get("season");
    if (fromUrl) return fromUrl;
    return window.localStorage.getItem(SEASON_OVERRIDE_KEY);
  } catch {
    // Private windows and blocked storage: fall back to the calendar.
    return null;
  }
}
