import React, { useEffect, useRef, useState, useMemo } from "react";
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
import scratchSoundFile from "../../../../attached_assets/assets_sounds_sound_scratch.mp3";
import BarrierReef from "../../../../attached_assets/Barrier Reef.png";
import AngleOfNorth from "../../../../attached_assets/Angel of North.png";
import BigBen from "../../../../attached_assets/Big Ben.png";
import BuckinghamPalace from "../../../../attached_assets/Buckingham palace.png";
import Burj from "../../../../attached_assets/Burj.png";
import colosseum from "../../../../attached_assets/colosseum.png";
import EiffelTower from "../../../../attached_assets/Eiifel Tow.png";
import EmpireState from "../../../../attached_assets/Empire State.png";
import GoldenGate from "../../../../attached_assets/Golden Gate.png";
import GrandCanyon from "../../../../attached_assets/Grand Canyon.png";
import GreatWallOfChina from "../../../../attached_assets/Great Wall of China.png";
import MountEverest from "../../../../attached_assets/Mount Ever.png";
import NotreDame from "../../../../attached_assets/Notre Dame.png";
import PayramidsOfPisa from "../../../../attached_assets/Pyramids of Pisa.png";
import StatueOfLiberty from "../../../../attached_assets/Statue Of Liber.png";
import StoneH from "../../../../attached_assets/Stone H.png";
import TajMahal from "../../../../attached_assets/Taj Ma.png";
import TimesSquare from "../../../../attached_assets/Times S.png";
import TowerBridge from "../../../../attached_assets/Tower Bridge.png";
import TowerOfPisa from "../../../../attached_assets/Tower of Pisa.png";

interface ScratchCardProps {
  onScratchComplete?: (prize: { type: string; value: string }) => void;
  mode?: "tight" | "loose";
  scratchTicketCount?: number;
  orderId?: string;
}

const CSS_WIDTH = 500;
const CSS_HEIGHT = 350;
const AUTO_CLEAR_THRESHOLD = 0.7;
const SAMPLE_GAP = 4;

const landmarkImages = [
  { name: "Barrier Reef", src: BarrierReef },
  { name: "Angel of the North", src: AngleOfNorth },
  { name: "Big Ben", src: BigBen },
  { name: "Buckingham Palace", src: BuckinghamPalace },
  { name: "Burj Khalifa", src: Burj },
  { name: "Colosseum", src: colosseum },
  { name: "Eiffel Tower", src: EiffelTower },
  { name: "Empire State", src: EmpireState },
  { name: "Golden Gate Bridge", src: GoldenGate },
  { name: "Grand Canyon", src: GrandCanyon },
  { name: "Great Wall of China", src: GreatWallOfChina },
  { name: "Mount Everest", src: MountEverest },
  { name: "Notre Dame", src: NotreDame },
  { name: "Pyramids of Pisa", src: PayramidsOfPisa },
  { name: "Statue of Liberty", src: StatueOfLiberty },
  { name: "Stonehenge", src: StoneH },
  { name: "Taj Mahal", src: TajMahal },
  { name: "Times Square", src: TimesSquare },
  { name: "Tower Bridge", src: TowerBridge },
  { name: "Tower of Pisa", src: TowerOfPisa },
];

