import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import Slider from "react-slick";
import { Zap, Shield, Trophy, ChevronRight, Star, Users, Crown, Play, Ticket, RotateCw, Timer, Flame, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FeaturedCompetitionsProps {
  competitions: Competition[];
}

export default function FeaturedCompetitions({ competitions }: FeaturedCompetitionsProps) {
  const [, setLocation] = useLocation();
  const [activeSlide, setActiveSlide] = useState(0);

  const instantCompetitions = competitions
    .filter((c) => c.type === "scratch" || c.type === "spin" || c.type === "instant")
    .slice(0, 5);

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 6000,
    arrows: false,
    pauseOnHover: true,
    adaptiveHeight: false,
    beforeChange: (_: number, next: number) => setActiveSlide(next),
  };

  const handleViewCompetition = (id: string) => {
    setLocation(`/competition/${id}`);
  };

  const getGameIcon = (type: string) => {
    switch (type) {
      case "spin": return RotateCw;
      case "scratch": return Ticket;
      default: return Zap;
    }
  };

  const getGameColor = (type: string) => {
    switch (type) {
      case "spin": return { bg: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/40", text: "text-purple-400" };
      case "scratch": return { bg: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/40", text: "text-emerald-400" };
      default: return { bg: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/40", text: "text-amber-400" };
    }
  };

  const getGameLabel = (type: string) => {
    switch (type) {
      case "spin": return "Spin";
      case "scratch": return "Scratch";
      default: return "Instant";
    }
  };

  return (
    <div className="w-full relative" style={{ perspective: "1200px" }}>
      {/* Section Header - Compact on mobile */}
      <div className="max-w-7xl mx-auto px-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">Featured Prizes</h2>
              <p className="text-white/50 text-xs sm:text-sm hidden sm:block">Premium competitions</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-red-500/10 border border-red-500/30 flex-shrink-0">
            <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
            <span className="text-red-400 text-xs sm:text-sm font-bold">Limited</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <Slider {...sliderSettings} className="featured-slider">
          {instantCompetitions.map((competition) => {
            const GameIcon = getGameIcon(competition.type);
            const colors = getGameColor(competition.type);
            const soldPercent = Math.min(((competition.soldTickets || 0) / (competition.maxTickets || 100)) * 100, 95);
            
            return (
              <div key={competition.id} data-testid={`slide-featured-competition-${competition.id}`}>
                {/* 3D Card Container */}
                <div 
                  className="relative group"
                  style={{ transformStyle: "preserve-3d" }}
                  data-testid={`card-featured-${competition.id}`}
                >
                  {/* 3D Shadow/Glow Layer - Behind card */}
                  <div 
                    className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                    style={{ 
                      transform: "translateZ(-40px) scale(0.95)",
                      background: "radial-gradient(ellipse at center, rgba(212,175,55,0.25), transparent 70%)",
                      filter: "blur(40px)"
                    }}
                  />
                  
                  {/* Main 3D Card */}
                  <div 
                    className="relative rounded-2xl sm:rounded-3xl overflow-hidden transition-transform duration-500 group-hover:scale-[1.01]"
                    style={{ 
                      transformStyle: "preserve-3d",
                      transform: "translateZ(0px)",
                      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 80px rgba(212,175,55,0.1)"
                    }}
                  >
                    {/* Background with 3D depth layers */}
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#030712] to-[#0a0f1a]" />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,rgba(212,175,55,0.12),transparent_60%)]" />
                    </div>
                    
                    {/* 3D Border Effect - Multiple layers */}
                    <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-amber-500/30" style={{ transform: "translateZ(2px)" }} />
                    <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" style={{ transform: "translateZ(4px)" }} />
                    <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* Content */}
                    <div className="relative z-10 p-4 sm:p-6 md:p-8" style={{ transform: "translateZ(10px)" }}>
                      
                      {/* Top Badges - Compact */}
                      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
                            style={{ transform: "translateZ(15px)", boxShadow: "0 4px 15px rgba(212,175,55,0.4)" }}
                          >
                            <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-900" />
                            <span className="text-[10px] sm:text-xs font-black text-slate-900 uppercase">Featured</span>
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r ${colors.bg} border ${colors.border}`}>
                            <GameIcon className={`w-3 h-3 ${colors.text}`} />
                            <span className={`text-[10px] sm:text-xs font-bold ${colors.text}`}>
                              {competition.type === "instant"
                              ? "Competition"
                              : getGameLabel(competition.type)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10" data-testid={`text-entries-${competition.id}`}>
                            <Users className="w-3 h-3 text-emerald-400" />
                            <span className="text-white/60 text-[10px]">{competition.soldTickets || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30" data-testid={`badge-live-${competition.id}`}>
                            <div className="relative">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                              <div className="absolute inset-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                            </div>
                            <span className="text-emerald-400 text-[10px] font-bold">LIVE</span>
                          </div>
                        </div>
                      </div>

                      {/* RESPONSIVE LAYOUT: Stack on mobile, side-by-side on desktop */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        
                        {/* IMAGE - 3D Effect */}
                        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
                          <div 
                            className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-amber-500/30 transition-transform duration-500 group-hover:scale-[1.02]"
                            style={{ 
                              transform: "translateZ(20px)",
                              boxShadow: "0 20px 40px -20px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.15)"
                            }}
                          >
                            <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] lg:aspect-[4/3]">
                              <img
                                src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=90"}
                                alt={competition.title}
                                className="w-full h-98 object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                              
                              {/* Premium Badge - 3D */}
                              <div 
                                className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10"
                                style={{ transform: "translateZ(5px)" }}
                              >
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span className="text-white text-[10px] sm:text-xs font-bold">Premium</span>
                              </div>
                              
                              {/* Progress bar */}
                              {
                                competition.type === "instant"  ? (
                                   <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
                                <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                                  <span className="text-white/70">Filling fast</span>
                                  <span className="text-amber-400 font-bold">{Math.round(soldPercent)}%</span>
                                </div>
                                <div className="h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
                                    style={{ width: `${soldPercent}%` }}
                                  />
                                </div>
                              </div>
                                ) : null
                              }
                            </div>
                          </div>
                        </div>

                        {/* CONTENT - 3D layered */}
                        <div className="flex flex-col justify-center" style={{ transform: "translateZ(15px)" }}>
                          {/* Title & Description - Responsive text sizes */}
                          <div className="mb-3 sm:mb-4">
                            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-1.5 sm:mb-2" data-testid={`text-title-${competition.id}`}>
                              {competition.title}
                            </h2>
                            <p className="text-white/50 text-sm sm:text-base line-clamp-2">
                              Enter now for your chance to win this incredible prize!
                            </p>
                          </div>

                          {/* Feature Chips - Compact grid */}
                          <div className="grid grid-cols-2 gap-2 mb-4 sm:mb-5">
                            {[
                              { icon: Shield, text: "Secure", color: "text-emerald-400" },
                              { icon: Trophy, text: "Guaranteed", color: "text-amber-400" },
                              { icon: CheckCircle, text: "Verified", color: "text-purple-400" },
                              { icon: Zap, text: "Instant", color: "text-pink-400" }
                            ].map((chip, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                                <chip.icon className={`w-3.5 h-3.5 ${chip.color}`} />
                                <span className="text-white/70 text-xs font-medium">{chip.text}</span>
                              </div>
                            ))}
                          </div>

                          {/* Price & CTA Row */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            {/* Price - 3D effect */}
                            <div className="flex items-baseline gap-2" style={{ transform: "translateZ(5px)" }}>
                              <span className="text-white/30 text-sm line-through">
                                £{(parseFloat(competition.ticketPrice) * 2).toFixed(2)}
                              </span>
                              <span 
                                className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-lg" 
                                data-testid={`text-price-${competition.id}`}
                              >
                                £{parseFloat(competition.ticketPrice).toFixed(2)}
                              </span>
                              <span className="text-white/40 text-xs sm:text-sm">per entry</span>
                            </div>

                            {/* CTA Buttons - 3D effect */}
                            <div 
                              className="flex gap-2 w-full sm:w-auto"
                              style={{ transform: "translateZ(25px)" }}
                            >
                              <Button
                                onClick={() => handleViewCompetition(competition.id)}
                                data-testid="button-enter-competition"
                                className="flex-1 sm:flex-none h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-black rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 border-0 shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:shadow-[0_12px_40px_rgba(212,175,55,0.6)] hover:translate-y-[-2px] transition-all"
                              >
                                <Play className="w-4 h-4 mr-1.5" />
                                Enter Now
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => handleViewCompetition(competition.id)}
                                className="h-10 sm:h-12 px-3 sm:px-4 text-sm font-bold rounded-lg sm:rounded-xl border border-white/20 text-white hover:bg-white/5"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Trust Bar - Compact on mobile */}
                      <div className="mt-4 pt-3 sm:pt-4 border-t border-white/5">
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-white/40 text-[10px] sm:text-xs">
                          {[
                            { dot: "bg-emerald-400", text: "Quick Payout" },
                            { dot: "bg-amber-400", text: "UK Licensed" },
                            { dot: "bg-purple-400", text: "24/7 Support" }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 ${item.dot} rounded-full`} />
                              <span>{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Slider>
      </div>

      {/* Slide Indicators */}
      <div className="max-w-7xl mx-auto px-4 mt-4 sm:mt-6">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {instantCompetitions.map((_, i) => (
            <div
              key={i}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                i === activeSlide 
                  ? 'w-6 sm:w-10 bg-gradient-to-r from-amber-400 to-yellow-400 shadow-lg shadow-amber-500/30' 
                  : 'w-1 sm:w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}