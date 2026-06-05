import { useLocation } from "wouter";
import { Competition } from "@shared/schema";
import { Sparkles, Zap, Target, Trophy, RotateCw, Users, CheckCircle, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

interface CompetitionCardProps {
  competition: Competition;
  authenticated?: boolean;
}

function useCountdown(endDate: Date | null) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const diff = Math.max(0, endDate.getTime() - Date.now());
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return time;
}

export default function CompetitionCard({ competition, authenticated = false }: CompetitionCardProps) {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);

  const { data: plinkoConfig } = useQuery({
    queryKey: ["/api/plinko-config"],
    queryFn: async () => (await apiRequest("/api/plinko-config", "GET")).json(),
  });
  const { data: voltzConfig } = useQuery({
    queryKey: ["/api/voltz-config"],
    queryFn: async () => (await apiRequest("/api/voltz-config", "GET")).json(),
  });
  const { data: spinConfig } = useQuery({
    queryKey: ["/api/admin/game-spin-2-config"],
    queryFn: async () => (await apiRequest("/api/admin/game-spin-2-config", "GET")).json(),
  });

  if (competition.type === "plinko" && plinkoConfig?.isVisible === false) return null;
  if (competition.wheelType === "wheel2" && spinConfig?.isVisible === false) return null;
  if (competition.type === "voltz" && voltzConfig?.isVisible === false) return null;
  const HIDDEN_IDS = ["d54eee36-2280-4372-84f6-93d07343a970", "25f0ee99-6f54-435d-9605-f4c287fe1338"];
  if (HIDDEN_IDS.includes(competition.id)) return null;

  // ── Derived values ──
  const maxT = competition.maxTickets ?? 0;
  const soldT = competition.soldTickets ?? 0;
  const pct = maxT > 0 ? Math.min(100, (soldT / maxT) * 100) : 0;
  const hasTickets = maxT > 0;
  const remaining = maxT - soldT;
  const isFree = competition.ticketPrice === "0.00";
  const isAlmostGone = pct > 85;
  const isHot = pct > 60;
  const isNew = pct < 12;

  // ── Type config ──
  type TypeCfg = {
    Icon: typeof RotateCw;
    label: string;
    accent: string;
    rgb: string;
    bar: string;
    chips: [string, string, string];
    tagEmoji: string;
    badge: string;
  };

  const tc: TypeCfg = (() => {
    switch (competition.type) {
      case "spin":    return { Icon: RotateCw,  label: "RETRO SPIN",      accent: "#FFB800", rgb: "255,184,0",   bar: "linear-gradient(90deg,#FF6B00,#FFB800,#FFE066)", chips: ["INSTANT WIN", "CASH PRIZES", "AUTO DRAW"],  tagEmoji: "⚡", badge: isAlmostGone ? "SELLING FAST" : isHot ? "HOT" : isNew ? "NEW" : "LIVE" };
      case "scratch": return { Icon: Sparkles,  label: "SCRATCH & WIN",   accent: "#00E676", rgb: "0,230,118",   bar: "linear-gradient(90deg,#00897B,#00E676,#69F0AE)", chips: ["INSTANT WIN", "CASH PRIZES", "EASY TO PLAY"], tagEmoji: "🍀", badge: isAlmostGone ? "SELLING FAST" : isHot ? "HOT" : isNew ? "NEW" : "LIVE" };
      case "pop":     return { Icon: Gift,      label: "BALLOON POP",     accent: "#FF4444", rgb: "255,68,68",   bar: "linear-gradient(90deg,#C62828,#FF4444,#FF8A65)", chips: ["INSTANT WIN", "CASH PRIZES", "LIVE DRAW"],   tagEmoji: "🎁", badge: isAlmostGone ? "SELLING FAST" : isHot ? "HOT" : isNew ? "NEW" : "LIVE" };
      case "plinko":  return { Icon: Target,    label: "PLINKO DROP",     accent: "#B044FF", rgb: "176,68,255",  bar: "linear-gradient(90deg,#6A1B9A,#B044FF,#CE93D8)", chips: ["INSTANT WIN", "FAIR SYSTEM", "LIVE RESULTS"], tagEmoji: "🎯", badge: isAlmostGone ? "SELLING FAST" : isHot ? "HOT" : isNew ? "TRENDING" : "LIVE" };
      case "voltz":   return { Icon: Zap,       label: "RINGTONE VOLTZ",  accent: "#00CFFF", rgb: "0,207,255",   bar: "linear-gradient(90deg,#0052D4,#00CFFF,#65EFFF)", chips: ["INSTANT WIN", "CASH PRIZES", "AUTO DRAW"],  tagEmoji: "⚡", badge: isAlmostGone ? "SELLING FAST" : isHot ? "HOT" : isNew ? "NEW" : "LIVE" };
      default:        return { Icon: Trophy,    label: "PRIZE DRAW",      accent: "#FFD700", rgb: "255,215,0",   bar: "linear-gradient(90deg,#B8860B,#FFD700,#FFF176)", chips: ["INSTANT WIN", "CASH PRIZES", "LIVE DRAW"],  tagEmoji: "🏆", badge: isAlmostGone ? "SELLING FAST" : isHot ? "HOT" : isNew ? "NEW" : "LIVE" };
    }
  })();

  // ── Badge color ──
  const badgeStyle = (() => {
    const b = tc.badge;
    if (b === "SELLING FAST") return { bg: "#C62828", shadow: "rgba(198,40,40,0.8)" };
    if (b === "HOT")          return { bg: "linear-gradient(135deg,#FF6B00,#FFB800)", shadow: "rgba(255,107,0,0.75)" };
    if (b === "NEW")          return { bg: "linear-gradient(135deg,#00897B,#00E676)", shadow: "rgba(0,230,118,0.7)" };
    if (b === "TRENDING")     return { bg: "linear-gradient(135deg,#6A1B9A,#B044FF)", shadow: "rgba(176,68,255,0.7)" };
    return                           { bg: "linear-gradient(135deg,#00897B,#00C853)", shadow: "rgba(0,200,83,0.65)" };
  })();

  // ── Prize ──
  const prizeNum = competition.prizeAmount
    ? parseFloat(competition.prizeAmount)
    : (() => { const m = competition.title.match(/£([\d,]+)/); return m ? parseFloat(m[1].replace(/,/g, "")) : null; })();
  const prizeDisplay = prizeNum ? (prizeNum >= 1000 ? `£${prizeNum.toLocaleString("en-GB")}` : `£${prizeNum.toFixed(0)}`) : null;
  const prizeStr = prizeNum ? (prizeNum >= 1000 ? `£${(prizeNum / 1000).toFixed(prizeNum % 1000 === 0 ? 0 : 1)}K` : `£${prizeNum.toFixed(0)}`) : null;

  const endDate = (competition as any).endDate ? new Date((competition as any).endDate) : null;
  const cd = useCountdown(endDate);

  const uid = competition.id.slice(0, 8);

  return (
    <div
      className="group cursor-pointer"
      data-testid={`card-competition-${competition.id}`}
      onClick={() => setLocation(`/competition/${competition.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ perspective: "900px" }}
    >
      {/* ── Outer neon shell ── */}
      <div style={{
        borderRadius: 20,
        padding: 2,
        background: hovered
          ? `linear-gradient(145deg, rgba(${tc.rgb},0.9) 0%, rgba(${tc.rgb},0.25) 50%, rgba(${tc.rgb},0.9) 100%)`
          : `linear-gradient(145deg, rgba(${tc.rgb},0.55) 0%, rgba(${tc.rgb},0.08) 50%, rgba(${tc.rgb},0.55) 100%)`,
        boxShadow: hovered
          ? `0 0 0 1px rgba(${tc.rgb},0.3), 0 0 40px -4px rgba(${tc.rgb},0.7), 0 28px 60px -12px rgba(0,0,0,0.98), inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 0 0 1px rgba(${tc.rgb},0.12), 0 0 24px -6px rgba(${tc.rgb},0.35), 0 8px 28px -8px rgba(0,0,0,0.9)`,
        transform: hovered ? "translateY(-7px) scale(1.025)" : "translateY(0) scale(1)",
        transition: "transform 0.4s cubic-bezier(.22,1,.36,1), box-shadow 0.4s ease, background 0.4s ease",
      }}>
        {/* ── Inner card ── */}
        <div style={{
          borderRadius: 18,
          background: "linear-gradient(175deg, #0c0c18 0%, #050508 40%, #030306 100%)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>

          {/* ══ HEADER ══ */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 11px",
            background: `linear-gradient(90deg, rgba(${tc.rgb},0.14) 0%, rgba(0,0,0,0) 100%)`,
            borderBottom: `1px solid rgba(${tc.rgb},0.18)`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: `rgba(${tc.rgb},0.12)`,
                border: `1px solid rgba(${tc.rgb},0.4)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 10px rgba(${tc.rgb},0.3)`,
              }}>
                <tc.Icon style={{ width: 13, height: 13, color: tc.accent }} strokeWidth={2.5} />
              </div>
              <span style={{
                fontSize: 9.5, fontWeight: 900, letterSpacing: "0.16em",
                textTransform: "uppercase", color: tc.accent,
                textShadow: `0 0 16px rgba(${tc.rgb},0.9), 0 0 32px rgba(${tc.rgb},0.4)`,
              }}>{tc.label}</span>
            </div>
            <div style={{
              padding: "3px 9px", borderRadius: 20,
              background: badgeStyle.bg,
              boxShadow: `0 2px 14px ${badgeStyle.shadow}`,
              fontSize: 7.5, fontWeight: 900, letterSpacing: "0.18em", color: "#fff",
              textTransform: "uppercase", whiteSpace: "nowrap",
            }}>{tc.badge}</div>
          </div>

          {/* ══ HERO IMAGE ══ */}
          <div style={{ position: "relative", aspectRatio: "16 / 10", overflow: "hidden", flexShrink: 0 }}>
            <img
              src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
              alt={competition.title}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"; }}
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                transform: hovered ? "scale(1.07)" : "scale(1)",
                transition: "transform 0.7s cubic-bezier(.22,1,.36,1)",
                filter: "brightness(0.92) saturate(1.15)",
              }}
            />
            {/* Bottom fade */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, transparent 25%, rgba(3,3,6,0.6) 70%, rgba(3,3,6,0.99) 100%)",
            }} />
            {/* Top neon stripe */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent 0%, rgba(${tc.rgb},1) 30%, rgba(${tc.rgb},1) 70%, transparent 100%)`,
              boxShadow: `0 0 18px rgba(${tc.rgb},0.9)`,
            }} />
            {/* Left neon edge */}
            <div style={{
              position: "absolute", top: 0, bottom: 0, left: 0, width: 2,
              background: `linear-gradient(180deg, rgba(${tc.rgb},0.9) 0%, transparent 100%)`,
            }} />
            {/* Hover shimmer */}
            {hovered && (
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)",
                animation: `shimmer-${uid} 1.6s ease-in-out infinite`,
              }} />
            )}
          </div>

          {/* ══ PRIZE BLOCK ══ */}
          <div style={{
            textAlign: "center", padding: "11px 14px 8px",
            background: "linear-gradient(180deg, rgba(3,3,6,0.98) 0%, rgba(6,4,12,0.99) 100%)",
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: 7.5, fontWeight: 800, letterSpacing: "0.32em",
              color: "rgba(255,255,255,0.38)", textTransform: "uppercase", marginBottom: 3,
            }}>TOP PRIZE</div>
            <div style={{
              fontSize: "clamp(24px, 5.5vw, 34px)", fontWeight: 900, lineHeight: 1,
              color: "#ffffff",
              textShadow: prizeDisplay ? `0 0 24px rgba(${tc.rgb},1), 0 0 60px rgba(${tc.rgb},0.5), 0 0 1px #fff` : "none",
              marginBottom: 2,
              letterSpacing: "-0.01em",
            }}>
              {prizeDisplay || competition.title.split(" ").slice(0, 3).join(" ")}
            </div>
            {prizeDisplay && (
              <div style={{
                fontSize: 8, fontWeight: 900, letterSpacing: "0.35em",
                color: tc.accent, textTransform: "uppercase",
                textShadow: `0 0 10px rgba(${tc.rgb},0.7)`,
                marginBottom: 6,
              }}>CASH</div>
            )}
            {/* Tagline */}
            <div style={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: "0.04em",
              color: tc.accent,
              textShadow: `0 0 20px rgba(${tc.rgb},0.8)`,
              lineHeight: 1.35,
            }}>
              {tc.tagEmoji} WIN UP TO {prizeStr || "BIG PRIZES"} CASH INSTANTLY! {tc.tagEmoji}
            </div>
          </div>

          {/* ══ FEATURE CHIPS ══ */}
          <div style={{
            display: "flex", gap: 3, padding: "7px 10px",
            borderTop: `1px solid rgba(${tc.rgb},0.12)`,
            borderBottom: `1px solid rgba(${tc.rgb},0.12)`,
            background: "rgba(0,0,0,0.55)",
            flexShrink: 0,
          }}>
            {tc.chips.map((chip, i) => (
              <div key={i} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5,
                padding: "5px 2px", borderRadius: 7,
                background: `rgba(${tc.rgb},0.07)`,
                border: `1px solid rgba(${tc.rgb},0.22)`,
              }}>
                <CheckCircle style={{ width: 9, height: 9, color: tc.accent, flexShrink: 0 }} />
                <span style={{
                  fontSize: 6, fontWeight: 900, textTransform: "uppercase",
                  letterSpacing: "0.07em", color: "rgba(255,255,255,0.78)", textAlign: "center",
                  lineHeight: 1.15,
                }}>{chip}</span>
              </div>
            ))}
          </div>

          {/* ══ ENTRY + ENTRIES LEFT ══ */}
          {hasTickets && (
            <div style={{
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              padding: "8px 12px 4px",
              background: "rgba(0,0,0,0.4)",
              flexShrink: 0,
            }}>
              <div>
                <div style={{
                  fontSize: 6.5, fontWeight: 800, color: "rgba(255,255,255,0.32)",
                  textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 2,
                }}>ENTRY</div>
                <div style={{
                  fontSize: 15, fontWeight: 900, lineHeight: 1,
                  color: tc.accent,
                  textShadow: `0 0 18px rgba(${tc.rgb},0.8)`,
                }}>
                  {isFree ? "FREE" : `£${parseFloat(competition.ticketPrice).toFixed(2)}`}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: 6.5, fontWeight: 800, color: "rgba(255,255,255,0.32)",
                  textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 2,
                }}>ENTRIES LEFT</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                    {remaining.toLocaleString()}
                  </span>
                  <Users style={{ width: 11, height: 11, color: "rgba(255,255,255,0.4)" }} />
                </div>
              </div>
            </div>
          )}

          {/* ══ PROGRESS BAR ══ */}
          {hasTickets && (
            <div style={{ padding: "5px 12px 8px", flexShrink: 0, background: "rgba(0,0,0,0.4)" }}>
              {/* Track */}
              <div style={{
                height: 8, borderRadius: 6,
                background: "rgba(255,255,255,0.07)",
                overflow: "hidden", position: "relative",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: tc.bar,
                  borderRadius: 6,
                  boxShadow: `0 0 12px rgba(${tc.rgb},0.9), 0 0 24px rgba(${tc.rgb},0.4)`,
                  transition: "width 0.6s cubic-bezier(.22,1,.36,1)",
                }}>
                  {/* Shimmer inside bar */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
                    animation: `bar-shimmer-${uid} 2s ease-in-out infinite`,
                  }} />
                </div>
              </div>
              <div style={{
                display: "flex", justifyContent: "flex-end",
                marginTop: 3,
              }}>
                <span style={{
                  fontSize: 7.5, fontWeight: 900, color: tc.accent,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  textShadow: `0 0 10px rgba(${tc.rgb},0.6)`,
                }}>{Math.round(pct)}% FILLED</span>
              </div>
            </div>
          )}

          {/* ══ FOOTER: COUNTDOWN + ENTER NOW ══ */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 10px 10px",
            background: `linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(${tc.rgb},0.06) 100%)`,
            borderTop: `1px solid rgba(${tc.rgb},0.14)`,
            marginTop: "auto",
            flexShrink: 0,
            gap: 8,
          }}>
            {/* Countdown */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                fontSize: 6, fontWeight: 800, color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 4,
              }}>ENDS IN</div>
              {endDate ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                  {[
                    { v: cd.d, l: "DAYS" },
                    { v: cd.h, l: "HRS" },
                    { v: cd.m, l: "MINS" },
                    { v: cd.s, l: "SECS" },
                  ].map((u, i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{
                        fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1,
                        minWidth: 20, fontVariantNumeric: "tabular-nums",
                        textShadow: "0 0 8px rgba(255,255,255,0.3)",
                      }}>
                        {String(u.v).padStart(2, "0")}
                      </div>
                      <div style={{
                        fontSize: 5.5, fontWeight: 700, color: "rgba(255,255,255,0.28)",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>{u.l}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Draw ongoing</div>
              )}
            </div>

            {/* ENTER NOW */}
            <button
              data-testid={`button-view-competition-${competition.id}`}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                background: tc.bar,
                color: "#fff",
                fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase",
                boxShadow: hovered
                  ? `0 0 30px rgba(${tc.rgb},0.85), 0 6px 20px rgba(${tc.rgb},0.5), inset 0 1px 0 rgba(255,255,255,0.2)`
                  : `0 0 18px rgba(${tc.rgb},0.5), 0 4px 14px rgba(${tc.rgb},0.3), inset 0 1px 0 rgba(255,255,255,0.12)`,
                transition: "all 0.3s ease",
                position: "relative", overflow: "hidden",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.18) 50%, transparent 75%)",
                animation: `btn-shimmer-${uid} 2.4s ease-in-out infinite`,
              }} />
              <span style={{ position: "relative" }}>ENTER NOW</span>
              <span style={{
                position: "relative", fontSize: 13, fontWeight: 900,
                transform: hovered ? "translateX(3px)" : "none",
                transition: "transform 0.3s",
              }}>→</span>
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes shimmer-${uid} {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes bar-shimmer-${uid} {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes btn-shimmer-${uid} {
          0%, 100% { transform: translateX(-120%); }
          50%       { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
}