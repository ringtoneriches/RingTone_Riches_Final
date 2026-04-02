import { useLocation } from "wouter";
import { Competition } from "@shared/schema";
import { TrendingUp, Trophy, Sparkles, Gift, Zap, Target, ChevronRight, Flame, Star, Egg, Rabbit, Candy, Flower, Music, PartyPopper, Gem } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface CompetitionCardProps {
  competition: Competition;
  authenticated?: boolean;
}

// Easter-themed color mapper
const getEasterColors = (type: string) => {
  switch (type) {
    case "spin": 
      return { 
        icon: Zap, 
        label: "🐰 EGG SPIN 🥚", 
        c1: "#FFB7C5", // Pastel Pink
        c2: "#FFD700", // Gold
        c3: "#4a1030",
        accent: "#FFD700",
        glow: "rgba(255,183,197,0.4)"
      };
    case "scratch": 
      return { 
        icon: Sparkles, 
        label: "✨ GOLDEN SCRATCH ✨", 
        c1: "#98FB98", // Pastel Green
        c2: "#FFD700",
        c3: "#104020",
        accent: "#98FB98",
        glow: "rgba(152,251,152,0.4)"
      };
    case "pop": 
      return { 
        icon: Gift, 
        label: "🎈 BUNNY POP 🐇", 
        c1: "#FFD700",
        c2: "#FFB347",
        c3: "#4a2010",
        accent: "#FFD700",
        glow: "rgba(255,215,0,0.4)"
      };
    case "plinko": 
      return { 
        icon: Target, 
        label: "🥚 EGG PLINKO 🪺", 
        c1: "#DDA0DD", // Lavender
        c2: "#FFD700",
        c3: "#2a1050",
        accent: "#DDA0DD",
        glow: "rgba(221,160,221,0.4)"
      };
    case "voltz": 
      return { 
        icon: Zap, 
        label: "⚡ EASTER VOLTZ 🐣", 
        c1: "#FFB7C5",
        c2: "#FFD700",
        c3: "#102a50",
        accent: "#FFB7C5",
        glow: "rgba(255,183,197,0.4)"
      };
    default: 
      return { 
        icon: Trophy, 
        label: "🏆 EGG HUNT 🥚", 
        c1: "#FFD700",
        c2: "#FFB347",
        c3: "#3a3010",
        accent: "#FFD700",
        glow: "rgba(255,215,0,0.4)"
      };
  }
};

