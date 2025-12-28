import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Volume2, VolumeX, PartyPopper, RotateCcw, Gift, Snowflake, Trophy, X, Sparkles, Star, Zap, Target, Flame } from "lucide-react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    main: "#ef4444", 
    light: "#fca5a5", 
    dark: "#b91c1c",
    glow: "0 0 40px rgba(239, 68, 68, 0.6)",
    particles: ["#ef4444", "#fca5a5", "#dc2626", "#fecaca", "#ff6b6b"]
  },
  { 
    main: "#22c55e", 
    light: "#86efac", 
    dark: "#15803d",
    glow: "0 0 40px rgba(34, 197, 94, 0.6)",
    particles: ["#22c55e", "#86efac", "#16a34a", "#bbf7d0", "#4ade80"]
  },
  { 
    main: "#eab308", 
    light: "#fde047", 
    dark: "#a16207",
    glow: "0 0 40px rgba(234, 179, 8, 0.6)",
    particles: ["#eab308", "#fde047", "#ca8a04", "#fef08a", "#facc15"]
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
      <div className="relative flex items-center justify-center" style={{ width: "120px", height: "150px" }}>
        {showShockwave && (
          <div 
            className="absolute inset-0 rounded-full animate-shockwave"
            style={{
              background: `radial-gradient(circle, ${colorScheme.main}40 0%, transparent 70%)`,
            }}
          />
        )}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(32)].map((_, i) => {
              const angle = (i / 32) * 360;
              const distance = 80 + Math.random() * 60;
              const size = 4 + Math.random() * 8;
              const isConfetti = i % 3 === 0;
              return (
                <div
                  key={i}
                  className={`absolute ${isConfetti ? 'rounded-sm' : 'rounded-full'}`}
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${size}px`,
                    height: isConfetti ? `${size * 2}px` : `${size}px`,
                    backgroundColor: colorScheme.particles[i % colorScheme.particles.length],
                    boxShadow: `0 0 12px ${colorScheme.particles[i % colorScheme.particles.length]}`,
                    animation: `particle-burst-enhanced 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                    animationDelay: `${i * 0.015}s`,
                    transform: `translate(-50%, -50%)`,
                    '--angle': `${angle}deg`,
                    '--distance': `${distance}px`,
                    '--rotation': `${Math.random() * 720}deg`,
                  } as any}
                />
              );
            })}
          </div>
        )}
        <div 
          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center ${showValue ? 'animate-prize-reveal-bounce' : ''}`}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${colorScheme.light}, ${colorScheme.main}, ${colorScheme.dark})`,
            boxShadow: `0 8px 32px ${colorScheme.main}60, inset 0 -4px 12px ${colorScheme.dark}60, 0 0 60px ${colorScheme.main}40`,
          }}
        >
          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg text-center px-2">
            {value || "?"}
          </span>
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
        width: "120px", 
        height: "150px",
        animation: disabled ? "none" : `balloon-float ${2.5 + index * 0.3}s ease-in-out infinite`,
        animationDelay: `${index * 0.3}s`,
      }}
      data-testid={`balloon-${index}`}
    >
      <div 
        className={`
          absolute bottom-6 left-1/2 -translate-x-1/2
          w-20 h-24 sm:w-24 sm:h-28
          rounded-[50%_50%_48%_48%]
          transition-all duration-200
          ${!disabled ? "hover:scale-110 active:scale-90" : ""}
        `}
        style={{
          background: `radial-gradient(ellipse at 35% 25%, ${colorScheme.light} 0%, ${colorScheme.main} 40%, ${colorScheme.dark} 100%)`,
          boxShadow: !disabled 
            ? `0 10px 40px ${colorScheme.main}50, inset 0 -10px 30px ${colorScheme.dark}70, inset 6px 6px 25px ${colorScheme.light}60, ${isActive ? colorScheme.glow : ''}`
            : `0 4px 16px rgba(0,0,0,0.3)`,
        }}
      >
        <div 
          className="absolute top-4 left-5 w-7 h-10 rounded-full blur-[2px]"
          style={{
            background: `linear-gradient(135deg, ${colorScheme.light}90 0%, transparent 100%)`,
          }}
        />
        <div 
          className="absolute top-6 left-7 w-4 h-5 rounded-full"
          style={{
            background: `linear-gradient(135deg, white 0%, ${colorScheme.light}80 100%)`,
          }}
        />
        {isActive && !disabled && (
          <div className="absolute inset-0 rounded-[50%_50%_48%_48%] animate-pulse-glow" 
            style={{ boxShadow: colorScheme.glow }} 
          />
        )}
      </div>
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: `14px solid ${colorScheme.dark}`,
          filter: `drop-shadow(0 2px 4px ${colorScheme.dark}80)`,
        }}
      />
      <div 
        className="absolute -bottom-2 left-1/2 w-[2px] h-10"
        style={{
          background: `linear-gradient(to bottom, ${colorScheme.dark}, #888, #666)`,
          transformOrigin: "top",
          animation: disabled ? "none" : "string-wave 3s ease-in-out infinite",
          animationDelay: `${index * 0.2}s`,
        }}
      />
    </button>
  );
}

