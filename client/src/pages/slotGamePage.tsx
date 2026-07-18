import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState, useEffect, useRef, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, ChevronDown } from "lucide-react";
import SlotGame from "@/components/games/slot-game"; // Import the SlotGame component
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

const GOLD = "#FFD700";
const AMBER = "#FF8C00";

// ─── Confetti ──────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#FFD700","#FF6B35","#E63946","#06D6A0","#9B59B6","#FF3FA4","#FFE066","#2ECC71","#3498DB","#E74C3C","#F39C12","#1ABC9C"];

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

// ─── Win Overlay ───────────────────────────────────────────────────────────
function WinOverlay({ show, coinsWon, prizeType, prizeName, onDismiss }: { show: boolean; coinsWon: number; prizeType: "cash" | "points"; prizeName: string; onDismiss: () => void }) {
  const winLabel = coinsWon >= 1000 ? "JACKPOT WIN! 🎉" : coinsWon >= 500 ? "BIG WIN! 🔥" : "AMAZING WIN!";
  const isCash = prizeType === "cash";
  const DOTS = 5;

  return (
    <>
      <Confetti active={show} />
      <FloatingCoins active={show} />

      <div style={{
        position: "fixed", inset: 0, zIndex: 55,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: show ? "rgba(2,0,10,0.88)" : "rgba(0,0,0,0)",
        backdropFilter: show ? "blur(8px)" : "none",
        opacity: show ? 1 : 0,
        transition: "opacity 0.4s ease",
        pointerEvents: show ? "all" : "none",
        padding: "16px",
      }}>
        <div style={{
          position: "relative",
          maxWidth: 360,
          width: "100%",
          animation: show ? "winCardPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
        }}>
          <div style={{
            position: "relative",
            borderRadius: 28,
            overflow: "hidden",
            background: "linear-gradient(165deg,#0e0025 0%,#08001a 55%,#050010 100%)",
            border: "2px solid #c9922a",
            boxShadow: [
              "0 0 0 1px rgba(255,200,0,0.15)",
              "0 0 55px rgba(180,80,255,0.2)",
              "0 0 120px rgba(120,40,200,0.15)",
              "inset 0 1px 0 rgba(255,210,0,0.1)",
              "0 60px 160px rgba(0,0,0,0.99)",
            ].join(", "),
          }}>
            <button onClick={onDismiss} style={{
              position: "absolute", top: 14, right: 14, zIndex: 20,
              width: 32, height: 32, borderRadius: "50%",
              border: "1.5px solid rgba(200,140,255,0.45)",
              background: "rgba(30,5,60,0.85)",
              color: "#C084FC", cursor: "pointer", fontSize: 14, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1,
            }}>✕</button>

            <div style={{
              position: "relative",
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "32px 32px 8px",
              background: "linear-gradient(180deg,#1a0040 0%,#0e0028 100%)",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse 85% 75% at 50% 85%, rgba(255,180,0,0.22) 0%, rgba(140,40,255,0.14) 45%, transparent 75%)",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)",
                width: 340, height: 210,
                background: [
                  "conic-gradient(from 255deg at 50% 100%,",
                  "transparent 0deg, rgba(255,200,0,0.13) 6deg, transparent 13deg,",
                  "transparent 43deg, rgba(255,180,0,0.10) 50deg, transparent 57deg,",
                  "transparent 87deg, rgba(255,160,0,0.09) 94deg, transparent 101deg,",
                  "transparent 131deg, rgba(255,200,0,0.08) 138deg, transparent 145deg)",
                ].join(""),
                pointerEvents: "none",
              }} />
              <img
                src="/slot_win_trophy_nobg.png"
                alt="Trophy"
                style={{
                  width: 160, height: 160, objectFit: "contain",
                  display: "block",
                  position: "relative", zIndex: 2,
                  filter: [
                    "drop-shadow(0 0 36px rgba(255,215,0,0.85))",
                    "drop-shadow(0 0 14px rgba(255,215,0,0.55))",
                    "drop-shadow(0 14px 22px rgba(0,0,0,0.75))",
                  ].join(" "),
                  animation: "trophyBounce 2.5s ease-in-out infinite",
                }}
              />
            </div>

            <div style={{
              position: "relative", padding: "12px 20px 10px",
              background: "linear-gradient(135deg,#7a5408,#5c3c07,#7a5408)",
              borderTop: "2px solid #DAA520",
              borderBottom: "2px solid #DAA520",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, background: "linear-gradient(90deg,rgba(60,0,100,0.8),transparent)" }} />
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 18, background: "linear-gradient(270deg,rgba(60,0,100,0.8),transparent)" }} />
              {Array.from({ length: DOTS }).map((_, i) => (
                <div key={`l${i}`} style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: "#FFE566", boxShadow: "0 0 8px #FFD700, 0 0 3px #FFF",
                  animation: `dotBlink 1.3s ${i * 0.15}s ease-in-out infinite`,
                }} />
              ))}
              <span style={{
                fontWeight: 900, fontSize: 32, letterSpacing: 4, margin: "0 8px",
                color: "#FFE566",
                textShadow: "0 0 25px rgba(255,200,0,1), 2px 2px 0 rgba(0,0,0,0.7)",
                fontFamily: "'Impact','Arial Black',sans-serif",
              }}>YOU WON!</span>
              {Array.from({ length: DOTS }).map((_, i) => (
                <div key={`r${i}`} style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: "#FFE566", boxShadow: "0 0 8px #FFD700, 0 0 3px #FFF",
                  animation: `dotBlink 1.3s ${(DOTS - i) * 0.15}s ease-in-out infinite`,
                }} />
              ))}
            </div>

            <div style={{
              padding: "18px 28px 28px",
              background: "linear-gradient(180deg,#0c0020,#060012)",
              textAlign: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,200,0,0.4))" }} />
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2.5, color: "#FCD34D", textTransform: "uppercase", whiteSpace: "nowrap" }}>★ Congratulations ★</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(255,200,0,0.4),transparent)" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 14 }}>
                <img src="/slot_win_coins_nobg.png" alt="" style={{
                  width: 72, height: 72, objectFit: "contain", flexShrink: 0,
                  filter: "drop-shadow(0 0 14px rgba(255,200,0,0.75))",
                  animation: "floatCoin 3s ease-in-out infinite",
                  marginRight: -10,
                  zIndex: 2,
                }} />

                <div style={{
                  flex: 1,
                  padding: "18px 12px 14px",
                  borderRadius: 18,
                  background: "linear-gradient(145deg,rgba(18,4,40,1),rgba(10,2,28,1))",
                  border: "1.5px solid rgba(255,180,0,0.45)",
                  boxShadow: [
                    "0 0 40px rgba(255,160,0,0.15)",
                    "0 0 80px rgba(140,40,255,0.08)",
                    "inset 0 1px 0 rgba(255,200,0,0.08)",
                  ].join(", "),
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  zIndex: 1,
                }}>
                  <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,200,0,0.5)", animation: "dotBlink 2s 0.3s ease-in-out infinite" }}>✦</span>
                    <span style={{ fontSize: 10, color: "rgba(255,200,0,0.5)", animation: "dotBlink 2s 0.8s ease-in-out infinite" }}>✦</span>
                  </div>

                  <div style={{
                    fontSize: coinsWon >= 1000 ? 44 : 56, fontWeight: 900, lineHeight: 1,
                    background: "linear-gradient(180deg,#FFF5AA 0%,#FFD700 35%,#FF9500 75%,#FF6000 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 20px rgba(255,200,0,0.65))",
                    animation: "winPop 0.6s 0.3s ease-out both",
                    fontVariantNumeric: "tabular-nums",
                    fontFamily: "'Impact','Arial Black',sans-serif",
                    textAlign: "center", width: "100%",
                  }}>{isCash ? `+£${coinsWon.toLocaleString()}` : `+${coinsWon.toLocaleString()}`}</div>

                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 5, color: "rgba(252,211,77,0.8)", textTransform: "uppercase", marginTop: 6, textAlign: "center" }}>
                    <span style={{ color: "rgba(255,180,0,0.35)", marginRight: 7 }}>◆</span>
                    {isCash ? "CASH PRIZE" : "RINGTONE POINTS"}
                    <span style={{ color: "rgba(255,180,0,0.35)", marginLeft: 7 }}>◆</span>
                  </div>
                </div>

                <img src="/slot_win_coins_nobg.png" alt="" style={{
                  width: 72, height: 72, objectFit: "contain", flexShrink: 0,
                  filter: "drop-shadow(0 0 14px rgba(255,200,0,0.75))",
                  transform: "scaleX(-1)",
                  animation: "floatCoin 3s 1.1s ease-in-out infinite",
                  marginLeft: -10,
                  zIndex: 2,
                }} />
              </div>

              <div style={{ fontSize: 12, color: "rgba(220,190,255,0.45)", marginBottom: 14, letterSpacing: 0.3 }}>
                Credits added to your balance
              </div>

              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "7px 20px", borderRadius: 22,
                border: "1px solid rgba(255,210,0,0.38)",
                background: "rgba(80,30,0,0.2)",
                marginBottom: 18,
              }}>
                <span style={{ fontSize: 15 }}>👑</span>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2.5, color: "#FFD700", textTransform: "uppercase" }}>{winLabel}</span>
              </div>

              <button
                onClick={onDismiss}
                style={{
                  width: "100%", padding: "16px 24px", borderRadius: 50,
                  border: "2px solid #22c55e",
                  background: "linear-gradient(135deg,#16a34a 0%,#15803d 50%,#14532d 100%)",
                  color: "#fff", fontWeight: 900, fontSize: 17, letterSpacing: 3.5,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
                  boxShadow: "0 0 40px rgba(22,163,74,0.45), 0 8px 28px rgba(0,0,0,0.7)",
                  textTransform: "uppercase",
                  fontFamily: "'Impact','Arial Black',sans-serif",
                  transition: "box-shadow 0.2s, transform 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 0 65px rgba(22,163,74,0.7), 0 8px 28px rgba(0,0,0,0.7)";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "0 0 40px rgba(22,163,74,0.45), 0 8px 28px rgba(0,0,0,0.7)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>»</span>
                Continue
                <span style={{ fontSize: 22, lineHeight: 1 }}>«</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Lose Overlay ──────────────────────────────────────────────────────────
function LoseOverlay({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 55,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: show ? "rgba(10,0,5,0.80)" : "rgba(0,0,0,0)",
      backdropFilter: show ? "blur(6px)" : "none",
      opacity: show ? 1 : 0,
      transition: "opacity 0.3s ease, background 0.3s ease",
      pointerEvents: show ? "all" : "none",
      padding: "16px",
    }}>
      <div style={{
        position: "relative",
        maxWidth: 360, width: "100%",
        animation: show ? "winCardPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
      }}>
        <div style={{
          borderRadius: 28, overflow: "hidden",
          background: "linear-gradient(165deg,#1a0005 0%,#0d0003 55%,#050001 100%)",
          border: "2px solid rgba(220,38,38,0.6)",
          boxShadow: [
            "0 0 0 1px rgba(0,0,0,0.5)",
            "0 0 55px rgba(220,38,38,0.2)",
            "0 0 120px rgba(180,0,30,0.12)",
            "inset 0 1px 0 rgba(255,80,80,0.08)",
            "0 60px 160px rgba(0,0,0,0.99)",
          ].join(", "),
        }}>
          <button onClick={onDismiss} style={{
            position: "absolute", top: 14, right: 14, zIndex: 20,
            width: 32, height: 32, borderRadius: "50%",
            border: "1.5px solid rgba(220,80,80,0.45)",
            background: "rgba(60,5,10,0.85)",
            color: "#F87171", cursor: "pointer", fontSize: 14, fontWeight: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>

          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "32px 32px 16px",
            background: "linear-gradient(180deg,#200008 0%,#100004 100%)",
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg,#7f1d1d,#450a0a)",
              border: "3px solid rgba(239,68,68,0.5)",
              boxShadow: "0 0 40px rgba(220,38,38,0.35), 0 0 80px rgba(180,0,30,0.15)",
              fontSize: 42,
              animation: "trophyBounce 2.5s ease-in-out infinite",
            }}>😔</div>
          </div>

          <div style={{
            padding: "12px 20px 10px", textAlign: "center",
            background: "linear-gradient(135deg,#6b0f0f,#450a0a,#6b0f0f)",
            borderTop: "2px solid rgba(220,38,38,0.6)",
            borderBottom: "2px solid rgba(220,38,38,0.6)",
          }}>
            <span style={{
              fontWeight: 900, fontSize: 26, letterSpacing: 3, color: "#FCA5A5",
              textShadow: "0 0 20px rgba(220,38,38,0.8), 2px 2px 0 rgba(0,0,0,0.7)",
              fontFamily: "'Impact','Arial Black',sans-serif",
            }}>NO MATCH!</span>
          </div>

          <div style={{
            padding: "20px 28px 24px",
            background: "linear-gradient(180deg,#0c0002,#060001)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 15, color: "rgba(255,160,160,0.75)", marginBottom: 18, fontWeight: 500 }}>
              Better luck on your next spin!<br />
              <span style={{ fontSize: 12, color: "rgba(255,120,120,0.45)" }}>Your jackpot is just around the corner 🎰</span>
            </div>
            <button onClick={onDismiss} style={{
              width: "100%", padding: "14px 24px", borderRadius: 50,
              border: "2px solid rgba(220,38,38,0.7)",
              background: "linear-gradient(135deg,#7f1d1d 0%,#991b1b 50%,#7f1d1d 100%)",
              color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: 3,
              cursor: "pointer", fontFamily: "'Impact','Arial Black',sans-serif",
              boxShadow: "0 0 30px rgba(220,38,38,0.3), 0 8px 24px rgba(0,0,0,0.6)",
              textTransform: "uppercase",
            }}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Casino Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent?: boolean }) {
  return (
    <div style={{
      position: "relative", padding: "20px 16px", borderRadius: 16, textAlign: "center", overflow: "hidden",
      background: accent
        ? "linear-gradient(145deg,rgba(60,30,0,0.95),rgba(30,12,0,0.95))"
        : "linear-gradient(145deg,rgba(18,8,35,0.95),rgba(8,4,20,0.95))",
      border: accent ? "1px solid rgba(255,180,0,0.4)" : "1px solid rgba(120,60,200,0.3)",
      boxShadow: accent
        ? "0 0 30px rgba(255,160,0,0.12), inset 0 1px 0 rgba(255,200,0,0.15)"
        : "0 0 20px rgba(120,60,200,0.08), inset 0 1px 0 rgba(150,80,255,0.1)",
    }}>
      <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 60, height: 60, borderRadius: "50%", background: accent ? "rgba(255,180,0,0.15)" : "rgba(140,60,255,0.1)", filter: "blur(20px)", pointerEvents: "none" }} />
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{
        fontSize: 26, fontWeight: 900, lineHeight: 1, marginBottom: 5, fontVariantNumeric: "tabular-nums",
        background: accent ? "linear-gradient(180deg,#FFE566,#FF8C00)" : "linear-gradient(180deg,#E0B0FF,#9B59B6)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{label}</div>
    </div>
  );
}

// ─── Spins Exhausted Overlay ─────────────────────────────────────────────
function SpinsExhaustedOverlay({ totalSpins, wins, totalWon, onBack }: {
  totalSpins: number; wins: number; totalWon: number; onBack: () => void;
}) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 20,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(165deg,rgba(8,0,22,0.97) 0%,rgba(4,0,12,0.98) 100%)",
      backdropFilter: "blur(6px)",
      padding: "24px 16px",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 50% at 50% 40%,rgba(200,130,255,0.1) 0%,transparent 70%)" }} />
      <div style={{ fontSize: 56, marginBottom: 12, filter: "drop-shadow(0 0 18px rgba(200,130,255,0.5))" }}>🎰</div>
      <div style={{
        fontSize: 22, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4,
        background: "linear-gradient(180deg,#E0B0FF,#9B59B6)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>All Spins Used!</div>
      <div style={{ fontSize: 13, color: "rgba(200,160,255,0.6)", marginBottom: 20, textAlign: "center" }}>
        You've completed all {totalSpins} spin{totalSpins !== 1 ? "s" : ""} for this game.
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Spins", value: totalSpins, icon: "🎰" },
          { label: "Wins", value: wins, icon: "🏆" },
          { label: "Won", value: totalWon > 0 ? `£${totalWon}` : "—", icon: "💰" },
        ].map(s => (
          <div key={s.label} style={{
            textAlign: "center", padding: "12px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,150,255,0.2)",
            minWidth: 72,
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#E0B0FF" }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <button onClick={onBack} style={{
        padding: "12px 32px", borderRadius: 50, fontWeight: 900, fontSize: 14, cursor: "pointer",
        letterSpacing: 1, textTransform: "uppercase",
        background: "linear-gradient(135deg,#7c3aed,#4c1d95)",
        border: "1px solid rgba(200,150,255,0.5)",
        color: "#fff",
        boxShadow: "0 0 24px rgba(140,50,255,0.4)",
      }}>← Back to Competitions</button>
    </div>
  );
}

// ─── Win label helper ────────────────────────────────────────────────────
function getWinLabel(coinsWon: number): { title: string; sub: string } {
  if (coinsWon >= 1000) return { title: "JACKPOT WIN", sub: "Amazing!" };
  if (coinsWon >= 100)  return { title: "BIG WIN",     sub: "Nice one!" };
  return { title: "WIN", sub: "Good Job!" };
}

// ─── Spin History Table ───────────────────────────────────────────────────
function SpinHistoryTable({ history }: { history: any[] }) {
  const wins = history.filter(h => h.isWin);
  const totalWon = wins.reduce((s, h) => s + (h.coinsWon || 0), 0);
  const winRate = history.length > 0 ? Math.round((wins.length / history.length) * 100) : 0;
  const biggestWin = wins.length > 0 ? Math.max(...wins.map(h => h.coinsWon || 0)) : 0;

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
    catch { return "—"; }
  };

  const COLS = "72px 1fr 180px 180px 150px 40px";

  return (
    <div style={{
      borderRadius: 24, overflow: "hidden",
      background: "linear-gradient(160deg,#0d0820 0%,#091520 50%,#0a0d1a 100%)",
      border: "1.5px solid rgba(100,70,200,0.35)",
      boxShadow: "0 0 0 1px rgba(0,0,0,0.6), 0 24px 80px rgba(0,0,0,0.8)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14,
        padding: "22px 28px 18px",
        background: "linear-gradient(135deg,rgba(18,8,45,1),rgba(8,18,42,1))",
        borderBottom: "1.5px solid rgba(100,70,200,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg,#2d1060,#1a0840)",
            border: "2px solid rgba(160,100,255,0.5)", fontSize: 26,
            boxShadow: "0 0 24px rgba(140,60,255,0.3)",
          }}>🎰</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: 4, textTransform: "uppercase" }}>Spin History</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 900, letterSpacing: 2, background: "#DC2626", color: "#fff", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
                LIVE
              </span>
              <span style={{ fontSize: 11, color: "rgba(180,140,255,0.7)", fontWeight: 600 }}>✦ Real Time Updates</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { icon: "🔄", value: history.length, label: "TOTAL SPINS", bg: "rgba(100,80,220,0.2)", border: "rgba(120,90,255,0.45)", color: "#A78BFA" },
            { icon: "🏆", value: wins.length,    label: "TOTAL WINS",  bg: wins.length > 0 ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.04)", border: wins.length > 0 ? "rgba(34,197,94,0.45)" : "rgba(255,255,255,0.1)", color: wins.length > 0 ? "#4ADE80" : "rgba(255,255,255,0.3)" },
            { icon: "🎯", value: `${winRate}%`,  label: "WIN RATE",   bg: "rgba(234,179,8,0.12)", border: "rgba(255,185,0,0.4)", color: "#FCD34D" },
          ].map(p => (
            <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 40, background: p.bg, border: `1.5px solid ${p.border}` }}>
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: p.color, lineHeight: 1 }}>{p.value}</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{p.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, padding: "20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 22px", borderRadius: 18, background: "linear-gradient(135deg,#1e0d50,#140835)", border: "1.5px solid rgba(120,80,220,0.4)", boxShadow: "0 0 30px rgba(100,60,220,0.12)" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#3d1a80,#2a0d60)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, border: "1px solid rgba(160,100,255,0.3)", boxShadow: "0 0 20px rgba(120,60,255,0.3)" }}>🎰</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2.5, color: "rgba(160,120,255,0.7)", textTransform: "uppercase", marginBottom: 4 }}>Total Spins</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{history.length}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 22px", borderRadius: 18, background: wins.length > 0 ? "linear-gradient(135deg,#0a2e18,#061a0e)" : "linear-gradient(135deg,#111,#0a0a0a)", border: `1.5px solid ${wins.length > 0 ? "rgba(34,197,94,0.45)" : "rgba(255,255,255,0.08)"}`, boxShadow: wins.length > 0 ? "0 0 30px rgba(34,197,94,0.1)" : "none" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: wins.length > 0 ? "linear-gradient(135deg,#166534,#0d4023)" : "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, border: `1px solid ${wins.length > 0 ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`, boxShadow: wins.length > 0 ? "0 0 20px rgba(34,197,94,0.3)" : "none" }}>🏆</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2.5, color: wins.length > 0 ? "rgba(74,222,128,0.7)" : "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Total Wins</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: wins.length > 0 ? "#4ADE80" : "rgba(255,255,255,0.2)", lineHeight: 1 }}>{wins.length}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 22px", borderRadius: 18, background: totalWon > 0 ? "linear-gradient(135deg,#2a1500,#1a0d00)" : "linear-gradient(135deg,#111,#0a0a0a)", border: `1.5px solid ${totalWon > 0 ? "rgba(255,185,0,0.5)" : "rgba(255,255,255,0.08)"}`, boxShadow: totalWon > 0 ? "0 0 30px rgba(255,150,0,0.18)" : "none" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: totalWon > 0 ? "linear-gradient(135deg,#92400e,#5c2800)" : "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, border: `1px solid ${totalWon > 0 ? "rgba(255,185,0,0.45)" : "rgba(255,255,255,0.08)"}`, boxShadow: totalWon > 0 ? "0 0 20px rgba(255,150,0,0.4)" : "none" }}>🪙</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2.5, color: totalWon > 0 ? "rgba(253,211,77,0.7)" : "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Credits Won</div>
            <div style={{
              fontSize: 32, fontWeight: 900, lineHeight: 1,
              background: totalWon > 0 ? "linear-gradient(180deg,#FFE566,#FFA500)" : "none",
              WebkitBackgroundClip: totalWon > 0 ? "text" : "unset",
              WebkitTextFillColor: totalWon > 0 ? "transparent" : "rgba(255,255,255,0.2)",
            }}>{totalWon > 0 ? `+${totalWon.toLocaleString()}` : "0"}</div>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div style={{ padding: "60px 32px", textAlign: "center", borderTop: "1px solid rgba(100,70,200,0.15)" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎰</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(180,140,255,0.6)" }}>No spins yet — start playing!</div>
          <div style={{ fontSize: 13, marginTop: 8, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>Your spin history will appear here in real-time</div>
        </div>
      ) : (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: COLS,
            padding: "12px 28px",
            background: "rgba(0,0,0,0.35)",
            borderTop: "1px solid rgba(100,70,200,0.2)",
            borderBottom: "1px solid rgba(100,70,200,0.2)",
            alignItems: "center",
          }}>
            {["#", "Result", "Credits Won", "Credits Spent", "Time", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,185,0,0.9)" }}>{h}</div>
            ))}
          </div>

          <div style={{ maxHeight: 460, overflowY: "auto" }}>
            {history.map((spin, i) => {
              const num = history.length - i;
              const isWin = spin.isWin;
              const coinsWon = spin.coinsWon || 0;
              const { title: winTitle, sub: winSub } = isWin ? getWinLabel(coinsWon) : { title: "NO MATCH", sub: "Try Again!" };
              return (
                <div
                  key={spin.id || i}
                  style={{
                    display: "grid", gridTemplateColumns: COLS,
                    padding: "15px 28px",
                    alignItems: "center",
                    background: isWin ? "rgba(16,80,40,0.2)" : "rgba(255,255,255,0.02)",
                    borderLeft: `4px solid ${isWin ? "#22C55E" : "rgba(239,68,68,0.5)"}`,
                    borderBottom: "1px solid rgba(100,70,200,0.1)",
                    animation: i === 0 ? "historyRowIn 0.5s ease-out" : "none",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#FFB830" }}>#{num}</div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isWin ? "linear-gradient(135deg,#166534,#0d4023)" : "linear-gradient(135deg,#7f1d1d,#450a0a)",
                      border: `2px solid ${isWin ? "#22C55E" : "#DC2626"}`,
                      boxShadow: isWin ? "0 0 14px rgba(34,197,94,0.55)" : "0 0 12px rgba(220,38,38,0.45)",
                      fontSize: isWin ? 18 : 14, fontWeight: 900, color: isWin ? "#4ADE80" : "#F87171",
                    }}>
                      {isWin ? "🏆" : "✕"}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: isWin ? "#4ADE80" : "#F87171", letterSpacing: 0.5 }}>{winTitle}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, fontWeight: 500 }}>{winSub}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isWin && coinsWon > 0 ? (
                      <>
                        <span style={{ fontSize: 18 }}>🪙</span>
                        <span style={{ fontSize: 17, fontWeight: 900, color: "#FFD700", textShadow: "0 0 12px rgba(255,180,0,0.6)", fontVariantNumeric: "tabular-nums" }}>+{coinsWon.toLocaleString()}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 20, color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>—</span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {spin.coinsSpent > 0 ? (
                      <>
                        <span style={{ fontSize: 17 }}>🎰</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#F87171", fontVariantNumeric: "tabular-nums" }}>−{spin.coinsSpent}</span>
                      </>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
                    )}
                  </div>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 20, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Clock style={{ width: 11, height: 11, color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: 0.3 }}>
                      {spin.usedAt ? formatTime(spin.usedAt) : "—"}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <ChevronDown style={{ width: 16, height: 16, color: "rgba(255,255,255,0.2)" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {biggestWin > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
              gap: 16, padding: "18px 28px",
              background: "linear-gradient(135deg,#1c0c00,#2a1600,#1c0c00)",
              borderTop: "2px solid rgba(255,185,0,0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 32 }}>👑</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, color: "rgba(255,185,0,0.65)", textTransform: "uppercase", marginBottom: 3 }}>Biggest Win Today</div>
                  <div style={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(180deg,#FFE566,#FF9500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>+{biggestWin.toLocaleString()}</div>
                </div>
                <div style={{ padding: "5px 14px", borderRadius: 20, background: "linear-gradient(135deg,rgba(100,60,220,0.3),rgba(60,30,160,0.3))", border: "1.5px solid rgba(120,80,255,0.5)", fontSize: 11, fontWeight: 900, color: "#A78BFA", letterSpacing: 2 }}>
                  {biggestWin >= 1000 ? "💎 JACKPOT" : biggestWin >= 100 ? "⭐ BIG WIN" : "🏆 WIN"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>You're on fire!</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Keep spinning and win big!</div>
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

  // ─── Handle spin completion from SlotGame ───
  const handleSpinComplete = useCallback((result: SlotSpinResult) => {
    console.log("[SLOT GAME] Spin complete callback received:", result);
    setSpinHistory(prev => [result.newEntry, ...prev]);

    if (result.isWin && result.coinsWon > 0) {
      setLastCoinsWon(result.coinsWon);
      setLastPrizeType(result.prizeType === "points" ? "points" : "cash");
      setLastPrizeName(result.prizeName || "");
      setShowLoseOverlay(false);
      setShowWinOverlay(true);
    } else {
      setShowLoseOverlay(true);
    }
  }, []);

  const handleNoSpinsLeft = useCallback(() => {
    console.log("[SLOT GAME] No spins left callback");
    setSpinsExhausted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(140,50,255,0.15),#060010 60%)" }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: GOLD }} />
          <p className="text-gray-400">Loading Slot Machine...</p>
        </div>
      </div>
    );
  }

  if (!order || order.status !== "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060010" }}>
        <div className="text-center p-8 rounded-2xl" style={{ background: "rgba(18,5,40,0.9)", border: "1px solid rgba(180,100,255,0.3)" }}>
          <div className="text-4xl mb-4">🎰</div>
          <h2 className="text-xl font-bold text-white mb-2">No Active Session</h2>
          <p className="text-gray-400 mb-4">Please complete your purchase first.</p>
          <Button onClick={() => navigate("/")} style={{ background: `linear-gradient(135deg,${GOLD},${AMBER})`, color: "#1a0a00", fontWeight: 900 }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const wins = spinHistory.filter(h => h.isWin);
  const totalWon = wins.reduce((s, h) => s + (h.coinsWon || 0), 0);

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: "linear-gradient(180deg,rgba(10,2,30,1) 0%,rgba(5,2,15,1) 50%,rgba(8,4,2,1) 100%)",
    }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%,rgba(140,50,255,0.12) 0%,transparent 70%)", zIndex: 0 }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 30% at 50% 30%,rgba(255,180,0,0.06) 0%,transparent 60%)", zIndex: 0 }} />

      <WinOverlay show={showWinOverlay} coinsWon={lastCoinsWon} prizeType={lastPrizeType} prizeName={lastPrizeName} onDismiss={() => setShowWinOverlay(false)} />
      <LoseOverlay show={showLoseOverlay} onDismiss={() => setShowLoseOverlay(false)} />

      <Header />

      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-5" style={{ maxWidth: 1100 }}>

          {/* Top bar */}
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "rgba(200,140,255,0.7)" }} data-testid="button-slot-back">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px" style={{ background: "rgba(180,100,255,0.25)" }} />
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 20 }}>🎰</span>
              <span className="font-black text-white tracking-wide">{competition?.title || "Slot Machine"}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black" style={{ background: "linear-gradient(135deg,rgba(50,15,100,0.9),rgba(25,8,50,0.9))", border: "1px solid rgba(200,150,255,0.35)", color: GOLD, boxShadow: "0 0 20px rgba(180,80,255,0.15)" }}>
              🏆 {totalCredits.toLocaleString()} Credits
            </div>
          </div>

          {/* ─── Game Component ─── */}
          <div className="flex justify-center mb-6">
            <div style={{ width: "100%", maxWidth: 960 }}>
              <div
                className="relative w-full rounded-2xl overflow-hidden"
                style={{
                  aspectRatio: "16/9", minHeight: 420,
                  background: "#050010",
                  border: "1.5px solid rgba(180,100,255,0.25)",
                  boxShadow: "0 0 0 1px rgba(255,180,0,0.08), 0 0 80px rgba(140,50,255,0.15), 0 30px 100px rgba(0,0,0,0.8)",
                }}
              >
                {/* Use the SlotGame component directly */}
                {orderId && (
                  <SlotGameComponent
                    orderId={orderId}
                    creditsPerSpin={creditsPerSpin}
                    onSpinComplete={handleSpinComplete}
                    onNoSpinsLeft={handleNoSpinsLeft}
                  />
                )}

                {/* Transparent blocker — prevents interacting with game while a popup is open */}
                {(showWinOverlay || showLoseOverlay) && (
                  <div className="absolute inset-0" style={{ zIndex: 10, pointerEvents: "all", cursor: "default" }} />
                )}

                {/* Spins exhausted — covers game with summary + back button */}
                {spinsExhausted && (
                  <SpinsExhaustedOverlay
                    totalSpins={order?.quantity || spinHistory.length}
                    wins={spinHistory.filter(h => h.isWin).length}
                    totalWon={spinHistory.reduce((s, h) => s + (h.isWin ? (h.coinsWon || 0) : 0), 0)}
                    onBack={() => navigate("/")}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ─── Stat Cards ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" style={{ maxWidth: 960, margin: "0 auto 24px" }}>
            <StatCard label="Spins Purchased" value={order.quantity} icon="🎰" />
            <StatCard label="Total Credits"   value={totalCredits.toLocaleString()} icon="💳" />
            <StatCard label="Credits / Spin"  value={creditsPerSpin} icon="⚡" />
            <StatCard label="Credits Won" value={totalWon > 0 ? `+${totalWon}` : "0"} icon="🏆" accent={totalWon > 0} />
          </div>

          {/* ─── History Table ─── */}
          <SpinHistoryTable history={spinHistory} />
        </div>
      </main>

      <Footer />
    </div>
  );
}