import { Shield, Zap, Lock, CheckCircle, Award, Clock, Egg, Rabbit, Gift, PartyPopper, Flower, Candy, Sparkles, Gem } from "lucide-react";

export default function StatsBanner() {
  const trustElements = [
    {
      icon: Shield,
      title: "100% Secure",
      description: "Bank-level encryption",
      color: "from-yellow-400 to-pink-300",
      iconColor: "text-yellow-400",
      bgGlow: "rgba(255,215,0,0.15)",
      easterIcon: Egg
    },
    {
      icon: CheckCircle,
      title: "Fair & Transparent",
      description: "Every egg has a chance",
      color: "from-pink-300 to-green-300",
      iconColor: "text-pink-400",
      bgGlow: "rgba(255,183,197,0.15)",
      easterIcon: Rabbit
    },
    {
      icon: Award,
      title: "Golden Winners",
      description: "Egg-stra prizes every draw",
      color: "from-green-300 to-yellow-400",
      iconColor: "text-green-400",
      bgGlow: "rgba(152,251,152,0.15)",
      easterIcon: Gift
    },
    {
      icon: Clock,
      title: "Instant Results",
      description: "Know immediately if you win",
      color: "from-yellow-400 to-pink-300",
      iconColor: "text-yellow-400",
      bgGlow: "rgba(255,215,0,0.15)",
      easterIcon: PartyPopper
    }
  ];

  return (
    <section className="relative overflow-hidden py-8 md:py-12" style={{
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0f2e 30%, #2d1b3d 60%, #1a0f2e 100%)'
    }}>
      {/* Easter Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Easter eggs */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`bg-egg-${i}`}
            className="absolute animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${12 + Math.random() * 8}s`,
            }}
          >
            <Egg className="w-12 h-16 opacity-[0.04]" style={{ color: ['#FFB7C5', '#98FB98', '#FFD700', '#DDA0DD'][i % 4] }} />
          </div>
        ))}
        
        {/* Easter sparkles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full animate-sparkle-float"
            style={{
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              background: i % 4 === 0 ? '#FFD700' : i % 4 === 1 ? '#FFB7C5' : i % 4 === 2 ? '#98FB98' : '#DDA0DD',
              top: `${5 + (i * 6) % 90}%`,
              left: `${2 + (i * 5) % 95}%`,
              animationDelay: `${i * 0.3}s`,
              boxShadow: `0 0 ${6 + i % 6}px rgba(255,215,0,0.4)`,
            }}
          />
        ))}
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-400/5 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-300/3 rounded-full blur-3xl animate-pulse-slow delay-500" />
      </div>

      {/* Top and bottom decorative lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Easter Header Badge */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-sm">
            <Rabbit className="w-3.5 h-3.5 text-yellow-400 animate-bounce-soft" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-yellow-400">
              Easter 2026 • Golden Guarantees
            </span>
            <Egg className="w-3 h-3 text-pink-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {trustElements.map((element, index) => {
            const EasterIcon = element.easterIcon;
            return (
              <div 
                key={index}
                className="group relative text-center transition-all duration-500 hover:scale-105 cursor-default"
              >
                {/* Card glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Easter egg card background */}
                <div className="relative p-4 md:p-5 rounded-2xl bg-gradient-to-br from-gray-900/50 to-purple-900/20 backdrop-blur-sm border border-yellow-500/10 group-hover:border-yellow-500/30 transition-all duration-300">
                  
                  {/* Easter corner decorations */}
                  <div className="absolute top-2 left-2 opacity-30 group-hover:opacity-50 transition-opacity">
                    <EasterIcon className="w-3 h-3" style={{ color: element.iconColor.replace('text-', '') }} />
                  </div>
                  <div className="absolute top-2 right-2 opacity-30 group-hover:opacity-50 transition-opacity">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  </div>
                  
                  <div className="flex justify-center mb-3 md:mb-4">
                    <div className="relative">
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${element.color} blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 rounded-full`} />
                      
                      {/* Icon container with Easter theme */}
                      <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/20 group-hover:border-yellow-400/40 transition-all duration-300">
                        <element.icon className={`relative w-7 h-7 md:w-10 md:h-10 ${element.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                        {/* Mini Easter icon overlay */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center shadow-lg">
                          <EasterIcon className="w-3 h-3 text-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`text-base md:text-xl lg:text-2xl font-black bg-gradient-to-r ${element.color} bg-clip-text text-transparent mb-1 md:mb-2`}>
                    {element.title}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
                    <Candy className="w-2.5 h-2.5 text-pink-400" />
                    {element.description}
                    <Flower className="w-2.5 h-2.5 text-green-400" />
                  </div>
                  
                  {/* Easter egg progress indicator */}
                  <div className="mt-3 flex justify-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full transition-all duration-300 ${
                          i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-pink-400' : 'bg-green-400'
                        } opacity-30 group-hover:opacity-100`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Easter Countdown Banner */}
        {/* <div className="mt-6 md:mt-8 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-yellow-500/5 border border-yellow-500/15 backdrop-blur-sm">
            <Gem className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-[10px] md:text-xs text-yellow-400/80 font-medium">
              🥚 Every ticket = 1 Golden Egg entry! 🐰
            </span>
            <PartyPopper className="w-3 h-3 text-pink-400" />
          </div>
        </div> */}
      </div>

      {/* Custom Easter Animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(5deg); }
        }
        @keyframes sparkle-float {
          0%, 100% { opacity: 0; transform: scale(0.2) translateY(0); }
          10% { opacity: 1; transform: scale(1.2) translateY(-3px); }
          50% { opacity: 0.8; transform: scale(0.9) translateY(-12px); }
          90% { opacity: 0.3; transform: scale(0.5) translateY(-20px); }
        }
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        .animate-float-slow {
          animation: float-slow ease-in-out infinite;
        }
        .animate-sparkle-float {
          animation: sparkle-float 3s ease-in-out infinite;
        }
        .animate-bounce-soft {
          animation: bounce-soft 2s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}