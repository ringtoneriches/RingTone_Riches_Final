import { useSeason } from "@/hooks/useSeason";
import spiderImg from "@assets/halloween-spider.webp";
import batDown from "@assets/halloween-bat-down.webp";
import batMid from "@assets/halloween-bat-mid.webp";
import batUp from "@assets/halloween-bat-up.webp";

/**
 * The Halloween props: cobwebs, a spider on a thread, and bats.
 *
 * Drawn as inline SVG rather than dropped in as images or emoji, for three
 * reasons: they inherit the season's colours, they stay crisp at any size, and
 * the parts can be animated separately — a spider whose legs never move is a
 * sticker, not a spider.
 *
 * Everything here is a silhouette with a thin rim light rather than a flat
 * black shape. The rim is what makes a prop sit in the scene instead of on top
 * of it, and it is the difference between this and clip art.
 */

/* ---------------------------------------------------------------------------
   Cobweb

   Generated rather than hand-drawn so the sag on every strand is consistent.
   A web is radial spokes with threads slung between them, and the threads dip
   toward the anchor because they hang — drawing them as straight lines is the
   single thing that makes a web look fake.
   --------------------------------------------------------------------------- */

/**
 * A cobweb, built with the irregularity a real one has.
 *
 * The first version was a perfect radial lattice: evenly spaced spokes, every
 * ring the same sag, every strand intact. That is a diagram of a web, and it
 * is exactly why it looked drawn in Paint. A real web is spun by an animal
 * that cannot measure, hung on anchors that are not where it wanted them, and
 * has been damaged since it was built.
 *
 * So: spoke angles are jittered, each ring sags by a different amount, radii
 * wander, strands are broken with gaps, and a few loose threads hang free.
 * Everything comes from a fixed seed, so the shape never changes between
 * renders — it just is not regular.
 */

/** Deterministic pseudo-random in [0,1), so the web is stable across renders. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

type Strand = {
  d: string;
  /** Thinner threads for the finer silk. */
  fine: boolean;
  /**
   * How brightly this strand catches the light, 0-1.
   *
   * Real silk is not lit evenly: a strand is bright only where it happens to
   * face the light, and most of a web is dusty and half-there. Drawing every
   * thread at one brightness is what keeps a web looking like line art
   * however irregular its geometry is.
   */
  lit: number;
};

