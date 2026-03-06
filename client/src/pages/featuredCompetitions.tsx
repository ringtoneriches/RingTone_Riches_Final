import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import Slider from "react-slick";
import { Zap, Shield, Trophy, ChevronRight, Star, Users, Crown, Play, Ticket, RotateCw, Timer, Flame, CheckCircle, Sparkles, ArrowRight, Gift, Gamepad2, Target, Crosshair, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import featuredBgVideo from "@assets/generated_videos/featured_gaming_vivid_bg.mp4";

interface FeaturedCompetitionsProps {
  competitions: Competition[];
}

export default function FeaturedCompetitions({ competitions }: FeaturedCompetitionsProps) {
  const [, setLocation] = useLocation();
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<Slider>(null);

  const instantCompetitions = competitions
    .filter((c) => c.type === "scratch" || c.type === "spin" || c.type === "instant")
    .slice(0, 5);

  const sliderSettings = {
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
      case "spin": return { accent: '#f59e0b', glow: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', label: 'Spin to Win', neon: '#ffb800' };
      case "scratch": return { accent: '#00ff88', glow: 'rgba(0,255,136,0.3)', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.35)', label: 'Scratch Card', neon: '#00ff88' };
      default: return { accent: '#f5d76e', glow: 'rgba(245,215,110,0.3)', bg: 'rgba(245,215,110,0.1)', border: 'rgba(245,215,110,0.35)', label: 'Instant Win', neon: '#f5d76e' };
    }
  };

  return (
    <div className="w-full relative py-14 sm:py-20 overflow-hidden" style={{ background: '#070709' }}>

      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.65, zIndex: 1 }}
        >
          <source src={featuredBgVideo} type="video/mp4" />
        </video>

        <div className="absolute inset-0" style={{ zIndex: 2, background: 'linear-gradient(180deg, rgba(7,7,9,0.8) 0%, rgba(7,7,9,0.25) 20%, rgba(7,7,9,0.15) 50%, rgba(7,7,9,0.25) 80%, rgba(7,7,9,0.8) 100%)' }} />

        <div className="absolute inset-0" style={{ zIndex: 3, background: 'radial-gradient(ellipse 140% 100% at 50% 50%, transparent 30%, rgba(7,7,9,0.5) 100%)' }} />

        <div className="absolute inset-0 nv-ft-bg-drift" style={{ background: 'radial-gradient(ellipse 70% 50% at 20% 40%, rgba(0,255,136,0.08), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(245,215,110,0.09), transparent 50%), radial-gradient(ellipse 50% 50% at 50% 20%, rgba(96,165,250,0.06), transparent 50%)' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full nv-ft-glow-breathe" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, rgba(245,215,110,0.05) 40%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-[10%] w-[600px] h-[400px] rounded-full nv-ft-glow-breathe" style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 70%)', filter: 'blur(100px)', animationDelay: '3s' }} />
        <div className="absolute top-1/4 left-[3%] w-[500px] h-[500px] rounded-full nv-ft-glow-breathe" style={{ background: 'radial-gradient(circle, rgba(245,215,110,0.07) 0%, transparent 70%)', filter: 'blur(100px)', animationDelay: '5s' }} />
        <div className="absolute top-[60%] right-[5%] w-[350px] h-[350px] rounded-full nv-ft-glow-breathe" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%)', filter: 'blur(120px)', animationDelay: '7s' }} />

        <div className="absolute inset-0 nv-ft-grid-scan" style={{ backgroundImage: 'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        {[...Array(35)].map((_, i) => (
          <div key={`ft-p-${i}`} className="absolute rounded-full nv-ft-particle-float" style={{
            width: `${1 + (i % 4)}px`,
            height: `${1 + (i % 4)}px`,
            background: i % 5 === 0 ? '#00ff88' : i % 5 === 1 ? '#f5d76e' : i % 5 === 2 ? '#60a5fa' : i % 5 === 3 ? '#ffb800' : 'rgba(255,255,255,0.7)',
            top: `${2 + (i * 2.8) % 96}%`,
            left: `${1 + (i * 2.9) % 98}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${2.5 + (i % 6) * 0.5}s`,
            opacity: 0,
            boxShadow: i % 3 === 0 ? `0 0 6px ${i % 5 === 0 ? 'rgba(0,255,136,0.6)' : i % 5 === 1 ? 'rgba(245,215,110,0.6)' : 'rgba(96,165,250,0.6)'}` : 'none',
          }} />
        ))}

        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 3%, rgba(0,255,136,0.25) 20%, rgba(245,215,110,0.45) 50%, rgba(0,255,136,0.25) 80%, transparent 97%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 3%, rgba(96,165,250,0.2) 20%, rgba(245,215,110,0.4) 50%, rgba(96,165,250,0.2) 80%, transparent 97%)' }} />

        <div className="absolute top-0 left-0 w-[2px] h-full" style={{ background: 'linear-gradient(180deg, transparent 5%, rgba(0,255,136,0.1) 30%, rgba(245,215,110,0.15) 50%, rgba(0,255,136,0.1) 70%, transparent 95%)' }} />
        <div className="absolute top-0 right-0 w-[2px] h-full" style={{ background: 'linear-gradient(180deg, transparent 5%, rgba(96,165,250,0.1) 30%, rgba(245,215,110,0.15) 50%, rgba(96,165,250,0.1) 70%, transparent 95%)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center relative nv-ft-icon-pulse" style={{
                background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(245,215,110,0.1))',
                border: '1px solid rgba(0,255,136,0.3)',
                boxShadow: '0 0 25px rgba(0,255,136,0.15), 0 0 50px rgba(0,255,136,0.05)',
              }}>
                <Gamepad2 className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#00ff88', filter: 'drop-shadow(0 0 10px rgba(0,255,136,0.8))' }} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight nv-ft-title-shimmer" style={{
                  background: 'linear-gradient(90deg, #00ff88, #f5d76e, #60a5fa, #00ff88)',
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Featured Games</h2>
                <p className="text-white/50 text-[11px] sm:text-sm font-medium hidden sm:block">Play & win premium prizes instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full nv-ft-live-pulse" style={{
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.3)',
                boxShadow: '0 0 20px rgba(0,255,136,0.1)',
              }}>
                <div className="relative">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88', boxShadow: '0 0 8px rgba(0,255,136,0.8)' }} />
                  <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ background: '#00ff88' }} />
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider" style={{ color: '#00ff88' }}>Live</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Slider ref={sliderRef} {...sliderSettings} className="featured-slider">
            {instantCompetitions.map((competition) => {
              const GameIcon = getGameIcon(competition.type);
              const colors = getGameColor(competition.type);
              const soldPercent = Math.min(((competition.soldTickets || 0) / (competition.maxTickets || 100)) * 100, 95);

              return (
                <div key={competition.id} data-testid={`slide-featured-competition-${competition.id}`}>
                  <div className="relative group" data-testid={`card-featured-${competition.id}`}>
                    <div className="absolute -inset-[2px] rounded-2xl sm:rounded-3xl nv-ft-card-border-spin" style={{
                      background: `conic-gradient(from 0deg, ${colors.neon}, rgba(245,215,110,0.4) 25%, ${colors.neon} 50%, rgba(96,165,250,0.4) 75%, ${colors.neon})`,
                      filter: 'blur(3px)',
                      zIndex: 0,
                    }} />
                    <div className="absolute -inset-[1px] rounded-2xl sm:rounded-3xl nv-ft-card-border-spin" style={{
                      background: `conic-gradient(from 180deg, ${colors.neon}80, transparent 25%, ${colors.neon}80 50%, transparent 75%, ${colors.neon}80)`,
                      zIndex: 0,
                    }} />

                    <div className="relative z-[1] rounded-2xl sm:rounded-3xl overflow-hidden" style={{
                      background: 'linear-gradient(145deg, rgba(10,12,18,0.97), rgba(6,8,14,0.98), rgba(10,10,16,0.97))',
                      boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 80px ${colors.glow}, 0 0 120px ${colors.glow}`,
                      backdropFilter: 'blur(20px)',
                    }}>
                      <div className="absolute inset-0">
                        <div className="absolute top-0 left-[3%] right-[3%] h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${colors.neon}88, transparent)` }} />
                        <div className="absolute bottom-0 left-[3%] right-[3%] h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${colors.neon}33, transparent)` }} />
                        <div className="absolute top-0 right-0 w-[50%] h-[50%]" style={{ background: `radial-gradient(ellipse at 100% 0%, ${colors.glow}, transparent 60%)` }} />
                        <div className="absolute bottom-0 left-0 w-[40%] h-[40%]" style={{ background: 'radial-gradient(ellipse at 0% 100%, rgba(96,165,250,0.05), transparent 60%)' }} />
                        <div className="absolute inset-0 nv-ft-scanline" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.012) 2px, rgba(0,255,136,0.012) 4px)', pointerEvents: 'none' }} />
                      </div>

                      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full relative overflow-hidden" style={{
                              background: `linear-gradient(135deg, ${colors.neon}, ${colors.accent})`,
                              boxShadow: `0 4px 25px ${colors.glow}, 0 0 40px ${colors.glow}`,
                            }}>
                              <Crosshair className="w-3 h-3 sm:w-4 sm:h-4 text-[#0a0a0a]" />
                              <span className="text-[10px] sm:text-xs font-black text-[#0a0a0a] uppercase tracking-wider">Featured</span>
                              <div className="absolute inset-0 nv-ft-badge-shine" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)', backgroundSize: '250% 100%' }} />
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full" style={{
                              background: colors.bg,
                              border: `1px solid ${colors.border}`,
                              boxShadow: `0 0 20px ${colors.glow}`,
                            }}>
                              <GameIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: colors.accent, filter: `drop-shadow(0 0 4px ${colors.glow})` }} />
                              <span className="text-[10px] sm:text-xs font-bold" style={{ color: colors.accent }}>{colors.label}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{
                              background: 'rgba(0,255,136,0.05)',
                              border: '1px solid rgba(0,255,136,0.15)',
                            }} data-testid={`text-entries-${competition.id}`}>
                              <Users className="w-3.5 h-3.5" style={{ color: '#00ff88', opacity: 0.7 }} />
                              <span className="text-white/70 text-[11px] font-semibold">{competition.soldTickets || 0} players</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{
                              background: 'rgba(0,255,136,0.08)',
                              border: '1px solid rgba(0,255,136,0.3)',
                              boxShadow: '0 0 15px rgba(0,255,136,0.1)',
                            }} data-testid={`badge-live-${competition.id}`}>
                              <div className="relative">
                                <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88', boxShadow: '0 0 8px rgba(0,255,136,0.8)' }} />
                                <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ background: '#00ff88' }} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#00ff88' }}>Live</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                          <div className="relative">
                            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden nv-ft-img-border-pulse" style={{
                              border: `1.5px solid ${colors.border}`,
                              boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${colors.glow}, 0 0 80px ${colors.glow}`,
                            }}>
                              <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] lg:aspect-[4/3]">
                                <img
                                  src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=90"}
                                  alt={competition.title}
                                  className="w-full h-98 object-cover"
                                />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,7,9,0.15) 0%, transparent 30%, transparent 50%, rgba(7,7,9,0.7) 80%, rgba(7,7,9,0.95) 100%)' }} />
                                <div className="absolute inset-0 nv-ft-img-sheen" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)', backgroundSize: '250% 100%' }} />

                                <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-xl" style={{
                                  background: 'rgba(0,0,0,0.6)',
                                  border: `1px solid ${colors.border}`,
                                  boxShadow: `0 0 15px ${colors.glow}`,
                                }}>
                                  <Target className="w-3 h-3" style={{ color: colors.neon, filter: `drop-shadow(0 0 4px ${colors.glow})` }} />
                                  <span className="text-[10px] sm:text-xs font-bold" style={{ color: colors.neon }}>Top Prize</span>
                                </div>

                                <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 flex items-center gap-1 px-2 py-1 rounded-lg" style={{
                                  background: 'rgba(0,0,0,0.6)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                  <Flame className="w-3 h-3 text-orange-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,146,60,0.6))' }} />
                                  <span className="text-orange-400 text-[10px] font-bold">HOT</span>
                                </div>

                                {competition.type === "instant" && (
                                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-white/90 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Level Progress</span>
                                      <span className="text-[11px] sm:text-xs font-black" style={{ color: colors.neon }}>{Math.round(soldPercent)}%</span>
                                    </div>
                                    <div className="h-2 sm:h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)' }}>
                                      <div className="h-full rounded-full nv-ft-progress-glow relative overflow-hidden" style={{
                                        width: `${soldPercent}%`,
                                        background: `linear-gradient(90deg, ${colors.accent}, ${colors.neon})`,
                                        boxShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
                                      }}>
                                        <div className="absolute inset-0 nv-ft-progress-shine" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', backgroundSize: '200% 100%' }} />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col justify-center">
                            <div className="mb-4 sm:mb-5">
                              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-[1.1] mb-2 sm:mb-3" data-testid={`text-title-${competition.id}`} style={{ textShadow: `0 0 30px ${colors.glow}, 0 2px 20px rgba(0,0,0,0.5)` }}>
                                {competition.title}
                              </h2>
                              <p className="text-white/65 text-sm sm:text-base leading-relaxed">
                                Play now for your chance to win this incredible prize. Limited spots remaining!
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-5 sm:mb-6">
                              {[
                                { icon: Shield, text: "Secure Play", color: '#00ff88', glow: 'rgba(0,255,136,0.15)', border: 'rgba(0,255,136,0.25)' },
                                { icon: Trophy, text: "Instant Prizes", color: '#f5d76e', glow: 'rgba(245,215,110,0.15)', border: 'rgba(245,215,110,0.25)' },
                                { icon: Target, text: "Fair Odds", color: '#60a5fa', glow: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.25)' },
                                { icon: Zap, text: "Quick Wins", color: '#f59e0b', glow: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)' }
                              ].map((chip, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2.5 sm:py-3 rounded-xl" style={{
                                  background: chip.glow,
                                  border: `1px solid ${chip.border}`,
                                  boxShadow: `0 0 20px ${chip.glow}, inset 0 1px 0 rgba(255,255,255,0.03)`,
                                }}>
                                  <chip.icon className="w-4 h-4 flex-shrink-0" style={{ color: chip.color, filter: `drop-shadow(0 0 6px ${chip.glow})` }} />
                                  <span className="text-white/90 text-[10px] sm:text-xs font-bold">{chip.text}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                              <div className="flex items-baseline gap-2.5">
                                <span className="text-white/40 text-sm line-through font-medium">
                                  £{(parseFloat(competition.ticketPrice) * 2).toFixed(2)}
                                </span>
                                <span className="text-3xl sm:text-4xl font-black nv-ft-price-glow" data-testid={`text-price-${competition.id}`} style={{
                                  background: `linear-gradient(135deg, ${colors.neon}, #fff, ${colors.neon})`,
                                  backgroundSize: '200% auto',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  filter: `drop-shadow(0 0 20px ${colors.glow})`,
                                }}>
                                  £{parseFloat(competition.ticketPrice).toFixed(2)}
                                </span>
                                <span className="text-white/55 text-xs sm:text-sm font-medium">per play</span>
                              </div>

                              <div className="flex gap-2.5 w-full sm:w-auto">
                                <Button
                                  onClick={() => handleViewCompetition(competition.id)}
                                  data-testid="button-enter-competition"
                                  className="flex-1 sm:flex-none h-11 sm:h-12 px-5 sm:px-8 text-sm sm:text-base font-black rounded-xl border-0 uppercase tracking-wide nv-ft-cta-glow"
                                  style={{
                                    background: `linear-gradient(135deg, ${colors.neon}, ${colors.accent})`,
                                    color: '#0a0a0a',
                                    boxShadow: `0 8px 35px ${colors.glow}, 0 0 60px ${colors.glow}`,
                                  }}
                                >
                                  <Gamepad2 className="w-4 h-4 mr-2" />
                                  Play Now
                                </Button>

                                <Button
                                  variant="ghost"
                                  onClick={() => handleViewCompetition(competition.id)}
                                  data-testid="button-view-competition"
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
                                <item.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: item.color, filter: `drop-shadow(0 0 4px ${item.color}50)` }} />
                                <span className="text-white/60 text-[10px] sm:text-xs font-semibold">{item.text}</span>
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

        <div className="mt-5 sm:mt-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {instantCompetitions.map((_, i) => (
              <button
                key={i}
                onClick={() => sliderRef.current?.slickGoTo(i)}
                className="relative transition-all duration-500 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 rounded-full p-1"
                data-testid={`button-slide-indicator-${i}`}
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
                  boxShadow: i === activeSlide ? '0 0 15px rgba(0,255,136,0.4), 0 0 30px rgba(0,255,136,0.15)' : 'none',
                }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes nv-ft-bg-drift-anim { 0%, 100% { transform: translateX(0) translateY(0); } 33% { transform: translateX(25px) translateY(-12px); } 66% { transform: translateX(-18px) translateY(8px); } }
        .nv-ft-bg-drift { animation: nv-ft-bg-drift-anim 18s ease-in-out infinite; }
        @keyframes nv-ft-glow-breathe-anim { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
        .nv-ft-glow-breathe { animation: nv-ft-glow-breathe-anim 7s ease-in-out infinite; }
        @keyframes nv-ft-particle-float-anim { 0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); } 15% { opacity: 0.8; } 50% { opacity: 1; transform: translateY(-15px) scale(1.3); } 85% { opacity: 0.4; } }
        .nv-ft-particle-float { animation: nv-ft-particle-float-anim 4s ease-in-out infinite; }
        @keyframes nv-ft-icon-pulse-anim { 0%, 100% { box-shadow: 0 0 25px rgba(0,255,136,0.15), 0 0 50px rgba(0,255,136,0.05); } 50% { box-shadow: 0 0 40px rgba(0,255,136,0.3), 0 0 80px rgba(0,255,136,0.1); } }
        .nv-ft-icon-pulse { animation: nv-ft-icon-pulse-anim 3s ease-in-out infinite; }
        @keyframes nv-ft-title-shimmer-anim { 0% { background-position: 300% center; } 100% { background-position: -300% center; } }
        .nv-ft-title-shimmer { animation: nv-ft-title-shimmer-anim 5s linear infinite; }
        @keyframes nv-ft-live-pulse-anim { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        .nv-ft-live-pulse { animation: nv-ft-live-pulse-anim 2s ease-in-out infinite; }
        @keyframes nv-ft-card-border-spin-anim { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .nv-ft-card-border-spin { animation: nv-ft-card-border-spin-anim 6s linear infinite; }
        @keyframes nv-ft-badge-shine-anim { 0% { background-position: -250% 0; } 100% { background-position: 250% 0; } }
        .nv-ft-badge-shine { animation: nv-ft-badge-shine-anim 3s ease-in-out infinite; }
        @keyframes nv-ft-img-sheen-anim { 0% { background-position: -250% 0; } 100% { background-position: 250% 0; } }
        .nv-ft-img-sheen { animation: nv-ft-img-sheen-anim 6s ease-in-out infinite; }
        @keyframes nv-ft-progress-shine-anim { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .nv-ft-progress-shine { animation: nv-ft-progress-shine-anim 1.5s linear infinite; }
        @keyframes nv-ft-progress-glow-anim { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
        .nv-ft-progress-glow { animation: nv-ft-progress-glow-anim 2s ease-in-out infinite; }
        @keyframes nv-ft-price-glow-anim { 0%, 100% { background-position: 0% center; } 50% { background-position: 200% center; } }
        .nv-ft-price-glow { animation: nv-ft-price-glow-anim 3s ease-in-out infinite; }
        @keyframes nv-ft-cta-glow-anim { 0%, 100% { box-shadow: 0 8px 35px var(--cta-glow, rgba(0,255,136,0.3)), 0 0 60px var(--cta-glow, rgba(0,255,136,0.15)); } 50% { box-shadow: 0 8px 50px var(--cta-glow, rgba(0,255,136,0.4)), 0 0 80px var(--cta-glow, rgba(0,255,136,0.25)); } }
        .nv-ft-cta-glow { animation: nv-ft-cta-glow-anim 2s ease-in-out infinite; }
        @keyframes nv-ft-scanline-anim { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .nv-ft-scanline { animation: nv-ft-scanline-anim 15s linear infinite; }
        @keyframes nv-ft-grid-scan-anim { 0% { opacity: 0.3; } 50% { opacity: 0.6; } 100% { opacity: 0.3; } }
        .nv-ft-grid-scan { animation: nv-ft-grid-scan-anim 8s ease-in-out infinite; }
        @keyframes nv-ft-img-border-pulse-anim { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.2); } }
        .nv-ft-img-border-pulse { animation: nv-ft-img-border-pulse-anim 3s ease-in-out infinite; }
        @keyframes nv-ft-video-breathe-anim { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.03); } }
        .nv-ft-video-breathe { animation: nv-ft-video-breathe-anim 12s ease-in-out infinite; }
      `}</style>
    </div>
  );
}