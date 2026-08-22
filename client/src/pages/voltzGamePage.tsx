import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import VoltzGameComponent from "@/components/games/voltz-game";
import { GameDisclaimer, GameEmpty, GameHero, GameShell, GameStatus } from "@/components/games/GameChrome";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Zap, Trophy, RotateCcw, ChevronLeft, ChevronRight, Award, Package } from "lucide-react";

const voltzKeyframes = `
@keyframes voltz-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
@keyframes voltz-flicker {
  0%, 100% { opacity: 0.7; }
  10% { opacity: 0.3; }
  20% { opacity: 0.8; }
  30% { opacity: 0.5; }
  50% { opacity: 1; }
  70% { opacity: 0.6; }
  90% { opacity: 0.9; }
}
@keyframes voltz-glow-breathe {
  0%, 100% { box-shadow: 0 0 15px rgba(234,179,8,0.1), 0 0 30px rgba(234,179,8,0.05); }
  50% { box-shadow: 0 0 25px rgba(234,179,8,0.2), 0 0 50px rgba(234,179,8,0.08); }
}
@keyframes surge-slide {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}
@keyframes voltz-title-glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}
@keyframes voltz-electric-flare {
  0%, 100% { opacity: 0; transform: scaleX(0.3); }
  15% { opacity: 1; transform: scaleX(1); }
  30% { opacity: 0.6; transform: scaleX(0.8); }
  45% { opacity: 1; transform: scaleX(1.1); }
  60% { opacity: 0; transform: scaleX(0.2); }
}
@keyframes voltz-zap-left {
  0%, 70%, 100% { opacity: 0; transform: translateX(8px) scale(0.8); }
  75% { opacity: 1; transform: translateX(0) scale(1.3); }
  80% { opacity: 0.8; transform: translateX(-3px) scale(1.1); }
  90% { opacity: 0; }
}
@keyframes voltz-zap-right {
  0%, 60%, 100% { opacity: 0; transform: translateX(-8px) scale(0.8); }
  65% { opacity: 1; transform: translateX(0) scale(1.3); }
  75% { opacity: 0.8; transform: translateX(3px) scale(1.1); }
  85% { opacity: 0; }
}
@keyframes voltz-arc-travel {
  0% { left: 15%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 85%; opacity: 0; }
}
@keyframes voltz-particle-rise {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  100% { transform: translateY(-30px) scale(0); opacity: 0; }
}
@keyframes voltz-subtitle-glow {
  0%, 100% { opacity: 0.85; letter-spacing: 0.05em; }
  50% { opacity: 1; letter-spacing: 0.12em; }
}
@keyframes voltz-badge-pulse {
  0%, 100% { box-shadow: 0 0 15px rgba(234,179,8,0.15), 0 0 30px rgba(139,92,246,0.1); border-color: rgba(234,179,8,0.3); }
  50% { box-shadow: 0 0 25px rgba(234,179,8,0.3), 0 0 50px rgba(139,92,246,0.15); border-color: rgba(234,179,8,0.5); }
}
@keyframes voltz-spark {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1) rotate(180deg); opacity: 1; }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
}
@keyframes voltz-line-scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
@keyframes voltz-stat-shine {
  0% { left: -100%; }
  100% { left: 200%; }
}
@keyframes voltz-row-enter {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

function VoltzGameHistory({ games }: { games: any[] }) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(games.length / itemsPerPage);

  const visibleGames = games.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const showNavigation = games.length > itemsPerPage;

  const goNext = () => setCurrentPage(p => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setCurrentPage(p => Math.max(p - 1, 0));

  const cashWins = games.filter((g: any) => g.isWin && g.rewardType === "cash");
  const pointsWins = games.filter((g: any) => g.isWin && g.rewardType === "points");
  const physicalWins = games.filter((g: any) => g.isWin && g.rewardType === "physical");
  const freePlayWins = games.filter((g: any) => g.rewardType === "try_again");
  const totalCashWinnings = cashWins.reduce((sum: number, g: any) => sum + (parseFloat(g.rewardValue) || 0), 0);
  const totalPointsWinnings = pointsWins.reduce((sum: number, g: any) => sum + (parseInt(g.rewardValue) || 0), 0);
  const surgeCount = cashWins.length + pointsWins.length + physicalWins.length;
  const winRate = games.length > 0 ? Math.round((surgeCount / games.length) * 100) : 0;

  const getSwitchColor = (switchChosen: number) => {
    switch (switchChosen) {
      case 1: return { name: "RED", hex: "#ef4444", rgb: "239,68,68" };
      case 2: return { name: "BLUE", hex: "#3b82f6", rgb: "59,130,246" };
      case 3: return { name: "GREEN", hex: "#22c55e", rgb: "34,197,94" };
      default: return { name: "?", hex: "#6b7280", rgb: "107,114,128" };
    }
  };

  const getPrizeDisplay = (game: any) => {
    if (game.rewardType === "cash") {
      return {
        icon: <Trophy className="w-4 h-4" />,
        value: `£${game.rewardValue}`,
        label: "CASH",
        color: "234,179,8",
        hex: "#fbbf24",
        gradient: 'linear-gradient(135deg, rgba(234,179,8,0.18), rgba(234,179,8,0.05))',
        border: '1px solid rgba(234,179,8,0.3)',
        textColor: '#fbbf24'
      };
    } else if (game.rewardType === "points") {
      return {
        icon: <Award className="w-4 h-4" />,
        value: `${parseInt(game.rewardValue).toLocaleString()} pts`,
        label: "POINTS",
        color: "168,85,247",
        hex: "#c084fc",
        gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(168,85,247,0.05))',
        border: '1px solid rgba(168,85,247,0.3)',
        textColor: '#c084fc'
      };
    } else if (game.rewardType === "physical") {
      return {
        icon: <Package className="w-4 h-4" />,
        value: game.prizeName || game.rewardValue || "Physical Prize",
        label: "PHYSICAL",
        color: "168,85,247",
        hex: "#a855f7",
        gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(168,85,247,0.05))',
        border: '1px solid rgba(168,85,247,0.3)',
        textColor: '#a855f7'
      };
    } else if (game.rewardType === "try_again") {
      return {
        icon: <RotateCcw className="w-4 h-4" />,
        value: "+1 Play",
        label: "FREE PLAY",
        color: "6,182,212",
        hex: "#22d3ee",
        gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.04))',
        border: '1px solid rgba(6,182,212,0.25)',
        textColor: '#22d3ee'
      };
    } else {
      return {
        icon: null,
        value: "NO WIN",
        label: "LOSE",
        color: "239,68,68",
        hex: "#ef4444",
        gradient: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))',
        border: '1px solid rgba(239,68,68,0.2)',
        textColor: '#ef4444'
      };
    }
  };

  return (
    <div className="w-full" data-testid="voltz-history">
      <div className="rr-voltz-panel relative rounded-2xl overflow-hidden"
           style={{
             background: 'linear-gradient(180deg, rgba(15,12,40,0.97) 0%, rgba(10,8,32,0.98) 50%, rgba(8,6,28,0.97) 100%)',
             backdropFilter: 'blur(24px)',
             border: '1px solid rgba(139,92,246,0.2)',
             boxShadow: '0 12px 48px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.06), 0 0 120px rgba(234,179,8,0.03), inset 0 1px 0 rgba(255,255,255,0.06)',
           }}>

        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #ef4444, #fbbf24, #22c55e, #3b82f6, #a855f7, #fbbf24, #ef4444)', backgroundSize: '200% 100%', animation: 'surge-slide 8s linear infinite' }} />
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px]" style={{ background: 'radial-gradient(ellipse, rgba(234,179,8,0.06) 0%, transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 w-[250px] h-[250px]" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />
          <div className="absolute bottom-0 right-0 w-[250px] h-[250px]" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 60%)' }} />
        </div>

        <div className="relative px-4 sm:px-6 pt-6 pb-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                     style={{
                       background: 'linear-gradient(135deg, rgba(234,179,8,0.25), rgba(168,85,247,0.15))',
                       border: '1px solid rgba(234,179,8,0.35)',
                       boxShadow: '0 0 24px rgba(234,179,8,0.15), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                       animation: 'voltz-glow-breathe 3s ease-in-out infinite',
                     }}>
                  <Zap className="w-6 h-6" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 10px rgba(234,179,8,0.9))' }} />
                </div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full"
                     style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 0 12px rgba(234,179,8,1), 0 0 24px rgba(234,179,8,0.5)', animation: 'voltz-pulse 1.5s ease-in-out infinite' }} />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-[0.2em] uppercase" data-testid="text-history-title"
                    style={{ textShadow: '0 0 20px rgba(255,255,255,0.15)' }}>
                  Power Log
                </h3>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                        style={{ color: '#c084fc', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    {games.length} PLAYS
                  </span>
                  <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                        style={{ color: '#fbbf24', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    {winRate}% SURGE
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { active: cashWins.length > 0, icon: <Trophy className="w-4 h-4" />, value: `£${totalCashWinnings.toFixed(2)}`, label: "CASH WON", color: "234,179,8", hex: "#fbbf24", testId: "stat-cash-total" },
              { active: pointsWins.length > 0, icon: <Award className="w-4 h-4" />, value: totalPointsWinnings.toLocaleString(), label: "POINTS", color: "168,85,247", hex: "#c084fc", testId: "stat-points-total" },
              { active: physicalWins.length > 0, icon: <Package className="w-4 h-4" />, value: String(physicalWins.length), label: "PRIZES", color: "168,85,247", hex: "#a855f7", testId: "stat-physical-total" },
              { active: freePlayWins.length > 0, icon: <RotateCcw className="w-4 h-4" />, value: String(freePlayWins.length), label: "REPLAYS", color: "6,182,212", hex: "#22d3ee", testId: "stat-free-plays" },
            ].map((stat) => (
              <div key={stat.label} className="relative rounded-xl p-3.5 overflow-hidden group" data-testid={stat.testId}
                   style={{
                     background: stat.active
                       ? `linear-gradient(145deg, rgba(${stat.color},0.15), rgba(${stat.color},0.04), rgba(15,12,40,0.6))`
                       : 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(15,12,40,0.55))',
                     border: `1px solid ${stat.active ? `rgba(${stat.color},0.3)` : 'rgba(255,255,255,0.14)'}`,
                     boxShadow: stat.active
                       ? `0 6px 20px rgba(${stat.color},0.08), 0 0 40px rgba(${stat.color},0.04), inset 0 1px 0 rgba(255,255,255,0.06)`
                       : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                     transition: 'all 0.3s ease',
                   }}>
                {stat.active && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, rgba(${stat.color},0.6), transparent)` }} />
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute top-0 h-full w-[60%]" style={{
                        background: `linear-gradient(90deg, transparent, rgba(${stat.color},0.06), transparent)`,
                        animation: 'voltz-stat-shine 4s ease-in-out infinite',
                      }} />
                    </div>
                  </>
                )}
                <div className="relative flex items-center gap-1.5 mb-2.5">
                  <div style={stat.active
                    ? { color: stat.hex, filter: `drop-shadow(0 0 8px rgba(${stat.color},0.7))` }
                    : { color: 'rgba(232,226,245,0.55)' }
                  }>
                    {stat.icon}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]"
                        style={{ color: stat.active ? `rgba(${stat.color},0.7)` : 'rgba(232,226,245,0.55)' }}>
                    {stat.label}
                  </span>
                </div>
                <p className="relative text-2xl font-black tabular-nums leading-none"
                   style={{
                     color: stat.active ? stat.hex : 'rgba(245,240,255,0.78)',
                     textShadow: stat.active ? `0 0 25px rgba(${stat.color},0.6), 0 0 50px rgba(${stat.color},0.2)` : 'none',
                   }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[1px] relative mx-5 overflow-hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(234,179,8,0.3), rgba(139,92,246,0.4), transparent)' }} />
        </div>

        {showNavigation && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <span className="text-[11px] font-black tracking-widest px-3 py-1.5 rounded-full"
                  style={{ color: 'rgba(200,180,255,0.8)', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
                  data-testid="text-pagination-info">
              {currentPage * itemsPerPage + 1}–{Math.min((currentPage + 1) * itemsPerPage, games.length)} / {games.length}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={goPrev} disabled={currentPage === 0}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-15 hover:scale-110"
                      style={{ color: '#c084fc', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
                      data-testid="button-history-prev">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1.5 mx-1">
                {Array.from({ length: Math.min(totalPages, 8) }).map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i)} data-testid={`button-history-page-${i}`}
                          className="rounded-full transition-all duration-300"
                          style={i === currentPage
                            ? { width: 24, height: 5, background: 'linear-gradient(90deg, #a855f7, #fbbf24, #a855f7)', backgroundSize: '200% 100%', animation: 'surge-slide 3s linear infinite', boxShadow: '0 0 14px rgba(168,85,247,0.6)' }
                            : { width: 5, height: 5, background: 'rgba(139,92,246,0.2)', cursor: 'pointer' }
                          } />
                ))}
              </div>
              <button onClick={goNext} disabled={currentPage === totalPages - 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-15 hover:scale-110"
                      style={{ color: '#c084fc', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
                      data-testid="button-history-next">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="px-3 sm:px-5 py-3 space-y-2.5">
          <div className="flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg"
               style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="w-12 flex-shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(200,180,255,0.7)' }}>Switch</span>
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(200,180,255,0.7)' }}>Outcome</span>
            </div>
            <div className="flex-shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(200,180,255,0.7)' }}>Prize</span>
            </div>
          </div>
          {visibleGames.map((game: any, index: number) => {
            const gameNumber = games.length - (currentPage * itemsPerPage + index);
            const sw = getSwitchColor(game.switchChosen);
            const isWin = game.isWin;
            const isFree = game.rewardType === "try_again";
            const isPhysical = game.rewardType === "physical";
            const isNoWin = game.rewardType === "no_win" || (!isWin && !isFree && !isPhysical);
            
            // For physical prizes, treat as win
            const actualIsWin = isWin || isPhysical;

            const rowBg = actualIsWin
              ? isPhysical
                ? 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(168,85,247,0.04), rgba(15,12,40,0.5))'
                : 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(234,179,8,0.03), rgba(15,12,40,0.5))'
              : isFree
              ? 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(6,182,212,0.02), rgba(15,12,40,0.5))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02), rgba(15,12,40,0.5))';

            const rowBorder = actualIsWin
              ? isPhysical ? 'rgba(168,85,247,0.3)' : 'rgba(234,179,8,0.25)'
              : isFree ? 'rgba(6,182,212,0.2)' : 'rgba(239,68,68,0.12)';

            const prizeDisplay = getPrizeDisplay(game);

            return (
              <div
                key={game.id || index}
                className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.015] hover:brightness-110"
                style={{
                  background: rowBg,
                  border: `1px solid ${rowBorder}`,
                  boxShadow: actualIsWin
                    ? isPhysical
                      ? '0 6px 24px rgba(168,85,247,0.1), 0 0 40px rgba(168,85,247,0.04)'
                      : '0 6px 24px rgba(234,179,8,0.08), 0 0 40px rgba(234,179,8,0.03)'
                    : isFree
                    ? '0 4px 20px rgba(6,182,212,0.06)'
                    : '0 2px 12px rgba(239,68,68,0.04)',
                  animation: `voltz-row-enter 0.4s ease-out ${index * 0.08}s both`,
                }}
                data-testid={`history-row-${currentPage * itemsPerPage + index + 1}`}
              >
                {actualIsWin && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-[1px]" 
                         style={{ background: isPhysical 
                           ? 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)' 
                           : 'linear-gradient(90deg, transparent, rgba(234,179,8,0.5), transparent)' }} />
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" 
                         style={{ background: isPhysical
                           ? 'linear-gradient(180deg, #a855f7, rgba(168,85,247,0.3))'
                           : 'linear-gradient(180deg, #fbbf24, rgba(234,179,8,0.3))', 
                           boxShadow: isPhysical
                             ? '0 0 16px rgba(168,85,247,0.4), 0 0 32px rgba(168,85,247,0.15)'
                             : '0 0 16px rgba(234,179,8,0.4), 0 0 32px rgba(234,179,8,0.15)' }} />
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                      <div className="absolute top-0 h-full w-[40%]" style={{
                        background: isPhysical
                          ? 'linear-gradient(90deg, transparent, rgba(168,85,247,0.2), transparent)'
                          : 'linear-gradient(90deg, transparent, rgba(234,179,8,0.2), transparent)',
                        animation: 'voltz-stat-shine 5s ease-in-out infinite',
                      }} />
                    </div>
                  </>
                )}
                {isFree && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)' }} />
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ background: 'linear-gradient(180deg, #22d3ee, rgba(6,182,212,0.2))', boxShadow: '0 0 12px rgba(6,182,212,0.3)' }} />
                  </>
                )}
                {isNoWin && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)' }} />
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ background: 'linear-gradient(180deg, #ef4444, rgba(239,68,68,0.2))', boxShadow: '0 0 12px rgba(239,68,68,0.4)' }} />
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                      <div className="absolute top-0 h-full w-[30%]" style={{
                        background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.15), transparent)',
                        animation: 'voltz-stat-shine 4s ease-in-out infinite',
                      }} />
                    </div>
                  </>
                )}

                <div className="relative flex items-center gap-3 px-4 py-3.5">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                         style={{
                           background: actualIsWin 
                             ? isPhysical
                               ? 'linear-gradient(145deg, rgba(168,85,247,0.25), rgba(168,85,247,0.08))'
                               : 'linear-gradient(145deg, rgba(34,197,94,0.25), rgba(34,197,94,0.08))'
                             : isFree 
                               ? 'linear-gradient(145deg, rgba(59,130,246,0.25), rgba(59,130,246,0.08))'
                               : `linear-gradient(145deg, rgba(${sw.rgb},0.22), rgba(${sw.rgb},0.06))`,
                           border: actualIsWin 
                             ? isPhysical
                               ? '1px solid rgba(168,85,247,0.4)'
                               : '1px solid rgba(34,197,94,0.4)'
                             : isFree 
                               ? '1px solid rgba(59,130,246,0.4)'
                               : `1px solid rgba(${sw.rgb},0.35)`,
                           boxShadow: actualIsWin
                             ? isPhysical
                               ? '0 4px 16px rgba(168,85,247,0.2), 0 0 24px rgba(168,85,247,0.1), inset 0 1px 0 rgba(255,255,255,0.08)'
                               : '0 4px 16px rgba(34,197,94,0.2), 0 0 24px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.08)'
                             : isFree
                               ? '0 4px 16px rgba(59,130,246,0.2), 0 0 24px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.08)'
                               : `0 4px 16px rgba(${sw.rgb},0.12), 0 0 24px rgba(${sw.rgb},0.06), inset 0 1px 0 rgba(255,255,255,0.08)`,
                         }}>
                      {isPhysical ? (
                        <Package className="w-5 h-5" style={{ color: '#a855f7', filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.9))' }} />
                      ) : (
                        <Zap className="w-5 h-5" 
                             style={{ 
                               color: actualIsWin ? '#22c55e' : isFree ? '#3b82f6' : sw.hex, 
                               filter: actualIsWin
                                 ? 'drop-shadow(0 0 8px rgba(34,197,94,0.9))'
                                 : isFree
                                   ? 'drop-shadow(0 0 8px rgba(59,130,246,0.9))'
                                   : `drop-shadow(0 0 8px rgba(${sw.rgb},0.8))`
                             }} />
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full"
                         style={{ 
                           width: 16, 
                           background: actualIsWin
                             ? isPhysical
                               ? 'linear-gradient(90deg, transparent, #a855f7, transparent)'
                               : 'linear-gradient(90deg, transparent, #22c55e, transparent)'
                             : isFree
                               ? 'linear-gradient(90deg, transparent, #3b82f6, transparent)'
                               : `linear-gradient(90deg, transparent, ${sw.hex}, transparent)`,
                           boxShadow: actualIsWin
                             ? isPhysical
                               ? '0 0 10px rgba(168,85,247,0.8)'
                               : '0 0 10px rgba(34,197,94,0.8)'
                             : isFree
                               ? '0 0 10px rgba(59,130,246,0.8)'
                               : `0 0 10px rgba(${sw.rgb},0.7)`
                         }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {actualIsWin ? (
                        isPhysical ? (
                          <span className="text-xs font-black tracking-[0.15em] uppercase"
                                style={{ color: '#a855f7', textShadow: '0 0 18px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.2)' }}>
                            PHYSICAL PRIZE!
                          </span>
                        ) : (
                          <span className="text-xs font-black tracking-[0.15em] uppercase"
                                style={{ color: '#fbbf24', textShadow: '0 0 18px rgba(234,179,8,0.6), 0 0 40px rgba(234,179,8,0.2)' }}>
                            POWER SURGE
                          </span>
                        )
                      ) : isFree ? (
                        <span className="text-xs font-black tracking-[0.15em] uppercase"
                              style={{ color: '#22d3ee', textShadow: '0 0 15px rgba(6,182,212,0.6)' }}>
                          BACKUP POWER
                        </span>
                      ) : (
                        <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: 'rgba(248, 97, 97, 0.73)' }}>
                          POWER CUT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded"
                            style={{ color: 'rgba(139,92,246,0.5)', background: 'rgba(139,92,246,0.06)' }}>
                        #{String(gameNumber).padStart(2, '0')}
                      </span>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: actualIsWin 
                            ? isPhysical ? "#a855f7" : "#22c55e"
                            : isFree 
                              ? "#3b82f6"
                              : sw.hex,
                          boxShadow: actualIsWin
                            ? isPhysical
                              ? "0 0 8px rgba(168,85,247,0.8)"
                              : "0 0 8px rgba(34,197,94,0.8)"
                            : isFree
                              ? "0 0 8px rgba(59,130,246,0.8)"
                              : `0 0 8px rgba(${sw.rgb},0.6)`
                        }}
                      />
                      <span
                        className="text-[10px] font-black tracking-wider uppercase"
                        style={{
                          color: actualIsWin 
                            ? isPhysical ? "#a855f7" : "#22c55e"
                            : isFree 
                              ? "#3b82f6"
                              : sw.hex,
                          opacity: 0.8
                        }}
                      >
                        {actualIsWin ? (isPhysical ? "PURPLE" : "GREEN") : isFree ? "BLUE" : sw.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="relative px-4 py-2.5 rounded-xl overflow-hidden"
                         style={{
                           background: prizeDisplay.gradient,
                           border: prizeDisplay.border,
                           boxShadow: actualIsWin ? '0 4px 16px rgba(168,85,247,0.1), 0 0 30px rgba(168,85,247,0.05)' : 'none',
                         }}>
                      {actualIsWin && (
                        <div className="absolute inset-0 opacity-30"
                             style={{
                               background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.3), transparent)',
                               backgroundSize: '200% 100%',
                               animation: 'surge-slide 3s ease-in-out infinite',
                             }} />
                      )}
                      <div className="relative flex items-center gap-1.5">
                        {prizeDisplay.icon}
                        <span className="text-sm font-black tabular-nums"
                              style={{ color: prizeDisplay.textColor, textShadow: actualIsWin ? `0 0 15px rgba(168,85,247,0.6)` : 'none' }}
                              data-testid={`prize-value-${currentPage * itemsPerPage + index + 1}`}>
                          {prizeDisplay.value}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showNavigation && (
          <div className="flex justify-center gap-3 px-4 py-3.5" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
            <button onClick={goPrev} disabled={currentPage === 0}
                    className="text-[11px] font-black uppercase tracking-wider disabled:opacity-15 transition-all duration-200 flex items-center gap-1.5 px-4 py-2 rounded-lg hover:scale-105"
                    style={{ color: '#c084fc', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
                    data-testid="button-history-prev-bottom">
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button onClick={goNext} disabled={currentPage === totalPages - 1}
                    className="text-[11px] font-black uppercase tracking-wider disabled:opacity-15 transition-all duration-200 flex items-center gap-1.5 px-4 py-2 rounded-lg hover:scale-105"
                    style={{ color: '#c084fc', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
                    data-testid="button-history-next-bottom">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VoltzGamePage() {
  const { competitionId, orderId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [remainingPlays, setRemainingPlays] = useState<number>(0);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

   useEffect(() => {
    if (orderId) {
      const savedHistory = localStorage.getItem(`voltzHistory_${orderId}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse saved history", e);
        }
      }
    }
  }, [orderId]);

    // Save history to localStorage whenever it changes
  useEffect(() => {
    if (orderId && gameHistory.length > 0) {
      localStorage.setItem(`voltzHistory_${orderId}`, JSON.stringify(gameHistory));
    }
  }, [gameHistory, orderId]);

 useEffect(() => {
    return () => {
      if (orderId && remainingPlays === 0) {
        // Optional: check if all games are complete before removing
        const allComplete = gameHistory.length === (orderData?.order?.quantity || 0);
        if (allComplete) {
          localStorage.removeItem(`voltzHistory_${orderId}`);
        }
      }
    };
  }, [orderId, remainingPlays, gameHistory]);

  const { data: voltzConfig } = useQuery<{ isVisible: boolean; isActive: boolean }>({
    queryKey: ["/api/voltz-config"],
  });

  useEffect(() => {
    if (voltzConfig && (voltzConfig.isVisible === false || voltzConfig.isActive === false)) {
      toast({
        title: "Ringtone Voltz Unavailable",
        description: "Ringtone Voltz is currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [voltzConfig?.isVisible, voltzConfig?.isActive]);

  const { data: competition } = useQuery({
    queryKey: ["/api/competitions", competitionId],
  });

  const { data: orderData, isLoading, refetch: refetchOrder } = useQuery({
    queryKey: ["/api/voltz-order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await apiRequest(`/api/voltz-order/${orderId}`, "GET");
      return res.json();
    },
  });

  useEffect(() => {
    if (orderData) {
      setRemainingPlays(orderData.playsRemaining || 0);
            const serverHistory = orderData.history || [];
      if (serverHistory.length > gameHistory.length) {
        setGameHistory(serverHistory);
      }
    }
  }, [orderData]);

  const handlePlayComplete = (serverPlaysRemaining: number, newGameResult?: any) => {
    if (typeof serverPlaysRemaining === "number") {
      setRemainingPlays(serverPlaysRemaining);
    }

    if (newGameResult) {
      setGameHistory(prev => [...prev, newGameResult]);
    }

    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/voltz-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
  queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
    refetchOrder();
  };

  if (isLoading) return <GameStatus message="Loading your Ringtone Voltz game..." />;

  if (!orderData?.order) {
    return (
      <GameEmpty
        title="INVALID ORDER"
        message="This voltz order could not be found. Please try again."
        actionLabel="Go home"
        href="/"
      />
    );
  }

  return (
    <GameShell>
      <style dangerouslySetInnerHTML={{ __html: voltzKeyframes }} />

      <video
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.22 }}
      >
        <source src="/voltz-bg-loop.mp4" type="video/mp4" />
      </video>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <button
          type="button"
          className="mb-4 inline-flex items-center text-sm text-white/45 hover:text-[#F1D47A]"
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>

        <GameHero
          kicker="Voltz · play"
          title="RINGTONE VOLTZ"
          subtitle="Press a switch. Surge the power. Win electric prizes."
          remaining={remainingPlays}
          remainingLabel={remainingPlays === 1 ? "play left" : "plays left"}
          Icon={Zap}
        />

        <VoltzGameComponent
          orderId={orderId!}
          competitionId={competitionId!}
          playsRemaining={remainingPlays}
          onPlayComplete={handlePlayComplete}
        />

        <div className="mt-6">
          {gameHistory.length === 0 ? (
            <div className="rr-voltz-panel relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0D]/80 py-16 text-center">
              <Zap className="mx-auto mb-4 h-10 w-10 text-[#F1D47A]/40" />
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white/45" data-testid="text-empty-history">
                No surges recorded
              </p>
              <p className="mt-1 text-xs text-white/30">Press a switch above to start playing</p>
            </div>
          ) : (
            <VoltzGameHistory games={gameHistory} />
          )}
        </div>
      </main>

      <GameDisclaimer open={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </GameShell>
  );
}
