import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { PrizeModal } from "@/components/games/prize-modal";
import SpinWheel from "@/components/games/spinwheeltest";
import { useLocation } from "wouter";
import CountdownTimer from "@/pages/countdownTimer";


export default function SpinGamePage() {
 const { competitionId, orderId } = useParams();

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [gameResult, setGameResult] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [remainingSpins, setRemainingSpins] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);

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
    console.log("🎯 Spin complete:", { winnerSegment, winnerLabel, winnerPrize });

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

    console.log("🎯 Normalized Game Result:", normalizedResult);

    setGameResult(normalizedResult);
    setIsResultModalOpen(true);

    // Refresh user data and order status
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/spin-order", orderId] });

    if (normalizedPrize.type !== "none") {
      toast({
        title: "🎉 Congratulations!",
        description: `You won ${normalizedPrize.type === "cash" ? "£" : ""}${normalizedPrize.value}${normalizedPrize.type === "points" ? " points" : ""}!`,
      });
    }
  };


  const handleCloseResultModal = () => {
    setIsResultModalOpen(false);

    if (remainingSpins <= 0) {
      toast({
        title: "All Spins Used",
        description: "You’ve used all your spins from this purchase.",
      });
      setTimeout(() => {
        // Clear order-specific localStorage
        if (orderId) {
          localStorage.removeItem(`spinWheelHistory_${orderId}`);
        }
        window.location.href = "/";
      }, 2000);
    }
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
        {competition?.endDate && (
          <div className="py-6">
            <CountdownTimer endDate={competition.endDate} />
          </div>
        )}
      </div>
      <main className="container mx-auto   text-center">
        <SpinWheel 
  onSpinComplete={handleSpinComplete}
  ticketCount={remainingSpins}  
  orderId={orderId}
  competitionId={competitionId}
  isSpinning={isSpinning}
  setIsSpinning={setIsSpinning}      
/>

      </main>

      {/* Modern Prize Modal with Confetti */}
      <PrizeModal
        isOpen={isResultModalOpen}
        onClose={handleCloseResultModal}
        isWinner={gameResult?.prize?.type !== "none"}
        prize={gameResult?.prize}
        gameType="spin"
      />

      <Footer />
    </div>
  );
}