function getRandomImages(n: number) {
  const shuffled = [...landmarkImages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function generateScratchGrid(mode: "tight" | "loose" = "loose") {
  const WIN_PROB = mode === "tight" ? 0.2 : 0.7;
  const isWinner = Math.random() < WIN_PROB;
  let images = getRandomImages(6);

  if (isWinner) {
    const chosen = landmarkImages[Math.floor(Math.random() * landmarkImages.length)];
    const winIndices = [0, 1, 4];
    winIndices.forEach((i) => (images[i] = chosen));
  }

  return { images, isWinner };
}
// Add this function to load/save scratch history (order-specific)
const loadScratchHistory = (orderId?: string): { status: string; prize: { type: string; value: string } }[] => {
  try {
    if (!orderId) return [];
    const saved = localStorage.getItem(`scratchCardHistory_${orderId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveScratchHistory = (history: { status: string; prize: { type: string; value: string } }[], orderId?: string) => {
  try {
    if (!orderId) return;
    localStorage.setItem(`scratchCardHistory_${orderId}`, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save scratch history:', error);
  }
};

export default function ScratchCardTest({ onScratchComplete, mode = "tight", scratchTicketCount, orderId }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const scratchSoundRef = useRef<HTMLAudioElement | null>(null);
const hasCompletedRef = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [percentScratched, setPercentScratched] = useState(0);
  const [sessionKey, setSessionKey] = useState(0); // 👈 for reset
  const [selectedPrize, setSelectedPrize] = useState<{ type: string; value: string }>({ type: "none", value: "0" });
  const [images, setImages] = useState<any[]>([]);
  const [isWinner, setIsWinner] = useState(false);
 const [scratchHistory, setScratchHistory] = useState<
  { status: string; prize: { type: string; value: string } }[]
>([]);
  
  // Confirmation dialog state
  const [showRevealAllDialog, setShowRevealAllDialog] = useState(false);
  
  // Check if all scratch cards are used
  const allScratchesUsed = scratchHistory.length > 0 && scratchHistory.every(s => s.status === "Scratched");

  const cashPrizes = mode === "tight" ? ["0.10", "0.25"] : ["0.25", "0.50", "1.00"];
  const ringtunePrizes = ["50", "100", "250", "500", "1000"];
  const allPrizes = [
    ...cashPrizes.map((c) => ({ type: "cash", value: c })),
    ...ringtunePrizes.map((p) => ({ type: "points", value: p })),
  ];

    // ✅ SIMPLIFIED INITIALIZATION - Only run once when scratchTicketCount or orderId changes
  useEffect(() => {
    if (!scratchTicketCount || !orderId) return;

    const savedHistory = loadScratchHistory(orderId);
    
    // If we have saved history that matches current count, use it
    if (savedHistory.length === scratchTicketCount) {
      setScratchHistory(savedHistory);
    } 
    // If saved history exists but count doesn't match, adjust it
    else if (savedHistory.length > 0) {
      const adjustedHistory = adjustHistoryToCount(savedHistory, scratchTicketCount);
      setScratchHistory(adjustedHistory);
    }
    // No saved history, create fresh
    else {
      setScratchHistory(
        Array.from({ length: scratchTicketCount }, () => ({
          status: "Not Scratched",
          prize: { type: "none", value: "-" },
        }))
      );
    }
  }, [scratchTicketCount, orderId]);

  // Helper function to adjust history while preserving all data
  const adjustHistoryToCount = (history: any[], targetCount: number) => {
    if (history.length === targetCount) return history;
    
    if (history.length < targetCount) {
      // Add new unscratched entries
      const newEntries = Array.from({ length: targetCount - history.length }, () => ({
        status: "Not Scratched",
        prize: { type: "none", value: "-" },
      }));
      return [...history, ...newEntries];
    } else {
      // We have more history than needed - NEVER remove any rows!
      // Just return the original history, the table will show all
      return history;
    }
  };

  // ✅ Save to localStorage whenever scratchHistory changes (order-specific)
  useEffect(() => {
    if (scratchHistory.length > 0 && orderId) {
      saveScratchHistory(scratchHistory, orderId);
    }
  }, [scratchHistory, orderId]);

  // ✅ Clear localStorage only when explicitly needed (like when leaving competition)
  // useEffect(() => {
  //   return () => {
  //     // Only clear if we're completely done with all scratches
  //     if (scratchTicketCount === 0) {
  //       localStorage.removeItem('scratchCardHistory');
  //     }
  //   };
  // }, [scratchTicketCount]);

  // Setup new scratch card session (visual only - result comes from server)
  useEffect(() => {
    // Generate random images for display - will be updated with result after scratching
    const randomImages = getRandomImages(6);
    setImages(randomImages);
    setIsWinner(false);
    initCanvas();
  }, [sessionKey]);

  useEffect(() => {
    scratchSoundRef.current = new Audio(scratchSoundFile);
    scratchSoundRef.current.loop = true;
    scratchSoundRef.current.volume = 0.4;

    const handleMouseUpGlobal = () => {
      drawingRef.current = false;
      stopScratchSound();
      checkPercentScratched(true);
    };

    window.addEventListener("mouseup", handleMouseUpGlobal);
    window.addEventListener("touchend", handleMouseUpGlobal);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mouseup", handleMouseUpGlobal);
      window.removeEventListener("touchend", handleMouseUpGlobal);
    };
  }, []);

    useEffect(() => {
    const handleResize = () => {
      initCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

 function initCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if (!container) return;
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Set canvas CSS dimensions to match container
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    
    // Set canvas internal dimensions (accounting for device pixel ratio)
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(containerWidth * ratio);
    canvas.height = Math.round(containerHeight * ratio);
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Scale the context to account for device pixel ratio
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    
    ctx.globalCompositeOperation = "source-over";
    const gradient = ctx.createLinearGradient(0, 0, containerWidth, containerHeight);

    // Add color stops (start and end colors)
    gradient.addColorStop(0, "#cca60eff"); // coral
    gradient.addColorStop(1, "#e67e22"); // dodger blue
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, containerWidth, containerHeight);
    ctx.fillStyle = "#fff";
    
    // Responsive font size
    const fontSize = Math.max(16, containerWidth * 0.05);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH TO REVEAL", containerWidth / 2, containerHeight / 2);
    setRevealed(false);
    setPercentScratched(0);
  }

  function scratchAt(x: number, y: number) {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Make brush size responsive based on canvas size
    const brush = Math.max(15, canvas.clientWidth * 0.09);
    
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, brush, 0, Math.PI * 2);
    ctx.fill();

    if (!rafRef.current) rafRef.current = requestAnimationFrame(() => checkPercentScratched());
  }



 function checkPercentScratched(force = false) {
  rafRef.current = null;
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;

  let total = 0,
    cleared = 0;
  for (let y = 0; y < h; y += SAMPLE_GAP) {
    for (let x = 0; x < w; x += SAMPLE_GAP) {
      const alpha = data[(y * w + x) * 4 + 3];
      total++;
      if (alpha === 0) cleared++;
    }
  }

  const percent = cleared / total;
  setPercentScratched(Math.round(percent * 100));

  if (percent >= AUTO_CLEAR_THRESHOLD && !revealed && !hasCompletedRef.current) {
    hasCompletedRef.current = true;
    stopScratchSound();
    setRevealed(true);
    
    // 🎯 SERVER-SIDE: Call API to get the real result
    setTimeout(async () => {
      try {
        // Call server to determine prize (probability-based)
        const response = await fetch("/api/play-scratch-carddd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderId }),
        });

        if (!response.ok) {
          throw new Error("Failed to get scratch result from server");
        }

        const result = await response.json();
        const prizeWon = result.prize || { type: "none", value: "Lose" };
        
        // Update images to show win/loss FIRST, before clearing overlay
        if (prizeWon.type !== "none") {
          const chosen = landmarkImages[Math.floor(Math.random() * landmarkImages.length)];
          const winIndices = [0, 1, 4];
          const winningImages = getRandomImages(6);
          winIndices.forEach((i) => (winningImages[i] = chosen));
          setImages(winningImages);
          setIsWinner(true);
        } else {
          setIsWinner(false);
        }
        
        setSelectedPrize(prizeWon);
        onScratchComplete?.(prizeWon);

        // ✅ Update scratch history
        setScratchHistory((prev) => {
          const updated = [...prev];
          const firstUnplayedIndex = updated.findIndex((s) => s.status === "Not Scratched");
          
          if (firstUnplayedIndex !== -1) {
            updated[firstUnplayedIndex] = {
              status: "Scratched",
              prize: prizeWon,
            };
          }
          
          return updated;
        });

        // Clear overlay on success
        clearOverlayInstant();

        // Auto-reset after short delay (only on success)
        setTimeout(() => {
          hasCompletedRef.current = false;
          setSessionKey((k) => k + 1);
        }, 1000);
      } catch (error) {
        console.error("Error getting scratch result:", error);
        alert("Failed to reveal scratch card. Please try again.");
        // Clear overlay first
        clearOverlayInstant();
        // Reset on error to allow retry
        hasCompletedRef.current = false;
        setRevealed(false);
        // Reinitialize canvas so user can try again
        initCanvas();
      }
    }, 400);
  }
}

  function clearOverlayInstant() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function startScratchSound() {
    if (revealed) return;
    const sound = scratchSoundRef.current;
    if (sound && sound.paused) sound.play().catch(() => {});
  }

  function stopScratchSound() {
    const sound = scratchSoundRef.current;
    if (sound && !sound.paused) sound.pause();
  }

  // Reveal All function - batch reveals all remaining scratch cards
  async function handleRevealAll() {
    if (revealed || hasCompletedRef.current || !canvasRef.current) return;
    
    // Close dialog
    setShowRevealAllDialog(false);
    
    // Stop any scratch sound
    stopScratchSound();
    
    // Mark as completed to prevent double triggers
    hasCompletedRef.current = true;
    setRevealed(true);
    setPercentScratched(100);
    
    // Get count of all remaining scratch cards
    const remainingCount = scratchHistory.filter(s => s.status === "Not Scratched").length;
    
    if (remainingCount === 0) {
      hasCompletedRef.current = false;
      setRevealed(false);
      return;
    }

    // Clear overlay immediately
    clearOverlayInstant();
    
    try {
      // Call batch reveal API to process all remaining scratch cards
      const response = await fetch("/api/reveal-all-scratch-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          orderId,
          count: remainingCount
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reveal all scratch cards");
      }

      const results = await response.json();

      // Update scratch history with all results
      setScratchHistory(prev => {
        const updated = [...prev];
        let notScratchedIndex = 0;

        results.scratches.forEach((scratch: any) => {
          // Find the next Not Scratched entry
          while (notScratchedIndex < updated.length && updated[notScratchedIndex].status === "Scratched") {
            notScratchedIndex++;
          }

          if (notScratchedIndex < updated.length) {
            updated[notScratchedIndex] = {
              status: "Scratched",
              prize: scratch.prize,
            };
            notScratchedIndex++;
          }
        });

        return updated;
      });

      // Reset state
      hasCompletedRef.current = false;
      setRevealed(false);
      setSessionKey((k) => k + 1);

      // Show summary message
      alert(`All scratch cards revealed! Check the progress table for your results.`);

    } catch (error) {
      console.error("Error revealing all scratch cards:", error);
      alert("Failed to reveal all scratch cards. Please try again.");
      
      // Reset on error to allow retry
      hasCompletedRef.current = false;
      setRevealed(false);
      initCanvas();
    }
  }

//   if (isWinner) {
//   const chosen = landmarkImages[Math.floor(Math.random() * landmarkImages.length)];
//   const winIndices = [0, 1, 4];

//   // force exactly 3 same ones
//   images = getRandomImages(6).map((img, i) =>
//     winIndices.includes(i) ? chosen : img.name === chosen.name ? getRandomImages(1)[0] : img
//   );
// }

  return (
  <div className="relative flex flex-col items-center justify-center p-4 min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <video
    autoPlay
    loop
    muted
    playsInline
    preload="auto"
    className="absolute inset-0 w-full h-full object-cover opacity-20"
    style={{
      imageRendering: "auto",
      transform: "scale(1.02)",
      filter: "brightness(0.6)",
    }}
  >
    <source
      src="https://res.cloudinary.com/dziy5sjas/video/upload/f_auto,q_auto:best/v1761649166/WhatsApp_Video_2025-10-25_at_3.50.25_PM_drcoh0.mp4"
      type="video/mp4"
    />
  </video>

  {/* Premium gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"></div>
  
  {/* Decorative glow effects - Brand Colors */}
  <div className="absolute top-20 left-10 w-96 h-96 bg-[#FACC15]/20 rounded-full blur-3xl animate-pulse"></div>
  <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#F59E0B]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="relative z-10 p-4 sm:p-6 w-full max-w-5xl">
        {/* Premium Scratches Badge */}
        <div className="flex justify-center mb-6 sm:mb-8">
          {scratchTicketCount !== undefined && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-gray-900 px-6 py-3 rounded-full text-sm sm:text-base font-black shadow-2xl flex items-center gap-2">
                <span className="text-lg sm:text-xl">🎟️</span>
                <span>Available Scratche{scratchTicketCount !== 1 ? "s" : ""}: {scratchTicketCount}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* PREMIUM Eye-Catching Title */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="relative inline-block mb-4">
            {/* Glow behind text */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FACC15]/30 via-[#F59E0B]/30 to-[#FACC15]/30 blur-3xl"></div>
            
            <h2 
              className="relative text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-[1.1]"
              style={{ 
                background: "linear-gradient(135deg, #FACC15 0%, #F59E0B 50%, #FACC15 100%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 24px rgba(250, 204, 21, 0.4))"
              }}
            >
              Scratch & Match
            </h2>
            
            {/* Premium underline */}
            <div className="h-1 mt-3 bg-gradient-to-r from-transparent via-[#FACC15] to-transparent rounded-full"></div>
          </div>
          
          <p className="text-white/90 text-base sm:text-lg md:text-xl font-semibold">
            Match 3 same images to win amazing prizes! 🎁
          </p>
        </div>

        {/* PREMIUM Scratch Card Container with Gold Border & Glow */}
        <div className="relative mx-auto mb-8 sm:mb-12 group">
          {/* Premium outer glow effect - Brand Colors */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-700"></div>
          
          {/* Card container with premium gold border */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#FACC15]/60 shadow-[#FACC15]/30 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 w-full sm:w-[550px] md:w-[600px] mx-auto">
            <div className="relative min-h-[350px] sm:min-h-[420px] md:min-h-[450px]">
            {/* UNDERLAY - Enhanced with premium background */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-3 sm:p-5">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full h-full max-w-lg mx-auto p-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg sm:rounded-xl shadow-2xl flex items-center justify-center p-2 sm:p-3 border-2 border-gray-200 aspect-square overflow-hidden hover:scale-105 transition-transform duration-200"
                  >
                    <img
                      src={img.src}
                      alt={img.name}
                      className="w-full h-full object-contain select-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* SCRATCH LAYER */}
            <canvas
              key={sessionKey}
              ref={canvasRef}
              className="absolute inset-0 cursor-pointer touch-none w-full h-full"
            onMouseDown={(e) => {
              if (allScratchesUsed) {
                alert("You have used all your scratches. Please buy more to play.");
                return;
              }
              drawingRef.current = true;
              startScratchSound();
              const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
              scratchAt(e.clientX - rect.left, e.clientY - rect.top);
            }}
            onMouseMove={(e) => {
              if (!drawingRef.current) return;
              const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
              scratchAt(e.clientX - rect.left, e.clientY - rect.top);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              if (allScratchesUsed) {
                alert("You have used all your scratches. Please buy more to play.");
                return;
              }
              drawingRef.current = true;
              startScratchSound();
              const t = e.touches[0];
              const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
              scratchAt(t.clientX - rect.left, t.clientY - rect.top);
            }}
            onTouchMove={(e) => {
              if (!drawingRef.current) return;
              const t = e.touches[0];
              const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
              scratchAt(t.clientX - rect.left, t.clientY - rect.top);
            }}
            onMouseUp={() => drawingRef.current = false}
              onMouseLeave={() => drawingRef.current = false}
              onTouchEnd={() => drawingRef.current = false}
            />
            </div>
          </div>
        </div>

        {/* Reveal All Button - Premium Styling */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <button
            onClick={() => setShowRevealAllDialog(true)}
            disabled={revealed || hasCompletedRef.current}
            data-testid="button-reveal-all"
            className={`relative group px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-black text-sm sm:text-base md:text-lg transition-all duration-300 ${
              revealed || hasCompletedRef.current
                ? "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] text-gray-900 hover:shadow-2xl hover:shadow-[#FACC15]/50 hover:scale-105"
            }`}
          >
            {!revealed && !hasCompletedRef.current && (
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            )}
            <span className="relative flex items-center gap-2">
              <span className="text-lg sm:text-xl">✨</span>
              <span>REVEAL ALL</span>
              <span className="text-lg sm:text-xl">✨</span>
            </span>
          </button>
        </div>

        {/* PREMIUM Progress Table - Mobile Optimized */}
        <div className="w-full max-w-3xl mx-auto relative px-2 sm:px-4">
          {/* Premium glow effect around table */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#FACC15]/20 via-[#F59E0B]/20 to-[#FACC15]/20 rounded-2xl blur-xl"></div>
          
          <div className="relative bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-[#FACC15]/40 shadow-2xl overflow-hidden">
            {/* Header with premium styling */}
            <div className="bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] px-3 sm:px-6 py-3 sm:py-4">
              <h3 className="text-center text-base sm:text-xl md:text-2xl font-black text-gray-900 flex items-center justify-center gap-1 sm:gap-2">
                <span className="text-lg sm:text-2xl">📊</span>
                <span className="whitespace-nowrap">Progress</span>
              </h3>
            </div>

            {/* Table container with scroll - Mobile Optimized */}
            <div className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 max-h-[60vh] sm:max-h-80 overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs sm:text-sm md:text-base border-separate border-spacing-y-1 sm:border-spacing-y-2">
                <thead className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
                  <tr className="text-[#FACC15] font-bold text-left">
                    <th className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-xs sm:text-sm">#</th>
                    <th className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-xs sm:text-sm">Status</th>
                    <th className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-xs sm:text-sm text-right">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {scratchHistory.map((item, i) => (
                    <tr 
                      key={i} 
                      className="bg-gray-800/60 hover:bg-gray-700/90 transition-all duration-200 rounded-lg group"
                      data-testid={`row-scratch-${i}`}
                    >
                      <td className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-[#FACC15] font-bold rounded-l-lg">
                        <span className="flex items-center gap-1 sm:gap-2">
                          <span className="hidden sm:flex w-6 h-6 rounded-full bg-[#FACC15]/20 items-center justify-center text-xs">
                            {i + 1}
                          </span>
                          <span className="text-xs sm:text-sm whitespace-nowrap">
                            <span className="sm:hidden">#{i + 1}</span>
                            <span className="hidden sm:inline">Scratch {i + 1}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-1 sm:px-2 md:px-3 py-2 sm:py-3">
                        <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                          item.status === "Scratched" 
                            ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                            : "bg-gray-700/50 text-gray-400 border border-gray-600/30"
                        }`}>
                          <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                            item.status === "Scratched" ? "bg-green-400" : "bg-gray-400"
                          }`}></span>
                          <span className="hidden sm:inline">{item.status}</span>
                          <span className="sm:hidden">{item.status === "Scratched" ? "✓" : "−"}</span>
                        </span>
                      </td>
                      <td className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-right font-bold rounded-r-lg">
                        {item.status === "Not Scratched" ? (
                          <span className="text-gray-500 text-xs sm:text-sm">-</span>
                        ) : (
                          <>
                            {(() => {
                              const isLoss = item.prize.type === "none" || 
                                           item.prize.type === "try_again" || 
                                           item.prize.value === "Lose" ||
                                           item.prize.value === "Try Again";
                              
                              if (isLoss) {
                                return (
                                  <span className="text-red-400 text-xs sm:text-sm whitespace-nowrap">
                                    Lose
                                  </span>
                                );
                              }
                              
                              if (item.prize.type === "cash") {
                                return (
                                  <span className="text-green-400 text-xs sm:text-sm whitespace-nowrap">
                                    Win - £{item.prize.value}
                                  </span>
                                );
                              }
                              
                              if (item.prize.type === "points") {
                                return (
                                  <span className="text-green-400 text-xs sm:text-sm whitespace-nowrap">
                                    Win - {item.prize.value} Points
                                  </span>
                                );
                              }
                              
                              // Physical prize or other
                              return (
                                <span className="text-green-400 text-xs sm:text-sm whitespace-nowrap">
                                  Win - {item.prize.value}
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
      </div>
      
      {/* Reveal All Confirmation Dialog */}
      <AlertDialog open={showRevealAllDialog} onOpenChange={setShowRevealAllDialog}>
        <AlertDialogContent className="bg-gray-900 border-2 border-[#FACC15]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#FACC15] text-xl font-bold">
              Reveal All Scratch Cards?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-base">
              This will reveal all your remaining scratch cards at once. You will see all results in the progress table. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevealAll}
              className="bg-[#FACC15] text-gray-900 hover:bg-[#F59E0B] font-bold"
            >
              Yes, Reveal All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
