import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";

import { GameEmpty, GameShell, GameStatus } from "@/components/games/GameChrome";
import { useState, useEffect, useRef, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Crown, Trophy, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

const GOLD = "#F1D47A";
const GOLD2 = "#B98928";

function RoyalHistory({ history }: { history: any[] }) {
  const [page, setPage] = useState(0);
  const perPage = 6;
  const totalPages = Math.ceil(history.length / perPage);
  const visible = history.slice(page * perPage, (page + 1) * perPage);
  const wins = history.filter(h => h.isWin);
  const replays = history.filter(h => h.isRoyalReplay && !h.isWin);
  const totalCoinsWon = wins.reduce((s, h) => s + (h.coinsWon || 0), 0);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#C8102E]/25 bg-[#0A0A0D]/90">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.22),rgba(139,0,0,0.12))", border: "1px solid rgba(212,175,55,0.3)" }}>
            <Crown className="w-5 h-5" style={{ color: GOLD }} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Royal Log</h3>
            <div className="flex gap-2 mt-0.5">
              <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full" style={{ color: GOLD, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>{history.length} SPINS</span>
              {replays.length > 0 && <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full" style={{ color: "#9B59B6", background: "rgba(155,89,182,0.1)", border: "1px solid rgba(155,89,182,0.3)" }}>{replays.length} REPLAYS</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "SPINS",    value: history.length,   active: history.length > 0,  color: GOLD      },
            { label: "WINS",     value: wins.length,      active: wins.length > 0,     color: "#22c55e" },
            { label: "COINS WON",value: totalCoinsWon,    active: totalCoinsWon > 0,   color: GOLD2     },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: s.active ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${s.active ? "rgba(212,175,55,0.25)" : "rgba(212,175,55,0.06)"}` }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: s.active ? "rgba(212,175,55,0.7)" : "rgba(255,255,255,0.2)" }}>{s.label}</p>
              <p className="text-xl font-black tabular-nums" style={{ color: s.active ? s.color : "rgba(255,255,255,0.08)" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8" style={{ color: "rgba(212,175,55,0.35)" }}>
            <Crown className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No spins yet — pull to play!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2" style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.08)" }}>
              <span className="text-[10px] font-black uppercase tracking-widest w-8"    style={{ color: "rgba(212,175,55,0.5)" }}>#</span>
              <span className="text-[10px] font-black uppercase tracking-widest flex-1" style={{ color: "rgba(212,175,55,0.5)" }}>Result</span>
              <span className="text-[10px] font-black uppercase tracking-widest"        style={{ color: "rgba(212,175,55,0.5)" }}>Coins</span>
            </div>
            <div className="space-y-1.5">
              {visible.map((entry, i) => {
                const num = history.length - (page * perPage + i);
                const isReplay = entry.isRoyalReplay && !entry.isWin;
                return (
                  <div key={entry.id || i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: entry.isWin ? "rgba(212,175,55,0.08)" : isReplay ? "rgba(155,89,182,0.08)" : "rgba(239,68,68,0.05)", border: `1px solid ${entry.isWin ? "rgba(212,175,55,0.2)" : isReplay ? "rgba(155,89,182,0.2)" : "rgba(239,68,68,0.1)"}` }}>
                    <span className="text-xs font-bold w-8 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>{num}</span>
                    <span className="flex-1 text-xs font-bold" style={{ color: entry.isWin ? GOLD : isReplay ? "#9B59B6" : "#ef4444" }}>
                      {entry.isWin ? "👑 WIN" : isReplay ? "🔄 Royal Replay" : "No Match"}
                    </span>
                    <span className="text-xs font-black tabular-nums" style={{ color: entry.isWin ? GOLD2 : "rgba(255,255,255,0.2)" }}>
                      {entry.isWin ? `+${entry.coinsWon}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(212,175,55,0.08)" }}>
                <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-20" style={{ color: GOLD, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }} data-testid="button-royal-history-prev"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-[10px] font-bold" style={{ color: "rgba(212,175,55,0.5)" }}>{page + 1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page === totalPages - 1} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-20" style={{ color: GOLD, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }} data-testid="button-royal-history-next"><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function RoyalGamePage() {
  const { competitionId, orderId } = useParams();
  const [, navigate] = useLocation();

  const queryClient = useQueryClient();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const spinCountRef = useRef(0);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [iframeReady, setIframeReady] = useState(false);

  const { data: orderData, isLoading } = useQuery({
    queryKey: ["/api/royal-order", orderId],
    queryFn: async () => {
      const res = await apiRequest(`/api/royal-order/${orderId}`, "GET");
      return res.json();
    },
    enabled: !!orderId,
    refetchInterval: 30000,
  });

  const order = orderData?.order;
  const competition = orderData?.competition;
  const totalCredits = orderData?.totalCredits || 0;
  const creditsPerGame = orderData?.creditsPerGame || 100;

  useEffect(() => {
    if (orderData?.history) {
      setSpinHistory(orderData.history);
    }
  }, [orderData?.history]);

  const recordSpin = useCallback(async (isWin: boolean, coinsWon: number, isRoyalReplay: boolean) => {
    if (!orderId || order?.status !== "completed") return;
    spinCountRef.current += 1;
    const spinNumber = spinCountRef.current;
    const coinsSpent = creditsPerGame;
    try {
      await apiRequest("/api/record-royal-spin", "POST", { orderId, isWin, coinsWon, coinsSpent, spinNumber, isRoyalReplay });
      const newEntry = {
        id: `local-${spinNumber}`,
        isWin,
        isRoyalReplay,
        coinsWon,
        coinsSpent,
        spinNumber,
        usedAt: new Date().toISOString(),
      };
      setSpinHistory(prev => [newEntry, ...prev]);
      if (isWin && coinsWon > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    } catch (err) {
      console.error("Failed to record royal spin:", err);
    }
  }, [orderId, order?.status, creditsPerGame, queryClient]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "slotSpinResult") {
        const { isWin, coinsWon, freeSpinsTriggered } = event.data;
        recordSpin(isWin, coinsWon || 0, !!freeSpinsTriggered);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [recordSpin]);

  if (isLoading) {
    return <GameStatus message="Loading Royal Reels..." />;
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

  const iframeSrc = `/slotmachine/royal-reels.html?credits=${totalCredits}&orderId=${orderId}`;

  return (
    <GameShell>
      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-medium text-white/45 transition-colors hover:text-white" data-testid="button-royal-back">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#F1D47A]" />
              <span className="font-prize text-white">{competition?.title || "Royal Reels"}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-full border border-[#F1D47A]/30 bg-[#F1D47A]/10 px-3 py-1.5 text-sm font-bold text-[#F1D47A]">
              <Trophy className="w-4 h-4" />
              {totalCredits} Credits
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
            <div className="flex flex-col gap-4">
              <div className="relative w-full overflow-hidden rounded-2xl border-2 border-[#C8102E]/35" style={{ aspectRatio: "16/9", minHeight: 420, background: "#050505", boxShadow: "0 0 60px rgba(200,16,46,0.15), 0 24px 80px rgba(0,0,0,0.6)" }}>
                {!iframeReady && (
                  <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "#0d0005" }}>
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: GOLD }} />
                      <p className="text-sm" style={{ color: "rgba(212,175,55,0.6)" }}>Loading Royal Reels...</p>
                    </div>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  className="w-full h-full"
                  style={{ border: "none", display: "block" }}
                  title="Royal Reels"
                  allow="autoplay"
                  onLoad={() => setIframeReady(true)}
                  data-testid="iframe-royal-game"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Games Purchased", value: order.quantity,    icon: <Crown className="w-4 h-4" /> },
                  { label: "Total Credits",   value: totalCredits,      icon: <Trophy className="w-4 h-4" /> },
                  { label: "Credits / Game",  value: `${creditsPerGame}`, icon: <RefreshCw className="w-4 h-4" /> },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-[#0A0A0D]/90 p-4 text-center">
                    <div className="flex justify-center mb-2" style={{ color: GOLD }}>{stat.icon}</div>
                    <p className="text-lg font-black text-white tabular-nums">{stat.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "rgba(212,175,55,0.5)" }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <RoyalHistory history={spinHistory} />

              <div className="rounded-xl border border-white/10 bg-[#0A0A0D]/90 p-4">
                <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#F1D47A]/70">How to Play</h4>
                <ul className="space-y-1.5 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <li>• Click SPIN or pull the handle to play</li>
                  <li>• Match 3+ royal symbols across 20 paylines</li>
                  <li>• 👑 Crown (Wild) substitutes any symbol</li>
                  <li>• 3× Crown triggers <span style={{ color: "#9B59B6" }}>Royal Replay</span> (5 free spins!)</li>
                  <li>• Your credits reflect purchased games</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A0A0D]/90 p-4">
                <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#F1D47A]/70">Prize Table</h4>
                <div className="space-y-1">
                  {[
                    ["👑", "Crown (Wild)",  "500 × bet — Royal Replay!"],
                    ["🏆", "Trophy",        "250 × bet"],
                    ["💎", "Diamond",       "100 × bet"],
                    ["7️⃣", "Lucky 7",       "50 × bet"],
                    ["🎲", "Dice",          "30 × bet"],
                    ["⭐", "Star",          "20 × bet"],
                    ["🍒", "Cherry",        "12 × bet"],
                    ["🍇", "Grape",         "10 × bet"],
                    ["🔔", "Bell",          "8 × bet"],
                  ].map(([icon, name, prize]) => (
                    <div key={name} className="flex items-center justify-between text-xs py-1" style={{ borderBottom: "1px solid rgba(212,175,55,0.06)" }}>
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>{icon} {name}</span>
                      <span className="font-bold" style={{ color: GOLD }}>{prize}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </GameShell>
  );
}