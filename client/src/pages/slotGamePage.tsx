import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, ChevronDown } from "lucide-react";

const GOLD = "#FFD700";
const AMBER = "#FF8C00";
const GOLD2 = "#FFC300";

// ─── Confetti ──────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#FFD700","#FF6B35","#E63946","#06D6A0","#9B59B6","#FF3FA4","#FFE066","#2ECC71","#3498DB","#E74C3C","#F39C12","#1ABC9C"];

function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(() =>
    Array.from({ length: 110 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.8,
      duration: 2.8 + Math.random() * 2.4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 7 + Math.random() * 11,
      isCircle: Math.random() > 0.4,
    }))
  , []);
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

// ─── Win Overlay ───────────────────────────────────────────────────────────
function WinOverlay({ show, coinsWon, onDismiss }: { show: boolean; coinsWon: number; onDismiss: () => void }) {
  return (
    <>
      <Confetti active={show} />
      <div onClick={onDismiss} style={{
        position: "fixed", inset: 0, zIndex: 55, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.55)", backdropFilter: show ? "blur(4px)" : "none",
        opacity: show ? 1 : 0,
        transform: show ? "scale(1)" : "scale(0.92)",
        transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease",
        pointerEvents: show ? "all" : "none",
      }}>
        <div style={{
          position: "relative", padding: "42px 52px", borderRadius: 32, textAlign: "center", overflow: "hidden",
          background: "linear-gradient(145deg,rgba(12,4,30,0.98),rgba(20,6,45,0.98))",
          border: "1.5px solid rgba(255,200,0,0.4)",
          boxShadow: "0 0 0 1px rgba(255,200,0,0.15), 0 0 80px rgba(255,160,0,0.25), 0 0 160px rgba(140,40,255,0.15), 0 40px 120px rgba(0,0,0,0.9)",
          maxWidth: 420,
        }}>
          <div style={{ position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)", width: 200, height: 80, background: "rgba(255,200,0,0.15)", filter: "blur(30px)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: 300, height: 60, background: "rgba(120,40,255,0.1)", filter: "blur(25px)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ fontSize: 56, marginBottom: 10, animation: "winPop 0.6s ease-out" }}>🏆</div>
          <div style={{
            fontSize: 38, fontWeight: 900, marginBottom: 6, letterSpacing: 2,
            background: "linear-gradient(180deg,#FFE566 0%,#FFD700 40%,#FF9500 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "winPop 0.5s 0.1s ease-out both",
          }}>YOU WON!</div>
          <div style={{
            fontSize: 52, fontWeight: 900, letterSpacing: 1, marginBottom: 18,
            background: "linear-gradient(180deg,#FFFFFF 0%,#FFE566 60%,#FF9500 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 20px rgba(255,200,0,0.5))",
            animation: "winPop 0.5s 0.2s ease-out both",
          }}>+{coinsWon.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "rgba(220,180,255,0.6)", letterSpacing: 1 }}>Credits added to your balance</div>
          <div style={{ marginTop: 22, fontSize: 11, color: "rgba(200,150,255,0.4)" }}>Tap anywhere to continue</div>
        </div>
      </div>
    </>
  );
}

