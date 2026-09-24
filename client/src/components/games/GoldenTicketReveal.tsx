import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import congrats from "../../../../attached_assets/sounds/congrats.mp3";

/**
 * The Golden Ticket takeover.
 *
 * Deliberately unlike an ordinary win: the game has already finished and the
 * player may well have been told they won nothing, so this has to read as a
 * separate event rather than a late correction to the result.
 *
 * Rendered through a portal so it sits above canvas and Phaser game surfaces,
 * which otherwise paint over anything in their own stacking context.
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

const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 137.5) % 100}%`,
  delay: `${(i % 7) * 0.18}s`,
  duration: `${2.6 + (i % 4) * 0.45}s`,
  size: i % 3 === 0 ? 8 : 5,
}));

export default function GoldenTicketReveal({ award, onClose }: Props) {
  const playedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!award) return;
    // Guard against a re-render replaying the sound for the same ticket.
    if (playedFor.current === award.winId) return;
    playedFor.current = award.winId;
    try {
      const audio = new Audio(congrats);
      audio.volume = 0.55;
      audio.play().catch(() => {});
    } catch {
      /* A blocked autoplay must not break the reveal. */
    }
  }, [award]);

  useEffect(() => {
    if (!award) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Nothing behind this should scroll while it is open.
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

  return createPortal(
    <div
      className="rr-gt-overlay fixed inset-0 z-[9999] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Golden Ticket won"
      data-testid="golden-ticket-reveal"
    >
      <style>{`
        @keyframes rr-gt-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rr-gt-in {
          0%   { opacity: 0; transform: translateY(26px) scale(.9) rotate(-3deg) }
          60%  { opacity: 1; transform: translateY(-6px) scale(1.02) rotate(.6deg) }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0) }
        }
        @keyframes rr-gt-sheen { from { transform: translateX(-120%) } to { transform: translateX(220%) } }
        @keyframes rr-gt-spark {
          0%   { opacity: 0; transform: translateY(12vh) scale(.5) }
          25%  { opacity: 1 }
          100% { opacity: 0; transform: translateY(-58vh) scale(1) }
        }
        .rr-gt-overlay { animation: rr-gt-fade .28s ease-out both;
          background: radial-gradient(ellipse 70% 60% at 50% 45%, rgba(60,44,8,.92) 0%, rgba(5,5,5,.96) 70%); }
        .rr-gt-card { animation: rr-gt-in .72s cubic-bezier(.2,.9,.3,1.1) both; }
        .rr-gt-sheen { animation: rr-gt-sheen 2.6s ease-in-out .5s infinite; }
        .rr-gt-spark { animation-name: rr-gt-spark; animation-timing-function: ease-out;
          animation-iteration-count: infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rr-gt-overlay, .rr-gt-card { animation: rr-gt-fade .2s ease-out both }
          .rr-gt-sheen, .rr-gt-spark { animation: none; opacity: 0 }
        }
      `}</style>

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className="rr-gt-spark absolute bottom-0 rounded-full"
            style={{
              left: s.left,
              width: s.size,
              height: s.size,
              background: "radial-gradient(circle, #FFF3C4 0%, #F1D47A 45%, rgba(241,212,122,0) 70%)",
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
      </div>

      <div className="rr-gt-card relative w-full max-w-md">
        <div
          className="relative overflow-hidden rounded-2xl border p-[1.5px]"
          style={{ background: "linear-gradient(140deg,#F1D47A 0%,#8a6b1f 32%,#F1D47A 58%,#6b5115 100%)", borderColor: "#F1D47A" }}
        >
          <div className="relative overflow-hidden rounded-[14px] bg-[#0A0A0C] px-6 py-8 text-center sm:px-9 sm:py-10">
            <div
              aria-hidden
              className="rr-gt-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12"
              style={{ background: "linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,248,238,.16) 50%,rgba(255,255,255,0) 100%)" }}
            />

            {/* Drawn rather than the 🎟️ emoji, which renders pink on Apple
                platforms and differently again on Windows and Android. */}
            <svg
              className="mx-auto mb-5 h-14 w-auto sm:h-16"
              viewBox="0 0 96 64"
              fill="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="rr-gt-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFF3C4" />
                  <stop offset="45%" stopColor="#F1D47A" />
                  <stop offset="100%" stopColor="#C9A227" />
                </linearGradient>
              </defs>
              <path
                d="M6 12h84v14a7 7 0 0 0 0 14v12H6V40a7 7 0 0 0 0-14V12Z"
                fill="url(#rr-gt-gold)"
                stroke="#8a6b1f"
                strokeWidth="1.5"
              />
              <path d="M36 14v36" stroke="#8a6b1f" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx="61" cy="32" r="8" fill="none" stroke="#8a6b1f" strokeWidth="2" />
              <path d="M61 26v12M55 32h12" stroke="#8a6b1f" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
              Golden Ticket found
            </p>

            <h2 className="font-prize mt-3 text-[2rem] leading-[1.05] text-white sm:text-[2.6rem]">
              {isCash && amount ? `YOU'VE WON ${amount}` : "YOU'VE WON"}
            </h2>

            <p className="mt-3 text-base font-bold text-[#F1D47A] sm:text-lg">{award.prizeName}</p>

            {award.prizeImageUrl && (
              <img
                src={award.prizeImageUrl}
                alt=""
                className="mx-auto mt-5 max-h-40 w-auto rounded-xl border border-[#F1D47A]/25"
                loading="lazy"
              />
            )}

            {award.prizeDescription && (
              <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-white/60">
                {award.prizeDescription}
              </p>
            )}

            <p className="mx-auto mt-5 max-w-xs text-xs leading-relaxed text-white/45">
              {award.fulfilmentStatus === "auto_credited"
                ? "It's already in your wallet — nothing else to do."
                : "We'll be in touch to arrange your prize."}
            </p>

            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/25">
              Separate from your game — this one's on us
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-7 w-full rounded-xl bg-[#F1D47A] px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#050505] transition-transform duration-200 hover:-translate-y-0.5"
              data-testid="button-golden-ticket-close"
            >
              {award.fulfilmentStatus === "auto_credited" ? "Brilliant" : "Great"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
