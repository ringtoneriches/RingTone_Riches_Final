import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  CreditCard, Wallet, Coins, Lock, AlertCircle,
  Ticket, X, Tag, Shield, Check, Zap,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import BrandWait from "@/components/brand/BrandWait";
import ChaserBorder from "@/components/home/ChaserBorder";
import { getPrizeDisplay, parsePrizeAmount } from "@/lib/competition-display";
import { showPurchaseSuccessToast } from "@/lib/purchase-toast";

/* Colour tokens live on .rr-billing in index.css */

interface UnifiedBillingProps {
  orderId: string;
  orderType: "competition" | "spin" | "scratch" | "pop" | "plinko" | "voltz" | "slot" | "royal";
  wheelType?: string;
  competitionImage?: string; // ✅ NEW PROP
}

// Helper function for minimum purchase validation
const MINIMUM_PURCHASE_AMOUNT = 3;
const MINIMUM_PURCHASE_MESSAGE = `Minimum purchase is £${MINIMUM_PURCHASE_AMOUNT}. Please add more plays.`;

export const validateMinimumPurchase = (totalAmount: number, paymentType: string): { valid: boolean; message?: string; minimumAmount: number; currentAmount: number } => {
  if (paymentType === 'instaplay' && totalAmount < MINIMUM_PURCHASE_AMOUNT) {
    return {
      valid: false,
      message: `Minimum purchase is £${MINIMUM_PURCHASE_AMOUNT}. Your total is £${totalAmount.toFixed(2)}. Please add more plays.`,
      minimumAmount: MINIMUM_PURCHASE_AMOUNT,
      currentAmount: totalAmount
    };
  }
  return {
    valid: true,
    minimumAmount: MINIMUM_PURCHASE_AMOUNT,
    currentAmount: totalAmount
  };
};

export const MIN_PURCHASE = MINIMUM_PURCHASE_AMOUNT;

function formatPrizeAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  if (Number.isInteger(value)) return `£${value.toLocaleString("en-GB")}`;
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function subtitleForReward(type?: string, name?: string) {
  if (type === "points") return "POINTS PRIZE";
  if (type === "physical") {
    const label = (name || "").trim();
    return label && label.length <= 28 ? label.toUpperCase() : "PRIZE";
  }
  if (type === "cash") return "CASH PRIZE";
  return name?.trim() ? name.trim().toUpperCase() : "PRIZE";
}

function pickFromPrizeData(prizeData: any): { headline: string; subtitle: string } | null {
  if (!prizeData) return null;

  if (typeof prizeData.mainPrize === "string" && prizeData.mainPrize.trim()) {
    const text = prizeData.mainPrize.trim();
    const pound = text.match(/£[\d,]+(?:\.\d+)?/);
    if (pound) {
      return { headline: pound[0], subtitle: /cash/i.test(text) ? "CASH PRIZE" : "MAIN PRIZE" };
    }
    if (text.length <= 16) {
      return { headline: text, subtitle: /cash/i.test(text) ? "CASH PRIZE" : "MAIN PRIZE" };
    }
    return { headline: "PRIZE", subtitle: text.length > 28 ? `${text.slice(0, 28).trim()}…` : text };
  }

  const list = Array.isArray(prizeData) ? prizeData : prizeData.prizes;
  if (!Array.isArray(list) || !list.length) return null;

  const valued = list
    .map((p: any) => ({
      value: Number(p.rewardValue ?? p.value ?? p.amount ?? 0),
      label: String(p.label || p.name || p.prizeName || ""),
      type: String(p.rewardType || p.type || ""),
    }))
    .filter((p: { value: number; type: string }) => p.value > 0 && !["lose", "try_again", "no_win"].includes(p.type));

  if (!valued.length) return null;
  const top = valued.reduce((a: any, b: any) => (b.value > a.value ? b : a));
  const headline = formatPrizeAmount(top.value);
  if (!headline) return null;
  return { headline, subtitle: subtitleForReward(top.type, top.label) };
}

function topCashFromGamePrizes(prizes: any[] | undefined): number | null {
  if (!Array.isArray(prizes) || !prizes.length) return null;
  let top: number | null = null;
  for (const prize of prizes) {
    if (prize?.isActive === false) continue;
    const type = String(prize.rewardType || prize.type || "cash").toLowerCase();
    if (type !== "cash") continue;
    const value = parsePrizeAmount(prize.rewardValue ?? prize.prizeValue ?? prize.value);
    if (value != null && (top == null || value > top)) top = value;
  }
  return top;
}

