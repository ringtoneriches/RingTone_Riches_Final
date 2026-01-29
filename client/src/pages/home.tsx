import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import StatsBanner from "@/components/stats-banner";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import { Sparkles, Trophy, Zap, Gift, Mail, CheckCircle2, Shield, Award, Star, ChevronRight, Crown, Wallet, RotateCw, Ticket, Coins, Play, TrendingUp, Flame, PartyPopper } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";




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

  return (
    <div className="min-h-screen bg-slate-950 text-foreground relative overflow-x-hidden">
      <Header />

      {/* RINGTONE RICHES PORTAL - Cinematic Gamified Experience */}
      <section className="relative min-h-screen overflow-hidden bg-[#030712]">
        
        {/* Immersive Background with Spotlight Effect */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Deep base */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0a0f1a_0%,#030712_50%,#000_100%)]" />
          
          {/* Golden spotlight from top */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(212,175,55,0.25),transparent_70%)]" />
          
          {/* Animated glow orbs */}
          <div className="absolute top-[20%] left-[10%] w-96 h-96 rounded-full bg-amber-500/8 blur-[100px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[10%] w-72 h-72 rounded-full bg-purple-500/6 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[50%] right-[20%] w-64 h-64 rounded-full bg-emerald-500/5 blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Header Spacer */}
        <div className="" />

        {/* Main Content */}
        <div className="relative z-10 px-4 py-6 sm:py-8">
          <div className="w-full max-w-7xl mx-auto">
            
            {/* === TIER 1: Promise Banner + Live Feed === */}
            <div className="text-center mb-8 sm:mb-12 animate-fade-up">
              {/* Three-Part Promise Banner */}
              <div className="inline-flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-500/40 backdrop-blur-sm mb-6">
                <span className="text-amber-400 font-black text-sm sm:text-base tracking-wide">PLAY</span>
                <span className="text-white/30">•</span>
                <span className="text-emerald-400 font-black text-sm sm:text-base tracking-wide">WIN</span>
                <span className="text-white/30">•</span>
                <span className="text-purple-400 font-black text-sm sm:text-base tracking-wide">CELEBRATE</span>
              </div>
              
              {/* Personalized Welcome */}
              <h1 className="mb-4">
                <span className="block text-white/60 text-lg sm:text-xl font-medium mb-2">
                  Welcome back, <span className="text-amber-400 font-bold">{user?.firstName || user?.email?.split('@')[0] || 'Champion'}</span>
                </span>
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-none">
                  Ready to Join the
                </span>
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-none animate-text-shimmer">
                  Winner List
                </span>
              </h1>
              
              
            </div>

            {/* === TIER 2: Powerful Hero Section === */}
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 mb-8">
              
              {/* Main Hero Image - Takes More Space */}
              <div className="lg:col-span-8 animate-fade-up-delay-1">
                <div className="relative">
                  
                  {/* Dramatic ambient glow */}
                  <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-purple-500/10 blur-3xl" />
                  
                  {/* Hero Image Container - Large and Impactful */}
                  <div className="relative z-10">
                    {/* Outer glow ring */}
                    <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-amber-500/50 via-yellow-400/30 to-amber-500/50 blur-xl" />
                    
                    {/* Premium frame */}
                    <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-[0_0_100px_rgba(212,175,55,0.5)]">
                      {/* Hero Image - Large and Clean */}
                      <img 
                        src="/attached_assets/herosection.png"
                        alt="Win Amazing Prizes - Spin, Scratch, Win Instantly"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Power Stats Row Below Image */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/30">
                    <div className="text-3xl sm:text-4xl font-black animate-text-shimmer">£20K+</div>
                    <div className="text-amber-400/80 text-xs uppercase tracking-wider font-bold mt-1">Weekly Prizes</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border border-emerald-500/30">
                    <div className="text-3xl sm:text-4xl font-black text-emerald-400">1000+</div>
                    <div className="text-emerald-400/80 text-xs uppercase tracking-wider font-bold mt-1">Winners</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/15 to-purple-600/5 border border-purple-500/30">
                    <div className="text-3xl sm:text-4xl font-black text-purple-400">99p</div>
                    <div className="text-purple-400/80 text-xs uppercase tracking-wider font-bold mt-1">From Only</div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="text-center mt-6">
                  <Button 
                    onClick={() => {
    const section = document.getElementById("competitions-grid");
    if (section) {
      const elementTop = section.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementTop - 100, // Same offset
        behavior: "smooth"
      });
    }
  }}
                    className="h-14 px-12 text-lg font-black rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 border-0 shadow-[0_0_60px_rgba(212,175,55,0.6)] hover:shadow-[0_0_80px_rgba(212,175,55,0.8)] hover:scale-105 transition-all"
                    data-testid="button-hero-play-now"
                  >
                    <Play className="w-6 h-6 mr-2" />
                    START WINNING NOW
                  </Button>
                </div>
              </div>

              {/* Right Panel: Ultra Premium Game Selection */}
              <div className="lg:col-span-4 animate-fade-up-delay-2">
                
                {/* Animated Border Container */}
                <div className="relative rounded-xl sm:rounded-2xl p-[2px] bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500 animate-gradient-x">
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500 blur-lg sm:blur-xl opacity-40 sm:opacity-50 animate-gradient-x" />
                  
                  <div className="relative rounded-xl sm:rounded-2xl bg-slate-950 p-3 sm:p-5 overflow-hidden">
                    {/* Floating orbs - hidden on mobile for performance */}
                    <div className="hidden sm:block absolute top-4 right-4 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="hidden sm:block absolute bottom-4 left-4 w-16 h-16 bg-purple-500/20 rounded-full blur-2xl animate-pulse delay-500" />
                    
                    {/* Header with live indicator */}
                    <div className="relative text-center mb-4 sm:mb-6">
                      <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-gradient-to-r from-red-500/20 via-orange-500/20 to-amber-500/20 border border-red-500/40 mb-2 sm:mb-4 animate-pulse">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-red-400 text-xs sm:text-sm font-black tracking-wider">LIVE NOW</span>
                        <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                      </div>
                      <h3 className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1">Pick Your Winner</h3>
                      <p className="text-white/50 text-xs sm:text-sm">3 ways to win big today</p>
                    </div>
                    
                    {/* Game Cards - Responsive */}
                    <div className="relative space-y-2.5 sm:space-y-4">
          {[
            // {
            //   Icon: PartyPopper,
            //   title: "Pop Balloons",
            //   tagline: "Pop balloons to win",
            //   stars: 5,
            //   badge: "NEW",
            //   badgeColor: "bg-rose-500",
            //   gradient: "from-rose-600 via-pink-500 to-orange-500",
            //   borderColor: "border-rose-400/50",
            //   glowColor: "shadow-rose-500/50",
            //   filter: "instant",
            //   winChance: "HOT"
            // },
            { Icon: RotateCw, title: "Spin & Win", tagline: "Spin to Win Big",  stars: 5, badge: "HOT", badgeColor: "bg-red-500", gradient: "from-purple-600 via-purple-500 to-violet-600", borderColor: "border-purple-400/50", glowColor: "shadow-purple-500/50", filter: "spin" },
            { Icon: Ticket, title: "Scratch Cards", tagline: "Reveal Your Fortune",  stars: 5, badge: "POPULAR", badgeColor: "bg-emerald-500", gradient: "from-emerald-600 via-emerald-500 to-teal-600", borderColor: "border-emerald-400/50", glowColor: "shadow-emerald-500/50", filter: "scratch" },
            { Icon: Zap, title: "Competition", tagline: "Win Big Prizes",  stars: 5,  badge: "MEGA", badgeColor: "bg-amber-500", gradient: "from-amber-500 via-yellow-500 to-orange-500", borderColor: "border-amber-400/50", glowColor: "shadow-amber-500/50", filter: "instant" }
          ].map((game, index) => (
            <button
              key={index}
            onClick={() => {
            handleFilterChange(game.filter);
            setTimeout(() => {
              const section = document.getElementById("competitions-grid");
              if (section) {
                // Get the element's position
                const elementTop = section.getBoundingClientRect().top + window.pageYOffset;
                // Scroll to a position 100px above the element
                window.scrollTo({
                  top: elementTop - 100, // Adjust this value (100px up from the element)
                  behavior: "smooth"
                });
              }
            }, 100);
          }}
      className={`w-full group relative rounded-xl sm:rounded-2xl bg-gradient-to-r ${game.gradient} p-[2px] sm:p-1 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${game.glowColor} shadow-md sm:shadow-lg`}
      data-testid={`button-game-${game.title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Inner card */}
      <div className={`relative rounded-lg sm:rounded-xl bg-slate-900/90 backdrop-blur-sm p-2.5 sm:p-4 border ${game.borderColor}`}>
        {/* Badge */}
        <div className={`absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 ${game.badgeColor} text-white text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-lg`}>
          {game.badge}
        </div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <div className="relative flex items-center gap-2.5 sm:gap-4">
          {/* Glowing Icon */}
          <div className={`relative w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-lg sm:shadow-xl shrink-0`}>
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/20" />
            <game.Icon className="w-5 h-5 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
          </div>
          
          {/* Content */}
          <div className="flex-1 text-left min-w-0">
            <div className="text-white font-black text-sm sm:text-lg mb-0 sm:mb-0.5 truncate">{game.title}</div>
            <div className="text-white/70 text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1">{game.tagline}</div>
            {/* Stars Rating */}
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < game.stars ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
              ))}
              <span className="text-amber-400 text-[9px] sm:text-[10px] font-bold ml-1">{game.winChance}</span>
            </div>
          </div>
          
          {/* Prize Column */}
          <div className="text-right shrink-0">
            <div className="text-white/50 text-[8px] sm:text-[10px] uppercase tracking-wider font-bold hidden sm:block">Win Up To</div>
            <div className={`text-xl sm:text-3xl font-black bg-gradient-to-r ${game.gradient} bg-clip-text text-transparent`}>{game.prize}</div>
            <div className="flex items-center justify-end gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 text-white/40 group-hover:text-white transition-colors">
              <span className="text-[10px] sm:text-xs font-bold">PLAY</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </button>
  ))}
                  </div>
                    
                    {/* Bottom - Winning Message */}
                    <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30">
        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
        <span className="text-amber-400 text-[10px] sm:text-xs font-bold">Your luck awaits</span>
      </div>
    </div>
    <Button 
      variant="ghost"
      size="sm"
      onClick={() => {
        handleFilterChange("all");
        setTimeout(() => {
          const section = document.getElementById("competitions-grid");
          if (section) {
            const elementTop = section.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
              top: elementTop - 100,
              behavior: "smooth"
            });
          }
        }, 100);
      }}
      className="text-amber-400 hover:text-amber-300 font-bold h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
      data-testid="button-view-all-prizes"
    >
      View All
      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" />
    </Button>
  </div>
</div>
                  </div>
                </div>
              </div>
            </div>

            {/* === TIER 3: Trust Signals === */}
            <div className="pt-6 border-t border-white/5 animate-fade-up-delay-4">
              <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                {[
                  { icon: Shield, text: "SSL Secure", color: "text-emerald-400" },
                  { icon: CheckCircle2, text: "Verified Fair", color: "text-amber-400" },
                  { icon: Coins, text: "Instant Payouts", color: "text-purple-400" },
                  // { icon: Award, text: "UK Licensed", color: "text-amber-400" }
                ].map((badge, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/40">
                    <badge.icon className={`w-4 h-4 ${badge.color}`} />
                    <span className="text-xs font-medium">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Competitions Section */}
      <section className="relative py-8 sm:py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {competitions.length > 0 ? (
            <FeaturedCompetitions competitions={competitions} />
          ) : (
            <div className="text-center text-slate-400 py-12">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p className="text-lg">Loading amazing prizes...</p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Banner */}
      <StatsBanner />

      {/* Modern Filter Tabs */}
      <section className="glass-modern sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              { id: "all", label: "All", icon: Trophy },
              { id: "spin", label: "Spin", icon: Zap },
              { id: "scratch", label: "Scratch", icon: Sparkles },
              { id: "instant", label: "Competition", icon: Gift }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  activeFilter === filter.id
                    ? "btn-modern-primary"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:border-amber-500/30 hover:text-white"
                }`}
                data-testid={`button-filter-${filter.id}`}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions Grid - Modern Design */}
      <section className="py-16 sm:py-20 lg:py-24 bg-slate-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.06),transparent)]" />
        
        <div id="competitions-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {isLoading ? (
            <div className="text-center py-20">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-400 text-lg">Loading prizes...</p>
            </div>
          ) : filteredCompetitions.length > 0 ? (
            <>
              <div className="text-center mb-12 lg:mb-16">
                <h2 className="heading-xl text-white mb-4">
                  {activeFilter === "all" 
                    ? "All Prizes" 
                    : activeFilter === "spin"
                    ? "Spin & Win"
                    : activeFilter === "scratch"
                    ? "Scratch Cards"
                    : "Competitions"}
                </h2>
                <p className="text-slate-500 text-base sm:text-lg">
                  {filteredCompetitions.length} prizes available
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
              <Gift className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 text-xl">No competitions found.</p>
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
          {/* Royal background */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-[80px]" />
          </div>

          {/* Decorative elements */}
          {/* <div className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500/15 pointer-events-none">
            <Gift className="w-40 h-40" />
          </div>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-yellow-500/15 pointer-events-none">
            <Sparkles className="w-40 h-40" />
          </div> */}

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto relative">
              {/* Premium Gold Glowing border effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-3xl blur-sm opacity-60" />
              
              <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-4">
                    {/* <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40">
                      <Gift className="w-12 h-12 text-slate-900" />
                    </div> */}
                    {/* <div className="absolute -top-2 -right-2">
                      <Star className="w-8 h-8 text-yellow-400 animate-pulse" />
                    </div> */}
                  </div>
                  
                  <h3 className="text-2xl md:text-4xl font-black mb-3">
                    <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                      {user?.receiveNewsletter ? "You're on the VIP List!" : "Join our VIP List!"}
                    </span>
                  </h3>
                  <p className="text-slate-300 text-sm md:text-lg leading-relaxed flex items-center justify-center gap-2 flex-wrap">
                    {/* <Sparkles className="w-4 h-4 text-amber-400" /> */}
                    {user?.receiveNewsletter 
                      ? "Get ready for exclusive deals and amazing surprises!"
                      : "Subscribe for exclusive deals and New Year prizes!"}
                    {/* <Sparkles className="w-4 h-4 text-amber-400" /> */}
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
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition" />
                      <div className="relative">
                        <Input
                          type="email"
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          placeholder={user?.email || "Enter your email for exclusive deals"}
                          className="bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-400 h-14 md:h-16 text-base md:text-lg pl-14 pr-4 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50"
                          data-testid="input-newsletter-email"
                          disabled={newsletterSubscribeMutation.isPending}
                        />
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-14 md:h-16 btn-premium text-slate-900 font-black text-lg md:text-xl rounded-xl border border-amber-300/30"
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
                          {/* <Gift className="w-6 h-6" /> */}
                          Get VIP Deals
                          {/* <Star className="w-5 h-5" /> */}
                        </div>
                      )}
                    </Button>

                    <p className="text-sm text-slate-400 text-center mt-4 flex items-center justify-center gap-2">
                      {/* <Star className="w-4 h-4 text-yellow-400" /> */}
                      Join thousands on the Nice List!
                      {/* <Star className="w-4 h-4 text-yellow-400" /> */}
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