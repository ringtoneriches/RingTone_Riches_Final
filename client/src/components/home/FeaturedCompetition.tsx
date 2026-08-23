import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Ticket } from "lucide-react";
import ChaserBorder from "./ChaserBorder";
import DigitalAtmosphere from "./DigitalAtmosphere";
import TrustStrip from "./TrustStrip";
import QuantitySelector from "./QuantitySelector";
import CountdownBlocks from "./CountdownBlocks";
import SoldProgress from "./SoldProgress";
import { useCountdown } from "@/hooks/useCountdown";
import {
  getCompetitionBadgeLabel,
  getCompetitionTypeConfig,
  getCtaLabel,
  getFallbackImage,
  getPrizeOffer,
  getStatusBadge,
  getTicketStats,
} from "@/lib/competition-display";

type Props = {
  competitions: Competition[];
};

function FeaturedSlide({
  competition,
  qty,
  setQty,
  active,
}: {
  competition: Competition;
  qty: number;
  setQty: (n: number) => void;
  active: boolean;
}) {
  const [, setLocation] = useLocation();
  const stats = getTicketStats(competition);
  const typeCfg = getCompetitionTypeConfig(competition.type);
  const badgeLabel = getCompetitionBadgeLabel(competition);
  const offer = getPrizeOffer(competition);
  const cd = useCountdown(active ? competition.endDate : null);
  const badge = getStatusBadge(stats);
  const cta = getCtaLabel(competition.type, stats.isClosed);
  const maxQty = stats.hasTickets ? Math.max(1, stats.remaining) : 20;
  const TypeIcon = typeCfg.Icon;

  const goEnter = () => {
    if (stats.isClosed) return;
    setLocation(`/competition/${competition.id}?qty=${qty}`);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-0">
      <div className={`relative overflow-hidden bg-[#0A0A0D] lg:min-h-[520px] ${active ? "lg:rr-art-sweep" : ""}`}>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0A0A0D] sm:aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto">
          <img
            src={competition.imageUrl || getFallbackImage(competition.type)}
            alt={competition.title}
            className={`h-full w-full object-cover object-top lg:object-center ${active ? "lg:rr-art-drift" : ""}`}
            loading={active ? "eager" : "lazy"}
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallbackApplied === "1") return;
              img.dataset.fallbackApplied = "1";
              img.src = getFallbackImage(competition.type);
            }}
          />
        </div>
        <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-[#0A0A0D]/80 lg:block" />
        <div className="absolute top-4 left-4 z-[2] flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C8102E] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
            Featured
          </span>
          {!stats.isClosed && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8102E]/50 bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF263D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF263D]" />
              LIVE
            </span>
          )}
        </div>
      </div>

      <div className="relative flex flex-col justify-center border-t border-white/10 p-4 pb-6 sm:p-8 lg:border-t-0 lg:p-10 lg:pb-20">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#F1D47A]">
            <TypeIcon className="h-3 w-3" />
            {badgeLabel}
          </span>
          <span className="rounded-md bg-[#C8102E]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF263D]">
            {badge}
          </span>
        </div>

        {offer.kicker && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">{offer.kicker}</p>
        )}
        <h1 className="font-prize text-[2rem] sm:text-5xl lg:text-6xl leading-[0.95] text-white break-words">
          {offer.amount || competition.title}
        </h1>
        {offer.amount && (
          <p className="mt-2 text-sm font-semibold text-white/55 line-clamp-2">{competition.title}</p>
        )}

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Entry</p>
            <p className="font-prize text-2xl sm:text-4xl text-[#F1D47A]">
              {stats.isFree ? "FREE" : `£${parseFloat(competition.ticketPrice).toFixed(2)}`}
            </p>
          </div>
          {stats.endDate && (
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
                {stats.isExpired ? "Ended" : "Time left"}
              </p>
              <CountdownBlocks time={cd} size="lg" ended={stats.isExpired} />
            </div>
          )}
        </div>

        {stats.hasTickets && (
          <div className="mt-5">
            <SoldProgress pct={stats.pct} sold={stats.soldT} />
          </div>
        )}

        <div className="mt-5 sm:mt-6 flex items-center gap-2 sm:gap-3">
          {!stats.isClosed && (
            <QuantitySelector
              value={qty}
              max={maxQty}
              onChange={setQty}
              size="lg"
            />
          )}
          <button
            type="button"
            disabled={stats.isClosed}
            onClick={goEnter}
            className="rr-cta h-12 sm:h-14 min-w-0 flex-1 rounded-xl px-3 sm:px-6 text-[12px] sm:text-base font-black uppercase tracking-[0.1em] sm:tracking-[0.16em] whitespace-nowrap disabled:opacity-50 disabled:hover:transform-none"
            data-testid={`button-featured-enter-${competition.id}`}
          >
            {cta}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setLocation(`/competition/${competition.id}`)}
          className="mt-3 inline-flex items-center gap-2 self-start text-xs font-bold uppercase tracking-widest text-white/45 hover:text-[#F1D47A] transition-colors"
        >
          <Ticket className="h-3.5 w-3.5" />
          View competition
        </button>
      </div>
    </div>
  );
}

