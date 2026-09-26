import { useEffect, useRef, useState } from "react";
import { useSeason } from "@/hooks/useSeason";
import HalloweenHouse from "./HalloweenHouse";

/**
 * The street.
 *
 * A long page is a scroll; a street is a journey. The difference is knowing
 * where you are on it, so each section gets a house on the verge and the path
 * between them lights up behind you as you pass.
 *
 * It is a shop, not a game, so nothing here asks to be played and nothing
 * gates the content. The houses sit in the outer margin, behind everything,
 * and the only feedback is a house lighting up as you reach it.
 *
 * Positions are measured rather than assumed. Sections are not evenly spaced,
 * and guessing put a bat in the middle of the competitions grid once already.
 */
export default function HalloweenStreet() {
  const { season } = useSeason();
  const [stops, setStops] = useState<number[]>([]);
  const [reached, setReached] = useState(0);
  const [walking, setWalking] = useState(false);
  const pathRef = useRef<HTMLDivElement>(null);

  // Where the houses stand.
  useEffect(() => {
    if (season !== "halloween") return;

    const measure = () => {
      const wrapper = document.querySelector(".rr-page-sections");
      if (!wrapper) return;
      const sections = Array.from(wrapper.children).filter(
        (el): el is HTMLElement =>
          el.tagName === "SECTION" && (el as HTMLElement).offsetHeight > 200,
      );
      // Skip the first: it sits under the hero, where the painted sky already
      // has plenty going on.
      setStops(sections.slice(1).map((el) => el.offsetTop));
    };

    measure();
    const settle = window.setTimeout(measure, 1200);
    window.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("load", measure);
      window.removeEventListener("resize", measure);
    };
  }, [season]);

  // How far down the street the reader has walked.
  useEffect(() => {
    if (season !== "halloween" || !stops.length) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      // A house counts as reached once it is a little above the middle of the
      // screen, which is roughly when you are level with it.
      const line = window.scrollY + window.innerHeight * 0.62;
      let passed = 0;
      for (const stop of stops) if (line >= stop) passed += 1;
      setReached(passed);
      // The first house sits just below the hero, so it counts as reached
      // before anyone has scrolled. Do not announce the walk until they
      // have actually started it.
      setWalking(window.scrollY > window.innerHeight * 0.5);

      // The path fills to wherever the reader has got to.
      const last = stops[stops.length - 1];
      const first = stops[0];
      const span = Math.max(1, last - first);
      const progress = Math.min(1, Math.max(0, (line - first) / span));
      pathRef.current?.style.setProperty("--rr-street-progress", String(progress));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [season, stops]);

  if (season !== "halloween" || stops.length < 2) return null;

  const first = stops[0];
  const last = stops[stops.length - 1];

  return (
    <>
      {/* The path itself: a faint lane down the verge that fills behind you. */}
      <div
        ref={pathRef}
        className="rr-hw-street-path"
        style={{ top: first, height: Math.max(0, last - first) }}
        aria-hidden
      />

      {stops.map((top, i) => (
        <div key={i} className="rr-hw-street-stop" style={{ top }} aria-hidden>
          <HalloweenHouse variant={i} lit={i < reached} />
        </div>
      ))}

      {/* Where you are on the street. Deliberately quiet — it is a shop, and
          this is a detail you notice rather than a score you chase. */}
      <div
        className={`rr-hw-street-marker ${walking ? "is-walking" : ""}`}
        aria-hidden
        data-testid="halloween-street-progress"
      >
        <span className="rr-hw-street-marker-dot" />
        {Math.min(reached, stops.length)} of {stops.length} houses
      </div>
    </>
  );
}
