import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { GameEmpty, GameShell, GameStatus } from "@/components/games/GameChrome";
import { useState, useEffect, useRef, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, ChevronDown, RefreshCw, Trophy, X } from "lucide-react";
import SlotGameComponent from "@/components/games/slot-game";
import ChaserBorder from "@/components/home/ChaserBorder";
import confetti from "canvas-confetti";

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

// ─── Casino Stat Card (Responsive) ───────────────────────────────────────
function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent?: boolean }) {
  return (
    <div
      className="rr-slot-panel relative overflow-hidden rounded-2xl p-3 text-center sm:p-4 md:p-5"
      style={{
        background: accent
          ? "linear-gradient(145deg,rgba(200,16,46,0.18),rgba(10,10,13,0.95))"
          : "linear-gradient(145deg,rgba(18,18,22,0.95),rgba(8,8,10,0.95))",
        border: accent ? "1px solid rgba(241,212,122,0.4)" : "1px solid rgba(255,255,255,0.1)",
        boxShadow: accent
          ? "0 0 30px rgba(200,16,46,0.12), inset 0 1px 0 rgba(241,212,122,0.15)"
          : "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div className="mb-1.5 text-lg sm:text-xl md:text-[22px]">{icon}</div>
      <div
        className={`font-prize mb-1 text-2xl leading-none tabular-nums sm:text-3xl ${
          accent ? "text-[#F1D47A]" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35 sm:text-[10px]">{label}</div>
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

// ─── Spin History Table (Responsive) ─────────────────────────────────────
function SpinHistoryTable({ history }: { history: any[] }) {
  const wins = history.filter(h => h.isWin);
  const totalWon = wins.reduce((s, h) => s + (h.coinsWon || 0), 0);
  const winRate = history.length > 0 ? Math.round((wins.length / history.length) * 100) : 0;
  const biggestWin = wins.length > 0 ? Math.max(...wins.map(h => h.coinsWon || 0)) : 0;

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
    catch { return "—"; }
  };

  return (
    <div className="rr-slot-panel overflow-hidden rounded-2xl border border-white/10 sm:rounded-3xl"
      style={{
        background: "linear-gradient(160deg,#0A0A0D 0%,#111115 100%)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.8)"
      }}>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C8102E]/25 p-4 sm:p-5 md:p-6"
        style={{ background: "linear-gradient(135deg,rgba(200,16,46,0.12),rgba(10,10,13,1))" }}>
        
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-xl sm:h-12 sm:w-12 sm:text-2xl md:h-[54px] md:w-[54px] md:text-[26px]"
            style={{
              background: "linear-gradient(135deg,#C8102E,#8a0b1f)",
              border: "2px solid rgba(241,212,122,0.4)",
            }}>🎰</div>
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-base sm:text-lg md:text-[22px] font-black text-white tracking-[4px] uppercase">Spin History</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-[20px] text-[10px] font-black tracking-[2px] bg-[#DC2626] text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                LIVE
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-white/40">✦ Real Time Updates</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {[
            { icon: "🔄", value: history.length, label: "TOTAL SPINS", bg: "rgba(200,16,46,0.15)", border: "rgba(200,16,46,0.45)", color: "#FF263D" },
            { icon: "🏆", value: wins.length, label: "TOTAL WINS", bg: wins.length > 0 ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.04)", border: wins.length > 0 ? "rgba(34,197,94,0.45)" : "rgba(255,255,255,0.1)", color: wins.length > 0 ? "#4ADE80" : "rgba(255,255,255,0.3)" },
            { icon: "🎯", value: `${winRate}%`, label: "WIN RATE", bg: "rgba(234,179,8,0.12)", border: "rgba(255,185,0,0.4)", color: "#FCD34D" },
          ].map(p => (
            <div key={p.label} className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[40px]"
              style={{ background: p.bg, border: `1.5px solid ${p.border}` }}>
              <span className="text-sm sm:text-base">{p.icon}</span>
              <div>
                <div className="text-sm sm:text-base font-black leading-none" style={{ color: p.color }}>{p.value}</div>
                <div className="text-[8px] sm:text-[9px] font-bold tracking-[1.5px] text-[rgba(255,255,255,0.4)] uppercase">{p.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-5 md:py-5 md:px-7">
        <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl"
          style={{ background: "linear-gradient(135deg,#1a0508,#0A0A0D)", border: "1.5px solid rgba(200,16,46,0.4)" }}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-[52px] md:h-[52px] rounded-2xl flex items-center justify-center text-xl sm:text-2xl md:text-[26px] flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#C8102E,#8a0b1f)", border: "1px solid rgba(241,212,122,0.3)" }}>🎰</div>
          <div>
            <div className="text-[9px] sm:text-[10px] font-black tracking-[2.5px] text-[#F1D47A]/70 uppercase mb-1">Total Spins</div>
            <div className="text-2xl sm:text-3xl md:text-[36px] font-black text-white leading-none">{history.length}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl"
          style={{
            background: wins.length > 0 ? "linear-gradient(135deg,#0a2e18,#061a0e)" : "linear-gradient(135deg,#111,#0a0a0a)",
            border: `1.5px solid ${wins.length > 0 ? "rgba(34,197,94,0.45)" : "rgba(255,255,255,0.08)"}`,
            boxShadow: wins.length > 0 ? "0 0 30px rgba(34,197,94,0.1)" : "none"
          }}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-[52px] md:h-[52px] rounded-2xl flex items-center justify-center text-xl sm:text-2xl md:text-[26px] flex-shrink-0"
            style={{
              background: wins.length > 0 ? "linear-gradient(135deg,#166534,#0d4023)" : "#1a1a1a",
              border: `1px solid ${wins.length > 0 ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`,
              boxShadow: wins.length > 0 ? "0 0 20px rgba(34,197,94,0.3)" : "none"
            }}>🏆</div>
          <div>
            <div className="text-[9px] sm:text-[10px] font-black tracking-[2.5px] uppercase mb-1"
              style={{ color: wins.length > 0 ? "rgba(74,222,128,0.7)" : "rgba(255,255,255,0.3)" }}>Total Wins</div>
            <div className="text-2xl sm:text-3xl md:text-[36px] font-black leading-none"
              style={{ color: wins.length > 0 ? "#4ADE80" : "rgba(255,255,255,0.2)" }}>{wins.length}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl"
          style={{
            background: totalWon > 0 ? "linear-gradient(135deg,#2a1500,#1a0d00)" : "linear-gradient(135deg,#111,#0a0a0a)",
            border: `1.5px solid ${totalWon > 0 ? "rgba(255,185,0,0.5)" : "rgba(255,255,255,0.08)"}`,
            boxShadow: totalWon > 0 ? "0 0 30px rgba(255,150,0,0.18)" : "none"
          }}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-[52px] md:h-[52px] rounded-2xl flex items-center justify-center text-xl sm:text-2xl md:text-[26px] flex-shrink-0"
            style={{
              background: totalWon > 0 ? "linear-gradient(135deg,#92400e,#5c2800)" : "#1a1a1a",
              border: `1px solid ${totalWon > 0 ? "rgba(255,185,0,0.45)" : "rgba(255,255,255,0.08)"}`,
              boxShadow: totalWon > 0 ? "0 0 20px rgba(255,150,0,0.4)" : "none"
            }}>🪙</div>
          <div>
            <div className="text-[9px] sm:text-[10px] font-black tracking-[2.5px] uppercase mb-1"
              style={{ color: totalWon > 0 ? "rgba(253,211,77,0.7)" : "rgba(255,255,255,0.3)" }}>Credits Won</div>
            <div className="text-2xl sm:text-[28px] md:text-[32px] font-black leading-none"
              style={{
                background: totalWon > 0 ? "linear-gradient(180deg,#FFE566,#FFA500)" : "none",
                WebkitBackgroundClip: totalWon > 0 ? "text" : "unset",
                WebkitTextFillColor: totalWon > 0 ? "transparent" : "rgba(255,255,255,0.2)"
              }}>{totalWon > 0 ? `+${totalWon.toLocaleString()}` : "0"}</div>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="py-12 sm:py-[60px] px-6 sm:px-8 text-center" style={{ borderTop: "1px solid rgba(100,70,200,0.15)" }}>
          <div className="text-4xl sm:text-5xl md:text-[56px] mb-4">🎰</div>
          <div className="text-sm sm:text-base font-extrabold text-[rgba(180,140,255,0.6)]">No spins yet — start playing!</div>
          <div className="text-xs sm:text-[13px] mt-2 text-[rgba(255,255,255,0.25)] font-medium">Your spin history will appear here in real-time</div>
        </div>
      ) : (
        <>
          {/* Column Headers - Hidden on mobile, show on sm+ */}
          <div className="hidden sm:grid grid-cols-[72px_1fr_180px_180px_150px_40px] px-5 md:px-7 py-3"
            style={{ background: "rgba(0,0,0,0.35)", borderTop: "1px solid rgba(100,70,200,0.2)", borderBottom: "1px solid rgba(100,70,200,0.2)" }}>
            {["#", "Result", "Credits Won", "Credits Spent", "Time", ""].map((h, i) => (
              <div key={i} className="text-[10px] font-black tracking-[3px] uppercase text-[rgba(255,185,0,0.9)]">{h}</div>
            ))}
          </div>

          <div className="max-h-[300px] sm:max-h-[400px] md:max-h-[460px] overflow-y-auto">
            {history.map((spin, i) => {
              const num = history.length - i;
              const isWin = spin.isWin;
              const coinsWon = spin.coinsWon || 0;
              const winTitle = isWin ? (coinsWon >= 1000 ? "JACKPOT WIN" : coinsWon >= 100 ? "BIG WIN" : "WIN") : "NO MATCH";
              const winSub = isWin ? (coinsWon >= 1000 ? "Amazing!" : coinsWon >= 100 ? "Nice one!" : "Good Job!") : "Try Again!";
              
              return (
                <div key={spin.id || i}
                  className="grid grid-cols-2 sm:grid-cols-[72px_1fr_180px_180px_150px_40px] gap-2 sm:gap-0 px-4 sm:px-5 md:px-7 py-3 sm:py-[15px] items-center"
                  style={{
                    background: isWin ? "rgba(16,80,40,0.2)" : "rgba(255,255,255,0.02)",
                    borderLeft: `4px solid ${isWin ? "#22C55E" : "rgba(239,68,68,0.5)"}`,
                    borderBottom: "1px solid rgba(100,70,200,0.1)",
                    animation: i === 0 ? "historyRowIn 0.5s ease-out" : "none"
                  }}>
                  
                  {/* Mobile layout */}
                  <div className="sm:hidden col-span-2 flex items-center justify-between mb-2">
                    <div className="text-sm font-extrabold text-[#FFB830]">#{num}</div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[20px] text-[10px] font-bold"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Clock className="w-2.5 h-2.5 text-[rgba(255,255,255,0.5)]" />
                      <span className="text-[rgba(255,255,255,0.8)]">{spin.usedAt ? formatTime(spin.usedAt) : "—"}</span>
                    </div>
                  </div>
                  
                  {/* Desktop: # */}
                  <div className="hidden sm:block text-[15px] font-extrabold text-[#FFB830]">#{num}</div>
                  
                  {/* Result (both mobile and desktop) */}
                  <div className="flex items-center gap-2 sm:gap-3.5">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm sm:text-lg font-black"
                      style={{
                        background: isWin ? "linear-gradient(135deg,#166534,#0d4023)" : "linear-gradient(135deg,#7f1d1d,#450a0a)",
                        border: `2px solid ${isWin ? "#22C55E" : "#DC2626"}`,
                        boxShadow: isWin ? "0 0 14px rgba(34,197,94,0.55)" : "0 0 12px rgba(220,38,38,0.45)",
                        color: isWin ? "#4ADE80" : "#F87171"
                      }}>
                      {isWin ? "🏆" : "✕"}
                    </div>
                    <div>
                      <div className="text-xs sm:text-[13px] font-black tracking-[0.5px]" style={{ color: isWin ? "#4ADE80" : "#F87171" }}>{winTitle}</div>
                      <div className="text-[10px] sm:text-[11px] text-[rgba(255,255,255,0.4)] mt-0.5 font-medium">{winSub}</div>
                    </div>
                  </div>
                  
                  {/* Credits Won */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-right sm:text-left">
                    {isWin && coinsWon > 0 ? (
                      <>
                        <span className="text-sm sm:text-lg">🪙</span>
                        <span className="text-sm sm:text-[17px] font-black tabular-nums"
                          style={{ color: "#FFD700", textShadow: "0 0 12px rgba(255,180,0,0.6)" }}>+{coinsWon.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-base sm:text-xl text-[rgba(255,255,255,0.2)] font-bold">—</span>
                    )}
                  </div>
                  
                  {/* Credits Spent */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-right sm:text-left">
                    {spin.coinsSpent > 0 ? (
                      <>
                        <span className="text-sm sm:text-[17px]">🎰</span>
                        <span className="text-xs sm:text-[15px] font-extrabold text-[#F87171] tabular-nums">−{spin.coinsSpent}</span>
                      </>
                    ) : (
                      <span className="text-[rgba(255,255,255,0.2)]">—</span>
                    )}
                  </div>
                  
                  {/* Time (desktop only) */}
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[20px]"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Clock className="w-2.5 h-2.5 text-[rgba(255,255,255,0.5)]" />
                    <span className="text-[11px] font-bold text-[rgba(255,255,255,0.8)] tracking-[0.3px]">
                      {spin.usedAt ? formatTime(spin.usedAt) : "—"}
                    </span>
                  </div>
                  
                  <div className="hidden sm:flex justify-center">
                    <ChevronDown className="w-4 h-4 text-[rgba(255,255,255,0.2)]" />
                  </div>
                </div>
              );
            })}
          </div>

          {biggestWin > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-4 p-4 sm:p-[18px] md:px-7"
              style={{
                background: "linear-gradient(135deg,#1c0c00,#2a1600,#1c0c00)",
                borderTop: "2px solid rgba(255,185,0,0.3)"
              }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl md:text-[32px]">👑</span>
                <div>
                  <div className="text-[9px] sm:text-[10px] font-black tracking-[3px] text-[rgba(255,185,0,0.65)] uppercase mb-0.5">Biggest Win Today</div>
                  <div className="text-xl sm:text-2xl md:text-[28px] font-black"
                    style={{ background: "linear-gradient(180deg,#FFE566,#FF9500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    +{biggestWin.toLocaleString()}
                  </div>
                </div>
                <div className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-[20px] text-[10px] sm:text-[11px] font-black tracking-[2px]"
                  style={{
                    background: "linear-gradient(135deg,rgba(100,60,220,0.3),rgba(60,30,160,0.3))",
                    border: "1.5px solid rgba(120,80,255,0.5)",
                    color: "#A78BFA"
                  }}>
                  {biggestWin >= 1000 ? "💎 JACKPOT" : biggestWin >= 100 ? "⭐ BIG WIN" : "🏆 WIN"}
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-lg sm:text-xl">⚡</span>
                <div>
                  <div className="text-xs sm:text-[13px] font-extrabold text-white">You're on fire!</div>
                  <div className="text-[10px] sm:text-[11px] text-[rgba(255,255,255,0.4)] mt-0.5">Keep spinning and win big!</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function SlotGamePage() {
  const { competitionId, orderId } = useParams();
  const [, navigate] = useLocation();
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showLoseOverlay, setShowLoseOverlay] = useState(false);
  const [spinsExhausted, setSpinsExhausted] = useState(false);
  const [lastCoinsWon, setLastCoinsWon] = useState(0);
  const [lastPrizeType, setLastPrizeType] = useState<"cash" | "points">("cash");
  const [lastPrizeName, setLastPrizeName] = useState("");
  const [totalPrizeType, setTotalPrizeType] = useState<"cash" | "points">("cash");

  const { data: orderData, isLoading } = useQuery({
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

  // ─── Handle spin completion from SlotGame ───
  const handleSpinComplete = useCallback((result: SlotSpinResult) => {
    console.log("[SLOT GAME] Spin complete callback received:", result);
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
    setSpinsExhausted(true);
  }, []);

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
                  />
                )}

                {(showWinOverlay || showLoseOverlay) && (
                  <div className="absolute inset-0 z-10 pointer-events-auto cursor-default" />
                )}

                {spinsExhausted && (
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

          {/* ─── Stat Cards ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6" style={{ maxWidth: 960, margin: "0 auto 24px" }}>
            <StatCard label="Spins Purchased" value={order.quantity} icon="🎰" />
            <StatCard label="Total Credits" value={totalCredits.toLocaleString()} icon="💳" />
            <StatCard label="Credits / Spin" value={creditsPerSpin} icon="⚡" />
            <StatCard label="Credits Won" value={totalWon > 0 ? `+${totalWon}` : "0"} icon="🏆" accent={totalWon > 0} />
          </div>

          {/* ─── History Table ─── */}
          <SpinHistoryTable history={spinHistory} />
        </div>
      </main>
    </GameShell>
  );
}