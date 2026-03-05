import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import VoltzGameComponent from "@/components/games/voltz-game";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Zap, Trophy, RotateCcw, ChevronLeft, ChevronRight, Award } from "lucide-react";

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
  const freePlayWins = games.filter((g: any) => g.rewardType === "try_again");
  const totalCashWinnings = cashWins.reduce((sum: number, g: any) => sum + (parseFloat(g.rewardValue) || 0), 0);
  const totalPointsWinnings = pointsWins.reduce((sum: number, g: any) => sum + (parseInt(g.rewardValue) || 0), 0);
  const surgeCount = cashWins.length + pointsWins.length;
  const winRate = games.length > 0 ? Math.round((surgeCount / games.length) * 100) : 0;

  const getSwitchColor = (switchChosen: number) => {
    switch (switchChosen) {
      case 1: return { name: "RED", hex: "#ef4444", rgb: "239,68,68" };
      case 2: return { name: "BLUE", hex: "#3b82f6", rgb: "59,130,246" };
      case 3: return { name: "GREEN", hex: "#22c55e", rgb: "34,197,94" };
      default: return { name: "?", hex: "#6b7280", rgb: "107,114,128" };
    }
  };

  return (
    <div className="w-full" data-testid="voltz-history">
      <div className="relative rounded-2xl overflow-hidden"
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

          <div className="grid grid-cols-3 gap-3">
            {[
              { active: cashWins.length > 0, icon: <Trophy className="w-4 h-4" />, value: `£${totalCashWinnings.toFixed(2)}`, label: "CASH WON", color: "234,179,8", hex: "#fbbf24", testId: "stat-cash-total" },
              { active: pointsWins.length > 0, icon: <Award className="w-4 h-4" />, value: totalPointsWinnings.toLocaleString(), label: "POINTS", color: "168,85,247", hex: "#c084fc", testId: "stat-points-total" },
              { active: freePlayWins.length > 0, icon: <RotateCcw className="w-4 h-4" />, value: String(freePlayWins.length), label: "REPLAYS", color: "6,182,212", hex: "#22d3ee", testId: "stat-free-plays" },
            ].map((stat) => (
              <div key={stat.label} className="relative rounded-xl p-3.5 overflow-hidden group" data-testid={stat.testId}
                   style={{
                     background: stat.active
                       ? `linear-gradient(145deg, rgba(${stat.color},0.15), rgba(${stat.color},0.04), rgba(15,12,40,0.6))`
                       : 'linear-gradient(145deg, rgba(139,92,246,0.05), rgba(15,12,40,0.4))',
                     border: `1px solid ${stat.active ? `rgba(${stat.color},0.3)` : 'rgba(139,92,246,0.1)'}`,
                     boxShadow: stat.active
                       ? `0 6px 20px rgba(${stat.color},0.08), 0 0 40px rgba(${stat.color},0.04), inset 0 1px 0 rgba(255,255,255,0.06)`
                       : 'inset 0 1px 0 rgba(255,255,255,0.02)',
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
                    : { color: 'rgba(139,92,246,0.2)' }
                  }>
                    {stat.icon}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]"
                        style={{ color: stat.active ? `rgba(${stat.color},0.7)` : 'rgba(139,92,246,0.2)' }}>
                    {stat.label}
                  </span>
                </div>
                <p className="relative text-2xl font-black tabular-nums leading-none"
                   style={{
                     color: stat.active ? stat.hex : 'rgba(139,92,246,0.08)',
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
            const isNoWin = game.rewardType === "no_win" || (!isWin && !isFree);

            const rowBg = isWin
              ? 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(234,179,8,0.03), rgba(15,12,40,0.5))'
              : isFree
              ? 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(6,182,212,0.02), rgba(15,12,40,0.5))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02), rgba(15,12,40,0.5))';

            const rowBorder = isWin ? 'rgba(234,179,8,0.25)' : isFree ? 'rgba(6,182,212,0.2)' : 'rgba(239,68,68,0.12)';

            return (
              <div
                key={game.id || index}
                className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.015] hover:brightness-110"
                style={{
                  background: rowBg,
                  border: `1px solid ${rowBorder}`,
                  boxShadow: isWin
                    ? '0 6px 24px rgba(234,179,8,0.08), 0 0 40px rgba(234,179,8,0.03)'
                    : isFree
                    ? '0 4px 20px rgba(6,182,212,0.06)'
                    : '0 2px 12px rgba(239,68,68,0.04)',
                  animation: `voltz-row-enter 0.4s ease-out ${index * 0.08}s both`,
                }}
                data-testid={`history-row-${currentPage * itemsPerPage + index + 1}`}
              >
                {isWin && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.5), transparent)' }} />
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ background: 'linear-gradient(180deg, #fbbf24, rgba(234,179,8,0.3))', boxShadow: '0 0 16px rgba(234,179,8,0.4), 0 0 32px rgba(234,179,8,0.15)' }} />
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                      <div className="absolute top-0 h-full w-[40%]" style={{
                        background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.2), transparent)',
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
              {!isWin && !isFree && (
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
         background: isWin 
           ? 'linear-gradient(145deg, rgba(34,197,94,0.25), rgba(34,197,94,0.08))'
           : isFree 
             ? 'linear-gradient(145deg, rgba(59,130,246,0.25), rgba(59,130,246,0.08))'
             : `linear-gradient(145deg, rgba(${sw.rgb},0.22), rgba(${sw.rgb},0.06))`,
         border: isWin 
           ? '1px solid rgba(34,197,94,0.4)'
           : isFree 
             ? '1px solid rgba(59,130,246,0.4)'
             : `1px solid rgba(${sw.rgb},0.35)`,
         boxShadow: isWin
           ? '0 4px 16px rgba(34,197,94,0.2), 0 0 24px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.08)'
           : isFree
             ? '0 4px 16px rgba(59,130,246,0.2), 0 0 24px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.08)'
             : `0 4px 16px rgba(${sw.rgb},0.12), 0 0 24px rgba(${sw.rgb},0.06), inset 0 1px 0 rgba(255,255,255,0.08)`,
       }}>
    <Zap className="w-5 h-5" 
         style={{ 
           color: isWin ? '#22c55e' : isFree ? '#3b82f6' : sw.hex, 
           filter: isWin
             ? 'drop-shadow(0 0 8px rgba(34,197,94,0.9))'
             : isFree
               ? 'drop-shadow(0 0 8px rgba(59,130,246,0.9))'
               : `drop-shadow(0 0 8px rgba(${sw.rgb},0.8))`
         }} />
  </div>
  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full"
       style={{ 
         width: 16, 
         background: isWin
           ? 'linear-gradient(90deg, transparent, #22c55e, transparent)'
           : isFree
             ? 'linear-gradient(90deg, transparent, #3b82f6, transparent)'
             : `linear-gradient(90deg, transparent, ${sw.hex}, transparent)`,
         boxShadow: isWin
           ? '0 0 10px rgba(34,197,94,0.8)'
           : isFree
             ? '0 0 10px rgba(59,130,246,0.8)'
             : `0 0 10px rgba(${sw.rgb},0.7)`
       }} />
