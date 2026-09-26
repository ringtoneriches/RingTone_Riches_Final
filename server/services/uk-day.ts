const UK_TIME_ZONE = "Europe/London";

const ukClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function ukWallClock(instant: Date) {
  const parts = ukClock.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
    second: part("second"),
  };
}

/** How far UK time is ahead of UTC at `instant` (0 in winter, 1h during BST). */
function ukOffsetMs(instant: Date) {
  const c = ukWallClock(instant);
  const wallAsUtc = Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second);
  return wallAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The instant the current UK calendar day began (00:00 Europe/London), as a UTC Date.
 * The offset is re-read at midnight itself, so clock-change days resolve correctly.
 */
export function ukDayStart(now: Date = new Date()): Date {
  const c = ukWallClock(now);
  const midnightAsUtc = Date.UTC(c.year, c.month - 1, c.day);
  const guess = new Date(midnightAsUtc - ukOffsetMs(now));
  return new Date(midnightAsUtc - ukOffsetMs(guess));
}

/**
 * The instant the NEXT UK calendar day begins, as a UTC Date.
 *
 * Used for the daily spin countdown. Not simply "+24 hours": a UK day is 23 or
 * 25 hours long on clock-change days. Stepping 36 hours forward always lands
 * somewhere inside tomorrow, and ukDayStart then snaps back to its midnight.
 */
export function ukNextDayStart(now: Date = new Date()): Date {
  const todayStart = ukDayStart(now);
  return ukDayStart(new Date(todayStart.getTime() + 36 * 60 * 60 * 1000));
}

/**
 * The UK calendar date at `instant`, as YYYY-MM-DD.
 *
 * Used as the "one per day" key for the daily spin. It must be the UK date, not
 * the UTC one: during BST, 00:30 UK is still 23:30 UTC the previous day, so a
 * UTC key would let someone spin twice in one British evening.
 */
export function ukDateString(now: Date = new Date()): string {
  const c = ukWallClock(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${c.year}-${pad(c.month)}-${pad(c.day)}`;
}

/**
 * The instant the current UK week began — Monday 00:00 Europe/London — as a
 * UTC Date.
 *
 * A UTC week boundary is not good enough here. During British Summer Time,
 * Monday 00:00 in London is 23:00 on Sunday UTC, so a referral that qualified
 * in that hour would be counted in the previous week and could hand the
 * weekly prize to the wrong person.
 *
 * Stepping back a day at a time and re-reading the UK weekday keeps this
 * correct across clock changes, where a day is 23 or 25 hours long.
 */
export function ukWeekStart(now: Date = new Date()): Date {
  let start = ukDayStart(now);
  // Monday = 1 … Sunday = 0 in UTC terms, read at UK midnight.
  for (let i = 0; i < 7; i++) {
    const c = ukWallClock(start);
    const weekday = new Date(Date.UTC(c.year, c.month - 1, c.day)).getUTCDay();
    if (weekday === 1) return start;
    // Back up well past midnight, then snap to that day's UK start.
    start = ukDayStart(new Date(start.getTime() - 12 * 60 * 60 * 1000));
  }
  return start;
}

/** The instant the NEXT UK week begins, as a UTC Date. */
export function ukNextWeekStart(now: Date = new Date()): Date {
  const start = ukWeekStart(now);
  // 7 days plus slack, then snap back — a week can be 167 or 169 hours.
  return ukWeekStart(new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000));
}

/** The UK Monday that `instant` belongs to, as YYYY-MM-DD. */
export function ukWeekKey(now: Date = new Date()): string {
  return ukDateString(ukWeekStart(now));
}
