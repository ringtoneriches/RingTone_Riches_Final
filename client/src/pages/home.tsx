import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import { Competition } from "@shared/schema";
import {
  Sparkles,
  Trophy,
  Zap,
  Gift,
  RotateCw,
  Circle,
  Target,
} from "lucide-react";
import FeaturedCompetition from "@/components/home/FeaturedCompetition";
import HallOfFame from "@/components/home/HallOfFame";
import HowItWorks from "@/components/home/HowItWorks";
import CommunitySection from "@/components/home/CommunitySection";
import VipClub from "@/components/home/VipClub";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import { pickFeaturedCompetitions } from "@/lib/competition-display";
import { useWebSocket } from "@/hooks/useWebSocket";

const COMPETITION_FILTERS = [
  { id: "all", label: "All Games", icon: Trophy },
  { id: "spin", label: "Spin to Win", icon: RotateCw },
  { id: "scratch", label: "Scratch Cards", icon: Sparkles },
  { id: "instant", label: "Competitions", icon: Gift },
  { id: "plinko", label: "Ringtone Plinko", icon: Circle },
  { id: "voltz", label: "Ringtone Voltz", icon: Zap },
  { id: "pop", label: "Ringtone Pop", icon: Target },
] as const;

export default function Home() {
  useWebSocket();

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const [activeFilter, setActiveFilter] = useState("all");

  const featuredList = useMemo(() => pickFeaturedCompetitions(competitions, 4), [competitions]);

  const filteredCompetitions = useMemo(() => {
    if (activeFilter === "all") return competitions;
    return competitions.filter((c) => c.type === activeFilter);
  }, [competitions, activeFilter]);

  const liveCount = competitions.length;

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: competitions.length };
    for (const filter of COMPETITION_FILTERS) {
      if (filter.id === "all") continue;
      counts[filter.id] = competitions.filter((c) => c.type === filter.id).length;
    }
    return counts;
  }, [competitions]);

  const handleFilterChange = (filterType: string) => {
    setActiveFilter(filterType);
  };

  useEffect(() => {
    if (window.location.hash === "#how-it-works") {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      document.documentElement.classList.toggle("rr-motion-paused", document.hidden);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      document.documentElement.classList.remove("rr-motion-paused");
    };
  }, []);

  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden" style={{ backgroundColor: "#050505" }}>
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <div className="relative z-10">
      <Header />

      {featuredList.length > 0 ? (
        <FeaturedCompetition competitions={featuredList} />
      ) : isLoading ? (
        <div className="relative py-16 text-center">
          <p className="relative z-10 text-white/50">Loading featured competition…</p>
        </div>
      ) : null}

      <section className="relative py-12 sm:py-20" id="competitions">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF263D] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF263D]" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF263D]">
                  {liveCount} Live
                </span>
              </div>
              <h2 className="font-prize text-[2rem] sm:text-5xl text-white">COMPETITIONS</h2>
              <p className="mt-2 text-sm text-white/45">Pick a game. Lock onto a prize.</p>
            </div>
          </div>

          <div
            className="rr-filter-bar mb-8"
            role="tablist"
            aria-label="Filter competitions"
          >
            {COMPETITION_FILTERS.map((filter) => {
              const active = activeFilter === filter.id;
              const count = filterCounts[filter.id] ?? 0;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleFilterChange(filter.id)}
                  className={`rr-filter-chip ${active ? "is-active" : ""}`}
                  data-testid={`button-filter-${filter.id}`}
                >
                  <span className="rr-filter-icon" aria-hidden>
                    <filter.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <span>{filter.label}</span>
                  <span className="rr-filter-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div id="competitions-grid">
            {isLoading ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#C8102E]/20 border-t-[#FF263D]" />
                <p className="text-sm font-medium text-white/40">Loading prizes...</p>
              </div>
            ) : filteredCompetitions.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCompetitions.map((competition) => (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                    authenticated={true}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Gift className="mx-auto mb-4 h-12 w-12 text-white/10" />
                <p className="text-lg text-white/30">No competitions found.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <HallOfFame />
      <HowItWorks />
      <CommunitySection />
      <VipClub />

      <Footer />
      </div>
    </div>
  );
}
