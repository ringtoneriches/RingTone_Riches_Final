/**
 * The moon, rendered as a lit surface rather than a pale circle.
 *
 * The previous version was stacked CSS gradients, which is why it read first
 * as a billiard ball and then as a lightbulb: gradients can fake a glow but
 * they cannot fake a surface. This generates real cratered terrain with
 * feTurbulence and then lights it with feDiffuseLighting — the same approach
 * used to render procedural planets — so the craters cast their own shadows
 * and the terminator falls where the light says it should.
 *
 * Entirely procedural: no image to download, nothing to license, and it stays
 * sharp at any size.
 */

/**
 * Craters, laid out by hand.
 *
 * feTurbulence gives cloud and marble; it cannot give circles, and a crater is
 * a circle. So the noise does the surface mottling and these do the craters,
 * each one a lit far wall, a shadowed near wall and a bright outer rim — the
 * three things that read as a depression rather than a dot.
 *
 * [x, y, radius] in the 200-unit viewBox, kept inside r=92 so none straddle
 * the limb.
 */
const CRATERS: [number, number, number][] = [
  [128, 62, 21],
  [74, 88, 15],
  [104, 126, 12.5],
  [150, 108, 9],
  [62, 134, 8],
  [96, 52, 7],
  [136, 150, 6.5],
  [46, 104, 5.5],
  [116, 92, 5],
  [158, 74, 4.5],
  [84, 158, 4],
  [126, 40, 3.5],
  [66, 62, 3],
  [148, 132, 3],
];

type Props = { className?: string };

export default function HalloweenMoon({ className = "" }: Props) {
  return (
    <svg
      className={`rr-hw-moon-svg ${className}`}
      viewBox="0 0 200 200"
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Fractal noise lit from the upper left. surfaceScale controls how
            deep the craters read; too high and it turns to gravel. */}
        <filter id="rr-hw-moon-surface" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011"
            numOctaves="4"
            seed="11"
            result="terrain"
          />
          <feDiffuseLighting
            in="terrain"
            lightingColor="#fffbf0"
            surfaceScale="4.2"
            diffuseConstant="1"
            result="lit"
          >
            {/* Low elevation: a high sun flattens everything, a low one lets
                the craters throw shadows, which is what makes them craters. */}
            <feDistantLight azimuth="228" elevation="46" />
          </feDiffuseLighting>
        </filter>

        {/* Larger, sparser noise for the maria — the dark seas that are most
            of what makes a moon recognisable at a glance. */}
        <filter id="rr-hw-moon-maria" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0075" numOctaves="3" seed="4" />
          {/* Flat dark colour, with alpha thresholded off the red channel so
              the noise becomes a few large blotches rather than a grey haze. */}
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.10
                    0 0 0 0 0.09
                    0 0 0 0 0.13
                    2.7 0 0 0 -1.12"
          />
          <feGaussianBlur stdDeviation="1.1" />
        </filter>

        <clipPath id="rr-hw-moon-clip">
          <circle cx="100" cy="100" r="92" />
        </clipPath>

        {/* Limb darkening: a real sphere falls away at the edge. Without this
            the disc looks like a sticker however good the surface is. */}
        <radialGradient id="rr-hw-moon-limb" cx="38%" cy="34%" r="78%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="45%" stopColor="#0d0a14" stopOpacity="0.05" />
          <stop offset="72%" stopColor="#0d0a14" stopOpacity="0.28" />
          <stop offset="90%" stopColor="#09060f" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#06040a" stopOpacity="0.88" />
        </radialGradient>

        {/* One crater, reused at every size. Light comes from the upper left,
            so the far (lower right) inner wall catches it and the near wall
            sits in shadow. */}
        <radialGradient id="rr-hw-crater" cx="64%" cy="66%" r="62%">
          <stop offset="0%" stopColor="#fffdf6" stopOpacity="0.5" />
          <stop offset="48%" stopColor="#b9b2c4" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#1a1622" stopOpacity="0.62" />
        </radialGradient>

        {/* The raised rim, brightest on the lit side. */}
        <radialGradient id="rr-hw-crater-rim" cx="36%" cy="32%" r="62%">
          <stop offset="62%" stopColor="#fffdf6" stopOpacity="0" />
          <stop offset="86%" stopColor="#fffdf6" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#fffdf6" stopOpacity="0" />
        </radialGradient>

        {/* The atmospheric halo, drawn well outside the disc. */}
        <radialGradient id="rr-hw-moon-halo" cx="50%" cy="50%" r="50%">
          <stop offset="46%" stopColor="#fff6dd" stopOpacity="0.5" />
          <stop offset="62%" stopColor="#ffd9a0" stopOpacity="0.2" />
          <stop offset="80%" stopColor="#ff9a3c" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ff8a1f" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo first, behind everything. */}
      <circle cx="100" cy="100" r="100" fill="url(#rr-hw-moon-halo)" />

      <g clipPath="url(#rr-hw-moon-clip)">
        {/* The lit terrain. */}
        <rect x="0" y="0" width="200" height="200" filter="url(#rr-hw-moon-surface)" />
        {/* Warm it very slightly — a harvest moon, not a studio light. */}
        <rect x="0" y="0" width="200" height="200" fill="#ffeacb" opacity="0.14" />
        {/* The seas. */}
        <rect x="0" y="0" width="200" height="200" filter="url(#rr-hw-moon-maria)" opacity="0.8" />
        {/* Craters, largest first so the small ones land on top. */}
        {CRATERS.map(([cx, cy, r], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r * 1.16} fill="url(#rr-hw-crater-rim)" />
            <circle cx={cx} cy={cy} r={r} fill="url(#rr-hw-crater)" />
          </g>
        ))}

        {/* Curvature, over the craters so the limb swallows them too. */}
        <rect x="0" y="0" width="200" height="200" fill="url(#rr-hw-moon-limb)" />
      </g>
    </svg>
  );
}