// ─── Lose Overlay ──────────────────────────────────────────────────────────
function LoseOverlay({ show }: { show: boolean }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 55,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: show ? 1 : 0,
      transform: show ? "scale(1)" : "scale(0.88)",
      transition: "opacity 0.3s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      pointerEvents: "none",
      background: show ? "rgba(0,0,0,0.45)" : "transparent",
      backdropFilter: show ? "blur(3px)" : "none",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 20, padding: "28px 40px", borderRadius: 24,
        background: "linear-gradient(135deg,rgba(20,0,10,0.97),rgba(40,5,15,0.97))",
        border: "1.5px solid rgba(220,50,50,0.55)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 8px 60px rgba(200,0,50,0.3), 0 0 100px rgba(0,0,0,0.9)",
        backdropFilter: "blur(16px)", minWidth: 320, maxWidth: 460,
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg,#7f1d1d,#450a0a)",
          border: "2px solid rgba(239,68,68,0.6)",
          boxShadow: "0 0 24px rgba(220,38,38,0.4)",
          fontSize: 28, flexShrink: 0,
        }}>🎰</div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#fff", marginBottom: 5 }}>No Match This Time!</div>
          <div style={{ fontSize: 13, color: "rgba(255,130,130,0.85)", fontWeight: 500 }}>Keep spinning — your jackpot is coming!</div>
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

      {/* ══ TOP HEADER BAR ══ */}
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

        {/* Stat pills */}
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

      {/* ══ LARGE STAT CARDS ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, padding: "20px 28px" }}>
        {/* Total Spins */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 22px", borderRadius: 18, background: "linear-gradient(135deg,#1e0d50,#140835)", border: "1.5px solid rgba(120,80,220,0.4)", boxShadow: "0 0 30px rgba(100,60,220,0.12)" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#3d1a80,#2a0d60)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, border: "1px solid rgba(160,100,255,0.3)", boxShadow: "0 0 20px rgba(120,60,255,0.3)" }}>🎰</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2.5, color: "rgba(160,120,255,0.7)", textTransform: "uppercase", marginBottom: 4 }}>Total Spins</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{history.length}</div>
          </div>
        </div>
        {/* Total Wins */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 22px", borderRadius: 18, background: wins.length > 0 ? "linear-gradient(135deg,#0a2e18,#061a0e)" : "linear-gradient(135deg,#111,#0a0a0a)", border: `1.5px solid ${wins.length > 0 ? "rgba(34,197,94,0.45)" : "rgba(255,255,255,0.08)"}`, boxShadow: wins.length > 0 ? "0 0 30px rgba(34,197,94,0.1)" : "none" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: wins.length > 0 ? "linear-gradient(135deg,#166534,#0d4023)" : "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, border: `1px solid ${wins.length > 0 ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`, boxShadow: wins.length > 0 ? "0 0 20px rgba(34,197,94,0.3)" : "none" }}>🏆</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2.5, color: wins.length > 0 ? "rgba(74,222,128,0.7)" : "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Total Wins</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: wins.length > 0 ? "#4ADE80" : "rgba(255,255,255,0.2)", lineHeight: 1 }}>{wins.length}</div>
          </div>
        </div>
        {/* Credits Won */}
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

      {/* ══ EMPTY STATE ══ */}
      {history.length === 0 ? (
        <div style={{ padding: "60px 32px", textAlign: "center", borderTop: "1px solid rgba(100,70,200,0.15)" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎰</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(180,140,255,0.6)" }}>No spins yet — start playing!</div>
          <div style={{ fontSize: 13, marginTop: 8, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>Your spin history will appear here in real-time</div>
        </div>
      ) : (
        <>
          {/* ══ COLUMN HEADERS ══ */}
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

          {/* ══ DATA ROWS ══ */}
          <div style={{ maxHeight: 460, overflowY: "auto" }}>
            {history.map((spin, i) => {
              const num = history.length - i;
              const isWin = spin.isWin;
              const coinsWon = spin.coinsWon || 0;
              const { title: winTitle, sub: winSub } = isWin ? getWinLabel(coinsWon) : { title: "NO MATCH", sub: "Try Again!" };
              return (
                <div
                  key={spin.id || i}
                  data-testid={`row-spin-${num}`}
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
                  {/* # */}
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#FFB830" }}>#{num}</div>

                  {/* Result icon + title + subtitle */}
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

                  {/* Credits Won */}
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

                  {/* Credits Spent */}
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

                  {/* Time */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 20, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Clock style={{ width: 11, height: 11, color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: 0.3 }}>
                      {spin.usedAt ? formatTime(spin.usedAt) : "—"}
                    </span>
                  </div>

                  {/* Chevron */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <ChevronDown style={{ width: 16, height: 16, color: "rgba(255,255,255,0.2)" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ══ BIGGEST WIN BANNER ══ */}
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
  const queryClient = useQueryClient();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const spinCountRef = useRef(0);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [iframeReady, setIframeReady] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showLoseOverlay, setShowLoseOverlay] = useState(false);
  const [lastCoinsWon, setLastCoinsWon] = useState(0);
  const loseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      spinCountRef.current = orderData.history.length;
    }
  }, [orderData?.history]);


  const recordSpin = useCallback(async (isWin: boolean, coinsWon: number) => {
    if (!orderId || order?.status !== "completed") return;
    spinCountRef.current += 1;
    const spinNumber = spinCountRef.current;
    const coinsSpent = creditsPerSpin;
    try {
      await apiRequest("/api/record-slot-spin", "POST", { orderId, isWin, coinsWon, coinsSpent, spinNumber });
      const newEntry = { id: `local-${spinNumber}`, isWin, coinsWon, coinsSpent, spinNumber, usedAt: new Date().toISOString() };
      setSpinHistory(prev => [newEntry, ...prev]);
      if (isWin && coinsWon > 0) queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    } catch (err) { console.error("Failed to record spin:", err); }
  }, [orderId, order?.status, creditsPerSpin, queryClient]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "slotSpinResult") {
        const { isWin, coinsWon } = event.data;
        recordSpin(isWin, coinsWon || 0);
        if (isWin && (coinsWon || 0) > 0) {
          setLastCoinsWon(coinsWon || 0);
          setShowLoseOverlay(false);
          setShowWinOverlay(true);
        } else if (!isWin) {
          setShowWinOverlay(false);
          setShowLoseOverlay(true);
          if (loseTimerRef.current) clearTimeout(loseTimerRef.current);
          loseTimerRef.current = setTimeout(() => setShowLoseOverlay(false), 3000);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
      if (loseTimerRef.current) clearTimeout(loseTimerRef.current);
    };
  }, [recordSpin]);

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

      <WinOverlay show={showWinOverlay} coinsWon={lastCoinsWon} onDismiss={() => setShowWinOverlay(false)} />
      <LoseOverlay show={showLoseOverlay} />

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

          {/* ─── Game Frame ─── */}
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
                {!iframeReady && (
                  <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "#050010" }}>
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: GOLD }} />
                      <p className="text-sm" style={{ color: "rgba(200,140,255,0.6)" }}>Loading game...</p>
                    </div>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={`/slotmachine/index.html?credits=${totalCredits}&orderId=${orderId}`}
                  className="w-full h-full"
                  style={{ border: "none", display: "block" }}
                  title="Slot Machine"
                  allow="autoplay"
                  onLoad={() => setIframeReady(true)}
                  data-testid="iframe-slot-game"
                />
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