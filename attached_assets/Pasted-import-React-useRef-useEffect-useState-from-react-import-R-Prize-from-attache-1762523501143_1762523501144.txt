import React, { useRef, useEffect, useState } from "react";
import R_Prize from "../../../../attached_assets/R_prize.png";
import AstonMartin from "../../../../attached_assets/spin/AstonMartin.svg";
import Audi from "../../../../attached_assets/spin/Audi.svg";
import Bentley from "../../../../attached_assets/spin/Bentley.svg";
import BMW from "../../../../attached_assets/spin/BMW.svg";
import Ferrari from "../../../../attached_assets/spin/Ferrari.svg";
import Ford from "../../../../attached_assets/spin/Ford.svg";
import Honda from "../../../../attached_assets/spin/Honda.svg";
import Jaguar from "../../../../attached_assets/spin/Jaguar.svg";
import Lamborghini from "../../../../attached_assets/spin/Lamborghini.svg";
import LandRover from "../../../../attached_assets/spin/LandRover.svg";
import Lexus from "../../../../attached_assets/spin/Lexus.svg";
import Maserati from "../../../../attached_assets/spin/Maserati.svg";
import McLaren from "../../../../attached_assets/spin/McLaren.svg";
import MercedesBenz from "../../../../attached_assets/spin/MercedesBenz.svg";
import MiniCooper from "../../../../attached_assets/spin/MiniCooper.svg";
import Nissan from "../../../../attached_assets/spin/Nissan.svg";
import Porsche from "../../../../attached_assets/spin/Porsche.svg";
import RollsRoyce from "../../../../attached_assets/spin/RollsRoyce.svg";
import Toyota from "../../../../attached_assets/spin/Toyota.svg";
import Volkswagen from "../../../../attached_assets/spin/Volkswagen.svg";


import prize1 from "../../../../attached_assets/Car/astonmartin.png";
import prize2 from "../../../../attached_assets/Car/audi.png";
import prize3 from "../../../../attached_assets/Car/bentley.png";
import prize4 from "../../../../attached_assets/Car/bmw.png";
import prize5 from "../../../../attached_assets/Car/ferrari-emblem-1.svg";
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


interface SpinWheelProps {
  onSpinComplete: (winnerSegment: number, winnerLabel: string, winnerPrize: any) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  ticketCount?: number;
}

  // Add these functions for localStorage management
