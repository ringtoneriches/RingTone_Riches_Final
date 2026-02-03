import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams, useSearch } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { PlinkoGame } from "@/components/games/plinko-game";
import { useState, useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Coins, Crown, Loader2, Star, Gem, Zap, Gift, Diamond, ChevronLeft, ChevronRight, Award, Sparkles } from "lucide-react";
import congrats from "../../../attached_assets/sounds/congrats.mp3";

export default function PlinkoGamePage() {
const params = useParams();
const { competitionId, orderId } = params;
//   const search = useSearch();
//   const params = new URLSearchParams(search);
//   const orderId = params.get("orderId") || "";
//   const competitionId = params.get("competitionId") || "";
  const [, navigate] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
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
    setCurrentPage(1); // Show latest result on first page
  };
  
  const handleDropStart = () => {
    // Remember how many results are currently confirmed before this drop
    confirmedHistoryCountRef.current = orderData?.history?.length || 0;
    setIsBallDropping(true);
  };

  if (!orderId || !competitionId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Game Session</h1>
          <Button onClick={() => navigate("/")} data-testid="button-go-home">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (orderLoading || configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white/70">Loading Plinko...</p>
        </div>
      </div>
    );
  }

  const prizes = configData?.prizes || [];
  const playsRemaining = orderData?.playsRemaining || 0;
  const rawHistory = orderData?.history || [];
  
  // Only hide new unconfirmed entries - entries that appeared after drop started
  // Once a result is shown, it stays visible (no flickering on "Drop Again")
  const history = isBallDropping && rawHistory.length > confirmedHistoryCountRef.current
    ? rawHistory.slice(rawHistory.length - confirmedHistoryCountRef.current) // Only show confirmed entries
    : rawHistory;
  
  // Pagination logic - newest first
  const totalPages = Math.max(1, Math.ceil(history.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = history.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      <Header />
      <audio ref={winnerCongratsRef} />
      
      {/* Luxury background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
      </div>
      
      <main className="relative max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-purple-300 hover:text-purple-100"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Competitions
        </Button>
        
        {/* Premium Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 mb-6">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-bold tracking-wider">PREMIUM PLINKO EXPERIENCE</span>
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black mb-3">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
              Ringtone Plinko
            </span>
          </h1>
          <p className="text-purple-200/70 text-xl max-w-md mx-auto">
            Drop the ball and watch your fortune unfold
          </p>
        </div>
        
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
              <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-900/40 to-fuchsia-900/30 border border-purple-500/40 p-2.5 sm:p-4 hover:border-purple-400/70 transition-all hover:shadow-lg hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4 text-center lg:text-left">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-400 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-[10px] sm:text-sm leading-tight">Instant Credits</div>
                    <div className="text-purple-300/70 text-[8px] sm:text-xs hidden sm:block">Prizes added instantly</div>
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
          
          {/* Results History - Right - Premium Showcase */}
          <div className="lg:col-span-4">
            <div className="relative overflow-hidden rounded-3xl border-2 border-transparent bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-950">
              {/* Animated border glow */}
              <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 rounded-3xl opacity-60 blur-sm animate-gradient-shift" />
              
              {/* Inner container */}
              <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-950 rounded-3xl m-[2px]">
                {/* Header with shimmer effect */}
                <div className="relative px-6 py-5 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-pink-500/30" />
                  <div className="absolute inset-0 shimmer-effect" />
                  
                  <div className="relative flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur-md opacity-80" />
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-xl">
                        <Award className="w-7 h-7 text-amber-900" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight">YOUR RESULTS</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm text-purple-300/80">{history.length} total drops</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Divider with glow */}
                <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                
                {/* Results List - Premium Cards */}
                <div className="p-5">
                  {history.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="relative inline-flex">
                        <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl animate-pulse" />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/30 flex items-center justify-center">
                          <Sparkles className="w-10 h-10 text-purple-400/60" />
                        </div>
                      </div>
                      <p className="text-white/50 text-base mt-6 font-semibold">Ready to Play</p>
                      <p className="text-white/30 text-sm mt-2">Your winning moments will appear here</p>
                    </div>
                  ) : (
                    <>
                      {/* Prize Cards */}
                      <div className="space-y-3">
                        {paginatedHistory.map((play: any, i: number) => {
                          const isWin = play.isWin && play.rewardType !== "none";
                          const isFreePlay = play.rewardType === "free_play";
                          const isLatest = currentPage === 1 && i === 0;
                          const dropNumber = history.length - (startIndex + i);
                          
                          return (
                            <div
                              key={startIndex + i}
                              className={`relative group transition-all duration-300 ${isLatest ? 'scale-[1.02]' : ''}`}
                            >
                              {/* Outer glow for wins */}
                              {isWin && (
                                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/50 via-yellow-400/40 to-orange-500/50 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
                              )}
                              
                              <div className={`relative rounded-2xl overflow-hidden ${
                                isLatest ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-slate-900' : ''
                              }`}>
                                {/* Background */}
                                <div className={`absolute inset-0 ${
                                  isWin 
                                    ? "bg-gradient-to-r from-amber-600/30 via-yellow-500/25 to-orange-600/30"
                                    : isFreePlay
                                    ? "bg-gradient-to-r from-cyan-600/25 via-blue-500/20 to-indigo-600/25"
                                    : "bg-gradient-to-r from-slate-800/90 via-slate-800/70 to-slate-800/90"
                                }`} />
                                
                                <div className="relative p-4 flex items-center gap-4">
                                  {/* Prize Icon Badge */}
                                  <div className="relative shrink-0">
                                    {isWin && (
                                      <div className="absolute -inset-2 bg-amber-400/40 rounded-2xl blur-lg animate-pulse" />
                                    )}
                                    <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${
                                      isWin 
                                        ? "bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500"
                                        : isFreePlay
                                        ? "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500"
                                        : "bg-gradient-to-br from-slate-600 to-slate-700 border border-slate-500/50"
                                    }`}>
                                      {isWin ? (
                                        play.rewardType === "cash" ? (
                                          <Trophy className="w-6 h-6 text-amber-900" />
                                        ) : (
                                          <Coins className="w-6 h-6 text-amber-900" />
                                        )
                                      ) : isFreePlay ? (
                                        <Gift className="w-6 h-6 text-white" />
                                      ) : (
                                        <span className="text-2xl font-black text-slate-400">X</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Prize Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-xl font-black ${
                                      isWin 
                                        ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200" 
                                        : isFreePlay
                                        ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-300 to-cyan-200"
                                        : "text-slate-400"
                                    }`}>
                                      {isWin ? (
                                        play.rewardType === "cash" 
                                          ? `£${play.rewardValue}` 
                                          : `${play.rewardValue} Points`
                                      ) : isFreePlay ? (
                                        "+1 Free Play"
                                      ) : (
                                        "No Prize"
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-white/40">Drop #{dropNumber}</span>
                                      {isLatest && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                          LATEST
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Status Badge */}
                                  <div className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black tracking-wider ${
                                    isWin 
                                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-amber-900 shadow-lg shadow-amber-500/30"
                                      : isFreePlay
                                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                                      : "bg-slate-700/80 text-slate-400 border border-slate-600/50"
                                  }`}>
                                    {isWin ? "WON" : isFreePlay ? "BONUS" : "MISS"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white disabled:opacity-30 hover:bg-purple-500/20 hover:border-purple-500/50"
                            data-testid="button-prev-page"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </Button>
                          
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = idx + 1;
                              } else if (currentPage <= 3) {
                                pageNum = idx + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + idx;
                              } else {
                                pageNum = currentPage - 2 + idx;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-8 h-8 rounded-lg font-bold text-sm transition-all ${
                                    currentPage === pageNum
                                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg"
                                      : "text-white/60 hover:text-white hover:bg-white/10"
                                  }`}
                                  data-testid={`button-page-${pageNum}`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white disabled:opacity-30 hover:bg-purple-500/20 hover:border-purple-500/50"
                            data-testid="button-next-page"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {showDisclaimer && (
  <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-center px-4">
    {/* Backdrop */}
    <div 
      className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={() => setShowDisclaimer(false)}
    ></div>

    {/* Disclaimer Card */}
    <div className="relative w-full mb-2 max-w-md bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-700 transform transition-all duration-300 scale-95 animate-slide-up">
      <div className="flex flex-col items-start gap-4 ">
        <p className="text-white text-sm sm:text-base font-medium leading-snug">
          ⚠️ <span className="font-semibold">Disclaimer:</span> All on-screen graphics are for entertainment purposes only. Prize outcomes are securely pre-selected before gameplay and are not influenced by animations.
        </p>
        <button
          onClick={() => setShowDisclaimer(false)}
          className="self-end bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2 rounded-full font-semibold text-sm sm:text-base shadow-lg transition-transform duration-200 hover:scale-105"
        >
          Got it
        </button>
      </div>
    </div>
  </div>
)}
      <Footer />
      
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
    </div>
  );
}