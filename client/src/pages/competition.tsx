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
import { Minus, Plus, Sparkles, Zap, Ticket, Trophy, Lock, Mail, ShoppingCart } from "lucide-react";
import { useBasket } from "@/hooks/useBasket";
import UserCompetitionPrizes from "./user-competition-prizes";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import { PageWait } from "@/components/brand/BrandWait";
import ChaserBorder from "@/components/home/ChaserBorder";
import QuantitySelector from "@/components/home/QuantitySelector";
import CountdownBlocks from "@/components/home/CountdownBlocks";
import SoldProgress from "@/components/home/SoldProgress";
import CommunitySection from "@/components/home/CommunitySection";
import { useCountdown } from "@/hooks/useCountdown";
import {
  getCompetitionBadgeLabel,
  getCompetitionTypeConfig,
  getDefaultQuantity,
  getFallbackImage,
  getDrawCardTitle,
  getPrizeDisplay,
  getStatusBadge,
  getTicketStats,
  isInstantWinGame,
} from "@/lib/competition-display";

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
  const { add: addToBasket } = useBasket();
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = parseInt(params.get("qty") || "", 10);
    if (Number.isFinite(fromUrl) && fromUrl >= 1) return;
    if (!competition) return;
    setQuantity(getDefaultQuantity(competition, maxTicketsAllowed));
  }, [competition?.id, competition?.defaultQuantity, maxTicketsAllowed]);

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

    if (!isAuthenticated) {
      const params = new URLSearchParams({
        competitionId: competition.id,
        quantity: String(quantity),
        type: competitionType || "instant",
      });
      if (competition.wheelType) params.set("wheelType", String(competition.wheelType));
      if (competition.imageUrl) params.set("image", competition.imageUrl);
      setLocation(`/guest-checkout?${params.toString()}`);
      return;
    }

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

  const handleAddToBasket = () => {
    if (!competition || isSoldOut || (isFreeGiveaway && !canBuyMore)) return;
    addToBasket(
      {
        competitionId: competition.id,
        type: competitionType,
        title: competition.title,
        imageUrl: competition.imageUrl || undefined,
        ticketPrice: competition.ticketPrice,
        quantity,
        wheelType: competition.wheelType,
      },
      maxTicketsAllowed
    );
  };

  if (isLoading) {
    return (
      <PageWait
        className="rr-competition rr-page bg-[#050505] text-white"
        kicker="Competition"
        headline="Loading prize"
        subtitle="Getting the details for this play."
      />
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
  const badgeLabel = getCompetitionBadgeLabel(competition);
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
              <div className="relative overflow-hidden bg-[#0A0A0D] lg:min-h-[560px]">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0A0A0D] sm:aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto">
                  <img
                    src={competition.imageUrl || getFallbackImage(competitionType)}
                    alt={competition.title}
                    className="h-full w-full object-cover object-top lg:object-center"
                    data-testid={`img-competition-${competition.id}`}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.fallbackApplied === "1") return;
                      img.dataset.fallbackApplied = "1";
                      img.src = getFallbackImage(competitionType);
                    }}
                  />
                </div>
                <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-[#0A0A0D]/80 lg:block" />
                <div className="absolute left-3 top-3 z-[2] flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
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

              <div className="flex flex-col justify-center border-t border-white/10 p-5 sm:p-8 lg:border-t-0 lg:p-10">
                <div className="mb-3 inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-black/40 px-3 py-1">
                  <TypeIcon className="h-3.5 w-3.5 text-[#F1D47A]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F1D47A]">
                    {badgeLabel}
                  </span>
                </div>

                {prizeMeta.prizeDisplay && isInstantWinGame(competitionType) && (
                  <p className="font-prize text-4xl leading-none text-[#F1D47A] sm:text-5xl">
                    {prizeMeta.prizeDisplay}
                  </p>
                )}

                <h1
                  className={
                    isInstantWinGame(competitionType)
                      ? "mt-2 font-prize text-2xl leading-tight text-white sm:text-3xl lg:text-4xl"
                      : "mt-2 text-xl font-semibold leading-snug tracking-[-0.02em] text-white sm:text-3xl"
                  }
                  data-testid={`heading-${competition.id}`}
                >
                  {isInstantWinGame(competitionType)
                    ? competition.title
                    : getDrawCardTitle(competition.title)}
                </h1>

                {competition.description?.trim() ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/55 lg:max-h-[5.7rem] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
                    {competition.description}
                  </p>
                ) : null}

                <div className="mt-5 max-w-sm">
                  <CountdownBlocks time={countdown} size="lg" ended={stats.isExpired} variant="ends" />
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
                  <div className="mt-5 flex items-stretch gap-2">
                    <QuantitySelector
                      value={quantity}
                      min={1}
                      max={maxTicketsAllowed}
                      onChange={setQuantity}
                      disabled={stats.isClosed}
                      size="lg"
                      className="rr-qty shrink-0"
                    />
                    {!isSoldOut && (
                      <button
                        type="button"
                        onClick={handleAddToBasket}
                        className="rr-add-cart-btn"
                        data-testid="button-add-basket"
                      >
                        <ShoppingCart className="h-4 w-4 shrink-0" />
                        <span>
                          Add<span className="rr-add-cart-btn-extra"> to cart</span>
                        </span>
                      </button>
                    )}
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
                  className={`rr-cta mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-[0.14em] ${
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
                  More quantities
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
        <div ref={rangeRef} className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">Your shot</p>
            <h2 className="mt-2 font-prize text-3xl text-white sm:text-4xl">SELECT ENTRIES</h2>
            <p className="mt-2 text-sm text-white/50">
              {isGameType
                ? "Pick a quantity. 5, 10 and 15 unlock bundle savings automatically."
                : "Choose quantity, then enter. Same checkout as before."}
            </p>
          </div>

          <div className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0D]">
            {isFreeGiveaway ? (
              <div className="space-y-4 p-5 sm:p-8">
                {userTicketCount >= maxTicketsForGiveaway ? (
                  <div className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/8 p-4 text-center">
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
                    <p className="text-center text-xs text-white/50">
                      {remainingTickets === 1 ? "1 ticket remaining" : `${remainingTickets} tickets remaining`}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                {isGameType && (
                  <div className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40 sm:text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-[#F1D47A]" />
                    <span>5 for 5%</span>
                    <span>10 for 10%</span>
                    <span>15 for 15%</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[1, 5, 10, 15, 20, 30].map((num) => {
                    const pill = isGameType
                      ? calculateDiscountedPrice(pricePerTicket, num)
                      : { discountedPrice: pricePerTicket * num, discountPercent: 0 };
                    const selected = quantity === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuantity(num)}
                        className={`relative rounded-xl border px-2 py-3 text-center transition-all sm:py-3.5 ${
                          selected
                            ? "border-[#F1D47A]/50 bg-[#C8102E] text-white shadow-[0_8px_24px_rgba(200,16,46,0.35)]"
                            : "border-white/10 bg-white/[0.03] text-white hover:border-[#C8102E]/40"
                        }`}
                        data-testid={`button-quantity-${num}`}
                      >
                        <div className="font-prize text-2xl leading-none">{num}</div>
                        <div className={`mt-1 text-[10px] font-semibold ${selected ? "text-white/80" : "text-white/40"}`}>
                          £{pill.discountedPrice.toFixed(2)}
                        </div>
                        {isGameType && pill.discountPercent > 0 && num <= 15 && (
                          <span
                            className={`absolute -right-1.5 -top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                              selected ? "bg-black text-[#F1D47A]" : "bg-[#F1D47A] text-black"
                            }`}
                          >
                            -{pill.discountPercent}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                    disabled={quantity <= 1}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                      quantity <= 1
                        ? "cursor-not-allowed border border-white/5 bg-white/[0.03] text-white/25"
                        : "bg-[#C8102E] text-white hover:brightness-110"
                    }`}
                    data-testid="button-decrease"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max={maxTicketsAllowed}
                    value={Math.min(quantity, maxTicketsAllowed)}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="rr-qty-slider min-w-0 flex-1 cursor-pointer"
                    data-testid="slider-quantity"
                    style={{
                      background: `linear-gradient(to right, #C8102E ${((Math.min(quantity, maxTicketsAllowed) - 1) * 100) / Math.max(maxTicketsAllowed - 1, 1)}%, rgba(255,255,255,0.1) ${((Math.min(quantity, maxTicketsAllowed) - 1) * 100) / Math.max(maxTicketsAllowed - 1, 1)}%)`,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C8102E] text-white transition-all hover:brightness-110"
                    data-testid="button-increase"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-white/10 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="font-prize text-3xl leading-none text-white sm:text-4xl">{quantity}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                    {playNoun(competitionType, quantity)}
                  </p>
                </div>
                <div className="text-right">
                  {isGameType && discountPercent > 0 && (
                    <p className="text-xs text-white/35 line-through">£{originalPrice.toFixed(2)}</p>
                  )}
                  <p className="font-prize text-3xl leading-none text-[#F1D47A] sm:text-4xl">£{displayTotal.toFixed(2)}</p>
                  <p className="mt-1 text-[11px] text-white/40">
                    £{pricePerTicket.toFixed(2)} each
                    {isGameType && discountPercent > 0 && (
                      <span className="text-[#F1D47A]">
                        {" "}
                        → £{(discountedPrice / quantity).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {isGameType && discountPercent > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#F1D47A]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {discountPercent}% off · save £{savings.toFixed(2)}
                </div>
              )}
              {isGameType && quantity > 15 && (
                <p className="mt-2 text-[11px] text-white/40">Bundle saving applies to the first 15 plays.</p>
              )}
            </div>
          </div>

          <button
            onClick={handleOpenQuiz}
            disabled={purchaseLocked}
            className={`rr-cta mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-xl text-base font-black uppercase tracking-[0.14em] md:h-16 ${
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

          {!isSoldOut && !(isFreeGiveaway && !canBuyMore) && (
            <button
              type="button"
              onClick={handleAddToBasket}
              className="rr-add-cart-btn mt-3 w-full"
              data-testid="button-add-basket-range"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to cart · pay later
            </button>
          )}

          <button
            type="button"
            className="mx-auto mt-4 flex items-center gap-1.5 text-xs text-white/45 underline underline-offset-4 transition-colors hover:text-[#F1D47A] md:text-sm"
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
