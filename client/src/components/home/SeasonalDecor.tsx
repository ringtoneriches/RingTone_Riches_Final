import { useSeason } from "@/hooks/useSeason";
import webCorner from "@assets/halloween-web-corner.webp";
import webTorn from "@assets/halloween-web-torn.webp";
import webStrand from "@assets/halloween-web-strand.webp";
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
   Cobwebs

   Photographs, keyed by their own brightness.

   These were generated: seeded spoke angles, per-strand sag, broken threads,
   per-strand lighting — a lot of machinery to imitate irregularity, and it
   still read as line art next to a real spider sitting on it.

   A web cannot be cut out the way the spider was. The spider was solid black
   on white, so filling from the border removed the background and left the
   subject. A web is pale, fine and semi-transparent: the background shows
   THROUGH it, and in most pixels the two are mixed. There is no edge to cut.

   So they were shot as white silk on pure black and the brightness of each
   pixel became its alpha. Black falls away to nothing, bright silk stays
   solid, and every half-lit strand between the two arrives at exactly the
   opacity it had — including threads only a tenth visible, which no cut-out
   would have kept. It is how smoke, fire and webs have always been
   composited, and it carries the dew with it for free.
   --------------------------------------------------------------------------- */

const WEBS = {
  corner: webCorner,
  torn: webTorn,
  strand: webStrand,
} as const;

type WebKind = keyof typeof WEBS;

function Cobweb({ kind, className = "" }: { kind: WebKind; className?: string }) {
  return (
    <img
      src={WEBS[kind]}
      alt=""
      aria-hidden
      draggable={false}
      decoding="async"
      className={`rr-hw-web ${className}`}
    />
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
      <Cobweb kind="corner" className="rr-hw-web--tl" />
      <Cobweb kind="torn" className="rr-hw-web--tr" />
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
      <Cobweb kind="strand" className="rr-hw-web--logo" />
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
      <Cobweb kind={variant === "a" ? "corner" : "torn"} />
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
