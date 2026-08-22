import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Trophy,
  Calendar,
  Clock,
  Coins,
  Share2,
  TrendingUp,
  SortAsc,
} from "lucide-react";

interface Winner {
  id: string;
  userId: string;
  competitionId: string | null;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string | null;
  isShowcase: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  competition: {
    id: string;
    title: string;
  } | null;
}

const extractCashValue = (prizeValue: string): number => {
  const match = prizeValue.match(/£\s*([\d,.]+)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ""));
  }
  return 0;
};

const extractPoints = (prizeValue: string): number => {
  if (prizeValue.includes("£")) {
    return 0;
  }
  const match = prizeValue.match(/([\d,.]+)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ""));
  }
  return 0;
};

const getPointsDisplay = (prizeValue: string): string => {
  if (prizeValue.includes("£")) {
    return "";
  }
  const parts = prizeValue.match(/([\d,.]+)\s*(.+)/);
  if (parts && parts[2]) {
    return parts[2].trim();
  }
  return "pts";
};

type SortOption = "newest" | "oldest" | "highest-value" | "highest-points";

const SORT_OPTIONS: { id: SortOption; label: string; Icon: typeof Clock }[] = [
  { id: "newest", label: "Newest First", Icon: Clock },
  { id: "oldest", label: "Oldest First", Icon: SortAsc },
  { id: "highest-value", label: "Highest Cash", Icon: TrendingUp },
  { id: "highest-points", label: "Highest Points", Icon: Coins },
];

const shareToFacebook = (winner: Winner) => {
  const url = window.location.href;
  const fullName = winner.user ? `${winner.user.firstName} ${winner.user.lastName}` : "A Winner";
  const prize = winner.prizeDescription || "an amazing prize";
  const shareText = `🏆 ${fullName} just won ${prize}! Check out our past winners at ${url}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`;

  window.open(facebookShareUrl, "facebook-share-dialog", "width=626,height=436");
};

