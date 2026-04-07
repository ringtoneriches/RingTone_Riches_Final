import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import Slider from "react-slick";
import { Zap, Shield, Trophy, ChevronRight, Star, Users, Crown, Play, Ticket, RotateCw, Timer, Flame, CheckCircle, Sparkles, ArrowRight, Gift, Gamepad2, Target, Crosshair, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useMemo, memo, useCallback } from "react";
import featuredBgVideo from "@assets/generated_videos/featured_gaming_vivid_bg.mp4";

interface FeaturedCompetitionsProps {
  competitions: Competition[];
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
    <div key={competition.id} className="relative group">
      {/* Reduced number of animated elements - removed conic gradients which are expensive */}
      <div className="relative z-[1] rounded-2xl sm:rounded-3xl overflow-hidden" style={{
        background: 'linear-gradient(145deg, rgba(10,12,18,0.97), rgba(6,8,14,0.98), rgba(10,10,16,0.97))',
        boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 80px ${colors.glow}, 0 0 120px ${colors.glow}`,
      }}>
        {/* Reduced overlay elements - removed scanline effect */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-[3%] right-[3%] h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${colors.neon}88, transparent)` }} />
          <div className="absolute bottom-0 left-[3%] right-[3%] h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${colors.neon}33, transparent)` }} />
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full relative overflow-hidden" style={{
                background: `linear-gradient(135deg, ${colors.neon}, ${colors.accent})`,
                boxShadow: `0 4px 25px ${colors.glow}`,
              }}>
                <Crosshair className="w-3 h-3 sm:w-4 sm:h-4 text-[#0a0a0a]" />
                <span className="text-[10px] sm:text-xs font-black text-[#0a0a0a] uppercase tracking-wider">Featured</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full" style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
              }}>
                <GameIcon type={competition.type} className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: colors.accent }} />
                <span className="text-[10px] sm:text-xs font-bold" style={{ color: colors.accent }}>{colors.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{
                background: 'rgba(0,255,136,0.05)',
                border: '1px solid rgba(0,255,136,0.15)',
              }}>
                <Users className="w-3.5 h-3.5" style={{ color: '#00ff88', opacity: 0.7 }} />
                <span className="text-white/70 text-[11px] font-semibold">{competition.soldTickets || 0} players</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.3)',
              }}>
                <div className="relative">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88' }} />
                  <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ background: '#00ff88' }} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#00ff88' }}>Live</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="relative">
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden" style={{
                border: `1.5px solid ${colors.border}`,
                boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
              }}>
                <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] lg:aspect-[4/3]">
                  <img
                    src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=90"}
                    alt={competition.title}
                    loading="lazy"
                    className="w-full h-98 object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,7,9,0.15) 0%, transparent 30%, transparent 50%, rgba(7,7,9,0.7) 80%, rgba(7,7,9,0.95) 100%)' }} />

                  <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-xl" style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: `1px solid ${colors.border}`,
                  }}>
                    <Target className="w-3 h-3" style={{ color: colors.neon }} />
                    <span className="text-[10px] sm:text-xs font-bold" style={{ color: colors.neon }}>Top Prize</span>
                  </div>

                  <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 flex items-center gap-1 px-2 py-1 rounded-lg" style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span className="text-orange-400 text-[10px] font-bold">HOT</span>
                  </div>

                  {competition.type === "instant" && (
                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/90 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Level Progress</span>
                        <span className="text-[11px] sm:text-xs font-black" style={{ color: colors.neon }}>{Math.round(soldPercent)}%</span>
                      </div>
                      <div className="h-2 sm:h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${soldPercent}%`,
                          background: `linear-gradient(90deg, ${colors.accent}, ${colors.neon})`,
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="mb-4 sm:mb-5">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-[1.1] mb-2 sm:mb-3" style={{ textShadow: `0 0 30px ${colors.glow}` }}>
                  {competition.title}
                </h2>
                <p className="text-white/65 text-sm sm:text-base leading-relaxed">
                  Play now for your chance to win this incredible prize. Limited spots remaining!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-5 sm:mb-6">
                {[
                  { icon: Shield, text: "Secure Play", color: '#00ff88' },
                  { icon: Trophy, text: "Instant Prizes", color: '#f5d76e' },
                  { icon: Target, text: "Fair Odds", color: '#60a5fa' },
                  { icon: Zap, text: "Quick Wins", color: '#f59e0b' }
                ].map((chip, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 sm:py-3 rounded-xl" style={{
                    background: `rgba(${chip.color === '#00ff88' ? '0,255,136' : chip.color === '#f5d76e' ? '245,215,110' : chip.color === '#60a5fa' ? '96,165,250' : '245,158,11'},0.05)`,
                    border: `1px solid rgba(${chip.color === '#00ff88' ? '0,255,136' : chip.color === '#f5d76e' ? '245,215,110' : chip.color === '#60a5fa' ? '96,165,250' : '245,158,11'},0.15)`,
                  }}>
                    <chip.icon className="w-4 h-4 flex-shrink-0" style={{ color: chip.color }} />
                    <span className="text-white/90 text-[10px] sm:text-xs font-bold">{chip.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-white/40 text-sm line-through font-medium">
                    £{(parseFloat(competition.ticketPrice) * 2).toFixed(2)}
                  </span>
                  <span className="text-3xl sm:text-4xl font-black" style={{
                    background: `linear-gradient(135deg, ${colors.neon}, #fff, ${colors.neon})`,
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    £{parseFloat(competition.ticketPrice).toFixed(2)}
                  </span>
                  <span className="text-white/55 text-xs sm:text-sm font-medium">per play</span>
                </div>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <Button
                    onClick={handleClick}
                    className="flex-1 sm:flex-none h-11 sm:h-12 px-5 sm:px-8 text-sm sm:text-base font-black rounded-xl border-0 uppercase tracking-wide"
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
                    className="h-11 sm:h-12 px-4 font-bold rounded-xl"
                    style={{
                      border: `1px solid ${colors.border}`,
                      color: colors.neon,
                      background: colors.bg,
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 pt-4 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${colors.neon}40, transparent)` }} />
            <div className="flex items-center justify-center gap-4 sm:gap-8">
              {[
                { icon: Zap, text: "Instant Payout", color: '#00ff88' },
                { icon: Shield, text: "Fair Play", color: '#f5d76e' },
                { icon: Gamepad2, text: "Multi-Game", color: '#60a5fa' }
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

export default function FeaturedCompetitions({ competitions }: FeaturedCompetitionsProps) {
  const [, setLocation] = useLocation();
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<Slider>(null);

  // Memoize filtered competitions
  const instantCompetitions = useMemo(() => 
    competitions
      .filter((c) => c.type === "scratch" || c.type === "spin" || c.type === "instant")
      .slice(0, 5),
    [competitions]
  );

  // Memoize slider settings to prevent re-renders
  const sliderSettings = useMemo(() => ({
    dots: false,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 6000,
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

  // Don't render if no competitions
  if (!instantCompetitions.length) return null;

  return (
    <div className="w-full relative py-14 sm:py-20 overflow-hidden" style={{ background: '#070709' }}>
      {/* Simplified background video - added will-change and reduced opacity animations */}
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

        {/* Reduced number of background particles - from 35 to 15 */}
        {[...Array(15)].map((_, i) => (
          <div key={`ft-p-${i}`} className="absolute rounded-full" style={{
            width: `${1 + (i % 4)}px`,
            height: `${1 + (i % 4)}px`,
            background: i % 5 === 0 ? '#00ff88' : i % 5 === 1 ? '#f5d76e' : i % 5 === 2 ? '#60a5fa' : i % 5 === 3 ? '#ffb800' : 'rgba(255,255,255,0.7)',
            top: `${2 + (i * 6) % 96}%`,
            left: `${1 + (i * 6.5) % 98}%`,
            opacity: 0.4,
          }} />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center relative" style={{
                background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(245,215,110,0.1))',
                border: '1px solid rgba(0,255,136,0.3)',
              }}>
                <Gamepad2 className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#00ff88' }} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight" style={{
                  background: 'linear-gradient(90deg, #00ff88, #f5d76e, #60a5fa, #00ff88)',
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Featured Games</h2>
                <p className="text-white/50 text-[11px] sm:text-sm font-medium hidden sm:block">Play & win premium prizes instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full" style={{
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.3)',
              }}>
                <div className="relative">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88' }} />
                  <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ background: '#00ff88' }} />
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider" style={{ color: '#00ff88' }}>Live</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Slider ref={sliderRef} {...sliderSettings} className="featured-slider">
            {instantCompetitions.map((competition) => (
              <CompetitionCard 
                key={competition.id} 
                competition={competition} 
                onView={handleViewCompetition}
              />
            ))}
          </Slider>
        </div>

        <div className="mt-5 sm:mt-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {instantCompetitions.map((_, i) => (
              <button
                key={i}
                onClick={() => handleSlideChange(i)}
                className="relative transition-all duration-500 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 rounded-full p-1"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === activeSlide ? 'true' : undefined}
              >
                <div className={`rounded-full transition-all duration-500 ${
                  i === activeSlide
                    ? 'w-8 sm:w-12 h-2 sm:h-2.5'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 group-hover:w-4'
                }`} style={{
                  background: i === activeSlide
                    ? 'linear-gradient(90deg, #00ff88, #f5d76e, #60a5fa)'
                    : 'rgba(255,255,255,0.25)',
                }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}