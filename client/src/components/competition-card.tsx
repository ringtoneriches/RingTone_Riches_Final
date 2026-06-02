import { useLocation } from "wouter";
import { Competition } from "@shared/schema";
import { TrendingUp, Trophy, Sparkles, Gift, Zap, Target, ChevronRight, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useMemo, memo, useCallback } from "react";

interface CompetitionCardProps {
  competition: Competition;
  authenticated?: boolean;
}

// Pre-compute color schemes outside component to avoid recalculation
const colorSchemes = {
  spin: { icon: Zap, label: "SPIN TO WIN", c1: "#ffb800", c2: "#ff8c00", c3: "#4a3000" },
  scratch: { icon: Sparkles, label: "SCRATCH & WIN", c1: "#00ff88", c2: "#00cc6a", c3: "#003d20" },
  pop: { icon: Gift, label: "BALLOON POP", c1: "#ff6b6b", c2: "#ff4040", c3: "#4a1010" },
  plinko: { icon: Target, label: "PLINKO DROP", c1: "#a855f7", c2: "#7c3aed", c3: "#2a1050" },
  voltz: { icon: Zap, label: "RINGTONE VOLTZ", c1: "#60a5fa", c2: "#3b82f6", c3: "#102a50" },
  default: { icon: Trophy, label: "COMPETITION", c1: "#f5d76e", c2: "#d4af37", c3: "#3a3010" }
};

