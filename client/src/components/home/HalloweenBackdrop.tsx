import { useEffect, useMemo } from "react";

/**
 * The painted scene behind the page.
 *
 * The season was built as a stack of effects — a moon, cloud banks, bats —
 * and effects do not add up to a place. There was no horizon, no ground, and
 * nowhere for the eye to land, which is why it read as a dark purple page
 * with things floating in it rather than as somewhere. A painted scene fixes
 * that in one move, because a scene has foreground, distance and a horizon
 * already in it.
 *
 * Fixed rather than scrolling. The page is nearly 7,000px tall and no single
 * image covers that without stretching or visibly repeating; pinning it means
 * it only ever has to cover one viewport, whatever the page's length.
 *
 * One scene is chosen per page load, not on a timer. A backdrop that changes
 * while somebody is reading — or worse, checking out — reads as a fault
 * rather than a feature, and every swap is another few hundred kilobytes.
 * Choosing on load gives a returning visitor variety without anything moving
 * underneath them.
 */

/**
 * Add scenes here as they are produced. Each wants a dark, uncluttered middle
 * where the headline and the prize cards sit, with the detail pushed to the
 * left and right edges and along the bottom.
 */
const SCENES: string[] = [];

export default function HalloweenBackdrop() {
  // Chosen once per mount. useMemo rather than picking during render, so a
  // re-render never swaps the scene mid-session.
  const scene = useMemo(() => {
    if (!SCENES.length) return null;
    return SCENES[Math.floor(Math.random() * SCENES.length)];
  }, []);

  // Tell the stylesheet a painted sky is present, so the generated clouds and
  // gradient stand down rather than muddying the art.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("rr-has-backdrop", Boolean(scene));
    return () => root.classList.remove("rr-has-backdrop");
  }, [scene]);

  if (!scene) return null;

  return (
    <div className="rr-hw-backdrop" aria-hidden>
      <img src={scene} alt="" draggable={false} decoding="async" className="rr-hw-backdrop-img" />
      {/* The scrim is not optional. A painted scene behind a prize amount and
          an Enter Now button is a conversion problem before it is an
          aesthetic one, so the middle of the page is pulled well down and
          only the margins keep their full contrast. */}
      <div className="rr-hw-backdrop-scrim" />
    </div>
  );
}
