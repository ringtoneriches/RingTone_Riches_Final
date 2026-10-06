import { useEffect, useState } from "react";
import { useSeason } from "@/hooks/useSeason";
import LurkingFace from "./LurkingFace";

/**
 * Places a watcher at the edge of a few sections.
 *
 * Positions are measured rather than guessed. Percentages of page height were
 * tried for the bats and dropped one into the middle of the competitions grid
 * where the cards hide it completely; sections are not evenly spaced, so the
 * only reliable answer is to ask where they actually start.
 *
 * Deliberately three. The moon is on the right of the hero, so the first one
 * leans in from the left to balance it, and they alternate after that. More
 * than a handful and it stops being unsettling and starts being a theme park.
 */
const PLACEMENTS = [
  { section: 2, side: "left" as const, tone: "amber" as const, size: 120, delay: "0s" },
  { section: 4, side: "right" as const, tone: "green" as const, size: 96, delay: "2.4s" },
  { section: 6, side: "left" as const, tone: "amber" as const, size: 104, delay: "4.1s" },
];

export default function SectionLurkers() {
  const { season } = useSeason();
  const [tops, setTops] = useState<Array<number | null>>([]);

  useEffect(() => {
    if (season !== "halloween") return;

    const measure = () => {
      const wrapper = document.querySelector(".rr-page-sections");
      if (!wrapper) return;
      const sections = Array.from(wrapper.children).filter(
        (el): el is HTMLElement => el.tagName === "SECTION",
      );
      setTops(
        PLACEMENTS.map((p) => {
          const el = sections[p.section];
          if (!el || !el.offsetTop) return null;
          // Peering over the top edge of the section.
          return el.offsetTop - Math.round(p.size * 0.45);
        }),
      );
    };

    measure();
    // Images and fonts settle after mount and move everything down the page.
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
      {PLACEMENTS.map((p, i) =>
        tops[i] == null ? null : (
          <div key={i} className="rr-hw-lurker-slot" style={{ top: tops[i] as number }} aria-hidden>
            <LurkingFace side={p.side} tone={p.tone} size={p.size} delay={p.delay} />
          </div>
        ),
      )}
    </>
  );
}
