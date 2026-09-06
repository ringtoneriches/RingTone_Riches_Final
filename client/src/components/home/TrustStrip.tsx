import { Lock, Scale, Zap, Wallet } from "lucide-react";

const BADGES = [
  {
    Icon: Lock,
    title: "Locked down",
    sub: "SSL on every payment",
  },
  {
    Icon: Scale,
    title: "Fair chance",
    sub: "Every valid ticket has a chance",
  },
  {
    Icon: Zap,
    title: "Instant results",
    sub: "You'll know right away",
  },
  {
    Icon: Wallet,
    title: "Fast payouts",
    sub: "Winners receive their cash quickly",
  },
] as const;

export default function TrustStrip() {
  return (
    <div className="rr-trust-row" data-testid="section-trust-strip">
      {BADGES.map((badge) => (
        <div key={badge.title} className="rr-trust-chip">
          <span className="rr-trust-medal" aria-hidden>
            <badge.Icon className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white">{badge.title}</p>
          <p className="mt-1 text-[10px] font-semibold leading-snug text-white/50">{badge.sub}</p>
        </div>
      ))}
    </div>
  );
}
