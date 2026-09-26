/**
 * A house on the street, marking one section of the page.
 *
 * Drawn rather than sourced, for the same reasons as the watchers: no
 * licence, a few hundred bytes, tints to the brand and can light up.
 *
 * Silhouettes, not illustrations. A friendly cartoon house would fight the
 * product photography this page exists to show; a black roofline against the
 * sky with one warm window sits behind everything and still reads instantly
 * as a house at night.
 */

type Props = {
  /** Four rooflines, so a long page does not repeat the same house. */
  variant: number;
  /** Lit once the reader has reached it — the checkpoint being collected. */
  lit: boolean;
  size?: number;
};

const ROOFS = [
  // A plain gable.
  "M6 46 L30 22 L54 46 Z",
  // Gable with a chimney.
  "M4 46 L28 20 L52 46 Z M42 28 L42 16 L48 16 L48 33 Z",
  // A steeper, taller roof — reads as a townhouse.
  "M8 46 L30 14 L52 46 Z",
  // Two peaks.
  "M2 46 L18 26 L34 46 Z M28 46 L44 22 L58 46 Z",
];

export default function HalloweenHouse({ variant, lit, size = 74 }: Props) {
  const roof = ROOFS[variant % ROOFS.length];

  return (
    <svg
      className={`rr-hw-house ${lit ? "is-lit" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      aria-hidden
    >
      {/* Body and roof in one near-black, so it reads as a cut-out against
          the sky rather than an object with its own lighting. */}
      <path d={roof} className="rr-hw-house-shell" />
      <rect x="12" y="44" width="36" height="16" className="rr-hw-house-shell" />

      {/* The window. Everything else is silhouette; this is the whole point,
          because a lit window at night is what says somebody is home. */}
      <rect x="26" y="48" width="9" height="9" className="rr-hw-house-window" />

      {/* A second, smaller light in the roof on some houses, so the lit ones
          are not identical. */}
      {variant % 2 === 1 && (
        <rect x="27" y="33" width="6" height="6" className="rr-hw-house-window" />
      )}
    </svg>
  );
}
