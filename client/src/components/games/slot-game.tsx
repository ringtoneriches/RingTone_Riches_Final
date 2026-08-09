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
  competitionId?: string;
  creditsPerSpin: number;
  spinsRemaining: number;
  onSpinComplete: (result: SlotSpinResult) => void;
  onNoSpinsLeft: () => void;
}

export default function SlotGameComponent({
  orderId,
  competitionId,
  creditsPerSpin,
  spinsRemaining,
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
  const spinsRemainingRef = useRef(spinsRemaining);
  const onSpinCompleteRef = useRef(onSpinComplete);
  const onNoSpinsLeftRef = useRef(onNoSpinsLeft);
  const isProcessingRef = useRef(false);
  const pendingResultRef = useRef<SlotSpinResult | null>(null);
  const toastRef = useRef(toast);

  useEffect(() => { orderIdRef.current = orderId; }, [orderId]);
  useEffect(() => { creditsPerSpinRef.current = creditsPerSpin; }, [creditsPerSpin]);
  useEffect(() => { spinsRemainingRef.current = spinsRemaining; }, [spinsRemaining]);
  useEffect(() => { onSpinCompleteRef.current = onSpinComplete; }, [onSpinComplete]);
  useEffect(() => { onNoSpinsLeftRef.current = onNoSpinsLeft; }, [onNoSpinsLeft]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // Keep Phaser scene in sync so beginSpin can block audio when exhausted
  useEffect(() => {
    gameSceneRef.current?.setSpinsRemaining?.(spinsRemaining);
  }, [spinsRemaining, isGameReady]);

  const handleSpinRequest = useCallback(async () => {
  console.log("[SPIN] 🎰 Spin request initiated");
  console.log("[SPIN] Current state:", {
    isProcessing: isProcessingRef.current,
    hasGameScene: !!gameSceneRef.current,
    orderId: orderIdRef.current,
    creditsPerSpin: creditsPerSpinRef.current,
    spinsRemaining: spinsRemainingRef.current,
  });

  if (spinsRemainingRef.current <= 0) {
    console.warn("[SPIN] ⚠️ No spins remaining — cancelling without audio");
    gameSceneRef.current?.cancelSpin?.();
    onNoSpinsLeftRef.current();
    return;
  }

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

    const data = await res.json();
    console.log("[SPIN] 📦 Response data:", JSON.stringify(data, null, 2));

    console.log("[SPIN] ✅ API request successful");

    const spinsAllowed = data.spinsAllowed ?? data.spinsUsed ?? data.spinNumber;
    const spinsRemainingAfter =
      typeof data.spinsRemaining === "number"
        ? data.spinsRemaining
        : typeof data.spinsUsed === "number" && typeof data.spinsAllowed === "number"
          ? Math.max(0, data.spinsAllowed - data.spinsUsed)
          : typeof data.spinNumber === "number" && typeof data.spinsAllowed === "number"
            ? Math.max(0, data.spinsAllowed - data.spinNumber)
            : spinsRemainingRef.current - 1;

    gameSceneRef.current?.setSpinsRemaining?.(spinsRemainingAfter);

    const spinResult: SlotSpinResult = {
      isWin: !!data.isWin,
      coinsWon: data.coinsWon || 0,
      prizeType: data.prizeType || "none",
      prizeName: data.prizeName || "",
      spinsRemaining: spinsRemainingAfter,
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
      spinsAllowed,
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
    const message = err instanceof Error ? err.message : String(err);

    // apiRequest throws on 403 "All spins used" — cancel quietly, no lose/spin audio
    if (message.includes("All spins used")) {
      console.warn("[SPIN] ⚠️ All spins used — cancelling without result audio");
      gameSceneRef.current?.cancelSpin?.();
      gameSceneRef.current?.setSpinsRemaining?.(0);
      onNoSpinsLeftRef.current();
      return;
    }

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

      // Wait two animation frames so the CSS aspect-ratio box has
      // fully committed its layout size before we measure it —
      // measuring immediately on mount can catch a stale/small size.
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      if (!gameContainerRef.current || destroyed) return;

      const rect = gameContainerRef.current.getBoundingClientRect();
      const gameW = Math.round(rect.width) || 1280;
      const gameH = Math.round(rect.height) || 720;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: gameW,
        height: gameH,
        parent: gameContainerRef.current,
        backgroundColor: "#080010",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
         render: {
        pixelArt: false,     // Set to false for smooth images
        antialias: true,     // Enable antialiasing for smoother edges
        roundPixels: false,  // Keep as false for smoother animation
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
          scene.setCallbacks({
            onSpinRequest: handleSpinRequest,
            onNoSpinsLeft: () => onNoSpinsLeftRef.current(),
          });
          scene.setSpinsRemaining?.(spinsRemainingRef.current);
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
        // Let Phaser own AudioContext teardown. Manually calling
        // context.close() and/or nulling context caused:
        // - "Cannot close a closed AudioContext" (double close)
        // - "Cannot read properties of null (reading 'close')"
        try {
          game.sound?.stopAll?.();
        } catch {}
        try {
          game.destroy(true);
        } catch {}
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