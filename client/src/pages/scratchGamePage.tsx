import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ScratchCardTest from "@/components/games/scratch-card-test";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { PrizeModal } from "@/components/games/prize-modal";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function ScratchGamePage() {
  const { competitionId, orderId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [gameResult, setGameResult] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [remainingScratches, setRemainingScratches] = useState<number>(0);

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
      console.log("✅ Scratch order data:", data);
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

  // 🎯 Handle scratch completion - scratch component already calls API server-side
  const handleScratchComplete = (prize: any) => {
    console.log("🎯 Scratch complete:", prize);

    // The scratch card component already called the server and got the result
    // We just need to display it and refresh data
    setGameResult({ prize });
    setIsResultModalOpen(true);

    // Refresh user data and order status
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/scratch-order", orderId] });

    if (prize && prize.type !== "none") {
      toast({
        title: "🎉 Congratulations!",
        description: `You won ${prize.type === 'cash' ? '£' : ''}${prize.value}${prize.type === 'points' ? ' points' : ''}!`,
      });
    }
  };

  const [, navigate] = useLocation();

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
        navigate("/"); // Navigate to home
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Loading your scratch cards...</p>
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
          <h1 className="text-4xl font-bold mb-8">Scratch Card Not Found</h1>
          <p className="text-lg mb-4">The scratch card purchase could not be found or has expired.</p>
          <button 
            onClick={() => window.location.href = "/competitions"}
            className="bg-[#FACC15] hover:bg-[#F59E0B] text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Browse Competitions
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="container mx-auto px-4 py-8 text-center">
        {/* <h1 className="text-4xl font-bold mb-4">
          🎟️ {competition?.title || "Scratch & Win!"}
        </h1> */}
        
        {/* Remaining Scratches Counter */}
        {/* <div className="mb-8 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg inline-block">
          <div className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
            <span className="text-2xl">{remainingScratches}</span> Scratch{remainingScratches !== 1 ? "es" : ""} Remaining
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
            Order: #{orderId?.slice(-8)}
          </div>
        </div> */}

        {/* Scratch Card Component */}
        <ScratchCardTest
          onScratchComplete={handleScratchComplete}
          scratchTicketCount={remainingScratches}
          orderId={orderId}
          mode="loose" // or "tight" based on your preference
        />

      
      </section>
    
      {/* Modern Prize Modal with Confetti */}
      <PrizeModal
        isOpen={isResultModalOpen}
        onClose={handleCloseResultModal}
        isWinner={gameResult?.prize?.type !== "none" && gameResult?.prize?.value !== "Lose"}
        prize={gameResult?.prize}
        gameType="scratch"
      />

      <Footer />
    </div>
  );
}