export default function CompetitionCard({ competition, authenticated = false }: CompetitionCardProps) {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);

  const { data: plinkoConfig } = useQuery({
    queryKey: ["/api/plinko-config"],
    queryFn: async () => { const res = await apiRequest("/api/plinko-config", "GET"); return res.json(); },
  });
  const { data: voltzConfig } = useQuery({
    queryKey: ["/api/voltz-config"],
    queryFn: async () => { const res = await apiRequest("/api/voltz-config", "GET"); return res.json(); },
  });
  const { data: spinConfig } = useQuery({
    queryKey: ["/api/admin/game-spin-2-config"],
    queryFn: async () => { const res = await apiRequest("/api/admin/game-spin-2-config", "GET"); return res.json(); },
  });

  if (competition.type === "plinko" && plinkoConfig?.isVisible === false) return null;
  if (competition.wheelType === "wheel2" && spinConfig?.isVisible === false) return null;
  if (competition.type === "voltz" && voltzConfig?.isVisible === false) return null;
  const hiddenCompetitionIds = ["d54eee36-2280-4372-84f6-93d07343a970", "25f0ee99-6f54-435d-9605-f4c287fe1338"];
  if (hiddenCompetitionIds.includes(competition.id)) return null;

  const progressPercentage = competition.maxTickets ? (competition.soldTickets! / competition.maxTickets) * 100 : 0;
  const isHot = progressPercentage > 60;
  const isAlmostGone = progressPercentage > 85;
  const remainingTickets = competition.maxTickets ? competition.maxTickets - (competition.soldTickets || 0) : 0;

  const tc = getEasterColors(competition.type);
  const Icon = tc.icon;
  const isFree = competition.ticketPrice === "0.00";
  const uid = competition.id.slice(0, 8);

  return (
    <div
      className="group cursor-pointer h-full"
      data-testid={`card-competition-${competition.id}`}
      onClick={() => setLocation(`/competition/${competition.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative h-full"
        style={{
          transform: hovered ? 'translateY(-8px) scale(1.03)' : 'none',
          transition: 'transform 0.4s cubic-bezier(.4,0,.2,1)',
          filter: hovered ? `drop-shadow(0 0 25px ${tc.glow}) drop-shadow(0 15px 30px rgba(0,0,0,0.5))` : 'drop-shadow(0 5px 15px rgba(0,0,0,0.4))',
        }}
      >
        {/* Easter Egg Glowing Border Effect */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-[inherit]" style={{
          clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
        }}>
          {/* Top LED strip - Easter colors */}
          <div className={`gc-chaser-top-${uid} absolute top-0 left-0 w-full h-[3px]`} style={{
            background: `linear-gradient(90deg, transparent, ${tc.c1}, ${tc.c2}, ${tc.c1}, transparent)`,
            boxShadow: `0 0 15px ${tc.c1}, 0 0 30px ${tc.c2}`,
          }} />
          
          {/* Right LED strip */}
          <div className={`gc-chaser-right-${uid} absolute top-0 right-0 w-[3px] h-full`} style={{
            background: `linear-gradient(180deg, transparent, ${tc.c1}, ${tc.c2}, ${tc.c1}, transparent)`,
            boxShadow: `0 0 15px ${tc.c1}, 0 0 30px ${tc.c2}`,
          }} />
          
          {/* Bottom LED strip */}
          <div className={`gc-chaser-bottom-${uid} absolute bottom-0 left-0 w-full h-[3px]`} style={{
            background: `linear-gradient(90deg, transparent, ${tc.c1}, ${tc.c2}, ${tc.c1}, transparent)`,
            boxShadow: `0 0 15px ${tc.c1}, 0 0 30px ${tc.c2}`,
          }} />
          
          {/* Left LED strip */}
          <div className={`gc-chaser-left-${uid} absolute top-0 left-0 w-[3px] h-full`} style={{
            background: `linear-gradient(180deg, transparent, ${tc.c1}, ${tc.c2}, ${tc.c1}, transparent)`,
            boxShadow: `0 0 15px ${tc.c1}, 0 0 30px ${tc.c2}`,
          }} />
        </div>

        {/* Main Card Container */}
        <div className="h-full overflow-hidden" style={{
          clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
          background: `linear-gradient(135deg, ${tc.c1}, ${tc.c2})`,
          padding: '2px',
        }}>
          <div className="h-full" style={{
            clipPath: 'polygon(11px 0, calc(100% - 11px) 0, 100% 11px, 100% calc(100% - 11px), calc(100% - 11px) 100%, 11px 100%, 0 calc(100% - 11px), 0 11px)',
            background: 'linear-gradient(135deg, #0a0a0f, #0d0d12)',
          }}>

            {/* Header Section - Easter Theme */}
            <div className="relative" style={{
              background: `linear-gradient(135deg, ${tc.c1}, ${tc.c2})`,
            }}>
              <div className="flex items-center justify-between px-2.5 sm:px-3 py-1 sm:py-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black" strokeWidth={2.5} />
                  <span className="text-[8px] sm:text-[10px] font-black text-black tracking-[0.15em]">{tc.label}</span>
                  <Egg className="w-2.5 h-2.5 text-black/70" />
                </div>
                {isAlmostGone ? (
                  <div className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded-sm">
                    <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    <span className="text-[7px] sm:text-[8px] font-black text-white tracking-wider">ALMOST GONE</span>
                  </div>
                ) : isHot ? (
                  <div className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded-sm">
                    <PartyPopper className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    <span className="text-[7px] sm:text-[8px] font-black text-white tracking-wider">EGG-CITING</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded-sm">
                    <Rabbit className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    <span className="text-[7px] sm:text-[8px] font-black text-white tracking-wider">LIVE</span>
                  </div>
                )}
              </div>
              <div className="h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.2), transparent)' }} />
            </div>

            {/* Image Section */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '16/12' }}>
              <img
                src={competition.imageUrl || "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=800&h=600"}
                alt={competition.title}
                className="w-full h-full object-cover"
                style={{
                  transform: hovered ? 'scale(1.1)' : 'scale(1.02)',
                  transition: 'transform 0.6s ease-out',
                  filter: 'saturate(1.15) brightness(1.05)',
                }}
              />

              {/* Easter Gradient Overlay */}
              <div className="absolute inset-0" style={{
                background: `
                  linear-gradient(180deg, ${tc.c3}80 0%, transparent 25%, transparent 50%, ${tc.c3}cc 80%, ${tc.c3} 100%),
                  linear-gradient(135deg, ${tc.c1}08 0%, transparent 50%)
                `,
              }} />

              {/* Easter Pattern Overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent 2px, ${tc.c1}08 2px, ${tc.c1}08 3px),
                  radial-gradient(circle at 10% 20%, ${tc.c1}05 1px, transparent 1px)
                `,
                backgroundSize: '100% 4px, 20px 20px',
                opacity: 0.6,
              }} />

              {/* Free Entry Badge - Easter Style */}
              {isFree && (
                <div className="absolute top-2 right-0 sm:top-2.5" style={{
                  background: `linear-gradient(135deg, #98FB98, #FFD700)`,
                  padding: '3px 10px 3px 14px',
                  clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)',
                  boxShadow: '0 0 15px rgba(152,251,152,0.5)',
                }}>
                  <span className="text-[8px] sm:text-[10px] font-black text-black tracking-[0.15em] flex items-center gap-1">
                    <Rabbit className="w-2.5 h-2.5" />
                    FREE EGG
                  </span>
                </div>
              )}

              {/* Title Section */}
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                <h3
                  className="text-xs sm:text-sm font-extrabold text-white leading-tight line-clamp-2"
                  style={{ textShadow: `0 1px 2px rgba(0,0,0,1), 0 0 20px ${tc.c3}` }}
                  data-testid={`text-title-${competition.id}`}
                >
                  🥚 {competition.title} 🐰
                </h3>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${tc.c1}40, ${tc.c1}, ${tc.c1}40)` }} />

            {/* Details Section */}
            <div className="relative p-2.5 sm:p-3" style={{
              background: `linear-gradient(180deg, ${tc.c3}40 0%, #0a0a0f 40%, #06060a 100%)`,
            }}>

              {/* Easter Pattern Background */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `radial-gradient(${tc.c1}08 1px, transparent 1px)`,
                backgroundSize: '14px 14px',
                opacity: 0.5,
              }} />

              <div className="relative flex items-end justify-between mb-2 sm:mb-3" data-testid={`text-price-${competition.id}`}>
                {!isFree ? (
                  <div>
                    <div className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.25em] mb-1 flex items-center gap-1" style={{ color: `${tc.c1}90` }}>
                      <Gem className="w-2 h-2" />
                      Golden Egg Price
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[10px] sm:text-xs font-bold" style={{ color: `${tc.c1}80` }}>£</span>
                      <span className="text-3xl sm:text-5xl font-black leading-none" style={{
                        color: tc.c1,
                        textShadow: `0 0 30px ${tc.c1}60, 0 0 60px ${tc.c1}30`,
                        letterSpacing: '-0.02em',
                      }}>{parseFloat(competition.ticketPrice).toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.25em] mb-1 flex items-center gap-1 text-emerald-400/60">
                      <Gift className="w-2 h-2" />
                      Easter Special
                    </div>
                    <span className="text-3xl sm:text-5xl font-black leading-none text-emerald-400" style={{
                      textShadow: '0 0 30px rgba(152,251,152,0.5)',
                    }}>FREE</span>
                  </div>
                )}

                {competition.maxTickets && competition.maxTickets > 0 && (
                  <div className="text-right">
                    <div className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.25em] mb-1 flex items-center justify-end gap-1 text-white/30">
                      <Egg className="w-2 h-2" />
                      Eggs Found
                    </div>
                    <div className="text-2xl sm:text-4xl font-black leading-none" style={{
                      color: isAlmostGone ? '#FFB7C5' : tc.c1,
                      textShadow: isAlmostGone ? '0 0 20px rgba(255,183,197,0.5)' : `0 0 20px ${tc.c1}40`,
                    }}>{Math.round(progressPercentage)}%</div>
                  </div>
                )}
              </div>

              {/* Progress Bar - Easter Themed */}
              {competition.maxTickets && competition.maxTickets > 0 && (
                <div className="relative mb-2.5 sm:mb-3">
                  <div className="relative h-2.5 sm:h-3 overflow-hidden" style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${tc.c1}20`,
                    clipPath: 'polygon(4px 0, calc(100% - 4px) 0, 100% 50%, calc(100% - 4px) 100%, 4px 100%, 0 50%)',
                  }}>
                    <div className="h-full relative overflow-hidden" style={{
                      width: `${Math.min(progressPercentage, 100)}%`,
                      background: isAlmostGone
                        ? 'linear-gradient(90deg, #FFB7C5, #FFD700)'
                        : `linear-gradient(90deg, ${tc.c2}, ${tc.c1})`,
                      boxShadow: `0 0 8px ${isAlmostGone ? 'rgba(255,183,197,0.6)' : tc.c1 + '60'}`,
                      transition: 'width 1.2s ease-out',
                      clipPath: 'polygon(4px 0, calc(100% - 4px) 0, 100% 50%, calc(100% - 4px) 100%, 4px 100%, 0 50%)',
                    }}>
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, transparent 60%)',
                      }} />
                      <div className={`gc-bar-sweep-${uid} absolute inset-0`} style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                        backgroundSize: '40% 100%',
                      }} />
                    </div>
                  </div>
                  {isAlmostGone && (
                    <div className="flex items-center justify-center gap-1 mt-1.5">
                      <div className={`gc-urgency-dot-${uid} w-1.5 h-1.5 rounded-full`} style={{ background: '#FFB7C5' }} />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: '#FFB7C5' }}>{remainingTickets} eggs remaining</span>
                    </div>
                  )}
                </div>
              )}

              {/* CTA Button - Easter Style */}
              <div className="relative">
                <button
                  className="w-full py-2 sm:py-3 font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 relative overflow-hidden"
                  style={{
                    background: hovered
                      ? `linear-gradient(135deg, ${tc.c1}, ${tc.c2})`
                      : `linear-gradient(135deg, ${tc.c1}15, ${tc.c2}10)`,
                    border: `2px solid ${hovered ? tc.c1 : tc.c1 + '50'}`,
                    color: hovered ? '#000' : tc.c1,
                    clipPath: 'polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)',
                    boxShadow: hovered ? `0 0 30px ${tc.c1}40, 0 4px 12px rgba(0,0,0,0.4)` : 'none',
                    transition: 'all 0.3s ease',
                    textShadow: hovered ? 'none' : `0 0 8px ${tc.c1}60`,
                  }}
                  data-testid={`button-view-competition-${competition.id}`}
                >
                  <span className="relative z-10 font-black flex items-center gap-1">
                    {hovered ? <PartyPopper className="w-3 h-3" /> : <Egg className="w-3 h-3" />}
                    Find Golden Egg
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" style={{
                    transform: hovered ? 'translateX(3px)' : 'none',
                    transition: 'transform 0.3s',
                  }} />
                  {hovered && (
                    <div className={`gc-btn-sweep-${uid} absolute inset-0`} style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      backgroundSize: '200% 100%',
                    }} />
                  )}
                </button>
              </div>
            </div>

            {/* Easter Corner Decorations */}
            <div className="absolute top-[36px] sm:top-[42px] left-0 w-[6px] h-[20px] sm:h-[24px]" style={{
              background: `linear-gradient(180deg, ${tc.c1}, ${tc.c2})`,
              clipPath: 'polygon(0 0, 100% 15%, 100% 85%, 0 100%)',
            }} />
            <div className="absolute top-[36px] sm:top-[42px] right-0 w-[6px] h-[20px] sm:h-[24px]" style={{
              background: `linear-gradient(180deg, ${tc.c1}, ${tc.c2})`,
              clipPath: 'polygon(0 15%, 100% 0, 100% 100%, 0 85%)',
            }} />

          </div>
        </div>

        {/* Top Glow Effect */}
        <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[40%] h-[3px]" style={{
          background: `linear-gradient(90deg, transparent, ${tc.c1}, transparent)`,
          boxShadow: `0 0 10px ${tc.c1}60`,
          filter: 'blur(0.5px)',
        }} />
      </div>

      <style>{`
        @keyframes gc-bar-sweep-kf {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        .gc-bar-sweep-${uid} {
          animation: gc-bar-sweep-kf 2s ease-in-out infinite;
        }
        @keyframes gc-urgency-dot-kf {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .gc-urgency-dot-${uid} {
          animation: gc-urgency-dot-kf 1s ease-in-out infinite;
        }
        @keyframes gc-btn-sweep-kf {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .gc-btn-sweep-${uid} {
          animation: gc-btn-sweep-kf 1.2s ease-in-out infinite;
        }
        
        /* Moving LED animations - Easter Edition */
        @keyframes gc-chaser-top {
          0% { transform: translateX(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes gc-chaser-right {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes gc-chaser-bottom {
          0% { transform: translateX(100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes gc-chaser-left {
          0% { transform: translateY(100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }
        
        .gc-chaser-top-${uid} {
          animation: gc-chaser-top 3s ease-in-out infinite;
        }
        .gc-chaser-right-${uid} {
          animation: gc-chaser-right 3s ease-in-out infinite;
        }
        .gc-chaser-bottom-${uid} {
          animation: gc-chaser-bottom 3s ease-in-out infinite;
        }
        .gc-chaser-left-${uid} {
          animation: gc-chaser-left 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}