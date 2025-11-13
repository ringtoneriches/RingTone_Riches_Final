import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Ticket, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface WinnerDrawDialogProps {
  competitionId: string;
  competitionTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Ticket {
  id: string;
  userId: string;
  competitionId: string;
  orderId: string;
  used: boolean;
  createdAt: string;
}

interface DrawResult {
  winner: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    competitionId: string;
    competitionTitle: string;
    prizeDetails: string;
  };
}

export default function WinnerDrawDialog({
  competitionId,
  competitionTitle,
  open,
  onOpenChange,
}: WinnerDrawDialogProps) {
  const { toast } = useToast();
  const [drawnWinner, setDrawnWinner] = useState<DrawResult["winner"] | null>(null);

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: [`/api/admin/competitions/${competitionId}/tickets`],
    queryFn: async () => {
      const res = await fetch(`/api/admin/competitions/${competitionId}/tickets`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch tickets');
      return res.json();
    },
    enabled: open,
  });

  const drawWinnerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        `/api/admin/competitions/${competitionId}/draw-winner`,
        "POST"
      );
      return res.json();
    },
    onSuccess: (data: DrawResult) => {
      setDrawnWinner(data.winner);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/winners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({
        title: "Winner Drawn!",
        description: `${data.winner.userName} has been selected as the winner.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Draw Failed",
        description: error.message || "Failed to draw winner. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uniqueUsers = tickets
    ? new Set(tickets.map((t) => t.userId)).size
    : 0;

  const totalEntries = tickets?.length || 0;

  const handleDraw = () => {
    if (totalEntries === 0) {
      toast({
        title: "No Entries",
        description: "This competition has no entries yet.",
        variant: "destructive",
      });
      return;
    }

    drawWinnerMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Draw Winner</DialogTitle>
          <DialogDescription>{competitionTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : drawnWinner ? (
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-lg p-8 text-center space-y-4">
              <Trophy className="w-16 h-16 text-primary mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  🎉 Winner Selected! 🎉
                </h3>
                <div className="space-y-2 text-lg">
                  <p className="font-bold text-primary">
                    {drawnWinner.userName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {drawnWinner.userEmail}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setDrawnWinner(null);
                  onOpenChange(false);
                }}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Unique Participants
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {uniqueUsers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Entries
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {totalEntries}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>How it works:</strong> Each entry (ticket) has an
                  equal chance of winning. If a user bought multiple entries,
                  they have multiple chances to win.
                </p>
              </div>

              <Button
                onClick={handleDraw}
                disabled={drawWinnerMutation.isPending || totalEntries === 0}
                className="w-full"
                size="lg"
                data-testid="button-draw-winner"
              >
                {drawWinnerMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Drawing Winner...
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5 mr-2" />
                    Draw Winner
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
