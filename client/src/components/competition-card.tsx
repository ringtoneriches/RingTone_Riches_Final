import { useLocation } from "wouter";
import { Competition } from "@shared/schema";
import { TrendingUp, Zap, Trophy, Users, Sparkles } from "lucide-react";

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
    competition.type === "spin"
      ? "Spin the wheel to win!"
      : competition.type === "scratch"
      ? "Scratch to reveal your prize!"
      : "Enter the draw to win!";

  const isHot = progressPercentage > 60;
  const isAlmostSoldOut = progressPercentage > 85;

  // Card gradient colors based on type
  const cardGradient = 
    competition.type === "spin" 
      ? "from-purple-500/10 to-pink-500/10" 
      : competition.type === "scratch"
      ? "from-blue-500/10 to-cyan-500/10"
      : "from-green-500/10 to-emerald-500/10";

  const buttonGradient = 
    competition.type === "spin" 
      ? "from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500" 
      : competition.type === "scratch"
      ? "from-blue-500 to-cyan-500 hover:from-cyan-500 hover:to-blue-500"
      : "from-primary to-yellow-400 hover:from-yellow-400 hover:to-primary";

  return (
    <div 
      className={`competition-card group bg-gradient-to-br ${cardGradient} bg-card h-full rounded-xl border-2 border-border hover:border-primary overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-2 flex flex-col cursor-pointer relative`}
      data-type={competition.type}
      data-testid={`card-competition-${competition.id}`}
      onClick={handleViewCompetition}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-300 pointer-events-none"></div>

      {/* HOT Badge */}
      {isHot && (
        <div className="absolute top-2 left-2 z-20">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] md:text-xs font-black px-2 py-1 rounded-full shadow-xl flex items-center gap-1 animate-pulse">
            <TrendingUp className="w-3 h-3" />
            {isAlmostSoldOut ? '🔥 SELLING FAST!' : '🔥 HOT!'}
          </div>
        </div>
      )}

      {/* Free Entry Badge */}
      {competition.ticketPrice === "0.00" && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[9px] md:text-xs font-black px-2 py-1 rounded-full shadow-xl flex items-center gap-1 z-20 animate-pulse">
          <Zap className="w-3 h-3" /> FREE!
        </div>
      )}

      {/* Image Section */}
      <div className="relative overflow-hidden bg-muted/20 flex items-center justify-center" style={{ minHeight: '160px' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10"></div>
        
        <img 
          src={
            competition.imageUrl ||
            "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
          } 
          alt=""
          className="absolute inset-0 w-full h-full object-contain blur-sm scale-110 opacity-30"
        />
        
        <img 
          src={
            competition.imageUrl ||
            "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
          } 
          alt={competition.title}
          className="relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          data-testid={`img-competition-${competition.id}`}
        />
      </div>

      {/* Content Section */}
      <div className="p-2.5 md:p-4 flex-1 flex flex-col bg-card/95 backdrop-blur-sm relative z-10">
        {/* TITLE - NO LINE CLAMP, FULL TEXT VISIBLE! */}
        <h3 
          className="text-xs md:text-base font-black text-foreground leading-tight break-words mb-2 group-hover:text-primary transition-colors" 
          data-testid={`text-title-${competition.id}`}
          style={{ 
            wordBreak: 'break-word',
            hyphens: 'auto'
          }}
        >
          {competition.title}
        </h3>

        {/* DESCRIPTION - NO LINE CLAMP, FULL TEXT VISIBLE! */}
        {shortDescription && (
          <p className="text-[10px] md:text-xs text-muted-foreground mb-2 flex items-center gap-1 break-words leading-snug">
            <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
            <span>{shortDescription}</span>
          </p>
        )}

        {/* Progress bar */}
        {competition.maxTickets && (
          <div className="mb-2">
            <div className="flex justify-between text-[9px] md:text-xs text-muted-foreground mb-1 font-bold">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {competition.soldTickets}
              </span>
              <span>{competition.maxTickets} max</span>
            </div>
            <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full bg-gradient-to-r ${buttonGradient} transition-all duration-300`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex-1"></div>

        {/* Price */}
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex flex-col">
            <span 
              className="text-xl md:text-3xl font-black bg-gradient-to-r from-primary to-yellow-400 bg-clip-text text-transparent" 
              data-testid={`text-price-${competition.id}`}
            >
              £{parseFloat(competition.ticketPrice).toFixed(2)}
            </span>
            <span className="text-[9px] md:text-xs text-muted-foreground font-black uppercase">PER ENTRY</span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <Trophy className="relative w-5 h-5 md:w-8 md:h-8 text-primary group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* CTA Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleViewCompetition();
          }}
          className={`w-full bg-gradient-to-r ${buttonGradient} text-white text-[10px] md:text-sm py-2 md:py-3 rounded-lg font-black uppercase tracking-wide transition-all duration-300 hover:shadow-xl hover:shadow-primary/50 hover:scale-105 transform`}
          data-testid={`button-enter-${competition.id}`}
        >
          {competition.type === "scratch"
            ? "🎫 PLAY NOW"
            : competition.type === "spin"
            ? "🎡 SPIN NOW"
            : "⚡ ENTER NOW"}
        </button>
      </div>
    </div>
  );
}
