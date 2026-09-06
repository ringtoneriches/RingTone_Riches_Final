import { ReactNode, useEffect, useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import { Ban, Clock, XCircle } from "lucide-react";
import { CheckoutPulse } from "@/components/brand/BrandWait";
import CashbackBurst from "@/components/billing/CashbackBurst";

const PROCESS_LINES = [
  "This might take a few seconds.",
  "Locking in your plays.",
  "Stay on this page.",
];

export type PaymentResultVariant = "processing" | "success" | "cancelled" | "failed" | "waiting";

type Props = {
  kicker: string;
  title: string;
  message: string;
  variant: PaymentResultVariant;
  actionLabel?: string;
  onAction?: () => void;
  extra?: ReactNode;
  cashback?: number;
};

function ProcessingMark() {
  return <CheckoutPulse size="sm" force="night" />;
}

function SuccessMark() {
  return (
    <div className="rr-pay-success-wrap relative h-[5.5rem] w-[5.5rem]">
      <svg viewBox="0 0 56 56" className="h-full w-full" aria-hidden>
        <circle className="rr-pay-success-ring" cx="28" cy="28" r="24" fill="none" />
        <path className="rr-pay-success-check" d="M17.5 29.2 24.2 36 38.5 20.5" fill="none" />
      </svg>
    </div>
  );
}

function StatusMark({ variant }: { variant: PaymentResultVariant }) {
  if (variant === "processing" || variant === "waiting") return <ProcessingMark />;
  if (variant === "success") return <SuccessMark />;

  const wrap =
    variant === "failed"
      ? "border-[#C8102E]/40 bg-[#C8102E]/10 text-[#FF263D]"
      : "border-[#F1D47A]/35 bg-[#F1D47A]/10 text-[#F1D47A]";
  const Icon = variant === "failed" ? XCircle : variant === "cancelled" ? Ban : Clock;

  return (
    <div className={`flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full border ${wrap}`}>
      <Icon className="h-10 w-10" />
    </div>
  );
}

export default function PaymentResult({
  kicker,
  title,
  message,
  variant,
  actionLabel,
  onAction,
  extra,
  cashback,
}: Props) {
  const [lineIndex, setLineIndex] = useState(0);
  const processing = variant === "processing" || variant === "waiting";

  useEffect(() => {
    if (!processing) return;
    const timer = window.setInterval(() => {
      setLineIndex((current) => (current + 1) % PROCESS_LINES.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [processing]);

  const displayTitle = processing ? "CONFIRMING YOUR PAYMENT" : title;
  const displayMessage = processing ? PROCESS_LINES[lineIndex] : message;

  return (
    <div className="rr-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <DigitalAtmosphere />
      <Header />
      <main className="relative z-10 flex min-h-[70vh] items-center justify-center px-4 py-12 sm:py-16">
        <div className="relative w-full max-w-[26rem] overflow-hidden rounded-3xl border border-[#F1D47A]/25 bg-[#0A0A0D] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F1D47A]/70 to-transparent" />

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
              {kicker}
            </span>
          </div>

          <div className="mx-auto mb-6 flex justify-center">
            <StatusMark variant={variant} />
          </div>

          <h1 className="font-prize text-4xl leading-none text-white sm:text-5xl">{displayTitle}</h1>
          <div className="rr-confirm-cycle mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/50 sm:text-base">
            <p key={displayMessage} className="rr-confirm-cycle__line">
              {displayMessage}
            </p>
          </div>
          {processing ? (
            <div className="rr-confirm-promo mx-auto max-w-sm text-left">
              <p className="rr-confirm-promo__kicker">Ringtone Riches</p>
              <p className="rr-confirm-promo__title">More plays.<br />Bigger shots.</p>
              <p className="rr-confirm-promo__tag">Win bigger. Play louder.</p>
            </div>
          ) : null}
          {variant === "success" ? <CashbackBurst amount={Number(cashback) || 0} variant="hero" /> : null}
          {extra}

          {actionLabel && onAction ? (
            <button type="button" onClick={onAction} className="rr-cta mt-8 px-8 py-3 text-sm">
              {actionLabel}
            </button>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
