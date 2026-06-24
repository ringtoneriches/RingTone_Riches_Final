import { useLocation } from "wouter";
import { Competition } from "@shared/schema";
import { Sparkles, Zap, Target, Trophy, RotateCw, Users, CheckCircle, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import pop from "../../public/pop.jpeg"
import voltz from "../../public/voltz.jpeg"
import scratch from "../../public/scratch.jpeg"

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
  const isSoldOut = remaining <= 0 && maxT > 0;
  
  // ── Check if competition has expired ──
  const endDate = (competition as any).endDate ? new Date((competition as any).endDate) : null;
  const isExpired = endDate ? endDate.getTime() < Date.now() : false;
  const isClosed = isSoldOut || isExpired;

  const isFree = competition.ticketPrice === "0.00";
  const isAlmostGone = pct > 85 && !isClosed;
  const isHot = pct > 60 && !isClosed;
  const isNew = pct < 12 && !isClosed;

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
    if (isExpired) return { bg: "#555555", shadow: "rgba(85,85,85,0.8)" };
    if (isSoldOut) return { bg: "#666666", shadow: "rgba(100,100,100,0.8)" };
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

  const cd = useCountdown(endDate);

  // ── Get status message ──
  const getStatusMessage = () => {
    if (isExpired) return { 
      overlay: "EXPIRED", 
      overlaySub: "This competition has ended",
      badge: "EXPIRED",
      button: "EXPIRED",
      color: "#888888"
    };
    if (isSoldOut) return { 
      overlay: "SOLD OUT", 
      overlaySub: "No tickets remaining",
      badge: "SOLD OUT",
      button: "SOLD OUT",
      color: "#ff4444"
    };
    return {
      overlay: null,
      overlaySub: null,
      badge: tc.badge,
      button: "ENTER NOW",
      color: tc.accent
    };
  };

  const status = getStatusMessage();
  // const isClosed = isExpired || isSoldOut;

  return (
    <div
      className="group cursor-pointer"
      data-testid={`card-competition-${competition.id}`}
      onClick={() => {
        if (!isClosed) {
          setLocation(`/competition/${competition.id}`);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        perspective: "900px", 
        height: "100%",
        opacity: isClosed ? 0.6 : 1,
        cursor: isClosed ? "not-allowed" : "pointer",
        pointerEvents: isClosed ? "none" : "auto",
      }}
    >
      {/* ── Outer neon shell ── */}
      <div style={{
        borderRadius: "clamp(14px, 3vw, 20px)",
        padding: 2,
        height: "100%",
        background: isClosed 
          ? "linear-gradient(145deg, rgba(100,100,100,0.3) 0%, rgba(100,100,100,0.05) 50%, rgba(100,100,100,0.3) 100%)"
          : hovered
            ? `linear-gradient(145deg, rgba(${tc.rgb},0.9) 0%, rgba(${tc.rgb},0.25) 50%, rgba(${tc.rgb},0.9) 100%)`
            : `linear-gradient(145deg, rgba(${tc.rgb},0.55) 0%, rgba(${tc.rgb},0.08) 50%, rgba(${tc.rgb},0.55) 100%)`,
        boxShadow: isClosed
          ? `0 0 0 1px rgba(100,100,100,0.15), 0 0 20px -6px rgba(0,0,0,0.9)`
          : hovered
            ? `0 0 0 1px rgba(${tc.rgb},0.3), 0 0 40px -4px rgba(${tc.rgb},0.7), 0 28px 60px -12px rgba(0,0,0,0.98)`
            : `0 0 0 1px rgba(${tc.rgb},0.12), 0 0 24px -6px rgba(${tc.rgb},0.35), 0 8px 28px -8px rgba(0,0,0,0.9)`,
        transform: hovered && !isClosed ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        filter: isClosed ? "grayscale(0.5) brightness(0.5)" : "none",
      }}>
        {/* ── Inner card ── */}
        <div style={{
          borderRadius: "clamp(12px, 2.5vw, 18px)",
          background: "linear-gradient(175deg, #0c0c18 0%, #050508 40%, #030306 100%)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
        }}>
          
          {/* ── CLOSED OVERLAY (SOLD OUT or EXPIRED) ── */}
          {isClosed && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              backdropFilter: "blur(2px)",
            }}>
              <div style={{
                background: "rgba(0,0,0,0.9)",
                padding: "clamp(10px, 3vw, 20px) clamp(14px, 4vw, 30px)",
                borderRadius: "clamp(8px, 2vw, 14px)",
                border: `2px solid ${isExpired ? 'rgba(136,136,136,0.3)' : 'rgba(255,68,68,0.3)'}`,
                textAlign: "center",
                transform: "rotate(-8deg)",
                boxShadow: "0 0 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.05)",
              }}>
                <div style={{
                  fontSize: "clamp(18px, 5vw, 40px)",
                  fontWeight: 900,
                  color: isExpired ? "#888888" : "#ff4444",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  textShadow: isExpired ? "none" : "0 0 30px rgba(255,68,68,0.5)",
                  lineHeight: 1,
                }}>
                  {status.overlay}
                </div>
                <div style={{
                  fontSize: "clamp(6px, 1.5vw, 10px)",
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  marginTop: "clamp(2px, 0.5vw, 6px)",
                  textTransform: "uppercase",
                }}>
                  {status.overlaySub}
                </div>
              </div>
            </div>
          )}

          {/* ══ HEADER - Compact on mobile ══ */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "clamp(5px, 1.5vw, 9px) clamp(7px, 2vw, 11px)",
            background: isClosed 
              ? "linear-gradient(90deg, rgba(100,100,100,0.14) 0%, rgba(0,0,0,0) 100%)"
              : `linear-gradient(90deg, rgba(${tc.rgb},0.14) 0%, rgba(0,0,0,0) 100%)`,
            borderBottom: `1px solid rgba(${isClosed ? '100,100,100' : tc.rgb},0.18)`,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "clamp(4px, 1vw, 6px)" }}>
              <div style={{
                width: "clamp(20px, 4vw, 26px)", 
                height: "clamp(20px, 4vw, 26px)", 
                borderRadius: "clamp(6px, 1.5vw, 8px)",
                background: isClosed ? `rgba(100,100,100,0.12)` : `rgba(${tc.rgb},0.12)`,
                border: `1px solid ${isClosed ? 'rgba(100,100,100,0.4)' : `rgba(${tc.rgb},0.4)`}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isClosed ? "none" : `0 0 10px rgba(${tc.rgb},0.3)`,
              }}>
                <tc.Icon style={{ 
                  width: "clamp(10px, 2vw, 13px)", 
                  height: "clamp(10px, 2vw, 13px)", 
                  color: isClosed ? "#666666" : tc.accent 
                }} strokeWidth={2.5} />
              </div>
              <span style={{
                fontSize: "clamp(7px, 1.5vw, 9.5px)", 
                fontWeight: 900, 
                letterSpacing: "0.12em",
                textTransform: "uppercase", 
                color: isClosed ? "#666666" : tc.accent,
              }}>{tc.label}</span>
            </div>
            <div style={{
              padding: "clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 9px)", 
              borderRadius: 20,
              background: isClosed ? "#555555" : badgeStyle.bg,
              boxShadow: isClosed ? "none" : `0 2px 14px ${badgeStyle.shadow}`,
              fontSize: "clamp(6px, 1.2vw, 7.5px)", 
              fontWeight: 900, 
              letterSpacing: "0.12em", 
              color: "#fff",
              textTransform: "uppercase", 
              whiteSpace: "nowrap",
            }}>
              {status.badge}
            </div>
          </div>

          {/* ══ HERO IMAGE - Keep aspect ratio but responsive ══ */}
          <div style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", flexShrink: 0 }}>
             <img
    src={
      competition.imageUrl || 
      (competition.type === "pop" ? pop : 
       competition.type === "voltz" ? voltz : 
       competition.type === "scratch" ? scratch : 
       "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600")
    }
              alt={competition.title}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"; }}
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                transform: hovered && !isClosed ? "scale(1.05)" : "scale(1)",
                transition: "transform 0.5s ease",
                filter: isClosed ? "brightness(0.6) saturate(0.3)" : "brightness(0.92) saturate(1.15)",
              }}
            />
            {/* Bottom fade */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
              background: "linear-gradient(0deg, rgba(3,3,6,0.95) 0%, transparent 100%)",
            }} />
            {/* Top neon stripe */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "clamp(1px, 0.3vw, 2px)",
              background: isClosed 
                ? "linear-gradient(90deg, transparent 0%, #666666 30%, #666666 70%, transparent 100%)"
                : `linear-gradient(90deg, transparent 0%, rgba(${tc.rgb},1) 30%, rgba(${tc.rgb},1) 70%, transparent 100%)`,
              boxShadow: isClosed ? "none" : `0 0 18px rgba(${tc.rgb},0.9)`,
            }} />
          </div>

          {/* ══ PRIZE BLOCK - Flex grow to push footer down ══ */}
          <div style={{
            textAlign: "center", 
            padding: "clamp(6px, 1.5vw, 11px) clamp(8px, 2vw, 14px) clamp(4px, 1vw, 8px)",
            background: "linear-gradient(180deg, rgba(3,3,6,0.98) 0%, rgba(6,4,12,0.99) 100%)",
            flex: "1 0 auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            <div style={{
              fontSize: "clamp(5.5px, 1.2vw, 7.5px)", 
              fontWeight: 800, 
              letterSpacing: "0.25em",
              color: "rgba(255,255,255,0.38)", 
              textTransform: "uppercase", 
              marginBottom: "clamp(1px, 0.3vw, 3px)",
            }}>TOP PRIZE</div>
            <div style={{
              fontSize: "clamp(18px, 4vw, 34px)", 
              fontWeight: 900, 
              lineHeight: 1,
              color: isClosed ? "#666666" : "#ffffff",
              textShadow: prizeDisplay && !isClosed ? `0 0 20px rgba(${tc.rgb},1), 0 0 40px rgba(${tc.rgb},0.5)` : "none",
              marginBottom: 2,
              letterSpacing: "-0.01em",
            }}>
              {prizeDisplay || competition.title.split(" ").slice(0, 3).join(" ")}
            </div>
            {prizeDisplay ? (
              <div style={{
                fontSize: "clamp(6px, 1.2vw, 8px)", 
                fontWeight: 900, 
                letterSpacing: "0.25em",
                color: isClosed ? "#666666" : tc.accent, 
                textTransform: "uppercase",
                marginBottom: "clamp(3px, 0.8vw, 6px)",
              }}>CASH</div>
            ) : (
              <div style={{
                height: "clamp(9px, 2vw, 14px)", // Placeholder height
                marginBottom: "clamp(3px, 0.8vw, 6px)",
              }} />
            )}
            {competition.type !== "instant" ? (
              <div style={{
                fontSize: "clamp(7px, 1.2vw, 8.5px)", 
                fontWeight: 800, 
                letterSpacing: "0.04em",
                color: isClosed ? "#666666" : tc.accent,
                lineHeight: 1.35,
              }}>
                WIN UP TO {prizeStr || "BIG PRIZES"} CASH INSTANTLY!
              </div>
            ) : (
              <div style={{
                height: "clamp(9px, 1.6vw, 11px)", // Placeholder for missing text
              }} />
            )}
          </div>

          {/* ══ ENTRY + ENTRIES LEFT - Conditional with placeholder ══ */}
          {hasTickets ? (
            <div style={{
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              padding: "clamp(4px, 1vw, 8px) clamp(8px, 2vw, 12px)",
              background: "rgba(0,0,0,0.4)",
              flexShrink: 0,
              gap: "clamp(6px, 1.5vw, 10px)",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "clamp(5px, 1vw, 6.5px)", 
                  fontWeight: 800, 
                  color: "rgba(255,255,255,0.32)",
                  textTransform: "uppercase", 
                  letterSpacing: "0.15em", 
                  marginBottom: 1,
                }}>ENTRY</div>
                <div style={{
                  fontSize: "clamp(12px, 2.5vw, 15px)", 
                  fontWeight: 900, 
                  lineHeight: 1,
                  color: isClosed ? "#666666" : tc.accent,
                }}>
                  {isFree ? "FREE" : `£${parseFloat(competition.ticketPrice).toFixed(2)}`}
                </div>
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{
                  fontSize: "clamp(5px, 1vw, 6.5px)", 
                  fontWeight: 800, 
                  color: "white",
                  textTransform: "uppercase", 
                  letterSpacing: "0.15em", 
                  marginBottom: 1,
                }}>LEFT</div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                  <span style={{ 
                    fontSize: "clamp(12px, 2.5vw, 15px)", 
                    fontWeight: 900, 
                    color: isClosed ? "#666666" : "#ffffff", 
                    lineHeight: 1 
                  }}>
                    {remaining.toLocaleString()}
                  </span>
                  <Users style={{ width: "clamp(9px, 2vw, 11px)", height: "clamp(9px, 2vw, 11px)", color: isClosed ? "#666666" : "white" }} />
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder to maintain height when entry section is missing */
            <div style={{
              height: "clamp(40px, 8vw, 52px)",
              flexShrink: 0,
            }} />
          )}

          {/* ══ PROGRESS BAR - Conditional with placeholder ══ */}
          {hasTickets ? (
            <div style={{ 
              padding: "clamp(3px, 0.8vw, 5px) clamp(8px, 2vw, 12px) clamp(5px, 1vw, 8px)", 
              flexShrink: 0, 
              background: "rgba(0,0,0,0.4)" 
            }}>
              <div style={{
                height: "clamp(5px, 1vw, 8px)", 
                borderRadius: 4,
                background: "rgba(255,255,255,0.07)",
                overflow: "hidden", 
                position: "relative",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: isClosed ? "#666666" : tc.bar,
                  borderRadius: 4,
                  boxShadow: isClosed ? "none" : `0 0 10px rgba(${tc.rgb},0.7)`,
                  transition: "width 0.5s ease",
                }} />
              </div>
              <div style={{
                display: "flex", justifyContent: "flex-end",
                marginTop: "clamp(1px, 0.3vw, 3px)",
              }}>
                <span style={{
                  fontSize: "clamp(6px, 1vw, 7.5px)", 
                  fontWeight: 900, 
                  color: isClosed ? "#666666" : tc.accent,
                  letterSpacing: "0.08em", 
                  textTransform: "uppercase",
                }}>{Math.round(pct)}% FILLED</span>
              </div>
            </div>
          ) : (
            /* Placeholder to maintain height when progress bar is missing */
            <div style={{
              height: "clamp(18px, 3.5vw, 24px)",
              flexShrink: 0,
            }} />
          )}

          {/* ══ FOOTER: COUNTDOWN + ENTER NOW - Always at bottom ══ */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            alignItems: "center",
            padding: "clamp(5px, 1.2vw, 10px) clamp(6px, 1.5vw, 10px)",
            background: isClosed 
              ? "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(100,100,100,0.06) 100%)"
              : `linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(${tc.rgb},0.06) 100%)`,
            borderTop: `1px solid rgba(${isClosed ? '100,100,100' : tc.rgb},0.14)`,
            flexShrink: 0,
            gap: "clamp(4px, 1vw, 12px)",
          }}>
            {/* Countdown / Status - Left */}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: "clamp(4px, 0.9vw, 6px)", 
                fontWeight: 800, 
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase", 
                letterSpacing: "0.1em", 
                marginBottom: "clamp(1px, 0.3vw, 4px)",
              }}>
                {isExpired ? "COMPETITION ENDED" : isSoldOut ? "ALL SOLD OUT" : "ENDS IN"}
              </div>
              {isExpired ? (
                <div style={{ 
                  fontSize: "clamp(7px, 1.8vw, 15px)", 
                  fontWeight: 900, 
                  color: "#888888",
                  lineHeight: 1.2,
                }}>
                  <span style={{ display: "block", fontSize: "clamp(5px, 1vw, 8px)", color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Draw Complete
                  </span>
                </div>
              ) : isSoldOut ? (
                <div style={{ 
                  fontSize: "clamp(7px, 1.8vw, 15px)", 
                  fontWeight: 900, 
                  color: "#666666",
                  lineHeight: 1.2,
                }}>
                  <span style={{ display: "block", fontSize: "clamp(5px, 1vw, 8px)", color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    No tickets remaining
                  </span>
                </div>
              ) : endDate ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "clamp(1px, 0.4vw, 3px)", flexWrap: "wrap" }}>
                  {[
                    { v: cd.d, l: "D" },
                    { v: cd.h, l: "H" },
                    { v: cd.m, l: "M" },
                    { v: cd.s, l: "S" },
                  ].map((u, i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{
                        fontSize: "clamp(7px, 1.8vw, 15px)", 
                        fontWeight: 900, 
                        color: "#fff", 
                        lineHeight: 1,
                        minWidth: "clamp(10px, 2.5vw, 20px)", 
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {String(u.v).padStart(2, "0")}
                      </div>
                      <div style={{
                        fontSize: "clamp(3px, 0.7vw, 5.5px)", 
                        fontWeight: 700, 
                        color: "rgba(255,255,255,0.4)",
                        textTransform: "uppercase", 
                        letterSpacing: "0.05em",
                      }}>{u.l}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  fontSize: "clamp(5px, 1vw, 9px)", 
                  fontWeight: 700, 
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.2,
                }}>Draw ongoing</div>
              )}
            </div>

            {/* ENTER NOW / STATUS - Right */}
            <button
              data-testid={`button-view-competition-${competition.id}`}
              disabled={isClosed}
              style={{
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                gap: "clamp(2px, 0.5vw, 5px)",
                padding: "clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 14px)", 
                borderRadius: "clamp(6px, 1.2vw, 10px)", 
                border: "none", 
                cursor: isClosed ? "not-allowed" : "pointer",
                background: isClosed ? "#444444" : tc.bar,
                color: isClosed ? "#888888" : "#fff",
                fontSize: "clamp(7px, 1.5vw, 10px)", 
                fontWeight: 900, 
                letterSpacing: "0.06em", 
                textTransform: "uppercase",
                boxShadow: isClosed 
                  ? "none"
                  : hovered
                    ? `0 0 25px rgba(${tc.rgb},0.85)`
                    : `0 0 15px rgba(${tc.rgb},0.5)`,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                width: "100%",
                opacity: isClosed ? 0.6 : 1,
              }}
            >
              {status.button}
              {!isClosed && (
                <span style={{
                  fontSize: "clamp(9px, 1.8vw, 13px)", 
                  fontWeight: 900,
                  transform: hovered ? "translateX(2px)" : "none",
                  transition: "transform 0.2s",
                }}>→</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}