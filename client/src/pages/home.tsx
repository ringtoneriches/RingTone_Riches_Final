import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import StatsBanner from "@/components/stats-banner";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import { Sparkles, Trophy, Zap, Gift, Mail, CheckCircle2, Shield, Award, Star, ChevronRight, Crown, Wallet, RotateCw, Ticket, Coins, Play, TrendingUp, Flame, PartyPopper, Circle, Target, TicketCheck, Clock, Users, MapPin, Diamond, Gem, Egg, Rabbit, Candy, Flower, Music, Gift as GiftIcon, Timer } from "lucide-react";
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
        title: "Egg-cellent!",
        description: "You're now on the VIP Easter list!",
        variant: "default",
      });
      setNewsletterEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hmm, something went wrong",
        description: error.message || "Failed to subscribe to Easter VIP",
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
        title: "Sad to see you hop away!",
        description: "You've been unsubscribed",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Unsubscribe Failed",
        description: error.message || "Failed to unsubscribe",
        variant: "destructive",
      });
    },
  });

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address for your Easter treats",
        variant: "destructive",
      });
      return;
    }
    
    newsletterSubscribeMutation.mutate(newsletterEmail);
  };

  const handleNewsletterUnsubscribe = () => {
    newsletterUnsubscribeMutation.mutate();
  };

  const [playersOnline] = useState(() => Math.floor(Math.random() * 200) + 340);

const [countdownTime, setCountdownTime] = useState({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
});

