import { ReactNode } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import { Gift, LucideIcon, RotateCw, Sparkles, Target, Trophy, Zap } from "lucide-react";

export function ListingShell({ children }: { children: ReactNode }) {
  return (
    <div className="rr-listing rr-page relative min-h-screen overflow-x-clip bg-[#050505] text-white">
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <div className="relative z-10">
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  );
}

export type ListingFilter = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export const DEFAULT_LISTING_FILTERS: ListingFilter[] = [
  { id: "all", label: "All Games", icon: Trophy },
  { id: "spin", label: "Spin to Win", icon: RotateCw },
  { id: "scratch", label: "Scratch Nations", icon: Sparkles },
  { id: "instant", label: "Competitions", icon: Gift },
];

export const POP_LISTING_FILTERS: ListingFilter[] = [
  { id: "all", label: "All Games", icon: Trophy },
  { id: "spin", label: "Spin Wheel", icon: RotateCw },
  { id: "scratch", label: "Scratch Card", icon: Sparkles },
  { id: "pop", label: "Ringtone Pop", icon: Target },
  { id: "instant", label: "Instant Win", icon: Gift },
];

export const VOLTZ_LISTING_FILTERS: ListingFilter[] = [
  { id: "all", label: "All Games", icon: Trophy },
  { id: "spin", label: "Spin Wheel", icon: RotateCw },
  { id: "scratch", label: "Scratch Card", icon: Sparkles },
  { id: "pop", label: "Ringtone Pop", icon: Target },
  { id: "voltz", label: "Ringtone Voltz", icon: Zap },
  { id: "instant", label: "Instant Win", icon: Gift },
];

export function ListingHero({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8 text-center sm:mb-10">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF263D] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF263D]" />
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
          {kicker}
        </span>
      </div>
      <h1 className="font-prize text-4xl text-white sm:text-5xl">{title}</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm text-white/45">{subtitle}</p>
    </div>
  );
}

export function ListingFilters({
  filters,
  active,
  onChange,
  testIdPrefix,
}: {
  filters: ListingFilter[];
  active: string;
  onChange: (id: string) => void;
  testIdPrefix?: string;
}) {
  return (
    <div className="rr-filter-bar mb-8" role="tablist" aria-label="Filter competitions">
      {filters.map((filter) => {
        const Icon = filter.icon;
        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={active === filter.id}
            onClick={() => onChange(filter.id)}
            className={`rr-filter-chip ${active === filter.id ? "is-active" : ""}`}
            data-testid={testIdPrefix ? `${testIdPrefix}${filter.id}` : `filter-${filter.id}`}
          >
            <span className="rr-filter-icon" aria-hidden>
              <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ListingEmpty({ title, message }: { title: string; message: string }) {
  return (
    <div className="py-20 text-center">
      <h3 className="font-prize text-2xl text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/45">{message}</p>
    </div>
  );
}
