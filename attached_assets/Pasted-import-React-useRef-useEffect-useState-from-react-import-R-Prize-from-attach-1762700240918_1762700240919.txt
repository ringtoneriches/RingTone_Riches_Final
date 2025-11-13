import React, { useRef, useEffect, useState } from "react";
import R_Prize from "../../../../attached_assets/R_prize.png";
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
import cross from "../../../../attached_assets/cross.png";

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
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [crossImage, setCrossImage] = useState<HTMLImageElement | null>(null);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  // Inside your SpinWheel component, add the state:
  const [spinHistory, setSpinHistory] = useState<
    { status: string; prize: { brand: string; amount: any } }[]
  >([]);

  // Define prizes with amounts for each segment - FIXED: Match segments to available images
  const segments = [
    { label: "Aston Martin", color: "#c3cac8ff", amount: 0.15, imageIndex: 0 },
    { label: "Audi", color: "#0CBDF8", amount: "3000 Ringtones", imageIndex: 1 },
    { label: "Bentley", color: "#66C72D", amount: 0.25, imageIndex: 2 },
    { label: "BMW", color: "#D69E1C", amount: 0.50, imageIndex: 3 },
    { label: "Mini Cooper", color: "#57D61C", amount: 0.55, imageIndex: 4 },
    { label: "Ferrari", color: "#C2586D", amount: 0.50, imageIndex: 5 },
    { label: "Ford", color: "#190B89", amount: "100 Ringtones", imageIndex: 6 },
    { label: "Honda", color: "#821A93", amount: "150 Ringtones", imageIndex: 7 },
    { label: "Nice Try", color: "#4B5563", amount: 0, isCross: true },
    { label: "Jaguar", color: "#1CC2A6", amount: "1000 Ringtones", imageIndex: 8 },
    { label: "Lamborghini", color: "#F472B6", amount: 0.90, imageIndex: 9 },
    { label: "Land Rover", color: "#9CA3AF", amount: "2000 Ringtones", imageIndex: 10 },
    { label: "Lexus", color: "#D97706", amount: "850 Ringtones", imageIndex: 11 },
    { label: "Maserati", color: "#7C3AED", amount: 5, imageIndex: 12 },
    { label: "McLaren", color: "#DB2777", amount: 0.70, imageIndex: 13 },
    { label: "Mercedes Benz", color: "#16A34A", amount: 0.60, imageIndex: 14 },
    { label: "Nissan", color: "#DC2626", amount: "50 Ringtones", imageIndex: 15 },
    { label: "Nice Try", color: "#4B5563", amount: 0, isCross: true },
    { label: "Porsche", color: "#2563EB", amount: 0.80, imageIndex: 16 },
    { label: "Rolls Royce", color: "#9333EA", amount: 0.10, imageIndex: 17 },
    { label: "Toyota", color: "#EAB308", amount: "250 Ringtones", imageIndex: 18 },
    { label: "Volkswagen", color: "#0891B2", amount: "450 Ringtones", imageIndex: 19 },
    { label: "Ringtone", color: "#08b25dff", amount: "150 Ringtones", imageIndex: 20 },
  ];

  const prizeImages = [
    prize1, prize2, prize3, prize4, prize5, prize6, prize7, prize8, prize9, 
    prize10, prize11, prize12, prize13, prize14, prize15, prize16, prize17, 
    prize18, prize19, prize20 , R_Prize // Now includes all 20 images
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

  // Load all images including cross - FIXED
  useEffect(() => {
    const loadAllImages = async () => {
      try {
        // Load cross image first
        const crossImg = new Image();
        crossImg.crossOrigin = "anonymous";
        crossImg.src = cross;
        
        await new Promise((resolve) => {
          crossImg.onload = resolve;
          crossImg.onerror = resolve; // Continue even if cross fails
        });
        setCrossImage(crossImg);

        // Load prize images
        const imagePromises = prizeImages.map((src) => {
          return new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => {
              console.warn(`Failed to load image: ${src}`);
              // Create fallback image
              const fallback = new Image();
              fallback.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIyNSIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+PC9zdmc+";
              resolve(fallback);
            };
          });
        });

        const loadedPrizeImages = await Promise.all(imagePromises);
        setLoadedImages(loadedPrizeImages);
        setAllImagesLoaded(true);
        
      } catch (error) {
        console.error('Error loading images:', error);
        setAllImagesLoaded(true);
      }
    };

    loadAllImages();
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

 const drawWheel = (rotationAngle = rotation) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Responsiveness + sharpness
  const isMobile = window.innerWidth < 768;
  const baseDpr = window.devicePixelRatio || 1;
  const dpr = isMobile ? Math.max(baseDpr * 4, 4) : Math.max(baseDpr * 3, 3);

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
    let distanceFromCenter = radius * (isMobile ? 0.85 : 0.80);


    const imageX = centerX + distanceFromCenter * Math.cos(midAngle);
    const imageY = centerY + distanceFromCenter * Math.sin(midAngle);

    // Move to that point and rotate image upright
    ctx.translate(imageX, imageY);
    ctx.rotate(midAngle + Math.PI / 2);

    if (segment.isCross && crossImage) {
      // Draw cross image for Nice Try segments
      const imgSize = isMobile ? 15 : 30;
      try {
        ctx.drawImage(crossImage, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
      } catch (error) {
        // Fallback to red X if cross image fails
        drawRedX(ctx, isMobile);
      }
    } else if (segment.isCross) {
      // Fallback: Draw red X if cross image not loaded
      drawRedX(ctx, isMobile);
    // In the image drawing section:
} else if (segment.imageIndex !== undefined && loadedImages[segment.imageIndex]) {
  // SPECIAL CASE: Larger size for Rintone
  let imgWidth = isMobile ? 28 : 42;
  let imgHeight = isMobile ? 28 : 42;
  
  if (segment.label === "Ringtone") {
    imgWidth = isMobile ? 35 : 55;
    imgHeight = isMobile ? 35 : 55;
  }
  // SPECIAL CASE: WIDER image for Rolls Royce
  else if (segment.label === "Rolls Royce") {
    imgWidth = isMobile ? 45 : 70;   // Much wider
    imgHeight = isMobile ? 30 : 45;  // Slightly taller
  }

  try {
    ctx.drawImage(loadedImages[segment.imageIndex], -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
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
  const drawFallbackText = (ctx: CanvasRenderingContext2D, label: string, isMobile: boolean) => {
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${isMobile ? 8 : 10}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Use abbreviation for small space
    const shortLabel = label.split(' ')[0].substring(0, 3);
    ctx.fillText(shortLabel, 0, 0);
  };

  // Rest of your functions (getWinner, spinWheel) remain the same...
  const getWinner = (angle: number) => {
    const segAngle = (2 * Math.PI) / segments.length;
    const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const index = Math.floor(normalized / segAngle) % segments.length;
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

    const totalRotations = 5 + Math.random() * 2;
    const randomSegment = Math.floor(Math.random() * segments.length);
    const segAngle = (2 * Math.PI) / segments.length;
    const targetAngle = randomSegment * segAngle + (Math.random() * segAngle * 0.8 - segAngle * 0.4);
    
    const targetRotation = rotation + totalRotations * 2 * Math.PI + targetAngle;

    const duration = 4000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOut(progress);
      
      const currentRotation = rotation + easedProgress * (targetRotation - rotation);
      
      setRotation(currentRotation);
      drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const finalRotation = targetRotation % (2 * Math.PI);
        setRotation(finalRotation);
        
        const winnerResult = getWinner(finalRotation);
        setWinner(winnerResult.label);
        setIsSpinning(false);
        
        onSpinComplete(winnerResult.index, winnerResult.label, winnerResult.prize);

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

  // Draw wheel when images are loaded or rotation changes
  useEffect(() => {
    if (allImagesLoaded) {
      drawWheel();
    }
  }, [allImagesLoaded, rotation]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (allImagesLoaded) {
        drawWheel();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [allImagesLoaded]);


  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden z-10">
      {/* Background video */}
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

          <img
          src="https://res.cloudinary.com/dziy5sjas/image/upload/v1761047804/wheel_basnqc.png"
          alt="Wheel Ring"
          className="absolute -top-4 sm:top-14 sm:left-16 md:left-0 md:-top-0 inset-0  w-[108%] h-[108%] sm:w-[80%] sm:h-[80%] md:w-full md:h-full object-cover z-20 pointer-events-none"
        />
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '50%',
            
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
          className="absolute w-32 h-32 md:w-52 md:h-52 rounded-full object-cover pointer-events-none border-2 border-yellow-400"
        >
          <source src="https://res.cloudinary.com/dziy5sjas/video/upload/v1761140835/Middlevideo_s9eiiy.mp4" type="video/mp4" />
        </video>

        {/* SPIN button */}
        <button
          onClick={spinWheel}
          disabled={isSpinning}
          className="absolute bottom-[40.5%] sm:bottom-[44%] md:bottom-[42%]
                       px-2 py-1 
                       bg-yellow-400 rounded-[4px] 
                       hover:bg-yellow-500 text-black font-bold 
                       text-[8px] md:text-[12px] 
                       shadow-xl transition-all"
          >
          {isSpinning ? "SPINNING..." : "SPIN"}
        </button>
      </div>

      {/* Spin History Table - your existing table JSX */}
      <div className="w-full max-w-2xl mx-auto h-72 mb-5 z-10 bg-black/70 rounded-t-xl mt-10 py-6 overflow-y-auto px-4 sm:px-6 text-white border-t border-yellow-400">
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