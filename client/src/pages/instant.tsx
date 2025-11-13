import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { useAuth } from "@/hooks/useAuth";
import { Competition } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import FeaturedCompetitions from "./featuredCompetitions";
import CompetitionCard from "@/components/competition-card";

const Instant = () => {
  const { isAuthenticated } = useAuth();
  const { data: competitions = [] , isLoading} = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [activeFilter, setActiveFilter] = useState("instant");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setFilteredCompetitions([]);
    } else {
      setFilteredCompetitions(
        competitions.filter((c: Competition) => c.type?.toLowerCase() === "instant")
      );
    }
  }, [competitions, isAuthenticated]);

  const handleFilterChange = (filterType: string) => {
    setActiveFilter(filterType);

    if (filterType === "all") {
      setLocation("/");
    } else if (filterType === "spin") {
      setLocation("/spin-wheel");
    } else if (filterType === "scratch") {
      setLocation("/scratch-card");
    } else if (filterType === "instant") {
      setLocation("/instant");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {/* Welcome Section */}
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

     {/* Competitions or Message */}
      <section className="flex-grow container mx-auto px-4 py-16">
        {isLoading  ? (
          <p className="text-center text-muted-foreground">Loading competitions...</p>
        ) : filteredCompetitions.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCompetitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                authenticated={true}
              />
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center py-32">
            <p className="text-center text-xl text-muted-foreground">
              No regular competitions available at the moment. Check back soon!
            </p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Instant;
