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
import BarrierReef from "../../../../attached_assets/Land Mark/Barrier Reef.webp";
import AngleOfNorth from "../../../../attached_assets/Land Mark/Angel of North.webp";
import BigBen from "../../../../attached_assets/Land Mark/Big Ben.webp";
import BuckinghamPalace from "../../../../attached_assets/Land Mark/Buckingham palace.webp";
import Burj from "../../../../attached_assets/Land Mark/Burj.webp";
import colosseum from "../../../../attached_assets/Land Mark/colosseum.webp";
import EiffelTower from "../../../../attached_assets/Land Mark/Eiifel Tow.webp";
import EmpireState from "../../../../attached_assets/Land Mark/Empire State.webp";
import GoldenGate from "../../../../attached_assets/Land Mark/Golden Gate.webp";
import GrandCanyon from "../../../../attached_assets/Land Mark/Grand Canyon.webp";
import GreatWallOfChina from "../../../../attached_assets/Land Mark/Great Wall of China.webp";
import MountEverest from "../../../../attached_assets/Land Mark/Mount Ever.webp";
import NotreDame from "../../../../attached_assets/Land Mark/Notre Dame.webp";
import PayramidsOfPisa from "../../../../attached_assets/Land Mark/Pyramids of Pisa.webp";
import StatueOfLiberty from "../../../../attached_assets/Land Mark/Statue Of Liber.webp";
import StoneH from "../../../../attached_assets/Land Mark/Stone H.webp";
import TajMahal from "../../../../attached_assets/Land Mark/Taj Ma.webp";
import TimesSquare from "../../../../attached_assets/Land Mark/Times S.webp";
import TowerBridge from "../../../../attached_assets/Land Mark/Tower Bridge.webp";
import TowerOfPisa from "../../../../attached_assets/Land Mark/Tower of Pisa.webp";
import TryAgain from "../../../../attached_assets/Land Mark/tryAgain.jpg";
import scratchBackgroundVideo from "../../../../attached_assets/scratchbg.mp4";
import confetti from 'canvas-confetti';

import { useLocation, useParams } from "wouter";

interface ScratchCardProps {
  onScratchReveal?: (prize: { type: string; value: string }) => void;
  onCommitSession?: (sessionId: string, payload: { orderId: string; prizeId: string; isWinner: boolean }) => Promise<void>;
  onRefreshBalance?: () => void;
  commitError?: string | null;
  mode?: "tight" | "loose";
  scratchTicketCount?: number;
  orderId?: string;
  congratsAudioRef: React.RefObject<HTMLAudioElement>;
  competitionId?: string;
}

const CSS_WIDTH = 500;
const CSS_HEIGHT = 350;
const AUTO_CLEAR_THRESHOLD = 0.60; // ✅ Changed from 0.7 to 0.85
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
  // { name: "Try Again", src: TryAgain },
];

