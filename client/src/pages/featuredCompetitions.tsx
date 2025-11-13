import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Zap, Shield, Trophy, Sparkles } from "lucide-react";

interface FeaturedCompetitionsProps {
  competitions: Competition[];
}

export default function FeaturedCompetitions({ competitions }: FeaturedCompetitionsProps) {
  const [, setLocation] = useLocation();

  const instantCompetitions = competitions
    .filter((c) => c.type === "instant")
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
      <div className="max-w-7xl mx-auto px-0">
        <Slider
          {...sliderSettings}
          className="featured-slider"
        >
          {instantCompetitions.map((competition) => (
            <div key={competition.id}>
              <div className="relative rounded-xl md:rounded-2xl overflow-hidden">
                {/* Mobile-First Layout */}
                <div className="relative min-h-[550px] md:min-h-[550px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  
                  {/* Background Image - FULLY VISIBLE on mobile! */}
                  <div className="absolute inset-0">
                    <img
                      src={
                        competition.imageUrl ||
                        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80"
                      }
                      alt=""
                      className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
                  </div>

                  {/* Content Container */}
                  <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-12">
                    
                    {/* Top Badge */}
                    <div className="flex justify-center md:justify-start">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-yellow-400 text-slate-900 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-bold text-[10px] md:text-sm shadow-xl animate-pulse">
                        <Zap className="w-3 h-3 md:w-4 md:h-4" />
                        🔥 LIVE NOW - LIMITED ENTRIES
                      </div>
                    </div>

                    {/* Center Content */}
                    <div className="flex-1 flex flex-col md:flex-row items-center gap-4 md:gap-12 py-4 md:py-6">
                      
                      {/* PREMIUM Prize Image with Gold Border */}
                      <div className="w-full md:w-1/2 flex items-center justify-center">
                        <div className="relative group">
                          {/* Premium Glow Effect - Brand Colors */}
                          <div className="absolute -inset-3 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-700"></div>
                          
                          {/* Image Container with Premium Gold Border */}
                          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#FACC15]/60 shadow-[#FACC15]/30">
                            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                              <img
                                src={
                                  competition.imageUrl ||
                                  "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80"
                                }
                                alt={competition.title}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Light Premium Overlay Effects - Minimal */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none z-10"></div>
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(250,204,21,0.05),transparent_60%)] pointer-events-none z-10"></div>
                              
                              {/* Trending Badge - Brand Colors */}
                              <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 bg-gradient-to-r from-[#FACC15]/95 to-[#F59E0B]/95 backdrop-blur-md text-gray-900 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold flex items-center gap-1.5 md:gap-2 shadow-xl z-20">
                                <span>🔥</span>
                                <span>Trending</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Text Content - FULL TEXT VISIBLE ON MOBILE! */}
                      <div className="w-full md:w-1/2 text-center md:text-left space-y-3 md:space-y-6">
                        <div>
                          <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-bold text-xs md:text-base mb-2">
                            <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="uppercase tracking-wide">Win Big Today</span>
                          </div>
                          
                          {/* PREMIUM Eye-Catching Title - Mobile Optimized */}
                          <div className="relative mb-2 md:mb-4">
                            {/* Subtle glow behind text */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FACC15]/20 via-[#F59E0B]/20 to-[#FACC15]/20 blur-2xl"></div>
                            
                            <h2 
                              className="relative text-xl sm:text-2xl md:text-5xl lg:text-6xl font-black break-words leading-[1.1] tracking-tight"
                              style={{ 
                                wordBreak: 'break-word', 
                                hyphens: 'auto',
                                background: "linear-gradient(135deg, #FACC15 0%, #F59E0B 50%, #FACC15 100%)",
                                backgroundSize: "200% 100%",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                filter: "drop-shadow(0 0 24px rgba(250, 204, 21, 0.3))"
                              }}
                            >
                              {competition.title}
                            </h2>
                            
                            {/* Premium underline accent */}
                            <div className="h-0.5 md:h-1 mt-2 bg-gradient-to-r from-transparent via-[#FACC15] to-transparent rounded-full opacity-60"></div>
                          </div>

                          <p className="text-slate-300 text-sm md:text-lg font-medium break-words">
                            Enter for your chance to win amazing prizes!
                          </p>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4">
                          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-white/20">
                            <Shield className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                            <span className="text-[10px] md:text-sm text-white font-semibold">100% Secure</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-white/20">
                            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                            <span className="text-[10px] md:text-sm text-white font-semibold">Fair Play</span>
                          </div>
                          {(competition.type === "spin" || competition.type === "scratch") && (
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-white/20">
                              <Trophy className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                              <span className="text-[10px] md:text-sm text-white font-semibold">Instant Win</span>
                            </div>
                          )}
                        </div>

                        {/* Price and CTA */}
                        <div className="space-y-3 md:space-y-4">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span className="text-slate-400 text-base md:text-2xl font-bold line-through">
                              £{(parseFloat(competition.ticketPrice) * 2).toFixed(2)}
                            </span>
                            <span className="text-3xl md:text-6xl font-black text-primary">
                              £{parseFloat(competition.ticketPrice).toFixed(2)}
                            </span>
                            <span className="text-slate-300 text-sm md:text-xl font-semibold">
                              per entry
                            </span>
                          </div>

                          <button
                            onClick={() => handleViewCompetition(competition.id)}
                            data-testid="button-enter-competition"
                            className="w-full md:w-auto bg-gradient-to-r from-primary via-yellow-400 to-primary hover:from-yellow-400 hover:via-primary hover:to-yellow-400 text-slate-900 font-black py-3 md:py-5 px-8 md:px-16 rounded-xl transition-all duration-300 shadow-2xl hover:shadow-primary/50 text-sm md:text-2xl uppercase tracking-wide hover:scale-105 transform break-words"
                          >
                            🎯 ENTER NOW
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Trust Line */}
                    <div className="text-center md:text-left">
                      <p className="text-slate-400 text-[10px] md:text-sm break-words">
                        ✓ Every entry has a chance to win • ✓ Prizes guaranteed • ✓ Fair and transparent draws
                      </p>
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
          bottom: 20px;
        }
        
        .featured-slider .slick-dots li button:before {
          color: #FACC15;
          opacity: 0.6;
          font-size: 12px;
        }
        
        .featured-slider .slick-dots li.slick-active button:before {
          opacity: 1;
          color: #FACC15;
        }

        @media (max-width: 768px) {
          .featured-slider .slick-dots {
            bottom: 15px;
          }
          
          .featured-slider .slick-dots li button:before {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
