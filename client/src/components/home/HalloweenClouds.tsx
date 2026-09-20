/**
 * Dark cloud banks drifting across the sky.
 *
 * Fractal noise is the right tool here, which it was not for the moon. A
 * crater is a circle and noise cannot make circles — but a cloud genuinely is
 * fractal, self-similar at every scale, and feTurbulence is how clouds have
 * been generated in graphics since Perlin. The same filter that made the moon
 * look like marble makes these look like weather.
 *
 * Three banks at different scales and speeds. Depth comes from the parallax:
 * the high thin one moves slowest, the low heavy one fastest and heaviest.
 *
 * They are moonlit grey-violet, not black. Black cloud on a black sky is
 * invisible — the first version was there the whole time and simply could not
 * be seen. Real night cloud reads because moonlight makes it LIGHTER than the
 * sky behind it, which is also what lets it pass in front of the moon.
 */

type Bank = {
  id: string;
  /** Lower is bigger, puffier cloud. */
  frequency: string;
  octaves: number;
  seed: number;
  /** Threshold: how much of the noise becomes cloud rather than sky. */
  slope: number;
  intercept: number;
  /** Cloud colour, 0-1 per channel. Higher banks catch more moonlight. */
  tint: [number, number, number];
  className: string;
};

/**
 * The threshold is what separates cloud from haze.
 *
 * alpha = slope * noise + intercept, and turbulence sits around 0.5, so a
 * gentle threshold turns roughly half the sky into cloud and the result reads
 * as milky fog. Pushing the intercept down means only the densest noise
 * becomes cloud, which leaves open sky between the banks — and open sky
 * between them is the only reason they read as separate banks at all.
 */
const BANKS: Bank[] = [
  // High and thin: closest to the moon, so the most light on it.
  { id: "a", frequency: "0.0042 0.011", octaves: 5, seed: 3, slope: 3.6, intercept: -1.52, tint: [0.42, 0.38, 0.5], className: "rr-hw-cloud--high" },
  { id: "b", frequency: "0.0028 0.008", octaves: 4, seed: 17, slope: 3.8, intercept: -1.72, tint: [0.27, 0.23, 0.35], className: "rr-hw-cloud--mid" },
  // Low and heavy: furthest from the light, nearly a silhouette.
  { id: "c", frequency: "0.0019 0.0055", octaves: 4, seed: 41, slope: 4, intercept: -1.9, tint: [0.15, 0.12, 0.21], className: "rr-hw-cloud--low" },
];

function Bank({ bank }: { bank: Bank }) {
  const filterId = `rr-hw-cloud-${bank.id}`;
  return (
    <svg className={`rr-hw-cloud ${bank.className}`} aria-hidden focusable="false" preserveAspectRatio="none">
      <defs>
        <filter id={filterId} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={bank.frequency}
            numOctaves={bank.octaves}
            seed={bank.seed}
            result="noise"
          />
          {/* Flatten to one dark colour and threshold the alpha off the noise,
              so it forms distinct banks instead of an even grey wash. */}
          <feColorMatrix
            in="noise"
            type="matrix"
            values={`0 0 0 0 ${bank.tint[0]}
                     0 0 0 0 ${bank.tint[1]}
                     0 0 0 0 ${bank.tint[2]}
                     ${bank.slope} 0 0 0 ${bank.intercept}`}
            result="shaped"
          />
          {/* Soften the threshold edge; without this the banks have a hard
              crumbly border that reads as static, not cloud. */}
          <feGaussianBlur in="shaped" stdDeviation="7" />
        </filter>
        {/* Fade top and bottom so the banks have no visible seam. */}
        <linearGradient id={`${filterId}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="28%" stopColor="#fff" stopOpacity="1" />
          <stop offset="72%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${filterId}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${filterId}-fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${filterId}-mask)`}>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </g>
    </svg>
  );
}

export default function HalloweenClouds() {
  return (
    <div className="rr-hw-clouds" aria-hidden>
      {BANKS.map((bank) => (
        <Bank key={bank.id} bank={bank} />
      ))}
    </div>
  );
}
