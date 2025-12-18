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

import prize1 from "../../../../attached_assets/Christmas/Bauble.png";
import prize2 from "../../../../attached_assets/Christmas/Bell.png";
import prize3 from "../../../../attached_assets/Christmas/Candle.png";
import prize4 from "../../../../attached_assets/Christmas/Candy cane.png";
import prize5 from "../../../../attached_assets/Christmas/Christmas tree.png";
import prize6 from "../../../../attached_assets/Christmas/Elf.png";
import prize7 from "../../../../attached_assets/Christmas/Gingerbread man.png";
import prize8 from "../../../../attached_assets/Christmas/Gold star.png";
import prize9 from "../../../../attached_assets/Christmas/Holly.png";
import prize10 from "../../../../attached_assets/Christmas/Mitten.png";
import prize11 from "../../../../attached_assets/Christmas/No win.png";
import prize12 from "../../../../attached_assets/Christmas/Present.png";
import prize13 from "../../../../attached_assets/Christmas/Ringtone.png";
import prize14 from "../../../../attached_assets/Christmas/Rudolph.png";
import prize15 from "../../../../attached_assets/Christmas/Santa.png";
import prize16 from "../../../../attached_assets/Christmas/Santas sack.png";
import prize17 from "../../../../attached_assets/Christmas/Sleigh.png";
import prize18 from "../../../../attached_assets/Christmas/Snow globe.png";
import prize19 from "../../../../attached_assets/Christmas/Snowflake.png";
import prize20 from "../../../../attached_assets/Christmas/Snowman.png";
import prize21 from "../../../../attached_assets/Christmas/Stocking.png";
import prize22 from "../../../../attached_assets/Christmas/Wreath.png";

import pointer from "../../../../attached_assets/pointer.png";
import ring from "../../../../attached_assets/wheel2ring.png";
import centerVideo from "../../../../attached_assets/spinweel2video.mp4"
import congrats from "../../../../attached_assets/sounds/congrats.mp3"
import { useLocation } from "wouter";

