import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { PrizeModal } from "@/components/games/prize-modal";
import SpinWheel from "@/components/games/spinwheeltest";
import { useLocation } from "wouter";
import CountdownTimer from "@/pages/countdownTimer";
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

   const { data: competition } = useQuery({
      queryKey: ["/api/competitions", competitionId],
    });

      const wheelType = competition?.wheelType || "wheel1";

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
    } else {
      return (
        <SpinWheel // Original wheel
          onSpinComplete={handleSpinComplete}
          ticketCount={remainingSpins}  
          orderId={orderId}
          competitionId={competitionId}
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

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[80vh] text-yellow-400">
        <p>Loading your spins...</p>
      </div>
    );

  if (!orderData?.order)
    return (
      <div className="flex justify-center items-center h-[80vh] text-yellow-400">
        <p>Invalid or expired spin order.</p>
      </div>
    );

  return (
    <div className="min-h-screen  bg-background text-foreground">
      <Header />
      <div className="flex flex-col justify-center items-center">
        {/* Countdown Timer */}
        {/* {competition?.endDate && (
          <div className="py-6">
            <CountdownTimer endDate={competition.endDate} />
          </div>
        )} */}
      </div>
      <main className="container mx-auto   text-center">
          {getWheelComponent()}
          {/* Disclaimer text */}
  {/* <div className="my-8 max-w-2xl mx-auto p-4 bg-gray-900/50 rounded-lg border border-gray-700">
    <p className="text-sm text-gray-400">
      Please note: All on-screen graphics are for entertainment purposes only. 
      Prize outcomes are securely pre-selected before any visual gameplay begins 
      and are not influenced by the animations.
    </p>
  </div> */}
  
      </main>

      {/* Modern Prize Modal with Confetti */}
      <PrizeModal
        isOpen={isResultModalOpen}
        onClose={handleCloseResultModal}
        isWinner={gameResult?.prize?.type !== "none"}
        prize={gameResult?.prize}
        gameType="spin"
        congratsAudioRef={congratsAudioRef}
      />

      <Footer />

      {showDisclaimer && (
  <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm text-xs text-gray-300 p-3 text-center z-50 border-t border-gray-700">
    <div className="max-w-4xl mx-auto px-4 flex items-center justify-between gap-3">
      <p className="flex-1 text-left">
        Please note: All on-screen graphics are for entertainment purposes only. 
        Prize outcomes are securely pre-selected before any visual gameplay begins 
        and are not influenced by the animations.
      </p>
      <button
        onClick={() => setShowDisclaimer(false)}
        className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
      >
        Got it
      </button>
    </div>
  </div>
)}
    </div>
  );
}