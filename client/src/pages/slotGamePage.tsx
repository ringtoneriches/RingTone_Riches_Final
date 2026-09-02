import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { GameEmpty, GameShell, GameStatus } from "@/components/games/GameChrome";
import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, RefreshCw, Trophy, X, Sparkles } from "lucide-react";
import PlayResultsTable, { type PlayResultRow } from "@/components/games/PlayResultsTable";
import { usePurchaseArrivalToast } from "@/lib/purchase-toast";
import RevealAllBatchSummary from "@/components/games/RevealAllBatchSummary";
import SlotGameComponent from "@/components/games/slot-game";
import ChaserBorder from "@/components/home/ChaserBorder";
import confetti from "canvas-confetti";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SlotSpinResult {
  isWin: boolean;
  coinsWon: number;
  prizeType: string;
  prizeName: string;
  spinsRemaining: number;
  newEntry: {
    id: string;
    isWin: boolean;
    coinsWon: number;
    coinsSpent: number;
    spinNumber: number;
    usedAt: string;
  };
}

const GOLD = "#F1D47A";
const AMBER = "#C8102E";
const WIN_CONFETTI_COLORS = ["#C8102E", "#FF263D", "#F1D47A", "#B98928", "#fff8ee"];

function fireSlotWinConfetti() {
  const duration = 3200;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 32, spread: 360, ticks: 70, zIndex: 80, colors: WIN_CONFETTI_COLORS };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      window.clearInterval(interval);
      return;
    }
    const particleCount = 42 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);

  confetti({
    particleCount: 160,
    spread: 110,
    origin: { y: 0.42 },
    colors: WIN_CONFETTI_COLORS,
    startVelocity: 48,
    zIndex: 80,
  });

  return () => window.clearInterval(interval);
}

