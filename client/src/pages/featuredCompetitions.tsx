import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import Slider from "react-slick";
import { Zap, Shield, Trophy, Users, Ticket, RotateCw, Timer, Flame, ArrowRight, Gift, Gamepad2, Target, Egg, Rabbit, Candy, Sparkles, Gem, PartyPopper, Flower, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useMemo, memo, useCallback } from "react";

interface FeaturedCompetitionsProps {
  competitions: Competition[];
}

// Easter-themed color palette
const getEasterColors = (type: string) => {
  switch (type) {
    case "spin": 
      return { 
        primary: '#FFB7C5', // Pastel Pink
        secondary: '#FFD700', // Gold
        glow: 'rgba(255,183,197,0.4)', 
        bg: 'linear-gradient(135deg, rgba(255,183,197,0.15), rgba(255,215,0,0.1))',
        border: 'rgba(255,183,197,0.5)', 
        label: 'Egg Hunt Spin', 
        neon: '#FFB7C5',
        accent: '#FFD700'
      };
    case "scratch": 
      return { 
        primary: '#98FB98', // Pastel Green
        secondary: '#FFD700',
        glow: 'rgba(152,251,152,0.4)', 
        bg: 'linear-gradient(135deg, rgba(152,251,152,0.15), rgba(255,215,0,0.1))',
        border: 'rgba(152,251,152,0.5)', 
        label: 'Golden Egg Scratch', 
        neon: '#98FB98',
        accent: '#FFD700'
      };
    default: 
      return { 
        primary: '#FFD700', // Gold
        secondary: '#FFB347',
        glow: 'rgba(255,215,0,0.4)', 
        bg: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,179,71,0.1))',
        border: 'rgba(255,215,0,0.5)', 
        label: 'Easter Instant Win', 
        neon: '#FFD700',
        accent: '#FFB347'
      };
  }
};

// Easter-themed icon mapper
const EasterIcon = memo(({ type, className, style }: { type: string; className?: string; style?: React.CSSProperties }) => {
  switch (type) {
    case "spin": return <Egg className={className} style={style} />;
    case "scratch": return <Rabbit className={className} style={style} />;
    default: return <Candy className={className} style={style} />;
  }
});

EasterIcon.displayName = 'EasterIcon';

