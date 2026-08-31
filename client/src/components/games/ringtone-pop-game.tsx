import { useState, useEffect, useRef, type CSSProperties } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Volume2, VolumeX, Sparkles, Zap, Popcorn } from "lucide-react";
import confetti from "canvas-confetti";
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
import GameResultOverlay from "@/components/games/GameResultOverlay";

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

type BalloonColor = {
  main: string;
  light: string;
  dark: string;
  accent: string;
  rim: string;
  glow: string;
  innerGlow: string;
  particles: string[];
};

const BALLOON_COLORS: BalloonColor[] = [
  {
    main: "#C8102E",
    light: "#FF6B7A",
    dark: "#7A0A1C",
    accent: "#FF263D",
    rim: "rgba(255, 38, 61, 0.45)",
    glow: "0 0 60px rgba(200, 16, 46, 0.8), 0 0 100px rgba(200, 16, 46, 0.4)",
    innerGlow: "inset 0 0 30px rgba(255, 255, 255, 0.25)",
    particles: ["#C8102E", "#FF263D", "#FF6B7A", "#F1D47A", "#8B0A1A", "#fff8ee"],
  },
  {
    main: "#D4AF37",
    light: "#F8E7A8",
    dark: "#8A6E18",
    accent: "#F1D47A",
    rim: "rgba(241, 212, 122, 0.55)",
    glow: "0 0 60px rgba(212, 175, 55, 0.8), 0 0 100px rgba(241, 212, 122, 0.4)",
    innerGlow: "inset 0 0 30px rgba(255, 255, 255, 0.3)",
    particles: ["#D4AF37", "#F1D47A", "#F8E7A8", "#C8102E", "#8A6E18", "#fff8ee"],
  },
  {
    main: "#1a1a1e",
    light: "#4a4a52",
    dark: "#050505",
    accent: "#F1D47A",
    rim: "rgba(241, 212, 122, 0.65)",
    glow: "0 0 50px rgba(241, 212, 122, 0.45), 0 0 90px rgba(200, 16, 46, 0.22)",
    innerGlow: "inset 0 0 28px rgba(241, 212, 122, 0.14)",
    particles: ["#F1D47A", "#D4AF37", "#C8102E", "#FF263D", "#2a2a2e", "#fff8ee"],
  },
];

const STAGE_SPECKS = Array.from({ length: 12 }, (_, i) => ({
  size: 3 + (i % 4),
  left: (i * 17 + 8) % 100,
  top: (i * 23 + 11) % 100,
  color: ["#C8102E", "#F1D47A", "#fff8ee"][i % 3],
  duration: 4 + (i % 4),
  delay: (i * 0.37) % 3,
  opacity: 0.35 + (i % 3) * 0.12,
}));

const STAGE_MOTES = Array.from({ length: 8 }, (_, i) => ({
  left: 12 + i * 11,
  delay: (i * 0.55) % 4,
  duration: 5.5 + (i % 3),
  color: i % 2 === 0 ? "#F1D47A" : "#FF263D",
}));

const LANE_LIFT = [14, -18, 14] as const;

type DebrisPiece = {
  kind: "shard" | "spark" | "dot";
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  rotation: number;
};

function buildDebris(colorScheme: BalloonColor): DebrisPiece[] {
  return Array.from({ length: 28 }, (_, i) => {
    const kind: DebrisPiece["kind"] = i % 5 === 0 ? "shard" : i % 3 === 0 ? "spark" : "dot";
    return {
      kind,
      angle: (i / 28) * 360 + (i % 4) * 7,
      distance: kind === "shard" ? 70 + (i % 5) * 18 : 90 + (i % 7) * 14,
      size: kind === "shard" ? 10 + (i % 4) * 3 : kind === "spark" ? 4 + (i % 3) : 6 + (i % 4) * 2,
      color: colorScheme.particles[i % colorScheme.particles.length],
      delay: i * 0.01,
      rotation: (i * 137) % 1080,
    };
  });
}

const getFontSize = (val: string) => {
  if (!val) return "text-lg";
  if (val.length < 6) return "text-3xl";
  if (val.length < 12) return "text-lg";
  if (val.length < 20) return "text-sm";
  return "text-xs";
};

