import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import StatsBanner from "@/components/stats-banner";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import { Sparkles, Trophy, Zap, Gift, Mail, CheckCircle2, Shield, Award, Star, ChevronRight, Crown, Wallet, RotateCw, Ticket, Coins, Play, TrendingUp, Flame, PartyPopper, Circle, Target, TicketCheck, Clock, Users, MapPin, Diamond, Gem } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PremiumFacebookEngagement from "@/components/PremiumFacebookEngagement";
import CompactFacebookCTA from "@/components/PremiumFacebookEngagement";
import Testimonials from "@/components/testimonials";
import heroImage from "@assets/explosive_jackpot_winning_moment.png";
import trophyImage from "@assets/trophy_winner_celebration_moment.png";
import heroJackpotImg from "@assets/generated_images/hero_jackpot_3d.png";
import heroBgVideo from "@assets/generated_videos/luxury-casino-hero-bg.mp4";
import FAQ from "./faq";

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

export default function Home() {
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user: User | null };
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const filteredCompetitions = useMemo(() => {
    if (activeFilter === "all") {
      if (!isAuthenticated) {
        return competitions.filter((c) => c.type !== "instant");
      } else {
        return competitions;
      }
    } else {
      return competitions.filter((c) => c.type === activeFilter);
    }
  }, [competitions, isAuthenticated, activeFilter]);

  const handleFilterChange = (filterType: string) => {
    setActiveFilter(filterType);
  };

  const newsletterSubscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("/api/user/newsletter/subscribe", "POST", { email });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message,
        variant: "default",
      });
      setNewsletterEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to subscribe to newsletter",
        variant: "destructive",
      });
    },
  });

  const newsletterUnsubscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/user/newsletter/unsubscribe", "POST", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Unsubscribed",
        description: data.message,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Unsubscribe Failed",
        description: error.message || "Failed to unsubscribe from newsletter",
        variant: "destructive",
      });
    },
  });

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    newsletterSubscribeMutation.mutate(newsletterEmail);
  };

  const handleNewsletterUnsubscribe = () => {
    newsletterUnsubscribeMutation.mutate();
  };



  const gamesSection = useInView();
  const winnersSection = useInView();
  const newsletterSection = useInView();

  const gameCards = [
    {
       id: competitions.find(c => c.type === "voltz")?.id, 
    Icon: Zap,
      title: "Ringtone Voltz",
    desc: "Volt to win",
    gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    glowColor: "rgba(59,130,246,0.25)",
    borderColor: "rgba(59,130,246,0.4)",
    bgColor: "rgba(59,130,246,0.06)",
    iconBg: "linear-gradient(135deg, #3b82f6, #60a5fa)",
      filter: "voltz",
    prize: "£10,000",
    
      popular: true
    },
    
{
  id: competitions.find(c => c.type === "pop")?.id, 
  Icon: Target,
  title: "Ringtone Pop",
  desc: "Pop to win",
  gradient: "linear-gradient(135deg, #eab308, #fde047)",
  glowColor: "rgba(234,179,8,0.25)",
  borderColor: "rgba(234,179,8,0.4)",
  bgColor: "rgba(234,179,8,0.06)",
  iconBg: "linear-gradient(135deg, #eab308, #facc15)",
  prize: "£5,000",
  filter: "pop",
  badge: "NEW",
  badgeColor: "#eab308",
  popular: false
},
{
      id: competitions.find(c => c.type === "scratch")?.id, 
    Icon: TicketCheck,
       title: "Scratch Card",
    desc: "Scratch to win",
    gradient: "linear-gradient(135deg, #dc2626, #f97316)",
    glowColor: "rgba(239,68,68,0.25)",
    borderColor: "rgba(239,68,68,0.4)",
    bgColor: "rgba(239,68,68,0.06)",
    iconBg: "linear-gradient(135deg, #dc2626, #ef4444)",
     prize: "£5,000",
    filter: "scratch",
    popular: true
    },
{
  id: competitions.find(c => c.type === "plinko")?.id, 
  Icon: Circle,
  title: "Ringtone Plinko",
  desc: "Drop to win",
  gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
  glowColor: "rgba(139,92,246,0.25)",
  borderColor: "rgba(139,92,246,0.4)",
  bgColor: "rgba(139,92,246,0.06)",
  iconBg: "linear-gradient(135deg, #8b5cf6, #c4b5fd)",
  prize: "£1,000",
  filter: "plinko",
  badge: "HOT",
  badgeColor: "#8b5cf6",
  popular: false
},
    
  ];

  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden" style={{ backgroundColor: '#070709' }}>
      <Header />

      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      <section className="relative min-h-[100vh] overflow-hidden" style={{ background: '#070709' }}>
        <div className="absolute inset-0 pointer-events-none">
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.55, filter: 'saturate(1.4) brightness(0.85) contrast(1.1)' }}>
            <source src={heroBgVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,7,9,0.1) 0%, rgba(7,7,9,0.15) 30%, rgba(7,7,9,0.4) 65%, #070709 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(7,7,9,0.5) 0%, transparent 25%, transparent 75%, rgba(7,7,9,0.5) 100%)' }} />

          <div className="absolute bottom-0 left-0 right-0 h-[40%] nv-grid-floor" style={{
            backgroundImage: `
              linear-gradient(rgba(212,175,55,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,175,55,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '70px 70px',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom center',
          }} />

          <div className="absolute top-[5%] left-[8%] w-[800px] h-[800px] rounded-full nv-orb-1" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.02) 40%, transparent 65%)', filter: 'blur(100px)' }} />
          <div className="absolute bottom-[5%] right-[2%] w-[600px] h-[600px] rounded-full nv-orb-2" style={{ background: 'radial-gradient(circle, rgba(245,215,110,0.08) 0%, transparent 50%)', filter: 'blur(120px)' }} />

          <div className="absolute top-0 left-0 right-0 h-[2px] nv-line-sweep" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.9), rgba(245,215,110,0.7), transparent)', backgroundSize: '200% 100%' }} />
          <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(212,175,55,0.3) 30%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.3) 70%, transparent 95%)' }} />
        </div>

        {[...Array(25)].map((_, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none nv-sparkle" style={{
            width: `${1 + (i % 4)}px`,
            height: `${1 + (i % 4)}px`,
            background: i % 4 === 0 ? '#f5d76e' : i % 4 === 1 ? '#d4af37' : i % 4 === 2 ? '#fffbe6' : '#f5d742',
            top: `${2 + (i * 3.8) % 92}%`,
            left: `${1 + (i * 4.1) % 97}%`,
            animationDelay: `${i * 0.25}s`,
            animationDuration: `${2 + (i % 5) * 0.5}s`,
            boxShadow: `0 0 ${8 + i % 8}px rgba(212,175,55,0.7)`,
          }} />
        ))}

        <div className="relative z-20 flex items-center min-h-[auto] lg:min-h-[100vh] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="w-full max-w-7xl mx-auto">

            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-7 space-y-5 sm:space-y-6 nv-col-left text-center lg:text-left flex flex-col items-center lg:items-start">

                <div className="nv-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full nv-badge-glow relative overflow-hidden" style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(184,134,11,0.08), rgba(212,175,55,0.12))',
                    border: '1px solid rgba(212,175,55,0.35)',
                    boxShadow: '0 0 30px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}>
                    <div className="absolute inset-0 nv-badge-shine-sweep" />
                    <Crown className="w-4 h-4 nv-crown-spin" style={{ color: '#f5d76e', filter: 'drop-shadow(0 0 6px rgba(245,215,110,0.6))' }} />
                    <span style={{ background: 'linear-gradient(90deg, #b8860b, #d4af37, #f5d76e, #fffef2, #f5d76e, #d4af37, #b8860b)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} className="text-xs font-black uppercase tracking-[0.25em] nv-badge-text-shimmer">Exclusive Prizes & Rewards</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 nv-badge-dot-pulse" style={{ boxShadow: '0 0 8px rgba(212,175,55,0.8)' }} />
                  </div>
                </div>

                <div className="nv-fade-in" style={{ animationDelay: '0.15s' }}>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(212,175,55,0.04))',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400/50" />
                    <span className="text-white text-sm font-semibold tracking-wide">
                      Welcome back, <span className="font-black nv-name-glow" style={{ background: 'linear-gradient(90deg, #d4af37, #f5d76e, #fffef2, #f5d76e, #d4af37)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.5))' }}>{user?.firstName || user?.email?.split('@')[0] || 'Champion'}</span>
                    </span>
                    <Diamond className="w-3 h-3 text-amber-400/30" />
                  </div>
                </div>

                <div className="overflow-hidden w-full">
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.05] tracking-tighter">
                    <span className="block nv-text-reveal" style={{ animationDelay: '0.2s' }}>
                      <span className="nv-hero-title-glow" style={{ 
                        color: 'white',
                        textShadow: '0 0 80px rgba(255,255,255,0.15), 0 0 40px rgba(212,175,55,0.08), 0 4px 20px rgba(0,0,0,0.5)',
                        letterSpacing: '-0.03em',
                      }}>Your Next Big</span>
                    </span>
                    <span className="block nv-text-reveal" style={{ animationDelay: '0.4s' }}>
                      <span className="nv-gold-shimmer-text" style={{
                        background: 'linear-gradient(100deg, #705a1a 0%, #b8860b 8%, #d4af37 16%, #f5d76e 24%, #fffef2 35%, #fff 42%, #fffef2 48%, #f5d76e 56%, #d4af37 65%, #b8860b 75%, #8b6914 85%, #d4af37 95%, #f5d76e 100%)',
                        backgroundSize: '400% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 80px rgba(212,175,55,0.6)) drop-shadow(0 0 30px rgba(245,215,110,0.3)) drop-shadow(0 8px 16px rgba(0,0,0,0.8))',
                        letterSpacing: '-0.02em',
                      }}>Win Awaits</span>
                      <span className="inline-block ml-3 nv-trophy-bounce">
                        <Trophy className="w-10 h-10 sm:w-12 sm:h-12 inline-block" style={{ color: '#f5d76e', filter: 'drop-shadow(0 0 20px rgba(245,215,110,0.6))' }} />
                      </span>
                    </span>
                  </h1>
                </div>

                <p className="text-white text-sm sm:text-base lg:text-lg max-w-md leading-relaxed nv-fade-in" style={{ animationDelay: '0.6s', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                  Premium jackpots, instant prizes, and exclusive games. Play your way to <span className="font-bold text-amber-400/60">extraordinary wins</span>.
                </p>

               

                <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 nv-fade-in flex-wrap" style={{ animationDelay: '0.7s' }}>
                  {[
                    { value: "£100K+", label: "in prizes", icon: Coins, color: '#f5d76e' },
                    { value: "50,000+", label: "winners", icon: Trophy, color: '#34d399' },
                    
                  ].map((stat, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full transition-all duration-300 hover:scale-[1.03] nv-stat-float" data-testid={`text-stat-value-${index}`} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(10px)',
                      animationDelay: `${0.7 + index * 0.1}s`,
                    }}>
                      <stat.icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" style={{ color: stat.color }} />
                      <span className="text-base sm:text-lg font-black text-white tracking-tight">{stat.value}</span>
                      <span className="text-white text-[10px] sm:text-xs font-medium">{stat.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 nv-fade-in w-full sm:w-auto" style={{ animationDelay: '0.8s' }}>
                  <Button 
                    onClick={() => {
                      const section = document.getElementById("competitions-grid");
                      if (section) {
                        const elementTop = section.getBoundingClientRect().top + window.pageYOffset;
                        window.scrollTo({ top: elementTop - 100, behavior: "smooth" });
                      }
                    }}
                    className="group relative h-12 px-8 text-sm font-bold rounded-full text-[#0a0a0a] border-0 transition-all duration-300 overflow-hidden hover:scale-[1.03] uppercase tracking-wider nv-cta-glow w-full sm:w-auto"
                    style={{
                      background: 'linear-gradient(135deg, #f5d742 0%, #d4af37 50%, #b8860b 100%)',
                      boxShadow: '0 0 40px rgba(212,175,55,0.25), 0 4px 20px rgba(0,0,0,0.4)',
                    }}
                    data-testid="button-hero-play-now"
                  >
                    <span className="absolute inset-0 nv-btn-shine" />
                    <span className="relative flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Start Winning Now
                    </span>
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => {
                      const section = document.getElementById("games-section");
                      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="group h-12 px-6 text-sm font-medium rounded-full transition-all duration-300 hover:scale-[1.03] w-full sm:w-auto"
                    style={{
                      color: 'rgb(255, 255, 255)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                    data-testid="button-hero-browse"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-amber-400/50" />
                    Explore Games
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-5 nv-col-right" id="games-section">
                <div className="relative rounded-2xl overflow-hidden mb-5 nv-hero-img-card group" style={{
                  border: '1px solid rgba(212,175,55,0.2)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 80px rgba(212,175,55,0.08)',
                }}>
                  <div className="absolute -inset-[2px] rounded-2xl nv-border-spin" style={{
                    background: 'conic-gradient(from 0deg, rgba(212,175,55,0.5), transparent 20%, rgba(245,215,110,0.5) 40%, transparent 60%, rgba(212,175,55,0.5) 80%, transparent)',
                    filter: 'blur(2px)',
                    zIndex: 0,
                  }} />
                  <div className="relative z-[1] rounded-2xl overflow-hidden">
                    <img src={heroJackpotImg} alt="Win Amazing Prizes" className="w-full h-auto object-cover nv-img-float" style={{ maxHeight: '280px' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, transparent 50%, rgba(7,7,9,0.3) 75%, rgba(7,7,9,0.7) 100%)' }} />
                    <div className="absolute inset-0 nv-img-sheen" />
                    <div className="absolute top-2.5 left-2.5">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 15px rgba(16,185,129,0.15)' }}>
                        <div className="relative">
                          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.8)' }} />
                          <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                        </div>
                        <span className="text-emerald-400 text-[11px] font-black uppercase tracking-wider">Live</span>
                      </div>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <div className="px-3 py-1.5 rounded-full backdrop-blur-xl" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 0 15px rgba(212,175,55,0.1)' }}>
                        <span className="text-[11px] font-black uppercase tracking-wider" style={{ background: 'linear-gradient(90deg, #d4af37, #f5d76e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Premium</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden nv-panel-glass relative" style={{
                  background: 'linear-gradient(180deg, rgba(12,12,18,0.97), rgba(6,6,10,0.99))',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(212,175,55,0.05)',
                  backdropFilter: 'blur(20px)',
                }}>
                  <div className="absolute -inset-[1px] rounded-2xl nv-panel-border-glow" style={{
                    background: 'conic-gradient(from 0deg, rgba(239,68,68,0.4), rgba(20,184,166,0.4), rgba(34,197,94,0.4), rgba(59,130,246,0.4), rgba(245,215,110,0.4), rgba(239,68,68,0.4))',
                    filter: 'blur(1px)',
                    zIndex: 0,
                  }} />
                  <div className="relative z-[1] rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(12,12,18,0.98), rgba(6,6,10,0.99))' }}>
                  <div className="p-4 pb-3 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[2px] nv-panel-top-line" style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.6), rgba(20,184,166,0.6), rgba(34,197,94,0.6), rgba(59,130,246,0.6), rgba(245,215,110,0.6))', backgroundSize: '200% 100%' }} />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center nv-pick-icon-pulse relative" style={{ background: 'linear-gradient(135deg, rgba(245,215,110,0.2), rgba(239,68,68,0.15))', border: '1px solid rgba(245,215,110,0.3)', boxShadow: '0 0 20px rgba(245,215,110,0.15), 0 0 40px rgba(245,215,110,0.08)' }}>
                          <Flame className="w-5 h-5" style={{ color: '#f5d76e', filter: 'drop-shadow(0 0 8px rgba(245,215,110,0.8))' }} />
                        </div>
                        <div>
                          <h3 className="text-base font-black tracking-tight leading-none nv-pick-title-shimmer" style={{ background: 'linear-gradient(90deg, #fff, #f5d76e, #ff6b6b, #14b8a6, #fff)', backgroundSize: '300% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pick Your Winner</h3>
                          <p className="text-white/25 text-[10px] mt-0.5 font-medium">Choose your game mode</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full nv-games-counter-pulse" style={{ background: 'linear-gradient(135deg, rgba(245,215,110,0.12), rgba(239,68,68,0.08))', border: '1px solid rgba(245,215,110,0.2)', boxShadow: '0 0 15px rgba(245,215,110,0.1)' }}>
                        <Sparkles className="w-3 h-3" style={{ color: '#f5d76e', filter: 'drop-shadow(0 0 4px rgba(245,215,110,0.6))' }} />
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#f5d76e' }}>4 Games</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {gameCards.map((game, index) => (
                     <button
  key={index}
  onClick={() => {
    // Direct navigation to the competition page
    if (game.id) {
      setLocation(`/competition/${game.id}`);
    } else {
      // Fallback: if competition not loaded yet, filter and scroll
      handleFilterChange(game.filter);
      setTimeout(() => {
        const section = document.getElementById("competitions-grid");
        if (section) {
          const elementTop = section.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: elementTop - 100, behavior: "smooth" });
        }
      }, 100);
    }
  }}
  className="group w-full relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 nv-game-card"
  data-testid={`button-game-${game.title.toLowerCase().replace(/\s+/g, '-')}`}
  style={{
    background: `linear-gradient(135deg, ${game.bgColor}, rgba(10,10,15,0.97))`,
    border: `1px solid ${game.borderColor}`,
    boxShadow: `0 4px 25px ${game.glowColor}, 0 0 40px ${game.glowColor}, 0 8px 30px rgba(0,0,0,0.4)`,
  }}
>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-400" style={{ background: `linear-gradient(135deg, ${game.glowColor}, transparent 50%)` }} />
                        <div className="absolute right-0 top-0 bottom-0 w-[70%] opacity-[0.04]" style={{ background: `radial-gradient(circle at 100% 50%, ${game.borderColor}, transparent 60%)` }} />
                        <div className="absolute inset-0 nv-game-card-shimmer" style={{ background: `linear-gradient(105deg, transparent 40%, ${game.glowColor} 50%, transparent 60%)`, backgroundSize: '250% 100%', opacity: 0.15 }} />
                        
                        <div className="relative flex items-center gap-3 p-3">
                          <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative nv-game-icon-glow" style={{
                            background: game.iconBg,
                            boxShadow: `0 6px 25px ${game.glowColor}, 0 0 40px ${game.glowColor}, 0 0 60px ${game.glowColor}`,
                          }}>
                            <game.Icon className="w-5 h-5 text-white drop-shadow-lg" />
                            <div className="absolute -inset-1 rounded-xl opacity-40 group-hover:opacity-80 transition-opacity" style={{ background: game.iconBg, filter: 'blur(10px)', zIndex: -1 }} />
                          </div>

                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-white font-bold text-[13px] truncate" style={{ textShadow: '0 0 15px rgba(255,255,255,0.1)' }}>{game.title}</h4>
                              {game.popular && (
                                <span className="px-2 py-0.5 text-[7px] font-black uppercase tracking-wider rounded-full text-white nv-badge-pulse" style={{
                                  background: game.badgeColor,
                                  boxShadow: `0 0 15px ${game.glowColor}, 0 0 30px ${game.glowColor}`,
                                }}>{game.badge}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" style={{ filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.5))' }} />
                                ))}
                              </div>
                              <span className="text-white/20 text-[10px] font-medium">{game.desc}</span>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 mr-1">
                            <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: game.borderColor, textShadow: `0 0 10px ${game.glowColor}` }}>Win up to</div>
                            <div className="text-xl font-black" style={{
                              background: game.gradient,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              filter: `drop-shadow(0 0 12px ${game.glowColor})`,
                            }}>{game.prize}</div>
                          </div>

                          <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg" style={{
                            background: `linear-gradient(135deg, ${game.bgColor}, rgba(255,255,255,0.08))`,
                            border: `1px solid ${game.borderColor}`,
                            boxShadow: `0 0 15px ${game.glowColor}`,
                          }}>
                            <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="px-3 pb-3">
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        handleFilterChange("all");
                        setTimeout(() => {
                          const section = document.getElementById("competitions-grid");
                          if (section) {
                            const elementTop = section.getBoundingClientRect().top + window.pageYOffset;
                            window.scrollTo({ top: elementTop - 100, behavior: "smooth" });
                          }
                        }, 100);
                      }}
                      className="w-full h-10 text-xs font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] uppercase tracking-wider"
                      style={{
                        color: 'rgba(212,175,55,0.7)',
                        border: '1px solid rgba(212,175,55,0.12)',
                        background: 'rgba(212,175,55,0.04)',
                      }}
                      data-testid="button-view-all-prizes"
                    >
                      <Trophy className="w-3.5 h-3.5 mr-2" />
                      View All Prizes
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes nv-sparkle-float {
            0%, 100% { opacity: 0; transform: scale(0.2) translateY(0); }
            10% { opacity: 1; transform: scale(1.2) translateY(-5px); }
            50% { opacity: 0.8; transform: scale(0.9) translateY(-15px); }
            90% { opacity: 0.3; transform: scale(0.5) translateY(-25px); }
          }
          .nv-sparkle { animation: nv-sparkle-float 2.5s ease-in-out infinite; }

          @keyframes nv-orb-1 {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
            33% { transform: translate(50px, -30px) scale(1.2); opacity: 0.9; }
            66% { transform: translate(-30px, 25px) scale(0.85); opacity: 0.6; }
          }
          .nv-orb-1 { animation: nv-orb-1 16s ease-in-out infinite; }

          @keyframes nv-orb-2 {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
            50% { transform: translate(-35px, -25px) scale(1.25); opacity: 0.8; }
          }
          .nv-orb-2 { animation: nv-orb-2 13s ease-in-out infinite; }

          @keyframes nv-line-sweep-anim {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .nv-line-sweep { animation: nv-line-sweep-anim 3s ease-in-out infinite; }

          @keyframes nv-grid-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
          .nv-grid-floor { animation: nv-grid-pulse 6s ease-in-out infinite; }

          @keyframes nv-fade-in-anim {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .nv-fade-in { animation: nv-fade-in-anim 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }

          @keyframes nv-text-reveal-anim {
            0% { opacity: 0; transform: translateY(110%) rotateX(-30deg) scale(0.95); filter: blur(6px); }
            50% { opacity: 1; transform: translateY(-3%) rotateX(3deg) scale(1.01); filter: blur(0); }
            100% { opacity: 1; transform: translateY(0) rotateX(0deg) scale(1); filter: blur(0); }
          }
          .nv-text-reveal { 
            animation: nv-text-reveal-anim 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
            opacity: 0; display: block; transform-style: preserve-3d;
          }

          @keyframes nv-gold-shimmer-anim {
            0% { background-position: 400% center; }
            100% { background-position: -400% center; }
          }
          .nv-gold-shimmer-text { animation: nv-gold-shimmer-anim 6s linear infinite; }

          @keyframes nv-col-left-enter {
            0% { opacity: 0; transform: translateX(-30px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          .nv-col-left { animation: nv-col-left-enter 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; }

          @keyframes nv-col-right-enter {
            0% { opacity: 0; transform: translateX(30px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          .nv-col-right { animation: nv-col-right-enter 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards; opacity: 0; }

          @keyframes nv-crown-spin-anim {
            0%, 70%, 100% { transform: rotateY(0deg); }
            85% { transform: rotateY(180deg); }
          }
          .nv-crown-spin { animation: nv-crown-spin-anim 4s ease-in-out infinite; transform-style: preserve-3d; }

          .nv-name-glow { filter: drop-shadow(0 0 12px rgba(212,175,55,0.4)); }

          @keyframes nv-stat-float-anim {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          .nv-stat-float { animation: nv-stat-float-anim 4s ease-in-out infinite; }

          .nv-colon-blink { animation: nv-colon-blink-anim 1s steps(2) infinite; }
          @keyframes nv-colon-blink-anim { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }

          @keyframes nv-btn-shine-anim {
            0% { transform: translateX(-100%) skewX(-20deg); }
            100% { transform: translateX(300%) skewX(-20deg); }
          }
          .nv-btn-shine {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: nv-btn-shine-anim 4s ease-in-out infinite;
          }

          .nv-cta-glow { animation: nv-cta-pulse 2.5s ease-in-out infinite; }
          @keyframes nv-cta-pulse {
            0%, 100% { box-shadow: 0 0 60px rgba(212,175,55,0.35), 0 0 25px rgba(212,175,55,0.15), 0 8px 30px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.3); }
            50% { box-shadow: 0 0 100px rgba(212,175,55,0.55), 0 0 50px rgba(212,175,55,0.3), 0 8px 30px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.3); }
          }

          @keyframes nv-badge-glow-anim {
            0%, 100% { box-shadow: 0 0 15px rgba(212,175,55,0.08); }
            50% { box-shadow: 0 0 30px rgba(212,175,55,0.18); }
          }
          .nv-badge-glow { animation: nv-badge-glow-anim 3s ease-in-out infinite; }

          @keyframes nv-badge-pulse-anim {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .nv-badge-pulse { animation: nv-badge-pulse-anim 2s ease-in-out infinite; }

          .nv-icon-pulse { animation: nv-icon-pulse-anim 2s ease-in-out infinite; }
          @keyframes nv-icon-pulse-anim { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }

          @keyframes nv-border-spin-anim {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .nv-border-spin { animation: nv-border-spin-anim 10s linear infinite; }

          @keyframes nv-img-float-anim {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-3px) scale(1.01); }
          }
          .nv-img-float { animation: nv-img-float-anim 5s ease-in-out infinite; }

          @keyframes nv-img-sheen-anim {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .nv-img-sheen { background: linear-gradient(105deg, transparent 35%, rgba(212,175,55,0.03) 42%, rgba(255,255,255,0.07) 50%, rgba(212,175,55,0.03) 58%, transparent 65%); background-size: 200% 100%; animation: nv-img-sheen-anim 5s ease-in-out infinite; }

          .nv-hero-img-card:hover { transform: translateY(-4px); box-shadow: 0 35px 90px rgba(0,0,0,0.8), 0 0 100px rgba(212,175,55,0.12) !important; }
          .nv-hero-img-card { transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); }

          .nv-panel-glass { transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
          .nv-panel-glass:hover { transform: translateY(-2px); box-shadow: 0 35px 90px rgba(0,0,0,0.7), 0 0 50px rgba(212,175,55,0.06) !important; }

          .nv-game-card { transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1) !important; }

          @keyframes nv-badge-shine-sweep-anim {
            0% { transform: translateX(-100%) skewX(-20deg); }
            100% { transform: translateX(300%) skewX(-20deg); }
          }
          .nv-badge-shine-sweep {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
            animation: nv-badge-shine-sweep-anim 5s ease-in-out infinite;
          }

          @keyframes nv-badge-text-shimmer-anim {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          .nv-badge-text-shimmer { animation: nv-badge-text-shimmer-anim 4s linear infinite; }

          @keyframes nv-badge-dot-pulse-anim {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.4); }
          }
          .nv-badge-dot-pulse { animation: nv-badge-dot-pulse-anim 2s ease-in-out infinite; }

          @keyframes nv-trophy-bounce-anim {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-4px) rotate(-5deg); }
            50% { transform: translateY(0) rotate(0deg); }
            75% { transform: translateY(-2px) rotate(5deg); }
          }
          .nv-trophy-bounce { animation: nv-trophy-bounce-anim 3s ease-in-out infinite; }

          @keyframes nv-panel-border-glow-anim { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .nv-panel-border-glow { animation: nv-panel-border-glow-anim 6s linear infinite; }

          @keyframes nv-panel-top-line-anim { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
          .nv-panel-top-line { animation: nv-panel-top-line-anim 4s linear infinite; }

          @keyframes nv-pick-title-shimmer-anim { 0% { background-position: 300% center; } 100% { background-position: -300% center; } }
          .nv-pick-title-shimmer { animation: nv-pick-title-shimmer-anim 5s linear infinite; }

          @keyframes nv-pick-icon-pulse-anim { 0%, 100% { box-shadow: 0 0 20px rgba(245,215,110,0.15), 0 0 40px rgba(245,215,110,0.08); } 50% { box-shadow: 0 0 30px rgba(245,215,110,0.3), 0 0 60px rgba(245,215,110,0.15); } }
          .nv-pick-icon-pulse { animation: nv-pick-icon-pulse-anim 2s ease-in-out infinite; }

          @keyframes nv-games-counter-pulse-anim { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
          .nv-games-counter-pulse { animation: nv-games-counter-pulse-anim 2s ease-in-out infinite; }

          @keyframes nv-game-card-shimmer-anim { 0% { background-position: -250% 0; } 100% { background-position: 250% 0; } }
          .nv-game-card-shimmer { animation: nv-game-card-shimmer-anim 6s ease-in-out infinite; }

          @keyframes nv-game-icon-glow-anim { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
          .nv-game-icon-glow { animation: nv-game-icon-glow-anim 2.5s ease-in-out infinite; }
        `}</style>
      </section>

      <section className="py-5 relative overflow-hidden" style={{ background: '#070709' }}>
        <div className="absolute inset-0 nv-trust-bg-sweep" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,136,0.03) 20%, rgba(212,175,55,0.04) 40%, rgba(59,130,246,0.03) 60%, rgba(245,158,11,0.04) 80%, transparent 100%)', backgroundSize: '200% 100%' }} />
        <div className="absolute top-0 left-0 right-0 h-[1px] nv-trust-line-glow" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(0,255,136,0.4) 20%, rgba(212,175,55,0.5) 40%, rgba(59,130,246,0.4) 60%, rgba(245,158,11,0.5) 80%, transparent 95%)', filter: 'blur(0.5px)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] nv-trust-line-glow" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(245,158,11,0.4) 20%, rgba(59,130,246,0.5) 40%, rgba(212,175,55,0.4) 60%, rgba(0,255,136,0.5) 80%, transparent 95%)', filter: 'blur(0.5px)', animationDelay: '1.5s' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-center gap-2 sm:gap-6 lg:gap-10">
            {[
              { icon: Shield, text: "SSL Encrypted", color: '#00ff88', glow: 'rgba(0,255,136,0.3)', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.25)' },
              { icon: CheckCircle2, text: "Verified Fair Play", color: '#f5d76e', glow: 'rgba(245,215,110,0.3)', bg: 'rgba(245,215,110,0.08)', border: 'rgba(245,215,110,0.25)' },
              { icon: Coins, text: "Instant Payouts", color: '#60a5fa', glow: 'rgba(96,165,250,0.3)', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full group cursor-default transition-all duration-500 hover:scale-[1.05] nv-trust-badge-float" data-testid={`trust-badge-${index}`} style={{
                background: item.bg,
                border: `1px solid ${item.border}`,
                boxShadow: `0 0 20px ${item.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                animationDelay: `${index * 0.3}s`,
              }}>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 nv-trust-icon-glow" style={{ background: `linear-gradient(135deg, ${item.bg}, rgba(0,0,0,0.2))`, boxShadow: `0 0 15px ${item.glow}, 0 0 30px ${item.glow}`, border: `1px solid ${item.border}` }}>
                  <item.icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: item.color, filter: `drop-shadow(0 0 6px ${item.glow})` }} />
                </div>
                <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap" style={{ color: item.color, textShadow: `0 0 15px ${item.glow}` }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes nv-trust-bg-sweep-anim { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
          .nv-trust-bg-sweep { animation: nv-trust-bg-sweep-anim 8s ease-in-out infinite; }
          @keyframes nv-trust-line-glow-anim { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
          .nv-trust-line-glow { animation: nv-trust-line-glow-anim 3s ease-in-out infinite; }
          @keyframes nv-trust-badge-float-anim { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
          .nv-trust-badge-float { animation: nv-trust-badge-float-anim 4s ease-in-out infinite; }
          @keyframes nv-trust-icon-glow-anim { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
          .nv-trust-icon-glow { animation: nv-trust-icon-glow-anim 2.5s ease-in-out infinite; }
        `}</style>
      </section>

      <section className="relative">
        {competitions.length > 0 ? (
          <FeaturedCompetitions competitions={competitions} />
        ) : (
          <div className="text-center text-amber-400/60 py-12" style={{ background: '#070709' }}>
            <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg">Loading amazing prizes...</p>
          </div>
        )}
      </section>

      <StatsBanner />

      <section className="sticky top-0 z-40 backdrop-blur-2xl" style={{
        background: 'rgba(7,7,9,0.92)',
        borderBottom: '1px solid rgba(0,255,136,0.08)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(0,255,136,0.05)',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              { id: "all", label: "All Games", icon: Trophy, color: '#00ff88', glow: 'rgba(0,255,136,0.3)' },
              { id: "spin", label: "Spin to Win", icon: RotateCw, color: '#ffb800', glow: 'rgba(245,158,11,0.3)' },
              { id: "scratch", label: "Scratch Cards", icon: Sparkles, color: '#00ff88', glow: 'rgba(0,255,136,0.3)' },
               { id: "instant", label: "Competitions", icon: Gift, color: '#f5d76e', glow: 'rgba(245,215,110,0.3)' },
              { id: "plinko", label: "Ringtone Plinko", icon: Circle, color: '#ca6ef5', glow: 'rgba(218, 110, 245, 0.3)' },
              { id: "voltz", label: "Ringtone Voltz", icon: Zap, color: '#6ebff5', glow: 'rgba(110, 157, 245, 0.3)' },
              { id: "pop", label: "Ringtone Pop", icon: Target, color: '#f5736e', glow: 'rgba(245, 126, 110, 0.3)' },
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

      <section className="py-16 sm:py-24 relative" style={{ background: '#070709' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,255,136,0.03), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(245,215,110,0.02), transparent)' }} />
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(0,255,136,0.08) 30%, rgba(245,215,110,0.12) 50%, rgba(0,255,136,0.08) 70%, transparent 95%)' }} />
        
        <div id="competitions-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full mx-auto mb-4 animate-spin" />
              <p className="text-white/30 text-base font-medium">Loading prizes...</p>
            </div>
          ) : filteredCompetitions.length > 0 ? (
            <>
              <div className="text-center mb-10 sm:mb-14">
                <div className="flex items-center justify-center gap-3 mb-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(0,255,136,0.12), rgba(245,215,110,0.08))',
                    border: '1px solid rgba(0,255,136,0.25)',
                    boxShadow: '0 0 20px rgba(0,255,136,0.1)',
                  }}>
                    {activeFilter === "spin" ? <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ffb800', filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }} /> :
                     activeFilter === "scratch" ? <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#00ff88', filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.6))' }} /> :
                     activeFilter === "instant" ? <Gift className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#f5d76e', filter: 'drop-shadow(0 0 6px rgba(245,215,110,0.6))' }} /> :
                       activeFilter === "voltz" ? <Zap className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#6e99f5', filter: 'drop-shadow(0 0 6px rgba(245,215,110,0.6))' }} /> :
                     activeFilter === "pop" ? <Target className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#f56e6e', filter: 'drop-shadow(0 0 6px rgba(245,215,110,0.6))' }} /> :
                     activeFilter === "plinko" ? <Circle className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#cf6ef5', filter: 'drop-shadow(0 0 6px rgba(245,215,110,0.6))' }} /> :
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
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3" style={{
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
                    : activeFilter === "voltz"
                    ? "Ringtone Voltz"
                    : activeFilter === "pop"
                    ? "Ringtone Pop"
                    : activeFilter === "plinko"
                    ? "Ringtone Plinko"
                    : "Live Competitions"}
                </h2>
                <div className="w-24 h-[2px] mx-auto mb-4" style={{
                  background: 'linear-gradient(90deg, transparent, #d4af37, #00ff88, #d4af37, transparent)',
                  boxShadow: '0 0 8px rgba(212,175,55,0.4)',
                }} />
                <p className="text-white/50 text-sm sm:text-base font-medium max-w-lg mx-auto">
                  {activeFilter === "all"
                    ? "Explore our collection of premium prize competitions"
                    : activeFilter === "spin"
                    ? "Spin the wheel for instant prizes"
                    : activeFilter === "scratch"
                    ? "Scratch and reveal your winning prize"
                    : "Enter now for your chance to win big"}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {filteredCompetitions.map((competition) => (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                    authenticated={true}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Gift className="w-16 h-16 text-white/5 mx-auto mb-4" />
              <p className="text-white/20 text-xl">No competitions found.</p>
            </div>
          )}
        </div>
        
        <style>{`
          @keyframes gradient-x {
            0%, 100% { background-size: 200% 200%; background-position: left center; }
            50% { background-size: 200% 200%; background-position: right center; }
          }
          .animate-gradient-x { animation: gradient-x 3s ease infinite; }
          @keyframes hero-glow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.08); }
          }
          .animate-hero-glow { animation: hero-glow 8s ease-in-out infinite; }
          .animate-hero-glow-delay { animation: hero-glow 8s ease-in-out infinite; animation-delay: 4s; }
        `}</style>
      </section>

     

      {isAuthenticated && (
        <section className="py-24 sm:py-32 relative overflow-hidden" style={{ background: '#070709' }}>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 60%)' }} />
          </div>

          <div ref={newsletterSection.ref} className={`container mx-auto px-4 relative z-10 transition-all duration-1000 ${newsletterSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-lg mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 backdrop-blur-sm" style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.15)',
              }}>
                <Mail className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">VIP Access</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                {user?.receiveNewsletter ? "You're VIP" : "Get VIP Access"}
              </h3>
              <p className="text-white/20 text-sm sm:text-base mb-8">
                {user?.receiveNewsletter 
                  ? "You'll be first to hear about exclusive drops and prizes."
                  : "Early access to new prizes, exclusive offers, and insider tips."}
              </p>

              {user?.receiveNewsletter ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 p-4 rounded-xl" style={{
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.12)',
                    boxShadow: '0 0 20px rgba(16,185,129,0.05)',
                  }}>
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium text-sm">Subscribed with {user.email}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleNewsletterUnsubscribe}
                    variant="ghost"
                    className="w-full h-12 text-white/15 hover:text-red-400 font-medium text-sm rounded-xl transition-all"
                    disabled={newsletterUnsubscribeMutation.isPending}
                    data-testid="button-newsletter-unsubscribe"
                  >
                    {newsletterUnsubscribeMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        Unsubscribing...
                      </div>
                    ) : (
                      "Unsubscribe"
                    )}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubscribe} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/12" />
                      <Input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder={user?.email || "your@email.com"}
                        className="w-full text-white placeholder:text-white/12 h-14 text-base pl-12 rounded-xl transition-all duration-300"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                        data-testid="input-newsletter-email"
                        disabled={newsletterSubscribeMutation.isPending}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-14 px-8 text-[#0a0a0a] font-black rounded-xl transition-all duration-500 hover:scale-[1.03]"
                      style={{
                        background: 'linear-gradient(135deg, #f5d742 0%, #d4af37 50%, #b8860b 100%)',
                        boxShadow: '0 0 25px rgba(212,175,55,0.25), 0 2px 8px rgba(0,0,0,0.2)',
                      }}
                      disabled={newsletterSubscribeMutation.isPending}
                      data-testid="button-newsletter-subscribe"
                    >
                      {newsletterSubscribeMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        "Join VIP"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      <CompactFacebookCTA/>
      <Testimonials/>
      <FAQ/>
      <Footer />
    </div>
  );
}