import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
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
import { Minus, Plus, Sparkles, Zap, Crown, Ticket, Trophy, Lock, Mail } from "lucide-react";
import UserCompetitionPrizes from "./user-competition-prizes";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import ChaserBorder from "@/components/home/ChaserBorder";
import QuantitySelector from "@/components/home/QuantitySelector";
import CountdownBlocks from "@/components/home/CountdownBlocks";
import SoldProgress from "@/components/home/SoldProgress";
import CommunitySection from "@/components/home/CommunitySection";
import { useCountdown } from "@/hooks/useCountdown";
import {
  getCompetitionTypeConfig,
  getFallbackImage,
  getPrizeDisplay,
  getStatusBadge,
  getTicketStats,
} from "@/lib/competition-display";

function InstantProgressBar({ competition }: { competition: Competition }) {
  const sold = competition.soldTickets ?? 0;
  const total = competition.maxTickets ?? 0;
  const remaining = total - sold;
  const percentage = total > 0 ? (sold / total) * 100 : 0;
  const isAlmostFull = percentage > 85;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A0A0D] p-5 md:p-7">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F1D47A]">Ticket pool</p>
          <p className="mt-1 font-prize text-3xl text-white">{percentage.toFixed(1)}% sold</p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-white/50">
          {total.toLocaleString()} capacity
        </p>
      </div>
      <SoldProgress pct={percentage} sold={sold} remaining={remaining} maxT={total} showRemaining />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3">
        <p className="text-xs text-white/50">
          {remaining === 0
            ? "All tickets sold. Winner announcement coming soon."
            : remaining < 50
              ? `Only ${remaining.toLocaleString()} tickets remaining.`
              : `${remaining.toLocaleString()} spots left.`}
        </p>
        {isAlmostFull && remaining > 0 && (
          <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-[#FF263D]">
            Last chance
          </span>
        )}
      </div>
    </div>
  );
}

function playNoun(type: string, quantity: number, mode: "cta" | "label" = "label") {
  const many = quantity !== 1;
  if (mode === "cta") {
    if (type === "spin") return `BUY ${quantity} SPIN${many ? "S" : ""}`;
    if (type === "scratch") return `BUY ${quantity} SCRATCH${many ? "ES" : ""}`;
    if (type === "pop") return `BUY ${quantity} POP GAME${many ? "S" : ""}`;
    if (type === "plinko") return `BUY ${quantity} PLINKO DROP${many ? "S" : ""}`;
    if (type === "voltz") return `BUY ${quantity} VOLTZ GAME${many ? "S" : ""}`;
    if (type === "slot") return `BUY ${quantity} SLOT GAME${many ? "S" : ""}`;
    if (type === "royal") return `BUY ${quantity} ROYAL GAME${many ? "S" : ""}`;
    return "ENTER NOW";
  }
  if (type === "spin") return many ? "Spins" : "Spin";
  if (type === "scratch") return many ? "Scratch Cards" : "Scratch Card";
  if (type === "pop") return many ? "Pop Games" : "Pop Game";
  if (type === "plinko") return many ? "Plinko Drops" : "Plinko Drop";
  if (type === "voltz") return many ? "Voltz Games" : "Voltz Game";
  if (type === "slot") return many ? "Slot Games" : "Slot Game";
  if (type === "royal") return many ? "Royal Games" : "Royal Game";
  return many ? "Tickets" : "Ticket";
}

const PROCESS_STEPS = [
  { n: "01", title: "PICK YOUR PRIZE", body: "You're on it. Confirm this is the draw or game you want.", Icon: Trophy },
  { n: "02", title: "SECURE YOUR ENTRY", body: "Choose quantity and enter through checkout. Same price, same tickets.", Icon: Ticket },
  { n: "03", title: "PLAY · DRAW · CLAIM", body: "Instant games play at once. Prize draws land when the competition closes.", Icon: Zap },
] as const;

// Discount calculation utility - ONLY for game types
const TICKET_DISCOUNTS: Record<number, number> = {
  5: 0.05,
  10: 0.10,
  15: 0.15,
};

const GAME_TYPES = ["spin", "scratch", "pop", "plinko", "voltz", "slot", "royal"];

