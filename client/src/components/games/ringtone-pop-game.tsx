import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Volume2, VolumeX, PartyPopper, RotateCcw, Gift, Trophy, X, Sparkles, Star, Zap, Target, Flame, Crown, Music, Sparkle, Gauge, Swords, Popcorn, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";

type PopHistoryItem = {
  status: "NOT PLAYED" | "PLAYED";
  prize: { type: string; value: string };
};

const loadPopHistory = (orderId?: string): PopHistoryItem[] => {
  if (!orderId) return [];
  try {
    const saved = localStorage.getItem(`popGameHistory_${orderId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const savePopHistory = (history: PopHistoryItem[], orderId?: string) => {
  if (!orderId) return;
  try {
    localStorage.setItem(`popGameHistory_${orderId}`, JSON.stringify(history));
  } catch {}
};
import popSoundFile from "@assets/balloon-pop-sound_1766057573479.mp3";

interface BalloonProps {
  value: string | null;
  isPopped: boolean;
  onPop: () => void;
  index: number;
  disabled: boolean;
  isMuted: boolean;
  isActive: boolean;
}

const BALLOON_COLORS = [
  { 
    main: "#a855f7", 
    light: "#e9d5ff", 
    dark: "#7e22ce",
    accent: "#f0abfc",
    glow: "0 0 60px rgba(168, 85, 247, 0.8), 0 0 100px rgba(168, 85, 247, 0.4)",
    innerGlow: "inset 0 0 30px rgba(255, 255, 255, 0.3)",
    particles: ["#a855f7", "#d8b4fe", "#9333ea", "#c084fc", "#e879f9", "#f0abfc"]
  },
  { 
    main: "#10b981", 
    light: "#a7f3d0", 
    dark: "#047857",
    accent: "#34d399",
    glow: "0 0 60px rgba(16, 185, 129, 0.8), 0 0 100px rgba(16, 185, 129, 0.4)",
    innerGlow: "inset 0 0 30px rgba(255, 255, 255, 0.3)",
    particles: ["#10b981", "#6ee7b7", "#059669", "#34d399", "#2dd4bf", "#a7f3d0"]
  },
  { 
    main: "#f59e0b", 
    light: "#fef3c7", 
    dark: "#b45309",
    accent: "#fbbf24",
    glow: "0 0 60px rgba(245, 158, 11, 0.8), 0 0 100px rgba(245, 158, 11, 0.4)",
    innerGlow: "inset 0 0 30px rgba(255, 255, 255, 0.3)",
    particles: ["#f59e0b", "#fcd34d", "#d97706", "#fbbf24", "#fde047", "#fef3c7"]
  },
];

const getFontSize = (val: string) => {
  if (!val) return "text-lg";
  if (val.length < 6) return "text-3xl";
  if (val.length < 12) return "text-lg";
  if (val.length < 20) return "text-sm";
  return "text-xs";
};

function Balloon({ value, isPopped, onPop, index, disabled, isMuted, isActive }: BalloonProps) {
  const colorScheme = BALLOON_COLORS[index % BALLOON_COLORS.length];
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const [showShockwave, setShowShockwave] = useState(false);
  const popSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    popSoundRef.current = new Audio(popSoundFile);
    popSoundRef.current.volume = 0.6;
  }, []);

  const handleClick = () => {
    if (isPopped || disabled) return;
    setIsAnimating(true);
    setShowParticles(true);
    setShowShockwave(true);
    
    if (!isMuted && popSoundRef.current) {
      popSoundRef.current.currentTime = 0;
      popSoundRef.current.play().catch(() => {});
    }

    setTimeout(() => {
      onPop();
      setIsAnimating(false);
      setShowValue(true);
    }, 250);

    setTimeout(() => {
      setShowShockwave(false);
    }, 400);

    setTimeout(() => {
      setShowParticles(false);
    }, 1000);
  };

  if (isPopped) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: "140px", height: "170px" }}>
        {/* Multi-layer shockwave */}
        {showShockwave && (
          <>
            <div 
              className="absolute inset-0 rounded-full animate-shockwave"
              style={{
                background: `radial-gradient(circle, ${colorScheme.main}50 0%, transparent 70%)`,
              }}
            />
            <div 
              className="absolute inset-0 rounded-full animate-shockwave"
              style={{
                background: `radial-gradient(circle, ${colorScheme.accent}30 0%, transparent 60%)`,
                animationDelay: '0.1s',
              }}
            />
          </>
        )}
        {/* Enhanced particle burst */}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(40)].map((_, i) => {
              const angle = (i / 40) * 360;
              const distance = 90 + Math.random() * 80;
              const size = 5 + Math.random() * 10;
              const isConfetti = i % 3 === 0;
              const isStar = i % 5 === 0;
              return (
                <div
                  key={i}
                  className={`absolute ${isStar ? 'rounded-none' : isConfetti ? 'rounded-sm' : 'rounded-full'}`}
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${size}px`,
                    height: isConfetti ? `${size * 2.5}px` : `${size}px`,
                    backgroundColor: colorScheme.particles[i % colorScheme.particles.length],
                    boxShadow: `0 0 15px ${colorScheme.particles[i % colorScheme.particles.length]}, 0 0 30px ${colorScheme.particles[i % colorScheme.particles.length]}50`,
                    animation: `particle-burst-enhanced 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                    animationDelay: `${i * 0.012}s`,
                    transform: `translate(-50%, -50%)${isStar ? ' rotate(45deg)' : ''}`,
                    '--angle': `${angle}deg`,
                    '--distance': `${distance}px`,
                    '--rotation': `${Math.random() * 1080}deg`,
                  } as any}
                />
              );
            })}
          </div>
        )}
        {/* Prize reveal orb with premium glow */}
        <div className="relative">
          <div 
            className="absolute inset-0 rounded-full blur-xl opacity-60"
            style={{ background: colorScheme.main }}
          />
          <div 
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center ${showValue ? 'animate-prize-reveal-bounce' : ''}`}
            style={{
              background: `radial-gradient(circle at 30% 30%, ${colorScheme.light}, ${colorScheme.main} 50%, ${colorScheme.dark})`,
              boxShadow: `0 10px 40px ${colorScheme.main}70, ${colorScheme.innerGlow}, 0 0 80px ${colorScheme.main}50`,
              border: `3px solid ${colorScheme.accent}80`,
            }}
          >
            {/* Inner shine */}
            <div 
              className="absolute top-3 left-4 w-8 h-12 rounded-full opacity-60 blur-sm"
              style={{ background: `linear-gradient(135deg, white 0%, transparent 100%)` }}
            />
           <span className={`
              font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] text-center px-2
              ${value === "R" || (typeof value === 'string' && (value.includes('£') || value.includes('pts')))
                ? 'text-2xl sm:text-3xl md:text-4xl'
                : typeof value === 'string' && value.length > 12
                  ? 'text-xs sm:text-sm'
                  : 'text-sm sm:text-base md:text-lg'}
            `}>
              {value || "?"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative transition-all duration-300
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${isAnimating ? "scale-0 opacity-0" : ""}
        ${isActive && !disabled ? "scale-110" : ""}
      `}
      style={{ 
        width: "140px", 
        height: "170px",
        animation: disabled ? "none" : `balloon-float ${2.5 + index * 0.3}s ease-in-out infinite`,
        animationDelay: `${index * 0.3}s`,
      }}
      data-testid={`balloon-${index}`}
    >
      {/* Outer glow ring when active */}
      {isActive && !disabled && (
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-28 h-32 sm:w-32 sm:h-36 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(ellipse, ${colorScheme.main}30 0%, transparent 70%)`,
            filter: 'blur(10px)',
          }}
        />
      )}
      
      {/* Main balloon body */}
      <div 
        className={`
          absolute bottom-8 left-1/2 -translate-x-1/2
          w-24 h-28 sm:w-28 sm:h-32
          rounded-[50%_50%_48%_48%]
          transition-all duration-200
          ${!disabled ? "hover:scale-110 active:scale-90" : ""}
        `}
        style={{
          background: `radial-gradient(ellipse at 30% 25%, ${colorScheme.light} 0%, ${colorScheme.main} 35%, ${colorScheme.dark} 100%)`,
          boxShadow: !disabled 
            ? `0 12px 50px ${colorScheme.main}60, ${colorScheme.innerGlow}, inset 8px 8px 30px ${colorScheme.light}50, ${isActive ? colorScheme.glow : `0 0 40px ${colorScheme.main}40`}`
            : `0 4px 16px rgba(0,0,0,0.3)`,
          border: isActive ? `2px solid ${colorScheme.accent}60` : 'none',
        }}
      >
        {/* Primary highlight */}
        <div 
          className="absolute top-4 left-4 w-10 h-14 rounded-full blur-[3px]"
          style={{
            background: `linear-gradient(135deg, ${colorScheme.light} 0%, transparent 100%)`,
            opacity: 0.8,
          }}
        />
        {/* Secondary bright spot */}
        <div 
          className="absolute top-5 left-6 w-5 h-7 rounded-full"
          style={{
            background: `linear-gradient(135deg, white 0%, ${colorScheme.light} 100%)`,
            opacity: 0.9,
          }}
        />
        {/* Tertiary tiny highlight */}
        <div 
          className="absolute top-8 left-9 w-2 h-2 rounded-full bg-white/80"
        />
        
        {/* Question mark or icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-4xl sm:text-5xl font-black text-white/30 select-none"
            style={{ textShadow: `0 2px 10px ${colorScheme.dark}` }}
          >
            ?
          </span>
        </div>
        
        {/* Active glow overlay */}
        {isActive && !disabled && (
          <div className="absolute inset-0 rounded-[50%_50%_48%_48%] animate-pulse-glow" 
            style={{ boxShadow: colorScheme.glow }} 
          />
        )}
      </div>
      
      {/* Balloon knot */}
      <div 
        className="absolute bottom-5 left-1/2 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: `16px solid ${colorScheme.dark}`,
          filter: `drop-shadow(0 3px 6px ${colorScheme.dark}90)`,
        }}
      />
      
      {/* String with curl */}
      <div 
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center"
        style={{
          transformOrigin: "top",
          animation: disabled ? "none" : "string-wave 3s ease-in-out infinite",
          animationDelay: `${index * 0.2}s`,
        }}
      >
        <div 
          className="w-[2px] h-8"
          style={{ background: `linear-gradient(to bottom, ${colorScheme.dark}, #666)` }}
        />
        <div 
          className="w-3 h-3 rounded-full border-2 border-b-0"
          style={{ borderColor: '#666' }}
        />
      </div>
      
      {/* Tap indicator when active */}
      {isActive && !disabled && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs font-bold text-white/60 animate-pulse">TAP ME!</span>
        </div>
      )}
    </button>
  );
}

