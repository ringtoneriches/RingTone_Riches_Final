import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Zap, Trophy, RotateCcw, PowerOff, Sparkles, X, Package } from "lucide-react";
import confetti from "canvas-confetti";
import { playWinSound, playPowerDown, playBackupPower, disposeAudioContext } from "@/lib/voltz-sounds";
import surgeSoundUrl from "@assets/surgessound_1772193798276.mp3";
import { useLocation } from "wouter";
import GameResultOverlay from "@/components/games/GameResultOverlay";
import { formatVoltzPrizeHeadline, formatVoltzSwitchCompact } from "@/lib/voltz-display";
import RevealAllBatchSummary, { batchRowsFromRewards } from "@/components/games/RevealAllBatchSummary";

interface VoltzGameProps {
  orderId: string;
  competitionId: string;
  playsRemaining: number;
  onPlayComplete: (newPlaysRemaining: number) => void;
   onRevealAll?: () => void;
}

interface PlayResult {
  outcome: "noWin" | "win" | "freeReplay";
  switchChosen: number;
  rewardType: string;
  rewardValue: string;
  prizeName: string;
  prizeId?: string;
  isWin: boolean;
  isPhysical?: boolean;
  switchTexts: string[];
}

function fireWinConfetti() {
  const colors = ["#F1D47A", "#D4AF37", "#C8102E", "#fff8ee"];
  confetti({ particleCount: 40, spread: 90, origin: { y: 0.4, x: 0.5 }, colors, startVelocity: 35, gravity: 0.9, scalar: 1.1, ticks: 200 });
  setTimeout(() => {
    confetti({ particleCount: 20, angle: 60, spread: 60, origin: { x: 0, y: 0.5 }, colors, startVelocity: 40 });
    confetti({ particleCount: 20, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors, startVelocity: 40 });
  }, 200);
  setTimeout(() => {
    confetti({ particleCount: 50, spread: 140, origin: { y: 0.35, x: 0.5 }, colors, scalar: 1.2, ticks: 250 });
  }, 600);
}

function fireBackupConfetti() {
  const colors = ["#F1D47A", "#D4AF37", "#fff8ee"];
  confetti({ particleCount: 40, spread: 100, origin: { y: 0.45, x: 0.5 }, colors, startVelocity: 30, gravity: 0.8, ticks: 200 });
  setTimeout(() => {
    confetti({ particleCount: 25, angle: 60, spread: 50, origin: { x: 0, y: 0.6 }, colors });
    confetti({ particleCount: 25, angle: 120, spread: 50, origin: { x: 1, y: 0.6 }, colors });
  }, 250);
}

