
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RingtonePopGame from "@/components/games/ringtone-pop-game";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
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
import { Loader2, Trophy, ArrowLeft, Sparkles, Star, Zap, History, Check, X, RotateCcw, ChevronLeft, ChevronRight, Music } from "lucide-react";

function GameHistoryCarousel({ games }: { games: any[] }) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
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
  
  return (
    <div className="p-3 sm:p-4">
      <div className="relative mb-4 sm:mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
              <History className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-foreground">Game History</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{games.length} rounds played</p>
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
                    i === currentPage ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50'
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
        <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />
        
        <div className="space-y-2">
          {visibleGames.map((game: any, index: number) => {
            const isWin = game.isWin;
            const isRPrize = game.rewardType === "try_again";
            const isPoints = game.rewardType === "points";
            const isCash = game.rewardType === "cash";
            const gameNumber = currentPage * itemsPerPage + index + 1;
            
            const getStatusColor = () => {
              if (isCash) return { bg: 'bg-green-500', border: 'border-green-400', shadow: 'shadow-green-500/50' };
              if (isPoints) return { bg: 'bg-yellow-500', border: 'border-yellow-400', shadow: 'shadow-yellow-500/50' };
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
                        : isRPrize 
                          ? 'bg-gradient-to-r from-blue-950/70 to-blue-950/30 border border-blue-500/40'
                          : 'bg-muted/40 border border-border/50'}
                  `}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCash ? 'bg-green-500' : isPoints ? 'bg-yellow-500' : isRPrize ? 'bg-blue-500' : 'bg-muted-foreground/20'}`} />
                    
                    <div className="relative p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
                      <span className={`text-xs font-bold shrink-0 ${isCash ? 'text-green-400' : isPoints ? 'text-yellow-400' : isRPrize ? 'text-blue-400' : 'text-muted-foreground'}`}>
                        R{gameNumber}
                      </span>
                      
                      <div className="flex items-center gap-1 flex-1 justify-center">
                        {(game.balloonValues || []).map((val: number, i: number) => {
                          const isRSymbol = val === -1;
                          const allMatch = game.balloonValues.every((v: number) => v === game.balloonValues[0]);
                          
                          return (
                            <div
                              key={i}
                              className={`
                                w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold
                                ${isRSymbol 
                                  ? 'bg-blue-600 text-white' 
                                  : allMatch && isPoints
                                    ? 'bg-yellow-500 px-5 text-black'
                                    : allMatch && isCash
                                      ? 'bg-green-600 text-white'
                                      : 'bg-muted/60 text-foreground/70'}
                              `}
                            >
                              {isRSymbol ? "R" : isPoints && allMatch ? (
                                <span className="flex items-center gap-0.5">
                                  <Music className="w-3 h-3" />
                                  <span className=" text-[9px] sm:text-[10px]">{val}</span>
                                </span>
                              ) : `£${val}`}
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
  const [remainingPlays, setRemainingPlays] = useState<number>(0);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
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

  useEffect(() => {
    if (orderData) {
      setRemainingPlays(orderData.playsRemaining || 0);
      setGameHistory(orderData.history || []);
    }
  }, [orderData]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading your Ringtone Pop game...</p>
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
          <Button className="mt-4" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Competitions
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 mb-4">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-slate-300 tracking-wide">RINGTONE POP 2026</span>
            </div>
            
            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                Ringtone
              </span>{" "}
              <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
                Pop!
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">
              Pop all 3 balloons and match to{" "}
              <span className="text-amber-400 font-bold">WIN CASH PRIZES!</span>
            </p>
          </div>

          <RingtonePopGame
            orderId={orderId!}
            competitionId={competitionId!}
            playsRemaining={remainingPlays}
            onPlayComplete={handlePlayComplete}
            onRefresh={handleRefresh}
          />

          {remainingPlays > 1 && (
            <div className="flex justify-center py-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                <Button
                  size="lg"
                  onClick={() => setShowRevealAllDialog(true)}
                  disabled={isRevealingAll}
                  className="relative px-8 py-6 text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500 text-white border-0 rounded-xl shadow-2xl transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-reveal-all"
                >
                  {isRevealingAll ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Revealing All...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Sparkles className="w-6 h-6 animate-bounce" />
                        <div className="absolute inset-0 w-6 h-6 bg-yellow-300 rounded-full blur-md opacity-50 animate-ping" />
                      </div>
                      <span className="tracking-wide">REVEAL ALL</span>
                      <div className="px-3 py-1 bg-white/20 rounded-full text-base">
                        {remainingPlays} plays
                      </div>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}

          <Card className="bg-gradient-to-b from-card to-card/80 border-yellow-500/20 overflow-hidden">
            {/* <CardHeader className="bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 border-b border-yellow-500/10">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <History className="w-5 h-5 text-yellow-500" />
                </div>
                Game History
              </CardTitle>
            </CardHeader> */}
            <CardContent className="p-0">
              {gameHistory.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-lg mb-2">No games played yet</p>
                  <p className="text-muted-foreground/60 text-sm">Start popping balloons to see your history!</p>
                </div>
              ) : (
                <GameHistoryCarousel games={gameHistory} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <AlertDialog open={showRevealAllDialog} onOpenChange={setShowRevealAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reveal All Games?</AlertDialogTitle>
            <AlertDialogDescription>
              This will instantly reveal all {remainingPlays} remaining games. 
              Any prizes won will be credited to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevealAll}>
              Reveal All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
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


    </div>
  );
}
