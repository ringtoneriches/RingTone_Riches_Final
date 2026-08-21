import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ScratchCardTest from "@/components/games/scratch-card-test";
import { GameDisclaimer, GameEmpty, GameHero, GameShell, GameStatus } from "@/components/games/GameChrome";
import { Sparkles } from "lucide-react";
import { PrizeModal } from "@/components/games/prize-modal";
import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import CountdownTimer from "@/pages/countdownTimer";
import congrats from "../../../attached_assets/sounds/congrats.mp3";
import { completeSession, type CompleteSessionPayload } from "@/services/scratch-session-service";


export default function ScratchGamePage() {
  const { competitionId, orderId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const winnerCongratsRef = useRef<HTMLAudioElement | null>(null)

  useEffect(()=>{
    winnerCongratsRef.current = new Audio(congrats);
    winnerCongratsRef.current.load()
  },[])

  const [gameResult, setGameResult] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [remainingScratches, setRemainingScratches] = useState<number>(0);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  // ✅ Parent-controlled mutation for scratch completion
  // Ensures query invalidation happens even if child component unmounts
  const completeScratchMutation = useMutation({
    mutationFn: async (params: { sessionId: string; payload: CompleteSessionPayload }) => {
      // console.log('🔒 Parent mutation: Completing scratch session:', params.sessionId);
      return await completeSession(params.sessionId, params.payload);
    },
    onSuccess: (data) => {
      // console.log('✅ Parent mutation success: Balance credited, invalidating queries');
      
      // ✅ CRITICAL: Query invalidation happens HERE in parent (survives child unmount)
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scratch-order", orderId] });
      
      // Clear any errors
      setCommitError(null);
      
      // Show success toast
      if (gameResult?.prize && gameResult.prize.type !== "none") {
        toast({
          title: "🎉 Congratulations!",
          description: `You won ${gameResult.prize.type === "cash" ? "£" : ""}${gameResult.prize.type === "points" 
  ? gameResult.prize.value?.replace(/s$/i, "") 
  : gameResult.prize.value}${gameResult.prize.type === "points" ? " points" : ""}!`,

        });
      }
    },
    onError: (error: any) => {
      console.error('❌ Parent mutation error:', error);
      setCommitError(error.message || 'Failed to save scratch result');
      
      toast({
        title: "Error",
        description: "Failed to save your scratch result. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if scratch cards are visible
  const { data: scratchConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/admin/game-scratch-config"],
  });

  // Redirect if scratch cards are hidden
  useEffect(() => {
    if (scratchConfig && scratchConfig.isVisible === false) {
      toast({
        title: "Scratch Cards Unavailable",
        description: "Scratch cards are currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [scratchConfig?.isVisible]);

  // Fetch competition data
  const { data: competition } = useQuery({
    queryKey: ["/api/competitions", competitionId],
  });

  // Fetch order data with real-time updates
  const { data: orderData, isLoading } = useQuery({
    queryKey: ["/api/scratch-order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await apiRequest(`/api/scratch-order/${orderId}`, "GET");
      const data = await res.json();
      // console.log("✅ Scratch order data:", data);
      return data;
    },
  });

  // Update remaining scratches when order data changes
  useEffect(() => {
    if (orderData?.order) {
      const remaining = orderData.order.remainingPlays ?? orderData.order.quantity;
      setRemainingScratches(remaining);
    }
  }, [orderData]);

  // 🎯 Callback 1: Handle scratch reveal - shows popup INSTANTLY when user scratches to 85%
  const handleScratchReveal = (prize: any) => {
    // console.log("🎯 Scratch revealed (instant):", prize);
    
    // Store prize for later use in mutation success handler
    setGameResult({ prize });
    setIsResultModalOpen(true);
    
    // Don't show toast yet - wait for mutation success to ensure balance credited
  };

  // 🎯 Callback 2: Handle session commit - child requests parent to save result via mutation
  // Returns promise that child can await to handle loading/error states
  const handleCommitSession = async (sessionId: string, payload: CompleteSessionPayload): Promise<void> => {
    // console.log("🔒 Commit session requested:", sessionId, payload);
    
    // Use parent mutation (query invalidation survives child unmount)
    await completeScratchMutation.mutateAsync({ sessionId, payload });
  };
  
  // 🎯 Callback 3: Refresh balance - used after reveal-all completes
  const handleRefreshBalance = () => {
    // console.log("🔄 Refreshing user balance and order data");
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/scratch-order", orderId] });
  };

  const handleCloseResultModal = () => {
    setIsResultModalOpen(false);
    
    // If no scratches left, redirect to home page
    if (remainingScratches <= 0) {
      toast({
        title: "All Scratch Cards Used",
        description: "You've used all your scratch cards from this purchase.",
      });
      setTimeout(() => {
        // Clear order-specific localStorage
        if (orderId) {
          localStorage.removeItem(`scratchCardHistory_${orderId}`);
        }
       navigate(`/scratch/${competitionId}/${orderId}`);
      }, 2000);
    }
  };

  if (isLoading) return <GameStatus message="Loading your scratch cards..." />;

  if (!orderData?.order) {
    return (
      <GameEmpty
        title="CARD NOT FOUND"
        message="This scratch purchase could not be found or has expired."
        actionLabel="Browse competitions"
        href="/"
      />
    );
  }

  return (
    <GameShell>
      <section className="mx-auto max-w-5xl px-4 py-6 text-center sm:py-8">
        <GameHero
          kicker="Scratch & win · play"
          title="SCRATCH INTO SUMMER"
          subtitle={competition?.title || "Scratch to reveal. Outcome is locked in before you start."}
          remaining={remainingScratches}
          remainingLabel={remainingScratches === 1 ? "card left" : "cards left"}
          Icon={Sparkles}
        />
        <ScratchCardTest
          onScratchReveal={handleScratchReveal}
          onCommitSession={handleCommitSession}
          onRefreshBalance={handleRefreshBalance}
          commitError={commitError}
          scratchTicketCount={remainingScratches}
          orderId={orderId}
          competitionId={competitionId}
          mode="loose"
          congratsAudioRef={winnerCongratsRef}
        />
      </section>

      <PrizeModal
        isOpen={isResultModalOpen}
        onClose={handleCloseResultModal}
        isWinner={gameResult?.prize?.type !== "none" && gameResult?.prize?.value !== "Lose"}
        prize={gameResult?.prize}
        gameType="scratch"
        congratsAudioRef={winnerCongratsRef}
      />

      <GameDisclaimer open={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </GameShell>
  );
}