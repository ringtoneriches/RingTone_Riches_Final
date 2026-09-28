import { useEffect, useRef, useState } from "react";

/**
 * Something watching from the dark at the edge of a section.
 *
 * Drawn rather than sourced. A stock photograph of a grinning pumpkin would
 * need a licence, weigh a few hundred kilobytes, and look like clip art pasted
 * onto a dark page. This is a few hundred bytes of SVG, tints to the brand,
 * scales to any size and can blink.
 *
 * The motif is deliberately eyes first. A whole face rendered in detail reads
 * as a cartoon; a pair of eyes and the suggestion of a grin, mostly swallowed
 * by the dark, is what actually unsettles people — and it stays out of the way
 * of the prizes, which is the part of the page that has a job to do.
 */

type Props = {
  /** Which way it leans out of the shadow. */
  side: "left" | "right";
  /** Amber is the house colour; the sickly green is for variety. */
  tone?: "amber" | "green";
  size?: number;
  /** Blink offset, so two of them on one page are not synchronised. */
  delay?: string;
};

export default function LurkingFace({ side, tone = "amber", size = 110, delay = "0s" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [awake, setAwake] = useState(false);

  // Nothing blinks until it is near the viewport. On a page this tall, most of
  // these are thousands of pixels away for most of the visit.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setAwake(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setAwake(entries.some((e) => e.isIntersecting)),
      { rootMargin: "150px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const eye = tone === "green" ? "#9BE86B" : "#FFB13B";
  const glow = tone === "green" ? "rgba(155,232,107,0.55)" : "rgba(255,177,59,0.55)";

  return (
    <div
      ref={ref}
      className={`rr-hw-lurker rr-hw-lurker--${side} ${awake ? "is-awake" : ""}`}
      style={{ width: size, ["--lurk-delay" as string]: delay, ["--lurk-glow" as string]: glow }}
      aria-hidden
    >
      <svg viewBox="0 0 120 72" width="100%" height="auto" fill="none">
        <defs>
          <radialGradient id={`lurk-${side}-${tone}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={eye} stopOpacity="0.95" />
            <stop offset="55%" stopColor={eye} stopOpacity="0.35" />
            <stop offset="100%" stopColor={eye} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* The haze each eye throws, which is most of what sells it as a light
            in the dark rather than a shape on a page. */}
        <circle cx="38" cy="26" r="26" fill={`url(#lurk-${side}-${tone})`} />
        <circle cx="82" cy="26" r="26" fill={`url(#lurk-${side}-${tone})`} />

        {/* The eyes themselves. Leaning inward: level eyes look friendly, and
            the tilt is what makes it read as a glare. */}
        <g className="rr-hw-lurker-eyes">
          <path d="M26 28 Q38 16 50 28 Q38 34 26 28 Z" fill={eye} />
          <path d="M70 28 Q82 16 94 28 Q82 34 70 28 Z" fill={eye} />
        </g>

        {/* A grin, only just there. Teeth drawn as gaps rather than shapes, so
            it stays a suggestion instead of a jack-o'-lantern. */}
        <g className="rr-hw-lurker-grin" opacity="0.5">
          <path
            d="M34 48 Q60 66 86 48"
            stroke={eye}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path d="M46 53 l0 6 M60 56 l0 7 M74 53 l0 6" stroke="#0A0A0C" strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
}
