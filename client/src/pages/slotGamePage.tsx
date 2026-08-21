import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { GameEmpty, GameShell, GameStatus } from "@/components/games/GameChrome";
import { useState, useEffect, useRef, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, ChevronDown, RefreshCw } from "lucide-react";
import SlotGameComponent from "@/components/games/slot-game";

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

// ─── Confetti ──────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#F1D47A","#C8102E","#FF263D","#B98928","#fff8ee","#E63946","#FFE066"];

function Confetti({ active }: { active: boolean }) {
  const pieces = Array.from({ length: 110 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.8,
    duration: 2.8 + Math.random() * 2.4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 7 + Math.random() * 11,
    isCircle: Math.random() > 0.4,
  }));
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.left}%`, top: "-20px",
          width: p.size, height: p.isCircle ? p.size : p.size * 1.7,
          backgroundColor: p.color,
          borderRadius: p.isCircle ? "50%" : "2px",
          animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards, confettiSway ${p.duration * 0.55}s ${p.delay}s ease-in-out infinite`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

// ─── Floating Coins ────────────────────────────────────────────────────────
function FloatingCoins({ active }: { active: boolean }) {
  const coins = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: 5 + Math.random() * 90,
    delay: Math.random() * 2,
    duration: 2.2 + Math.random() * 1.8,
    size: 18 + Math.random() * 22,
  }));
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[58] overflow-hidden">
      {coins.map(c => (
        <img key={c.id} src="/slot_win_coins.png" alt="" style={{
          position: "absolute", left: `${c.left}%`, top: "-40px",
          width: c.size, height: c.size, objectFit: "contain",
          animation: `confettiFall ${c.duration}s ${c.delay}s ease-in forwards`,
          opacity: 0,
          filter: "drop-shadow(0 0 4px rgba(255,200,0,0.7))",
        }} />
      ))}
    </div>
  );
}

