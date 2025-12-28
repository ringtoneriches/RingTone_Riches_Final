import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import FeaturedCompetitions from "./featuredCompetitions";
import { Competition } from "@shared/schema";
import { Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

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

      <section className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-4">
            {["all", "spin", "scratch", "pop", "instant"].map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
                className={`competition-filter px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeFilter === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted gradient hover:bg-primary hover:text-primary-foreground"
                }`}
                data-testid={`filter-${type}`}
              >
                {type === "all"
                  ? "All Games"
                  : type === "spin"
                  ? "Spin Wheel"
                  : type === "scratch"
                  ? "Scratch Card"
                  : type === "pop"
                  ? "Ringtone Pop"
                  : "Instant Win"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Ringtone Pop
            </h2>
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pop the balloons and match 3 to win! Each balloon reveals a prize - 
            match all three for instant cash or ringtone points!
          </p>
        </div>
      </section>

      <section id="competitions" className="py-16 min-h-[60vh] flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          {popCompetitions.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="competitionsGrid">
              {popCompetitions.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground mb-2">No Ringtone Pop games available yet.</p>
              <p className="text-muted-foreground">Check back soon for exciting new games!</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}