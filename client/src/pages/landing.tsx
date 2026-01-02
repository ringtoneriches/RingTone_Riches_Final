import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import StatsBanner from "@/components/stats-banner";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import { Sparkles, Trophy, Zap, Shield, Lock, Star, Gift, CreditCard, CheckCircle, ChevronRight, Award, Crown, Coins, RotateCw, Ticket } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

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

  //   const redirectToRegister = ()=> {
  //     setLocation("/register")
  // }
  function redirectToRegister() {
   setLocation("/register")
  }
  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      <Header />

      {/* FORTUNE ARENA - Premium Prize Platform */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#030712]">
        
        {/* Dynamic Background Layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0f172a_0%,#030712_50%,#000_100%)]" />
          
          {/* Animated mesh gradient */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `
              radial-gradient(at 20% 30%, rgba(212,175,55,0.15) 0%, transparent 50%),
              radial-gradient(at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 40%),
              radial-gradient(at 50% 80%, rgba(16,185,129,0.08) 0%, transparent 50%)
            `
          }} />
          
          {/* Floating orbs */}
          <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-amber-500/5 blur-3xl animate-float-particle" />
          <div className="absolute top-[50%] right-[5%] w-48 h-48 rounded-full bg-purple-500/5 blur-3xl animate-float-particle" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-[20%] left-[20%] w-56 h-56 rounded-full bg-emerald-500/5 blur-3xl animate-float-particle" style={{ animationDelay: '4s' }} />
          
          {/* Sparkle particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-amber-400/60"
              style={{
                top: `${15 + (i * 10)}%`,
                left: `${10 + (i * 12)}%`,
                animation: `float-particle ${4 + (i * 0.5)}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>

        {/* Header Spacer */}
        <div className="" />

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:pt-0 sm:py-8">
          <div className="w-full max-w-6xl mx-auto">
            

            {/* Hero Grid Layout */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Headlines + CTA */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                {/* Main Headline */}
                <div className="mb-6 animate-fade-up-delay-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Premium Prize Platform</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] mb-4">
                    <span className="text-white">Play.</span>
                    <br />
                    <span className="animate-text-shimmer">Win.</span>
                    <br />
                    <span className="text-white">Celebrate.</span>
                  </h1>
                  
                  <p className="text-lg sm:text-xl text-white/50 max-w-md mx-auto lg:mx-0">
                    Spin the wheel, scratch to reveal, or win instantly. Over <span className="text-amber-400 font-semibold">£50,000</span> in prizes this month.
                  </p>
                </div>

                {/* Game Type Pills */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8 animate-fade-up-delay-2">
                  {[
                    { Icon: RotateCw, label: "Spin & Win", color: "bg-purple-500/20 border-purple-500/30 text-purple-400" },
                    { Icon: Ticket, label: "Scratch Cards", color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" },
                    { Icon: Zap, label: "Instant Wins", color: "bg-amber-500/20 border-amber-500/30 text-amber-400" }
                  ].map((game, index) => (
                    <div
                      key={index}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm ${game.color} cursor-pointer transition-transform duration-300 hover:scale-105`}
                    >
                      <game.Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{game.label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-up-delay-3">
                  <Button 
                    onClick={redirectToRegister}
                    className="group relative h-14 px-10 text-lg font-black rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 border-0 shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all duration-300 hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] hover:scale-105"
                    data-testid="button-hero-play"
                  >
                    <span className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Start Winning
                      <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setLocation("/competitions")}
                    className="h-14 px-8 text-base font-semibold rounded-full border-white/20 text-white/80 hover:text-white hover:border-white/40"
                    data-testid="button-hero-browse"
                  >
                    View All Prizes
                  </Button>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 mt-8 animate-fade-up-delay-4">
                  {[
                    { value: "10,000+", label: "Winners" },
                    { value: "£500K+", label: "Won" },
                    { value: "50+", label: "Daily Prizes" }
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Premium Hero Image */}
              <div className="relative flex items-center justify-center order-1 lg:order-2 animate-fade-up-delay-2">
                
                {/* Glowing backdrop */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-amber-500/30 via-yellow-500/15 to-transparent blur-3xl" />
                </div>
                
                {/* Hero Image Container */}
                <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
                  {/* Glow ring */}
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-500/25 via-yellow-400/15 to-amber-500/25 blur-xl" />
                  
                  {/* Image with premium frame */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-[0_0_80px_rgba(212,175,55,0.3)]">
                    <img 
                      src="/attached_assets/explosive_jackpot_winning_moment.png"
                      alt="Win Amazing Prizes"
                      className="w-full h-auto object-cover"
                    />
                    
                    {/* Bottom info bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400 text-sm font-bold tracking-wide">LIVE NOW</span>
                        </div>
                        <span className="text-white/80 text-sm font-medium">From 99p per entry</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Bar */}
        <div className="relative z-10 py-6 border-t border-white/5">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-white/30">
            {[
              { icon: Shield, text: "SSL Secure" },
              { icon: CheckCircle, text: "Verified Fair" },
              { icon: Coins, text: "Instant Payouts" },
              { icon: Award, text: "UK Licensed" }
            ].map((badge, index) => (
              <div key={index} className="flex items-center gap-2">
                <badge.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Competitions Carousel */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-0 py-0">
          {competitions.length > 0 ? (
            <FeaturedCompetitions competitions={competitions} />
          ) : (
            <div className="text-center text-slate-400 py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading amazing prizes...</p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Banner */}
      <StatsBanner />

      {/* Why Choose Us - TRUST BUILDING! */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-background py-8 md:py-12 border-b-2 border-primary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-4xl font-black mb-2">
              <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
                Why RingTone Riches?
              </span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Your trusted platform for fair and exciting competitions
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                icon: Shield,
                title: "100% Secure",
                description: "Your data and payments are protected with bank-level encryption",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: CheckCircle,
                title: "Fair Play Guaranteed",
                description: "Every entry has an equal chance - completely random selection",
                gradient: "from-primary to-yellow-400"
              },
              {
                icon: Lock,
                title: "Safe Payments",
                description: "Trusted payment partners - your money is always secure",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Star,
                title: "Quick Results",
                description: "No waiting - discover your results immediately after playing",
                gradient: "from-purple-500 to-pink-500"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-card border-2 border-border hover:border-primary rounded-xl p-4 md:p-6 text-center group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex justify-center mb-3">
                  <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-sm md:text-base font-black text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-primary/30 sticky top-0 z-40 backdrop-blur-sm shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {[
              { id: "all", label: "All", icon: Sparkles, color: "from-primary to-yellow-400" },
              { id: "spin", label: "Spin", icon: Zap, color: "from-purple-500 to-pink-500" },
              { id: "scratch", label: "Scratch Cards", icon: Trophy, color: "from-blue-500 to-cyan-500" },
              { id: "instant", label: "Competitions", icon: Gift, color: "from-green-500 to-emerald-500" }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`relative px-4 md:px-8 py-3 md:py-4 rounded-xl font-black text-sm md:text-base tracking-wide transition-all overflow-hidden group ${
                  activeFilter === filter.id
                    ? "shadow-2xl shadow-primary/50 scale-105"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:shadow-lg hover:shadow-primary/20"
                }`}
                data-testid={`button-filter-${filter.id}`}
              >
                {activeFilter === filter.id && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${filter.color} animate-pulse`}></div>
                )}
                {activeFilter === filter.id && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${filter.color} blur-xl opacity-75`}></div>
                )}
                <span className={`relative z-10 flex items-center gap-1.5 md:gap-2 ${
                  activeFilter === filter.id ? "text-slate-900 drop-shadow-lg" : ""
                }`}>
                  <filter.icon className="w-4 h-4 md:w-5 md:h-5" />
                  {filter.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions Grid - 2 COLUMNS ON MOBILE! */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground font-semibold">Loading amazing prizes...</p>
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No competitions found.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-5xl font-black mb-2">
                  <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
                    {activeFilter === "all" 
                      ? "🎯 All Live Competitions" 
                      : activeFilter === "spin"
                      ? "🎡 Spin to Win"
                      : activeFilter === "scratch"
                      ? "🎫 Scratch & Win"
                      : "🏆 Competitions"}
                  </span>
                </h2>
                <p className="text-muted-foreground text-sm md:text-lg font-semibold">
                  {filteredCompetitions.length} amazing prizes waiting for you!
                </p>
              </div>

              {/* FIXED GRID: 2 columns mobile, 3 tablet, 4 desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredCompetitions.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* How to Play */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-12 md:py-16 border-t-2 border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-2xl md:text-5xl font-black text-center mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
              How to Play & Win
            </span>
          </h2>
          <p className="text-center text-slate-400 text-sm md:text-base mb-8 md:mb-12">
            Getting started is quick and easy - you could be winning in minutes!
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { step: "1", title: "Sign Up", desc: "Quick registration - just email and password", icon: "👤", color: "from-blue-500 to-cyan-500" },
              { step: "2", title: "Choose Prize", desc: "Browse our exciting competitions", icon: "🏆", color: "from-purple-500 to-pink-500" },
              { step: "3", title: "Enter & Play", desc: "Buy tickets and play instantly", icon: "🎫", color: "from-green-500 to-emerald-500" },
              { step: "4", title: "Win!", desc: "Get instant results and claim prizes", icon: "👑", color: "from-primary to-yellow-400" }
            ].map((item, index) => (
              <div key={index} className="text-center space-y-2 md:space-y-3 group hover:scale-105 transition-transform">
                <div className={`w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br ${item.color} rounded-full mx-auto flex items-center justify-center shadow-2xl group-hover:shadow-primary/50 transition-shadow relative`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                  <span className="relative text-xl md:text-3xl font-black text-white">{item.step}</span>
                </div>
                <div className="text-4xl md:text-5xl group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-sm md:text-xl font-black text-white">{item.title}</h3>
                <p className="text-[10px] md:text-sm text-slate-400 leading-relaxed px-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Security */}
      <section className="bg-card py-8 md:py-12 border-y-2 border-border">
        <div className="container mx-auto px-4 text-center">
          <Lock className="w-10 h-10 md:w-12 md:h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl md:text-3xl font-black mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              Your Payments Are 100% Secure
            </span>
          </h3>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-2xl mx-auto">
            We use industry-leading payment providers with bank-level encryption. Your financial information is never stored on our servers.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {["🔒 SSL Encrypted", "💳 Secure Checkout", "✅ PCI Compliant", "🛡️ Fraud Protection"].map((badge, i) => (
              <div key={i} className="bg-muted px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-xs md:text-sm border-2 border-green-500/30">
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-r from-primary/10 via-background to-yellow-400/10 py-12 md:py-16 border-t-2 border-primary/20">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-primary mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl md:text-5xl font-black mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
              Get Exclusive Offers!
            </span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8 max-w-xl mx-auto">
             Enter your email to receive our latest news, updates, and offers by email and SMS!
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <input
                type="email"
                placeholder="Enter your email..."
                className="flex-1 bg-background border-2 border-border focus:border-primary text-foreground px-4 py-3 md:py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm md:text-base"
                data-testid="input-newsletter-email"
              />
              <button
              onClick={redirectToRegister}
                className="bg-gradient-to-r from-primary to-yellow-400 hover:from-yellow-400 hover:to-primary text-slate-900 px-6 md:px-8 py-3 md:py-4 rounded-lg font-black uppercase tracking-wide hover:shadow-2xl hover:shadow-primary/50 transition-all text-sm md:text-base hover:scale-105 transform"
                data-testid="button-subscribe"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}