// Memoized Competition Card to prevent re-renders
const CompetitionCard = memo(({ competition, authenticated = false }: CompetitionCardProps) => {
  const [, setLocation] = useLocation();

  const { data: plinkoConfig } = useQuery({
    queryKey: ["/api/plinko-config"],
    queryFn: async () => { const res = await apiRequest("/api/plinko-config", "GET"); return res.json(); },
    staleTime: Infinity, // Cache forever
  });
  const { data: voltzConfig } = useQuery({
    queryKey: ["/api/voltz-config"],
    queryFn: async () => { const res = await apiRequest("/api/voltz-config", "GET"); return res.json(); },
    staleTime: Infinity,
  });
  const { data: spinConfig } = useQuery({
    queryKey: ["/api/admin/game-spin-2-config"],
    queryFn: async () => { const res = await apiRequest("/api/admin/game-spin-2-config", "GET"); return res.json(); },
    staleTime: Infinity,
  });

  // Early returns - moved before hooks are used
  if (competition.type === "plinko" && plinkoConfig?.isVisible === false) return null;
  if (competition.wheelType === "wheel2" && spinConfig?.isVisible === false) return null;
  if (competition.type === "voltz" && voltzConfig?.isVisible === false) return null;
  
  const hiddenCompetitionIds = ["d54eee36-2280-4372-84f6-93d07343a970", "25f0ee99-6f54-435d-9605-f4c287fe1338"];
  if (hiddenCompetitionIds.includes(competition.id)) return null;

  // Memoize computed values
  const progressPercentage = useMemo(() => 
    competition.maxTickets ? (competition.soldTickets! / competition.maxTickets) * 100 : 0,
    [competition.maxTickets, competition.soldTickets]
  );
  
  const isHot = progressPercentage > 60;
  const isAlmostGone = progressPercentage > 85;
  const remainingTickets = competition.maxTickets ? competition.maxTickets - (competition.soldTickets || 0) : 0;
  
  const tc = colorSchemes[competition.type as keyof typeof colorSchemes] || colorSchemes.default;
  const Icon = tc.icon;
  const isFree = competition.ticketPrice === "0.00";

  const handleClick = useCallback(() => {
    setLocation(`/competition/${competition.id}`);
  }, [competition.id, setLocation]);

  return (
    <div
      className="group cursor-pointer h-full will-change-transform"
      data-testid={`card-competition-${competition.id}`}
      onClick={handleClick}
    >
      <div className="relative h-full transition-transform duration-150 ease-out hover:scale-[1.01]">
        {/* Simplified border - removed clip-path which is expensive */}
        <div className="absolute inset-0 pointer-events-none z-10 rounded-2xl border" style={{
          borderColor: `${tc.c1}40`,
        }} />

        <div className="h-full overflow-hidden rounded-2xl" style={{
          background: `linear-gradient(180deg, ${tc.c1}, ${tc.c2})`,
          padding: '2px',
        }}>
          <div className="h-full rounded-2xl bg-[#08080c]">

            {/* Header - Simplified */}
            <div className="relative rounded-t-2xl" style={{
              background: `linear-gradient(135deg, ${tc.c1}, ${tc.c2})`,
            }}>
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
                  <span className="text-[10px] font-black text-black tracking-wide">{tc.label}</span>
                </div>
                {(isAlmostGone || isHot) && (
                  <div className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded">
                    {isAlmostGone ? (
                      <>
                        <Flame className="w-2.5 h-2.5 text-white" />
                        <span className="text-[7px] font-black text-white">HOT</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-2.5 h-2.5 text-white" />
                        <span className="text-[7px] font-black text-white">POPULAR</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Image Container - Removed expensive filters */}
            <div className="relative overflow-hidden bg-gray-900" style={{ aspectRatio: '16/12' }}>
              <img
                src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75"}
                alt={competition.title}
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ willChange: 'auto' }}
              />

              {/* Simplified gradient overlay */}
              <div className="absolute inset-0" style={{
                background: `linear-gradient(180deg, ${tc.c3}80 0%, transparent 30%, ${tc.c3}cc 100%)`,
              }} />

              {isFree && (
                <div className="absolute top-2 right-0" style={{
                  background: `linear-gradient(135deg, #00ff88, #00cc6a)`,
                  padding: '2px 10px 2px 14px',
                  clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)',
                }}>
                  <span className="text-[8px] font-black text-black">FREE</span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-2">
                <h3
                  className="text-xs sm:text-sm font-extrabold text-white leading-tight line-clamp-2"
                  data-testid={`text-title-${competition.id}`}
                >
                  {competition.title}
                </h3>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-3" style={{
              background: `linear-gradient(180deg, ${tc.c3}40 0%, #08080c 100%)`,
            }}>
              <div className="flex items-end justify-between mb-2">
                {!isFree ? (
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-wide mb-0.5" style={{ color: `${tc.c1}80` }}>Entry</div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[10px] font-bold" style={{ color: `${tc.c1}80` }}>£</span>
                      <span className="text-3xl font-black leading-none" style={{ color: tc.c1 }}>
                        {parseFloat(competition.ticketPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-wide mb-0.5 text-emerald-400/60">Entry</div>
                    <span className="text-2xl font-black text-emerald-400">FREE</span>
                  </div>
                )}

                {competition.maxTickets && competition.maxTickets > 0 && (
                  <div className="text-right">
                    <div className="text-[8px] font-bold uppercase tracking-wide mb-0.5 text-white/30">Sold</div>
                    <div className="text-2xl font-black leading-none" style={{
                      color: isAlmostGone ? '#ff4040' : tc.c1,
                    }}>{Math.round(progressPercentage)}%</div>
                  </div>
                )}
              </div>

              {/* Simplified Progress Bar - Removed heavy shadows and animations */}
              {competition.maxTickets && competition.maxTickets > 0 && (
                <div className="mb-2">
                  <div className="relative h-6 overflow-hidden rounded-md bg-white/5">
                    <div className="h-full rounded-md" style={{
                      width: `${Math.min(progressPercentage, 100)}%`,
                      background: isAlmostGone
                        ? 'linear-gradient(90deg, #ff2020, #ff6b00)'
                        : `linear-gradient(90deg, ${tc.c2}, ${tc.c1})`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  {isAlmostGone && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <div className="w-1 h-1 rounded-full bg-red-500" />
                      <span className="text-[7px] font-bold text-red-400 uppercase">{remainingTickets} left</span>
                    </div>
                  )}
                </div>
              )}

              {/* Button - Simplified */}
              <button
                className="w-full py-2 font-black text-[10px] uppercase tracking-wide flex items-center justify-center gap-1 rounded-md transition-all duration-150"
                style={{
                  background: `linear-gradient(135deg, ${tc.c1}15, ${tc.c2}10)`,
                  border: `1px solid ${tc.c1}50`,
                  color: tc.c1,
                }}
                data-testid={`button-view-competition-${competition.id}`}
              >
                <span>Enter Now</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CompetitionCard.displayName = 'CompetitionCard';

export default CompetitionCard;