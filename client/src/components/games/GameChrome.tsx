import { ReactNode } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import BrandWait from "@/components/brand/BrandWait";

export function GameShell({ children }: { children: ReactNode }) {
  return (
    <div className="rr-game rr-page relative min-h-screen bg-[#050505] text-white">
      <DigitalAtmosphere />
      <Header />
      <div className="relative z-10">{children}</div>
      <Footer />
    </div>
  );
}

type HeroProps = {
  kicker: string;
  title: string;
  subtitle?: string;
  remaining?: number | string;
  remainingLabel?: string;
  Icon?: LucideIcon;
};

export function GameHero({
  kicker,
  title,
  subtitle,
  remaining,
  remainingLabel = "plays left",
  Icon,
}: HeroProps) {
  return (
    <div className="mb-6 text-center sm:mb-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
        {Icon ? <Icon className="h-3.5 w-3.5 text-[#F1D47A]" /> : null}
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
          {kicker}
        </span>
      </div>
      <h1 className="font-prize text-4xl text-white sm:text-5xl lg:text-6xl">{title}</h1>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/50 sm:text-base">{subtitle}</p>
      ) : null}
      {remaining !== undefined && (
        <div className="rr-game-remaining mt-4 inline-flex items-center gap-2 rounded-full border border-[#F1D47A]/30 bg-[#F1D47A]/10 px-4 py-1.5">
          <span className="font-prize text-2xl leading-none text-[#F1D47A]">{remaining}</span>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">
            {remainingLabel}
          </span>
        </div>
      )}
    </div>
  );
}

export function GameStatus({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <GameShell>
      <BrandWait
        mode="embed"
        kicker="Loading play"
        headline="Getting ready"
        subtitle={message}
      />
      {actionLabel && onAction ? (
        <div className="-mt-10 flex justify-center pb-16">
          <button type="button" onClick={onAction} className="rr-cta px-6 py-2.5 text-sm">
            {actionLabel}
          </button>
        </div>
      ) : null}
    </GameShell>
  );
}

export function GameEmpty({
  title,
  message,
  actionLabel,
  href,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
}) {
  const btn = (
    <span className="rr-cta mt-6 inline-flex px-6 py-2.5 text-sm">{actionLabel}</span>
  );
  return (
    <GameShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="font-prize text-4xl">{title}</h1>
        <p className="mt-2 max-w-md text-white/50">{message}</p>
        {href ? (
          <Link href={href}>{btn}</Link>
        ) : onAction ? (
          <button type="button" onClick={onAction}>
            {btn}
          </button>
        ) : null}
      </div>
    </GameShell>
  );
}

export function GameDisclaimer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 sm:items-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mb-3 w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0A0D] p-5 shadow-2xl sm:mb-0 sm:p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
            Fair play
          </span>
        </div>
        <p className="text-sm leading-relaxed text-white/70 sm:text-base">
          <span className="font-semibold text-white">Disclaimer:</span> On-screen graphics are for
          entertainment only. Prize outcomes are securely pre-selected before gameplay and are not
          influenced by animations.
        </p>
        <button type="button" onClick={onClose} className="rr-cta mt-5 w-full py-3 text-sm">
          Got it — let’s play
        </button>
      </div>
    </div>
  );
}
