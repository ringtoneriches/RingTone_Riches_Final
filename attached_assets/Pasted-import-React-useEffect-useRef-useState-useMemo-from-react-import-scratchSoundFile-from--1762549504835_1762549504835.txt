import React, { useEffect, useRef, useState, useMemo } from "react";
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
// Add this function to load/save scratch history
const loadScratchHistory = (): { status: string; prize: { type: string; value: string } }[] => {
  try {
    const saved = localStorage.getItem('scratchCardHistory');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveScratchHistory = (history: { status: string; prize: { type: string; value: string } }[]) => {
  try {
    localStorage.setItem('scratchCardHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save scratch history:', error);
  }
};

export default function ScratchCardTest({ onScratchComplete, mode = "tight", scratchTicketCount }: ScratchCardProps) {
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

  const cashPrizes = mode === "tight" ? ["0.10", "0.25"] : ["0.25", "0.50", "1.00"];
  const ringtunePrizes = ["50", "100", "250", "500", "1000"];
  const allPrizes = [
    ...cashPrizes.map((c) => ({ type: "cash", value: c })),
    ...ringtunePrizes.map((p) => ({ type: "points", value: p })),
  ];

    // ✅ SIMPLIFIED INITIALIZATION - Only run once when scratchTicketCount changes
  useEffect(() => {
    if (!scratchTicketCount) return;

    const savedHistory = loadScratchHistory();
    
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
  }, [scratchTicketCount]);

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

  // ✅ Save to localStorage whenever scratchHistory changes
  useEffect(() => {
    if (scratchHistory.length > 0) {
      saveScratchHistory(scratchHistory);
    }
  }, [scratchHistory]);

  // ✅ Clear localStorage only when explicitly needed (like when leaving competition)
  // useEffect(() => {
  //   return () => {
  //     // Only clear if we're completely done with all scratches
  //     if (scratchTicketCount === 0) {
  //       localStorage.removeItem('scratchCardHistory');
  //     }
  //   };
  // }, [scratchTicketCount]);

  // Setup new scratch card session
  useEffect(() => {
    const { images, isWinner } = generateScratchGrid(mode);
    setImages(images);
    setIsWinner(isWinner);
    setSelectedPrize(allPrizes[Math.floor(Math.random() * allPrizes.length)]);
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
    setTimeout(() => {
      clearOverlayInstant();
      const prizeWon = isWinner ? selectedPrize : { type: "none", value: "Lose" };
      onScratchComplete?.(prizeWon);

      // ✅ SIMPLE UPDATE - Just find and update the first unscratched ticket
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

      // Auto-reset after short delay
      setTimeout(() => {
        hasCompletedRef.current = false;
        setSessionKey((k) => k + 1);
      }, 1000);
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

//   if (isWinner) {
//   const chosen = landmarkImages[Math.floor(Math.random() * landmarkImages.length)];
//   const winIndices = [0, 1, 4];

//   // force exactly 3 same ones
//   images = getRandomImages(6).map((img, i) =>
//     winIndices.includes(i) ? chosen : img.name === chosen.name ? getRandomImages(1)[0] : img
//   );
// }

  return (
  <div className="relative flex flex-col items-center justify-center p-4 min-h-screen overflow-hidden">
      <video
    autoPlay
    loop
    muted
    playsInline
    preload="auto"
    className="absolute inset-0 w-full h-full object-cover"
    style={{
      imageRendering: "auto",
      transform: "scale(1.02)", // Prevent micro-gaps
      filter: "brightness(1)", // keep clear brightness
    }}
  >
    <source
      src="https://res.cloudinary.com/dziy5sjas/video/upload/f_auto,q_auto:best/v1761649166/WhatsApp_Video_2025-10-25_at_3.50.25_PM_drcoh0.mp4"
      type="video/mp4"
    />
  </video>

  {/* 🪄 Optional subtle overlay to blend edges */}
  <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative z-10 p-4 sm:p-6 w-full max-w-4xl  ">
        <div className="flex justify-center mb-4 sm:mb-5">
          {scratchTicketCount !== undefined && (
            <div className="bg-yellow-400 w-fit text-black px-3 py-2 rounded-sm text-sm font-bold shadow-md z-20">
              Available Scratche{scratchTicketCount !== 1 ? "s" : ""}: {scratchTicketCount} 
            </div>
          )}
        </div>
        
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Scratch & Match</h2>
          <p className="text-white text-sm sm:text-base">Match 3 same images to win!</p>
        </div>

        {/* Larger responsive container for canvas */}
        <div className="relative mx-auto rounded-xl bg-orange-200 overflow-hidden bg-gray-200 w-full sm:w-[500px] min-h-[300px] sm:min-h-[400px] max-h-[600px]">
          {/* UNDERLAY */}
         <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl flex items-center justify-center p-2 sm:p-4">
  <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full h-full max-w-md mx-auto p-2">
    {images.map((img, i) => (
      <div
        key={i}
        className="bg-white rounded-sm sm:rounded-2xl shadow-lg flex items-center justify-center p-1 border border-gray-200 sm:p-2 border border-gray-200 aspect-square overflow-hidden"
      >
        <img
          src={img.src}
          alt={img.name}
          className="w-full h-full object-contain select-none p-0.5"
        />
      </div>
    ))}
  </div>
</div>

          {/* SCRATCH LAYER */}
          <canvas
            key={sessionKey}
            ref={canvasRef}
            className="absolute inset-0 rounded-xl cursor-pointer touch-none w-full h-full"
            onMouseDown={(e) => {
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
        <div className="w-full max-w-2xl mx-auto h-72  z-10 bg-black/70 rounded-t-xl mt-10 py-6 overflow-y-scroll px-4 sm:px-6 text-white border-t border-yellow-400">
          <h3 className="text-center text-xl font-bold mb-4 text-yellow-300">
            Scratch Ticket Progress
          </h3>
      <div className="z-10 overflow-x-auto">
<table className="w-full text-sm border-separate border-spacing-y-2">
  <thead>
                <tr className="text-yellow-300 font-semibold text-left">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Prize</th>
                </tr>
              </thead>
  <tbody>
  {scratchHistory.map((item, i) => (
    <tr key={i} className="bg-gray-800/60 hover:bg-gray-700/80 transition rounded-lg">
      <td className="px-3 py-2 text-yellow-300 font-semibold">Scratch {i + 1}</td>
      <td className="px-3 py-2 text-gray-200">{item.status}</td>
      <td className="px-3 py-2 text-green-400 font-bold">
        {item.prize.type === "cash"
          ? `$${item.prize.value}`
          : item.prize.type === "points"
          ? `${item.prize.value} pts`
          : item.prize.value}
      </td>
    </tr>
  ))}
</tbody>

</table> 
      </div>
        </div>
    </div>
  );
}
