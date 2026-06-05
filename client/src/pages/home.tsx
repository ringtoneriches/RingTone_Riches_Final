import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Trophy, Zap, Gift, Mail, CheckCircle2, Shield, Award, Star, ChevronRight, Crown, Wallet, RotateCw, Ticket, Coins, Play, TrendingUp, Flame, PartyPopper, Circle, Target, TicketCheck, Clock, Users, MapPin, Diamond, Gem, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CompactFacebookCTA from "@/components/PremiumFacebookEngagement";
import Testimonials from "@/components/testimonials";
import HeroCanvasBg from "@/components/hero-canvas-bg";
import FAQ from "./faq";
import FeaturedCompetitions from "./featuredCompetitions";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// ─── Star field (deterministic — 80 dots spread across hero background) ───────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: ((i * 127.3) % 100).toFixed(1),
  y: ((i * 83.7 + 13.1) % 100).toFixed(1),
  r: i % 5 === 0 ? 2 : 1,
  o: (0.15 + (i % 6) * 0.07).toFixed(2) }));

// ─── Bokeh stage lights (out-of-focus award-show / arena lights) ──────────────
const BOKEH: [number,number,number,number,number,number,number,number][] = [
  [8,  76, 52, 0.07, 24, 212,175, 55], [22, 88, 36, 0.11, 17, 255,240,200],
  [38, 79, 62, 0.05, 29, 212,175, 55], [54, 84, 46, 0.09, 21, 255,255,255],
  [71, 77, 56, 0.06, 25, 212,175, 55], [88, 69, 42, 0.08, 19, 255,240,200],
  [5,  61, 23, 0.04, 11, 212,175, 55], [18, 52, 17, 0.05,  9, 255,255,255],
  [34, 58, 29, 0.05, 14, 255,240,200], [62, 63, 21, 0.06, 10, 255,240,200],
  [80, 47, 19, 0.04,  9, 100,130,220], [95, 81, 66, 0.04, 31, 212,175, 55],
  [2,  86, 57, 0.06, 27, 255,240,200], [50, 91, 76, 0.04, 35, 212,175, 55],
  [27, 93, 49, 0.07, 23, 255,255,255], [68, 92, 43, 0.08, 20, 255,240,200],
  [44, 69, 33, 0.05, 15, 255,255,255], [10, 42, 14, 0.04,  7, 212,175, 55],
  [58, 35, 19, 0.04, 10, 255,240,200], [78, 31, 13, 0.03,  6, 255,255,255],
  [30, 28, 11, 0.03,  5, 212,175, 55], [92, 43, 27, 0.04, 12, 212,175, 55],
  [15, 83, 39, 0.06, 18, 255,255,255], [82, 85, 45, 0.05, 21, 212,175, 55],
  [46, 56, 25, 0.04, 12, 255,240,200],
];

// ─── Floating gold dust particles ─────────────────────────────────────────────
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  x:   ((i * 19 + 7) % 100).toFixed(1),
  sz:  1 + (i % 3),
  del: `${((i * 0.65) % 9).toFixed(1)}s`,
  dur: `${7 + (i % 6)}s`,
  op:  (0.22 + (i % 4) * 0.12).toFixed(2) }));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, isVisible };
}

const HIDDEN_COMPETITION_IDS = [
  "d54eee36-2280-4372-84f6-93d07343a970",
  "25f0ee99-6f54-435d-9605-f4c287fe1338",
];