function Balloon({ value, isPopped, onPop, index, disabled, isMuted, isActive }: BalloonProps) {
  const colorScheme = BALLOON_COLORS[index % BALLOON_COLORS.length];
  const [isInflating, setIsInflating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const [showShockwave, setShowShockwave] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [debris, setDebris] = useState<DebrisPiece[]>([]);
  const popSoundRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    popSoundRef.current = new Audio(popSoundFile);
    popSoundRef.current.volume = 0.6;
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  };

  const handleClick = () => {
    if (isPopped || disabled || isInflating || isAnimating) return;
    setDebris(buildDebris(colorScheme));
    setIsInflating(true);

    later(() => {
      setIsInflating(false);
      setIsAnimating(true);
      setShowParticles(true);
      setShowShockwave(true);
      setShowFlash(true);

      if (!isMuted && popSoundRef.current) {
        popSoundRef.current.currentTime = 0;
        popSoundRef.current.play().catch(() => {});
      }

      later(() => {
        onPop();
        setIsAnimating(false);
        setShowValue(true);
      }, 80);

      later(() => setShowFlash(false), 180);
      later(() => setShowShockwave(false), 550);
      later(() => setShowParticles(false), 1100);
    }, 110);
  };

  if (isPopped) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: "140px", height: "170px" }}>
        {showFlash && (
          <div
            className="absolute inset-0 z-30 pointer-events-none animate-pop-flash"
            style={{
              background: `radial-gradient(circle, ${colorScheme.accent}cc 0%, ${colorScheme.main}55 35%, transparent 70%)`,
            }}
          />
        )}
        {showShockwave && (
          <>
            <div
              className="absolute inset-0 rounded-full animate-shockwave"
              style={{
                background: `radial-gradient(circle, ${colorScheme.main}60 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute inset-0 rounded-full animate-shockwave-mid"
              style={{
                border: `2px solid ${colorScheme.accent}90`,
                boxShadow: `0 0 24px ${colorScheme.accent}70`,
              }}
            />
            <div
              className="absolute inset-0 rounded-full animate-shockwave-late"
              style={{
                background: `radial-gradient(circle, ${colorScheme.accent}28 0%, transparent 60%)`,
              }}
            />
          </>
        )}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {debris.map((piece, i) => (
              <div
                key={i}
                className={`absolute ${
                  piece.kind === "shard" ? "rounded-[2px]" : piece.kind === "spark" ? "rounded-none" : "rounded-full"
                }`}
                style={{
                  left: "50%",
                  top: "50%",
                  width: `${piece.size}px`,
                  height: piece.kind === "shard" ? `${piece.size * 1.8}px` : `${piece.size}px`,
                  backgroundColor: piece.color,
                  boxShadow: `0 0 12px ${piece.color}, 0 0 24px ${piece.color}50`,
                  animation: `particle-burst-enhanced ${piece.kind === "shard" ? 0.85 : 1}s cubic-bezier(0.22, 0.8, 0.32, 1) forwards`,
                  animationDelay: `${piece.delay}s`,
                  transform: `translate(-50%, -50%)${piece.kind === "spark" ? " rotate(45deg)" : ""}`,
                  "--angle": `${piece.angle}deg`,
                  "--distance": `${piece.distance}px`,
                  "--rotation": `${piece.rotation}deg`,
                } as CSSProperties}
              />
            ))}
          </div>
        )}
        <div className={`relative ${showValue ? "animate-prize-token-in" : "opacity-0"}`}>
          <div
            className="absolute -inset-3 rounded-2xl blur-xl opacity-50"
            style={{ background: colorScheme.main }}
          />
          <div
            className="relative flex h-[7.25rem] w-[5.5rem] sm:h-32 sm:w-24 flex-col items-center justify-center overflow-hidden rounded-2xl border"
            style={{
              background: "linear-gradient(180deg, #16161b 0%, #0A0A0D 100%)",
              borderColor: colorScheme.accent,
              boxShadow: `0 10px 32px ${colorScheme.main}55, inset 0 1px 0 rgba(255,255,255,0.12)`,
            }}
          >
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: colorScheme.accent }} />
            <span className="mb-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
              Revealed
            </span>
            <span
              className={`
                font-prize text-center px-2 leading-tight text-[#fff8ee]
                ${value === "R" || (typeof value === "string" && (value.includes("£") || value.includes("pts")))
                  ? "text-2xl sm:text-3xl"
                  : typeof value === "string" && value.length > 12
                    ? "text-xs sm:text-sm"
                    : "text-base sm:text-lg"}
              `}
            >
              {value || "?"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const motion =
    isInflating
      ? "balloon-inflate 0.11s ease-out forwards"
      : isAnimating
        ? "balloon-burst 0.08s ease-in forwards"
        : disabled
          ? "none"
          : isActive
            ? "balloon-drift-live 1.8s ease-in-out infinite"
            : `balloon-drift ${3.4 + index * 0.45}s ease-in-out infinite`;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative
        ${disabled ? "opacity-35 cursor-not-allowed grayscale-[0.15]" : "cursor-pointer"}
      `}
      style={{
        width: "140px",
        height: "170px",
        animation: motion,
        animationDelay: isInflating || isAnimating ? "0s" : `${index * 0.35}s`,
      }}
      data-testid={`balloon-${index}`}
    >
      {isActive && !disabled && (
        <>
          <div
            className="absolute bottom-2 left-1/2 h-10 w-24 -translate-x-1/2 rounded-full animate-spotlight"
            style={{
              background: `radial-gradient(ellipse, ${colorScheme.accent}55 0%, transparent 70%)`,
              filter: "blur(8px)",
            }}
          />
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-28 h-32 sm:w-32 sm:h-36 rounded-full"
            style={{
              background: `radial-gradient(ellipse, ${colorScheme.main}28 0%, transparent 70%)`,
              filter: "blur(12px)",
            }}
          />
        </>
      )}

      <div
        className={`
          absolute bottom-8 left-1/2 -translate-x-1/2
          w-24 h-28 sm:w-28 sm:h-32
          rounded-[50%_50%_48%_48%]
          ${!disabled && !isInflating && !isAnimating ? "hover:scale-110 active:scale-90 transition-transform duration-200" : ""}
        `}
        style={{
          background: `radial-gradient(ellipse at 30% 25%, ${colorScheme.light} 0%, ${colorScheme.main} 35%, ${colorScheme.dark} 100%)`,
          boxShadow: !disabled
            ? `0 12px 50px ${colorScheme.main}60, ${colorScheme.innerGlow}, inset 8px 8px 30px ${colorScheme.light}50, ${isActive ? colorScheme.glow : `0 0 40px ${colorScheme.main}40`}`
            : `0 4px 16px rgba(0,0,0,0.3)`,
          border: `2px solid ${isActive ? colorScheme.accent : colorScheme.rim}`,
        }}
      >
        <div
          className="absolute top-4 left-4 w-10 h-14 rounded-full blur-[3px]"
          style={{
            background: `linear-gradient(135deg, ${colorScheme.light} 0%, transparent 100%)`,
            opacity: 0.8,
          }}
        />
        <div
          className="absolute top-5 left-6 w-5 h-7 rounded-full"
          style={{
            background: `linear-gradient(135deg, white 0%, ${colorScheme.light} 100%)`,
            opacity: 0.9,
          }}
        />
        <div className="absolute top-8 left-9 w-2 h-2 rounded-full bg-white/80" />

        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-4xl sm:text-5xl font-black text-white/30 select-none"
            style={{ textShadow: `0 2px 10px ${colorScheme.dark}` }}
          >
            ?
          </span>
        </div>

        {isActive && !disabled && (
          <div
            className="absolute inset-0 rounded-[50%_50%_48%_48%] animate-pulse-glow"
            style={{ boxShadow: colorScheme.glow }}
          />
        )}
      </div>

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

      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center"
        style={{
          transformOrigin: "top",
          animation: disabled || isInflating || isAnimating ? "none" : "string-wave 3s ease-in-out infinite",
          animationDelay: `${index * 0.2}s`,
        }}
      >
        <div
          className="w-[2px] h-8"
          style={{ background: `linear-gradient(to bottom, ${colorScheme.dark}, #8A6E18)` }}
        />
        <div
          className="w-3 h-3 rounded-full border-2 border-b-0"
          style={{ borderColor: "#8A6E18" }}
        />
      </div>

    </button>
  );
}

interface RingtonePopGameProps {
  orderId: string;
  competitionId: string;
  playsRemaining: number;
  ticketCount?: number;
  onPlayComplete: (result: any) => void;
  onRefresh: () => void;
  onAllPlaysComplete?: () => void;
  /** Keep the empty-pops overlay closed so players can read results first. */
  suppressOutOfPlays?: boolean;
}

export default function RingtonePopGame({
  orderId,
  competitionId,
  playsRemaining,
  ticketCount,
  onPlayComplete,
  onRefresh,
  onAllPlaysComplete,
  suppressOutOfPlays = false,
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
  // Track remaining plays from the play API so the last round isn't stuck
  // waiting on a parent refresh before we can show "No Pops Left".
  const [localPlaysRemaining, setLocalPlaysRemaining] = useState(playsRemaining);
  
  const allPlaysUsed = popHistory.length > 0 && popHistory.every(s => s.status === "PLAYED");
  
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isPlaying && !isLoading) {
      setLocalPlaysRemaining(playsRemaining);
    }
  }, [playsRemaining, isPlaying, isLoading]);

  useEffect(() => {
    if (suppressOutOfPlays) setShowOutOfPlaysDialog(false);
  }, [suppressOutOfPlays]);

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
    const colors = ["#F1D47A", "#D4AF37", "#C8102E", "#FF263D", "#fff8ee", "#8A6E18"];
    
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
    if (isPlaying || isLoading) return;
    if (localPlaysRemaining <= 0) {
      setShowOutOfPlaysDialog(true);
      return;
    }

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
      if (typeof data.playsRemaining === "number") {
        setLocalPlaysRemaining(data.playsRemaining);
      }
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
  const lastPopGone = localPlaysRemaining < 1 && !isFreeReplay;

  const handleResultPrimary = () => {
    closeModalAndReset();
    if (lastPopGone && isNoWin) {
      setShowOutOfPlaysDialog(true);
    }
  };

  return (
    <>
      <Card className="rr-pop-panel relative overflow-hidden rounded-2xl border border-[#C8102E]/35 bg-[#050505] shadow-[0_0_0_1px_rgba(241,212,122,0.08),0_0_70px_rgba(200,16,46,0.14),0_28px_80px_rgba(0,0,0,0.7)]">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 50% 0%, rgba(200, 16, 46, 0.18) 0%, transparent 42%),
              radial-gradient(ellipse at 80% 100%, rgba(241, 212, 122, 0.08) 0%, transparent 40%),
              linear-gradient(180deg, #0A0A0D 0%, #050505 100%)
            `,
          }}
        />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {STAGE_SPECKS.map((speck, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${speck.size}px`,
                height: `${speck.size}px`,
                left: `${speck.left}%`,
                top: `${speck.top}%`,
                background: speck.color,
                boxShadow: `0 0 12px ${speck.color}`,
                animation: `float-particle-game ${speck.duration}s ease-in-out infinite`,
                animationDelay: `${speck.delay}s`,
                opacity: speck.opacity * 0.7,
              }}
            />
          ))}
        </div>

        <CardContent className="relative z-10 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F1D47A]/30 bg-[#F1D47A]/10 px-3 py-1.5">
              <span className="font-prize text-2xl leading-none text-[#F1D47A]">{localPlaysRemaining}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">
                {localPlaysRemaining === 1 ? "play left" : "plays left"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              data-testid="button-mute"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#F1D47A]/20 bg-black/40 px-4 py-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Match 3 to win</span>
            <div className="text-right">
              <p className="font-prize text-2xl leading-none text-[#F1D47A] sm:text-3xl">£5,000</p>
              <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/35">top prize</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#08080b]">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#F1D47A]/60 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#C8102E]/15 via-transparent to-transparent" />
            <div
              className="pointer-events-none absolute bottom-8 left-1/2 h-16 w-64 -translate-x-1/2 rounded-full blur-2xl"
              style={{ background: isPlaying ? "rgba(241,212,122,0.18)" : "rgba(200,16,46,0.12)" }}
            />
            {STAGE_MOTES.map((mote, i) => (
              <div
                key={i}
                className="pointer-events-none absolute bottom-6 h-1.5 w-1.5 rounded-full"
                style={{
                  left: `${mote.left}%`,
                  background: mote.color,
                  boxShadow: `0 0 8px ${mote.color}`,
                  animation: `mote-rise ${mote.duration}s linear infinite`,
                  animationDelay: `${mote.delay}s`,
                  opacity: 0.55,
                }}
              />
            ))}

            <div className="rr-pop-arena relative flex min-h-[220px] items-end justify-center gap-1 px-1 pb-6 pt-8 sm:min-h-[300px] sm:gap-3 sm:px-4">
              {[0, 1, 2].map((index) => {
                const live = isPlaying && index === currentBalloonIndex;
                const done = poppedBalloons[index];
                return (
                  <div
                    key={index}
                    className="flex min-w-0 flex-col items-center"
                    style={{ transform: `translateY(${LANE_LIFT[index]}px)` }}
                  >
                    <div className="rr-pop-balloon-slot">
                      <div className="rr-pop-balloon-scale">
                    <Balloon
                      index={index}
                      value={balloonValues[index]}
                      isPopped={done}
                      onPop={() => handleBalloonPop(index)}
                      disabled={!isPlaying || index !== currentBalloonIndex || !gameResult}
                      isMuted={isMuted}
                      isActive={live}
                    />
                      </div>
                    </div>
                    <div
                      className={`mt-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${
                        done
                          ? "border border-[#F1D47A]/35 bg-[#F1D47A]/10 text-[#F1D47A]"
                          : live
                            ? "border border-[#FF263D]/40 bg-[#C8102E]/20 text-[#FF263D]"
                            : "border border-white/10 text-white/30"
                      }`}
                    >
                      {done ? "Popped" : live ? "Tap" : `0${index + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`rounded-xl border px-2 py-2.5 text-center ${
                  poppedBalloons[index]
                    ? "border-[#F1D47A]/35 bg-[#F1D47A]/[0.07]"
                    : isPlaying && index === currentBalloonIndex
                      ? "border-[#C8102E]/40 bg-[#C8102E]/10"
                      : "border-white/10 bg-black/30"
                }`}
              >
                <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
                  Balloon {index + 1}
                </p>
                <p className="font-prize text-lg leading-none text-[#fff8ee] sm:text-xl">
                  {poppedBalloons[index] ? balloonValues[index] : "?"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col items-center">
            {!isPlaying && !showResultModal && (
              <button
                type="button"
                onClick={startGame}
                disabled={isLoading}
                className="rr-cta w-full max-w-sm rounded-xl px-8 py-4 text-base sm:text-lg"
                data-testid="button-start-game"
              >
                {isLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading...
                  </span>
                ) : localPlaysRemaining <= 0 ? (
                  "Get more pops"
                ) : (
                  <span className="inline-flex items-center justify-center gap-2 font-prize tracking-wide">
                    <Sparkles className="h-5 w-5" />
                    Pop to play
                  </span>
                )}
              </button>
            )}

            {isPlaying && !showResultModal && (
              <p className="text-center text-sm text-white/55">
                Tap the glowing balloon
                <span className="mx-1.5 text-[#F1D47A]">·</span>
                <span className="font-prize text-[#F1D47A]">{currentBalloonIndex + 1} of 3</span>
              </p>
            )}
          </div>
        </CardContent>

        <style>{`
          .rr-pop-arena {
            container-type: inline-size;
            --pop-s: 0.62;
          }
          @supports (width: 1cqi) {
            .rr-pop-arena { --pop-s: clamp(0.56, calc(100cqi / 430), 1); }
          }
          @media (min-width: 640px) {
            .rr-pop-arena { --pop-s: 1; }
          }
          .rr-pop-balloon-slot {
            width: calc(140px * var(--pop-s));
            height: calc(170px * var(--pop-s));
          }
          .rr-pop-balloon-scale {
            width: 140px;
            height: 170px;
            transform: scale(var(--pop-s));
            transform-origin: top center;
          }

          @keyframes balloon-drift {
            0%, 100% { transform: translate(0, 0) rotate(-2deg); }
            25% { transform: translate(6px, -14px) rotate(3deg); }
            50% { transform: translate(-4px, -8px) rotate(-1deg); }
            75% { transform: translate(5px, -18px) rotate(2deg); }
          }

          @keyframes balloon-drift-live {
            0%, 100% { transform: translate(0, -4px) scale(1.06) rotate(-2deg); }
            50% { transform: translate(0, -16px) scale(1.1) rotate(2deg); }
          }

          @keyframes mote-rise {
            0% { transform: translateY(0); opacity: 0; }
            15% { opacity: 0.7; }
            100% { transform: translateY(-160px); opacity: 0; }
          }

          @keyframes prize-token-in {
            0% { transform: translateY(18px) scale(0.7); opacity: 0; }
            60% { transform: translateY(-4px) scale(1.06); opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }

          @keyframes spotlight {
            0%, 100% { opacity: 0.45; transform: translateX(-50%) scaleX(0.85); }
            50% { opacity: 0.9; transform: translateX(-50%) scaleX(1.1); }
          }

          @keyframes balloon-inflate {
            0% { transform: scale(1) rotate(0deg); }
            35% { transform: scale(1.18, 0.9) rotate(-5deg); }
            70% { transform: scale(0.92, 1.16) rotate(4deg); }
            100% { transform: scale(1.32) rotate(0deg); }
          }

          @keyframes balloon-burst {
            0% { transform: scale(1.32); opacity: 1; }
            100% { transform: scale(0); opacity: 0; }
          }

          @keyframes pop-flash {
            0% { opacity: 0.95; transform: scale(0.4); }
            100% { opacity: 0; transform: scale(1.8); }
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
            0% { transform: scale(0.4); opacity: 1; }
            100% { transform: scale(3.2); opacity: 0; }
          }

          @keyframes shockwave-mid {
            0% { transform: scale(0.3); opacity: 0.9; }
            100% { transform: scale(2.6); opacity: 0; }
          }

          @keyframes shockwave-late {
            0% { transform: scale(0.5); opacity: 0.7; }
            100% { transform: scale(3.8); opacity: 0; }
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
          
          .animate-prize-token-in { animation: prize-token-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          .animate-spotlight { animation: spotlight 1.4s ease-in-out infinite; }
          .animate-prize-reveal-bounce { animation: prize-reveal-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          .animate-pulse-glow { animation: pulse-glow 1s ease-in-out infinite; }
          .animate-shockwave { animation: shockwave 0.45s ease-out forwards; }
          .animate-shockwave-mid { animation: shockwave-mid 0.5s 0.05s ease-out forwards; }
          .animate-shockwave-late { animation: shockwave-late 0.55s 0.1s ease-out forwards; }
          .animate-pop-flash { animation: pop-flash 0.18s ease-out forwards; }
          .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        `}</style>
      </Card>

      {/* Ringtone Pop-themed No Plays Dialog */}
      <AlertDialog open={showOutOfPlaysDialog} onOpenChange={setShowOutOfPlaysDialog}>
        <AlertDialogContent className="rr-pop-panel max-w-[360px] p-0 overflow-hidden border-0 bg-transparent">
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: '28px',
              border: '2px solid rgba(241, 212, 122, 0.35)',
              background: 'linear-gradient(170deg, rgba(10,10,13,0.98) 0%, rgba(5,5,5,0.99) 100%)',
              boxShadow: '0 0 80px rgba(200,16,46,0.2), 0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.7)',
            }}
          >
            <div className="absolute top-0 left-0 w-16 h-16 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C8102E] to-[#FF263D] rounded-full blur-xl" />
            </div>
            <div className="absolute bottom-0 right-0 w-20 h-20 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-tl from-[#F1D47A] to-[#D4AF37] rounded-full blur-xl" />
            </div>
            
            <div className="absolute top-3 right-8 w-3 h-4 rounded-full bg-[#C8102E]/40 animate-float-slow" />
            <div className="absolute bottom-6 left-4 w-2.5 h-3.5 rounded-full bg-[#F1D47A]/40 animate-float-slower" />
            <div className="absolute top-12 left-6 w-2 h-3 rounded-full bg-[#D4AF37]/40 animate-float" />

            <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-[#C8102E]/40 rounded-tl-xl" />
            <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-[#F1D47A]/40 rounded-tr-xl" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-[#F1D47A]/40 rounded-bl-xl" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-[#C8102E]/40 rounded-br-xl" />

            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8102E] via-[#F1D47A] to-transparent" />

            <div className="absolute inset-0 pointer-events-none opacity-10" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
            }} />

            <div className="px-6 pt-10 pb-6 text-center relative z-10">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full animate-ping" style={{ 
                  background: 'radial-gradient(circle, rgba(200,16,46,0.18) 0%, transparent 70%)',
                  animation: 'pop-ping 1.5s ease-out infinite'
                }} />
                
                <div
                  className="relative w-28 h-28 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle at 38% 32%, rgba(200,16,46,0.22) 0%, rgba(241,212,122,0.08) 60%, transparent 100%)',
                    border: '2px solid rgba(241,212,122,0.4)',
                    boxShadow: '0 0 30px rgba(200,16,46,0.25), inset 0 0 20px rgba(241,212,122,0.12)',
                  }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C8102E]/70 to-[#7A0A1C]/70 transform scale-y-75">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-4 w-0.5 h-10 bg-gradient-to-b from-[#F1D47A]/60 to-transparent" />
                    </div>
                    <div className="absolute top-8 left-4 w-2 h-2 rounded-full bg-white/80" />
                    <div className="absolute top-8 right-4 w-2 h-2 rounded-full bg-white/80" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-white/60" />
                  </div>
                  
                  <Popcorn className="absolute -top-2 -right-2 w-5 h-5 text-[#F1D47A]/60 rotate-12" />
                </div>
                
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-[#F1D47A]/40 to-transparent animate-float-string" />
              </div>

              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle className="text-4xl text-center font-black mb-2" style={{
                  background: 'linear-gradient(135deg, #fff8ee 0%, #F1D47A 50%, #C8102E 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 12px rgba(200,16,46,0.35))',
                }}>
                  NO POPS LEFT
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[#F1D47A]/80 text-sm tracking-wide font-medium">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-[#F1D47A]" />
                    <span className="text-[10px] tracking-[0.25em]">BALLOON MAGAZINE EMPTY</span>
                    <Zap className="w-4 h-4 text-[#F1D47A]" />
                  </div>
                  
                  <div className="flex justify-center gap-1.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="relative">
                        <div
                          className="w-5 h-6 rounded-full"
                          style={{
                            background: i < 1 ? 'rgba(200,16,46,0.22)' : 'rgba(241,212,122,0.06)',
                            border: '1px solid rgba(241,212,122,0.2)',
                          }}
                        />
                        {i === 0 && (
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-px h-2 bg-[#F1D47A]/30" />
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
                    background: 'linear-gradient(90deg, rgba(200,16,46,0.2) 0%, rgba(241,212,122,0.12) 100%)',
                    border: '2px solid rgba(241,212,122,0.35)',
                    color: '#F1D47A',
                    boxShadow: '0 0 20px rgba(241,212,122,0.08) inset, 0 0 30px rgba(200,16,46,0.2)',
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
                  BACK TO RESULTS
                </AlertDialogCancel>
              </div>

              <p className="text-[8px] text-[#F1D47A]/25 mt-4 tracking-widest font-mono">
                BALLOONS: 0/5 • PARTY MODE • READY FOR REFILL
              </p>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Result overlay */}
      <GameResultOverlay
        open={showResultModal && !!gameResult}
        kind={isPhysicalWin ? "physical" : isWin ? "win" : isFreeReplay ? "extra" : "lose"}
        onClose={closeModalAndReset}
        kicker={
          isPhysicalWin
            ? "Physical prize"
            : isWin
              ? "3 match"
              : isFreeReplay
                ? "Free play"
                : "No match"
        }
        title={isPhysicalWin || isWin ? "YOU WON" : isFreeReplay ? "FREE PLAY" : "UNLUCKY"}
        subtitle={
          isPhysicalWin
            ? gameResult?.prizeName || "Physical prize"
            : isWin
              ? "Match complete — prize credited"
              : isFreeReplay
                ? "You earned another pop"
                : "Pops didn't match"
        }
        prizeText={isWin || isPhysicalWin || isFreeReplay ? (isFreeReplay ? "+1 Free Play" : getPrizeDisplay()) : undefined}
        prizeSub={
          isPhysicalWin
            ? "Contact support to claim"
            : isWin
              ? "Verified & credited"
              : isFreeReplay
                ? "Use it on your next pop"
                : undefined
        }
        extra={
          <div className="mb-4 flex justify-center gap-2">
            {balloonValues.map((value, i) => (
              <div
                key={i}
                className="min-w-[64px] rounded-xl border border-[#F1D47A]/25 bg-[#F1D47A]/[0.06] px-3 py-2 text-sm font-semibold text-[#F1D47A]"
              >
                {value}
              </div>
            ))}
          </div>
        }
        body={
          isNoWin
            ? lastPopGone
              ? "That was your last pop. Check your results, or grab more to keep playing."
              : "You didn't win this time but the next pop could be your moment."
            : undefined
        }
        primaryLabel={
          isWin || isPhysicalWin
            ? "Collect & continue"
            : isFreeReplay
              ? "Use free play"
              : lastPopGone
                ? "Get more pops"
                : "Try again"
        }
        onPrimary={handleResultPrimary}
        closeTestId="button-close-result"
        primaryTestId="button-continue"
      />

      <style>{`
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