function normalizeName(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getImageByBackendName(name: string) {
  const normalized = normalizeName(name);

  const found = landmarkImages.find(
    (img) => normalizeName(img.name) === normalized
  );

  return found || null;
}

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

export default function ScratchCardTest({ onScratchReveal, onRefreshBalance,  competitionId , mode = "tight", scratchTicketCount, orderId ,congratsAudioRef }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {id} = useParams()
  const drawingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const scratchSoundRef = useRef<HTMLAudioElement | null>(null);
  const hasCompletedRef = useRef(false);
  const isScratching = useRef(false); // 🎵 Track if actively scratching (for sound control)
  const [hideImagesAfterRevealAll, setHideImagesAfterRevealAll] = useState(false);

  const [,setLocation] = useLocation();
  // 🎯 NEW: Session-based state management
  const [sessionState, setSessionState] = useState<'loading' | 'ready' | 'scratching' | 'completed'>('loading');
  const [currentSession, setCurrentSession] = useState<{
    sessionId: string;
    isWinner: boolean;
    prize: { type: string; value: string; label: string };
    tileLayout: string[];
    prizeId: string;
  } | null>(null);
  const [nextSession, setNextSession] = useState<any>(null); // Pre-fetched next session

  const [revealed, setRevealed] = useState(false);
  const [percentScratched, setPercentScratched] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);
  const [images, setImages] = useState<any[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<{ type: string; value: string }>({ type: "none", value: "0" });
  const [scratchHistory, setScratchHistory] = useState<
    { status: string; prize: { type: string; value: string } }[]
  >([]);

  // Confirmation dialog state
  const [showRevealAllDialog, setShowRevealAllDialog] = useState(false);
  const [showRevealAllResultDialog, setShowRevealAllResultDialog] = useState(false);
const [revealAllSummary, setRevealAllSummary] = useState<{ wins: number; losses: number }>({
  wins: 0,
  losses: 0
});

const [showOutOfScratchesDialog, setShowOutOfScratchesDialog] = useState(false);
const outOfScratchClickCount = useRef(0);
const hasCommittedCurrentScratch = useRef(false);
const [allScratchesCompleted, setAllScratchesCompleted] = useState(false);
  // Check if all scratch cards are used
  const allScratchesUsed = scratchHistory.length > 0 && scratchHistory.every(s => s.status === "Scratched");

  // Add this useEffect at the beginning of your component
useEffect(() => {
  if (!orderId) return;
  
  const checkIncompleteScratches = () => {
    const inProgressData = localStorage.getItem(`scratchInProgress_${orderId}`);
    
    if (inProgressData) {
      const { index, timestamp } = JSON.parse(inProgressData);
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes ago
      
      // If scratch was started more than 5 minutes ago, mark as lost
      if (timestamp < fiveMinutesAgo) {
        // console.log("⏰ Old incomplete scratch found, marking as lost");
        
        setScratchHistory(prev => {
          const updated = [...prev];
          if (index < updated.length) {
            updated[index] = {
              status: "Lost",
              prize: { type: "none", value: "Lost" },
            };
          }
          return updated;
        });
        
        localStorage.removeItem(`scratchInProgress_${orderId}`);
      } else {
        // console.log("🔄 Scratch was in progress recently, keeping as Scratching");
      }
    }
  };
  
  checkIncompleteScratches();
}, [orderId]);

// Update this effect to check when all scratches are completed
useEffect(() => {
  if (scratchHistory.length > 0) {
    const completed = scratchHistory.every(s => 
      s.status === "Scratched" || s.status === "Lost"
    );
    setAllScratchesCompleted(completed);
    
    // If all completed, clear current session
    if (completed && currentSession) {
      setCurrentSession(null);
      setSessionState('completed');
    }
  }
}, [scratchHistory, currentSession]);

  // Fix canvas not rendering after Reveal All
useEffect(() => {
  if (hideImagesAfterRevealAll) {
    // Wait for DOM to update
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initCanvas();
      });
    });
  }
}, [hideImagesAfterRevealAll]);


    // ✅ SIMPLIFIED INITIALIZATION - Only run once when scratchTicketCount or orderId changes
