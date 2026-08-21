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
import ScratchCardTest from "@/components/games/scratch-card-test"; // Import your scratch card component
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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

      <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
        <DialogContent className="flex max-w-md flex-col items-center justify-center border-white/10 bg-[#0A0A0D] text-center text-white md:max-w-xl">
          <DialogHeader className="text-center">
            <DialogTitle className="w-full text-center font-prize text-3xl">
              {gameResult?.success ? "CONGRATULATIONS" : "TRY AGAIN"}
            </DialogTitle>
          </DialogHeader>

          {gameResult?.prize && (
            <div className="mt-4 space-y-4">
              {competition.type === "spin" && gameResult.prize.brand && (
                <p className="text-lg text-white/70">
                  You landed on: <strong className="text-white">{gameResult.prize.brand}</strong>
                </p>
              )}

              <p className="font-prize text-3xl text-[#F1D47A]">
                {competition.type === "spin" ? (
                  typeof gameResult.prize.amount === "number"
                    ? `£${gameResult.prize.amount}`
                    : gameResult.prize.amount || gameResult.prize
                ) : gameResult.prize.type === "cash" ? (
                  `£${gameResult.prize.value}`
                ) : (
                  `${gameResult.prize.value} Ringtone Points`
                )}
              </p>

              {(competition.type === "spin" &&
                typeof gameResult.prize.amount === "number" &&
                gameResult.prize.amount > 0) ||
              (competition.type === "scratch" &&
                gameResult.prize.type === "cash" &&
                parseFloat(gameResult.prize.value.replace(/[^0-9.]/g, "")) > 0) ? (
                <p className="text-sm text-emerald-400">Prize has been added to your wallet!</p>
              ) : competition.type === "scratch" && gameResult.prize.type === "points" ? (
                <p className="text-sm text-emerald-400">
                  Ringtone points have been added to your account!
                </p>
              ) : null}
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-center gap-3">
            {ticketCount > 0 ? (
              <button
                onClick={() => {
                  handlePlayAgain();
                  setIsResultModalOpen(false);
                }}
                className="rr-cta px-6 py-3 text-sm"
              >
                Play again ({ticketCount - 1}{" "}
                {competition.type === "spin" ? "spins" : "scratch"} left)
              </button>
            ) : (
              <button
                onClick={() => setLocation(`/competition/${id}`)}
                className="rr-cta px-6 py-3 text-sm"
              >
                Purchase more tickets
              </button>
            )}
            <button
              onClick={() => {
                setIsResultModalOpen(false);
                setLocation("/");
              }}
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-black uppercase tracking-wide text-white/70 hover:bg-white/10"
            >
              Back to competitions
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GameShell>
  );
}


