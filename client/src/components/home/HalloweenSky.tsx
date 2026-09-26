import { useSeason } from "@/hooks/useSeason";
import HalloweenMoon from "./HalloweenMoon";

/**
 * The moon, anchored to the top of the page rather than to the viewport.
 *
 * It used to live in the fixed atmosphere layer, which meant it followed the
 * scroll: by the time you reached the Winner's Circle it was sitting half
 * behind a winner's photo, appearing and disappearing depending on whether
 * the content in front of it happened to be transparent. That reads as a
 * stray graphic rather than a sky, and it was the main reason the theme felt
 * incoherent below the hero.
 *
 * Anchored here it behaves like a moon: it belongs to the sky at the top of
 * the page and scrolls away with it. Everything genuinely ambient — the
 * vignette, the embers, the painted backdrop — stays fixed, because those
 * should follow you.
 */
export default function HalloweenSky() {
  const { season } = useSeason();
  if (season !== "halloween") return null;

  return (
    <div className="rr-hw-sky" aria-hidden>
      <div className="rr-hw-moon rr-hw-moon--anchored">
        <HalloweenMoon />
      </div>
    </div>
  );
}
