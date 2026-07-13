import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Testimonials from "@/components/testimonials";
import { Competition, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import CountdownTimer from "./countdownTimer";
import { Minus, Plus, ChevronLeft, ChevronRight, Sparkles, Zap, Crown } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import UserCompetitionPrizes from "./user-competition-prizes";


// Add this component before the CompetitionPage component definition

// Premium Progress Bar Component for Instant Type
const InstantProgressBar = ({ competition }: { competition: Competition }) => {
  const sold = competition.soldTickets ?? 0;
  const total = competition.maxTickets ?? 0;
  const remaining = total - sold;
  const percentage = total > 0 ? (sold / total) * 100 : 0;
  const isHighDemand = percentage > 70;
  const isAlmostFull = percentage > 85;
  
  return (
    <div className="relative group">
      {/* Animated border glow */}
      <div className="absolute -inset-[2px] bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] rounded-2xl opacity-40 group-hover:opacity-70 transition-all duration-500 blur-md"></div>
      
      <div className="relative bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] rounded-2xl p-6 md:p-8 border border-[#FACC15]/20 overflow-hidden">
        
        {/* Background shimmer effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FACC15]/5 to-transparent animate-shimmer"></div>
        </div>
        
        
        
        {/* Premium Progress Bar Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Overall Progress</span>
              <p className="text-2xl font-bold text-white">{percentage.toFixed(1)}%</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Total Capacity</span>
              <p className="text-lg font-bold text-[#FACC15]">{total.toLocaleString()} tickets</p>
            </div>
          </div>
          
          {/* Multi-layer progress bar */}
          <div className="relative">
            {/* Background track */}
            <div className="h-6 bg-black/60 rounded-full overflow-hidden border border-[#FACC15]/20">
              {/* Main progress fill */}
              <div 
                className="relative h-full bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#D97706] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              >
                {/* Animated shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                
                {/* Pulsing glow effect */}
                <div className="absolute inset-0 rounded-full animate-pulse opacity-50" 
                     style={{ background: "radial-gradient(circle at center, rgba(250,204,21,0.8) 0%, transparent 80%)" }}>
                </div>
              </div>
            </div>
            
            {/* Percentage markers */}
            <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
              {[0, 25, 50, 75, 100].map((mark) => (
                <div key={mark} className="relative">
                  <div className="w-px h-4 bg-white/20"></div>
                  <div className="absolute top-7 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 font-medium">
                    {mark}%
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Progress message with urgency */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#FACC15]/10">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                remaining === 0 ? 'bg-red-500' : remaining < 100 ? 'bg-orange-500' : 'bg-green-500'
              }`}></div>
              <span className="text-xs text-gray-400">
                {remaining === 0 
                  ? "🏆 All tickets sold! Winner announcement coming soon."
                  : remaining < 50 
                  ? `⚡ Hurry! Only ${remaining.toLocaleString()} tickets remaining!`
                  : `${remaining.toLocaleString()} spots left - Don't miss out!`}
              </span>
            </div>
            
            {/* Urgency indicator */}
            {isAlmostFull && remaining > 0 && (
              <div className="flex items-center gap-2 animate-bounce">
                <span className="text-sm">⚠️</span>
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Last Chance!
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Mini visual indicator of ticket distribution */}
        <div className="mt-6 pt-4 border-t border-[#FACC15]/10">
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
            <span>Ticket Distribution Visual</span>
            <span>{sold.toLocaleString()} / {total.toLocaleString()} claimed</span>
          </div>
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            {/* Create mini blocks for visual representation */}
            {Array.from({ length: 20 }).map((_, i) => {
              const blockPercentage = (i + 1) * 5;
              const isFilled = blockPercentage <= percentage;
              return (
                <div
                  key={i}
                  className={`flex-1 transition-all duration-500 rounded-sm ${
                    isFilled
                      ? "bg-gradient-to-r from-[#FACC15] to-[#F59E0B]"
                      : "bg-white/5"
                  }`}
                  style={{ transitionDelay: `${i * 20}ms` }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Discount calculation utility - ONLY for game types
// NEW DISCOUNT SCHEME: 10 plays: 2%, 20 plays: 5%, 50 plays: 10%
const TICKET_DISCOUNTS: Record<number, number> = {
  10: 0.02,  // 2% off for 10 plays
  20: 0.05,  // 5% off for 20 plays
  50: 0.10,  // 10% off for 50 plays
};

const GAME_TYPES = ["spin", "scratch", "pop", "plinko", "voltz"];

function calculateDiscountedPrice(basePrice: number, quantity: number) {
  const originalPrice = basePrice * quantity;
  
  const sortedTiers = Object.keys(TICKET_DISCOUNTS)
    .map(Number)
    .sort((a, b) => b - a);
  
  let discountPercent = 0;
  for (const tier of sortedTiers) {
    if (quantity >= tier) {
      discountPercent = TICKET_DISCOUNTS[tier];
      break;
    }
  }
  
  const discountedPrice = originalPrice * (1 - discountPercent);
  const savings = originalPrice - discountedPrice;
  
  return {
    originalPrice: parseFloat(originalPrice.toFixed(2)),
    discountPercent: discountPercent * 100,
    discountedPrice: parseFloat(discountedPrice.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
  };
}

function getApplicableDiscount(quantity: number): number {
  const sortedTiers = Object.keys(TICKET_DISCOUNTS)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const tier of sortedTiers) {
    if (quantity >= tier) {
      return TICKET_DISCOUNTS[tier] * 100;
    }
  }
  
  return 0;
}

export default function CompetitionPage() {
  const rangeRef = useRef<HTMLDivElement | null>(null);
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth() as {
    isAuthenticated: boolean;
    user: User | null;
  };
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isPostalModalOpen, setIsPostalModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  
  // Carousel state
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);
  
  const quizQuestion = {
    question:
      "You wake up at 7:00am and take 30 minutes to get ready. What time are you ready?",
    options: ["7:15am", "7:25am", "7:30am", "7:45am"],
    correct: "7:30am",
  };

  const handleOpenQuiz = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setShowQuiz(true);
  };

  const { data: competition, isLoading } = useQuery<Competition>({
    queryKey: ["/api/competitions", id],
    enabled: !!id,
  });

  const { data: userTickets = [] } = useQuery<any[]>({
    queryKey: ["/api/user/tickets"],
    enabled: isAuthenticated,
  });

  const isSoldOut =
    competition?.maxTickets && competition.maxTickets > 0
      ? (competition.soldTickets ?? 0) >= competition.maxTickets
      : false;

  const availableTickets = userTickets.filter(
    (ticket: any) => ticket.competitionId === id
  );

  const isFreeGiveaway = competition?.title === "💷 £500 FREE GIVEAWAY! 🎉";
  const userTicketCount = availableTickets.length;
  const maxTicketsForGiveaway = 2;
  const canBuyMore = isFreeGiveaway ? userTicketCount < maxTicketsForGiveaway : true;
  const remainingTickets = maxTicketsForGiveaway - userTicketCount;

  const competitionType = competition?.type?.toLowerCase() || "";
  const isGameType = GAME_TYPES.includes(competitionType);
  // Add this query in your CompetitionPage component
const { data: ticketSettings } = useQuery({
  queryKey: ["/api/public/max-tickets"],
  queryFn: () => fetch("/api/public/max-tickets").then((res) => res.json()),
});

// Get the max tickets value
const maxTicketsAllowed = ticketSettings?.maxTicketsPerOrder || 500;

  const purchaseTicketMutation = useMutation({
    mutationFn: async (data: { competitionId: string; quantity: number }) => {
      if (competitionType === "spin") {
        const response = await apiRequest("/api/create-spin-order", "POST", data);
        return response.json();
      } 
      else if (competitionType === "scratch") {
        const response = await apiRequest("/api/create-scratch-order", "POST", data);
        return response.json();
      }
      else if (competitionType === "pop") {
        const response = await apiRequest("/api/create-pop-order", "POST", data);
        return response.json();
      }
      else if (competitionType === "plinko") {
        const response = await apiRequest("/api/create-plinko-order", "POST", data);
        return response.json();
      }
      else if (competitionType === "voltz") {
        const response = await apiRequest("/api/create-voltz-order", "POST", data);
        return response.json();
      }
      else {
        const response = await apiRequest("/api/create-competition-order", "POST", data);
        return response.json();
      }
    },

    onSuccess: (data) => {
      if (competitionType === "spin") {
        setLocation(`/spin-billing/${data.orderId}/${competition?.wheelType}`);
        return;
      }
      if (competitionType === "scratch") {
        setLocation(`/scratch-billing/${data.orderId}`);
        return;
      }
      if (competitionType === "pop") {
        setLocation(`/pop-billing/${data.orderId}`);
        return;
      }
      if (competitionType === "plinko") {
        setLocation(`/plinko-billing/${data.orderId}`);
        return;
      }
      if (competitionType === "voltz") {
        setLocation(`/voltz-billing/${data.orderId}`);
        return;
      }
      setLocation(`/checkout/${data.orderId}`);
    },

    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login Required",
          description: "Please login to continue.",
          variant: "destructive",
        });
        setTimeout(() => (window.location.href = "/login"), 1000);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to process purchase",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const fetchVideo = async () => {
      if (!competition || competition.type?.toLowerCase() !== "instant") {
        return;
      }
      setIsVideoLoading(true);
      try {
        const response = await fetch(`/api/promo-competitions/${competition.id}/video`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.video?.url) {
            setVideoUrl(data.video.url);
          }
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setIsVideoLoading(false);
      }
    };
    fetchVideo();
  }, [competition]);

  const handlePurchase = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (!competition) return;

    if (isFreeGiveaway) {
      if (userTicketCount >= maxTicketsForGiveaway) {
        toast({
          title: "Limit Reached",
          description: `You already have ${userTicketCount} tickets. Maximum ${maxTicketsForGiveaway} tickets allowed.`,
          variant: "destructive",
        });
        return;
      }
      if (quantity > remainingTickets) {
        toast({
          title: "Limit Exceeded",
          description: `You can only buy ${remainingTickets} more ticket${remainingTickets > 1 ? 's' : ''} (maximum ${maxTicketsForGiveaway} total)`,
          variant: "destructive",
        });
        return;
      }
    }

    if (!isGameType) {
      const competitionRemainingTickets =
        (competition.maxTickets ?? 0) - (competition.soldTickets ?? 0);
      if (competitionRemainingTickets <= 0) {
        toast({
          title: "Sold Out",
          description: "All tickets for this competition are sold out.",
          variant: "destructive",
        });
        return;
      }
      if (quantity > competitionRemainingTickets) {
        toast({
          title: "Too Many Tickets",
          description: `Only ${competitionRemainingTickets} ticket${
            competitionRemainingTickets > 1 ? "s" : ""
          } remaining. Please reduce your quantity.`,
          variant: "destructive",
        });
        return;
      }
    }

    purchaseTicketMutation.mutate({
      competitionId: competition.id,
      quantity,
    });
  };

  const totalPrice = competition
    ? parseFloat(competition.ticketPrice) * quantity
    : 0;
  const progressPercentage = competition?.maxTickets
    ? (competition.soldTickets! / competition.maxTickets) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Competition Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The competition you're looking for doesn't exist.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Competitions
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === quizQuestion.correct) {
      setIsAnswerCorrect(true);
      setShowQuiz(false);
      handlePurchase();
    } else {
      setIsAnswerCorrect(false);
      toast({
        title: "Wrong Answer ❌",
        description: "That's not correct! Try again next time.",
        variant: "destructive",
      });
      setShowQuiz(false);
    }
  };

  const scrollToRange = () => {
    if (!rangeRef.current) return;
    const top = rangeRef.current.getBoundingClientRect().top + window.scrollY - 180;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const getGradientStyles = () => {
    if (competitionType === "spin") {
      return {
        hero: "bg-gradient-to-br from-[#facc15] via-[#d946ef] to-[#facc15]",
        glow: "shadow-[0_0_60px_rgba(250,204,21,0.5)] shadow-[#facc15]/30",
        badge: "bg-gradient-to-r from-[#facc15] via-[#d946ef] to-[#facc15]",
        button: "bg-gradient-to-r from-[#facc15] via-[#d946ef] to-[#facc15] hover:from-[#fbbf24] hover:via-[#c026d3] hover:to-[#fbbf24]",
        shimmer: "from-[#facc15] via-[#d946ef] to-[#facc15]",
        accent: "rgba(217, 70, 239, 0.15)"
      };
    } else if (competitionType === "scratch") {
      return {
        hero: "bg-gradient-to-br from-[#facc15] via-[#22d3ee] to-[#facc15]",
        glow: "shadow-[0_0_60px_rgba(250,204,21,0.5)] shadow-[#facc15]/30",
        badge: "bg-gradient-to-r from-[#facc15] via-[#22d3ee] to-[#facc15]",
        button: "bg-gradient-to-r from-[#facc15] via-[#22d3ee] to-[#facc15] hover:from-[#fbbf24] hover:via-[#06b6d4] hover:to-[#fbbf24]",
        shimmer: "from-[#facc15] via-[#22d3ee] to-[#facc15]",
        accent: "rgba(34, 211, 238, 0.15)"
      };
    } else {
      return {
        hero: "bg-gradient-to-br from-[#facc15] via-[#f59e0b] to-[#d97706]",
        glow: "shadow-[0_0_60px_rgba(250,204,21,0.5)] shadow-[#facc15]/30",
        badge: "bg-gradient-to-r from-[#facc15] to-[#f59e0b]",
        button: "bg-gradient-to-r from-[#facc15] to-[#f59e0b] hover:from-[#fbbf24] hover:to-[#d97706]",
        shimmer: "from-[#facc15] via-[#fbbf24] to-[#facc15]",
        accent: "rgba(245, 158, 11, 0.15)"
      };
    }
  };

  const gradients = getGradientStyles();

  const remainingPercentage = competition?.maxTickets
    ? ((competition.maxTickets - (competition.soldTickets ?? 0)) / competition.maxTickets) * 100
    : 100;
  const isAlmostGone = remainingPercentage < 15;

  const pricePerTicket = parseFloat(competition.ticketPrice);
  
  // Only calculate discount for game types
  const { originalPrice, discountPercent, discountedPrice, savings } = 
    isGameType ? calculateDiscountedPrice(pricePerTicket, quantity) : 
    { originalPrice: pricePerTicket * quantity, discountPercent: 0, discountedPrice: pricePerTicket * quantity, savings: 0 };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Competition Details */}
      <section className="py-6 md:py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#facc15]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tl from-[#f59e0b]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: "1.5s"}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl animate-pulse opacity-30" style={{background: gradients.accent, animationDelay: "0.7s"}}></div>
          
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#facc15] rounded-full animate-sparkle-float" style={{animationDelay: "0s"}}></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-[#fbbf24] rounded-full animate-sparkle-float" style={{animationDelay: "1.2s"}}></div>
          <div className="absolute bottom-1/4 left-1/2 w-2.5 h-2.5 bg-[#facc15] rounded-full animate-sparkle-float" style={{animationDelay: "2s"}}></div>
          <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-[#fbbf24] rounded-full animate-sparkle-float" style={{animationDelay: "0.8s"}}></div>
          <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-[#facc15] rounded-full animate-sparkle-float" style={{animationDelay: "1.6s"}}></div>
        </div>
        
        <style>{`
          @keyframes sparkle-float {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
            25% { transform: translateY(-20px) scale(1.2); opacity: 0.7; }
            50% { transform: translateY(-30px) scale(0.8); opacity: 0.5; }
            75% { transform: translateY(-15px) scale(1.1); opacity: 0.6; }
          }
          .animate-sparkle-float { animation: sparkle-float 6s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .animate-sparkle-float, .animate-pulse { animation: none; }
          }
        `}</style>

        <div className="container mx-auto px-3 md:px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 md:gap-12">
              {/* Left: Competition Image and Details */}
              <div className="space-y-4 md:space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-3 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-700"></div>
                  
                  <div className={`relative rounded-2xl overflow-hidden ${gradients.glow} shadow-2xl border-4 border-[#FACC15]/60`}>
                    <div className="overflow-hidden rounded-xl" ref={emblaRef}>
                      <div className="flex">
                        <div className="flex-[0_0_100%] min-w-0">
                          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                            <img
                              src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                              alt={competition.title}
                              className="w-full h-full object-cover"
                              data-testid={`img-competition-${competition.id}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none z-10"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(250,204,21,0.05),transparent_60%)] pointer-events-none z-10"></div>
                            
                            {isAlmostGone && competition.maxTickets && (
                              <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-gradient-to-r from-red-600 to-pink-600 text-white px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold shadow-xl z-20">
                                ⚡ ALMOST GONE!
                              </div>
                            )}

                            <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 bg-gradient-to-r from-[#FACC15]/95 to-[#F59E0B]/95 backdrop-blur-md text-gray-900 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold flex items-center gap-1.5 md:gap-2 shadow-xl z-20">
                              <span>🔥</span>
                              <span>Trending</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={scrollPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 transition-all"
                      disabled={!canScrollPrev}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={scrollNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 transition-all"
                      disabled={!canScrollNext}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#facc15] via-[#f59e0b] to-[#facc15] rounded-xl opacity-50 blur group-hover:opacity-75 transition duration-500"></div>
                  
                  <div className="relative bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 p-4 md:p-6 shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#facc15]/10 via-[#f59e0b]/5 to-[#d97706]/10 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg md:text-2xl font-bold mb-4 md:mb-5 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#D97706] bg-clip-text text-transparent">
                        ✨ Competition Details
                      </h3>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center gap-2 bg-black/30 rounded-lg p-2.5">
                          <span className="text-gray-300 text-xs md:text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]"></span>
                            Type
                          </span>
                          <span className={`capitalize font-bold text-xs md:text-sm ${gradients.badge} text-white px-3 py-1.5 rounded-full shadow-lg`}>
                            {competitionType === "spin" ? "🎡 Spin Wheel" : competitionType === "scratch" ? "🎫 Scratch Card" : competitionType === "pop" ? "🎈 Pop Balloon" : competitionType === "plinko" ? "🎯 Plinko" : competitionType === "voltz" ? "⚡ Voltz" : "🏆 Competition"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2 bg-black/30 rounded-lg p-2.5">
                          <span className="text-gray-300 text-xs md:text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]"></span>
                            Price per Entry
                          </span>
                          <span className="font-bold text-[#facc15] text-base md:text-lg drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                            £{pricePerTicket.toFixed(2)}
                          </span>
                        </div>
                        {competition.maxTickets && (
                          <div className="space-y-2 bg-black/30 rounded-lg p-2.5">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-gray-300 text-xs md:text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]"></span>
                                Progress
                              </span>
                              <span className="text-xs md:text-sm text-white font-medium">
                                {competition.soldTickets} / {competition.maxTickets} sold
                              </span>
                            </div>
                            <div className="relative h-3 bg-gray-800/50 rounded-full overflow-hidden border border-[#facc15]/20">
                              <div
                                className={`h-full ${gradients.hero} transition-all duration-500 relative`}
                                style={{ width: `${progressPercentage}%` }}
                              >
                                <div className={`absolute inset-0 bg-gradient-to-r ${gradients.shimmer} opacity-50 animate-pulse`}></div>
                              </div>
                            </div>
                            <p className="text-xs text-center font-medium" style={{ color: remainingPercentage < 15 ? "#facc15" : "#9ca3af" }}>
                              {remainingPercentage < 15 ? "⚡ Less than 15% remaining!" : `${Math.round(remainingPercentage)}% available`}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 md:mt-6 pt-4 border-t border-[#facc15]/20 grid grid-cols-2 gap-3">
                        {[
                          { icon: "🔒", label: "Secure Payment" },
                          { icon: "✓", label: "Fair Draw" },
                          { icon: "⚡", label: "Quick Entry" },
                          { icon: "🏆", label: "Real Winners" },
                        ].map((badge, i) => (
                          <div key={i} className="relative group/badge">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#facc15] to-[#f59e0b] rounded-lg opacity-0 group-hover/badge:opacity-20 transition duration-300"></div>
                            <div className="relative flex flex-col items-center gap-2 text-center bg-gradient-to-br from-[#facc15]/10 to-transparent rounded-lg p-3 border border-[#facc15]/30 hover:border-[#facc15]/60 transition group-hover/badge:scale-105 transform">
                              <span className="text-2xl">{badge.icon}</span>
                              <span className="text-[10px] md:text-xs font-bold bg-gradient-to-r from-[#facc15] to-[#f59e0b] bg-clip-text text-transparent">{badge.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {competitionType === "instant" && videoUrl && (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] rounded-xl opacity-30 blur group-hover:opacity-50 transition duration-500"></div>
                    <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-3 overflow-hidden shadow-2xl">
                      <div className="relative rounded-lg overflow-hidden bg-black">
                        <video controls className="w-full max-h-[200px] md:max-h-[240px] object-contain" preload="metadata">
                          <source src={videoUrl} type="video/mp4" />
                        </video>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Purchase Form */}
              <div className="space-y-4 md:space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#facc15] via-[#f59e0b] to-[#facc15] rounded-xl opacity-30 blur group-hover:opacity-50 transition duration-500"></div>
                  
                  <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4 md:p-8 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#facc15]/5 via-[#f59e0b]/5 to-[#d97706]/5"></div>
                    
                    <div className="relative z-10">
                      <div className="mb-5">
                        <CountdownTimer endDate={competition.endDate} />
                      </div>
                      
                      <div className="relative mb-4 md:mb-5">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FACC15]/20 via-[#F59E0B]/20 to-[#FACC15]/20 blur-2xl"></div>
                        <h1
                          className="relative text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2 md:mt-3 font-black break-words leading-[1.1] tracking-tight"
                          style={{ 
                            wordBreak: "break-word", 
                            hyphens: "auto",
                            background: "linear-gradient(135deg, #FACC15 0%, #F59E0B 50%, #FACC15 100%)",
                            backgroundSize: "200% 100%",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            filter: "drop-shadow(0 0 24px rgba(250, 204, 21, 0.3))"
                          }}
                          data-testid={`heading-${competition.id}`}
                        >
                          {competition.title}
                        </h1>
                        <div className="h-1 mt-2 md:mt-3 bg-gradient-to-r from-transparent via-[#FACC15] to-transparent rounded-full opacity-60"></div>
                      </div>

                      {competition.description?.trim() ? (
                        <div className="mb-4 md:mb-5">
                          <div className="bg-gradient-to-br from-[#FACC15]/5 to-[#F59E0B]/5 rounded-lg p-3 md:p-4 border border-[#FACC15]/20">
                            <div className="text-gray-300 text-[11px] md:text-xs whitespace-pre-line leading-relaxed">
                              {competition.description}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {isGameType && (
                        <div className="mb-4 md:mb-5">
                          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-3 md:p-4 border border-green-500/30 shadow-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                  <span className="text-lg">🎯</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-green-400 font-bold text-sm md:text-base mb-1.5">
                                  💷 £100 Cash Draw Every Month
                                </h4>
                                <p className="text-gray-300 text-[11px] md:text-xs leading-relaxed">
                                  All entries automatically enter our monthly £100 cash draw!
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center justify-between text-lg md:text-xl font-bold">
                          <span className="break-words">£{pricePerTicket.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground font-normal">per entry</span>
                        </div>

                        {/* Total Cost Box - Premium Yellow/Gold */}
                        <div className="bg-gradient-to-br from-[#facc15] via-[#f59e0b] to-[#d97706] rounded-lg p-3 md:p-4 shadow-xl">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-medium text-gray-900 text-sm">Total</span>
                            <div className="text-right">
                              {isGameType && discountPercent > 0 && (
                                <span className="text-xs text-gray-700 line-through block">
                                  £{originalPrice.toFixed(2)}
                                </span>
                              )}
                              <span className="text-lg md:text-xl font-bold text-gray-900">
                                £{isGameType ? discountedPrice.toFixed(2) : (pricePerTicket * quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {isGameType && discountPercent > 0 && (
                            <div className="flex items-center justify-center gap-2 mt-1 bg-black/20 rounded-full py-1 px-3">
                              <Sparkles className="w-3 h-3 text-yellow-300" />
                              <span className="text-gray-900 text-[10px] md:text-xs font-bold">
                                {discountPercent}% BUNDLE OFF
                              </span>
                              <span className="text-gray-900 text-[10px] md:text-xs font-semibold">
                                Save £{savings.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <p className="text-[11px] md:text-xs text-gray-900/90 mt-1.5 font-semibold text-center">
                            ✓ FREE DIGITAL ENTRY SLIPS
                          </p>
                        </div>

                        {availableTickets.length > 0 && !isGameType ? (
                          <div className="space-y-2.5 md:space-y-3">
                            <div className="bg-gradient-to-r from-[#facc15]/20 to-[#f59e0b]/20 border border-[#facc15]/30 rounded-lg p-2.5 md:p-3 text-center">
                              <p className="bg-gradient-to-r from-[#facc15] to-[#f59e0b] bg-clip-text text-transparent font-bold text-xs">
                                ✅ You have {availableTickets.length} Tickets
                              </p>
                            </div>
                            <button
                              onClick={scrollToRange}
                              disabled={isSoldOut || purchaseTicketMutation.isPending}
                              className={`w-full py-2.5 md:py-3 rounded-lg font-bold text-sm md:text-base transition-all transform hover:scale-105 ${
                                isSoldOut
                                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                  : "bg-gradient-to-r from-[#facc15] to-[#f59e0b] text-gray-900 shadow-lg hover:shadow-xl hover:from-[#fbbf24] hover:to-[#d97706]"
                              }`}
                              data-testid="button-purchase"
                            >
                              {isSoldOut ? "SOLD OUT" : purchaseTicketMutation.isPending ? "Processing..." : "BUY MORE TICKETS"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={scrollToRange}
                            disabled={isSoldOut || purchaseTicketMutation.isPending}
                            className={`w-full py-2.5 md:py-3 rounded-lg font-bold text-sm md:text-base transition-all transform hover:scale-105 ${
                              isSoldOut
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                : "bg-gradient-to-r from-[#facc15] to-[#f59e0b] text-gray-900 shadow-lg hover:shadow-xl hover:from-[#fbbf24] hover:to-[#d97706]"
                            }`}
                            data-testid="button-purchase"
                          >
                            {isSoldOut ? "SOLD OUT" : purchaseTicketMutation.isPending ? "Processing..." : "BUY NOW 🚀"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isAuthenticated && user && (
                  <div className="bg-gradient-to-r from-[#facc15] to-[#f59e0b] rounded-lg p-3 md:p-4 text-center text-gray-900 shadow-lg">
                    <h3 className="font-bold mb-1.5 text-xs md:text-sm">💰 Your Wallet Balance</h3>
                    <p className="text-xl md:text-2xl font-bold">
                      £{parseFloat(user.balance || "0").toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="bg-[#111]/60 backdrop-blur-sm rounded-lg p-2.5 md:p-3 border border-[#facc15]/20">
                  <div className="flex items-center justify-center gap-1.5 text-[10px]">
                    <span className="text-[#facc15] text-sm">🔒</span>
                    <span className="text-[#facc15] font-medium">SSL Secured • Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* ==========================================
          PREMIUM PROGRESS BAR - ONLY FOR INSTANT TYPE
          ========================================== */}
      {competition.maxTickets && (
        <section className="py-6 md:py-8 relative">
          <div className="container mx-auto px-3 md:px-4 max-w-6xl">
            <InstantProgressBar competition={competition} />
          </div>
        </section>
      )}

      {/* ==========================================
          ENTRY SELECTOR SECTION
          ========================================== */}
      <section className="py-6 md:py-8 relative overflow-hidden">
        {/* Premium Dark Background with Gold Accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#1a1a1a] to-[#0A0A0A]">
          {/* Gold Glow Orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FACC15]/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: "1s"}}></div>
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(250,204,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(250,204,21,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div ref={rangeRef} className="container mx-auto px-3 md:px-4 text-center max-w-3xl relative z-10">
          
          {/* Section Title */}
          <div className="mb-6 md:mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-[#FACC15]"></div>
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-[#FACC15] fill-[#FACC15]" />
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wider uppercase">
                Select Entries
              </h2>
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-[#FACC15] fill-[#FACC15]" />
              <div className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-[#FACC15]"></div>
            </div>
            <p className="text-gray-400 text-xs md:text-sm">Choose your quantity and start playing</p>
          </div>

          {/* ========== PREMIUM BUNDLE DISCOUNT SECTION - ONLY FOR GAMES ========== */}
          {isGameType && (
            <div className="mb-6 md:mb-8">
              {/* Gold Border Wrapper */}
              <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#D97706]">
                <div className="relative bg-[#0a0a0a] rounded-2xl overflow-hidden">
                  
                  {/* Inner Gold Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FACC15]/5 via-transparent to-[#F59E0B]/5"></div>
                  
                  <div className="relative p-4 md:p-6">
                    
                    {/* Header with Crown */}
                    <div className="flex items-center justify-center gap-2 md:gap-3 mb-5">
                      <Crown className="w-5 h-5 md:w-6 md:h-6 text-[#FACC15]" />
                      <h3 className="text-base md:text-lg font-black text-[#FACC15] tracking-wider uppercase">
                        Bundle & Save
                      </h3>
                      <Crown className="w-5 h-5 md:w-6 md:h-6 text-[#FACC15]" />
                    </div>

                    {/* Discount Tier Cards - UPDATED WITH NEW SCHEME */}
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      {[
                        { qty: 10, discount: 2, icon: "⭐", label: "STARTER" },
                        { qty: 20, discount: 5, icon: "🔥", label: "POPULAR" },
                        { qty: 50, discount: 10, icon: "💎", label: "BEST VALUE" },
                      ].map((tier) => {
                        const isSelected = quantity === tier.qty;
                        const savingsAmount = ((pricePerTicket * tier.qty) * (tier.discount / 100)).toFixed(2);
                        
                        return (
                          <button
                            key={tier.qty}
                            onClick={() => setQuantity(tier.qty)}
                            className={`relative p-3 md:p-4 rounded-xl transition-all duration-300 group ${
                              isSelected
                                ? "bg-gradient-to-br from-[#FACC15] to-[#F59E0B] shadow-2xl shadow-[#FACC15]/40 scale-105 z-10"
                                : "bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-[#FACC15]/30"
                            }`}
                          >
                            {/* Selected Checkmark */}
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-black rounded-full border-2 border-[#FACC15] flex items-center justify-center shadow-lg">
                                <span className="text-[#FACC15] text-xs font-black">✓</span>
                              </div>
                            )}

                            {/* Tier Icon */}
                            <div className="text-xl md:text-2xl mb-1">{tier.icon}</div>
                            
                            {/* Quantity */}
                            <div className={`text-sm md:text-base font-bold mb-0.5 ${
                              isSelected ? "text-gray-900" : "text-white"
                            }`}>
                              {tier.qty} {competitionType === "spin" ? "Spins" : competitionType === "scratch" ? "Scratches" : competitionType === "pop" ? "Pops" : competitionType === "plinko" ? "Drops" : "Plays"}
                            </div>
                            
                            {/* Discount Percentage */}
                            <div className={`text-2xl md:text-3xl font-black mb-1 ${
                              isSelected ? "text-gray-900" : "text-[#FACC15]"
                            }`}>
                              {tier.discount}%
                            </div>
                            
                            {/* OFF Label */}
                            <div className={`text-[10px] md:text-xs font-semibold mb-2 ${
                              isSelected ? "text-gray-800" : "text-[#FACC15]/70"
                            }`}>
                              OFF
                            </div>

                            {/* Savings */}
                            <div className={`text-[10px] md:text-xs py-1 px-2 rounded-full font-semibold ${
                              isSelected 
                                ? "bg-black/30 text-gray-900" 
                                : "bg-[#FACC15]/10 text-[#FACC15]"
                            }`}>
                              Save £{savingsAmount}
                            </div>

                            {/* Label Badge */}
                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] md:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${
                              isSelected
                                ? "bg-black text-[#FACC15]"
                                : "bg-[#FACC15]/20 text-[#FACC15]/80"
                            }`}>
                              {tier.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Info */}
                    <div className="mt-4 text-center">
                      <p className="text-[10px] md:text-xs text-gray-500">
                        Discount automatically applied • Cannot be combined
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== QUANTITY SELECTOR CARD ========== */}
          <div className="relative group">
            {/* Animated Gold Border */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#D97706] rounded-2xl opacity-70 blur-sm group-hover:opacity-100 transition duration-500"></div>
            
            <div className="relative bg-[#0a0a0a] rounded-2xl p-5 md:p-8 border border-[#FACC15]/20">
              
              {/* Inner Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FACC15]/[0.03] via-transparent to-[#F59E0B]/[0.03] rounded-2xl"></div>

              <div className="relative">
                
                {isFreeGiveaway ? (
                  <div className="space-y-4">
                    {userTicketCount >= maxTicketsForGiveaway ? (
                      <div className="bg-[#FACC15]/5 border border-[#FACC15]/20 rounded-xl p-4">
                        <p className="text-[#FACC15] font-semibold text-sm">✅ You have {userTicketCount} tickets</p>
                        <p className="text-gray-500 text-xs mt-1">Maximum {maxTicketsForGiveaway} per user</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center gap-3">
                          {[1, 2].map((num) => (
                            <button
                              key={num}
                              onClick={() => setQuantity(Math.min(num, remainingTickets))}
                              disabled={num > remainingTickets}
                              className={`min-w-[100px] px-6 py-3 rounded-xl border-2 font-bold transition-all text-sm ${
                                quantity === num
                                  ? "bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 border-transparent shadow-xl shadow-[#FACC15]/30 scale-105"
                                  : num > remainingTickets
                                  ? "bg-gray-800/50 text-gray-500 border-gray-700 cursor-not-allowed"
                                  : "bg-transparent text-white border-[#FACC15]/20 hover:border-[#FACC15]/60"
                              }`}
                            >
                              {num} Ticket{num > 1 ? "s" : ""}
                            </button>
                          ))}
                        </div>
                        <p className="text-gray-400 text-xs">
                          {remainingTickets === 1 ? "1 ticket remaining" : `${remainingTickets} tickets remaining`}
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    
                    {/* Quick Select Pills - UPDATED WITH NEW VALUES */}
                    <div className="flex justify-center gap-2 flex-wrap">
                      {[1, 5, 10, 20, 30, 50].map((num) => {
                        const discount = isGameType ? getApplicableDiscount(num) : 0;
                        const pillPrice = isGameType 
                          ? (pricePerTicket * num * (1 - discount / 100)) 
                          : pricePerTicket * num;
                        
                        return (
                          <button
                            key={num}
                            onClick={() => setQuantity(num)}
                            className={`relative min-w-[65px] md:min-w-[75px] px-3 md:px-4 py-2.5 rounded-xl border-2 font-bold transition-all text-xs md:text-sm ${
                              quantity === num
                                ? "bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 border-transparent shadow-xl shadow-[#FACC15]/30 scale-105"
                                : "bg-transparent text-white border-white/10 hover:border-[#FACC15]/40 hover:bg-white/[0.03]"
                            }`}
                            data-testid={`button-quantity-${num}`}
                          >
                            <div className="text-base md:text-lg font-black">{num}</div>
                            {isGameType && discount > 0 && (
                              <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                quantity === num 
                                  ? "bg-black text-[#FACC15]" 
                                  : "bg-[#FACC15] text-black"
                              }`}>
                                -{discount}%
                              </div>
                            )}
                            <div className={`text-[9px] mt-0.5 font-medium ${
                              quantity === num ? "text-gray-800" : "text-gray-400"
                            }`}>
                              £{pillPrice.toFixed(2)}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Large Quantity Counter */}
                    <div className="text-center py-2">
                      <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#D97706] bg-clip-text text-transparent mb-1">
                        {quantity}
                      </div>
                      <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                        {competitionType === "spin" ? `Spin${quantity > 1 ? "s" : ""}` : 
                         competitionType === "scratch" ? `Scratch Card${quantity > 1 ? "s" : ""}` :
                         competitionType === "pop" ? `Pop Game${quantity > 1 ? "s" : ""}` :
                         competitionType === "plinko" ? `Plinko Drop${quantity > 1 ? "s" : ""}` :
                         competitionType === "voltz" ? `Voltz Game${quantity > 1 ? "s" : ""}` :
                         `Ticket${quantity > 1 ? "s" : ""}`}
                      </div>
                      
                      {/* Active Discount Badge */}
                      {isGameType && discountPercent > 0 && (
                        <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 bg-[#FACC15]/10 border border-[#FACC15]/30 rounded-full">
                          <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
                          <span className="text-[#FACC15] text-xs md:text-sm font-bold">
                            {discountPercent}% DISCOUNT ACTIVE
                          </span>
                        </div>
                      )}
                    </div>

                    {/* +/- Controls with Slider */}
                    <div className="flex items-center gap-4 md:gap-6">
                      <button
                        onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                        disabled={quantity <= 1}
                        className={`p-3 rounded-xl font-semibold transition-all ${
                          quantity <= 1
                            ? "bg-white/[0.03] text-gray-600 cursor-not-allowed border border-white/[0.05]"
                            : "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white hover:scale-110 shadow-lg shadow-[#F59E0B]/30"
                        }`}
                        data-testid="button-decrease"
                      >
                        <Minus className="w-5 h-5" />
                      </button>

                      {/* Premium Slider */}
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min="1"
                          max={maxTicketsAllowed}
                          value={Math.min(quantity, maxTicketsAllowed)}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="premium-slider w-full appearance-none cursor-pointer"
                          data-testid="slider-quantity"
                          style={{
                            height: "8px",
                            borderRadius: "10px",
                            background: `linear-gradient(to right, #FACC15 ${((Math.min(quantity, maxTicketsAllowed) - 1) * 100) / (maxTicketsAllowed - 1)}%, rgba(255,255,255,0.1) ${((Math.min(quantity, maxTicketsAllowed) - 1) * 100) / (maxTicketsAllowed - 1)}%)`,
                          }}
                        />
                      </div>

                      <button
                        onClick={() => setQuantity((prev) => prev + 1)}
                        className="p-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 hover:scale-110 shadow-lg shadow-[#FACC15]/30"
                        data-testid="button-increase"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* ========== TOTAL COST BREAKDOWN ========== */}
                <div className="mt-6">
                  <div className="p-4 md:p-5 bg-gradient-to-br from-[#FACC15]/5 to-[#F59E0B]/5 rounded-xl border border-[#FACC15]/20">
                    
                    {/* Main Total */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total</span>
                      <div className="text-right">
                        {isGameType && discountPercent > 0 && (
                          <span className="text-xs text-gray-500 line-through block mb-0.5">
                            £{originalPrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[#FACC15] to-[#F59E0B] bg-clip-text text-transparent">
                          £{isGameType ? discountedPrice.toFixed(2) : (pricePerTicket * quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Discount Breakdown - Only for Games - UPDATED TIERS */}
                    {isGameType && discountPercent > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#FACC15]/10">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-[#FACC15]" />
                            <span className="text-[#FACC15] font-semibold text-sm">
                              Bundle Discount ({discountPercent}%)
                            </span>
                          </div>
                          <span className="text-green-400 font-bold text-base">
                            -£{savings.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Progress to Next Tier - UPDATED WITH NEW VALUES */}
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>10 for 2%</span>
                            <span>20 for 5%</span>
                            <span>50 for 10%</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#D97706] rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((quantity / 50) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Per Entry Price */}
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                      <span>Per entry: £{pricePerTicket.toFixed(2)}</span>
                      {isGameType && discountPercent > 0 && (
                        <>
                          <span className="text-[#FACC15]">→</span>
                          <span className="text-green-400 font-semibold">
                            £{(discountedPrice / quantity).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========== CTA BUTTON ========== */}
          <div className="mt-6 relative group/cta">
            {/* Glow Effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] rounded-2xl opacity-0 group-hover/cta:opacity-40 blur-xl transition-all duration-500"></div>
            
            <button
              onClick={handleOpenQuiz}
              disabled={isSoldOut || purchaseTicketMutation.isPending || (isFreeGiveaway && !canBuyMore)}
              className={`relative w-full px-8 py-4 md:py-5 rounded-xl font-black text-base md:text-lg uppercase tracking-wider transition-all transform ${
                isSoldOut || (isFreeGiveaway && !canBuyMore)
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                  : "bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 hover:scale-[1.02] shadow-2xl shadow-[#FACC15]/30 hover:shadow-[#FACC15]/50 active:scale-[0.98]"
              } disabled:opacity-100`}
              data-testid="button-purchase"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isSoldOut ? (
                  "SOLD OUT"
                ) : purchaseTicketMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : isFreeGiveaway && !canBuyMore ? (
                  "MAX TICKETS REACHED"
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-gray-900" />
                    {competitionType === "spin" ? `BUY ${quantity} SPIN${quantity > 1 ? "S" : ""}` :
                     competitionType === "scratch" ? `BUY ${quantity} SCRATCH${quantity > 1 ? "ES" : ""}` :
                     competitionType === "pop" ? `BUY ${quantity} POP GAME${quantity > 1 ? "S" : ""}` :
                     competitionType === "plinko" ? `BUY ${quantity} PLINKO DROP${quantity > 1 ? "S" : ""}` :
                     competitionType === "voltz" ? `BUY ${quantity} VOLTZ GAME${quantity > 1 ? "S" : ""}` :
                     `ENTER NOW`}
                    <span className="text-sm font-bold opacity-75">
                      - £{isGameType ? discountedPrice.toFixed(2) : (pricePerTicket * quantity).toFixed(2)}
                    </span>
                  </>
                )}
              </span>
              
              {/* Shimmer Effect */}
              {!isSoldOut && !purchaseTicketMutation.isPending && !(isFreeGiveaway && !canBuyMore) && (
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-1000"></div>
                </div>
              )}
            </button>
          </div>
          
          {/* Savings Highlight - Only for Games */}
          {isGameType && discountPercent > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#FACC15]/5 border border-[#FACC15]/20 rounded-full">
              <Sparkles className="w-4 h-4 text-[#FACC15]" />
              <span className="text-[#FACC15] text-sm font-bold">
                YOU'RE SAVING £{savings.toFixed(2)}!
              </span>
            </div>
          )}
          
          {/* Postal Entry */}
          <div 
            className="mt-4 text-xs md:text-sm text-gray-400 hover:text-[#FACC15] cursor-pointer transition-colors inline-flex items-center gap-1"
            onClick={() => setIsPostalModalOpen(true)}
          >
            <span>📬</span>
            <span className="underline underline-offset-4">Free postal entry route</span>
          </div>
        </div>
      </section>

      {/* Add Premium Slider CSS */}
      <style>{`
        .premium-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FACC15, #F59E0B);
          cursor: pointer;
          box-shadow: 0 0 30px rgba(250, 204, 21, 0.6), 0 0 60px rgba(250, 204, 21, 0.3);
          border: 3px solid #0a0a0a;
          transition: all 0.3s ease;
        }
        .premium-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 40px rgba(250, 204, 21, 0.8), 0 0 80px rgba(250, 204, 21, 0.4);
        }
        .premium-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FACC15, #F59E0B);
          cursor: pointer;
          box-shadow: 0 0 30px rgba(250, 204, 21, 0.6), 0 0 60px rgba(250, 204, 21, 0.3);
          border: 3px solid #0a0a0a;
        }
      `}</style>

      <UserCompetitionPrizes competitionId={competition.id} />

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-gray-900 via-black to-gray-900 py-12 md:py-16 relative overflow-hidden border-t border-[#FACC15]/20">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle, #FACC15 2px, transparent 2px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-3 md:px-4 text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-black text-white mb-3 md:mb-4">
            View All Competitions
          </h2>
          <p className="text-sm md:text-lg text-gray-400 mb-6 md:mb-8 max-w-2xl mx-auto">
            Your chance to win luxury items for a fraction of the cost at RingTone Riches!
          </p>
          <button
            onClick={() => setLocation("/")}
            className="bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 px-8 py-4 rounded-xl font-black hover:from-[#FBBF24] hover:to-[#D97706] transition-all transform hover:scale-105 shadow-xl shadow-[#FACC15]/20 text-sm md:text-base uppercase tracking-wider"
          >
            🏆 View All Competitions
          </button>
        </div>
      </section>

      {/* Quiz Dialog */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="w-[90vw] max-w-sm sm:max-w-md mx-auto rounded-2xl bg-[#0a0a0a] border border-[#FACC15]/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white text-center">
              Answer to Proceed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-300 font-medium">{quizQuestion.question}</p>
            <div className="grid grid-cols-1 gap-2">
              {quizQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedAnswer(option)}
                  className={`w-full p-3 rounded-xl border-2 font-semibold transition-all ${
                    selectedAnswer === option
                      ? "bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 border-transparent"
                      : "border-white/10 text-white hover:border-[#FACC15]/40 bg-white/[0.02]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="flex justify-center">
            <Button
              disabled={!selectedAnswer}
              onClick={handleSubmitAnswer}
              className="mt-4 bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 font-bold px-8 py-2.5 rounded-xl hover:from-[#FBBF24] hover:to-[#D97706] disabled:opacity-50"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Postal Modal */}
      <Dialog open={isPostalModalOpen} onOpenChange={setIsPostalModalOpen}>
        <DialogContent className="max-w-lg bg-[#0a0a0a] border border-[#FACC15]/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white text-center">
              Postal Entry Route
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-4 text-sm leading-relaxed text-gray-300">
              <p>
                Send an unclosed postcard (standard postcard size is approx 148mm x 105mm)
                first or second class to:
              </p>
              <p className="font-semibold text-white">
                1 West Havelock Street, South Shields, Tyne and Wear, NE33 5AF.
              </p>
              <p>Include the following information:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The competition you wish to enter</li>
                <li>Your full name and postal address</li>
                <li>Your phone number and email address on your RingTone Riches account</li>
                <li>Your date of birth</li>
                <li>Your answer to the competition question</li>
                <li>Incomplete or illegible entries will be disqualified</li>
                <li>Maximum one entry per household</li>
              </ul>
              <p>
                Your entry will be subject to our{" "}
                <span className="text-[#FACC15] underline cursor-pointer">terms and conditions</span>.
              </p>
              <p className="mt-4 font-semibold text-white">
                You wake up at 7:00am and take 30 minutes to get ready. What time are you ready?
              </p>
              <p>
                A: 7:15am B: 7:20am C: 7:30am D: 7:45am
              </p>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}