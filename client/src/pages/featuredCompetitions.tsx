import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import Slider from "react-slick";
import {
  Zap,
  Shield,
  Trophy,
  ChevronRight,
  Star,
  Users,
  Crown,
  Play,
  Ticket,
  RotateCw,
  Timer,
  Flame,
  CheckCircle,
  Heart,
  Gift,
  Sparkles,
  Target,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FeaturedCompetitionsProps {
  competitions: Competition[];
}

export default function FeaturedCompetitions({
  competitions,
}: FeaturedCompetitionsProps) {
  const [, setLocation] = useLocation();
  const [activeSlide, setActiveSlide] = useState(0);

  const instantCompetitions = competitions
    .filter(
      (c) => c.type === "scratch" || c.type === "spin" || c.type === "instant",
    )
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
      case "spin":
        return Circle;
      case "scratch":
        return Ticket;
      default:
        return Target;
    }
  };

  const getGameColor = (type: string) => {
    switch (type) {
      case "spin":
        return {
          bg: "from-rose-600/20 to-pink-600/10",
          border: "border-rose-500/40",
          text: "text-rose-400",
          gradient: "from-rose-500 via-pink-500 to-rose-500",
        };
      case "scratch":
        return {
          bg: "from-pink-600/20 to-rose-600/10",
          border: "border-pink-500/40",
          text: "text-pink-400",
          gradient: "from-pink-500 via-rose-500 to-pink-500",
        };
      default:
        return {
          bg: "from-red-500/20 to-rose-500/10",
          border: "border-red-500/40",
          text: "text-red-400",
          gradient: "from-red-500 via-rose-500 to-red-500",
        };
    }
  };

  const getGameLabel = (type: string) => {
    switch (type) {
      case "spin":
        return "Spin";
      case "scratch":
        return "Scratch";
      default:
        return "Instant";
    }
  };

  return (
    <div className="w-full relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Section Header - Valentine Themed */}
      <div className="max-w-7xl mx-auto px-4 mb-4 sm:mb-6 relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-600/20 to-pink-600/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(225,29,72,0.3)]">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/5 blur-sm" />
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 drop-shadow-lg" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                Featured{" "}
                <span className="bg-gradient-to-r from-rose-400 via-pink-300 to-rose-400 bg-clip-text text-transparent animate-text-shimmer">
                  Valentine
                </span>{" "}
                Prizes
              </h2>
              <p className="text-white/50 text-xs sm:text-sm hidden sm:block">
                Limited-time love & win extravaganza
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-rose-500/20 to-pink-500/10 border border-rose-500/30 flex-shrink-0 animate-pulse">
            <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
            <span className="text-rose-400 text-xs sm:text-sm font-bold">
              Valentine Special
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <Slider {...sliderSettings} className="featured-slider">
          {instantCompetitions.map((competition) => {
            const GameIcon = getGameIcon(competition.type);
            const colors = getGameColor(competition.type);
            const soldPercent = Math.min(
              ((competition.soldTickets || 0) /
                (competition.maxTickets || 100)) *
                100,
              95,
            );

            return (
              <div
                key={competition.id}
                data-testid={`slide-featured-competition-${competition.id}`}
              >
                {/* Valentine Glow Container */}
                <div className="relative group">
                  {/* Glow Effects */}
                  <div className="absolute -inset-2 sm:-inset-4 rounded-3xl bg-gradient-to-r from-rose-500/30 via-pink-500/20 to-rose-500/30 blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-rose-500/20 via-pink-500/10 to-rose-500/20 blur-xl" />

                  {/* Main Card */}
                  <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-rose-500/40 backdrop-blur-sm bg-slate-900/80 transition-all duration-500 group-hover:border-rose-500/60 group-hover:shadow-[0_0_60px_rgba(225,29,72,0.4)]">
                    {/* Content */}
                    <div className="relative p-4 sm:p-6 md:p-8">
                      {/* Top Badges - Valentine Themed */}
                      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                            <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                            <span className="text-[10px] sm:text-xs font-black text-white uppercase">
                              Valentine's Special
                            </span>
                          </div>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r ${colors.bg} border ${colors.border}`}
                          >
                            <GameIcon className={`w-3 h-3 ${colors.text}`} />
                            <span
                              className={`text-[10px] sm:text-xs font-bold ${colors.text}`}
                            >
                              {competition.type === "instant"
                                ? "Competition"
                                : getGameLabel(competition.type)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/30"
                            data-testid={`text-entries-${competition.id}`}
                          >
                            <Users className="w-3 h-3 text-pink-400" />
                            <span className="text-white/60 text-[10px]">
                              {competition.soldTickets || 0} in love
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30"
                            data-testid={`badge-live-${competition.id}`}
                          >
                            <div className="relative">
                              <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                              <div className="absolute inset-0 w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
                            </div>
                            <span className="text-red-400 text-[10px] font-bold">
                              LOVE IS LIVE
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RESPONSIVE LAYOUT */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* IMAGE - Valentine Themed */}
                        <div className="relative">
                          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border-2 border-rose-500/50 shadow-[0_0_40px_rgba(225,29,72,0.3)] transition-transform duration-500 group-hover:scale-[1.02]">
                            <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] lg:aspect-[4/3]">
                              <img
                                src={
                                  competition.imageUrl ||
                                  "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=90"
                                }
                                alt={competition.title}
                                className="w-full h-98 object-cover transition-transform duration-700 group-hover:scale-105"
                              />

                              {/* Valentine Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-rose-900/60 via-transparent to-transparent" />

                              {/* Premium Badge - Valentine */}
                              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-rose-500/30">
                                <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                                <span className="text-white text-[10px] sm:text-xs font-bold">
                                  Love Guaranteed
                                </span>
                              </div>

                              {/* Progress bar - Valentine */}
                              {competition.type === "instant" ? (
                                <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
                                  <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                                    <span className="text-white/70">
                                      Hearts filling fast
                                    </span>
                                    <span className="text-rose-400 font-bold">
                                      {Math.round(soldPercent)}% in love
                                    </span>
                                  </div>
                                  <div className="h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500"
                                      style={{ width: `${soldPercent}%` }}
                                    />
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* CONTENT - Valentine Themed */}
                        <div className="flex flex-col justify-center">
                          {/* Title & Description */}
                          <div className="mb-3 sm:mb-4">
                            <h2
                              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-1.5 sm:mb-2"
                              data-testid={`text-title-${competition.id}`}
                            >
                              {competition.title}
                            </h2>
                            <p className="text-white/50 text-sm sm:text-base line-clamp-2">
                              Fall in love with winning! Enter now for your
                              chance to win this incredible prize!
                            </p>
                          </div>

                          {/* Feature Chips - Valentine */}
                          <div className="grid grid-cols-2 gap-2 mb-4 sm:mb-5">
                            {[
                              {
                                icon: Heart,
                                text: "Win Love",
                                color: "text-rose-400",
                                bg: "bg-rose-500/10",
                              },
                              {
                                icon: Gift,
                                text: "Amazing Prize",
                                color: "text-pink-400",
                                bg: "bg-pink-500/10",
                              },
                              {
                                icon: Shield,
                                text: "Secure Win",
                                color: "text-red-400",
                                bg: "bg-red-500/10",
                              },
                              {
                                icon: Sparkles,
                                text: "Instant Joy",
                                color: "text-rose-300",
                                bg: "bg-rose-400/10",
                              },
                            ].map((chip, i) => (
                              <div
                                key={i}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${chip.bg} border border-white/10`}
                              >
                                <chip.icon
                                  className={`w-3.5 h-3.5 ${chip.color}`}
                                />
                                <span className="text-white/70 text-xs font-medium">
                                  {chip.text}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Price & CTA Row */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            {/* Price - Valentine */}
                            <div className="flex items-baseline gap-2">
                              <span className="text-white/30 text-sm line-through">
                                £
                                {(
                                  parseFloat(competition.ticketPrice) * 2
                                ).toFixed(2)}
                              </span>
                              <span
                                className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-rose-400 via-pink-300 to-rose-400 bg-clip-text text-transparent drop-shadow-lg animate-text-shimmer"
                                data-testid={`text-price-${competition.id}`}
                              >
                                £
                                {parseFloat(competition.ticketPrice).toFixed(2)}
                              </span>
                              <span className="text-white/40 text-xs sm:text-sm">
                                per heart
                              </span>
                            </div>

                            {/* CTA Buttons - Valentine */}
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button
                                onClick={() =>
                                  handleViewCompetition(competition.id)
                                }
                                data-testid="button-enter-competition"
                                className="flex-1 sm:flex-none h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-black rounded-lg sm:rounded-xl bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 text-white border-0 shadow-[0_8px_30px_rgba(225,29,72,0.4)] hover:shadow-[0_12px_40px_rgba(225,29,72,0.6)] hover:scale-105 transition-all"
                              >
                                <Heart className="w-4 h-4 mr-1.5 fill-white" />
                                Win With Love
                              </Button>

                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleViewCompetition(competition.id)
                                }
                                className="h-10 sm:h-12 px-3 sm:px-4 text-sm font-bold rounded-lg sm:rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Trust Bar - Valentine */}
                      <div className="mt-4 pt-3 sm:pt-4 border-t border-rose-500/20">
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-white/40 text-[10px] sm:text-xs">
                          {[
                            { dot: "bg-rose-400", text: "Instant Love Payout" },
                            { dot: "bg-pink-400", text: "Romantic Support" },
                            { dot: "bg-red-400", text: "Winning Guarantee" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <div
                                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 ${item.dot} rounded-full animate-pulse`}
                              />
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

      {/* Slide Indicators - Heart Themed */}
      <div className="max-w-7xl mx-auto px-4 mt-4 sm:mt-6 relative z-10">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {instantCompetitions.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`transition-all duration-300 ${
                i === activeSlide
                  ? "w-6 sm:w-10 h-6 sm:h-10 bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.5)]"
                  : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/20"
              } rounded-full hover:scale-110`}
              aria-label={`Go to slide ${i + 1}`}
            >
              {i === activeSlide && (
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-white mx-auto my-auto fill-white" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}