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
