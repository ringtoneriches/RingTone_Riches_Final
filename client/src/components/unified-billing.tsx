import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  CreditCard, Wallet, Coins, ShieldCheck, Lock, CheckCircle2, AlertCircle,
  Ticket, Sparkles, X, Tag, Percent, Zap, Shield, Star, Trophy, BadgeCheck, Check,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface UnifiedBillingProps {
  orderId: string;
  orderType: "competition" | "spin" | "scratch" | "pop" | "plinko" | "voltz";
  wheelType?: string;
}

/* ── Donut Gauge ── */
function DonutGauge({ pct, size = 130 }: { pct: number; size?: number }) {
  const r = 44, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,196,0,0.08)" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#FFC400" strokeWidth="10"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,196,0,0.7))' }} />
      <text x="50" y="46" textAnchor="middle" fill="#FFC400" fontSize="18" fontWeight="900">{pct}%</text>
      <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontWeight="700">POTENTIAL</text>
    </svg>
  );
}

export default function UnifiedBilling({ orderId, orderType, wheelType }: UnifiedBillingProps) {
  const [, setLocation] = useLocation();
  const [selectedMethods, setSelectedMethods] = useState({ walletBalance: false, ringtonePoints: false, instaplay: false });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [entryTimer, setEntryTimer] = useState(10 * 60);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const t = setInterval(() => setEntryTimer(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const fmtTimer = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const isGame = ["spin", "scratch", "pop", "plinko", "voltz"].includes(orderType);

  const getEndpoint = () => {
    switch (orderType) {
      case "spin": return "/api/spin-order";
      case "scratch": return "/api/scratch-order";
      case "pop": return "/api/pop-order";
      case "plinko": return "/api/plinko-order";
      case "voltz": return "/api/voltz-order";
      default: return "/api/order";
    }
  };

  const getTitle = () => {
    if (orderType === "spin") return wheelType === "wheel2" ? "RETRO RINGTONE SPIN Purchase" : "The Luxury Car Spin Purchase";
    switch (orderType) {
      case "scratch": return "The Landmark Loot Purchase";
      case "pop": return "Ringtone Pop Purchase";
      case "plinko": return "Ringtone Plinko Purchase";
      case "voltz": return "Ringtone Voltz Purchase";
      default: return "Competition Tickets";
    }
  };

  const getItemName = () => {
    if (orderType === "spin") return wheelType === "wheel2" ? "Retro Spins" : "Spins";
    switch (orderType) {
      case "scratch": return "Scratch Cards";
      case "pop": return "Pop Games";
      case "plinko": return "Plinko Games";
      case "voltz": return "Voltz Games";
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

  const order = orderData?.order;
  const user = orderData?.user;
  const competition = orderData?.competition;

  const isInstantCompetition = orderType === "competition" && competition?.type === "instant";
  const isPointsDisabled = isInstantCompetition;

  const itemCost = orderType === "competition"
    ? parseFloat(competition?.ticketPrice || "0")
    : parseFloat(orderData?.scratchCost || orderData?.spinCost || orderData?.popCost || orderData?.plinkoCost || "2");

  const appliedDiscount = Number(order?.discountAmount || 0);
  const discountType = order?.discountType || null;
  const percentageDiscount = Number(order?.percentageDiscount || 0);

  let percentageDiscountCashValue = 0, pointsDiscountCashValue = 0;
  let originalTotalAmount = Number(order?.totalAmount);
  const totalAmount = Number(order?.totalAmount);

  if (discountType === "percentage" && percentageDiscount > 0) {
    originalTotalAmount = totalAmount / (1 - percentageDiscount / 100);
    percentageDiscountCashValue = originalTotalAmount * (percentageDiscount / 100);
  } else if (discountType === "cash" && appliedDiscount > 0) {
    originalTotalAmount = totalAmount + appliedDiscount;
  } else if (discountType === "points" && appliedDiscount > 0) {
    pointsDiscountCashValue = appliedDiscount * 0.01;
    originalTotalAmount = totalAmount + pointsDiscountCashValue;
  }

  const walletBalance = Number(user?.balance) || 0;
  const ringtonePoints = user?.ringtonePoints || 0;
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
    onSuccess: (data) => { setIsApplyingDiscount(false); toast({ title: "Discount Applied 🎉", description: data.message }); setShowDiscountDialog(false); setDiscountCode(""); refetchOrder(); },
    onError: (error: any) => { setIsApplyingDiscount(false); toast({ title: "Discount Failed", description: error.message, variant: "destructive" }); },
  });

  const removeDiscountMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("/api/checkout/remove-discount", "POST", { orderId }); return res.json(); },
    onSuccess: (data) => { if (data.success) { toast({ title: "Discount Removed" }); refetchOrder(); } },
    onError: (error: any) => { toast({ title: "Error", description: error.message || "Failed to remove discount", variant: "destructive" }); },
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

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) { toast({ title: "Code Required", description: "Please enter a discount code", variant: "destructive" }); return; }
    setIsApplyingDiscount(true);
    applyDiscountMutation.mutate(discountCode.trim().toUpperCase());
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

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";

  /* ── LOADING ── */
  if (isLoading) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#050505" }}>
      <div style={{ width: 48, height: 48, border: "2px solid rgba(255,196,0,0.2)", borderTopColor: "#FFC400", borderRadius: "50%", animation: "ub-spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,196,0,0.4)" }}>Loading Order...</p>
      <style>{`@keyframes ub-spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#050505", color: "#fff" }}>
      <AlertCircle style={{ width: 48, height: 48, color: "#FF3B30" }} />
      <p style={{ fontSize: 16, fontWeight: 700 }}>Invalid or expired order.</p>
    </div>
  );

  const qty = order?.quantity || 1;
  const prizeMatch = competition?.title?.match(/£[\d,]+/);
  const prizeVal = prizeMatch ? prizeMatch[0] : "";
  const winPct = Math.min(95, Math.round(15 + (qty / Math.max(competition?.maxTickets || 100, 1)) * 80 + qty * 2));
  const winLabel = winPct >= 70 ? "HIGH POTENTIAL" : winPct >= 45 ? "GOOD POTENTIAL" : "LOW POTENTIAL";
  const winColor = winPct >= 70 ? "#FFC400" : winPct >= 45 ? "#00FF88" : "#FF7A00";

  const P: React.CSSProperties = { background: "#13182A", border: "1px solid rgba(255,196,0,0.22)", borderRadius: 16 };
  const GOLD_BTN: React.CSSProperties = { background: "linear-gradient(135deg,#f6e5b0 0%,#FFC400 30%,#FF7A00 60%,#FFC400 90%,#f6e5b0 100%)", backgroundSize: "250% 100%", color: "#000", fontWeight: 900, border: "none", cursor: "pointer", borderRadius: 12, position: "relative", overflow: "hidden" };
  const DISABLED_BTN: React.CSSProperties = { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)", fontWeight: 900, border: "1px solid rgba(255,255,255,0.06)", cursor: "not-allowed", borderRadius: 12 };
  const LABEL: React.CSSProperties = { fontSize: 9, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.28em", color: "rgba(255,255,255,0.9)" };
  const BODY: React.CSSProperties = { color: "rgba(255,255,255,0.78)" };
  const SUB: React.CSSProperties = { color: "rgba(255,255,255,0.55)" };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "inherit" }}>

      {/* ═══ PROGRESS STEPS ═══ */}
      <div style={{ background: "#0D1120", borderBottom: "1px solid rgba(255,196,0,0.2)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {[
              { n: 1, label: "TICKETS", done: true },
              { n: 2, label: "CHECKOUT", active: true },
              { n: 3, label: "CONFIRMATION", done: false },
            ].map((s, i) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <div style={{ width: 40, height: 1.5, background: s.active ? "rgba(255,196,0,0.7)" : "rgba(255,255,255,0.18)", margin: "0 8px" }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, background: s.done ? "#FFC400" : s.active ? "transparent" : "rgba(255,255,255,0.08)", border: s.active ? "2px solid #FFC400" : s.done ? "none" : "1px solid rgba(255,255,255,0.2)", color: s.done ? "#000" : s.active ? "#FFC400" : "rgba(255,255,255,0.45)" }}>
                    {s.done ? <Check style={{ width: 13, height: 13 }} /> : s.n}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: s.done ? "#FFC400" : s.active ? "#FFC400" : "rgba(255,255,255,0.45)" }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)" }}>
            <Lock style={{ width: 11, height: 11, color: "#00FF88" }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: "#00FF88", textTransform: "uppercase", letterSpacing: "0.18em" }}>256-bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <section style={{ position: "relative", overflow: "hidden", background: "#08091A" }}>
        {competition?.imageUrl && (
          <img src={competition.imageUrl} alt="" onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.15, filter: "saturate(0.8) blur(2px)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(8,9,26,0.97) 45%, rgba(8,9,26,0.8) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 55%, #050505 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#FF7A00 20%,#FFC400 50%,#FF7A00 80%,transparent)" }} />
        <div style={{ position: "absolute", top: "20%", right: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(255,196,0,0.08),transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 1320, margin: "0 auto", padding: "36px 20px 56px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 40, alignItems: "center" }} className="ub-hero-grid">
          {/* LEFT */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, padding: "6px 14px", borderRadius: 20, background: "rgba(255,196,0,0.12)", border: "1px solid rgba(255,196,0,0.35)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFC400", boxShadow: "0 0 8px #FFC400", animation: "ub-blink 1.5s ease-in-out infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: "#FFC400", textTransform: "uppercase", letterSpacing: "0.22em" }}>✦ SECURE CHECKOUT</span>
            </div>

            <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 3rem)", fontWeight: 900, lineHeight: 1.08, marginBottom: 10, color: "#fff" }}>
              YOU'RE 30 SECONDS AWAY FROM
            </h1>
            <h2 style={{ fontSize: "clamp(1.9rem, 4.2vw, 3.4rem)", fontWeight: 900, lineHeight: 1, marginBottom: 20, background: "linear-gradient(135deg, #FFE066, #FFC400, #FF7A00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              WINNING BIG!
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 28, lineHeight: 1.7, maxWidth: 480 }}>
              Complete your entry now and stand a chance to win an incredible prize.
            </p>

            {/* Mini trust badges */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { icon: Shield, label: "100% Secure", sub: "Payments", color: "#00D4FF", bg: "rgba(0,212,255,0.08)", border: "rgba(0,212,255,0.25)" },
                { icon: Zap, label: "Instant", sub: "Entries", color: "#FFC400", bg: "rgba(255,196,0,0.08)", border: "rgba(255,196,0,0.25)" },
                { icon: BadgeCheck, label: "Guaranteed", sub: "Draws", color: "#00FF88", bg: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.25)" },
              ].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 14, background: b.bg, border: `1px solid ${b.border}` }}>
                  <b.icon style={{ width: 18, height: 18, color: b.color }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{b.label}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{b.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Holographic Prize Card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", padding: "10px 0 80px" }}>
            {/* Card */}
            <div style={{ width: "100%", maxWidth: 320, borderRadius: 20, overflow: "hidden", background: "linear-gradient(145deg,rgba(20,16,0,0.96),rgba(10,10,5,0.98))", border: "1px solid rgba(255,196,0,0.5)", boxShadow: "0 0 60px rgba(255,196,0,0.2),0 30px 80px rgba(0,0,0,0.8)", position: "relative", zIndex: 10, animation: "ub-float 5s ease-in-out infinite" }}>
              <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
                <img src={competition?.imageUrl || FALLBACK_IMG} alt="" onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.2) brightness(0.65)" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.75) 100%)" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 20%,rgba(255,196,0,0.14) 50%,transparent 80%)", animation: "ub-shimmer 3s ease-in-out infinite" }} />
              </div>
              <div style={{ padding: "12px 16px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 7, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.35em", color: "rgba(255,196,0,0.45)", marginBottom: 4 }}>YOUR PRIZE</div>
                {prizeVal && <div style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)", fontWeight: 900, color: "#FFC400", textShadow: "0 0 40px rgba(255,196,0,0.7)", lineHeight: 1, marginBottom: 6 }}>{prizeVal}</div>}
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{getTitle()}</div>
              </div>
            </div>

            {/* Energy rings */}
            <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", width: 320, height: 90, pointerEvents: "none", zIndex: 5 }}>
              {[{ w: 150, h: 34, op: 0.75 }, { w: 220, h: 50, op: 0.45 }, { w: 300, h: 68, op: 0.22 }].map((r, i) => (
                <div key={i} style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: r.w, height: r.h, borderRadius: "50%", border: `1.5px solid rgba(255,196,0,${r.op})`, boxShadow: `0 0 ${10 + i * 10}px rgba(255,196,0,${r.op * 0.8})`, animation: `ub-ring ${2.2 + i * 0.9}s ease-in-out ${i * 0.45}s infinite` }} />
              ))}
              <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: 200, height: 20, background: "radial-gradient(ellipse,rgba(255,196,0,0.28),transparent 70%)", filter: "blur(8px)" }} />
              {/* Entry timer */}
              <div style={{ position: "absolute", bottom: -42, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFC400", boxShadow: "0 0 8px #FFC400", animation: "ub-blink 1s ease-in-out infinite" }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.18em" }}>ENTRY RESERVED FOR</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#FFC400", textShadow: "0 0 16px rgba(255,196,0,0.8)", letterSpacing: "0.06em" }}>{fmtTimer(entryTimer)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MAIN 2-COLUMN ═══ */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 20px 48px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }} className="ub-main-grid">

        {/* ── LEFT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ORDER SUMMARY */}
          <div style={{ ...P }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,196,0,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 16, background: "#FFC400", borderRadius: 2, boxShadow: "0 0 10px rgba(255,196,0,0.6)" }} />
                <Ticket style={{ width: 15, height: 15, color: "#FFC400" }} />
                <span style={{ ...LABEL }}>ORDER SUMMARY</span>
              </div>
              {/* Discount */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {appliedDiscount > 0 || percentageDiscount > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ padding: "3px 10px", borderRadius: 20, fontSize: 9, fontWeight: 900, background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.25)", color: "#00FF88" }}>
                      {discountType === "cash" ? `£${appliedDiscount} OFF` : discountType === "points" ? `${appliedDiscount} Points OFF` : `${percentageDiscount}% OFF`}
                    </div>
                    <button onClick={() => removeDiscountMutation.mutate()} disabled={removeDiscountMutation.isPending} style={{ background: "none", border: "none", color: "rgba(255,59,48,0.7)", cursor: "pointer", padding: 4 }}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowDiscountDialog(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 10, background: "rgba(255,196,0,0.06)", border: "1px solid rgba(255,196,0,0.18)", color: "#FFC400", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em", cursor: "pointer" }}>
                    <Tag style={{ width: 11, height: 11 }} /> Apply Discount
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: "16px 18px" }}>
              {/* Competition / Item name */}
              {competition && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(255,196,0,0.07)", border: "1px solid rgba(255,196,0,0.22)", marginBottom: 14 }}>
                  {competition.imageUrl && (
                    <img src={competition.imageUrl} alt="" onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,196,0,0.2)" }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "#FFC400", marginBottom: 4 }}>COMPETITION</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>{competition.title}</div>
                  </div>
                </div>
              )}

              {/* Data rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[
                  { label: getItemName() + " Selected", value: String(qty) },
                  { label: "Price per " + (getItemName().endsWith("s") ? getItemName().slice(0, -1) : getItemName()), value: `£${itemCost.toFixed(2)}` },
                  ...(appliedDiscount > 0 && discountType === "cash" ? [{ label: "Cash Discount", value: `-£${appliedDiscount.toFixed(2)}`, green: true }] : []),
                  ...(appliedDiscount > 0 && discountType === "points" ? [{ label: "Points Discount", value: `-£${pointsDiscountCashValue.toFixed(2)}`, green: true }] : []),
                  ...(discountType === "percentage" && percentageDiscount > 0 ? [{ label: `${percentageDiscount}% Discount`, value: `-£${percentageDiscountCashValue.toFixed(2)}`, green: true }] : []),
                ].map((r: any, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: i % 2 === 0 ? "rgba(255,255,255,0.04)" : "transparent" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>{r.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: r.green ? "#00FF88" : "#fff" }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: "rgba(255,196,0,0.2)", margin: "14px 0" }} />

              {/* Total */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 14, background: "rgba(255,196,0,0.08)", border: "1px solid rgba(255,196,0,0.28)" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.85)" }}>TOTAL AMOUNT</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: "#00FF88", display: "flex", alignItems: "center", gap: 4 }}>
                      <Check style={{ width: 11, height: 11 }} /> Includes VAT
                    </span>
                    <span style={{ fontSize: 10, color: "#00FF88", display: "flex", alignItems: "center", gap: 4 }}>
                      <Check style={{ width: 11, height: 11 }} /> No Hidden Fees
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {(appliedDiscount > 0 || percentageDiscount > 0) && (
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "line-through", marginBottom: 2 }}>£{originalTotalAmount.toFixed(2)}</div>
                  )}
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#FFC400", textShadow: "0 0 32px rgba(255,196,0,0.7)", lineHeight: 1 }}>£{totalAmount.toFixed(2)}</div>
                </div>
              </div>

              {/* Bonus banner */}
              <div style={{ marginTop: 12, padding: "11px 14px", borderRadius: 12, background: "rgba(255,196,0,0.07)", border: "1px solid rgba(255,196,0,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
                <Sparkles style={{ width: 16, height: 16, color: "#FFC400", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
                  <strong style={{ color: "#FFC400" }}>BONUS:</strong> Win a free entry to our £250 Cash draw!
                </span>
              </div>
            </div>
          </div>

          {/* CHOOSE PAYMENT METHOD */}
          <div style={{ ...P }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,196,0,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 3, height: 16, background: "#FFC400", borderRadius: 2, boxShadow: "0 0 10px rgba(255,196,0,0.6)" }} />
              <CreditCard style={{ width: 15, height: 15, color: "#FFC400" }} />
              <span style={{ ...LABEL }}>CHOOSE PAYMENT METHOD</span>
            </div>

            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Payment breakdown hint if both selected */}
              {selectedMethods.walletBalance && selectedMethods.ringtonePoints && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Sparkles style={{ width: 14, height: 14, color: "#00FF88" }} />
                  <span style={{ fontSize: 11, color: "#00FF88" }}>Using Wallet + Points together</span>
                </div>
              )}

              {/* WALLET BALANCE */}
              <div onClick={() => handleMethodToggle("walletBalance")} data-testid="checkbox-wallet"
                style={{ padding: "16px 16px", borderRadius: 14, border: `2px solid ${selectedMethods.walletBalance ? "#00FF88" : "rgba(255,255,255,0.18)"}`, background: selectedMethods.walletBalance ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s" }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 13, background: selectedMethods.walletBalance ? "rgba(0,255,136,0.18)" : "rgba(255,255,255,0.08)", border: `1.5px solid ${selectedMethods.walletBalance ? "rgba(0,255,136,0.5)" : "rgba(255,255,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Wallet style={{ width: 20, height: 20, color: selectedMethods.walletBalance ? "#00FF88" : "rgba(255,255,255,0.65)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 3 }}>WALLET BALANCE</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Available: <span style={{ color: selectedMethods.walletBalance ? "#00FF88" : "#FFC400", fontWeight: 700 }}>£{walletBalance.toFixed(2)}</span></div>
                  {selectedMethods.walletBalance && walletUsed > 0 && <div style={{ fontSize: 10, color: "#00FF88", marginTop: 3 }}>✓ Using £{walletUsed.toFixed(2)} from wallet</div>}
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 7, border: `2.5px solid ${selectedMethods.walletBalance ? "#00FF88" : "rgba(255,255,255,0.3)"}`, background: selectedMethods.walletBalance ? "#00FF88" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {selectedMethods.walletBalance && <Check style={{ width: 13, height: 13, color: "#000" }} />}
                </div>
              </div>

              {/* RINGTONE POINTS */}
              <div onClick={isPointsDisabled ? undefined : () => handleMethodToggle("ringtonePoints")} data-testid="checkbox-points"
                style={{ padding: "16px 16px", borderRadius: 14, border: `2px solid ${isPointsDisabled ? "rgba(255,255,255,0.08)" : selectedMethods.ringtonePoints ? "#FFC400" : "rgba(255,255,255,0.18)"}`, background: isPointsDisabled ? "rgba(255,255,255,0.02)" : selectedMethods.ringtonePoints ? "rgba(255,196,0,0.08)" : "rgba(255,255,255,0.03)", cursor: isPointsDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 14, opacity: isPointsDisabled ? 0.5 : 1, transition: "all 0.2s" }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 13, background: selectedMethods.ringtonePoints ? "rgba(255,196,0,0.18)" : "rgba(255,255,255,0.08)", border: `1.5px solid ${selectedMethods.ringtonePoints ? "rgba(255,196,0,0.5)" : "rgba(255,255,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Coins style={{ width: 20, height: 20, color: selectedMethods.ringtonePoints && !isPointsDisabled ? "#FFC400" : "rgba(255,255,255,0.55)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isPointsDisabled ? "rgba(255,255,255,0.45)" : "#fff", marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
                    RINGTONE POINTS
                    {isPointsDisabled && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(255,59,48,0.18)", color: "#FF6B6B", fontWeight: 700 }}>Not Available</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Available: <span style={{ color: "#FFC400", fontWeight: 700 }}>{ringtonePoints.toLocaleString()} pts (£{ringtoneBalance.toFixed(2)})</span></div>
                  {isPointsDisabled && <div style={{ fontSize: 10, color: "#FF6B6B", marginTop: 3 }}>Points cannot be used for competitions</div>}
                  {!isPointsDisabled && selectedMethods.ringtonePoints && pointsUsed > 0 && <div style={{ fontSize: 10, color: "#FFC400", marginTop: 3 }}>✓ Using £{pointsUsed.toFixed(2)} ({pointsNeeded} pts)</div>}
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 7, border: `2.5px solid ${selectedMethods.ringtonePoints && !isPointsDisabled ? "#FFC400" : "rgba(255,255,255,0.3)"}`, background: selectedMethods.ringtonePoints && !isPointsDisabled ? "#FFC400" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {selectedMethods.ringtonePoints && !isPointsDisabled && <Check style={{ width: 13, height: 13, color: "#000" }} />}
                </div>
              </div>

              {/* INSTAPLAY (card payment) */}
              {isGame && (
                <div onClick={() => handleMethodToggle("instaplay")} data-testid="checkbox-instaplay"
                  style={{ padding: "16px 16px", borderRadius: 14, border: `2px solid ${selectedMethods.instaplay ? "#C084FC" : "rgba(255,255,255,0.18)"}`, background: selectedMethods.instaplay ? "rgba(192,132,252,0.08)" : "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s" }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: selectedMethods.instaplay ? "rgba(192,132,252,0.18)" : "rgba(255,255,255,0.08)", border: `1.5px solid ${selectedMethods.instaplay ? "rgba(192,132,252,0.5)" : "rgba(255,255,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Zap style={{ width: 20, height: 20, color: selectedMethods.instaplay ? "#C084FC" : "rgba(255,255,255,0.55)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>VISA / DEBIT CARD</span>
                      <div style={{ padding: "3px 9px", borderRadius: 10, fontSize: 8, fontWeight: 900, background: "rgba(192,132,252,0.18)", border: "1px solid rgba(192,132,252,0.35)", color: "#C084FC" }}>Fast & Instant</div>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Pay securely • No wallet top-up needed</div>
                    {selectedMethods.instaplay && <div style={{ fontSize: 10, color: "#C084FC", marginTop: 3 }}>✓ Pay £{totalAmount.toFixed(2)} now and play instantly</div>}
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 7, border: `2.5px solid ${selectedMethods.instaplay ? "#C084FC" : "rgba(255,255,255,0.3)"}`, background: selectedMethods.instaplay ? "#C084FC" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selectedMethods.instaplay && <Check style={{ width: 13, height: 13, color: "#fff" }} />}
                  </div>
                </div>
              )}

              {/* Remaining amount warning */}
              {hasSelectedMethod && !selectedMethods.instaplay && remainingAmount > 0 && (
                <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,122,0,0.1)", border: "1px solid rgba(255,122,0,0.35)", display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertCircle style={{ width: 16, height: 16, color: "#FF9500", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#FF9500", fontWeight: 600 }}>£{remainingAmount.toFixed(2)} still needed — top up your wallet to continue</span>
                </div>
              )}
            </div>
          </div>

          {/* TERMS */}
          <div style={{ ...P, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div onClick={() => setAgreeToTerms(!agreeToTerms)}
              style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${agreeToTerms ? "#FFC400" : "rgba(255,255,255,0.35)"}`, background: agreeToTerms ? "#FFC400" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", marginTop: 2 }}>
              {agreeToTerms && <Check style={{ width: 13, height: 13, color: "#000" }} />}
            </div>
            <input type="checkbox" checked={agreeToTerms} onChange={e => setAgreeToTerms(e.target.checked)} data-testid="checkbox-terms" style={{ display: "none" }} />
            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", lineHeight: 1.6, cursor: "pointer" }} onClick={() => setAgreeToTerms(!agreeToTerms)}>
              I am over 18 and agree to the{" "}
              <a href="/termsAndConditions" style={{ color: "#FFC400", textDecoration: "underline", fontWeight: 700 }}>terms and conditions</a>
            </label>
          </div>

          {/* SECURE MY ENTRIES CTA */}
          <div>
            <button onClick={handleConfirmPayment} disabled={isProcessing || !agreeToTerms || !hasSelectedMethod}
              data-testid="button-checkout" className="ub-cta"
              style={{
                width: "100%", padding: "20px 24px", borderRadius: 16,
                fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                border: "none", cursor: (isProcessing || !agreeToTerms || !hasSelectedMethod) ? "not-allowed" : "pointer",
                background: (isProcessing || !agreeToTerms || !hasSelectedMethod)
                  ? "rgba(255,255,255,0.07)"
                  : selectedMethods.instaplay
                    ? "linear-gradient(135deg,#C084FC 0%,#7C3AED 50%,#C084FC 100%)"
                    : "linear-gradient(135deg,#ffe066 0%,#FFC400 25%,#FF7A00 55%,#FFC400 80%,#ffe066 100%)",
                backgroundSize: "250% 100%",
                color: (isProcessing || !agreeToTerms || !hasSelectedMethod) ? "rgba(255,255,255,0.28)" : "#000",
                boxShadow: (isProcessing || !agreeToTerms || !hasSelectedMethod) ? "none" : "0 8px 40px rgba(255,196,0,0.5)",
                animation: (isProcessing || !agreeToTerms || !hasSelectedMethod) ? "none" : "ub-plasma 3s ease infinite",
                position: "relative", overflow: "hidden",
              }}
            >
              {(!isProcessing && agreeToTerms && hasSelectedMethod) && (
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 25%,rgba(255,255,255,0.32) 50%,transparent 75%)", animation: "ub-shimmer 2s ease-in-out infinite" }} />
              )}
              <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {isProcessing ? (
                  <><div style={{ width: 22, height: 22, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "transparent", borderRadius: "50%", animation: "ub-spin 0.7s linear infinite" }} />PROCESSING...</>
                ) : selectedMethods.instaplay ? (
                  <><Zap style={{ width: 22, height: 22 }} />PAY WITH INSTAPLAY — £{totalAmount.toFixed(2)}</>
                ) : remainingAmount > 0 ? (
                  <><Lock style={{ width: 22, height: 22 }} />TOP UP REQUIRED — £{remainingAmount.toFixed(2)}</>
                ) : (
                  <><Lock style={{ width: 22, height: 22 }} />SECURE MY ENTRIES — £{totalAmount.toFixed(2)}</>
                )}
              </span>
            </button>

            {/* Security line */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Shield style={{ width: 12, height: 12, color: "#00FF88" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Safe. Secure. Encrypted.</span>
              </div>
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.25)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Lock style={{ width: 12, height: 12, color: "#00FF88" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.14em" }}>256-bit SSL Protection</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* WINNING POTENTIAL */}
          <div style={{ ...P, position: "relative", overflow: "hidden" }}>
            <div style={{ height: 3, background: "linear-gradient(90deg,#FF7A00,#FFC400 50%,rgba(255,196,0,0.2),transparent)" }} />
            <div style={{ padding: "16px 18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 16, background: "#FFC400", borderRadius: 2, boxShadow: "0 0 10px rgba(255,196,0,0.6)" }} />
                <span style={{ ...LABEL }}>WINNING POTENTIAL</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 18, lineHeight: 1.5 }}>The more entries you select, the better your chances!</p>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <DonutGauge pct={winPct} size={140} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: winColor, textShadow: `0 0 20px ${winColor}70` }}>{winLabel}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.16em" }}>{qty} {getItemName().toUpperCase()} SELECTED</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 10 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} style={{ width: 16, height: 16, color: i <= Math.round(winPct / 20) ? "#FFC400" : "rgba(255,255,255,0.18)" }} fill={i <= Math.round(winPct / 20) ? "#FFC400" : "none"} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT BREAKDOWN (if applicable) */}
          {(selectedMethods.walletBalance || selectedMethods.ringtonePoints) && !selectedMethods.instaplay && (
            <div style={{ ...P }}>
              <div style={{ padding: "13px 16px", borderBottom: "1px solid rgba(255,196,0,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 16, background: "#FFC400", borderRadius: 2 }} />
                <span style={{ ...LABEL }}>PAYMENT BREAKDOWN</span>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Order Total", value: `£${originalTotalAmount.toFixed(2)}`, color: "#fff" },
                  ...(appliedDiscount > 0 ? [{ label: "Discount", value: discountType === "percentage" ? `-${percentageDiscount}%` : `-£${appliedDiscount.toFixed(2)}`, color: "#00FF88" }] : []),
                  ...(selectedMethods.walletBalance && walletUsed > 0 ? [{ label: "Wallet", value: `-£${walletUsed.toFixed(2)}`, color: "#00FF88" }] : []),
                  ...(selectedMethods.ringtonePoints && pointsUsed > 0 ? [{ label: `Points (${pointsNeeded} pts)`, value: `-£${pointsUsed.toFixed(2)}`, color: "#FFC400" }] : []),
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: r.color }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: "rgba(255,196,0,0.08)", border: "1px solid rgba(255,196,0,0.25)", marginTop: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.85)" }}>Remaining to Pay</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#FFC400" }}>{remainingAmount > 0 ? `£${remainingAmount.toFixed(2)}` : "PAID IN FULL"}</span>
                </div>
              </div>
            </div>
          )}

          {/* TRUSTED BY THOUSANDS */}
          <div style={{ ...P }}>
            <div style={{ padding: "13px 16px", borderBottom: "1px solid rgba(255,196,0,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 3, height: 16, background: "#FFC400", borderRadius: 2 }} />
              <span style={{ ...LABEL }}>TRUSTED BY THOUSANDS</span>
            </div>
            <div style={{ padding: "16px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: "rgba(255,196,0,0.12)", border: "1px solid rgba(255,196,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Star style={{ width: 24, height: 24, color: "#FFC400" }} fill="rgba(255,196,0,0.5)" />
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#FFC400", lineHeight: 1, textShadow: "0 0 24px rgba(255,196,0,0.5)" }}>50,000+</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 2 }}>HAPPY WINNERS</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
                {[
                  { value: "£2.4M+", label: "Paid Out", color: "#FFC400" },
                  { value: "4.9", label: "Trustpilot", color: "#FFC400" },
                  { value: "100%", label: "Secure & Safe", color: "#00FF88" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "12px 6px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,196,0,0.15)" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: "rgba(0,185,96,0.1)", border: "1px solid rgba(0,185,96,0.28)" }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} style={{ width: 13, height: 13, color: "#00B960" }} fill="#00B960" />)}
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>4.9 out of 5 • Trustpilot</span>
              </div>
            </div>
          </div>

          {/* WHAT YOU COULD WIN */}
          <div style={{ ...P }}>
            <div style={{ padding: "13px 16px", borderBottom: "1px solid rgba(255,196,0,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 3, height: 16, background: "#FFC400", borderRadius: 2 }} />
              <Trophy style={{ width: 14, height: 14, color: "#FFC400" }} />
              <span style={{ ...LABEL }}>WHAT YOU COULD WIN</span>
            </div>
            <div style={{ padding: "16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: Trophy, title: prizeVal ? `${prizeVal} Prize` : "Amazing Prize", sub: competition?.title?.split("–")[0].trim() || "Incredible reward awaits", color: "#FFC400", rgb: "255,196,0" },
                { icon: Coins, title: "£250 Cash Alternative", sub: "Cash prize if you prefer", color: "#FF7A00", rgb: "255,122,0" },
                { icon: Sparkles, title: "VIP Rewards", sub: "Exclusive bonuses & offers", color: "#C084FC", rgb: "192,132,252" },
              ].map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: `rgba(${w.rgb},0.14)`, border: `1px solid rgba(${w.rgb},0.32)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <w.icon style={{ width: 17, height: 17, color: w.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{w.title}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.58)", lineHeight: 1.4 }}>{w.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECURE PAYMENT */}
          <div style={{ ...P, padding: "16px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#0060EE,#003DAA)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 18px rgba(0,80,200,0.4)" }}>
                <Shield style={{ width: 20, height: 20, color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>Secure Payment</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>256-bit military grade encryption</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["256-bit SSL Encryption", "PCI DSS Compliant", "Secure Payment Gateway"].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle2 style={{ width: 15, height: 15, color: "#00FF88", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM TRUST BAR ═══ */}
      <div style={{ background: "#0D1120", borderTop: "1px solid rgba(255,196,0,0.18)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 20px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }} className="ub-trust-bar">
          {[
            { icon: Zap, title: "INSTANT ENTRY", sub: "Get your entries instantly", color: "#FFC400", rgb: "255,196,0" },
            { icon: BadgeCheck, title: "FAIR & TRANSPARENT", sub: "UK Compliant & Certified", color: "#00FF88", rgb: "0,255,136" },
            { icon: Lock, title: "SECURE PAYMENTS", sub: "256-bit SSL Encrypted", color: "#00D4FF", rgb: "0,212,255" },
            { icon: Sparkles, title: "24/7 SUPPORT", sub: "We're here to help", color: "#C084FC", rgb: "192,132,252" },
          ].map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(${b.rgb},0.12)`, border: `1px solid rgba(${b.rgb},0.28)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <b.icon style={{ width: 18, height: 18, color: b.color }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>{b.title}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TOP UP MODAL ── */}
      <Dialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
        <DialogContent style={{ background: "#0d0d18", border: "1px solid rgba(255,196,0,0.2)", borderRadius: 24 }} className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>Insufficient Funds</DialogTitle>
            <DialogDescription style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 8 }}>
              You need £{remainingAmount.toFixed(2)} more to complete this purchase. Top up your wallet to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter style={{ gap: 10 }}>
            <button onClick={() => setShowTopUpModal(false)} style={{ padding: "10px 20px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => { setShowTopUpModal(false); window.location.href = "/wallet"; }} style={{ padding: "10px 28px", borderRadius: 12, background: "linear-gradient(135deg,#f6e5b0,#FFC400)", color: "#000", fontWeight: 900, border: "none", cursor: "pointer" }}>
              Top Up Wallet
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DISCOUNT DIALOG ── */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent style={{ background: "#0d0d18", border: "1px solid rgba(255,196,0,0.2)", borderRadius: 24 }} className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>Apply Discount Code</DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input
              placeholder="Enter discount code"
              value={discountCode}
              onChange={e => setDiscountCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleApplyDiscount()}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,196,0,0.2)", color: "#fff", fontSize: 14, fontWeight: 700, padding: "12px 16px", borderRadius: 12 }}
            />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDiscountDialog(false)} style={{ padding: "10px 20px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleApplyDiscount} disabled={isApplyingDiscount} style={{ padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg,#f6e5b0,#FFC400)", color: "#000", fontWeight: 900, border: "none", cursor: isApplyingDiscount ? "not-allowed" : "pointer", opacity: isApplyingDiscount ? 0.6 : 1 }}>
              {isApplyingDiscount ? "Applying..." : "Apply"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes ub-spin    { to { transform:rotate(360deg); } }
        @keyframes ub-blink   { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes ub-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes ub-shimmer { 0%{transform:translateX(-120%)} 100%{transform:translateX(220%)} }
        @keyframes ub-ring    { 0%,100%{opacity:0.7;box-shadow:0 0 10px rgba(255,196,0,0.4)} 50%{opacity:1;box-shadow:0 0 28px rgba(255,196,0,0.75)} }
        @keyframes ub-plasma  { 0%,100%{background-position:0% center} 50%{background-position:100% center} }
        .ub-cta:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 14px 45px rgba(255,196,0,0.55) !important; }
        .ub-cta:active:not(:disabled) { transform:translateY(0); }
        @media(max-width:1060px) { .ub-main-grid { grid-template-columns:1fr !important; } }
        @media(max-width:860px)  { .ub-hero-grid { grid-template-columns:1fr !important; } }
        @media(max-width:600px)  { .ub-trust-bar { grid-template-columns:repeat(2,1fr) !important; } }
      `}</style>
    </div>
  );
}