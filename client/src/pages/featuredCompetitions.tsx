import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Zap, Shield, Trophy, Sparkles, Snowflake, Gift, Star } from "lucide-react";

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
      <div className="max-w-7xl mx-auto px-0">
        <Slider
          {...sliderSettings}
          className="featured-slider"
        >
          {instantCompetitions.map((competition) => (
            <div key={competition.id}>
              <div className="relative rounded-xl md:rounded-2xl overflow-hidden">
                {/* Mobile-First Layout with SPECTACULAR Christmas Theme */}
                <div className="relative min-h-[550px] md:min-h-[550px] bg-gradient-to-br from-red-950 via-slate-900 to-green-950">
                  
                  {/* Animated Christmas Lights Border */}
                  <div className="absolute top-0 left-0 right-0 h-8 z-[8] flex items-center justify-center gap-3 bg-gradient-to-b from-black/40 to-transparent">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full animate-twinkle-light shadow-lg"
                        style={{
                          backgroundColor: ['#ef4444', '#22c55e', '#facc15', '#3b82f6', '#ec4899'][i % 5],
                          boxShadow: `0 0 10px 2px ${['#ef4444', '#22c55e', '#facc15', '#3b82f6', '#ec4899'][i % 5]}`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Christmas Snow Particles - Reduced */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute bg-white rounded-full opacity-70"
                        style={{
                          width: `${2 + Math.random() * 4}px`,
                          height: `${2 + Math.random() * 4}px`,
                          left: `${Math.random() * 100}%`,
                          top: `-10px`,
                          animation: `featured-snow ${3 + Math.random() * 4}s linear infinite`,
                          animationDelay: `${Math.random() * 3}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Glowing Corner Ornaments */}
                  <div className="absolute top-10 left-3 z-[6]">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 blur-xl opacity-50 animate-pulse"></div>
                      <div className="relative w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full border-2 border-yellow-400 shadow-lg shadow-red-500/50 animate-bounce-slow"></div>
                    </div>
                  </div>
                  <div className="absolute top-10 right-3 z-[6]">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 blur-xl opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="relative w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-yellow-400 shadow-lg shadow-green-500/50 animate-bounce-slow" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                  </div>
                  
                  {/* Floating Stars */}
                  <div className="absolute top-20 left-1/4 z-[6] hidden md:block">
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                  </div>
                  <div className="absolute top-32 right-1/4 z-[6] hidden md:block">
                    <Star className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-[0_0_12px_rgba(253,224,71,0.8)]" style={{ animationDelay: '1s' }} />
                  </div>
                  
                  {/* Candy Cane Corner Accents */}
                  <div className="absolute bottom-0 left-0 w-16 h-16 md:w-24 md:h-24 z-[6] opacity-40">
                    <div className="absolute bottom-2 left-2 w-2 h-12 md:h-16 bg-gradient-to-b from-red-500 via-white to-red-500 rounded-full transform -rotate-12"></div>
                    <div className="absolute bottom-2 left-5 w-2 h-10 md:h-14 bg-gradient-to-b from-white via-red-500 to-white rounded-full transform rotate-12"></div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 md:w-24 md:h-24 z-[6] opacity-40 transform scale-x-[-1]">
                    <div className="absolute bottom-2 left-2 w-2 h-12 md:h-16 bg-gradient-to-b from-red-500 via-white to-red-500 rounded-full transform -rotate-12"></div>
                    <div className="absolute bottom-2 left-5 w-2 h-10 md:h-14 bg-gradient-to-b from-white via-red-500 to-white rounded-full transform rotate-12"></div>
                  </div>
                  
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
                    {/* Christmas glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-green-500/5"></div>
                  </div>

                  {/* Content Container */}
                  <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-12">
                    
                    {/* Top Badge - Christmas themed */}
                    <div className="flex justify-center md:justify-start">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-green-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full font-bold text-[10px] md:text-sm shadow-xl shadow-red-500/30 animate-pulse border border-white/20">
                        <Gift className="w-3 h-3 md:w-4 md:h-4" />
                        <Snowflake className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        CHRISTMAS SPECIAL
                        <Snowflake className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      </div>
                    </div>

                    {/* Center Content */}
                    <div className="flex-1 flex flex-col md:flex-row items-center gap-4 md:gap-12 py-4 md:py-6">
                      
                      {/* PREMIUM Prize Image with Christmas Border */}
                      <div className="w-full md:w-1/2 flex items-center justify-center">
                        <div className="relative group">
                          {/* Christmas Glow Effect */}
                          <div className="absolute -inset-3 bg-gradient-to-r from-red-500 via-green-500 to-red-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-all duration-700"></div>
                          
                          {/* Image Container with Christmas Border */}
                          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-red-500/50 group-hover:border-green-500/60 transition-colors shadow-red-500/20">
                            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                              <img
                                src={
                                  competition.imageUrl ||
                                  "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80"
                                }
                                alt={competition.title}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Light Christmas Overlay Effects */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none z-10"></div>
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.08),transparent_60%)] pointer-events-none z-10"></div>
                              
                              {/* Christmas Badge */}
                              <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 bg-gradient-to-r from-red-500/95 to-green-500/95 backdrop-blur-md text-white px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold flex items-center gap-1.5 md:gap-2 shadow-xl z-20 border border-white/20">
                                <Gift className="w-3 h-3" />
                                <span>Christmas Deal</span>
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
                            className="w-full md:w-auto bg-gradient-to-r from-red-500 via-green-500 to-red-500 hover:from-green-500 hover:via-red-500 hover:to-green-500 text-white font-black py-3 md:py-5 px-8 md:px-16 rounded-xl transition-all duration-300 shadow-2xl hover:shadow-green-500/50 text-sm md:text-2xl uppercase tracking-wide hover:scale-105 transform break-words border-2 border-white/30"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Gift className="w-4 h-4 md:w-6 md:h-6" />
                              ENTER NOW
                              <Gift className="w-4 h-4 md:w-6 md:h-6" />
                            </span>
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

        @keyframes featured-snow {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(600px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes twinkle-light {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        
        .animate-twinkle-light {
          animation: twinkle-light 1.5s ease-in-out infinite;
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}