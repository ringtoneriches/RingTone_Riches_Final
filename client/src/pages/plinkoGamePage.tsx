import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams, useSearch } from "wouter";
import { GameDisclaimer, GameEmpty, GameHero, GameShell, GameStatus } from "@/components/games/GameChrome";
import PlayResultsTable, { prizeFromReward } from "@/components/games/PlayResultsTable";
import { PlinkoGame } from "@/components/games/plinko-game";
import { useState, useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft, Crown, Star, Gem, Zap, Gift, Sparkles, Target } from "lucide-react";
import congrats from "../../../attached_assets/sounds/congrats.mp3";
import { usePurchaseArrivalToast } from "@/lib/purchase-toast";

export default function PlinkoGamePage() {
const params = useParams();
const { competitionId, orderId } = params;
//   const search = useSearch();
//   const params = new URLSearchParams(search);
//   const orderId = params.get("orderId") || "";
//   const competitionId = params.get("competitionId") || "";
  const [, navigate] = useLocation();
  usePurchaseArrivalToast();
  const [isBallDropping, setIsBallDropping] = useState(false);
  const confirmedHistoryCountRef = useRef<number>(0); // Track how many results were confirmed before current drop
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const winnerCongratsRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    winnerCongratsRef.current = new Audio(congrats);
    winnerCongratsRef.current.volume = 0.5;
  }, []);

  const { data: orderData, isLoading: orderLoading, refetch: refetchOrder } = useQuery({
    queryKey: ["/api/plinko-order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/plinko-order/${orderId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
    enabled: !!orderId,
    refetchInterval: 5000,
  });

  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["/api/plinko-config"],
    queryFn: async () => {
      const res = await fetch("/api/plinko-config");
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json();
    },
  });

  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user data");
      return res.json();
    },
    refetchInterval: 3000, // Refetch every 3 seconds during gameplay
  });

  const handlePlayComplete = () => {
    setIsBallDropping(false);
    // Update confirmed count to include the new result
    confirmedHistoryCountRef.current = (orderData?.history?.length || 0) + 1;
    refetchOrder();
    refetchUser();
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };
  
  const handleDropStart = () => {
    // Remember how many results are currently confirmed before this drop
    confirmedHistoryCountRef.current = orderData?.history?.length || 0;
    setIsBallDropping(true);
  };

  if (!orderId || !competitionId) {
    return (
      <GameEmpty
        title="INVALID SESSION"
        message="This plinko session is missing. Head back and try again."
        actionLabel="Go home"
        href="/"
      />
    );
  }

  if (orderLoading || configLoading) {
    return <GameStatus message="Loading Plinko..." />;
  }

  const prizes = configData?.prizes || [];
  const playsRemaining = orderData?.playsRemaining || 0;
  const rawHistory = orderData?.history || [];
  
  // Only hide new unconfirmed entries - entries that appeared after drop started
  // Once a result is shown, it stays visible (no flickering on "Drop Again")
  const history = isBallDropping && rawHistory.length > confirmedHistoryCountRef.current
    ? rawHistory.slice(rawHistory.length - confirmedHistoryCountRef.current) // Only show confirmed entries
    : rawHistory;

  return (
    <GameShell>
      <audio ref={winnerCongratsRef} />

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center text-sm text-white/45 hover:text-white"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to competitions
        </button>

        <GameHero
          kicker="Plinko drop · play"
          title="RINGTONE PLINKO"
          subtitle="Drop the ball and watch it bounce. Outcome is locked in before the drop."
          remaining={playsRemaining}
          remainingLabel={playsRemaining === 1 ? "drop left" : "drops left"}
          Icon={Target}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Panel - Spectacular Jackpot & Features */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-5">
            {/* GRAND JACKPOT - Premium Showcase */}
            <div className="relative group">
              {/* Animated outer glow */}
              <div className="absolute -inset-0.5 sm:-inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 rounded-2xl sm:rounded-3xl blur-md sm:blur-lg opacity-50 sm:opacity-60 group-hover:opacity-80" style={{ animation: 'jackpot-glow 3s ease-in-out infinite' }} />
              
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/98 to-slate-950 border border-amber-500/50 sm:border-2 sm:border-amber-500/60 p-4 sm:p-6">
                {/* Sparkle effects */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-amber-300 rounded-full animate-ping" />
                <div className="absolute top-6 right-6 sm:top-8 sm:right-8 w-1 sm:w-1.5 h-1 sm:h-1.5 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 w-1 sm:w-1.5 h-1 sm:h-1.5 bg-orange-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                
                {/* Glowing orbs */}
                <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-amber-500/30 rounded-full blur-2xl sm:blur-3xl" />
                <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-orange-500/30 rounded-full blur-2xl sm:blur-3xl" />
                
                <div className="relative text-center">
                  {/* Crown icon with glow */}
                  <div className="relative inline-flex mb-2 sm:mb-4">
                    <div className="absolute inset-0 bg-amber-400/50 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl animate-pulse" />
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/50">
                      <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-900" />
                    </div>
                  </div>
                  
                  {/* Jackpot text */}
                  <div className="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2 sm:mb-3 flex items-center justify-center gap-1.5 sm:gap-2">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    GRAND JACKPOT
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                  
                  {/* Prize amount with shimmer */}
                  <div className="relative inline-block">
                    <div className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl" style={{ animation: 'prize-glow 2s ease-in-out infinite' }}>
                      £1,000
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer-slide 2.5s ease-in-out infinite' }} />
                  </div>
                  
                  {/* CTA */}
                  <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40">
                    <Gem className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" style={{ animation: 'gem-bounce 1s ease-in-out infinite' }} />
                    <span className="text-amber-300 text-xs sm:text-sm font-bold">Drop & Win!</span>
                    <Gem className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" style={{ animation: 'gem-bounce 1s ease-in-out infinite 0.15s' }} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features - Premium Cards - Horizontal on mobile, vertical on desktop */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-3">
              {/* Instant Prize */}
              <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#C8102E]/25 to-[#C8102E]/10 border border-[#C8102E]/40 p-2.5 sm:p-4 hover:border-[#FF263D]/70 transition-all hover:shadow-lg hover:shadow-[#C8102E]/20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#C8102E]/10 to-[#F1D47A]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4 text-center lg:text-left">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#C8102E] to-[#FF263D] flex items-center justify-center shadow-lg shadow-[#C8102E]/30 flex-shrink-0">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-[10px] sm:text-sm leading-tight">Instant Credits</div>
                    <div className="text-white/45 text-[8px] sm:text-xs hidden sm:block">Prizes added instantly</div>
                  </div>
                </div>
              </div>
              
              {/* Free Replays */}
              <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border border-emerald-500/40 p-2.5 sm:p-4 hover:border-emerald-400/70 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4 text-center lg:text-left">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-[10px] sm:text-sm leading-tight">Free Replays</div>
                    <div className="text-emerald-300/70 text-[8px] sm:text-xs hidden sm:block">Random bonus drops</div>
                  </div>
                </div>
              </div>
              
              {/* 10 Prize Tiers */}
              <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-900/40 to-orange-900/30 border border-amber-500/40 p-2.5 sm:p-4 hover:border-amber-400/70 transition-all hover:shadow-lg hover:shadow-amber-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4 text-center lg:text-left">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-[10px] sm:text-sm leading-tight">10 Prize Tiers</div>
                    <div className="text-amber-300/70 text-[8px] sm:text-xs hidden sm:block">Multiple ways to win</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Game Canvas - Center */}
          <div className="lg:col-span-5 flex justify-center">
            <PlinkoGame
              orderId={orderId}
              competitionId={competitionId}
              playsRemaining={playsRemaining}
              onPlayComplete={handlePlayComplete}
              onDropStart={handleDropStart}
              prizes={prizes}
            />
          </div>
          
          <div className="lg:col-span-4">
            <PlayResultsTable
              title="Drop Results"
              rows={history.map((play: any, i: number) => ({
                id: play.id ?? i,
                number: history.length - i,
                ticketNumber: play.ticketNumber,
                ...prizeFromReward({
                  isWin: play.isWin && play.rewardType !== "none",
                  rewardType: play.rewardType,
                  rewardValue: play.rewardValue,
                  prizeName: play.prizeName,
                }),
              }))}
              emptyTitle="READY TO PLAY"
              emptyHint="Drop the ball — each result lands here."
            />
          </div>
        </div>
      </main>
      <GameDisclaimer open={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
      
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .shimmer-jackpot {
          animation: shimmer-jackpot 2.5s ease-in-out infinite;
        }
        
        @keyframes shimmer-jackpot {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
        
        .delay-150 {
          animation-delay: 150ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .animate-gradient-shift {
          animation: gradient-shift 3s ease-in-out infinite;
        }
        
        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes jackpot-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        
        @keyframes prize-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15); }
        }
        
        @keyframes shimmer-slide {
          0% { transform: translateX(-150%); }
          50%, 100% { transform: translateX(150%); }
        }
        
        @keyframes gem-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </GameShell>
  );
}
