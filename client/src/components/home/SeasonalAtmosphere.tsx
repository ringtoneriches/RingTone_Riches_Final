import { useSeason } from "@/hooks/useSeason";
import { SeasonalBats } from "./SeasonalDecor";
import HalloweenMoon from "./HalloweenMoon";
import HalloweenClouds from "./HalloweenClouds";

/**
 * The seasonal layer that sits inside the page's existing atmosphere.
 *
 * Rendered only while a season is running, so out of season this is a single
 * null return and costs nothing. Everything it draws is decorative and behind
 * the content, hence aria-hidden and no pointer events.
 *
 * The particles are laid out here rather than in CSS because each one needs
 * its own position, size and timing; generating them from an index keeps them
 * irregular without hand-writing thirty rules.
 */

const EMBERS = Array.from({ length: 18 }, (_, i) => {
  // Golden-angle spacing spreads them across the width without clustering,
  // which random values do surprisingly badly at this count.
  const x = ((i * 137.508) % 100).toFixed(2);
  return {
    x: `${x}%`,
    size: `${(i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2)}px`,
    duration: `${(14 + (i % 7) * 1.8).toFixed(1)}s`,
    delay: `${((i * 1.37) % 16).toFixed(2)}s`,
    sway: i % 3 === 0,
  };
});

export default function SeasonalAtmosphere() {
  const { season } = useSeason();

  if (season !== "halloween") return null;

  return (
    <>
      {/* Vignette before the moon and embers, so it darkens the sky behind
          them rather than washing a grey film across the light sources. */}
      <div className="rr-hw-vignette" aria-hidden />

      <div className="rr-hw-moon" aria-hidden>
        <HalloweenMoon />
      </div>

      {/* Over the moon, so the banks pass in front of it — which is most of
          what sells them as weather rather than a texture. */}
      <HalloweenClouds />

      {/* After the moon, so they cross in front of it rather than behind. */}
      <SeasonalBats />

      <div className="rr-hw-embers" aria-hidden>
        {EMBERS.map((ember, i) => (
          <span
            key={i}
            className={`rr-hw-ember${ember.sway ? " rr-hw-ember--sway" : ""}`}
            style={{
              ["--ember-x" as string]: ember.x,
              ["--ember-size" as string]: ember.size,
              ["--ember-duration" as string]: ember.duration,
              ["--ember-delay" as string]: ember.delay,
            }}
          />
        ))}
      </div>
    </>
  );
}
