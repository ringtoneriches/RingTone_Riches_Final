import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Competition, User, Ticket } from "@shared/schema";
import { GameEmpty, GameShell, GameHero } from "@/components/games/GameChrome";
import { Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import SpinWheel from "@/components/games/spinwheeltest";
import ScratchCardTest from "@/components/games/scratch-card-test";
import GameResultOverlay from "@/components/games/GameResultOverlay";

export default function PlayGamePage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user: User | null };
  const queryClient = useQueryClient();
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const { data: competition } = useQuery<Competition>({
    queryKey: ["/api/competitions", id],
    enabled: !!id,
  });

  const { data: userTickets = [] } = useQuery<Ticket[]>({
    queryKey: ["/api/user/tickets"],
    enabled: isAuthenticated,
  });

  // Filter tickets for this competition and get count
  const availableTickets = userTickets.filter(ticket => ticket.competitionId === id);
  const ticketCount = availableTickets.length;

  // Auto-select first ticket if available and none selected
  useEffect(() => {
    if (availableTickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(availableTickets[0].id);
    }
  }, [availableTickets, selectedTicketId]);

  // Spin wheel mutation
  const playSpinWheelMutation = useMutation({
    mutationFn: async (data: { ticketId: string; winnerPrize: any }) => {
      const response = await apiRequest("/api/play-spin-wheel", "POST", data);
      return response.json();
    },
    onSuccess: (result) => {
      setGameResult(result);
       setIsResultModalOpen(true); 
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please login again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to play game",
        variant: "destructive",
      });
    },
  });

  // Scratch card mutation
const playScratchCardMutation = useMutation({
  mutationFn: async (data: { winnerPrize: any }) => {
    const response = await apiRequest("/api/play-scratch-card", "POST", data);
    return response.json();
  },
  onSuccess: (result) => {
    setGameResult(result);
     setIsResultModalOpen(true); 
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
  },
  onError: (error) => {
    if (isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "Please login again",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "//login";
      }, 1000);
      return;
    }
    toast({
      title: "Error",
      description: error.message || "Failed to play scratch card",
      variant: "destructive",
    });
  },
});


  const handleSpinComplete = (winnerSegment: number, winnerLabel: string, winnerPrize: any) => {
    const ticketToUse = availableTickets[0];

    if (!ticketToUse) {
      toast({
        title: "No Tickets Left",
        description: "You've used all your spins! Purchase more tickets to play again.",
        variant: "destructive",
      });
      return;
    }

    playSpinWheelMutation.mutate({
      ticketId: ticketToUse.id,
      winnerPrize: winnerPrize
    });
  };

  const handleScratchComplete = (prize: { type: string; value: string }) => {
    const ticketToUse = availableTickets[0];

    if (!ticketToUse) {
      toast({
        title: "No Tickets Left",
        description: "You've used all your scratch cards! Purchase more tickets to play again.",
        variant: "destructive",
      });
      return;
    }

    // Format the prize to match your backend expectation
    const winnerPrize = {
      type: prize.type,
      value: prize.value
    };

   playScratchCardMutation.mutate({ winnerPrize });
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    // Remove the used ticket from selection
    const remainingTickets = availableTickets.filter(ticket => ticket.id !== selectedTicketId);
    if (remainingTickets.length > 0) {
      setSelectedTicketId(remainingTickets[0].id);
    } else {
      setSelectedTicketId("");
    }
  };

  if (!isAuthenticated) {
    return (
      <GameEmpty
        title="LOGIN REQUIRED"
        message="Please login to play games."
        actionLabel="Login"
        href="/login"
      />
    );
  }

  if (!competition) {
    return (
      <GameEmpty
        title="COMPETITION GONE"
        message="This competition could not be found."
        actionLabel="Back to competitions"
        href="/"
      />
    );
  }

  if (availableTickets.length === 0) {
    return (
      <GameEmpty
        title="NO TICKETS"
        message="You need to purchase tickets first to play this game."
        actionLabel="Purchase tickets"
        href={`/competition/${id}`}
      />
    );
  }

  const prizes = (competition.prizeData as any) || [];

  return (
    <GameShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <GameHero
          kicker={competition.type === "spin" ? "Spin · play" : "Scratch · play"}
          title={competition.type === "spin" ? "SPIN THE WHEEL" : "SCRATCH CARD"}
          subtitle={competition.title}
          remaining={ticketCount}
          remainingLabel={competition.type === "spin" ? "spins left" : "cards left"}
          Icon={Target}
        />

        <div className="space-y-8">
          {competition.type === "spin" ? (
            <div className="text-center">
              <SpinWheel
                onSpinComplete={handleSpinComplete}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
              />
            </div>
          ) : (
            <div className="text-center">
              <ScratchCardTest
                competition={competition}
                onScratchComplete={handleScratchComplete}
              />
            </div>
          )}
        </div>
      </div>

      <GameResultOverlay
        open={isResultModalOpen}
        kind={gameResult?.success ? "win" : "lose"}
        onClose={() => setIsResultModalOpen(false)}
        kicker={gameResult?.success ? "Congratulations" : "No win"}
        title={gameResult?.success ? "YOU WON" : "UNLUCKY"}
        subtitle={
          competition.type === "spin" && gameResult?.prize?.brand
            ? `You landed on ${gameResult.prize.brand}`
            : undefined
        }
        prizeText={
          gameResult?.prize
            ? competition.type === "spin"
              ? typeof gameResult.prize.amount === "number"
                ? `£${gameResult.prize.amount}`
                : gameResult.prize.amount || String(gameResult.prize)
              : gameResult.prize.type === "cash"
                ? `£${gameResult.prize.value}`
                : `${gameResult.prize.value} Ringtone Points`
            : undefined
        }
        prizeSub={
          (competition.type === "spin" &&
            typeof gameResult?.prize?.amount === "number" &&
            gameResult.prize.amount > 0) ||
          (competition.type === "scratch" &&
            gameResult?.prize?.type === "cash" &&
            parseFloat(String(gameResult.prize.value).replace(/[^0-9.]/g, "")) > 0)
            ? "Prize has been added to your wallet"
            : competition.type === "scratch" && gameResult?.prize?.type === "points"
              ? "Ringtone points have been added to your account"
              : undefined
        }
        body={
          gameResult?.success || gameResult?.prize
            ? undefined
            : "No luck this time. The next play could be yours."
        }
        primaryLabel={
          ticketCount > 0
            ? `Play again (${ticketCount - 1} ${competition.type === "spin" ? "spins" : "scratch"} left)`
            : "Purchase more tickets"
        }
        onPrimary={() => {
          if (ticketCount > 0) {
            handlePlayAgain();
            setIsResultModalOpen(false);
          } else {
            setLocation(`/competition/${id}`);
          }
        }}
        secondaryLabel="Back to competitions"
        onSecondary={() => {
          setIsResultModalOpen(false);
          setLocation("/");
        }}
      />
    </GameShell>
  );
}