export default function PastWinners() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const itemsPerPage = 9;

  const { data: winnersData = [], isLoading, error } = useQuery<Winner[]>({
    queryKey: ["/api/winners", "showcase"],
    queryFn: async () => {
      const res = await fetch("/api/winners?showcase=true");
      if (!res.ok) throw new Error("Failed to fetch winners");
      const json = await res.json();

      return json.map((item: any) => ({
        id: item.id,
        prizeDescription: item.prizeDescription,
        prizeValue: item.prizeValue || "0",
        imageUrl: item.imageUrl || "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt || item.createdAt,
        isShowcase: item.isShowcase ?? true,
        userId: item.userId,
        competitionId: item.competitionId,
        user: item.user
          ? {
              id: item.user.id,
              firstName: item.user.firstName || "",
              lastName: item.user.lastName || "",
              email: item.user.email || "",
            }
          : null,
        competition: item.competition
          ? {
              id: item.competition.id,
              title: item.competition.title || "Prize Win",
            }
          : null,
      }));
    },
  });

  const sortedWinners = useMemo(() => {
    const showcaseWinners = winnersData.filter((winner) => winner.isShowcase);

    switch (sortBy) {
      case "newest":
        return [...showcaseWinners].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return [...showcaseWinners].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "highest-value":
        return [...showcaseWinners].sort((a, b) => extractCashValue(b.prizeValue) - extractCashValue(a.prizeValue));
      case "highest-points":
        return [...showcaseWinners].sort((a, b) => extractPoints(b.prizeValue) - extractPoints(a.prizeValue));
      default:
        return showcaseWinners;
    }
  }, [winnersData, sortBy]);

  const totalPages = Math.ceil(sortedWinners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWinners = sortedWinners.slice(startIndex, startIndex + itemsPerPage);
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sortBy)?.label ?? "Newest First";

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="rr-winners rr-page min-h-screen text-foreground relative overflow-x-clip bg-[#050505]">
        <DigitalAtmosphere className="rr-atmosphere--page" />
        <div className="relative z-10">
          <Header />
          <div className="mx-auto max-w-md px-4 py-32 text-center">
            <h2 className="font-prize text-3xl text-white">Something went wrong</h2>
            <p className="mt-3 text-sm text-white/50">Failed to load winners. Please try again later.</p>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="rr-winners rr-page min-h-screen text-foreground relative overflow-x-clip bg-[#050505]">
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <div className="relative z-10">
        <Header />

        <section className="relative overflow-hidden py-10 sm:py-16" data-testid="section-winners-hero">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF263D] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF263D]" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                  Hall of Fame
                </span>
              </div>
              <h1 className="font-prize text-[2.4rem] leading-[0.92] text-white sm:text-6xl lg:text-7xl">
                WINNERS
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
                Real people took a ticket and walked away with the prize. Names, dates, and the wins —
                this is the board. Your shot is still live.
              </p>
              {!isLoading && sortedWinners.length > 0 && (
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#F1D47A]">
                  {sortedWinners.length} verified {sortedWinners.length === 1 ? "win" : "wins"}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="relative pb-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rr-filter-bar" role="tablist" aria-label="Sort winners">
              {SORT_OPTIONS.map((option) => {
                const active = sortBy === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleSortChange(option.id)}
                    className={`rr-filter-chip ${active ? "is-active" : ""}`}
                  >
                    <span className="rr-filter-icon" aria-hidden>
                      <option.Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rr-winner-card">
                    <div className="space-y-3">
                      <div className="h-3 w-16 rounded bg-white/5" />
                      <div className="h-10 w-2/3 rounded bg-white/5" />
                      <div className="h-4 w-full rounded bg-white/5" />
                      <div className="h-8 w-1/2 rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedWinners.length === 0 ? (
              <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#0A0A0D] px-6 py-16 text-center">
                <Trophy className="mx-auto mb-4 h-12 w-12 text-[#D4AF37]" />
                <h3 className="font-prize text-3xl text-white">Awaiting Champions</h3>
                <p className="mt-3 text-sm text-white/50">The next winner could be you. Pick a prize and get in.</p>
                <Link href="/">
                  <span className="rr-cta mt-6 inline-flex h-12 items-center justify-center rounded-xl px-7 text-sm font-black uppercase tracking-[0.14em]">
                    Claim Your Victory
                  </span>
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-5 flex justify-end">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/35">
                    Sorting by {sortLabel}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {paginatedWinners.map((winner, index) => {
                    const cashValue = extractCashValue(winner.prizeValue);
                    const points = extractPoints(winner.prizeValue);
                    const pointsDisplay = getPointsDisplay(winner.prizeValue);
                    const fullName = winner.user
                      ? `${winner.user.firstName} ${winner.user.lastName}`
                      : "Anonymous Winner";
                    const prizeHeadline =
                      cashValue > 0
                        ? `£${cashValue.toLocaleString()}`
                        : points > 0
                          ? `${points.toLocaleString()}`
                          : winner.prizeValue;
                    const prizeUnit = cashValue > 0 ? "" : points > 0 ? pointsDisplay : "";
                    const spotlight =
                      index === 0
                        ? sortBy === "highest-value"
                          ? "Top cash prize"
                          : sortBy === "highest-points"
                            ? "Top points"
                            : sortBy === "newest"
                              ? "Fresh victory"
                              : null
                        : null;

                    return (
                      <article key={winner.id} className="rr-winner-card">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {spotlight && (
                              <span className={`rr-winner-chip ${sortBy === "highest-points" ? "rr-winner-chip--gold" : ""}`}>
                                {sortBy === "highest-points" ? (
                                  <Coins className="h-3 w-3" />
                                ) : (
                                  <Crown className="h-3 w-3" />
                                )}
                                {spotlight}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => shareToFacebook(winner)}
                            className="rr-winner-share"
                            title="Share on Facebook"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Won</p>
                        <p className="rr-winner-prize mt-1">
                          {prizeHeadline}
                          {prizeUnit ? (
                            <span className="ml-2 align-middle text-base font-black uppercase tracking-widest text-[#F1D47A]/70">
                              {prizeUnit}
                            </span>
                          ) : null}
                        </p>
                        <h3 className="mt-3 text-base font-semibold leading-snug text-white sm:text-lg">
                          {winner.prizeDescription}
                        </h3>
                        {winner.competition && (
                          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-white/40">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span className="truncate">{winner.competition.title}</span>
                          </p>
                        )}

                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C8102E] to-[#8e0b20] text-[11px] font-black text-white">
                              {winner.user?.firstName?.charAt(0)}
                              {winner.user?.lastName?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-white/35">Winner</p>
                              <p className="truncate text-sm font-semibold text-white">{fullName}</p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/35">Victory date</p>
                            <p className="text-sm font-semibold text-[#F1D47A]">
                              {new Date(winner.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:mt-14 sm:gap-3">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="rr-page-btn"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`rr-page-btn ${currentPage === pageNum ? "is-active" : ""}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="rr-page-btn"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="relative pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rr-vip-panel text-center">
              <Trophy className="mx-auto mb-4 h-10 w-10 text-[#F1D47A]" />
              <h2 className="font-prize text-[2rem] text-white sm:text-5xl">YOUR NAME BELONGS HERE</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-white/50 sm:text-base">
                One ticket. One prize. The next card on this wall could have your name on it.
              </p>
              <Link href="/">
                <span className="rr-cta mt-7 inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-black uppercase tracking-[0.14em]">
                  Begin Your Journey
                </span>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
