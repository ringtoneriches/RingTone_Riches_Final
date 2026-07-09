import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  CreditCard, Wallet, Coins, Lock, AlertCircle,
  Ticket, Sparkles, X, Tag, Zap, Shield, Trophy,
  Check, Star, Headphones, Users, ChevronRight,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/* ═══════ COLOURS ═══════ */
const BG    = "#0a0800";
const PANEL = "#0e0a02";
const GOLD  = "#FFC300";
const AMBER = "#FF8C00";
const BORDER = "rgba(255,185,0,0.2)";
const P: React.CSSProperties = { background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14 };

interface UnifiedBillingProps {
  orderId: string;
  orderType: "competition" | "spin" | "scratch" | "pop" | "plinko" | "voltz" | "slot" | "royal";
  wheelType?: string;
}

export default function UnifiedBilling({ orderId, orderType, wheelType }: UnifiedBillingProps) {
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
      case "scratch": return "LANDMARK LOOT";
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

  const { data: orderData, isLoading, refetch: refetchOrder } = useQuery({
    queryKey: [getEndpoint(), orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await apiRequest(`${getEndpoint()}/${orderId}`, "GET");
      return res.json();
    },
  });

  const order       = orderData?.order;
  const user        = orderData?.user;
  const competition = orderData?.competition;

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
        toast({ title: "Purchase Successful 🎉", description: data.message || "Your purchase is complete!" });
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
    if (!orderId) { toast({ title: "Error", description: "Invalid order ID.", variant: "destructive" }); return; }
    if (!agreeToTerms) { toast({ title: "Terms Not Accepted", description: "Please agree to terms and conditions.", variant: "destructive" }); return; }
    if (!hasSelectedMethod) { toast({ title: "Select Payment Method", description: "Please select a payment method.", variant: "destructive" }); return; }
    if (isInstantCompetition && selectedMethods.ringtonePoints) { toast({ title: "Invalid Payment Method", description: "Ringtone Points cannot be used for competitions.", variant: "destructive" }); return; }
    if (selectedMethods.instaplay) { setIsProcessing(true); processPaymentMutation.mutate({ useInstaplay: true }); return; }
    if (remainingAmount > 0) { setShowTopUpModal(true); return; }
    setIsProcessing(true);
    processPaymentMutation.mutate({ useWalletBalance: selectedMethods.walletBalance, useRingtonePoints: selectedMethods.ringtonePoints, walletAmount: walletUsed, pointsAmount: pointsUsed, pointsNeeded });
  };

  useEffect(() => {
    const pending = localStorage.getItem("pendingInstaplayOrder");
    if (pending) {
      try {
        const data = JSON.parse(pending);
        if (data.orderId === orderId) {
          localStorage.removeItem("pendingInstaplayOrder");
          toast({ title: "Payment Successful 🎉", description: "Your instant play purchase is complete!" });
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          queryClient.invalidateQueries({ queryKey: [getEndpoint(), orderId] });
          setTimeout(() => setLocation(getGameSuccessPath(data.competitionId, orderId)), 1500);
        }
      } catch {}
    }
  }, [orderId]);

  const FALLBACK = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&h=600";
  const prizeMatch = competition?.title?.match(/£[\d,]+/);
  const prizeVal   = prizeMatch ? prizeMatch[0] : "";
  const qty        = order?.quantity || 1;

  /* ── LOADING ── */
  if (isLoading) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: BG }}>
      <div style={{ width: 48, height: 48, border: "2px solid rgba(255,185,0,0.15)", borderTopColor: GOLD, borderRadius: "50%", animation: "ub-spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,185,0,0.4)" }}>Loading Order...</p>
      <style>{`@keyframes ub-spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: BG, color: "#fff" }}>
      <AlertCircle style={{ width: 48, height: 48, color: "#FF3B30" }} />
      <p style={{ fontSize: 16, fontWeight: 700 }}>Invalid or expired order.</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "inherit" }}>

      {/* ══ PROGRESS BAR ══ */}
      <div style={{ background: "#060500", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {[
              { n: 1, label: "TICKETS",      done: true,  active: false },
              { n: 2, label: "CHECKOUT",     done: false, active: true  },
              { n: 3, label: "CONFIRMATION", done: false, active: false },
            ].map((s, i) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && (
                  <div style={{ width: 36, height: 2, margin: "0 8px", background: s.active ? `linear-gradient(90deg,${GOLD},${AMBER})` : "rgba(255,255,255,0.12)", borderRadius: 1 }} />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, background: s.done ? `linear-gradient(135deg,${GOLD},${AMBER})` : s.active ? "transparent" : "rgba(255,255,255,0.06)", border: s.active ? `2px solid ${GOLD}` : s.done ? "none" : "1px solid rgba(255,255,255,0.15)", color: s.done ? "#000" : s.active ? GOLD : "rgba(255,255,255,0.35)" }}>
                    {s.done ? <Check style={{ width: 12, height: 12 }} /> : s.n}
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: s.done || s.active ? GOLD : "rgba(255,255,255,0.3)" }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.25)" }}>
            <Lock style={{ width: 11, height: 11, color: "#00CFFF" }} />
            <span style={{ fontSize: 8.5, fontWeight: 900, color: "#00CFFF", textTransform: "uppercase", letterSpacing: "0.16em" }}>256-BIT SSL ENCRYPTED</span>
          </div>
        </div>
      </div>

      {/* ══ MAIN 2-COLUMN ══ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 48px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, alignItems: "start" }} className="ub-main">

        {/* ── LEFT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* HERO CARD */}
          <div style={{ ...P, overflow: "hidden" }}>
            {/* Gold top line */}
            <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${GOLD},${AMBER},transparent)` }} />
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0 }} className="ub-hero">

              {/* Competition image */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                <img src={competition?.imageUrl || FALLBACK} alt=""
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.2) brightness(0.8)" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent 60%,rgba(14,10,2,0.8) 100%)" }} />
                {/* Prize overlay */}
                {prizeVal && (
                  <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center" }}>
                    {[prizeVal, prizeVal, prizeVal].slice(0, 3).map((v, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 900, color: GOLD, textShadow: `0 0 14px rgba(255,185,0,0.9)`, marginRight: 4 }}>{v}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Text content */}
              <div style={{ padding: "18px 20px 20px" }}>
                {/* Badges */}
                <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.25)" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00E676", boxShadow: "0 0 6px #00E676", animation: "ub-blink 1.5s ease-in-out infinite" }} />
                    <span style={{ fontSize: 8, fontWeight: 900, color: "#00E676", textTransform: "uppercase", letterSpacing: "0.18em" }}>LIVE DRAW</span>
                  </div>
                  <div style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(255,185,0,0.1)", border: `1px solid rgba(255,185,0,0.25)` }}>
                    <span style={{ fontSize: 8, fontWeight: 900, color: GOLD, textTransform: "uppercase", letterSpacing: "0.16em" }}>FINAL STEP →</span>
                  </div>
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 4 }}>
                  YOU'RE ABOUT TO ACTIVATE
                </div>
                <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2.1rem)", fontWeight: 900, color: GOLD, textShadow: `0 0 30px rgba(255,185,0,0.5)`, lineHeight: 1.05, marginBottom: 8, textTransform: "uppercase" }}>
                  {orderType === "competition" && competition ? competition.title.replace(/^WIN\s+/i, "").replace(/[🎁🎄🚰🎮💷📱⚡️🔥💥🏆]/g, "").split("–")[0].trim() : getTitle()}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <Zap style={{ width: 12, height: 12, color: AMBER }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    ONE STEP AWAY FROM{prizeVal ? ` ${prizeVal}` : " YOUR PRIZE"}!
                  </span>
                </div>

                {/* 4 feature icons */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {[
                    { icon: Zap,     label: "Instant", sub: "Results",           color: GOLD    },
                    { icon: Trophy,  label: prizeVal || "Top",  sub: "Prize",    color: AMBER   },
                    { icon: Shield,  label: "Secure &", sub: "Fair Draw",        color: "#00CFFF" },
                    { icon: Sparkles,label: "Bonus", sub: "Points",              color: "#8B5CF6" },
                  ].map((f, i) => {
                    const rgb = f.color === GOLD ? "255,185,0" : f.color === AMBER ? "255,140,0" : f.color === "#00CFFF" ? "0,207,255" : "139,92,246";
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "8px 4px", borderRadius: 9, background: `rgba(${rgb},0.06)`, border: `1px solid rgba(${rgb},0.15)` }}>
                        <f.icon style={{ width: 18, height: 18, color: f.color }} />
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 9, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{f.label}</div>
                          <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.2 }}>{f.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ENTRY ACTIVATION */}
          <div style={{ ...P, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid rgba(255,185,0,0.1)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Zap style={{ width: 15, height: 15, color: GOLD }} />
                <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.7)" }}>ENTRY ACTIVATION</span>
              </div>
              {appliedDiscount > 0 || percentageDiscount > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ padding: "3px 10px", borderRadius: 20, fontSize: 9, fontWeight: 900, background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.25)", color: "#00E676" }}>
                    {discountType === "cash" ? `£${appliedDiscount} OFF` : discountType === "points" ? `${appliedDiscount} Points OFF` : `${percentageDiscount}% OFF`}
                  </div>
                  <button onClick={() => removeDiscountMutation.mutate()} style={{ background: "none", border: "none", color: "rgba(255,59,48,0.7)", cursor: "pointer", padding: 4 }}>
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowDiscountDialog(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 9, background: "rgba(255,185,0,0.06)", border: `1px solid rgba(255,185,0,0.2)`, color: GOLD, fontSize: 8.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em", cursor: "pointer" }}>
                  <Tag style={{ width: 10, height: 10 }} />APPLY DISCOUNT
                </button>
              )}
            </div>

            {/* Entry rows */}
            <div style={{ padding: "4px 0" }}>
              {/* Item row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: `1px solid rgba(255,185,0,0.06)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,185,0,0.1)", border: `1px solid rgba(255,185,0,0.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Ticket style={{ width: 15, height: 15, color: GOLD }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{getItemName()}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{qty} Entr{qty === 1 ? "y" : "ies"}</span>
              </div>

              {/* Price per entry */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: `1px solid rgba(255,185,0,0.06)` }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Price per Entry</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>£{itemCost.toFixed(2)}</span>
              </div>

              {/* Discount rows */}
              {discountType === "percentage" && percentageDiscount > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: `1px solid rgba(255,185,0,0.06)` }}>
                  <span style={{ fontSize: 12, color: "#00E676" }}>{percentageDiscount}% Discount</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#00E676" }}>-£{percentageDiscountCashValue.toFixed(2)}</span>
                </div>
              )}
              {discountType === "cash" && appliedDiscount > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: `1px solid rgba(255,185,0,0.06)` }}>
                  <span style={{ fontSize: 12, color: "#00E676" }}>Cash Discount</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#00E676" }}>-£{appliedDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* TOTAL COST */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px" }}>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.45)" }}>TOTAL COST</span>
                <div style={{ textAlign: "right" }}>
                  {(appliedDiscount > 0 || percentageDiscount > 0) && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "line-through", marginBottom: 2 }}>£{originalTotalAmount.toFixed(2)}</div>
                  )}
                  <div style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: GOLD, textShadow: `0 0 28px rgba(255,185,0,0.6)`, lineHeight: 1 }}>£{totalAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Bonus banner */}
            {/* <div style={{ margin: "0 14px 14px", padding: "10px 14px", borderRadius: 10, background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 16 }}>🎁</span>
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>
                <strong style={{ color: GOLD }}>BONUS</strong> — You will earn{" "}
                <strong style={{ color: "#8B5CF6" }}>{bonusPoints} RingTone Points</strong> with this entry!
              </span>
            </div> */}
          </div>

          {/* PAYMENT TERMINAL */}
          <div style={{ ...P, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px 6px", borderBottom: `1px solid rgba(255,185,0,0.1)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                <CreditCard style={{ width: 15, height: 15, color: GOLD }} />
                <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.7)" }}>PAYMENT TERMINAL</span>
              </div>
              <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", padding: "0 0 8px" }}>Choose your preferred payment method</p>
            </div>

            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>

              {/* WALLET BALANCE */}
              <div onClick={() => handleMethodToggle("walletBalance")} data-testid="checkbox-wallet"
                style={{ padding: "13px 16px", borderRadius: 12, border: `2px solid ${selectedMethods.walletBalance ? GOLD : "rgba(255,255,255,0.1)"}`, background: selectedMethods.walletBalance ? "rgba(255,185,0,0.07)" : "rgba(255,255,255,0.02)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.18s" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,185,0,0.1)", border: `1px solid rgba(255,185,0,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Wallet style={{ width: 20, height: 20, color: GOLD }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Wallet Balance</span>
                    <div style={{ padding: "1px 8px", borderRadius: 20, fontSize: 7.5, fontWeight: 900, background: "rgba(255,185,0,0.12)", border: `1px solid rgba(255,185,0,0.3)`, color: GOLD, letterSpacing: "0.1em" }}>FAST ⚡</div>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Available: <span style={{ color: GOLD, fontWeight: 800 }}>£{walletBalance.toFixed(2)}</span></div>
                  {selectedMethods.walletBalance && walletUsed > 0 && <div style={{ fontSize: 9.5, color: "#00E676", marginTop: 2 }}>✓ Using £{walletUsed.toFixed(2)} from wallet</div>}
                </div>
                {/* Radio circle */}
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selectedMethods.walletBalance ? GOLD : "rgba(255,255,255,0.25)"}`, background: selectedMethods.walletBalance ? GOLD : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {selectedMethods.walletBalance && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#000" }} />}
                </div>
              </div>

              {/* RINGTONE POINTS */}
              <div onClick={isPointsDisabled ? undefined : () => handleMethodToggle("ringtonePoints")} data-testid="checkbox-points"
                style={{ padding: "13px 16px", borderRadius: 12, border: `2px solid ${selectedMethods.ringtonePoints && !isPointsDisabled ? "#8B5CF6" : "rgba(255,255,255,0.1)"}`, background: selectedMethods.ringtonePoints && !isPointsDisabled ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.02)", cursor: isPointsDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 14, opacity: isPointsDisabled ? 0.45 : 1, transition: "all 0.18s" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 900, color: "#8B5CF6" }}>
                  8
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>RingTone Points</span>
                    {!isPointsDisabled && (
                      <div style={{ padding: "1px 8px", borderRadius: 20, fontSize: 7.5, fontWeight: 900, background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.35)", color: "#8B5CF6", letterSpacing: "0.1em" }}>8 BEST VALUE</div>
                    )}
                    {isPointsDisabled && <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 10, background: "rgba(255,59,48,0.15)", color: "#FF6B6B", fontWeight: 700 }}>Not Available</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Available: <span style={{ color: "#8B5CF6", fontWeight: 700 }}>{ringtonePoints.toLocaleString()} pts (£{ringtoneBalance.toFixed(2)})</span></div>
                  {!isPointsDisabled && selectedMethods.ringtonePoints && pointsUsed > 0 && <div style={{ fontSize: 9.5, color: "#8B5CF6", marginTop: 2 }}>✓ Using £{pointsUsed.toFixed(2)} ({pointsNeeded} pts)</div>}
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selectedMethods.ringtonePoints && !isPointsDisabled ? "#8B5CF6" : "rgba(255,255,255,0.25)"}`, background: selectedMethods.ringtonePoints && !isPointsDisabled ? "#8B5CF6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {selectedMethods.ringtonePoints && !isPointsDisabled && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                </div>
              </div>

              {/* INSTANT PLAY */}
              {isGame && (
                <div onClick={() => handleMethodToggle("instaplay")} data-testid="checkbox-instaplay"
                  style={{ padding: "13px 16px", borderRadius: 12, border: `2px solid ${selectedMethods.instaplay ? "#00CFFF" : "rgba(255,255,255,0.1)"}`, background: selectedMethods.instaplay ? "rgba(0,207,255,0.06)" : "rgba(255,255,255,0.02)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.18s" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Zap style={{ width: 20, height: 20, color: "#00CFFF" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Instant Play</span>
                      <div style={{ padding: "1px 8px", borderRadius: 20, fontSize: 7.5, fontWeight: 900, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.25)", color: "#00CFFF", letterSpacing: "0.08em" }}>FAST &amp; INSTANT</div>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Pay directly with card • No wallet top-up needed</div>
                    {selectedMethods.instaplay && <div style={{ fontSize: 9.5, color: "#00CFFF", marginTop: 2 }}>✓ Pay £{totalAmount.toFixed(2)} now and play instantly</div>}
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selectedMethods.instaplay ? "#00CFFF" : "rgba(255,255,255,0.25)"}`, background: selectedMethods.instaplay ? "#00CFFF" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selectedMethods.instaplay && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#000" }} />}
                  </div>
                </div>
              )}

              {/* Insufficient funds warning */}
              {hasSelectedMethod && !selectedMethods.instaplay && remainingAmount > 0 && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,122,0,0.08)", border: "1px solid rgba(255,122,0,0.28)", display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertCircle style={{ width: 15, height: 15, color: "#FF9500", flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: "#FF9500", fontWeight: 600 }}>£{remainingAmount.toFixed(2)} still needed — top up your wallet to continue</span>
                </div>
              )}
            </div>
          </div>

          {/* TERMS checkbox */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "2px 2px" }}>
            <div onClick={() => setAgreeToTerms(!agreeToTerms)}
              style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${agreeToTerms ? GOLD : "rgba(255,255,255,0.3)"}`, background: agreeToTerms ? GOLD : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", marginTop: 1 }}>
              {agreeToTerms && <Check style={{ width: 12, height: 12, color: "#000" }} />}
            </div>
            <input type="checkbox" checked={agreeToTerms} onChange={e => setAgreeToTerms(e.target.checked)} data-testid="checkbox-terms" style={{ display: "none" }} />
            <label style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, cursor: "pointer" }} onClick={() => setAgreeToTerms(!agreeToTerms)}>
              I am over 18 and agree to the{" "}
              <a href="/termsAndConditions" style={{ color: GOLD, textDecoration: "underline", fontWeight: 700 }}>terms and conditions</a>
            </label>
          </div>

          {/* ACTIVATE ENTRY CTA */}
          <div>
            <button onClick={handleConfirmPayment} disabled={isProcessing || !agreeToTerms || !hasSelectedMethod}
              data-testid="button-checkout" className="ub-cta"
              style={{
                width: "100%", padding: "17px 24px", borderRadius: 14, border: "none",
                fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em",
                cursor: (isProcessing || !agreeToTerms || !hasSelectedMethod) ? "not-allowed" : "pointer",
                background: (isProcessing || !agreeToTerms || !hasSelectedMethod)
                  ? "rgba(255,255,255,0.05)"
                  : selectedMethods.instaplay
                    ? "linear-gradient(135deg,#00B4CC,#0070F3,#00B4CC)"
                    : `linear-gradient(135deg,#FFE066 0%,${GOLD} 25%,${AMBER} 55%,${GOLD} 80%,#FFE066 100%)`,
                backgroundSize: "250% 100%",
                color: (isProcessing || !agreeToTerms || !hasSelectedMethod) ? "rgba(255,255,255,0.2)" : "#000",
                boxShadow: (isProcessing || !agreeToTerms || !hasSelectedMethod) ? "none" : `0 0 40px rgba(255,185,0,0.45), 0 8px 30px rgba(255,140,0,0.3)`,
                animation: (isProcessing || !agreeToTerms || !hasSelectedMethod) ? "none" : "ub-plasma 3s ease infinite",
                position: "relative", overflow: "hidden",
              }}>
              {(!isProcessing && agreeToTerms && hasSelectedMethod) && (
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 25%,rgba(255,255,255,0.3) 50%,transparent 75%)", animation: "ub-shimmer 2s ease-in-out infinite" }} />
              )}
              <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {isProcessing ? (
                  <><div style={{ width: 20, height: 20, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "transparent", borderRadius: "50%", animation: "ub-spin 0.7s linear infinite" }} />PROCESSING...</>
                ) : selectedMethods.instaplay ? (
                  <><Zap style={{ width: 20, height: 20 }} />PAY WITH INSTAPLAY — £{totalAmount.toFixed(2)}</>
                ) : remainingAmount > 0 ? (
                  <><Lock style={{ width: 20, height: 20 }} />TOP UP REQUIRED — £{remainingAmount.toFixed(2)}</>
                ) : (
                  <><Zap style={{ width: 20, height: 20 }} />ACTIVATE ENTRY — £{totalAmount.toFixed(2)}</>
                )}
              </span>
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Lock style={{ width: 10, height: 10, color: "rgba(255,185,0,0.45)" }} />
                <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Safe. Secure. Encrypted.</span>
              </div>
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Shield style={{ width: 10, height: 10, color: "rgba(255,185,0,0.45)" }} />
                <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.14em" }}>256-Bit SSL Protection</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* PRIZE POOL */}
          <div style={{ ...P, overflow: "hidden" }}>
            <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${GOLD},${AMBER},transparent)` }} />
            <div style={{ padding: "12px 14px 6px", borderBottom: `1px solid rgba(255,185,0,0.1)`, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 12 }}>🏆</span>
              <span style={{ fontSize: 8.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,185,0,0.6)" }}>PRIZE POOL</span>
            </div>
            <div style={{ position: "relative", overflow: "hidden", textAlign: "center", padding: "10px 14px 0" }}>
              {/* bg image */}
              <img src={competition?.imageUrl || FALLBACK} alt="" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25, filter: "saturate(1.4) blur(4px)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(14,10,2,0.6) 0%,rgba(14,10,2,0.92) 100%)" }} />
              <div style={{ position: "relative", zIndex: 2, padding: "4px 0 12px" }}>
                <div style={{ fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 900, color: GOLD, textShadow: `0 0 40px rgba(255,185,0,0.8), 0 0 80px rgba(255,185,0,0.4)`, lineHeight: 1 }}>
                  {prizeVal || "£10,000"}
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                  CASH PRIZE
                </div>
                {/* Money stack image placeholder */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, marginBottom: 4 }}>
                  {["💰", "💰", "💰"].map((e, i) => (
                    <span key={i} style={{ fontSize: 24, filter: "drop-shadow(0 0 12px rgba(255,185,0,0.5))", animation: `ub-float ${2.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }}>{e}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ENTRY RESERVED TIMER */}
          <div style={{ ...P, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,185,0,0.1)", border: `1px solid rgba(255,185,0,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: GOLD }}>1</div>
              <span style={{ fontSize: 8.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,185,0,0.6)" }}>ENTRY RESERVED</span>
            </div>
            {/* Circular timer */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative", width: 120, height: 120 }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: "absolute", inset: 0 }}>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,185,0,0.08)" strokeWidth="6" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={GOLD} strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - entryTimer / 600)}
                    strokeLinecap="round" transform="rotate(-90 60 60)"
                    style={{ filter: `drop-shadow(0 0 8px rgba(255,185,0,0.6))` }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: "clamp(1.4rem, 4vw, 1.9rem)", fontWeight: 900, color: GOLD, textShadow: `0 0 20px rgba(255,185,0,0.7)`, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
                    {fmtTimer(entryTimer)}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 1.5 }}>
                Time remaining to complete<br />your entry
              </p>
            </div>
          </div>

          {/* WHAT YOU COULD WIN */}
          <div style={{ ...P, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid rgba(255,185,0,0.1)`, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 12 }}>🏆</span>
              <span style={{ fontSize: 8.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,185,0,0.6)" }}>WHAT YOU COULD WIN</span>
            </div>
            <div style={{ padding: "6px 0" }}>
              {[
                { icon: "🥇", label: prizeVal ? `${prizeVal} Cash` : "Top Prize", badge: "TOP PRIZE",         color: GOLD,            badgeBg: "rgba(255,185,0,0.12)", badgeBorder: "rgba(255,185,0,0.3)" },
                { icon: "🥈", label: "£5,000 Cash",                               badge: null,                color: "rgba(255,255,255,0.65)" },
                { icon: "🥉", label: "£1,000 Cash",                               badge: null,                color: AMBER },
                // { icon: "⭐", label: "Bonus RingTone Points",                     badge: "Extra rewards",     color: "#8B5CF6",       badgeBg: "rgba(139,92,246,0.1)", badgeBorder: "rgba(139,92,246,0.25)" },
              ].map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: i < 3 ? `1px solid rgba(255,185,0,0.06)` : "none" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{w.icon}</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: w.color }}>{w.label}</span>
                  {w.badge && (
                    <div style={{ padding: "2px 8px", borderRadius: 20, fontSize: 7.5, fontWeight: 900, background: w.badgeBg, border: `1px solid ${w.badgeBorder}`, color: w.color, whiteSpace: "nowrap" }}>
                      {w.badge}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ TRUST STATS ══ */}
      <div style={{ background: "#060500", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)" }} className="trust-g">
            {[
              { icon: Users,      val: "50,000+", label: "Happy Winners",      color: GOLD,      rgb: "255,185,0"  },
              { icon: Zap,        val: "£2.4M+",  label: "Paid Out",           color: AMBER,     rgb: "255,140,0"  },
              { icon: Star,       val: "4.9/5",   label: "Trustpilot Rating",  color: GOLD,      rgb: "255,185,0", stars: true },
              { icon: Shield,     val: "100%",    label: "Secure & Safe",      color: "#00E676", rgb: "0,230,118" },
              { icon: Headphones, val: "24/7",    label: "Customer Support",   color: "#00CFFF", rgb: "0,207,255" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 10px", borderRight: i < 4 ? `1px solid rgba(255,185,0,0.07)` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${s.rgb},0.1)`, border: `1px solid rgba(${s.rgb},0.25)` }}>
                  <s.icon style={{ width: 17, height: 17, color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.15rem)", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  {(s as any).stars && <div style={{ display: "flex", gap: 1, margin: "1px 0" }}>{[0,1,2,3,4].map(j => <span key={j} style={{ fontSize: 7, color: GOLD }}>★</span>)}</div>}
                  <div style={{ fontSize: 7.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.28)", marginTop: (s as any).stars ? 0 : 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ DISCOUNT DIALOG ══ */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 18 }} className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#fff", fontWeight: 900, fontSize: 17 }}>Apply Discount Code</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input
                value={discountCode} onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "#fff", borderRadius: 10, padding: "12px 14px", fontWeight: 700, letterSpacing: "0.1em", fontSize: 14, textTransform: "uppercase" }}
                onKeyDown={e => e.key === "Enter" && applyDiscountMutation.mutate(discountCode.trim().toUpperCase())}
              />
              <button onClick={() => applyDiscountMutation.mutate(discountCode.trim().toUpperCase())} disabled={applyDiscountMutation.isPending || !discountCode.trim()}
                style={{ padding: "12px 0", borderRadius: 10, border: "none", background: `linear-gradient(135deg,#FFE066,${GOLD})`, color: "#000", fontWeight: 900, fontSize: 13, cursor: "pointer", opacity: !discountCode.trim() ? 0.5 : 1 }}>
                {applyDiscountMutation.isPending ? "Applying..." : "Apply Code"}
              </button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* ══ TOP-UP MODAL ══ */}
      <Dialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
        <DialogContent style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 18 }} className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#fff", fontWeight: 900, fontSize: 17 }}>Insufficient Balance</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              <p>You need <strong style={{ color: GOLD }}>£{remainingAmount.toFixed(2)}</strong> more to complete this purchase.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowTopUpModal(false); setLocation("/wallet?tab=topup"); }}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: `linear-gradient(135deg,#FFE066,${GOLD})`, color: "#000", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
                  Top Up Wallet
                </button>
                <button onClick={() => setShowTopUpModal(false)}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* ══ KEYFRAMES ══ */}
      <style>{`
        @keyframes ub-spin    { to { transform:rotate(360deg) } }
        @keyframes ub-blink   { 0%,100%{opacity:1} 50%{opacity:0.18} }
        @keyframes ub-shimmer { 0%{transform:translateX(-120%)} 100%{transform:translateX(220%)} }
        @keyframes ub-plasma  { 0%,100%{background-position:0% center} 50%{background-position:100% center} }
        @keyframes ub-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .ub-cta:hover:not(:disabled) { transform:translateY(-2px); box-shadow: 0 0 55px rgba(255,185,0,0.55), 0 14px 40px rgba(255,140,0,0.38) !important; }
        .ub-cta:active:not(:disabled) { transform:translateY(0); }
        @media(max-width:760px){
          .ub-main  { grid-template-columns:1fr !important; }
          .ub-hero  { grid-template-columns:1fr !important; }
          .trust-g  { grid-template-columns:repeat(3,1fr) !important; }
        }
        @media(max-width:480px){
          .trust-g  { grid-template-columns:repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}