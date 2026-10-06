import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import congrats from "../../../../attached_assets/sounds/congrats.mp3";

/**
 * The Golden Ticket takeover.
 *
 * This has to read as something Ringtone Riches handed the player, not as the
 * result of the game they were playing — they may have just been told they
 * won nothing, and a prize appearing straight afterwards otherwise looks like
 * the game correcting itself.
 *
 * Three things do that work:
 *
 *   - An opaque backdrop. The game is gone, not dimmed behind it.
 *   - A physical ticket, with notches and a perforation, rather than the
 *     rounded card every game result uses.
 *   - It is signed. The brand is on the ticket and the copy says outright that
 *     this has nothing to do with the game.
 *
 * It also arrives in two beats — a line of text, then the ticket — so it does
 * not look like a popup that was queued behind the last one.
 *
 * Rendered through a portal so it sits above canvas and Phaser surfaces.
 */

export type GoldenTicketAward = {
  winId: string;
  campaignId: string;
  prizeType: string;
  prizeName: string;
  prizeValue: string | null;
  prizeDescription: string | null;
  prizeImageUrl: string | null;
  fulfilmentStatus: string;
};

type Props = {
  award: GoldenTicketAward | null;
  onClose: () => void;
};

/** The dark behind the ticket. Kept dark on purpose: a gold ticket on a pale
 *  backdrop stops looking like foil and starts looking like paper. */
const BACKDROP = "#050505";

/**
 * Warm near-black rather than pure black.
 *
 * Pure black on gold reads as printed-on rather than stamped-into, and at small
 * sizes it buzzes against the warm background. This sits where the shadows in
 * the foil already are, so the type looks part of the ticket.
 */
const INK = "#1E1403";
const INK_SOFT = "rgba(30, 20, 3, 0.74)";
const INK_FAINT = "rgba(30, 20, 3, 0.66)";

