
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RingtonePopGame from "@/components/games/ringtone-pop-game";
import { GameDisclaimer, GameEmpty, GameHero, GameShell, GameStatus } from "@/components/games/GameChrome";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trophy, ArrowLeft, Sparkles, Star, Zap, History, Check, X, RotateCcw, ChevronLeft, ChevronRight, Music, Package, Gift } from "lucide-react";

function GameHistoryCarousel({ games }: { games: any[] }) {
  console.log(games)
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(games.length / itemsPerPage);
  
  const visibleGames = games.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const showNavigation = games.length > itemsPerPage;
  
  const goNext = () => setCurrentPage(p => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setCurrentPage(p => Math.max(p - 1, 0));
  
  const cashWins = games.filter((g: any) => g.isWin && g.rewardType === "cash");
  const pointsWins = games.filter((g: any) => g.isWin && g.rewardType === "points");
  const physicalWins = games.filter((g: any) => g.rewardType === "physical");
  const freePlayWins = games.filter((g: any) => g.rewardType === "try_again");
  
  const totalCashWinnings = cashWins.reduce((sum: number, g: any) => sum + (parseFloat(g.rewardValue) || 0), 0);
  const totalPointsWinnings = pointsWins.reduce((sum: number, g: any) => sum + (parseInt(g.rewardValue) || 0), 0);
  
  return (
    <div className="p-3 sm:p-4">
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-[#C8102E]/30 bg-[#C8102E]/10 p-4 sm:mb-6 sm:p-5">
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#F1D47A]/30 bg-[#F1D47A]/15 sm:h-14 sm:w-14">
              <History className="h-6 w-6 text-[#F1D47A] sm:h-7 sm:w-7" />
            </div>
            <div>
              <h3 className="font-prize text-xl text-white sm:text-2xl">GAME HISTORY</h3>
              <p className="text-xs text-white/45 sm:text-sm">{games.length} rounds played</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {cashWins.length > 0 && (
              <div className="text-center px-3 py-2 rounded-xl bg-green-500/20 border border-green-500/30">
                <div className="flex items-center gap-1.5 justify-center">
                  <Trophy className="w-4 h-4 text-green-400" />
                  <span className="text-lg sm:text-xl font-black text-green-400">£{totalCashWinnings.toFixed(2)}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-green-400/70 font-medium uppercase tracking-wider">Cash Won</span>
              </div>
            )}
            {pointsWins.length > 0 && (
              <div className="text-center px-3 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                <div className="flex items-center gap-1.5 justify-center">
                  <Music className="w-4 h-4 text-yellow-400" />
                  <span className="text-lg sm:text-xl font-black text-yellow-400">{totalPointsWinnings.toLocaleString()}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-yellow-400/70 font-medium uppercase tracking-wider">Points Won</span>
              </div>
            )}
            {physicalWins.length > 0 && (
              <div className="text-center px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
                <div className="flex items-center gap-1.5 justify-center">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span className="text-lg sm:text-xl font-black text-purple-400">{physicalWins.length}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-purple-400/70 font-medium uppercase tracking-wider">Physical Prizes</span>
              </div>
            )}
            {freePlayWins.length > 0 && (
              <div className="text-center px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
                <div className="flex items-center gap-1.5 justify-center">
                  <RotateCcw className="w-4 h-4 text-blue-400" />
                  <span className="text-lg sm:text-xl font-black text-blue-400">{freePlayWins.length}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-blue-400/70 font-medium uppercase tracking-wider">Free Plays</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showNavigation && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">
            Rounds {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, games.length)} of {games.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={goPrev}
              disabled={currentPage === 0}
              className="w-8 h-8 rounded-full disabled:opacity-30"
              data-testid="button-history-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentPage ? 'bg-[#C8102E] w-6' : 'bg-white/20 w-2 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={goNext}
              disabled={currentPage === totalPages - 1}
              className="w-8 h-8 rounded-full disabled:opacity-30"
              data-testid="button-history-next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="relative">
        <div className="absolute left-5 top-0 h-full w-0.5 bg-gradient-to-b from-[#C8102E]/60 via-[#C8102E]/20 to-transparent sm:left-6" />
        
        <div className="space-y-2">
          {visibleGames.map((game: any, index: number) => {
            const isWin = game.isWin;
            const isPhysical = game.rewardType === "physical";
            const isRPrize = game.rewardType === "try_again";
            const isPoints = game.rewardType === "points";
            const isCash = game.rewardType === "cash";
            const gameNumber = currentPage * itemsPerPage + index + 1;
            
            const getStatusColor = () => {
              if (isCash) return { bg: 'bg-green-500', border: 'border-green-400', shadow: 'shadow-green-500/50' };
              if (isPoints) return { bg: 'bg-yellow-500', border: 'border-yellow-400', shadow: 'shadow-yellow-500/50' };
              if (isPhysical) return { bg: 'bg-purple-500', border: 'border-purple-400', shadow: 'shadow-purple-500/50' };
              if (isRPrize) return { bg: 'bg-blue-500', border: 'border-blue-400', shadow: 'shadow-blue-500/50' };
              return { bg: 'bg-muted', border: 'border-border', shadow: '' };
            };
            const statusColor = getStatusColor();
            
            return (
              <div key={game.id || index} className="relative group">
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10">
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all ${statusColor.bg} ${statusColor.border} ${statusColor.shadow ? `shadow-md ${statusColor.shadow}` : ''}`} />
                </div>
                
                <div className="ml-9 sm:ml-12 pr-1">
                  <div className={`
                    relative rounded-xl overflow-hidden transition-all duration-200 group-hover:scale-[1.01]
                    ${isCash 
                      ? 'bg-gradient-to-r from-green-950/70 to-green-950/30 border border-green-500/40' 
                      : isPoints
                        ? 'bg-gradient-to-r from-yellow-950/70 to-yellow-950/30 border border-yellow-500/40'
                        : isPhysical
                          ? 'bg-gradient-to-r from-purple-950/70 to-purple-950/30 border border-purple-500/40'
                        : isRPrize 
                          ? 'bg-gradient-to-r from-blue-950/70 to-blue-950/30 border border-blue-500/40'
                          : 'bg-muted/40 border border-border/50'}
                  `}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCash ? 'bg-green-500' : isPoints ? 'bg-yellow-500' : isPhysical ? 'bg-purple-500' : isRPrize ? 'bg-blue-500' : 'bg-muted-foreground/20'}`} />
                    
                    <div className="relative p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
                      <span className={`text-xs font-bold shrink-0 ${isCash ? 'text-green-400' : isPoints ? 'text-yellow-400' : isPhysical ? 'text-purple-400' : isRPrize ? 'text-blue-400' : 'text-muted-foreground'}`}>
                        R{gameNumber}
                      </span>
                      
                      <div className="flex items-center gap-1 flex-1 justify-center">
                        {(game.balloonValues || []).map((val: any, i: number) => {
                          const isRSymbol = val === -1;
                          const allMatch = game.balloonValues.every((v: any) => v === game.balloonValues[0]);
                          
                          return (
                            <div
                              key={i}
                              className={`
                                w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold
                                ${isRSymbol 
                                  ? 'bg-blue-600 text-white' 
                                  : allMatch && isPoints && !isPhysical
                                    ? 'bg-yellow-500 px-5 text-black'
                                    : allMatch && isCash && !isPhysical
                                      ? 'bg-green-600 text-white'
                                      : isPhysical && allMatch
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-muted/60 text-foreground/70'}
                              `}
                            >
                              {isRSymbol ? "R" : isPhysical && allMatch ? (
                                <Package className="w-4 h-4" />
                              ) : isPoints && allMatch && !isPhysical ? (
                                <span className="flex items-center gap-0.5">
                                  <Music className="w-3 h-3" />
                                  <span className="text-[9px] sm:text-[10px]">{val}</span>
                                </span>
                              ) : typeof val === 'number' ? (
                                `£${val}`
                              ) : (
                                val
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="shrink-0 text-right min-w-[70px] sm:min-w-[90px]">
                        {isCash ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-xs sm:text-base font-black text-green-400">£{game.rewardValue}</span>
                          </div>
                        ) : isPoints ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Music className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-xs sm:text-base font-black text-yellow-400">{parseInt(game.rewardValue).toLocaleString()} pts</span>
                          </div>
                        ) : isPhysical ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Package className="w-3.5 h-3.5 text-purple-400" />
                            <span
  className="text-xs sm:text-sm font-bold text-purple-400 truncate max-w-[120px]"
  title={game.prizeName || game.prizeDescription || "Prize"}
>
  {game.prizeName || game.prizeDescription || "Prize"}
</span>
                          </div>
                        ) : isRPrize ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Zap className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-xs sm:text-sm font-bold text-blue-400">+1 Play</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">No Match</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {showNavigation && (
        <div className="flex justify-center gap-3 mt-4 pt-3 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            onClick={goPrev}
            disabled={currentPage === 0}
            className="gap-1.5"
            data-testid="button-history-prev-bottom"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={goNext}
            disabled={currentPage === totalPages - 1}
            className="gap-1.5"
            data-testid="button-history-next-bottom"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PopGamePage() {
  const { competitionId, orderId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [gameResult, setGameResult] = useState<any>(null);
  const [showRevealAllDialog, setShowRevealAllDialog] = useState(false);
  const [isRevealingAll, setIsRevealingAll] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const { data: popConfig } = useQuery<{ isVisible: boolean; isActive: boolean }>({
    queryKey: ["/api/pop-config"],
  });

  useEffect(() => {
    if (popConfig && (popConfig.isVisible === false || popConfig.isActive === false)) {
      toast({
        title: "Ringtone Pop Unavailable",
        description: "Ringtone Pop is currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [popConfig?.isVisible, popConfig?.isActive]);

  const { data: competition } = useQuery({
    queryKey: ["/api/competitions", competitionId],
  });

  const { data: orderData, isLoading, refetch: refetchOrder } = useQuery({
    queryKey: ["/api/pop-order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await apiRequest(`/api/pop-order/${orderId}`, "GET");
      const data = await res.json();
      return data;
    },
  });

  // Derive from order data so the game never mounts with a stale 0 and flashes "No Pops Left"
  const remainingPlays = orderData?.playsRemaining ?? 0;
  const gameHistory = orderData?.history ?? [];

  const handlePlayComplete = (result: any) => {
    setGameResult(result);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/pop-order", orderId] });
    refetchOrder();
  };

  const handleRevealAll = async () => {
    if (remainingPlays <= 0) return;
    
    setIsRevealingAll(true);
    setShowRevealAllDialog(false);

    try {
      const response = await fetch("/api/reveal-all-pop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId, competitionId, count: remainingPlays }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reveal all");
      }

      const data = await response.json();
      
      const wins = data.results.filter((r: any) => r.isWin || r.isRPrize);
      
      toast({
        title: "All Games Revealed!",
        description: `Processed ${data.processed} games. ${wins.length > 0 ? `Won £${data.totalWon.toFixed(2)}!` : "No wins this time."}`,
      });

      handleRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reveal all games",
        variant: "destructive",
      });
    } finally {
      setIsRevealingAll(false);
    }
  };

  const totalCashWins = gameHistory.filter((g: any) => g.isWin && g.rewardType === "cash");
  const totalPointsWins = gameHistory.filter((g: any) => g.isWin && g.rewardType === "points");
  const totalRPrizes = gameHistory.filter((g: any) => g.rewardType === "try_again").length;
  const totalCashAmount = totalCashWins.reduce((sum: number, g: any) => sum + parseFloat(g.rewardValue || 0), 0);
  const totalPointsAmount = totalPointsWins.reduce((sum: number, g: any) => sum + parseInt(g.rewardValue || 0), 0);

  if (isLoading) return <GameStatus message="Loading your Ringtone Pop game..." />;

  if (!orderData?.order) {
    return (
      <GameEmpty
        title="INVALID ORDER"
        message="This pop order could not be found. Please try again."
        actionLabel="Go home"
        href="/"
      />
    );
  }

  return (
    <GameShell>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <button
          type="button"
          className="mb-6 inline-flex items-center text-sm text-white/45 hover:text-white"
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to competitions
        </button>

        <GameHero
          kicker="Balloon pop · play"
          title="RINGTONE POP"
          subtitle="Pop all 3 balloons and match to win."
          remaining={remainingPlays}
          remainingLabel={remainingPlays === 1 ? "play left" : "plays left"}
          Icon={Gift}
        />

        <div className="space-y-6">
          <RingtonePopGame
            orderId={orderId!}
            competitionId={competitionId!}
            playsRemaining={remainingPlays}
            onPlayComplete={handlePlayComplete}
            onRefresh={handleRefresh}
          />

          {remainingPlays > 1 && (
            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={() => setShowRevealAllDialog(true)}
                disabled={isRevealingAll}
                className="rr-cta px-8 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="button-reveal-all"
              >
                {isRevealingAll ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Revealing all...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-3">
                    <Sparkles className="h-5 w-5" />
                    Reveal all
                    <span className="rounded-full bg-white/15 px-3 py-0.5 text-sm">
                      {remainingPlays} plays
                    </span>
                  </span>
                )}
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0D]/80">
            {gameHistory.length === 0 ? (
              <div className="py-16 text-center">
                <Sparkles className="mx-auto mb-4 h-10 w-10 text-white/20" />
                <p className="text-lg text-white/60">No games played yet</p>
                <p className="mt-1 text-sm text-white/35">Start popping balloons to see your history.</p>
              </div>
            ) : (
              <GameHistoryCarousel games={gameHistory} />
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={showRevealAllDialog} onOpenChange={setShowRevealAllDialog}>
        <AlertDialogContent className="border-white/10 bg-[#0A0A0D] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-prize text-2xl">Reveal all games?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This will instantly reveal all {remainingPlays} remaining games.
              Any prizes won will be credited to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRevealAll} className="bg-[#C8102E] text-white hover:bg-[#FF263D]">
              Reveal all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GameDisclaimer open={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </GameShell>
  );
}
