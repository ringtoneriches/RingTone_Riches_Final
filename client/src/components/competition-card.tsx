import { useLocation } from "wouter";
import { Competition } from "@shared/schema";
import { TrendingUp, Trophy, Users, Sparkles, Snowflake, Gift, Star, Zap } from "lucide-react";

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
      ? "Your festive jackpot awaits... Spin for huge cash prizes & ringtone bonuses - WIN UP TO £5,000 INSTANTLY!"
      : competition.type === "scratch"
      ? "Scratch your way to legendary wins around the world! WIN UP TO £5,000 INSTANTLY!"
      : "";

  const isHot = progressPercentage > 60;
  const isAlmostSoldOut = progressPercentage > 85;

  return (
    <div 
      className="competition-card group h-full rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-4 flex flex-col cursor-pointer relative"
      data-type={competition.type}
      data-testid={`card-competition-${competition.id}`}
      onClick={handleViewCompetition}
    >
      {/* OUTER GLOW BORDER */}
      <div className="absolute -inset-[2px] bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 rounded-2xl opacity-60 group-hover:opacity-100 blur-sm group-hover:blur-none transition-all duration-500 animate-border-glow"></div>
      
      {/* MAIN CARD CONTAINER */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 h-full rounded-2xl overflow-hidden flex flex-col z-10 border border-white/10">
        
        {/* ===== CHRISTMAS LIGHTS GARLAND ===== */}
        <div className="absolute top-0 left-0 right-0 h-3 z-30 flex items-center justify-around px-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="relative">
              <div 
                className="w-2.5 h-2.5 rounded-full animate-christmas-light"
                style={{
                  backgroundColor: ['#ef4444', '#22c55e', '#facc15', '#3b82f6', '#ec4899'][i % 5],
                  boxShadow: `0 0 8px 3px ${['#ef4444', '#22c55e', '#facc15', '#3b82f6', '#ec4899'][i % 5]}`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
              <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-0.5 h-1 bg-slate-600"></div>
            </div>
          ))}
        </div>

        {/* ===== FLOATING ORNAMENTS ===== */}
        <div className="absolute top-5 left-2 z-20">
          <div className="relative animate-float" style={{ animationDelay: '0s' }}>
            <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-red-400 via-red-500 to-red-700 rounded-full border-2 border-yellow-400 shadow-lg shadow-red-500/60">
              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="absolute top-5 right-2 z-20">
          <div className="relative animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-green-400 via-green-500 to-green-700 rounded-full border-2 border-yellow-400 shadow-lg shadow-green-500/60">
              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* ===== HOT / SELLING FAST BADGE ===== */}
        {isHot && (
          <div className="absolute top-10 left-2 z-30">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-md opacity-70 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white text-[8px] md:text-[10px] font-black px-2 py-1 rounded-lg shadow-xl flex items-center gap-1 border border-yellow-400/60 animate-badge-shake">
                <TrendingUp className="w-3 h-3" />
                <span>{isAlmostSoldOut ? 'SELLING FAST!' : 'HOT!'}</span>
                <Zap className="w-2.5 h-2.5 fill-yellow-300 text-yellow-300" />
              </div>
            </div>
          </div>
        )}

        {/* ===== FREE ENTRY BADGE ===== */}
        {competition.ticketPrice === "0.00" && (
          <div className="absolute top-10 right-2 z-30">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 blur-md opacity-70 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 text-white text-[8px] md:text-[10px] font-black px-2 py-1 rounded-lg shadow-xl flex items-center gap-1 border border-yellow-400/60">
                <Gift className="w-3 h-3" />
                <span>FREE ENTRY!</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== IMAGE SECTION - ORIGINAL LAYOUT ===== */}
        <div className="relative overflow-hidden bg-muted/20 flex items-center justify-center" style={{ minHeight: '160px' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10"></div>
          
          {/* Blurred Background Image */}
          <img 
            src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"} 
            alt=""
            className="absolute inset-0 w-full h-full object-contain blur-sm scale-110 opacity-30"
          />
          
          {/* Main Image */}
          <img 
            src={competition.imageUrl || "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"} 
            alt={competition.title}
            className="relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
            data-testid={`img-competition-${competition.id}`}
          />
          
          {/* Reduced Snowflakes - Only 4 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-50 animate-snowfall"
                style={{
                  left: `${15 + i * 20}%`,
                  animationDelay: `${i * 0.6}s`,
                  animationDuration: '3s',
                }}
              />
            ))}
          </div>
        </div>

        {/* ===== CONTENT SECTION ===== */}
        <div className="p-2.5 md:p-4 flex-1 flex flex-col bg-card/95 backdrop-blur-sm relative z-10">
          
          {/* TITLE - Glowing and Bold */}
          <div className="relative mb-2">
            <h3 
              className="text-xs md:text-base font-black leading-tight break-words transition-all duration-300"
              data-testid={`text-title-${competition.id}`}
              style={{ 
                wordBreak: 'break-word',
                hyphens: 'auto',
                background: 'linear-gradient(135deg, #ffffff 0%, #fbbf24 50%, #ffffff 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'title-shimmer 3s linear infinite',
              }}
            >
              {competition.title}
            </h3>
          </div>

          {/* DESCRIPTION - With Icon Decoration */}
          {shortDescription && (
            <div className="relative mb-2 p-2 rounded-lg bg-gradient-to-r from-red-500/10 via-transparent to-green-500/10 border border-white/5">
              <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                <Sparkles className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span>{shortDescription}</span>
              </p>
            </div>
          )}

          {/* ===== PROGRESS BAR - Spectacular ===== */}
          {competition.maxTickets && (
            <div className="mb-2">
              <div className="flex justify-between text-[9px] md:text-xs text-muted-foreground mb-1 font-bold">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {competition.soldTickets} sold
                </span>
                <span>{competition.maxTickets} total</span>
              </div>
              <div className="relative h-2 md:h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                {/* Progress Fill */}
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1"></div>

          {/* ===== PRICE SECTION - Eye-Catching ===== */}
          <div className="flex items-center justify-between mb-2 p-2 rounded-xl bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 border border-yellow-400/20">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                {/* <span className="text-slate-500 text-[10px] line-through">
                  £{(parseFloat(competition.ticketPrice) * 2).toFixed(2)}
                </span> */}
                {/* <span className="bg-red-500 text-white text-[7px] px-1 py-0.5 rounded font-bold">
                  50% OFF
                </span> */}
              </div>
              <span 
                className="text-xl md:text-3xl font-black"
                data-testid={`text-price-${competition.id}`}
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))',
                }}
              >
                £{parseFloat(competition.ticketPrice).toFixed(2)}
              </span>
              <span className="text-[9px] md:text-xs text-muted-foreground font-black uppercase">Per Entry</span>
            </div>
            
            {/* Trophy with Glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-40 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-xl">
                <Trophy className="w-5 h-5 md:w-7 md:h-7 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>

          {/* ===== CTA BUTTON - SPECTACULAR ===== */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleViewCompetition();
            }}
            className="relative w-full py-2.5 md:py-3.5 rounded-xl font-black uppercase tracking-wider text-[10px] md:text-sm transition-all duration-300 hover:scale-105 transform overflow-hidden group/btn"
            data-testid={`button-enter-${competition.id}`}
          >
            {/* Button Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-green-500 group-hover/btn:from-green-500 group-hover/btn:via-yellow-400 group-hover/btn:to-red-500 transition-all duration-500"></div>
            
            {/* Animated Border */}
            <div className="absolute inset-0 border-2 border-yellow-400/60 rounded-xl"></div>
            
            {/* Shine Sweep Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
            
            {/* Reduced Sparkle Particles - Only 3 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className="absolute w-2.5 h-2.5 text-yellow-300 fill-yellow-300 opacity-0 group-hover/btn:opacity-100 animate-sparkle-float"
                  style={{
                    left: `${25 + i * 25}%`,
                    top: '50%',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Button Content */}
            <span className="relative flex items-center justify-center gap-2 text-white drop-shadow-lg">
              <Gift className="w-4 h-4 md:w-5 md:h-5 animate-bounce" style={{ animationDuration: '1s' }} />
              <span>
                {competition.type === "scratch"
                  ? "SCRATCH & WIN"
                  : competition.type === "spin"
                  ? "SPIN TO WIN"
                  : "ENTER NOW"}
              </span>
              <Snowflake className="w-4 h-4 md:w-5 md:h-5 animate-spin" style={{ animationDuration: '3s' }} />
            </span>
          </button>
        </div>
      </div>

      {/* ===== CSS ANIMATIONS ===== */}
      <style>{`
        @keyframes christmas-light {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .animate-christmas-light {
          animation: christmas-light 1.5s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(5deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes border-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
        .animate-border-glow {
          animation: border-glow 2s ease-in-out infinite;
        }
        
        @keyframes badge-shake {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        .animate-badge-shake {
          animation: badge-shake 0.5s ease-in-out infinite;
        }
        
        @keyframes snowfall {
          0% { transform: translateY(-10px); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.4; }
          100% { transform: translateY(180px); opacity: 0; }
        }
        .animate-snowfall {
          animation: snowfall 3s linear infinite;
        }
        
        @keyframes title-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
        
        @keyframes sparkle-float {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          50% { transform: translateY(-8px) scale(1); opacity: 1; }
          100% { transform: translateY(-16px) scale(0); opacity: 0; }
        }
        .animate-sparkle-float {
          animation: sparkle-float 1s ease-out infinite;
        }
      `}</style>
    </div>
  );
}