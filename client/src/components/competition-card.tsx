import { useLocation } from "wouter";
import { Competition } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import pop from "../../public/pop.jpeg";
import voltz from "../../public/voltz.jpeg";
import scratch from "../../public/scratch.jpeg";
import ChaserBorder from "@/components/home/ChaserBorder";
import QuantitySelector from "@/components/home/QuantitySelector";
import CountdownBlocks from "@/components/home/CountdownBlocks";
import SoldProgress from "@/components/home/SoldProgress";
import { useCountdown } from "@/hooks/useCountdown";
import {
  HIDDEN_COMPETITION_IDS,
  getCompetitionTypeConfig,
  getCtaLabel,
  getFallbackImage,
  getPrizeDisplay,
  getStatusBadge,
  getTicketStats,
} from "@/lib/competition-display";

interface CompetitionCardProps {
  competition: Competition;
  authenticated?: boolean;
}

export default function CompetitionCard({ competition }: CompetitionCardProps) {
  const [, setLocation] = useLocation();
  const [qty, setQty] = useState(1);
  const stats = getTicketStats(competition);
  const cd = useCountdown(competition.endDate);

  const { data: plinkoConfig } = useQuery({
    queryKey: ["/api/plinko-config"],
    queryFn: async () => (await apiRequest("/api/plinko-config", "GET")).json(),
  });
  const { data: voltzConfig } = useQuery({
    queryKey: ["/api/voltz-config"],
    queryFn: async () => (await apiRequest("/api/voltz-config", "GET")).json(),
  });
  const { data: spinConfig } = useQuery({
    queryKey: ["/api/admin/game-spin-2-config"],
    queryFn: async () => (await apiRequest("/api/admin/game-spin-2-config", "GET")).json(),
  });

  if (competition.type === "plinko" && plinkoConfig?.isVisible === false) return null;
  if (competition.wheelType === "wheel2" && spinConfig?.isVisible === false) return null;
  if (competition.type === "voltz" && voltzConfig?.isVisible === false) return null;
  if (HIDDEN_COMPETITION_IDS.includes(competition.id)) return null;

  const typeCfg = getCompetitionTypeConfig(competition.type);
  const prize = getPrizeDisplay(competition);
  const badge = getStatusBadge(stats);
  const cta = getCtaLabel(competition.type, stats.isClosed);
  const TypeIcon = typeCfg.Icon;
  const maxQty = stats.hasTickets ? Math.max(1, stats.remaining) : 20;

  const imageSrc =
    competition.imageUrl ||
    (competition.type === "pop" ? pop : competition.type === "voltz" ? voltz : competition.type === "scratch" ? scratch : undefined);

  const goToCompetition = (withQty = true) => {
    if (stats.isClosed) return;
    setLocation(withQty ? `/competition/${competition.id}?qty=${qty}` : `/competition/${competition.id}`);
  };

  return (
    <div
      className="rr-comp-card group h-full"
      data-testid={`card-competition-${competition.id}`}
      role="link"
      tabIndex={stats.isClosed ? -1 : 0}
      onClick={() => goToCompetition()}
      onKeyDown={(e) => {
        if (stats.isClosed) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToCompetition();
        }
      }}
      style={{
        opacity: stats.isClosed ? 0.62 : 1,
        cursor: stats.isClosed ? "not-allowed" : "pointer",
        pointerEvents: stats.isClosed ? "none" : "auto",
      }}
    >
      <ChaserBorder variant="card" className="h-full transition-[box-shadow] duration-300 group-hover:shadow-[0_22px_50px_rgba(200,16,46,0.22)]">
        <article className="flex h-full flex-col">
          <div className="rr-comp-media">
            <img
              src={imageSrc || getFallbackImage(competition.type)}
              alt={competition.title}
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallbackApplied === "1") return;
                img.dataset.fallbackApplied = "1";
                img.src = getFallbackImage(competition.type);
              }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0D] via-[#0A0A0D]/20 to-black/25" />
            <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1.5">
              <span className="rr-comp-badge">
                <TypeIcon className="h-3 w-3" />
                {typeCfg.label}
              </span>
            </div>
            <div className="absolute right-2.5 top-2.5">
              <span className={`rr-comp-status ${stats.isClosed ? "is-closed" : ""}`}>
                {badge}
              </span>
            </div>
            <span className="rr-comp-price-tag">
              {stats.isFree ? "FREE" : `£${parseFloat(competition.ticketPrice).toFixed(2)}`}
            </span>
            {stats.isClosed && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                <span className="rr-comp-soldout rotate-[-8deg] rounded-md border border-white/20 bg-black/80 px-4 py-2 font-prize text-2xl text-[#FF263D]">
                  {stats.isExpired ? "EXPIRED" : "SOLD OUT"}
                </span>
              </div>
            )}
          </div>

          <div className="rr-comp-body flex flex-1 flex-col px-3.5 pb-3.5 pt-2.5">
            <p className="rr-comp-prize font-prize text-[1.7rem] leading-none text-white sm:text-[1.9rem]">
              {prize.prizeDisplay || competition.title.split(" ").slice(0, 3).join(" ")}
            </p>
            {prize.prizeDisplay && (
              <p className="rr-comp-title mt-1 truncate text-[11px] font-semibold text-white/45">{competition.title}</p>
            )}

            <div className="rr-comp-meta mt-3 flex items-end justify-between gap-2 rounded-xl border border-white/5 bg-black/30 px-2.5 py-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Entry</p>
                <p className="font-prize text-xl text-[#F1D47A]">
                  {stats.isFree ? "FREE" : `£${parseFloat(competition.ticketPrice).toFixed(2)}`}
                </p>
              </div>
            </div>

            {stats.hasTickets && (
              <div className="rr-comp-sold mt-2.5">
                <SoldProgress pct={stats.pct} sold={stats.soldT} compact />
              </div>
            )}

            <div className="rr-comp-timer mt-3">
              {stats.endDate ? (
                <CountdownBlocks time={cd} ended={stats.isExpired} />
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Draw ongoing</span>
              )}
            </div>

            <div className="rr-comp-actions mt-auto flex items-center gap-2 pt-3 max-md:flex-col max-md:items-stretch max-md:gap-2">
              {!stats.isClosed && (
                <QuantitySelector
                  value={qty}
                  max={maxQty}
                  onChange={setQty}
                  className="max-md:w-full max-md:justify-between"
                />
              )}
              <button
                type="button"
                data-testid={`button-view-competition-${competition.id}`}
                disabled={stats.isClosed}
                onClick={(e) => {
                  e.stopPropagation();
                  goToCompetition(true);
                }}
                className="rr-cta h-10 min-w-0 flex-1 rounded-lg px-3 text-[11px] font-black uppercase tracking-wider whitespace-nowrap disabled:opacity-50 max-md:!flex max-md:!h-11 max-md:!w-full max-md:!flex-none max-md:!items-center max-md:!justify-center max-md:!rounded-md max-md:!px-2 max-md:!text-[11px] max-md:!leading-none max-md:!tracking-[0.14em]"
              >
                {cta}
              </button>
            </div>
          </div>
        </article>
      </ChaserBorder>
    </div>
  );
}
