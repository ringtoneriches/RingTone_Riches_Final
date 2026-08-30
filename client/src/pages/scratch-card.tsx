import { useQuery, useQueryClient } from "@tanstack/react-query";
import CompetitionCard from "@/components/competition-card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import FeaturedCompetitions from "./featuredCompetitions";
import { Competition } from "@shared/schema";
import GameResultOverlay from "@/components/games/GameResultOverlay";
import {
  DEFAULT_LISTING_FILTERS,
  ListingEmpty,
  ListingFilters,
  ListingHero,
  ListingShell,
} from "@/components/home/ListingChrome";

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

  return (
    <ListingShell>
      <section className="relative px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <ListingHero
            kicker="Scratch Nations"
            title="SCRATCH NATIONS"
            subtitle="Scratch the card. Match 3 identical flags to win cash or points."
          />
          {competitions.length > 0 ? (
            <FeaturedCompetitions competitions={competitions} />
          ) : (
            <p className="py-12 text-center text-white/45">Loading featured competitions...</p>
          )}
        </div>
      </section>

      <section className="relative px-4 pb-20">
        <div className="mx-auto max-w-7xl">
          <ListingFilters
            filters={DEFAULT_LISTING_FILTERS}
            active={activeFilter}
            onChange={handleFilterChange}
          />

          {filteredCompetitions.filter((comp) => comp.type === "scratch").length > 0 ? (
            <div
              className="rr-comp-grid grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4"
              id="competitionsGrid"
            >
              {filteredCompetitions
                .filter((comp) => comp.type === "scratch")
                .map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
            </div>
          ) : (
            <ListingEmpty
              title="NO SCRATCH NATIONS"
              message="No Scratch Nations competitions found."
            />
          )}
        </div>
      </section>

      <GameResultOverlay
        open={isResultModalOpen}
        kind={gameResult?.prize?.amount > 0 ? "win" : "lose"}
        onClose={() => setIsResultModalOpen(false)}
        title={gameResult?.prize?.amount > 0 ? "YOU WON" : "UNLUCKY"}
        subtitle={gameResult?.prize?.amount > 0 ? undefined : "Better luck next time"}
        prizeText={gameResult?.prize?.amount > 0 ? String(gameResult.prize.amount) : undefined}
        primaryLabel="Close"
        onPrimary={() => setIsResultModalOpen(false)}
      />
    </ListingShell>
  );
}
