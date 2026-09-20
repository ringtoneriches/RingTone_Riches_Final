import { useSeason } from "@/hooks/useSeason";

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

// Two different webs, so the corners are not mirror images of each other.
const WEB_TL = cobweb(120, 7);
const WEB_TR = cobweb(120, 23);

function Cobweb({ corner }: { corner: "tl" | "tr" }) {
  const strands = corner === "tl" ? WEB_TL : WEB_TR;
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

   Hangs from the top edge of the featured card on its own thread. The whole
   thing swings from the anchor point, and the legs flex on a slightly
   different beat, so it never looks like one rigid piece being waved about.
   --------------------------------------------------------------------------- */

/**
 * Legs with a knee in them.
 *
 * A spider's leg rises steeply from the body, peaks, and drops away — it does
 * not sweep out in a smooth curve. Drawing them as single arcs is what made
 * the first attempt look like a dust mote with whiskers; the sharp joint is
 * the thing the eye reads as "spider".
 */
const SPIDER_LEGS = [
  // Left side: body -> knee -> foot. The knees sit at four different heights
  // on purpose. Matched pairs arc into one another and the whole thing reads
  // as a bow tie above the body rather than eight separate legs.
  "M26 26 C20 21 15 19 10 20 C8 22 7 25 6 29",
  "M25 30 C17 28 11 28 6 31 C5 34 5 37 5 41",
  "M25 34 C17 34 11 37 8 42 C8 45 9 48 11 51",
  "M27 38 C22 41 18 45 16 51 C17 54 19 56 22 58",
  // Right side
  "M38 26 C44 21 49 19 54 20 C56 22 57 25 58 29",
  "M39 30 C47 28 53 28 58 31 C59 34 59 37 59 41",
  "M39 34 C47 34 53 37 56 42 C56 45 55 48 53 51",
  "M37 38 C42 41 46 45 48 51 C47 54 45 56 42 58",
];

function Spider() {
  return (
    <div className="rr-hw-spider" aria-hidden>
      <span className="rr-hw-spider-thread" />
      <svg className="rr-hw-spider-body" viewBox="0 0 64 60" fill="none" focusable="false">
        {/* Legs twice, same paths: a thick dark pass for separation from
            bright artwork, then a thin light rim on top. Drawn once they are
            near-black lines on a busy image and the spider loses the
            silhouette that makes it a spider rather than a blob. */}
        <g className="rr-hw-spider-legs rr-hw-spider-legs--dark">
          {SPIDER_LEGS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g className="rr-hw-spider-legs rr-hw-spider-legs--rim">
          {SPIDER_LEGS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <ellipse className="rr-hw-spider-head" cx="32" cy="27" rx="6.6" ry="5.6" />
        {/* Teardrop rather than an ellipse: an abdomen is widest low down and
            narrows where it meets the body. */}
        <path
          className="rr-hw-spider-abdomen"
          d="M32 30 C39 30 43 36 43 42 C43 49 38 54 32 54 C26 54 21 49 21 42 C21 36 25 30 32 30 Z"
        />
        <circle className="rr-hw-spider-eye" cx="29.4" cy="25.4" r="1.5" />
        <circle className="rr-hw-spider-eye" cx="34.6" cy="25.4" r="1.5" />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Bats

   They cross the sky rather than sitting in it. Each one gets its own path,
   height and speed, and the wings beat on their own timing — bats flapping in
   unison is the thing that gives a decoration away.
   --------------------------------------------------------------------------- */

const BATS = [
  { top: "16%", scale: 1, duration: "19s", delay: "0s", flap: "0.42s" },
  { top: "27%", scale: 0.62, duration: "26s", delay: "5.5s", flap: "0.33s" },
  { top: "9%", scale: 0.78, duration: "23s", delay: "12s", flap: "0.38s" },
];

/**
 * One wing, drawn from the body out to three fingertips with the membrane
 * scalloped between them.
 *
 * The scallops are the whole thing. A bat wing is skin stretched between
 * elongated fingers, so its trailing edge is a row of concave arcs — without
 * them you get a smooth blob that reads as a bird, a moth, or nothing. The
 * right wing is this path mirrored rather than a second drawing, so the two
 * can never drift apart.
 */
const BAT_WING =
  "M60 21 " +
  // leading edge: shoulder out along the arm to the outer fingertip
  "C52 9 40 2 26 2 " +
  // outer fingertip, then the membrane scallops back toward the body
  "C28 7 27 11 24 14 " +
  "L10 10 " +
  "C14 16 14 20 11 24 " +
  "L2 26 " +
  "C9 28 13 31 15 36 " +
  "C22 30 30 27 38 26 " +
  // trailing edge returning to the body
  "C46 26 54 25 60 26 Z";

function Bat({ style }: { style: React.CSSProperties }) {
  return (
    <span className="rr-hw-bat" style={style} aria-hidden>
      <svg viewBox="0 0 120 44" fill="none" focusable="false">
        {/* Each wing pivots at the body, so they are separate groups. */}
        <g className="rr-hw-bat-wing rr-hw-bat-wing--l">
          <path d={BAT_WING} />
        </g>
        <g className="rr-hw-bat-wing rr-hw-bat-wing--r">
          {/* Mirrored about the body rather than redrawn. */}
          <path d={BAT_WING} transform="translate(120 0) scale(-1 1)" />
        </g>
        <path
          className="rr-hw-bat-body"
          d="M60 10 C64 10 67 14 67 20 C67 27 64 34 60 38 C56 34 53 27 53 20 C53 14 56 10 60 10 Z"
        />
        {/* Ears. Pointed and well clear of the head — on a silhouette this
            small they do more work than the body shape does. */}
        <path className="rr-hw-bat-body" d="M56 12 L52 2 L60 9 Z" />
        <path className="rr-hw-bat-body" d="M64 12 L68 2 L60 9 Z" />
      </svg>
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
