import { useEffect, useRef } from "react";
import { useSeason } from "@/hooks/useSeason";
import HalloweenMoon from "./HalloweenMoon";

/**
 * The moon.
 *
 * It has been wrong twice, in opposite directions, and this is the middle.
 *
 * Originally it lived in the viewport-fixed atmosphere layer, so it followed
 * the reader down and ended up sitting behind a winner's photo. So it was
 * anchored to the top of the page instead — which put it inside a 100vh box
 * with hidden overflow, right where the featured card sits on a desktop. It
 * read as though it were attached to the card, and slid up and got sliced off
 * as you scrolled.
 *
 * A moon does neither. It hangs in the sky: it does not travel with the page,
 * and it does not follow you around the site either. So it is fixed, and it
 * fades out over the first screen — by the time the content starts it is gone,
 * and nothing can collide with it.
 *
 * The fade is one passive listener that writes a custom property inside a
 * rAF. Opacity is composited, so this costs nothing per frame beyond the
 * write itself.
 */
export default function HalloweenSky() {
  const { season } = useSeason();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (season !== "halloween") return;
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      // Gone by 70% of the first screen, so it has cleared before the
      // competitions begin.
      const span = window.innerHeight * 0.7;
      const progress = Math.min(1, Math.max(0, window.scrollY / span));
      el.style.setProperty("--rr-moon-fade", String(1 - progress));
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
  }, [season]);

  if (season !== "halloween") return null;

  return (
    <div ref={ref} className="rr-hw-sky" aria-hidden>
      <div className="rr-hw-moon rr-hw-moon--anchored">
        <HalloweenMoon />
      </div>
    </div>
  );
}
