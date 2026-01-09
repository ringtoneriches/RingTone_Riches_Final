import { useLocation } from "wouter";
import { Competition } from "@shared/schema";
import { TrendingUp, Trophy, Sparkles, Gift, Zap, Users, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const isHot = progressPercentage > 60;
  const isAlmostGone = progressPercentage > 85;
  
  const remainingTickets = competition.maxTickets 
    ? competition.maxTickets - (competition.soldTickets || 0)
    : 0;

  const getTypeConfig = () => {
    switch (competition.type) {
      case "spin":
        return { 
          icon: Zap, 
          label: "Spin",
          gradient: "from-purple-500 to-purple-600",
          glow: "rgba(168,85,247,0.5)"
        };
      case "scratch":
        return { 
          icon: Sparkles, 
          label: "Scratch",
          gradient: "from-emerald-500 to-emerald-600",
          glow: "rgba(16,185,129,0.5)"
        };
      case "pop":
        return { 
          icon: Gift, 
          label: "Pop",
          gradient: "from-pink-500 to-pink-600",
          glow: "rgba(236,72,153,0.5)"
        };
      default:
        return { 
          icon: Trophy, 
          label: "Competition",
          gradient: "from-amber-500 to-amber-600",
          glow: "rgba(212,175,55,0.5)"
        };
    }
  };

  const typeConfig = getTypeConfig();
  const TypeIcon = typeConfig.icon;

  return (
    <div 
      className="group cursor-pointer h-full"
      style={{ perspective: "1200px" }}
      data-testid={`card-competition-${competition.id}`}
      onClick={handleViewCompetition}
    >
      {/* 3D Card Container */}
      <div 
        className="relative h-full transition-all duration-500 ease-out group-hover:translate-y-[-4px]"
        style={{ 
          transformStyle: "preserve-3d",
          transform: "translateZ(0)"
        }}
      >
        {/* Ambient Glow - Behind card (hidden on mobile) */}
        <div 
          className="absolute -inset-3 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 hidden sm:block"
          style={{ 
            background: `radial-gradient(ellipse at 50% 80%, ${typeConfig.glow}, transparent 60%)`,
            transform: "translateZ(-30px)",
            filter: "blur(25px)"
          }}
        />
        
        {/* Outer Frame - Metallic border */}
        <div 
          className="relative h-full rounded-xl sm:rounded-2xl p-[1px] overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(212,175,55,0.5) 0%, rgba(255,255,255,0.15) 50%, rgba(212,175,55,0.3) 100%)"
          }}
        >
          {/* Inner Card */}
          <div 
            className="relative h-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900"
            style={{ 
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 50px -15px rgba(0,0,0,0.7)"
            }}
          >
            {/* Image Section */}
            <div className="relative aspect-[4/5] sm:aspect-[16/20] md:aspect-[16/18] overflow-hidden">
              <img 
                src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
                alt={competition.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Gradient overlay */}
              <div className="absolute " />
              
              {/* Top Row - Badges */}
              <div className="absolute top-0 left-0 right-0 p-2 sm:p-3 flex items-start justify-between gap-1">
                {/* Game Type Badge */}
                <div 
                  className={`flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r ${typeConfig.gradient}`}
                  style={{ boxShadow: `0 2px 10px ${typeConfig.glow}` }}
                >
                  <TypeIcon className="w-3 h-3 text-white" />
                  <span className="text-[10px] sm:text-xs font-bold text-white">{typeConfig.label}</span>
                </div>
                
                {/* Urgency Badge */}
                {isAlmostGone ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-red-600 to-red-500 animate-pulse">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                ) : isHot ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-orange-500 to-red-500">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                ) : null}
              </div>
              
              {/* Bottom Row - Live indicator */}
              {/* <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/90 border border-emerald-500/30">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <div className="absolute inset-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">LIVE</span>
                </div>
              </div> */}
            </div>

            {/* Content Section */}
            <div className="p-2 sm:p-3 flex flex-col gap-2 bg-gradient-to-b from-slate-800/50 to-slate-900/80">
              {/* Title - Full text */}
              <h3 
                className="text-xs sm:text-sm font-bold text-white leading-snug group-hover:text-amber-400 transition-colors"
                data-testid={`text-title-${competition.id}`}
              >
                {competition.title}
              </h3>
              
              {/* Entries Info */}
             {competition.maxTickets && competition.maxTickets > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] sm:text-xs text-slate-300">
                  {Math.round(((competition.soldTickets || 0) / competition.maxTickets) * 100)}% progress
                </span>
              </div>
              {/* <span className={`text-[10px] sm:text-xs font-semibold ${
                isAlmostGone ? 'text-red-400' : isHot ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {remainingTickets} left
              </span> */}
            </div>
          )}
              
              {/* Progress bar */}
              {competition.maxTickets && competition.maxTickets > 0 && (
                <div className="h-1 sm:h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      isAlmostGone 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                        : `bg-gradient-to-r ${typeConfig.gradient}`
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              )}
              
              {/* Price & CTA Row */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/50">
                {/* Price */}
                <span 
                  className={`text-base sm:text-xl font-black ${
                    competition.ticketPrice === "0.00" 
                      ? 'text-emerald-400' 
                      : 'text-amber-400'
                  }`}
                  data-testid={`text-price-${competition.id}`}
                >
                  {competition.ticketPrice === "0.00" ? "FREE" : `£${parseFloat(competition.ticketPrice).toFixed(2)}`}
                </span>
                
                {/* Simple CTA Button */}
                <Button 
                  className="h-7 sm:h-9 px-3 sm:px-4 text-[10px] sm:text-xs font-bold rounded-md sm:rounded-lg border-0"
                  style={{
                    background: "linear-gradient(135deg, #d4af37 0%, #f5d76e 50%, #d4af37 100%)",
                    boxShadow: "0 2px 10px rgba(212,175,55,0.3)"
                  }}
                  data-testid={`button-view-competition-${competition.id}`}
                >
                  <span className="text-slate-900 font-bold">Enter Now</span>
                </Button>
              </div>
            </div>
            
            {/* Top edge highlight */}
            <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}