import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Volume2, VolumeX, PartyPopper, RotateCcw, Gift, Trophy, X, Sparkles, Star, Zap, Target, Flame, Crown, Music, Sparkle } from "lucide-react";
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
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] text-center px-2">
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
  
  const allPlaysUsed = popHistory.length > 0 && popHistory.every(s => s.status === "PLAYED");
  
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);

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
      setGameResult({ ...gameData, _fullResponse: data });
      
      const values = gameData.balloonValues || [0, 0, 0];
      const formattedValues = values.map((v: number | string) => {
      if (v === -1) return "R";
      const numVal = typeof v === 'string' ? parseFloat(v) : v;
      if (isNaN(numVal)) return String(v);
      
      // Check if the reward type is points, then show pts instead of £
      if (gameData.rewardType === "points") {
        return `${numVal} pts`;
      }
      
      // Otherwise show £ for cash or other types
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
  
  // Check if this was the last balloon
  const isLastBalloon = currentBalloonIndex === 2;
  
  if (!isLastBalloon) {
    // Move to next balloon
    setCurrentBalloonIndex(currentBalloonIndex + 1);
  } else {
    // All balloons popped - show results
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
      setShowResultModal(true);
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
    setIsPlaying(false);
  };

  const closeModalAndReset = () => {
    setShowResultModal(false);
    resetGame();
  };

  const getPrizeDisplay = () => {
    if (!gameResult) return "";
    if (gameResult.rewardType === "cash") return `£${gameResult.rewardValue}`;
    if (gameResult.rewardType === "points") return `${gameResult.rewardValue} Points`;
    return "Prize";
  };

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
            {/* Outer glow layers */}
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-80 h-20 bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 blur-3xl" />
            </div>
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-60 h-16 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/30 to-purple-500/20 blur-2xl" />
            </div>
            
            {/* Main glass pill container */}
            <div className="relative">
              {/* Radiant burst behind */}
              {/* <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-16 h-16">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/60 to-transparent blur-xl rounded-full" />
                <Crown className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
              </div> */}
              
              {/* Glass pill */}
              <div className="relative flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(168,85,247,0.1) 50%, rgba(251,191,36,0.15) 100%)',
                  border: '1px solid rgba(251,191,36,0.4)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1), 0 4px 20px rgba(251,191,36,0.3)',
                }}
              >
                {/* Static shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
                  style={{ transform: 'skewX(-20deg) translateX(-30%)' }} 
                />
                
                {/* Gem sparkles */}
                <div className="absolute top-1 right-4 w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                <div className="absolute bottom-2 right-8 w-1 h-1 bg-amber-200 rounded-full opacity-60" />
                <div className="absolute top-2 left-12 w-1 h-1 bg-yellow-200 rounded-full opacity-70" />
                
                {/* Trophy icon */}
                {/* <div className="relative z-10">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                </div> */}
                
                {/* Text content */}
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    £5,000
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-amber-300/90 -mt-0.5">
                    Jackpot Prize
                  </span>
                </div>
                
                {/* Sparkle icon */}
                {/* <div className="relative z-10">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-fuchsia-400 drop-shadow-[0_0_6px_rgba(232,121,249,0.6)]" />
                </div> */}
              </div>
              
              {/* Match 3 subtitle */}
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
                  {/* Step circle */}
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
                  {/* Step label */}
                  <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                    poppedBalloons[step] ? 'text-emerald-400' : 
                    step === currentBalloonIndex && isPlaying ? 'text-amber-400' : 
                    'text-white/30'
                  }`}>
                    {poppedBalloons[step] ? 'POPPED' : step === currentBalloonIndex && isPlaying ? 'NOW' : 'READY'}
                  </span>
                </div>
                {/* Connecting line */}
                {step < 2 && (
                  <div className={`w-8 sm:w-12 h-1 rounded-full transition-all duration-500 ${
                    poppedBalloons[step] ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Balloon game area with enhanced visual frame */}
          <div className="relative">
            {/* Game arena background */}
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
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
               <Button
                size="lg"
                onClick={startGame}
                disabled={playsRemaining <= 0 || isLoading}
                className="relative bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 hover:from-amber-500 hover:via-yellow-600 hover:to-orange-600 text-black font-black px-12 py-7 text-xl shadow-2xl shadow-yellow-500/50 border-2 border-yellow-300/50 min-w-[260px] overflow-hidden group rounded-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/60"
                data-testid="button-start-game"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                {/* Sparkle decorations */}
                <div className="absolute top-3 left-5 w-2.5 h-2.5 bg-white/80 rounded-full animate-ping" />
                <div className="absolute bottom-4 right-7 w-2 h-2 bg-white/70 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute top-4 right-5 w-1.5 h-1.5 bg-white/60 rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
                
                {/* Inner glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                
                {/* Gold border glow */}
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
                    <Sparkles className="w-6 h-6  drop-shadow-lg" />
                    <span className="drop-shadow-lg">POP TO PLAY!</span>
                    <Sparkles className="w-6 h-6  drop-shadow-lg" />
                  </div>
                )}
              </Button>
              </div>
            )}

           {isPlaying && !showResultModal && (
  <div className="flex flex-col items-center gap-3">
    {/* Animated instruction */}
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
    {/* Subtle helper text */}
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
          
          .animate-prize-reveal-bounce { animation: prize-reveal-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          .animate-pulse-glow { animation: pulse-glow 1s ease-in-out infinite; }
          .animate-shockwave { animation: shockwave 0.4s ease-out forwards; }
          .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        `}</style>
      </Card>

      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className={`
          max-w-[calc(100vw-2rem)] sm:max-w-md border-2 overflow-hidden p-0 max-h-[calc(100vh-4rem)]
          ${gameResult?.isWin 
            ? 'border-yellow-500/70 bg-gradient-to-b from-yellow-900/40 via-slate-900 to-slate-900' 
            : gameResult?.isRPrize
              ? 'border-blue-500/50 bg-gradient-to-b from-blue-900/30 via-slate-900 to-slate-900'
              : 'border-purple-500/50 bg-gradient-to-b from-purple-900/30 via-slate-900 to-slate-900'}
        `}>
          {gameResult?.isWin && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-24 sm:h-40 bg-gradient-to-b from-yellow-500/30 to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-yellow-500/10 rounded-full blur-3xl" />
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: `${3 + Math.random() * 4}px`,
                    height: `${3 + Math.random() * 4}px`,
                    backgroundColor: ['#ffd700', '#ffed4a', '#fbbf24', '#22c55e'][Math.floor(Math.random() * 4)],
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `twinkle-star ${1 + Math.random() * 2}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    boxShadow: `0 0 8px currentColor`,
                  }}
                />
              ))}
            </div>
          )}
          
          {gameResult?.isRPrize && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-b from-blue-500/20 to-transparent" />
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400/60"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `twinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          )}
          
          <DialogHeader className="relative z-10 pt-5 sm:pt-8 px-4 sm:px-6">
            {gameResult?.isWin ? (
              <div className="flex flex-col items-center gap-3 sm:gap-5">
                <div className="relative">
                  <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full blur-xl opacity-60 animate-pulse" />
                  <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-2xl shadow-yellow-500/60">
                    <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                    <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2">
                    <Star className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-400 animate-pulse" />
                  </div>
                </div>
                <DialogTitle className="text-2xl sm:text-4xl md:text-5xl font-black text-center tracking-wider">
                  <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
                    WINNER!
                  </span>
                </DialogTitle>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 blur-xl rounded-lg" />
                  <div className="relative bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/40 rounded-xl px-5 sm:px-8 py-3 sm:py-4">
                    <div className="text-3xl sm:text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                      {getPrizeDisplay()}
                    </div>
                  </div>
                </div>
                <p className="text-green-400 text-sm sm:text-lg font-medium text-center flex items-center gap-1.5 sm:gap-2">
                  <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5" />
                  Prize added to your account!
                  <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5" />
                </p>
              </div>
            ) : gameResult?.isRPrize ? (
              <div className="flex flex-col items-center gap-3 sm:gap-5">
                <div className="relative">
                  <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur-lg opacity-40 animate-pulse" />
                  <div className="relative w-18 h-18 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/50">
                    <RotateCcw className="w-9 h-9 sm:w-12 sm:h-12 text-white" style={{ animation: "spin-slow 2s linear infinite" }} />
                  </div>
                </div>
                <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    FREE REPLAY!
                  </span>
                </DialogTitle>
                <div className="text-center space-y-1 sm:space-y-2">
                  <p className="text-white text-base sm:text-lg">
                    R Symbol matched - Bonus play unlocked!
                  </p>
                  <p className="text-blue-300 text-xs sm:text-sm">
                    Your free play has been added
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 sm:gap-5">
                <div className="relative">
                  <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full blur-xl opacity-50" style={{ animation: "pulse-glow 1.5s ease-in-out infinite" }} />
                  <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full blur-md opacity-60" style={{ animation: "pulse-glow 1.5s ease-in-out infinite 0.3s" }} />
                  <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 flex items-center justify-center shadow-2xl shadow-orange-500/50 border-4 border-yellow-400/50" style={{ animation: "shake 0.5s ease-in-out infinite" }}>
                    <div className="text-3xl sm:text-4xl">
                      <Target className="w-10 h-10 sm:w-14 sm:h-14 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg" style={{ animation: "bounce-small 0.8s ease-in-out infinite" }}>
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 fill-orange-600" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg" style={{ animation: "bounce-small 0.8s ease-in-out infinite 0.2s" }}>
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                  </div>
                </div>
                
                <DialogTitle className="text-3xl sm:text-4xl md:text-5xl font-black text-center relative">
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent blur-sm opacity-80">
                    SO CLOSE!
                  </span>
                  <span className="relative bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg" style={{ animation: "text-pulse 1s ease-in-out infinite" }}>
                    SO CLOSE!
                  </span>
                </DialogTitle>
                
                <div className="w-full bg-gradient-to-br from-orange-900/50 via-red-900/40 to-pink-900/50 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 text-center border-2 border-orange-500/40 shadow-xl shadow-orange-500/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ animation: "shimmer 2s linear infinite" }} />
                  <div className="relative space-y-2 sm:space-y-3">
                    <p className="text-white text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
                      <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" style={{ animation: "flicker 0.3s ease-in-out infinite" }} />
                      You were THIS close!
                      <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" style={{ animation: "flicker 0.3s ease-in-out infinite 0.15s" }} />
                    </p>
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500" style={{ animation: `bounce-dot 0.6s ease-in-out infinite ${i * 0.1}s` }} />
                      ))}
                    </div>
                    <p className="text-orange-200 text-sm sm:text-base font-medium">
                      Keep going - your lucky pop awaits!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogHeader>
          
          <div className="flex flex-col gap-2 sm:gap-3 p-4 sm:p-6 relative z-10">
            <Button
              size="lg"
              onClick={closeModalAndReset}
              disabled={playsRemaining < 1}
              className={`
                w-full font-bold py-4 sm:py-6 text-base sm:text-lg relative overflow-hidden group
                ${gameResult?.isWin
                  ? 'bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-600 text-black shadow-lg shadow-yellow-500/30'
                  : gameResult?.isRPrize
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30'}
              `}
              data-testid="button-modal-play-again"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {playsRemaining < 1 ? "All Plays Used" : (
                <>
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Play Again ({playsRemaining} left)
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowResultModal(false)}
              className="w-full border-white/20 text-white hover:bg-white/10 py-2 sm:py-3"
              data-testid="button-modal-close"
            >
              Close
            </Button>
          </div>
          
          <style>{`
            @keyframes twinkle {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.5); }
            }
            @keyframes twinkle-star {
              0%, 100% { opacity: 0.2; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
            }
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse-glow {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.1); }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0) rotate(0deg); }
              25% { transform: translateX(-2px) rotate(-1deg); }
              75% { transform: translateX(2px) rotate(1deg); }
            }
            @keyframes bounce-small {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-4px) scale(1.1); }
            }
            @keyframes text-pulse {
              0%, 100% { transform: scale(1); filter: brightness(1); }
              50% { transform: scale(1.02); filter: brightness(1.2); }
            }
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes flicker {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(0.95); }
            }
            @keyframes bounce-dot {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-4px); }
            }
          `}</style>
        </DialogContent>
      </Dialog>
    </>
  );
}