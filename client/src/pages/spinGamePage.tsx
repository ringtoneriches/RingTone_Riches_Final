import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GameDisclaimer, GameEmpty, GameHero, GameShell, GameStatus } from "@/components/games/GameChrome";
import { Target } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { PrizeModal } from "@/components/games/prize-modal";
import { usePurchaseArrivalToast } from "@/lib/purchase-toast";
import SpinWheel from "@/components/games/spinwheeltest";
import { useLocation } from "wouter";
import congrats from "../../../attached_assets/sounds/congrats.mp3"
import SpinWheel2 from "@/components/games/spinwheeltest2";


export default function SpinGamePage() {
 const { competitionId, orderId } = useParams();
 const congratsAudioRef = useRef<HTMLAudioElement | null>(null);
 
  useEffect(() => {
    congratsAudioRef.current = new Audio(congrats);
    congratsAudioRef.current.load();
  }, []);

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [gameResult, setGameResult] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [remainingSpins, setRemainingSpins] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  // Fetch order data
  const { data: orderData, isLoading } = useQuery({
    queryKey: ["/api/spin-order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await apiRequest(`/api/spin-order/${orderId}`, "GET");
      const data = await res.json();
      return data;
    },
  });

   const { data: competition, isFetched: competitionFetched } = useQuery({
      queryKey: ["/api/competitions", competitionId],
    });

      const wheelType = competition?.wheelType || "wheel1";
      const [retroReady, setRetroReady] = useState(false);
      const toastReady = !competitionFetched
        ? false
        : wheelType === "wheel2"
          ? retroReady
          : true;
      usePurchaseArrivalToast(competition?.wheelType, toastReady);

      useEffect(() => {
        if (wheelType !== "wheel2") return;
        const timer = window.setTimeout(() => setRetroReady(true), 8000);
        return () => window.clearTimeout(timer);
      }, [wheelType]);

      useEffect(() => {
      return () => {
        if (orderId) {
          const history = JSON.parse(localStorage.getItem(`spinWheelHistory_${orderId}`) || "[]");
    
          const allDone = history.length > 0 && history.every(h => h.status === "SPUN");
    
          if (allDone) {
            localStorage.removeItem(`spinWheelHistory_${orderId}`);
          }
        }
      };
    }, []);
  // Update remaining spins count
  useEffect(() => {
    if (orderData?.order) {
      const remaining = orderData.order.remainingPlays ?? orderData.order.quantity;
      setRemainingSpins(remaining);
    }
  }, [orderData]);

  // 🎯 Handle spin completion - wheel component already calls API server-side
  const handleSpinComplete = (
    winnerSegment: number,
    winnerLabel: string,
    winnerPrize: any
  ) => {
    // console.log("🎯 Spin complete:", { winnerSegment, winnerLabel, winnerPrize });

    // Normalize prize data for display
    const rawPrize = winnerPrize || {};
    let detectedType = "none";
    let detectedValue = 0;

    // 🧠 Detect type based on prize content
    if (typeof rawPrize.amount === "number" && rawPrize.amount > 0) {
      detectedType = "cash";
      detectedValue = rawPrize.amount;
    } else if (typeof rawPrize.amount === "string" && rawPrize.amount.toLowerCase().includes("ringtone")) {
      detectedType = "points";
      detectedValue = rawPrize.amount;
    }

    const normalizedPrize = {
      type: rawPrize.type || detectedType,
      value: rawPrize.value ?? detectedValue,
      image: rawPrize.image || null,
      brand: rawPrize.brand || winnerLabel || "Mystery Prize",
    };

    const normalizedResult = {
      winnerSegment,
      winnerLabel,
      prize: normalizedPrize,
    };

    // console.log("🎯 Normalized Game Result:", normalizedResult);

    setGameResult(normalizedResult);
    setIsResultModalOpen(true);

    // Refresh user data and order status
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/spin-order", orderId] });

    if (normalizedPrize.type !== "none") {
      toast({
        title: "🎉 Congratulations!",
       description: `You won ${normalizedPrize.type === "cash" ? "£" : ""}${normalizedPrize.type === "points" 
  ? normalizedPrize.value?.replace(/s$/i, "") 
  : normalizedPrize.value}${normalizedPrize.type === "points" ? " points" : ""}!`,

      });
    }
  };

   const getWheelComponent = () => {
    if (wheelType === "wheel2") {
      return (
        <SpinWheel2 // You need to create this component
          onSpinComplete={handleSpinComplete}
          ticketCount={remainingSpins}  
          orderId={orderId}
          competitionId={competitionId}
          playTickets={orderData?.playTickets || []}
          isSpinning={isSpinning}
          setIsSpinning={setIsSpinning}    
          congratsAudioRef={congratsAudioRef} 
          onAllSpinsComplete={() => {
            toast({
              title: "All Spins Used",
              description: "You've used all spins from this purchase."
            });
          }}
          onReady={() => setRetroReady(true)}
        />
      );
    } else {
      return (
        <SpinWheel // Original wheel
          onSpinComplete={handleSpinComplete}
          ticketCount={remainingSpins}  
          orderId={orderId}
          competitionId={competitionId}
          playTickets={orderData?.playTickets || []}
          isSpinning={isSpinning}
          setIsSpinning={setIsSpinning}    
          congratsAudioRef={congratsAudioRef} 
          onAllSpinsComplete={() => {
            toast({
              title: "All Spins Used",
              description: "You've used all spins from this purchase."
            });
          }}
        />
      );
    }
  };


  const handleCloseResultModal = () => {
    setIsResultModalOpen(false);

    // if (remainingSpins <= 0) {
    //   toast({
    //     title: "All Spins Used",
    //     description: "You’ve used all your spins from this purchase.",
    //   });
    //   setTimeout(() => {
    //     // Clear order-specific localStorage
    //     if (orderId) {
    //       localStorage.removeItem(`spinWheelHistory_${orderId}`);
    //     }
    //     window.location.href = "/";
    //   }, 2000);
    // }
  };

  if (isLoading) return <GameStatus message="Loading your spins..." />;

  if (!orderData?.order) {
    return (
      <GameEmpty
        title="SPIN EXPIRED"
        message="This spin order is invalid or has expired."
        actionLabel="Back to home"
        href="/"
      />
    );
  }

  const isRetro = wheelType === "wheel2";

  return (
    <GameShell>
      <main className="mx-auto max-w-5xl px-4 py-6 text-center sm:py-8">
        <GameHero
          kicker={isRetro ? "Retro spin · play" : "Luxury spin · play"}
          title={isRetro ? "RETRO RINGTONE SPIN" : "LUXURY CAR SPIN"}
          subtitle="Spin for the prize. Outcome is locked in before the wheel moves."
          remaining={remainingSpins}
          remainingLabel={remainingSpins === 1 ? "spin left" : "spins left"}
          Icon={Target}
        />
        {getWheelComponent()}
      </main>

      <PrizeModal
        isOpen={isResultModalOpen}
        onClose={handleCloseResultModal}
        isWinner={gameResult?.prize?.type !== "none"}
        prize={gameResult?.prize}
        gameType="spin"
        congratsAudioRef={congratsAudioRef}
        spinWheelType={wheelType}
      />

      <GameDisclaimer open={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </GameShell>
  );
}