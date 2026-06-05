import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Competition, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CountdownTimer from "./countdownTimer";
import {
  Zap, ChevronLeft, ChevronRight, Trophy, Lock, Shield, Star,
  ArrowRight, BadgeCheck, Users, Clock, Ticket, CreditCard, Plus, Minus,
  Headphones, CheckCircle2, Coins, Eye, BookOpen, Award,
} from "lucide-react";
import UserCompetitionPrizes from "./user-competition-prizes";

/* ═══════ CONSTANTS ═══════ */
const TICKET_DISCOUNTS: Record<number, number> = { 3: 0.05, 5: 0.10, 10: 0.15, 25: 0.10, 50: 0.20 };
const GAME_TYPES = ["spin", "scratch", "pop", "plinko", "voltz"];
const BG     = "#0a0800";
const PANEL  = "#111008";
const PANEL2 = "#0d0c04";
const GOLD   = "#FFC300";
const AMBER  = "#FF8C00";
const BORDER = "rgba(255,185,0,0.2)";

function getDiscount(qty: number) {
  const tiers = Object.keys(TICKET_DISCOUNTS).map(Number).sort((a, b) => b - a);
  for (const t of tiers) { if (qty >= t) return TICKET_DISCOUNTS[t] * 100; }
  return 0;
}
function calcTotal(base: number, qty: number, isGame: boolean) {
  if (!isGame) return base * qty;
  const d = getDiscount(qty) / 100;
  return +(base * qty * (1 - d)).toFixed(2);
}
function prizeMoney(title: string) {
  const m = title.match(/£[\d,]+/); return m ? m[0] : "";
}
const FALLBACK = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&h=600";

