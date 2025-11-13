import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import CompetitionCard from "@/components/competition-card";

export default function SpinWheelPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [activeFilter, setActiveFilter] = useState("spin");

  // 🔹 Filter competitions by type and auth state
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container mx-auto px-4 py-12 text-center">
          {competitions.length > 0 ? (
            <FeaturedCompetitions competitions={competitions} />
          ) : (
            <div className="text-muted-foreground py-12">
              Loading featured competitions...
            </div>
          )}
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
                    : "bg-muted hover:bg-primary hover:text-primary-foreground"
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

      {/* 🔹 Competitions Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">
              Loading competitions...
            </p>
          ) : filteredCompetitions.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCompetitions.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  authenticated={isAuthenticated}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No spin wheel competitions found.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
