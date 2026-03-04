import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Zap, Trophy, RotateCcw, PowerOff, ShieldCheck, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";
import { playWinSound, playPowerDown, playBackupPower, disposeAudioContext } from "@/lib/voltz-sounds";
import surgeSoundUrl from "@assets/surgessound_1772193798276.mp3";

interface VoltzGameProps {
  orderId: string;
  competitionId: string;
  playsRemaining: number;
  onPlayComplete: (newPlaysRemaining: number) => void;
}

interface PlayResult {
  outcome: "noWin" | "win" | "freeReplay";
  switchChosen: number;
  rewardType: string;
  rewardValue: string;
  prizeName: string;
  prizeId?: string;
  isWin: boolean;
  switchTexts: string[];
}

function fireWinConfetti() {
  const duration = 5000;
  const end = Date.now() + duration;
  const colors = ["#eab308", "#f59e0b", "#fbbf24", "#fcd34d", "#ffffff", "#fef08a", "#d4af37", "#f5d76e"];

  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.4, x: 0.5 },
    colors,
    zIndex: 9999,
    startVelocity: 45,
    gravity: 0.8,
    scalar: 1.2,
    ticks: 300,
  });

  setTimeout(() => {
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.5 },
      colors,
      zIndex: 9999,
      startVelocity: 55,
      gravity: 0.9,
      scalar: 1.1,
      ticks: 250,
    });
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.5 },
      colors,
      zIndex: 9999,
      startVelocity: 55,
      gravity: 0.9,
      scalar: 1.1,
      ticks: 250,
    });
  }, 200);

  setTimeout(() => {
    confetti({
      particleCount: 150,
      spread: 160,
      origin: { y: 0.35, x: 0.5 },
      colors,
      zIndex: 9999,
      startVelocity: 35,
      gravity: 0.6,
      scalar: 1.4,
      ticks: 350,
      shapes: ['circle', 'square'],
    });
  }, 600);

  const sideFrame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 45,
      origin: { x: 0, y: 0.65 },
      colors,
      zIndex: 9999,
      startVelocity: 40,
      gravity: 1,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 45,
      origin: { x: 1, y: 0.65 },
      colors,
      zIndex: 9999,
      startVelocity: 40,
      gravity: 1,
    });
    if (Date.now() < end) requestAnimationFrame(sideFrame);
  };
  sideFrame();

  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 120,
      origin: { y: 0.5, x: 0.3 },
      colors,
      zIndex: 9999,
      startVelocity: 30,
      gravity: 0.5,
      scalar: 1.3,
      ticks: 300,
    });
    confetti({
      particleCount: 100,
      spread: 120,
      origin: { y: 0.5, x: 0.7 },
      colors,
      zIndex: 9999,
      startVelocity: 30,
      gravity: 0.5,
      scalar: 1.3,
      ticks: 300,
    });
  }, 1500);

  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 180,
      origin: { y: 0.3, x: 0.5 },
      colors: ["#ffd700", "#ffffff", "#f5d76e"],
      zIndex: 9999,
      startVelocity: 25,
      gravity: 0.4,
      scalar: 1.5,
      ticks: 400,
    });
  }, 3000);
}

function fireBackupConfetti() {
  const colors = ["#06b6d4", "#22d3ee", "#67e8f9", "#a5f3fc", "#ffffff", "#0ea5e9"];
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.45, x: 0.5 },
    colors,
    zIndex: 9999,
    startVelocity: 35,
    gravity: 0.7,
    scalar: 1.2,
    ticks: 250,
  });
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
      zIndex: 9999,
      startVelocity: 40,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
      zIndex: 9999,
      startVelocity: 40,
    });
  }, 300);
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 140,
      origin: { y: 0.4, x: 0.5 },
      colors,
      zIndex: 9999,
      startVelocity: 25,
      gravity: 0.5,
      scalar: 1.3,
      ticks: 300,
    });
  }, 800);
}

