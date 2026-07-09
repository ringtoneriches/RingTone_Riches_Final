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
    return competitions;
  } else {
    return competitions.filter((c) => c.type === activeFilter);
  }
}, [competitions, activeFilter]);

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
      id: competitions.find(c => c.type === "spin")?.id,
      Icon: RotateCw,
      title: "Retro Ringtone Spin",
      desc: "Spin the retro wheel",
      gradient: "linear-gradient(135deg, #f43f5e, #e11d48, #be123c)",
      glowColor: "rgba(244,63,94,0.35)",
      borderColor: "rgba(244,63,94,0.5)",
      bgColor: "rgba(244,63,94,0.08)",
      iconBg: "linear-gradient(135deg, #f43f5e, #e11d48, #be123c)",
      prize: "£1,000",
      filter: "spin",
      popular: true,
      wheelType: "wheel2",
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
   {
  id: competitions.find(c => c.type === "scratch")?.id,
  Icon: Ticket,
  title: "Scratch & Win",
  desc: "Scratch to win",
  gradient: "linear-gradient(135deg, #22c55e, #4ade80, #16a34a)",
  glowColor: "rgba(34,197,94,0.35)",
  borderColor: "rgba(34,197,94,0.5)",
  bgColor: "rgba(34,197,94,0.08)",
  iconBg: "linear-gradient(135deg, #22c55e, #4ade80, #16a34a)",
  prize: "£1,000",
  filter: "scratch",
  badge: "HOT",
  badgeColor: "#22c55e",
  popular: false
}
  ];

  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden" style={{ backgroundColor: '#070709' }}>
      <Header />

      {/* REMOVED: Fixed noise overlay */}

      {/* Hero Section - REMOVED all animations */}
      <section className="relative min-h-[100vh] overflow-hidden" style={{ background: '#070709' }}>
        <div className="absolute inset-0 pointer-events-none">
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.55 }}>
            <source src={heroBgVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,7,9,0.1) 0%, rgba(7,7,9,0.15) 30%, rgba(7,7,9,0.4) 65%, #070709 100%)' }} />
          
          {/* REMOVED: Grid floor, orbs, sweep lines, sparkles */}
        </div>

        <div className="relative z-20 flex items-center min-h-[auto] lg:min-h-[100vh] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
              
              {/* Left Column - REMOVED animations */}
              <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">

                {/* Badge */}
                <div>
                  <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full" style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(184,134,11,0.08))',
                    border: '1px solid rgba(212,175,55,0.35)',
                  }}>
                    <Crown className="w-4 h-4" style={{ color: '#f5d76e' }} />
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">Exclusive Prizes & Rewards</span>
                  </div>
                </div>

                {/* Welcome back */}
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(212,175,55,0.04))',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400/50" />
                    <span className="text-white text-sm font-semibold tracking-wide">
                      Welcome back, <span className="font-black text-amber-400">{user?.firstName || user?.email?.split('@')[0] || 'Champion'}</span>
                    </span>
                    <Diamond className="w-3 h-3 text-amber-400/30" />
                  </div>
                </div>

                {/* Main Heading */}
                <div className="overflow-hidden w-full">
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.05] tracking-tighter">
                    <span className="block text-white">Your Next Big</span>
                    <span className="block">
                      <span className="text-amber-400">Win Awaits</span>
                      <Trophy className="w-10 h-10 sm:w-12 sm:h-12 inline-block ml-3" style={{ color: '#f5d76e' }} />
                    </span>
                  </h1>
                </div>

                <p className="text-white/60 text-sm sm:text-base lg:text-lg max-w-md leading-relaxed">
                  Premium jackpots, instant prizes, and exclusive games. Play your way to <span className="font-bold text-amber-400">extraordinary wins</span>.
                </p>

                {/* Stats */}
                <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 flex-wrap">
                  {[
                    { value: "£100K+", label: "in prizes", icon: Coins, color: '#f5d76e' },
                    { value: "50,000+", label: "winners", icon: Trophy, color: '#34d399' },
                  ].map((stat, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full" data-testid={`text-stat-value-${index}`} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <stat.icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" style={{ color: stat.color }} />
                      <span className="text-base sm:text-lg font-black text-white tracking-tight">{stat.value}</span>
                      <span className="text-white/60 text-[10px] sm:text-xs font-medium">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons - REMOVED shine animation */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
                  <Button 
                    onClick={() => {
                      const section = document.getElementById("competitions-grid");
                      if (section) {
                        const elementTop = section.getBoundingClientRect().top + window.pageYOffset;
                        window.scrollTo({ top: elementTop - 100, behavior: "smooth" });
                      }
                    }}
                    className="h-12 px-8 text-sm font-bold rounded-full text-black border-0 transition-all duration-300 hover:scale-[1.03] uppercase tracking-wider w-full sm:w-auto"
                    style={{
                      background: 'linear-gradient(135deg, #f5d742 0%, #d4af37 50%, #b8860b 100%)',
                    }}
                    data-testid="button-hero-play-now"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Winning Now
                  </Button>
                  <Button 
  variant="ghost"
  onClick={() => {
    const section = document.getElementById("games-section");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }}
  className="group relative h-12 px-8 text-sm font-bold rounded-full transition-all duration-300 w-full sm:w-auto overflow-hidden"
  style={{ 
    background: 'rgba(212, 175, 55, 0.08)',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    backdropFilter: 'blur(4px)',
  }}
  data-testid="button-hero-browse"
>
  {/* Subtle gold glow on hover */}
  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
    style={{ 
      background: 'radial-gradient(circle at center, rgba(212,175,55,0.2), transparent 70%)',
    }}
  />
  
  {/* Shimmer line on hover */}
  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden">
    <div className="absolute -inset-full w-full h-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent group-hover:translate-x-full duration-700" />
  </div>
  
  <div className="relative flex items-center justify-center gap-2.5">
    <Sparkles className="w-4 h-4 text-amber-400/70 group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300" />
    <span className="text-amber-400/80 group-hover:text-amber-400 font-semibold tracking-wide transition-colors duration-300">
      Explore Games
    </span>
    <ChevronRight className="w-4 h-4 text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all duration-300" />
  </div>
</Button>
                </div>
              </div>

              {/* Right Column - Game Cards - REMOVED all animations */}
             
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section - REMOVED animations */}
      <section className="py-5 relative overflow-hidden" style={{ background: '#070709' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-center gap-2 sm:gap-6 lg:gap-10">
            {[
              { icon: Shield, text: "SSL Encrypted", color: '#00ff88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.25)' },
              { icon: CheckCircle2, text: "Verified Fair Play", color: '#f5d76e', bg: 'rgba(245,215,110,0.08)', border: 'rgba(245,215,110,0.25)' },
              { icon: Coins, text: "Instant Payouts", color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full transition-all duration-200 hover:scale-[1.05]" data-testid={`trust-badge-${index}`} style={{
                background: item.bg,
                border: `1px solid ${item.border}`,
              }}>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${item.bg}, rgba(0,0,0,0.2))`, border: `1px solid ${item.border}` }}>
                  <item.icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: item.color }} />
                </div>
                <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap" style={{ color: item.color }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Competitions */}
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

      {/* Filter Bar - REMOVED box shadow animation */}
      <section className="sticky top-0 z-40 backdrop-blur-2xl" style={{
        background: 'rgba(7,7,9,0.92)',
        borderBottom: '1px solid rgba(0,255,136,0.08)',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              { id: "all", label: "All Games", icon: Trophy, color: '#00ff88' },
              { id: "spin", label: "Spin to Win", icon: RotateCw, color: '#ffb800' },
              { id: "scratch", label: "Scratch Cards", icon: Sparkles, color: '#00ff88' },
              { id: "instant", label: "Competitions", icon: Gift, color: '#f5d76e' },
              { id: "plinko", label: "Ringtone Plinko", icon: Circle, color: '#ca6ef5' },
              { id: "voltz", label: "Ringtone Voltz", icon: Zap, color: '#6ebff5' },
              { id: "pop", label: "Ringtone Pop", icon: Target, color: '#f5736e' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center gap-2`}
                style={activeFilter === filter.id ? {
                  background: `linear-gradient(135deg, ${filter.color}, ${filter.color}cc)`,
                  color: '#0a0a0a',
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

      {/* Competitions Grid - REMOVED animations */}
      <section className="py-16 sm:py-24 relative" style={{ background: '#070709' }}>
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
                  }}>
                    {activeFilter === "spin" ? <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" /> :
                     activeFilter === "scratch" ? <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" /> :
                     activeFilter === "instant" ? <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" /> :
                     activeFilter === "voltz" ? <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" /> :
                     activeFilter === "pop" ? <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" /> :
                     activeFilter === "plinko" ? <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" /> :
                     <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
                    background: 'rgba(0,255,136,0.06)',
                    border: '1px solid rgba(0,255,136,0.2)',
                  }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">{filteredCompetitions.length} Live</span>
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3 text-amber-400">
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
                <div className="w-24 h-[2px] mx-auto mb-4 bg-amber-400/50" />
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
      </section>

      {/* Newsletter Section - for authenticated users */}
      {isAuthenticated && (
        <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden" style={{ background: '#070709' }}>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent)' }} />
          </div>

          <div ref={newsletterSection.ref} className={`w-full px-5 sm:px-6 md:px-8 mx-auto max-w-7xl relative z-10 transition-all duration-700 ${newsletterSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-lg mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 backdrop-blur-sm" style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.15)',
              }}>
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-amber-400 text-[11px] sm:text-xs font-bold uppercase tracking-widest">VIP Access</span>
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 sm:mb-4 tracking-tight">
                {user?.receiveNewsletter ? "You're VIP" : "Get VIP Access"}
              </h3>
              <p className="text-white/20 text-xs sm:text-sm md:text-base mb-6 sm:mb-8 px-2">
                {user?.receiveNewsletter 
                  ? "You'll be first to hear about exclusive drops and prizes."
                  : "Early access to new prizes, exclusive offers, and insider tips."}
              </p>

              {user?.receiveNewsletter ? (
                <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 p-3 sm:p-4 rounded-xl" style={{
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.12)',
                  }}>
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-xs sm:text-sm break-all">Subscribed with {user.email}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleNewsletterUnsubscribe}
                    variant="ghost"
                    className="w-full h-10 sm:h-12 text-white/15 hover:text-red-400 font-medium text-xs sm:text-sm rounded-xl transition-all"
                    disabled={newsletterUnsubscribeMutation.isPending}
                    data-testid="button-newsletter-unsubscribe"
                  >
                    {newsletterUnsubscribeMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        Unsubscribing...
                      </div>
                    ) : (
                      "Unsubscribe"
                    )}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubscribe} className="space-y-3 sm:space-y-4 px-2 sm:px-0">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative flex-1 w-full">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/12" />
                      <Input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder={user?.email || "your@email.com"}
                        className="w-full text-white placeholder:text-white/12 h-12 sm:h-14 text-sm sm:text-base pl-9 sm:pl-12 rounded-xl transition-all duration-300"
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
                      className="h-12 sm:h-14 px-5 sm:px-8 text-black font-black rounded-xl transition-all duration-200 hover:scale-[1.03] w-full sm:w-auto"
                      style={{
                        background: 'linear-gradient(135deg, #f5d742 0%, #d4af37 50%, #b8860b 100%)',
                      }}
                      disabled={newsletterSubscribeMutation.isPending}
                      data-testid="button-newsletter-subscribe"
                    >
                      {newsletterSubscribeMutation.isPending ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
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