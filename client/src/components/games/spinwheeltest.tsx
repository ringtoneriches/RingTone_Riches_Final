import React, { useRef, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import R_Prize from "../../../../attached_assets/R_prize.png";
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
import confetti from 'canvas-confetti';
import prize1 from "../../../../attached_assets/Car/astonmartin.png";
import prize2 from "../../../../attached_assets/Car/audi.png";
import prize3 from "../../../../attached_assets/Car/bentley.png";
import prize4 from "../../../../attached_assets/Car/bmw.png";
import prize5 from "../../../../attached_assets/Car/ferrari-emblem-1.png";
import prize6 from "../../../../attached_assets/Car/ford.png";
import prize7 from "../../../../attached_assets/Car/honda.png";
import prize8 from "../../../../attached_assets/Car/jaguar.png";
import prize9 from "../../../../attached_assets/Car/lamborghini.png";
import prize10 from "../../../../attached_assets/Car/landrover.png";
import prize11 from "../../../../attached_assets/Car/lexus.png";
import prize12 from "../../../../attached_assets/Car/maercedes.png";
import prize13 from "../../../../attached_assets/Car/maserati.png";
import prize14 from "../../../../attached_assets/Car/mclaren.png";
import prize15 from "../../../../attached_assets/Car/mini.png";
import prize16 from "../../../../attached_assets/Car/nissan.png";
import prize17 from "../../../../attached_assets/Car/porsche.png";
import prize18 from "../../../../attached_assets/Car/Rolls-Royce_Motors-Logo.wine.png";
import prize19 from "../../../../attached_assets/Car/toyota.png";
import prize20 from "../../../../attached_assets/Car/wv.png";

import pointer from "../../../../attached_assets/pointer.png";
import ring from "../../../../attached_assets/ring.png";

import MiddleVideo from "../../../../attached_assets/Middlevideo.mp4"
import { useLocation } from "wouter";
import PlayResultsTable, {
  applySpinPlayTickets,
  prizeFromSpinApi,
  rowsFromSpinHistory,
  type SpinHistoryRow,
} from "@/components/games/PlayResultsTable";
import RevealAllBatchSummary, { type RevealBatchRow } from "@/components/games/RevealAllBatchSummary";

// Icon mapping for admin configuration - uses car PNG images
const ICON_MAP: Record<string, any> = {
  AstonMartin: prize1,
  Audi: prize2,
  Bentley: prize3,
  BMW: prize4,
  Ferrari: prize5,
  Ford: prize6,
  Honda: prize7,
  Jaguar: prize8,
  Lamborghini: prize9,
  LandRover: prize10,
  Lexus: prize11,
  MercedesBenz: prize12,
  Maserati: prize13,
  McLaren: prize14,
  MiniCooper: prize15,
  Nissan: prize16,
  Porsche: prize17,
  RollsRoyce: prize18,
  Toyota: prize19,
  Volkswagen: prize20,
  R_Prize,
  NoWin: "❌",
};

interface SpinWheelProps {
  onSpinComplete: (
    winnerSegment: number,
    winnerLabel: string,
    winnerPrize: any,
  ) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  ticketCount?: number;
  orderId?: string;
  competitionId?: string;
  playTickets?: Array<string | null>;
  congratsAudioRef: React.RefObject<HTMLAudioElement>;
  onAllSpinsComplete?: () => void;   
}

interface WheelSegment {
  id: string;
  label: string;
  color: string;
  iconKey: string;
  rewardType: "cash" | "points" | "lose";
  rewardValue: number | string;
  probability: number;
  maxWins: number | null;
}

interface WheelConfig {
  id: string;
  segments: WheelSegment[];
  maxSpinsPerUser: number | null;
  isActive: boolean;
  isVisible?: boolean;
}

// Add these functions for localStorage management (order-specific)
const loadSpinHistory = (
  orderId?: string,
): SpinHistoryRow[] => {
  try {
    if (!orderId) return [];
    const saved = localStorage.getItem(`spinWheelHistory_${orderId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveSpinHistory = (
  history: SpinHistoryRow[],
  orderId?: string,
) => {
  try {
    if (!orderId) return;
    localStorage.setItem(
      `spinWheelHistory_${orderId}`,
      JSON.stringify(history),
    );
  } catch (error) {
    console.error("Failed to save spin history:", error);
  }
};

const SpinWheel: React.FC<SpinWheelProps> = ({
  onSpinComplete,
  isSpinning,
  setIsSpinning,
  ticketCount,
  orderId,
  competitionId,
  playTickets = [],
  congratsAudioRef,
  onAllSpinsComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const centerVideoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  // 🛡️ CRITICAL SAFEGUARD: Prevent rapid-fire spins
  const lastSpinTimeRef = useRef<number>(0);
  const manualSpinRef = useRef<boolean>(false);


  // Fetch wheel configuration from admin - refetch on every spin for real-time updates
  const { data: wheelConfig, refetch: refetchConfig } = useQuery<WheelConfig>({
    queryKey: ["/api/admin/game-spin-config"],
  });

  // Inside your SpinWheel component, add the state:
  const [spinHistory, setSpinHistory] = useState<SpinHistoryRow[]>([]);
  
  // Confirmation dialog state
  const [showRevealAllDialog, setShowRevealAllDialog] = useState(false);
  const [showRevealAllResultDialog, setShowRevealAllResultDialog] = useState(false);
  const [revealBatchRows, setRevealBatchRows] = useState<RevealBatchRow[]>([]);
  const [revealBatchCash, setRevealBatchCash] = useState(0);
  const [revealBatchPoints, setRevealBatchPoints] = useState(0);
  const [showOutOfSpinDialog, setShowOutOfSpinDialog] = useState(false);
    const [,setLocation] = useLocation();
  
  // Check if all spins are used
  const allSpinsUsed =
    ticketCount === 0 ||
    (spinHistory.length > 0 && spinHistory.every((s) => s.status === "SPUN"));

  // Transform admin wheel config to component format (memoized to prevent infinite re-renders)
  const segments = useMemo(() => {
    return (wheelConfig?.segments || []).map((seg) => {
      const icon = ICON_MAP[seg.iconKey] || seg.iconKey;
      let amount: number | string = 0;

      if (seg.rewardType === "cash") {
        amount = Number(seg.rewardValue);
      } else if (seg.rewardType === "points") {
        amount = `${seg.rewardValue} Ringtone`;
      } else {
        amount = 0;
      }

      return {
        id: seg.id,
        label: seg.label,
        color: seg.color,
        icon,
        amount,
        isCross: seg.rewardType === "lose",
      };
    });
  }, [wheelConfig?.segments]);

  const [rotation, setRotation] = useState(
    (2 * Math.PI) / Math.max(segments.length, 1) / 1.3,
  );

  // Initialize spin history when ticketCount changes
  useEffect(() => {
    if (!ticketCount || !orderId) return;

    const savedHistory = loadSpinHistory(orderId);

    if (savedHistory.length === ticketCount) {
      setSpinHistory(applySpinPlayTickets(savedHistory, playTickets));
    } else if (savedHistory.length > 0) {
      const adjustedHistory = adjustSpinHistoryToCount(
        savedHistory,
        ticketCount,
      );
      setSpinHistory(applySpinPlayTickets(adjustedHistory, playTickets));
    } else {
      setSpinHistory(
        Array.from({ length: ticketCount }, () => ({
          status: "NOT SPUN",
          prize: { brand: "-", amount: "-" },
        })),
      );
    }
  }, [ticketCount, orderId]);

  useEffect(() => {
    if (!playTickets.length) return;
    setSpinHistory((prev) => applySpinPlayTickets(prev, playTickets));
  }, [playTickets.join("|")]);

  // Helper function to adjust spin history
  const adjustSpinHistoryToCount = (history: any[], targetCount: number) => {
    if (history.length === targetCount) return history;

    if (history.length < targetCount) {
      const newEntries = Array.from(
        { length: targetCount - history.length },
        () => ({
          status: "NOT SPUN",
          prize: { brand: "-", amount: "-" },
        }),
      );
      return [...history, ...newEntries];
    } else {
      return history;
    }
  };

  // Save to localStorage whenever spinHistory changes (order-specific)
  useEffect(() => {
    if (spinHistory.length > 0 && orderId) {
      saveSpinHistory(spinHistory, orderId);
    }
  }, [spinHistory, orderId]);

  // ✅ ROBUST IMAGE PRELOAD - Wait for actual completion, trigger redraws on late loads
  useEffect(() => {
    if (segments.length === 0) return;

    setLoadedImages([]);
    setAllImagesLoaded(false);

    let isMounted = true;
    const imagesArray: HTMLImageElement[] = new Array(segments.length);
    let loadedCount = 0;

    // Create array of promises for parallel image loading
    const imageLoadPromises = segments.map((segment, index) => {
      return new Promise<void>((resolve, reject) => {
        // Handle cross/lose segments immediately
        if (segment.isCross || segment.icon === "❌") {
          imagesArray[index] = new Image();
          loadedCount++;
          resolve();
          return;
        }

        const img = new Image();
        // Remove crossOrigin for local files - it can cause issues
        // img.crossOrigin = "anonymous";
        
        img.onload = async () => {
          try {
            // Use decode() to ensure image is fully ready for canvas
            await img.decode();
            if (isMounted) {
              imagesArray[index] = img;
              loadedCount++;
              // Trigger incremental update for smooth loading
              setLoadedImages([...imagesArray]);
              if (loadedCount === segments.length) {
                setAllImagesLoaded(true);
              }
            }
            resolve();
          } catch (decodeError) {
            // decode() failed, but image loaded - still usable
            if (isMounted) {
              imagesArray[index] = img;
              loadedCount++;
              setLoadedImages([...imagesArray]);
              if (loadedCount === segments.length) {
                setAllImagesLoaded(true);
              }
            }
            resolve();
          }
        };
        
        img.onerror = () => {
          console.warn(`Failed to load image for segment ${index}: ${segment.icon}`);
          if (isMounted) {
            imagesArray[index] = new Image(); // Use blank fallback
            loadedCount++;
            setLoadedImages([...imagesArray]);
            if (loadedCount === segments.length) {
              setAllImagesLoaded(true);
            }
          }
          reject(new Error(`Image load failed: ${segment.icon}`));
        };
        
        // Start loading immediately - ALL images load in parallel
        img.src = segment.icon as string;
      });
    });

    // Wait for all images - with generous 10 second timeout as safety net
    Promise.allSettled(imageLoadPromises).then(() => {
      if (isMounted && loadedCount === segments.length) {
        setAllImagesLoaded(true);
      }
    });

    // Safety timeout: if nothing loads after 10 seconds, show wheel anyway
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !allImagesLoaded) {
        console.warn('Image loading timeout - showing wheel with loaded images');
        setAllImagesLoaded(true);
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [segments]);

  // iOS FIX: Prevent video fullscreen on click
  useEffect(() => {
    const preventVideoFullscreen = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const centerVideo = centerVideoRef.current;
    const backgroundVideo = backgroundVideoRef.current;

    if (centerVideo) {
      centerVideo.addEventListener("click", preventVideoFullscreen);
      centerVideo.addEventListener("touchstart", preventVideoFullscreen);
    }

    if (backgroundVideo) {
      backgroundVideo.addEventListener("click", preventVideoFullscreen);
      backgroundVideo.addEventListener("touchstart", preventVideoFullscreen);
    }

    return () => {
      if (centerVideo) {
        centerVideo.removeEventListener("click", preventVideoFullscreen);
        centerVideo.removeEventListener("touchstart", preventVideoFullscreen);
      }
      if (backgroundVideo) {
        backgroundVideo.removeEventListener("click", preventVideoFullscreen);
        backgroundVideo.removeEventListener(
          "touchstart",
          preventVideoFullscreen,
        );
      }
    };
  }, []);


  const triggerWinConfetti = () => {
  const colors = ["#ffd700", "#ffed4a", "#fbbf24", "#f59e0b", "#22c55e", "#ef4444"];
  
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.7 },
      colors: colors,
      startVelocity: 55,
    });
    confetti({
      particleCount: 5,
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

  // Big burst in the center
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.5 },
    colors: colors,
    startVelocity: 45,
  });
};

  const drawWheel = (rotationAngle = rotation) => {
    if (segments.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Responsiveness + sharpness - Crystal clear on all devices
    const isMobile = window.innerWidth < 768;
    const baseDpr = window.devicePixelRatio || 1;
    // 4x DPR for crystal-clear images on both mobile and desktop
    const dpr = Math.min(baseDpr * 2, 4);

    // Size setup
    const displaySize = isMobile ? Math.min(window.innerWidth - 20, 450) : 600;
    const centerRadius = isMobile ? 35 : 45;
    const centerFontSize = isMobile ? 11 : 14;

    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const centerX = displaySize / 2;
    const centerY = displaySize / 2;
    const radius = Math.min(centerX, centerY) - 12;
    const segmentAngle = (2 * Math.PI) / segments.length;

    ctx.clearRect(0, 0, displaySize, displaySize);

    // Apply rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.translate(-centerX, -centerY);

    // 🎡 Draw segments
    segments.forEach((segment, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      // Segment border (gold)
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = isMobile ? 1.5 : 2.5;
      ctx.stroke();

      // Image or X
      ctx.save();

      const midAngle = startAngle + segmentAngle / 2;
      let distanceFromCenter = radius * (isMobile ? 0.85 : 0.8);

      const imageX = centerX + distanceFromCenter * Math.cos(midAngle);
      const imageY = centerY + distanceFromCenter * Math.sin(midAngle);

      // Move to that point and rotate image upright
      ctx.translate(imageX, imageY);
      ctx.rotate(midAngle + Math.PI / 2);

      if (segment.isCross) {
        // Draw red X for Nice Try segments
        drawRedX(ctx, isMobile);
      } else if (loadedImages[index]) {
        // SPECIAL CASE: Larger size for R Prize (mystery prize)
        let imgWidth = isMobile ? 28 : 42;
        let imgHeight = isMobile ? 28 : 42;

        if (segment.label === "R Prize") {
          imgWidth = isMobile ? 35 : 55;
          imgHeight = isMobile ? 35 : 55;
        }
        // SPECIAL CASE: WIDER image for Rolls Royce
        else if (segment.label === "Rolls Royce") {
          imgWidth = isMobile ? 45 : 70;
          imgHeight = isMobile ? 30 : 45;
        }

        else if (segment.label === "Audi") {
          imgWidth = isMobile ? 25 : 40;
          imgHeight = isMobile ? 15 : 25;
        }

        try {
          ctx.drawImage(
            loadedImages[index],
            -imgWidth / 2,
            -imgHeight / 2,
            imgWidth,
            imgHeight,
          );
        } catch (error) {
          console.warn(`Failed to draw image for ${segment.label}`);
          drawFallbackText(ctx, segment.label, isMobile);
        }
      } else {
        // Fallback: Draw text label
        drawFallbackText(ctx, segment.label, isMobile);
      }

      ctx.restore();
    });

    ctx.restore(); // Restore transformation

     // 🟡 Outer ring (wheel border)
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

// GOLD RING GRADIENT (matches your image)
const gradient = ctx.createLinearGradient(
  centerX - radius, centerY - radius,  // top-left
  centerX + radius, centerY + radius   // bottom-right
);

gradient.addColorStop(0.00, "#f6e37b");     // light
gradient.addColorStop(0.14, "#94712aff");   // dark
gradient.addColorStop(0.28, "#f6e37b");     // light
gradient.addColorStop(0.42, "#94712aff");   // dark
gradient.addColorStop(0.56, "#f6e37b");     // light
gradient.addColorStop(0.70, "#94712aff");   // dark
gradient.addColorStop(0.84, "#f6e37b");     // light
gradient.addColorStop(1.00, "#94712aff");   // dark




ctx.strokeStyle = gradient;
ctx.lineWidth = isMobile ? 6 : 8; // thicker ring like your image
ctx.stroke();

    // 🎯 Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a1a";
    ctx.fill();
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = isMobile ? 3 : 4;
    ctx.stroke();

    // SPIN text
    ctx.fillStyle = "#D4AF37";
    ctx.font = `bold ${centerFontSize}px Inter`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPIN", centerX, centerY);
  };

  // Helper function to draw red X
  const drawRedX = (ctx: CanvasRenderingContext2D, isMobile: boolean) => {
    const xSize = isMobile ? 15 : 25;
    ctx.strokeStyle = "#ff0033";
    ctx.lineWidth = isMobile ? 4 : 6;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-xSize / 2, -xSize / 2);
    ctx.lineTo(xSize / 2, xSize / 2);
    ctx.moveTo(xSize / 2, -xSize / 2);
    ctx.lineTo(-xSize / 2, xSize / 2);
    ctx.stroke();
  };

  // Helper function to draw fallback text
  const drawFallbackText = (
    ctx: CanvasRenderingContext2D,
    label: string,
    isMobile: boolean,
  ) => {
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${isMobile ? 8 : 10}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Use abbreviation for small space
    const shortLabel = label.split(" ")[0].substring(0, 3);
    ctx.fillText(shortLabel, 0, 0);
  };

  const getWinner = (angle: number) => {
    const segAngle = (2 * Math.PI) / segments.length;
    const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const index = Math.floor(normalized / segAngle) % segments.length;
    return {
      index,
      label: segments[index].label,
      prize: {
        brand: segments[index].label,
        amount: segments[index].amount,
      },
    };
  };

 const revealAllSpins = async () => {
  if (isSpinning || !competitionId || !orderId) {
    return;
  }

  const remainingCount = spinHistory.filter(s => s.status === "NOT SPUN").length;
  if (remainingCount === 0) {
    return;
  }

  setIsSpinning(true);
  setShowRevealAllDialog(false);

  try {
    await refetchConfig();

    const response = await fetch("/api/reveal-all-spins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        competitionId,
        orderId,
        count: remainingCount,
      }),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error("Failed to reveal all spins");
    }

    const results = await response.json();
    const spins = Array.isArray(results?.spins)
      ? results.spins
      : Array.isArray(results?.results)
        ? results.results
        : [];
    
    // Check if there are any wins in the results
    let hasWins = false;
    if (spins.length) {
      hasWins = spins.some((spin: any) => {
        const prize = prizeFromSpinApi(spin);
        return prize.amount !== 0 && 
               prize.amount !== "-" && 
               !String(prize.brand || "").toLowerCase().includes("lose");
      });
      
      // OR check if the backend returns totalWon
      if (results.totalWon && results.totalWon > 0) {
        hasWins = true;
      }
    }
    
    // Update spin history with all results
    setSpinHistory(prev => {
      const updated = [...prev];
      let notSpunIndex = 0;

      spins.forEach((spin: any) => {
        while (notSpunIndex < updated.length && updated[notSpunIndex].status === "SPUN") {
          notSpunIndex++;
        }

        if (notSpunIndex < updated.length) {
          updated[notSpunIndex] = {
            status: "SPUN",
            prize: prizeFromSpinApi(spin),
          };
          notSpunIndex++;
        }
      });

      return updated;
    });

    setRevealBatchRows(
      spins.map((spin: any, i: number) => ({
        ...rowsFromSpinHistory([{ status: "SPUN", prize: prizeFromSpinApi(spin) }])[0],
        id: i,
        number: i + 1,
      })),
    );
    setRevealBatchCash(Number(results?.summary?.totalCash || 0));
    setRevealBatchPoints(Number(results?.summary?.totalPoints || 0));
    
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/spin-order", orderId] });

    setIsSpinning(false);

    // 🔥 ADD CONFETTI FOR BATCH WINS
    if (hasWins) {
      triggerWinConfetti();
    }

    setShowRevealAllResultDialog(true);

  } catch (error) {
    console.error("Error revealing all spins:", error);
    setIsSpinning(false);
    alert("Failed to reveal all spins. Please try again.");
  }
};

  const spinWheel = async () => {
    // Check if all spins are used
    if (allSpinsUsed) {
    setShowOutOfSpinDialog(true);

      return;
    }
    
    // 🛡️ CRITICAL: Prevent rapid consecutive spins (anti-auto-queue safeguard)
    const now = Date.now();
    const timeSinceLastSpin = now - lastSpinTimeRef.current;
    
    // Require at least 3 seconds between spins to prevent auto-queue bug and duplicate API calls
    if (timeSinceLastSpin < 3000 && lastSpinTimeRef.current > 0) {
      console.warn(`🛡️ Spin blocked: Too fast (${timeSinceLastSpin}ms since last spin). Please wait ${Math.ceil((3000 - timeSinceLastSpin) / 1000)}s`);
      return;
    }
    
    // 🛡️ CRITICAL: Prevent duplicate spins while one is in progress
    if (isSpinning) {
      console.warn(`🛡️ Spin blocked: Already spinning`);
      return;
    }

    if (segments.length === 0) {
      return;
    }

    if (!competitionId || !orderId) {
      console.error("Missing competitionId or orderId");
      return;
    }

    // Mark as manual spin and record timestamp
    manualSpinRef.current = true;
    lastSpinTimeRef.current = now;
    
    setIsSpinning(true);
    setWinner(null);

    try {
      // 🎯 STEP 1: Refetch configuration for real-time updates
      // console.log("Refetching wheel configuration for latest settings...");
      const configResult = await refetchConfig();
      const freshSegments = (configResult.data?.segments || []).map((seg: any) => {
        const icon = ICON_MAP[seg.iconKey] || seg.iconKey;
        let amount: number | string = 0;

        if (seg.rewardType === "cash") {
          amount = Number(seg.rewardValue);
        } else if (seg.rewardType === "points") {
          amount = `${seg.rewardValue} Ringtones`;
        } else {
          amount = 0;
        }

        return {
          id: seg.id,
          label: seg.label,
          color: seg.color,
          icon,
          amount,
          isCross: seg.rewardType === "lose",
        };
      });

      // 🎯 STEP 2: Call server to get the winning segment (server-side determination)
      // console.log("Calling server for winning segment...");
      const response = await fetch("/api/play-spin-wheel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          competitionId,
          orderId,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.message || "Failed to get spin result from server");
      }

      const result = await response.json();
      // console.log("Server returned result:", result);
      const winningSegmentId = result.winningSegmentId;

      // Find the winning segment index in our segments array
      let winningIndex = freshSegments.findIndex((seg: any) => seg.id === winningSegmentId);
      if (winningIndex === -1) {
        const resultType = result.result?.type || result.prize?.type;
        const isLose = !resultType || resultType === "lose" || resultType === "none";
        if (isLose) {
          winningIndex = freshSegments.findIndex((seg: any) => seg.isCross);
        } else {
          const value = Number(result.result?.value ?? result.prize?.amount);
          if (!Number.isNaN(value)) {
            winningIndex = freshSegments.findIndex((seg: any) => Number(seg.amount) === value);
          }
        }
      }
      if (winningIndex === -1) {
        console.error("Winning segment not found:", winningSegmentId, "in", freshSegments);
        throw new Error("Invalid winning segment received from server");
      }

      // console.log(`Winning segment: ${freshSegments[winningIndex].label} (index ${winningIndex})`);

      // 🎯 STEP 3: Calculate exact rotation to land on winning segment
      const segAngle = (2 * Math.PI) / freshSegments.length;
      const pointerAngle = -Math.PI / 2; // Top center (12 o'clock)
      
      // Midpoint angle of the winning segment
      const segmentMidAngle = winningIndex * segAngle + segAngle / 2;
      
      // Calculate desired final rotation (normalized to 0-2π)
      const desiredMod = ((pointerAngle - segmentMidAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      
      // Add extra full rotations for animation (3-5 full spins)
      const baseSpins = 3 + Math.random() * 2;
      const minRotation = rotation + baseSpins * 2 * Math.PI;
      
      // Find the next rotation value that lands on our desired position
      const currentMod = minRotation % (2 * Math.PI);
      let targetRotation = minRotation - currentMod + desiredMod;
      
      // Ensure we're spinning forward
      if (targetRotation < minRotation) {
        targetRotation += 2 * Math.PI;
      }

      // console.log(`Calculated rotation: ${targetRotation} radians (${(targetRotation * 180 / Math.PI).toFixed(2)} degrees)`);

      // 🎯 STEP 4: Animate to the exact position
      const duration = 4000;
      const startTime = performance.now();
      const startRotation = rotation;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOut(progress);

        const currentRotation =
          startRotation + easedProgress * (targetRotation - startRotation);

        setRotation(currentRotation);
        drawWheel(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Set final rotation
          const finalRotation = targetRotation % (2 * Math.PI);
          setRotation(finalRotation);

          // Get winner info from the winning index
          const winnerResult = {
            index: winningIndex,
            label: freshSegments[winningIndex].label,
            prize: {
              brand: freshSegments[winningIndex].label,
              amount: freshSegments[winningIndex].amount,
            },
          };
          
          setWinner(winnerResult.label);
          setIsSpinning(false);

          onSpinComplete(
            winnerResult.index,
            winnerResult.label,
            result.prize, // Use prize data from server
            
          );
          // Play congratulation sound
          
          const isWin =
  winnerResult.prize.amount !== 0 &&
  winnerResult.prize.amount !== "-" &&
  !winnerResult.prize.amount?.toString().toLowerCase().includes("lose");

if (isWin && congratsAudioRef.current) {
  congratsAudioRef.current.currentTime = 0;
  congratsAudioRef.current.play().catch(() => {});
    triggerWinConfetti();
}

          // ✅ Update spin history
          setSpinHistory((prev) => {
            const updated = [...prev];
            const firstUnspunIndex = updated.findIndex(
              (s) => s.status === "NOT SPUN",
            );

            if (firstUnspunIndex !== -1) {
              updated[firstUnspunIndex] = {
                status: "SPUN",
                prize: prizeFromSpinApi(result),
              };
            }
              // 🔥 CHECK IF ALL SPINS ARE NOW SPENT
  const allUsed = updated.every(s => s.status === "SPUN");
  if (allUsed) {
    onAllSpinsComplete?.();   // <-- FIRE CALLBACK
  }
            return updated;
          });
        }
      };

      requestAnimationFrame(animate);
    } catch (error) {
      console.error("Error during spin:", error);
      setIsSpinning(false);
      // Stop sound when popup closes
if (congratsAudioRef.current) {
  congratsAudioRef.current.pause();
  congratsAudioRef.current.currentTime = 0;
}
      // Show error to user
      alert(error instanceof Error ? error.message : "Failed to spin. Please try again.");
    }
  };

  // Draw wheel ONLY when all images are loaded - prevents partial rendering
  useEffect(() => {
    if (segments.length > 0 && allImagesLoaded) {
      drawWheel();
    }
  }, [allImagesLoaded, rotation, segments]);

  // Handle window resize - only redraw if images are loaded
  useEffect(() => {
    const handleResize = () => {
      if (segments.length > 0 && allImagesLoaded) {
        drawWheel();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [segments, allImagesLoaded]);

  // Show loading state while wheel configuration OR images are being fetched
  if (!wheelConfig || segments.length === 0 || !allImagesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-yellow-400 text-lg">
            {!allImagesLoaded ? 'Loading wheel images...' : 'Loading wheel...'}
          </p>
        </div>
      </div>
    );
  }

  // Hide wheel if admin has set it as not visible
  if (wheelConfig.isVisible === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <p className="text-yellow-400 text-lg">Wheel is currently unavailable.</p>
          <p className="text-gray-400 text-sm mt-2">Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden z-10">
      {/* Background video */}
      <video
        ref={backgroundVideoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
      >
        <source
          src="/attached_assets/wheel1bg.mp4"
          type="video/mp4"
        />
      </video>

      <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center z-10">
         <img
    src={pointer}
    alt="pointer"
    className="
      absolute 
      -top-[44%]
      sm:-top-[33%]
      md:-top-[42%] 
      left-1/2 
      -translate-x-1/2 
      -translate-y-2 
      w-[210%]
      z-30 
      pointer-events-none
    "
  />
        {/* Wheel ring overlay */}
         <img
          src={ring}
          alt="Wheel Ring"
         className="absolute left-3 -top-4 sm:top-16 sm:left-18 md:left-3 md:-top-4 inset-0 w-[108%] h-[108%] sm:w-[80%] sm:h-[80%] md:w-[105%] md:h-[105%] object-cover z-0 pointer-events-none"
        />

        <canvas
          ref={canvasRef}
          className="pointer-events-none z-10"
          style={{
            display: "block",
            maxWidth: "100%",
            height: "auto",
            borderRadius: "50%",
          }}
        />

        {/* Center video */}
        <video
          ref={centerVideoRef}
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          className="absolute w-32 h-32 md:w-52 md:h-52 rounded-full object-cover pointer-events-none border-2 border-yellow-400 z-10"
        >
          <source
            src={MiddleVideo}
            type="video/mp4"
          />
        </video>

        {/* SPIN button */}
        <button
          onClick={spinWheel}
          disabled={isSpinning}
          aria-disabled={allSpinsUsed}
          className={`absolute bottom-[40.5%] sm:bottom-[44%] md:bottom-[42%]
                     px-2 py-1 
                     rounded-[4px] 
                     text-black font-bold 
                     text-[8px] md:text-[12px] 
                     shadow-xl transition-all
                     z-30 cursor-pointer
                     ${isSpinning ? 'bg-yellow-300 opacity-50 cursor-not-allowed' : 
                       
                       'bg-yellow-400 hover:bg-yellow-500'}`}
          data-testid="button-spin"
        >
          {isSpinning ? "SPINNING..." : "SPIN"}
        </button>
      </div>

      <PlayResultsTable
        className="relative z-10 mx-auto mb-5 mt-10 w-full max-w-2xl"
        title="Results"
        rows={rowsFromSpinHistory(spinHistory)}
        emptyTitle="NO SPINS YET"
        emptyHint="Spin the wheel to see each result here."
        headerRight={
          spinHistory.some((s) => s.status === "NOT SPUN") ? (
            <button
              onClick={() => setShowRevealAllDialog(true)}
              disabled={isSpinning}
              className="rounded-lg border border-[#F1D47A]/40 bg-[#F1D47A]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#F1D47A] disabled:opacity-50"
              data-testid="button-reveal-all"
            >
              Reveal all
            </button>
          ) : null
        }
      />

      {/* Reveal All Confirmation Dialog */}
      <AlertDialog open={showRevealAllDialog} onOpenChange={setShowRevealAllDialog}>
        <AlertDialogContent className="bg-gray-900 w-[90vw] max-w-sm sm:max-w-md mx-auto  border-2 border-[#FACC15]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#FACC15] text-xl font-bold">
              Reveal All Spins?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-base">
              This will reveal all your remaining spins at once. You will see all results in the progress table. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={revealAllSpins}
              className="bg-[#FACC15] text-gray-900 hover:bg-[#F59E0B] font-bold"
            >
              Yes, Reveal All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <RevealAllBatchSummary
        open={showRevealAllResultDialog}
        rows={revealBatchRows}
        playNoun="spin"
        cashWon={revealBatchCash}
        pointsWon={revealBatchPoints}
        onDismiss={() => setShowRevealAllResultDialog(false)}
      />


                        {/* OUT OF SCRATCHES DIALOG */}
      <AlertDialog open={showOutOfSpinDialog} onOpenChange={setShowOutOfSpinDialog}>
        <AlertDialogContent className="bg-gray-900 w-[90vw] max-w-sm sm:max-w-md mx-auto  border-2 border-[#FACC15] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#FACC15] text-xl font-bold text-center">
              No More Spins Left
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-center text-base">
              You have used all your spins.  
              Buy more to continue playing!
            </AlertDialogDescription>
          </AlertDialogHeader>
      
          <AlertDialogFooter className="flex justify-center gap-2">
            <AlertDialogAction
              className="bg-[#FACC15] text-gray-900 font-bold px-6 py-3 rounded-lg hover:bg-[#F59E0B]"
              onClick={() => {
               setTimeout(() => {
              // Clear order-specific localStorage
              if (orderId) {
               localStorage.removeItem(`spinWheelHistory_${orderId}`);
              }
              setLocation(`/competition/${competitionId}`);
            }, 2000);
              }}
            >
              Buy More
            </AlertDialogAction>
      
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 px-6 py-3 rounded-lg">
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        .clip-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
        
        /* Additional iOS fixes */
        video {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.5);
        }
      `}</style>
    </div>
  );
};

export default SpinWheel;