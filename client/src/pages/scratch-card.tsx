import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ScratchCardTest from "@/components/games/scratch-card-test";
import CompetitionCard from "@/components/competition-card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import FeaturedCompetitions from "./featuredCompetitions";
import { Competition } from "@shared/schema";

export default function ScratchCardPage() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: competitions = [] } = useQuery({
    queryKey: ["/api/competitions"],
  });

  const { data: userTickets = [] } = useQuery({
    queryKey: ["/api/user/tickets"],
    enabled: !!isAuthenticated,
  });

  const scratchCompetition = competitions.find((c: any) => c.type === "scratch");
  const scratchTickets = userTickets.filter(
    (t: any) => t.competitionId === scratchCompetition?.id
  );
  const scratchTicketCount = scratchTickets.length;

  const [gameResult, setGameResult] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [activeFilter, setActiveFilter] = useState("scratch");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setFilteredCompetitions(competitions.filter((c) => c.type !== "instant"));
    } else {
      setFilteredCompetitions(competitions);
    }
  }, [competitions, isAuthenticated]);

  const handleFilterChange = (filterType: string) => {
    setActiveFilter(filterType);

    if (filterType === "all") {
      setFilteredCompetitions(competitions);
      setLocation("/");
    } else if (filterType === "spin") {
      setLocation("/spin-wheel");
    } else if (filterType === "scratch") {
      setLocation("/scratch-card");
    } else if (filterType === "instant") {
      setLocation("/instant");
    } else {
      setFilteredCompetitions(competitions.filter((c) => c.type === filterType));
    }
  };

  // const playScratchCardMutation = useMutation({
  //   mutationFn: async (data: { winnerPrize: any }) => {
  //     const response = await apiRequest("POST", "/api/play-scratch-card", data);
  //     return response.json();
  //   },
  //   onSuccess: (result) => {
  //     setGameResult(result);
  //     setIsResultModalOpen(true);
  //     queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  //   },
  //   onError: (error: any) => {
  //     toast({
  //       title: "Error",
  //       description: error.message || "Failed to play scratch card",
  //       variant: "destructive",
  //     });
  //   },
  // });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Featured Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-6">
            <div className="relative">
              {competitions.length > 0 ? (
                <FeaturedCompetitions competitions={competitions} />
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Loading featured competitions...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Buttons */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-4">
            {["all", "spin", "scratch", "instant"].map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
                className={`competition-filter px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeFilter === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted gradient hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                {type === "all"
                  ? "ALL"
                  : type === "spin"
                  ? "SPIN WHEELS"
                  : type === "scratch"
                  ? "SCRATCH CARDS"
                  : "COMPETITIONS"}
              </button>
            ))}
          </div>
        </div>
      </section>

      

      {/* Scratch Competitions Grid */}
      <section id="competitions" className="py-16 min-h-[60vh] flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          {filteredCompetitions.filter((comp) => comp.type === "scratch").length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="competitionsGrid">
              {filteredCompetitions
                .filter((comp) => comp.type === "scratch")
                .map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No scratch card competitions found.</p>
          )}
        </div>
      </section>

      {/* Result Modal */}
      <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
        <DialogContent className="max-w-md flex flex-col justify-center items-center text-center">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">
              {gameResult?.prize?.amount > 0
                ? "🎉 You Won!"
                : "😔 Better Luck Next Time"}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setIsResultModalOpen(false)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
