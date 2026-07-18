import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Crown, Sparkles, Gem, Star, Calendar, Award, Trophy, SortAsc, SortDesc, TrendingUp, Clock, Coins, Share2 } from "lucide-react";

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

// Helper to extract cash value from prizeValue
const extractCashValue = (prizeValue: string): number => {
  const match = prizeValue.match(/£\s*([\d,.]+)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return 0;
};

// Helper to extract points from prizeValue
const extractPoints = (prizeValue: string): number => {
  // If it contains £, it's cash only
  if (prizeValue.includes('£')) {
    return 0;
  }
  // Try to extract numbers (for points like "10,000 Ringtones")
  const match = prizeValue.match(/([\d,.]+)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return 0;
};

// Helper to get display text for points
const getPointsDisplay = (prizeValue: string): string => {
  if (prizeValue.includes('£')) {
    return '';
  }
  // Extract the unit/description after the number
  const parts = prizeValue.match(/([\d,.]+)\s*(.+)/);
  if (parts && parts[2]) {
    return parts[2].trim();
  }
  return 'pts';
};

type SortOption = 'newest' | 'oldest' | 'highest-value' | 'highest-points';

// Facebook Share Function
const shareToFacebook = (winner: Winner) => {
  const url = window.location.href;
  const fullName = winner.user ? `${winner.user.firstName} ${winner.user.lastName}` : 'A Winner';
  const prize = winner.prizeDescription || 'an amazing prize';
  
  // Create share text
  const shareText = `🏆 ${fullName} just won ${prize}! Check out our past winners at ${url}`;
  
  // Facebook share URL
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`;
  
  // Open in new window
  window.open(
    facebookShareUrl,
    'facebook-share-dialog',
    'width=626,height=436'
  );
};

export default function PastWinners() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const itemsPerPage = 9;

  // Keep showcase=true filter - only show admin-approved winners
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
        user: item.user ? {
          id: item.user.id,
          firstName: item.user.firstName || "",
          lastName: item.user.lastName || "",
          email: item.user.email || "",
        } : null,
        competition: item.competition ? {
          id: item.competition.id,
          title: item.competition.title || "Prize Win",
        } : null,
      }));
    },
  });

  // Apply sorting
  const getSortedWinners = () => {
    const showcaseWinners = winnersData.filter((winner) => winner.isShowcase);
    
    switch (sortBy) {
      case 'newest':
        return [...showcaseWinners].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return [...showcaseWinners].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'highest-value':
        return [...showcaseWinners].sort((a, b) => {
          const aValue = extractCashValue(a.prizeValue);
          const bValue = extractCashValue(b.prizeValue);
          return bValue - aValue;
        });
      case 'highest-points':
        return [...showcaseWinners].sort((a, b) => {
          const aPoints = extractPoints(a.prizeValue);
          const bPoints = extractPoints(b.prizeValue);
          return bPoints - aPoints;
        });
      default:
        return showcaseWinners;
    }
  };

  const sortedWinners = getSortedWinners();
  const totalPages = Math.ceil(sortedWinners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWinners = sortedWinners.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when sort changes
  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-32 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-400">Failed to load winners. Please try again later.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* EXTREME LUXURY HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-black to-purple-900/20" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-10" />
        
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="container mx-auto px-4 py-24 relative">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-purple-500/20 backdrop-blur-sm px-6 py-2 rounded-full border border-amber-500/30">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-medium tracking-wide">THE HALL OF FAME</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">
              <span className="bg-gradient-to-r from-amber-300 via-white to-amber-300 bg-clip-text text-transparent">
                PAST WINNERS
              </span>
            </h1>
            
            <div className="flex justify-center gap-2">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-amber-500" />
              <Gem className="w-5 h-5 text-amber-400" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-amber-500" />
            </div>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light">
              Celebrating the elite few who've claimed extraordinary prizes
            </p>
          </div>
        </div>
      </section>

      {/* LUXURY SORTING SECTION */}
      <section className="relative z-10 -mt-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="inline-flex bg-black/60 backdrop-blur-md rounded-full border border-amber-500/20 p-1 flex-wrap justify-center">
              <button
                onClick={() => handleSortChange('newest')}
                className={`group relative px-6 py-2 rounded-full transition-all duration-300 ${
                  sortBy === 'newest'
                    ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white'
                    : 'text-gray-400 hover:text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${sortBy === 'newest' ? 'text-white' : 'group-hover:text-amber-400'}`} />
                  <span className="font-medium">Newest First</span>
                </div>
              </button>
              
              <button
                onClick={() => handleSortChange('oldest')}
                className={`group relative px-6 py-2 rounded-full transition-all duration-300 ${
                  sortBy === 'oldest'
                    ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white'
                    : 'text-gray-400 hover:text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SortAsc className={`w-4 h-4 ${sortBy === 'oldest' ? 'text-white' : 'group-hover:text-amber-400'}`} />
                  <span className="font-medium">Oldest First</span>
                </div>
              </button>
              
              <button
                onClick={() => handleSortChange('highest-value')}
                className={`group relative px-6 py-2 rounded-full transition-all duration-300 ${
                  sortBy === 'highest-value'
                    ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white'
                    : 'text-gray-400 hover:text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${sortBy === 'highest-value' ? 'text-white' : 'group-hover:text-amber-400'}`} />
                  <span className="font-medium">Highest Cash</span>
                </div>
              </button>
              
              <button
                onClick={() => handleSortChange('highest-points')}
                className={`group relative px-6 py-2 rounded-full transition-all duration-300 ${
                  sortBy === 'highest-points'
                    ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white'
                    : 'text-gray-400 hover:text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Coins className={`w-4 h-4 ${sortBy === 'highest-points' ? 'text-white' : 'group-hover:text-amber-400'}`} />
                  <span className="font-medium">Highest Points</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LUXURY WINNERS GRID */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-2xl blur-xl animate-pulse" />
                  <div className="relative bg-gradient-to-br from-gray-900/50 to-black rounded-2xl border border-amber-500/20 p-6 backdrop-blur-sm h-[400px]">
                    <div className="w-full h-48 bg-gray-800 rounded-xl mb-4 animate-pulse" />
                    <div className="h-6 bg-gray-800 rounded mb-2 w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-800 rounded mb-4 w-full animate-pulse" />
                    <div className="h-8 bg-gray-800 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedWinners.length === 0 ? (
            <div className="text-center py-32">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-32 h-32 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-16 h-16 text-amber-400/40" />
                </div>
                <h3 className="text-3xl font-bold text-white">Awaiting Champions</h3>
                <p className="text-gray-400 text-lg">The next luxury winner could be you</p>
                <button className="bg-gradient-to-r from-amber-500 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform">
                  Claim Your Victory
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Sort Indicator */}
              <div className="flex justify-end mb-6">
                <div className="text-sm text-amber-400/60 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    Sorting by: {sortBy === 'newest' ? 'Newest First' : sortBy === 'oldest' ? 'Oldest First' : sortBy === 'highest-value' ? 'Highest Cash' : 'Highest Points'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {paginatedWinners.map((winner, index) => {
                  const cashValue = extractCashValue(winner.prizeValue);
                  const points = extractPoints(winner.prizeValue);
                  const pointsDisplay = getPointsDisplay(winner.prizeValue);
                  const fullName = winner.user ? `${winner.user.firstName} ${winner.user.lastName}` : 'Anonymous Winner';

                  return (
                    <div
                      key={winner.id}
                      className="group relative animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-purple-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
                      
                      <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-amber-500/20 overflow-hidden hover:border-amber-500/40 transition-all duration-500">
                        
                        {/* Position Indicators */}
                        {sortBy === 'highest-value' && index === 0 && (
                          <div className="absolute top-4 left-4 z-20">
                            <div className="bg-gradient-to-r from-amber-500 to-purple-600 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                              <Crown className="w-3 h-3 text-white" />
                              <span className="text-white text-xs font-bold">TOP CASH PRIZE</span>
                            </div>
                          </div>
                        )}

                        {sortBy === 'highest-points' && index === 0 && (
                          <div className="absolute top-4 left-4 z-20">
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                              <Coins className="w-3 h-3 text-white" />
                              <span className="text-white text-xs font-bold">TOP POINTS</span>
                            </div>
                          </div>
                        )}

                        {sortBy === 'newest' && index === 0 && (
                          <div className="absolute top-4 left-4 z-20">
                            <div className="bg-gradient-to-r from-amber-500 to-purple-600 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                              <Sparkles className="w-3 h-3 text-white" />
                              <span className="text-white text-xs font-bold">FRESH VICTORY</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Value Badges - Show BOTH cash and points if they exist */}
                        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                          {/* Cash Value */}
                          {cashValue > 0 && (
                            <div className="bg-gradient-to-r from-amber-500/90 to-purple-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                              <Star className="w-3 h-3 text-white fill-current" />
                              <span className="text-white font-bold text-sm">£{cashValue.toLocaleString()}</span>
                            </div>
                          )}
                          
                          {/* Points */}
                          {points > 0 && (
                            <div className="bg-gradient-to-r from-blue-500/90 to-cyan-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                              <Coins className="w-3 h-3 text-white" />
                              <span className="text-white font-bold text-sm">{points.toLocaleString()} {pointsDisplay}</span>
                            </div>
                          )}

                          {/* Fallback if neither cash nor points detected */}
                          {cashValue === 0 && points === 0 && (
                            <div className="bg-gradient-to-r from-gray-500/90 to-gray-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                              <Award className="w-3 h-3 text-white" />
                              <span className="text-white font-bold text-sm">{winner.prizeValue}</span>
                            </div>
                          )}
                        </div>

                        {/* Image Container */}
                        <div className="relative overflow-hidden h-64">
                          {winner.imageUrl ? (
                            <>
                              <img
                                src={winner.imageUrl}
                                alt={winner.prizeDescription}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60" />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                              <Award className="w-20 h-20 text-amber-500/20" />
                            </div>
                          )}
                          
                          <div className="absolute bottom-4 left-4 z-10">
                            <Crown className="w-8 h-8 text-amber-400/40" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">

                         <div className="flex items-start justify-between gap-4">
  <div className="flex-1">
    <h3 className="font-playfair text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
      {winner.prizeDescription}
    </h3>
    {winner.competition && (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Calendar className="w-3 h-3" />
        <span>{winner.competition.title}</span>
      </div>
    )}
  </div>

  {/* Share Button - Facebook */}
  <button
    onClick={() => shareToFacebook(winner)}
    className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
    title="Share on Facebook"
  >
    <Share2 className="w-4 h-4" />
  </button>
</div>
                          <div className="pt-4 border-t border-amber-500/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Winner</p>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      {winner.user?.firstName?.charAt(0)}{winner.user?.lastName?.charAt(0)}
                                    </span>
                                  </div>
                                  <p className="font-semibold text-white">
                                    {fullName}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Victory Date</p>
                                <p className="text-sm text-amber-400 font-medium">
                                  {new Date(winner.createdAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                           
                          </div>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LUXURY PAGINATION */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-16">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="group w-12 h-12 rounded-full border border-amber-500/30 hover:border-amber-500 bg-black/50 backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110"
                  >
                    <ChevronLeft className="w-5 h-5 text-amber-400 mx-auto group-hover:-translate-x-0.5 transition-transform" />
                  </button>

                  <div className="flex gap-3">
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
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative w-12 h-12 rounded-full font-bold transition-all duration-300 ${
                            currentPage === pageNum
                              ? "bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg shadow-amber-500/25 scale-110"
                              : "border border-amber-500/30 text-gray-400 hover:border-amber-500 hover:text-amber-400"
                          }`}
                        >
                          {pageNum}
                          {currentPage === pageNum && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-amber-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="group w-12 h-12 rounded-full border border-amber-500/30 hover:border-amber-500 bg-black/50 backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110"
                  >
                    <ChevronRight className="w-5 h-5 text-amber-400 mx-auto group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* LUXURY CTA SECTION */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-purple-900/10 to-amber-900/10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-5" />
        
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-3xl mx-auto space-y-6">
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto" />
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 via-white to-amber-300 bg-clip-text text-transparent">
              Your Name Belongs Here
            </h2>
            <p className="text-gray-300 text-lg">
              Join an exclusive community of winners and experience the thrill of victory
            </p>
            <button className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-purple-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-amber-500/25 transition-all hover:scale-105">
              <span>Begin Your Journey</span>
              <Trophy className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .font-playfair {
          font-family: 'Playfair Display', serif;
        }
      `}</style>
    </div>
  );
}