/* ─── Mini card for carousel ─── */
function MiniCard({ comp, onClick }: { comp: Competition; onClick: () => void }) {
  const left = comp.maxTickets ? comp.maxTickets - (comp.soldTickets ?? 0) : null;
  const pv = prizeMoney(comp.title);
  const prog = comp.maxTickets ? Math.min(100, ((comp.soldTickets ?? 0) / comp.maxTickets) * 100) : 0;
  const badge = prog > 60 ? { label: "HOT", bg: "linear-gradient(135deg,#C62800,#FF4500)" }
    : prog < 12 ? { label: "NEW", bg: "linear-gradient(135deg,#006B5E,#00A896)" }
    : { label: "LIVE", bg: "linear-gradient(135deg,#1255A0,#1976D2)" };
  return (
    <div onClick={onClick} className="mc" style={{
      minWidth: 195, maxWidth: 195, borderRadius: 10, overflow: "hidden", cursor: "pointer",
      background: PANEL, border: `1px solid ${BORDER}`, flexShrink: 0,
    }}>
      <div style={{ position: "relative", height: "200px" }}>
        <img src={comp.imageUrl || FALLBACK} alt={comp.title}
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
          className="mc-img"
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(10,8,0,0.95) 100%)" }} />
        <div style={{ position: "absolute", top: 7, left: 7, padding: "2px 8px", borderRadius: 20, fontSize: 7, fontWeight: 900, color: "#fff", background: badge.bg, letterSpacing: "0.1em" }}>{badge.label}</div>
      </div>
      <div style={{ padding: "8px 10px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: GOLD, marginBottom: 1 }}>{pv || "WIN"}</div>
        <p style={{ fontSize: 8.5, fontWeight: 600, color: "rgba(255,255,255,0.5)", lineHeight: 1.35, marginBottom: 7, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          JUST £{parseFloat(comp.ticketPrice).toFixed(2)} PER ENTRY
        </p>
        {comp.maxTickets && (
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 5 }}>
            <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(90deg,${AMBER},${GOLD})`, borderRadius: 2 }} />
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: GOLD }}>£{parseFloat(comp.ticketPrice).toFixed(2)}</div>
          </div>
          {left !== null && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{left.toLocaleString()}</div>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.1em" }}>entries left</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function CompetitionPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user: User | null };
  const [qty, setQty] = useState(10);
  const [tab, setTab] = useState<"brief" | "vault" | "howto" | "rules">("brief");
  const [showQuiz, setShowQuiz] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [postal, setPostal] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const quiz = { q: "You wake up at 7:00am and take 30 minutes to get ready. What time are you ready?", opts: ["7:15am", "7:25am", "7:30am", "7:45am"], ans: "7:30am" };

  const { data: comp, isLoading } = useQuery<Competition>({ queryKey: ["/api/competitions", id], enabled: !!id });
  const { data: myTickets = [] } = useQuery<any[]>({ queryKey: ["/api/user/tickets"], enabled: isAuthenticated });
  const { data: allComps = [] } = useQuery<Competition[]>({ queryKey: ["/api/competitions"] });
  const others = (allComps as Competition[]).filter(c => c.id !== id).slice(0, 16);

  const ctype    = comp?.type?.toLowerCase() || "";
  const isGame   = GAME_TYPES.includes(ctype);
  const maxT     = comp?.maxTickets ?? 0;
  const soldT    = comp?.soldTickets ?? 0;
  const rem      = maxT > 0 ? maxT - soldT : null;
  const prog     = maxT > 0 ? Math.min(100, (soldT / maxT) * 100) : 0;
  const soldOut  = maxT > 0 ? soldT >= maxT : false;
  const almostGone = rem !== null && maxT > 0 ? rem / maxT < 0.15 : false;
  const isFree   = comp?.title === "💷 £500 FREE GIVEAWAY! 🎉";
  const myCount  = myTickets.filter((t: any) => t.competitionId === id).length;
  const canBuy   = isFree ? myCount < 2 : true;
  const freeLeft = 2 - myCount;

  const price    = comp ? parseFloat(comp.ticketPrice) : 0;
  const discount = getDiscount(qty);
  const total    = comp ? calcTotal(price, qty, isGame) : 0;
  const prizeVal = comp ? prizeMoney(comp.title) : "";
  const disabled = soldOut || !canBuy;

  const daysLeft = (comp as any)?.endDate
    ? Math.max(0, Math.ceil((new Date((comp as any).endDate).getTime() - Date.now()) / 86400000))
    : null;

  const buyMut = useMutation({
    mutationFn: async (data: { competitionId: string; quantity: number }) => {
      const ep: Record<string, string> = { spin: "/api/create-spin-order", scratch: "/api/create-scratch-order", pop: "/api/create-pop-order", plinko: "/api/create-plinko-order", voltz: "/api/create-voltz-order" };
      return (await apiRequest(ep[ctype] || "/api/create-competition-order", "POST", data)).json();
    },
    onSuccess: (data) => {
      const rm: Record<string, string> = { spin: `/spin-billing/${data.orderId}/${comp?.wheelType}`, scratch: `/scratch-billing/${data.orderId}`, pop: `/pop-billing/${data.orderId}`, plinko: `/plinko-billing/${data.orderId}`, voltz: `/voltz-billing/${data.orderId}` };
      setLocation(rm[ctype] || `/checkout/${data.orderId}`);
    },
    onError: (err) => {
      if (isUnauthorizedError(err)) { toast({ title: "Login Required", variant: "destructive" }); setTimeout(() => window.location.href = "/login", 1000); return; }
      toast({ title: "Error", description: (err as any).message || "Failed", variant: "destructive" });
    },
  });

  const doPurchase = () => {
    if (!isAuthenticated) { window.location.href = "/login"; return; }
    if (!comp) return;
    if (isFree && myCount >= 2) { toast({ title: "Limit Reached", variant: "destructive" }); return; }
    if (!isGame && rem !== null && rem <= 0) { toast({ title: "Sold Out", variant: "destructive" }); return; }
    buyMut.mutate({ competitionId: comp.id, quantity: qty });
  };
  const openQuiz = () => { setAnswer(null); setShowQuiz(true); };
  const submitQuiz = () => {
    if (answer === quiz.ans) { setShowQuiz(false); doPurchase(); }
    else { toast({ title: "Wrong Answer ❌", variant: "destructive" }); setShowQuiz(false); }
  };

  /* ─ LOADING ─ */
  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
      <div style={{ width: 44, height: 44, border: "2px solid rgba(255,185,0,0.15)", borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,185,0,0.35)" }}>Loading...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!comp) return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff" }}>
      <Header />
      <div style={{ maxWidth: 560, margin: "120px auto", textAlign: "center", padding: "0 20px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 16 }}>Competition Not Found</h1>
        <button onClick={() => setLocation("/")} style={{ padding: "13px 36px", borderRadius: 12, background: GOLD, color: "#000", fontWeight: 900, border: "none", cursor: "pointer" }}>All Competitions</button>
      </div>
      <Footer />
    </div>
  );

  const clean    = comp.title.replace(/^WIN\s+/i, "").replace(/[🎁🎄🚰🎮💷📱⚡️🔥💥🏆]/g, "").trim();
  const mainTitle = clean.split("–")[0].trim().toUpperCase();

  /* Quick-pick options matching reference */
  const PICKS = isFree ? [1, 2] : [1, 3, 5, 10, 25, 50];

  const TABS = [
    { k: "brief", label: "Mission Brief", icon: Zap },
    { k: "vault", label: "Prize Vault",   icon: Award },
    { k: "howto", label: "How to Play",   icon: BookOpen },
    { k: "rules", label: "Rules",         icon: Eye },
  ] as const;

  /* Panel style */
  const P: React.CSSProperties = { background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12 };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "inherit" }}>
      <Header />

      {/* ─── BREADCRUMB ─── */}
      <div style={{ background: "#060500", borderBottom: "1px solid rgba(255,185,0,0.1)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", gap: 12, height: 42 }}>
          <button onClick={() => setLocation("/")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            <ChevronLeft style={{ width: 12, height: 12 }} />BACK TO ALL COMPETITIONS
          </button>
          <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E676", boxShadow: "0 0 8px #00E676", animation: "blink 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 8, fontWeight: 900, color: "#00E676", textTransform: "uppercase", letterSpacing: "0.22em" }}>LIVE DRAW</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* ══════════════════════════════════════════
            ROW 1 — Hero Image (left) + Tabbed Panel (right)
        ══════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }} className="top-g">

          {/* ── LEFT: Competition Image Card ── */}
          <div style={{ ...P, position: "relative", overflow: "hidden", minHeight: 360 }}>
            {/* Gold top accent */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${GOLD},${AMBER},transparent)`, zIndex: 10 }} />
            {/* Left gold bar */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg,transparent,${GOLD} 20%,${GOLD} 80%,transparent)`, boxShadow: `0 0 14px rgba(255,185,0,0.5)`, zIndex: 10 }} />

            {/* Background image */}
            <img src={comp.imageUrl || FALLBACK} alt={comp.title}
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,8,0,0.4) 0%, rgba(10,8,0,0.55) 50%, rgba(10,8,0,0.94) 100%)" }} />

            {/* Content */}
            <div style={{ position: "relative", zIndex: 5, padding: "16px 18px 0" }}>
              {/* Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, border: `1px solid rgba(255,185,0,0.35)`, background: "rgba(255,185,0,0.1)", marginBottom: 10 }}>
                <Star style={{ width: 9, height: 9, color: GOLD, fill: GOLD }} />
                <span style={{ fontSize: 7.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.24em", color: GOLD }}>FEATURED COMPETITION</span>
              </div>

              {/* Title */}
              <h1 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.6rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, textShadow: "0 2px 20px rgba(0,0,0,0.8)", marginBottom: 8, textTransform: "uppercase" }}>
                {mainTitle.replace(prizeVal, "").trim() || mainTitle}
              </h1>

              {/* Prize amounts */}
              {prizeVal && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  {[prizeVal, prizeVal, prizeVal].slice(0, 3).map((v, i) => (
                    <div key={i} style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", fontWeight: 900, color: GOLD, textShadow: `0 0 24px rgba(255,185,0,0.8), 0 0 60px rgba(255,185,0,0.4)` }}>{v}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom stats bar */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5, borderTop: `1px solid rgba(255,185,0,0.2)`, background: "rgba(10,8,0,0.85)", backdropFilter: "blur(8px)", padding: "10px 18px", display: "flex", alignItems: "center", gap: 0 }}>
              {[
                { icon: Users, top: rem !== null ? rem.toLocaleString() : "∞", bot: "ENTRIES LEFT" },
                { icon: Clock, top: <CountdownTimer endDate={comp.endDate} />, bot: "DRAW ENDS IN" },
                { icon: Trophy, top: "LIVE", bot: "WINNER DRAW" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, borderRight: i < 2 ? "1px solid rgba(255,185,0,0.15)" : "none", paddingRight: i < 2 ? 12 : 0, paddingLeft: i > 0 ? 12 : 0 }}>
                  <s.icon style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "clamp(0.85rem, 1.8vw, 1.1rem)", fontWeight: 900, color: GOLD, lineHeight: 1, textShadow: `0 0 12px rgba(255,185,0,0.6)` }}>{s.top}</div>
                    <div style={{ fontSize: 7, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "white", marginTop: 2 }}>{s.bot}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Tabbed Info Panel ── */}
          <div style={{ ...P, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: `1px solid rgba(255,185,0,0.12)`, background: "rgba(255,185,0,0.03)" }}>
              {TABS.map(t => (
                <button key={t.k} onClick={() => setTab(t.k as any)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    padding: "11px 4px", border: "none", cursor: "pointer",
                    background: tab === t.k ? "rgba(255,185,0,0.1)" : "transparent",
                    borderBottom: tab === t.k ? `2px solid ${GOLD}` : "2px solid transparent",
                    color: tab === t.k ? GOLD : "rgba(255,255,255,0.35)",
                    fontSize: 9, fontWeight: tab === t.k ? 900 : 700, textTransform: "uppercase", letterSpacing: "0.14em",
                    transition: "all 0.18s",
                  }}>
                  <t.icon style={{ width: 11, height: 11 }} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, padding: "20px 20px 16px", overflow: "auto" }}>
              {tab === "brief" && (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>WIN UP TO</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "clamp(1.1rem, 3vw, 1.8rem)", fontWeight: 900, color: "#fff" }}>WIN UP TO</span>
                      <span style={{ fontSize: "clamp(1.3rem, 3.5vw, 2.2rem)", fontWeight: 900, color: GOLD, textShadow: `0 0 24px rgba(255,185,0,0.6)` }}>{prizeVal || "PRIZE"} CASH</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>Instantly + RingTone Points</div>
                  </div>

                  {/* 6 feature boxes (2×3) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[
                      { icon: Zap,        color: GOLD,      title: "Instant Cash Prizes",       desc: "Winners picked automatically" },
                      { icon: Trophy,     color: AMBER,     title: "Multiple Prizes",            desc: `Cash prizes from £100 to ${prizeVal || "prize"}` },
                      { icon: Coins,      color: "#8B5CF6", title: "Bonus RingTone Points",      desc: "Earn points with every entry" },
                      { icon: Shield,     color: "#00E676", title: "Secure Platform",            desc: "100% encrypted & protected" },
                      { icon: CheckCircle2, color: "#00CFFF", title: "Fair & Transparent",       desc: "Independent & verifiable draw" },
                      { icon: Users,      color: "#FF6B6B", title: "Real Winners",              desc: "Thousands of happy winners" },
                    ].map((f, i) => {
                      const rgb = f.color === GOLD ? "255,185,0" : f.color === AMBER ? "255,140,0" : f.color === "#8B5CF6" ? "139,92,246" : f.color === "#00E676" ? "0,230,118" : f.color === "#00CFFF" ? "0,207,255" : "255,107,107";
                      return (
                        <div key={i} style={{ display: "flex", gap: 8, padding: "9px 11px", borderRadius: 8, background: `rgba(${rgb},0.06)`, border: `1px solid rgba(${rgb},0.18)` }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${rgb},0.12)` }}>
                            <f.icon style={{ width: 14, height: 14, color: f.color }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#fff", marginBottom: 1 }}>{f.title}</div>
                            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.32)", lineHeight: 1.4 }}>{f.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* SSL badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(0,230,118,0.05)", border: "1px solid rgba(0,230,118,0.2)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00E676", boxShadow: "0 0 8px #00E676" }} />
                    <span style={{ fontSize: 8.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#00E676" }}>100% SECURE & SSL ENCRYPTED</span>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(0,230,118,0.3),transparent)" }} />
                  </div>
                </div>
              )}
              {tab === "vault" && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 900, color: GOLD, marginBottom: 12 }}>🏆 Prize Vault</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {[
                      { pos: "1st Prize", val: `${prizeVal || "Main"} Cash`, color: GOLD },
                      { pos: "2nd Prize", val: "£2,000 Cash", color: "white" },
                      { pos: "3rd Prize", val: "£1,000 Cash", color: AMBER },
                      { pos: "4th – 10th Prize", val: "£100 Cash", color: "white" },
                      { pos: "Bonus", val: "RingTone Points", color: "#8B5CF6" },
                    ].map((pr, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 8, background: i === 0 ? "rgba(255,185,0,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${i === 0 ? "rgba(255,185,0,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>{pr.pos}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: pr.color }}>{pr.val}</span>
                          <ChevronRight style={{ width: 12, height: 12, color: "rgba(255,255,255,0.2)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button style={{ width: "100%", marginTop: 12, padding: "9px 0", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: GOLD, fontSize: 10, fontWeight: 900, cursor: "pointer", letterSpacing: "0.12em" }}>
                    VIEW ALL PRIZES →
                  </button>
                </div>
              )}
              {tab === "howto" && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 900, color: GOLD, marginBottom: 12 }}>📖 How to Play</h3>
                  {[
                    { n: "1", t: "Choose your entries", d: "Select the number of entries you want to purchase from our quick-pick options." },
                    { n: "2", t: "Complete payment", d: "Pay securely using your wallet, card, or RingTone Points." },
                    { n: "3", t: "Wait for the draw", d: "The winner is selected automatically once all entries are sold or the draw date is reached." },
                    { n: "4", t: "Claim your prize", d: "Winners are notified instantly and prizes are dispatched within 7 days." },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,185,0,0.1)", border: `1px solid rgba(255,185,0,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 900, fontSize: 12, color: GOLD }}>{s.n}</div>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{s.t}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{s.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === "rules" && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 900, color: GOLD, marginBottom: 12 }}>📋 Competition Rules</h3>
                  <ul style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {[
                      "Must be 18+ to enter. UK residents only.",
                      "Maximum one account per household.",
                      "Each ticket is £" + price.toFixed(2) + " and gives one entry into the draw.",
                      "Winner drawn automatically once all tickets are sold or draw date is reached.",
                      "Winner can accept the prize or take a £1,000 cash alternative.",
                      "RingTone Riches is fully licensed and regulated.",
                      "Free postal entry available — see postal entry section.",
                      "Full T&Cs available on our website.",
                    ].map((r, i) => (
                      <li key={i} style={{ display: "flex", gap: 8, fontSize: 9.5, color: "white", lineHeight: 1.55 }}>
                        <span style={{ color: GOLD, flexShrink: 0, marginTop: 1 }}>•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            ROW 2 — 3 columns: Details | Entry Terminal | Prize Vault
        ══════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1.2fr", gap: 12, marginBottom: 16 }} className="mid-g">

          {/* ── COMPETITION DETAILS ── */}
          <div style={{ ...P, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "11px 14px", borderBottom: `1px solid rgba(255,185,0,0.1)`, display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(255,185,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap style={{ width: 13, height: 13, color: GOLD }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.55)" }}>COMPETITION DETAILS</span>
            </div>

            {/* Detail rows */}
            <div style={{ padding: "4px 0" }}>
              {[
                { label: "Type", val: <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(255,185,0,0.15)", border: "1px solid rgba(255,185,0,0.3)", color: GOLD, fontSize: 8, fontWeight: 900 }}>{comp.type?.toUpperCase() || "INSTANT"} JACKPOT</span> },
                { label: "Price per Entry", val: <span style={{ color: AMBER, fontWeight: 900, fontSize: 11 }}>£{price.toFixed(2)}</span> },
                { label: "Draw Method", val: <span style={{ color: GOLD, fontWeight: 800, fontSize: 10 }}>Automatic</span> },
                { label: "Winner Announced", val: <span style={{ color: GOLD, fontWeight: 800, fontSize: 10 }}>Live Draw</span> },
                { label: "Entry Limit", val: <span style={{ color: AMBER, fontWeight: 900, fontSize: 10 }}>{maxT > 0 ? `${maxT.toLocaleString()} Entries` : "Unlimited"}</span> },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderBottom: i < 4 ? "1px solid rgba(255,185,0,0.06)" : "none" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>{row.label}</span>
                  <div>{row.val}</div>
                </div>
              ))}
            </div>

            {/* Payment methods */}
            <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,185,0,0.08)" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "white", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 7 }}>Payment Methods</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["VISA", "MC", "APPLE PAY", "G PAY"].map((pm, i) => (
                  <div key={i} style={{ padding: "3px 8px", borderRadius: 5, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 7.5, fontWeight: 900, color: "white" }}>{pm}</div>
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,185,0,0.08)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: Lock,   c: "#00E676", t: "Secure Payment",   s: "256-bit SSL Encryption" },
                { icon: Shield, c: GOLD,      t: "Fair Draw",        s: "Verified & Audited" },
              ].map((b, i) => {
                const rgb = b.c === "#00E676" ? "0,230,118" : "255,185,0";
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 6px", borderRadius: 8, background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.18)` }}>
                    <b.icon style={{ width: 18, height: 18, color: b.c }} />
                    <div style={{ fontSize: 8, fontWeight: 900, color: "#fff", textAlign: "center" }}>{b.t}</div>
                    <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.3 }}>{b.s}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── ENTRY TERMINAL ── */}
          <div style={{ ...P, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "11px 16px", borderBottom: `1px solid rgba(255,185,0,0.1)`, display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(255,185,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ticket style={{ width: 13, height: 13, color: GOLD }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.55)" }}>ENTRY TERMINAL</span>
            </div>

            <div style={{ padding: "16px 16px 18px" }}>
              {isFree ? (
                <div style={{ marginBottom: 16 }}>
                  {myCount >= 2 ? (
                    <div style={{ padding: 14, borderRadius: 10, textAlign: "center", background: "rgba(0,230,118,0.05)", border: "1px solid rgba(0,230,118,0.2)" }}>
                      <p style={{ fontSize: 13, fontWeight: 900, color: "#00E676" }}>✅ You have {myCount} tickets</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      {[1, 2].map(n => (
                        <button key={n} onClick={() => setQty(Math.min(n, freeLeft))} disabled={n > freeLeft}
                          style={{ minWidth: 100, padding: "11px 18px", borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: n > freeLeft ? "not-allowed" : "pointer", background: qty === n ? `linear-gradient(135deg,#FFE066,${GOLD})` : "rgba(255,255,255,0.04)", color: qty === n ? "#000" : "rgba(255,255,255,0.5)", border: qty === n ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
                          {n} Ticket{n > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Quick-pick row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5, marginBottom: 14 }}>
                    {PICKS.map(n => {
                      const d = isGame ? getDiscount(n) : 0;
                      const pp = (price * n * (1 - d / 100)).toFixed(2);
                      const on = qty === n;
                      const isBest = n === 10;
                      return (
                        <div key={n} style={{ position: "relative" }}>
                          {isBest && (
                            <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", padding: "1px 7px", borderRadius: 20, fontSize: 6, fontWeight: 900, background: GOLD, color: "#000", letterSpacing: "0.1em", zIndex: 5 }}>BEST VALUE</div>
                          )}
                          <button onClick={() => setQty(n)} data-testid={`button-qty-${n}`}
                            style={{
                              width: "100%", padding: isBest ? "10px 4px 8px" : "8px 4px", borderRadius: 8, textAlign: "center",
                              border: on ? `2px solid ${GOLD}` : `1px solid rgba(255,185,0,0.14)`,
                              background: on ? "rgba(255,185,0,0.1)" : "rgba(255,255,255,0.025)",
                              color: on ? GOLD : "white",
                              cursor: "pointer", transition: "all 0.18s",
                              transform: on ? "scale(1.04)" : "scale(1)",
                              boxShadow: on ? `0 0 18px rgba(255,185,0,0.25), 0 4px 14px rgba(0,0,0,0.5)` : "none",
                            }}>
                            <div style={{ fontSize: "clamp(0.95rem, 2vw, 1.25rem)", fontWeight: 900, lineHeight: 1 }}>{n}</div>
                            <div style={{ fontSize: 8, marginTop: 3, color: on ? "rgba(255,185,0,0.65)" : "rgba(255,255,255,0.22)", fontWeight: 700 }}>£{pp}</div>
                            {d > 0 && <div style={{ fontSize: 6.5, marginTop: 1, color: "#00E676", fontWeight: 900 }}>{d}% OFF</div>}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Slider row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <button onClick={() => setQty(p => Math.max(1, p - 1))} disabled={qty <= 1} data-testid="button-decrease"
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid rgba(255,185,0,0.2)`, background: "rgba(255,185,0,0.07)", color: GOLD, cursor: qty <= 1 ? "not-allowed" : "pointer", opacity: qty <= 1 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Minus style={{ width: 13, height: 13 }} />
                    </button>
                    <div style={{ flex: 1 }}>
                      <input type="range" min="1" max="100" value={Math.min(qty, 100)} onChange={e => setQty(Number(e.target.value))} data-testid="slider-quantity"
                        style={{ width: "100%", height: 5, appearance: "none", borderRadius: 10, background: `linear-gradient(to right, ${GOLD} ${((Math.min(qty, 100) - 1) * 100) / 99}%, rgba(255,255,255,0.08) ${((Math.min(qty, 100) - 1) * 100) / 99}%)`, cursor: "pointer", outline: "none" }}
                        className="rng"
                      />
                    </div>
                    <button onClick={() => setQty(p => p + 1)} data-testid="button-increase"
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid rgba(255,185,0,0.2)`, background: "rgba(255,185,0,0.07)", color: GOLD, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Plus style={{ width: 13, height: 13 }} />
                    </button>
                  </div>

                  {/* Counter display */}
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: GOLD, lineHeight: 1, textShadow: `0 0 30px rgba(255,185,0,0.6)` }}>{qty}</div>
                    <div style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.28em", color: "rgba(255,255,255,0.25)", marginTop: 2 }}>ENTRIES</div>
                  </div>
                </>
              )}

              {/* Total */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(255,185,0,0.04)", border: `1px solid rgba(255,185,0,0.12)`, marginBottom: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.28)" }}>TOTAL AMOUNT</span>
                <span style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 900, color: GOLD, textShadow: `0 0 18px rgba(255,185,0,0.5)` }}>£{total.toFixed(2)}</span>
              </div>

              {/* ACTIVATE ENTRY CTA */}
              <button onClick={openQuiz} disabled={disabled || buyMut.isPending} className="cta" data-testid="button-purchase"
                style={{
                  width: "100%", padding: "15px 0", borderRadius: 10, border: "none",
                  background: disabled ? "rgba(255,255,255,0.04)" : `linear-gradient(135deg,#FFE066 0%,${GOLD} 28%,${AMBER} 55%,${GOLD} 82%,#FFE066 100%)`,
                  backgroundSize: "250% 100%",
                  color: disabled ? "rgba(255,255,255,0.2)" : "#0a0600",
                  fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                  cursor: disabled ? "not-allowed" : "pointer",
                  boxShadow: disabled ? "none" : `0 0 36px rgba(255,185,0,0.38), 0 8px 28px rgba(255,140,0,0.28)`,
                  position: "relative", overflow: "hidden",
                  animation: disabled ? "none" : "plasma 3.5s ease infinite",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginBottom: 10,
                }}>
                {!disabled && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 25%,rgba(255,255,255,0.28) 50%,transparent 75%)", animation: "shimmer 2.2s ease-in-out infinite" }} />}
                <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                  {soldOut ? "SOLD OUT" : buyMut.isPending
                    ? (<><div style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Processing...</>)
                    : (isFree && !canBuy) ? "LIMIT REACHED"
                    : (<><Zap style={{ width: 17, height: 17 }} />ACTIVATE ENTRY — £{total.toFixed(2)}</>)}
                </span>
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                {["Instant Entry", "Secure Payment", "Fair Draw"].map((t, i) => (
                  <span key={i} style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: "0.08em" }}>
                    {i > 0 && <span style={{ margin: "0 3px", color: "rgba(255,255,255,0.12)" }}>•</span>}{t}
                  </span>
                ))}
              </div>

              {myTickets.filter(t => t.competitionId === id).length > 0 && !isGame && (
                <div style={{ marginTop: 10, padding: "6px 12px", borderRadius: 8, textAlign: "center", background: "rgba(0,230,118,0.04)", border: "1px solid rgba(0,230,118,0.14)" }}>
                  <span style={{ fontSize: 9.5, fontWeight: 900, color: "#00E676" }}>✅ You hold {myTickets.filter(t => t.competitionId === id).length} ticket(s)</span>
                </div>
              )}

              <div style={{ textAlign: "center", marginTop: 8 }}>
                <button onClick={() => setPostal(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.16)", fontSize: 9, textDecoration: "underline", textUnderlineOffset: 3 }}>
                  📬 Free postal entry
                </button>
              </div>
            </div>
          </div>

          {/* ── PRIZE VAULT ── */}
          <div style={{ ...P, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "11px 14px", borderBottom: `1px solid rgba(255,185,0,0.1)`, display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(255,185,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star style={{ width: 13, height: 13, color: GOLD, fill: "rgba(255,185,0,0.5)" }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.55)" }}>PRIZE VAULT</span>
            </div>

            {/* Prize image */}
            <div style={{ position: "relative", height: 150, overflow: "hidden" }}>
              <img src={comp.imageUrl || FALLBACK} alt="" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.3) brightness(0.65)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 30%,rgba(10,8,0,0.95) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(255,185,0,0.08), transparent 70%)" }} />
              {prizeVal && (
                <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
                  <div style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, color: GOLD, textShadow: `0 0 28px rgba(255,185,0,0.8)`, whiteSpace: "nowrap" }}>{prizeVal}</div>
                </div>
              )}
            </div>

            {/* Prize list */}
            <div style={{ flex: 1, padding: "6px 0" }}>
              {[
                { pos: "1st Prize",       val: `${prizeVal || "Prize"} Cash`, c: GOLD },
                { pos: "2nd Prize",       val: "£2,000 Cash",                 c: "white" },
                { pos: "3rd Prize",       val: "£1,000 Cash",                 c: AMBER },
                { pos: "4th – 10th",      val: "£100 Cash",                   c: "white" },
                { pos: "Bonus",           val: "RingTone Points",             c: "#8B5CF6" },
              ].map((pr, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: i < 4 ? "1px solid rgba(255,185,0,0.05)" : "none" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>{pr.pos}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: pr.c }}>{pr.val}</span>
                    <ChevronRight style={{ width: 11, height: 11, color: "rgba(255,255,255,0.18)" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "10px 14px", borderTop: `1px solid rgba(255,185,0,0.08)` }}>
              <button onClick={() => setTab("vault")} style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: GOLD, fontSize: 9, fontWeight: 900, cursor: "pointer", letterSpacing: "0.12em" }}>
                VIEW ALL PRIZES →
              </button>
            </div>
          </div>
        </div>

       

        {/* ══════════════════════════════════════════
            MORE COMPETITIONS
        ══════════════════════════════════════════ */}
        {others.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.16em", color: "#fff", margin: 0 }}>MORE COMPETITIONS YOU'LL LOVE</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setLocation("/")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: "rgba(255,185,0,0.06)", border: `1px solid ${BORDER}`, color: GOLD, fontSize: 8.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em", cursor: "pointer" }}>
                  VIEW ALL COMPETITIONS <ArrowRight style={{ width: 11, height: 11 }} />
                </button>
                {[-1, 1].map(dir => (
                  <button key={dir} onClick={() => boardRef.current?.scrollBy({ left: dir * 215, behavior: "smooth" })}
                    style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,185,0,0.06)", border: `1px solid ${BORDER}`, color: GOLD, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {dir < 0 ? <ChevronLeft style={{ width: 14, height: 14 }} /> : <ChevronRight style={{ width: 14, height: 14 }} />}
                  </button>
                ))}
              </div>
            </div>
            <div ref={boardRef} style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }} className="board">
              {others.map(c => (
                <MiniCard key={c.id} comp={c} onClick={() => setLocation(`/competition/${c.id}`)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security bar */}
      <div style={{ background: "#060500", borderTop: `1px solid rgba(255,185,0,0.1)`, padding: "14px 20px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,185,0,0.08)", border: `1px solid rgba(255,185,0,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Shield style={{ width: 18, height: 18, color: GOLD }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em", color: "#fff" }}>YOUR SECURITY IS OUR PRIORITY</div>
              <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.25)" }}>All data secured with military grade encryption</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Lock style={{ width: 18, height: 18, color: "#00CFFF" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em", color: "#fff" }}>SSL SECURED</div>
              <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.25)" }}>256-bit encryption</div>
            </div>
          </div>
        </div>
      </div>

      <UserCompetitionPrizes competitionId={comp.id} />

      {/* ══ QUIZ ══ */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent style={{ background: "#0e0a02", border: `1px solid rgba(255,185,0,0.22)`, borderRadius: 20 }} className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle style={{ color: "#fff", textAlign: "center", fontWeight: 900, fontSize: 18 }}>Answer to Proceed</DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12.5 }}>{quiz.q}</p>
            {quiz.opts.map(opt => (
              <button key={opt} onClick={() => setAnswer(opt)}
                style={{ width: "100%", padding: "11px 16px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", background: answer === opt ? `linear-gradient(135deg,#FFE066,${GOLD})` : "rgba(255,255,255,0.03)", color: answer === opt ? "#0a0600" : "#fff", border: answer === opt ? "none" : "1px solid rgba(255,255,255,0.08)", transition: "all 0.15s" }}>
                {opt}
              </button>
            ))}
          </div>
          <DialogFooter style={{ justifyContent: "center" }}>
            <Button disabled={!answer} onClick={submitQuiz}
              style={{ background: `linear-gradient(135deg,#FFE066,${GOLD})`, color: "#0a0600", fontWeight: 900, padding: "10px 36px", borderRadius: 10, opacity: !answer ? 0.5 : 1 }}>
              Submit Answer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ POSTAL ══ */}
      <Dialog open={postal} onOpenChange={setPostal}>
        <DialogContent style={{ background: "#0e0a02", border: `1px solid rgba(255,185,0,0.22)`, borderRadius: 20 }} className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: "#fff", textAlign: "center", fontWeight: 900, fontSize: 18 }}>📬 Postal Entry Route</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.4)" }}>
              <p>Send an unclosed postcard (approx 148mm × 105mm) to:</p>
              <p style={{ fontWeight: 700, color: "#fff", padding: "9px 13px", borderRadius: 9, background: "rgba(255,185,0,0.06)", border: `1px solid rgba(255,185,0,0.18)` }}>1 West Havelock Street, South Shields, Tyne and Wear, NE33 5AF</p>
              <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
                {["Competition name", "Full name & postal address", "Phone number & email on account", "Date of birth", "Answer to skill question", "Incomplete entries will be disqualified", "Max one entry per household"].map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <div style={{ padding: "9px 13px", borderRadius: 9, background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ color: "#fff", fontWeight: 700, marginBottom: 4 }}>Skill Question:</p>
                <p style={{ fontSize: 11 }}>You wake up at 7:00am and take 30 minutes to get ready. What time are you ready?</p>
                <p style={{ color: GOLD, fontSize: 11, marginTop: 4 }}>A: 7:15am &nbsp;B: 7:20am &nbsp;C: 7:30am &nbsp;D: 7:45am</p>
              </div>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* ══ KEYFRAMES ══ */}
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.18} }
        @keyframes shimmer { 0%{transform:translateX(-120%)} 100%{transform:translateX(220%)} }
        @keyframes plasma  { 0%,100%{background-position:0% center} 50%{background-position:100% center} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .cta:hover:not(:disabled) { transform:translateY(-2px); box-shadow: 0 0 55px rgba(255,185,0,0.55), 0 14px 40px rgba(255,140,0,0.38) !important; }
        .cta:active:not(:disabled) { transform:translateY(0); }
        .mc:hover { border-color:rgba(255,185,0,0.4) !important; transform:translateY(-4px); box-shadow:0 12px 28px rgba(0,0,0,0.65) !important; }
        .mc:hover .mc-img { transform:scale(1.07); }
        .board::-webkit-scrollbar { height:3px; }
        .board::-webkit-scrollbar-track { background:rgba(255,255,255,0.018); }
        .board::-webkit-scrollbar-thumb { background:rgba(255,185,0,0.28); border-radius:2px; }
        .rng { -webkit-appearance:none; appearance:none; outline:none; }
        .rng::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:linear-gradient(135deg,#FFE066,${GOLD}); cursor:pointer; box-shadow:0 0 14px rgba(255,185,0,0.7); border:2px solid ${PANEL}; }
        .rng::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:linear-gradient(135deg,#FFE066,${GOLD}); cursor:pointer; border:2px solid ${PANEL}; }
        @media(max-width:900px){
          .top-g  { grid-template-columns:1fr !important; }
          .mid-g  { grid-template-columns:1fr !important; }
          .trust-g{ grid-template-columns:repeat(3,1fr) !important; }
        }
        @media(max-width:560px){
          .trust-g{ grid-template-columns:repeat(2,1fr) !important; }
        }
      `}</style>

      <Footer />
    </div>
  );
}