function resolveCheckoutPrize(
  competition: any,
  prizePool: any,
  gameTopPrize?: number | null,
): { headline: string; subtitle: string } {
  const poolPrizes = Array.isArray(prizePool?.prizes) ? prizePool.prizes : [];
  const isControlled = prizePool?.mode === "controlled_pool" || competition?.instantWinMode === "controlled_pool";

  if (isControlled && poolPrizes.length) {
    const available = poolPrizes.filter((p: any) => p.publicStatus === "available" || p.status === "active");
    const candidates = available.length ? available : poolPrizes;
    const top = candidates.reduce((best: any, p: any) =>
      Number(p.prizeValue || 0) > Number(best.prizeValue || 0) ? p : best
    );
    const headline = formatPrizeAmount(Number(top.prizeValue || 0));
    if (headline) {
      return { headline, subtitle: subtitleForReward(top.rewardType, top.prizeName) };
    }
  }

  if (isControlled && !poolPrizes.length) {
    return { headline: "PRIZES", subtitle: "INSTANT WIN" };
  }

  if (competition) {
    const fromCard = getPrizeDisplay(competition);
    if (fromCard.prizeDisplay) {
      return {
        headline: fromCard.prizeDisplay,
        subtitle: fromCard.isMysteryPrize ? "MYSTERY PRIZE" : "CASH PRIZE",
      };
    }
  }

  const fromPrizeData = pickFromPrizeData(competition?.prizeData);
  if (fromPrizeData) return fromPrizeData;

  const fromGame = parsePrizeAmount(gameTopPrize);
  if (fromGame) {
    return { headline: formatPrizeAmount(fromGame), subtitle: "CASH PRIZE" };
  }

  return { headline: "PRIZE", subtitle: "PRIZE" };
}