// Premium Easter Competition Card
const CompetitionCard = memo(({ competition, onView }: { competition: Competition; onView: (id: string) => void }) => {
  const colors = useMemo(() => getEasterColors(competition.type), [competition.type]);
  const soldPercent = useMemo(() => 
    Math.min(((competition.soldTickets || 0) / (competition.maxTickets || 100)) * 100, 95),
    [competition.soldTickets, competition.maxTickets]
  );

  const handleClick = useCallback(() => {
    onView(competition.id);
  }, [competition.id, onView]);

  return (
    <div className="relative group">
      {/* Animated Easter egg glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-300 via-yellow-300 to-green-300 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition duration-700" />
      
      <div className="relative z-[1] rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-sm" style={{
        background: 'linear-gradient(145deg, rgba(30,20,35,0.95), rgba(20,15,25,0.98))',
        boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 40px ${colors.glow}`,
        border: '1px solid rgba(255,215,0,0.2)'
      }}>
        
        {/* Decorative Easter patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full border-2 border-yellow-300/30 animate-pulse" />
          <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full border-2 border-pink-300/30 animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/4 w-12 h-12 rounded-full border-2 border-green-300/30 animate-pulse delay-700" />
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Header with Easter badges */}
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full relative overflow-hidden animate-bounce-slow" style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 4px 20px ${colors.glow}`,
              }}>
                <PartyPopper className="w-3 h-3 sm:w-4 sm:h-4 text-purple-900" />
                <span className="text-[10px] sm:text-xs font-black text-purple-900 uppercase tracking-wider">Easter Special</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full" style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
              }}>
                <EasterIcon type={competition.type} className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: colors.primary }} />
                <span className="text-[10px] sm:text-xs font-bold" style={{ color: colors.primary }}>{colors.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{
                background: 'rgba(255,215,0,0.15)',
                border: '1px solid rgba(255,215,0,0.4)',
              }}>
                <Gem className="w-3 h-3" style={{ color: '#FFD700' }} />
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#FFD700' }}>Golden Egg</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Image Section with Easter overlay */}
            <div className="relative">
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden" style={{
                border: `2px solid ${colors.border}`,
                boxShadow: `0 20px 40px rgba(0,0,0,0.4)`,
              }}>
                <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] lg:aspect-[4/3]">
                  <img
                    src={competition.imageUrl || "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=1200&q=90"}
                    alt={competition.title}
                    loading="lazy"
                    className="w-full h-98 object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.9) 100%)' }} />

                  {/* Easter egg badge */}
                  <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-xl" style={{
                    background: 'rgba(0,0,0,0.7)',
                    border: `1px solid ${colors.border}`,
                  }}>
                    <Egg className="w-3 h-3" style={{ color: colors.primary }} />
                    <span className="text-[10px] sm:text-xs font-bold" style={{ color: colors.primary }}>Limited Edition</span>
                  </div>

                  {/* Animated sparkle effect */}
                  <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col justify-center">
              <div className="mb-4 sm:mb-5">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-[1.1] mb-2 sm:mb-3" style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, #FFB347)`,
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: `0 0 30px ${colors.glow}`
                }}>
                  🥚 {competition.title} 🐰
                </h2>
                <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                  Hop into the Easter celebration! Find the golden egg and win extraordinary prizes. Limited spots available for this egg-citing adventure!
                </p>
              </div>

              {/* Easter features grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-5 sm:mb-6">
                {[
                  { icon: Gift, text: "Golden Prizes", color: '#FFD700' },
                  { icon: Rabbit, text: "Bunny Bonus", color: '#FFB7C5' },
                  { icon: Flower, text: "Spring Rewards", color: '#98FB98' },
                  { icon: Music, text: "Celebration Mode", color: '#DDA0DD' }
                ].map((chip, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 sm:py-3 rounded-xl backdrop-blur-sm transition-all hover:scale-105" style={{
                    background: `rgba(255,255,255,0.05)`,
                    border: `1px solid ${chip.color}40`,
                  }}>
                    <chip.icon className="w-4 h-4 flex-shrink-0" style={{ color: chip.color }} />
                    <span className="text-white/90 text-[10px] sm:text-xs font-bold">{chip.text}</span>
                  </div>
                ))}
              </div>

              {/* Price & CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-white/40 text-sm line-through font-medium">
                    £{(parseFloat(competition.ticketPrice) * 2).toFixed(2)}
                  </span>
                  <div className="relative">
                    <span className="text-3xl sm:text-4xl font-black" style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, #FFD700)`,
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      £{parseFloat(competition.ticketPrice).toFixed(2)}
                    </span>
                    <div className="absolute -top-2 -right-6">
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 animate-ping" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-yellow-400" />
                      </div>
                    </div>
                  </div>
                  <span className="text-white/55 text-xs sm:text-sm font-medium">per Easter ticket</span>
                </div>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <Button
                    onClick={handleClick}
                    className="flex-1 sm:flex-none h-11 sm:h-12 px-5 sm:px-8 text-sm sm:text-base font-black rounded-xl border-0 uppercase tracking-wide transition-all hover:scale-105 hover:shadow-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, #FFB347)`,
                      color: '#2d1b3d',
                      boxShadow: `0 8px 25px ${colors.glow}`,
                    }}
                  >
                    <Egg className="w-4 h-4 mr-2" />
                    Claim Egg
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleClick}
                    className="h-11 sm:h-12 px-4 font-bold rounded-xl transition-all hover:scale-105"
                    style={{
                      border: `1px solid ${colors.border}`,
                      color: colors.primary,
                      background: colors.bg,
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Easter footer */}
          <div className="mt-5 sm:mt-6 pt-4 relative" style={{ borderTop: '1px solid rgba(255,215,0,0.2)' }}>
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${colors.primary}60, transparent)` }} />
            <div className="flex items-center justify-center gap-4 sm:gap-8">
              {[
                { icon: Gift, text: "Surprise Inside", color: '#FFB7C5' },
                { icon: Shield, text: "Fair Play", color: '#98FB98' },
                { icon: Timer, text: "Limited Time", color: '#FFD700' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                  <item.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: item.color }} />
                  <span className="text-white/60 text-[10px] sm:text-xs font-semibold">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CompetitionCard.displayName = 'CompetitionCard';

// Main Featured Competitions Component - Easter Edition
export default function FeaturedCompetitions({ competitions }: FeaturedCompetitionsProps) {
  const [, setLocation] = useLocation();
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<Slider>(null);

  const easterCompetitions = useMemo(() => 
    competitions
      .filter((c) => c.type === "scratch" || c.type === "spin" || c.type === "instant")
      .slice(0, 5),
    [competitions]
  );

  const sliderSettings = useMemo(() => ({
    dots: false,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    pauseOnHover: true,
    adaptiveHeight: false,
    beforeChange: (_: number, next: number) => setActiveSlide(next),
    cssEase: 'cubic-bezier(0.45, 0, 0.15, 1)',
  }), []);

  const handleViewCompetition = useCallback((id: string) => {
    setLocation(`/competition/${id}`);
  }, [setLocation]);

  const handleSlideChange = useCallback((index: number) => {
    sliderRef.current?.slickGoTo(index);
  }, []);

  if (!easterCompetitions.length) return null;

  return (
    <div className="w-full relative py-14 sm:py-24 overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, #1a0f2e 0%, #2d1b3d 50%, #1a0f2e 100%)'
    }}>
      {/* Animated Easter background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating easter eggs background */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`egg-${i}`}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 7}s`,
            }}
          >
            <div className="relative">
              <div className="w-8 h-10 rounded-full bg-gradient-to-br from-pink-300/20 to-yellow-300/20 blur-sm" />
              <Egg className="w-6 h-8 opacity-10" style={{ color: ['#FFB7C5', '#98FB98', '#FFD700'][i % 3] }} />
            </div>
          </div>
        ))}
        
        {/* Confetti particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`confetti-${i}`}
            className="absolute w-1 h-2 rounded-full animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              background: ['#FFB7C5', '#98FB98', '#FFD700', '#DDA0DD', '#87CEEB'][i % 5],
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Easter Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-yellow-300/30 mb-4">
            <Rabbit className="w-4 h-4 text-pink-300" />
            <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Easter 2026 Limited Edition</span>
            <Egg className="w-4 h-4 text-green-300" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4" style={{
            background: 'linear-gradient(135deg, #FFB7C5, #FFD700, #98FB98, #DDA0DD)',
            backgroundSize: '300% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
           
          }}>
            🐰 Easter Games 🥚
          </h2>
          <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto">
            Hunt for golden eggs, unlock bunny bonuses, and celebrate spring with our most premium Easter collection!
          </p>
        </div>

        {/* Slider Container */}
        <div>
          <Slider ref={sliderRef} {...sliderSettings} className="easter-slider">
            {easterCompetitions.map((competition) => (
              <CompetitionCard 
                key={competition.id} 
                competition={competition} 
                onView={handleViewCompetition}
              />
            ))}
          </Slider>
        </div>

        {/* Easter themed dots */}
        <div className="mt-6 sm:mt-10">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {easterCompetitions.map((_, i) => (
              <button
                key={i}
                onClick={() => handleSlideChange(i)}
                className="relative transition-all duration-500 cursor-pointer group focus:outline-none"
                aria-label={`Go to Easter game ${i + 1}`}
              >
                <div className={`rounded-full transition-all duration-500 ${
                  i === activeSlide
                    ? 'w-10 sm:w-14 h-2.5 sm:h-3'
                    : 'w-2 sm:w-3 h-2 sm:h-3 group-hover:w-5'
                }`} style={{
                  background: i === activeSlide
                    ? 'linear-gradient(90deg, #FFB7C5, #FFD700, #98FB98)'
                    : 'rgba(255,255,255,0.3)',
                }} />
                {i === activeSlide && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Easter countdown teaser */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 backdrop-blur-sm border border-yellow-300/20">
            <Timer className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-white/80 text-sm font-medium">Hurry! Easter eggs are hatching fast —</span>
            <span className="text-yellow-300 font-bold">Limited tickets remaining!</span>
            <PartyPopper className="w-4 h-4 text-pink-300" />
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style >{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fall {
          animation: fall 8s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce 2s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}