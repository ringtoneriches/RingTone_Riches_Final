import { useEffect, useRef, useState } from "react";
import { useSeason } from "@/hooks/useSeason";
import { Bat } from "./SeasonalDecor";

/**
 * A bat crossing one of the seams between sections.
 *
 * The existing bats live in the fixed atmosphere layer near the top of the
 * viewport, so they never appear further down the page. These sit in the gaps
 * between sections instead — the one place below the hero where the
 * background is actually visible.
 *
 * Each one flies only while it is on screen. This page is over 9,000px tall,
 * and animating a bat six thousand pixels below the fold is work nobody can
 * see: the browser keeps compositing it for the whole of the scroll. The
 * observer disconnects once a bat has had its flight, so a long session does
 * not accumulate work either.
 *
 * Deliberately sparse. Two across the whole page reads as "there was a bat";
 * a dozen reads as a screensaver.
 */
/** Which section seams get a bat, counting the sections down the page. */
const SEAM_SECTIONS = [3, 5];

const LOOK = [
  { scale: 0.62, duration: "17s", flap: "0.42s" },
  { scale: 0.48, duration: "21s", flap: "0.5s" },
];

function SeamBat({ top, look }: { top: number; look: (typeof LOOK)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setFlying(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setFlying(true);
          observer.disconnect();
        }
      },
      // A little early, so it is already crossing when it comes into view
      // rather than starting from nothing in front of the reader.
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="rr-hw-seam-bat" style={{ top }} aria-hidden>
      {flying && (
        <Bat
          style={{
            ["--bat-scale" as string]: String(look.scale),
            ["--bat-duration" as string]: look.duration,
            ["--bat-delay" as string]: "0s",
            ["--bat-flap" as string]: look.flap,
          }}
        />
      )}
    </div>
  );
}

export default function SeamBats() {
  const { season } = useSeason();
  const [tops, setTops] = useState<number[]>([]);

  // Measure where the seams actually are. Percentages of page height were
  // tried first and dropped a bat into the middle of the competitions grid,
  // where the cards cover it completely — the gaps are what matter, and they
  // are not evenly spaced.
  useEffect(() => {
    if (season !== "halloween") return;

    const measure = () => {
      const wrapper = document.querySelector(".rr-page-sections");
      if (!wrapper) return;
      const sections = Array.from(wrapper.children).filter(
        (el): el is HTMLElement => el.tagName === "SECTION",
      );
      const next = SEAM_SECTIONS.map((i) => sections[i]?.offsetTop)
        .filter((top): top is number => typeof top === "number" && top > 0)
        // Just above the section, in the gap itself.
        .map((top) => top - 90);
      setTops(next);
    };

    measure();
    // Images and fonts settle after mount and move everything down.
    const settle = window.setTimeout(measure, 1200);
    window.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("load", measure);
      window.removeEventListener("resize", measure);
    };
  }, [season]);

  if (season !== "halloween") return null;

  return (
    <>
      {tops.map((top, i) => (
        <SeamBat key={i} top={top} look={LOOK[i % LOOK.length]} />
      ))}
    </>
  );
}
