import { useEffect, useState } from "react";

export type CountdownParts = { d: number; h: number; m: number; s: number };

const ZERO: CountdownParts = { d: 0, h: 0, m: 0, s: 0 };

function endKey(endDate: Date | string | number | null | undefined): string | number | null {
  if (endDate == null || endDate === "") return null;
  if (typeof endDate === "number") return Number.isNaN(endDate) ? null : endDate;
  if (typeof endDate === "string") return endDate;
  const ms = endDate.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function toMs(endDate: Date | string | number): number | null {
  const ms = typeof endDate === "number" ? endDate : new Date(endDate).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function partsFromMs(endMs: number): CountdownParts {
  const diff = Math.max(0, endMs - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export function useCountdown(endDate: Date | string | number | null | undefined): CountdownParts {
  const key = endKey(endDate);
  const [time, setTime] = useState<CountdownParts>(ZERO);

  useEffect(() => {
    if (key == null) {
      setTime((prev) => (prev === ZERO || (prev.d === 0 && prev.h === 0 && prev.m === 0 && prev.s === 0) ? prev : ZERO));
      return;
    }

    const endMs = toMs(key);
    if (endMs == null) return;

    const tick = () => {
      const next = partsFromMs(endMs);
      setTime((prev) =>
        prev.d === next.d && prev.h === next.h && prev.m === next.m && prev.s === next.s ? prev : next
      );
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [key]);

  return time;
}
