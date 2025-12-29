import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState } from "react";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";

// Update your Winner interface to include competition
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
export default function PastWinners() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
   // Fetch SHOWCASE winners only
  const { data: winnersData = [], isLoading } = useQuery<Winner[]>({
  queryKey: ["/api/winners", "showcase"],
  queryFn: async () => {
    const res = await fetch("/api/winners?showcase=true"); 
    
    if (!res.ok) {
      throw new Error("Failed to fetch winners");
    }
    
    const json = await res.json();
    // console.log("🎯 API Response (first item):", json[0]); // Debug
    
    // Now API should return direct structure with user and competition
    const winners: Winner[] = json.map((item: any) => ({
      id: item.id,
      prizeDescription: item.prizeDescription,
      prizeValue: item.prizeValue?.replace("£", "") ?? "0",
      imageUrl: item.imageUrl || "",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt || item.createdAt,
      isShowcase: item.isShowcase ?? true,
      user: item.user ? {
        firstName: item.user.firstName || "",
        lastName: item.user.lastName || "",
      } : { firstName: "", lastName: "" },
      competition: {
        title: item.competition?.title || "Prize Win", // Fallback text
      },
    }));
    
  
    
    // console.log("🔄 First transformed winner:", winners[0]);
    return winners;
  },
});
  const totalPages = Math.ceil(winnersData.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const showcaseWinners = winnersData
   .filter((winner) => winner.isShowcase)

  const paginatedWinners = showcaseWinners.slice(startIndex, startIndex + itemsPerPage);

  // console.log("API Response:", winnersData);
  // console.log("Loading:", isLoading);
  // console.log("winnersData length:", winnersData?.length);

   return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">PAST WINNERS</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
               See who's been winning amazing prizes over £100! This could be you next.
            </p>
          </div>
        </div>
      </section>

      {/* Winners Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border p-6 animate-pulse"
                >
                  <div className="w-full h-48 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : paginatedWinners.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto space-y-4">
                <h3 className="text-2xl font-bold text-foreground">
                  No Winners Yet
                </h3>
                <p className="text-muted-foreground text-lg">
                  Be the first to win amazing prizes! Stay tuned for upcoming competitions.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedWinners.map((winner: any) => (
                  <div
                    key={winner.id}
                    className="bg-card rounded-xl border border-border overflow-hidden hover:transform hover:scale-105 transition-transform"
                  >
                    {winner.imageUrl && (
                      <img
                        src={winner.imageUrl}
                        alt={winner.prizeDescription}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6 space-y-3">
                      <h3 className="font-bold text-lg line-clamp-2">
                        {winner.prizeDescription}
                      </h3>
                      <p className="text-muted-foreground">
                        {winner.competition?.title || "Competition"}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="text-primary font-bold text-xl">
                          £{parseFloat(winner.prizeValue).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(winner.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <p className="text-sm text-muted-foreground">Winner</p>
                        <p className="font-medium">
                          {winner.user?.firstName} {winner.user?.lastName?.charAt(0)}.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Buttons */}
              <div className="flex justify-center mt-10 gap-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-2 py-1 bg-primary text-white rounded disabled:opacity-30"
                >
                  <ArrowBigLeft />
                </button>

                <span className="text-lg font-medium">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-2 py-1 bg-primary text-white rounded disabled:opacity-30"
                >
                 <ArrowBigRight />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}