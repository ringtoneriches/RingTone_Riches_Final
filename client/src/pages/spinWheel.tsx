import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import CompetitionCard from "@/components/competition-card";
import {
  DEFAULT_LISTING_FILTERS,
  ListingEmpty,
  ListingFilters,
  ListingHero,
  ListingShell,
} from "@/components/home/ListingChrome";

export default function SpinWheelPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [activeFilter, setActiveFilter] = useState("spin");

  useEffect(() => {
    if (!isAuthenticated) {
      setFilteredCompetitions(
        competitions.filter((c) => c.type === "spin" && c.type !== "instant")
      );
    } else {
      setFilteredCompetitions(competitions.filter((c) => c.type === "spin"));
    }
  }, [competitions, isAuthenticated]);

  const handleFilterChange = (filterType: string) => {
    setActiveFilter(filterType);
    if (filterType === "all") setLocation("/");
    else if (filterType === "spin") setLocation("/spin-wheel");
    else if (filterType === "scratch") setLocation("/scratch-card");
    else if (filterType === "instant") setLocation("/instant");
  };

  return (
    <ListingShell>
      <section className="relative px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <ListingHero
            kicker="Spin to win"
            title="SPIN WHEELS"
            subtitle="Every spin is a shot at the prize."
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

          {isLoading ? (
            <p className="py-16 text-center text-white/45">Loading competitions...</p>
          ) : filteredCompetitions.length > 0 ? (
            <div className="rr-comp-grid grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCompetitions.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  authenticated={isAuthenticated}
                />
              ))}
            </div>
          ) : (
            <ListingEmpty
              title="NO SPIN WHEELS"
              message="No spin wheel competitions found."
            />
          )}
        </div>
      </section>
    </ListingShell>
  );
}