interface RingtonePopGameProps {
  orderId: string;
  competitionId: string;
  playsRemaining: number;
  ticketCount: number;
  onPlayComplete: (result: any) => void;
  onRefresh: () => void;
  onAllPlaysComplete?: () => void;
}

export default function RingtonePopGame({
  orderId,
  competitionId,
  playsRemaining,
  ticketCount,
  onPlayComplete,
  onRefresh,
  onAllPlaysComplete,
}: RingtonePopGameProps) {
  const [balloonValues, setBalloonValues] = useState<string[]>(["?", "?", "?"]);
  const [poppedBalloons, setPoppedBalloons] = useState<boolean[]>([false, false, false]);
  const [currentBalloonIndex, setCurrentBalloonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [, setLocation] = useLocation();
  
  const [popHistory, setPopHistory] = useState<PopHistoryItem[]>([]);
  const [showRevealAllDialog, setShowRevealAllDialog] = useState(false);
  const [showRevealAllResultDialog, setShowRevealAllResultDialog] = useState(false);
  const [revealAllSummary, setRevealAllSummary] = useState<{ wins: number; losses: number }>({ wins: 0, losses: 0 });
  const [showOutOfPlaysDialog, setShowOutOfPlaysDialog] = useState(false);
  const [isRevealingAll, setIsRevealingAll] = useState(false);
  const [resultAnimStage, setResultAnimStage] = useState(0);
  const resultTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  
  const allPlaysUsed = popHistory.length > 0 && popHistory.every(s => s.status === "PLAYED");
  
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);

  // Show dialog when plays run out
  useEffect(() => {
    if (playsRemaining <= 0 && !isPlaying && !showResultModal) {
      setShowOutOfPlaysDialog(true);
    } else {
      setShowOutOfPlaysDialog(false);
    }
  }, [playsRemaining, isPlaying, showResultModal]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      resultTimersRef.current.forEach(t => clearTimeout(t));
      resultTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    winSoundRef.current = new Audio("data:audio/wav;base64,UklGRpQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXAFAABkZGRkZGRkZGRkZGRkZGR3d3d3d3d3ioqKioqKnZ2dnZ2dsLCwsLCww8PDw8PD1tbW1tbW6enp6enp/Pz8/Pz8/Pz8/Pz86enp6enp1tbW1tbWw8PDw8PDsLCwsLCwnZ2dnZ2dioqKioqKd3d3d3d3ZGRkZGRkUVFRUVFRPj4+Pj4+Kysr");
    loseSoundRef.current = new Audio("data:audio/wav;base64,UklGRlQCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTACAABkZF5YUkxGQDo0LigiFhAKBAD//fn38/Hu6ufk4d7b2NXS0M7LycfFw8HAvr28u7q5uLe2trW1tbW1tra2t7i5ury9v8HCxMbIyszO0NLU1tja3d/i5Ofo6+7x9Pb5+/4A");
  }, []);

  const triggerWinConfetti = () => {
    const colors = ["#ffd700", "#ffed4a", "#fbbf24", "#f59e0b", "#22c55e", "#ef4444"];
    
    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.7 },
        colors: colors,
        startVelocity: 55,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.7 },
        colors: colors,
        startVelocity: 55,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5 },
      colors: colors,
      startVelocity: 50,
    });
  };

  const startGame = async () => {
    if (playsRemaining <= 0 || isPlaying || isLoading) return;

    setIsLoading(true);
    setBalloonValues(["?", "?", "?"]);
    setPoppedBalloons([false, false, false]);
    setCurrentBalloonIndex(0);
    setGameResult(null);
    setShowResultModal(false);
    setResultAnimStage(0);

    try {
      const response = await fetch("/api/play-pop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId, competitionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to play");
      }

      const data = await response.json();
      const gameData = data.result || data;
      setGameResult({ 
        ...gameData, 
        _fullResponse: data,
        prizeName: gameData.prizeName || (gameData.rewardType === "physical" ? gameData.rewardValue : null)
      });

      const values = gameData.balloonValues || [0, 0, 0];
      const formattedValues = values.map((v: number | string, idx: number) => {
        if (v === -1) return "R";
        const numVal = typeof v === 'string' ? parseFloat(v) : v;
        
        if (gameData.rewardType === "physical") {
          let prizeName = gameData.prizeName || gameData.rewardValue || "Prize";
          prizeName = prizeName.replace(/^(Apple |Samsung |Google )/i, "");
          return prizeName;
        }
        
        if (isNaN(numVal)) return String(v);
        
        if (gameData.rewardType === "points") {
          if (numVal >= 1000) {
            return `${(numVal / 1000).toFixed(0)}k pts`;
          }
          return `${numVal} pts`;
        }
        
        if (numVal >= 1000) {
          return `£${(numVal / 1000).toFixed(0)}k`;
        }
        return `£${numVal}`;
      });
      
      setBalloonValues(formattedValues);
      setIsPlaying(true);
    } catch (error: any) {
      console.error("Play error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBalloonPop = (index: number) => {
    if (index !== currentBalloonIndex || !gameResult) return;
    
    const newPopped = [...poppedBalloons];
    newPopped[index] = true;
    setPoppedBalloons(newPopped);
    
    const isLastBalloon = currentBalloonIndex === 2;
    
    if (!isLastBalloon) {
      setCurrentBalloonIndex(currentBalloonIndex + 1);
    } else {
      // All balloons popped - show results with staged animation
      setTimeout(() => {
        if (gameResult.isWin) {
          triggerWinConfetti();
          if (!isMuted && winSoundRef.current) {
            winSoundRef.current.currentTime = 0;
            winSoundRef.current.play().catch(() => {});
          }
        } else if (gameResult.isRPrize) {
          if (!isMuted && winSoundRef.current) {
            winSoundRef.current.currentTime = 0;
            winSoundRef.current.play().catch(() => {});
          }
        } else {
          if (!isMuted && loseSoundRef.current) {
            loseSoundRef.current.currentTime = 0;
            loseSoundRef.current.play().catch(() => {});
          }
        }
        
        // Staged animation for modal
        setResultAnimStage(0);
        setShowResultModal(true);
        resultTimersRef.current.push(setTimeout(() => setResultAnimStage(1), 50));
        resultTimersRef.current.push(setTimeout(() => setResultAnimStage(2), 300));
        
        setIsPlaying(false);
        onPlayComplete(gameResult);
        onRefresh();
      }, 800);
    }
  };

  const resetGame = () => {
    setBalloonValues(["?", "?", "?"]);
    setPoppedBalloons([false, false, false]);
    setCurrentBalloonIndex(0);
    setGameResult(null);
    setShowResultModal(false);
    setResultAnimStage(0);
    setIsPlaying(false);
    resultTimersRef.current.forEach(t => clearTimeout(t));
    resultTimersRef.current = [];
  };

  const closeModalAndReset = () => {
    setShowResultModal(false);
    resetGame();
  };

  const getPrizeDisplay = () => {
    if (!gameResult) return "";
    if (gameResult.rewardType === "cash") return `£${gameResult.rewardValue}`;
    if (gameResult.rewardType === "points") return `${gameResult.rewardValue} Points`;
    if (gameResult.rewardType === "physical") {
      return gameResult.prizeName || gameResult.rewardValue || "Physical Prize";
    }
    return "Prize";
  };

  const isWin = gameResult?.isWin === true;
  const isPhysicalWin = gameResult?.rewardType === "physical";
  const isFreeReplay = gameResult?.isRPrize === true;
  const isNoWin = !isWin && !isPhysicalWin && !isFreeReplay && gameResult !== null;

  return (
    <>
      <Card className="relative overflow-hidden border-0 shadow-[0_0_60px_rgba(168,85,247,0.3)]">
        {/* Premium gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 20%, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 60%),
              linear-gradient(135deg, #0c0a1d 0%, #1a0f2e 25%, #0f172a 50%, #0a1628 75%, #0c0a1d 100%)
            `,
          }}
        />
        
        {/* Animated gradient border glow */}
        <div className="absolute inset-0 rounded-xl opacity-60" style={{
          background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.3), transparent)',
          animation: 'border-sweep 3s ease-in-out infinite'
        }} />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${3 + Math.random() * 6}px`,
                height: `${3 + Math.random() * 6}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: ['#a855f7', '#f59e0b', '#10b981', '#ec4899'][i % 4],
                boxShadow: `0 0 15px ${['#a855f7', '#f59e0b', '#10b981', '#ec4899'][i % 4]}`,
                animation: `float-particle-game ${4 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: 0.5 + Math.random() * 0.3,
              }}
            />
          ))}
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-40 h-40 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="absolute bottom-0 right-0 w-40 h-40 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-tl from-amber-500 to-transparent rounded-full blur-3xl" />
        </div>
        
        <CardContent className="relative z-10 p-6 sm:p-8">
          {/* Top bar with plays and sound */}
          <div className="flex justify-between items-center mb-4">
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 text-white border-purple-500/40 px-4 py-2 text-sm sm:text-base shadow-lg shadow-purple-500/20"
            >
              <Music className="w-4 h-4 mr-2 text-purple-400" />
              <span className="font-bold">{playsRemaining}</span>
              <span className="text-white/70 ml-1.5">Plays Left</span>
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
              data-testid="button-mute"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>

          {/* Premium Jackpot Marquee - Jewel-like glass pill */}
          <div className="relative flex justify-center mb-5">
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-80 h-20 bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 blur-3xl" />
            </div>
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-60 h-16 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/30 to-purple-500/20 blur-2xl" />
            </div>
            
            <div className="relative">
              <div className="relative flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(168,85,247,0.1) 50%, rgba(251,191,36,0.15) 100%)',
                  border: '1px solid rgba(251,191,36,0.4)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1), 0 4px 20px rgba(251,191,36,0.3)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
                  style={{ transform: 'skewX(-20deg) translateX(-30%)' }} 
                />
                
                <div className="absolute top-1 right-4 w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                <div className="absolute bottom-2 right-8 w-1 h-1 bg-amber-200 rounded-full opacity-60" />
                <div className="absolute top-2 left-12 w-1 h-1 bg-yellow-200 rounded-full opacity-70" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    £5,000
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-amber-300/90 -mt-0.5">
                    Jackpot Prize
                  </span>
                </div>
              </div>
              
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] sm:text-xs font-semibold tracking-wide text-purple-300/80">
                  Match 3 to win instantly
                </span>
              </div>
            </div>
          </div>

          {/* Premium header with crown */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" style={{ animation: 'crown-float 2s ease-in-out infinite' }} />
                <div className="absolute inset-0 bg-amber-400 rounded-full blur-2xl opacity-40" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 animate-pulse" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
                  Ringtone
                </span>{" "}
                <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
                  Pop!
                </span>
              </h2>
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-pulse" />
            </div>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-amber-500/20 to-purple-500/20 blur-xl rounded-full" />
              <p className="relative text-sm sm:text-base font-medium text-white/80 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Zap className="inline-block w-4 h-4 text-amber-400 mr-1 -mt-1" />
                Pop all 3 balloons - Match 3 values to{" "}
                <span className="text-amber-400 font-bold">WIN BIG!</span>
                <Zap className="inline-block w-4 h-4 text-amber-400 ml-1 -mt-1" />
              </p>
            </div>
          </div>

          {/* Enhanced Progress indicators with connecting lines */}
          <div className="flex justify-center items-center gap-2 sm:gap-4 mb-8">
            {[0, 1, 2].map((step) => (
              <div key={step} className="flex items-center gap-2 sm:gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className={`
                      relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-500 border-2
                      ${poppedBalloons[step] 
                        ? "bg-gradient-to-br from-emerald-400 to-green-500 border-emerald-300 shadow-lg shadow-emerald-500/50 scale-110" 
                        : step === currentBalloonIndex && isPlaying
                          ? "bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-300 shadow-lg shadow-amber-500/50 scale-110 animate-pulse"
                          : "bg-white/10 border-white/20"}
                    `}
                  >
                    {step === currentBalloonIndex && isPlaying && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    )}
                    {poppedBalloons[step] ? (
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    ) : (
                      <span className={`text-lg sm:text-xl font-black ${step === currentBalloonIndex && isPlaying ? 'text-white' : 'text-white/40'}`}>
                        {step + 1}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                    poppedBalloons[step] ? 'text-emerald-400' : 
                    step === currentBalloonIndex && isPlaying ? 'text-amber-400' : 
                    'text-white/30'
                  }`}>
                    {poppedBalloons[step] ? 'POPPED' : step === currentBalloonIndex && isPlaying ? 'NOW' : 'READY'}
                  </span>
                </div>
                {step < 2 && (
                  <div className={`w-8 sm:w-12 h-1 rounded-full transition-all duration-500 ${
                    poppedBalloons[step] ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Balloon game area */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-2xl bg-gradient-to-t from-purple-900/20 to-transparent" />
            
            <div className="relative flex justify-center items-center gap-2 sm:gap-6 py-10 min-h-[220px]">
              {[0, 1, 2].map((index) => (
                <Balloon
                  key={index}
                  index={index}
                  value={balloonValues[index]}
                  isPopped={poppedBalloons[index]}
                  onPop={() => handleBalloonPop(index)}
                  disabled={!isPlaying || index !== currentBalloonIndex || !gameResult}
                  isMuted={isMuted}
                  isActive={isPlaying && index === currentBalloonIndex}
                />
              ))}
            </div>
          </div>

          {/* Action button area */}
          <div className="flex flex-col items-center gap-4 mt-6">
            {!isPlaying && !showResultModal && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <Button
                  size="lg"
                  onClick={startGame}
                  disabled={playsRemaining <= 0 || isLoading}
                  className="relative bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 hover:from-amber-500 hover:via-yellow-600 hover:to-orange-600 text-black font-black px-12 py-7 text-xl shadow-2xl shadow-yellow-500/50 border-2 border-yellow-300/50 min-w-[260px] overflow-hidden group rounded-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/60"
                  data-testid="button-start-game"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <div className="absolute top-3 left-5 w-2.5 h-2.5 bg-white/80 rounded-full animate-ping" />
                  <div className="absolute bottom-4 right-7 w-2 h-2 bg-white/70 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute top-4 right-5 w-1.5 h-1.5 bg-white/60 rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                  <div className="absolute -inset-[2px] rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 opacity-50 blur-md -z-10 group-hover:opacity-70 group-hover:blur-lg transition-all duration-300" />
                  
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : playsRemaining <= 0 ? (
                    "No Plays Left"
                  ) : (
                    <div className="flex items-center text-white justify-center gap-2 relative">
                      <Sparkles className="w-6 h-6 drop-shadow-lg" />
                      <span className="drop-shadow-lg">POP TO PLAY!</span>
                      <Sparkles className="w-6 h-6 drop-shadow-lg" />
                    </div>
                  )}
                </Button>
              </div>
            )}

            {isPlaying && !showResultModal && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/40 via-yellow-500/50 to-amber-500/40 blur-xl rounded-full animate-pulse" />
                  <div className="relative bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 rounded-full px-8 py-4 border-2 border-amber-400/40 shadow-lg shadow-amber-500/30">
                    <div className="flex items-center gap-3">
                      <Target className="w-6 h-6 text-amber-400 animate-bounce" />
                      <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                        TAP BALLOON {currentBalloonIndex + 1}!
                      </span>
                      <Target className="w-6 h-6 text-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
                <p className="text-white/50 text-sm animate-pulse">
                  Pop all 3 to reveal your prize!
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <style>{`
          @keyframes balloon-float {
            0%, 100% { transform: translateY(0) rotate(-1deg); }
            25% { transform: translateY(-12px) rotate(1deg); }
            50% { transform: translateY(-6px) rotate(-0.5deg); }
            75% { transform: translateY(-15px) rotate(0.5deg); }
          }
          
          @keyframes string-wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(3deg); }
            75% { transform: rotate(-3deg); }
          }
          
          @keyframes float-particle-game {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.5; }
            25% { transform: translateY(-15px) translateX(8px); opacity: 0.8; }
            50% { transform: translateY(-8px) translateX(-5px); opacity: 0.6; }
            75% { transform: translateY(-20px) translateX(5px); opacity: 0.7; }
          }
          
          @keyframes crown-float {
            0%, 100% { transform: translateY(0) rotate(-3deg); }
            50% { transform: translateY(-8px) rotate(3deg); }
          }
          
          @keyframes border-sweep {
            0% { opacity: 0; transform: translateX(-100%); }
            50% { opacity: 0.6; }
            100% { opacity: 0; transform: translateX(100%); }
          }
          
          @keyframes particle-burst-enhanced {
            0% { 
              transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1) rotate(0deg); 
              opacity: 1; 
            }
            100% { 
              transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)) scale(0) rotate(var(--rotation)); 
              opacity: 0; 
            }
          }
          
          @keyframes prize-reveal-bounce {
            0% { transform: scale(0) rotate(-180deg); opacity: 0; }
            40% { transform: scale(1.4) rotate(10deg); }
            60% { transform: scale(0.85) rotate(-5deg); }
            80% { transform: scale(1.1) rotate(2deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes shockwave {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(3); opacity: 0; }
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes bounce-dot {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          
          @keyframes pop-ping {
            0% { transform: scale(0.8); opacity: 0.6; }
            50% { transform: scale(1.3); opacity: 0.2; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          
          @keyframes float-slow {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-5px) translateX(2px); }
            75% { transform: translateY(3px) translateX(-2px); }
          }
          
          @keyframes float-slower {
            0%, 100% { transform: translateY(0) translateX(0); }
            33% { transform: translateY(-7px) translateX(-3px); }
            66% { transform: translateY(2px) translateX(4px); }
          }
          
          @keyframes float-string {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(3px) rotate(2deg); }
          }
          
          .animate-prize-reveal-bounce { animation: prize-reveal-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          .animate-pulse-glow { animation: pulse-glow 1s ease-in-out infinite; }
          .animate-shockwave { animation: shockwave 0.4s ease-out forwards; }
          .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        `}</style>
      </Card>

      {/* Ringtone Pop-themed No Plays Dialog */}
      <AlertDialog open={showOutOfPlaysDialog} onOpenChange={setShowOutOfPlaysDialog}>
        <AlertDialogContent className="max-w-[360px] p-0 overflow-hidden border-0 bg-transparent">
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: '28px',
              border: '2px solid rgba(168, 85, 247, 0.4)',
              background: 'linear-gradient(170deg, rgba(30,10,30,0.98) 0%, rgba(15,5,20,0.99) 100%)',
              boxShadow: '0 0 80px rgba(168,85,247,0.25), 0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.7)',
            }}
          >
            <div className="absolute top-0 left-0 w-16 h-16 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl" />
            </div>
            <div className="absolute bottom-0 right-0 w-20 h-20 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-tl from-amber-500 to-orange-500 rounded-full blur-xl" />
            </div>
            
            <div className="absolute top-3 right-8 w-3 h-4 rounded-full bg-purple-500/40 animate-float-slow" />
            <div className="absolute bottom-6 left-4 w-2.5 h-3.5 rounded-full bg-amber-500/40 animate-float-slower" />
            <div className="absolute top-12 left-6 w-2 h-3 rounded-full bg-emerald-500/40 animate-float" />

            <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-purple-500/40 rounded-tl-xl" />
            <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-pink-500/40 rounded-tr-xl" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-amber-500/40 rounded-bl-xl" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-orange-500/40 rounded-br-xl" />

            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 via-pink-500 via-amber-500 to-transparent" />

            <div className="absolute inset-0 pointer-events-none opacity-10" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
            }} />

            <div className="px-6 pt-10 pb-6 text-center relative z-10">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full animate-ping" style={{ 
                  background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
                  animation: 'pop-ping 1.5s ease-out infinite'
                }} />
                
                <div
                  className="relative w-28 h-28 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle at 38% 32%, rgba(168,85,247,0.25) 0%, rgba(236,72,153,0.1) 60%, transparent 100%)',
                    border: '2px solid rgba(168,85,247,0.4)',
                    boxShadow: '0 0 30px rgba(168,85,247,0.3), inset 0 0 20px rgba(168,85,247,0.2)',
                  }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400/60 to-pink-400/60 transform scale-y-75">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-4 w-0.5 h-10 bg-gradient-to-b from-purple-500/60 to-transparent" />
                    </div>
                    <div className="absolute top-8 left-4 w-2 h-2 rounded-full bg-white/80" />
                    <div className="absolute top-8 right-4 w-2 h-2 rounded-full bg-white/80" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-white/60" />
                  </div>
                  
                  <Popcorn className="absolute -top-2 -right-2 w-5 h-5 text-purple-400/60 rotate-12" />
                </div>
                
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-purple-500/40 to-transparent animate-float-string" />
              </div>

              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle className="text-4xl text-center font-black mb-2" style={{
                  background: 'linear-gradient(135deg, #c084fc 0%, #f472b6 50%, #fbbf24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 12px rgba(168,85,247,0.4))',
                }}>
                  NO POPS LEFT
                </AlertDialogTitle>
                <AlertDialogDescription className="text-purple-300/80 text-sm tracking-wide font-medium">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] tracking-[0.25em]">BALLOON MAGAZINE EMPTY</span>
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  
                  <div className="flex justify-center gap-1.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="relative">
                        <div
                          className="w-5 h-6 rounded-full"
                          style={{
                            background: i < 1 ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.06)',
                            border: '1px solid rgba(168,85,247,0.15)',
                          }}
                        />
                        {i === 0 && (
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-px h-2 bg-purple-500/30" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-gray-400 text-xs">
                    Your balloons are all popped! Grab more pops to keep playing and win big prizes!
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="mt-8 space-y-3">
                <AlertDialogAction
                  className="w-full py-4 text-sm font-bold tracking-[0.18em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98] rounded-xl"
                  style={{
                    background: 'linear-gradient(90deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.1) 100%)',
                    border: '2px solid rgba(168,85,247,0.3)',
                    color: '#c084fc',
                    boxShadow: '0 0 20px rgba(168,85,247,0.1) inset, 0 0 30px rgba(168,85,247,0.2)',
                  }}
                  onClick={() => {
                    setTimeout(() => {
                      if (orderId) {
                        localStorage.removeItem(`popGameHistory_${orderId}`);
                      }
                      setLocation(`/competition/${competitionId}`);
                    }, 200);
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>GET MORE POPS</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                </AlertDialogAction>

                <AlertDialogCancel
                  className="w-full py-4 text-sm font-medium tracking-wider transition-all duration-200 hover:brightness-110 rounded-xl border-0"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    color: '#9ca3af',
                  }}
                >
                  EXIT PARTY
                </AlertDialogCancel>
              </div>

              <p className="text-[8px] text-purple-900/50 mt-4 tracking-widest font-mono">
                BALLOONS: 0/5 • PARTY MODE • READY FOR REFILL
              </p>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Premium Prize Modal - Styled like Voltz winner modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md border-0 p-0 overflow-hidden max-h-[calc(100vh-4rem)] bg-transparent">
          <div
            className={`relative overflow-hidden transition-all duration-500 ${
              resultAnimStage >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
            }`}
            style={{
              borderRadius: '28px',
              border: isWin
                ? '2px solid rgba(251,191,36,0.6)'
                : isPhysicalWin
                ? '2px solid rgba(168,85,247,0.6)'
                : isFreeReplay
                ? '2px solid rgba(6,182,212,0.5)'
                : '2px solid rgba(239,68,68,0.4)',
              background: isWin
                ? 'linear-gradient(170deg, rgba(40,28,0,0.98) 0%, rgba(10,8,0,0.99) 100%)'
                : isPhysicalWin
                ? 'linear-gradient(170deg, rgba(40,20,60,0.98) 0%, rgba(10,5,20,0.99) 100%)'
                : isFreeReplay
                ? 'linear-gradient(170deg, rgba(0,30,40,0.98) 0%, rgba(0,8,12,0.99) 100%)'
                : 'linear-gradient(170deg, rgba(30,5,5,0.98) 0%, rgba(8,0,0,0.99) 100%)',
              boxShadow: isWin
                ? '0 0 80px rgba(251,191,36,0.2), 0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.6)'
                : isPhysicalWin
                ? '0 0 80px rgba(168,85,247,0.2), 0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.6)'
                : isFreeReplay
                ? '0 0 60px rgba(6,182,212,0.15), 0 0 0 1px rgba(255,255,255,0.02), 0 32px 64px rgba(0,0,0,0.6)'
                : '0 0 50px rgba(239,68,68,0.12), 0 0 0 1px rgba(255,255,255,0.02), 0 32px 64px rgba(0,0,0,0.6)',
            }}
          >
            {/* Hex corners */}
            <span className={`absolute w-5 h-5 border-t-2 border-l-2 ${isWin ? 'border-yellow-500/50' : isPhysicalWin ? 'border-purple-500/50' : isFreeReplay ? 'border-cyan-500/50' : 'border-red-500/40'} rounded-tl-xl top-3 left-3`} />
            <span className={`absolute w-5 h-5 border-t-2 border-r-2 ${isWin ? 'border-yellow-500/50' : isPhysicalWin ? 'border-purple-500/50' : isFreeReplay ? 'border-cyan-500/50' : 'border-red-500/40'} rounded-tr-xl top-3 right-3`} />
            <span className={`absolute w-5 h-5 border-b-2 border-l-2 ${isWin ? 'border-yellow-500/50' : isPhysicalWin ? 'border-purple-500/50' : isFreeReplay ? 'border-cyan-500/50' : 'border-red-500/40'} rounded-bl-xl bottom-3 left-3`} />
            <span className={`absolute w-5 h-5 border-b-2 border-r-2 ${isWin ? 'border-yellow-500/50' : isPhysicalWin ? 'border-purple-500/50' : isFreeReplay ? 'border-cyan-500/50' : 'border-red-500/40'} rounded-br-xl bottom-3 right-3`} />

            {/* Top accent line */}
            <div
              className="absolute top-0 inset-x-0 h-[2px]"
              style={{
                background: isWin
                  ? 'linear-gradient(90deg, transparent, #eab308, #fbbf24, #eab308, transparent)'
                  : isPhysicalWin
                  ? 'linear-gradient(90deg, transparent, #a855f7, #c084fc, #a855f7, transparent)'
                  : isFreeReplay
                  ? 'linear-gradient(90deg, transparent, #06b6d4, #22d3ee, #06b6d4, transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), rgba(239,68,68,0.3), transparent)',
              }}
            />

            {/* Scanlines overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
            }} />

            {/* Particle field for wins */}
            {(isWin || isPhysicalWin) && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-1.5 h-1.5 rounded-full`}
                    style={{
                      left: `${5 + ((i * 7 + 13) % 90)}%`,
                      top: `${5 + ((i * 11 + 7) % 90)}%`,
                      animationDelay: `${i * 0.1}s`,
                      animation: `particle-float 1.6s ${i * 0.1}s ease-out infinite`,
                      backgroundColor: isPhysicalWin ? (i % 2 === 0 ? '#a855f7' : '#c084fc') : (i % 2 === 0 ? '#eab308' : '#fbbf24'),
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={closeModalAndReset}
              className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
              style={{
                background: isWin ? 'rgba(234,179,8,0.1)' : isPhysicalWin ? 'rgba(168,85,247,0.1)' : isFreeReplay ? 'rgba(6,182,212,0.1)' : 'rgba(239,68,68,0.1)',
                border: isWin ? '1px solid rgba(234,179,8,0.25)' : isPhysicalWin ? '1px solid rgba(168,85,247,0.25)' : isFreeReplay ? '1px solid rgba(6,182,212,0.25)' : '1px solid rgba(239,68,68,0.2)',
                color: isWin ? '#eab308' : isPhysicalWin ? '#a855f7' : isFreeReplay ? '#06b6d4' : '#ef4444',
              }}
              data-testid="button-close-result"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 pt-10 pb-2 text-center relative z-10">
              {/* Balloon values display */}
              <div className="flex justify-center gap-3 mb-6">
                {balloonValues.map((value, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 text-sm min-w-[70px] text-center rounded-xl"
                    style={{
                      background: isWin
                        ? 'rgba(234,179,8,0.08)'
                        : isPhysicalWin
                        ? 'rgba(168,85,247,0.08)'
                        : isFreeReplay
                        ? 'rgba(6,182,212,0.08)'
                        : 'rgba(239,68,68,0.07)',
                      border: isWin
                        ? '1px solid rgba(234,179,8,0.28)'
                        : isPhysicalWin
                        ? '1px solid rgba(168,85,247,0.28)'
                        : isFreeReplay
                        ? '1px solid rgba(6,182,212,0.28)'
                        : '1px solid rgba(239,68,68,0.2)',
                      color: isWin ? '#fbbf24' : isPhysicalWin ? '#c084fc' : isFreeReplay ? '#22d3ee' : '#f87171',
                    }}
                  >
                    {value}
                  </div>
                ))}
              </div>

              {/* PHYSICAL PRIZE WIN */}
              {isPhysicalWin && (
                <>
                  <div className={`relative w-24 h-24 mx-auto mb-6 transition-all duration-600 ${resultAnimStage >= 2 ? 'scale-100' : 'scale-0'}`}>
                    <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(168,85,247,0.15)' }} />
                    <div
                      className="relative w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        background: 'radial-gradient(circle at 38% 32%, rgba(168,85,247,0.3) 0%, rgba(100,50,150,0.12) 60%, transparent 100%)',
                        border: '1px solid rgba(168,85,247,0.5)',
                        boxShadow: '0 0 30px rgba(168,85,247,0.3)',
                      }}
                    >
                      <Gift className="w-12 h-12 text-purple-400" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 14px rgba(168,85,247,0.7))' }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <p className="text-purple-400/80 text-[10px] font-bold tracking-[0.35em] uppercase">PHYSICAL PRIZE — 3 MATCH!</p>
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  </div>

                  <p className="text-2xl text-white mb-2 font-black" style={{ textShadow: '0 0 24px rgba(168,85,247,0.35)' }}>
                    {gameResult?.prizeName || getPrizeDisplay()}
                  </p>

                  <div className="inline-flex items-center gap-2.5 px-5 py-3 mb-5 rounded-2xl" style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(100,50,150,0.08) 100%)',
                    border: '1px solid rgba(168,85,247,0.28)',
                  }}>
                    <Gift className="w-5 h-5 text-purple-400" />
                    <span className="text-xl text-purple-300 font-black">Physical Prize Won!</span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-gray-500 text-[10px] mb-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Contact support to claim</span>
                  </div>
                </>
              )}

              {/* CASH/POINTS WIN */}
              {isWin && (
                <>
                  <div className={`relative w-24 h-24 mx-auto mb-6 transition-all duration-600 ${resultAnimStage >= 2 ? 'scale-100' : 'scale-0'}`}>
                    <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(234,179,8,0.15)' }} />
                    <div
                      className="relative w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        background: 'radial-gradient(circle at 38% 32%, rgba(234,179,8,0.3) 0%, rgba(180,120,0,0.12) 60%, transparent 100%)',
                        border: '1px solid rgba(234,179,8,0.5)',
                        boxShadow: '0 0 30px rgba(234,179,8,0.3)',
                      }}
                    >
                      <Trophy className="w-12 h-12 text-yellow-400" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 14px rgba(234,179,8,0.7))' }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                    <p className="text-yellow-400/80 text-[10px] font-bold tracking-[0.35em] uppercase">POWER SURGE — 3 MATCH!</p>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  </div>

                  <p className="text-3xl text-white mb-4 font-black" style={{ textShadow: '0 0 24px rgba(234,179,8,0.35)' }}>
                    {getPrizeDisplay()}
                  </p>

                  <div className="inline-flex items-center gap-2.5 px-5 py-3 mb-5 rounded-2xl" style={{
                    background: 'linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(180,100,0,0.08) 100%)',
                    border: '1px solid rgba(234,179,8,0.28)',
                  }}>
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-2xl text-yellow-300 font-black">{getPrizeDisplay()}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-gray-500 text-[10px] mb-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified & Credited</span>
                  </div>
                </>
              )}

              {/* FREE REPLAY */}
              {isFreeReplay && (
                <>
                  <div className={`relative w-24 h-24 mx-auto mb-6 transition-all duration-600 ${resultAnimStage >= 2 ? 'scale-100' : 'scale-0'}`}>
                    <div className="absolute -inset-3 rounded-full blur-xl" style={{ background: 'rgba(6,182,212,0.15)' }} />
                    <div
                      className="relative w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        background: 'radial-gradient(circle at 38% 32%, rgba(6,182,212,0.25) 0%, rgba(0,100,120,0.1) 60%, transparent 100%)',
                        border: '1px solid rgba(6,182,212,0.4)',
                        boxShadow: '0 0 30px rgba(6,182,212,0.2)',
                      }}
                    >
                      <RotateCcw className="w-12 h-12 text-cyan-400" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 12px rgba(6,182,212,0.6))', animation: 'spin-slow 2s linear infinite' }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Zap className="w-3.5 h-3.5 text-cyan-500" />
                    <p className="text-cyan-400/80 text-[10px] font-bold tracking-[0.35em] uppercase">BACKUP POWER — FREE PLAY!</p>
                    <Zap className="w-3.5 h-3.5 text-cyan-500" />
                  </div>

                  <p className="text-3xl text-white mb-4 font-black" style={{ textShadow: '0 0 20px rgba(6,182,212,0.3)' }}>
                    Power Stabilized!
                  </p>

                  <div className="inline-flex items-center gap-2.5 px-5 py-3 mb-5 rounded-2xl" style={{
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(0,80,100,0.08) 100%)',
                    border: '1px solid rgba(6,182,212,0.28)',
                  }}>
                    <RotateCcw className="w-5 h-5 text-cyan-400" />
                    <span className="text-2xl text-cyan-300 font-black">+1 Free Play</span>
                  </div>
                </>
              )}

              {/* NO WIN */}
              {isNoWin && (
                <>
                  <div className={`relative w-24 h-24 mx-auto mb-6 transition-all duration-600 ${resultAnimStage >= 2 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                    <div className="absolute -inset-3 rounded-full blur-xl" style={{ background: 'rgba(239,68,68,0.08)' }} />
                    <div
                      className="relative w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        background: 'radial-gradient(circle at 38% 32%, rgba(239,68,68,0.18) 0%, rgba(120,0,0,0.06) 60%, transparent 100%)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        boxShadow: '0 0 30px rgba(239,68,68,0.1)',
                      }}
                    >
                      <Target className="w-12 h-12 text-red-400/75" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Zap className="w-3.5 h-3.5 text-red-500/60" />
                    <p className="text-red-400/70 text-[10px] font-bold tracking-[0.35em] uppercase">NO MATCH — SO CLOSE!</p>
                    <Zap className="w-3.5 h-3.5 text-red-500/60" />
                  </div>

                  <p className="text-2xl text-white/75 mb-1 font-black">Pops Didn't Match</p>
                  <p className="text-red-400/35 text-sm tracking-wide mb-5">Match all 3 to win — try again</p>
                </>
              )}
            </div>

            {/* CTA button */}
            <button
              onClick={closeModalAndReset}
              disabled={playsRemaining < 1}
              className="w-full py-4 text-sm font-bold tracking-[0.18em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                background: isWin
                  ? 'linear-gradient(90deg, rgba(234,179,8,0.14) 0%, rgba(180,100,0,0.1) 100%)'
                  : isPhysicalWin
                  ? 'linear-gradient(90deg, rgba(168,85,247,0.14) 0%, rgba(100,50,150,0.1) 100%)'
                  : isFreeReplay
                  ? 'linear-gradient(90deg, rgba(6,182,212,0.14) 0%, rgba(0,80,100,0.1) 100%)'
                  : 'linear-gradient(90deg, rgba(239,68,68,0.1) 0%, rgba(120,0,0,0.08) 100%)',
                borderTop: isWin
                  ? '1px solid rgba(234,179,8,0.18)'
                  : isPhysicalWin
                  ? '1px solid rgba(168,85,247,0.18)'
                  : isFreeReplay
                  ? '1px solid rgba(6,182,212,0.18)'
                  : '1px solid rgba(239,68,68,0.15)',
                color: isWin ? '#eab308' : isPhysicalWin ? '#a855f7' : isFreeReplay ? '#06b6d4' : '#ef4444',
                borderRadius: '0 0 28px 28px',
              }}
              data-testid="button-continue"
            >
              {isWin || isPhysicalWin ? 'COLLECT & CONTINUE' : isFreeReplay ? 'USE FREE PLAY' : 'TRY AGAIN'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.3; }
          75% { transform: translateY(10px) translateX(-10px); opacity: 0.8; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-float-slow {
          animation: float-slow 3s ease-in-out infinite;
        }
        
        .animate-float-slower {
          animation: float-slower 4s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float-slow 2.5s ease-in-out infinite;
        }
        
        .animate-float-string {
          animation: float-string 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}