</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isWin ? (
                        <span className="text-xs font-black tracking-[0.15em] uppercase"
                              style={{ color: '#fbbf24', textShadow: '0 0 18px rgba(234,179,8,0.6), 0 0 40px rgba(234,179,8,0.2)' }}>
                          POWER SURGE
                        </span>
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
    background: isWin 
      ? "#22c55e" 
      : isFree 
        ? "#3b82f6"  // Blue for free play
        : sw.hex,
    boxShadow: isWin
      ? "0 0 8px rgba(34,197,94,0.8)"
      : isFree
        ? "0 0 8px rgba(59,130,246,0.8)"  // Blue glow for free play
        : `0 0 8px rgba(${sw.rgb},0.6)`
  }}
/>
<span
  className="text-[10px] font-black tracking-wider uppercase"
  style={{
    color: isWin 
      ? "#22c55e" 
      : isFree 
        ? "#3b82f6"  // Blue text for free play
        : sw.hex,
    opacity: 0.8
  }}
>
  {isWin ? "GREEN" : isFree ? "BLUE" : sw.name}
</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {game.rewardType === "cash" ? (
                      <div className="relative px-4 py-2.5 rounded-xl overflow-hidden"
                           style={{
                             background: 'linear-gradient(135deg, rgba(234,179,8,0.18), rgba(234,179,8,0.05))',
                             border: '1px solid rgba(234,179,8,0.3)',
                             boxShadow: '0 4px 16px rgba(234,179,8,0.1), 0 0 30px rgba(234,179,8,0.05)',
                           }}>
                        <div className="absolute inset-0 opacity-30"
                             style={{
                               background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.3), transparent)',
                               backgroundSize: '200% 100%',
                               animation: 'surge-slide 3s ease-in-out infinite',
                             }} />
                        <span className="relative text-sm font-black tabular-nums"
                              style={{ color: '#fbbf24', textShadow: '0 0 15px rgba(234,179,8,0.6)' }}
                              data-testid={`prize-value-${currentPage * itemsPerPage + index + 1}`}>
                          £{game.rewardValue}
                        </span>
                      </div>
                    ) : game.rewardType === "points" ? (
                      <div className="relative px-4 py-2.5 rounded-xl overflow-hidden"
                           style={{
                             background: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(168,85,247,0.05))',
                             border: '1px solid rgba(168,85,247,0.3)',
                             boxShadow: '0 4px 16px rgba(168,85,247,0.1)',
                           }}>
                        <span className="text-sm font-black tabular-nums"
                              style={{ color: '#c084fc', textShadow: '0 0 12px rgba(168,85,247,0.6)' }}
                              data-testid={`prize-value-${currentPage * itemsPerPage + index + 1}`}>
                          {parseInt(game.rewardValue).toLocaleString()} pts
                        </span>
                      </div>
                    ) : game.rewardType === "try_again" ? (
                      <div className="px-4 py-2.5 rounded-xl"
                           style={{
                             background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.04))',
                             border: '1px solid rgba(6,182,212,0.25)',
                             boxShadow: '0 4px 16px rgba(6,182,212,0.08)',
                           }}>
                        <span className="text-xs font-black tracking-wider"
                              style={{ color: '#22d3ee', textShadow: '0 0 10px rgba(6,182,212,0.6)' }}
                              data-testid={`prize-value-${currentPage * itemsPerPage + index + 1}`}>
                          +1 Play
                        </span>
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 rounded-xl"
                          style={{
                            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))',
                            border: '1px solid rgba(239,68,68,0.2)',
                          }}>
                        <span className="text-xs font-black tracking-wider"
                              style={{ color: '#ef4444', textShadow: '0 0 8px rgba(239,68,68,0.4)' }}
                              data-testid={`prize-value-${currentPage * itemsPerPage + index + 1}`}>
                          NO WIN
                        </span>
                      </div>
                    )}
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
    refetchOrder();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading your Ringtone Voltz game...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!orderData?.order) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-red-500">Invalid order. Please try again.</p>
          <Button className="mt-4" onClick={() => navigate("/")} data-testid="button-go-home">
            Go Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground relative overflow-hidden"
         style={{ background: 'linear-gradient(165deg, #1a1145 0%, #15204e 18%, #1b1650 32%, #132048 48%, #1a1352 65%, #111d4a 82%, #181248 100%)' }}>
      <style dangerouslySetInnerHTML={{ __html: voltzKeyframes }} />

      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.35 }}
      >
        <source src="/voltz-bg-loop.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[60%]"
             style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(234,179,8,0.25) 0%, rgba(234,179,8,0.08) 25%, transparent 55%)', filter: 'blur(40px)' }} />

        <div className="absolute top-[5%] left-[-5%] w-[55%] h-[50%]"
             style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.06) 30%, transparent 55%)', filter: 'blur(30px)' }} />
        <div className="absolute top-[5%] right-[-5%] w-[55%] h-[50%]"
             style={{ background: 'radial-gradient(ellipse at 80% 30%, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.06) 30%, transparent 55%)', filter: 'blur(30px)' }} />

        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[80%] h-[45%]"
             style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.04) 35%, transparent 60%)', filter: 'blur(25px)' }} />

        <div className="absolute bottom-[-5%] left-[-5%] w-[55%] h-[45%]"
             style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.05) 35%, transparent 55%)', filter: 'blur(30px)' }} />
        <div className="absolute bottom-[-5%] right-[-5%] w-[55%] h-[45%]"
             style={{ background: 'radial-gradient(ellipse at 85% 80%, rgba(168,85,247,0.18) 0%, rgba(168,85,247,0.05) 35%, transparent 55%)', filter: 'blur(30px)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[30%]"
             style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(234,179,8,0.12) 0%, transparent 50%)', filter: 'blur(20px)' }} />

        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(234,179,8,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(234,179,8,0.045) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'voltz-flicker 8s ease-in-out infinite',
        }} />

        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }} />

        <div className="absolute top-[12%] left-[8%] w-[2px] h-[100px]"
             style={{ background: 'linear-gradient(180deg, transparent, rgba(239,68,68,0.6), rgba(239,68,68,0.2), transparent)', animation: 'voltz-pulse 3s ease-in-out infinite' }} />
        <div className="absolute top-[22%] right-[10%] w-[2px] h-[80px]"
             style={{ background: 'linear-gradient(180deg, transparent, rgba(34,197,94,0.6), rgba(34,197,94,0.2), transparent)', animation: 'voltz-pulse 4s ease-in-out infinite 1s' }} />
        <div className="absolute top-[45%] left-[4%] w-[2px] h-[120px]"
             style={{ background: 'linear-gradient(180deg, transparent, rgba(59,130,246,0.5), rgba(59,130,246,0.15), transparent)', animation: 'voltz-pulse 5s ease-in-out infinite 0.5s' }} />
        <div className="absolute top-[55%] right-[6%] w-[2px] h-[90px]"
             style={{ background: 'linear-gradient(180deg, transparent, rgba(234,179,8,0.5), rgba(234,179,8,0.12), transparent)', animation: 'voltz-pulse 3.5s ease-in-out infinite 2s' }} />
        <div className="absolute top-[70%] left-[15%] w-[2px] h-[60px]"
             style={{ background: 'linear-gradient(180deg, transparent, rgba(168,85,247,0.5), transparent)', animation: 'voltz-pulse 4.5s ease-in-out infinite 1.5s' }} />
        <div className="absolute top-[35%] right-[18%] w-[2px] h-[70px]"
             style={{ background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.4), transparent)', animation: 'voltz-pulse 3s ease-in-out infinite 0.5s' }} />

        <div className="absolute top-[18%] left-[7%] w-3 h-3 rounded-full"
             style={{ background: '#ef4444', boxShadow: '0 0 20px rgba(239,68,68,0.9), 0 0 50px rgba(239,68,68,0.4), 0 0 80px rgba(239,68,68,0.15)', animation: 'voltz-pulse 2s ease-in-out infinite' }} />
        <div className="absolute top-[30%] right-[9%] w-3 h-3 rounded-full"
             style={{ background: '#22c55e', boxShadow: '0 0 20px rgba(34,197,94,0.9), 0 0 50px rgba(34,197,94,0.4), 0 0 80px rgba(34,197,94,0.15)', animation: 'voltz-pulse 2.5s ease-in-out infinite 0.5s' }} />
        <div className="absolute top-[65%] left-[10%] w-2.5 h-2.5 rounded-full"
             style={{ background: '#3b82f6', boxShadow: '0 0 18px rgba(59,130,246,0.8), 0 0 45px rgba(59,130,246,0.35)', animation: 'voltz-pulse 3s ease-in-out infinite 1s' }} />
        <div className="absolute top-[50%] right-[12%] w-2.5 h-2.5 rounded-full"
             style={{ background: '#fbbf24', boxShadow: '0 0 18px rgba(234,179,8,0.8), 0 0 45px rgba(234,179,8,0.4)', animation: 'voltz-pulse 2s ease-in-out infinite 1.5s' }} />
        <div className="absolute top-[78%] left-[18%] w-2 h-2 rounded-full"
             style={{ background: '#a855f7', boxShadow: '0 0 14px rgba(168,85,247,0.7), 0 0 35px rgba(168,85,247,0.3)', animation: 'voltz-pulse 4s ease-in-out infinite 2s' }} />
        <div className="absolute top-[42%] right-[22%] w-2 h-2 rounded-full"
             style={{ background: '#6366f1', boxShadow: '0 0 12px rgba(99,102,241,0.6)', animation: 'voltz-pulse 3.5s ease-in-out infinite 0.8s' }} />
        <div className="absolute top-[85%] right-[15%] w-2 h-2 rounded-full"
             style={{ background: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,0.6)', animation: 'voltz-pulse 3s ease-in-out infinite 1.2s' }} />
        <div className="absolute top-[15%] left-[25%] w-1.5 h-1.5 rounded-full"
             style={{ background: '#818cf8', boxShadow: '0 0 10px rgba(129,140,248,0.5)', animation: 'voltz-pulse 2.5s ease-in-out infinite 0.3s' }} />

        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.5), rgba(234,179,8,0.7), rgba(250,204,21,0.5), rgba(99,102,241,0.6), rgba(34,197,94,0.5))' }} />

        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'}} />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-4 py-6 sm:py-8">
          <Button variant="ghost" className="mb-4 text-yellow-500/40 hover:text-yellow-400 hover:bg-yellow-500/5" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8 relative">
              <div className="relative inline-block mb-5">
                <Zap className="absolute -left-6 sm:-left-9 top-[45%] -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8"
                     style={{ color: '#facc15', filter: 'drop-shadow(0 0 18px rgba(250,204,21,1)) drop-shadow(0 0 40px rgba(250,204,21,0.6)) drop-shadow(0 0 60px rgba(234,179,8,0.3))', animation: 'voltz-zap-left 3.5s ease-in-out infinite' }} />

                <Zap className="absolute -right-6 sm:-right-9 top-[45%] -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8"
                     style={{ color: '#38bdf8', filter: 'drop-shadow(0 0 18px rgba(56,189,248,1)) drop-shadow(0 0 40px rgba(56,189,248,0.6)) drop-shadow(0 0 60px rgba(59,130,246,0.3))', animation: 'voltz-zap-right 3.5s ease-in-out infinite' }} />

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.04em] leading-none relative">
                  <span style={{
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a 20%, #fbbf24 40%, #f59e0b 60%, #fbbf24 80%, #fef3c7)',
                    backgroundSize: '300% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent',
                    animation: 'surge-slide 5s linear infinite',
                  }}>
                    Ringtone
                  </span>
                  {' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #67e8f9, #22d3ee 20%, #06b6d4 35%, #3b82f6 50%, #8b5cf6 65%, #3b82f6 80%, #22d3ee)',
                    backgroundSize: '300% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent',
                    animation: 'surge-slide 4s linear infinite reverse',
                  }}>
                    Voltz
                  </span>
                </h1>

                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] pointer-events-none overflow-hidden">
                  <div className="absolute w-8 h-full rounded-full" style={{
                    background: 'linear-gradient(90deg, rgba(250,204,21,0.9), rgba(56,189,248,0.9))',
                    filter: 'blur(2px)',
                    boxShadow: '0 0 15px 4px rgba(250,204,21,0.5), 0 0 30px 8px rgba(56,189,248,0.3)',
                    animation: 'voltz-arc-travel 2.5s ease-in-out infinite',
                  }} />
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{
                  width: '120%',
                  height: '160%',
                  background: 'radial-gradient(ellipse at 35% 50%, rgba(250,204,21,0.15) 0%, transparent 50%), radial-gradient(ellipse at 65% 50%, rgba(56,189,248,0.12) 0%, transparent 50%)',
                  filter: 'blur(40px)',
                  animation: 'voltz-title-glow 4s ease-in-out infinite',
                }} />

                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute w-1 h-1 rounded-full pointer-events-none" style={{
                    background: i < 3 ? '#facc15' : '#38bdf8',
                    left: `${15 + i * 14}%`,
                    top: '80%',
                    boxShadow: `0 0 6px 2px ${i < 3 ? 'rgba(250,204,21,0.8)' : 'rgba(56,189,248,0.8)'}`,
                    animation: `voltz-particle-rise 2s ease-out infinite`,
                    animationDelay: `${i * 0.4}s`,
                  }} />
                ))}
              </div>

              <div className="relative">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <div className="h-[1px] w-10 sm:w-20" style={{ background: 'linear-gradient(90deg, transparent, rgba(250,204,21,0.6))' }} />
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#facc15', boxShadow: '0 0 8px rgba(250,204,21,0.8)' }} />
                    <div className="w-1 h-1 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.6)' }} />
                  </div>
                  <div className="h-[1px] w-10 sm:w-20" style={{ background: 'linear-gradient(270deg, transparent, rgba(56,189,248,0.6))' }} />
                </div>

                <p className="text-xs sm:text-sm tracking-wider uppercase font-semibold" style={{
                  color: 'rgba(255,255,255,0.55)',
                  animation: 'voltz-subtitle-glow 6s ease-in-out infinite',
                }}>
                  Press a switch · Surge the power ·{' '}
                  <span className="font-black" style={{
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #22d3ee, #3b82f6)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'surge-slide 3s linear infinite',
                  }}>Win Electric Prizes</span>
                </p>
              </div>
            </div>

            <VoltzGameComponent
              orderId={orderId!}
              competitionId={competitionId!}
              playsRemaining={remainingPlays}
              onPlayComplete={handlePlayComplete}
            />

            {gameHistory.length === 0 ? (
              <div className="relative py-16 text-center rounded-2xl overflow-hidden"
                   style={{
                     background: 'linear-gradient(180deg, rgba(15,12,40,0.97), rgba(10,8,32,0.98))',
                     backdropFilter: 'blur(24px)',
                     border: '1px solid rgba(139,92,246,0.15)',
                     boxShadow: '0 12px 48px rgba(0,0,0,0.4), 0 0 60px rgba(139,92,246,0.04)',
                   }}>
                <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #ef4444, #fbbf24, #22c55e, #3b82f6, #a855f7, #fbbf24, #ef4444)', backgroundSize: '200% 100%', animation: 'surge-slide 8s linear infinite', opacity: 0.6 }} />
                </div>
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 50%)' }} />
                <div className="relative">
                  <div className="w-18 h-18 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ width: 72, height: 72 }}>
                    <div className="w-full h-full rounded-2xl flex items-center justify-center"
                         style={{
                           background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(234,179,8,0.06), rgba(15,12,40,0.5))',
                           border: '1px solid rgba(139,92,246,0.2)',
                           boxShadow: '0 8px 24px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                         }}>
                      <Zap className="w-8 h-8" style={{ color: 'rgba(139,92,246,0.35)', filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.2))' }} />
                    </div>
                  </div>
                  <p className="text-sm font-black tracking-[0.2em] uppercase mb-2" data-testid="text-empty-history"
                     style={{ color: 'rgba(139,92,246,0.45)', textShadow: '0 0 20px rgba(139,92,246,0.15)' }}>No surges recorded</p>
                  <p className="text-xs tracking-wide font-medium" style={{ color: 'rgba(139,92,246,0.25)' }}>Press a switch above to start playing</p>
                </div>
              </div>
            ) : (
              <VoltzGameHistory games={gameHistory} />
            )}
          </div>
        </main>

        <Footer />
      </div>

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-center px-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity" onClick={() => setShowDisclaimer(false)} />
          <div className="relative w-full mb-2 max-w-md overflow-hidden rounded-2xl transform transition-all duration-300 scale-95 animate-slide-up"
               style={{
                 background: 'linear-gradient(180deg, rgba(20,18,50,0.98), rgba(15,15,42,0.99))',
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(139,92,246,0.2)',
                 boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 60px rgba(99,102,241,0.08)',
               }}>
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(234,179,8,0.6), rgba(139,92,246,0.5), transparent)' }} />
            <div className="relative p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                     style={{
                       background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(139,92,246,0.08))',
                       border: '1px solid rgba(234,179,8,0.25)',
                       boxShadow: '0 4px 12px rgba(234,179,8,0.06)',
                     }}>
                  <Zap className="w-5 h-5" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 6px rgba(234,179,8,0.6))' }} />
                </div>
                <div>
                  <p className="text-white/90 font-bold text-sm mb-1.5" style={{ textShadow: '0 0 10px rgba(139,92,246,0.2)' }}>Game Disclaimer</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    All on-screen graphics are for entertainment purposes only. Prize outcomes are securely pre-selected before gameplay and are not influenced by animations.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDisclaimer(false)}
                className="w-full py-3.5 rounded-xl text-black font-black text-sm tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)',
                  boxShadow: '0 4px 20px rgba(234,179,8,0.25), 0 0 40px rgba(234,179,8,0.1)',
                }}
                data-testid="button-dismiss-disclaimer"
              >
                I Understand — Let's Play!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}