export default function FeaturedCompetition({ competitions }: Props) {
  const [qty, setQty] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [starsOn, setStarsOn] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const count = competitions.length;
  const competition = competitions[Math.min(activeIndex, Math.max(count - 1, 0))];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setStarsOn(entry.isIntersecting),
      { rootMargin: "80px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!competition) return null;

  const goToSlide = (index: number) => {
    if (index < 0 || index >= count || index === activeIndex) return;
    setActiveIndex(index);
    setQty(1);
  };

  const atFirst = activeIndex === 0;
  const atLast = activeIndex === count - 1;

  return (
    <section ref={sectionRef} className="relative overflow-hidden pt-6 pb-8 sm:pt-8 sm:pb-12 lg:pb-16" data-testid="section-featured-competition">
      {starsOn && <DigitalAtmosphere stars layers={false} />}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ChaserBorder variant="featured" className="shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <div className="relative overflow-hidden bg-[#0A0A0D] lg:pb-8">
            <div className="pointer-events-none absolute inset-0 z-[1]" style={{ boxShadow: "inset 0 0 80px rgba(200,16,46,0.08)" }} />
            <div className="overflow-hidden">
              <div
                className="rr-featured-track flex"
                style={{
                  width: `${Math.max(count, 1) * 100}%`,
                  transform: `translateX(${-((activeIndex * 100) / Math.max(count, 1))}%)`,
                }}
              >
                {competitions.map((item, index) => (
                  <div
                    key={item.id}
                    className={`shrink-0 ${index === activeIndex ? "pointer-events-auto" : "pointer-events-none"}`}
                    style={{ width: `${100 / Math.max(count, 1)}%` }}
                    aria-hidden={index !== activeIndex}
                  >
                    <FeaturedSlide
                      competition={item}
                      qty={index === activeIndex ? qty : 1}
                      setQty={setQty}
                      active={index === activeIndex}
                    />
                  </div>
                ))}
              </div>
            </div>
            {count > 1 && (
              <div className="relative z-20 flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-6 lg:absolute lg:bottom-6 lg:right-6 lg:z-20 lg:flex-col lg:items-end lg:gap-3 lg:border-0 lg:px-0 lg:py-0">
                <div className="flex items-center gap-2" aria-label="Featured competitions">
                  {competitions.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Show featured: ${item.title}`}
                      aria-current={index === activeIndex}
                      onClick={() => goToSlide(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === activeIndex
                          ? "w-10 bg-gradient-to-r from-[#C8102E] to-[#D4AF37]"
                          : "w-2 bg-white/25 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    aria-label="Previous featured competition"
                    disabled={atFirst}
                    onClick={() => goToSlide(activeIndex - 1)}
                    className="rr-slide-arrow"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next featured competition"
                    disabled={atLast}
                    onClick={() => goToSlide(activeIndex + 1)}
                    className="rr-slide-arrow"
                  >
                    <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </ChaserBorder>

        <div className="mt-10 sm:mt-12 lg:mt-14">
          <TrustStrip />
        </div>
      </div>
    </section>
  );
}