function firePhysicalPrizeConfetti() {
  const colors = ["#F1D47A", "#D4AF37", "#C8102E", "#fff8ee"];
  confetti({ particleCount: 40, spread: 120, origin: { y: 0.4, x: 0.5 }, colors, startVelocity: 40, gravity: 0.7, scalar: 1.2, ticks: 300 });
  setTimeout(() => {
    confetti({ particleCount: 25, angle: 55, spread: 70, origin: { x: 0, y: 0.5 }, colors, startVelocity: 45 });
    confetti({ particleCount: 25, angle: 125, spread: 70, origin: { x: 1, y: 0.5 }, colors, startVelocity: 45 });
  }, 200);
  setTimeout(() => {
    confetti({ particleCount: 50, spread: 160, origin: { y: 0.3, x: 0.5 }, colors, scalar: 1.4, ticks: 350 });
  }, 500);
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
  const [noPlaysDismissed, setNoPlaysDismissed] = useState(false);
  const [isRevealingAll, setIsRevealingAll] = useState(false);
const [revealAllResults, setRevealAllResults] = useState<PlayResult[] | null>(null);
const [showRevealAllSummary, setShowRevealAllSummary] = useState(false);

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

  useEffect(() => {
    if (playsRemaining > 0) setNoPlaysDismissed(false);
    if (
      playsRemaining <= 0 &&
      isGameReady &&
      !isProcessing &&
      !showResult &&
      !showRevealAllSummary &&
      !isRevealingAll &&
      !noPlaysDismissed
    ) {
      setShowNoPlaysDialog(true);
    } else if (
      playsRemaining > 0 ||
      showResult ||
      isProcessing ||
      showRevealAllSummary ||
      isRevealingAll ||
      noPlaysDismissed
    ) {
      setShowNoPlaysDialog(false);
    }
  }, [
    playsRemaining,
    isGameReady,
    isProcessing,
    showResult,
    showRevealAllSummary,
    isRevealingAll,
    noPlaysDismissed,
  ]);

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
        isPhysical: data.result.isPhysical || false,
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
          isPhysical: lastResultRef.current.isPhysical,
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

  const handleRevealAll = useCallback(async (count: number) => {
  if (playsRemainingRef.current <= 0 || isProcessingRef.current || isRevealingAll) return;
  
  setIsRevealingAll(true);
  setIsProcessing(true);
  
  try {
    const res = await apiRequest("/api/reveal-all-voltz", "POST", {
      orderId: orderIdRef.current,
      competitionId: competitionIdRef.current,
      count,
    });
    
    const data = await res.json();
    
    if (!data.success) {
      toastRef.current({
        title: "Error",
        description: data.message || "Failed to reveal all",
        variant: "destructive",
      });
      return;
    }
    
    // Update plays remaining
    if (data.playsRemaining !== undefined) {
      playsRemainingRef.current = data.playsRemaining;
      lastServerPlaysRef.current = data.playsRemaining;
      onPlayCompleteRef.current(data.playsRemaining);
    }
    
    // Process results
    const results: PlayResult[] = data.results.map((r: any) => ({
      outcome: r.outcome,
      switchChosen: r.switchChosen,
      rewardType: r.rewardType,
      rewardValue: r.rewardValue,
      prizeName: r.prizeName,
      isWin: r.isWin,
      isPhysical: r.rewardType === "physical",
      switchTexts: r.switchTexts || ["?", "?", "?"],
      prizeId: r.prizeId,
    }));
    
    setRevealAllResults(results);
    setShowRevealAllSummary(true);
    
    // Show confetti for wins
    const hasWin = results.some(r => r.isWin);
    const hasPhysicalWin = results.some(r => r.isPhysical);
    const hasFreeReplay = results.some(r => r.outcome === "freeReplay");
    
    if (hasWin) fireWinConfetti();
    if (hasPhysicalWin) firePhysicalPrizeConfetti();
    if (hasFreeReplay && !hasWin) fireBackupConfetti();
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/voltz-order", orderId] });
    
  } catch (error) {
    console.error("Error revealing all:", error);
    toastRef.current({
      title: "Error",
      description: "Network error. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsRevealingAll(false);
    setIsProcessing(false);
  }
}, [orderId, competitionId]);

const voltzBatchRows = (revealAllResults || []).map((r, i) => ({
  ...batchRowsFromRewards([{
    isWin: Boolean(r.isWin || r.isPhysical),
    rewardType: r.outcome === "freeReplay" ? "try_again" : r.rewardType,
    rewardValue: r.rewardValue,
    prizeName: r.prizeName,
    ticketNumber: (r as any).ticketNumber,
    detail: (r.switchTexts || []).map((text) => formatVoltzSwitchCompact(text)).join(" · "),
  }])[0],
  number: i + 1,
  id: i,
}));
const voltzBatchCash = (revealAllResults || [])
  .filter((r) => r.isWin && r.rewardType === "cash")
  .reduce((sum, r) => sum + parseFloat(r.rewardValue || "0"), 0);
const voltzBatchPoints = (revealAllResults || [])
  .filter((r) => r.isWin && r.rewardType === "points")
  .reduce((sum, r) => sum + parseInt(r.rewardValue || "0", 10), 0);


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
              if (currentResult?.isWin && !currentResult?.isPhysical) { 
                fireWinConfetti(); 
                playWinSound(); 
              } else if (currentResult?.isPhysical) {
                firePhysicalPrizeConfetti();
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

  const formatSwitchText = (text: string) => formatVoltzSwitchCompact(text);

  // ─── Determine current theme ───────────────────────────────────────────────
  const isWin = lastResult?.isWin && !lastResult?.isPhysical;
  const isPhysicalWin = lastResult?.isPhysical === true;
  const isFreeReplay = lastResult?.outcome === "freeReplay";
  const isNoWin = lastResult?.outcome === "noWin";

  return (
    <div className="rr-voltz-panel relative mx-auto w-full max-w-[540px]" data-testid="voltz-game-container">
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
        @keyframes vg-glow-pulse-purple {
          0%,100% { box-shadow: 0 0 20px rgba(168,85,247,0.35), 0 0 60px rgba(168,85,247,0.12); }
          50%      { box-shadow: 0 0 40px rgba(168,85,247,0.55), 0 0 90px rgba(168,85,247,0.2); }
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
        .vg-anim-glow-purple { animation: vg-glow-pulse-purple 2s ease-in-out infinite; }
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

      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F1D47A]/30 bg-[#F1D47A]/10 px-3 py-1.5">
          <span className="font-prize text-2xl leading-none text-[#F1D47A]">{playsRemaining}</span>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">
            {playsRemaining === 1 ? "play left" : "plays left"}
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
          Match 3 to win
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#C8102E]/35 bg-[#050505] shadow-[0_0_0_1px_rgba(241,212,122,0.08),0_0_70px_rgba(200,16,46,0.14),0_24px_70px_rgba(0,0,0,0.7)]">
        <div className="pointer-events-none absolute inset-x-8 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#F1D47A]/70 to-transparent" />
        <div
          ref={gameContainerRef}
          className="vg-root vg-scanlines relative w-full aspect-[2/3] overflow-hidden"
          style={{ touchAction: "pan-y" }}
          data-testid="voltz-game-canvas"
        />

{/* Revealing Overlay */}
{isRevealingAll && (
  <div
    className="vg-root absolute inset-0 flex items-center justify-center rounded-2xl z-40"
    style={{
      background: 'radial-gradient(ellipse at 50% 40%, rgba(234,179,8,0.08) 0%, rgba(0,0,0,0.92) 70%)',
      backdropFilter: 'blur(4px)',
    }}
  >
    <div className="text-center px-8">
      {/* Animated energy core */}
      <div className="relative w-32 h-32 mx-auto mb-8">
        {/* Outer rings */}
        <div 
          className="absolute inset-0 rounded-full animate-spin"
          style={{ 
            border: '2px solid transparent',
            borderTopColor: 'rgba(234,179,8,0.4)',
            borderRightColor: 'rgba(234,179,8,0.2)',
            animationDuration: '2s',
          }}
        />
        <div 
          className="absolute inset-2 rounded-full animate-spin"
          style={{ 
            border: '2px solid transparent',
            borderBottomColor: 'rgba(234,179,8,0.5)',
            borderLeftColor: 'rgba(234,179,8,0.25)',
            animationDuration: '1.5s',
            animationDirection: 'reverse',
          }}
        />
        <div 
          className="absolute inset-4 rounded-full animate-spin"
          style={{ 
            border: '1px solid transparent',
            borderTopColor: 'rgba(234,179,8,0.6)',
            animationDuration: '1s',
          }}
        />
        
        {/* Inner core */}
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 40% 35%, rgba(234,179,8,0.3) 0%, rgba(234,179,8,0.08) 60%, transparent 100%)',
              border: '1px solid rgba(234,179,8,0.4)',
              boxShadow: '0 0 40px rgba(234,179,8,0.2) inset, 0 0 30px rgba(234,179,8,0.15)',
            }}
          >
            <Zap 
              className="w-10 h-10 text-yellow-400 animate-pulse"
              strokeWidth={1.5}
              style={{ filter: 'drop-shadow(0 0 12px rgba(234,179,8,0.7))' }}
            />
          </div>
        </div>

        {/* Particle orbits */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-yellow-400 animate-spin"
            style={{
              top: `${25 + i * 20}%`,
              left: `${10 + i * 15}%`,
              animationDuration: `${0.8 + i * 0.3}s`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
              filter: 'blur(1px)',
              opacity: 0.8,
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <p
        className="vg-title text-3xl text-white mb-2"
        style={{ textShadow: '0 0 20px rgba(234,179,8,0.4)' }}
      >
        REVEALING
      </p>
      <p className="text-yellow-500/60 text-xs tracking-[0.3em] mb-6 font-semibold uppercase">
        Processing {playsRemaining} Plays
      </p>

      {/* Progress bar */}
      <div className="w-48 mx-auto">
        <div className="h-[3px] bg-white/5 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full rounded-full animate-pulse"
            style={{ 
              width: '100%',
              background: 'linear-gradient(90deg, #92400e, #eab308, #fbbf24)',
              animationDuration: '1.5s',
            }}
          />
        </div>
        
        {/* Animated dots */}
        <div className="flex justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-yellow-500/60"
              style={{
                animation: `vg-surge 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Cancel button */}
      <button
        onClick={() => {
          setIsRevealingAll(false);
          setIsProcessing(false);
          toast({
            title: "Cancelled",
            description: "Reveal all was cancelled",
          });
        }}
        className="mt-8 py-2 px-6 rounded-lg text-xs font-bold tracking-wider uppercase transition-all hover:brightness-110"
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#ef4444',
        }}
      >
        Cancel
      </button>

      {/* Bottom text */}
      <p className="text-[8px] text-yellow-900/40 mt-6 tracking-widest font-mono uppercase">
        Please wait while we process your plays
      </p>
    </div>
  </div>
)}

      <RevealAllBatchSummary
        open={showRevealAllSummary}
        rows={voltzBatchRows}
        playNoun="play"
        cashWon={voltzBatchCash}
        pointsWon={voltzBatchPoints}
        variant="overlay"
        dismissLabel="Continue playing"
        onDismiss={() => {
          setShowRevealAllSummary(false);
          setRevealAllResults(null);
        }}
      />

      {/* ── Loading overlay ──────────────────────────────────────────────────── */}
      {!isGameReady && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-[#050505]"
          data-testid="loading-overlay"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(200,16,46,0.16),transparent_58%)]" />
          <div className="relative text-center px-8">
            <p className="font-prize text-[11px] tracking-[0.42em] text-white/55">RINGTONE</p>
            <p className="mt-1 font-prize text-5xl leading-none text-[#F1D47A]">VOLTZ</p>

            <div className="relative mx-auto mt-8 h-16 w-16">
              <div className="absolute inset-0 rounded-full border border-[#F1D47A]/25" />
              <div className="absolute -inset-2 rounded-full border border-[#C8102E]/35" />
              <div className="absolute inset-2 rounded-full border border-[#F1D47A]/70 border-t-transparent animate-spin" />
              <Zap className="absolute inset-0 m-auto h-6 w-6 text-[#F1D47A]" strokeWidth={1.6} />
            </div>

            <p
              className="mt-6 font-prize text-2xl tracking-[0.28em] text-[#F1D47A]"
              data-testid="text-loading"
            >
              CHARGING
            </p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
              Preparing your switches
            </p>

            <div className="mx-auto mt-6 h-[3px] w-44 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full w-2/3 rounded-full vg-anim-bar"
                style={{ background: "linear-gradient(90deg, #C8102E, #F1D47A)" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Result overlay */}
      {lastResult && (
      <GameResultOverlay
        open={!!(showResult && lastResult)}
        contained
        theme="voltz"
        overlayTestId="result-overlay"
        kind={isPhysicalWin ? "physical" : isWin ? "win" : isFreeReplay ? "extra" : "lose"}
        onClose={closeResult}
        kicker={
          isPhysicalWin
            ? "Physical prize — 3 match"
            : isWin
              ? "Power surge — 3 match"
              : isFreeReplay
                ? "Backup power — free play"
                : "No match — so close"
        }
        kickerTestId={
          isPhysicalWin
            ? "text-result-label-physical"
            : isWin
              ? "text-result-label"
              : isFreeReplay
                ? "text-result-free-replay"
                : "text-result-no-win"
        }
        title={
          isPhysicalWin || isWin
            ? "YOU WON"
            : isFreeReplay
              ? "FREE PLAY"
              : "UNLUCKY"
        }
        titleTestId={
          isPhysicalWin
            ? "text-prize-name-physical"
            : isWin
              ? "text-prize-name"
              : isFreeReplay
                ? "text-backup-title"
                : "text-modal-title"
        }
        subtitle={
          isPhysicalWin
            ? lastResult?.prizeName
            : isWin
              ? lastResult?.prizeName
              : isFreeReplay
                ? "Power stabilized"
                : "Switches didn't align"
        }
        prizeText={
          isPhysicalWin
            ? "Physical prize"
            : isWin
              ? formatVoltzPrizeHeadline(lastResult?.rewardType, lastResult?.rewardValue)
              : isFreeReplay
                ? "+1 Free Play"
                : undefined
        }
        prizeTestId={
          isPhysicalWin
            ? "text-physical-prize-badge"
            : isWin
              ? "text-prize-value"
              : isFreeReplay
                ? "text-free-play-badge"
                : "text-prize-value"
        }
        prizeSub={
          isPhysicalWin
            ? "Contact support to claim"
            : isWin && lastResult?.rewardType === "points"
              ? "Ringtone Points"
              : isWin
                ? "Verified & credited"
                : isFreeReplay
                  ? "Use it on your next flip"
                  : undefined
        }
        prizeSubTestId={isPhysicalWin ? "text-verified-physical" : isWin ? "text-verified" : undefined}
        icon={
          isPhysicalWin ? (
            <Package className="h-9 w-9 text-[#F1D47A]" data-testid="icon-physical-prize" />
          ) : isWin ? (
            <Zap className="h-9 w-9 text-[#F1D47A]" data-testid="icon-win" />
          ) : isFreeReplay ? (
            <RotateCcw className="h-8 w-8 text-[#F1D47A]" data-testid="icon-free-replay" />
          ) : (
            <PowerOff className="h-7 w-7 text-[#F1D47A]/50" data-testid="icon-no-win" />
          )
        }
        extra={
          lastResult ? (
            <div className="mb-4 flex justify-center gap-2">
              {lastResult.switchTexts.map((text, i) => (
                <div
                  key={i}
                  className="min-w-[62px] rounded-xl border border-[#F1D47A]/25 bg-[#F1D47A]/[0.06] px-3 py-2 text-center text-sm font-semibold text-[#F1D47A]"
                  data-testid={`text-switch-result-${i}`}
                  title={text}
                >
                  {formatSwitchText(text)}
                </div>
              ))}
            </div>
          ) : null
        }
        body={
          isNoWin
            ? "Match all 3 to win — try again."
            : undefined
        }
        primaryLabel={isWin || isPhysicalWin ? "Collect & continue" : isFreeReplay ? "Use free play" : "Try again"}
        onPrimary={closeResult}
        closeTestId="button-close-result"
        primaryTestId="button-continue"
      />
      )}
      </div>

      {isGameReady && playsRemaining > 0 && !showResult && (
        <p className="mt-3 text-center text-sm text-white/50">
          Tap a switch
          <span className="mx-1.5 text-[#F1D47A]">·</span>
          <span className="font-prize text-[#F1D47A]">match 3 to win</span>
        </p>
      )}

      {playsRemaining > 0 && !isProcessing && !showResult && !showRevealAllSummary && (
        <button
          type="button"
          onClick={() => handleRevealAll(playsRemaining)}
          disabled={isRevealingAll}
          className="rr-cta vg-reveal-all mt-4 w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.16em] disabled:opacity-50"
        >
          {isRevealingAll ? (
            <>
              <div className="w-4 h-4 border-2 border-[#F1D47A]/30 border-t-[#F1D47A] rounded-full animate-spin" />
              <span>Revealing...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Reveal all
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">{playsRemaining} plays</span>
            </>
          )}
        </button>
      )}

      {/* Out of plays */}
      <GameResultOverlay
        open={showNoPlaysDialog}
        kind="empty"
        theme="voltz"
        overlayTestId="no-plays-overlay"
        onClose={() => setNoPlaysDismissed(true)}
        kicker="Power depleted"
        title="OUT OF PLAYS"
        subtitle="You've used every play in this pack."
        prizeText="0"
        prizeSub="Plays remaining"
        primaryLabel="Get more plays"
        onPrimary={() => {
          setNoPlaysDismissed(true);
          setTimeout(() => {
            if (orderId) {
              localStorage.removeItem(`voltzHistory_${orderId}`);
            }
            setLocation(`/competition/${competitionId}`);
          }, 200);
        }}
        secondaryLabel="Close"
        onSecondary={() => setNoPlaysDismissed(true)}
        closeTestId="button-close-no-plays"
        primaryTestId="button-boost-power"
        secondaryTestId="button-exit-system"
      />
    </div>
  );
}