// Icon mapping for admin configuration - uses car PNG images
const CHRISTMAS_ICON_MAP: Record<string, any> = {
  // Cash Prizes (10)
  Santa: prize15,              
  Sleigh: prize17,             
  SantasSack: prize16,         
  Rudolph: prize14,            
  Elf: prize6,                
  GoldStar: prize8,            
  ChristmasTree: prize5,      
  Present: prize12,            
  Snowman: prize20,            
  Bauble: prize1,              
  Stocking: prize21,
  Wreath: prize22,
  // Ringtone Points (10)
  Snowflake: prize19,          
  Holly: prize9,               
  CandyCane: prize4,          
  Mitten: prize10,            
  Candle: prize3,              
  GingerbreadMan: prize7,      
  SnowGlobe: prize18,          
  Bell: prize2,                
  
  // Special
  R_Prize: prize13,            
  // NoWin: prize11,              
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
): { status: string; prize: { brand: string; amount: any } }[] => {
  try {
    if (!orderId) return [];
    const saved = localStorage.getItem(`spinWheelHistory_${orderId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveSpinHistory = (
  history: { status: string; prize: { brand: string; amount: any } }[],
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

const SpinWheel2: React.FC<SpinWheelProps> = ({
  onSpinComplete,
  isSpinning,
  setIsSpinning,
  ticketCount,
  orderId,
  competitionId,
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
    queryKey: ["/api/admin/game-spin-2-config"],
  });

  // Inside your SpinWheel component, add the state:
  const [spinHistory, setSpinHistory] = useState<
    { status: string; prize: { brand: string; amount: any } }[]
  >([]);
  
  // Confirmation dialog state
  const [showRevealAllDialog, setShowRevealAllDialog] = useState(false);
  const [showRevealAllResultDialog, setShowRevealAllResultDialog] = useState(false);
  const [showOutOfSpinDialog, setShowOutOfSpinDialog] = useState(false);
    const [,setLocation] = useLocation();
  
  // Check if all spins are used
  const allSpinsUsed = spinHistory.length > 0 && spinHistory.every(s => s.status === "SPUN");

  // Transform admin wheel config to component format (memoized to prevent infinite re-renders)
  const segments = useMemo(() => {
    return (wheelConfig?.segments || []).map((seg) => {
      const icon = CHRISTMAS_ICON_MAP[seg.iconKey] || seg.iconKey;
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
      setSpinHistory(savedHistory);
    } else if (savedHistory.length > 0) {
      const adjustedHistory = adjustSpinHistoryToCount(
        savedHistory,
        ticketCount,
      );
      setSpinHistory(adjustedHistory);
    } else {
      setSpinHistory(
        Array.from({ length: ticketCount }, () => ({
          status: "NOT SPUN",
          prize: { brand: "-", amount: "-" },
        })),
      );
    }
  }, [ticketCount, orderId]);

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
      let distanceFromCenter = radius * (isMobile ? 0.85 : 0.85);

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
        let imgWidth = isMobile ? 28 : 55;
        let imgHeight = isMobile ? 28 : 55;

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
    setShowRevealAllDialog(false); // Close dialog

    try {
      // Refetch configuration for real-time updates before batch processing
      // console.log("Refetching configuration before revealing all spins...");
      await refetchConfig();

      // 🔒 CRITICAL: Call server with keepalive to ensure completion
      const response = await fetch("/api/reveal-all-spins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          competitionId,
          orderId,
          count: remainingCount,
        }),
        keepalive: true, // ✅ Ensure request completes even if user navigates away
      });

      if (!response.ok) {
        throw new Error("Failed to reveal all spins");
      }

      const results = await response.json();

      // Update spin history with all results
      setSpinHistory(prev => {
        const updated = [...prev];
        let notSpunIndex = 0;

        results.spins.forEach((spin: any) => {
          // Find the next NOT SPUN entry
          while (notSpunIndex < updated.length && updated[notSpunIndex].status === "SPUN") {
            notSpunIndex++;
          }

          if (notSpunIndex < updated.length) {
            updated[notSpunIndex] = {
              status: "SPUN",
              prize: spin.prize,
            };
            notSpunIndex++;
          }
        });

        return updated;
      });
      
      // 🔒 CRITICAL: Invalidate queries to refresh balance and points in header
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spin-order", orderId] });

      setIsSpinning(false);

      // Show summary modal or notification
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
        const icon = CHRISTMAS_ICON_MAP[seg.iconKey] || seg.iconKey;
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
        throw new Error("Failed to get spin result from server");
      }

      const result = await response.json();
      // console.log("Server returned result:", result);
      const winningSegmentId = result.winningSegmentId;

      // Find the winning segment index in our segments array
      const winningIndex = freshSegments.findIndex((seg: any) => seg.id === winningSegmentId);
      
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
                prize: result.prize,
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
      alert("Failed to spin. Please try again.");
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
      {/* Desktop video */}
  <video
    autoPlay
    loop
    muted
    playsInline
    preload="auto"
    disablePictureInPicture
    disableRemotePlayback
    className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none hidden md:block"
  >
    <source src="/attached_assets/Snowflake.mp4" type="video/mp4" />
  </video>

  {/* Mobile video */}
  <video
    autoPlay
    loop
    muted
    playsInline
    preload="auto"
    disablePictureInPicture
    disableRemotePlayback
    className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none block md:hidden"
  >
    <source src="/attached_assets/SnowflakeMobile.mp4" type="video/mp4" />
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
         className="absolute left-1 -top-4 sm:top-16 sm:left-16 md:left-1 md:-top-4 inset-0 w-[108%] h-[108%] sm:w-[80%] sm:h-[80%] md:w-[105%] md:h-[105%] object-cover z-0 pointer-events-none"
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
          className="absolute w-32 h-32 md:w-52 md:h-52 rounded-full object-cover pointer-events-none border-8 border-yellow-400 z-10"
        >
          <source
            src={centerVideo}
            type="video/mp4"
          />
        </video>

        {/* SPIN button */}
        <button
          onClick={spinWheel}
          disabled={isSpinning}
          aria-disabled={allSpinsUsed}
          className={`absolute bottom-[47%]
                      px-2 py-1 sm:px-4 sm:py-2
                     rounded-[4px] 
                     text-black font-bold 
                     text-[8px] md:text-[16px] 
                     shadow-xl transition-all
                     z-30 cursor-pointer
                     ${isSpinning ? 'bg-yellow-300 opacity-50 cursor-not-allowed' : 
                       
                       'bg-yellow-400 hover:bg-yellow-500'}`}
          data-testid="button-spin"
        >
          {isSpinning ? "SPINNING" : "SPIN"}
        </button>
      </div>

      {/* Premium Progress Tracker - Mobile Optimized */}
      <div className="relative w-full max-w-2xl mx-auto mb-5 z-10 mt-10 px-2 sm:px-4">
        {/* Glow effect */}
        <div className="absolute -inset-2 bg-gradient-to-r from-[#FACC15]/20 via-[#F59E0B]/20 to-[#FACC15]/20 rounded-2xl blur-xl pointer-events-none"></div>

        <div className="relative bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-[#FACC15]/40 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <h3 className="text-center sm:text-left text-base sm:text-xl md:text-2xl font-black text-gray-900 flex items-center gap-1 sm:gap-2">
                {/* <span className="text-lg sm:text-2xl">🎡</spans */}
                <span className="whitespace-nowrap">Spin Progress</span>
              </h3>
              {spinHistory.filter(s => s.status === "NOT SPUN").length > 0 && (
                <button
                  onClick={() => setShowRevealAllDialog(true)}
                  disabled={isSpinning}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 hover:bg-gray-800 text-[#FACC15] font-bold text-xs sm:text-sm rounded-lg border border-[#FACC15] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  data-testid="button-reveal-all"
                >
                   Reveal All
                </button>
              )}
            </div>
          </div>

          {/* Table container - Mobile Optimized */}
          <div className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 max-h-[60vh] sm:max-h-72 overflow-y-auto custom-scrollbar">
            <table className="w-full text-xs sm:text-sm md:text-base border-separate border-spacing-y-1 sm:border-spacing-y-2">
              <thead className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
                <tr className="text-[#FACC15] font-bold text-left">
                  <th className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-xs sm:text-sm">
                    #
                  </th>
                  <th className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-xs sm:text-sm">
                    Status
                  </th>
                  <th className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-xs sm:text-sm text-right">
                    Prize
                  </th>
                </tr>
              </thead>
              <tbody>
                {spinHistory.map((item, i) => (
                  <tr
                    key={i}
                    className="bg-gray-800/60 hover:bg-gray-700/90 transition-all duration-200 rounded-lg group"
                    data-testid={`row-spin-${i}`}
                  >
                    <td className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-[#FACC15] font-bold rounded-l-lg">
                      <span className="flex items-center gap-1 sm:gap-2">
                        <span className="hidden sm:flex w-6 h-6 rounded-full bg-[#FACC15]/20 items-center justify-center text-xs">
                          {i + 1}
                        </span>
                        <span className="text-xs sm:text-sm whitespace-nowrap">
                          <span className="sm:hidden">#{i + 1}</span>
                          <span className="hidden sm:inline">Spin {i + 1}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-1 sm:px-2 md:px-3 py-2 sm:py-3">
                      <span
                        className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                          item.status === "SPUN"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-gray-700/50 text-gray-400 border border-gray-600/30"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                            item.status === "SPUN"
                              ? "bg-green-400"
                              : "bg-gray-400"
                          }`}
                        ></span>
                        <span className="hidden sm:inline">{item.status}</span>
                        <span className="sm:hidden">
                          {item.status === "SPUN" ? "✓" : "−"}
                        </span>
                      </span>
                    </td>
                    <td className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-right rounded-r-lg">
                      {item.status === "NOT SPUN" ? (
                        <span className="text-gray-500 font-bold text-xs sm:text-sm whitespace-nowrap">-</span>
                      ) : (
                        <>
                          {(() => {
                            const isLoss = item.prize.amount === "-" || 
                                          item.prize.amount === 0 || 
                                          item.prize.brand === "X" || 
                                          !item.prize.amount;
                            
                            if (isLoss) {
                              return (
                                <span className="text-red-400 font-bold text-xs sm:text-sm whitespace-nowrap">
                                  Lose
                                </span>
                              );
                            }
                            
                            // Check if it's ringtone points
                            const isPoints = typeof item.prize.amount === "string" && 
                                           item.prize.amount.includes("Ringtones");
                            
                            if (isPoints) {
                              return (
                                <span className="text-green-400 font-bold text-xs sm:text-sm whitespace-nowrap">
                                  Win - {item.prize.amount}
                                </span>
                              );
                            }
                            
                            // Cash prize
                            const cashAmount = typeof item.prize.amount === "number" 
                              ? item.prize.amount.toFixed(2) 
                              : item.prize.amount;
                            
                            return (
                              <span className="text-green-400 font-bold text-xs sm:text-sm whitespace-nowrap">
                                Win - £{cashAmount}
                              </span>
                            );
                          })()}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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


            {/* Reveal-All Result Dialog */}
      <AlertDialog open={showRevealAllResultDialog} onOpenChange={setShowRevealAllResultDialog}>
        <AlertDialogContent className="bg-gray-900 w-[90vw] max-w-sm sm:max-w-md mx-auto  border-2 border-[#FACC15] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#FACC15] text-2xl font-black text-center">
              ✨ Reveal-All Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-center text-lg">
              Check the progress table below for full prize details.
            </AlertDialogDescription>
          </AlertDialogHeader>
      
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-[#FACC15] text-gray-900 hover:bg-[#F59E0B] font-bold px-6 py-3 rounded-lg"
              onClick={() => setShowRevealAllResultDialog(false)}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


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

export default SpinWheel2;