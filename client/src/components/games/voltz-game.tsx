import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Zap, Trophy, RotateCcw, PowerOff, ShieldCheck, Sparkles, X, Bolt, Swords, Gauge } from "lucide-react";
import confetti from "canvas-confetti";
import { playWinSound, playPowerDown, playBackupPower, disposeAudioContext } from "@/lib/voltz-sounds";
import surgeSoundUrl from "@assets/surgessound_1772193798276.mp3";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from "../ui/alert-dialog";
import { useLocation } from "wouter";

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
  const colors = ["#eab308", "#f59e0b", "#fbbf24", "#ffffff"];
  confetti({ particleCount: 60, spread: 90, origin: { y: 0.4, x: 0.5 }, colors, startVelocity: 35, gravity: 0.9, scalar: 1.1, ticks: 200 });
  setTimeout(() => {
    confetti({ particleCount: 40, angle: 60, spread: 60, origin: { x: 0, y: 0.5 }, colors, startVelocity: 40 });
    confetti({ particleCount: 40, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors, startVelocity: 40 });
  }, 200);
  setTimeout(() => {
    confetti({ particleCount: 70, spread: 140, origin: { y: 0.35, x: 0.5 }, colors, scalar: 1.2, ticks: 250 });
  }, 600);
}

function fireBackupConfetti() {
  const colors = ["#06b6d4", "#22d3ee", "#ffffff"];
  confetti({ particleCount: 50, spread: 100, origin: { y: 0.45, x: 0.5 }, colors, startVelocity: 30, gravity: 0.8, ticks: 200 });
  setTimeout(() => {
    confetti({ particleCount: 30, angle: 60, spread: 50, origin: { x: 0, y: 0.6 }, colors });
    confetti({ particleCount: 30, angle: 120, spread: 50, origin: { x: 1, y: 0.6 }, colors });
  }, 250);
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
  const [showNoPlaysDialog, setShowNoPlaysDialog] = useState(false);

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
  
  const [,setLocation] = useLocation();

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

  // Show dialog when plays run out
  useEffect(() => {
    if (playsRemaining <= 0 && isGameReady && !isProcessing && !showResult) {
      setShowNoPlaysDialog(true);
    } else {
      setShowNoPlaysDialog(false);
    }
  }, [playsRemaining, isGameReady, isProcessing, showResult]);

  const closeResult = useCallback(() => {
    resultTimersRef.current.forEach(t => clearTimeout(t));
    resultTimersRef.current = [];
    try { if (surgeAudioRef.current) { surgeAudioRef.current.pause(); surgeAudioRef.current.currentTime = 0; } } catch (e) {}
    setShowResult(false);
    setResultAnimStage(0);
    if (gameSceneRef.current) { gameSceneRef.current.resetRound(); }
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
      if (gameSceneRef.current) { gameSceneRef.current.isPlaying = false; }
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
        toastRef.current({ title: "Error", description: data.message || "Failed to play", variant: "destructive" });
        if (gameSceneRef.current) { gameSceneRef.current.isPlaying = false; }
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
        prizeId: data.result.prizeId,
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
    } catch (err) {
      try { if (surgeAudioRef.current) { surgeAudioRef.current.pause(); surgeAudioRef.current.currentTime = 0; } } catch (e) {}
      toastRef.current({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
      if (gameSceneRef.current) { gameSceneRef.current.isPlaying = false; }
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
        if (data.playsRemaining !== undefined) {
          playsRemainingRef.current = data.playsRemaining;
          lastServerPlaysRef.current = data.playsRemaining;
        }
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
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        input: { touch: { capture: false } },
        physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
        scene: [Boot, Preload, VoltzGame],
      };

      game = new Phaser.Game(config);
      gameInstanceRef.current = game;

      const applyTouchAction = () => {
        const canvas = gameContainerRef.current?.querySelector('canvas');
        if (canvas) { canvas.style.touchAction = 'pan-y'; }
        else { requestAnimationFrame(applyTouchAction); }
      };
      requestAnimationFrame(applyTouchAction);

      const pollForScene = () => {
        if (destroyed) return;
        const gameScene = game?.scene?.getScene("Game") as any;
        if (gameScene && gameScene.scene?.isActive() && gameScene.isPlaying !== undefined) {
          gameSceneRef.current = gameScene;
          setIsGameReady(true);
          gameScene.setCallbacks({ onSwitchPressed: (switchIndex: number) => { handleSwitchPress(switchIndex); } });

          game.events.on("electricStart", () => {
            try {
              if (!surgeAudioRef.current) { surgeAudioRef.current = new Audio(surgeSoundUrl); surgeAudioRef.current.loop = true; }
              surgeAudioRef.current.currentTime = 0;
              surgeAudioRef.current.volume = 0.6;
              surgeAudioRef.current.play().catch(() => {});
            } catch (e) {}
          });

          game.events.on("electricStop", () => {
            try { if (surgeAudioRef.current) { surgeAudioRef.current.pause(); surgeAudioRef.current.currentTime = 0; } } catch (e) {}
          });

          game.events.on("gameComplete", () => {
            resultTimersRef.current.forEach(t => clearTimeout(t));
            resultTimersRef.current = [];
            const currentResult = lastResultRef.current;
            confirmGameResult().then(() => {
              if (currentResult?.isWin) { fireWinConfetti(); playWinSound(); }
              else if (currentResult?.outcome === "freeReplay") { fireBackupConfetti(); playBackupPower(); }
              else { playPowerDown(); }
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
        if (surgeAudioRef.current) { surgeAudioRef.current.pause(); surgeAudioRef.current.currentTime = 0; surgeAudioRef.current = null; }
      } catch (e) {}
      disposeAudioContext();
      if (game) {
        try { game.destroy(true); } catch (e) {}
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

  const formatSwitchText = (text: string) => {
    if (!isNaN(Number(text)) && text.length > 6) {
      const num = parseInt(text);
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    }
    if (text.length > 8) return text.substring(0, 6) + '';
    return text;
  };

  // ─── Determine current theme ───────────────────────────────────────────────
  const isWin = lastResult?.isWin;
  const isFreeReplay = lastResult?.outcome === "freeReplay";
  const isNoWin = lastResult?.outcome === "noWin";

  return (
    <div className="relative w-full" data-testid="voltz-game-container">
      {/* ── Scoped styles ─────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');

        .vg-root { font-family: 'Rajdhani', sans-serif; }

        /* scanline texture overlay */
        .vg-scanlines::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.06) 2px,
            rgba(0,0,0,0.06) 4px
          );
          pointer-events: none;
          border-radius: inherit;
          z-index: 30;
        }

        /* HUD hex corners */
        .vg-hex-corner {
          width: 14px; height: 14px;
          border-color: currentColor;
          border-style: solid;
          position: absolute;
        }
        .vg-hex-corner-tl { top: 8px; left: 8px; border-width: 2px 0 0 2px; border-radius: 2px 0 0 0; }
        .vg-hex-corner-tr { top: 8px; right: 8px; border-width: 2px 2px 0 0; border-radius: 0 2px 0 0; }
        .vg-hex-corner-bl { bottom: 8px; left: 8px; border-width: 0 0 2px 2px; border-radius: 0 0 0 2px; }
        .vg-hex-corner-br { bottom: 8px; right: 8px; border-width: 0 2px 2px 0; border-radius: 0 0 2px 0; }

        @keyframes vg-surge {
          0%,100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes vg-flicker {
          0%,19%,21%,23%,25%,54%,56%,100% { opacity: 1; }
          20%,22%,24%,55% { opacity: 0.4; }
        }
        @keyframes vg-slide-up {
          from { transform: translateY(32px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes vg-pop {
          0%   { transform: scale(0.7); opacity: 0; }
          70%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes vg-glow-pulse {
          0%,100% { box-shadow: 0 0 20px rgba(234,179,8,0.35), 0 0 60px rgba(234,179,8,0.12); }
          50%      { box-shadow: 0 0 40px rgba(234,179,8,0.55), 0 0 90px rgba(234,179,8,0.2); }
        }
        @keyframes vg-glow-pulse-cyan {
          0%,100% { box-shadow: 0 0 20px rgba(6,182,212,0.35), 0 0 60px rgba(6,182,212,0.12); }
          50%      { box-shadow: 0 0 40px rgba(6,182,212,0.55), 0 0 90px rgba(6,182,212,0.2); }
        }
        @keyframes vg-glow-pulse-red {
          0%,100% { box-shadow: 0 0 16px rgba(239,68,68,0.25), 0 0 40px rgba(239,68,68,0.08); }
          50%      { box-shadow: 0 0 28px rgba(239,68,68,0.4), 0 0 60px rgba(239,68,68,0.15); }
        }
        @keyframes vg-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes vg-bar-fill {
          from { width: 0%; }
          to   { width: 60%; }
        }
        @keyframes vg-ping-gold {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .vg-anim-surge   { animation: vg-surge 1.2s ease-in-out infinite; }
        .vg-anim-flicker { animation: vg-flicker 3s linear infinite; }
        .vg-anim-slide-up { animation: vg-slide-up 0.45s cubic-bezier(.22,1,.36,1) both; }
        .vg-anim-pop      { animation: vg-pop 0.5s cubic-bezier(.22,1,.36,1) both; }
        .vg-anim-glow-gold { animation: vg-glow-pulse 2s ease-in-out infinite; }
        .vg-anim-glow-cyan { animation: vg-glow-pulse-cyan 2s ease-in-out infinite; }
        .vg-anim-glow-red  { animation: vg-glow-pulse-red 2.5s ease-in-out infinite; }
        .vg-anim-spin-slow { animation: vg-spin-slow 2.8s linear infinite; }
        .vg-anim-bar       { animation: vg-bar-fill 1.2s cubic-bezier(.22,1,.36,1) forwards; }
        .vg-anim-ping-gold { animation: vg-ping-gold 1.4s ease-out infinite; }

        .vg-title { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.06em; }

        /* result card glass */
        .vg-glass {
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
        }

        /* switch pill tag */
        .vg-switch-pill {
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 0.08em;
        }

        /* progress dots */
        .vg-dot { transition: background 0.3s, transform 0.3s; }
      `}</style>

      {/* ── Game canvas ─────────────────────────────────────────────────────── */}
      <div
        ref={gameContainerRef}
        className="vg-root vg-scanlines w-full aspect-[2/3] max-w-[512px] mx-auto overflow-hidden relative"
        style={{
          touchAction: 'pan-y',
          borderRadius: '16px',
          border: '1px solid rgba(234,179,8,0.18)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 64px rgba(0,0,0,0.7), 0 0 80px rgba(234,179,8,0.06)',
        }}
        data-testid="voltz-game-canvas"
      />

      {/* ── Loading overlay ──────────────────────────────────────────────────── */}
      {!isGameReady && (
        <div
          className="vg-root absolute inset-0 flex items-center justify-center rounded-2xl z-50"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, #0f0a00 0%, #000000 100%)' }}
          data-testid="loading-overlay"
        >
          {/* hex corners */}
          <span className="vg-hex-corner vg-hex-corner-tl text-yellow-500/40" />
          <span className="vg-hex-corner vg-hex-corner-tr text-yellow-500/40" />
          <span className="vg-hex-corner vg-hex-corner-bl text-yellow-500/40" />
          <span className="vg-hex-corner vg-hex-corner-br text-yellow-500/40" />

          <div className="text-center px-8">
            {/* ring stack */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border border-yellow-500/10 vg-anim-ping-gold" />
              <div className="absolute inset-0 rounded-full border border-yellow-500/20" style={{ animation: 'vg-ping-gold 1.4s 0.3s ease-out infinite' }} />
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle at 40% 35%, rgba(234,179,8,0.25) 0%, rgba(234,179,8,0.05) 60%, transparent 100%)',
                  border: '1px solid rgba(234,179,8,0.3)',
                  boxShadow: '0 0 30px rgba(234,179,8,0.15) inset, 0 0 20px rgba(234,179,8,0.1)',
                }}
              >
                <Zap className="w-11 h-11 text-yellow-400 vg-anim-surge" strokeWidth={1.5} />
              </div>
            </div>

            <p
              className="vg-title text-3xl text-white mb-1 vg-anim-flicker"
              data-testid="text-loading"
              style={{ textShadow: '0 0 20px rgba(234,179,8,0.5)' }}
            >
              CHARGING UP
            </p>
            <p className="text-yellow-500/50 text-xs tracking-[0.3em] mb-6 font-semibold">INITIALISING VOLTZ SYSTEM</p>

            {/* progress bar */}
            <div className="w-48 mx-auto">
              <div className="h-[2px] bg-white/5 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full vg-anim-bar"
                  style={{ background: 'linear-gradient(90deg, #92400e, #eab308, #fbbf24)' }}
                />
              </div>
              <div className="flex justify-between text-yellow-600/40 text-[10px] font-semibold tracking-widest">
                <span>PWR</span><span>SYS</span><span>NET</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Result overlay ───────────────────────────────────────────────────── */}
      {showResult && lastResult && (
        <div
          className="vg-root absolute inset-0 flex items-center justify-center rounded-2xl z-20"
          style={{
            background: isWin
              ? 'radial-gradient(ellipse at 50% 40%, rgba(234,179,8,0.22) 0%, rgba(0,0,0,0.94) 65%)'
              : isFreeReplay
              ? 'radial-gradient(ellipse at 50% 40%, rgba(6,182,212,0.18) 0%, rgba(0,0,0,0.94) 65%)'
              : 'radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.14) 0%, rgba(0,0,0,0.94) 65%)',
          }}
          data-testid="result-overlay"
        >
          {/* win particle field */}
          {isWin && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {particlePositions.map((pos, i) => (
                <div
                  key={i}
                  className={`absolute ${pos.size} rounded-full`}
                  style={{
                    left: pos.left, top: pos.top,
                    animationDelay: pos.delay, animationDuration: '1.6s',
                    animation: `vg-ping-gold 1.6s ${pos.delay} ease-out infinite`,
                    backgroundColor: i % 2 === 0 ? '#eab308' : '#fbbf24',
                    opacity: 0.7,
                  }}
                />
              ))}
              {/* top / bottom accent lines */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
            </div>
          )}

          {/* card */}
          <div
            className={`vg-glass relative w-full max-w-[320px] mx-4 transition-all duration-500 ${
              resultAnimStage >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
            }`}
          >
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: '24px',
                border: isWin
                  ? '1px solid rgba(234,179,8,0.45)'
                  : isFreeReplay
                  ? '1px solid rgba(6,182,212,0.35)'
                  : '1px solid rgba(239,68,68,0.25)',
                background: isWin
                  ? 'linear-gradient(170deg, rgba(40,28,0,0.97) 0%, rgba(10,8,0,0.99) 100%)'
                  : isFreeReplay
                  ? 'linear-gradient(170deg, rgba(0,30,40,0.97) 0%, rgba(0,8,12,0.99) 100%)'
                  : 'linear-gradient(170deg, rgba(30,5,5,0.97) 0%, rgba(8,0,0,0.99) 100%)',
                boxShadow: isWin
                  ? '0 0 80px rgba(234,179,8,0.18), 0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.6)'
                  : isFreeReplay
                  ? '0 0 60px rgba(6,182,212,0.14), 0 0 0 1px rgba(255,255,255,0.02), 0 32px 64px rgba(0,0,0,0.6)'
                  : '0 0 50px rgba(239,68,68,0.1), 0 0 0 1px rgba(255,255,255,0.02), 0 32px 64px rgba(0,0,0,0.6)',
              }}
            >
              {/* hex corners inside card */}
              <span className={`vg-hex-corner vg-hex-corner-tl ${isWin ? 'text-yellow-500/40' : isFreeReplay ? 'text-cyan-500/40' : 'text-red-500/30'}`} />
              <span className={`vg-hex-corner vg-hex-corner-tr ${isWin ? 'text-yellow-500/40' : isFreeReplay ? 'text-cyan-500/40' : 'text-red-500/30'}`} />
              <span className={`vg-hex-corner vg-hex-corner-bl ${isWin ? 'text-yellow-500/40' : isFreeReplay ? 'text-cyan-500/40' : 'text-red-500/30'}`} />
              <span className={`vg-hex-corner vg-hex-corner-br ${isWin ? 'text-yellow-500/40' : isFreeReplay ? 'text-cyan-500/40' : 'text-red-500/30'}`} />

              {/* top accent line */}
              <div
                className="absolute top-0 inset-x-0 h-[2px]"
                style={{
                  background: isWin
                    ? 'linear-gradient(90deg, transparent, #eab308, transparent)'
                    : isFreeReplay
                    ? 'linear-gradient(90deg, transparent, #06b6d4, transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)',
                }}
              />

              {/* close button */}
              <button
                onClick={closeResult}
                className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                style={{
                  background: isWin ? 'rgba(234,179,8,0.1)' : isFreeReplay ? 'rgba(6,182,212,0.1)' : 'rgba(239,68,68,0.1)',
                  border: isWin ? '1px solid rgba(234,179,8,0.25)' : isFreeReplay ? '1px solid rgba(6,182,212,0.25)' : '1px solid rgba(239,68,68,0.2)',
                  color: isWin ? '#eab308' : isFreeReplay ? '#06b6d4' : '#ef4444',
                }}
                data-testid="button-close-result"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="px-6 pt-10 pb-2 text-center">
                {/* switch pills */}
                <div className="flex justify-center gap-2 mb-6">
                  {lastResult.switchTexts.map((text, i) => (
                    <div
                      key={i}
                      className="vg-switch-pill px-3 py-2 text-sm min-w-[62px] text-center"
                      style={{
                        borderRadius: '10px',
                        background: isWin
                          ? 'rgba(234,179,8,0.08)'
                          : isFreeReplay
                          ? 'rgba(6,182,212,0.08)'
                          : 'rgba(239,68,68,0.07)',
                        border: isWin
                          ? '1px solid rgba(234,179,8,0.28)'
                          : isFreeReplay
                          ? '1px solid rgba(6,182,212,0.28)'
                          : '1px solid rgba(239,68,68,0.2)',
                        color: isWin ? '#fbbf24' : isFreeReplay ? '#22d3ee' : '#f87171',
                        boxShadow: isWin ? '0 0 8px rgba(234,179,8,0.1) inset' : isFreeReplay ? '0 0 8px rgba(6,182,212,0.1) inset' : 'none',
                      }}
                      data-testid={`text-switch-result-${i}`}
                      title={text}
                    >
                      {formatSwitchText(text)}
                    </div>
                  ))}
                </div>

                {/* ── WIN ── */}
                {isWin && (
                  <>
                    <div
                      className={`relative w-24 h-24 mx-auto mb-6 transition-all duration-600 ${resultAnimStage >= 2 ? 'scale-100' : 'scale-0'}`}
                      style={{ animationFillMode: 'both' }}
                    >
                      <div
                        className="absolute inset-0 rounded-full vg-anim-ping-gold"
                        style={{ background: 'rgba(234,179,8,0.15)' }}
                      />
                      <div
                        className="relative w-24 h-24 rounded-full flex items-center justify-center vg-anim-glow-gold"
                        style={{
                          background: 'radial-gradient(circle at 38% 32%, rgba(234,179,8,0.3) 0%, rgba(180,120,0,0.12) 60%, transparent 100%)',
                          border: '1px solid rgba(234,179,8,0.5)',
                        }}
                      >
                        <Zap
                          className="w-12 h-12 text-yellow-400"
                          strokeWidth={1.5}
                          style={{ filter: 'drop-shadow(0 0 14px rgba(234,179,8,0.7))' }}
                          data-testid="icon-win"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                      <p
                        className="text-yellow-400/80 text-[10px] font-bold tracking-[0.35em] uppercase"
                        data-testid="text-result-label"
                      >POWER SURGE — 3 MATCH!</p>
                      <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                    </div>

                    <p
                      className="vg-title text-3xl text-white mb-4"
                      style={{ textShadow: '0 0 24px rgba(234,179,8,0.35)' }}
                      data-testid="text-prize-name"
                    >
                      {lastResult.prizeName}
                    </p>

                    <div
                      className="inline-flex items-center gap-2.5 px-5 py-3 mb-5"
                      style={{
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(180,100,0,0.08) 100%)',
                        border: '1px solid rgba(234,179,8,0.28)',
                        boxShadow: '0 0 24px rgba(234,179,8,0.08) inset',
                      }}
                      data-testid="text-prize-value"
                    >
                      <Trophy className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />
                      <span
                        className="vg-title text-2xl text-yellow-300"
                        style={{ textShadow: '0 0 12px rgba(234,179,8,0.4)' }}
                      >
                        {lastResult.rewardType === "cash" ? `£${lastResult.rewardValue}` : `${lastResult.rewardValue} pts`}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-gray-700 text-[10px] mb-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span data-testid="text-verified">Verified & Credited</span>
                    </div>
                  </>
                )}

                {/* ── FREE REPLAY ── */}
                {isFreeReplay && (
                  <>
                    <div
                      className={`relative w-24 h-24 mx-auto mb-6 transition-all duration-600 ${resultAnimStage >= 2 ? 'scale-100' : 'scale-0'}`}
                    >
                      <div
                        className="absolute -inset-3 rounded-full blur-xl"
                        style={{ background: 'rgba(6,182,212,0.15)' }}
                      />
                      <div
                        className="relative w-24 h-24 rounded-full flex items-center justify-center vg-anim-glow-cyan"
                        style={{
                          background: 'radial-gradient(circle at 38% 32%, rgba(6,182,212,0.25) 0%, rgba(0,100,120,0.1) 60%, transparent 100%)',
                          border: '1px solid rgba(6,182,212,0.4)',
                        }}
                      >
                        <RotateCcw
                          className="w-12 h-12 text-cyan-400 vg-anim-spin-slow"
                          strokeWidth={1.5}
                          style={{ filter: 'drop-shadow(0 0 12px rgba(6,182,212,0.6))' }}
                          data-testid="icon-free-replay"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Zap className="w-3.5 h-3.5 text-cyan-600" />
                      <p
                        className="text-cyan-400/80 text-[10px] font-bold tracking-[0.35em] uppercase"
                        data-testid="text-result-free-replay"
                      >BACKUP POWER — FREE PLAY!</p>
                      <Zap className="w-3.5 h-3.5 text-cyan-600" />
                    </div>

                    <p
                      className="vg-title text-3xl text-white mb-4"
                      style={{ textShadow: '0 0 20px rgba(6,182,212,0.3)' }}
                      data-testid="text-backup-title"
                    >
                      Power Stabilized!
                    </p>

                    <div
                      className="inline-flex items-center gap-2.5 px-5 py-3 mb-5"
                      style={{
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(0,80,100,0.08) 100%)',
                        border: '1px solid rgba(6,182,212,0.28)',
                        boxShadow: '0 0 24px rgba(6,182,212,0.08) inset',
                      }}
                      data-testid="text-free-play-badge"
                    >
                      <RotateCcw className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                      <span
                        className="vg-title text-2xl text-cyan-300"
                        style={{ textShadow: '0 0 12px rgba(6,182,212,0.4)' }}
                      >
                        +1 Free Play
                      </span>
                    </div>
                  </>
                )}

                {/* ── NO WIN ── */}
                {isNoWin && (
                  <>
                    <div
                      className={`relative w-24 h-24 mx-auto mb-6 transition-all duration-600 ${resultAnimStage >= 2 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
                    >
                      <div
                        className="absolute -inset-3 rounded-full blur-xl"
                        style={{ background: 'rgba(239,68,68,0.08)' }}
                      />
                      <div
                        className="relative w-24 h-24 rounded-full flex items-center justify-center vg-anim-glow-red"
                        style={{
                          background: 'radial-gradient(circle at 38% 32%, rgba(239,68,68,0.18) 0%, rgba(120,0,0,0.06) 60%, transparent 100%)',
                          border: '1px solid rgba(239,68,68,0.3)',
                        }}
                      >
                        <PowerOff
                          className="w-12 h-12 text-red-400/75"
                          strokeWidth={1.5}
                          data-testid="icon-no-win"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Zap className="w-3.5 h-3.5 text-red-600/60" />
                      <p
                        className="text-red-400/70 text-[10px] font-bold tracking-[0.35em] uppercase"
                        data-testid="text-result-no-win"
                      >NO MATCH — SO CLOSE!</p>
                      <Zap className="w-3.5 h-3.5 text-red-600/60" />
                    </div>

                    <p className="vg-title text-2xl text-white/75 mb-1">Switches Didn't Align</p>
                    <p className="text-red-400/35 text-sm tracking-wide mb-5">Match all 3 to win — try again</p>
                  </>
                )}
              </div>

              {/* CTA button */}
              <button
                onClick={closeResult}
                className="w-full py-4 text-sm font-bold tracking-[0.18em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: isWin
                    ? 'linear-gradient(90deg, rgba(234,179,8,0.14) 0%, rgba(180,100,0,0.1) 100%)'
                    : isFreeReplay
                    ? 'linear-gradient(90deg, rgba(6,182,212,0.14) 0%, rgba(0,80,100,0.1) 100%)'
                    : 'linear-gradient(90deg, rgba(239,68,68,0.1) 0%, rgba(120,0,0,0.08) 100%)',
                  borderTop: isWin
                    ? '1px solid rgba(234,179,8,0.18)'
                    : isFreeReplay
                    ? '1px solid rgba(6,182,212,0.18)'
                    : '1px solid rgba(239,68,68,0.15)',
                  color: isWin ? '#eab308' : isFreeReplay ? '#06b6d4' : '#ef4444',
                  letterSpacing: '0.15em',
                }}
                data-testid="button-continue"
              >
                {isWin ? 'COLLECT & CONTINUE' : isFreeReplay ? 'USE FREE PLAY' : 'TRY AGAIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VoltZ-themed No Plays Dialog ─────────────────────────────────────── */}
      <AlertDialog open={showNoPlaysDialog} onOpenChange={setShowNoPlaysDialog}>
        <AlertDialogContent className="vg-root max-w-[360px] p-0 overflow-hidden border-0 bg-transparent">
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: '24px',
              border: '1px solid rgba(239,68,68,0.35)',
              background: 'linear-gradient(170deg, rgba(30,5,5,0.98) 0%, rgba(8,0,0,0.99) 100%)',
              boxShadow: '0 0 80px rgba(239,68,68,0.15), 0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.7)',
            }}
          >
            {/* Hex corners */}
            <span className="vg-hex-corner vg-hex-corner-tl text-red-500/40" />
            <span className="vg-hex-corner vg-hex-corner-tr text-red-500/40" />
            <span className="vg-hex-corner vg-hex-corner-bl text-red-500/40" />
            <span className="vg-hex-corner vg-hex-corner-br text-red-500/40" />

            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

            {/* Scanlines overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.1) 2px, rgba(255,0,0,0.1) 4px)',
            }} />

            <div className="px-6 pt-10 pb-6 text-center relative z-10">
              {/* Animated icon */}
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full vg-anim-ping-gold" style={{ background: 'rgba(239,68,68,0.15)' }} />
                <div
                  className="relative w-28 h-28 rounded-full flex items-center justify-center vg-anim-glow-red"
                  style={{
                    background: 'radial-gradient(circle at 38% 32%, rgba(239,68,68,0.25) 0%, rgba(120,0,0,0.1) 60%, transparent 100%)',
                    border: '1px solid rgba(239,68,68,0.4)',
                  }}
                >
                  <Gauge className="w-14 h-14 text-red-400 vg-anim-flicker" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 14px rgba(239,68,68,0.5))' }} />
                </div>
                {/* Energy bolts around */}
                <Bolt className="absolute -top-2 -right-2 w-6 h-6 text-red-500/40 rotate-45" />
                <Bolt className="absolute -bottom-2 -left-2 w-6 h-6 text-red-500/40 -rotate-45" />
              </div>

              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle className="vg-title text-4xl text-center text-white mb-2" style={{ textShadow: '0 0 24px rgba(239,68,68,0.4)' }}>
                  POWER DEPLETED
                </AlertDialogTitle>
                <AlertDialogDescription className="text-red-400/80 text-sm tracking-wide font-medium">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Zap className="w-4 h-4" />
                    <span className="text-[10px] tracking-[0.25em]">SYSTEM OFFLINE — RECHARGE REQUIRED</span>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex justify-center gap-1.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 w-6 rounded-full"
                        style={{
                          background: i < 1 ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.06)',
                          border: '1px solid rgba(239,68,68,0.15)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-gray-400 text-xs">
                    Your energy cells are empty. Boost your power to continue playing VoltZ.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="mt-8 space-y-3">
                <AlertDialogAction
                  className="w-full py-4 text-sm font-bold tracking-[0.18em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98] rounded-xl"
                  style={{
                    background: 'linear-gradient(90deg, rgba(239,68,68,0.15) 0%, rgba(180,0,0,0.1) 100%)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#ef4444',
                    boxShadow: '0 0 20px rgba(239,68,68,0.1) inset',
                  }}
                  onClick={() => {
                    setTimeout(() => {
                      if (orderId) {
                        localStorage.removeItem(`voltzHistory_${orderId}`);
                      }
                      setLocation(`/competition/${competitionId}`);
                    }, 200);
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Bolt className="w-4 h-4" />
                    <span>BOOST POWER</span>
                    <Swords className="w-4 h-4" />
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
                  EXIT SYSTEM
                </AlertDialogCancel>
              </div>

              {/* Small system text */}
              <p className="text-[8px] text-red-900/50 mt-4 tracking-widest font-mono">
                POWER CELLS: 0/5 • SYSTEM STANDBY
              </p>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}