export default function VoltzGameComponent({
  orderId,
  competitionId,
  playsRemaining,
  onPlayComplete,
}: VoltzGameProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<any>(null);
  const gameSceneRef = useRef<any>(null);
  const { toast } = useToast();
  const [isGameReady, setIsGameReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<PlayResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultAnimStage, setResultAnimStage] = useState(0);

  const orderIdRef = useRef(orderId);
  const competitionIdRef = useRef(competitionId);
  const playsRemainingRef = useRef(playsRemaining);
  const onPlayCompleteRef = useRef(onPlayComplete);
  const isProcessingRef = useRef(false);
  const toastRef = useRef(toast);
  const lastServerPlaysRef = useRef<number | null>(null);
  const resultTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastResultRef = useRef<PlayResult | null>(null);
  const surgeAudioRef = useRef<HTMLAudioElement | null>(null);
  const roundResultRef = useRef<PlayResult | null>(null);
  const roundStartedRef = useRef(false);

  const particlePositions = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      left: `${5 + ((i * 7 + 13) % 90)}%`,
      top: `${5 + ((i * 11 + 7) % 90)}%`,
      delay: `${i * 0.1}s`,
      size: i % 3 === 0 ? 'w-1.5 h-1.5' : 'w-1 h-1',
    })), []);

  useEffect(() => { orderIdRef.current = orderId; }, [orderId]);
  useEffect(() => { competitionIdRef.current = competitionId; }, [competitionId]);
  useEffect(() => { playsRemainingRef.current = playsRemaining; }, [playsRemaining]);
  useEffect(() => { onPlayCompleteRef.current = onPlayComplete; }, [onPlayComplete]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const closeResult = useCallback(() => {
    resultTimersRef.current.forEach(t => clearTimeout(t));
    resultTimersRef.current = [];
    try { if (surgeAudioRef.current) { surgeAudioRef.current.pause(); surgeAudioRef.current.currentTime = 0; } } catch (e) {}
    setShowResult(false);
    setResultAnimStage(0);

    if (gameSceneRef.current) {
      gameSceneRef.current.resetRound();
    }
    roundResultRef.current = null;
    roundStartedRef.current = false;

    const plays = lastServerPlaysRef.current;
    onPlayCompleteRef.current(plays !== null ? plays : playsRemainingRef.current);
    lastServerPlaysRef.current = null;
  }, []);

const handleSwitchPress = useCallback(async (switchIndex: number) => {
  if (roundStartedRef.current && roundResultRef.current) {
    if (gameSceneRef.current) {
      gameSceneRef.current.deliverResult({
        outcome: roundResultRef.current.outcome,
        switchTexts: roundResultRef.current.switchTexts,
        prizeName: roundResultRef.current.prizeName,
        rewardValue: roundResultRef.current.rewardValue,
        rewardType: roundResultRef.current.rewardType,
      });
    }
    return;
  }

  if (playsRemainingRef.current <= 0 || isProcessingRef.current) {
    if (gameSceneRef.current) {
      gameSceneRef.current.isPlaying = false;
    }
    return;
  }

  isProcessingRef.current = true;
  setIsProcessing(true);

  try {
    const res = await apiRequest("/api/play-voltz", "POST", {
      orderId: orderIdRef.current,
      competitionId: competitionIdRef.current,
      switchChosen: switchIndex,
    });

    const data = await res.json();

    if (!data.success) {
      try { if (surgeAudioRef.current) { surgeAudioRef.current.pause(); surgeAudioRef.current.currentTime = 0; } } catch (e) {}
      toastRef.current({
        title: "Error",
        description: data.message || "Failed to play",
        variant: "destructive",
      });
      if (gameSceneRef.current) {
        gameSceneRef.current.isPlaying = false;
      }
      isProcessingRef.current = false;
      setIsProcessing(false);
      return;
    }

    if (data.playsRemaining !== undefined) {
      lastServerPlaysRef.current = data.playsRemaining;
      playsRemainingRef.current = data.playsRemaining;
    }

    const result: PlayResult = {
      outcome: data.result.outcome,
      switchChosen: switchIndex,
      rewardType: data.result.rewardType,
      rewardValue: data.result.rewardValue,
      prizeName: data.result.prizeName,
      isWin: data.result.isWin,
      switchTexts: data.result.switchTexts || ["?", "?", "?"],
      prizeId: data.result.prizeId, // Add this to PlayResult interface
    };

    setLastResult(result);
    lastResultRef.current = result;
    roundResultRef.current = result;
    roundStartedRef.current = true;

    if (gameSceneRef.current) {
      gameSceneRef.current.deliverResult({
        outcome: result.outcome,
        switchTexts: result.switchTexts,
        prizeName: result.prizeName,
        rewardValue: result.rewardValue,
        rewardType: result.rewardType,
      });
    }

    // Don't show result yet - wait for all buttons
    // queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    // queryClient.invalidateQueries({ queryKey: ["/api/voltz-order", orderIdRef.current] });
  } catch (err) {
    try { if (surgeAudioRef.current) { surgeAudioRef.current.pause(); surgeAudioRef.current.currentTime = 0; } } catch (e) {}
    toastRef.current({
      title: "Error",
      description: "Network error. Please try again.",
      variant: "destructive",
    });
    if (gameSceneRef.current) {
      gameSceneRef.current.isPlaying = false;
    }
  } finally {
    isProcessingRef.current = false;
    setIsProcessing(false);
  }
}, []);

const confirmGameResult = useCallback(async () => {
  if (!lastResultRef.current || !orderIdRef.current) return;

  try {
    const res = await apiRequest("/api/confirm-voltz-result", "POST", {
      orderId: orderIdRef.current,
      result: {
        outcome: lastResultRef.current.outcome,
        rewardType: lastResultRef.current.rewardType,
        rewardValue: lastResultRef.current.rewardValue,
        prizeName: lastResultRef.current.prizeName,
        prizeId: lastResultRef.current.prizeId,
        switchChosen: lastResultRef.current.switchChosen,
      },
    });

    const data = await res.json();
    if (data.success) {
      // Now invalidate queries after confirmation
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/voltz-order", orderIdRef.current] });
    }
  } catch (error) {
    console.error("Error confirming game result:", error);
  }
}, []);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    let game: any = null;
    let destroyed = false;

    const initGame = async () => {
      const Phaser = await import("phaser");
      const { Boot } = await import("./voltz/Boot");
      const { Preload } = await import("./voltz/Preload");
      const { VoltzGame } = await import("./voltz/VoltzGame");

      if (!gameContainerRef.current || destroyed) return;

      const config: any = {
        type: Phaser.AUTO,
        width: 1024,
        height: 1536,
        parent: gameContainerRef.current,
        backgroundColor: "#000000",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        input: {
          touch: {
            capture: false,
          },
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [Boot, Preload, VoltzGame],
      };

      game = new Phaser.Game(config);
      gameInstanceRef.current = game;

      const applyTouchAction = () => {
        const canvas = gameContainerRef.current?.querySelector('canvas');
        if (canvas) {
          canvas.style.touchAction = 'pan-y';
        } else {
          requestAnimationFrame(applyTouchAction);
        }
      };
      requestAnimationFrame(applyTouchAction);

      const pollForScene = () => {
        if (destroyed) return;

        const gameScene = game?.scene?.getScene("Game") as any;
        if (gameScene && gameScene.scene?.isActive() && gameScene.isPlaying !== undefined) {
          gameSceneRef.current = gameScene;
          setIsGameReady(true);

          gameScene.setCallbacks({
            onSwitchPressed: (switchIndex: number) => {
              handleSwitchPress(switchIndex);
            },
          });

          game.events.on("electricStart", () => {
            try {
              if (!surgeAudioRef.current) {
                surgeAudioRef.current = new Audio(surgeSoundUrl);
                surgeAudioRef.current.loop = true;
              }
              surgeAudioRef.current.currentTime = 0;
              surgeAudioRef.current.volume = 0.6;
              surgeAudioRef.current.play().catch(() => {});
            } catch (e) {}
          });

          game.events.on("electricStop", () => {
            try {
              if (surgeAudioRef.current) {
                surgeAudioRef.current.pause();
                surgeAudioRef.current.currentTime = 0;
              }
            } catch (e) {}
          });

         game.events.on("gameComplete", () => {
  resultTimersRef.current.forEach(t => clearTimeout(t));
  resultTimersRef.current = [];

  const currentResult = lastResultRef.current;
  
  // Confirm the result with the server before showing
  confirmGameResult().then(() => {
    if (currentResult?.isWin) {
      fireWinConfetti();
      playWinSound();
    } else if (currentResult?.outcome === "freeReplay") {
      fireBackupConfetti();
      playBackupPower();
    } else {
      playPowerDown();
    }

    setResultAnimStage(0);
    setShowResult(true);
    resultTimersRef.current.push(setTimeout(() => setResultAnimStage(1), 50));
    resultTimersRef.current.push(setTimeout(() => setResultAnimStage(2), 300));
  });
});
        } else {
          setTimeout(pollForScene, 200);
        }
      };

      setTimeout(pollForScene, 500);
    };

    initGame();

    return () => {
      destroyed = true;
      resultTimersRef.current.forEach(t => clearTimeout(t));
      resultTimersRef.current = [];
      try {
        if (surgeAudioRef.current) {
          surgeAudioRef.current.pause();
          surgeAudioRef.current.currentTime = 0;
          surgeAudioRef.current = null;
        }
      } catch (e) {}
      disposeAudioContext();
      if (game) {
        try {
          game.destroy(true);
        } catch (e) {}
        gameInstanceRef.current = null;
        gameSceneRef.current = null;
      }
    };
  }, [handleSwitchPress]);

  useEffect(() => {
    if (gameSceneRef.current) {
      const enabled = (playsRemaining > 0 && !isProcessing) || roundStartedRef.current;
      gameSceneRef.current.setButtonsEnabled(enabled);
    }
  }, [playsRemaining, isProcessing]);

  return (
    <div className="relative w-full" data-testid="voltz-game-container">
      <div
        ref={gameContainerRef}
        className="w-full aspect-[2/3] max-w-[512px] mx-auto rounded-xl overflow-hidden border border-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.08)]"
        style={{ touchAction: 'pan-y' }}
        data-testid="voltz-game-canvas"
      />

      {!isGameReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-xl" data-testid="loading-overlay">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-yellow-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-600/20 border border-yellow-500/40 flex items-center justify-center">
                <Zap className="w-10 h-10 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <p className="text-white text-lg font-black tracking-wider" data-testid="text-loading">CHARGING UP...</p>
            <div className="mt-3 w-32 h-1 mx-auto bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      )}

      {playsRemaining <= 0 && isGameReady && !isProcessing && !showResult && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl z-10" data-testid="no-plays-overlay">
          <div className="relative max-w-sm mx-4 p-8 rounded-2xl bg-gradient-to-b from-gray-900 via-gray-900 to-black border border-gray-700/50 shadow-2xl text-center">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-transparent" />
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <PowerOff className="w-10 h-10 text-red-400" />
              </div>
              <p className="text-white text-xl font-black tracking-wide mb-2" data-testid="text-no-plays">POWER DEPLETED</p>
              <p className="text-gray-500 text-sm">Purchase more entries to recharge</p>
              <div className="mt-4 flex justify-center gap-1" data-testid="depleted-bars">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-6 h-1.5 rounded-full bg-red-500/20" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showResult && lastResult && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl z-20"
          style={{
            background: lastResult.isWin
              ? 'radial-gradient(ellipse at center, rgba(234,179,8,0.4) 0%, rgba(0,0,0,0.9) 65%)'
              : lastResult.outcome === "freeReplay"
              ? 'radial-gradient(ellipse at center, rgba(6,182,212,0.3) 0%, rgba(0,0,0,0.9) 65%)'
              : 'radial-gradient(ellipse at center, rgba(239,68,68,0.25) 0%, rgba(0,0,0,0.92) 65%)'
          }}
          data-testid="result-overlay"
        >
          {lastResult.isWin && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {particlePositions.map((pos, i) => (
                <div key={i} className={`absolute ${pos.size} rounded-full animate-ping`}
                     style={{
                       left: pos.left,
                       top: pos.top,
                       animationDelay: pos.delay,
                       animationDuration: '1.5s',
                       backgroundColor: i % 2 === 0 ? '#eab308' : '#fbbf24',
                     }} />
              ))}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse" />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent animate-pulse" />
            </div>
          )}

          <div className={`relative max-w-[320px] w-full mx-4 transition-all duration-600 ${resultAnimStage >= 1 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-90'}`}>
            <div className={`relative overflow-hidden rounded-3xl border-2 backdrop-blur-xl ${
              lastResult.isWin
                ? 'bg-gradient-to-b from-yellow-900/60 via-gray-900/90 to-black/95 border-yellow-400/50 shadow-[0_0_80px_rgba(234,179,8,0.3),0_0_30px_rgba(234,179,8,0.15)_inset]'
                : lastResult.outcome === "freeReplay"
                ? 'bg-gradient-to-b from-cyan-900/50 via-gray-900/90 to-black/95 border-cyan-400/40 shadow-[0_0_60px_rgba(6,182,212,0.2),0_0_20px_rgba(6,182,212,0.1)_inset]'
                : 'bg-gradient-to-b from-red-950/70 via-gray-900/95 to-black/95 border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.15),0_0_20px_rgba(239,68,68,0.1)_inset]'
            }`}>

              <button
                onClick={closeResult}
                className={`absolute top-3 right-3 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
                  lastResult.isWin
                    ? 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25'
                    : lastResult.outcome === "freeReplay"
                    ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25'
                    : 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
                }`}
                data-testid="button-close-result"
              >
                <X className="w-4 h-4" />
              </button>

              <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                lastResult.isWin ? 'bg-gradient-to-r from-transparent via-yellow-400 to-transparent'
                : lastResult.outcome === "freeReplay" ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
                : 'bg-gradient-to-r from-transparent via-red-500/60 to-transparent'
              }`} />

              <div className="px-6 pt-10 pb-8 text-center">
                <div className="flex justify-center gap-3 mb-6">
                  {lastResult.switchTexts.map((text, i) => (
                    <div key={i} className={`px-3 py-2 rounded-lg border text-sm font-black ${
                      lastResult.isWin
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        : lastResult.outcome === "freeReplay"
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`} data-testid={`text-switch-result-${i}`}>
                      {text}
                    </div>
                  ))}
                </div>

                {lastResult.isWin ? (
                  <>
                    <div className={`relative w-24 h-24 mx-auto mb-5 transition-all duration-700 ${resultAnimStage >= 2 ? 'scale-100 rotate-0' : 'scale-0 rotate-45'}`}>
                      <div className="absolute inset-0 rounded-full bg-yellow-500/25 animate-ping" style={{ animationDuration: '1.5s' }} />
                      <div className="absolute -inset-3 rounded-full bg-gradient-to-b from-yellow-400/25 to-transparent blur-lg" />
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500/40 via-yellow-600/25 to-amber-700/15 border-2 border-yellow-400/60 flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.4)]">
                        <Zap className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]" data-testid="icon-win" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        <p className="text-yellow-400 text-xs font-black tracking-[0.35em] uppercase" data-testid="text-result-label">POWER SURGE — 3 MATCH!</p>
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                      </div>
                    </div>

                    <p className="text-white text-2xl font-black tracking-tight mb-2 drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)]" data-testid="text-prize-name">{lastResult.prizeName}</p>

                    <div className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-yellow-500/15 to-amber-500/10 border border-yellow-500/30" data-testid="text-prize-value">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-300 text-lg font-black">
                        {lastResult.rewardType === "cash" ? `£${lastResult.rewardValue}` : `${lastResult.rewardValue} pts`}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-1.5 text-gray-600 text-[10px]">
                      <ShieldCheck className="w-3 h-3" />
                      <span data-testid="text-verified">Verified & Credited</span>
                    </div>
                  </>
                ) : lastResult.outcome === "freeReplay" ? (
                  <>
                    <div className={`relative w-24 h-24 mx-auto mb-5 transition-all duration-700 ${resultAnimStage >= 2 ? 'scale-100' : 'scale-0'}`}>
                      <div className="absolute -inset-3 rounded-full bg-gradient-to-b from-cyan-400/20 to-transparent blur-lg" />
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/30 via-cyan-600/20 to-teal-700/10 border-2 border-cyan-400/50 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.25)]">
                        <RotateCcw className="w-12 h-12 text-cyan-400 animate-[spin_2.5s_linear_infinite]" data-testid="icon-free-replay" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-cyan-500" />
                        <p className="text-cyan-400 text-xs font-black tracking-[0.35em] uppercase" data-testid="text-result-free-replay">BACKUP POWER — FREE PLAY!</p>
                        <Zap className="w-4 h-4 text-cyan-500" />
                      </div>
                    </div>

                    <p className="text-white text-xl font-black tracking-tight mb-2" data-testid="text-backup-title">Power Stabilized!</p>

                    <div className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 to-teal-500/10 border border-cyan-500/30" data-testid="text-free-play-badge">
                      <RotateCcw className="w-5 h-5 text-cyan-400" />
                      <span className="text-cyan-300 text-lg font-black">+1 Free Play</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`relative w-24 h-24 mx-auto mb-5 transition-all duration-700 ${resultAnimStage >= 2 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                      <div className="absolute -inset-3 rounded-full bg-gradient-to-b from-red-500/15 to-transparent blur-lg" />
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500/25 via-red-600/15 to-red-800/10 border-2 border-red-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                        <PowerOff className="w-12 h-12 text-red-400/80" data-testid="icon-no-win" />
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-red-500/70" />
                        <p className="text-red-400 text-xs font-black tracking-[0.35em] uppercase" data-testid="text-result-no-win">NO MATCH — SO CLOSE!</p>
                        <Zap className="w-4 h-4 text-red-500/70" />
                      </div>
                    </div>

                    <p className="text-white/80 text-lg font-bold">The switches didn't align</p>
                    <p className="text-red-300/40 text-sm mt-1">Match all 3 to win! Try again</p>
                  </>
                )}
              </div>

              <button
                onClick={closeResult}
                className={`w-full py-3 text-sm font-bold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.98] ${
                  lastResult.isWin
                    ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/15 text-yellow-400 border-t border-yellow-500/20'
                    : lastResult.outcome === "freeReplay"
                    ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/15 text-cyan-400 border-t border-cyan-500/20'
                    : 'bg-gradient-to-r from-red-500/15 to-red-600/10 text-red-400 border-t border-red-500/20'
                }`}
                data-testid="button-continue"
              >
                {lastResult.isWin ? "COLLECT & CONTINUE" : lastResult.outcome === "freeReplay" ? "USE FREE PLAY" : "TRY AGAIN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}