import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Ticket, ShoppingCart } from "lucide-react";
import { useBasket } from "@/hooks/useBasket";
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
  getDefaultQuantity,
  getDrawCardTitle,
  getFallbackImage,
  getPrizeOffer,
  getStatusBadge,
  getTicketStats,
  isInstantWinGame,
} from "@/lib/competition-display";

type Props = {
  competitions: Competition[];
};

function isFeaturedControl(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  const control = target.closest("button, a, input, textarea, select, .rr-qty");
  if (!control) return false;
  return !control.closest("[data-featured-image]");
}

function FeaturedSlide({
  competition,
  qty,
  setQty,
  active,
  suppressNavRef,
  showSwipeHint,
  swipeHintLeaving,
}: {
  competition: Competition;
  qty: number;
  setQty: (n: number) => void;
  active: boolean;
  suppressNavRef: { current: boolean };
  showSwipeHint?: boolean;
  swipeHintLeaving?: boolean;
}) {
  const [, setLocation] = useLocation();
  const { add } = useBasket();
  const stats = getTicketStats(competition);
  const typeCfg = getCompetitionTypeConfig(competition.type);
  const badgeLabel = getCompetitionBadgeLabel(competition);
  const offer = getPrizeOffer(competition);
  const isDraw = !isInstantWinGame(competition.type);
  const cd = useCountdown(active ? competition.endDate : null);
  const badge = getStatusBadge(stats);
  const cta = getCtaLabel(competition.type, stats.isClosed);
  const maxQty = stats.hasTickets ? Math.max(1, stats.remaining) : 20;
  const TypeIcon = typeCfg.Icon;

  const goEnter = () => {
    if (stats.isClosed) return;
    setLocation(`/competition/${competition.id}?qty=${qty}`);
  };

  const goView = () => {
    if (suppressNavRef.current) return;
    setLocation(`/competition/${competition.id}`);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-0">
      <button
        type="button"
        data-featured-image
        onClick={goView}
        aria-label={`View ${competition.title}`}
        className={`relative block w-full cursor-pointer overflow-hidden bg-[#0A0A0D] text-left lg:min-h-[520px] ${active ? "lg:rr-art-sweep" : ""}`}
      >
        <div className="relative aspect-[4/3] max-h-[240px] w-full overflow-hidden bg-[#0A0A0D] sm:max-h-none sm:aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto lg:max-h-none">
          <img
            src={competition.imageUrl || getFallbackImage(competition.type)}
            alt=""
            className={`h-full w-full object-cover object-top lg:object-center ${active ? "lg:rr-art-drift" : ""}`}
            loading={active ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallbackApplied === "1") return;
              img.dataset.fallbackApplied = "1";
              img.src = getFallbackImage(competition.type);
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-[#0A0A0D]/80 lg:block" />
        <div className="pointer-events-none absolute top-4 left-4 z-[2]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C8102E] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
            Featured
          </span>
        </div>
        {!stats.isClosed && (
          <div className="pointer-events-none absolute top-4 right-4 z-[2]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8102E]/50 bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF263D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF263D]" />
              LIVE
            </span>
          </div>
        )}
        {showSwipeHint && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[3] flex justify-center lg:hidden" aria-hidden>
            <div className={`rr-swipe-hint ${swipeHintLeaving ? "is-out" : ""}`}>
              <ChevronLeft strokeWidth={2.5} />
              Swipe
              <ChevronRight strokeWidth={2.5} />
            </div>
          </div>
        )}
      </button>

      <div className="relative flex flex-col justify-center border-t border-white/10 p-4 pb-5 sm:p-8 lg:border-t-0 lg:p-10 lg:pb-20">
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#F1D47A]">
            <TypeIcon className="h-3 w-3" />
            {badgeLabel}
          </span>
          <span className="rounded-md bg-[#C8102E]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF263D]">
            {badge}
          </span>
        </div>

        {!isDraw && offer.kicker && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">{offer.kicker}</p>
        )}
        <h1
          className={
            isDraw
              ? "text-xl font-semibold leading-snug tracking-[-0.02em] text-white sm:text-3xl lg:text-4xl"
              : "font-prize text-[1.7rem] leading-[0.95] text-white break-words sm:text-5xl lg:text-6xl"
          }
        >
          {isDraw ? getDrawCardTitle(competition.title) : offer.amount || competition.title}
        </h1>
        {!isDraw && offer.amount && (
          <p className="mt-1.5 text-sm font-semibold text-white/55 line-clamp-2 sm:mt-2">{competition.title}</p>
        )}

        <div className="mt-4 sm:mt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Entry</p>
          <p className="font-prize text-2xl sm:text-4xl text-[#F1D47A]">
            {stats.isFree ? "FREE" : `£${parseFloat(competition.ticketPrice).toFixed(2)}`}
          </p>
        </div>

        {stats.hasTickets && (
          <div className="mt-4 sm:mt-5">
            <SoldProgress pct={stats.pct} sold={stats.soldT} />
          </div>
        )}

        {stats.endDate ? (
          <div className="mt-3 sm:mt-4">
            <CountdownBlocks time={cd} ended={stats.isExpired} variant="ends" />
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:mt-6">
          {!stats.isClosed && (
            <div className="flex items-stretch gap-2">
              <QuantitySelector
                value={qty}
                max={maxQty}
                onChange={setQty}
                size="lg"
                className="rr-qty shrink-0"
              />
              <button
                type="button"
                onClick={() => {
                  add(
                    {
                      competitionId: competition.id,
                      type: competition.type || "instant",
                      title: competition.title,
                      imageUrl: competition.imageUrl || undefined,
                      ticketPrice: competition.ticketPrice,
                      quantity: qty,
                      wheelType: competition.wheelType,
                    },
                    maxQty
                  );
                }}
                className="rr-add-cart-btn"
                data-testid={`button-featured-basket-${competition.id}`}
              >
                <ShoppingCart className="h-4 w-4 shrink-0" />
                <span>
                  Add<span className="rr-add-cart-btn-extra"> to cart</span>
                </span>
              </button>
            </div>
          )}
          <button
            type="button"
            disabled={stats.isClosed}
            onClick={goEnter}
            className="rr-cta h-12 w-full rounded-xl px-3 text-[12px] font-black uppercase tracking-[0.1em] sm:h-14 sm:px-6 sm:text-base sm:tracking-[0.16em] whitespace-nowrap disabled:opacity-50 disabled:hover:transform-none"
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [starsOn, setStarsOn] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const suppressNavRef = useRef(false);
  const swipeRef = useRef<{
    x: number;
    y: number;
    ignore: boolean;
    locked: "x" | "y" | null;
  } | null>(null);
  const count = competitions.length;
  const competition = competitions[Math.min(activeIndex, Math.max(count - 1, 0))];
  const featuredMax = competition
    ? getTicketStats(competition).hasTickets
      ? Math.max(1, getTicketStats(competition).remaining)
      : 20
    : 20;
  const [qty, setQty] = useState(() =>
    competition ? getDefaultQuantity(competition, featuredMax) : 1
  );
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [swipeHintLeaving, setSwipeHintLeaving] = useState(false);
  const swipeHintTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!competition) return;
    const stats = getTicketStats(competition);
    const maxQty = stats.hasTickets ? Math.max(1, stats.remaining) : 20;
    setQty(getDefaultQuantity(competition, maxQty));
  }, [competition?.id, competition?.defaultQuantity]);

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

  useEffect(() => {
    if (count < 2 || !showSwipeHint) return;
    swipeHintTimer.current = window.setTimeout(() => {
      setSwipeHintLeaving(true);
      window.setTimeout(() => setShowSwipeHint(false), 320);
    }, 5200);
    return () => {
      if (swipeHintTimer.current) window.clearTimeout(swipeHintTimer.current);
    };
  }, [count, showSwipeHint]);

  if (!competition) return null;

  const goToSlide = (index: number) => {
    if (index < 0 || index >= count || index === activeIndex) return;
    setActiveIndex(index);
    dismissSwipeHint();
  };

  const dismissSwipeHint = () => {
    if (!showSwipeHint) return;
    setSwipeHintLeaving(true);
    window.setTimeout(() => setShowSwipeHint(false), 320);
  };

  const finishSwipe = (clientX: number, clientY: number) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || start.ignore || start.locked === "y") return;
    const dx = clientX - start.x;
    const dy = clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    dismissSwipeHint();
    suppressNavRef.current = true;
    window.setTimeout(() => {
      suppressNavRef.current = false;
    }, 350);
    if (dx < 0) goToSlide(activeIndex + 1);
    else goToSlide(activeIndex - 1);
  };

  const atFirst = activeIndex === 0;
  const atLast = activeIndex === count - 1;

  return (
    <section ref={sectionRef} className="rr-featured relative overflow-hidden pt-8 pb-10 sm:pt-8 sm:pb-12 lg:pb-16" data-testid="section-featured-competition">
      {starsOn && <DigitalAtmosphere stars layers={false} />}
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <ChaserBorder variant="featured" className="shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <div
            className="relative overflow-hidden bg-[#0A0A0D] touch-pan-y lg:pb-8"
            onPointerDown={(e) => {
              if (count < 2 || e.button > 0) return;
              swipeRef.current = {
                x: e.clientX,
                y: e.clientY,
                ignore: isFeaturedControl(e.target),
                locked: null,
              };
            }}
            onPointerMove={(e) => {
              const start = swipeRef.current;
              if (!start || start.ignore || start.locked) return;
              const dx = e.clientX - start.x;
              const dy = e.clientY - start.y;
              if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
              start.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
            }}
            onPointerUp={(e) => finishSwipe(e.clientX, e.clientY)}
            onPointerCancel={() => {
              swipeRef.current = null;
            }}
          >
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
                      suppressNavRef={suppressNavRef}
                      showSwipeHint={index === activeIndex && count > 1 && showSwipeHint}
                      swipeHintLeaving={swipeHintLeaving}
                    />
                  </div>
                ))}
              </div>
            </div>
            {count > 1 && (
              <div className="relative z-20 flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-6 lg:absolute lg:bottom-6 lg:right-6 lg:z-20 lg:flex-col lg:items-end lg:gap-3 lg:border-0 lg:px-0 lg:py-0">
                <div className="flex items-center gap-2.5" aria-label="Featured competitions">
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35 lg:hidden">
                    Swipe
                  </span>
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