useEffect(() => {
  // UK midnight (BST) → convert to UTC manually
  const easterDate = new Date(Date.UTC(2026, 3, 4, 31, 0, 0)).getTime();

  const interval = setInterval(() => {
    const now = Date.now();
    const distance = easterDate - now;

    if (distance <= 0) {
      clearInterval(interval);
      setCountdownTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    setCountdownTime({
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((distance / (1000 * 60)) % 60),
      seconds: Math.floor((distance / 1000) % 60),
    });
  }, 1000);

  return () => clearInterval(interval);
}, []);

  const gamesSection = useInView();
  const winnersSection = useInView();
  const newsletterSection = useInView();

  const gameCards = [
    {
      id: competitions.find(c => c.type === "voltz")?.id, 
    Icon: Zap,
    title: "Easter Voltz",
    desc: "Volt to golden egg",
    gradient: "linear-gradient(135deg, #FFB7C5, #FFD700)",
    glowColor: "rgba(255,183,197,0.3)",
    borderColor: "rgba(255,183,197,0.5)",
    bgColor: "rgba(255,183,197,0.08)",
    iconBg: "linear-gradient(135deg, #FFB7C5, #FFD700)",
    filter: "voltz",
    prize: "£10,000",
<<<<<<< HEAD
=======
    badge: "EGG HUNT",
    badgeColor: "linear-gradient(135deg, #FFB7C5, #FFD700)",
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
    popular: true
    },
     {
      id: competitions.find(c => c.type === "scratch")?.id, 
    Icon: TicketCheck,
<<<<<<< HEAD
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
=======
    title: "Golden Scratch",
    desc: "Scratch for eggs",
    gradient: "linear-gradient(135deg, #98FB98, #FFD700)",
    glowColor: "rgba(152,251,152,0.3)",
    borderColor: "rgba(152,251,152,0.5)",
    bgColor: "rgba(152,251,152,0.08)",
    iconBg: "linear-gradient(135deg, #98FB98, #FFD700)",
    prize: "£5,000",
    filter: "scratch",
    popular: true
  },
  {
    id: competitions.find(c => c.type === "pop")?.id, 
    Icon: Target,
    title: "Bunny Pop",
    desc: "Pop to win",
    gradient: "linear-gradient(135deg, #FFD700, #FFB347)",
    glowColor: "rgba(255,215,0,0.3)",
    borderColor: "rgba(255,215,0,0.5)",
    bgColor: "rgba(255,215,0,0.08)",
    iconBg: "linear-gradient(135deg, #FFD700, #FFB347)",
    prize: "£5,000",
    filter: "pop",
    badge: "NEW",
    badgeColor: "#FFD700",
    popular: false
  },
  {
    id: competitions.find(c => c.type === "plinko")?.id, 
    Icon: Circle,
    title: "Egg Plinko",
    desc: "Drop golden eggs",
    gradient: "linear-gradient(135deg, #DDA0DD, #FFD700)",
    glowColor: "rgba(221,160,221,0.3)",
    borderColor: "rgba(221,160,221,0.5)",
    bgColor: "rgba(221,160,221,0.08)",
    iconBg: "linear-gradient(135deg, #DDA0DD, #FFD700)",
    prize: "£1,000",
    filter: "plinko",
    badge: "HOT",
    badgeColor: "#DDA0DD",
    popular: false
  },
];
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a

  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden" style={{ backgroundColor: '#0a0a0f' }}>
      <Header />

      {/* Easter Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='20' cy='20' r='3' fill='%23FFD700'/%3E%3Ccircle cx='80' cy='30' r='2' fill='%23FFB7C5'/%3E%3Ccircle cx='50' cy='70' r='4' fill='%2398FB98'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '60px 60px',
      }} />

      <section className="relative min-h-[100vh] overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0f2e 30%, #2d1b3d 60%, #1a0f2e 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.4, filter: 'saturate(1.2) brightness(0.7)' }}>
            <source src={heroBgVideo} type="video/mp4" />
          </video>
          
          {/* Easter-themed gradient overlays */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,15,0.2) 0%, rgba(45,27,61,0.3) 40%, rgba(10,10,15,0.5) 100%)' }} />
          
          {/* Floating Easter eggs background */}
          {[...Array(30)].map((_, i) => (
            <div
              key={`bg-egg-${i}`}
              className="absolute animate-float-slow pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
              }}
            >
              <Egg className="w-8 h-12 opacity-[0.03]" style={{ color: ['#FFB7C5', '#98FB98', '#FFD700', '#DDA0DD'][i % 4] }} />
            </div>
          ))}

          <div className="absolute top-[5%] left-[8%] w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,183,197,0.08) 0%, rgba(255,215,0,0.03) 40%, transparent 65%)', filter: 'blur(100px)' }} />
          <div className="absolute bottom-[5%] right-[2%] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(152,251,152,0.06) 0%, transparent 50%)', filter: 'blur(120px)' }} />

          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.6), rgba(255,183,197,0.5), transparent)', backgroundSize: '200% 100%', animation: 'lineSweep 4s linear infinite' }} />
        </div>

        {[...Array(35)].map((_, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none" style={{
            width: `${1 + (i % 5)}px`,
            height: `${1 + (i % 5)}px`,
            background: i % 4 === 0 ? '#FFD700' : i % 4 === 1 ? '#FFB7C5' : i % 4 === 2 ? '#98FB98' : '#DDA0DD',
            top: `${2 + (i * 3.2) % 92}%`,
            left: `${1 + (i * 3.8) % 97}%`,
            animation: `sparkleFloat ${2 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
            boxShadow: `0 0 ${8 + i % 8}px rgba(255,215,0,0.5)`,
          }} />
        ))}

        <div className="relative z-20 flex items-center min-h-[auto] lg:min-h-[100vh] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">

                <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full relative overflow-hidden" style={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,183,197,0.08))',
                    border: '1px solid rgba(255,215,0,0.4)',
                    boxShadow: '0 0 30px rgba(255,215,0,0.15)',
                  }}>
                    <Rabbit className="w-4 h-4" style={{ color: '#FFB7C5', filter: 'drop-shadow(0 0 6px rgba(255,183,197,0.6))' }} />
                    <span style={{ background: 'linear-gradient(90deg, #FFD700, #FFB7C5, #98FB98)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} className="text-xs font-black uppercase tracking-[0.2em]">
                      Easter 2026 • Golden Egg Hunt
                    </span>
                    <Egg className="w-3.5 h-3.5" style={{ color: '#98FB98' }} />
                  </div>
                </div>

                <div className="fade-in-up" style={{ animationDelay: '0.15s' }}>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,215,0,0.05))',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400/50" />
                    <span className="text-white text-sm font-semibold tracking-wide">
                      Welcome back, <span className="font-black" style={{ background: 'linear-gradient(90deg, #FFD700, #FFB7C5, #98FB98)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🐰 {user?.firstName || user?.email?.split('@')[0] || 'Egg Hunter'}</span>
                    </span>
                    <Candy className="w-3 h-3 text-pink-300/50" />
                  </div>
                </div>

                <div className="overflow-hidden w-full">
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.05] tracking-tighter">
                    <span className="block text-reveal" style={{ animationDelay: '0.2s' }}>
                      <span style={{ textShadow: '0 0 80px rgba(255,215,0,0.2)' }}>Your Golden</span>
                    </span>
                    <span className="block text-reveal" style={{ animationDelay: '0.4s' }}>
                      <span className="gold-shimmer" style={{
                        background: 'linear-gradient(100deg, #FFD700 0%, #FFF8DC 25%, #FFD700 50%, #FFB7C5 75%, #FFD700 100%)',
                        backgroundSize: '300% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 60px rgba(255,215,0,0.4))',
                      }}>Easter Egg</span>
                      <span className="inline-block ml-3">
                        <Egg className="w-10 h-10 sm:w-12 sm:h-12 inline-block" style={{ color: '#FFD700', filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.6))', animation: 'bounceSoft 3s ease-in-out infinite' }} />
                      </span>
                    </span>
                    <span className="block text-reveal" style={{ animationDelay: '0.6s' }}>
                      <span style={{ textShadow: '0 0 80px rgba(255,215,0,0.2)' }}>Awaits You!</span>
                    </span>
                  </h1>
                </div>

                <p className="text-white/70 text-sm sm:text-base lg:text-lg max-w-md leading-relaxed fade-in-up" style={{ animationDelay: '0.7s' }}>
                  Hunt for golden eggs, unlock bunny bonuses, and win <span className="font-bold" style={{ color: '#FFD700' }}>extraordinary prizes</span> this Easter season.
                </p>

               {/* Easter Countdown */}
{/* <div className="fade-in-up" style={{ animationDelay: '0.75s' }}>
  <div
    className="flex items-center gap-3 px-4 py-2 rounded-full"
    style={{
      background: 'rgba(255,215,0,0.08)',
      border: '1px solid rgba(255,215,0,0.2)',
    }}
  >
    <Timer className="w-4 h-4 text-amber-400 animate-pulse" />

    <span className="text-white/60 text-xs font-medium">
      Easter Countdown:
    </span>

    <div className="flex gap-2 items-center">
      <span className="text-amber-400 font-black text-sm">
        {countdownTime.days}d
      </span>
      <span className="text-white/40">:</span>

      <span className="text-amber-400 font-black text-sm">
        {countdownTime.hours}h
      </span>
      <span className="text-white/40">:</span>

      <span className="text-amber-400 font-black text-sm">
        {countdownTime.minutes}m
      </span>
      <span className="text-white/40">:</span>

      <span className="text-amber-400 font-black text-sm">
        {countdownTime.seconds}s
      </span>
    </div>

    <PartyPopper className="w-3 h-3 text-pink-300" />
  </div>
</div> */}

                <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 fade-in-up flex-wrap" style={{ animationDelay: '0.8s' }}>
                  {[
<<<<<<< HEAD
                    { value: "£100K+", label: "in prizes", icon: Coins, color: '#f5d76e' },
                    { value: "50,000+", label: "winners", icon: Trophy, color: '#34d399' },
                    
=======
                    { value: "£250K+", label: "Easter Prizes", icon: Gift, color: '#FFD700' },
                    { value: "10,000+", label: "Egg Hunters", icon: Users, color: '#98FB98' },
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
                  ].map((stat, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full transition-all duration-300 hover:scale-[1.03]" style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(10px)',
                    }}>
                      <stat.icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" style={{ color: stat.color }} />
                      <span className="text-base sm:text-lg font-black text-white tracking-tight">{stat.value}</span>
                      <span className="text-white/50 text-[10px] sm:text-xs font-medium">{stat.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 fade-in-up w-full sm:w-auto" style={{ animationDelay: '0.9s' }}>
                  <Button 
                    onClick={() => {
                      const section = document.getElementById("competitions-grid");
                      if (section) {
                        const elementTop = section.getBoundingClientRect().top + window.pageYOffset;
                        window.scrollTo({ top: elementTop - 100, behavior: "smooth" });
                      }
                    }}
                    className="group relative h-12 px-8 text-sm font-bold rounded-full text-[#0a0a0a] border-0 transition-all duration-300 overflow-hidden hover:scale-[1.03] uppercase tracking-wider w-full sm:w-auto"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFB347 50%, #FFD700 100%)',
                      boxShadow: '0 0 40px rgba(255,215,0,0.3)',
                    }}
                  >
                    <span className="absolute inset-0 btn-shine" />
                    <span className="relative flex items-center gap-2">
                      <Egg className="w-4 h-4" />
                      Find Golden Eggs
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
                      color: '#FFD700',
                      border: '1px solid rgba(255,215,0,0.3)',
                      background: 'rgba(255,215,0,0.05)',
                    }}
                  >
                    <Rabbit className="w-4 h-4 mr-2" />
                    Explore Games
                  </Button>
                </div>
              </div>

<<<<<<< HEAD
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
=======
              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden relative" style={{
                  background: 'linear-gradient(180deg, rgba(30,20,35,0.97), rgba(20,15,25,0.98))',
                  border: '1px solid rgba(255,215,0,0.15)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,215,0,0.08)',
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
                  backdropFilter: 'blur(20px)',
                }}>
                  <div className="absolute -inset-[1px] rounded-2xl" style={{
                    background: 'conic-gradient(from 0deg, rgba(255,183,197,0.3), rgba(152,251,152,0.3), rgba(255,215,0,0.3), rgba(221,160,221,0.3), rgba(255,183,197,0.3))',
                    filter: 'blur(1px)',
                    zIndex: 0,
                    animation: 'borderSpin 8s linear infinite',
                  }} />
                  <div className="relative z-[1] rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(30,20,35,0.98), rgba(20,15,25,0.99))' }}>
                    <div className="p-4 pb-3 relative" style={{ borderBottom: '1px solid rgba(255,215,0,0.1)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,183,197,0.15))', border: '1px solid rgba(255,215,0,0.3)' }}>
                            <Crown className="w-5 h-5" style={{ color: '#FFD700' }} />
                          </div>
                          <div>
                            <h3 className="text-base font-black tracking-tight leading-none" style={{ color: '#FFD700' }}>Easter Games</h3>
                            <p className="text-white/30 text-[10px] mt-0.5 font-medium">Choose your egg-citing adventure</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,183,197,0.08))', border: '1px solid rgba(255,215,0,0.2)' }}>
                          <Sparkles className="w-3 h-3" style={{ color: '#FFD700' }} />
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#FFD700' }}>4 Games</span>
                        </div>
                      </div>
                    </div>

<<<<<<< HEAD
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
=======
                    <div className="p-3 space-y-2">
                      {gameCards.map((game, index) => (
                        <button
                          key={index}
                          onClick={() => setLocation(`/competition/${game.id}`)}
                          className="group w-full relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
                          style={{
                            background: `linear-gradient(135deg, ${game.bgColor}, rgba(20,15,25,0.95))`,
                            border: `1px solid ${game.borderColor}`,
                            boxShadow: `0 4px 20px ${game.glowColor}`,
                          }}
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-400" style={{ background: `linear-gradient(135deg, ${game.glowColor}, transparent 50%)` }} />
                          
                          <div className="relative flex items-center gap-3 p-3">
                            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative" style={{
                              background: game.iconBg,
                              boxShadow: `0 6px 25px ${game.glowColor}`,
                            }}>
                              <game.Icon className="w-5 h-5 text-white drop-shadow-lg" />
                              <div className="absolute -inset-1 rounded-xl opacity-40 group-hover:opacity-80 transition-opacity" style={{ background: game.iconBg, filter: 'blur(10px)', zIndex: -1 }} />
                            </div>

                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="text-white font-bold text-[13px] truncate">{game.title}</h4>
                                {game.popular && (
                                  <span className="px-2 py-0.5 text-[7px] font-black uppercase tracking-wider rounded-full text-black" style={{
                                    background: 'linear-gradient(135deg, #FFD700, #FFB347)',
                                  }}>{game.badge}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                  ))}
                                </div>
                                <span className="text-white/30 text-[10px] font-medium">{game.desc}</span>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0 mr-1">
                              <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: game.borderColor }}>Win up to</div>
                              <div className="text-xl font-black" style={{
                                background: game.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}>{game.prize}</div>
                            </div>

                            <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-125" style={{
                              background: `linear-gradient(135deg, ${game.bgColor}, rgba(255,255,255,0.08))`,
                              border: `1px solid ${game.borderColor}`,
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
                          color: 'rgba(255,215,0,0.7)',
                          border: '1px solid rgba(255,215,0,0.2)',
                          background: 'rgba(255,215,0,0.06)',
                        }}
                      >
                        <Trophy className="w-3.5 h-3.5 mr-2" />
                        View All Easter Prizes
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style >{`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(10deg); }
          }
          @keyframes sparkleFloat {
            0%, 100% { opacity: 0; transform: scale(0.2) translateY(0); }
            10% { opacity: 1; transform: scale(1.2) translateY(-5px); }
            50% { opacity: 0.8; transform: scale(0.9) translateY(-15px); }
            90% { opacity: 0.3; transform: scale(0.5) translateY(-25px); }
          }
          @keyframes lineSweep {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes borderSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes bounceSoft {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(5deg); }
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes textReveal {
            0% { opacity: 0; transform: translateY(100%) rotateX(-30deg); filter: blur(8px); }
            100% { opacity: 1; transform: translateY(0) rotateX(0deg); filter: blur(0); }
          }
          @keyframes goldShimmer {
            0% { background-position: 300% center; }
            100% { background-position: -300% center; }
          }
          @keyframes btnShine {
            0% { transform: translateX(-100%) skewX(-20deg); }
            100% { transform: translateX(300%) skewX(-20deg); }
          }
          
          .animate-float-slow { animation: float-slow ease-in-out infinite; }
          .fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
          .text-reveal { animation: textReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; display: block; transform-style: preserve-3d; }
          .gold-shimmer { animation: goldShimmer 5s linear infinite; }
          .btn-shine {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: btnShine 3s ease-in-out infinite;
          }
        `}</style>
      </section>

      <section className="py-5 relative overflow-hidden" style={{ background: '#0a0a0f' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-center gap-2 sm:gap-6 lg:gap-10">
            {[
              { icon: Shield, text: "SSL Encrypted", color: '#98FB98', glow: 'rgba(152,251,152,0.3)' },
              { icon: CheckCircle2, text: "Verified Fair Play", color: '#FFD700', glow: 'rgba(255,215,0,0.3)' },
              { icon: Coins, text: "Instant Payouts", color: '#FFB7C5', glow: 'rgba(255,183,197,0.3)' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full group cursor-default transition-all duration-500 hover:scale-[1.05]" style={{
                background: `rgba(${item.color === '#98FB98' ? '152,251,152' : item.color === '#FFD700' ? '255,215,0' : '255,183,197'},0.08)`,
                border: `1px solid ${item.color}40`,
              }}>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${item.color}20, rgba(0,0,0,0.2))`, border: `1px solid ${item.color}40` }}>
                  <item.icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: item.color }} />
                </div>
                <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap" style={{ color: item.color }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative">
        {competitions.length > 0 ? (
          <FeaturedCompetitions competitions={competitions} />
        ) : (
          <div className="text-center text-amber-400/60 py-12" style={{ background: '#0a0a0f' }}>
            <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg">Loading Easter surprises...</p>
          </div>
        )}
      </section>

      <StatsBanner />

      <section className="sticky top-0 z-40 backdrop-blur-2xl" style={{
<<<<<<< HEAD
        background: 'rgba(7,7,9,0.92)',
        borderBottom: '1px solid rgba(0,255,136,0.08)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(0,255,136,0.05)',
=======
        background: 'rgba(10,10,15,0.94)',
        borderBottom: '1px solid rgba(255,215,0,0.1)',
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
<<<<<<< HEAD
              { id: "all", label: "All Games", icon: Trophy, color: '#00ff88', glow: 'rgba(0,255,136,0.3)' },
              { id: "spin", label: "Spin to Win", icon: RotateCw, color: '#ffb800', glow: 'rgba(245,158,11,0.3)' },
              { id: "scratch", label: "Scratch Cards", icon: Sparkles, color: '#00ff88', glow: 'rgba(0,255,136,0.3)' },
               { id: "instant", label: "Competitions", icon: Gift, color: '#f5d76e', glow: 'rgba(245,215,110,0.3)' },
              { id: "plinko", label: "Ringtone Plinko", icon: Circle, color: '#ca6ef5', glow: 'rgba(218, 110, 245, 0.3)' },
              { id: "voltz", label: "Ringtone Voltz", icon: Zap, color: '#6ebff5', glow: 'rgba(110, 157, 245, 0.3)' },
              { id: "pop", label: "Ringtone Pop", icon: Target, color: '#f5736e', glow: 'rgba(245, 126, 110, 0.3)' },
             
=======
              { id: "all", label: "All Games", icon: Trophy, color: '#FFD700' },
              { id: "spin", label: "Egg Spin", icon: RotateCw, color: '#FFB7C5' },
              { id: "scratch", label: "Golden Scratch", icon: Sparkles, color: '#98FB98' },
              { id: "instant", label: "Competitions", icon: Gift, color: '#FFD700' },
              { id: "plinko", label: "Egg Plinko", icon: Circle, color: '#DDA0DD' },
              { id: "voltz", label: "Easter Voltz", icon: Zap, color: '#FFB7C5' },
              { id: "pop", label: "Bunny Pop", icon: Target, color: '#98FB98' }
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-400 flex items-center gap-2`}
                style={activeFilter === filter.id ? {
                  background: `linear-gradient(135deg, ${filter.color}, ${filter.color}cc)`,
                  color: '#0a0a0a',
<<<<<<< HEAD
                  boxShadow: `0 0 25px ${filter.glow}, 0 0 50px ${filter.glow}, 0 2px 8px rgba(0,0,0,0.3)`,
=======
                  boxShadow: `0 0 25px ${filter.color}60`,
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
                  border: `1px solid ${filter.color}`,
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
                }}
<<<<<<< HEAD
                data-testid={`button-filter-${filter.id}`}
=======
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
              >
                <filter.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <section className="py-16 sm:py-24 relative" style={{ background: '#070709' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,255,136,0.03), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(245,215,110,0.02), transparent)' }} />
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(0,255,136,0.08) 30%, rgba(245,215,110,0.12) 50%, rgba(0,255,136,0.08) 70%, transparent 95%)' }} />
=======
      <section className="py-16 sm:py-24 relative" style={{ background: '#0a0a0f' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,215,0,0.03), transparent 70%)' }} />
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
        
        <div id="competitions-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-400 rounded-full mx-auto mb-4 animate-spin" />
              <p className="text-white/30 text-base font-medium">Loading Easter prizes...</p>
            </div>
          ) : filteredCompetitions.length > 0 ? (
            <>
              <div className="text-center mb-10 sm:mb-14">
                <div className="flex items-center justify-center gap-3 mb-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,183,197,0.08))',
                    border: '1px solid rgba(255,215,0,0.25)',
                  }}>
<<<<<<< HEAD
                     {activeFilter === "spin" ? <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ffb800', filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }} /> :
                     activeFilter === "scratch" ? <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#00ff88', filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.6))' }} /> :
                     activeFilter === "instant" ? <Gift className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#f5d76e', filter: 'drop-shadow(0 0 6px rgba(245,215,110,0.6))' }} /> :
                     activeFilter === "voltz" ? <Zap className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#6e99f5', filter: 'drop-shadow(0 0 6px rgba(245,215,110,0.6))' }} /> :
                     activeFilter === "pop" ? <Target className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#f56e6e', filter: 'drop-shadow(0 0 6px rgba(245,215,110,0.6))' }} /> :
                     activeFilter === "plinko" ? <Circle className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#cf6ef5', filter: 'drop-shadow(0 0 6px rgba(245,215,110,0.6))' }} /> :
                     <Trophy className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#00ff88', filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.6))' }} />}
=======
                    {activeFilter === "spin" ? <Egg className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#FFB7C5' }} /> :
                     activeFilter === "scratch" ? <Rabbit className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#98FB98' }} /> :
                     activeFilter === "instant" ? <GiftIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#FFD700' }} /> :
                     activeFilter === "voltz" ? <Zap className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#FFB7C5' }} /> :
                     activeFilter === "pop" ? <Target className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#98FB98' }} /> :
                     activeFilter === "plinko" ? <Circle className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#DDA0DD' }} /> :
                     <Trophy className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#FFD700' }} />}
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
                    background: 'rgba(255,215,0,0.08)',
                    border: '1px solid rgba(255,215,0,0.2)',
                  }}>
                    <div className="relative">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#98FB98', boxShadow: '0 0 6px rgba(152,251,152,0.8)' }} />
                      <div className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping" style={{ background: '#98FB98' }} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: '#98FB98' }}>{filteredCompetitions.length} Live Eggs</span>
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3" style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFB7C5 25%, #98FB98 50%, #FFD700 75%, #FFB347 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {activeFilter === "all" 
                    ? "🥚 Easter Egg Collection 🐰" 
                    : activeFilter === "spin"
                    ? "Spin for Golden Eggs"
                    : activeFilter === "scratch"
                    ? "Scratch & Reveal"
                    : "Egg-citing Competitions"}
                </h2>
                <div className="w-24 h-[2px] mx-auto mb-4" style={{
                  background: 'linear-gradient(90deg, transparent, #FFD700, #98FB98, #FFD700, transparent)',
                }} />
                <p className="text-white/50 text-sm sm:text-base font-medium max-w-lg mx-auto">
                  Hunt for hidden treasures and win big this Easter season!
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
              <Egg className="w-16 h-16 text-white/5 mx-auto mb-4" />
              <p className="text-white/20 text-xl">No Easter eggs found. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

<<<<<<< HEAD
     

=======
>>>>>>> 03834305b50744fb16c4de4e1ec1579a0728bf9a
      {isAuthenticated && (
        <section className="py-24 sm:py-32 relative overflow-hidden" style={{ background: '#0a0a0f' }}>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.04) 0%, transparent 60%)' }} />
          </div>

          <div ref={newsletterSection.ref} className={`container mx-auto px-4 relative z-10 transition-all duration-1000 ${newsletterSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-lg mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 backdrop-blur-sm" style={{
                background: 'rgba(255,215,0,0.08)',
                border: '1px solid rgba(255,215,0,0.2)',
              }}>
                <Rabbit className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Easter VIP Access</span>
                <Egg className="w-3 h-3 text-pink-300" />
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                {user?.receiveNewsletter ? "🐣 You're an Easter VIP! 🐣" : "Get Easter VIP Access"}
              </h3>
              <p className="text-white/30 text-sm sm:text-base mb-8">
                {user?.receiveNewsletter 
                  ? "You'll be first to discover hidden golden eggs and exclusive Easter drops!"
                  : "Early access to Easter egg hunts, golden ticket offers, and insider treats."}
              </p>

              {user?.receiveNewsletter ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 p-4 rounded-xl" style={{
                    background: 'rgba(152,251,152,0.08)',
                    border: '1px solid rgba(152,251,152,0.2)',
                  }}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#98FB98' }} />
                    <span className="font-medium text-sm" style={{ color: '#98FB98' }}>Subscribed with {user.email}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleNewsletterUnsubscribe}
                    variant="ghost"
                    className="w-full h-12 text-white/20 hover:text-red-400 font-medium text-sm rounded-xl transition-all"
                    disabled={newsletterUnsubscribeMutation.isPending}
                  >
                    {newsletterUnsubscribeMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        Hop away...
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
                        disabled={newsletterSubscribeMutation.isPending}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-14 px-8 text-[#0a0a0a] font-black rounded-xl transition-all duration-500 hover:scale-[1.03]"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFB347 100%)',
                        boxShadow: '0 0 25px rgba(255,215,0,0.3)',
                      }}
                      disabled={newsletterSubscribeMutation.isPending}
                    >
                      {newsletterSubscribeMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        "Get Easter Treats"
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