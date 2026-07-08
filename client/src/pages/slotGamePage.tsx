// SlotGamePage.tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState, useEffect, useRef, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Coins, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import SlotGameComponent from "@/components/games/SlotGameComponent";


const GOLD = "#FFC300";
const AMBER = "#FF8C00";

function SlotHistory({ history }: { history: any[] }) {
  const [page, setPage] = useState(0);
  const perPage = 6;
  const totalPages = Math.ceil(history.length / perPage);
  const visible = history.slice(page * perPage, (page + 1) * perPage);
  const wins = history.filter(h => h.isWin);
  const totalWon = wins.reduce((s, h) => s + (h.coinsWon || 0), 0);

  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ background: "linear-gradient(180deg,rgba(14,10,2,0.97),rgba(10,8,0,0.98))", border: "1px solid rgba(255,185,0,0.15)" }}>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(255,195,0,0.22),rgba(255,140,0,0.12))", border: "1px solid rgba(255,185,0,0.3)" }}>
              <Coins className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-widest uppercase">Spin History</h3>
              <div className="flex gap-2 mt-0.5">
                <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full" style={{ color: GOLD, background: "rgba(255,195,0,0.1)", border: "1px solid rgba(255,185,0,0.2)" }}>{history.length} SPINS</span>
                <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full" style={{ color: wins.length > 0 ? GOLD : "#6b7280", background: "rgba(255,195,0,0.07)", border: "1px solid rgba(255,185,0,0.15)" }}>{totalWon} COINS WON</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "TOTAL SPINS", value: history.length, active: history.length > 0 },
            { label: "WINS", value: wins.length, active: wins.length > 0 },
            { label: "COINS WON", value: totalWon, active: totalWon > 0 },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: s.active ? "rgba(255,195,0,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${s.active ? "rgba(255,185,0,0.25)" : "rgba(255,185,0,0.06)"}` }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: s.active ? "rgba(255,195,0,0.7)" : "rgba(255,255,255,0.2)" }}>{s.label}</p>
              <p className="text-xl font-black tabular-nums" style={{ color: s.active ? GOLD : "rgba(255,255,255,0.08)" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8" style={{ color: "rgba(255,185,0,0.35)" }}>
            <Coins className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No spins yet — start playing!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2" style={{ background: "rgba(255,185,0,0.04)", border: "1px solid rgba(255,185,0,0.08)" }}>
              <span className="text-[10px] font-black uppercase tracking-widest w-8" style={{ color: "rgba(255,185,0,0.5)" }}>#</span>
              <span className="text-[10px] font-black uppercase tracking-widest flex-1" style={{ color: "rgba(255,185,0,0.5)" }}>Result</span>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,185,0,0.5)" }}>Coins</span>
            </div>
            <div className="space-y-1.5">
              {visible.map((spin, i) => {
                const num = history.length - (page * perPage + i);
                const isWin = spin.isWin;
                return (
                  <div key={spin.id || i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: isWin ? "rgba(255,195,0,0.08)" : "rgba(239,68,68,0.05)", border: `1px solid ${isWin ? "rgba(255,185,0,0.2)" : "rgba(239,68,68,0.1)"}` }}>
                    <span className="text-xs font-bold w-8 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>{num}</span>
                    <span className="flex-1 text-xs font-bold" style={{ color: isWin ? GOLD : "#ef4444" }}>{isWin ? "WIN 🎰" : "No Match"}</span>
                    <span className="text-xs font-black tabular-nums" style={{ color: isWin ? GOLD : "rgba(255,255,255,0.2)" }}>{isWin ? `+${spin.coinsWon}` : spin.coinsSpent > 0 ? `-${spin.coinsSpent}` : "—"}</span>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,185,0,0.08)" }}>
                <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-20" style={{ color: GOLD, background: "rgba(255,195,0,0.08)", border: "1px solid rgba(255,185,0,0.2)" }} data-testid="button-slot-history-prev"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-[10px] font-bold" style={{ color: "rgba(255,185,0,0.5)" }}>{page + 1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page === totalPages - 1} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-20" style={{ color: GOLD, background: "rgba(255,195,0,0.08)", border: "1px solid rgba(255,185,0,0.2)" }} data-testid="button-slot-history-next"><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SlotGamePage() {
  const { competitionId, orderId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [playsRemaining, setPlaysRemaining] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [competitionType, setCompetitionType] = useState<'slot' | 'royal'>('slot');

  const { data: orderData, isLoading, refetch } = useQuery({
    queryKey: ["/api/slot-order", orderId],
    queryFn: async () => {
      const res = await apiRequest(`/api/slot-order/${orderId}`, "GET");
      return res.json();
    },
    enabled: !!orderId,
    refetchInterval: 30000,
  });

  const order = orderData?.order;
  const competition = orderData?.competition;
  const creditsPerSpin = orderData?.creditsPerSpin || 20;

  // Determine competition type from the competition data
  useEffect(() => {
    if (competition) {
      const type = competition.type || 'slot';
      setCompetitionType(type === 'royal' ? 'royal' : 'slot');
      console.log('🎯 Competition type:', type);
    }
  }, [competition]);

  useEffect(() => {
    if (orderData?.history) {
      setSpinHistory(orderData.history);
    }
    if (orderData?.totalCredits !== undefined) {
      setTotalCredits(orderData.totalCredits);
    }
    if (orderData?.totalCredits !== undefined && creditsPerSpin > 0) {
      setPlaysRemaining(Math.floor(orderData.totalCredits / creditsPerSpin));
    }
  }, [orderData, creditsPerSpin]);

  const handlePlayComplete = useCallback(async (newPlaysRemaining: number) => {
    setPlaysRemaining(newPlaysRemaining);
    const newCredits = newPlaysRemaining * creditsPerSpin;
    setTotalCredits(newCredits);
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }, [creditsPerSpin, refetch, queryClient]);

  const handleNoPlays = useCallback(() => {
    toast({
      title: "No Credits Remaining",
      description: "You've used all your spins! Purchase more to keep playing.",
      variant: "destructive",
    });
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0800" }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: GOLD }} />
          <p className="text-gray-400">Loading Slot Machine...</p>
        </div>
      </div>
    );
  }

  if (!order || order.status !== "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0800" }}>
        <div className="text-center p-8 rounded-2xl" style={{ background: "rgba(14,10,2,0.9)", border: "1px solid rgba(255,185,0,0.2)" }}>
          <Coins className="w-12 h-12 mx-auto mb-4" style={{ color: GOLD }} />
          <h2 className="text-xl font-bold text-white mb-2">No Active Session</h2>
          <p className="text-gray-400 mb-4">Please complete your purchase first.</p>
          <Button onClick={() => navigate("/")} style={{ background: `linear-gradient(135deg,${GOLD},${AMBER})`, color: "#000" }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (order && totalCredits <= 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#0a0800" }}>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 rounded-2xl" style={{ background: "rgba(14,10,2,0.9)", border: "1px solid rgba(255,185,0,0.2)" }}>
            <Coins className="w-16 h-16 mx-auto mb-4" style={{ color: GOLD, opacity: 0.5 }} />
            <h2 className="text-2xl font-bold text-white mb-2">No Credits Left</h2>
            <p className="text-gray-400 mb-4">You've used all your spins! Purchase more to keep playing.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate(`/competition/${competitionId}`)} className="gap-2" style={{ background: `linear-gradient(135deg,${GOLD},${AMBER})`, color: "#000" }}>
                <Coins className="w-4 h-4" /> Purchase More Spins
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get game title based on competition type
  const gameTitle = competitionType === 'royal' ? 'Royal Reels' : 'Slot Machine';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0800" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%,rgba(255,195,0,0.06),transparent 60%)" }} />
      <Header />

      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80" style={{ color: "rgba(255,185,0,0.6)" }} data-testid="button-slot-back">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px" style={{ background: "rgba(255,185,0,0.2)" }} />
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5" style={{ color: GOLD }} />
              <span className="font-bold text-white">{competition?.title || gameTitle}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: "rgba(255,195,0,0.1)", border: "1px solid rgba(255,185,0,0.25)", color: GOLD }}>
              <Trophy className="w-4 h-4" />
              {totalCredits} Credits
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
            <div className="flex flex-col gap-4">
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", minHeight: 420, background: "#0a0800", border: "1px solid rgba(255,185,0,0.18)", boxShadow: "0 0 60px rgba(255,195,0,0.08), 0 24px 80px rgba(0,0,0,0.6)" }}>
                <SlotGameComponent
                  orderId={orderId!}
                  competitionId={competitionId!}
                  playsRemaining={playsRemaining}
                  competitionType={competitionType}
                  onPlayComplete={handlePlayComplete}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Spins Purchased", value: order.quantity, icon: <Coins className="w-4 h-4" /> },
                  { label: "Total Credits", value: totalCredits, icon: <Trophy className="w-4 h-4" /> },
                  { label: "Credits / Spin", value: `${creditsPerSpin} min`, icon: <Coins className="w-4 h-4" /> },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-4 text-center" style={{ background: "rgba(14,10,2,0.9)", border: "1px solid rgba(255,185,0,0.15)" }}>
                    <div className="flex justify-center mb-2" style={{ color: GOLD }}>{stat.icon}</div>
                    <p className="text-lg font-black text-white tabular-nums">{stat.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,185,0,0.5)" }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <SlotHistory history={spinHistory} />

              <div className="rounded-xl p-4" style={{ background: "rgba(14,10,2,0.9)", border: "1px solid rgba(255,185,0,0.12)" }}>
                <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "rgba(255,185,0,0.5)" }}>How to Play</h4>
                <ul className="space-y-1.5 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <li>• Click SPIN or pull the handle to play</li>
                  <li>• Match 3+ symbols across 20 paylines</li>
                  <li>• Wild symbol substitutes for any symbol</li>
                  <li>• Bigger bets = bigger wins</li>
                  <li>• Credits reflect your purchased spins</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}