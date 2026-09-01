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
import { SCRATCH_NATION_FLAGS, getNationFlag } from "@/lib/scratch-nations";
import confetti from 'canvas-confetti';

import { useLocation, useParams } from "wouter";
import { Sparkles } from "lucide-react";
import { formatResultTicket, prizeFromReward } from "@/components/games/PlayResultsTable";
import RevealAllBatchSummary, { type RevealBatchRow } from "@/components/games/RevealAllBatchSummary";

interface ScratchCardProps {
  onScratchReveal?: (prize: { type: string; value: string }) => void;
  onCommitSession?: (
    sessionId: string,
    payload: { orderId: string; prizeId: string; isWinner: boolean },
  ) => Promise<{ ticketNumber?: string | null } | void>;
  onRefreshBalance?: () => void;
  onRemainingChange?: (remaining: number) => void;
  commitError?: string | null;
  mode?: "tight" | "loose";
  scratchTicketCount?: number;
  orderId?: string;
  congratsAudioRef: React.RefObject<HTMLAudioElement>;
  competitionId?: string;
  resultModalOpen?: boolean;
  playTickets?: Array<string | null>;
}

const CSS_WIDTH = 500;
const CSS_HEIGHT = 350;
const AUTO_CLEAR_THRESHOLD = 0.18;
const SAMPLE_GAP = 4;

const nationFlags = SCRATCH_NATION_FLAGS.map((flag) => ({
  name: flag.name,
  src: flag.src,
}));

function getImageByBackendName(name: string) {
  const found = getNationFlag(name);
  return found ? { name: found.name, src: found.src } : null;
}

