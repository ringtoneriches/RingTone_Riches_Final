import { useEffect, useMemo, useRef, useState } from "react";
import { useSeason } from "@/hooks/useSeason";
import HalloweenHouse from "./HalloweenHouse";

/**
 * The trail.
 *
 * A straight line down one margin was the timid version: it read as a
 * progress bar, not a path. A real track wanders. So this crosses the page —
 * down the left beside one section, across above the next, down the right
 * beside that one, back across — and every turn is a curve, because nothing
 * you would actually walk at night has right angles in it.
 *
 * Drawn as one SVG path over the whole page. The lit part is the same path
 * with a dash offset, which is how you animate a line being drawn: one
 * property, no geometry recalculated, composited by the browser.
 *
 * Houses stand at the bends, which is also where the eye goes on a curve.
 */

type Stop = { top: number; side: "left" | "right" };

export default function HalloweenTrail() {
  const { season } = useSeason();
  const [stops, setStops] = useState<Stop[]>([]);
  const [pageHeight, setPageHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [reached, setReached] = useState(0);
  const [walking, setWalking] = useState(false);
  const litRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (season !== "halloween") return;

    const measure = () => {
      const wrapper = document.querySelector(".rr-page-sections");
      if (!wrapper) return;
      const sections = Array.from(wrapper.children).filter(
        (el): el is HTMLElement =>
          el.tagName === "SECTION" && (el as HTMLElement).offsetHeight > 200,
      );
      // The first sits under the hero, where the sky is already busy.
      setStops(
        sections.slice(1).map((el, i) => ({
          top: el.offsetTop,
          side: i % 2 === 0 ? "left" : "right",
        })),
      );
      setPageHeight(document.documentElement.scrollHeight);
      setWidth(window.innerWidth);
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

  /**
   * The path itself.
   *
   * Between two stops the track leaves one margin, sweeps across, and arrives
   * at the other — so the horizontal move happens just above the next
   * section, which is where the eye is going anyway. Cubic curves with the
   * handles pushed well out, so it banks rather than zig-zags.
   */
  const { d, anchors } = useMemo(() => {
    if (stops.length < 2 || !width) return { d: "", anchors: [] as Array<{ x: number; y: number }> };

    // Inset from the edge. Tight on a phone, where there is no margin to
    // spare, and wider on a desktop where the content is already centred.
    const inset = width < 640 ? Math.max(26, width * 0.1) : Math.max(56, width * 0.075);
    const xFor = (side: "left" | "right") => (side === "left" ? inset : width - inset);

    const points = stops.map((s) => ({ x: xFor(s.side), y: s.top }));
    let path = `M ${points[0].x} ${Math.max(0, points[0].y - 220)}`;
    path += ` L ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const from = points[i - 1];
      const to = points[i];
      // Run down the margin, then bank across in the last stretch before the
      // next stop. Two thirds down, then the turn.
      const turnStart = from.y + (to.y - from.y) * 0.55;
      path += ` L ${from.x} ${turnStart}`;
      const sweep = (to.y - turnStart) * 0.6;
      path += ` C ${from.x} ${turnStart + sweep}, ${to.x} ${to.y - sweep}, ${to.x} ${to.y}`;
    }

    const last = points[points.length - 1];
    path += ` L ${last.x} ${last.y + 200}`;
    return { d: path, anchors: points };
  }, [stops, width]);

  // Draw the line in behind the reader, and light the houses passed.
  useEffect(() => {
    if (season !== "halloween" || !d) return;
    const line = litRef.current;
    if (!line) return;

    const total = line.getTotalLength();
    line.style.strokeDasharray = String(total);

    let frame = 0;
    const apply = () => {
      frame = 0;
      const eye = window.scrollY + window.innerHeight * 0.62;
      const first = stops[0].top;
      const last = stops[stops.length - 1].top;
      const progress = Math.min(1, Math.max(0, (eye - (first - 220)) / Math.max(1, last + 200 - (first - 220))));
      line.style.strokeDashoffset = String(total * (1 - progress));

      let passed = 0;
      for (const s of stops) if (eye >= s.top) passed += 1;
      setReached(passed);
      setWalking(window.scrollY > window.innerHeight * 0.5);
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
  }, [season, d, stops]);

  if (season !== "halloween" || !d) return null;

  return (
    <>
      <svg
        className="rr-hw-trail"
        width={width}
        height={pageHeight}
        viewBox={`0 0 ${width} ${pageHeight}`}
        fill="none"
        aria-hidden
      >
        {/* The track, unwalked. */}
        <path d={d} className="rr-hw-trail-base" />
        {/* The same path, drawn in behind the reader. */}
        <path ref={litRef} d={d} className="rr-hw-trail-lit" />
      </svg>

      {anchors.map((point, i) => (
        <div
          key={i}
          className="rr-hw-trail-stop"
          style={{ top: point.y, left: point.x }}
          aria-hidden
        >
          <HalloweenHouse variant={i} lit={i < reached} />
        </div>
      ))}

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
