import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import StatsBanner from "@/components/stats-banner";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import { Shield, Lock, CreditCard, CheckCircle } from "lucide-react";
import { Sparkles, Trophy, Zap, Gift, Mail, CheckCircle2, TreePine, Snowflake, Star, PartyPopper } from "lucide-react";
import { useLocation } from "wouter";
import Testimonials from "@/components/testimonials";

function MagicalSnowfall() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    left: number;
    delay: number;
    duration: number;
    size: number;
    type: 'snowflake' | 'star' | 'sparkle';
    opacity: number;
  }>>([]);
  
  useEffect(() => {
    const items: Array<{
      id: number;
      left: number;
      delay: number;
      duration: number;
      size: number;
      type: 'snowflake' | 'star' | 'sparkle';
      opacity: number;
    }> = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 15,
      size: 6 + Math.random() * 20,
      type: (i % 5 === 0 ? 'star' : i % 7 === 0 ? 'sparkle' : 'snowflake') as 'snowflake' | 'star' | 'sparkle',
      opacity: 0.3 + Math.random() * 0.7,
    }));
    setParticles(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute animate-magical-fall ${
            p.type === 'star' ? 'text-yellow-300' : 
            p.type === 'sparkle' ? 'text-blue-200' : 'text-white'
          }`}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            filter: p.type === 'star' ? 'drop-shadow(0 0 6px #fbbf24)' : 
                   p.type === 'sparkle' ? 'drop-shadow(0 0 4px #93c5fd)' : 'none',
          }}
        >
          {p.type === 'star' ? <Star className="w-full h-full fill-current" /> :
           p.type === 'sparkle' ? <Sparkles className="w-full h-full" /> :
           <Snowflake className="w-full h-full" />}
        </div>
      ))}
      <style>{`
        @keyframes magical-fall {
          0% {
            transform: translateY(-5vh) rotate(0deg) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) rotate(180deg) scale(1);
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(105vh) rotate(360deg) scale(0.6);
            opacity: 0;
          }
        }
        .animate-magical-fall {
          animation: magical-fall linear infinite;
        }
      `}</style>
    </div>
  );
}

function ChristmasLightsGarland() {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 overflow-hidden">
      <svg className="w-full h-16" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path
          d="M0,30 Q50,50 100,30 Q150,10 200,30 Q250,50 300,30 Q350,10 400,30 Q450,50 500,30 Q550,10 600,30 Q650,50 700,30 Q750,10 800,30 Q850,50 900,30 Q950,10 1000,30 Q1050,50 1100,30 Q1150,10 1200,30"
          stroke="#2d5016"
          strokeWidth="8"
          fill="none"
        />
        <path
          d="M0,30 Q50,50 100,30 Q150,10 200,30 Q250,50 300,30 Q350,10 400,30 Q450,50 500,30 Q550,10 600,30 Q650,50 700,30 Q750,10 800,30 Q850,50 900,30 Q950,10 1000,30 Q1050,50 1100,30 Q1150,10 1200,30"
          stroke="#3d7a1e"
          strokeWidth="6"
          fill="none"
        />
      </svg>
      <div className="absolute top-4 left-0 right-0 flex justify-around px-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className={`relative animate-twinkle ${
              i % 4 === 0 ? 'text-red-500' :
              i % 4 === 1 ? 'text-yellow-400' :
              i % 4 === 2 ? 'text-green-400' :
              'text-blue-400'
            }`}
            style={{ 
              animationDelay: `${i * 0.2}s`,
              filter: `drop-shadow(0 0 8px currentColor)`,
            }}
          >
            <div className={`w-4 h-6 rounded-full ${
              i % 4 === 0 ? 'bg-red-500' :
              i % 4 === 1 ? 'bg-yellow-400' :
              i % 4 === 2 ? 'bg-green-400' :
              'bg-blue-400'
            }`} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
        .animate-twinkle {
          animation: twinkle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function FloatingOrnaments() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large ornaments */}
      <div className="absolute top-24 left-[5%] animate-float-slow">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/50 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tl from-red-300/50 to-transparent" />
        </div>
      </div>
      <div className="absolute top-40 right-[8%] animate-float-medium">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-400/50 flex items-center justify-center">
          <Star className="w-6 h-6 text-yellow-100" />
        </div>
      </div>
      <div className="absolute top-60 left-[12%] animate-float-fast">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50" />
      </div>
      <div className="absolute top-32 right-[15%] animate-float-slow" style={{ animationDelay: '1s' }}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50" />
      </div>
      
      {/* Gift boxes */}
      <div className="absolute bottom-32 left-[8%] animate-bounce-slow">
        <div className="relative">
          <Gift className="w-20 h-20 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        </div>
      </div>
      <div className="absolute bottom-24 right-[10%] animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
        <div className="relative">
          <Gift className="w-16 h-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
        </div>
      </div>
      
      {/* Trees */}
      <div className="absolute bottom-0 left-0 text-green-700/30">
        <TreePine className="w-48 h-48" />
      </div>
      <div className="absolute bottom-0 left-24 text-green-600/20">
        <TreePine className="w-32 h-32" />
      </div>
      <div className="absolute bottom-0 right-0 text-green-700/30">
        <TreePine className="w-40 h-40" />
      </div>
      <div className="absolute bottom-0 right-20 text-green-600/20">
        <TreePine className="w-28 h-28" />
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(3deg); }
          50% { transform: translateY(-20px) rotate(-3deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function ChristmasCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const christmas = new Date(new Date().getFullYear(), 11, 25);
      const now = new Date();
      
      if (now > christmas) {
        christmas.setFullYear(christmas.getFullYear() + 1);
      }
      
      const difference = christmas.getTime() - now.getTime();
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
      {[
        { value: timeLeft.days, label: 'DAYS' },
        { value: timeLeft.hours, label: 'HRS' },
        { value: timeLeft.minutes, label: 'MIN' },
        { value: timeLeft.seconds, label: 'SEC' },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="relative">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-md sm:rounded-lg md:rounded-xl p-1.5 sm:p-2 md:p-3 lg:p-4 min-w-[40px] sm:min-w-[50px] md:min-w-[70px] lg:min-w-[80px] border border-yellow-400/40 sm:border-2 sm:border-yellow-400/50 shadow-lg shadow-yellow-400/10 sm:shadow-xl sm:shadow-yellow-400/20">
              <span className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-black text-white tabular-nums">
                {String(item.value).padStart(2, '0')}
              </span>
            </div>
            <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-ping" />
          </div>
          <span className="text-[8px] sm:text-[10px] md:text-xs font-bold text-yellow-300 mt-0.5 sm:mt-1 block">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function FlyingSanta() {
  return (
    <div className="absolute top-8 left-0 right-0 pointer-events-none overflow-hidden h-24 z-20 hidden sm:block">
      <div className="animate-fly-santa absolute flex items-center">
        {/* Sleigh and Santa */}
        <div className="relative flex items-end">
          {/* Reindeer */}
          <div className="text-amber-700 mr-2 animate-bounce" style={{ animationDuration: '0.5s' }}>
            <svg className="w-8 h-8 md:w-12 md:h-12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8h-3V6c0-1.1-.9-2-2-2H9C7.9 4 7 4.9 7 6v2H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1v4h2v-4h10v4h2v-4h1c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM9 6h6v2H9V6zm11 8H4v-4h16v4z"/>
            </svg>
          </div>
          
          {/* Santa on Sleigh */}
          <div className="relative">
            <div className="bg-red-600 rounded-lg px-3 py-2 flex items-center gap-1 shadow-lg">
              {/* Santa Face */}
              <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FFE4C4] rounded-full relative overflow-hidden border-2 border-red-700">
                <div className="absolute top-0 left-0 right-0 h-4 bg-red-600 rounded-t-full" />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-400 rounded-full" />
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-2 bg-white rounded-full" />
              </div>
              <Gift className="w-5 h-5 text-yellow-400 animate-bounce" style={{ animationDuration: '0.3s' }} />
            </div>
            {/* Sleigh runners */}
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-amber-800 rounded-full" />
          </div>
        </div>
        
        {/* Trail of sparkles */}
        {[...Array(8)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 text-yellow-300 ml-1 animate-twinkle fill-current`}
            style={{ 
              animationDelay: `${i * 0.1}s`,
              opacity: 1 - (i * 0.1),
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes fly-santa {
          0% { transform: translateX(-200px) translateY(10px); }
          25% { transform: translateX(25vw) translateY(-5px); }
          50% { transform: translateX(50vw) translateY(15px); }
          75% { transform: translateX(75vw) translateY(0px); }
          100% { transform: translateX(calc(100vw + 200px)) translateY(10px); }
        }
        .animate-fly-santa {
          animation: fly-santa 15s linear infinite;
        }
      `}</style>
    </div>
  );
}

function GlitterEffect() {
  const [glitters, setGlitters] = useState<Array<{id: number; left: number; top: number; delay: number; size: number}>>([]);
  
  useEffect(() => {
    const items = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      size: 2 + Math.random() * 4,
    }));
    setGlitters(items);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden hidden sm:block">
      {glitters.map((g) => (
        <div
          key={g.id}
          className="absolute animate-glitter"
          style={{
            left: `${g.left}%`,
            top: `${g.top}%`,
            animationDelay: `${g.delay}s`,
          }}
        >
          <div 
            className="bg-white rounded-full"
            style={{ width: g.size, height: g.size }}
          />
        </div>
      ))}
      <style>{`
        @keyframes glitter {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-glitter {
          animation: glitter 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function AnimatedChristmasTree({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-24 h-32",
    lg: "w-32 h-44"
  };
  
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Tree layers */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full">
        {/* Top layer */}
        <div className="relative mx-auto" style={{ width: '40%' }}>
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[30px] border-l-transparent border-r-transparent border-b-green-500 mx-auto drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
        </div>
        {/* Middle layer */}
        <div className="relative mx-auto -mt-2" style={{ width: '70%' }}>
          <div className="w-0 h-0 border-l-[30px] border-r-[30px] border-b-[35px] border-l-transparent border-r-transparent border-b-green-600 mx-auto drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
        </div>
        {/* Bottom layer */}
        <div className="relative mx-auto -mt-2" style={{ width: '100%' }}>
          <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[40px] border-l-transparent border-r-transparent border-b-green-700 mx-auto drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
        </div>
        {/* Trunk */}
        <div className="w-4 h-4 bg-amber-800 mx-auto" />
      </div>
      
      {/* Star on top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-pulse">
        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
      </div>
      
      {/* Ornaments */}
      <div className="absolute top-10 left-1/2 -translate-x-1 w-2 h-2 rounded-full bg-red-500 animate-twinkle-ornament shadow-lg shadow-red-500/50" />
      <div className="absolute top-14 left-1/2 translate-x-2 w-2 h-2 rounded-full bg-blue-400 animate-twinkle-ornament shadow-lg shadow-blue-400/50" style={{ animationDelay: '0.3s' }} />
      <div className="absolute top-[70px] left-1/2 -translate-x-3 w-2 h-2 rounded-full bg-yellow-400 animate-twinkle-ornament shadow-lg shadow-yellow-400/50" style={{ animationDelay: '0.6s' }} />
      <div className="absolute top-[85px] left-1/2 translate-x-1 w-2 h-2 rounded-full bg-pink-500 animate-twinkle-ornament shadow-lg shadow-pink-500/50" style={{ animationDelay: '0.9s' }} />
    </div>
  );
}

function ChristmasBanner() {
  return (
    <div className="relative overflow-hidden">
      {/* Rich gradient background with depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-900 via-red-700 to-red-900" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      
      {/* Animated aurora effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-400/50 to-green-500/0 animate-aurora" />
      </div>
      
      {/* Sparkle overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)]" />
      
      {/* Snow particles in banner */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-banner-snow"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative py-4 sm:py-6 md:py-10 lg:py-12 px-3 sm:px-4">
        <div className="container mx-auto">
          {/* Main content with trees */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-8 lg:gap-16">
            
            {/* Left decorative section - hidden on mobile/tablet */}
            <div className="hidden lg:flex items-end gap-2 lg:gap-4">
              <AnimatedChristmasTree size="sm" className="opacity-60" />
              <AnimatedChristmasTree size="md" />
              <div className="flex flex-col items-center gap-1">
                <Gift className="w-8 h-8 lg:w-12 lg:h-12 text-red-400 animate-bounce-slow drop-shadow-[0_0_10px_rgba(248,113,113,0.6)]" />
                <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-green-400 animate-bounce-slow drop-shadow-[0_0_10px_rgba(74,222,128,0.6)]" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>

            {/* Center text content */}
            <div className="text-center flex-shrink-0 w-full lg:w-auto">
              {/* Decorative top element */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                <div className="h-px w-6 sm:w-8 md:w-16 bg-gradient-to-r from-transparent to-yellow-400/50" />
                <Snowflake className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-white/80 animate-spin-slow" />
                <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 text-yellow-400 fill-yellow-400 animate-pulse drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                <Snowflake className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-white/80 animate-spin-slow" />
                <div className="h-px w-6 sm:w-8 md:w-16 bg-gradient-to-l from-transparent to-yellow-400/50" />
              </div>

              {/* Main headline - stacked on mobile */}
              <h2 className="font-black tracking-tight mb-2 sm:mb-3 md:mb-4">
                <span className="block sm:inline text-xl sm:text-2xl md:text-5xl lg:text-6xl xl:text-7xl text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.3)] animate-glow">
                  MERRY
                </span>
                <span className="hidden sm:inline mx-2 md:mx-4"> </span>
                <span className="block sm:inline text-xl sm:text-2xl md:text-5xl lg:text-6xl xl:text-7xl bg-gradient-to-r from-green-300 via-green-400 to-green-300 bg-clip-text text-transparent animate-shimmer-text">
                  CHRISTMAS
                </span>
              </h2>
              
              {/* Sale badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 md:gap-3 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 px-3 sm:px-4 md:px-8 py-1.5 sm:py-2 md:py-3 rounded-full shadow-2xl shadow-yellow-400/40 animate-pulse-scale mb-3 sm:mb-4 md:mb-6">
                <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-red-600" />
                <span className="text-base sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-red-600 tracking-wide">
                  MEGA WIN!
                </span>
                <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-red-600" />
              </div>

              {/* Subtitle - simplified on mobile */}
              <div className="text-white/95 text-xs sm:text-sm md:text-xl lg:text-2xl font-semibold max-w-2xl mx-auto leading-relaxed mb-4 sm:mb-6 px-2">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-yellow-400" />
                  <span className="hidden sm:inline">Win incredible prizes:</span>
                  <span className="sm:hidden">Win:</span>
                  <span className="text-yellow-300 font-black">TUI Holidays</span>
                  <span className="text-white/50">|</span>
                  <span className="text-green-300 font-black">Cash</span>
                  <span className="text-white/50">|</span>
                  <span className="text-blue-300 font-black">More!</span>
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-yellow-400" />
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="mb-3 sm:mb-4">
                <p className="text-white/80 text-[10px] sm:text-xs md:text-sm font-semibold mb-1.5 sm:mb-2 uppercase tracking-wider sm:tracking-widest">
                  <Snowflake className="inline w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  <span className="hidden sm:inline">Countdown to </span>Christmas
                  <Snowflake className="inline w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1" />
                </p>
                <ChristmasCountdown />
              </div>

              {/* Decorative bottom - fewer on mobile */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 rounded-full animate-twinkle-ornament ${
                      i % 3 === 0 ? 'bg-red-400 shadow-red-400/50' :
                      i % 3 === 1 ? 'bg-green-400 shadow-green-400/50' :
                      'bg-yellow-400 shadow-yellow-400/50'
                    } shadow-lg`}
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>

            {/* Right decorative section - hidden on mobile/tablet */}
            <div className="hidden lg:flex items-end gap-2 lg:gap-4">
              <div className="flex flex-col items-center gap-1">
                <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-400 animate-bounce-slow drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
                <Gift className="w-8 h-8 lg:w-12 lg:h-12 text-red-400 animate-bounce-slow drop-shadow-[0_0_10px_rgba(248,113,113,0.6)]" style={{ animationDelay: '0.5s' }} />
              </div>
              <AnimatedChristmasTree size="md" />
              <AnimatedChristmasTree size="sm" className="opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative border */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-600 via-red-500 to-green-600" />

      <style>{`
        @keyframes aurora {
          0%, 100% { transform: translateX(-100%); opacity: 0; }
          50% { transform: translateX(100%); opacity: 0.5; }
        }
        @keyframes banner-snow {
          0% { transform: translateY(-10px); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(150px); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3); }
          50% { text-shadow: 0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.5); }
        }
        @keyframes shimmer-text {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes twinkle-ornament {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-aurora { animation: aurora 8s ease-in-out infinite; }
        .animate-banner-snow { animation: banner-snow 3s linear infinite; }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-shimmer-text { 
          background-size: 200% auto;
          animation: shimmer-text 3s linear infinite; 
        }
        .animate-pulse-scale { animation: pulse-scale 2s ease-in-out infinite; }
        .animate-twinkle-ornament { animation: twinkle-ornament 1.5s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}


export default function Landing() {
  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });
  const [, setLocation] = useLocation()

  const [activeFilter, setActiveFilter] = useState("all");
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user: User | null };

  const filteredCompetitions = useMemo(() => {
    if (activeFilter === "all") {
      return competitions;
    }
    return competitions.filter(comp => comp.type === activeFilter);
  }, [competitions, activeFilter]);

  const handleFilterChange = (filterType: string) => {
    setActiveFilter(filterType);
  };

  //   const redirectToRegister = ()=> {
  //     setLocation("/register")
  // }
  function redirectToRegister() {
   setLocation("/register")
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-green-950 text-foreground relative overflow-x-hidden">
      <MagicalSnowfall />
      <Header />

       {/* Epic Christmas Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-red-950 via-slate-900 to-green-950">
              <ChristmasLightsGarland />
              <FloatingOrnaments />
              <FlyingSanta />
              <GlitterEffect />
              
              {/* Glowing background effects */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/10 rounded-full blur-[150px]" />
              </div>
      
              <ChristmasBanner />
      
              <div className="container mx-auto px-0 py-0 relative z-10">
                {competitions.length > 0 ? (
                  <FeaturedCompetitions competitions={competitions} />
                ) : (
                  <div className="text-center text-slate-400 py-12">
                    <Gift className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                    <p className="text-lg">Unwrapping Christmas prizes...</p>
                  </div>
                )}
              </div>
      
              {/* Candy Cane Divider */}
              <div className="h-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-white to-red-600" />
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,rgba(220,38,38,0.8)_15px,rgba(220,38,38,0.8)_30px)]" />
              </div>
            </section>

      {/* Hero Section - FULLY RESPONSIVE! */}
      {/* <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-0 py-0">
          {competitions.length > 0 ? (
            <FeaturedCompetitions competitions={competitions} />
          ) : (
            <div className="text-center text-slate-400 py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading amazing prizes...</p>
            </div>
          )}
        </div>
      </section> */}

      {/* Trust Banner */}
      <StatsBanner />

      {/* Why Choose Us - TRUST BUILDING! */}
      {/* <section className="bg-gradient-to-br from-primary/5 via-background to-background py-8 md:py-12 border-b-2 border-primary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-4xl font-black mb-2">
              <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
                Why RingTone Riches?
              </span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Your trusted platform for fair and exciting competitions
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                icon: Shield,
                title: "100% Secure",
                description: "Your data and payments are protected with bank-level encryption",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: CheckCircle,
                title: "Fair Play Guaranteed",
                description: "Every entry has an equal chance - completely random selection",
                gradient: "from-primary to-yellow-400"
              },
              {
                icon: Lock,
                title: "Safe Payments",
                description: "Trusted payment partners - your money is always secure",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Star,
                title: "Quick Results",
                description: "No waiting - discover your results immediately after playing",
                gradient: "from-purple-500 to-pink-500"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-card border-2 border-border hover:border-primary rounded-xl p-4 md:p-6 text-center group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex justify-center mb-3">
                  <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-sm md:text-base font-black text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Filter Tabs */}
      <section className="bg-gradient-to-r from-green-950 via-slate-900 to-red-950 border-y-4 border-yellow-400/60 sticky top-0 z-40 backdrop-blur-md shadow-2xl relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-900/50 via-transparent to-red-900/50" />
              
              {/* Garland top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
              
              <div className="container mx-auto px-4 py-5 relative z-10">
                <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                  {[
                    { id: "all", label: "All Prizes", icon: Star, gradient: "from-yellow-400 via-yellow-300 to-yellow-500", glow: "shadow-yellow-400/50" },
                    { id: "spin", label: "Spin & Win", icon: Zap, gradient: "from-red-500 via-red-400 to-red-600", glow: "shadow-red-500/50" },
                    { id: "scratch", label: "Scratch Cards", icon: Snowflake, gradient: "from-blue-400 via-cyan-300 to-blue-500", glow: "shadow-blue-400/50" },
                    { id: "instant", label: "Competitions", icon: Gift, gradient: "from-green-500 via-green-400 to-green-600", glow: "shadow-green-500/50" }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => handleFilterChange(filter.id)}
                      className={`relative px-5 md:px-10 py-3 md:py-4 rounded-xl font-black text-sm md:text-lg tracking-wide transition-all duration-300 overflow-hidden group ${
                        activeFilter === filter.id
                          ? `shadow-2xl ${filter.glow} scale-105 ring-2 ring-white/60`
                          : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/90 hover:scale-102 border border-slate-600/50"
                      }`}
                      data-testid={`button-filter-${filter.id}`}
                    >
                      {activeFilter === filter.id && (
                        <>
                          <div className={`absolute inset-0 bg-gradient-to-r ${filter.gradient}`} />
                          <div className={`absolute inset-0 bg-gradient-to-r ${filter.gradient} blur-xl opacity-60`} />
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </>
                      )}
                      <span className={`relative z-10 flex items-center gap-2 ${
                        activeFilter === filter.id ? "text-slate-900 drop-shadow-sm font-black" : ""
                      }`}>
                        <filter.icon className={`w-5 h-5 md:w-6 md:h-6 ${activeFilter === filter.id ? 'animate-bounce' : ''}`} />
                        {filter.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Garland bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" />
            </section>

    {/* Competitions Grid with Christmas Magic */}
          <section className="py-10 md:py-16 relative overflow-hidden">
            {/* Magical background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-green-950/80" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-20 left-10 w-80 h-80 bg-red-500/15 rounded-full blur-[80px] animate-pulse" />
              <div className="absolute top-40 right-20 w-72 h-72 bg-green-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-yellow-400/10 rounded-full blur-[100px]" />
            </div>
    
            {/* Decorative trees */}
            <div className="absolute left-0 bottom-0 text-green-800/20 pointer-events-none">
              <TreePine className="w-56 h-56" />
            </div>
            <div className="absolute left-20 bottom-0 text-green-700/15 pointer-events-none">
              <TreePine className="w-40 h-40" />
            </div>
            <div className="absolute right-0 bottom-0 text-green-800/20 pointer-events-none">
              <TreePine className="w-48 h-48" />
            </div>
            <div className="absolute right-16 bottom-0 text-green-700/15 pointer-events-none">
              <TreePine className="w-32 h-32" />
            </div>
    
            <div className="container mx-auto px-4 relative z-10">
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="relative inline-block">
                    <Gift className="w-20 h-20 text-red-500 animate-bounce" />
                    <div className="absolute -top-2 -right-2">
                      <Star className="w-8 h-8 text-yellow-400 animate-spin-slow" />
                    </div>
                  </div>
                  <p className="text-slate-300 font-semibold text-lg mt-4">Unwrapping your Christmas prizes...</p>
                </div>
              ) : filteredCompetitions.length > 0 ? (
                <>
                  <div className="text-center mb-8 md:mb-12">
                    <div className="inline-flex items-center gap-4 mb-4">
                      <TreePine className="w-10 h-10 text-green-400 animate-pulse drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                      <div className="relative">
                        <h2 className="text-3xl md:text-6xl font-black">
                          <span className="bg-gradient-to-r from-red-400 via-yellow-300 to-green-400 bg-clip-text text-transparent drop-shadow-lg animate-gradient-x">
                            {activeFilter === "all" 
                              ? "All Live Competitions" 
                              : activeFilter === "spin"
                              ? "Spin & Win"
                              : activeFilter === "scratch"
                              ? "Scratch to Win"
                              : "Win Big!"}
                          </span>
                        </h2>
                        <div className="absolute -top-4 -right-4">
                          <Star className="w-8 h-8 text-yellow-400 animate-pulse drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                        </div>
                      </div>
                      <TreePine className="w-10 h-10 text-green-400 animate-pulse drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                    </div>
                    <p className="text-slate-300 text-base md:text-xl font-semibold flex items-center justify-center gap-3">
                      <Snowflake className="w-5 h-5 text-blue-300 animate-spin-slow" />
                      <span>
                        { activeFilter === "spin" || activeFilter === "scratch" ?
                           `Huge Christmas cash prizes waiting for you!` :
                           `${filteredCompetitions.length} incredible Christmas prizes to be won!` 
                        }
                      </span>
                      <Snowflake className="w-5 h-5 text-blue-300 animate-spin-slow" />
                    </p>
                  </div>
    <div className="flex justify-center mb-8">
  <a
    href="https://www.trustpilot.com/review/ringtoneriches.co.uk"
    target="_blank"
    rel="noopener noreferrer"
    className="flex justify-center border border-2 border-[#0AB67B] cursor-pointer bg-white w-fit items-center space-x-2"
  >
    <span className="flex items-center text-black gap-1 mx-4 my-4">
      Review us on
      <svg
        className="w-5 h-5 text-[#0AB67B]"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M10 15l-5.878 3.09L5.451 11 0 6.91l6.061-.88L10 0l3.939 6.03 6.061.88L14.549 11l1.329 7.09z" />
      </svg>
      Trustpilot
    </span>
  </a>
</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredCompetitions.map((competition) => (
                      <CompetitionCard
                        key={competition.id}
                        competition={competition}
                        authenticated={true}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <Gift className="w-20 h-20 text-red-500/50 mx-auto mb-4" />
                  <p className="text-muted-foreground text-xl">No Christmas competitions found.</p>
                </div>
              )}
            </div>
            
            <style>{`
              @keyframes gradient-x {
                0%, 100% { background-size: 200% 200%; background-position: left center; }
                50% { background-size: 200% 200%; background-position: right center; }
              }
              .animate-gradient-x { animation: gradient-x 3s ease infinite; }
            `}</style>
          </section>

      {/* How to Play */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-12 md:py-16 border-t-2 border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-2xl md:text-5xl font-black text-center mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
              How to Play & Win
            </span>
          </h2>
          <p className="text-center text-slate-400 text-sm md:text-base mb-8 md:mb-12">
            Getting started is quick and easy - you could be winning in minutes!
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { step: "1", title: "Sign Up", desc: "Quick registration - just email and password", icon: "👤", color: "from-blue-500 to-cyan-500" },
              { step: "2", title: "Choose Prize", desc: "Browse our exciting competitions", icon: "🏆", color: "from-purple-500 to-pink-500" },
              { step: "3", title: "Enter & Play", desc: "Buy tickets and play instantly", icon: "🎫", color: "from-green-500 to-emerald-500" },
              { step: "4", title: "Win!", desc: "Get instant results and claim prizes", icon: "👑", color: "from-primary to-yellow-400" }
            ].map((item, index) => (
              <div key={index} className="text-center space-y-2 md:space-y-3 group hover:scale-105 transition-transform">
                <div className={`w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br ${item.color} rounded-full mx-auto flex items-center justify-center shadow-2xl group-hover:shadow-primary/50 transition-shadow relative`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                  <span className="relative text-xl md:text-3xl font-black text-white">{item.step}</span>
                </div>
                <div className="text-4xl md:text-5xl group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-sm md:text-xl font-black text-white">{item.title}</h3>
                <p className="text-[10px] md:text-sm text-slate-400 leading-relaxed px-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Security */}
      <section className="bg-card py-8 md:py-12 border-y-2 border-border">
        <div className="container mx-auto px-4 text-center">
          <Lock className="w-10 h-10 md:w-12 md:h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl md:text-3xl font-black mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              Your Payments Are 100% Secure
            </span>
          </h3>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-2xl mx-auto">
            We use industry-leading payment providers with bank-level encryption. Your financial information is never stored on our servers.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {["🔒 SSL Encrypted", "💳 Secure Checkout", "✅ PCI Compliant", "🛡️ Fraud Protection"].map((badge, i) => (
              <div key={i} className="bg-muted px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-xs md:text-sm border-2 border-green-500/30">
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

 <section className="py-12 md:py-20 relative overflow-hidden">
          {/* Magical background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-slate-900 to-green-950" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-red-500/15 rounded-full blur-[80px]" />
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-green-500/15 rounded-full blur-[80px]" />
          </div>

          {/* Decorative elements */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500/15 pointer-events-none">
            <Gift className="w-40 h-40 animate-float-slow" />
          </div>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-green-500/15 pointer-events-none">
            <TreePine className="w-40 h-40 animate-float-medium" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto relative">
              {/* Glowing border effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-3xl blur-sm opacity-75" />
              
              <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 animate-bounce-slow">
                      <Gift className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Star className="w-8 h-8 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl md:text-4xl font-black mb-3">
                    <span className="bg-gradient-to-r from-red-400 via-yellow-300 to-green-400 bg-clip-text text-transparent">
                      {user?.receiveNewsletter ? "You're on Santa's List!" : "Join Santa's VIP List!"}
                    </span>
                  </h3>
                  <p className="text-slate-300 text-sm md:text-lg leading-relaxed flex items-center justify-center gap-2 flex-wrap">
                    <Snowflake className="w-4 h-4 text-blue-300" />
                    {user?.receiveNewsletter 
                      ? "Get ready for exclusive Christmas deals and magical surprises!"
                      : "Subscribe for exclusive Christmas deals and holiday magic!"}
                    <Snowflake className="w-4 h-4 text-blue-300" />
                  </p>
                </div>
                       <div className="container mx-auto px-4 text-center">
         
          
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <input
                type="email"
                placeholder="Enter your email..."
                className="bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-400 h-14 md:h-16 text-base md:text-lg pl-14 pr-4 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50"
              />
              <button
              onClick={redirectToRegister}
                className="w-full h-14 md:h-16 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 hover:from-red-600 hover:via-yellow-400 hover:to-green-600 text-slate-900 font-black text-lg md:text-xl rounded-xl shadow-xl shadow-yellow-500/30 transition-all hover:shadow-2xl hover:shadow-yellow-500/50 hover:scale-[1.02]"
                data-testid="button-subscribe"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
             
              </div>
            </div>
          </div>
        </section>
      <Testimonials/>
      <Footer />
    </div>
  );
}
