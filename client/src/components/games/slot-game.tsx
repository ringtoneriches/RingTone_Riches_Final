import { useEffect, useRef, useState, useCallback } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export interface SlotSpinResult {
  isWin: boolean;
  coinsWon: number;
  prizeType: string;
  prizeName: string;
  spinsRemaining: number;
  newEntry: {
    id: string;
    isWin: boolean;
    coinsWon: number;
    coinsSpent: number;
    spinNumber: number;
    usedAt: string;
  };
}

interface SlotGameProps {
  orderId: string;
  competitionId: string;
  creditsPerSpin: number;
  onSpinComplete: (result: SlotSpinResult) => void;
  onNoSpinsLeft: () => void;
}

export default function SlotGameComponent({
  orderId,
  competitionId,
  creditsPerSpin,
  onSpinComplete,
  onNoSpinsLeft,
}: SlotGameProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<any>(null);
  const gameSceneRef = useRef<any>(null);
  const { toast } = useToast();
  const [isGameReady, setIsGameReady] = useState(false);

  const orderIdRef = useRef(orderId);
  const creditsPerSpinRef = useRef(creditsPerSpin);
  const onSpinCompleteRef = useRef(onSpinComplete);
  const onNoSpinsLeftRef = useRef(onNoSpinsLeft);
  const isProcessingRef = useRef(false);
  const pendingResultRef = useRef<SlotSpinResult | null>(null);
  const toastRef = useRef(toast);

  useEffect(() => { orderIdRef.current = orderId; }, [orderId]);
  useEffect(() => { creditsPerSpinRef.current = creditsPerSpin; }, [creditsPerSpin]);
  useEffect(() => { onSpinCompleteRef.current = onSpinComplete; }, [onSpinComplete]);
  useEffect(() => { onNoSpinsLeftRef.current = onNoSpinsLeft; }, [onNoSpinsLeft]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const handleSpinRequest = useCallback(async () => {
  console.log("[SPIN] 🎰 Spin request initiated");
  console.log("[SPIN] Current state:", {
    isProcessing: isProcessingRef.current,
    hasGameScene: !!gameSceneRef.current,
    orderId: orderIdRef.current,
    creditsPerSpin: creditsPerSpinRef.current,
  });

  if (isProcessingRef.current) {
    console.warn("[SPIN] ⚠️ Spin already in progress, rejecting duplicate request");
    gameSceneRef.current?.deliverResult({ isWin: false, coinsWon: 0, prizeType: "none", prizeName: "" });
    console.log("[SPIN] Sent fallback result (already processing)");
    return;
  }
  
  console.log("[SPIN] ✅ No processing lock, proceeding with spin");
  isProcessingRef.current = true;

  try {
    console.log("[SPIN] 📡 Making API request to /api/play-slot");
    console.log("[SPIN] Request payload:", {
      orderId: orderIdRef.current,
      coinsSpent: creditsPerSpinRef.current,
    });

    const startTime = performance.now();
    const res = await apiRequest("/api/play-slot", "POST", {
      orderId: orderIdRef.current,
      coinsSpent: creditsPerSpinRef.current,
    });
    const endTime = performance.now();
    
    console.log(`[SPIN] 📥 API response received in ${(endTime - startTime).toFixed(2)}ms`);
    console.log("[SPIN] Response status:", res.status, res.statusText);
    console.log("[SPIN] Response headers:", Object.fromEntries(res.headers.entries()));

    const data = await res.json();
    console.log("[SPIN] 📦 Response data:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error(`[SPIN] ❌ API error (${res.status}):`, data);
      
      if (data.message === "All spins used") {
        console.warn("[SPIN] ⚠️ No spins remaining, triggering callback");
        onNoSpinsLeftRef.current();
      }
      
      console.log("[SPIN] Sending fallback result due to API error");
      gameSceneRef.current?.deliverResult({ isWin: false, coinsWon: 0, prizeType: "none", prizeName: "" });
      return;
    }

    console.log("[SPIN] ✅ API request successful");

    const spinResult: SlotSpinResult = {
      isWin: !!data.isWin,
      coinsWon: data.coinsWon || 0,
      prizeType: data.prizeType || "none",
      prizeName: data.prizeName || "",
      spinsRemaining: data.spinsRemaining ?? -1,
      newEntry: {
        id: `local-${data.spinNumber}`,
        isWin: !!data.isWin,
        coinsWon: data.coinsWon || 0,
        coinsSpent: creditsPerSpinRef.current,
        spinNumber: data.spinNumber,
        usedAt: new Date().toISOString(),
      },
    };

    console.log("[SPIN] 🎯 Processed spin result:", {
      isWin: spinResult.isWin,
      coinsWon: spinResult.coinsWon,
      prizeType: spinResult.prizeType,
      prizeName: spinResult.prizeName,
      spinsRemaining: spinResult.spinsRemaining,
      spinNumber: spinResult.newEntry.spinNumber,
    });

    pendingResultRef.current = spinResult;
    console.log("[SPIN] 💾 Stored result in pendingResultRef");

    if (data.isWin) {
      console.log("[SPIN] 🎉 WIN detected! Invalidating user query cache");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } else {
      console.log("[SPIN] 😔 No win this time");
    }

    console.log("[SPIN] 🎬 Delivering result to game scene");
    console.log("[SPIN] Game scene exists:", !!gameSceneRef.current);
    
    gameSceneRef.current?.deliverResult(
      {
        isWin: spinResult.isWin,
        coinsWon: spinResult.coinsWon,
        prizeType: spinResult.prizeType,
        prizeName: spinResult.prizeName,
      },
      spinResult
    );
    
    console.log("[SPIN] ✅ Result delivered successfully");

  } catch (err) {
    console.error("[SPIN] 💥 Spin request failed with error:", err);
    console.error("[SPIN] Error details:", {
      name: err instanceof Error ? err.name : 'Unknown',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    
    toastRef.current({ 
      title: "Error", 
      description: "Network error. Please try again.", 
      variant: "destructive" 
    });
    console.log("[SPIN] 🛑 Sending fallback result due to network error");
    gameSceneRef.current?.deliverResult({ isWin: false, coinsWon: 0, prizeType: "none", prizeName: "" });
  } finally {
    console.log("[SPIN] 🔓 Releasing processing lock");
    isProcessingRef.current = false;
    console.log("[SPIN] 🏁 Spin request completed");
  }
}, []);

  useEffect(() => {
    if (!gameContainerRef.current) return;
    let game: any = null;
    let destroyed = false;

    const initGame = async () => {
      const Phaser = await import("phaser");
      const { Boot } = await import("./slot/Boot");
      const { Preload } = await import("./slot/Preload");
      const { SlotGame } = await import("./slot/SlotGame");

      if (!gameContainerRef.current || destroyed) return;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        parent: gameContainerRef.current,
        backgroundColor: "#080010",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        input: { touch: { capture: false } },
        audio: { disableWebAudio: false, noAudio: false },
        scene: [Boot, Preload, SlotGame],
      });

      gameInstanceRef.current = game;

      const applyTouchAction = () => {
        const canvas = gameContainerRef.current?.querySelector("canvas");
        if (canvas) { canvas.style.touchAction = "pan-y"; }
        else { requestAnimationFrame(applyTouchAction); }
      };
      requestAnimationFrame(applyTouchAction);

      const pollForScene = () => {
        if (destroyed) return;
        const scene = game?.scene?.getScene("SlotGame") as any;
        if (scene && scene.scene?.isActive()) {
          gameSceneRef.current = scene;
          scene.setCallbacks({ onSpinRequest: handleSpinRequest });
          setIsGameReady(true);

          game.events.on("spinComplete", (_result: any, fullResult: any) => {
            const pending = fullResult ?? pendingResultRef.current;
            pendingResultRef.current = null;
            if (pending) onSpinCompleteRef.current(pending);
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
      if (game) {
        try {
          // Close the AudioContext before destroy to prevent
          // "Cannot resume a closed AudioContext" errors from
          // Phaser's lingering visibility event listeners.
          const soundMgr = game.sound as any;
          if (soundMgr?.context && soundMgr.context.state !== "closed") {
            soundMgr.context.close().catch(() => {});
          }
        } catch (e) {}
        try { game.destroy(true); } catch (e) {}
        gameInstanceRef.current = null;
        gameSceneRef.current = null;
      }
    };
  }, [handleSpinRequest]);

  return (
    <div className="relative w-full h-full">
      {!isGameReady && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "#080010" }}
        >
          <div className="text-center">
            <Loader2
              className="w-10 h-10 animate-spin mx-auto mb-3"
              style={{ color: "#FFD700" }}
            />
            <p className="text-sm" style={{ color: "rgba(200,140,255,0.65)" }}>
              Loading game...
            </p>
          </div>
        </div>
      )}
      <div ref={gameContainerRef} className="w-full h-full" />
    </div>
  );
}