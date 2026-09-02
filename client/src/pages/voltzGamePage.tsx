import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import VoltzGameComponent from "@/components/games/voltz-game";
import { GameDisclaimer, GameEmpty, GameHero, GameShell, GameStatus } from "@/components/games/GameChrome";
import PlayResultsTable, { prizeFromReward } from "@/components/games/PlayResultsTable";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, Zap } from "lucide-react";
import { usePurchaseArrivalToast } from "@/lib/purchase-toast";


export default function VoltzGamePage() {
  const { competitionId, orderId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  usePurchaseArrivalToast();
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
          subtitle="Tap a switch. Match all 3. Instant prize."
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
          <PlayResultsTable
            className="rr-voltz-panel"
            title="Play Results"
            testId="voltz-history"
            emptyTestId="text-empty-history"
            rows={gameHistory.map((g: any, i: number) => ({
              id: g.id ?? i,
              number: i + 1,
              ticketNumber: g.ticketNumber,
              ...prizeFromReward(g),
            }))}
            emptyTitle="NO SURGES RECORDED"
            emptyHint="Tap a switch above to start playing."
          />
          </div>
        </main>

      <GameDisclaimer open={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </GameShell>
  );
}