function getRandomImages(n: number) {
  const shuffled = [...nationFlags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function generateScratchGrid(mode: "tight" | "loose" = "loose") {
  const WIN_PROB = mode === "tight" ? 0.2 : 0.7;
  const isWinner = Math.random() < WIN_PROB;
  let images = getRandomImages(6);

  if (isWinner) {
    const chosen = nationFlags[Math.floor(Math.random() * nationFlags.length)];
    const winIndices = [0, 1, 4];
    winIndices.forEach((i) => (images[i] = chosen));
  }

  return { images, isWinner };
}
// Add this function to load/save scratch history (order-specific)
const loadScratchHistory = (orderId?: string): { status: string; prize: { type: string; value: string; ticketNumber?: string | null } }[] => {
  try {
    if (!orderId) return [];
    const saved = localStorage.getItem(`scratchCardHistory_${orderId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveScratchHistory = (history: { status: string; prize: { type: string; value: string; ticketNumber?: string | null } }[], orderId?: string) => {
  try {
    if (!orderId) return;
    localStorage.setItem(`scratchCardHistory_${orderId}`, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save scratch history:', error);
  }
};

export default function ScratchCardTest({ onScratchReveal, onCommitSession, onRefreshBalance, onRemainingChange,  competitionId , mode = "tight", scratchTicketCount, orderId ,congratsAudioRef, resultModalOpen = false, playTickets = [] }: ScratchCardProps) {
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
    { status: string; prize: { type: string; value: string; ticketNumber?: string | null } }[]
  >([]);

  // Confirmation dialog state
  const [showRevealAllDialog, setShowRevealAllDialog] = useState(false);
  const [showRevealAllResultDialog, setShowRevealAllResultDialog] = useState(false);
  const [revealBatchRows, setRevealBatchRows] = useState<RevealBatchRow[]>([]);
  const [revealBatchCash, setRevealBatchCash] = useState(0);
  const [revealBatchPoints, setRevealBatchPoints] = useState(0);
const [revealAllSummary, setRevealAllSummary] = useState<{ wins: number; losses: number }>({
  wins: 0,
  losses: 0
});

const [showOutOfScratchesDialog, setShowOutOfScratchesDialog] = useState(false);
const outOfScratchClickCount = useRef(0);
const hasCommittedCurrentScratch = useRef(false);
const hasRecordedRef = useRef(false);
const committedIndexRef = useRef<number | null>(null);
const currentSessionRef = useRef<typeof currentSession>(null);
const resultModalOpenRef = useRef(resultModalOpen);
const revealedRef = useRef(false);
const recordPromiseRef = useRef<Promise<void> | null>(null);
const checkPercentRef = useRef<(force?: boolean) => void>(() => {});
const historyBoundToOrderRef = useRef<string | null>(null);
const [allScratchesCompleted, setAllScratchesCompleted] = useState(false);

currentSessionRef.current = currentSession;
resultModalOpenRef.current = resultModalOpen;
revealedRef.current = revealed;
  // Check if all scratch cards are used
  const allScratchesUsed = scratchHistory.length > 0 && scratchHistory.every(s => s.status === "Scratched");

  // Add this useEffect at the beginning of your component
useEffect(() => {
  if (!orderId) return;
  const raw = localStorage.getItem(`scratchOpenSession_${orderId}`);
  const inProgress = localStorage.getItem(`scratchInProgress_${orderId}`);
  if (!raw || !inProgress) return;
  try {
    const saved = JSON.parse(raw);
    if (saved?.sessionId && saved?.prizeId) {
      setCurrentSession(saved);
      currentSessionRef.current = saved;
      hasCommittedCurrentScratch.current = true;
      void recordPlayIfNeeded().catch((error) => {
        console.error("Error finishing saved scratch session:", error);
      });
    }
  } catch {
    localStorage.removeItem(`scratchOpenSession_${orderId}`);
  }
}, [orderId]);

// Update this effect to check when all scratches are completed
useEffect(() => {
  if (currentSession && sessionState !== "completed" && !revealed) {
    setAllScratchesCompleted(false);
    return;
  }
  if (scratchHistory.length > 0) {
    const historyDone = scratchHistory.every(s =>
      s.status === "Scratched" || s.status === "Lost"
    );
    // Server remaining is the source of truth. Stale local history must not lock the card.
    const completed = scratchTicketCount === undefined
      ? historyDone
      : scratchTicketCount <= 0 && historyDone;
    setAllScratchesCompleted(completed);
    
    // If all completed, clear current session
    if (completed && currentSession && sessionState === "completed") {
      setCurrentSession(null);
    }
  }
}, [scratchHistory, currentSession, scratchTicketCount, sessionState, revealed]);

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


function withPlayTickets(history: { status: string; prize: { type: string; value: string; ticketNumber?: string | null } }[]) {
  if (!playTickets.length) return history;
  let ticketIdx = 0;
  return history.map((row) => {
    if (row.status !== "Scratched" && row.status !== "Lost") return row;
    const next = playTickets[ticketIdx++];
    if (!next || row.prize?.ticketNumber) return row;
    return { ...row, prize: { ...row.prize, ticketNumber: next } };
  });
}

function closeConsumedLocalRows(
  history: { status: string; prize: { type: string; value: string; ticketNumber?: string | null } }[],
) {
  return history.map((row) => {
    if (row.status !== "Not Scratched" && row.status !== "Scratching") return row;
    const hasPrize =
      row.prize?.type &&
      row.prize.type !== "none" &&
      row.prize.value !== "-" &&
      row.prize.value !== "In progress...";
    return {
      status: "Scratched",
      prize: hasPrize ? row.prize : { type: "none", value: "Lose" },
    };
  });
}

useEffect(() => {
  if (!orderId || scratchTicketCount === undefined) return;

  if (historyBoundToOrderRef.current === orderId) {
    if (playTickets.length) {
      setScratchHistory((prev) => withPlayTickets(prev));
    }
    return;
  }

  const savedHistory = loadScratchHistory(orderId);
  const lostScratches = JSON.parse(localStorage.getItem(`lostScratches_${orderId}`) || '[]');

  let finalHistory = savedHistory;

  if (lostScratches.length > 0) {
    finalHistory = savedHistory.map((item, index) => {
      const wasLost = lostScratches.some((lost: any) => lost.index === index);
      if (wasLost) {
        return {
          status: "Lost",
          prize: { type: "none", value: "Lose" },
        };
      }
      return item;
    });
    localStorage.removeItem(`lostScratches_${orderId}`);
  }

  if (scratchTicketCount > 0 && finalHistory.length === scratchTicketCount) {
    finalHistory = openRemainingSlots(finalHistory, scratchTicketCount);
  } else if (finalHistory.length > 0) {
    finalHistory = scratchTicketCount > 0
      ? openRemainingSlots(adjustHistoryToCount(finalHistory, scratchTicketCount), scratchTicketCount)
      : closeConsumedLocalRows(finalHistory);
  } else if (scratchTicketCount > 0) {
    finalHistory = Array.from({ length: scratchTicketCount }, () => ({
      status: "Not Scratched",
      prize: { type: "none", value: "-" },
    }));
  }

  historyBoundToOrderRef.current = orderId;
  setScratchHistory(withPlayTickets(finalHistory));
  if (orderId && finalHistory.length > 0) saveScratchHistory(finalHistory, orderId);
}, [scratchTicketCount, orderId, playTickets.join("|")]);

  // If the server still has cards, reopen locally-closed rows that were never used.
  const openRemainingSlots = (history: any[], remaining: number) => {
    const openCount = history.filter((s) => s.status === "Not Scratched").length;
    if (openCount >= remaining) return history;

    let needed = remaining - openCount;
    const next = history.map((item) => {
      if (needed <= 0) return item;
      if (item.status === "Lost") {
        needed -= 1;
        return { status: "Not Scratched", prize: { type: "none", value: "-" } };
      }
      return item;
    });

    if (needed <= 0) return next;

    return [
      ...next,
      ...Array.from({ length: needed }, () => ({
        status: "Not Scratched",
        prize: { type: "none", value: "-" },
      })),
    ];
  };

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
        const next = {
          sessionId: sessionData.sessionId,
          isWinner: sessionData.isWinner,
          prize: sessionData.prize,
          tileLayout: sessionData.tileLayout,
          prizeId: sessionData.prizeId,
        };
        setCurrentSession(next);
        if (orderId) {
          localStorage.setItem(`scratchOpenSession_${orderId}`, JSON.stringify(next));
        }
        setSessionState('ready');
      }
    } catch (error) {
      console.error('Error fetching scratch session:', error);
      setSessionState('loading');
    }
  };

  useEffect(() => {
  const persistOpenPlay = () => {
    if (hasCommittedCurrentScratch.current) {
      void recordPlayIfNeeded().catch((error) => {
        console.error("Error recording scratch on hide:", error);
      });
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) persistOpenPlay();
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

const markHistoryRow = (
  status: string,
  prize: { type: string; value: string; ticketNumber?: string | null },
) => {
  setScratchHistory((prev) => {
    const updated = [...prev];
    let index = committedIndexRef.current;
    if (index == null || index < 0 || index >= updated.length) {
      index = updated.findIndex((row) => row.status === "Scratching");
    }
    if (index < 0) {
      index = updated.findIndex((row) => row.status === "Not Scratched");
    }
    if (index < 0) return prev;
    committedIndexRef.current = index;
    updated[index] = {
      status,
      prize: {
        ...updated[index].prize,
        ...prize,
        ticketNumber: prize.ticketNumber || updated[index].prize?.ticketNumber,
      },
    };
    if (orderId) saveScratchHistory(updated, orderId);
    return updated;
  });
};

const recordPlayIfNeeded = async (): Promise<void> => {
  const session = currentSessionRef.current;
  if (!session || !orderId) return;
  if (hasRecordedRef.current) return recordPromiseRef.current || Promise.resolve();
  if (recordPromiseRef.current) return recordPromiseRef.current;

  const payload = {
    orderId,
    prizeId: session.prizeId,
    isWinner: session.isWinner,
  };

  const run = (async () => {
    let ticketNumber: string | null | undefined;
    if (onCommitSession) {
      const saved = await onCommitSession(session.sessionId, payload);
      ticketNumber = saved?.ticketNumber;
    } else {
      const response = await fetch(`/api/scratch-session/${session.sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
        keepalive: true,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to complete scratch session");
      }
      const body = await response.json();
      ticketNumber = body?.ticketNumber;
    }
    hasRecordedRef.current = true;
    markHistoryRow("Scratched", { ...session.prize, ticketNumber: ticketNumber || undefined });
    if (orderId) {
      localStorage.removeItem(`scratchInProgress_${orderId}`);
      localStorage.removeItem(`scratchOpenSession_${orderId}`);
    }
  })();

  recordPromiseRef.current = run;
  try {
    await run;
  } catch (error) {
    recordPromiseRef.current = null;
    throw error;
  } finally {
    if (hasRecordedRef.current) recordPromiseRef.current = null;
  }
};

const commitCurrentScratch = () => {
  if (hasCommittedCurrentScratch.current) {
    void recordPlayIfNeeded().catch((error) => {
      console.error("Error recording scratch play:", error);
    });
    return;
  }

  const firstUnscratched = scratchHistory.findIndex((s) => s.status === "Not Scratched");
  if (firstUnscratched === -1) return;

  committedIndexRef.current = firstUnscratched;
  hasCommittedCurrentScratch.current = true;
  markHistoryRow("Scratching", { type: "none", value: "In progress..." });

  if (orderId) {
    localStorage.setItem(`scratchInProgress_${orderId}`, JSON.stringify({
      index: firstUnscratched,
      timestamp: Date.now(),
      isInProgress: true,
    }));
  }

  void recordPlayIfNeeded().catch((error) => {
    console.error("Error recording scratch play:", error);
  });
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

const completeScratchSession = async (): Promise<void> => {
  const session = currentSessionRef.current;
  if (!session || !orderId) return;

  await recordPlayIfNeeded();

  markHistoryRow("Scratched", session.prize);
  if (onScratchReveal) {
    onScratchReveal(session.prize);
  }

  const isWin =
    session.prize?.type !== "none" &&
    session.prize?.value !== "-" &&
    session.isWinner === true;

  if (isWin && congratsAudioRef.current) {
    congratsAudioRef.current.currentTime = 0;
    congratsAudioRef.current.play().catch(() => {});
    triggerWinConfetti();
  }

  setSessionState("completed");
};

  // 🎯 NEW: Fetch session on mount or when we need a new one
  useEffect(() => {
    if (allScratchesCompleted || resultModalOpen) return;
    // Only fetch if we have remaining cards and no current session
    if (orderId && scratchHistory.length > 0 && !currentSession) {
      const hasRemaining = (scratchTicketCount ?? 0) > 0;
      if (hasRemaining && sessionState === 'loading') {
        fetchScratchSession();
      }
    }
  }, [orderId, scratchHistory, currentSession, sessionState , allScratchesCompleted, scratchTicketCount, resultModalOpen]);

  // Start the next card only after the result popup is dismissed, and after
  // this click ends, so GET IN cannot scratch the new foil in the same tap.
  useEffect(() => {
    if (resultModalOpen || sessionState !== "completed" || allScratchesCompleted) return;

    const hasRemaining = (scratchTicketCount ?? 0) > 0;

    if (!hasRemaining) {
      setAllScratchesCompleted(true);
      return;
    }

    const t = window.setTimeout(() => {
      hasCompletedRef.current = false;
      hasCommittedCurrentScratch.current = false;
      hasRecordedRef.current = false;
      recordPromiseRef.current = null;
      committedIndexRef.current = null;
      setCurrentSession(null);
      setSessionState("loading");
      setRevealed(false);
      scratchPathsRef.current = [];
      currentScratchPathRef.current = [];
    }, 280);

    return () => window.clearTimeout(t);
  }, [resultModalOpen, sessionState, scratchTicketCount, scratchHistory, allScratchesCompleted]);

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
          return nationFlags[Math.floor(Math.random() * nationFlags.length)];
        }
        return img;
      });


    // Set images to pre-determined layout (exactly 6)
    setImages(tileImages);

   // Reset state for new session
    isScratching.current = false;
    if (!hasCommittedCurrentScratch.current && !hasCompletedRef.current) {
      initCanvas();
    }
  }, [currentSession, sessionState]);

  useEffect(() => {
    scratchSoundRef.current = new Audio(scratchSoundFile);
    scratchSoundRef.current.loop = true;
    scratchSoundRef.current.volume = 0.4;

    const handleMouseUpGlobal = () => {
      drawingRef.current = false;
      stopScratchSound(); // 🎵 Always stop sound on global pointer release
      checkPercentRef.current(true);
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
  gradient.addColorStop(0, "#2a2110");
  gradient.addColorStop(0.45, "#8A6E18");
  gradient.addColorStop(1, "#1a1208");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(241, 212, 122, 0.12)";
  for (let i = 0; i < width + height; i += 14) {
    ctx.fillRect(i, 0, 5, height);
  }

  ctx.fillStyle = "#F1D47A";
  const fontSize = Math.max(16, width * 0.048);
  ctx.font = `700 ${fontSize}px Oswald, Arial Black, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("SCRATCH TO REVEAL", width / 2, height / 2 - 8);
  ctx.fillStyle = "rgba(255, 248, 238, 0.7)";
  ctx.font = `600 ${Math.max(11, width * 0.028)}px Oswald, Arial, sans-serif`;
  ctx.fillText("MATCH 3 FLAGS", width / 2, height / 2 + fontSize * 0.7);
}

function drawAllUsedOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#F1D47A";
  const fontSize = Math.max(18, width * 0.055);
  ctx.font = `700 ${fontSize}px Oswald, Arial Black, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("ALL CARDS USED", width / 2, height / 2 - 16);

  ctx.fillStyle = "rgba(255, 248, 238, 0.55)";
  const smallFontSize = Math.max(13, width * 0.032);
  ctx.font = `600 ${smallFontSize}px Oswald, Arial, sans-serif`;
  ctx.fillText("Check your results below", width / 2, height / 2 + 18);
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
function checkPercentScratched(_force = false) {
  rafRef.current = null;
  if (resultModalOpenRef.current) return;
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

  const percent = total > 0 ? cleared / total : 0;

  if (percent < AUTO_CLEAR_THRESHOLD) {
    setPercentScratched(Math.round(percent * 100));
  }

  if (percent >= AUTO_CLEAR_THRESHOLD && !revealedRef.current && !hasCompletedRef.current) {
    const session = currentSessionRef.current;
    if (!session) {
      console.warn("Session not loaded yet, waiting...");
      return;
    }

    hasCompletedRef.current = true;
    revealedRef.current = true;
    stopScratchSound();
    setRevealed(true);
    setSessionState("scratching");

    if (currentScratchPathRef.current.length > 0) {
      scratchPathsRef.current.push([...currentScratchPathRef.current]);
      currentScratchPathRef.current = [];
    }

    (async () => {
      try {
        setPercentScratched(100);
        await new Promise((resolve) => setTimeout(resolve, 150));
        await completeScratchSession();
        clearOverlayInstant();
        setSelectedPrize(session.prize);
      } catch (error) {
        console.error("Error completing scratch:", error);
        clearOverlayInstant();
        // Play is already consumed on first scratch. Keep the result visible
        // and retry the save — do not hand them a fresh card.
        try {
          await completeScratchSession();
          setSelectedPrize(session.prize);
        } catch (retryError) {
          console.error("Retry complete failed:", retryError);
          alert("Failed to save scratch result. Please stay on this page and try again.");
          hasCompletedRef.current = false;
          revealedRef.current = false;
          setRevealed(false);
          setSessionState("ready");
        }
      }
    })();
  }
}
checkPercentRef.current = checkPercentScratched;

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

  // Include in-progress rows. A started session is not "Not Scratched"
  // and was being left behind, which showed "1 card left" + an empty foil.
  const historyOpen = scratchHistory.filter(
    (s) => s.status === "Not Scratched" || s.status === "Scratching",
  ).length;
  const remainingCount = Math.max(scratchTicketCount ?? 0, historyOpen);

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
        count: remainingCount,
        competitionId: competitionId || id
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to reveal all scratch cards");
    }

    const results = await response.json();
    const scratches = Array.isArray(results?.scratches) ? results.scratches : [];

    // Check if there are any wins in the results
    let hasWins = false;
    let winCount = 0;
    let totalWon = 0;

    setScratchHistory((prev) => {
      const updated = [...prev];
      let openIndex = 0;

      scratches.forEach((scratch: any) => {
        while (
          openIndex < updated.length &&
          updated[openIndex].status !== "Not Scratched" &&
          updated[openIndex].status !== "Scratching"
        ) {
          openIndex++;
        }

        const prize = {
          ...(scratch.prize || { type: "none", value: "Lose" }),
          ticketNumber: scratch.prize?.ticketNumber || scratch.ticketNumber || null,
        };

        const isWin = prize?.type !== "none" &&
                     prize?.type !== "try_again" &&
                     prize?.type !== "lose" &&
                     prize?.value !== "Lose" &&
                     prize?.value !== "Try Again" &&
                     prize?.value !== "0" &&
                     prize?.value !== 0;

        if (isWin) {
          hasWins = true;
          winCount++;
          if (prize?.type === "cash" && prize?.value) {
            const value = parseFloat(prize.value);
            if (!isNaN(value)) totalWon += value;
          }
        }

        if (openIndex < updated.length) {
          updated[openIndex] = {
            status: "Scratched",
            prize,
          };
          openIndex++;
        } else {
          updated.push({ status: "Scratched", prize });
        }
      });

      const closed = updated.map((row) =>
        row.status === "Not Scratched" || row.status === "Scratching"
          ? { status: "Scratched", prize: { type: "none", value: "Lose" } }
          : row
      );
      if (orderId) saveScratchHistory(closed, orderId);
      return closed;
    });

    const leftover = Math.max(0, Number(results.cardsRemaining) || 0);
    onRemainingChange?.(leftover);
    onRefreshBalance?.();

    const batchRows: RevealBatchRow[] = scratches.map((scratch: any, i: number) => {
      const prize = {
        ...(scratch.prize || { type: "none", value: "Lose" }),
        ticketNumber: scratch.prize?.ticketNumber || scratch.ticketNumber || null,
      };
      const type = String(prize.type || "").toLowerCase();
      const isReplay = type === "try_again" || prize.value === "Try Again";
      const isWin = !isReplay && type !== "none" && type !== "lose" &&
        prize.value !== "Lose" && prize.value !== "0" && prize.value !== 0 && prize.value !== "-";
      return {
        id: i,
        number: i + 1,
        ticketNumber: prize.ticketNumber,
        ...prizeFromReward({
          isWin,
          rewardType: isReplay ? "try_again" : type,
          rewardValue: prize.value,
          prizeName: prize.value,
        }),
      };
    });
    setRevealBatchRows(batchRows);
    setRevealBatchCash(Number(results?.summary?.totalCash || totalWon || 0));
    setRevealBatchPoints(Number(results?.summary?.totalPoints || 0));

    if (hasWins) {
      triggerWinConfetti(winCount, totalWon);
    }

    setCurrentSession(null);
    isScratching.current = false;
    localStorage.removeItem(`scratchInProgress_${orderId}`);

    if (leftover <= 0) {
      hasCompletedRef.current = true;
      setRevealed(true);
      setAllScratchesCompleted(true);
      setSessionState("completed");
    } else {
      hasCompletedRef.current = false;
      setHideImagesAfterRevealAll(false);
      setRevealed(false);
      setSessionState("loading");
      setSessionKey((k) => k + 1);
    }

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
  const persist = () => {
    if (hasCommittedCurrentScratch.current) {
      void recordPlayIfNeeded().catch(() => {});
    }
  };

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    persist();
    if (hasCommittedCurrentScratch.current && !hasRecordedRef.current) {
      e.preventDefault();
      e.returnValue = "Saving your scratch result…";
      return e.returnValue;
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  window.addEventListener("pagehide", persist);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.removeEventListener("pagehide", persist);
  };
}, [orderId]);