const loadSpinHistory = (): { status: string; prize: { brand: string; amount: any } }[] => {
  try {
    const saved = localStorage.getItem('spinWheelHistory');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveSpinHistory = (history: { status: string; prize: { brand: string; amount: any } }[]) => {
  try {
    localStorage.setItem('spinWheelHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save spin history:', error);
  }
};

const SpinWheel: React.FC<SpinWheelProps> = ({ onSpinComplete, isSpinning, setIsSpinning, ticketCount }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const centerVideoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<{
    [key: string]: HTMLImageElement;
  }>({});

  // Inside your SpinWheel component, add the state:
const [spinHistory, setSpinHistory] = useState<
  { status: string; prize: { brand: string; amount: any } }[]
>([]);


  const prizeImages = [
    prize1, prize2, prize3, prize4, prize5, prize6, prize7, prize8, prize9, 
    prize10, prize11, prize12, prize13, prize14, prize15, prize16, prize17, 
    prize18, prize19
  ];

  // Define prizes with amounts for each segment
  const segments = [
    { label: "Aston Martin", color: "#c3cac8ff", icon: AstonMartin, amount: 0.15 },
    
    { label: "Audi", color: "#0CBDF8", icon: Audi, amount: "3000 Ringtones" },
    { label: "Bentley", color: "#66C72D", icon: Bentley, amount: 0.25 },
    { label: "BMW", color: "#D69E1C", icon: BMW, amount: 0.50 },
    
    { label: "Mini Cooper", color: "#57D61C", icon: MiniCooper, amount: 0.55 },
    { label: "Ferrari", color: "#C2586D", icon: Ferrari, amount: 0.50 },
    { label: "Ford", color: "#190B89", icon: Ford, amount: "100 Ringtones" },
    { label: "Honda", color: "#821A93", icon: Honda, amount: "150 Ringtones" },
    { label: "Nice Try", color: "#4B5563", icon: "❌", amount: 0 },
    { label: "Jaguar", color: "#1CC2A6", icon: Jaguar, amount: "1000 Ringtones" },
    { label: "Lamborghini", color: "#F472B6", icon: Lamborghini, amount: 0.90 },
    { label: "Land Rover", color: "#9CA3AF", icon: LandRover, amount: "2000 Ringtones" },
    { label: "Lexus", color: "#D97706", icon: Lexus, amount: "850 Ringtones" },
    
    { label: "Maserati", color: "#7C3AED", icon: Maserati, amount: 5 },
    { label: "McLaren", color: "#DB2777", icon: McLaren, amount: 0.70 },
    { label: "Mercedes Benz", color: "#16A34A", icon: MercedesBenz, amount: 0.60 },
    { label: "Nissan", color: "#DC2626", icon: Nissan, amount: "50 Ringtones" },
    { label: "Nice Try", color: "#4B5563", icon: "❌", amount: 0 },
    { label: "Porsche", color: "#2563EB", icon: Porsche, amount: 0.80 },
    { label: "R", color: "#221f11ff", icon: R_Prize, amount: 100 },
    { label: "Rolls Royce", color: "#9333EA", icon: RollsRoyce, amount: 0.10 },
    { label: "Toyota", color: "#EAB308", icon: Toyota, amount: "250 Ringtones" },
    { label: "Volkswagen", color: "#0891B2", icon: Volkswagen, amount: "450 Ringtones" },
    
  ];

  const [rotation, setRotation] = useState((2 * Math.PI) / segments.length / 1.3);

// Initialize spin history when ticketCount changes
useEffect(() => {
  if (!ticketCount) return;

  const savedHistory = loadSpinHistory();
  
  if (savedHistory.length === ticketCount) {
    setSpinHistory(savedHistory);
  } else if (savedHistory.length > 0) {
    const adjustedHistory = adjustSpinHistoryToCount(savedHistory, ticketCount);
    setSpinHistory(adjustedHistory);
  } else {
    setSpinHistory(
      Array.from({ length: ticketCount }, () => ({
        status: "NOT SPUN",
        prize: { brand: "-", amount: "-" },
      }))
    );
  }
}, [ticketCount]);

// Helper function to adjust spin history
const adjustSpinHistoryToCount = (history: any[], targetCount: number) => {
  if (history.length === targetCount) return history;
  
  if (history.length < targetCount) {
    const newEntries = Array.from({ length: targetCount - history.length }, () => ({
      status: "NOT SPUN",
      prize: { brand: "-", amount: "-" },
    }));
    return [...history, ...newEntries];
  } else {
    return history;
  }
};

// Save to localStorage whenever spinHistory changes
useEffect(() => {
  if (spinHistory.length > 0) {
    saveSpinHistory(spinHistory);
  }
}, [spinHistory]);

  
  // Load all prize images
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    prizeImages.forEach((src, index) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === prizeImages.length) {
          setLoadedImages(images);
        }
      };
      images[index] = img;
    });
  }, []);


  // iOS FIX: Prevent video fullscreen on click
  useEffect(() => {
    const preventVideoFullscreen = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const centerVideo = centerVideoRef.current;
    const backgroundVideo = backgroundVideoRef.current;

    if (centerVideo) {
      centerVideo.addEventListener('click', preventVideoFullscreen);
      centerVideo.addEventListener('touchstart', preventVideoFullscreen);
    }

    if (backgroundVideo) {
      backgroundVideo.addEventListener('click', preventVideoFullscreen);
      backgroundVideo.addEventListener('touchstart', preventVideoFullscreen);
    }

    return () => {
      if (centerVideo) {
        centerVideo.removeEventListener('click', preventVideoFullscreen);
        centerVideo.removeEventListener('touchstart', preventVideoFullscreen);
      }
      if (backgroundVideo) {
        backgroundVideo.removeEventListener('click', preventVideoFullscreen);
        backgroundVideo.removeEventListener('touchstart', preventVideoFullscreen);
      }
    };
  }, []);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get device pixel ratio for ultra-sharp rendering on high-DPI displays
    // Use VERY high multiplier for maximum clarity on ALL devices, especially when zooming
    const isMobile = window.innerWidth < 768;
    const baseDpr = window.devicePixelRatio || 1;
    // Multiply by 4 for ultra-high quality that stays sharp even when zoomed
    const dpr = isMobile ? Math.max(baseDpr * 4, 4) : Math.max(baseDpr * 3, 3);
    
    // Set display size (CSS pixels) - responsive sizing with increased size
    const displaySize = isMobile ? Math.min(window.innerWidth - 60, 450) : 600;
    const centerRadius = isMobile ? 35 : 45;
    const centerFontSize = isMobile ? 11 : 14;
    
    // Set actual canvas size (accounting for device pixel ratio)
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    
    // Scale canvas CSS size back to display size
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;
    
    // Scale context to match device pixel ratio
    ctx.scale(dpr, dpr);
    
    // Enable high-quality rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const centerX = displaySize / 2;
    const centerY = displaySize / 2;
    const radius = Math.min(centerX, centerY) - 12;
    const segmentAngle = (2 * Math.PI) / segments.length;

    ctx.clearRect(0, 0, displaySize, displaySize);

    // Draw segments (at 0 rotation - rotation will be done via CSS transform)
    segments.forEach((segment, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "#D4AF37"; // Gold
      ctx.lineWidth = isMobile ? 1.5 : 2.5;
      ctx.stroke();

      // Draw icon or X
      ctx.save();
      
      const segmentMiddleAngle = startAngle + (endAngle - startAngle) / 2;
      const imageSize = isMobile ? 38 : 50;
      const imageDistance = radius * 0.68;
      const imageX = centerX + imageDistance * Math.cos(segmentMiddleAngle);
      const imageY = centerY + imageDistance * Math.sin(segmentMiddleAngle);
      
      ctx.translate(imageX, imageY);
      
      if (segment.isNoWin) {
        // Draw red X for no-win segments
        const xSize = isMobile ? 30 : 40;
        ctx.strokeStyle = "#ff0033";
        ctx.lineWidth = isMobile ? 4 : 5;
        ctx.lineCap = "round";
        
        ctx.beginPath();
        ctx.moveTo(-xSize / 2, -xSize / 2);
        ctx.lineTo(xSize / 2, xSize / 2);
        ctx.moveTo(xSize / 2, -xSize / 2);
        ctx.lineTo(-xSize / 2, xSize / 2);
        ctx.stroke();
      } else if (loadedImages.length > 0 && loadedImages[index]) {
        // Draw prize image
        ctx.drawImage(loadedImages[index], -imageSize / 2, -imageSize / 2, imageSize, imageSize);
      }
      
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a1a";
    ctx.fill();
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = isMobile ? 3 : 4;
    ctx.stroke();

    // Draw center text
    ctx.fillStyle = "#D4AF37";
    ctx.font = `bold ${centerFontSize}px Inter`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPIN", centerX, centerY);
  };

  const getWinner = (angle: number) => {
    const segAngle = (2 * Math.PI) / segments.length;
    const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const adjusted = (normalized + Math.PI / 2) % (2 * Math.PI);
    const index = Math.floor(
      (segments.length - adjusted / segAngle) % segments.length
    );
    return {
      index,
      label: segments[index].label,
      prize: {
        brand: segments[index].label,
        amount: segments[index].amount
      }
    };
  };

 const spinWheel = () => {
  if (isSpinning) return;
  setIsSpinning(true);
  setWinner(null);

  const totalRotations = 5;
  const segAngle = (2 * Math.PI) / segments.length;
  const randomSegment = Math.floor(Math.random() * segments.length);
  const finalOffset = randomSegment * segAngle + Math.random() * segAngle * 0.5;
  const target = rotation + totalRotations * 2 * Math.PI + finalOffset;

  const duration = 5000;
  const start = performance.now();

  const animate = (time: number) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = rotation + eased * (target - rotation);
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      const finalRotation = target % (2 * Math.PI);
      setRotation(finalRotation);
      
      const winnerResult = getWinner(target);
      setWinner(winnerResult.label);
      setIsSpinning(false);
      
      onSpinComplete(winnerResult.index, winnerResult.label, winnerResult.prize);

      // ✅ Update spin history
      setSpinHistory((prev) => {
        const updated = [...prev];
        const firstUnspunIndex = updated.findIndex((s) => s.status === "NOT SPUN");
        
        if (firstUnspunIndex !== -1) {
          updated[firstUnspunIndex] = {
            status: "SPUN",
            prize: winnerResult.prize,
          };
        }
        
        return updated;
      });
    }
  };

  requestAnimationFrame(animate);
};

  // Initial draw and window resize handling (draw once, not on rotation)
  useEffect(() => {
    if (loadedImages.length > 0) {
      drawWheel();
    }

    const handleResize = () => {
      drawWheel();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loadedImages]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden z-10">
      {/* Background video - FIXED FOR iOS */}
      <video
        ref={backgroundVideoRef}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
      >
        <source src="https://res.cloudinary.com/dziy5sjas/video/upload/v1761231208/backgroundwheelvideo_cjhrwq.mp4" type="video/mp4" />
      </video>

      <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center z-10">

        {/* {ticketCount !== undefined && (
    <div className="absolute -top-14 right-65 bg-yellow-400 text-black px-3 py-2 rounded-sm text-sm font-bold shadow-md z-20">
       Available Spin{ticketCount !== 1 ? "s" : ""} :{ticketCount} 
    </div>
  )} */}
       {/* <img
  src="https://res.cloudinary.com/dziy5sjas/image/upload/v1761047804/wheel_basnqc.png"
  alt="Wheel Ring"
  className="absolute -top-4 md:-top-0 inset-0  w-[108%] h-[108%] md:w-full md:h-full object-cover z-20 pointer-events-none"
/> */}
        
        <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '50%',
              imageRendering: 'crisp-edges',
              // Prevent antialiasing blur
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale'
            }}
          />

        {/* Center video - FIXED FOR iOS */}
        <video
          ref={centerVideoRef}
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          className="absolute w-36 h-36 sm:w-60 sm:h-60 rounded-full object-cover pointer-events-none"
        >
          <source src="https://res.cloudinary.com/dziy5sjas/video/upload/v1761140835/Middlevideo_s9eiiy.mp4" type="video/mp4" />
        </video>

        {/* SPIN button */}
        {!isSpinning && (
          <button
            onClick={spinWheel}
            className="absolute bottom-[39%] sm:bottom-[40%] 
                       px-2 py-1 
                       bg-yellow-400 rounded-[4px] 
                       hover:bg-yellow-500 text-black font-bold 
                       text-xs sm:text-md 
                       shadow-xl transition-all"
          >
            {winner ? "SPIN" : "SPIN"}
          </button>
        )}
      </div>

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
      `}</style>

     {/* Replace the current bottom div with this */}
<div className="w-full max-w-2xl mx-auto h-72 mb-5 z-10 bg-black/70 rounded-t-xl mt-10 py-6 overflow-y-scroll px-4 sm:px-6 text-white border-t border-yellow-400">
  <h3 className="text-center text-xl font-bold mb-4 text-yellow-300">
    Spin Wheel Progress
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
        {spinHistory.map((item, i) => (
          <tr key={i} className="bg-gray-800/60 hover:bg-gray-700/80 transition rounded-lg">
            <td className="px-3 py-2 text-yellow-300 font-semibold">Spin {i + 1}</td>
            <td className="px-3 py-2 text-gray-200">{item.status}</td>
            <td className="px-3 py-2 text-green-400 font-bold">
              {typeof item.prize.amount === 'number' 
                ? `$${item.prize.amount}`
                : item.prize.amount.includes('Ringtones')
                ? item.prize.amount
                : item.prize.amount === "-" 
                ? "-"
                : `$${item.prize.amount}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
      
    </div>
    
  );
};

export default SpinWheel;