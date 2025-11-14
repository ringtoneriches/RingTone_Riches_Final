import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, act } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import StatsBanner from "@/components/stats-banner";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import { Sparkles, Trophy, Zap, Gift } from "lucide-react";

export default function Home() {
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user: User | null };

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) {
      setFilteredCompetitions(
        competitions.filter((c) => c.type !== "instant")
      );
    } else {
      setFilteredCompetitions(competitions);
    }
  }, [competitions, isAuthenticated]);

  const handleFilterChange = (filterType: string) => {
    setActiveFilter(filterType);

    if (filterType === "all") {
      if (!isAuthenticated) {
        setFilteredCompetitions(competitions.filter((c) => c.type !== "instant"));
      } else {
        setFilteredCompetitions(competitions);
      }
    } else {
      const filtered = competitions.filter((c) => c.type === filterType);
      setFilteredCompetitions(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-0 py-0">
          {competitions.length > 0 ? (
            <FeaturedCompetitions competitions={competitions} />
          ) : (
            <div className="text-center text-slate-400 py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading amazing prizes...</p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Banner */}
      <StatsBanner />

      {/* Filter Tabs */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-primary/30 sticky top-0 z-40 backdrop-blur-sm shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {[
              { id: "all", label: "All", icon: Sparkles, color: "from-primary to-yellow-400" },
              { id: "spin", label: "Spin", icon: Zap, color: "from-purple-500 to-pink-500" },
              { id: "scratch", label: "Scratch Cards", icon: Trophy, color: "from-blue-500 to-cyan-500" },
              { id: "instant", label: "Competitions", icon: Gift, color: "from-green-500 to-emerald-500" }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`relative px-4 md:px-8 py-3 md:py-4 rounded-xl font-black text-sm md:text-base tracking-wide transition-all overflow-hidden group ${
                  activeFilter === filter.id
                    ? "shadow-2xl shadow-primary/50 scale-105"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:shadow-lg hover:shadow-primary/20"
                }`}
                data-testid={`button-filter-${filter.id}`}
              >
                {activeFilter === filter.id && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${filter.color} animate-pulse`}></div>
                )}
                {activeFilter === filter.id && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${filter.color} blur-xl opacity-75`}></div>
                )}
                <span className={`relative z-10 flex items-center gap-1.5 md:gap-2 ${
                  activeFilter === filter.id ? "text-slate-900 drop-shadow-lg" : ""
                }`}>
                  <filter.icon className="w-4 h-4 md:w-5 md:h-5" />
                  {filter.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions Grid - 2 COLUMNS ON MOBILE! */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground font-semibold">Loading amazing prizes...</p>
            </div>
          ) : filteredCompetitions.length > 0 ? (
            <>
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-5xl font-black mb-2">
                  <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
                    {activeFilter === "all" 
                      ? "🎯 All Live Competitions" 
                      : activeFilter === "spin"
                      ? "🎡 Spin to Win"
                      : activeFilter === "scratch"
                      ? "🎫 Scratch & Win"
                      : "🎟️ Competitions"}
                  </span>
                </h2>
                <p className="text-muted-foreground text-sm md:text-lg font-semibold">
                  {
    activeFilter === "all"
      ? `${filteredCompetitions.length} amazing prizes waiting for you!`
      : 
      `Huge cash prizes waiting for you!`
      
  }
                 
                </p>
              </div>

              {/* FIXED GRID: 2 columns mobile, 3 tablet, 4 desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredCompetitions.map((competition) => (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                    authenticated={true}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-xl">No competitions found.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