useEffect(() => {
  if (currentSession) {
    hasCommittedCurrentScratch.current = false;
  }
}, [currentSession]);

  const cardsLeft = allScratchesCompleted
    ? 0
    : scratchTicketCount !== undefined
      ? scratchTicketCount
      : scratchHistory.filter((s) => s.status === "Not Scratched" || s.status === "Scratching").length;

  return (
  <div className="rr-scratch-panel relative overflow-hidden rounded-2xl border border-[#C8102E]/35 bg-[#050505] text-left shadow-[0_0_0_1px_rgba(241,212,122,0.08),0_0_70px_rgba(200,16,46,0.14),0_28px_80px_rgba(0,0,0,0.7)]">
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(200, 16, 46, 0.16) 0%, transparent 42%),
          radial-gradient(ellipse at 80% 100%, rgba(241, 212, 122, 0.08) 0%, transparent 40%),
          linear-gradient(180deg, #0A0A0D 0%, #050505 100%)
        `,
      }}
    />

    <div className="relative z-10 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        {scratchTicketCount !== undefined && (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F1D47A]/30 bg-[#F1D47A]/10 px-3 py-1.5">
            <span className="font-prize text-2xl leading-none text-[#F1D47A]">{cardsLeft}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">
              {cardsLeft === 1 ? "card left" : "cards left"}
            </span>
          </div>
        )}
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
          Match 3 flags
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#F1D47A]/20 bg-black/40 px-4 py-2.5">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Top prize</span>
        <div className="text-right">
          <p className="font-prize text-2xl leading-none text-[#F1D47A] sm:text-3xl">£2,000</p>
          <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/35">England</p>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[560px]">
        <div className="relative overflow-hidden rounded-2xl border border-[#F1D47A]/30 bg-[#08080b] shadow-[0_0_40px_rgba(200,16,46,0.12)]">
          <div className="pointer-events-none absolute inset-x-6 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[#F1D47A]/70 to-transparent" />
          <div className="relative min-h-[320px] sm:min-h-[400px]">
            
            {!allScratchesCompleted ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0D] p-3 sm:p-5">
                  {!hideImagesAfterRevealAll && (
                    <div className="mx-auto grid h-full w-full max-w-lg grid-cols-3 grid-rows-2 gap-2 p-2 sm:gap-3">
                      {images.slice(0, 6).map((img, i) => (
                        <div
                          key={i}
                          className="flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border border-[#F1D47A]/25 bg-[#111115] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-3"
                        >
                          <img
                            src={img.src}
                            alt={img.name}
                            className="h-[68%] w-full object-contain select-none"
                          />
                          <span className="mt-1 font-prize text-[10px] uppercase tracking-[0.12em] text-[#fff8ee] sm:text-xs">
                            {img.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SCRATCH LAYER (only shown when not all completed) */}
                <canvas
                  key={sessionKey}
                  ref={canvasRef}
                  className={`absolute inset-0 touch-none w-full h-full ${
                    resultModalOpen ? "pointer-events-none cursor-default" : "cursor-pointer"
                  }`}
                  onMouseDown={(e) => {
                    if ((scratchTicketCount ?? 0) <= 0 && !currentSession) {
                      setShowOutOfScratchesDialog(true);
                      return;
                    }
                    if (allScratchesUsed && !currentSession) {
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
                    if ((scratchTicketCount ?? 0) <= 0 && !currentSession) {
                      setShowOutOfScratchesDialog(true);
                      return;
                    }
                    if (allScratchesUsed && !currentSession) {
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
                className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center p-6"
                onClick={() => {
                  setShowOutOfScratchesDialog(true);
                }}
              >
                <div className="absolute inset-0 bg-[#050505]" />
                <div className="relative z-10 max-w-md px-4 text-center">
                  <h3 className="font-prize text-2xl text-[#F1D47A] sm:text-3xl">
                    All cards used
                  </h3>
                  <p className="mt-3 text-sm text-white/55 sm:text-base">
                    You have used every card in this purchase. Tap to buy more, or check results below.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!allScratchesCompleted && (
        <p className="mt-3 text-center text-sm text-white/50">
          Scratch the foil to reveal the flags
        </p>
      )}

      {!allScratchesCompleted && (
        <div className="mt-5 flex justify-center">
          <button
            onClick={() => setShowRevealAllDialog(true)}
            disabled={revealed || hasCompletedRef.current}
            data-testid="button-reveal-all"
            className="rr-cta w-full max-w-sm rounded-xl px-8 py-4 text-base disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
          >
            <span className="inline-flex items-center justify-center gap-2 font-prize tracking-wide">
              <Sparkles className="h-5 w-5" />
              Reveal all
            </span>
          </button>
        </div>
      )}

        <div className="relative mx-auto mt-6 w-full max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-[#F1D47A]/20 bg-black/40">
            <div className="border-b border-[#F1D47A]/15 px-4 py-3 sm:px-6">
              <h3 className="font-prize text-lg text-white sm:text-xl">
                Progress
              </h3>
            </div>

            {/* Table container with scroll - Mobile Optimized */}
            <div className="max-h-[60vh] overflow-y-auto px-3 py-3 custom-scrollbar sm:max-h-80 sm:px-5">
              <table className="w-full border-separate border-spacing-y-1 text-xs sm:border-spacing-y-2 sm:text-sm">
                <thead className="sticky top-0 z-10 bg-[#0A0A0D]">
                  <tr className="text-left text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                    <th className="px-2 py-2 sm:px-3">#</th>
                    <th className="px-2 py-2 sm:px-3">Status</th>
                    <th className="px-2 py-2 sm:px-3">Ticket</th>
                    <th className="px-2 py-2 text-right sm:px-3">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {scratchHistory.map((item, i) => (
                    <tr 
                      key={i} 
                      className="rounded-lg bg-white/[0.03] transition-colors hover:bg-white/[0.06]"
                      data-testid={`row-scratch-${i}`}
                    >
                      <td className="rounded-l-lg px-2 py-2.5 font-prize text-[#F1D47A] sm:px-3">
                        <span className="flex items-center gap-2">
                          <span className="hidden h-6 w-6 items-center justify-center rounded-full border border-[#F1D47A]/25 bg-[#F1D47A]/10 text-xs sm:flex">
                            {i + 1}
                          </span>
                          <span className="whitespace-nowrap text-xs sm:text-sm">
                            <span className="sm:hidden">#{i + 1}</span>
                            <span className="hidden sm:inline">Card {i + 1}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-1 sm:px-2 md:px-3 py-2 sm:py-3">
        <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
          item.status === "Scratched" 
            ? "border border-[#F1D47A]/30 bg-[#F1D47A]/10 text-[#F1D47A]" 
            : item.status === "Scratching"
            ? "border border-[#FF263D]/35 bg-[#C8102E]/15 text-[#FF263D] animate-pulse"
            : "border border-white/10 text-white/55"
        }`}>
          <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
            item.status === "Scratched" ? "bg-[#F1D47A]" 
            : item.status === "Scratching" ? "bg-[#FF263D] animate-pulse"
            : "bg-white/35"
          }`}></span>
          <span className="hidden sm:inline">{item.status}</span>
          <span className="sm:hidden">
            {item.status === "Scratched" ? "✓" 
             : item.status === "Scratching" ? "⟳" // ✅ Add this
             : "−"}
          </span>
        </span>
      </td>
      
      {(() => {
        const isLoss = item.prize.type === "none" ||
          item.prize.type === "try_again" ||
          item.prize.value === "Lose" ||
          item.prize.value === "Try Again";
        const ticketLabel =
          item.status === "Scratched" && !isLoss
            ? formatResultTicket(item.prize.ticketNumber)
            : null;
        const prizeLabel =
          item.status === "Not Scratched"
            ? "-"
            : item.status === "Scratching"
              ? "Scratching..."
              : isLoss
                ? "Lose"
                : item.prize.type === "cash"
                  ? `£${item.prize.value}`
                  : item.prize.type === "points"
                    ? `${item.prize.value} pts`
                    : item.prize.value;

        return (
          <>
            <td className="max-w-[7.5rem] px-1 py-2 sm:max-w-none sm:px-2 md:px-3 sm:py-3">
              <span
                className="block truncate text-[11px] font-bold tabular-nums text-white/50 sm:text-xs"
                title={ticketLabel || undefined}
              >
                {ticketLabel || "—"}
              </span>
            </td>
            <td className="rounded-r-lg px-1 py-2 text-right font-bold sm:px-2 md:px-3 sm:py-3">
              {item.status === "Not Scratched" ? (
                <span className="text-xs text-white/45 sm:text-sm">-</span>
              ) : item.status === "Scratching" ? (
                <span className="animate-pulse text-xs text-[#FF263D] sm:text-sm">
                  Scratching...
                </span>
              ) : isLoss ? (
                <span className="whitespace-nowrap text-xs text-white/40 sm:text-sm">
                  Lose
                </span>
              ) : (
                <span className="whitespace-nowrap font-prize text-xs text-[#F1D47A] sm:text-sm">
                  {prizeLabel}
                </span>
              )}
            </td>
          </>
        );
      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Reveal All Confirmation Dialog */}
      <AlertDialog open={showRevealAllDialog} onOpenChange={setShowRevealAllDialog}>
        <AlertDialogContent className="rr-scratch-panel mx-auto w-[90vw] max-w-sm border border-[#F1D47A]/25 bg-[#0A0A0D] text-white sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-prize text-2xl text-white">
              Reveal all cards?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This will instantly reveal every remaining card. Results will show in the progress table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevealAll}
              className="bg-[#C8102E] text-white hover:bg-[#FF263D]"
            >
              Reveal all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RevealAllBatchSummary
        open={showRevealAllResultDialog}
        rows={revealBatchRows}
        playNoun="card"
        cashWon={revealBatchCash}
        pointsWon={revealBatchPoints}
        onDismiss={() => setShowRevealAllResultDialog(false)}
      />

                  {/* OUT OF SCRATCHES DIALOG */}
<AlertDialog open={showOutOfScratchesDialog} onOpenChange={setShowOutOfScratchesDialog}>
  <AlertDialogContent className="rr-scratch-panel mx-auto w-[90vw] max-w-sm border border-[#F1D47A]/25 bg-[#0A0A0D] text-white sm:max-w-md">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-center font-prize text-2xl text-white">
        No cards left
      </AlertDialogTitle>
      <AlertDialogDescription className="text-center text-white/50">
        You have used every card in this purchase. Buy more to keep scratching.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter className="flex justify-center gap-2">
      <AlertDialogAction
        className="bg-[#C8102E] text-white hover:bg-[#FF263D]"
        onClick={() => {
         setTimeout(() => {
        if (orderId) {
          localStorage.removeItem(`scratchCardHistory_${orderId}`);
        }
        setLocation(`/competition/${competitionId}`);
      }, 2000);
        }}
      >
        Buy more
      </AlertDialogAction>

      <AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/10">
        Close
      </AlertDialogCancel>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

    </div>
  </div>
  );
}