function calculateDiscountedPrice(basePrice: number, quantity: number) {
  const originalPrice = basePrice * quantity;
  const cappedQuantity = Math.min(quantity, 15);
  
  const sortedTiers = Object.keys(TICKET_DISCOUNTS)
    .map(Number)
    .sort((a, b) => b - a);
  
  let discountPercent = 0;
  for (const tier of sortedTiers) {
    if (cappedQuantity >= tier) {
      discountPercent = TICKET_DISCOUNTS[tier];
      break;
    }
  }
  
  const discountedPlaysPrice = (basePrice * Math.min(quantity, 15)) * (1 - discountPercent);
  const fullPricePlays = quantity > 15 ? basePrice * (quantity - 15) : 0;
  const discountedPrice = discountedPlaysPrice + fullPricePlays;
  const savings = originalPrice - discountedPrice;
  
  return {
    originalPrice: parseFloat(originalPrice.toFixed(2)),
    discountPercent: discountPercent * 100,
    discountedPrice: parseFloat(discountedPrice.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
  };
}

function getApplicableDiscount(quantity: number): number {
  const cappedQuantity = Math.min(quantity, 15);
  const sortedTiers = Object.keys(TICKET_DISCOUNTS)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const tier of sortedTiers) {
    if (cappedQuantity >= tier) {
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
  const [quantity, setQuantity] = useState(1);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isPostalModalOpen, setIsPostalModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qty = parseInt(params.get("qty") || "", 10);
    if (Number.isFinite(qty) && qty >= 1) {
      setQuantity(qty);
    }
  }, []);
  
  const quizQuestion = {
    question: "You wake up at 7:00am and take 30 minutes to get ready. What time are you ready?",
    options: ["7:15am", "7:25am", "7:30am", "7:45am"],
    correct: "7:30am",
  };

  const handleOpenQuiz = () => {
    if (!isGameType) {
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setShowQuiz(true);
    } else {
      handlePurchase();
    }
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

  const { data: ticketSettings } = useQuery({
    queryKey: ["/api/public/max-tickets"],
    queryFn: () => fetch("/api/public/max-tickets").then((res) => res.json()),
  });

  const maxTicketsAllowed = ticketSettings?.maxTicketsPerOrder || 500;
  const countdown = useCountdown(competition?.endDate);

  // ✅ FIXED: Pass competition image through order creation
  const purchaseTicketMutation = useMutation({
    mutationFn: async (data: { competitionId: string; quantity: number }) => {
      const payload = {
        ...data,
        competitionImage: competition?.imageUrl // ✅ Pass the image
      };

      if (competitionType === "spin") {
        const response = await apiRequest("/api/create-spin-order", "POST", payload);
        return response.json();
      } 
      else if (competitionType === "scratch") {
        const response = await apiRequest("/api/create-scratch-order", "POST", payload);
        return response.json();
      }
      else if (competitionType === "pop") {
        const response = await apiRequest("/api/create-pop-order", "POST", payload);
        return response.json();
      }
      else if (competitionType === "plinko") {
        const response = await apiRequest("/api/create-plinko-order", "POST", payload);
        return response.json();
      }
      else if (competitionType === "voltz") {
        const response = await apiRequest("/api/create-voltz-order", "POST", payload);
        return response.json();
      }
      else if (competitionType === "slot") {
        const response = await apiRequest("/api/create-slot-order", "POST", payload);
        return response.json();
      }
      else if (competitionType === "royal") {
        const response = await apiRequest("/api/create-royal-order", "POST", payload);
        return response.json();
      }
      else {
        const response = await apiRequest("/api/create-competition-order", "POST", payload);
        return response.json();
      }
    },

    // ✅ FIXED: Pass image in URL when navigating
    onSuccess: (data) => {
      const imageParam = competition?.imageUrl ? `?image=${encodeURIComponent(competition.imageUrl)}` : '';
      
      // Store in localStorage as backup
      if (competition?.imageUrl) {
        localStorage.setItem(`competition_image_${data.orderId}`, competition.imageUrl);
      }

      if (competitionType === "spin") {
        setLocation(`/spin-billing/${data.orderId}/${competition?.wheelType}${imageParam}`);
        return;
      }
      if (competitionType === "scratch") {
        setLocation(`/scratch-billing/${data.orderId}${imageParam}`);
        return;
      }
      if (competitionType === "pop") {
        setLocation(`/pop-billing/${data.orderId}${imageParam}`);
        return;
      }
      if (competitionType === "plinko") {
        setLocation(`/plinko-billing/${data.orderId}${imageParam}`);
        return;
      }
      if (competitionType === "voltz") {
        setLocation(`/voltz-billing/${data.orderId}${imageParam}`);
        return;
      }
      if (competitionType === "slot") {
        setLocation(`/slot-billing/${data.orderId}${imageParam}`);
        return;
      }
      if (competitionType === "royal") {
        setLocation(`/royal-billing/${data.orderId}${imageParam}`);
        return;
      }
      setLocation(`/checkout/${data.orderId}${imageParam}`);
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

  if (isLoading) {
    return (
      <div className="rr-competition rr-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
        <DigitalAtmosphere />
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-[#C8102E] border-t-transparent"
            aria-label="Loading"
          />
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="rr-competition rr-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
        <DigitalAtmosphere />
        <Header />
        <div className="relative z-10 mx-auto max-w-lg px-4 py-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">Not found</p>
          <h1 className="mt-3 font-prize text-4xl text-white">Competition gone</h1>
          <p className="mt-3 text-sm text-white/50">
            The competition you're looking for doesn't exist or is no longer live.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="rr-cta mt-8 inline-flex h-12 items-center justify-center rounded-xl px-7 text-sm font-black uppercase tracking-[0.14em]"
          >
            Back to competitions
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

  const remainingPercentage = competition?.maxTickets
    ? ((competition.maxTickets - (competition.soldTickets ?? 0)) / competition.maxTickets) * 100
    : 100;
  const isAlmostGone = remainingPercentage < 15;
  const typeCfg = getCompetitionTypeConfig(competitionType);
  const TypeIcon = typeCfg.Icon;
  const prizeMeta = getPrizeDisplay(competition);
  const stats = getTicketStats(competition);
  const statusBadge = getStatusBadge(stats);

  const pricePerTicket = parseFloat(competition.ticketPrice);
  
  const { originalPrice, discountPercent, discountedPrice, savings } = 
    isGameType ? calculateDiscountedPrice(pricePerTicket, quantity) : 
    { originalPrice: pricePerTicket * quantity, discountPercent: 0, discountedPrice: pricePerTicket * quantity, savings: 0 };

  const displayTotal = isGameType ? discountedPrice : pricePerTicket * quantity;
  const purchaseLocked = isSoldOut || purchaseTicketMutation.isPending || (isFreeGiveaway && !canBuyMore);
  const ctaLabel = isSoldOut
    ? "SOLD OUT"
    : purchaseTicketMutation.isPending
      ? "Processing..."
      : isFreeGiveaway && !canBuyMore
        ? "MAX TICKETS REACHED"
        : playNoun(competitionType, quantity, "cta");

  return (
    <div className="rr-competition rr-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <DigitalAtmosphere />
      <Header />

      <section className="relative z-10 pb-8 pt-4 sm:pt-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ChaserBorder variant="featured" className="rounded-2xl lg:rounded-3xl">
          <div className="overflow-hidden rounded-2xl bg-[#0A0A0D] lg:rounded-3xl">
            <div className="grid lg:grid-cols-2">
              <div className="relative min-h-[240px] overflow-hidden sm:min-h-[380px] lg:min-h-[560px]">
                <img
                  src={competition.imageUrl || getFallbackImage(competitionType)}
                  alt={competition.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  data-testid={`img-competition-${competition.id}`}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallbackApplied === "1") return;
                    img.dataset.fallbackApplied = "1";
                    img.src = getFallbackImage(competitionType);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0D] via-transparent to-black/20 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0A0A0D]/80" />
                <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8102E]/50 bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF263D]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF263D]" />
                    {statusBadge}
                  </span>
                  {isAlmostGone && stats.hasTickets && !stats.isClosed && (
                    <span className="rounded-full bg-[#C8102E] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                      Selling fast
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
                <div className="mb-3 inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-black/40 px-3 py-1">
                  <TypeIcon className="h-3.5 w-3.5 text-[#F1D47A]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F1D47A]">
                    {typeCfg.label}
                  </span>
                </div>

                {prizeMeta.prizeDisplay && (
                  <p className="font-prize text-4xl leading-none text-[#F1D47A] sm:text-5xl">
                    {prizeMeta.prizeDisplay}
                  </p>
                )}

                <h1
                  className="mt-2 font-prize text-2xl leading-tight text-white sm:text-3xl lg:text-4xl"
                  data-testid={`heading-${competition.id}`}
                >
                  {competition.title}
                </h1>

                {competition.description?.trim() ? (
                  <p className="mt-3 max-h-24 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-white/55">
                    {competition.description}
                  </p>
                ) : null}

                <div className="mt-5">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    Draw closes
                  </p>
                  <CountdownBlocks time={countdown} size="lg" ended={stats.isExpired} />
                </div>

                {stats.hasTickets && (
                  <div className="mt-5">
                    <SoldProgress
                      pct={stats.pct}
                      sold={stats.soldT}
                      remaining={stats.remaining}
                      maxT={stats.maxT}
                      showRemaining
                    />
                  </div>
                )}

                {isGameType && (
                  <div className="mt-4 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-3 py-2.5 text-sm text-white/70">
                    <span className="font-black text-[#F1D47A]">£100 cash draw every month.</span>{" "}
                    Every entry is in automatically.
                  </div>
                )}

                <div className="mt-6 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Per entry</p>
                    <p className="font-prize text-3xl text-white">£{pricePerTicket.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Total</p>
                    {isGameType && discountPercent > 0 && (
                      <p className="text-xs text-white/35 line-through">£{originalPrice.toFixed(2)}</p>
                    )}
                    <p className="font-prize text-3xl text-[#F1D47A]">£{displayTotal.toFixed(2)}</p>
                  </div>
                </div>

                {isGameType && discountPercent > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#F1D47A]">
                    <Sparkles className="h-3.5 w-3.5" />
                    {discountPercent}% bundle off · save £{savings.toFixed(2)}
                  </div>
                )}

                {!isFreeGiveaway && (
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-widest text-white/45">Quantity</span>
                    <QuantitySelector
                      value={quantity}
                      min={1}
                      max={maxTicketsAllowed}
                      onChange={setQuantity}
                      disabled={stats.isClosed}
                      size="lg"
                    />
                  </div>
                )}

                {availableTickets.length > 0 && !isGameType && (
                  <p className="mt-3 text-center text-xs font-semibold text-[#F1D47A]">
                    You already have {availableTickets.length} ticket{availableTickets.length === 1 ? "" : "s"}
                  </p>
                )}

                <button
                  onClick={handleOpenQuiz}
                  disabled={purchaseLocked}
                  className={`rr-cta mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-[0.14em] ${
                    isSoldOut || (isFreeGiveaway && !canBuyMore) ? "opacity-50" : ""
                  }`}
                  data-testid="button-purchase"
                >
                  {purchaseTicketMutation.isPending ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {ctaLabel}
                  {!purchaseLocked && (
                    <span className="text-xs font-bold opacity-80">· £{displayTotal.toFixed(2)}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={scrollToRange}
                  className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-[#F1D47A]"
                >
                  More quantities & bundles
                </button>

                {isAuthenticated && user && (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Wallet</span>
                    <span className="font-prize text-xl text-white">
                      £{parseFloat(user.balance || "0").toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                  <Lock className="h-3 w-3 text-[#F1D47A]" />
                  SSL secured · Encrypted checkout
                </div>
              </div>
            </div>
          </div>
          </ChaserBorder>
        </div>
      </section>

      {competition.maxTickets ? (
        <section className="relative z-10 py-4 sm:py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <InstantProgressBar competition={competition} />
          </div>
        </section>
      ) : null}

      {competitionType === "instant" && videoUrl && (
        <section className="relative z-10 py-2">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video controls className="max-h-[280px] w-full object-contain" preload="metadata">
                <source src={videoUrl} type="video/mp4" />
              </video>
            </div>
          </div>
        </section>
      )}

      <section className="relative z-10 py-10 sm:py-14">
        <div ref={rangeRef} className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">Your shot</p>
          <h2 className="mt-2 font-prize text-3xl text-white sm:text-4xl">SELECT ENTRIES</h2>
          <p className="mt-2 text-sm text-white/50">Choose quantity, then enter. Same checkout as before.</p>

          {isGameType && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#0A0A0D] p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-center gap-2">
                <Crown className="h-5 w-5 text-[#F1D47A]" />
                <h3 className="font-prize text-xl text-[#F1D47A]">Bundle & save</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { qty: 5, discount: 5, label: "Starter" },
                  { qty: 10, discount: 10, label: "Popular" },
                  { qty: 15, discount: 15, label: "Best value" },
                ].map((tier) => {
                  const isSelected = quantity === tier.qty;
                  const savingsAmount = ((pricePerTicket * tier.qty) * (tier.discount / 100)).toFixed(2);
                  return (
                    <button
                      key={tier.qty}
                      onClick={() => setQuantity(tier.qty)}
                      className={`relative rounded-xl border px-2 py-4 transition-all ${
                        isSelected
                          ? "border-[#F1D47A] bg-[#C8102E] text-white shadow-[0_8px_24px_rgba(200,16,46,0.35)]"
                          : "border-white/10 bg-white/[0.03] text-white hover:border-[#C8102E]/50"
                      }`}
                    >
                      <div className="text-xs font-black uppercase tracking-widest opacity-70">{tier.label}</div>
                      <div className="mt-1 text-lg font-black">
                        {tier.qty} {competitionType === "spin" ? "Spins" : competitionType === "scratch" ? "Scratches" : competitionType === "pop" ? "Pops" : competitionType === "plinko" ? "Drops" : competitionType === "slot" ? "Slots" : competitionType === "royal" ? "Plays" : "Plays"}
                      </div>
                      <div className={`mt-1 font-prize text-2xl ${isSelected ? "text-[#F1D47A]" : "text-[#F1D47A]"}`}>
                        {tier.discount}%
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/55">off</div>
                      <div className="mt-2 text-[10px] font-semibold text-white/70">Save £{savingsAmount}</div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-[10px] text-white/35">Discount automatically applied · Cannot be combined</p>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#0A0A0D] p-5 sm:p-8">
            {isFreeGiveaway ? (
              <div className="space-y-4">
                {userTicketCount >= maxTicketsForGiveaway ? (
                  <div className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/8 p-4">
                    <p className="font-semibold text-[#F1D47A]">You have {userTicketCount} tickets</p>
                    <p className="mt-1 text-xs text-white/50">Maximum {maxTicketsForGiveaway} per user</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center gap-3">
                      {[1, 2].map((num) => (
                        <button
                          key={num}
                          onClick={() => setQuantity(Math.min(num, remainingTickets))}
                          disabled={num > remainingTickets}
                          className={`min-w-[100px] rounded-xl border-2 px-6 py-3 text-sm font-bold transition-all ${
                            quantity === num
                              ? "border-transparent bg-[#C8102E] text-white"
                              : num > remainingTickets
                                ? "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                                : "border-white/15 bg-transparent text-white hover:border-[#C8102E]/60"
                          }`}
                        >
                          {num} Ticket{num > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/50">
                      {remainingTickets === 1 ? "1 ticket remaining" : `${remainingTickets} tickets remaining`}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-center gap-2">
                  {[1, 5, 10, 15, 20, 30].map((num) => {
                    const discount = isGameType ? getApplicableDiscount(num) : 0;
                    const discountedPlays = num <= 15 ? num : 15;
                    const fullPricePlays = num <= 15 ? 0 : num - 15;
                    const pillPrice = isGameType
                      ? (pricePerTicket * discountedPlays * (1 - discount / 100)) + (pricePerTicket * fullPricePlays)
                      : pricePerTicket * num;

                    return (
                      <button
                        key={num}
                        onClick={() => setQuantity(num)}
                        className={`relative min-w-[65px] rounded-xl border-2 px-3 py-2.5 text-xs font-bold transition-all md:min-w-[75px] md:px-4 md:text-sm ${
                          quantity === num
                            ? "scale-105 border-transparent bg-[#C8102E] text-white shadow-[0_8px_24px_rgba(200,16,46,0.35)]"
                            : "border-white/10 bg-transparent text-white hover:border-[#C8102E]/40"
                        }`}
                        data-testid={`button-quantity-${num}`}
                      >
                        <div className="text-base font-black md:text-lg">{num}</div>
                        {isGameType && discount > 0 && num <= 15 && (
                          <div
                            className={`absolute -right-2 -top-2 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                              quantity === num ? "bg-black text-[#F1D47A]" : "bg-[#F1D47A] text-black"
                            }`}
                          >
                            -{discount}%
                          </div>
                        )}
                        <div className={`mt-0.5 text-[9px] font-medium ${quantity === num ? "text-white/80" : "text-white/40"}`}>
                          £{pillPrice.toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <div className="font-prize text-5xl text-[#F1D47A] md:text-6xl">{quantity}</div>
                  <div className="mt-1 text-sm font-medium uppercase tracking-wider text-white/45">
                    {playNoun(competitionType, quantity)}
                  </div>
                  {isGameType && discountPercent > 0 && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#F1D47A]" />
                      <span className="text-xs font-bold text-[#F1D47A] md:text-sm">
                        {discountPercent}% discount active
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                    disabled={quantity <= 1}
                    className={`rounded-xl p-3 font-semibold transition-all ${
                      quantity <= 1
                        ? "cursor-not-allowed border border-white/5 bg-white/[0.03] text-white/25"
                        : "bg-[#C8102E] text-white hover:scale-110"
                    }`}
                    data-testid="button-decrease"
                  >
                    <Minus className="h-5 w-5" />
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="range"
                      min="1"
                      max={maxTicketsAllowed}
                      value={Math.min(quantity, maxTicketsAllowed)}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="rr-qty-slider w-full cursor-pointer"
                      data-testid="slider-quantity"
                      style={{
                        background: `linear-gradient(to right, #C8102E ${((Math.min(quantity, maxTicketsAllowed) - 1) * 100) / (maxTicketsAllowed - 1)}%, rgba(255,255,255,0.1) ${((Math.min(quantity, maxTicketsAllowed) - 1) * 100) / (maxTicketsAllowed - 1)}%)`,
                      }}
                    />
                  </div>

                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="rounded-xl bg-[#C8102E] p-3 font-semibold text-white transition-all hover:scale-110"
                    data-testid="button-increase"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4 md:p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-white/45">Total</span>
                <div className="text-right">
                  {isGameType && discountPercent > 0 && (
                    <span className="mb-0.5 block text-xs text-white/35 line-through">
                      £{originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="font-prize text-3xl text-[#F1D47A] md:text-4xl">
                    £{displayTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {isGameType && discountPercent > 0 && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-[#F1D47A]" />
                      <span className="text-sm font-semibold text-[#F1D47A]">
                        Bundle discount ({discountPercent}%)
                      </span>
                    </div>
                    <span className="text-base font-bold text-[#F1D47A]">-£{savings.toFixed(2)}</span>
                  </div>
                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-[10px] text-white/35">
                      <span>5 for 5%</span>
                      <span>10 for 10%</span>
                      <span>15 for 15%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="rr-progress-fill h-full rounded-full"
                        style={{ width: `${Math.min((quantity / 15) * 100, 100)}%` }}
                      />
                    </div>
                    {quantity > 15 && (
                      <p className="mt-1 text-center text-[10px] text-white/40">
                        Discount applies to first 15 plays only
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/40">
                <span>Per entry: £{pricePerTicket.toFixed(2)}</span>
                {isGameType && discountPercent > 0 && (
                  <>
                    <span className="text-[#F1D47A]">→</span>
                    <span className="font-semibold text-[#F1D47A]">
                      £{(discountedPrice / quantity).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenQuiz}
            disabled={purchaseLocked}
            className={`rr-cta mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-xl text-base font-black uppercase tracking-[0.14em] md:h-16 ${
              isSoldOut || (isFreeGiveaway && !canBuyMore) ? "opacity-50" : ""
            }`}
          >
            {purchaseTicketMutation.isPending ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
            {ctaLabel}
            {!purchaseLocked && (
              <span className="text-sm font-bold opacity-80">· £{displayTotal.toFixed(2)}</span>
            )}
          </button>

          {isGameType && discountPercent > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-2">
              <Sparkles className="h-4 w-4 text-[#F1D47A]" />
              <span className="text-sm font-bold text-[#F1D47A]">You're saving £{savings.toFixed(2)}</span>
            </div>
          )}

          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/45 underline underline-offset-4 transition-colors hover:text-[#F1D47A] md:text-sm"
            onClick={() => setIsPostalModalOpen(true)}
          >
            <Mail className="h-3.5 w-3.5" />
            Free postal entry route
          </button>
        </div>
      </section>

      <section className="relative z-10 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <UserCompetitionPrizes competitionId={competition.id} />
        </div>
      </section>

      <section className="relative z-10 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">The process</p>
            <h2 className="mt-2 font-prize text-3xl text-white sm:text-5xl">HOW IT WORKS</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {PROCESS_STEPS.map((step) => (
              <article key={step.n} className="rr-hiw-card rr-hiw-card--red">
                <span className="rr-hiw-watermark" aria-hidden>
                  {step.n}
                </span>
                <div className="relative z-[1] flex items-start justify-between">
                  <span className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                    Step {step.n}
                  </span>
                  <div className="rr-hiw-icon">
                    <step.Icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                </div>
                <h3 className="relative z-[1] mt-6 font-prize text-2xl text-white">{step.title}</h3>
                <p className="relative z-[1] mt-3 text-sm leading-relaxed text-white/55">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CommunitySection />

      <section className="relative z-10 border-t border-white/10 py-12 md:py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="font-prize text-3xl text-white md:text-4xl">More live prizes</h2>
          <p className="mt-3 text-sm text-white/50 md:text-base">
            Jump back to the board and pick another shot.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="rr-cta mt-8 inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-black uppercase tracking-[0.14em]"
          >
            View all competitions
          </button>
        </div>
      </section>

      {!isGameType && (
        <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
          <DialogContent className="mx-auto w-[90vw] max-w-sm rounded-2xl border border-white/10 bg-[#0A0A0D] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center font-prize text-2xl text-white">
                Answer to proceed
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center font-medium text-white/70">{quizQuestion.question}</p>
              <div className="grid grid-cols-1 gap-2">
                {quizQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedAnswer(option)}
                    className={`w-full rounded-xl border-2 p-3 font-semibold transition-all ${
                      selectedAnswer === option
                        ? "border-transparent bg-[#C8102E] text-white"
                        : "border-white/10 bg-white/[0.02] text-white hover:border-[#C8102E]/40"
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
                className="rr-cta mt-4 h-11 rounded-xl px-8 font-black uppercase tracking-wider text-white disabled:opacity-50"
              >
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isPostalModalOpen} onOpenChange={setIsPostalModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl border border-white/10 bg-[#0A0A0D]">
          <DialogHeader>
            <DialogTitle className="text-center font-prize text-2xl text-white">
              Postal entry route
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-4 text-sm leading-relaxed text-white/65">
              <p>
                Send an unclosed postcard (standard postcard size is approx 148mm x 105mm)
                first or second class to:
              </p>
              <p className="font-semibold text-white">
                1 West Havelock Street, South Shields, Tyne and Wear, NE33 5AF.
              </p>
              <p>Include the following information:</p>
              <ul className="list-disc space-y-1 pl-6">
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
                <Link href="/termsAndConditions" className="text-[#F1D47A] underline">
                  terms and conditions
                </Link>
                .
              </p>
              <p className="mt-4 font-semibold text-white">
                You wake up at 7:00am and take 30 minutes to get ready. What time are you ready?
              </p>
              <p>A: 7:15am B: 7:20am C: 7:30am D: 7:45am</p>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