function WinOverlay({
  show,
  coinsWon,
  prizeType,
  prizeName,
  onDismiss,
}: {
  show: boolean;
  coinsWon: number;
  prizeType: "cash" | "points";
  prizeName: string;
  onDismiss: () => void;
}) {
  const isCash = prizeType === "cash";
  const winLabel = coinsWon >= 1000 ? "Jackpot" : coinsWon >= 500 ? "Big win" : "Instant win";
  const headline = isCash
    ? `+£${Number(coinsWon).toLocaleString()}`
    : `+${Number(coinsWon).toLocaleString()} pts`;

  useEffect(() => {
    if (!show) return;
    return fireSlotWinConfetti();
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="rr-slot-panel fixed inset-0 z-[55] flex items-center justify-center p-4"
      style={{ background: "rgba(5,5,5,0.88)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-win-title"
    >
      <div className="relative w-full max-w-[400px] animate-bounce-in">
        <div
          className="pointer-events-none absolute -inset-8 rounded-[2rem] blur-3xl"
          style={{ background: "radial-gradient(circle at 50% 40%, rgba(200,16,46,0.28), rgba(241,212,122,0.08) 46%, transparent 72%)" }}
        />

        <ChaserBorder variant="featured">
          <div className="relative bg-gradient-to-b from-[#111115] via-[#0A0A0D] to-[#050505] px-6 pb-6 pt-8 text-center sm:px-8 sm:pb-7 sm:pt-9">
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#050505]/80 text-white/55 transition-colors hover:border-[#F1D47A]/40 hover:text-[#F1D47A]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
              <Trophy className="h-3.5 w-3.5 text-[#F1D47A]" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                Congratulations
              </span>
            </div>

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[#F1D47A]/35 bg-[#F1D47A]/10 shadow-[0_0_28px_rgba(241,212,122,0.22)]">
              <Trophy className="h-9 w-9 text-[#F1D47A]" />
            </div>

            <h2 id="slot-win-title" className="font-prize text-4xl leading-none text-white sm:text-5xl">
              YOU WON
            </h2>
            {prizeName ? (
              <p className="mt-2 text-sm text-white/50">{prizeName}</p>
            ) : null}

            <div className="mt-5 rounded-2xl border border-[#F1D47A]/25 bg-[#F1D47A]/[0.06] px-4 py-5">
              <p className="font-prize text-5xl leading-none text-[#F1D47A] sm:text-6xl">{headline}</p>
              <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#FF263D]">
                {isCash ? "Cash prize" : "Ringtone points"}
              </p>
            </div>

            <p className="mt-3 text-xs text-white/45">
              {isCash ? "Credits added to your balance" : "Points added to your account"}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#F1D47A]/30 bg-[#F1D47A]/10 px-3.5 py-1">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F1D47A]">{winLabel}</span>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="rr-cta mt-6 h-12 w-full rounded-xl text-sm font-black uppercase tracking-[0.16em]"
            >
              Continue
            </button>
          </div>
        </ChaserBorder>
      </div>
    </div>
  );
}

function LoseOverlay({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  if (!show) return null;

  return (
    <div
      className="rr-slot-panel fixed inset-0 z-[55] flex items-center justify-center p-4"
      style={{ background: "rgba(5,5,5,0.86)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-lose-title"
    >
      <div className="relative w-full max-w-[400px] animate-bounce-in">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#111115] via-[#0A0A0D] to-[#050505] px-6 pb-6 pt-8 text-center sm:px-8">
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#050505]/80 text-white/55 transition-colors hover:border-white/25 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
            <X className="h-7 w-7 text-white/40" />
          </div>

          <h2 id="slot-lose-title" className="font-prize text-4xl leading-none text-white">
            NO MATCH
          </h2>
          <p className="mt-3 text-sm text-white/50">
            Better luck on your next spin. The next reel could be yours.
          </p>

          <button
            type="button"
            onClick={onDismiss}
            className="mt-6 h-12 w-full rounded-xl border border-white/15 bg-white/8 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/12"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

type RevealAllResult = {
  isWin: boolean;
  coinsWon: number;
  prizeName?: string | null;
  prizeType?: string | null;
  spinNumber?: number;
};

function SessionStrip({
  purchased,
  used,
  remaining,
  creditsWon,
  canRevealAll,
  isRevealing,
  revealDisabled,
  onRevealAll,
}: {
  purchased: number;
  used: number;
  remaining: number;
  creditsWon: number;
  canRevealAll: boolean;
  isRevealing: boolean;
  revealDisabled: boolean;
  onRevealAll: () => void;
}) {
  const cells = [
    { label: "Spins", value: `${used}/${purchased}` },
    { label: "Left", value: remaining },
    { label: "Won", value: creditsWon > 0 ? `+${creditsWon.toLocaleString()}` : "0", accent: creditsWon > 0 },
  ];

  return (
    <div
      className="rr-slot-panel overflow-hidden rounded-2xl border border-white/10"
      style={{ background: "linear-gradient(160deg,#0A0A0D 0%,#111115 100%)" }}
    >
      <div className="grid grid-cols-3 divide-x divide-white/10">
        {cells.map((cell) => (
          <div key={cell.label} className="px-1.5 py-3 text-center sm:px-3 sm:py-3.5">
            <div
              className={`font-prize text-base leading-none tabular-nums sm:text-2xl ${
                cell.accent ? "text-[#F1D47A]" : "text-white"
              }`}
            >
              {cell.value}
            </div>
            <div className="mt-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/35 sm:text-[10px] sm:tracking-[0.16em]">
              {cell.label}
            </div>
          </div>
        ))}
      </div>

      {canRevealAll && (
        <div className="flex flex-col gap-2 border-t border-white/10 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
          <p className="hidden min-w-0 flex-1 text-sm text-white/45 sm:block">
            Skip the reels — settle all remaining spins at once.
          </p>
          <button
            type="button"
            onClick={onRevealAll}
            disabled={revealDisabled}
            className="rr-cta inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black uppercase tracking-[0.12em] sm:h-11 sm:w-auto sm:px-5 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="button-reveal-all"
          >
            {isRevealing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Revealing
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Reveal all
                <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] sm:text-xs">{remaining}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Spins Counter Badge ─────────────────────────────────────────────────
function SpinsCounter({ used, total }: { used: number; total: number }) {
  const remaining = total - used;
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  
  return (
    <div className="rr-slot-panel flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl"
      style={{ background: "linear-gradient(135deg,rgba(200,16,46,0.18),rgba(10,10,13,0.9))", border: "1px solid rgba(200,16,46,0.35)" }}>
      <div className="flex items-center gap-1.5">
        <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: GOLD }} />
        <span className="text-xs sm:text-sm font-black" style={{ color: GOLD }}>
          <span className="text-white">{used}</span>
          <span className="mx-1 text-[rgba(255,255,255,0.3)]">/</span>
          <span className="text-[rgba(241,212,122,0.8)]">{total}</span>
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="hidden sm:block w-20 md:w-24 h-2 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: remaining > 0 ? "linear-gradient(90deg,#C8102E,#F1D47A)" : "#22C55E",
            boxShadow: remaining > 0 ? "0 0 8px rgba(200,16,46,0.5)" : "0 0 8px rgba(34,197,94,0.5)"
          }} />
      </div>
      
      {/* Remaining text */}
      <span className="text-[10px] sm:text-xs font-semibold" style={{ color: remaining > 0 ? "rgba(255,200,0,0.7)" : "#4ADE80" }}>
        {remaining > 0 ? `${remaining} left` : 'Done!'}
      </span>
    </div>
  );
}

// ─── Spins Exhausted Overlay (FIXED - Shows points vs cash) ──────────────
interface SpinsExhaustedOverlayProps {
  totalSpins: number;
  wins: number;
  totalWon: number;
  prizeType: 'cash' | 'points';
  onBack: () => void;
}

function SpinsExhaustedOverlay({
  totalSpins,
  wins,
  totalWon,
  prizeType,
  onBack,
}: SpinsExhaustedOverlayProps) {
  const wonValue =
    totalWon <= 0 ? "—" : prizeType === "cash" ? `£${totalWon}` : `${totalWon} pts`;

  const stats = [
    { label: "Spins", value: totalSpins },
    { label: "Wins", value: wins },
    { label: prizeType === "cash" ? "Won" : "Points", value: wonValue, accent: true },
  ];

  return (
    <div
      className="rr-slot-panel absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6"
      style={{
        background: "linear-gradient(165deg,rgba(5,5,5,0.96) 0%,rgba(10,10,13,0.97) 100%)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 38%,rgba(200,16,46,0.16) 0%,transparent 70%)" }}
      />

      <div className="relative w-full max-w-[400px] animate-bounce-in">
        <ChaserBorder variant="featured">
          <div className="bg-gradient-to-b from-[#111115] via-[#0A0A0D] to-[#050505] px-6 py-7 text-center sm:px-8 sm:py-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
              <Trophy className="h-3.5 w-3.5 text-[#F1D47A]" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                Session complete
              </span>
            </div>

            <h2 className="font-prize text-4xl leading-none text-white sm:text-5xl">
              ALL SPINS USED
            </h2>
            <p className="mt-3 text-sm text-white/50">
              You've finished all {totalSpins} spin{totalSpins !== 1 ? "s" : ""} for this game.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border px-2 py-3"
                  style={{
                    background: s.accent ? "rgba(241,212,122,0.06)" : "rgba(255,255,255,0.04)",
                    borderColor: s.accent ? "rgba(241,212,122,0.28)" : "rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className={`font-prize text-2xl leading-none tabular-nums ${
                      s.accent ? "text-[#F1D47A]" : "text-white"
                    }`}
                  >
                    {s.value}
                  </div>
                  <div className="mt-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onBack}
              className="rr-cta mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-[0.14em]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to competitions
            </button>
          </div>
        </ChaserBorder>
      </div>
    </div>
  );
}

function slotResultRows(history: any[]): PlayResultRow[] {
  return history.map((spin, i) => {
    const won = spin.coinsWon || 0;
    return {
      id: spin.id ?? i,
      number: spin.spinNumber ?? history.length - i,
      status: spin.isWin ? "Win" : "Lose",
      tone: spin.isWin ? "win" : "lose",
      prize: spin.isWin && won > 0 ? `+${won.toLocaleString()}` : "—",
      ticketNumber: spin.ticketNumber,
    };
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function SlotGamePage() {
  const { competitionId, orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  usePurchaseArrivalToast();
  const queryClient = useQueryClient();
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showLoseOverlay, setShowLoseOverlay] = useState(false);
  const [spinsExhausted, setSpinsExhausted] = useState(false);
  const [lastCoinsWon, setLastCoinsWon] = useState(0);
  const [lastPrizeType, setLastPrizeType] = useState<"cash" | "points">("cash");
  const [lastPrizeName, setLastPrizeName] = useState("");
  const [totalPrizeType, setTotalPrizeType] = useState<"cash" | "points">("cash");
  const [isSpinning, setIsSpinning] = useState(false);
  const [showRevealAllDialog, setShowRevealAllDialog] = useState(false);
  const [isRevealingAll, setIsRevealingAll] = useState(false);
  const [revealingCount, setRevealingCount] = useState(0);
  const [showRevealAllSummary, setShowRevealAllSummary] = useState(false);
  const [revealAllResults, setRevealAllResults] = useState<RevealAllResult[]>([]);
  const [revealAllCashWon, setRevealAllCashWon] = useState(0);
  const [revealAllPointsWon, setRevealAllPointsWon] = useState(0);

  const { data: orderData, isLoading, refetch } = useQuery({
    queryKey: ["/api/slot-order", orderId],
    queryFn: async () => {
      const res = await apiRequest(`/api/slot-order/${orderId}`, "GET");
      return res.json();
    },
    enabled: !!orderId,
    refetchInterval: 60000,
  });

  const order = orderData?.order;
  const competition = orderData?.competition;
  const totalCredits = orderData?.totalCredits || 0;
  const creditsPerSpin = orderData?.creditsPerSpin || 20;

  useEffect(() => {
    if (orderData?.history) {
      setSpinHistory(orderData.history);
    }
  }, [orderData?.history]);

  useEffect(() => {
    if (order?.quantity && spinHistory.length >= order.quantity) {
      setSpinsExhausted(true);
    }
  }, [spinHistory.length, order?.quantity]);

  const spinsRemaining = Math.max(0, (order?.quantity || 0) - spinHistory.length);

  const handleSpinStart = useCallback(() => {
    setIsSpinning(true);
    setShowWinOverlay(false);
    setShowLoseOverlay(false);
  }, []);

  // ─── Handle spin completion from SlotGame ───
  const handleSpinComplete = useCallback((result: SlotSpinResult) => {
    console.log("[SLOT GAME] Spin complete callback received:", result);
    setIsSpinning(false);
    setSpinHistory(prev => [result.newEntry, ...prev]);

    const noSpinsLeft =
      (typeof result.spinsRemaining === "number" && result.spinsRemaining <= 0);

    // Update total prize type based on the most recent win
    if (result.isWin && result.coinsWon > 0) {
      const prizeType = result.prizeType === "points" ? "points" : "cash";
      setTotalPrizeType(prizeType);
      setLastCoinsWon(result.coinsWon);
      setLastPrizeType(prizeType);
      setLastPrizeName(result.prizeName || "");
      setShowLoseOverlay(false);
      setShowWinOverlay(true);
      if (noSpinsLeft) setSpinsExhausted(true);
    } else if (noSpinsLeft) {
      // Last spin was a loss — show exhausted overlay, not "Try Again"
      // (Try Again was starting another spin + sound with 0 remaining)
      setShowLoseOverlay(false);
      setSpinsExhausted(true);
    } else {
      setShowLoseOverlay(true);
    }
  }, []);

  const handleNoSpinsLeft = useCallback(() => {
    console.log("[SLOT GAME] No spins left callback");
    setIsSpinning(false);
    setSpinsExhausted(true);
  }, []);

  const handleRevealAll = async () => {
    if (!orderId || spinsRemaining <= 0 || isRevealingAll || isSpinning) return;

    setIsRevealingAll(true);
    setRevealingCount(spinsRemaining);
    setShowRevealAllDialog(false);
    setShowWinOverlay(false);
    setShowLoseOverlay(false);

    try {
      const res = await apiRequest("/api/reveal-all-slot", "POST", {
        orderId,
        competitionId,
        count: spinsRemaining,
      });
      const data = await res.json();
      const results: RevealAllResult[] = Array.isArray(data.results) ? data.results : [];

      setRevealAllResults(results);
      setRevealAllCashWon(Number(data.cashWon || 0));
      setRevealAllPointsWon(Number(data.pointsWon || 0));
      if (Number(data.cashWon || 0) > 0) setTotalPrizeType("cash");
      else if (Number(data.pointsWon || 0) > 0) setTotalPrizeType("points");

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slot-order", orderId] });
      const fresh = await refetch();
      if (fresh.data?.history) {
        setSpinHistory(fresh.data.history);
      } else if (results.length) {
        setSpinHistory((prev) => [
          ...results
            .slice()
            .reverse()
            .map((r, i) => ({
              id: `reveal-${r.spinNumber ?? i}`,
              isWin: r.isWin,
              coinsWon: r.coinsWon || 0,
              coinsSpent: creditsPerSpin,
              spinNumber: r.spinNumber,
              usedAt: new Date().toISOString(),
            })),
          ...prev,
        ]);
      }

      if ((data.spinsRemaining ?? 0) <= 0) setSpinsExhausted(true);
      setShowRevealAllSummary(true);
    } catch (error: any) {
      toast({
        title: "Could not reveal all",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/slot-order", orderId] });
      await refetch();
    } finally {
      setIsRevealingAll(false);
    }
  };

  if (isLoading) {
    return <GameStatus message="Loading Slot Machine..." />;
  }

  if (!order || order.status !== "completed") {
    return (
      <GameEmpty
        title="NO ACTIVE SESSION"
        message="Please complete your purchase first."
        actionLabel="Back to home"
        href="/"
      />
    );
  }

  const wins = spinHistory.filter(h => h.isWin);
  const totalWon = wins.reduce((s, h) => s + (h.coinsWon || 0), 0);

  return (
    <GameShell>
      <WinOverlay show={showWinOverlay} coinsWon={lastCoinsWon} prizeType={lastPrizeType} prizeName={lastPrizeName} onDismiss={() => setShowWinOverlay(false)} />
      <LoseOverlay show={showLoseOverlay} onDismiss={() => setShowLoseOverlay(false)} />
      <RevealAllBatchSummary
        open={showRevealAllSummary}
        rows={revealAllResults.map((r, i) => ({
          id: i,
          number: r.spinNumber ?? i + 1,
          status: r.isWin ? "Win" : "Lose",
          tone: r.isWin ? "win" : "lose",
          prize:
            r.isWin && r.coinsWon > 0
              ? r.prizeType === "points"
                ? `${r.coinsWon.toLocaleString()} pts`
                : `£${Number(r.coinsWon).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—",
          ticketNumber: (r as any).ticketNumber,
        }))}
        playNoun="spin"
        cashWon={revealAllCashWon}
        pointsWon={revealAllPointsWon}
        onDismiss={() => setShowRevealAllSummary(false)}
      />

      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-5" style={{ maxWidth: 1100 }}>

          {/* Top bar */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-opacity hover:opacity-70 text-white/50" data-testid="button-slot-back">
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-4 w-px hidden sm:block bg-white/15" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl">🎰</span>
              <span className="font-prize text-white tracking-wide text-sm sm:text-base">{competition?.title || "Slot Machine"}</span>
            </div>
            
            {/* Spins Counter */}
            <div className="ml-auto">
              <SpinsCounter used={spinHistory.length} total={order.quantity} />
            </div>
            
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-black"
              style={{ background: "rgba(200,16,46,0.12)", border: "1px solid rgba(200,16,46,0.35)", color: GOLD }}>
              🏆 {totalCredits.toLocaleString()} Credits
            </div>
          </div>

          {/* ─── Game Component ─── */}
          <div className="flex justify-center mb-5 sm:mb-6">
            <div className="w-full" style={{ maxWidth: 960 }}>
              <div className="rr-slot-panel relative w-full rounded-xl sm:rounded-2xl overflow-hidden aspect-[9/14] sm:aspect-video min-h-[520px] sm:min-h-[280px]"
                style={{
                  background: "#050505",
                  border: "1.5px solid rgba(200,16,46,0.35)",
                  boxShadow:
                    "0 0 0 1px rgba(241,212,122,0.08), 0 0 80px rgba(200,16,46,0.12), 0 30px 100px rgba(0,0,0,0.8)",
                }}>
                {orderId && (
                  <SlotGameComponent
                    orderId={orderId}
                    competitionId={competitionId}
                    creditsPerSpin={creditsPerSpin}
                    spinsRemaining={spinsRemaining}
                    onSpinComplete={handleSpinComplete}
                    onNoSpinsLeft={handleNoSpinsLeft}
                    onSpinStart={handleSpinStart}
                  />
                )}

                {(showWinOverlay || showLoseOverlay || isRevealingAll) && (
                  <div className="absolute inset-0 z-10 pointer-events-auto cursor-default" />
                )}

                {isRevealingAll && (
                  <div
                    className="absolute inset-0 z-30 flex items-center justify-center"
                    style={{ background: "rgba(5,5,5,0.82)", backdropFilter: "blur(8px)" }}
                  >
                    <div className="text-center px-6">
                      <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#F1D47A]" />
                      <p className="font-prize text-2xl text-white">REVEALING ALL</p>
                      <p className="mt-2 text-sm text-white/50">
                        Settling {revealingCount} remaining spin{revealingCount === 1 ? "" : "s"}…
                      </p>
                    </div>
                  </div>
                )}

                {spinsExhausted && !showRevealAllSummary && (
                  <SpinsExhaustedOverlay
                    totalSpins={order?.quantity || spinHistory.length}
                    wins={spinHistory.filter(h => h.isWin).length}
                    totalWon={spinHistory.reduce((s, h) => s + (h.isWin ? (h.coinsWon || 0) : 0), 0)}
                    prizeType={totalPrizeType}
                    onBack={() => navigate("/")}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto space-y-4 sm:space-y-5" style={{ maxWidth: 960 }}>
            <SessionStrip
              purchased={order.quantity}
              used={spinHistory.length}
              remaining={spinsRemaining}
              creditsWon={totalWon}
              canRevealAll={spinsRemaining > 1 && !spinsExhausted}
              isRevealing={isRevealingAll}
              revealDisabled={isRevealingAll || isSpinning || showWinOverlay || showLoseOverlay}
              onRevealAll={() => setShowRevealAllDialog(true)}
            />
            <PlayResultsTable
              className="rr-slot-panel"
              title="Spin Results"
              rows={slotResultRows(spinHistory)}
              emptyTitle="NO SPINS YET"
              emptyHint="Hit SPIN — each result lands here."
            />
          </div>
        </div>
      </main>

      <AlertDialog open={showRevealAllDialog} onOpenChange={setShowRevealAllDialog}>
        <AlertDialogContent className="rr-slot-panel border-white/10 bg-[#0A0A0D] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-prize text-2xl">Reveal all spins?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This instantly reveals all {spinsRemaining} remaining spins. Results and prizes are
              settled the same way as spinning one by one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/10">
              Keep spinning
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevealAll}
              className="bg-[#C8102E] text-white hover:bg-[#FF263D]"
            >
              Reveal {spinsRemaining} spins
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GameShell>
  );
}