/** Lowercased and stripped of punctuation, for comparing two bits of copy. */
function normalise(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Words that say nothing the amount hasn't already said.
 *
 * A cash prize is usually named after its own value -- "£10 Golden Ticket" --
 * so printing the name under a £10 headline states the figure twice before the
 * description states it a third time. When the name is only the amount plus
 * one of these, it is dropped and the headline carries it alone. A name with
 * real content in it ("£10 Amazon Voucher") still shows.
 */
const EMPTY_LABEL = /^(golden ticket|cash|credit|cash prize|prize|wallet credit|bonus|voucher)?$/;

export default function GoldenTicketReveal({ award, onClose }: Props) {
  const playedFor = useRef<string | null>(null);
  const [stage, setStage] = useState<"intro" | "ticket">("intro");

  useEffect(() => {
    if (!award) {
      setStage("intro");
      return;
    }
    // Beat one is the line of text; beat two is the ticket itself.
    const t = window.setTimeout(() => setStage("ticket"), 900);
    return () => window.clearTimeout(t);
  }, [award]);

  useEffect(() => {
    if (!award || stage !== "ticket") return;
    if (playedFor.current === award.winId) return;
    playedFor.current = award.winId;
    try {
      const audio = new Audio(congrats);
      audio.volume = 0.55;
      audio.play().catch(() => {});
    } catch {
      /* A blocked autoplay must not break the reveal. */
    }
  }, [award, stage]);

  useEffect(() => {
    if (!award) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [award, onClose]);

  if (!award) return null;

  const isCash = award.prizeType === "cash" || award.prizeType === "credit";
  const amount =
    award.prizeValue != null
      ? `£${Number(award.prizeValue).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`
      : null;

  // Drop the label when it is only the headline figure wearing a hat.
  const labelRemainder = amount
    ? normalise(award.prizeName).replace(normalise(amount), "").trim()
    : normalise(award.prizeName);
  const showPrizeName = !EMPTY_LABEL.test(labelRemainder);

  const notch = (side: "left" | "right") => (
    <span
      aria-hidden
      className="absolute top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full"
      style={{
        background: BACKDROP,
        boxShadow: "inset 0 0 0 1px rgba(30,20,3,0.35)",
        [side]: "-16px",
      } as React.CSSProperties}
    />
  );

  return createPortal(
    <div
      className="rr-gt-root fixed inset-0 z-[9999] flex flex-col items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Golden Ticket from Ringtone Riches"
      data-testid="golden-ticket-reveal"
    >
      <style>{`
        @keyframes rr-gt-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rr-gt-rise {
          0%   { opacity: 0; transform: translateY(30px) scale(.94) }
          100% { opacity: 1; transform: translateY(0) scale(1) }
        }
        @keyframes rr-gt-sheen { from { transform: translateX(-130%) } to { transform: translateX(240%) } }
        /* Opaque: the game is gone, not sitting behind a blur. */
        .rr-gt-root {
          animation: rr-gt-fade .35s ease-out both;
          background:
            radial-gradient(ellipse 70% 50% at 50% 44%, rgba(90,66,10,.46) 0%, rgba(5,5,5,1) 62%),
            ${BACKDROP};
        }
        .rr-gt-line { animation: rr-gt-fade .5s ease-out both; }
        .rr-gt-ticket { animation: rr-gt-rise .6s cubic-bezier(.2,.9,.3,1.05) both; }
        .rr-gt-sheen { animation: rr-gt-sheen 3s ease-in-out .7s infinite; }

        /* Foil. Several stops rather than two, because real gold leaf changes
           hue across its surface -- a flat gradient reads as yellow plastic. */
        .rr-gt-foil {
          background:
            /* A pool of light over the middle. The copy sits here, and it needs
               an even field -- banding behind small text reads as a dirty
               print, not as foil. */
            radial-gradient(115% 78% at 50% 40%, rgba(255,250,222,.52) 0%, rgba(255,247,214,0) 62%),
            linear-gradient(118deg,
              #E2BD52 0%, #F6E6A6 15%, #FCF4CF 30%, #EACB6B 47%,
              #FAEFBE 63%, #DCB443 81%, #F3DF95 100%);
        }
        /* Engine-turning, the fine lathe pattern on share certificates and old
           tickets. Almost invisible on its own; it stops the foil looking flat. */
        .rr-gt-guilloche::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: .13;
          background:
            repeating-linear-gradient(58deg, rgba(30,20,3,.5) 0 1px, transparent 1px 7px),
            repeating-linear-gradient(-58deg, rgba(30,20,3,.4) 0 1px, transparent 1px 7px);
        }
        /* The punched edge. A mask rather than drawn circles, so the holes are
           actually missing from the ticket and the backdrop shows through. */
        .rr-gt-scallop {
          --rr-gt-hole: 11px;
          -webkit-mask-image:
            radial-gradient(var(--rr-gt-hole) at left  center, transparent 97%, #000 100%),
            radial-gradient(var(--rr-gt-hole) at right center, transparent 97%, #000 100%);
          -webkit-mask-composite: source-in;
          mask-image:
            radial-gradient(var(--rr-gt-hole) at left  center, transparent 97%, #000 100%),
            radial-gradient(var(--rr-gt-hole) at right center, transparent 97%, #000 100%);
          mask-composite: intersect;
        }
        @media (prefers-reduced-motion: reduce) {
          .rr-gt-root, .rr-gt-line, .rr-gt-ticket { animation: rr-gt-fade .2s ease-out both }
          .rr-gt-sheen { animation: none; opacity: 0 }
        }
      `}</style>

      {/* Beat one: say where this came from, before showing what it is. */}
      <p
        className="rr-gt-line mb-7 max-w-[22rem] text-center text-[10px] font-black uppercase tracking-[0.26em] text-[#D4AF37] [text-wrap:balance] sm:text-[11px] sm:tracking-[0.34em]"
        data-testid="golden-ticket-kicker"
      >
        Ringtone Riches has something for you
      </p>

      {stage === "ticket" && (
        <div className="rr-gt-ticket relative w-full max-w-[430px]">
          <div
            className="rr-gt-scallop relative rounded-[14px] p-[2px]"
            style={{
              // The rim: darker than the face, so the ticket has an edge rather
              // than fading into the backdrop.
              background:
                "linear-gradient(135deg,#8A6B1F 0%,#E8CD79 26%,#7A5B14 52%,#F0DE9E 76%,#6E5311 100%)",
            }}
          >
            <div className="rr-gt-foil rr-gt-guilloche relative overflow-hidden rounded-[12px]">
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]">
                <div
                  className="rr-gt-sheen absolute inset-y-0 -left-1/3 w-1/3 skew-x-12"
                  style={{ background: "linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.55) 50%,rgba(255,255,255,0) 100%)" }}
                />
              </div>

              {/* Stub: who issued this. */}
              {/* An engraved double rule, the way a real ticket is bordered.
                  Inset from the edge so the foil shows outside it. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[7px] rounded-[7px]"
                style={{ border: `1.5px solid ${INK}`, opacity: 0.5 }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[11px] rounded-[5px]"
                style={{ border: `0.5px solid ${INK}`, opacity: 0.32 }}
              />

              <div className="relative flex items-center justify-between px-7 pt-5">
                <span
                  className="text-[11px] font-black uppercase leading-none tracking-[0.2em]"
                  style={{ color: INK }}
                >
                  Ringtone Riches
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.26em]"
                  style={{ color: INK_FAINT }}
                >
                  Admit one
                </span>
              </div>

              {/* The title, in the serif the reference tickets use. */}
              <p
                className="relative mt-3 text-center font-serif text-[clamp(1.6rem,7vw,2.3rem)] font-bold leading-none tracking-[0.02em]"
                style={{ color: INK, textShadow: "0 1px 0 rgba(255,245,210,.55)" }}
              >
                GOLDEN TICKET
              </p>

              {/* Perforation, with notches punched out of the edges. */}
              <div className="relative">
                {notch("left")}
                {notch("right")}
                <div className="mx-7 border-t border-dashed" style={{ borderColor: INK_FAINT }} />
              </div>

              <div className="relative px-7 pb-6 pt-5 text-center sm:px-9">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.28em]"
                  style={{ color: INK_SOFT }}
                >
                  {isCash ? "Awarded to you" : "You've won"}
                </p>

                <h2
                  className="font-prize mt-2 text-[clamp(2.4rem,11vw,3.4rem)] leading-[0.95]"
                  style={{ color: INK, textShadow: "0 1px 0 rgba(255,246,214,.6)" }}
                >
                  {isCash && amount ? amount : award.prizeName}
                </h2>

                {isCash && showPrizeName ? (
                  <p className="mt-1.5 text-sm font-bold" style={{ color: INK_SOFT }}>
                    {award.prizeName}
                  </p>
                ) : null}

                {award.prizeImageUrl && (
                  <img
                    src={award.prizeImageUrl}
                    alt=""
                    className="mx-auto mt-5 max-h-36 w-auto rounded-lg"
                    style={{ border: `1px solid ${INK_FAINT}` }}
                    loading="lazy"
                  />
                )}

                {award.prizeDescription && (
                  <p
                    className="mx-auto mt-3 max-w-[19rem] text-sm leading-relaxed"
                    style={{ color: INK_SOFT }}
                  >
                    {award.prizeDescription}
                  </p>
                )}

                {/* The point of the whole design. */}
                <div
                  className="mx-auto mt-5 max-w-[20rem] rounded-lg px-4 py-3"
                  style={{
                    // Pressed into the foil rather than sitting on it. The fill
                    // is lighter than the foil, not darker: a dark translucent
                    // panel picks up whatever band of the gradient is behind it
                    // and reads as a smudge.
                    background:
                      "linear-gradient(180deg, rgba(255,252,236,.60), rgba(255,247,219,.34))",
                    border: "1px solid rgba(30,20,3,.20)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.55)",
                  }}
                >
                  <p className="text-xs leading-relaxed" style={{ color: INK_SOFT }}>
                    This is a <strong className="font-bold" style={{ color: INK }}>separate prize from Ringtone Riches</strong>
                    {" "}— nothing to do with the game you just played, and it doesn&rsquo;t affect that result.
                  </p>
                </div>

                <p className="mt-3.5 text-xs leading-relaxed" style={{ color: INK_FAINT }}>
                  {award.fulfilmentStatus === "auto_credited"
                    ? "It's already in your wallet. Nothing else to do."
                    : "We'll be in touch to arrange it with you."}
                </p>
              </div>

              <div className="relative px-7 pb-6 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-lg px-8 py-3.5 text-sm font-black uppercase tracking-[0.16em] transition-transform duration-200 hover:-translate-y-0.5"
                  style={{
                    // Inverted: a gold button on a gold ticket disappears.
                    background: INK,
                    color: "#F1D47A",
                    boxShadow: "0 2px 0 rgba(30,20,3,.35)",
                  }}
                  data-testid="button-golden-ticket-close"
                >
                  Back to the game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
