import { useQuery } from "@tanstack/react-query";
import CompetitionCard from "@/components/competition-card";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import FeaturedCompetitions from "./featuredCompetitions";
import { Competition } from "@shared/schema";
import {
  ListingEmpty,
  ListingFilters,
  ListingHero,
  ListingShell,
  VOLTZ_LISTING_FILTERS,
} from "@/components/home/ListingChrome";

export default function RingtoneVoltzPage() {
  const { isAuthenticated } = useAuth();

  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [activeFilter, setActiveFilter] = useState("voltz");
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
    } else if (filterType === "pop") {
      setLocation("/ringtone-pop");
    } else if (filterType === "voltz") {
      setLocation("/ringtone-voltz");
    } else if (filterType === "instant") {
      setLocation("/instant");
    } else {
      setFilteredCompetitions(competitions.filter((c) => c.type === filterType));
    }
  };

  const voltzCompetitions = filteredCompetitions.filter((comp) => comp.type === "voltz");

  return (
    <ListingShell>
      <section className="relative px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <ListingHero
            kicker="Ringtone voltz"
            title="RINGTONE VOLTZ"
            subtitle="Flip a switch. Surge the power. Instant cash or ringtone points."
          />
          {competitions.length > 0 ? (
            <FeaturedCompetitions competitions={competitions} />
          ) : (
            <p className="py-12 text-center text-white/45">Loading featured competitions...</p>
          )}
        </div>
      </section>

      <section className="relative px-4 pb-20" id="competitions">
        <div className="mx-auto max-w-7xl">
          <ListingFilters
            filters={VOLTZ_LISTING_FILTERS}
            active={activeFilter}
            onChange={handleFilterChange}
          />

          {voltzCompetitions.length > 0 ? (
            <div
              className="rr-comp-grid grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4"
              id="competitionsGrid"
            >
              {voltzCompetitions.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          ) : (
            <ListingEmpty
              title="NO RINGTONE VOLTZ"
              message="No Ringtone Voltz games available yet. Check back soon!"
            />
          )}
        </div>
      </section>
    </ListingShell>
  );
}
