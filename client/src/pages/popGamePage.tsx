
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RingtonePopGame from "@/components/games/ringtone-pop-game";
import { GameDisclaimer, GameEmpty, GameHero, GameShell, GameStatus } from "@/components/games/GameChrome";
import PlayResultsTable, { prizeFromReward } from "@/components/games/PlayResultsTable";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
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
import { Loader2, ArrowLeft, Sparkles, Zap, Gift } from "lucide-react";

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

          <PlayResultsTable
            className="rr-pop-panel"
            title="Play Results"
            rows={gameHistory.map((g: any, i: number) => ({
              id: g.id ?? i,
              number: i + 1,
              ...prizeFromReward(g),
            }))}
            emptyTitle="NO GAMES PLAYED YET"
            emptyHint="Start popping balloons to see each result here."
          />
        </div>
      </main>

      <AlertDialog open={showRevealAllDialog} onOpenChange={setShowRevealAllDialog}>
        <AlertDialogContent className="rr-pop-panel border-white/10 bg-[#0A0A0D] text-white">
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
