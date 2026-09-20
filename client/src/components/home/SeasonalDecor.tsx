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

function cobwebPath(size: number, spokes = 5, rings = 4) {
  const parts: string[] = [];
  // Spread the spokes across the quarter turn, kept off both edges so the web
  // reads as caught in a corner rather than taped to it.
  const angles = Array.from({ length: spokes }, (_, i) => {
    const t = i / (spokes - 1);
    return (3 + t * 84) * (Math.PI / 180);
  });

  const at = (radius: number, angle: number) =>
    [radius * Math.cos(angle), radius * Math.sin(angle)] as const;

  for (const angle of angles) {
    const [x, y] = at(size, angle);
    parts.push(`M0 0 L${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  for (let ring = 1; ring <= rings; ring += 1) {
    const radius = (size / (rings + 0.35)) * ring;
    for (let i = 0; i < angles.length - 1; i += 1) {
      const [x1, y1] = at(radius, angles[i]);
      const [x2, y2] = at(radius, angles[i + 1]);
      // Control point pulled toward the anchor: that is the sag.
      const mid = (angles[i] + angles[i + 1]) / 2;
      const [cx, cy] = at(radius * 0.82, mid);
      parts.push(
        `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      );
    }
  }

  return parts.join(" ");
}

const WEB_PATH = cobwebPath(120);

function Cobweb({ corner }: { corner: "tl" | "tr" }) {
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
      <path d={WEB_PATH} className="rr-hw-web-shadow" />
      <path d={WEB_PATH} className="rr-hw-web-silk" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Spider

   Hangs from the top edge of the featured card on its own thread. The whole
   thing swings from the anchor point, and the legs flex on a slightly
   different beat, so it never looks like one rigid piece being waved about.
   --------------------------------------------------------------------------- */

const SPIDER_LEGS = [
  // Left side
  "M26 26 C16 20 10 14 4 6",
  "M25 30 C14 28 8 26 1 21",
  "M25 34 C14 36 8 39 2 44",
  "M27 38 C19 43 15 48 11 54",
  // Right side
  "M38 26 C48 20 54 14 60 6",
  "M39 30 C50 28 56 26 63 21",
  "M39 34 C50 36 56 39 62 44",
  "M37 38 C45 43 49 48 53 54",
];

function Spider() {
  return (
    <div className="rr-hw-spider" aria-hidden>
      <span className="rr-hw-spider-thread" />
      <svg className="rr-hw-spider-body" viewBox="0 0 64 56" fill="none" focusable="false">
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
        <ellipse className="rr-hw-spider-head" cx="32" cy="27" rx="7" ry="6" />
        <ellipse className="rr-hw-spider-abdomen" cx="32" cy="37" rx="10" ry="11" />
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

function Bat({ style }: { style: React.CSSProperties }) {
  return (
    <span className="rr-hw-bat" style={style} aria-hidden>
      <svg viewBox="0 0 80 40" fill="none" focusable="false">
        {/* Wings are separate groups so each can pivot at the body. */}
        <g className="rr-hw-bat-wing rr-hw-bat-wing--l">
          <path d="M40 20 C32 10 22 6 10 8 C16 12 14 18 8 20 C16 21 20 25 22 31 C28 26 34 24 40 24 Z" />
        </g>
        <g className="rr-hw-bat-wing rr-hw-bat-wing--r">
          <path d="M40 20 C48 10 58 6 70 8 C64 12 66 18 72 20 C64 21 60 25 58 31 C52 26 46 24 40 24 Z" />
        </g>
        <path
          className="rr-hw-bat-body"
          d="M40 12 C43 12 45 15 45 19 C45 24 43 29 40 32 C37 29 35 24 35 19 C35 15 37 12 40 12 Z"
        />
        {/* Ears, which is most of what makes a silhouette read as a bat. */}
        <path className="rr-hw-bat-body" d="M37 13 L35 8 L39 11 Z" />
        <path className="rr-hw-bat-body" d="M43 13 L45 8 L41 11 Z" />
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