export default function UnifiedBilling({ orderId, orderType, wheelType, competitionImage: passedImage }: UnifiedBillingProps) {
  const [, setLocation] = useLocation();
  const [selectedMethods, setSelectedMethods] = useState({ walletBalance: false, ringtonePoints: false, instaplay: false });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [entryTimer, setEntryTimer] = useState(10 * 60);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ✅ Get stored image from localStorage as backup
  const [storedImage, setStoredImage] = useState<string | null>(null);
  
  useEffect(() => {
    if (orderId) {
      const image = localStorage.getItem(`competition_image_${orderId}`);
      if (image) {
        setStoredImage(image);
        // Clean up after retrieving
        // localStorage.removeItem(`competition_image_${orderId}`);
      }
    }
  }, [orderId]);

  useEffect(() => {
    const t = setInterval(() => setEntryTimer(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  
  const fmtTimer = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const isGame = ["spin", "scratch", "pop", "plinko", "voltz", "slot", "royal"].includes(orderType);

  const getEndpoint = () => {
    switch (orderType) {
      case "spin": return "/api/spin-order";
      case "scratch": return "/api/scratch-order";
      case "pop": return "/api/pop-order";
      case "plinko": return "/api/plinko-order";
      case "voltz": return "/api/voltz-order";
      case "slot": return "/api/slot-order";
      case "royal": return "/api/royal-order";
      default: return "/api/order";
    }
  };

  const getTitle = () => {
    if (orderType === "spin") return wheelType === "wheel2" ? "RETRO RINGTONE SPIN" : "LUXURY CAR SPIN";
    switch (orderType) {
      case "scratch": return "SCRATCH NATIONS";
      case "pop": return "RINGTONE POP";
      case "plinko": return "RINGTONE PLINKO";
      case "voltz": return "RINGTONE VOLTZ";
      case "slot": return "SLOT MACHINE";
      case "royal": return "ROYAL REELS";
      default: return "COMPETITION";
    }
  };

  const getItemName = () => {
    if (orderType === "spin") return wheelType === "wheel2" ? "Retro Spins" : "Spins";
    switch (orderType) {
      case "scratch": return "Scratch Cards";
      case "pop": return "Pop Games";
      case "plinko": return "Plinko Games";
      case "voltz": return "Voltz Games";
      case "slot": return "Slot Spins";
      case "royal": return "Royal Games";
      default: return "Tickets";
    }
  };

  const getPaymentEndpoint = () => {
    switch (orderType) {
      case "spin": return "/api/process-spin-payment";
      case "scratch": return "/api/process-scratch-payment";
      case "pop": return "/api/process-pop-payment";
      case "plinko": return "/api/process-plinko-payment";
      case "voltz": return "/api/process-voltz-payment";
      case "slot": return "/api/process-slot-payment";
      case "royal": return "/api/process-royal-payment";
      default: return "/api/purchase-ticket";
    }
  };

  const getGameSuccessPath = (competitionId: string, orderId: string) => {
    switch (orderType) {
      case "spin": return `/spin/${competitionId}/${orderId}`;
      case "scratch": return `/scratch/${competitionId}/${orderId}`;
      case "pop": return `/pop/${competitionId}/${orderId}`;
      case "plinko": return `/plinko/${competitionId}/${orderId}`;
      case "voltz": return `/voltz/${competitionId}/${orderId}`;
      case "slot": return `/slot/${competitionId}/${orderId}`;
      case "royal": return `/royal/${competitionId}/${orderId}`;
      default: return `/success/competition?orderId=${orderId}`;
    }
  };

  // ✅ FIXED: Query with image handling
  const { data: orderData, isLoading, refetch: refetchOrder } = useQuery({
    queryKey: [getEndpoint(), orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await apiRequest(`${getEndpoint()}/${orderId}`, "GET");
      const data = await res.json();
      
      // ✅ Merge passed image or stored image into competition data
      if (data.competition) {
        if (passedImage) {
          data.competition.imageUrl = passedImage;
        } else if (storedImage) {
          data.competition.imageUrl = storedImage;
        }
      }
      
      return data;
    },
  });

  const order       = orderData?.order;
  const user        = orderData?.user;
  const orderCompetition = orderData?.competition;
  const competitionId = orderCompetition?.id || order?.competitionId;

  const { data: listedCompetition } = useQuery({
    queryKey: ["/api/competitions", competitionId],
    enabled: !!competitionId,
    staleTime: 30_000,
  });

  const { data: scratchImages } = useQuery({
    queryKey: ["/api/admin/scratch-images"],
    enabled: orderType === "scratch",
    staleTime: 30_000,
  });

  const competition = listedCompetition || orderCompetition
    ? {
        ...(listedCompetition || {}),
        ...(orderCompetition || {}),
        prizeAmount: orderCompetition?.prizeAmount ?? listedCompetition?.prizeAmount ?? null,
      }
    : undefined;

  const { data: prizePool } = useQuery({
    queryKey: ["/api/competitions", competitionId, "instant-win-pool"],
    enabled: !!competitionId,
    queryFn: async () => {
      const res = await apiRequest(`/api/competitions/${competitionId}/instant-win-pool`, "GET");
      return res.json();
    },
    staleTime: 30_000,
  });

  const isInstantCompetition = orderType === "competition" && competition?.type === "instant";
  const isPointsDisabled = isInstantCompetition;

  const itemCost = orderType === "competition"
    ? parseFloat(competition?.ticketPrice || "0")
    : parseFloat(orderData?.scratchCost || orderData?.spinCost || orderData?.popCost || orderData?.plinkoCost || orderData?.voltzCost || orderData?.slotCost || "2");

  const appliedDiscount     = Number(order?.discountAmount || 0);
  const discountType        = order?.discountType || null;
  const percentageDiscount  = Number(order?.percentageDiscount || 0);

  let originalTotalAmount   = Number(order?.totalAmount);
  const totalAmount         = Number(order?.totalAmount);
  let percentageDiscountCashValue = 0, pointsDiscountCashValue = 0;

  if (discountType === "percentage" && percentageDiscount > 0) {
    originalTotalAmount = totalAmount / (1 - percentageDiscount / 100);
    percentageDiscountCashValue = originalTotalAmount * (percentageDiscount / 100);
  } else if (discountType === "cash" && appliedDiscount > 0) {
    originalTotalAmount = totalAmount + appliedDiscount;
  } else if (discountType === "points" && appliedDiscount > 0) {
    pointsDiscountCashValue = appliedDiscount * 0.01;
    originalTotalAmount = totalAmount + pointsDiscountCashValue;
  }

  const walletBalance   = Number(user?.balance) || 0;
  const ringtonePoints  = user?.ringtonePoints || 0;
  const ringtoneBalance = ringtonePoints * 0.01;

  const calculatePaymentBreakdown = () => {
    let remainingAmount = totalAmount;
    let walletUsed = 0, pointsUsed = 0;
    if (selectedMethods.walletBalance) { walletUsed = Math.min(walletBalance, remainingAmount); remainingAmount -= walletUsed; }
    if (selectedMethods.ringtonePoints && !isPointsDisabled) { pointsUsed = Math.min(ringtoneBalance, remainingAmount); remainingAmount -= pointsUsed; }
    return { walletUsed, pointsUsed, pointsNeeded: Math.ceil(pointsUsed * 100), remainingAmount, hasSufficientFunds: remainingAmount === 0 };
  };

  const { walletUsed, pointsUsed, pointsNeeded, remainingAmount, hasSufficientFunds } = calculatePaymentBreakdown();
  const hasSelectedMethod = selectedMethods.walletBalance || selectedMethods.ringtonePoints || (isGame && selectedMethods.instaplay);
  const bonusPoints = Math.round(totalAmount * 10);

  const handleMethodToggle = (method: "walletBalance" | "ringtonePoints" | "instaplay") => {
    if (method === "ringtonePoints" && isPointsDisabled) {
      toast({ title: "Points Not Available", description: "Ringtone Points cannot be used for competitions.", variant: "destructive" });
      return;
    }
    if (method === "instaplay") { setSelectedMethods({ walletBalance: false, ringtonePoints: false, instaplay: !selectedMethods.instaplay }); return; }
    if (selectedMethods.instaplay) { setSelectedMethods({ walletBalance: method === "walletBalance", ringtonePoints: method === "ringtonePoints", instaplay: false }); return; }
    setSelectedMethods(prev => ({ ...prev, [method]: !prev[method] }));
  };

  const applyDiscountMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/checkout/apply-discount", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply discount");
      return data;
    },
    onSuccess: (data) => { toast({ title: "Discount Applied 🎉", description: data.message }); setShowDiscountDialog(false); setDiscountCode(""); refetchOrder(); },
    onError:   (error: any) => { toast({ title: "Discount Failed", description: error.message, variant: "destructive" }); },
  });

  const removeDiscountMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("/api/checkout/remove-discount", "POST", { orderId }); return res.json(); },
    onSuccess:  (data) => { if (data.success) { toast({ title: "Discount Removed" }); refetchOrder(); } },
    onError:    (error: any) => { toast({ title: "Error", description: error.message || "Failed to remove discount", variant: "destructive" }); },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(getPaymentEndpoint(), "POST", { ...data, orderId, competitionId: order?.competitionId, quantity: order?.quantity || 1 });
      const text = await res.text();
      let result;
      try { result = JSON.parse(text); } catch { throw new Error(`Server error: ${text.slice(0, 100)}`); }
      if (!res.ok) throw new Error(result?.message || result?.error || "Payment failed");
      if (result.redirectUrl) return result;
      if (data.useInstaplay) { if (!result.redirectUrl) throw new Error("No payment redirect URL received"); return result; }
      if (result.remainingAmount > 0) throw new Error(`Insufficient funds. You need £${result.remainingAmount.toFixed(2)} more.`);
      return result;
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      localStorage.removeItem("pendingOrderInfo");
      if (data.redirectUrl) {
        localStorage.setItem("pendingInstaplayOrder", JSON.stringify({ orderId, orderType, wheelType, competitionId: order?.competitionId, timestamp: Date.now() }));
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.success) {
        showPurchaseSuccessToast(toast, orderType, data.message, wheelType);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: [getEndpoint(), orderId] });
        const competitionId = data.competitionId || order?.competitionId;
        setTimeout(() => setLocation(getGameSuccessPath(competitionId, orderId)), 1500);
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      const msg = error?.message || "Payment failed";
      if (msg.includes("Insufficient") || msg.includes("insufficient") || msg.includes("need") || msg.includes("more")) {
        setShowTopUpModal(true);
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
  });

  const handleConfirmPayment = () => {
    if (!orderId) {
      toast({ title: "Error", description: "Invalid order ID.", variant: "destructive" });
      return;
    }
    if (!agreeToTerms) {
      toast({ title: "Terms Not Accepted", description: "Please agree to terms and conditions.", variant: "destructive" });
      return;
    }
    if (!hasSelectedMethod) {
      toast({ title: "Select Payment Method", description: "Please select a payment method.", variant: "destructive" });
      return;
    }
    if (isInstantCompetition && selectedMethods.ringtonePoints) {
      toast({ title: "Invalid Payment Method", description: "Ringtone Points cannot be used for competitions.", variant: "destructive" });
      return;
    }

    if (selectedMethods.instaplay) {
      const validation = validateMinimumPurchase(totalAmount, 'instaplay');
      if (!validation.valid) {
        toast({
          variant: "destructive",
          title: `Minimum £${validation.minimumAmount} Purchase Required`,
          description: validation.message,
          duration: 6000,
        });
        return;
      }
    }

    if (selectedMethods.instaplay) {
      setIsProcessing(true);
      processPaymentMutation.mutate({ useInstaplay: true });
      return;
    }

    if (remainingAmount > 0) {
      setShowTopUpModal(true);
      return;
    }

    setIsProcessing(true);
    processPaymentMutation.mutate({
      useWalletBalance: selectedMethods.walletBalance,
      useRingtonePoints: selectedMethods.ringtonePoints,
      walletAmount: walletUsed,
      pointsAmount: pointsUsed,
      pointsNeeded
    });
  };

  useEffect(() => {
    const pending = localStorage.getItem("pendingInstaplayOrder");
    if (pending) {
      try {
        const data = JSON.parse(pending);
        if (data.orderId === orderId) {
          localStorage.removeItem("pendingInstaplayOrder");
          showPurchaseSuccessToast(toast, data.orderType || orderType, undefined, data.wheelType || wheelType);
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          queryClient.invalidateQueries({ queryKey: [getEndpoint(), orderId] });
          setTimeout(() => setLocation(getGameSuccessPath(data.competitionId, orderId)), 1500);
        }
      } catch {}
    }
  }, [orderId]);

  // ✅ Helper to get the competition image with fallbacks
  const getCompetitionImage = () => {
    // Priority: passedImage > storedImage > competition.imageUrl > fallback
    if (passedImage) return passedImage;
    if (storedImage) return storedImage;
    if (competition?.imageUrl) return competition.imageUrl;
    return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&h=600";
  };

  const FALLBACK = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&h=600";
  const imageSrc = getCompetitionImage();

  const gameTopPrize = topCashFromGamePrizes(orderData?.scratchImages || scratchImages);
  const prizeDisplay = resolveCheckoutPrize(competition, prizePool, gameTopPrize);
  const prizeVal = prizeDisplay.headline;
  const prizeSubtitle = prizeDisplay.subtitle;
  const qty = order?.quantity || 1;

  if (isLoading) {
    return (
      <BrandWait
        mode="overlay"
        kicker="Checkout"
        headline="Loading order"
        subtitle="Getting your checkout ready."
      />
    );
  }

  if (!order) return (
    <div className="ub-root flex min-h-[40vh] flex-col items-center justify-center gap-3 text-white">
      <AlertCircle className="h-12 w-12 text-[#FF263D]" />
      <p className="text-base font-bold">Invalid or expired order.</p>
    </div>
  );

  const displayTitle =
    orderType === "competition" && competition
      ? competition.title.replace(/^WIN\s+/i, "").replace(/[🎁🎄🚰🎮💷📱⚡️🔥💥🏆]/g, "").split("–")[0].trim()
      : getTitle();
  const canPay =
    !isProcessing &&
    agreeToTerms &&
    hasSelectedMethod &&
    !(selectedMethods.instaplay && totalAmount < MIN_PURCHASE);

  return (
    <div className="ub-root text-white">
      {isProcessing && (
        <BrandWait
          mode="overlay"
          kicker="Secure payment"
          headline="Confirming"
          subtitle="Stay on this page while we finish this payment."
          trust="Don’t close this tab"
        />
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-7">
        <ol className="ub-steps flex items-center gap-1.5 sm:gap-2">
          {[
            { n: 1, label: "TICKETS", done: true, active: false },
            { n: 2, label: "CHECKOUT", done: false, active: true },
            { n: 3, label: "CONFIRMATION", done: false, active: false },
          ].map((s, i) => (
            <li key={s.n} className="flex items-center gap-1.5 sm:gap-2">
              {i > 0 && (
                <span
                  className={`hidden h-px w-6 sm:block ${s.active || s.done ? "bg-[#F1D47A]/50" : "bg-white/10"}`}
                />
              )}
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                  s.done
                    ? "bg-[#F1D47A] text-[#0A0A0D]"
                    : s.active
                      ? "border border-[#F1D47A] text-[#F1D47A]"
                      : "border border-white/15 text-white/35"
                }`}
              >
                {s.done ? <Check className="h-3 w-3" /> : s.n}
              </span>
              <span
                className={`text-[9px] font-black uppercase tracking-[0.16em] sm:text-[10px] ${
                  s.done || s.active ? "text-[#F1D47A]" : "text-white/30"
                }`}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>
        <div className="hidden items-center gap-1.5 rounded-full border border-[#F1D47A]/25 bg-[#F1D47A]/8 px-2.5 py-1 sm:inline-flex">
          <Lock className="h-3 w-3 text-[#F1D47A]" />
          <span className="text-[8.5px] font-black uppercase tracking-[0.16em] text-[#F1D47A]">
            256-BIT SSL ENCRYPTED
          </span>
        </div>
      </div>

      <div className="ub-main grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20.5rem] lg:gap-5">
        <div className="space-y-4">
          <ChaserBorder variant="featured">
            <div className="grid overflow-hidden sm:grid-cols-[13.5rem_minmax(0,1fr)]">
              <div className="relative aspect-[5/4] bg-black/40 sm:aspect-auto sm:min-h-[220px]">
                <img
                  src={imageSrc}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK;
                  }}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-[#050505]/80" />
              </div>
              <div className="flex flex-col justify-center px-4 py-5 sm:px-6 sm:py-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  You're about to activate
                </p>
                <h2 className="font-prize mt-1.5 text-[1.7rem] uppercase leading-none text-white sm:text-[2.15rem]">
                  {displayTitle}
                </h2>
                <p className="mt-3 text-sm font-semibold text-white/50">
                  One step away from{prizeVal ? ` ${prizeVal}` : " your prize"}
                </p>
                <div className="ub-facts mt-4">
                  <span>Instant results</span>
                  <span>Secure checkout</span>
                  <span>Fair draw</span>
                </div>
              </div>
            </div>
          </ChaserBorder>

          <ChaserBorder variant="card">
            <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3.5 sm:px-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Your entry</p>
              {appliedDiscount > 0 || percentageDiscount > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#F1D47A]/25 bg-[#F1D47A]/10 px-2.5 py-0.5 text-[10px] font-black text-[#F1D47A]">
                    {discountType === "cash"
                      ? `£${appliedDiscount} OFF`
                      : discountType === "points"
                        ? `${appliedDiscount} Points OFF`
                        : `${percentageDiscount}% OFF`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDiscountMutation.mutate()}
                    className="p-1 text-white/40 hover:text-white"
                    aria-label="Remove discount"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDiscountDialog(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/50 hover:border-[#F1D47A]/30 hover:text-[#F1D47A]"
                >
                  <Tag className="h-3 w-3" />
                  Add code
                </button>
              )}
            </div>
            <div className="divide-y divide-white/[0.06]">
              <div className="flex items-center justify-between px-4 py-3.5 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F1D47A]/20 bg-[#F1D47A]/8 text-[#F1D47A]">
                    <Ticket className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-white">{getItemName()}</span>
                </div>
                <span className="text-sm font-semibold text-white/60">
                  {qty} Entr{qty === 1 ? "y" : "ies"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                <span className="text-sm text-white/45">Price per Entry</span>
                <span className="text-sm font-semibold text-white/70">£{itemCost.toFixed(2)}</span>
              </div>
              {discountType === "percentage" && percentageDiscount > 0 && (
                <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                  <span className="text-sm text-[#F1D47A]">{percentageDiscount}% Discount</span>
                  <span className="text-sm font-semibold text-[#F1D47A]">-£{percentageDiscountCashValue.toFixed(2)}</span>
                </div>
              )}
              {discountType === "cash" && appliedDiscount > 0 && (
                <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                  <span className="text-sm text-[#F1D47A]">Cash Discount</span>
                  <span className="text-sm font-semibold text-[#F1D47A]">-£{appliedDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-end justify-between px-4 py-4 sm:px-5">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/40">Total</span>
                <div className="text-right">
                  {(appliedDiscount > 0 || percentageDiscount > 0) && (
                    <div className="mb-0.5 text-xs text-white/30 line-through">£{originalTotalAmount.toFixed(2)}</div>
                  )}
                  <div className="font-prize text-[2rem] leading-none text-[#F1D47A] sm:text-[2.25rem]">
                    £{totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </ChaserBorder>

          <ChaserBorder variant="card">
            <div className="border-b border-white/8 px-4 py-3.5 sm:px-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Pay with</p>
            </div>
            <div className="space-y-2 p-3 sm:p-4">
              <div
                onClick={() => handleMethodToggle("walletBalance")}
                data-testid="checkbox-wallet"
                className={`ub-pay ${selectedMethods.walletBalance ? "is-on" : ""}`}
              >
                <div className="ub-pay-ico">
                  <Wallet className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">Wallet</div>
                  <div className="mt-0.5 text-xs text-white/42">£{walletBalance.toFixed(2)} available</div>
                  {selectedMethods.walletBalance && walletUsed > 0 && (
                    <div className="mt-1 text-[11px] text-[#F1D47A]">Using £{walletUsed.toFixed(2)}</div>
                  )}
                </div>
                <div className="ub-pay-dot" />
              </div>

              <div
                onClick={isPointsDisabled ? undefined : () => handleMethodToggle("ringtonePoints")}
                data-testid="checkbox-points"
                className={`ub-pay ${selectedMethods.ringtonePoints && !isPointsDisabled ? "is-on" : ""} ${isPointsDisabled ? "is-off" : ""}`}
              >
                <div className="ub-pay-ico">
                  <Coins className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">
                    Points
                    {isPointsDisabled ? (
                      <span className="ml-2 text-[11px] font-semibold text-white/35">Not available</span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-xs text-white/42">
                    {ringtonePoints.toLocaleString()} pts · £{ringtoneBalance.toFixed(2)}
                  </div>
                  {!isPointsDisabled && selectedMethods.ringtonePoints && pointsUsed > 0 && (
                    <div className="mt-1 text-[11px] text-[#F1D47A]">
                      Using £{pointsUsed.toFixed(2)} ({pointsNeeded} pts)
                    </div>
                  )}
                </div>
                <div className="ub-pay-dot" />
              </div>

              {isGame && (
                <div
                  onClick={() => handleMethodToggle("instaplay")}
                  data-testid="checkbox-instaplay"
                  className={`ub-pay ${selectedMethods.instaplay ? "is-on" : ""}`}
                >
                  <div className="ub-pay-ico">
                    <CreditCard className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white">Card</div>
                    <div className="mt-0.5 text-xs text-white/42">Pay now · no wallet top-up</div>
                    {selectedMethods.instaplay && totalAmount < MIN_PURCHASE ? (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#E8A14A]">
                        <AlertCircle className="h-3 w-3" />
                        Minimum £{MIN_PURCHASE} · current £{totalAmount.toFixed(2)}
                      </div>
                    ) : selectedMethods.instaplay ? (
                      <div className="mt-1 text-[11px] text-[#F1D47A]">Pay £{totalAmount.toFixed(2)} by card</div>
                    ) : null}
                    {!selectedMethods.instaplay && totalAmount > 0 && totalAmount < MIN_PURCHASE && (
                      <div className="mt-1 text-[11px] text-white/30">Minimum £{MIN_PURCHASE} for card</div>
                    )}
                  </div>
                  <div className="ub-pay-dot" />
                </div>
              )}

              {hasSelectedMethod && !selectedMethods.instaplay && remainingAmount > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-[#E8A14A]/28 bg-[#E8A14A]/8 px-3.5 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#E8A14A]" />
                  <span className="text-xs font-semibold text-[#E8A14A]">
                    £{remainingAmount.toFixed(2)} still needed — top up your wallet to continue
                  </span>
                </div>
              )}
            </div>
          </ChaserBorder>

          <div className="ub-checkout-cta space-y-3 pt-1">
            <div className="flex items-start gap-3 px-0.5">
              <button
                type="button"
                onClick={() => setAgreeToTerms(!agreeToTerms)}
                className={`ub-terms-check mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                  agreeToTerms ? "is-on border-[#F1D47A] bg-[#F1D47A]" : "border-white/30 bg-transparent"
                }`}
              >
                {agreeToTerms && <Check className="h-3 w-3 text-[#0A0A0D]" />}
              </button>
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                data-testid="checkbox-terms"
                className="hidden"
              />
              <label
                className="cursor-pointer text-[13px] leading-relaxed text-white/55"
                onClick={() => setAgreeToTerms(!agreeToTerms)}
              >
                I am over 18 and agree to the{" "}
                <a href="/termsAndConditions" className="font-bold text-[#F1D47A] underline underline-offset-2">
                  terms and conditions
                </a>
              </label>
            </div>

            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessing || !agreeToTerms || !hasSelectedMethod}
              data-testid="button-checkout"
              className={`ub-cta h-13 w-full rounded-xl px-6 text-sm font-black uppercase tracking-[0.12em] ${
                canPay
                  ? "rr-cta ub-cta-go"
                  : selectedMethods.instaplay && totalAmount < MIN_PURCHASE && agreeToTerms && hasSelectedMethod
                    ? "ub-cta-min"
                    : "ub-cta-wait"
              }`}
              style={{ height: 56 }}
            >
              <span className="relative z-[1] inline-flex items-center justify-center gap-2.5">
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing…
                  </>
                ) : selectedMethods.instaplay && totalAmount < MIN_PURCHASE ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Minimum £{MIN_PURCHASE} required
                  </>
                ) : remainingAmount > 0 && hasSelectedMethod && !selectedMethods.instaplay ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Top up £{remainingAmount.toFixed(2)}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Activate entry — £{totalAmount.toFixed(2)}
                  </>
                )}
              </span>
            </button>

            {selectedMethods.instaplay && totalAmount < MIN_PURCHASE && (
              <p className="rounded-lg border border-[#E8A14A]/20 bg-[#E8A14A]/10 px-3 py-2 text-center text-[11px] text-[#E8A14A]">
                Add {Math.ceil((MIN_PURCHASE - totalAmount) / (totalAmount / (order?.quantity || 1)))} more play(s) to
                reach £{MIN_PURCHASE} minimum
              </p>
            )}

            <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-[#F1D47A]/50" />
                Safe. Secure. Encrypted.
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-[#F1D47A]/50" />
                256-Bit SSL Protection
              </span>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <ChaserBorder variant="featured">
            <div className="relative overflow-hidden px-5 pb-6 pt-5 text-center">
              <img
                src={imageSrc}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK;
                }}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 blur-md"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 to-[#050505]/92" />
              <div className="relative z-[1]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F1D47A]/70">PRIZE POOL</p>
                <p
                  className={`font-prize mt-2 leading-none text-[#F1D47A] ${
                    prizeVal?.startsWith("£") ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl"
                  }`}
                >
                  {prizeVal || "PRIZE"}
                </p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  {prizeSubtitle || "PRIZE"}
                </p>
              </div>
            </div>
          </ChaserBorder>

          <ChaserBorder variant="card">
            <div className="px-5 py-5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">ENTRY RESERVED</p>
              <p className="font-prize mt-3 text-[2.4rem] leading-none tabular-nums text-[#F1D47A]">{fmtTimer(entryTimer)}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                Time remaining to complete
                <br />
                your entry
              </p>
              <div className="mx-auto mt-4 h-1 max-w-[180px] overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[#F1D47A]"
                  style={{ width: `${Math.max(0, Math.min(100, (entryTimer / 600) * 100))}%` }}
                />
              </div>
            </div>
          </ChaserBorder>
        </aside>
      </div>

      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="max-w-sm border-white/10 bg-[#0A0A0D] text-white">
          <DialogHeader>
            <DialogTitle className="font-prize text-2xl">Apply Discount Code</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="flex flex-col gap-2.5">
              <Input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="border-white/10 bg-white/5 font-bold uppercase tracking-wider text-white"
                onKeyDown={(e) => e.key === "Enter" && applyDiscountMutation.mutate(discountCode.trim().toUpperCase())}
              />
              <button
                type="button"
                onClick={() => applyDiscountMutation.mutate(discountCode.trim().toUpperCase())}
                disabled={applyDiscountMutation.isPending || !discountCode.trim()}
                className="rr-cta h-11 w-full rounded-xl text-sm font-black uppercase tracking-wider disabled:opacity-50"
              >
                {applyDiscountMutation.isPending ? "Applying..." : "Apply Code"}
              </button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Dialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
        <DialogContent className="max-w-sm border-white/10 bg-[#0A0A0D] text-white">
          <DialogHeader>
            <DialogTitle className="font-prize text-2xl">Insufficient Balance</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="flex flex-col gap-3 text-sm text-white/55">
              <p>
                You need <strong className="text-[#F1D47A]">£{remainingAmount.toFixed(2)}</strong> more to complete this
                purchase.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowTopUpModal(false);
                    setLocation("/wallet?tab=topup");
                  }}
                  className="rr-cta h-11 flex-1 rounded-xl text-sm font-black uppercase tracking-wider"
                >
                  Top Up Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="h-11 flex-1 rounded-xl border border-white/10 text-sm font-semibold text-white/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
