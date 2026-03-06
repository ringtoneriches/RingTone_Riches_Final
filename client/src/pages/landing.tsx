import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import StatsBanner from "@/components/stats-banner";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import { Sparkles, Trophy, Zap, Shield, Lock, Star, Gift, CreditCard, CheckCircle, ChevronRight, Award, Crown, Coins, RotateCw, Ticket, MapPin, Users, Clock, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/herosection.png";

const RECENT_WINNERS = [
  { name: "Sarah M.", prize: "£500 Cash", location: "Manchester" },
  { name: "James T.", prize: "£250 Voucher", location: "London" },
  { name: "Emily R.", prize: "£1,000 Cash", location: "Birmingham" },
  { name: "Daniel W.", prize: "iPhone 16 Pro", location: "Leeds" },
  { name: "Sophie H.", prize: "£750 Cash", location: "Bristol" },
  { name: "Oliver K.", prize: "PS5 Bundle", location: "Liverpool" },
  { name: "Charlotte B.", prize: "£300 Cash", location: "Edinburgh" },
  { name: "Harry P.", prize: "£2,000 Cash", location: "Glasgow" },
  { name: "Amelia F.", prize: "MacBook Air", location: "Cardiff" },
  { name: "George N.", prize: "£150 Cash", location: "Newcastle" },
  { name: "Lucy D.", prize: "£500 Cash", location: "Sheffield" },
  { name: "Jack S.", prize: "£100 Voucher", location: "Nottingham" },
];

const WINNERS_SHOWCASE = [
  { name: "Rebecca L.", prize: "£5,000 Cash", location: "London", timeAgo: "2 days ago", avatar: "RL" },
  { name: "Thomas G.", prize: "£2,500 Cash", location: "Manchester", timeAgo: "3 days ago", avatar: "TG" },
  { name: "Megan C.", prize: "iPhone 16 Pro Max", location: "Birmingham", timeAgo: "5 days ago", avatar: "MC" },
  { name: "William A.", prize: "£1,000 Cash", location: "Liverpool", timeAgo: "1 week ago", avatar: "WA" },
  { name: "Jessica H.", prize: "MacBook Pro", location: "Edinburgh", timeAgo: "1 week ago", avatar: "JH" },
  { name: "Ryan O.", prize: "£3,000 Cash", location: "Bristol", timeAgo: "2 weeks ago", avatar: "RO" },
];

function LiveWinnerTicker() {
  return (
    <div className="relative overflow-hidden py-3" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.03) 50%, rgba(212,175,55,0.06) 100%)", borderBottom: "1px solid rgba(212,175,55,0.12)" }} data-testid="section-winner-ticker">
      <div className="flex items-center gap-2 px-4 mb-0">
        <div className="flex-shrink-0 flex items-center gap-1.5 pr-3" style={{ borderRight: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="relative">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap">Recent Winners</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex animate-marquee gap-8 whitespace-nowrap">
            {[...RECENT_WINNERS, ...RECENT_WINNERS].map((winner, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs text-white/60" data-testid={`ticker-winner-${i}`}>
                <Trophy className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="font-semibold text-white/80" data-testid={`ticker-winner-name-${i}`}>{winner.name}</span>
                <span>won</span>
                <span className="font-bold" style={{ background: 'linear-gradient(90deg, #d4af37, #f5d76e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} data-testid={`ticker-winner-prize-${i}`}>{winner.prize}</span>
                <span className="text-white/30">from {winner.location}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const getNextDraw = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(next.getHours() + 1 + Math.floor(Math.random() * 3));
      next.setMinutes(0);
      next.setSeconds(0);
      return next;
    };

    let target = getNextDraw();

    const tick = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        target = getNextDraw();
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

function useOnlineCounter() {
  const [count, setCount] = useState(247);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  return Math.max(180, count);
}

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

export default function Landing() {
  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });
  const [, setLocation] = useLocation()

  const [activeFilter, setActiveFilter] = useState("all");
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user: User | null };

  const filteredCompetitions = useMemo(() => {
    if (activeFilter === "all") {
      return competitions;
    }
    return competitions.filter(comp => comp.type === activeFilter);
  }, [competitions, activeFilter]);

  const handleFilterChange = (filterType: string) => {
    setActiveFilter(filterType);
  };

  function redirectToRegister() {
   setLocation("/register")
  }

  const countdown = useCountdown();
  const onlineCount = useOnlineCounter();

  const whySection = useInView();
  const winnersSection = useInView();
  const howSection = useInView();
  const newsletterSection = useInView();

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#070709" }}>
      <Header />

      <section className="relative min-h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "#070709" }}>
        <div className="absolute inset-0 pointer-events-none">
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,7,9,0.6) 0%, rgba(7,7,9,0.4) 30%, rgba(7,7,9,0.8) 65%, #070709 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(212,175,55,0.1) 0%, transparent 55%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 60%, rgba(212,175,55,0.04) 0%, transparent 50%)" }} />

          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }} />

          <div className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)', animation: "float-particle 6s ease-in-out infinite" }} />
          <div className="absolute top-[50%] right-[8%] w-56 h-56 rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(245,215,110,0.06) 0%, transparent 70%)', animation: "float-particle 7s ease-in-out infinite", animationDelay: "2s" }} />
          <div className="absolute bottom-[20%] left-[20%] w-64 h-64 rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(245,215,110,0.04) 0%, transparent 70%)', animation: "float-particle 8s ease-in-out infinite", animationDelay: "4s" }} />
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                background: i % 3 === 0 ? 'rgba(245,215,110,0.4)' : 'rgba(212,175,55,0.5)',
                top: `${15 + (i * 10)}%`,
                left: `${10 + (i * 12)}%`,
                animation: `float-particle ${4 + (i * 0.5)}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>

        <LiveWinnerTicker />

        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:pt-0 sm:py-8">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

              <div className="text-center lg:text-left order-2 lg:order-1">
                <div className="mb-6">
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300/70 text-xs font-medium uppercase tracking-wider">Premium Prize Platform</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }} data-testid="badge-online-count">
                      <div className="relative">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                      </div>
                      <span className="text-emerald-400 text-xs font-bold">{onlineCount} playing now</span>
                    </div>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] mb-4">
                    <span className="text-white" style={{ textShadow: '0 0 60px rgba(255,255,255,0.06)' }}>PLAY.</span>
                    <br />
                    <span className="animate-text-shimmer" style={{ backgroundImage: "linear-gradient(110deg, #b8860b 0%, #d4af37 25%, #f5d76e 35%, #fff 50%, #f5d76e 65%, #d4af37 75%, #b8860b 100%)", backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: 'drop-shadow(0 0 25px rgba(212,175,55,0.3))' }}>WIN.</span>
                    <br />
                    <span className="text-white" style={{ textShadow: '0 0 60px rgba(255,255,255,0.06)' }}>CELEBRATE.</span>
                  </h1>

                  <p className="text-lg sm:text-xl text-white/40 max-w-md mx-auto lg:mx-0">
                    Spin the wheel, scratch to reveal, or win instantly. Over <span className="font-bold" style={{ background: 'linear-gradient(90deg, #d4af37, #f5d76e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))' }}>£50,000</span> in prizes this month.
                  </p>
                </div>

                <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-sm mb-6" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }} data-testid="badge-countdown">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300/70 text-xs font-bold uppercase tracking-wider">Next Draw In</span>
                  <div className="flex items-center gap-1 font-mono">
                    {[
                      String(countdown.hours).padStart(2, '0'),
                      String(countdown.minutes).padStart(2, '0'),
                      String(countdown.seconds).padStart(2, '0')
                    ].map((val, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="inline-block min-w-[28px] text-center px-1.5 py-0.5 rounded text-sm font-black text-white" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}>{val}</span>
                        {i < 2 && <span className="text-amber-400/30 text-xs font-bold">:</span>}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
                  {[
                    { Icon: RotateCw, label: "Spin & Win", color: "rgba(212,175,55,0.1)", borderColor: "rgba(212,175,55,0.2)", textColor: "#d4af37", filter: "spin" },
                    { Icon: Ticket, label: "Scratch Cards", color: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.2)", textColor: "#34d399", filter: "scratch" },
                    { Icon: Zap, label: "Instant Wins", color: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", textColor: "#f87171", filter: "instant" }
                  ].map((game, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
                      style={{ background: game.color, border: `1px solid ${game.borderColor}`, color: game.textColor }}
                      data-testid={`pill-game-${game.filter}`}
                      onClick={() => {
                        handleFilterChange(game.filter);
                        setTimeout(() => {
                          document.getElementById("competitions-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 100);
                      }}
                    >
                      <game.Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{game.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Button
                    onClick={redirectToRegister}
                    className="group relative h-14 px-10 text-lg font-black rounded-full border-0 transition-all duration-500 hover:scale-[1.03] no-default-hover-elevate no-default-active-elevate overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #f5d742 0%, #d4af37 40%, #b8860b 100%)",
                      color: "#0a0a0a",
                      boxShadow: "0 0 50px rgba(212,175,55,0.35), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)"
                    }}
                    data-testid="button-hero-play"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: '0 0 80px rgba(212,175,55,0.6), inset 0 1px 0 rgba(255,255,255,0.35)' }} />
                    <span className="flex items-center gap-2 relative z-10">
                      <Gift className="w-5 h-5" />
                      Start Winning
                      <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleFilterChange("all");
                      setTimeout(() => {
                        document.getElementById("competitions-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 100);
                    }}
                    className="h-14 px-8 text-base font-semibold rounded-full backdrop-blur-sm transition-all duration-500 hover:scale-[1.02]"
                    style={{
                      color: 'rgba(212,175,55,0.7)',
                      border: '1px solid rgba(212,175,55,0.15)',
                      background: 'rgba(212,175,55,0.03)',
                    }}
                    data-testid="button-hero-browse"
                  >
                    View All Prizes
                  </Button>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-6 mt-8">
                  {[
                    { value: "£50K+", label: "Monthly Prizes", icon: Coins },
                    { value: "1,000+", label: "Winners", icon: Trophy },
                    { value: "99p", label: "From Only", icon: Ticket }
                  ].map((stat, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)", border: "1px solid rgba(212,175,55,0.2)", boxShadow: '0 0 15px rgba(212,175,55,0.06)' }}>
                        <stat.icon className="w-5 h-5 text-amber-400/80" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-white" data-testid={`text-stat-value-${index}`} style={{ textShadow: index === 0 ? '0 0 15px rgba(212,175,55,0.2)' : undefined }}>{stat.value}</div>
                        <div className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center justify-center order-1 lg:order-2">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-[120px]" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 60%)" }} />
                </div>

                <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
                  <div className="absolute -inset-6 rounded-3xl blur-3xl" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 60%)" }} />

                  <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.25)', boxShadow: "0 0 80px rgba(212,175,55,0.12), 0 25px 50px rgba(0,0,0,0.5), 0 0 1px rgba(212,175,55,0.5)" }}>
                    <img
                      src="/attached_assets/trophy_winner_celebration_moment.png"
                      alt="Win Amazing Prizes"
                      className="w-full h-auto object-cover"
                    />

                    <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(to top, rgba(7,7,9,0.95), rgba(7,7,9,0.6), transparent)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
                          </div>
                          <span className="text-emerald-400 text-sm font-bold tracking-wide">LIVE NOW</span>
                        </div>
                        <span className="text-white/60 text-sm font-medium">From 99p per entry</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 py-6" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }} data-testid="section-trust-bar">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { icon: Shield, text: "SSL Secure" },
              { icon: CheckCircle, text: "Verified Fair" },
              { icon: Coins, text: "Instant Payouts" },
              { icon: MapPin, text: "UK Based" }
            ].map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-white/20 hover:text-amber-400/50 transition-all duration-300 group cursor-default" data-testid={`badge-trust-${index}`}>
                <badge.icon className="w-4 h-4 group-hover:drop-shadow-[0_0_6px_rgba(212,175,55,0.3)] transition-all duration-300" />
                <span className="text-xs font-semibold uppercase tracking-wider">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden" style={{ backgroundColor: "#070709" }}>
        <div className="container mx-auto px-0 py-0">
          {competitions.length > 0 ? (
            <FeaturedCompetitions competitions={competitions} />
          ) : (
            <div className="text-center text-white/40 py-12">
              <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading amazing prizes...</p>
            </div>
          )}
        </div>
      </section>

      <StatsBanner />

      <section className="py-10 md:py-14 relative overflow-hidden" style={{ backgroundColor: "#070709", borderBottom: '1px solid rgba(212,175,55,0.06)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 60%)' }} />
        <div ref={whySection.ref} className={`container mx-auto px-4 relative z-10 transition-all duration-1000 ${whySection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-black mb-3">
              <span style={{ background: "linear-gradient(90deg, #b8860b, #d4af37, #f5d76e, #d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Why RingTone Riches?
              </span>
            </h2>
            <p className="text-white/30 text-sm md:text-base">
              Your trusted platform for fair and exciting competitions
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                icon: Shield,
                title: "100% Secure",
                description: "Your data and payments are protected with bank-level encryption",
                accent: "#10b981"
              },
              {
                icon: CheckCircle,
                title: "Fair Play Guaranteed",
                description: "Every entry has an equal chance - completely random selection",
                accent: "#d4af37"
              },
              {
                icon: Lock,
                title: "Safe Payments",
                description: "Trusted payment partners - your money is always secure",
                accent: "#d4af37"
              },
              {
                icon: Star,
                title: "Quick Results",
                description: "No waiting - discover your results immediately after playing",
                accent: "#f59e0b"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl p-5 md:p-7 text-center group transition-all duration-500 hover:-translate-y-2"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${feature.accent}20, ${feature.accent}08)`, border: `1px solid ${feature.accent}30`, boxShadow: `0 0 20px ${feature.accent}10` }}>
                    <feature.icon className="w-7 h-7 md:w-8 md:h-8" style={{ color: feature.accent }} />
                  </div>
                </div>
                <h3 className="text-sm md:text-base font-black text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-[10px] md:text-xs text-white/30 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-40 backdrop-blur-2xl" style={{
        background: 'rgba(7,7,9,0.92)',
        borderBottom: '1px solid rgba(0,255,136,0.08)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(0,255,136,0.05)',
      }}>
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {[
              { id: "all", label: "All Games", icon: Trophy, color: '#00ff88', glow: 'rgba(0,255,136,0.3)' },
              { id: "spin", label: "Spin to Win", icon: RotateCw, color: '#ffb800', glow: 'rgba(245,158,11,0.3)' },
              { id: "scratch", label: "Scratch Cards", icon: Sparkles, color: '#00ff88', glow: 'rgba(0,255,136,0.3)' },
              { id: "instant", label: "Competitions", icon: Gift, color: '#f5d76e', glow: 'rgba(245,215,110,0.3)' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-400 flex items-center gap-2`}
                style={activeFilter === filter.id ? {
                  background: `linear-gradient(135deg, ${filter.color}, ${filter.color}cc)`,
                  color: '#0a0a0a',
                  boxShadow: `0 0 25px ${filter.glow}, 0 0 50px ${filter.glow}, 0 2px 8px rgba(0,0,0,0.3)`,
                  border: `1px solid ${filter.color}`,
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
                }}
                data-testid={`button-filter-${filter.id}`}
              >
                <filter.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="competitions-grid" className="py-16 sm:py-24 relative overflow-hidden" style={{ backgroundColor: "#070709" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,255,136,0.03), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(245,215,110,0.02), transparent)' }} />
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(0,255,136,0.08) 30%, rgba(245,215,110,0.12) 50%, rgba(0,255,136,0.08) 70%, transparent 95%)' }} />

        <div className="container mx-auto px-4 relative z-10">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full mx-auto mb-4 animate-spin" />
              <p className="text-white/30 text-base font-medium">Loading prizes...</p>
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className="text-center py-20">
              <Gift className="w-16 h-16 text-white/5 mx-auto mb-4" />
              <p className="text-white/20 text-xl">No competitions found.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-10 md:mb-14">
                <div className="flex items-center justify-center gap-3 mb-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(0,255,136,0.12), rgba(245,215,110,0.08))',
                    border: '1px solid rgba(0,255,136,0.25)',
                    boxShadow: '0 0 20px rgba(0,255,136,0.1)',
                  }}>
                    {activeFilter === "spin" ? <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ffb800', filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }} /> :
                     activeFilter === "scratch" ? <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#00ff88', filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.6))' }} /> :
                     activeFilter === "instant" ? <Gift className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#f5d76e', filter: 'drop-shadow(0 0 6px rgba(245,215,110,0.6))' }} /> :
                     <Trophy className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#00ff88', filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.6))' }} />}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
                    background: 'rgba(0,255,136,0.06)',
                    border: '1px solid rgba(0,255,136,0.2)',
                  }}>
                    <div className="relative">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.8)' }} />
                      <div className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping" style={{ background: '#00ff88' }} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: '#00ff88' }}>{filteredCompetitions.length} Live</span>
                  </div>
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-3 tracking-tight" style={{
                  background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 25%, #f5d76e 50%, #d4af37 75%, #b8860b 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.3))',
                }} data-testid="text-section-title">
                  {activeFilter === "all"
                    ? "All Competition Prizes"
                    : activeFilter === "spin"
                    ? "Spin & Win Games"
                    : activeFilter === "scratch"
                    ? "Scratch Card Games"
                    : "Live Competitions"}
                </h2>
                <div className="w-24 h-[2px] mx-auto mb-4" style={{
                  background: 'linear-gradient(90deg, transparent, #d4af37, #00ff88, #d4af37, transparent)',
                  boxShadow: '0 0 8px rgba(212,175,55,0.4)',
                }} />
                <p className="text-white/50 text-sm md:text-base font-medium max-w-lg mx-auto">
                  {activeFilter === "all"
                    ? "Explore our collection of premium prize competitions"
                    : activeFilter === "spin"
                    ? "Spin the wheel for instant prizes"
                    : activeFilter === "scratch"
                    ? "Scratch and reveal your winning prize"
                    : "Enter now for your chance to win big"}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredCompetitions.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-16 md:py-24 relative overflow-hidden" style={{ backgroundColor: "#070709", borderTop: '1px solid rgba(212,175,55,0.06)' }} data-testid="section-winners-showcase">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 60%)' }} />
        </div>

        <div ref={winnersSection.ref} className={`container mx-auto px-4 relative z-10 transition-all duration-1000 ${winnersSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-5 backdrop-blur-sm" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Real Winners</span>
            </div>
            <h2 className="text-2xl md:text-5xl font-black mb-4">
              <span style={{ background: "linear-gradient(90deg, #b8860b, #d4af37, #f5d76e, #d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Our Winners Showcase
              </span>
            </h2>
            <p className="text-white/25 text-sm md:text-base max-w-xl mx-auto">
              Join hundreds of winners who have already claimed amazing prizes
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {WINNERS_SHOWCASE.map((winner, index) => (
              <div
                key={index}
                className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2"
                data-testid={`card-winner-${index}`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(212,175,55,0.06), transparent 70%)' }} />
                <div className="relative p-5 md:p-7 rounded-2xl transition-all duration-500" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-[#0a0a0a] font-black text-xs flex-shrink-0" style={{ background: "linear-gradient(135deg, #d4af37, #f5d76e)", boxShadow: "0 0 20px rgba(212,175,55,0.2)" }}>
                      {winner.avatar}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate" data-testid={`text-winner-name-${index}`}>{winner.name}</h4>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-white/25 flex-shrink-0" />
                        <span className="text-xs text-white/25 truncate">{winner.location}</span>
                      </div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" style={{ filter: 'drop-shadow(0 0 3px rgba(212,175,55,0.3))' }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-3" style={{ borderTop: '1px solid rgba(212,175,55,0.06)' }}>
                    <span className="font-black text-sm md:text-base" style={{ background: "linear-gradient(90deg, #d4af37, #f5d76e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.3))' }} data-testid={`text-winner-prize-${index}`}>{winner.prize}</span>
                    <span className="text-white/15 text-xs flex-shrink-0">{winner.timeAgo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 relative overflow-hidden" style={{ backgroundColor: "#070709", borderTop: '1px solid rgba(212,175,55,0.06)' }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 60%)' }} />

        <div ref={howSection.ref} className={`container mx-auto px-4 relative z-10 transition-all duration-1000 ${howSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl md:text-5xl font-black text-center mb-4">
            <span style={{ background: "linear-gradient(90deg, #b8860b, #d4af37, #f5d76e, #d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              How to Play & Win
            </span>
          </h2>
          <p className="text-center text-white/25 text-sm md:text-base mb-10 md:mb-14">
            Three simple steps to start winning amazing prizes!
          </p>

          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Sign Up", desc: "Quick registration - just email and password", icon: Users },
              { step: "2", title: "Choose & Play", desc: "Browse prizes and play your favourite game", icon: Gift },
              { step: "3", title: "Win!", desc: "Get instant results and claim your prizes", icon: Trophy }
            ].map((item, index) => (
              <div key={index} className="text-center space-y-3 md:space-y-4 group hover:scale-105 transition-all duration-500" data-testid={`step-${item.step}`}>
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full mx-auto flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500" style={{ background: "linear-gradient(135deg, #d4af37, #f5d76e)", boxShadow: "0 0 35px rgba(212,175,55,0.25), 0 8px 20px rgba(0,0,0,0.3)" }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                  <span className="relative text-xl md:text-3xl font-black text-[#0a0a0a]">{item.step}</span>
                </div>
                <div className="flex justify-center">
                  <item.icon className="w-6 h-6 md:w-8 md:h-8 text-white/25 group-hover:text-amber-400 transition-colors duration-500" />
                </div>
                <h3 className="text-sm md:text-xl font-black text-white">{item.title}</h3>
                <p className="text-[10px] md:text-sm text-white/25 leading-relaxed px-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14" style={{ backgroundColor: "#070709", borderTop: '1px solid rgba(16,185,129,0.1)' }}>
        <div className="container mx-auto px-4 text-center">
          <Lock className="w-10 h-10 md:w-12 md:h-12 text-emerald-500 mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.3))' }} />
          <h3 className="text-xl md:text-3xl font-black mb-3 md:mb-4">
            <span style={{ background: "linear-gradient(90deg, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Your Payments Are 100% Secure
            </span>
          </h3>
          <p className="text-white/30 text-sm md:text-base mb-6 max-w-2xl mx-auto">
            We use industry-leading payment providers with bank-level encryption. Your financial information is never stored on our servers.
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-5">
            {[
              { icon: Lock, text: "SSL Encrypted" },
              { icon: CreditCard, text: "Secure Checkout" },
              { icon: CheckCircle, text: "PCI Compliant" },
              { icon: Shield, text: "Fraud Protection" }
            ].map((badge, i) => (
              <div key={i} className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 text-white/60 transition-all duration-300 hover:-translate-y-0.5" style={{ backgroundColor: "rgba(16,185,129,0.06)", border: '1px solid rgba(16,185,129,0.15)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <badge.icon className="w-4 h-4 text-emerald-400" />
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 relative overflow-hidden" style={{ backgroundColor: "#070709", borderTop: '1px solid rgba(212,175,55,0.06)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[180px]" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 60%)' }} />
        <div ref={newsletterSection.ref} className={`container mx-auto px-4 text-center relative z-10 transition-all duration-1000 ${newsletterSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-amber-400 mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.4))' }} />
          <h2 className="text-2xl md:text-5xl font-black mb-3 md:mb-4">
            <span style={{ background: "linear-gradient(90deg, #b8860b, #d4af37, #f5d76e, #d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Get Exclusive Offers!
            </span>
          </h2>
          <p className="text-white/25 text-sm md:text-base mb-8 md:mb-10 max-w-xl mx-auto">
             Enter your email to receive our latest news, updates, and offers by email and SMS!
          </p>

          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <input
                type="email"
                placeholder="Enter your email..."
                className="flex-1 h-12 md:h-14 px-4 md:px-6 rounded-xl text-white text-sm md:text-base transition-all duration-300 outline-none"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                data-testid="input-newsletter-email"
              />
              <Button
                className="h-12 md:h-14 px-6 md:px-8 rounded-xl font-black text-sm md:text-base no-default-hover-elevate no-default-active-elevate transition-all duration-500 hover:scale-[1.03]"
                style={{
                  background: "linear-gradient(135deg, #f5d742 0%, #d4af37 50%, #b8860b 100%)",
                  color: "#0a0a0a",
                  boxShadow: "0 0 25px rgba(212,175,55,0.25), 0 2px 8px rgba(0,0,0,0.2)"
                }}
                onClick={redirectToRegister}
                data-testid="button-newsletter-subscribe"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-text-shimmer {
          background-image: linear-gradient(110deg, #b8860b 0%, #d4af37 25%, #f5d76e 35%, #fff 50%, #f5d76e 65%, #d4af37 75%, #b8860b 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: text-shimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}