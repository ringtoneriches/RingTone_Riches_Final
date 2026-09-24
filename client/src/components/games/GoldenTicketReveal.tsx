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

const INK = "#050505";

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

  const notch = (side: "left" | "right") => (
    <span
      aria-hidden
      className="absolute top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full"
      style={{
        background: INK,
        boxShadow: "inset 0 0 0 1px rgba(241,212,122,0.30)",
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
            radial-gradient(ellipse 70% 50% at 50% 44%, rgba(70,52,8,.40) 0%, rgba(5,5,5,1) 62%),
            ${INK};
        }
        .rr-gt-line { animation: rr-gt-fade .5s ease-out both; }
        .rr-gt-ticket { animation: rr-gt-rise .6s cubic-bezier(.2,.9,.3,1.05) both; }
        .rr-gt-sheen { animation: rr-gt-sheen 3s ease-in-out .7s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rr-gt-root, .rr-gt-line, .rr-gt-ticket { animation: rr-gt-fade .2s ease-out both }
          .rr-gt-sheen { animation: none; opacity: 0 }
        }
      `}</style>

      {/* Beat one: say where this came from, before showing what it is. */}
      <p
        className="rr-gt-line mb-7 text-center text-[11px] font-black uppercase tracking-[0.34em] text-[#D4AF37]"
        data-testid="golden-ticket-kicker"
      >
        Ringtone Riches has something for you
      </p>

      {stage === "ticket" && (
        <div className="rr-gt-ticket relative w-full max-w-[430px]">
          <div
            className="relative rounded-[14px] p-[1.5px]"
            style={{ background: "linear-gradient(135deg,#FFF3C4 0%,#C9A227 28%,#FFF0BC 52%,#8a6b1f 100%)" }}
          >
            <div className="relative rounded-[12px]" style={{ backgroundColor: "#0B0B0D" }}>
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]">
                <div
                  className="rr-gt-sheen absolute inset-y-0 -left-1/3 w-1/3 skew-x-12"
                  style={{ background: "linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,248,238,.16) 50%,rgba(255,255,255,0) 100%)" }}
                />
              </div>

              {/* Stub: who issued this. */}
              <div className="flex items-center justify-between px-5 py-3">
                <span className="font-prize text-[13px] leading-none tracking-wide text-[#F1D47A]">
                  RINGTONE RICHES
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.26em] text-[#D4AF37]/70">
                  Golden Ticket
                </span>
              </div>

              {/* Perforation, with notches punched out of the edges. */}
              <div className="relative">
                {notch("left")}
                {notch("right")}
                <div className="mx-5 border-t border-dashed border-[#F1D47A]/35" />
              </div>

              <div className="px-6 pb-7 pt-7 text-center sm:px-8">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">
                  {isCash ? "Awarded to you" : "You've won"}
                </p>

                <h2 className="font-prize mt-3 text-[2.5rem] leading-[0.98] text-white sm:text-[3rem]">
                  {isCash && amount ? amount : award.prizeName}
                </h2>

                {isCash ? (
                  <p className="mt-2 text-sm font-bold text-[#F1D47A]">{award.prizeName}</p>
                ) : null}

                {award.prizeImageUrl && (
                  <img
                    src={award.prizeImageUrl}
                    alt=""
                    className="mx-auto mt-5 max-h-36 w-auto rounded-lg border border-[#F1D47A]/25"
                    loading="lazy"
                  />
                )}

                {award.prizeDescription && (
                  <p className="mx-auto mt-4 max-w-[19rem] text-sm leading-relaxed text-white/60">
                    {award.prizeDescription}
                  </p>
                )}

                {/* The point of the whole design. */}
                <div className="mx-auto mt-6 max-w-[20rem] rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-xs leading-relaxed text-white/65">
                    This is a <strong className="font-bold text-white/85">separate prize from Ringtone Riches</strong>
                    {" "}— nothing to do with the game you just played, and it doesn&rsquo;t affect that result.
                  </p>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-white/45">
                  {award.fulfilmentStatus === "auto_credited"
                    ? "It's already in your wallet. Nothing else to do."
                    : "We'll be in touch to arrange it with you."}
                </p>
              </div>

              <div className="border-t border-[#F1D47A]/15 px-5 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-lg bg-[#F1D47A] px-8 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-[#050505] transition-transform duration-200 hover:-translate-y-0.5"
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
