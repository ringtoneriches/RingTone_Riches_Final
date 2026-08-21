import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";

export type SiteTheme = "night" | "day";

const STORAGE_KEY = "rr-theme";
const EVENT = "rr-theme-change";

function isLockedRoute(path: string) {
  return /^(?:\/admin|\/competition|\/wallet|\/account|\/spin|\/scratch|\/pop|\/plinko|\/voltz|\/slot|\/royal|\/play|\/checkout|\/guest-billing|\/notifications)/.test(
    path
  );
}

function readTheme(): SiteTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "day" || stored === "night") return stored;
  } catch {
    /* ignore */
  }
  return "night";
}

export function useSiteTheme() {
  const [location] = useLocation();
  const [theme, setTheme] = useState<SiteTheme>(readTheme);

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const locked = isLockedRoute(location);
  const effective: SiteTheme = locked ? "night" : theme;

  useEffect(() => {
    document.documentElement.classList.toggle("rr-day", effective === "day");
  }, [effective]);

  const toggle = useCallback(() => {
    const next: SiteTheme = readTheme() === "day" ? "night" : "day";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setTheme(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { theme, effective, toggle, locked };
}
