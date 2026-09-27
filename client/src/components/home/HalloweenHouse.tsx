/**
 * A house on the trail.
 *
 * Drawn, not sourced: no licence, a few hundred bytes, takes the brand
 * colours and can light its own windows.
 *
 * Silhouettes with warm windows rather than rendered illustrations. A drawn
 * house in full colour would fight the product photography this page exists
 * to sell; a crooked roofline against the sky reads as a house at night from
 * the corner of your eye, which is all it has to do.
 *
 * Everything leans. Straight walls and level eaves read as a housing estate;
 * the tilt is most of what makes it look abandoned.
 */

type Props = {
  variant: number;
  /** Lit once the reader draws level — the checkpoint being collected. */
  lit: boolean;
  size?: number;
};

type House = {
  /** Body, roof and porch, all one silhouette. */
  shell: string[];
  /** Windows and doors that come on when reached. */
  lights: Array<{ d: string; small?: boolean }>;
  /** A few palings at the foot, to sit it on the ground. */
  fence?: string;
};

const HOUSES: House[] = [
  // A tall haunted house with a tower, leaning right.
  {
    shell: [
      "M22 96 L22 54 L50 54 L50 96 Z",
      "M17 55 L36 33 L55 55 Z",
      "M54 96 L54 44 L72 44 L72 96 Z",
      "M50 45 L63 26 L77 45 Z",
      "M60 28 L60 14 L66 14 L66 22 Z",
      "M18 74 L18 68 L52 68 L52 74 Z",
    ],
    lights: [
      { d: "M28 60 L38 60 L38 66 L28 66 Z" },
      { d: "M59 52 L67 52 L67 60 L59 60 Z" },
      { d: "M33 78 L41 78 L41 96 L33 96 Z" },
      { d: "M61 70 L67 70 L67 76 L61 76 Z", small: true },
    ],
    fence: "M6 96 L6 86 M14 96 L14 84 M78 96 L78 85 M86 96 L86 87 M4 88 L16 87 M76 88 L88 88",
  },
  // A low cottage with an oversized crooked chimney.
  {
    shell: [
      "M18 96 L20 60 L74 60 L76 96 Z",
      "M12 62 L47 34 L82 62 Z",
      "M62 40 L60 18 L70 18 L74 33 Z",
      "M30 96 L30 76 L46 76 L46 96 Z",
    ],
    lights: [
      { d: "M53 66 L65 66 L65 76 L53 76 Z" },
      { d: "M34 80 L42 80 L42 96 L34 96 Z" },
      { d: "M42 48 L52 48 L52 56 L42 56 Z", small: true },
    ],
    fence: "M4 96 L5 86 M12 96 L12 88 M84 96 L83 87 M92 96 L92 88",
  },
  // A narrow townhouse, leaning left.
  {
    shell: [
      "M32 96 L28 42 L64 42 L62 96 Z",
      "M24 44 L46 20 L70 44 Z",
      "M34 22 L34 10 L40 10 L40 17 Z",
      "M26 96 L26 88 L70 88 L70 96 Z",
    ],
    lights: [
      { d: "M36 48 L46 48 L46 58 L36 58 Z" },
      { d: "M50 48 L58 48 L58 58 L50 58 Z", small: true },
      { d: "M40 64 L52 64 L52 74 L40 74 Z" },
      { d: "M42 78 L52 78 L52 88 L42 88 Z" },
    ],
    fence: "M10 96 L10 87 M18 96 L19 85 M78 96 L77 86 M86 96 L86 88 M8 88 L20 87",
  },
  // A collapsing barn, well off the vertical.
  {
    shell: [
      "M16 96 L22 58 L70 54 L72 96 Z",
      "M10 60 L44 32 L78 56 Z",
      "M40 96 L40 74 L58 72 L58 96 Z",
    ],
    lights: [
      { d: "M28 64 L40 63 L40 71 L28 72 Z" },
      { d: "M44 78 L54 77 L54 96 L44 96 Z" },
      { d: "M50 44 L58 43 L58 50 L50 51 Z", small: true },
    ],
    fence: "M4 96 L6 88 M12 96 L13 86 M80 96 L79 87 M88 96 L88 89",
  },
];

export default function HalloweenHouse({ variant, lit, size = 96 }: Props) {
  const house = HOUSES[variant % HOUSES.length];

  return (
    <svg
      className={`rr-hw-house ${lit ? "is-lit" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 96 100"
      fill="none"
      aria-hidden
    >
      {/* The glow a lit house throws onto the ground around it. Drawn first so
          everything else sits on top of it. */}
      <ellipse className="rr-hw-house-pool" cx="47" cy="96" rx="44" ry="9" />

      {house.shell.map((d, i) => (
        <path key={i} d={d} className="rr-hw-house-shell" />
      ))}

      {house.fence && <path d={house.fence} className="rr-hw-house-fence" />}

      {house.lights.map((light, i) => (
        <path
          key={i}
          d={light.d}
          className={`rr-hw-house-window ${light.small ? "is-small" : ""}`}
          style={{ ["--win-delay" as string]: `${i * 140}ms` }}
        />
      ))}
    </svg>
  );
}
