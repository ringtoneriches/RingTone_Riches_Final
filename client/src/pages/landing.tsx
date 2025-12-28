import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import StatsBanner from "@/components/stats-banner";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import { Sparkles, Trophy, Zap, Gift, Mail, CheckCircle2, Shield, Award, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function PremiumCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [prevSeconds, setPrevSeconds] = useState(0);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const newYear = new Date(now.getFullYear() + 1, 0, 1);
      const difference = newYear.getTime() - now.getTime();
      
      if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setPrevSeconds(timeLeft.seconds);
      setTimeLeft(newTime);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft.seconds]);

  const items = [
    { value: timeLeft.days, label: 'DAYS', gradient: 'from-violet-500 via-violet-400 to-purple-600', glow: 'violet' },
    { value: timeLeft.hours, label: 'HOURS', gradient: 'from-fuchsia-500 via-fuchsia-400 to-pink-600', glow: 'fuchsia' },
    { value: timeLeft.minutes, label: 'MINS', gradient: 'from-amber-400 via-amber-300 to-orange-500', glow: 'amber' },
    { value: timeLeft.seconds, label: 'SECS', gradient: 'from-emerald-400 via-emerald-300 to-teal-500', glow: 'emerald' },
  ];

  const getGlowColor = (glow: string) => {
    switch(glow) {
      case 'violet': return 'shadow-violet-500/40';
      case 'fuchsia': return 'shadow-fuchsia-500/40';
      case 'amber': return 'shadow-amber-500/40';
      case 'emerald': return 'shadow-emerald-500/40';
      default: return 'shadow-violet-500/40';
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5">
      {items.map((item, idx) => (
        <div key={item.label} className="text-center group">
          <div className="relative">
            {/* Outer Glow */}
            <div className={`absolute -inset-2 bg-gradient-to-br ${item.gradient} rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
            
            {/* Gradient Border */}
            <div className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br ${item.gradient} p-[2px] shadow-2xl ${getGlowColor(item.glow)}`}>
              {/* Glass Inner */}
              <div className="w-full h-full rounded-2xl bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden">
                {/* Glass Reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                
                {/* Value */}
                <span className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent tabular-nums relative z-10`}>
                  {String(item.value).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-3 block tracking-[0.2em]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function AnimatedSnowflakes() {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 8 + 8,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.6 + 0.2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            opacity: flake.opacity,
          }}
        />
      ))}
    </div>
  );
}

function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Deep Midnight Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0614] via-slate-950 to-[#0a0614]" />
      
      {/* Aurora Effect - Top - Enhanced */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-40%,rgba(139,92,246,0.5),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_60%_-30%,rgba(217,70,239,0.35),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_30%_-20%,rgba(124,58,237,0.25),transparent)]" />
      
      {/* Warm Glow - Bottom - Enhanced */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_110%,rgba(251,191,36,0.25),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_100%,rgba(168,85,247,0.2),transparent)]" />
      
      {/* Center Spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(139,92,246,0.1),transparent)]" />
      
      {/* Animated Premium Border Lines */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/80 to-transparent animate-pulse" />
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent animate-pulse" style={{animationDelay: '1s'}} />
      
      {/* Animated Floating Sparkles - Enhanced */}
      <div className="absolute top-[8%] left-[8%] w-2 h-2 bg-violet-400 rounded-full animate-twinkle" />
      <div className="absolute top-[12%] right-[12%] w-3 h-3 bg-amber-400 rounded-full animate-twinkle" style={{animationDelay: '0.5s'}} />
      <div className="absolute top-[6%] left-[45%] w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-twinkle" style={{animationDelay: '1s'}} />
      <div className="absolute top-[18%] right-[30%] w-2 h-2 bg-violet-300 rounded-full animate-twinkle" style={{animationDelay: '0.3s'}} />
      <div className="absolute top-[25%] left-[20%] w-1.5 h-1.5 bg-amber-300 rounded-full animate-twinkle" style={{animationDelay: '0.8s'}} />
      <div className="absolute top-[15%] right-[8%] w-1 h-1 bg-white rounded-full animate-twinkle" style={{animationDelay: '1.2s'}} />
      <div className="absolute top-[22%] left-[35%] w-1 h-1 bg-white rounded-full animate-twinkle" style={{animationDelay: '0.7s'}} />
      <div className="absolute top-[10%] right-[40%] w-1.5 h-1.5 bg-pink-400 rounded-full animate-twinkle" style={{animationDelay: '1.5s'}} />
      <div className="absolute top-[5%] left-[60%] w-2 h-2 bg-emerald-400 rounded-full animate-twinkle" style={{animationDelay: '2s'}} />
      <div className="absolute top-[20%] right-[55%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-twinkle" style={{animationDelay: '1.8s'}} />
      
      {/* Floating Orbs - Larger Animated */}
      <div className="absolute top-[30%] left-[5%] w-32 h-32 bg-violet-500/10 rounded-full blur-3xl animate-float-enhanced" />
      <div className="absolute top-[60%] right-[8%] w-40 h-40 bg-fuchsia-500/10 rounded-full blur-3xl animate-float-enhanced" style={{animationDelay: '2s'}} />
      <div className="absolute bottom-[20%] left-[40%] w-48 h-48 bg-amber-500/10 rounded-full blur-3xl animate-float-enhanced" style={{animationDelay: '4s'}} />
      
      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.1)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(251,191,36,0.08)_0%,transparent_50%)]" />
      
      {/* Snowflakes */}
      <AnimatedSnowflakes />
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user: User | null };
  const { toast } = useToast();

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [newsletterEmail, setNewsletterEmail] = useState("");

const filteredCompetitions = useMemo(() => {
  if (activeFilter === "all") {
    return competitions; // Show everything
  }
  return competitions.filter((c) => c.type === activeFilter);
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

  return (
    <div className="min-h-screen bg-slate-950 text-foreground relative overflow-x-hidden">
      <Header />

      {/* Premium Hero Section - Midnight Celebration 2025 */}
      <section className="relative overflow-hidden bg-slate-950">
        <HeroBackground />
        
        {/* Main Hero Content */}
        <div className="relative z-10 py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            
            {/* Hero Header */}
            <div className="text-center mb-10 md:mb-14">
              {/* Premium Animated Badge */}
              <div className="relative inline-block mb-5 sm:mb-6 md:mb-8">
                {/* Rotating Glow Ring */}
                <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-violet-600 via-fuchsia-500 via-amber-400 to-violet-600 rounded-full blur-lg opacity-60 animate-glow-pulse" style={{ backgroundSize: '200% 200%', animation: 'rainbow-border 4s ease infinite, glow-pulse 2s ease-in-out infinite' }} />
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 rounded-full blur opacity-70" style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 3s ease infinite' }} />
                <div className="relative inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-violet-600/95 via-fuchsia-600/95 to-violet-600/95 border border-white/30 shadow-2xl overflow-hidden" style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 5s ease infinite' }}>
                  {/* Shimmer Sweep */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300 animate-twinkle relative z-10" />
                  <span className="text-xs sm:text-sm md:text-base font-black text-white tracking-wider uppercase relative z-10 drop-shadow-lg">New Year 2025 Celebration</span>
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300 animate-twinkle relative z-10" style={{animationDelay: '0.5s'}} />
                </div>
              </div>
              
              {/* Main Title - Ultra Premium with Layered Effects */}
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 md:mb-8 leading-[1.15] sm:leading-[1.1] tracking-tight relative">
                {/* Title Glow Background */}
                <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500 -z-10" />
                
                {/* Line 1: Win Amazing */}
                <span className="block sm:inline">
                  <span className="relative inline-block mr-2 sm:mr-3">
                    <span className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent drop-shadow-2xl" style={{ textShadow: '0 0 60px rgba(255,255,255,0.3)' }}>Win</span>
                  </span>
                  <span className="relative inline-block">
                    {/* Animated Glow Behind "Amazing" */}
                    <span className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-amber-400/40 via-yellow-400/50 to-amber-400/40 blur-2xl animate-glow-pulse -z-10" />
                    <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent animate-text-shimmer" style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 3s ease infinite', filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.5))' }}>Amazing</span>
                  </span>
                </span>
                
                {/* Line 2: Prizes in 2025 */}
                <span className="block mt-1 sm:mt-2">
                  <span className="relative inline-block mr-2 sm:mr-3">
                    <span className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent drop-shadow-2xl">Prizes</span>
                  </span>
                  <span className="relative inline-block mr-2 sm:mr-3">
                    <span className="bg-gradient-to-b from-white/80 via-white/70 to-white/50 bg-clip-text text-transparent drop-shadow-2xl">in</span>
                  </span>
                  <span className="relative inline-block group">
                    {/* Animated Glow Behind "2025" */}
                    <span className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-violet-500/40 via-fuchsia-500/50 to-violet-500/40 blur-2xl animate-glow-pulse -z-10" style={{animationDelay: '1s'}} />
                    <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-400 bg-clip-text text-transparent" style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 4s ease infinite', filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.5))' }}>2025</span>
                    {/* Sparkle on 2025 */}
                    <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-twinkle" />
                  </span>
                </span>
              </h1>
              
              {/* Subtitle - Premium with Animated Highlight */}
              <div className="relative max-w-3xl mx-auto mb-6 sm:mb-8 md:mb-10 px-2 sm:px-0">
                <p className="text-slate-200 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-light leading-relaxed">
                  <span className="text-white/90">TUI Holiday Vouchers</span>
                  <span className="text-slate-400">,</span>
                  <span className="text-white/90"> Cash Prizes</span>
                  <span className="text-slate-400"> & More</span>
                  <span className="block mt-1 sm:mt-0 sm:inline text-slate-400"> — Enter for as little as </span>
                  <span className="relative inline-block">
                    <span className="absolute -inset-2 bg-gradient-to-r from-amber-400/30 to-yellow-400/30 blur-lg animate-glow-pulse -z-10" />
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent" style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 2s ease infinite' }}>99p</span>
                  </span>
                </p>
              </div>
              
              {/* Countdown - Premium Animated Section */}
              <div className="mb-6 sm:mb-8 md:mb-10">
                <div className="relative inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-white/10 via-white/5 to-white/10 border border-white/20 overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                  <span className="text-xs sm:text-sm md:text-base text-white/80 tracking-widest uppercase font-semibold relative z-10">Countdown to 2026</span>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" style={{animationDelay: '0.5s'}} />
                </div>
                <PremiumCountdown />
              </div>
              
              {/* Trust Indicators - Premium Glassmorphic Cards */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 px-2 sm:px-0">
                {/* 100% Secure */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-0 group-hover:opacity-60 transition-all duration-500" />
                  <div className="relative flex items-center gap-2 sm:gap-3 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-xl border border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-300 overflow-hidden">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity" />
                    <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs sm:text-sm font-bold text-white">100% Secure</span>
                      <span className="block text-[10px] sm:text-xs text-emerald-400/80">SSL Protected</span>
                    </div>
                  </div>
                </div>
                
                {/* Fair Play */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-60 transition-all duration-500" />
                  <div className="relative flex items-center gap-2 sm:gap-3 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-xl border border-amber-500/30 hover:border-amber-400/60 transition-all duration-300 overflow-hidden">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity" />
                    <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs sm:text-sm font-bold text-white">Fair Play</span>
                      <span className="block text-[10px] sm:text-xs text-amber-400/80">Verified Draws</span>
                    </div>
                  </div>
                </div>
                
                {/* Real Winners */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur opacity-0 group-hover:opacity-60 transition-all duration-500" />
                  <div className="relative flex items-center gap-2 sm:gap-3 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-xl border border-violet-500/30 hover:border-violet-400/60 transition-all duration-300 overflow-hidden">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-400/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity" />
                    <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 shadow-lg shadow-violet-500/30">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs sm:text-sm font-bold text-white">Real Winners</span>
                      <span className="block text-[10px] sm:text-xs text-violet-400/80">Paid Daily</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Competitions */}
        <div className="relative z-10 pb-8">
          <div className="container mx-auto px-0">
            {competitions.length > 0 ? (
              <FeaturedCompetitions competitions={competitions} />
            ) : (
              <div className="text-center text-slate-400 py-12">
                <Sparkles className="w-12 h-12 text-violet-500 mx-auto mb-4" />
                <p className="text-lg">Loading amazing prizes...</p>
              </div>
            )}
          </div>
        </div>

        {/* Premium Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      </section>

      {/* Trust Banner */}
      <StatsBanner />

      {/* Premium Filter Tabs */}
      <section className="bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {[
              { id: "all", label: "All Prizes", icon: Trophy },
              { id: "spin", label: "Spin & Win", icon: Zap },
              { id: "scratch", label: "Scratch Cards", icon: Sparkles },
              { id: "instant", label: "Competitions", icon: Gift }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`relative px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-200 ${
                  activeFilter === filter.id
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 border border-slate-700"
                }`}
                data-testid={`button-filter-${filter.id}`}
              >
                <span className="flex items-center gap-2">
                  <filter.icon className="w-4 h-4 md:w-5 md:h-5" />
                  {filter.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions Grid - Clean Premium Design */}
      <section className="py-10 md:py-16 bg-slate-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_50%_0%,rgba(120,0,255,0.1),transparent)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          {isLoading ? (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 text-violet-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Loading prizes...</p>
            </div>
          ) : filteredCompetitions.length > 0 ? (
            <>
              <div className="text-center mb-8 md:mb-12">
               <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3">
                  <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent animate-text-shimmer" style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 3s ease infinite', filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.5))' }}>
                    {activeFilter === "all" 
                      ? "All Live Competitions" 
                      : activeFilter === "spin"
                      ? "Spin & Win"
                      : activeFilter === "scratch"
                      ? "Scratch Cards"
                      : "Competitions"}
                  </span>
                </h2>
                <p className="text-slate-400 text-sm md:text-base">
                  {activeFilter === "spin" || activeFilter === "scratch" 
                    ? "Instant cash prizes waiting for you"
                    : `${filteredCompetitions.length} prizes available`
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6">
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
            <div className="text-center py-16">
              <Gift className="w-20 h-20 text-red-500/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-xl">No competitions found.</p>
            </div>
          )}
        </div>
        
        <style>{`
          @keyframes gradient-x {
            0%, 100% { background-size: 200% 200%; background-position: left center; }
            50% { background-size: 200% 200%; background-position: right center; }
          }
          .animate-gradient-x { animation: gradient-x 3s ease infinite; }
        `}</style>
      </section>

      {/* Newsletter Section */}
      {isAuthenticated && (
        <section className="py-12 md:py-20 relative overflow-hidden">
          {/* Magical background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/15 rounded-full blur-[80px]" />
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-yellow-500/15 rounded-full blur-[80px]" />
          </div>

          {/* Decorative elements */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500/15 pointer-events-none">
            <Gift className="w-40 h-40 animate-float-slow" />
          </div>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-green-500/15 pointer-events-none">
            <Sparkles className="w-40 h-40 animate-float-medium" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto relative">
              {/* Glowing border effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-3xl blur-sm opacity-75" />
              
              <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 animate-bounce-slow">
                      <Gift className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Star className="w-8 h-8 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl md:text-4xl font-black mb-3">
                    <span className="bg-gradient-to-r from-purple-400 via-yellow-300 to-pink-400 bg-clip-text text-transparent">
                      {user?.receiveNewsletter ? "You're on the VIP List!" : "Join our VIP List!"}
                    </span>
                  </h3>
                  <p className="text-slate-300 text-sm md:text-lg leading-relaxed flex items-center justify-center gap-2 flex-wrap">
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    {user?.receiveNewsletter 
                      ? "Get ready for exclusive 2025 deals and amazing surprises!"
                      : "Subscribe for exclusive deals and New Year prizes!"}
                    <Sparkles className="w-4 h-4 text-purple-300" />
                  </p>
                </div>

                {user?.receiveNewsletter ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-400 mb-4 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="font-semibold">Subscribed with {user.email}</span>
                    </div>
                    <Button
                      type="button"
                      onClick={handleNewsletterUnsubscribe}
                      variant="outline"
                      className="w-full h-12 md:h-14 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-semibold text-base md:text-lg rounded-xl transition-all"
                      disabled={newsletterUnsubscribeMutation.isPending}
                      data-testid="button-newsletter-unsubscribe"
                    >
                      {newsletterUnsubscribeMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-3 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          Unsubscribing...
                        </div>
                      ) : (
                        "Unsubscribe"
                      )}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubscribe} className="space-y-4">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-green-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition" />
                      <div className="relative">
                        <Input
                          type="email"
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          placeholder={user?.email || "Enter your email for 2025 deals"}
                          className="bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-400 h-14 md:h-16 text-base md:text-lg pl-14 pr-4 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50"
                          data-testid="input-newsletter-email"
                          disabled={newsletterSubscribeMutation.isPending}
                        />
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-14 md:h-16 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 hover:from-red-600 hover:via-yellow-400 hover:to-green-600 text-slate-900 font-black text-lg md:text-xl rounded-xl shadow-xl shadow-yellow-500/30 transition-all hover:shadow-2xl hover:shadow-yellow-500/50 hover:scale-[1.02]"
                      disabled={newsletterSubscribeMutation.isPending}
                      data-testid="button-newsletter-subscribe"
                    >
                      {newsletterSubscribeMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                          Joining VIP List...
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Gift className="w-6 h-6" />
                          Get 2025 Deals
                          <Star className="w-5 h-5" />
                        </div>
                      )}
                    </Button>

                    <p className="text-sm text-slate-400 text-center mt-4 flex items-center justify-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      Join thousands on the Nice List!
                      <Star className="w-4 h-4 text-yellow-400" />
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}