function cobweb(size: number, seed = 7) {
  const rand = seeded(seed);
  const strands: Strand[] = [];
  const at = (radius: number, angle: number) =>
    [radius * Math.cos(angle), radius * Math.sin(angle)] as const;

  // Spokes: evenly spread, then nudged. Perfectly even spacing is the single
  // biggest giveaway.
  const SPOKES = 7;
  const angles = Array.from({ length: SPOKES }, (_, i) => {
    const base = (i / (SPOKES - 1)) * 86 + 2;
    return (base + (rand() - 0.5) * 9) * (Math.PI / 180);
  });

  // Each spoke runs a slightly different length, and not all reach the edge.
  const spokeLen = angles.map(() => size * (0.86 + rand() * 0.16));

  angles.forEach((angle, i) => {
    const [x, y] = at(spokeLen[i], angle);
    strands.push({
      d: `M0 0 L${x.toFixed(1)} ${y.toFixed(1)}`,
      fine: false,
      lit: 0.5 + rand() * 0.45,
    });
  });

  // Rings: uneven radii, uneven sag, and gaps where strands have gone.
  const RINGS = 5;
  for (let ring = 1; ring <= RINGS; ring += 1) {
    const base = (ring / (RINGS + 0.3)) * size;
    for (let i = 0; i < angles.length - 1; i += 1) {
      // A broken strand. Real webs are full of them and they are most of what
      // makes one look used rather than drawn.
      if (rand() < 0.14) continue;

      const rA = base * (0.9 + rand() * 0.2);
      const rB = base * (0.9 + rand() * 0.2);
      if (rA > spokeLen[i] || rB > spokeLen[i + 1]) continue;

      const [x1, y1] = at(rA, angles[i]);
      const [x2, y2] = at(rB, angles[i + 1]);
      // Sag varies per strand: gravity plus however tight it was spun.
      const sag = 0.64 + rand() * 0.26;
      const mid = (angles[i] + angles[i + 1]) / 2;
      const [cx, cy] = at(((rA + rB) / 2) * sag, mid);

      strands.push({
        d: `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
        fine: true,
        lit: 0.22 + rand() * 0.62,
      });
    }
  }

  // Loose threads hanging off the edge, trailing where the web has torn.
  for (let i = 0; i < 4; i += 1) {
    const angle = angles[1 + Math.floor(rand() * (angles.length - 2))];
    const from = size * (0.5 + rand() * 0.42);
    const [x1, y1] = at(from, angle);
    const drop = size * (0.1 + rand() * 0.2);
    const sway = (rand() - 0.5) * size * 0.16;
    strands.push({
      d: `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${(x1 + sway * 0.5).toFixed(1)} ${(y1 + drop * 0.6).toFixed(1)} ${(x1 + sway).toFixed(1)} ${(y1 + drop).toFixed(1)}`,
      fine: true,
      lit: 0.3 + rand() * 0.5,
    });
  }

  return strands;
}

// Every web gets its own seed. Two of the same shape side by side is as
// obvious as two of the same shape mirrored.
const WEB_TL = cobweb(120, 7);
const WEB_TR = cobweb(120, 23);
const WEB_LOGO = cobweb(120, 51);
const WEB_CARD_A = cobweb(120, 88);
const WEB_CARD_B = cobweb(120, 134);

const WEB_SEEDS = {
  tl: WEB_TL,
  tr: WEB_TR,
  logo: WEB_LOGO,
  "card-a": WEB_CARD_A,
  "card-b": WEB_CARD_B,
} as const;

type WebKind = keyof typeof WEB_SEEDS;

function Cobweb({ corner }: { corner: WebKind }) {
  const strands = WEB_SEEDS[corner];
  return (
    <svg
      className={`rr-hw-web rr-hw-web--${corner}`}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      focusable="false"
    >
      {/* A soft dark corner first, or fine silk disappears into bright prize
          artwork entirely. Then the web is drawn twice: a dark pass for
          separation, and the silk itself on top. */}
      <defs>
        <radialGradient id={`rr-hw-web-fade-${corner}`} cx="0" cy="0" r="1">
          <stop offset="0%" stopColor="rgb(5,3,10)" stopOpacity="0.82" />
          <stop offset="55%" stopColor="rgb(5,3,10)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="rgb(5,3,10)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill={`url(#rr-hw-web-fade-${corner})`} />
      {strands.map((strand, i) => (
        <path key={`s${i}`} d={strand.d} className="rr-hw-web-shadow" />
      ))}
      {strands.map((strand, i) => (
        <path
          key={`k${i}`}
          d={strand.d}
          className={`rr-hw-web-silk${strand.fine ? " rr-hw-web-silk--fine" : ""}`}
          style={{ opacity: strand.lit }}
        />
      ))}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Spider

   A photograph now, not a drawing. Hangs from the top edge of the featured
   card on a thread the page draws, so the thread can be any length while the
   spider itself stays a real one.

   Two nested motions: the whole thing swings from where the thread is
   anchored, and it also creeps up and down the line. Either alone looks
   mechanical.
   --------------------------------------------------------------------------- */

function Spider() {
  return (
    <div className="rr-hw-spider" aria-hidden>
      <span className="rr-hw-spider-thread" />
      <img
        src={spiderImg}
        alt=""
        aria-hidden
        draggable={false}
        decoding="async"
        className="rr-hw-spider-body"
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Bats

   Three photographs of the same bat — wings down, level, and up — cycled as
   down, level, up, level. Four steps from three frames, because the level
   pose is passed through twice in every beat.

   The frames were cropped together rather than individually, so the body sits
   in the same place in all three. Trimming each one to its own edges is what
   would make the bat jump around inside its own wingbeat.
   --------------------------------------------------------------------------- */

const BATS = [
  { top: "18%", scale: 1, duration: "21s", delay: "0s", flap: "0.46s" },
  { top: "30%", scale: 0.6, duration: "29s", delay: "6.5s", flap: "0.36s" },
  { top: "11%", scale: 0.78, duration: "25s", delay: "13s", flap: "0.41s" },
];

function Bat({ style }: { style: React.CSSProperties }) {
  return (
    <span className="rr-hw-bat" style={style} aria-hidden>
      <img src={batDown} alt="" draggable={false} decoding="async" className="rr-hw-bat-frame rr-hw-bat-frame--down" />
      <img src={batMid} alt="" draggable={false} decoding="async" className="rr-hw-bat-frame rr-hw-bat-frame--mid" />
      <img src={batUp} alt="" draggable={false} decoding="async" className="rr-hw-bat-frame rr-hw-bat-frame--up" />
    </span>
  );
}

export function SeasonalBats() {
  const { season } = useSeason();
  if (season !== "halloween") return null;

  return (
    <div className="rr-hw-bats" aria-hidden>
      {BATS.map((bat, i) => (
        <Bat
          key={i}
          style={{
            top: bat.top,
            ["--bat-scale" as string]: String(bat.scale),
            ["--bat-duration" as string]: bat.duration,
            ["--bat-delay" as string]: bat.delay,
            ["--bat-flap" as string]: bat.flap,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Webs caught in the top corners of the featured card.
 *
 * Rendered INSIDE the card, deliberately. They belong behind the Featured and
 * Live badges — a web the badges sit on top of reads as depth, whereas a web
 * drawn over them just makes them hard to read. Being clipped to the card's
 * rounded corners is correct too: that is the corner they are caught in.
 *
 * Only the featured card gets them. A web on all twelve competition cards
 * turns a prop into wallpaper, and the point of dressing the featured one is
 * that it is the card being pointed at.
 */
export function FeaturedWebs() {
  const { season } = useSeason();
  if (season !== "halloween") return null;

  return (
    <div className="rr-hw-webs" aria-hidden>
      <Cobweb corner="tl" />
      <Cobweb corner="tr" />
    </div>
  );
}

/**
 * The spider, hanging in front of the card.
 *
 * Outside the card rather than in it, because the card clips its children to
 * the rounded corners and a spider on a thread has to hang across that edge
 * to look like it is in front of anything.
 */
export function FeaturedSpider() {
  const { season } = useSeason();
  if (season !== "halloween") return null;

  return (
    <div className="rr-hw-featured-decor" aria-hidden>
      <Spider />
    </div>
  );
}

/**
 * The web slung across the site logo, with a spider on it.
 *
 * Small and in one corner rather than draped over the wordmark: the logo has
 * to stay readable, and a web that obscures the brand is a cost the season
 * does not get to charge.
 */
export function LogoWeb() {
  const { season } = useSeason();
  if (season !== "halloween") return null;

  return (
    <span className="rr-hw-logo-web" aria-hidden>
      <Cobweb corner="logo" />
      <span className="rr-hw-logo-spider">
        <span className="rr-hw-logo-thread" />
        <img src={spiderImg} alt="" draggable={false} decoding="async" />
      </span>
    </span>
  );
}

/**
 * A web in the corner of a competition card.
 *
 * Deliberately not on every card. Thirteen identical webs is wallpaper, and
 * wallpaper is ignored; a few scattered ones are noticed. The caller decides
 * which cards get one from its position in the grid, so the pattern is stable
 * rather than changing on every render.
 */
export function CardWeb({ variant }: { variant: "a" | "b" }) {
  const { season } = useSeason();
  if (season !== "halloween") return null;

  return (
    <span className={`rr-hw-card-web rr-hw-card-web--${variant}`} aria-hidden>
      <Cobweb corner={variant === "a" ? "card-a" : "card-b"} />
    </span>
  );
}

/**
 * Whether a card at this position in the grid wears a web.
 *
 * Every fourth card, offset so the first one is not the very first card in
 * the grid — a web on card one and then nothing for three reads as a mistake
 * rather than a decoration.
 */
export function cardWebFor(index: number): "a" | "b" | null {
  if (index % 4 !== 1) return null;
  return index % 8 === 1 ? "a" : "b";
}
