import { useLocation } from "wouter";
import { Competition } from "@shared/schema";
import { TrendingUp, Trophy, Sparkles, Gift, Zap, ChevronRight, Star, Clock, Crown } from "lucide-react";

interface CompetitionCardProps {
  competition: Competition;
  authenticated?: boolean;
}

export default function CompetitionCard({ competition, authenticated = false }: CompetitionCardProps) {
  const [, setLocation] = useLocation();

  const handleViewCompetition = () => {
    setLocation(`/competition/${competition.id}`);
  };

  const progressPercentage = competition.maxTickets 
    ? (competition.soldTickets! / competition.maxTickets) * 100 
    : 0;

  const shortDescription =
    competition.type === "spin" && competition.wheelType === "wheel1"
      ? "Rev it. Spin it. Win it! Unlock massive cash & ringtone rewards - WIN UP TO £15,000 INSTANTLY!"
      : competition.type === "spin" && competition.wheelType === "wheel2"
      ? "Spin for your 2025 jackpot! Huge cash prizes & ringtone bonuses - WIN UP TO £5,000 INSTANTLY!"
      : competition.type === "scratch"
      ? "Scratch your way to legendary wins around the world! WIN UP TO £5,000 INSTANTLY!"
      : competition.type === "pop"
      ? "Pop the balloons! Match 3 to WIN - Instant cash & ringtone rewards await!"
      : "";

  const isHot = progressPercentage > 60;
  const isAlmostSoldOut = progressPercentage > 85;

  const getTypeIcon = () => {
    switch (competition.type) {
      case "spin":
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case "scratch":
        return <Sparkles className="w-3.5 h-3.5 text-violet-400" />;
      case "pop":
        return <Gift className="w-3.5 h-3.5 text-fuchsia-400" />;
      default:
        return <Trophy className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getGradientByType = () => {
    switch (competition.type) {
      case "spin":
        return { 
          bg: "from-amber-500/20 via-orange-500/15 to-transparent",
          border: "from-amber-400 via-orange-500 to-amber-600",
          glow: "rgba(251, 191, 36, 0.4)"
        };
      case "scratch":
        return { 
          bg: "from-violet-500/20 via-purple-500/15 to-transparent",
          border: "from-violet-400 via-purple-500 to-violet-600",
          glow: "rgba(139, 92, 246, 0.4)"
        };
      case "pop":
        return { 
          bg: "from-fuchsia-500/20 via-pink-500/15 to-transparent",
          border: "from-fuchsia-400 via-pink-500 to-fuchsia-600",
          glow: "rgba(217, 70, 239, 0.4)"
        };
      default:
        return { 
          bg: "from-violet-500/20 via-fuchsia-500/15 to-transparent",
          border: "from-violet-400 via-fuchsia-500 to-violet-600",
          glow: "rgba(139, 92, 246, 0.4)"
        };
    }
  };

  const typeStyle = getGradientByType();

  return (
    <div 
      className="competition-card group h-full rounded-2xl overflow-visible transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] flex flex-col cursor-pointer relative"
      data-type={competition.type}
      data-testid={`card-competition-${competition.id}`}
      onClick={handleViewCompetition}
    >
      {/* Animated Rainbow Border on Hover */}
      <div 
        className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-r ${typeStyle.border} opacity-0 group-hover:opacity-100 transition-all duration-500 animate-rainbow-border`}
        style={{ backgroundSize: '300% 300%' }}
      />
      
      {/* Outer Glow on Hover - Enhanced */}
      <div 
        className="absolute -inset-3 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl"
        style={{ background: `radial-gradient(circle, ${typeStyle.glow}, transparent)` }}
      />
      
      {/* Card Container */}
      <div className="relative h-full rounded-2xl bg-gradient-to-b from-slate-900/95 to-[#0c0a20] border border-white/10 group-hover:border-transparent transition-colors duration-300 flex flex-col overflow-hidden">
        
        {/* Shimmer Effect Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 animate-shimmer" />
        </div>
        
        {/* Ambient Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${typeStyle.bg} opacity-60`} />
        
        {/* Animated Sparkles */}
        <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-white rounded-full animate-twinkle opacity-0 group-hover:opacity-70" />
        <div className="absolute top-12 right-12 w-1 h-1 bg-amber-400 rounded-full animate-twinkle opacity-0 group-hover:opacity-60" style={{animationDelay: '0.3s'}} />
        <div className="absolute top-8 right-20 w-1 h-1 bg-violet-400 rounded-full animate-twinkle opacity-0 group-hover:opacity-50" style={{animationDelay: '0.6s'}} />
        
        {/* Image Section - Full Image Display */}
        <div className="relative overflow-hidden bg-slate-900/50">
          <img 
            src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"} 
            alt={competition.title}
            className="w-full h-auto object-contain transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
          />
          
          {/* Premium Overlay */}
          <div className="" />
          
          {/* Glass Reflection Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Type Badge - Premium Glass with Animation */}
          <div className="absolute top-2 left-2 xs:top-3 xs:left-3">
            <div className="relative">
              <div className="absolute -inset-0.5 xs:-inset-1 bg-gradient-to-r from-violet-500/50 to-fuchsia-500/50 rounded-lg xs:rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
              <div className="relative bg-slate-900/90 backdrop-blur-md text-white px-2 py-1 xs:px-3 xs:py-1.5 rounded-md xs:rounded-lg text-[10px] xs:text-xs font-bold flex items-center gap-1 xs:gap-2 border border-white/20 group-hover:border-white/40 transition-colors">
                {getTypeIcon()}
                <span className="capitalize">{competition.type}</span>
              </div>
            </div>
          </div>
          
          {/* Status Badges */}
          <div className="absolute top-2 right-2 xs:top-3 xs:right-3 flex flex-col gap-1 xs:gap-2">
            {isHot && (
              <div className="relative group/badge animate-bounce-in">
                <div className="absolute -inset-0.5 xs:-inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-md xs:rounded-lg blur-md opacity-70 animate-pulse" />
                <div className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white text-[8px] xs:text-[10px] font-bold px-2 py-1 xs:px-3 xs:py-1.5 rounded-md xs:rounded-lg flex items-center gap-1 xs:gap-1.5 border border-white/20">
                  <TrendingUp className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                  <span className="hidden xs:inline">{isAlmostSoldOut ? 'ALMOST GONE!' : 'HOT!'}</span>
                  <span className="xs:hidden">HOT</span>
                </div>
              </div>
            )}
            
            {competition.ticketPrice === "0.00" && (
              <div className="relative group/badge animate-bounce-in" style={{animationDelay: '0.2s'}}>
                <div className="absolute -inset-0.5 xs:-inset-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-md xs:rounded-lg blur-md opacity-70 animate-pulse" />
                <div className="relative bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[8px] xs:text-[10px] font-bold px-2 py-1 xs:px-3 xs:py-1.5 rounded-md xs:rounded-lg flex items-center gap-1 xs:gap-1.5 border border-white/20">
                  <Star className="w-2.5 h-2.5 xs:w-3 xs:h-3 fill-current" />
                  <span className="hidden xs:inline">FREE ENTRY!</span>
                  <span className="xs:hidden">FREE</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Live Indicator - Enhanced */}
          {/* <div className="absolute bottom-2 left-2 xs:bottom-3 xs:left-3">
            <div className="flex items-center gap-1 xs:gap-1.5 bg-slate-900/90 backdrop-blur-md px-1.5 py-0.5 xs:px-2.5 xs:py-1 rounded-full border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                <div className="relative w-1.5 h-1.5 xs:w-2 xs:h-2 bg-emerald-400 rounded-full" />
              </div>
              <span className="text-[8px] xs:text-[10px] text-emerald-400 font-semibold">LIVE</span>
            </div>
          </div> */}
          
          {/* Premium Crown for top prizes */}
          {/* {parseFloat(competition.ticketPrice) >= 1 && (
            <div className="absolute bottom-2 right-2 xs:bottom-3 xs:right-3">
              <div className="relative">
                <div className="absolute -inset-0.5 xs:-inset-1 bg-amber-500/40 rounded-full blur-md animate-pulse" />
                <div className="relative bg-gradient-to-br from-amber-400 to-yellow-500 p-1 xs:p-1.5 rounded-full">
                  <Crown className="w-2.5 h-2.5 xs:w-3.5 xs:h-3.5 text-slate-900" />
                </div>
              </div>
            </div>
          )} */}
        </div>

        {/* Content Section - Responsive */}
        <div className="relative flex-1 flex flex-col p-2 xs:p-3 sm:p-4 md:p-5 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
          {/* Title */}
          <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-violet-300 group-hover:to-fuchsia-300 group-hover:bg-clip-text transition-all duration-300">
            {competition.title}
          </h3>
          
          {/* Description - Hidden on very small screens */}
          {shortDescription && (
            <p className="hidden xs:block text-slate-400 text-[10px] xs:text-xs leading-relaxed line-clamp-2 flex-1 group-hover:text-slate-300 transition-colors duration-300">
              {shortDescription}
            </p>
          )}
          
          {/* Progress Bar - Premium with Animation */}
          {competition.maxTickets && competition.maxTickets > 0 && (
            <div className="space-y-1 xs:space-y-2">
              <div className="flex justify-between text-[8px] xs:text-[10px]">
                <span className="text-slate-500">{competition.soldTickets || 0} sold</span>
                <span className="text-slate-500">{competition.maxTickets} total</span>
              </div>
              <div className="relative h-1.5 xs:h-2 sm:h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                {/* Progress Glow - Animated */}
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500/40 to-fuchsia-500/40 blur-md rounded-full animate-pulse"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
                {/* Progress Bar with Shimmer */}
                <div 
                  className="relative h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 transition-all duration-700"
                  style={{ 
                    width: `${Math.min(progressPercentage, 100)}%`,
                    backgroundSize: '200% 100%',
                    animation: 'rainbow-border 3s ease infinite'
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Price & CTA Row - Responsive */}
          <div className="flex items-center justify-between gap-1 xs:gap-2 sm:gap-4 pt-1.5 xs:pt-2 sm:pt-3 border-t border-white/5">
            <div className="flex flex-col">
              {competition.ticketPrice !== "0.00" && (
                <span className="text-slate-500 text-[8px] xs:text-[10px] sm:text-xs line-through">
                  £{(parseFloat(competition.ticketPrice) * 2).toFixed(2)}
                </span>
              )}
              <span className={`text-sm xs:text-base sm:text-xl md:text-2xl font-black ${competition.ticketPrice === "0.00" ? 'text-emerald-400 animate-pulse' : 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent'}`}
                style={competition.ticketPrice !== "0.00" ? { backgroundSize: '200% 100%', animation: 'rainbow-border 3s ease infinite' } : undefined}
              >
                {competition.ticketPrice === "0.00" ? "FREE" : `£${parseFloat(competition.ticketPrice).toFixed(2)}`}
              </span>
            </div>
            
            {/* CTA Button - Premium Animated & Responsive */}
            <div className="relative group/btn">
              <div className="absolute -inset-0.5 xs:-inset-1 sm:-inset-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 rounded-md xs:rounded-lg sm:rounded-xl blur-md opacity-50 group-hover/btn:opacity-100 transition-all duration-300 animate-pulse" />
              <button 
                className="relative flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-2.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500 text-white text-[10px] xs:text-xs sm:text-sm font-bold rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300 border border-white/20 group-hover/btn:border-white/40 overflow-hidden"
                style={{ backgroundSize: '200% 100%', animation: 'rainbow-border 3s ease infinite' }}
                data-testid={`button-view-competition-${competition.id}`}
              >
                {/* Button Shimmer */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                <span className="relative">Enter</span>
                <ChevronRight className="relative w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}