function HeadlineCountdown({ endDate }: { endDate: string | Date | null | undefined }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - now;
  if (diff <= 0) return null;
  const units = [
    { v: Math.floor(diff / 86400000), l: "Days" },
    { v: Math.floor((diff % 86400000) / 3600000), l: "Hrs" },
    { v: Math.floor((diff % 3600000) / 60000), l: "Min" },
    { v: Math.floor((diff % 60000) / 1000), l: "Sec" },
  ];
  return (
    <div className="flex items-center gap-2">
      {units.map((u, i) => (
        <div key={i} className="flex flex-col items-center justify-center w-14 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,215,110,0.18)' }}>
          <span className="text-xl font-black text-white tabular-nums leading-none" style={{ textShadow: '0 0 18px rgba(212,175,55,0.5)' }}>
            {String(u.v).padStart(2, '0')}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/35 mt-0.5">{u.l}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user: User | null };
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"] });

  const { data: plinkoConfig } = useQuery({
    queryKey: ["/api/plinko-config"],
    queryFn: async () => (await apiRequest("/api/plinko-config", "GET")).json() });
  const { data: voltzConfig } = useQuery({
    queryKey: ["/api/voltz-config"],
    queryFn: async () => (await apiRequest("/api/voltz-config", "GET")).json() });
  const { data: spinConfig } = useQuery({
    queryKey: ["/api/admin/game-spin-2-config"],
    queryFn: async () => (await apiRequest("/api/admin/game-spin-2-config", "GET")).json() });

  const [activeFilter, setActiveFilter] = useState("all");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const filteredCompetitions = useMemo(() => {
    if (activeFilter === "all") {
      return isAuthenticated ? competitions : competitions.filter((c) => c.type !== "instant");
    }
    return competitions.filter((c) => c.type === activeFilter);
  }, [competitions, isAuthenticated, activeFilter]);

  const handleFilterChange = (filterType: string) => setActiveFilter(filterType);

  // Get all active competitions for the featured carousel
// Get all competitions for the featured carousel (show all regardless of type)
const featuredCompetitions = useMemo(() => {
  return competitions.filter((c) => {
    // Only filter out hidden IDs and basic validity checks
    if (HIDDEN_COMPETITION_IDS.includes(c.id)) return false;
    // Only filter out competitions with no image
    if (!c.imageUrl) return false;
    return true;
  });
}, [competitions]);

const headline = useMemo(() => {
  // Get all eligible competitions for the headline (most popular based on sold tickets)
  const eligible = competitions.filter((c) => {
    if (HIDDEN_COMPETITION_IDS.includes(c.id)) return false;
    return true;
  });
  if (eligible.length === 0) return null;
  return [...eligible].sort((a, b) => ((b.soldTickets || 0) / (b.maxTickets || 1)) - ((a.soldTickets || 0) / (a.maxTickets || 1)))[0];
}, [competitions]);

  const newsletterSubscribeMutation = useMutation({
    mutationFn: async (email: string) => (await apiRequest("/api/user/newsletter/subscribe", "POST", { email })).json(),
    onSuccess: (data) => {
      toast({ title: "Success!", description: data.message });
      setNewsletterEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => toast({ title: "Subscription Failed", description: error.message, variant: "destructive" }) });

  const newsletterUnsubscribeMutation = useMutation({
    mutationFn: async () => (await apiRequest("/api/user/newsletter/unsubscribe", "POST", {})).json(),
    onSuccess: (data) => {
      toast({ title: "Unsubscribed", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => toast({ title: "Unsubscribe Failed", description: error.message, variant: "destructive" }) });

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    newsletterSubscribeMutation.mutate(newsletterEmail);
  };

  const newsletterSection = useInView();

  const gameCards = [
    { id: competitions.find(c => c.type === "voltz")?.id,   Icon: Zap,         title: "Ringtone Voltz",  desc: "Surge to victory",      gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)", glowColor: "59,130,246",  borderColor: "rgba(59,130,246,0.35)",  bgColor: "rgba(59,130,246,0.07)",  iconBg: "linear-gradient(135deg,#1d4ed8,#3b82f6)",  filter: "voltz",   prize: "£10,000", badge: "HOT", badgeColor: "rgba(59,130,246,0.9)",  popular: true,  route: ""              },
    { id: competitions.find(c => c.type === "pop")?.id,     Icon: Target,      title: "Ringtone Pop",    desc: "Pop your way to prizes", gradient: "linear-gradient(135deg,#f59e0b,#fcd34d)", glowColor: "245,158,11",  borderColor: "rgba(245,158,11,0.35)",  bgColor: "rgba(245,158,11,0.07)",  iconBg: "linear-gradient(135deg,#d97706,#f59e0b)",  filter: "pop",     prize: "£5,000",  badge: "NEW", badgeColor: "rgba(16,185,129,0.85)", popular: false, route: "/ringtone-pop"  },
    { id: competitions.find(c => c.type === "spin")?.id,    Icon: RotateCw,    title: "Retro Spin",      desc: "Spin the iconic wheel",  gradient: "linear-gradient(135deg,#f43f5e,#fb7185)", glowColor: "244,63,94",   borderColor: "rgba(244,63,94,0.38)",   bgColor: "rgba(244,63,94,0.08)",   iconBg: "linear-gradient(135deg,#be123c,#f43f5e)",  filter: "spin",    prize: "£1,000",  badge: "HOT", badgeColor: "rgba(244,63,94,0.9)",   popular: true,  route: "/spin-wheel"    },
    { id: competitions.find(c => c.type === "plinko")?.id,  Icon: Circle,      title: "Ringtone Plinko", desc: "Drop & watch it fall",   gradient: "linear-gradient(135deg,#8b5cf6,#c4b5fd)", glowColor: "139,92,246",  borderColor: "rgba(139,92,246,0.35)",  bgColor: "rgba(139,92,246,0.07)",  iconBg: "linear-gradient(135deg,#6d28d9,#8b5cf6)",  filter: "plinko",  prize: "£1,000",  badge: "HOT", badgeColor: "rgba(139,92,246,0.9)",  popular: false, route: ""              },
    { id: competitions.find(c => c.type === "scratch")?.id, Icon: TicketCheck, title: "Scratch & Win",   desc: "Reveal your fortune",    gradient: "linear-gradient(135deg,#10b981,#34d399)", glowColor: "16,185,129",  borderColor: "rgba(16,185,129,0.35)",  bgColor: "rgba(16,185,130,0.07)",  iconBg: "linear-gradient(135deg,#059669,#10b981)",  filter: "scratch", prize: "£2,500",  badge: "NEW", badgeColor: "rgba(16,185,129,0.85)", popular: false, route: "/scratch-card"  },
  ];

  const scrollToGrid = () => {
    const s = document.getElementById("competitions-grid");
    if (s) window.scrollTo({ top: s.getBoundingClientRect().top + window.pageYOffset - 80, behavior: "smooth" });
  };

  // Slick carousel settings for featured competitions
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: true,
    adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
        }
      }
    ]
  };

  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden" style={{ backgroundColor: '#070709' }}>
      <Header />

      {/* ═══════════════════════════════════════════════════════
          HERO — 2050 FUTURISTIC COMPETITION ARENA
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '100vh', background: '#09070e' }}>
        {/* ── Background: Award-Stage Competition Arena ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">

          {/* ── Next-generation procedural canvas background ── */}
          <HeroCanvasBg />

          {/* Deep star field — distant atmosphere */}
          {STARS.map((s, i) => (
            <div key={i} className="absolute rounded-full" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${Number(s.r) * 2}px`, height: `${Number(s.r) * 2}px`, background: 'rgba(255,255,255,0.9)', opacity: Number(s.o) * 0.6 }} />
          ))}

          {/* ── Stage spotlight cones (three overlapping beams from above) ── */}
          {/* Wide outer cone */}
          <div className="absolute" style={{ top: '-5%', left: '10%', right: '10%', height: '85%', background: 'radial-gradient(ellipse 100% 95% at 50% 0%, rgba(212,175,55,0.15) 0%, rgba(180,140,40,0.05) 40%, transparent 65%)', filter: 'blur(6px)' }} />
          {/* Mid cone */}
          <div className="absolute" style={{ top: '-8%', left: '25%', right: '25%', height: '78%', background: 'radial-gradient(ellipse 85% 85% at 50% 0%, rgba(245,215,110,0.11) 0%, transparent 55%)' }} />
          {/* Tight inner beam */}
          <div className="absolute" style={{ top: '-3%', left: '38%', right: '38%', height: '60%', background: 'radial-gradient(ellipse 65% 75% at 50% -5%, rgba(255,248,190,0.09) 0%, transparent 50%)' }} />

          {/* Stage floor warm reflection */}
          <div className="absolute" style={{ bottom: 0, left: '5%', right: '5%', height: '40%', background: 'radial-gradient(ellipse 95% 65% at 50% 100%, rgba(212,175,55,0.1) 0%, transparent 70%)', filter: 'blur(18px)' }} />

          {/* Strong edge vignette — keeps focus on the stage centre */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 88% at 50% 42%, transparent 20%, rgba(0,0,0,0.72) 100%)' }} />

          {/* Side darkness (left & right wings — like stage curtains) */}
          <div className="absolute inset-y-0 left-0 w-1/4" style={{ background: 'linear-gradient(90deg,rgba(0,0,0,0.55),transparent)' }} />
          <div className="absolute inset-y-0 right-0 w-1/4" style={{ background: 'linear-gradient(270deg,rgba(0,0,0,0.55),transparent)' }} />

          {/* Bokeh out-of-focus arena lights — clusters toward bottom (stage floor) */}
          {BOKEH.map(([x, y, size, opacity, blur, r, g, b], i) => (
            <div key={`bk${i}`} className="absolute rounded-full" style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}px`,
              height: `${size}px`,
              transform: 'translate(-50%, -50%)',
              background: `rgba(${r},${g},${b},${opacity})`,
              filter: `blur(${blur}px)` }} />
          ))}

          {/* Floating gold dust particles drifting upward */}
          {PARTICLES.map((p, i) => (
            <div key={`pt${i}`} className="absolute rounded-full" style={{
              left: `${p.x}%`,
              bottom: '-6px',
              width: `${p.sz}px`,
              height: `${p.sz + 3}px`,
              background: `rgba(212,175,55,${p.op})`,
              boxShadow: `0 0 ${p.sz * 3}px rgba(212,175,55,0.55)`,
              animation: `float-up ${p.dur} ${p.del} linear infinite` }} />
          ))}

          {/* Top gold glow edge — like stage lighting rig */}
          <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg,transparent 5%,rgba(212,175,55,0.55) 25%,rgba(255,248,160,0.85) 50%,rgba(212,175,55,0.55) 75%,transparent 95%)' }} />
          <div className="absolute top-0 left-0 right-0 h-12" style={{ background: 'linear-gradient(180deg,rgba(212,175,55,0.04),transparent)' }} />

          {/* Bottom fade into next section */}
          <div className="absolute bottom-0 left-0 right-0 h-44" style={{ background: 'linear-gradient(180deg,transparent,#09070e)' }} />
        </div>

        {/* ── Content ── */}
        <div className="relative z-20 flex items-center px-4 sm:px-6 lg:px-8 py-24 lg:py-0" style={{ minHeight: '100vh' }}>
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* ── LEFT COLUMN ── */}
              <div className="text-center lg:text-left space-y-6 order-1 lg:order-1">

                {/* ── Badge row ── */}
                <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                  {/* "The Future of Winning" — rotating conic-gradient border */}
                  <div className="relative p-px rounded-full overflow-hidden" style={{ display: 'inline-flex' }}>
                    <div className="absolute inset-0" style={{
                      background: 'conic-gradient(from 0deg, transparent 0%, rgba(212,175,55,0.9) 18%, rgba(255,248,160,0.65) 28%, transparent 45%, rgba(212,175,55,0.5) 68%, transparent 100%)',
                      animation: 'spin-slow 4s linear infinite',
                      borderRadius: '999px' }} />
                    <div className="relative flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(9,7,14,0.92)'}}>
                      <div className="relative flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 10px rgba(52,211,153,1)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 opacity-40" style={{ animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.3s', transform: 'scale(2)' }} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: '#f5d76e', filter: 'drop-shadow(0 0 7px rgba(212,175,55,0.7))' }}>The Future of Winning</span>
                      <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.85))' }} />
                    </div>
                  </div>
                  {/* Welcome back pill */}
                  {isAuthenticated && user && (
                    <div className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
                      background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(168,123,44,0.05))',
                      border: '1px solid rgba(212,175,55,0.25)',
                      boxShadow: '0 0 24px rgba(212,175,55,0.1), inset 0 1px 0 rgba(255,255,255,0.07)' }}>
                      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg,transparent 25%,rgba(255,255,255,0.09) 50%,transparent 75%)', animation: 'shimmer-sweep 3.5s ease-in-out infinite' }} />
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f5d76e', filter: 'drop-shadow(0 0 7px rgba(212,175,55,0.9))', animation: 'icon-spin-pop 3s ease-in-out infinite' }} />
                      <span className="text-[11px] font-semibold text-white/75 whitespace-nowrap relative">
                        Welcome back,{' '}
                        <span className="font-black" style={{ color: '#f5d76e', textShadow: '0 0 16px rgba(212,175,55,0.75)' }}>{user?.firstName || 'Champion'}</span>
                      </span>
                      <span className="text-amber-400/50 text-[9px] flex-shrink-0">✦</span>
                    </div>
                  )}
                </div>

                {/* ── HEADLINE — next-gen treatment ── */}
                <div>
                  {/* Mission label */}
                  <div className="flex items-center gap-2.5 mb-3 justify-center lg:justify-start">
                    <div className="h-px w-5" style={{ background: 'rgba(212,175,55,0.5)' }} />
                    <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/18">System Activated</span>
                    <div className="h-px w-5" style={{ background: 'rgba(212,175,55,0.2)' }} />
                  </div>

                  <h1 className="font-black leading-[0.87] tracking-tighter" style={{ fontSize: 'clamp(3.2rem,7.5vw,6.2rem)' }}>
                    {/* Chromatic aberration on WIN BIG. */}
                    <span className="block text-white" style={{
                      textShadow: '-2px 0 0 rgba(99,214,255,0.12), 2px 0 0 rgba(255,99,180,0.08), 0 2px 40px rgba(255,255,255,0.06)' }}>WIN BIG.</span>
                    {/* Intense gold glow on LIVE LARGE. */}
                    <span className="block text-gold-shine" style={{
                      filter: 'drop-shadow(0 0 30px rgba(212,175,55,0.8)) drop-shadow(0 0 60px rgba(212,175,55,0.35))' }}>LIVE LARGE.</span>
                  </h1>

                  <div className="flex items-center gap-3 mt-4 justify-center lg:justify-start">
                    <div className="h-px w-8" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.45))' }} />
                    <span className="text-[9px] font-black uppercase tracking-[0.45em] text-white/28 select-none">Compete · Win · Ascend</span>
                    <div className="h-px w-8" style={{ background: 'linear-gradient(90deg,rgba(212,175,55,0.45),transparent)' }} />
                  </div>
                </div>

                {/* ── Description — mission briefing with left neon border ── */}
                <div className="relative max-w-md mx-auto lg:mx-0 text-left" style={{ paddingLeft: '1rem' }}>
                  <div className="absolute top-0 left-0 bottom-0 w-[2px]" style={{
                    background: 'linear-gradient(180deg,transparent,rgba(212,175,55,0.9) 25%,rgba(212,175,55,0.9) 75%,transparent)',
                    boxShadow: '0 0 8px rgba(212,175,55,0.5)' }} />
                  <p className="text-white/65 text-base sm:text-lg leading-relaxed" style={{ textShadow: '0 1px 20px rgba(0,0,0,0.8)' }}>
                    Premium competitions. Real winners. Unbelievable prizes — from just{' '}
                    <span className="font-black" style={{ color: '#f5d76e', textShadow: '0 0 16px rgba(212,175,55,0.6)' }}>99p</span>
                    . Powered by next-generation technology.
                  </p>
                </div>

                {/* ── Trust badges — HUD inline style ── */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 justify-center lg:justify-start">
                  {([
                    { icon: Shield,       label: '100% Secure',      rgb: '52,211,153'  },
                    { icon: Zap,          label: 'Instant Results',  rgb: '99,179,237'  },
                    { icon: CheckCircle2, label: 'SSL Encrypted',    rgb: '212,175,55'  },
                    { icon: Award,        label: 'Trusted Platform', rgb: '240,167,43'  },
                  ] as const).map(({ icon: Icon, label, rgb }, i) => (
                    <div key={i} className="group relative overflow-hidden flex items-center gap-2 px-3 py-2 rounded-xl cursor-default min-w-0"
                      style={{
                        background: `rgba(${rgb},0.07)`,
                        border: `1px solid rgba(${rgb},0.22)`,
                        transition: 'all 0.22s ease' }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = 'translateY(-3px)';
                        el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.4), 0 0 18px rgba(${rgb},0.18)`;
                        el.style.borderColor = `rgba(${rgb},0.5)`;
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = '';
                        el.style.boxShadow = '';
                        el.style.borderColor = `rgba(${rgb},0.22)`;
                      }}
                    >
                      {/* Scan lines */}
                      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,white 0px,white 1px,transparent 1px,transparent 4px)' }} />
                      {/* Left accent */}
                      <div className="absolute top-0 left-0 bottom-0 w-[2px]" style={{ background: `linear-gradient(180deg,transparent,rgba(${rgb},1),transparent)` }} />
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `rgba(${rgb},0.14)`, border: `1px solid rgba(${rgb},0.28)` }}>
                        <Icon className="w-3 h-3" style={{ color: `rgb(${rgb})`, filter: `drop-shadow(0 0 5px rgba(${rgb},0.9))` }} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap" style={{ color: `rgba(${rgb},0.8)` }}>{label}</span>
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: `rgb(${rgb})`, boxShadow: `0 0 6px rgba(${rgb},1)`, animation: `pulse 2s ease-in-out ${i * 0.4}s infinite` }} />
                    </div>
                  ))}
                </div>

                {/* ── Stat panels — HUD data readouts ── */}
                <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto lg:mx-0">
                  {([
                    { value: '£100K+', label: 'Prizes',  Icon: Trophy, rgb: '212,175,55' },
                    { value: '50K+',   label: 'Winners', Icon: Users,  rgb: '52,211,153' },
                    { value: '2M+',    label: 'Entries', Icon: Zap,    rgb: '99,179,237' },
                    { value: '4.9★',   label: 'Rating',  Icon: Star,   rgb: '240,167,43' },
                  ] as const).map((s, i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-xl cursor-default"
                      data-testid={`text-stat-value-${i}`}
                      style={{
                        background: `linear-gradient(160deg,rgba(${s.rgb},0.1) 0%,rgba(3,3,10,0.92) 60%)`,
                        border: `1px solid rgba(${s.rgb},0.22)`,
                        boxShadow: `0 4px 16px rgba(0,0,0,0.4)`,
                        transition: 'all 0.25s ease' }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = 'translateY(-5px) scale(1.06)';
                        el.style.borderColor = `rgba(${s.rgb},0.55)`;
                        el.style.boxShadow = `0 16px 40px rgba(0,0,0,0.5), 0 0 28px rgba(${s.rgb},0.2)`;
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = '';
                        el.style.borderColor = `rgba(${s.rgb},0.22)`;
                        el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.4)`;
                      }}
                    >
                      {/* Coloured top bar */}
                      <div className="h-[2px] w-full" style={{
                        background: `linear-gradient(90deg,transparent,rgba(${s.rgb},1),transparent)`,
                        boxShadow: `0 0 8px rgba(${s.rgb},0.8)` }} />
                      {/* Scan lines */}
                      <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,white 0px,white 1px,transparent 1px,transparent 4px)' }} />
                      <div className="py-3 px-2 text-center">
                        <s.Icon className="w-3.5 h-3.5 mx-auto mb-2" style={{ color: `rgb(${s.rgb})`, filter: `drop-shadow(0 0 8px rgba(${s.rgb},1))` }} />
                        <div className="text-sm sm:text-base font-black text-white leading-none tabular-nums" style={{ textShadow: `0 0 20px rgba(${s.rgb},0.5)` }}>{s.value}</div>
                        <div className="text-[7px] font-black text-white/30 mt-1.5 uppercase tracking-[0.18em] leading-tight">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Next draw countdown ── */}
                {headline?.endDate && (
                  <div>
                    <div className="flex items-center gap-3 mb-2 justify-center lg:justify-start">
                      <div className="h-px flex-1 max-w-[50px]" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.3))' }} />
                      <span className="text-[9px] font-black uppercase tracking-[0.32em] text-white/25">Next Draw In</span>
                      <div className="h-px flex-1 max-w-[50px]" style={{ background: 'linear-gradient(90deg,rgba(212,175,55,0.3),transparent)' }} />
                    </div>
                    <div className="flex justify-center lg:justify-start">
                      <HeadlineCountdown endDate={headline.endDate} />
                    </div>
                  </div>
                )}

                {/* ── CTA buttons ── */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">

                  {/* Primary — Enter Now */}
                  <div className="relative group w-full sm:w-auto">
                    <div className="absolute -inset-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(ellipse,rgba(212,175,55,0.35),transparent)', filter: 'blur(28px)', borderRadius: '999px' }} />
                    <div className="absolute -inset-1.5 rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" style={{ border: '1px solid rgba(212,175,55,0.7)', animation: 'energy-ring 1.8s ease-in-out infinite' }} />
                    <button
                      onClick={scrollToGrid}
                      className="relative w-full sm:w-auto overflow-hidden flex items-center justify-center gap-2.5 px-9 font-black uppercase text-black rounded-2xl transition-transform duration-300 group-hover:scale-[1.05] group-hover:brightness-[1.08]"
                      style={{
                        height: 56,
                        background: 'linear-gradient(135deg,#f8efc0 0%,#f5d76e 28%,#d4af37 58%,#a87b2c 100%)',
                        boxShadow: '0 20px 60px rgba(212,175,55,0.6), 0 6px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.7)',
                        letterSpacing: '0.13em',
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer' }}
                      data-testid="button-hero-play-now"
                    >
                      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg,transparent 15%,rgba(255,255,255,0.55) 50%,transparent 85%)', animation: 'shimmer-sweep 2.6s ease-in-out infinite' }} />
                      <Zap className="w-4 h-4 relative flex-shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.4))' }} />
                      <span className="relative">Enter Now</span>
                      <ArrowRight className="w-4 h-4 relative flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </button>
                  </div>

                  {/* Secondary — How It Works */}
                  <div className="relative group w-full sm:w-auto">
                    <button
                      onClick={() => { const s = document.getElementById("games-section"); if (s) s.scrollIntoView({ behavior: "smooth" }); }}
                      className="relative w-full sm:w-auto overflow-hidden flex items-center justify-center gap-2.5 px-7 font-semibold rounded-2xl transition-all duration-300 group-hover:scale-[1.03]"
                      style={{
                        height: 56,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease' }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = 'rgba(212,175,55,0.35)';
                        el.style.color = 'rgba(255,255,255,0.9)';
                        el.style.boxShadow = '0 0 30px rgba(212,175,55,0.12), inset 0 1px 0 rgba(255,255,255,0.07)';
                        el.style.background = 'rgba(212,175,55,0.05)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = 'rgba(255,255,255,0.1)';
                        el.style.color = 'rgba(255,255,255,0.6)';
                        el.style.boxShadow = '';
                        el.style.background = 'rgba(255,255,255,0.03)';
                      }}
                      data-testid="button-hero-browse"
                    >
                      <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,white 0px,white 1px,transparent 1px,transparent 4px)' }} />
                      <Play className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ color: 'rgba(212,175,55,0.75)' }} />
                      <span className="relative">How It Works</span>
                      <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN — 3D Energy Wheel with HUD frame ── */}
              <div className="flex items-center justify-center order-2 lg:order-2">
                {/* HUD outer frame */}
                <div className="relative">
                  {/* Corner brackets — framing the whole right column */}
                  {(['tl','tr','bl','br'] as const).map(pos => (
                    <div key={pos} className="absolute w-6 h-6 pointer-events-none z-30" style={{
                      top:    pos.startsWith('t') ? -12 : undefined,
                      bottom: pos.startsWith('b') ? -12 : undefined,
                      left:   pos.endsWith('l')   ? -12 : undefined,
                      right:  pos.endsWith('r')   ? -12 : undefined,
                      borderTop:    pos.startsWith('t') ? '2px solid rgba(212,175,55,0.55)' : undefined,
                      borderBottom: pos.startsWith('b') ? '2px solid rgba(212,175,55,0.35)' : undefined,
                      borderLeft:   pos.endsWith('l')   ? '2px solid rgba(212,175,55,0.55)' : undefined,
                      borderRight:  pos.endsWith('r')   ? '2px solid rgba(212,175,55,0.35)' : undefined,
                      boxShadow:    pos.startsWith('t') ? '0 0 12px rgba(212,175,55,0.25)' : undefined }} />
                  ))}

                {/* ══════════════════════════════════════════════════
                    COMMAND CENTER — Full Platform Overview Dashboard
                ══════════════════════════════════════════════════ */}
                <div className="relative overflow-hidden rounded-2xl" style={{
                  width: 'min(490px, 94vw)',
                  background: 'linear-gradient(160deg,rgba(20,16,6,0.98) 0%,rgba(8,6,2,0.99) 100%)',
                  border: '1px solid rgba(212,175,55,0.28)',
                  boxShadow: '0 0 0 1px rgba(212,175,55,0.06),0 0 60px rgba(212,175,55,0.18),0 24px 80px rgba(0,0,0,0.7)' }}>
                  {/* Global scan-line texture */}
                  <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.012) 0px,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 4px)' }} />
                  {/* Moving scan beam */}
                  <div className="absolute inset-x-0 h-[2px] pointer-events-none z-10" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.45),rgba(255,248,160,0.75),rgba(212,175,55,0.45),transparent)', animation: 'scan-beam 5s ease-in-out infinite' }} />
                  {/* Corner brackets */}
                  {(['tl','tr','bl','br'] as const).map(pos => (
                    <div key={pos} className="absolute w-4 h-4 pointer-events-none z-20" style={{
                      top: pos.startsWith('t') ? 6 : undefined, bottom: pos.startsWith('b') ? 6 : undefined,
                      left: pos.endsWith('l') ? 6 : undefined, right: pos.endsWith('r') ? 6 : undefined,
                      borderTop: pos.startsWith('t') ? '1px solid rgba(212,175,55,0.7)' : undefined,
                      borderBottom: pos.startsWith('b') ? '1px solid rgba(212,175,55,0.5)' : undefined,
                      borderLeft: pos.endsWith('l') ? '1px solid rgba(212,175,55,0.7)' : undefined,
                      borderRight: pos.endsWith('r') ? '1px solid rgba(212,175,55,0.5)' : undefined }} />
                  ))}

                  {/* ── STATUS BAR ── */}
                  <div className="relative z-10 flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)', background: 'rgba(0,0,0,0.25)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(52,211,153,1)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      <span className="text-[8px] font-black uppercase tracking-[0.32em] text-white/35">Live Command Center</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[7px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(52,211,153,0.7)' }}>● ONLINE</span>
                      <span className="text-[7px] text-white/15 font-bold tracking-widest">v 3.0</span>
                    </div>
                  </div>

                  {/* ── MAIN GRID: Left = Live Draws | Right = System Stats ── */}
                  <div className="relative z-10 grid" style={{ gridTemplateColumns: '3fr 2fr', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>

                    {/* LEFT — Live competition cards */}
                    <div className="p-3 space-y-2" style={{ borderRight: '1px solid rgba(212,175,55,0.08)' }}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(244,63,94,1)', boxShadow: '0 0 6px rgba(244,63,94,1)', animation: 'pulse 1.8s ease-in-out infinite' }} />
                        <span className="text-[7px] font-black uppercase tracking-[0.28em] text-white/25">Live Draws</span>
                      </div>
                      {competitions.slice(0, 4).map((comp, i) => {
                        const palette = ['212,175,55','52,211,153','99,179,237','167,139,250'];
                        const rgb = palette[i % palette.length];
                        const pct = [73, 45, 88, 61][i];
                        const price = comp.ticketPrice ? `£${parseFloat(comp.ticketPrice).toFixed(2)}` : '99p';
                        return (
                          <div key={comp.id} className="group relative overflow-hidden rounded-lg cursor-default" style={{ background: `linear-gradient(90deg,rgba(${rgb},0.09),rgba(3,3,10,0.7))`, border: `1px solid rgba(${rgb},0.2)`, transition: 'all 0.2s ease' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(${rgb},0.5)`; (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(${rgb},0.2)`; (e.currentTarget as HTMLElement).style.transform = ''; }}
                          >
                            {/* Left accent bar */}
                            <div className="absolute top-0 left-0 bottom-0 w-[2px]" style={{ background: `linear-gradient(180deg,transparent,rgba(${rgb},1),transparent)` }} />
                            <div className="px-2.5 py-1.5 pl-3.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-[8.5px] font-bold text-white/70 truncate leading-tight flex-1">
                                  {comp.title.replace(/WIN (A )?/i,'').replace(/[–—].*$/,'').replace(/[🎁🎮💷📱⚡🚰]/g,'').trim().slice(0,28)}
                                </div>
                                <div className="text-[9px] font-black flex-shrink-0" style={{ color: `rgb(${rgb})`, textShadow: `0 0 10px rgba(${rgb},0.8)` }}>{price}</div>
                              </div>
                              {/* Progress bar */}
                              <div className="mt-1.5 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,rgba(${rgb},0.5),rgba(${rgb},1))`, boxShadow: `0 0 6px rgba(${rgb},0.6)` }} />
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[6px] text-white/25 font-bold">{comp.type.toUpperCase()}</span>
                                <span className="text-[6px] font-black" style={{ color: `rgba(${rgb},0.5)` }}>{pct}% full</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* RIGHT — Stats panel */}
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(212,175,55,1)', boxShadow: '0 0 6px rgba(212,175,55,1)', animation: 'pulse 2s ease-in-out infinite' }} />
                        <span className="text-[7px] font-black uppercase tracking-[0.28em] text-white/25">System</span>
                      </div>

                      {/* Big counter */}
                      <div className="relative overflow-hidden flex flex-col items-center justify-center py-3 mb-3 rounded-xl" style={{ background: 'linear-gradient(145deg,rgba(212,175,55,0.1),rgba(3,3,10,0.8))', border: '1px solid rgba(212,175,55,0.22)' }}>
                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.018) 0px,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 4px)' }} />
                        <div className="font-black leading-none relative" style={{ fontSize: 32, background: 'linear-gradient(135deg,#f6e5b0,#d4af37,#a87b2c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 14px rgba(212,175,55,0.8))' }}>{competitions.length || 11}</div>
                        <div className="text-[6px] font-black uppercase tracking-[0.25em] text-white/30 mt-1">Active Draws</div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <div className="w-1 h-1 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 5px rgba(52,211,153,1)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                          <span className="text-[6px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(52,211,153,0.7)' }}>Live Now</span>
                        </div>
                      </div>

                      {/* Stat rows */}
                      {[
                        { label: 'Entry from', value: '99p',     rgb: '52,211,153' },
                        { label: 'Support',    value: '24 / 7',  rgb: '99,179,237' },
                        { label: 'Results',    value: 'Instant', rgb: '212,175,55' },
                        { label: 'SSL',        value: 'Secure',  rgb: '167,139,250' },
                      ].map((s, i, arr) => (
                        <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <span className="text-[7px] text-white/28 font-bold">{s.label}</span>
                          <span className="text-[8px] font-black" style={{ color: `rgb(${s.rgb})`, textShadow: `0 0 8px rgba(${s.rgb},0.65)` }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── GAME GRID — 5 game type pills ── */}
                  <div className="relative z-10 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                    <div className="text-[6px] font-black uppercase tracking-[0.28em] text-white/20 mb-2">Available Games</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {gameCards.map((card) => (
                        <div key={card.title} className="relative overflow-hidden flex flex-col items-center justify-center gap-1 py-2 rounded-xl" style={{
                          background: `linear-gradient(145deg,rgba(${card.glowColor},0.12),rgba(3,3,10,0.85))`,
                          border: `1px solid rgba(${card.glowColor},0.28)`,
                          boxShadow: `0 2px 12px rgba(${card.glowColor},0.1)` }}>
                          <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg,transparent,rgba(${card.glowColor},0.8),transparent)` }} />
                          <card.Icon className="w-3.5 h-3.5" style={{ color: `rgb(${card.glowColor})`, filter: `drop-shadow(0 0 5px rgba(${card.glowColor},0.9))` }} />
                          <span className="text-[6px] font-black uppercase text-center leading-tight px-0.5" style={{ color: `rgba(${card.glowColor},0.75)` }}>
                            {card.title.split(' ').pop()}
                          </span>
                          <div className="w-1 h-1 rounded-full" style={{ background: `rgb(${card.glowColor})`, boxShadow: `0 0 5px rgba(${card.glowColor},1)`, animation: `pulse ${1.5 + gameCards.indexOf(card) * 0.3}s ease-in-out infinite` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── TICKER ── */}
                  <div className="relative z-10 flex items-center" style={{ height: 32 }}>
                    <div className="flex-shrink-0 flex items-center gap-1.5 px-3 h-full" style={{ borderRight: '1px solid rgba(212,175,55,0.12)', background: 'rgba(0,0,0,0.2)' }}>
                      <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(52,211,153,1)', boxShadow: '0 0 5px rgba(52,211,153,1)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      <span className="text-[6px] font-black uppercase tracking-[0.25em]" style={{ color: 'rgba(212,175,55,0.7)' }}>Live</span>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                      <div style={{ display: 'flex', gap: '2rem', animation: 'nexus-ticker 22s linear infinite', whiteSpace: 'nowrap', paddingLeft: '1rem' }}>
                        {[...gameCards, ...gameCards].map((card, i) => (
                          <span key={i} className="text-[8px] font-bold" style={{ color: 'rgba(255,255,255,0.38)' }}>
                            <span style={{ color: `rgba(${card.glowColor},0.85)` }}>◆</span>{' '}
                            {card.title}
                            {' — '}
                            <span style={{ color: `rgba(${card.glowColor},0.95)`, fontWeight: 900 }}>{card.prize}</span>
                          </span>
                        ))}
                      </div>
                      <div className="absolute top-0 right-0 bottom-0 w-10 pointer-events-none" style={{ background: 'linear-gradient(90deg,transparent,rgba(8,6,2,0.95))' }} />
                    </div>
                  </div>
                </div>
                {/* ── close HUD outer frame ── */}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          INSTANT GAMES — Futuristic HUD Terminal
      ═══════════════════════════════════════════════════════ */}
      <section id="games-section" className="py-14 sm:py-20 relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#03030a 0%,#060612 100%)' }}>

        {/* ── Grid mesh overlay ── */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(212,175,55,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.06) 1px,transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%,black 40%,transparent 100%)' }} />

        {/* ── Slow horizontal scan beam ── */}
        <div className="absolute inset-x-0 h-px pointer-events-none" style={{
          background: 'linear-gradient(90deg,transparent 0%,rgba(212,175,55,0.55) 40%,rgba(255,248,160,0.9) 50%,rgba(212,175,55,0.55) 60%,transparent 100%)',
          animation: 'scan-beam 7s linear infinite',
          top: 0 }} />

        {/* ── Neon top border ── */}
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent 0%,rgba(212,175,55,0.5) 25%,rgba(255,248,160,0.95) 50%,rgba(212,175,55,0.5) 75%,transparent 100%)' }} />
        <div className="absolute top-0 inset-x-0 h-8 pointer-events-none" style={{ background: 'linear-gradient(180deg,rgba(212,175,55,0.07),transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.15),transparent)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

          {/* ── Section header ── */}
          <div className="text-center mb-12">
            {/* System status pill */}
            <div className="inline-flex items-center gap-3 mb-5 px-4 py-2 rounded-full" style={{
              background: 'rgba(6,6,18,0.8)',
              border: '1px solid rgba(212,175,55,0.18)'
            }}>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map(b => (
                  <div key={b} className="w-1 rounded-full" style={{
                    height: 10 + b * 4,
                    background: `rgba(212,175,55,${0.35 + b * 0.25})`,
                    boxShadow: `0 0 4px rgba(212,175,55,${0.3 + b * 0.2})`,
                    animation: `pulse ${1.2 + b * 0.3}s ease-in-out infinite` }} />
                ))}
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.38em] text-amber-400/60">5 Missions Active</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 10px rgba(52,211,153,1)' }} />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 leading-none">
              Select Your{' '}
              <span style={{ background: 'linear-gradient(135deg,#f8efc0 0%,#f5d76e 30%,#d4af37 60%,#a87b2c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Mission
              </span>
            </h2>
            <p className="text-white/22 text-[11px] font-bold uppercase tracking-[0.28em] mt-2">Instant results · Real prizes · No waiting</p>

            {/* Decorative divider */}
            <div className="flex items-center gap-3 mt-6 max-w-[280px] mx-auto">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.35))' }} />
              <div className="flex gap-1">
                {[0.4, 0.7, 1, 0.7, 0.4].map((o, idx) => (
                  <div key={idx} className="w-0.5 h-0.5 rounded-full" style={{ background: `rgba(212,175,55,${o})` }} />
                ))}
              </div>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,rgba(212,175,55,0.35),transparent)' }} />
            </div>
          </div>

          {/* ── Game cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {gameCards.map((game, i) => (
              <button
                key={i}
                onClick={() => {
                  if (game.id) {
                    setLocation(`/competition/${game.id}`);
                  } else if (game.route) {
                    setLocation(game.route);
                  } else {
                    handleFilterChange(game.filter);
                    setTimeout(scrollToGrid, 100);
                  }
                }}
                className="group relative text-left overflow-hidden"
                data-testid={`button-game-${game.title.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  borderRadius: 16,
                  background: `linear-gradient(160deg,rgba(${game.glowColor},0.12) 0%,rgba(3,3,10,0.96) 60%)`,
                  border: `1px solid rgba(${game.glowColor},0.22)`,
                  boxShadow: `0 2px 20px rgba(0,0,0,0.6)`,
                  transition: 'all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-8px) scale(1.03)';
                  el.style.boxShadow = `0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(${game.glowColor},0.2), 0 0 1px rgba(${game.glowColor},0.6)`;
                  el.style.borderColor = `rgba(${game.glowColor},0.6)`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = '';
                  el.style.boxShadow = `0 2px 20px rgba(0,0,0,0.6)`;
                  el.style.borderColor = `rgba(${game.glowColor},0.22)`;
                }}
              >
                {/* Scan-line texture overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.018) 0px,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 4px)' }} />

                {/* Top neon status bar */}
                <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                  background: `linear-gradient(90deg,transparent 0%,rgba(${game.glowColor},0.95) 40%,rgba(${game.glowColor},1) 50%,rgba(${game.glowColor},0.95) 60%,transparent 100%)`,
                  boxShadow: `0 0 12px rgba(${game.glowColor},0.7)` }} />

                {/* Corner L-brackets */}
                {(['tl','tr','bl','br'] as const).map(pos => (
                  <div key={pos} className="absolute w-3.5 h-3.5 pointer-events-none transition-opacity duration-300 opacity-30 group-hover:opacity-100" style={{
                    top:    pos.startsWith('t') ? 8 : undefined,
                    bottom: pos.startsWith('b') ? 8 : undefined,
                    left:   pos.endsWith('l')   ? 8 : undefined,
                    right:  pos.endsWith('r')   ? 8 : undefined,
                    borderTop:    pos.startsWith('t') ? `1.5px solid rgba(${game.glowColor},1)` : undefined,
                    borderBottom: pos.startsWith('b') ? `1.5px solid rgba(${game.glowColor},1)` : undefined,
                    borderLeft:   pos.endsWith('l')   ? `1.5px solid rgba(${game.glowColor},1)` : undefined,
                    borderRight:  pos.endsWith('r')   ? `1.5px solid rgba(${game.glowColor},1)` : undefined }} />
                ))}

                {/* Shimmer on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{
                  background: 'linear-gradient(110deg,transparent 20%,rgba(255,255,255,0.03) 50%,transparent 80%)',
                  animation: 'shimmer-sweep 2.2s ease-in-out infinite' }} />

                <div className="relative p-4 sm:p-5 flex flex-col" style={{ minHeight: 228 }}>

                  {/* Icon with dual pulse rings */}
                  <div className="relative w-14 h-14 mb-5 shrink-0">
                    {/* Outer ring — pulses on hover */}
                    <div className="absolute -inset-2.5 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none" style={{
                      border: `1px solid rgba(${game.glowColor},0.35)`,
                      animation: 'energy-ring 2s ease-in-out infinite' }} />
                    {/* Mid ring */}
                    <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-70 pointer-events-none" style={{
                      border: `1px solid rgba(${game.glowColor},0.5)`,
                      animation: 'energy-ring 2s ease-in-out infinite 0.5s' }} />
                    {/* Icon glass square */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105" style={{
                      background: `linear-gradient(135deg,rgba(${game.glowColor},0.22) 0%,rgba(${game.glowColor},0.06) 100%)`,
                      border: `1px solid rgba(${game.glowColor},0.4)`,
                      boxShadow: `0 0 24px rgba(${game.glowColor},0.25), inset 0 1px 0 rgba(255,255,255,0.08)` }}>
                      <game.Icon className="w-7 h-7" style={{
                        color: `rgb(${game.glowColor})`,
                        filter: `drop-shadow(0 0 10px rgba(${game.glowColor},0.9))`,
                        transition: 'transform 0.3s' }} />
                    </div>
                  </div>

                  {/* Badge — tech rectangular style */}
                  {game.badge && (
                    <div className="mb-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.22em] rounded" style={{
                        background: `rgba(${game.glowColor},0.12)`,
                        border: `1px solid rgba(${game.glowColor},0.45)`,
                        color: `rgb(${game.glowColor})`,
                        boxShadow: `0 0 8px rgba(${game.glowColor},0.2)` }}>
                        {game.badge === 'HOT' && <Flame className="w-2 h-2" />}
                        {game.badge === 'NEW' && <Sparkles className="w-2 h-2" />}
                        {game.badge}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <div className="font-black text-white text-sm sm:text-[14px] leading-tight mb-1 tracking-wide">{game.title}</div>
                  {/* Desc — uppercase HUD style */}
                  <div className="text-[9px] font-bold text-white/28 flex-1 mb-4 uppercase tracking-[0.18em]">{game.desc}</div>

                  {/* Prize + bar */}
                  <div className="mt-auto space-y-2">
                    <div className="text-[7px] font-black uppercase tracking-[0.28em] text-white/18">Max Win</div>
                    <div className="text-xl sm:text-2xl font-black leading-none" style={{
                      background: game.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: `drop-shadow(0 0 14px rgba(${game.glowColor},0.55))` }}>{game.prize}</div>
                    {/* Neon progress bar */}
                    <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full group-hover:w-full transition-all duration-700" style={{
                        width: '65%',
                        background: `linear-gradient(90deg,rgba(${game.glowColor},1),rgba(${game.glowColor},0.3))`,
                        boxShadow: `0 0 8px rgba(${game.glowColor},0.8)` }} />
                    </div>
                  </div>

                  {/* Play indicator */}
                  <div className="absolute bottom-4 right-4 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full" style={{ background: `rgb(${game.glowColor})`, boxShadow: `0 0 6px rgba(${game.glowColor},1)` }} />
                      <span className="text-[7px] font-black uppercase tracking-[0.2em]" style={{ color: `rgb(${game.glowColor})` }}>Play</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Bottom HUD status bar ── */}
          <div className="mt-8 flex items-center justify-between gap-4 px-5 py-3 rounded-xl" style={{
            background: 'rgba(3,3,10,0.7)',
            border: '1px solid rgba(212,175,55,0.1)'
          }}>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 10px rgba(52,211,153,1)', animation: 'pulse 2s ease-in-out infinite' }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25">All Systems Online</span>
              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                {gameCards.map((g, i) => (
                  <div key={i} className="w-5 h-[3px] rounded-full" style={{ background: `rgba(${g.glowColor},0.7)`, boxShadow: `0 0 5px rgba(${g.glowColor},0.6)` }} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Trophy className="w-3.5 h-3.5" style={{ color: '#d4af37', filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.7))' }} />
              <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider">Prize Pool</span>
              <span className="text-sm font-black" style={{ color: '#f5d76e', textShadow: '0 0 16px rgba(212,175,55,0.6)' }}>£19,500</span>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LIVE ACTIVITY TICKER — real competition titles
      ═══════════════════════════════════════════════════════ */}
      {competitions.length > 0 && (
        <div className="relative overflow-hidden" style={{ background: '#070709', borderTop: '1px solid rgba(16,185,129,0.10)', borderBottom: '1px solid rgba(16,185,129,0.10)' }}>
          <div className="flex items-stretch">
            {/* Live label */}
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 z-10" style={{ background: '#070709', borderRight: '1px solid rgba(16,185,129,0.14)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.9)', animation: 'pulse 2s ease-in-out infinite' }} />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400 whitespace-nowrap">Live Activity</span>
            </div>
            {/* Marquee */}
            <div className="overflow-hidden flex-1">
              <div className="animate-scroll flex gap-10 py-2.5" style={{ width: 'max-content' }}>
                {[...competitions, ...competitions].map((c, i) => (
                  <div key={i} className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-emerald-400 text-[9px]">●</span>
                    <span className="text-white/35 text-[11px] font-medium">New entry —</span>
                    <span className="text-amber-300/75 text-[11px] font-bold">{c.title.replace(/&amp;/g, '&').replace(/[🎁🎄⚡️🎮💷📱🚰🎉🔥]/g, '').trim().slice(0, 45)}</span>
                    <span className="text-white/20 text-[10px]">just now</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TRUST STRIP — Futuristic HUD Panels
      ═══════════════════════════════════════════════════════ */}
      <section className="py-8 relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#060612 0%,#04040e 100%)' }}>
        {/* Grid mesh */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(212,175,55,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.045) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%,black 30%,transparent 100%)' }} />
        {/* Top neon border */}
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.35),transparent)' }} />
        {/* Bottom neon border */}
        <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.18),transparent)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {([
              { icon: Shield,       title: '100% Secure',       sub: 'SSL Encrypted', rgb: '52,211,153',  status: 'VERIFIED'  },
              { icon: CheckCircle2, title: 'Fair & Transparent', sub: 'UK Compliant',  rgb: '212,175,55',  status: 'CERTIFIED' },
              { icon: Zap,          title: 'Instant Results',    sub: 'No Waiting',    rgb: '99,179,237',  status: 'LIVE'      },
              { icon: Users,        title: '24/7 Support',       sub: 'Always Here',   rgb: '167,139,250', status: 'ONLINE'    },
              { icon: Trophy,       title: 'Real Winners',       sub: 'Join Every Day',rgb: '251,191,36',  status: 'ACTIVE'    },
            ] as const).map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl"
                data-testid={`trust-badge-${i}`}
                style={{
                  background: `linear-gradient(145deg,rgba(${item.rgb},0.09) 0%,rgba(3,3,10,0.95) 60%)`,
                  border: `1px solid rgba(${item.rgb},0.2)`,
                  boxShadow: `0 2px 18px rgba(0,0,0,0.55)`,
                  transition: 'all 0.28s ease' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-4px)';
                  el.style.boxShadow = `0 16px 40px rgba(0,0,0,0.65), 0 0 28px rgba(${item.rgb},0.18)`;
                  el.style.borderColor = `rgba(${item.rgb},0.5)`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = '';
                  el.style.boxShadow = `0 2px 18px rgba(0,0,0,0.55)`;
                  el.style.borderColor = `rgba(${item.rgb},0.2)`;
                }}
              >
                {/* Scan-line texture */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.014) 0px,rgba(255,255,255,0.014) 1px,transparent 1px,transparent 4px)' }} />

                {/* Left accent bar */}
                <div className="absolute top-0 left-0 w-[2px] h-full" style={{
                  background: `linear-gradient(180deg,transparent,rgba(${item.rgb},0.9) 40%,rgba(${item.rgb},0.9) 60%,transparent)`,
                  boxShadow: `2px 0 10px rgba(${item.rgb},0.4)` }} />

                {/* Corner brackets */}
                {(['tl','tr','bl','br'] as const).map(pos => (
                  <div key={pos} className="absolute w-2.5 h-2.5 pointer-events-none opacity-25 group-hover:opacity-80 transition-opacity duration-300" style={{
                    top:    pos.startsWith('t') ? 6 : undefined,
                    bottom: pos.startsWith('b') ? 6 : undefined,
                    left:   pos.endsWith('l')   ? 6 : undefined,
                    right:  pos.endsWith('r')   ? 6 : undefined,
                    borderTop:    pos.startsWith('t') ? `1px solid rgba(${item.rgb},1)` : undefined,
                    borderBottom: pos.startsWith('b') ? `1px solid rgba(${item.rgb},1)` : undefined,
                    borderLeft:   pos.endsWith('l')   ? `1px solid rgba(${item.rgb},1)` : undefined,
                    borderRight:  pos.endsWith('r')   ? `1px solid rgba(${item.rgb},1)` : undefined }} />
                ))}

                <div className="relative px-2.5 py-2.5 pl-3.5 sm:px-4 sm:py-4 sm:pl-5">
                  {/* Icon */}
                  <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center mb-1.5 sm:mb-3" style={{
                    background: `linear-gradient(135deg,rgba(${item.rgb},0.2) 0%,rgba(${item.rgb},0.06) 100%)`,
                    border: `1px solid rgba(${item.rgb},0.35)`,
                    boxShadow: `0 0 18px rgba(${item.rgb},0.2)` }}>
                    <item.icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: `rgb(${item.rgb})`, filter: `drop-shadow(0 0 6px rgba(${item.rgb},0.9))` }} />
                  </div>

                  {/* Title + sub */}
                  <div className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-[0.1em] sm:tracking-[0.12em] leading-tight">{item.title}</div>
                  <div className="text-[7px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-[0.08em] sm:tracking-[0.1em]" style={{ color: `rgba(${item.rgb},0.6)` }}>{item.sub}</div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-1 mt-1.5 sm:mt-2.5">
                    <div className="w-1 h-1 rounded-full" style={{
                      background: `rgb(${item.rgb})`,
                      boxShadow: `0 0 5px rgba(${item.rgb},1)`,
                      animation: 'pulse 2s ease-in-out infinite' }} />
                    <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em]" style={{ color: `rgba(${item.rgb},0.55)` }}>{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURED COMPETITIONS CAROUSEL
      ═══════════════════════════════════════════════════════ */}
      {featuredCompetitions.length > 0 && (
  <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0a14 100%)', padding: 'clamp(3rem,5vw,5rem) 0' }}>
    {/* Premium ambient background */}
    <div className="absolute inset-0 pointer-events-none">
      {/* Grid pattern */}
      <div style={{
        backgroundImage: 'linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        position: 'absolute',
        inset: 0
      }} />
      
      {/* Gold glow orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)' }} />
      
      {/* Subtle top and bottom borders */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 50%, transparent 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.2) 50%, transparent 100%)' }} />
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-3 mb-4 px-5 py-2 rounded-full" style={{
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.15)'
        }}>
          <Star className="w-4 h-4" style={{ color: '#FFC400' }} />
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-400">Featured Competitions</span>
          <Star className="w-4 h-4" style={{ color: '#FFC400' }} />
        </div>
        
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-none mb-3" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8efc0 30%, #d4af37 60%, #a87b2c 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 30px rgba(212,175,55,0.3))'
        }}>
          Win Big Today
        </h2>
        
        <p className="text-white/30 text-sm font-medium uppercase tracking-[0.2em]">
          {featuredCompetitions.length} Premium Competition{featuredCompetitions.length !== 1 ? 's' : ''} — Enter Now
        </p>
        
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mt-5 max-w-xs mx-auto">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4))' }} />
          <Diamond className="w-3 h-3 text-amber-400/60" />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.4), transparent)' }} />
        </div>
      </div>

      {/* Carousel */}
      <Slider {...sliderSettings} className="premium-featured-carousel">
        {featuredCompetitions.map((competition) => {
          const max = competition.maxTickets || 0;
          const sold = competition.soldTickets || 0;
          const pct = max > 0 ? Math.min((sold / max) * 100, 100) : 0;
          const left = Math.max(max - sold, 0);
          const almostGone = pct > 85;
          const prizeMatch = competition.title.match(/£[\d,]+/);
          const prizeAmount = prizeMatch ? prizeMatch[0] : null;
          const titleUpper = competition.title.toUpperCase();
          const prizeType = titleUpper.includes('CASH') ? 'CASH'
            : titleUpper.includes('VOUCHER') ? 'VOUCHER'
            : titleUpper.includes('GIFT CARD') ? 'GIFT CARD'
            : titleUpper.includes('HOLIDAY') ? 'HOLIDAY'
            : titleUpper.includes('IPHONE') || titleUpper.includes('PHONE') ? 'SMARTPHONE'
            : titleUpper.includes('PS5') || titleUpper.includes('PLAYSTATION') ? 'GAMING'
            : titleUpper.includes('SINK') || titleUpper.includes('LUX') ? 'LUXURY HOME'
            : prizeAmount ? 'PRIZE' : 'COMPETITION';
          const imgSrc = competition.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200';
          const cleanTitle = competition.title.replace(/&amp;/g, '&').replace(/[🎁🎄⚡️🎮💷📱🚰🎉🔥]/g, '').trim();
          const ticketPrice = competition.ticketPrice ? `£${parseFloat(competition.ticketPrice).toFixed(2)}` : '£0.99';

          // Feature chips based on prize type
          const chips = prizeType === 'CASH' ? [
            { icon: Zap, label: 'Instant Win' },
            { icon: Shield, label: '100% Secure' },
            { icon: Trophy, label: 'Real Prize' },
            { icon: Clock, label: 'Fast Draw' },
          ] : [
            { icon: Star, label: 'Premium Prize' },
            { icon: Shield, label: 'Guaranteed' },
            { icon: Gift, label: 'Real Winner' },
            { icon: Users, label: 'Join Now' },
          ];

          return (
            <div key={competition.id} className="px-2 pb-10">
              <div className="relative rounded-2xl overflow-hidden" style={{
                background: 'linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(10,10,20,0.99) 100%)',
                border: '1px solid rgba(212,175,55,0.2)',
                boxShadow: '0 0 0 1px rgba(212,175,55,0.05), 0 0 80px rgba(0,0,0,0.8), 0 20px 60px rgba(0,0,0,0.9)',
                minHeight: 'clamp(400px, 60vh, 600px)'
              }}>
                
                {/* Gold accent borders */}
                <div className="absolute top-0 left-0 right-0 h-[2px] z-30" style={{ 
                  background: 'linear-gradient(90deg, transparent 0%, #FFC400 20%, #FFE066 50%, #FFC400 80%, transparent 100%)',
                  boxShadow: '0 0 20px rgba(255,196,0,0.5)'
                }} />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] z-30" style={{ 
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,196,0,0.3) 50%, transparent 100%)' 
                }} />

                {/* Corner accents */}
                {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
                  <div key={pos} className="absolute z-30 pointer-events-none" style={{
                    width: 20, height: 20,
                    top: pos.startsWith('t') ? 6 : undefined,
                    bottom: pos.startsWith('b') ? 6 : undefined,
                    left: pos.endsWith('l') ? 6 : undefined,
                    right: pos.endsWith('r') ? 6 : undefined,
                    borderTop: pos.startsWith('t') ? '2px solid rgba(255,196,0,0.7)' : undefined,
                    borderBottom: pos.startsWith('b') ? '2px solid rgba(255,196,0,0.4)' : undefined,
                    borderLeft: pos.endsWith('l') ? '2px solid rgba(255,196,0,0.7)' : undefined,
                    borderRight: pos.endsWith('r') ? '2px solid rgba(255,196,0,0.4)' : undefined,
                  }} />
                ))}

                {/* Main content grid - Left text, Right image */}
                <div className="grid lg:grid-cols-2 h-full">
                  <div className="relative lg:hidden" style={{ height: '500px' }}>
                    <img 
                      src={imgSrc} 
                      alt={competition.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: 'brightness(0.6)' }}
                    />
                   
                  </div>
                  
                  {/* LEFT SIDE - All text and prize details */}
                  <div className="relative z-20 flex flex-col justify-center p-6 sm:p-8 lg:p-10 xl:p-12">
                    {/* HOT badge */}
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider" style={{
                        background: 'linear-gradient(135deg, rgba(220,38,38,0.2), rgba(220,38,38,0.1))',
                        border: '1px solid rgba(220,38,38,0.4)',
                        color: '#ef4444',
                        boxShadow: '0 0 20px rgba(220,38,38,0.2)'
                      }}>
                        <Flame className="w-3 h-3" />
                        {almostGone ? 'ALMOST GONE' : 'HOT COMPETITION'}
                      </span>
                    </div>

                    {/* Prize type label */}
                    <div className="text-amber-400/80 text-xs font-black uppercase tracking-[0.3em] mb-3">
                      {prizeType} PRIZE
                    </div>

                    {/* Prize amount */}
                    {prizeAmount && (
                      <div className="font-black leading-none mb-3" style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                        background: 'linear-gradient(155deg, #fffbe0 0%, #FFC400 30%, #FF8000 60%, #FFC400 85%, #fffbe0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 40px rgba(255,196,0,0.6))',
                        lineHeight: 0.9
                      }}>
                        {prizeAmount}
                      </div>
                    )}

                    {/* Competition title */}
                    <h3 className="font-black text-white uppercase leading-tight mb-2" style={{
                      fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                      textShadow: '0 2px 20px rgba(0,0,0,0.8)'
                    }}>
                      {cleanTitle.length > 50 ? cleanTitle.slice(0, 50) + '...' : cleanTitle}
                    </h3>

                    {/* Competition type badge */}
                    <div className="inline-flex items-center gap-1.5 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ boxShadow: '0 0 8px rgba(255,196,0,0.8)' }} />
                      <span className="text-amber-400/70 text-[10px] font-bold uppercase tracking-wider">
                        {competition.type}
                      </span>
                    </div>

                   {/* Progress bar - Only show for non-instant game types */}
{!['spin', 'pop', 'voltz', 'plinko', 'scratch'].includes(competition.type) && (
  <div className="mb-4 max-w-md">
    <div className="flex items-center justify-between mb-2">
      <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Entries Sold</span>
      <span className="text-amber-400 text-[10px] font-black">{Math.round(pct)}%</span>
    </div>
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{
        width: `${pct}%`,
        background: almostGone 
          ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
          : 'linear-gradient(90deg, #FFC400, #FF7A00)',
        boxShadow: almostGone 
          ? '0 0 12px rgba(239,68,68,0.6)' 
          : '0 0 12px rgba(255,196,0,0.6)'
      }} />
    </div>
  </div>
)}

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-5 max-w-md">
                      <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-lg font-black text-white">{left.toLocaleString()}</div>
                        <div className="text-[9px] font-bold text-white/30 uppercase">Left</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-lg font-black text-amber-400">{ticketPrice}</div>
                        <div className="text-[9px] font-bold text-white/30 uppercase">Per Entry</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-lg font-black text-emerald-400">{max.toLocaleString()}</div>
                        <div className="text-[9px] font-bold text-white/30 uppercase">Total</div>
                      </div>
                    </div>

                    {/* Feature chips */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {chips.map((chip, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{
                          background: 'rgba(212,175,55,0.06)',
                          border: '1px solid rgba(212,175,55,0.15)'
                        }}>
                          <chip.icon className="w-3 h-3 text-amber-400/70" />
                          <span className="text-[10px] font-bold text-white/50 uppercase">{chip.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setLocation(`/competition/${competition.id}`)}
                        className="group relative overflow-hidden px-8 py-3.5 font-black text-sm uppercase tracking-wider rounded-xl border-0 transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          background: 'linear-gradient(135deg, #ffe066 0%, #FFC400 30%, #FF7A00 65%, #FFC400 100%)',
                          boxShadow: '0 8px 32px rgba(255,196,0,0.45), 0 0 0 1px rgba(255,196,0,0.3)',
                          color: '#000'
                        }}
                      >
                        <div className="absolute inset-0 pointer-events-none" style={{
                          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                          animation: 'shimmer-sweep 3s ease-in-out infinite'
                        }} />
                        <span className="relative flex items-center gap-2">
                          ENTER NOW <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>

                      <button
                        onClick={() => setLocation(`/competition/${competition.id}`)}
                        className="px-6 py-3.5 font-bold text-sm rounded-xl transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.6)'
                        }}
                      >
                        Learn More
                      </button>
                    </div>

                    {/* Countdown */}
                    {competition.endDate && (
                      <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-[9px] font-bold text-white/25 uppercase tracking-wider mb-2">Draw Ends In</div>
                        <HeadlineCountdown endDate={competition.endDate} />
                      </div>
                    )}
                  </div>

                  {/* RIGHT SIDE - Full image */}
                  <div className="relative hidden lg:block" style={{ minHeight: '100%' }}>
                    <img 
                      src={imgSrc} 
                      alt={competition.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: 'brightness(0.7)' }}
                    />
                    
                    {/* Gradient overlay for depth */}
                   
                    
                    {/* Side edge glow */}
                    <div className="absolute top-0 left-0 bottom-0 w-20" style={{
                      background: 'linear-gradient(90deg, rgba(10,10,20,0.98) 0%, transparent 100%)'
                    }} />
                    
                    {/* Bottom gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-32" style={{
                      background: 'linear-gradient(0deg, rgba(10,10,20,0.95) 0%, transparent 100%)'
                    }} />

                    {/* Gold shimmer line */}
                    <div className="absolute left-0 top-0 bottom-0 w-[1px]" style={{
                      background: 'linear-gradient(180deg, transparent 0%, rgba(255,196,0,0.6) 50%, transparent 100%)',
                      boxShadow: '0 0 10px rgba(255,196,0,0.3)'
                    }} />
                  </div>

                  {/* Mobile image (shown below text on small screens) */}
                  
                </div>
              </div>
            </div>
          );
        })}
      </Slider>
    </div>

  
  </section>
)}
      {/* ═══════════════════════════════════════════════════════
          OUR COMPETITIONS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 relative" style={{ background: '#070709' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Section header ── */}
          <div className="mb-8">
            {/* Top meta row */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              {/* Live indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
                background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.25)',
              }}>
                <div className="relative flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,1)' }} />
                  <div className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400/20 animate-ping" />
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.22em]">{filteredCompetitions.length} Live Now</span>
              </div>
              {/* Data feed tag */}
              <div className="flex items-center gap-1.5 text-white/20">
                <div className="w-px h-3 bg-white/10" />
                <span className="text-[9px] font-bold uppercase tracking-[0.22em]">Live Data Feed</span>
                <div className="w-1 h-1 rounded-full bg-amber-400/60" style={{ animation: 'icon-spin-pop 2s ease-in-out infinite' }} />
              </div>
            </div>

            {/* Giant headline */}
            <div className="relative">
              {/* Background glow behind text */}
              <div className="absolute -inset-4 pointer-events-none" style={{
                background: 'radial-gradient(ellipse 60% 60% at 30% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)',
              }} />

              <div className="relative flex items-end gap-4 flex-wrap">
                <div>
                  <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.35em] mb-1.5" style={{ color: 'rgba(212,175,55,0.55)' }}>
                    ── MISSION BOARD ──
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black uppercase leading-none" style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f6e5b0 40%, #d4af37 70%, #a87b2c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.02em',
                    filter: 'drop-shadow(0 0 28px rgba(212,175,55,0.25))',
                  }}>
                    Our Competitions
                  </h2>
                </div>
                {/* Vertical accent bar */}
                <div className="hidden sm:block self-stretch w-px" style={{
                  background: 'linear-gradient(180deg, transparent, rgba(212,175,55,0.6), transparent)',
                  marginBottom: '4px',
                }} />
                {/* Stat block */}
                <div className="hidden sm:flex flex-col gap-0.5 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">Active Prizes</span>
                  <span className="text-2xl font-black leading-none" style={{ color: '#f5d76e', textShadow: '0 0 20px rgba(212,175,55,0.5)' }}>
                    {filteredCompetitions.length}
                  </span>
                </div>
              </div>

              {/* Bottom rule */}
              <div className="mt-4 h-px" style={{
                background: 'linear-gradient(90deg, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0.25) 30%, transparent 70%)',
              }} />
            </div>
          </div>

          {/* ── Filter tabs ── */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: "all",     label: "All",          icon: Trophy,    accent: "245,215,110" },
              { id: "instant", label: "Competitions",  icon: Gift,      accent: "245,215,110" },
              { id: "spin",    label: "Spin",          icon: RotateCw,  accent: "255,184,0"   },
              { id: "scratch", label: "Scratch",       icon: Sparkles,  accent: "52,211,153"  },
              { id: "plinko",  label: "Plinko",        icon: Circle,    accent: "192,132,252" },
              { id: "voltz",   label: "Voltz",         icon: Zap,       accent: "96,165,250"  },
              { id: "pop",     label: "Pop",           icon: Target,    accent: "251,113,133" },
            ].map((f) => {
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => handleFilterChange(f.id)}
                  className="relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-[0.16em] transition-all duration-200"
                  data-testid={`button-filter-${f.id}`}
                  style={active ? {
                    background: `linear-gradient(135deg,rgba(${f.accent},0.18),rgba(${f.accent},0.06))`,
                    color: `rgb(${f.accent})`,
                    border: `1px solid rgba(${f.accent},0.5)`,
                    boxShadow: `0 0 16px rgba(${f.accent},0.2), inset 0 1px 0 rgba(${f.accent},0.15)`,
                  } : {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  {active && (
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: `radial-gradient(ellipse 80% 80% at 50% 50%, rgba(${f.accent},0.08) 0%, transparent 100%)`,
                    }} />
                  )}
                  <f.icon className="w-3 h-3 relative flex-shrink-0" />
                  <span className="relative">{f.label}</span>
                  {active && <div className="absolute bottom-0 left-3 right-3 h-px" style={{ background: `rgba(${f.accent},0.6)` }} />}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div id="competitions-grid">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="w-10 h-10 border-2 border-amber-400/20 border-t-amber-400 rounded-full mx-auto mb-4 animate-spin" />
                <p className="text-white/25 text-sm font-medium">Loading prizes...</p>
              </div>
            ) : filteredCompetitions.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredCompetitions.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} authenticated={isAuthenticated} />
                ))}
              </div>
            ) : (
              (() => {
                const gameMatch = gameCards.find(g => g.filter === activeFilter);
                if (gameMatch) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 gap-6">
                      <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: `linear-gradient(135deg,rgba(${gameMatch.glowColor},0.18),rgba(${gameMatch.glowColor},0.06))`,
                        border: `1.5px solid rgba(${gameMatch.glowColor},0.4)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 0 30px rgba(${gameMatch.glowColor},0.25)`,
                      }}>
                        <gameMatch.Icon style={{ width: 32, height: 32, color: `rgb(${gameMatch.glowColor})` }} />
                      </div>
                      <div className="text-center">
                        <div className="text-white font-black text-xl mb-2">{gameMatch.title}</div>
                        <p className="text-white/45 text-sm mb-6 max-w-xs">
                          {gameMatch.route
                            ? `${gameMatch.desc} — play instantly, no entry needed!`
                            : `${gameMatch.desc} — purchase entries to unlock this game.`}
                        </p>
                        {gameMatch.route ? (
                          <button
                            onClick={() => setLocation(gameMatch.route)}
                            style={{
                              padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
                              background: `linear-gradient(135deg, rgba(${gameMatch.glowColor},0.9), rgba(${gameMatch.glowColor},0.6))`,
                              color: "#fff", fontSize: 13, fontWeight: 900,
                              letterSpacing: "0.1em", textTransform: "uppercase",
                              boxShadow: `0 6px 24px rgba(${gameMatch.glowColor},0.4)`,
                            }}
                          >
                            PLAY {gameMatch.title.toUpperCase()} NOW →
                          </button>
                        ) : (
                          <div style={{
                            padding: "10px 22px", borderRadius: 10,
                            border: `1px solid rgba(${gameMatch.glowColor},0.3)`,
                            color: `rgba(${gameMatch.glowColor},0.7)`,
                            fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase",
                          }}>
                            COMING SOON — Check back soon!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="text-center py-20">
                    <Gift className="w-14 h-14 text-white/5 mx-auto mb-4" />
                    <p className="text-white/20 text-lg">No competitions found.</p>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </section>

      

      {/* ═══════════════════════════════════════════════════════
          VIP NEWSLETTER (authenticated only)
      ═══════════════════════════════════════════════════════ */}
      {isAuthenticated && (
        <section className="py-16 sm:py-20 relative overflow-hidden" style={{ background: '#070709' }}>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.10),transparent)' }} />
          </div>
          <div ref={newsletterSection.ref} className={`max-w-lg mx-auto px-4 text-center transition-all duration-700 ${newsletterSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-[11px] font-black uppercase tracking-widest">VIP Access</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
              {user?.receiveNewsletter ? "You're VIP ✓" : "Get VIP Access"}
            </h3>
            <p className="text-white/25 text-sm mb-8">
              {user?.receiveNewsletter ? "You'll be first to hear about exclusive drops and prizes." : "Early access to new prizes, exclusive offers, and insider tips."}
            </p>
            {user?.receiveNewsletter ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-400 p-3.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium text-sm break-all">Subscribed with {user.email}</span>
                </div>
                <Button type="button" onClick={() => newsletterUnsubscribeMutation.mutate()} variant="ghost" className="w-full h-10 text-white/15 hover:text-red-400 font-medium text-sm rounded-xl transition-all" disabled={newsletterUnsubscribeMutation.isPending} data-testid="button-newsletter-unsubscribe">
                  {newsletterUnsubscribeMutation.isPending ? <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /> : "Unsubscribe"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubscribe} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15" />
                    <Input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder={user?.email || "your@email.com"} className="w-full text-white placeholder:text-white/15 h-12 pl-10 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} data-testid="input-newsletter-email" disabled={newsletterSubscribeMutation.isPending} />
                  </div>
                  <Button type="submit" className="h-12 px-6 text-black font-black rounded-xl transition-all hover:scale-[1.03]" style={{ background: 'linear-gradient(135deg,#f6e5b0 0%,#d4af37 45%,#a87b2c 100%)' }} disabled={newsletterSubscribeMutation.isPending} data-testid="button-newsletter-subscribe">
                    {newsletterSubscribeMutation.isPending ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : "Join VIP"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      

      <CompactFacebookCTA />
      <Testimonials />
      <FAQ />
      <Footer />

      {/* Global animations */}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-110vh) scale(1.4); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes scan-beam {
          0%, 100% { top: 0%; }
          50% { top: 98%; }
        }
        @keyframes nexus-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes energy-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes icon-spin-pop {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.15) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
        @keyframes fc-float {
          0%, 100% { transform: perspective(500px) rotateY(-8deg) rotateX(3deg) translateY(0); }
          50% { transform: perspective(500px) rotateY(-8deg) rotateX(3deg) translateY(-6px); }
        }
      `}</style>
    </div>
  );
}