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
import { Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

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

  // console.log("✅ Competition data:", competition);
  const { data: userTickets = [] } = useQuery<any[]>({
    queryKey: ["/api/user/tickets"],
    enabled: isAuthenticated,
  });

  const isSoldOut =
    competition?.maxTickets && competition.maxTickets > 0
      ? (competition.soldTickets ?? 0) >= competition.maxTickets
      : false;

  // Filter tickets for this competition
  const availableTickets = userTickets.filter(
    (ticket: any) => ticket.competitionId === id
  );


    const isFreeGiveaway = competition?.title === "💷 £500 FREE GIVEAWAY! 🎉";
    const userTicketCount = availableTickets.length;
    const maxTicketsForGiveaway = 2;
    const canBuyMore = isFreeGiveaway ? userTicketCount < maxTicketsForGiveaway : true;
    const remainingTickets = maxTicketsForGiveaway - userTicketCount;

const purchaseTicketMutation = useMutation({
  mutationFn: async (data: { competitionId: string; quantity: number }) => {
    const competitionType = competition?.type?.toLowerCase();

    if (competitionType === "spin") {
      // 🌀 Create Spin Wheel order
      const response = await apiRequest("/api/create-spin-order", "POST", data);
      return response.json();
    } 
    else if (competitionType === "scratch") {
      // 🎯 Create Scratch Card order
      const response = await apiRequest("/api/create-scratch-order", "POST", data);
      return response.json();
    }
    else if (competitionType === "pop") {
      // 🎈 Create Pop Game order
      const response = await apiRequest("/api/create-pop-order", "POST", data);
      return response.json();
    }
    else {
      // 🎟️ Regular competition - create order for billing page
      const response = await apiRequest("/api/create-competition-order", "POST", data);
      return response.json();
    }
  },

  onSuccess: (data) => {
    const competitionType = competition?.type?.toLowerCase();

    if (competitionType === "spin") {
      // ✅ Redirect to spin billing
        setLocation(`/spin-billing/${data.orderId}/${competition?.wheelType}`);
      return;
    }

    if (competitionType === "scratch") {
      // ✅ Redirect to scratch billing
      setLocation(`/scratch-billing/${data.orderId}`);
      return;
    }

    if (competitionType === "pop") {
      // ✅ Redirect to pop billing
      setLocation(`/pop-billing/${data.orderId}`);
      return;
    }

    // 🎟️ Regular competition - redirect to billing page
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



 const handlePurchase = () => {
  if (!isAuthenticated) {
    window.location.href = "/login";
    return;
  }

  if (!competition) return;

  // 🎯 Special validation for £500 FREE GIVEAWAY
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

  // 🧠 Rest of your existing validation logic...
  const type = competition.type?.toLowerCase();

  // ✅ Only check ticket limits for regular COMPETITIONS (not spin/scratch)
  if (type !== "spin" && type !== "scratch"  && type !== "pop") {
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

  // 🟢 Proceed with purchase
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
      handlePurchase(); // ✅ proceed with purchase if correct
    } else {
      setIsAnswerCorrect(false);
      toast({
        title: "Wrong Answer ❌",
        description: "That’s not correct! Try again next time.",
        variant: "destructive",
      });
      setShowQuiz(false);
    }
  };

 const scrollToRange = () => {
  if (!rangeRef.current) return;

  const top =
    rangeRef.current.getBoundingClientRect().top + window.scrollY - 180;

  window.scrollTo({ top, behavior: "smooth" });
};


  // Type-specific gradient styles - GOLD BASE with type accents
  const getGradientStyles = () => {
    const type = competition.type?.toLowerCase();
    if (type === "spin") {
      return {
        hero: "bg-gradient-to-br from-[#facc15] via-[#d946ef] to-[#facc15]",
        glow: "shadow-[0_0_60px_rgba(250,204,21,0.5)] shadow-[#facc15]/30",
        badge: "bg-gradient-to-r from-[#facc15] via-[#d946ef] to-[#facc15]",
        button: "bg-gradient-to-r from-[#facc15] via-[#d946ef] to-[#facc15] hover:from-[#fbbf24] hover:via-[#c026d3] hover:to-[#fbbf24]",
        shimmer: "from-[#facc15] via-[#d946ef] to-[#facc15]",
        accent: "rgba(217, 70, 239, 0.15)" // Magenta accent
      };
    } else if (type === "scratch") {
      return {
        hero: "bg-gradient-to-br from-[#facc15] via-[#22d3ee] to-[#facc15]",
        glow: "shadow-[0_0_60px_rgba(250,204,21,0.5)] shadow-[#facc15]/30",
        badge: "bg-gradient-to-r from-[#facc15] via-[#22d3ee] to-[#facc15]",
        button: "bg-gradient-to-r from-[#facc15] via-[#22d3ee] to-[#facc15] hover:from-[#fbbf24] hover:via-[#06b6d4] hover:to-[#fbbf24]",
        shimmer: "from-[#facc15] via-[#22d3ee] to-[#facc15]",
        accent: "rgba(34, 211, 238, 0.15)" // Cyan accent
      };
    } else {
      // Default: Premium gold for regular competitions
      return {
        hero: "bg-gradient-to-br from-[#facc15] via-[#f59e0b] to-[#d97706]",
        glow: "shadow-[0_0_60px_rgba(250,204,21,0.5)] shadow-[#facc15]/30",
        badge: "bg-gradient-to-r from-[#facc15] to-[#f59e0b]",
        button: "bg-gradient-to-r from-[#facc15] to-[#f59e0b] hover:from-[#fbbf24] hover:to-[#d97706]",
        shimmer: "from-[#facc15] via-[#fbbf24] to-[#facc15]",
        accent: "rgba(245, 158, 11, 0.15)" // Amber accent
      };
    }
  };

  const gradients = getGradientStyles();

  // Calculate urgency (for almost gone badge)
  const remainingPercentage = competition?.maxTickets
    ? ((competition.maxTickets - (competition.soldTickets ?? 0)) / competition.maxTickets) * 100
    : 100;
  const isAlmostGone = remainingPercentage < 15;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Competition Details - PREMIUM REDESIGN */}
      <section className="py-6 md:py-12 relative overflow-hidden">
        {/* Animated Background Gradient with Gold Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
          {/* Primary Gold Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#facc15]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tl from-[#f59e0b]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: "1.5s"}}></div>
          {/* Type-specific Accent Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl animate-pulse opacity-30" style={{background: gradients.accent, animationDelay: "0.7s"}}></div>
          
          {/* Floating Sparkles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#facc15] rounded-full animate-sparkle-float" style={{animationDelay: "0s"}}></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-[#fbbf24] rounded-full animate-sparkle-float" style={{animationDelay: "1.2s"}}></div>
          <div className="absolute bottom-1/4 left-1/2 w-2.5 h-2.5 bg-[#facc15] rounded-full animate-sparkle-float" style={{animationDelay: "2s"}}></div>
          <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-[#fbbf24] rounded-full animate-sparkle-float" style={{animationDelay: "0.8s"}}></div>
          <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-[#facc15] rounded-full animate-sparkle-float" style={{animationDelay: "1.6s"}}></div>
        </div>
        
        {/* CSS for Sparkle Animation */}
        <style>{`
          @keyframes sparkle-float {
            0%, 100% {
              transform: translateY(0) scale(1);
              opacity: 0.3;
            }
            25% {
              transform: translateY(-20px) scale(1.2);
              opacity: 0.7;
            }
            50% {
              transform: translateY(-30px) scale(0.8);
              opacity: 0.5;
            }
            75% {
              transform: translateY(-15px) scale(1.1);
              opacity: 0.6;
            }
          }
          
          .animate-sparkle-float {
            animation: sparkle-float 6s ease-in-out infinite;
          }
          
          @media (prefers-reduced-motion: reduce) {
            .animate-sparkle-float,
            .animate-pulse {
              animation: none;
            }
          }
        `}</style>

        <div className="container mx-auto px-3 md:px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 md:gap-12">
              {/* Left: Competition Image and Details */}
              <div className="space-y-4 md:space-y-6">
                {/* PREMIUM HERO CAROUSEL with Navigation */}
                <div className="relative group">
                  {/* Premium Glow Effect - Brand Colors */}
                  <div className="absolute -inset-3 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-700"></div>
                  
                  {/* Carousel Container with Premium Gold Border */}
                  <div className={`relative rounded-2xl overflow-hidden ${gradients.glow} shadow-2xl border-4 border-[#FACC15]/60`}>
                    <div className="overflow-hidden rounded-xl" ref={emblaRef}>
                      <div className="flex">
                        {/* Main Image Slide */}
                        <div className="flex-[0_0_100%] min-w-0">
                          <div className="relative  bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                            <img
                              src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                              alt={competition.title}
                              className="w-full h-full object-cover"
                              data-testid={`img-competition-${competition.id}`}
                            />
                            
                            {/* Light Premium Overlay Effects - Minimal */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none z-10"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(250,204,21,0.05),transparent_60%)] pointer-events-none z-10"></div>
                            
                            {/* Almost Gone Badge */}
                            {isAlmostGone && competition.maxTickets && (
                              <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-gradient-to-r from-red-600 to-pink-600 text-white px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold shadow-xl z-20">
                                ⚡ ALMOST GONE!
                              </div>
                            )}

                            {/* Trending Badge - Brand Colors */}
                            <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 bg-gradient-to-r from-[#FACC15]/95 to-[#F59E0B]/95 backdrop-blur-md text-gray-900 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold flex items-center gap-1.5 md:gap-2 shadow-xl z-20">
                              <span>🔥</span>
                              <span>Trending</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* ENHANCED Premium Competition Details Card */}
                <div className="relative group">
                  {/* Animated Border Glow - GOLD THEME */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#facc15] via-[#f59e0b] to-[#facc15] rounded-xl opacity-50 blur group-hover:opacity-75 transition duration-500"></div>
                  
                  <div className="relative bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 p-4 md:p-6 shadow-2xl overflow-hidden">
                    {/* Inner Gradient Overlay - GOLD THEME */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#facc15]/10 via-[#f59e0b]/5 to-[#d97706]/10 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg md:text-2xl font-bold mb-4 md:mb-5 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#D97706] bg-clip-text text-transparent">
                        ✨ Competition Details
                      </h3>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex justify-between items-center gap-2 bg-black/30 rounded-lg p-2.5">
                        <span className="text-gray-300 text-xs md:text-sm break-words flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]"></span>
                          Type
                        </span>
                        <span className={`capitalize font-bold text-xs md:text-sm ${gradients.badge} text-white px-3 py-1.5 rounded-full break-words shadow-lg`} style={{ wordBreak: "break-word" }}>
                          {competition.type === "spin"
                            ? "🎡 Spin Wheel"
                            : competition.type === "scratch"
                            ? "🎫 Scratch Card"
                            : competition.type === "pop"  // 🎈 Add this
                            ? "🎈 Pop Balloon"
                            : "🏆 Competition"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2 bg-black/30 rounded-lg p-2.5">
                        <span className="text-gray-300 text-xs md:text-sm break-words flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]"></span>
                          Price per Entry
                        </span>
                        <span className="font-bold text-[#facc15] text-base md:text-lg break-words drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ wordBreak: "break-word" }}>
                          £{parseFloat(competition.ticketPrice).toFixed(2)}
                        </span>
                      </div>
                      {competition.maxTickets && (
                        <div className="space-y-2 bg-black/30 rounded-lg p-2.5">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-300 text-xs md:text-sm break-words flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]"></span>
                              Progress
                            </span>
                            <span className="text-xs md:text-sm text-white font-medium break-words" style={{ wordBreak: "break-word" }}>
                              {competition.soldTickets} / {competition.maxTickets} sold
                            </span>
                          </div>
                          <div className="progress-bar relative h-3 bg-gray-800/50 rounded-full overflow-hidden border border-[#facc15]/20">
                            <div
                              className={`progress-fill h-full ${gradients.hero} transition-all duration-500 relative`}
                              style={{ width: `${progressPercentage}%` }}
                            >
                              {/* Shimmer Effect */}
                              <div className={`absolute inset-0 bg-gradient-to-r ${gradients.shimmer} opacity-50 animate-pulse`}></div>
                            </div>
                          </div>
                          <p className="text-xs text-center break-words leading-snug font-medium" style={{ wordBreak: "break-word", hyphens: "auto", color: remainingPercentage < 15 ? "#facc15" : "#9ca3af" }}>
                            {remainingPercentage < 15 ? "⚡ Less than 15% remaining!" : `${Math.round(remainingPercentage)}% available`}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ENHANCED Trust Badges - GOLD THEME */}
                    <div className="mt-5 md:mt-6 pt-4 border-t border-[#facc15]/20 grid grid-cols-2 gap-3">
                      <div className="relative group/badge">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#facc15] to-[#f59e0b] rounded-lg opacity-0 group-hover/badge:opacity-20 transition duration-300"></div>
                        <div className="relative flex flex-col items-center gap-2 text-center bg-gradient-to-br from-[#facc15]/10 to-transparent rounded-lg p-3 border border-[#facc15]/30 hover:border-[#facc15]/60 transition group-hover/badge:scale-105 transform">
                          <span className="text-2xl">🔒</span>
                          <span className="text-[10px] md:text-xs font-bold bg-gradient-to-r from-[#facc15] to-[#f59e0b] bg-clip-text text-transparent">Secure Payment</span>
                        </div>
                      </div>
                      <div className="relative group/badge">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#facc15] to-[#f59e0b] rounded-lg opacity-0 group-hover/badge:opacity-20 transition duration-300"></div>
                        <div className="relative flex flex-col items-center gap-2 text-center bg-gradient-to-br from-[#facc15]/10 to-transparent rounded-lg p-3 border border-[#facc15]/30 hover:border-[#facc15]/60 transition group-hover/badge:scale-105 transform">
                          <span className="text-2xl">✓</span>
                          <span className="text-[10px] md:text-xs font-bold bg-gradient-to-r from-[#facc15] to-[#f59e0b] bg-clip-text text-transparent">Fair Draw</span>
                        </div>
                      </div>
                      <div className="relative group/badge">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#facc15] to-[#f59e0b] rounded-lg opacity-0 group-hover/badge:opacity-20 transition duration-300"></div>
                        <div className="relative flex flex-col items-center gap-2 text-center bg-gradient-to-br from-[#facc15]/10 to-transparent rounded-lg p-3 border border-[#facc15]/30 hover:border-[#facc15]/60 transition group-hover/badge:scale-105 transform">
                          <span className="text-2xl">⚡</span>
                          <span className="text-[10px] md:text-xs font-bold bg-gradient-to-r from-[#facc15] to-[#f59e0b] bg-clip-text text-transparent">Quick Entry</span>
                        </div>
                      </div>
                      <div className="relative group/badge">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#facc15] to-[#f59e0b] rounded-lg opacity-0 group-hover/badge:opacity-20 transition duration-300"></div>
                        <div className="relative flex flex-col items-center gap-2 text-center bg-gradient-to-br from-[#facc15]/10 to-transparent rounded-lg p-3 border border-[#facc15]/30 hover:border-[#facc15]/60 transition group-hover/badge:scale-105 transform">
                          <span className="text-2xl">🏆</span>
                          <span className="text-[10px] md:text-xs font-bold bg-gradient-to-r from-[#facc15] to-[#f59e0b] bg-clip-text text-transparent">Real Winners</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              {/* Right: PREMIUM Purchase Form */}
              <div className="space-y-4 md:space-y-6">
                {/* Premium Card with Glassmorphism */}
                <div className="relative group">
                  {/* Animated Border - GOLD THEME */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#facc15] via-[#f59e0b] to-[#facc15] rounded-xl opacity-30 blur group-hover:opacity-50 transition duration-500"></div>
                  
                  <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4 md:p-8 overflow-hidden shadow-2xl">
                    {/* Background Glow Effect - GOLD THEME */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#facc15]/5 via-[#f59e0b]/5 to-[#d97706]/5"></div>
                    
                    <div className="relative z-10">
                      
                        <div className="mb-5">
                          <CountdownTimer 
                            endDate={competition.endDate}
                          />
                        </div>
                      
                      
                      {/* PREMIUM Eye-Catching Title - Mobile Optimized */}
                      <div className="relative mb-4 md:mb-5">
                        {/* Subtle glow behind text */}
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
                        
                        {/* Premium underline accent */}
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

                      {/* Monthly Draw Info for Spin & Scratch Cards */}
                      {(competition.type === "spin" || competition.type === "scratch" || competition.type === "pop") && (
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
                                  All {competition.type === "spin" 
                                  ? "spin wheel" 
                                  : competition.type === "scratch" 
                                  ? "scratch card" 
                                  : "pop balloon"} entries automatically enter our monthly £100 cash draw! 
                              Winners are selected manually via Facebook or TikTok using your unique entry numbers. 
                              The more entries you have, the better your chances!
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center justify-between text-lg md:text-xl font-bold">
                        <span className="break-words" style={{ wordBreak: "break-word" }}>
                          £{parseFloat(competition.ticketPrice).toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground font-normal break-words" style={{ wordBreak: "break-word" }}>
                          per entry
                        </span>
                      </div>

                      {/* Total Cost Box - PURE GOLD THEME */}
                      <div className="bg-gradient-to-br from-[#facc15] via-[#f59e0b] to-[#d97706] rounded-lg p-3 md:p-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-medium text-gray-900 text-sm break-words" style={{ wordBreak: "break-word" }}>Total</span>
                          <span className="text-lg md:text-xl font-bold text-gray-900 break-words" style={{ wordBreak: "break-word" }}>
                            £{totalPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] md:text-xs text-gray-900/90 mt-1.5 break-words leading-snug font-semibold" style={{ wordBreak: "break-word", hyphens: "auto" }}>
                          ✓ FREE DIGITAL ENTRY SLIPS
                        </p>
                        <p className="text-[10px] text-gray-900/75 break-words leading-snug" style={{ wordBreak: "break-word", hyphens: "auto" }}>
                          For every entry purchased, you will be allocated a ticket number for the live draw.
                        </p>
                      </div>

                      {availableTickets.length > 0 && competition.type !== "spin" && competition.type !== "scratch" && competition.type !== "pop" ? (
                        <div className="space-y-2.5 md:space-y-3">
                          {/* Existing Tickets Badge - GOLD THEME */}
                          <div className="bg-gradient-to-r from-[#facc15]/20 to-[#f59e0b]/20 border border-[#facc15]/30 rounded-lg p-2.5 md:p-3 text-center">
                            <p className="bg-gradient-to-r from-[#facc15] to-[#f59e0b] bg-clip-text text-transparent font-bold text-xs break-words leading-tight" style={{ wordBreak: "break-word" }}>
                              ✅ You have {availableTickets.length} Tickets
                            </p>
                          </div>

                          {/* Buy More Button - GOLD THEME */}
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
                            <span className="break-words" style={{ wordBreak: "break-word" }}>
                              {isSoldOut
                                ? "SOLD OUT"
                                : purchaseTicketMutation.isPending
                                ? "Processing..."
                                : "BUY MORE TICKETS"}
                            </span>
                          </button>
                        </div>
                      ) : (
                        /* Buy Now Button - GOLD THEME */
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
                          <span className="break-words" style={{ wordBreak: "break-word" }}>
                            {isSoldOut
                              ? "SOLD OUT"
                              : purchaseTicketMutation.isPending
                              ? "Processing..."
                              : "BUY NOW 🚀"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                </div>

                {/* User Balance (if authenticated) - GOLD THEME */}
                {isAuthenticated && user && (
                  <div className="bg-gradient-to-r from-[#facc15] to-[#f59e0b] rounded-lg p-3 md:p-4 text-center text-gray-900 shadow-lg">
                    <h3 className="font-bold mb-1.5 text-xs md:text-sm break-words leading-tight" style={{ wordBreak: "break-word" }}>💰 Your Wallet Balance</h3>
                    <p className="text-xl md:text-2xl font-bold break-words" style={{ wordBreak: "break-word" }}>
                      £{parseFloat(user.balance || "0").toFixed(2)}
                    </p>
                    <p className="text-[10px] mt-0.5 opacity-90 break-words leading-tight" style={{ wordBreak: "break-word" }}>Available for instant checkout</p>
                  </div>
                )}

                {/* Security Badge - COMPACT */}
                <div className="bg-[#111]/60 backdrop-blur-sm rounded-lg p-2.5 md:p-3 border border-[#facc15]/20">
                  <div className="flex items-center justify-center gap-1.5 text-[10px]">
                    <span className="text-[#facc15] text-sm">🔒</span>
                    <span className="break-words leading-tight text-[#facc15] font-medium" style={{ wordBreak: "break-word" }}>SSL Secured • Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 🎯 PREMIUM Entry Selector with Gold Theme */}
<section  className="py-6 md:py-8 relative overflow-hidden">
  {/* Enhanced Gold Background */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
    {/* Gold Glow Orbs */}
    <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-[#facc15]/25 to-transparent rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#f59e0b]/25 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: "1s"}}></div>
    {/* Type-specific Accent */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-20" style={{background: gradients.accent}}></div>
    
    {/* Floating Sparkles */}
    <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-[#facc15] rounded-full animate-sparkle-float" style={{animationDelay: "0.3s"}}></div>
    <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-[#fbbf24] rounded-full animate-sparkle-float" style={{animationDelay: "1.5s"}}></div>
    <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-[#facc15] rounded-full animate-sparkle-float" style={{animationDelay: "2.2s"}}></div>
  </div>

  <div
  ref={rangeRef}
  className="container mx-auto px-3 md:px-4 text-center max-w-3xl relative z-10 "
>

    {/* Compact Header with Gradient Text - Brand Colors */}
    <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#D97706] bg-clip-text text-transparent break-words leading-tight" style={{ wordBreak: "break-word" }}>
      ⚡ Select Your Entries
    </h2>

    {/* Eye-Catching Glassmorphism Card - BRAND COLORS */}
    <div className="relative group">
      {/* Animated Border Gradient - NO PULSE, Brand Colors */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#D97706] rounded-2xl opacity-75 blur group-hover:opacity-100 transition duration-500"></div>
      
      <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-[#FACC15]/20">
        {/* Special case for £500 FREE GIVEAWAY */}
        {isFreeGiveaway ? (
          <div className="space-y-3 md:space-y-4">
            {userTicketCount >= maxTicketsForGiveaway ? (
              <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-3 md:p-4">
                <p className="text-yellow-200 font-semibold text-xs md:text-sm">
                  ✅ You already have {userTicketCount} tickets
                </p>
                <p className="text-yellow-300 text-[10px] md:text-xs mt-1">
                  Maximum {maxTicketsForGiveaway} tickets per user
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
                  {[1, 2].map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuantity(Math.min(num, remainingTickets))}
                      disabled={num > remainingTickets}
                      className={`min-w-[80px] md:min-w-[100px] px-4 md:px-6 py-2.5 md:py-3 rounded-lg border-2 font-bold transition-all text-sm md:text-base ${
                        quantity === num
                          ? "bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 border-transparent shadow-lg shadow-[#FACC15]/50 scale-105"
                          : num > remainingTickets
                          ? "bg-gray-400/20 text-gray-400 border-gray-400/30 cursor-not-allowed"
                          : "bg-white/10 text-white border-[#FACC15]/30 hover:bg-[#FACC15]/10 hover:border-[#FACC15]/60 hover:scale-105"
                      }`}
                    >
                      {num} {competition.type === "spin" ? "Spin" : competition.type === "scratch" ? "Scratch" : "Ticket"}{num > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
                <div className="text-xs md:text-sm text-white/80 mt-2">
                  {remainingTickets === 1 
                    ? "You can buy 1 more ticket"
                    : `You can buy up to ${remainingTickets} tickets`
                  }
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 md:space-y-5">
            {/* Quick Select Pills - Brand Colors */}
            <div className="flex justify-center gap-2 flex-wrap">
              {[1, 3, 5, 10, 25].map((num) => (
                <button
                  key={num}
                  onClick={() => setQuantity(num)}
                  className={`min-w-[60px] md:min-w-[70px] px-3 md:px-4 py-2 md:py-2.5 rounded-lg border-2 font-bold transition-all text-xs md:text-sm ${
                    quantity === num
                      ? "bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 border-transparent shadow-lg shadow-[#FACC15]/50 scale-105"
                      : "bg-white/10 text-white border-[#FACC15]/20 hover:bg-[#FACC15]/10 hover:border-[#FACC15]/60 hover:scale-105"
                  }`}
                  data-testid={`button-quantity-${num}`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Counter Display - Brand Colors */}
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#D97706] bg-clip-text text-transparent mb-2">
                {quantity}
              </div>
              <div className="text-sm md:text-base text-white/80">
                {competition.type === "spin" ? "Spin" : competition.type === "scratch" ? "Scratch" : "Ticket"}{quantity > 1 ? "s" : ""}
              </div>
            </div>

            {/* +/- Buttons - Brand Colors */}
            <div className="flex justify-center items-center gap-4 md:gap-6">
              <button
                onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                disabled={quantity <= 1}
                className={`p-2.5 md:p-3 rounded-full font-semibold transition-all ${
                  quantity <= 1
                    ? "bg-gray-600/30 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white hover:scale-110 shadow-lg shadow-[#F59E0B]/50"
                }`}
                data-testid="button-decrease"
              >
                <Minus className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Slider - Brand Color */}
              <input
                type="range"
                min="1"
                max="1000"
                value={Math.min(quantity, 1000)}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="slider-thumb flex-1 max-w-[200px] md:max-w-[300px] appearance-none cursor-pointer"
                data-testid="slider-quantity"
                style={{
                  height: "10px",
                  borderRadius: "10px",
                  background: `linear-gradient(to right, #FACC15 ${
                    ((Math.min(quantity, 1000) - 1) * 100) / (1000 - 1)
                  }%, rgba(255,255,255,0.2) ${((Math.min(quantity, 1000) - 1) * 100) / (1000 - 1)}%)`,
                }}
              />

              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="p-2.5 md:p-3 rounded-full font-semibold transition-all bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 hover:scale-110 shadow-lg shadow-[#FACC15]/50"
                data-testid="button-increase"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Total Cost - Brand Colors */}
        <div className="mt-4 md:mt-5 p-3 md:p-4 bg-gradient-to-r from-[#FACC15]/10 to-[#F59E0B]/10 rounded-lg border border-[#FACC15]/30 shadow-lg shadow-[#FACC15]/20">
          <div className="flex justify-between items-center">
            <div className="text-white/90 text-xs md:text-sm font-medium">Total Cost</div>
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#FACC15] to-[#F59E0B] bg-clip-text text-transparent">
              £{(parseFloat(competition.ticketPrice) * quantity).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Eye-Catching CTA Button with Microinteractions */}
    <div className="mt-4 md:mt-5 relative group/cta">
      {/* Animated Glow Effect on Hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#facc15] via-[#f59e0b] to-[#facc15] rounded-xl opacity-0 group-hover/cta:opacity-75 blur transition-all duration-300"></div>
      
      <button
        onClick={handleOpenQuiz}
        disabled={isSoldOut || purchaseTicketMutation.isPending || (isFreeGiveaway && !canBuyMore)}
        className={`relative w-full px-6 py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all transform ${
          isSoldOut || (isFreeGiveaway && !canBuyMore)
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-[#facc15] to-[#f59e0b] text-gray-900 hover:scale-[1.03] shadow-lg shadow-[#facc15]/50 hover:shadow-2xl hover:shadow-[#facc15]/70 active:scale-[0.98]"
        } disabled:opacity-50`}
        data-testid="button-purchase"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isSoldOut
            ? "SOLD OUT"
            : purchaseTicketMutation.isPending
            ? "Processing..."
            : isFreeGiveaway && !canBuyMore
            ? "MAX TICKETS REACHED"
            : competition.type === "spin"
            ? "🎡 BUY SPINS NOW"
            : competition.type === "scratch"
            ? "🎫 BUY SCRATCHES NOW"
             : competition.type === "pop"  // 🎈 Add this
    ? "🎈 BUY POP GAMES NOW"
            : "🚀 ENTER NOW"}
        </span>
        {/* Shimmer effect on button */}
        {!isSoldOut && !purchaseTicketMutation.isPending && !(isFreeGiveaway && !canBuyMore) && (
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-1000"></div>
          </div>
        )}
      </button>
    </div>
    
    <div className="mt-3 text-xs md:text-sm text-[#FACC15] underline cursor-pointer hover:text-[#F59E0B] transition-colors text-center"
      onClick={() => setIsPostalModalOpen(true)}>
      📬 Free postal entry route
    </div>
  </div>
</section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 py-12 md:py-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-3 md:px-4 text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4 break-words leading-tight" style={{ wordBreak: "break-word" }}>
            View all competitions
          </h2>
          <p className="text-sm md:text-xl text-gray-200 mb-6 md:mb-8 break-words leading-snug max-w-2xl mx-auto" style={{ wordBreak: "break-word", hyphens: "auto" }}>
            This is your chance to win luxury items for a fraction of the cost here at RingTone Riches!
          </p>
          <button
            onClick={() => setLocation("/")}
            className="bg-white text-gray-900 px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg text-sm md:text-base break-words"
            style={{ wordBreak: "break-word" }}
          >
            🏆 VIEW ALL COMPETITIONS
          </button>
        </div>
      </section>
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="w-[90vw] max-w-sm sm:max-w-md mx-auto flex flex-col justify-center items-center text-center rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Answer to Proceed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center font-medium">{quizQuestion.question}</p>
            <div className="grid grid-cols-1 gap-2">
              {quizQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedAnswer(option)}
                  className={`w-full p-3 rounded-lg border ${
                    selectedAnswer === option
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
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
              className="mt-4"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
              {/* 🔸 Modal */}
      <Dialog open={isPostalModalOpen} onOpenChange={setIsPostalModalOpen}>
        <DialogContent className="max-w-lg text-left">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Postal Entry Route
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-4 text-sm leading-relaxed text-foreground">
              <p>
                Send an unclosed postcard (standard postcard size is approx 148mm x 105mm)
                first or second class to:
              </p>
              <p className="font-semibold">
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
                <span className="text-primary underline cursor-pointer">terms and conditions</span>.
              </p>

              <p className="mt-4 font-semibold">
               You wake up at 7:00am and take 30 minutes to get ready. What time are you ready?
              </p>
              <p>
               A: 7:15am B: 7:20am C: 7:30am D: 7:45am
              </p>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
      {/* <Testimonials /> */}
      <Footer />
    </div>
  );
}