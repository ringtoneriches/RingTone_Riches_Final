import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Zap, Shield, Trophy, Sparkles, ChevronRight, Star, Users, Clock, Award } from "lucide-react";
interface FeaturedCompetitionsProps {
  competitions: Competition[];
}

export default function FeaturedCompetitions({ competitions }: FeaturedCompetitionsProps) {
  const [, setLocation] = useLocation();

  const instantCompetitions = competitions
    .filter((c) => c.type === "scratch" || c.type === "spin" || c.type === "instant")
    .slice(0, 5);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    pauseOnHover: true,
    adaptiveHeight: false,
  };

  const handleViewCompetition = (id: string) => {
    setLocation(`/competition/${id}`);
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4">
        <Slider {...sliderSettings} className="featured-slider">
          {instantCompetitions.map((competition) => (
            <div key={competition.id} data-testid={`slide-featured-competition-${competition.id}`}>
              <div className="relative rounded-3xl overflow-hidden" data-testid={`card-featured-${competition.id}`}>
                
                {/* Cinematic Background with Multiple Layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0c0a20] to-slate-950" />
                
                {/* Aurora Effect - Top */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(139,92,246,0.4),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_70%_-20%,rgba(217,70,239,0.25),transparent)]" />
                
                {/* Ambient Glow - Bottom Right */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_90%_90%,rgba(251,191,36,0.15),transparent)]" />
                
                {/* Animated Sparkle Particles */}
                <div className="absolute inset-0">
                  <div className="absolute top-[8%] left-[12%] w-2 h-2 bg-violet-400 rounded-full animate-twinkle" />
                  <div className="absolute top-[15%] right-[18%] w-2.5 h-2.5 bg-amber-400 rounded-full animate-twinkle" style={{animationDelay: '0.5s'}} />
                  <div className="absolute top-[25%] left-[35%] w-1.5 h-1.5 bg-pink-400 rounded-full animate-twinkle" style={{animationDelay: '1s'}} />
                  <div className="absolute bottom-[35%] right-[28%] w-2 h-2 bg-violet-300 rounded-full animate-twinkle" style={{animationDelay: '1.5s'}} />
                  <div className="absolute bottom-[25%] left-[22%] w-1.5 h-1.5 bg-amber-300 rounded-full animate-twinkle" style={{animationDelay: '0.8s'}} />
                  <div className="absolute top-[40%] right-[8%] w-1 h-1 bg-fuchsia-400 rounded-full animate-twinkle" style={{animationDelay: '1.2s'}} />
                  <div className="absolute top-[5%] left-[50%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-twinkle" style={{animationDelay: '0.3s'}} />
                  <div className="absolute bottom-[15%] right-[45%] w-2 h-2 bg-emerald-400 rounded-full animate-twinkle" style={{animationDelay: '1.8s'}} />
                </div>
                
                {/* Floating Orbs */}
                <div className="absolute top-[20%] left-[5%] w-24 h-24 bg-violet-500/20 rounded-full blur-2xl animate-float-enhanced" />
                <div className="absolute bottom-[20%] right-[5%] w-32 h-32 bg-fuchsia-500/15 rounded-full blur-2xl animate-float-enhanced" style={{animationDelay: '2s'}} />
                <div className="absolute top-[50%] right-[30%] w-20 h-20 bg-amber-500/10 rounded-full blur-xl animate-float-enhanced" style={{animationDelay: '4s'}} />

                {/* Animated Glass Border Effect */}
                <div className="absolute inset-0 rounded-3xl border-2 border-white/10" />
                <div className="absolute inset-[2px] rounded-3xl border border-violet-500/30 animate-border-glow" />
                
                {/* Shimmer Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl" />
                
                {/* Content Container */}
                <div className="relative z-10 min-h-[520px] md:min-h-[560px] flex flex-col p-6 md:p-10 lg:p-14">
                  
                  {/* Top Section - Badge & Stats */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    {/* Featured Badge with Animated Glow */}
                    <div className="relative group">
                      <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 rounded-full blur-md opacity-60 animate-pulse" style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 3s ease infinite, pulse 2s ease-in-out infinite' }} />
                      <div className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 border border-violet-300/40 shadow-lg shadow-violet-500/30">
                        <Star className="w-4 h-4 text-amber-300 fill-amber-300 animate-spin-slow" style={{ animationDuration: '4s' }} />
                        <span className="text-sm font-bold text-white tracking-wider uppercase">Featured Prize</span>
                      </div>
                    </div>
                    
                    {/* Live Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10" data-testid={`text-entries-${competition.id}`}>
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{competition.soldTickets || 0} entries</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10" data-testid={`badge-live-${competition.id}`}>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Live Now</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Content - Asymmetric Split */}
                  <div className="flex-1 flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
                    
                    {/* Prize Image with Cinematic Animated Frame */}
                    <div className="w-full lg:w-[55%] flex items-center justify-center">
                      <div className="relative group w-full max-w-lg " style={{ animationDuration: '8s' }}>
                        {/* Animated Outer Glow Ring */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/40 via-fuchsia-500/40 to-amber-500/30 rounded-3xl blur-2xl animate-glow-pulse" />
                        
                        {/* Rainbow Border Animation */}
                        <div className="absolute -inset-1 rounded-2xl animate-rainbow-border opacity-70" style={{ backgroundSize: '300% 300%' }} />
                        
                        {/* Inner Glow with Pulse */}
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500/50 to-fuchsia-500/50 rounded-2xl blur-lg animate-pulse" />
                        
                        {/* Glass Frame */}
                        <div className="relative rounded-2xl p-1 bg-gradient-to-br from-white/20 via-white/5 to-white/10 overflow-hidden">
                          {/* Frame Shimmer */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                          
                          <div className="relative rounded-xl overflow-hidden bg-slate-900/90 backdrop-blur-sm">
                            <div className="relative">
                              <img
                                src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80"}
                                alt={competition.title}
                                className="w-full h-auto min-h-[200px] md:min-h-[280px] lg:min-h-[320px] object-contain transition-transform duration-700 group-hover:scale-105"
                              />
                              
                              {/* Image Overlay Gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                              
                              {/* Type Badge - Premium Glass */}
                              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-white/10 shadow-xl">
                                {competition.type === "spin" ? <Zap className="w-4 h-4 text-amber-400" /> : 
                                 competition.type === "scratch" ? <Sparkles className="w-4 h-4 text-violet-400" /> :
                                 <Trophy className="w-4 h-4 text-amber-400" />}
                                <span className="capitalize">{competition.type}</span>
                              </div>
                              
                              {/* Prize Value Overlay */}
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Award className="w-5 h-5 text-amber-400" />
                                      <span className="text-white/80 text-sm font-medium">Top Prize</span>
                                    </div>
                                    <span className="text-amber-400 font-bold">WIN BIG!</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Text Content - Premium Layout */}
                    <div className="w-full lg:w-[45%] text-center lg:text-left space-y-6">
                      
                      {/* Title with Gradient */}
                      <div className="space-y-3">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black leading-[1.1] tracking-tight" data-testid={`text-title-${competition.id}`}>
                          <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                            {competition.title}
                          </span>
                        </h2>
                        <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto lg:mx-0">
                          Enter for your chance to win amazing prizes!
                        </p>
                      </div>

                      {/* Trust Badges - Premium Glass */}
                      <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span className="text-white/80 text-sm font-medium">100% Secure</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span className="text-white/80 text-sm font-medium">Fair Play</span>
                        </div>
                        {(competition.type === "spin" || competition.type === "scratch") && (
                          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                            <Zap className="w-4 h-4 text-violet-400" />
                            <span className="text-white/80 text-sm font-medium">Instant Win</span>
                          </div>
                        )}
                      </div>

                      {/* Price Display - Premium Animated */}
                      <div className="flex flex-wrap items-end justify-center lg:justify-start gap-3">
                        <span className="text-slate-500 text-xl font-medium line-through decoration-2">
                          £{(parseFloat(competition.ticketPrice) * 2).toFixed(2)}
                        </span>
                        <div className="relative group">
                          {/* Price Glow */}
                          <div className="absolute -inset-3 bg-gradient-to-r from-amber-400/30 via-yellow-400/40 to-amber-400/30 rounded-xl blur-xl animate-glow-pulse -z-10" />
                          <span 
                            className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent" 
                            data-testid={`text-price-${competition.id}`}
                            style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 3s ease infinite' }}
                          >
                            £{parseFloat(competition.ticketPrice).toFixed(2)}
                          </span>
                        </div>
                        <span className="text-slate-400 text-base pb-2">
                          per entry
                        </span>
                      </div>

                      {/* CTA Button - Premium Animated */}
                      <div className="pt-2">
                        <button
                          onClick={() => handleViewCompetition(competition.id)}
                          data-testid="button-enter-competition"
                          className="relative group w-full lg:w-auto"
                        >
                          {/* Animated Outer Glow */}
                          <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-all duration-300 animate-glow-pulse" style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 3s ease infinite, glow-pulse 2s ease-in-out infinite' }} />
                          
                          {/* Button with Shimmer */}
                          <div className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500 text-white font-bold py-4 px-12 rounded-xl transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 text-lg uppercase tracking-wide border border-white/30 overflow-hidden"
                            style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 3s ease infinite' }}
                          >
                            {/* Button Shimmer Effect */}
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            <span className="relative">Enter Now</span>
                            <ChevronRight className="relative w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Trust Line */}
                  <div className="text-center mt-6 pt-6 border-t border-white/5">
                    <div className="text-slate-500 text-xs md:text-sm flex items-center justify-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                        Every entry has a chance to win
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />
                        Prizes guaranteed
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full inline-block" />
                        Fair and transparent draws
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      <style>{`
        .featured-slider .slick-dots {
          bottom: 24px;
        }
        
        .featured-slider .slick-dots li {
          margin: 0 4px;
        }
        
        .featured-slider .slick-dots li button:before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.3);
          opacity: 1;
        }
        
        .featured-slider .slick-dots li.slick-active button:before {
          background: linear-gradient(to right, #8b5cf6, #d946ef);
          width: 24px;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .featured-slider .slick-dots {
            bottom: 16px;
          }
          
          .featured-slider .slick-dots li button:before {
            width: 6px;
            height: 6px;
          }
          
          .featured-slider .slick-dots li.slick-active button:before {
            width: 18px;
          }
        }
      `}</style>
    </div>
  );
}