// Update your initialization useEffect
useEffect(() => {
  if (!scratchTicketCount || !orderId) return;

  const savedHistory = loadScratchHistory(orderId);
  const lostScratches = JSON.parse(localStorage.getItem(`lostScratches_${orderId}`) || '[]');

  let finalHistory = savedHistory;
  
  // 🎯 Apply lost scratches
  if (lostScratches.length > 0) {
    // console.log("📋 Found lost scratches:", lostScratches);
    
    finalHistory = savedHistory.map((item, index) => {
      const wasLost = lostScratches.some((lost: any) => lost.index === index);
      if (wasLost) {
        return {
          status: "Lost",
          prize: { type: "none", value: "Lost" },
        };
      }
      return item;
    });
    
    // Clear lost scratches after applying
    localStorage.removeItem(`lostScratches_${orderId}`);
  }

  // If we have saved history that matches current count, use it
  if (finalHistory.length === scratchTicketCount) {
    setScratchHistory(finalHistory);
  } 
  // If saved history exists but count doesn't match, adjust it
  else if (finalHistory.length > 0) {
    const adjustedHistory = adjustHistoryToCount(finalHistory, scratchTicketCount);
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

  // 🎯 NEW: Fetch scratch session from backend (pre-load result and tile layout)
  const fetchScratchSession = async (): Promise<void> => {
    if (!orderId) return;

    try {
      setSessionState('loading');

      const response = await fetch('/api/scratch-session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start scratch session');
      }

      const sessionData = await response.json();

      if (sessionData.success) {
        setCurrentSession({
          sessionId: sessionData.sessionId,
          isWinner: sessionData.isWinner,
          prize: sessionData.prize,
          tileLayout: sessionData.tileLayout,
          prizeId: sessionData.prizeId,
        });
        setSessionState('ready');
      }
    } catch (error) {
      console.error('Error fetching scratch session:', error);
      setSessionState('ready'); // Fallback to ready state
    }
  };

  useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden && 
        hasCommittedCurrentScratch.current && 
        !hasCompletedRef.current &&
        orderId && 
        localStorage.getItem(`scratchInProgress_${orderId}`)) {
      
      // console.log("👁️ User switched tabs while scratching!");
      
      // Mark as lost
      const inProgressData = localStorage.getItem(`scratchInProgress_${orderId}`);
      if (inProgressData) {
        const { index } = JSON.parse(inProgressData);
        
        const lostScratches = JSON.parse(localStorage.getItem(`lostScratches_${orderId}`) || '[]');
        lostScratches.push({ index, lostAt: Date.now() });
        localStorage.setItem(`lostScratches_${orderId}`, JSON.stringify(lostScratches));
        
        localStorage.removeItem(`scratchInProgress_${orderId}`);
        
        // Update UI
        setScratchHistory(prev => {
          const updated = [...prev];
          if (index < updated.length) {
            updated[index] = {
              status: "Lost",
              prize: { type: "none", value: "Lost" },
            };
          }
          return updated;
        });
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [orderId, hasCommittedCurrentScratch.current, hasCompletedRef.current]);

// When all scratches are used, clean up localStorage
useEffect(() => {
  if (scratchHistory.length > 0 && scratchHistory.every(s => 
    s.status === "Scratched" || s.status === "Lost")) {
    
    // console.log("🧹 All scratches completed, cleaning up localStorage");
    
    if (orderId) {
      localStorage.removeItem(`scratchInProgress_${orderId}`);
      localStorage.removeItem(`lostScratches_${orderId}`);
    }
  }
}, [scratchHistory, orderId]);

const commitCurrentScratch = () => {
  if (hasCommittedCurrentScratch.current) return;
  
  const firstUnscratched = scratchHistory.findIndex(s => s.status === "Not Scratched");
  if (firstUnscratched === -1) return;
  
  // console.log("📝 Committing scratch at index:", firstUnscratched);
  
  setScratchHistory(prev => {
    const updated = [...prev];
    updated[firstUnscratched] = {
      status: "Scratching",
      prize: { type: "none", value: "In progress..." },
    };
    return updated;
  });
  
  // 🎯 Save to localStorage IMMEDIATELY
  if (orderId) {
    localStorage.setItem(`scratchInProgress_${orderId}`, JSON.stringify({
      index: firstUnscratched,
      timestamp: Date.now(),
      isInProgress: true
    }));
  }
  
  hasCommittedCurrentScratch.current = true;
};

const triggerWinConfetti = (winCount: number, totalWon: number = 0) => {
  const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#a29bfe"];
  
  const duration = 4000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 8,
      angle: 60,
      spread: 85,
      origin: { x: 0, y: 0.7 },
      colors: colors,
      startVelocity: 60,
    });
    confetti({
      particleCount: 8,
      angle: 120,
      spread: 85,
      origin: { x: 1, y: 0.7 },
      colors: colors,
      startVelocity: 60,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();

  // Big center burst - more intense for multiple wins
  const particleCount = 180 + (winCount * 20);
  confetti({
    particleCount: Math.min(particleCount, 300), // Cap at 300
    spread: 120,
    origin: { y: 0.5 },
    colors: colors,
    startVelocity: 50,
  });

  // Optional: Add special effect for big wins
  if (totalWon >= 50) {
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.3 },
        colors: ["#ffd700", "#ffed4a", "#fbbf24"],
        startVelocity: 55,
      });
    }, 500);
  }
};

