import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import StatsBanner from "@/components/stats-banner";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import {
  Sparkles,
  Trophy,
  Zap,
  Shield,
  Lock,
  Star,
  Gift,
  CreditCard,
  CheckCircle,
  ChevronRight,
  Award,
  Crown,
  Coins,
  RotateCw,
  Ticket,
  Heart,
  Gem,
  Diamond,
  ArrowRight,
  Package,
  Wine,
  Smile,
  Target,
  CircleDollarSign,
  CalendarHeart,
  Bell,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });
  const [, setLocation] = useLocation();

  const [activeFilter, setActiveFilter] = useState("all");
  const { isAuthenticated, user } = useAuth() as {
    isAuthenticated: boolean;
    user: User | null;
  };

  const filteredCompetitions = useMemo(() => {
    if (activeFilter === "all") {
      return competitions;
    }
    return competitions.filter((comp) => comp.type === activeFilter);
  }, [competitions, activeFilter]);

  const handleFilterChange = (filterType: string) => {
    setActiveFilter(filterType);
  };

  function redirectToRegister() {
    setLocation("/register");
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-foreground">
      <Header />

      {/* LOVE & LUXURY - Valentine's Premium Platform */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d0b3a] to-[#0a0a1a]">
        {/* Dynamic Background Layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2d0b3a_0%,#1a0b2e_30%,#0a0a1a_70%,#000_100%)]" />

          {/* Romantic mesh gradient */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
              radial-gradient(at 20% 30%, rgba(219, 39, 119, 0.25) 0%, transparent 50%),
              radial-gradient(at 80% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 40%),
              radial-gradient(at 50% 80%, rgba(244, 114, 182, 0.15) 0%, transparent 50%),
              radial-gradient(at 10% 90%, rgba(225, 29, 72, 0.1) 0%, transparent 50%)
            `,
            }}
          />

          {/* Floating hearts */}
          <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-pink-500/10 blur-3xl animate-float-particle" />
          <div
            className="absolute top-[50%] right-[5%] w-48 h-48 rounded-full bg-rose-500/10 blur-3xl animate-float-particle"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-[20%] left-[20%] w-56 h-56 rounded-full bg-purple-500/10 blur-3xl animate-float-particle"
            style={{ animationDelay: "4s" }}
          />

          {/* Sparkle particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-pink-400/70"
              style={{
                top: `${15 + i * 8}%`,
                left: `${10 + i * 8}%`,
                animation: `float-particle ${4 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
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
                    <Gem className="w-4 h-4 text-pink-400" />
                    <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                      Valentine's Luxury Edition
                    </span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] mb-4">
                    <span className="text-white">Love.</span>
                    <br />
                    <span className="animate-text-shimmer bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 bg-clip-text text-transparent">
                      Luxury.
                    </span>
                    <br />
                    <span className="text-white">Prizes.</span>
                  </h1>

                  <p className="text-lg sm:text-xl text-white/50 max-w-md mx-auto lg:mx-0">
                    Win exquisite Valentine's gifts for your special someone. 
                    <span className="text-pink-400 font-semibold">
                      {" "}Over £75,000
                    </span>{" "}
                    in romantic prizes this season.
                  </p>
                </div>

                {/* Game Type Pills */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8 animate-fade-up-delay-2">
                  {[
                    {
                      Icon: Heart,
                      label: "Love Spins",
                      color:
                        "bg-rose-500/20 border-rose-500/30 text-rose-400",
                    },
                    {
                      Icon: Diamond,
                      label: "Diamond Cards",
                      color:
                        "bg-pink-500/20 border-pink-500/30 text-pink-400",
                    },
                    {
                      Icon: Target,
                      label: "Cupid's Arrow",
                      color:
                        "bg-purple-500/20 border-purple-500/30 text-purple-400",
                    },
                  ].map((game, index) => (
                    <div
                      key={index}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm ${game.color} cursor-pointer transition-transform duration-300 hover:scale-105`}
                    >
                      <game.Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {game.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-up-delay-3">
                  <Button
                    onClick={redirectToRegister}
                    className="group relative h-14 px-10 text-lg font-black rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 text-white border-0 shadow-[0_0_40px_rgba(219,39,119,0.4)] transition-all duration-300 hover:shadow-[0_0_60px_rgba(219,39,119,0.6)] hover:scale-105"
                    data-testid="button-hero-play"
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="w-5 h-5 fill-white" />
                      Win For Your Love
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setLocation("/competitions")}
                    className="h-14 px-8 text-base font-semibold rounded-full border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/5"
                    data-testid="button-hero-browse"
                  >
                    View Romantic Prizes
                  </Button>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 mt-8 animate-fade-up-delay-4">
                  {[
                    { value: "£30K+", label: "Romantic Gifts" },
                    { value: "500+", label: "Couples Won" },
                    { value: "£1.49", label: "Love Entry" },
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xl sm:text-2xl font-black text-white">
                        {stat.value}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Premium Hero Image */}
              <div className="relative flex items-center justify-center order-1 lg:order-2 animate-fade-up-delay-2">
                {/* Glowing backdrop */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-rose-500/30 via-pink-500/15 to-transparent blur-3xl" />
                </div>

                {/* Hero Image Container */}
                <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
                  {/* Glow ring */}
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-rose-500/25 via-pink-400/15 to-rose-500/25 blur-xl" />

                  {/* Image with premium frame */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-rose-500/40 shadow-[0_0_80px_rgba(219,39,119,0.3)]">
                    <img
                      src="/attached_assets/trophy_winner_celebration_moment.png"
                      alt="Valentine's Luxury Prizes"
                      className="w-full h-auto object-cover"
                    />

                    {/* Bottom info bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
                          <span className="text-pink-400 text-sm font-bold tracking-wide">
                            VALENTINE'S SPECIAL
                          </span>
                        </div>
                        <span className="text-white/80 text-sm font-medium">
                          Win luxury gifts for your partner
                        </span>
                      </div>
                    </div>

                    {/* Floating heart badges */}
                    <div className="absolute top-4 right-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center animate-bounce">
                        <Heart className="w-5 h-5 text-white fill-white" />
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
              { icon: Diamond, text: "Luxury Prizes" },
              { icon: CheckCircle, text: "Verified Fair" },
              { icon: Gift, text: "Romantic Gifts" },
              { icon: Shield, text: "Secure & Safe" },
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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d0b3a] to-[#1a0b2e]">
        <div className="container mx-auto px-0 py-0">
          {competitions.length > 0 ? (
            <FeaturedCompetitions competitions={competitions} />
          ) : (
            <div className="text-center text-pink-400/50 py-12">
              <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-pink-300/70">Loading romantic prizes...</p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Banner */}
      <StatsBanner />

      {/* Why Choose Us - LOVE FOCUSED! */}
      <section className="bg-gradient-to-br from-rose-500/5 via-background to-background py-8 md:py-12 border-b-2 border-rose-500/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-4xl font-black mb-2">
              <span className="bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 bg-clip-text text-transparent">
                Why Love & Luxury?
              </span>
            </h2>
            <p className="text-pink-300/70 text-sm md:text-base">
              Creating magical moments for you and your special someone
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                icon: Diamond,
                title: "Luxury Selection",
                description:
                  "Hand-picked premium gifts for the perfect Valentine's surprise",
                gradient: "from-pink-500 to-rose-500",
              },
              {
                icon: Heart,
                title: "Romantic Experience",
                description:
                  "Curated specifically for couples and romantic celebrations",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: Zap,
                title: "Instant Wins",
                description:
                  "No waiting - find out immediately if you've won the perfect gift",
                gradient: "from-rose-500 to-orange-400",
              },
              {
                icon: Package,
                title: "Thoughtful Gifts",
                description:
                  "From jewelry to romantic getaways - prizes that create memories",
                gradient: "from-fuchsia-500 to-purple-500",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card border-2 border-border hover:border-rose-500 rounded-xl p-4 md:p-6 text-center group hover:shadow-xl hover:shadow-rose-500/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex justify-center mb-3">
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
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
      <section className="bg-gradient-to-r from-[#1a0b2e] via-[#2d0b3a] to-[#1a0b2e] border-b-2 border-rose-500/30 sticky top-0 z-40 backdrop-blur-sm shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {[
              {
                id: "all",
                label: "All Prizes",
                icon: Sparkles,
                color: "from-rose-500 to-pink-500",
              },
              {
                id: "spin",
                label: "Love Spins",
                icon: Heart,
                color: "from-purple-500 to-fuchsia-500",
              },
              {
                id: "scratch",
                label: "Diamond Cards",
                icon: Diamond,
                color: "from-pink-500 to-rose-500",
              },
              {
                id: "instant",
                label: "Romantic",
                icon: Target,
                color: "from-red-500 to-pink-500",
              },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`relative px-4 md:px-8 py-3 md:py-4 rounded-xl font-black text-sm md:text-base tracking-wide transition-all overflow-hidden group ${
                  activeFilter === filter.id
                    ? "shadow-2xl shadow-rose-500/50 scale-105"
                    : "bg-[#2d0b3a]/50 text-pink-300 hover:bg-[#2d0b3a] hover:shadow-lg hover:shadow-rose-500/20"
                }`}
                data-testid={`button-filter-${filter.id}`}
              >
                {activeFilter === filter.id && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${filter.color} animate-pulse`}
                  ></div>
                )}
                {activeFilter === filter.id && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${filter.color} blur-xl opacity-75`}
                  ></div>
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 md:gap-2 ${
                    activeFilter === filter.id
                      ? "text-white drop-shadow-lg"
                      : ""
                  }`}
                >
                  <filter.icon className="w-4 h-4 md:w-5 md:h-5" />
                  {filter.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions Grid */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-background via-rose-500/5 to-background relative overflow-hidden">
        {/* Romantic background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-rose-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-pink-300/70 font-semibold">
                Loading romantic prizes...
              </p>
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-pink-400/50 mx-auto mb-4" />
              <p className="text-pink-300/70 text-lg">
                No romantic competitions found.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-5xl font-black mb-2">
                  <span className="bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 bg-clip-text text-transparent">
                    {activeFilter === "all"
                      ? "💖 Valentine's Collection"
                      : activeFilter === "spin"
                        ? "💘 Love Spins"
                        : activeFilter === "scratch"
                          ? "💎 Diamond Cards"
                          : "🎁 Romantic Prizes"}
                  </span>
                </h2>
                <p className="text-pink-300/70 text-sm md:text-lg font-semibold">
                  {filteredCompetitions.length} perfect gifts for your special someone!
                </p>
              </div>

              {/* FIXED GRID: 2 columns mobile, 3 tablet, 4 desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredCompetitions.map((competition) => (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* How to Win Hearts */}
      <section className="bg-gradient-to-r from-[#1a0b2e] via-[#2d0b3a] to-[#1a0b2e] py-12 md:py-16 border-t-2 border-rose-500/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-2xl md:text-5xl font-black text-center mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 bg-clip-text text-transparent">
              How to Win Hearts
            </span>
          </h2>
          <p className="text-center text-pink-300/70 text-sm md:text-base mb-8 md:mb-12">
            Create the perfect Valentine's surprise in just a few simple steps
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              {
                step: "1",
                title: "Join Our Community",
                desc: "Quick sign up to start your romantic journey",
                icon: "❤️",
                color: "from-rose-500 to-pink-500",
              },
              {
                step: "2",
                title: "Choose Perfect Gift",
                desc: "Browse our curated Valentine's collection",
                icon: "💝",
                color: "from-purple-500 to-fuchsia-500",
              },
              {
                step: "3",
                title: "Play & Win",
                desc: "Enter for your chance to win amazing prizes",
                icon: "🎯",
                color: "from-pink-500 to-rose-500",
              },
              {
                step: "4",
                title: "Surprise & Delight",
                desc: "Deliver the perfect gift to your special someone",
                icon: "✨",
                color: "from-red-500 to-pink-500",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="text-center space-y-2 md:space-y-3 group hover:scale-105 transition-transform"
              >
                <div
                  className={`w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br ${item.color} rounded-full mx-auto flex items-center justify-center shadow-2xl group-hover:shadow-rose-500/50 transition-shadow relative`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                  <span className="relative text-xl md:text-3xl font-black text-white">
                    {item.step}
                  </span>
                </div>
                <div className="text-4xl md:text-5xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-sm md:text-xl font-black text-white">
                  {item.title}
                </h3>
                <p className="text-[10px] md:text-sm text-pink-300/70 leading-relaxed px-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect Gifts Section */}
      {/* <section className="bg-card py-8 md:py-12 border-y-2 border-border">
        <div className="container mx-auto px-4 text-center">
          <Gift className="w-10 h-10 md:w-12 md:h-12 text-rose-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl md:text-3xl font-black mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              The Perfect Valentine's Gifts
            </span>
          </h3>
          <p className="text-pink-300/70 text-sm md:text-base mb-6 max-w-2xl mx-auto">
            From luxurious jewelry to romantic getaways, we've curated the most desired gifts for your special someone.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {[
              "💍 Designer Jewelry",
              "✨ Luxury Watches",
              "🏝️ Romantic Getaways",
              "🍾 Fine Dining",
              "💐 Flower Arrangements",
              "🛍️ Shopping Sprees",
            ].map((badge, i) => (
              <div
                key={i}
                className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-xs md:text-sm border-2 border-rose-500/30 hover:border-rose-500/60 transition-colors cursor-pointer"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Newsletter - Romantic Theme */}
      <section className="bg-gradient-to-r from-rose-500/10 via-background to-pink-500/10 py-12 md:py-16 border-t-2 border-rose-500/20 relative overflow-hidden">
        {/* Floating hearts in background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-pink-500/20 animate-float"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + i * 7}%`,
                animationDelay: `${i * 0.5}s`,
                fontSize: '2rem',
              }}
            >
              ❤️
            </div>
          ))}
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <Bell className="w-10 h-10 md:w-14 md:h-14 text-rose-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl md:text-5xl font-black mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 bg-clip-text text-transparent">
              Join The Romance!
            </span>
          </h2>
          <p className="text-pink-300/70 text-sm md:text-base mb-6 md:mb-8 max-w-xl mx-auto">
            Get exclusive Valentine's offers, romantic prize alerts, and special couple discounts!
          </p>

          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <input
                type="email"
                placeholder="Your romantic email..."
                className="flex-1 bg-background border-2 border-rose-500/30 focus:border-rose-500 text-foreground px-4 py-3 md:py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-sm md:text-base placeholder:text-pink-300/50"
                data-testid="input-newsletter-email"
              />
              <button
                onClick={redirectToRegister}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-black uppercase tracking-wide hover:shadow-2xl hover:shadow-rose-500/50 transition-all text-sm md:text-base hover:scale-105 transform flex items-center justify-center gap-2"
                data-testid="button-subscribe"
              >
                <Heart className="w-4 h-4 fill-white" />
                Join Now
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}