// ─── Win Overlay (Responsive) ───────────────────────────────────────────
function WinOverlay({ show, coinsWon, prizeType, prizeName, onDismiss }: { show: boolean; coinsWon: number; prizeType: "cash" | "points"; prizeName: string; onDismiss: () => void }) {
  const winLabel = coinsWon >= 1000 ? "JACKPOT WIN! 🎉" : coinsWon >= 500 ? "BIG WIN! 🔥" : "AMAZING WIN!";
  const isCash = prizeType === "cash";
  const DOTS = 3;

  return (
    <>
      <Confetti active={show} />
      <FloatingCoins active={show} />

      <div className={`fixed inset-0 z-[55] flex items-center justify-center p-4 transition-all duration-400 ${show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: show ? "rgba(2,0,10,0.88)" : "rgba(0,0,0,0)", backdropFilter: show ? "blur(8px)" : "none" }}>
        
        <div className="relative w-full max-w-[360px] animate-[winCardPop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#C8102E]/50"
            style={{
              background: "linear-gradient(165deg,#0A0A0D 0%,#050505 55%,#111115 100%)",
              boxShadow: "0 0 0 1px rgba(241,212,122,0.15), 0 0 55px rgba(200,16,46,0.25), 0 60px 160px rgba(0,0,0,0.99)"
            }}>
            
            <button onClick={onDismiss} className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full border border-white/15 bg-[#0A0A0D]/85 text-[#F1D47A] flex items-center justify-center text-sm font-black hover:bg-white/10 transition-colors"
              style={{ lineHeight: 1 }}>✕</button>

            {/* Trophy Section - CSS Only */}
            <div className="relative flex flex-col items-center px-6 sm:px-8 pt-8 sm:pt-8 pb-2"
              style={{ background: "linear-gradient(180deg,#1a0508 0%,#0A0A0D 100%)", overflow: "hidden" }}>
              
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 85% 75% at 50% 85%, rgba(255,180,0,0.22) 0%, rgba(140,40,255,0.14) 45%, transparent 75%)" }} />
              
              {/* CSS Trophy Icon */}
              <div className="relative w-32 sm:w-40 h-32 sm:h-40 flex items-center justify-center animate-[trophyBounce_2.5s_ease-in-out_infinite]"
                style={{
                  filter: "drop-shadow(0 0 36px rgba(255,215,0,0.85)) drop-shadow(0 0 14px rgba(255,215,0,0.55)) drop-shadow(0 14px 22px rgba(0,0,0,0.75))"
                }}>
                <div className="relative">
                  {/* Trophy cup */}
                  <div className="w-20 sm:w-24 h-24 sm:h-28 relative mx-auto"
                    style={{
                      background: "linear-gradient(180deg, #FFD700 0%, #FFA500 40%, #FF8C00 100%)",
                      clipPath: "polygon(20% 0%, 80% 0%, 90% 30%, 85% 70%, 60% 100%, 40% 100%, 15% 70%, 10% 30%)",
                      boxShadow: "inset 0 2px 10px rgba(255,255,255,0.4), 0 0 30px rgba(255,215,0,0.5)"
                    }}>
                    {/* Shine effect */}
                    <div className="absolute top-2 left-4 w-3 h-12 bg-white/30 rounded-full rotate-12" />
                  </div>
                  
                  {/* Trophy handles */}
                  <div className="absolute -left-3 sm:-left-4 top-8 sm:top-10 w-8 sm:w-10 h-8 sm:h-10 rounded-full border-4 sm:border-[5px] border-[#FFD700] bg-transparent"
                    style={{ boxShadow: "0 0 15px rgba(255,215,0,0.5)" }} />
                  <div className="absolute -right-3 sm:-right-4 top-8 sm:top-10 w-8 sm:w-10 h-8 sm:h-10 rounded-full border-4 sm:border-[5px] border-[#FFD700] bg-transparent"
                    style={{ boxShadow: "0 0 15px rgba(255,215,0,0.5)" }} />
                  
                  {/* Trophy base */}
                  <div className="w-24 sm:w-28 h-4 sm:h-5 mx-auto mt-1 rounded-b-lg"
                    style={{ background: "linear-gradient(180deg, #FFD700, #B8860B)", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }} />
                  <div className="w-28 sm:w-32 h-3 sm:h-4 mx-auto rounded-b-lg"
                    style={{ background: "linear-gradient(180deg, #B8860B, #8B6914)", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }} />
                </div>
              </div>
            </div>

            {/* YOU WON Banner */}
            <div className="relative px-5 sm:px-5 py-3 flex items-center justify-center gap-1.5 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#7a5408,#5c3c07,#7a5408)", borderTop: "2px solid #DAA520", borderBottom: "2px solid #DAA520" }}>
              
              {/* Decorative edge gradients */}
              <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-[18px]" style={{ background: "linear-gradient(90deg,rgba(60,0,100,0.8),transparent)" }} />
              <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-[18px]" style={{ background: "linear-gradient(270deg,rgba(60,0,100,0.8),transparent)" }} />
              
              {Array.from({ length: DOTS }).map((_, i) => (
                <div key={`l${i}`} className="w-2 h-2 rounded-full flex-shrink-0 animate-[dotBlink_1.3s_ease-in-out_infinite]"
                  style={{ background: "#FFE566", boxShadow: "0 0 8px #FFD700, 0 0 3px #FFF", animationDelay: `${i * 0.15}s` }} />
              ))}
              <span className="font-black text-2xl sm:text-3xl tracking-[4px] mx-2 text-[#FFE566] uppercase"
                style={{ textShadow: "0 0 25px rgba(255,200,0,1), 2px 2px 0 rgba(0,0,0,0.7)", fontFamily: "'Impact','Arial Black',sans-serif" }}>
                YOU WON!
              </span>
              {Array.from({ length: DOTS }).map((_, i) => (
                <div key={`r${i}`} className="w-2 h-2 rounded-full flex-shrink-0 animate-[dotBlink_1.3s_ease-in-out_infinite]"
                  style={{ background: "#FFE566", boxShadow: "0 0 8px #FFD700, 0 0 3px #FFF", animationDelay: `${(DOTS - i) * 0.15}s` }} />
              ))}
            </div>

            {/* Prize Amount Section */}
            <div className="px-5 sm:px-7 py-4 sm:py-5 text-center"
              style={{ background: "linear-gradient(180deg,#0c0020,#060012)" }}>
              
              {/* Congratulations divider */}
              <div className="flex items-center gap-2 justify-center mb-3">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,200,0,0.4))" }} />
                <span className="text-[11px] font-black tracking-[2.5px] text-[#FCD34D] uppercase whitespace-nowrap">★ Congratulations ★</span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,rgba(255,200,0,0.4),transparent)" }} />
              </div>

              {/* Coins and Amount */}
              <div className="flex items-center gap-0 mb-3">
                {/* Amount Box */}
                <div className="flex-1 px-3 sm:px-3 py-3 sm:py-3.5 rounded-2xl border border-[rgba(255,180,0,0.45)] flex flex-col items-center justify-center z-1"
                  style={{
                    background: "linear-gradient(145deg,rgba(18,4,40,1),rgba(10,2,28,1))",
                    boxShadow: "0 0 40px rgba(255,160,0,0.15), 0 0 80px rgba(140,40,255,0.08), inset 0 1px 0 rgba(255,200,0,0.08)"
                  }}>
                  
                  {/* Decorative dots */}
                  <div className="flex justify-between w-full mb-1">
                    <span className="text-[10px] text-[rgba(255,200,0,0.5)] animate-[dotBlink_2s_0.3s_ease-in-out_infinite]">✦</span>
                    <span className="text-[10px] text-[rgba(255,200,0,0.5)] animate-[dotBlink_2s_0.8s_ease-in-out_infinite]">✦</span>
                  </div>
                  
                  <div className="text-3xl sm:text-[44px] lg:text-[56px] font-black leading-none text-center w-full animate-[winPop_0.6s_0.3s_ease-out_both] tabular-nums"
                    style={{
                      background: "linear-gradient(180deg,#FFF5AA 0%,#FFD700 35%,#FF9500 75%,#FF6000 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: "drop-shadow(0 0 20px rgba(255,200,0,0.65))",
                      fontFamily: "'Impact','Arial Black',sans-serif"
                    }}>
                    {isCash ? `+£${coinsWon.toLocaleString()}` : `+${coinsWon.toLocaleString()} pts`}
                  </div>

                  <div className="text-[11px] font-black tracking-[5px] text-[rgba(252,211,77,0.8)] uppercase mt-1.5 text-center">
                    <span className="text-[rgba(255,180,0,0.35)] mr-2">◆</span>
                    {isCash ? "CASH PRIZE" : "RINGTONE POINTS"}
                    <span className="text-[rgba(255,180,0,0.35)] ml-2">◆</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-[rgba(220,190,255,0.45)] mb-3 tracking-[0.3px]">Credits added to your balance</div>

              {/* Win Label Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-[22px] border border-[rgba(255,210,0,0.38)] bg-[rgba(80,30,0,0.2)] mb-4">
                <span className="text-[15px]">👑</span>
                <span className="text-[11px] font-black tracking-[2.5px] text-[#FFD700] uppercase">{winLabel}</span>
              </div>

              {/* Continue Button */}
              <button onClick={onDismiss}
                className="w-full py-4 px-6 rounded-[50px] border-2 border-[#22c55e] text-white font-black text-[17px] tracking-[3.5px] uppercase flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#16a34a 0%,#15803d 50%,#14532d 100%)",
                  boxShadow: "0 0 40px rgba(22,163,74,0.45), 0 8px 28px rgba(0,0,0,0.7)",
                  fontFamily: "'Impact','Arial Black',sans-serif"
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 65px rgba(22,163,74,0.7), 0 8px 28px rgba(0,0,0,0.7)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 40px rgba(22,163,74,0.45), 0 8px 28px rgba(0,0,0,0.7)"}>
                <span className="text-[22px] leading-none">»</span>
                Continue
                <span className="text-[22px] leading-none">«</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Lose Overlay (Responsive, No External Images) ──────────────────────
function LoseOverlay({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  return (
    <div className={`fixed inset-0 z-[55] flex items-center justify-center p-4 transition-all duration-300 ${show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{ background: show ? "rgba(10,0,5,0.80)" : "rgba(0,0,0,0)", backdropFilter: show ? "blur(6px)" : "none" }}>
      
      <div className="relative w-full max-w-[360px] animate-[winCardPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        <div className="rounded-3xl overflow-hidden border-2 border-[rgba(220,38,38,0.6)]"
          style={{
            background: "linear-gradient(165deg,#1a0005 0%,#0d0003 55%,#050001 100%)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 0 55px rgba(220,38,38,0.2), 0 0 120px rgba(180,0,30,0.12), inset 0 1px 0 rgba(255,80,80,0.08), 0 60px 160px rgba(0,0,0,0.99)"
          }}>
          
          <button onClick={onDismiss} className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full border border-[rgba(220,80,80,0.45)] bg-[rgba(60,5,10,0.85)] text-[#F87171] flex items-center justify-center text-sm font-black hover:bg-[rgba(80,5,15,0.9)] transition-colors">✕</button>

          {/* Sad Face Section - CSS Only */}
          <div className="flex flex-col items-center px-8 pt-8 pb-4"
            style={{ background: "linear-gradient(180deg,#200008 0%,#100004 100%)" }}>
            <div className="w-24 sm:w-[100px] h-24 sm:h-[100px] rounded-full flex items-center justify-center text-4xl sm:text-[42px] animate-[trophyBounce_2.5s_ease-in-out_infinite]"
              style={{
                background: "linear-gradient(135deg,#7f1d1d,#450a0a)",
                border: "3px solid rgba(239,68,68,0.5)",
                boxShadow: "0 0 40px rgba(220,38,38,0.35), 0 0 80px rgba(180,0,30,0.15)"
              }}>
              {/* CSS Slot Machine Sad Icon */}
              <div className="relative">
                <span className="text-2xl sm:text-3xl">🎰</span>
                <span className="absolute -top-1 -right-1 text-lg sm:text-xl">❌</span>
              </div>
            </div>
          </div>

          {/* NO MATCH Banner */}
          <div className="px-5 py-3 text-center"
            style={{
              background: "linear-gradient(135deg,#6b0f0f,#450a0a,#6b0f0f)",
              borderTop: "2px solid rgba(220,38,38,0.6)",
              borderBottom: "2px solid rgba(220,38,38,0.6)"
            }}>
            {/* Decorative elements */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[10px] text-red-400/50 animate-pulse">✕</span>
              <span className="text-[10px] text-red-400/50 animate-pulse" style={{ animationDelay: "0.2s" }}>✕</span>
              <span className="text-[10px] text-red-400/50 animate-pulse" style={{ animationDelay: "0.4s" }}>✕</span>
            </div>
            <span className="font-black text-2xl sm:text-[26px] tracking-[3px] text-[#FCA5A5] uppercase"
              style={{ textShadow: "0 0 20px rgba(220,38,38,0.8), 2px 2px 0 rgba(0,0,0,0.7)", fontFamily: "'Impact','Arial Black',sans-serif" }}>
              NO MATCH!
            </span>
          </div>

          {/* Message and Button */}
          <div className="px-7 py-5 sm:py-6 text-center" style={{ background: "linear-gradient(180deg,#0c0002,#060001)" }}>
            <div className="text-[15px] text-[rgba(255,160,160,0.75)] mb-4 font-medium">
              Better luck on your next spin!<br />
              <span className="text-xs text-[rgba(255,120,120,0.45)]">Your jackpot is just around the corner 🎰</span>
            </div>
            
            {/* Decorative divider */}
            <div className="flex items-center gap-2 justify-center mb-4">
              <div className="w-8 h-px bg-red-500/20" />
              <span className="text-sm">🍀</span>
              <div className="w-8 h-px bg-red-500/20" />
            </div>
            
            <button onClick={onDismiss}
              className="w-full py-3.5 px-6 rounded-[50px] border-2 border-[rgba(220,38,38,0.7)] text-white font-black text-base tracking-[3px] uppercase transition-all duration-200 hover:scale-[1.02] active:scale-95"
              style={{
                background: "linear-gradient(135deg,#7f1d1d 0%,#991b1b 50%,#7f1d1d 100%)",
                boxShadow: "0 0 30px rgba(220,38,38,0.3), 0 8px 24px rgba(0,0,0,0.6)",
                fontFamily: "'Impact','Arial Black',sans-serif"
              }}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Casino Stat Card (Responsive) ───────────────────────────────────────
function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent?: boolean }) {
  return (
    <div className="relative p-3 sm:p-4 md:p-5 rounded-2xl text-center overflow-hidden"
      style={{
        background: accent
          ? "linear-gradient(145deg,rgba(200,16,46,0.18),rgba(10,10,13,0.95))"
          : "linear-gradient(145deg,rgba(18,18,22,0.95),rgba(8,8,10,0.95))",
        border: accent ? "1px solid rgba(241,212,122,0.4)" : "1px solid rgba(255,255,255,0.1)",
        boxShadow: accent
          ? "0 0 30px rgba(200,16,46,0.12), inset 0 1px 0 rgba(241,212,122,0.15)"
          : "inset 0 1px 0 rgba(255,255,255,0.06)"
      }}>
      <div className="text-lg sm:text-xl md:text-[22px] mb-1.5">{icon}</div>
      <div className="text-xl sm:text-2xl md:text-[26px] font-black leading-none mb-1 tabular-nums"
        style={{
          background: accent ? "linear-gradient(180deg,#F1D47A,#B98928)" : "linear-gradient(180deg,#fff,#d4d4d8)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>{value}</div>
      <div className="text-[9px] sm:text-[10px] font-black tracking-[2px] uppercase text-[rgba(255,255,255,0.35)]">{label}</div>
    </div>
  );
}

// ─── Spins Counter Badge ─────────────────────────────────────────────────
function SpinsCounter({ used, total }: { used: number; total: number }) {
  const remaining = total - used;
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  
  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl"
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
  onBack 
}: SpinsExhaustedOverlayProps) {
  // Format the won value based on prize type
  const formatWonValue = () => {
    if (totalWon <= 0) return "—";
    if (prizeType === 'cash') {
      return `£${totalWon}`;
    } else {
      return `${totalWon} pts`;
    }
  };

  // Get the appropriate icon for the prize type
  const getPrizeIcon = () => {
    if (totalWon <= 0) return "💰";
    return prizeType === 'cash' ? "💰" : "⭐";
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-6"
      style={{
        background: "linear-gradient(165deg,rgba(5,5,5,0.97) 0%,rgba(10,10,13,0.98) 100%)",
        backdropFilter: "blur(6px)"
      }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%,rgba(200,16,46,0.12) 0%,transparent 70%)" }} />
      <div className="text-4xl sm:text-5xl md:text-[56px] mb-3" style={{ filter: "drop-shadow(0 0 18px rgba(241,212,122,0.5))" }}>🎰</div>
      <div className="text-lg sm:text-xl md:text-[22px] font-black tracking-[2px] uppercase mb-1"
        style={{ background: "linear-gradient(180deg,#F1D47A,#B98928)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        All Spins Used!
      </div>
      <div className="text-xs sm:text-[13px] text-white/50 mb-5 text-center">
        You've completed all {totalSpins} spin{totalSpins !== 1 ? "s" : ""} for this game.
      </div>

      <div className="flex gap-2 sm:gap-3 mb-6">
        {[
          { label: "Spins", value: totalSpins, icon: "🎰" },
          { label: "Wins", value: wins, icon: "🏆" },
          { 
            label: prizeType === 'cash' ? "Won" : "Points Won", 
            value: formatWonValue(), 
            icon: getPrizeIcon() 
          },
        ].map(s => (
          <div key={s.label} className="text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl min-w-[60px] sm:min-w-[72px]"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,150,255,0.2)" }}>
            <div className="text-base sm:text-lg mb-1">{s.icon}</div>
            <div className="text-base sm:text-lg font-black text-[#E0B0FF]">{s.value}</div>
            <div className="text-[9px] sm:text-[10px] font-bold tracking-[1.5px] text-[rgba(255,255,255,0.35)] uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <button onClick={onBack} className="px-6 sm:px-8 py-3 rounded-[50px] font-black text-sm tracking-[1px] uppercase text-white transition-all hover:scale-105"
        style={{
          background: "linear-gradient(135deg,#7c3aed,#4c1d95)",
          border: "1px solid rgba(200,150,255,0.5)",
          boxShadow: "0 0 24px rgba(140,50,255,0.4)"
        }}>← Back to Competitions</button>
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
    <div className="overflow-hidden rounded-2xl border border-white/10 sm:rounded-3xl"
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
              <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden aspect-[9/14] sm:aspect-video min-h-[520px] sm:min-h-[280px]"
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