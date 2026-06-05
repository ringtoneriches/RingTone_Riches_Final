import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import Slider from "react-slick";
import { Zap, Shield, Trophy, ChevronRight, Star, Users, Crown, Play, Ticket, RotateCw, Timer, Flame, CheckCircle, Sparkles, ArrowRight, Gift, Gamepad2, Target, Crosshair, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useMemo, memo, useCallback } from "react";
import featuredBgVideo from "@assets/generated_videos/featured_gaming_vivid_bg.mp4";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface FeaturedCompetitionsProps {
  competitions?: Competition[]; // Make it optional to handle undefined
}

// Memoized game icon component
const GameIcon = memo(({ type, className, style }: { type: string; className?: string; style?: React.CSSProperties }) => {
  switch (type) {
    case "spin": return <RotateCw className={className} style={style} />;
    case "scratch": return <Ticket className={className} style={style} />;
    default: return <Zap className={className} style={style} />;
  }
});

GameIcon.displayName = 'GameIcon';

// Memoized color getter
const getGameColor = (type: string) => {
  switch (type) {
    case "spin": return { accent: '#f59e0b', glow: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', label: 'Spin to Win', neon: '#ffb800' };
    case "scratch": return { accent: '#00ff88', glow: 'rgba(0,255,136,0.3)', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.35)', label: 'Scratch Card', neon: '#00ff88' };
    default: return { accent: '#f5d76e', glow: 'rgba(245,215,110,0.3)', bg: 'rgba(245,215,110,0.1)', border: 'rgba(245,215,110,0.35)', label: 'Instant Win', neon: '#f5d76e' };
  }
};

// Memoized competition card component
const CompetitionCard = memo(({ competition, onView }: { competition: Competition; onView: (id: string) => void }) => {
  const colors = useMemo(() => getGameColor(competition.type), [competition.type]);
  const soldPercent = useMemo(() => 
    Math.min(((competition.soldTickets || 0) / (competition.maxTickets || 100)) * 100, 95),
    [competition.soldTickets, competition.maxTickets]
  );

  const handleClick = useCallback(() => {
    onView(competition.id);
  }, [competition.id, onView]);

  return (
    <div className="px-2">
      <div className="relative group cursor-pointer" onClick={handleClick}>
        {/* FULL BACKGROUND IMAGE */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[500px] md:min-h-[600px]">
          {/* Background Image - Full Coverage */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1920&q=90"}
              alt={competition.title}
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
            />
            {/* Dark overlays for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
          </div>

          {/* Glow effects */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
            boxShadow: `inset 0 0 100px ${colors.glow}`,
          }} />

          {/* Content */}
          <div className="relative z-10 p-5 sm:p-6 md:p-8 lg:p-10 min-h-[500px] md:min-h-[600px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full relative overflow-hidden backdrop-blur-md" style={{
                  background: `linear-gradient(135deg, ${colors.neon}, ${colors.accent})`,
                  boxShadow: `0 4px 25px ${colors.glow}`,
                }}>
                  <Crosshair className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                  <span className="text-[10px] sm:text-xs font-black text-black uppercase tracking-wider">Featured</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full backdrop-blur-md" style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}>
                  <GameIcon type={competition.type} className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: colors.accent }} />
                  <span className="text-[10px] sm:text-xs font-bold" style={{ color: colors.accent }}>{colors.label}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md" style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(217,180,91,0.3)',
                }}>
                  <Users className="w-3.5 h-3.5" style={{ color: '#e8cf8f' }} />
                  <span className="text-white/90 text-[11px] font-semibold">{competition.soldTickets || 0} players</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-md" style={{
                  background: 'rgba(16,185,129,0.2)',
                  border: '1px solid rgba(16,185,129,0.5)',
                }}>
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                    <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ background: '#10b981' }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#34d399' }}>Live</span>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <div className="mb-4 md:mb-6">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-2 md:mb-3 drop-shadow-2xl" style={{ textShadow: `0 0 30px ${colors.glow}, 2px 2px 4px rgba(0,0,0,0.5)` }}>
                  {competition.title}
                </h2>
                <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-lg drop-shadow-md">
                  Play now for your chance to win this incredible prize. Limited spots remaining!
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-5 md:mb-6">
                {[
                  { icon: Shield, text: "Secure Play", color: '#e8cf8f' },
                  { icon: Trophy, text: "Instant Prizes", color: '#f5d76e' },
                  { icon: Target, text: "Fair Odds", color: '#d9b45b' },
                  { icon: Zap, text: "Quick Wins", color: '#f59e0b' }
                ].map((chip, i) => (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2 px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl backdrop-blur-md" style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: `1px solid rgba(${chip.color === '#e8cf8f' ? '232,207,143' : chip.color === '#f5d76e' ? '245,215,110' : chip.color === '#d9b45b' ? '217,180,91' : '245,158,11'},0.3)`,
                  }}>
                    <chip.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: chip.color }} />
                    <span className="text-white/90 text-[10px] sm:text-xs font-bold">{chip.text}</span>
                  </div>
                ))}
              </div>

              {competition.type === "instant" && (
                <div className="mb-5 md:mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/90 text-[11px] sm:text-xs font-bold uppercase tracking-wider">Tickets Sold</span>
                    <span className="text-[12px] sm:text-sm font-black" style={{ color: colors.neon }}>{Math.round(soldPercent)}%</span>
                  </div>
                  <div className="h-2 sm:h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${soldPercent}%`,
                      background: `linear-gradient(90deg, ${colors.accent}, ${colors.neon})`,
                    }} />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-white/60 text-sm line-through font-medium backdrop-blur-sm px-2 py-0.5 rounded">
                    £{(parseFloat(competition.ticketPrice) * 2).toFixed(2)}
                  </span>
                  <span className="text-3xl sm:text-4xl md:text-5xl font-black drop-shadow-xl" style={{
                    background: `linear-gradient(135deg, ${colors.neon}, #fff, ${colors.neon})`,
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    £{parseFloat(competition.ticketPrice).toFixed(2)}
                  </span>
                  <span className="text-white/80 text-xs sm:text-sm font-medium">per play</span>
                </div>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <Button
                    onClick={handleClick}
                    className="flex-1 sm:flex-none h-11 sm:h-12 px-5 sm:px-8 text-sm sm:text-base font-black rounded-xl border-0 uppercase tracking-wide transition-all duration-300 hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${colors.neon}, ${colors.accent})`,
                      color: '#0a0a0a',
                      boxShadow: `0 8px 35px ${colors.glow}`,
                    }}
                  >
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    Play Now
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleClick}
                    className="h-11 sm:h-12 px-4 font-bold rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-105"
                    style={{
                      border: `1px solid ${colors.border}`,
                      color: colors.neon,
                      background: 'rgba(0,0,0,0.5)',
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-5 md:mt-6 pt-4 relative">
                <div className="absolute top-0 left-[10%] right-[10%] h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${colors.neon}40, transparent)` }} />
                <div className="flex items-center justify-center gap-4 sm:gap-8">
                  {[
                    { icon: Zap, text: "Instant Payout", color: '#e8cf8f' },
                    { icon: Shield, text: "Fair Play", color: '#f5d76e' },
                    { icon: Gamepad2, text: "Multi-Game", color: '#d9b45b' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                      <item.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: item.color }} />
                      <span className="text-white/75 text-[10px] sm:text-xs font-semibold">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CompetitionCard.displayName = 'CompetitionCard';

export default function FeaturedCompetitions({ competitions = [] }: FeaturedCompetitionsProps) {
  const [, setLocation] = useLocation();
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<Slider>(null);

  // Memoize filtered competitions - add safety check
  const instantCompetitions = useMemo(() => {
    if (!competitions || !Array.isArray(competitions)) return [];
    return competitions
      .filter((c) => c && (c.type === "scratch" || c.type === "spin" || c.type === "instant"))
      .slice(0, 5);
  }, [competitions]);

  // Memoize slider settings
  const sliderSettings = useMemo(() => ({
    dots: true,
    infinite: instantCompetitions.length > 1,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: instantCompetitions.length > 1,
    autoplaySpeed: 6000,
    arrows: instantCompetitions.length > 1,
    pauseOnHover: true,
    adaptiveHeight: false,
    beforeChange: (_: number, next: number) => setActiveSlide(next),
    cssEase: 'cubic-bezier(0.45, 0, 0.15, 1)',
  }), [instantCompetitions.length]);

  const handleViewCompetition = useCallback((id: string) => {
    setLocation(`/competition/${id}`);
  }, [setLocation]);

  const handleSlideChange = useCallback((index: number) => {
    sliderRef.current?.slickGoTo(index);
  }, []);

  // Don't render if no competitions
  if (!instantCompetitions.length) return null;

  return (
    <div className="w-full relative py-14 sm:py-20 overflow-hidden" style={{ background: '#070709' }}>
      {/* Background video */}
      <div className="absolute inset-0" style={{ zIndex: 0, willChange: 'transform' }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.65 }}
        >
          <source src={featuredBgVideo} type="video/mp4" />
        </video>

        <div className="absolute inset-0" style={{ 
          zIndex: 2, 
          background: 'linear-gradient(180deg, rgba(7,7,9,0.8) 0%, rgba(7,7,9,0.25) 20%, rgba(7,7,9,0.15) 50%, rgba(7,7,9,0.25) 80%, rgba(7,7,9,0.8) 100%)' 
        }} />

        <div className="absolute inset-0" style={{ 
          zIndex: 3, 
          background: 'radial-gradient(ellipse 140% 100% at 50% 50%, transparent 30%, rgba(7,7,9,0.5) 100%)' 
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center relative" style={{
                background: 'linear-gradient(135deg, rgba(217,180,91,0.16), rgba(245,215,110,0.07))',
                border: '1px solid rgba(217,180,91,0.32)',
              }}>
                <Gamepad2 className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#e8cf8f' }} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight" style={{
                  background: 'linear-gradient(90deg, #f6e5b0, #d4af37, #a87b2c, #f6e5b0)',
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Featured Games</h2>
                <p className="text-white/50 text-[11px] sm:text-sm font-medium hidden sm:block">Play & win premium prizes instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full" style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.28)',
              }}>
                <div className="relative">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                  <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ background: '#10b981' }} />
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider" style={{ color: '#34d399' }}>Live</span>
              </div>
            </div>
          </div>
        </div>

        <div className="featured-slider-container">
          <Slider ref={sliderRef} {...sliderSettings}>
            {instantCompetitions.map((competition) => (
              <CompetitionCard 
                key={competition.id} 
                competition={competition} 
                onView={handleViewCompetition}
              />
            ))}
          </Slider>
        </div>
      </div>

      <style>{`
        .featured-slider-container .slick-slider {
          margin: 0 -8px;
        }
        
        .featured-slider-container .slick-list {
          overflow: hidden;
          border-radius: 24px;
        }
        
        .featured-slider-container .slick-prev,
        .featured-slider-container .slick-next {
          z-index: 20;
          width: 48px;
          height: 48px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .featured-slider-container .slick-prev {
          left: 10px;
        }
        
        .featured-slider-container .slick-next {
          right: 10px;
        }
        
        .featured-slider-container .slick-prev:hover,
        .featured-slider-container .slick-next:hover {
          background: rgba(217, 180, 91, 0.9);
          transform: scale(1.1);
        }
        
        .featured-slider-container .slick-prev:before,
        .featured-slider-container .slick-next:before {
          font-size: 28px;
          color: #e8cf8f;
          opacity: 1;
        }
        
        .featured-slider-container .slick-dots {
          bottom: -40px;
        }
        
        .featured-slider-container .slick-dots li button:before {
          font-size: 12px;
          color: #e8cf8f;
        }
        
        @media (max-width: 768px) {
          .featured-slider-container .slick-prev,
          .featured-slider-container .slick-next {
            width: 36px;
            height: 36px;
          }
          
          .featured-slider-container .slick-prev:before,
          .featured-slider-container .slick-next:before {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}