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
  POP_LISTING_FILTERS,
} from "@/components/home/ListingChrome";

export default function RingtonePopPage() {
  const { isAuthenticated } = useAuth();

  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [activeFilter, setActiveFilter] = useState("pop");
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
    } else if (filterType === "instant") {
      setLocation("/instant");
    } else {
      setFilteredCompetitions(competitions.filter((c) => c.type === filterType));
    }
  };

  const popCompetitions = filteredCompetitions.filter((comp) => comp.type === "pop");

  return (
    <ListingShell>
      <section className="relative px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <ListingHero
            kicker="Ringtone pop"
            title="RINGTONE POP"
            subtitle="Pop the balloons and match 3 to win cash or ringtone points."
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
            filters={POP_LISTING_FILTERS}
            active={activeFilter}
            onChange={handleFilterChange}
          />

          {popCompetitions.length > 0 ? (
            <div
              className="rr-comp-grid grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4"
              id="competitionsGrid"
            >
              {popCompetitions.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          ) : (
            <ListingEmpty
              title="NO RINGTONE POP"
              message="No Ringtone Pop games available yet. Check back soon!"
            />
          )}
        </div>
      </section>
    </ListingShell>
  );
}