// Then update completeScratchSession to use the tracked index:
const completeScratchSession = async (): Promise<void> => {
  if (!currentSession || !orderId) return;

  try {
    // console.log("🎯 Starting completeScratchSession");
    // console.log("Prize to set:", currentSession.prize);

    const response = await fetch(`/api/scratch-session/${currentSession.sessionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        prizeId: currentSession.prizeId,
        isWinner: currentSession.isWinner,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete scratch session');
    }

    const result = await response.json();

    // console.log("🔍 Looking for 'Scratching' items to update...");
    
    setScratchHistory(prev => {
      const updated = [...prev];
      let updatedCount = 0;
      
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].status === "Scratching") {
          updated[i] = {
            status: "Scratched",
            prize: currentSession.prize,
          };
          updatedCount++;
          // console.log(`✅ Updated scratch at index ${i} with prize:`, currentSession.prize);
        }
      }
      
      if (updatedCount === 0) {
        console.warn("⚠️ No 'Scratching' items found to update!");
      }
      
      return updated;
    });

    // 🎯 CRITICAL: Clear the in-progress flag
    localStorage.removeItem(`scratchInProgress_${orderId}`);
    
    // Rest of your existing code...
    if (onScratchReveal) {
      onScratchReveal(currentSession.prize);
    }

    const isWin = 
      currentSession.prize?.type !== "none" &&
      currentSession.prize?.value !== "-" &&
      currentSession.isWinner === true;

    if (isWin && congratsAudioRef.current) {
      congratsAudioRef.current.currentTime = 0;
      congratsAudioRef.current.play().catch(() => {});
      triggerWinConfetti();
    }

    setSessionState('completed');
    // console.log("✅ completeScratchSession finished");
    
  } catch (error) {
    console.error('Error completing scratch session:', error);
  }
};

  // 🎯 NEW: Fetch session on mount or when we need a new one
  useEffect(() => {
    if (allScratchesCompleted) return;
    // Only fetch if we have remaining cards and no current session
    if (orderId && scratchHistory.length > 0 && !currentSession) {
      const hasRemaining = scratchHistory.some(s => s.status === "Not Scratched");
      if (hasRemaining && sessionState === 'loading') {
        fetchScratchSession();
      }
    }
  }, [orderId, scratchHistory, currentSession, sessionState , allScratchesCompleted]);

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

  // 🎯 NEW: Setup scratch card with pre-loaded tile layout from backend
  useEffect(() => {
    if (!currentSession ||  sessionState !== 'ready') {
      return;
    }

    // 🔒 Defensive check: Ensure exactly 6 tiles
    if (currentSession.tileLayout.length !== 6) {
      console.error(`Invalid tile layout: expected 6 tiles, got ${currentSession.tileLayout.length}`);
      return;
    }

    // Map tile layout from backend to actual image objects
    // const tileImages = currentSession.tileLayout.map(imageName => {
    //   const found = landmarkImages.find(img => img.name === imageName);
    //   return found || landmarkImages[0]; // Fallback to first image
    // });
      const tileImages = currentSession.tileLayout.map((name: string) => {
        const img = getImageByBackendName(name);
        if (!img) {
          console.warn("Unknown backend image name:", name);
          return landmarkImages[Math.floor(Math.random() * landmarkImages.length)];
        }
        return img;
      });


    // Set images to pre-determined layout (exactly 6)
    setImages(tileImages);

   // Reset state for new session
    isScratching.current = false;
    initCanvas();
  }, [currentSession, sessionState]);

  useEffect(() => {
    scratchSoundRef.current = new Audio(scratchSoundFile);
    scratchSoundRef.current.loop = true;
    scratchSoundRef.current.volume = 0.4;

    const handleMouseUpGlobal = () => {
      drawingRef.current = false;
      stopScratchSound(); // 🎵 Always stop sound on global pointer release
      checkPercentScratched(true);
    };

    window.addEventListener("mouseup", handleMouseUpGlobal);
    window.addEventListener("touchend", handleMouseUpGlobal);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopScratchSound(); // 🎵 Stop sound on unmount
      if (scratchSoundRef.current) {
        scratchSoundRef.current.pause();
        scratchSoundRef.current = null;
      }
      window.removeEventListener("mouseup", handleMouseUpGlobal);
      window.removeEventListener("touchend", handleMouseUpGlobal);
    };
  }, []);

    useEffect(() => {
  const handleResize = () => {
    // Use requestAnimationFrame for smoother resize handling
    requestAnimationFrame(() => {
      initCanvas();
    });
  };

  // Add debounce to prevent too many redraws
  let resizeTimer: NodeJS.Timeout;
  const debouncedResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 150);
  };

  window.addEventListener('resize', debouncedResize);
  
  // Initial canvas setup
  setTimeout(() => {
    initCanvas();
  }, 100);
  
  return () => {
    window.removeEventListener('resize', debouncedResize);
    clearTimeout(resizeTimer);
  };
}, []);

function initCanvas() {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const container = canvas.parentElement;
  if (!container) return;

  const ratio = window.devicePixelRatio || 1;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // Get current scratch percentage before resize
  const oldScratchPercent = percentScratched;

  // Get current context to check existing scratches
  const ctx = canvas.getContext('2d');
  let existingScratches: ImageData | null = null;
  
  // Only try to preserve scratches if they exist
  if (ctx && oldScratchPercent > 0 && oldScratchPercent < 100) {
    try {
      existingScratches = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
      console.log("Could not get existing scratches during resize");
    }
  }

  // Resize canvas (internal pixels)
  canvas.width = Math.round(containerWidth * ratio);
  canvas.height = Math.round(containerHeight * ratio);
  canvas.style.width = `${containerWidth}px`;
  canvas.style.height = `${containerHeight}px`;

  // Get new context with reset transform
  const newCtx = canvas.getContext('2d');
  if (!newCtx) return;
  newCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

  // Always redraw the base overlay first
  drawOverlay(newCtx, containerWidth, containerHeight);

  // If we had scratches before and they weren't complete, try to restore them
  if (existingScratches && oldScratchPercent > 0 && oldScratchPercent < 100) {
    try {
      // Create a temporary canvas to handle the scaling
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width / ratio;
      tempCanvas.height = canvas.height / ratio;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Put the old scratches on temp canvas
        tempCtx.putImageData(existingScratches, 0, 0);
        
        // Clear the scratched areas on main canvas using destination-out
        newCtx.globalCompositeOperation = 'destination-out';
        newCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
        newCtx.globalCompositeOperation = 'source-over';
      }
    } catch (e) {
      console.log("Failed to restore scratches during resize");
      // If restoration fails, just use current percentage to approximate
      if (oldScratchPercent > 0) {
        newCtx.globalCompositeOperation = 'destination-out';
        newCtx.fillStyle = 'rgba(0,0,0,1)';
        
        // Create a simple scratch pattern based on percentage
        const scratchArea = (oldScratchPercent / 100) * (containerWidth * containerHeight);
        const numCircles = Math.max(5, Math.floor(scratchArea / 500));
        
        for (let i = 0; i < numCircles; i++) {
          const x = Math.random() * containerWidth;
          const y = Math.random() * containerHeight;
          const radius = Math.max(10, Math.min(30, containerWidth * 0.04));
          
          newCtx.beginPath();
          newCtx.arc(x, y, radius, 0, Math.PI * 2);
          newCtx.fill();
        }
        
        newCtx.globalCompositeOperation = 'source-over';
      }
    }
  }

  // If all scratches are completed, draw "all used" overlay
  if (allScratchesCompleted) {
    drawAllUsedOverlay(newCtx, containerWidth, containerHeight);
    setRevealed(true);
  } else {
    setRevealed(false);
  }
}


function drawOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#cca60eff");
  gradient.addColorStop(1, "#e67e22");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#fff";
  const fontSize = Math.max(16, width * 0.05);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText("SCRATCH TO REVEAL", width / 2, height / 2);
}

function drawAllUsedOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#fff";
  const fontSize = Math.max(18, width * 0.06);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText("ALL SCRATCHES USED", width / 2, height / 2 - 30);

  const smallFontSize = Math.max(14, width * 0.04);
  ctx.font = `${smallFontSize}px Arial`;
  ctx.fillText("Check your progress table for results", width / 2, height / 2 + 20);
}



// Add these refs at the top with your other refs
const canvasWidthBeforeResize = useRef(0);
const canvasHeightBeforeResize = useRef(0);
const scratchPathsRef = useRef<Array<Array<{x: number, y: number}>>>([]);
const currentScratchPathRef = useRef<Array<{x: number, y: number}>>([]);

// Update your scratchAt function to store paths
function scratchAt(x: number, y: number) {
  // 🎯 NEW: Prevent scratching if all scratches are completed
  if (revealed || allScratchesCompleted) return;
  
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Store the point in current path
  if (!currentScratchPathRef.current) {
    currentScratchPathRef.current = [];
  }
  currentScratchPathRef.current.push({ x, y });

  // Make brush size responsive based on canvas size
 const brush = Math.max(14, canvas.clientWidth * 0.045);

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, brush, 0, Math.PI * 2);
  ctx.fill();

  if (!rafRef.current) rafRef.current = requestAnimationFrame(() => checkPercentScratched());
}

// Update your checkScratchCompletion function to save paths when complete
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

  // ✅ Update percentage display normally until 85%
  if (percent < AUTO_CLEAR_THRESHOLD) {
    setPercentScratched(Math.round(percent * 100));
  }

  // 🎯 NEW: SIMPLIFIED FLOW at 85% - Just show popup with pre-loaded prize
  if (percent >= AUTO_CLEAR_THRESHOLD && !revealed && !hasCompletedRef.current) {
    // 🔒 Guard: Don't proceed if no session loaded
    if (!currentSession) {
      console.warn("Session not loaded yet, waiting...");
      return;
    }

    hasCompletedRef.current = true;
    stopScratchSound(); // Stop sound immediately
    setRevealed(true);
    setSessionState('scratching'); // Update state to indicate scratching completed
    
    // Save the completed scratch path
    if (currentScratchPathRef.current.length > 0) {
      scratchPathsRef.current.push([...currentScratchPathRef.current]);
      currentScratchPathRef.current = [];
    }

    // Images are ALREADY in final position (pre-loaded), just show popup
    (async () => {
      try {
        const prizeWon = currentSession.prize;

        // 🎯 Images are ALREADY in correct positions (pre-loaded from backend)
        // NO image changes needed!

        // Update percentage to 100%
        setPercentScratched(100);

        // ⏱️ Brief delay for visual smoothness
        await new Promise(resolve => setTimeout(resolve, 150));
          // 🔒 Call completion endpoint to record usage and award prize
        await completeScratchSession();
        // ✅ Clear overlay to reveal final pattern
        clearOverlayInstant();

        // 🎉 Show popup IMMEDIATELY
        setSelectedPrize(prizeWon);

        // Prepare for next scratch (fetch next session in background)
        setTimeout(async () => {
          hasCompletedRef.current = false;
          setCurrentSession(null); // Clear current session
          setSessionState('loading'); // Trigger fetch of next session
          setRevealed(false);
          // Clear scratch paths for next session
          scratchPathsRef.current = [];
          currentScratchPathRef.current = [];
        }, 1000);
      } catch (error) {
        console.error("Error completing scratch:", error);
        alert("Failed to complete scratch card. Please try again.");
        // Clear overlay
        clearOverlayInstant();
        // Reset on error to allow retry
        hasCompletedRef.current = false;
        setRevealed(false);
        setSessionState('ready');
        // Reinitialize canvas
        initCanvas();
      }
    })();
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
    if (revealed || hasCompletedRef.current) return;
    if (isScratching.current) return; // 🎵 Already playing, don't restart

    const sound = scratchSoundRef.current;
    if (sound && sound.paused) {
      isScratching.current = true;
      sound.currentTime = 0; // Reset to start
      sound.play().catch(() => {});
    }
  }

  function stopScratchSound() {
    const sound = scratchSoundRef.current;
    if (sound && !sound.paused) {
      sound.pause();
      sound.currentTime = 0; // ⏮️ Reset for next scratch
    }
    isScratching.current = false; // 🎵 Mark as not scratching
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
  setHideImagesAfterRevealAll(true);

  // 🔥 Force browser to reflow by faking resize event
  setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 50);

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

    // Check if there are any wins in the results
    let hasWins = false;
    let winCount = 0;
    let totalWon = 0;
    
    // Update scratch history with all results and check for wins
    setScratchHistory(prev => {
      const updated = [...prev];
      let notScratchedIndex = 0;

      results.scratches.forEach((scratch: any) => {
        // Find the next Not Scratched entry
        while (notScratchedIndex < updated.length && updated[notScratchedIndex].status === "Scratched") {
          notScratchedIndex++;
        }

        if (notScratchedIndex < updated.length) {
          // Check if this scratch was a win
          const isWin = scratch.prize?.type !== "none" &&
                       scratch.prize?.type !== "try_again" &&
                       scratch.prize?.type !== "lose" &&
                       scratch.prize?.value !== "Lose" &&
                       scratch.prize?.value !== "Try Again" &&
                       scratch.prize?.value !== "0" &&
                       scratch.prize?.value !== 0;
          
          if (isWin) {
            hasWins = true;
            winCount++;
            // Add to total if it's a cash win
            if (scratch.prize?.type === "cash" && scratch.prize?.value) {
              const value = parseFloat(scratch.prize.value);
              if (!isNaN(value)) totalWon += value;
            }
          }

          updated[notScratchedIndex] = {
            status: "Scratched",
            prize: scratch.prize,
          };
          notScratchedIndex++;
        }
      });

      return updated;
    });

    // 🔒 CRITICAL: Invalidate queries to refresh balance and points in header
    if (onRefreshBalance) {
      onRefreshBalance();
    }

    // 🔥 ADD CONFETTI FOR BATCH WINS
    if (hasWins) {
      triggerWinConfetti(winCount, totalWon);
    }

    // Reset state
    hasCompletedRef.current = false;
    isScratching.current = false; // Reset scratching state
    setRevealed(false);
    setSessionKey((k) => k + 1);

    // Show summary message
    setShowRevealAllResultDialog(true);

  } catch (error) {
    console.error("Error revealing all scratch cards:", error);
    alert("Failed to reveal all scratch cards. Please try again.");

    // Reset on error to allow retry
    hasCompletedRef.current = false;
    isScratching.current = false; // Reset scratching state
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
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasCommittedCurrentScratch.current && !hasCompletedRef.current) {
      // 🎯 Check if there's a scratch in progress
      if (orderId && localStorage.getItem(`scratchInProgress_${orderId}`)) {
        e.preventDefault();
        e.returnValue = "You're scratching a card! If you leave now, you'll lose this scratch.";
        return e.returnValue;
      }
    }
  };

  const handleUnload = () => {
    // 🎯 On page unload, mark any in-progress scratch as lost
    if (orderId && localStorage.getItem(`scratchInProgress_${orderId}`)) {
      const inProgressData = localStorage.getItem(`scratchInProgress_${orderId}`);
      if (inProgressData) {
        const { index } = JSON.parse(inProgressData);
        
        // Save that this scratch was lost
        const lostScratches = JSON.parse(localStorage.getItem(`lostScratches_${orderId}`) || '[]');
        lostScratches.push({ index, lostAt: Date.now() });
        localStorage.setItem(`lostScratches_${orderId}`, JSON.stringify(lostScratches));
        
        localStorage.removeItem(`scratchInProgress_${orderId}`);
      }
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('unload', handleUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('unload', handleUnload);
  };
}, [orderId, hasCommittedCurrentScratch.current, hasCompletedRef.current]);


useEffect(() => {
  if (currentSession) {
    hasCommittedCurrentScratch.current = false;
  }
}, [currentSession]);

  return (
  <div className="relative flex flex-col items-center justify-center p-4 min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 🎯 NEW: Loading overlay while fetching session */}
      {/* {sessionState === 'loading' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#FACC15] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading scratch card...</p>
          </div>
        </div>
      )} */}
        

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
        src={scratchBackgroundVideo}
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
              <span>Available Scratch Cards: {scratchHistory.filter(s => s.status === "Not Scratched").length}</span>
            </div>
          </div>
        )}
      </div>

      {!allScratchesCompleted && (
        <>
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
              <div className="h-1 mt-3 bg-gradient-to-r from-transparent via-[#FACC15] to-transparent rounded-full"></div>
            </div>
            <p className="text-white/90 text-base sm:text-lg md:text-xl font-semibold">
              Match 3 same images to win amazing prizes! 🎁
            </p>
          </div>
        </>
      )}

      {/* PREMIUM Scratch Card Container with Gold Border & Glow */}
      <div className="relative mx-auto mb-8 sm:mb-12 group">
        {/* Premium outer glow effect - Brand Colors */}
        <div className="absolute -inset-4 bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-700"></div>

        {/* Card container with premium gold border */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#FACC15]/60 shadow-[#FACC15]/30 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 w-full sm:w-[550px] md:w-[600px] mx-auto">
          <div className="relative min-h-[350px] sm:min-h-[420px] md:min-h-[450px]">
            
            {!allScratchesCompleted ? (
              <>
                {/* UNDERLAY - Enhanced with premium background (2x3 grid = 6 tiles) */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-3 sm:p-5">
                  {!hideImagesAfterRevealAll && (
                    <div className="grid grid-cols-3 grid-rows-2 gap-2 sm:gap-3 md:gap-4 w-full h-full max-w-lg mx-auto p-2">
                      {images.slice(0, 6).map((img, i) => (
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
                  )}
                </div>

                {/* SCRATCH LAYER (only shown when not all completed) */}
                <canvas
                  key={sessionKey}
                  ref={canvasRef}
                  className="absolute inset-0 cursor-pointer touch-none w-full h-full"
                  onMouseDown={(e) => {
                    if (allScratchesUsed) {
                      setShowOutOfScratchesDialog(true);
                      return;
                    }
                    
                    if (!hasCommittedCurrentScratch.current) {
                      commitCurrentScratch();
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
                    if (allScratchesUsed) {
                      setShowOutOfScratchesDialog(true);
                      return;
                    }
                    
                    if (!hasCommittedCurrentScratch.current) {
                      commitCurrentScratch();
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
                  onMouseUp={() => {
                    drawingRef.current = false;
                    stopScratchSound();
                  }}
                  onMouseLeave={() => {
                    drawingRef.current = false;
                    stopScratchSound();
                  }}
                  onTouchEnd={() => {
                    drawingRef.current = false;
                    stopScratchSound();
                  }}
                />
              </>
            ) : (
              /* 🎯 ALL SCRATCHES COMPLETED - Replace canvas with message */
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center p-6 cursor-pointer"
                onClick={() => {
                  // Open dialog when clicked
                  setShowOutOfScratchesDialog(true);
                }}
              >
                {/* Background similar to scratch overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#cca60e] to-[#e67e22]"></div>
                
                {/* Content */}
                <div className="relative z-10 text-center p-8 max-w-md">
                  {/* <div className="text-6xl mb-6">🎉</div> */}
                  <h3 className=" text-lg sm:text-3xl font-bold text-white mb-4">
                    All Scratches Used!
                  </h3>
                  <p className="text-white/90 text-sm sm:text-lg mb-6">
                    You've used all your scratch cards. 
                    Click to buy more or check your results below.
                  </p>
                  {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                    <span className="text-white text-sm">Click to continue </span>
                  </div> */}
                </div>
                
                {/* Subtle overlay effect */}
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reveal All Button - Only show when not all completed */}
      {!allScratchesCompleted && (
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
      )}

        {/* PREMIUM Progress Table - Mobile Optimized */}
        <div className="w-full max-w-3xl mx-auto relative px-2 sm:px-4">
          {/* Premium glow effect around table */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#FACC15]/20 via-[#F59E0B]/20 to-[#FACC15]/20 rounded-2xl blur-xl"></div>

          <div className="relative bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-[#FACC15]/40 shadow-2xl overflow-hidden">
            {/* Header with premium styling */}
            <div className="bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] px-3 sm:px-6 py-3 sm:py-4">
              <h3 className="text-center text-base sm:text-xl md:text-2xl font-black text-gray-900 flex items-center justify-center gap-1 sm:gap-2">
                {/* <span className="text-lg sm:text-2xl">📊</span> */}
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
            : item.status === "Scratching" // ✅ Add this case
            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse"
            : "bg-gray-700/50 text-gray-400 border border-gray-600/30"
        }`}>
          <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
            item.status === "Scratched" ? "bg-green-400" 
            : item.status === "Scratching" ? "bg-yellow-400 animate-pulse" // ✅ Add this
            : "bg-gray-400"
          }`}></span>
          <span className="hidden sm:inline">{item.status}</span>
          <span className="sm:hidden">
            {item.status === "Scratched" ? "✓" 
             : item.status === "Scratching" ? "⟳" // ✅ Add this
             : "−"}
          </span>
        </span>
      </td>
      
      <td className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 text-right font-bold rounded-r-lg">
        {item.status === "Not Scratched" ? (
          <span className="text-gray-500 text-xs sm:text-sm">-</span>
        ) : item.status === "Scratching" ? ( // ✅ Add this case
          <span className="text-yellow-400 text-xs sm:text-sm animate-pulse">
            Scratching...
          </span>
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
        <AlertDialogContent className="bg-gray-900 w-[90vw] max-w-sm sm:max-w-md mx-auto   border-2 border-[#FACC15]">
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
<AlertDialog open={showOutOfScratchesDialog} onOpenChange={setShowOutOfScratchesDialog}>
  <AlertDialogContent className="bg-gray-900 w-[90vw] max-w-sm sm:max-w-md mx-auto border-2 border-[#FACC15] text-white">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-[#FACC15] text-xl font-bold text-center">
        No Scratch Cards Left
      </AlertDialogTitle>
      <AlertDialogDescription className="text-gray-300 text-center text-base">
        You have used all your scratch cards.  
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
          localStorage.removeItem(`scratchCardHistory_${orderId}`);
        }
        setLocation(`/competition/${competitionId}`);
      }, 2000);
        }}
      >
        Buy More
      </AlertDialogAction>

      <AlertDialogCancel className="bg-gray-800  text-white hover:bg-gray-700 px-6 py-3 rounded-lg">
        Close
      </AlertDialogCancel>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

    </div>
  );
}