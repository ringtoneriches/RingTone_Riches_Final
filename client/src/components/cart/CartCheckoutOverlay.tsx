import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { gameTypeLabel } from "@/lib/play-paths";
import type { BasketItem } from "@/lib/basket";
import type { CartCheckoutProgress } from "@/lib/cart-card-checkout";
import { CheckoutPulse } from "@/components/cart/CheckoutLaunch";

const WAIT_LINES = [
  "This might take a few seconds.",
  "Lining up each play in your cart.",
  "Stay on this page — don’t close the tab.",
];

type Props = {
  open: boolean;
  items: BasketItem[];
  progress: CartCheckoutProgress | null;
};

const VISIBLE = 3;
const ROW = 64; // card 56px + gap 8px

function shortTitle(title: string) {
  const clean = title.replace(/\s+/g, " ").trim();
  return clean.length > 42 ? `${clean.slice(0, 40)}…` : clean;
}

export default function CartCheckoutOverlay({ open, items, progress }: Props) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => {
      setLineIndex((current) => (current + 1) % WAIT_LINES.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const total = progress?.total || items.length || 1;
  const step = progress?.step ?? 0;
  const phase = progress?.phase || "adding";
  const opening = phase === "opening";
  const paying = phase === "paying" || opening;
  const bar = opening ? 100 : Math.min(92, Math.round((Math.max(step, 0.15) / total) * 88));
  const headline = paying
    ? "Confirming your payment"
    : step > 0
      ? `Preparing ${step} of ${total}`
      : "Preparing your cart";
  const readyCount = opening ? items.length : Math.max(step, 0);
  const shown = items.slice(0, readyCount);
  const waitLine = WAIT_LINES[lineIndex];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4"
      role="alertdialog"
      aria-modal="true"
      aria-live="polite"
      aria-label={headline}
    >
      <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md" />
      <div className="relative max-h-[90vh] w-full max-w-[26rem] overflow-y-auto overflow-x-hidden rounded-3xl border border-[#F1D47A]/25 bg-[#0A0A0D] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F1D47A]/70 to-transparent" />
        <div className="px-6 pb-6 pt-8 sm:px-8">
          <div className="mx-auto">
            <CheckoutPulse size="sm" force="night" />
          </div>

          <p className="mt-5 text-center text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
            Stay on this page
          </p>
          <h2 className="mt-2 text-center font-prize text-3xl leading-none text-white sm:text-[2.1rem]">
            {headline}
          </h2>
          <div className="rr-confirm-cycle mx-auto mt-3 max-w-[18.5rem] text-center text-sm leading-relaxed text-white/50">
            <p key={waitLine} className="rr-confirm-cycle__line">
              {waitLine}
            </p>
          </div>

          <div className="rr-confirm-promo">
            <p className="rr-confirm-promo__kicker">Ringtone Riches</p>
            <p className="rr-confirm-promo__title">More plays.<br />Bigger shots.</p>
            <p className="rr-confirm-promo__tag">Win bigger. Play louder.</p>
          </div>

          <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C8102E] via-[#FF263D] to-[#F1D47A] transition-all duration-500 ease-out"
              style={{ width: `${bar}%` }}
            />
          </div>

          {shown.length > 0 && (
            <div className="relative mt-5 h-[7.6rem] overflow-hidden sm:h-[11.5rem]">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-[#0A0A0D] to-transparent" />
              <ul
                className="flex flex-col gap-2 will-change-transform"
                style={{
                  transform: `translateY(${(VISIBLE - shown.length) * ROW}px)`,
                  transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {shown.map((item, index) => {
                  const globalIndex = index;
                  const done = opening || (step > 0 && globalIndex < step - 1);
                  const active = !opening && step > 0 && globalIndex === step - 1;
                  const newest = globalIndex === shown.length - 1;
                  return (
                    <li
                      key={item.competitionId}
                      className={`flex h-14 items-center gap-3 rounded-xl border px-3 ${
                        active
                          ? "border-[#F1D47A]/35 bg-[#F1D47A]/8"
                          : "border-white/8 bg-white/[0.03]"
                      } ${newest ? "rr-cart-card-in" : ""}`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          done
                            ? "border-[#F1D47A]/40 bg-[#F1D47A] text-black"
                            : "border-[#F1D47A]/50 text-[#F1D47A]"
                        }`}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#F1D47A]/80">
                          {gameTypeLabel(item.type)}
                          {item.quantity > 1 ? ` · ×${item.quantity}` : ""}
                        </span>
                        <span
                          className={`mt-0.5 block truncate text-sm font-semibold ${
                            active ? "text-white" : "text-white/70"
                          }`}
                        >
                          {shortTitle(item.title)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