interface RingtonePopGameProps {
  orderId: string;
  competitionId: string;
  playsRemaining: number;
  onPlayComplete: (result: any) => void;
  onRefresh: () => void;
}

export default function RingtonePopGame({
  orderId,
  competitionId,
  playsRemaining,
  onPlayComplete,
  onRefresh,
}: RingtonePopGameProps) {
  const [balloonValues, setBalloonValues] = useState<string[]>(["?", "?", "?"]);
  const [poppedBalloons, setPoppedBalloons] = useState<boolean[]>([false, false, false]);
  const [currentBalloonIndex, setCurrentBalloonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
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
    
    const nextIndex = currentBalloonIndex + 1;
    setCurrentBalloonIndex(nextIndex);

    if (nextIndex >= 3) {
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
      <Card className="relative overflow-hidden border-2 border-yellow-500/30">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 50% 0%, rgba(30, 58, 138, 0.9) 0%, transparent 60%),
              linear-gradient(180deg, #0f172a 0%, #1e3a5f 30%, #0c1929 100%)
            `,
          }}
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/80"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                animation: `snowfall ${Math.random() * 5 + 5}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.6 + 0.4,
              }}
            />
          ))}
        </div>
        <div className="absolute top-0 left-0 w-32 h-32 opacity-15">
          <Snowflake className="w-full h-full text-white" style={{ animation: "spin-slow 20s linear infinite" }} />
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-15">
          <Snowflake className="w-full h-full text-white" style={{ animation: "spin-slow 25s linear infinite reverse" }} />
        </div>
        
        <CardContent className="relative z-10 p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-red-500/20 to-green-500/20 text-white border-white/30 px-4 py-2 text-sm sm:text-base"
            >
              <Gift className="w-4 h-4 mr-2" />
              {playsRemaining} Plays Left
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="button-mute"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
                  Ringtone
                </span>{" "}
                <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent drop-shadow-lg">
                  Pop!
                </span>
              </h2>
              <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 blur-xl rounded-full" />
              <p className="relative text-lg sm:text-xl font-medium text-white/90 px-4 py-2">
                <Zap className="inline-block w-5 h-5 text-yellow-400 mr-1 -mt-1" />
                Pop all 3 balloons - Match 3 values to{" "}
                <span className="text-yellow-400 font-bold text-2xl animate-pulse">WIN BIG!</span>
                <Zap className="inline-block w-5 h-5 text-yellow-400 ml-1 -mt-1" />
              </p>
            </div>
          </div>

          <div className="flex justify-center items-center gap-3 mb-6">
            {[0, 1, 2].map((step) => (
              <div key={step} className="flex flex-col items-center gap-1">
                <div 
                  className={`
                    w-12 h-4 rounded-full transition-all duration-500 relative overflow-hidden
                    ${poppedBalloons[step] 
                      ? "bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/50" 
                      : step === currentBalloonIndex && isPlaying
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/50"
                        : "bg-white/20"}
                  `}
                >
                  {step === currentBalloonIndex && isPlaying && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  )}
                </div>
                <span className={`text-xs font-medium ${poppedBalloons[step] ? 'text-green-400' : step === currentBalloonIndex && isPlaying ? 'text-yellow-400' : 'text-white/50'}`}>
                  {step + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center gap-4 sm:gap-8 py-8 min-h-[200px]">
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

          <div className="flex justify-center mt-6">
            {!isPlaying && !showResultModal && (
              <Button
                size="lg"
                onClick={startGame}
                disabled={playsRemaining <= 0 || isLoading}
                className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-600 text-black font-bold px-10 py-6 text-lg shadow-xl shadow-yellow-500/40 border border-yellow-300/50 min-w-[200px] relative overflow-hidden group"
                data-testid="button-start-game"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : playsRemaining <= 0 ? (
                  "No Plays Left"
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    POP TO PLAY!
                  </>
                )}
              </Button>
            )}

            {isPlaying && !showResultModal && (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-bounce bg-gradient-to-r from-yellow-400/20 via-yellow-500/30 to-yellow-400/20 rounded-full px-6 py-3">
                  <span className="text-xl font-bold text-yellow-400">
                    Tap balloon {currentBalloonIndex + 1} of 3!
                  </span>
                </div>
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
          
          @keyframes snowfall {
            0% { transform: translateY(-10px) translateX(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 0.8; }
            100% { transform: translateY(100vh) translateX(20px); opacity: 0; }
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