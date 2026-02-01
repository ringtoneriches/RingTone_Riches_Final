// ================================================================================
// PLINKO GAME COMPONENT - Frontend Game UI
// ================================================================================
// This component renders the Plinko game board with physics-based ball animation.
// It handles single-drop gameplay, reveal-all functionality, and prize popups.
//
// FEATURES:
// - Canvas-based rendering with deterministic seeded physics
// - Server-side result determination (slotIndex from API)
// - Ball finds optimal drop position to naturally land on target slot
// - Premium prize popup with confetti effects
// - Sound effects for peg hits and wins
// - Muted gray popup for losses, vibrant popups for wins
//
// REQUIRED PROPS:
// - orderId: string - The order ID for this game session
// - competitionId: string - The Plinko competition ID
// - playsRemaining: number - Number of plays left in this order
// - onPlayComplete?: () => void - Callback after each play completes
// - onDropStart?: () => void - Callback when ball drop starts
// - prizes: Prize[] - Array of 8 prize slot configurations
//
// API ENDPOINTS USED:
// - POST /api/play-plinko - Single drop play
// - POST /api/reveal-all-plinko - Batch reveal all remaining plays
// ================================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Play, Zap, Trophy, X, RefreshCw, Volume2, VolumeX, Target, Gift, Crown, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import popSoundFile from "@assets/balloon-pop-sound_1766057573479.mp3";
import hitSoundFile from "@assets/hitsound_1769687506654.mp3";

interface Prize {
  slotIndex: number;
  prizeName: string;
  prizeValue: string;
  rewardType: string;
  color: string;
}

interface PlinkoGameProps {
  orderId: string;
  competitionId: string;
  playsRemaining: number;
  onPlayComplete?: () => void;
  onDropStart?: () => void;
  prizes: Prize[];
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isAnimating: boolean;
  landed: boolean;
  landedSlot: number | null;
  targetSlot: number;
  seed: number;
  currentSeed: number; // Progressive seed state for deterministic physics
  frame: number;
  hitPegId: number | null; // ID of peg hit this frame (for sound)
}

const ROWS = 12;
const PEG_RADIUS = 6;
const BALL_RADIUS = 10;
const GRAVITY = 0.18;
const BOUNCE = 0.6;
const FRICTION = 0.995;
const SLOT_HEIGHT = 50;

export function PlinkoGame({ orderId, competitionId, playsRemaining, onPlayComplete, onDropStart, prizes }: PlinkoGameProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [balls, setBalls] = useState<Ball[]>([]);
  const [isDropping, setIsDropping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showFreePlayNotification, setShowFreePlayNotification] = useState(false);
  // Ball drops automatically from pre-calculated position - no user control
  
  // Sound refs
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const hitSoundPoolRef = useRef<HTMLAudioElement[]>([]);
  const hitSoundIndexRef = useRef(0);
  const pegHitCountRef = useRef<Map<number, number>>(new Map()); // Track hits per peg ID
  
  // Initialize sounds - create a pool of hit sounds for overlapping playback
  useEffect(() => {
    winSoundRef.current = new Audio(popSoundFile);
    winSoundRef.current.volume = 0.7;
    
    // Create pool of 4 hit sounds for cleaner playback
    hitSoundPoolRef.current = [];
    for (let i = 0; i < 4; i++) {
      const audio = new Audio(hitSoundFile);
      audio.volume = 0.3;
      hitSoundPoolRef.current.push(audio);
    }
  }, []);
  
  // Play peg hit sound - limited to 2 times per individual peg
  const playHitSound = useCallback((pegId: number) => {
    if (isMuted) return;
    
    // Check how many times this specific peg has been hit
    const hitCount = pegHitCountRef.current.get(pegId) || 0;
    if (hitCount >= 2) return; // Max 2 sounds per peg
    
    // Increment hit count for this peg
    pegHitCountRef.current.set(pegId, hitCount + 1);
    
    const pool = hitSoundPoolRef.current;
    if (pool.length > 0) {
      const sound = pool[hitSoundIndexRef.current % pool.length];
      sound.currentTime = 0;
      sound.play().catch(() => {});
      hitSoundIndexRef.current++;
    }
  }, [isMuted]);
  
  // Reset peg hit counts when starting new drop
  const resetPegHitCounts = useCallback(() => {
    pegHitCountRef.current.clear();
  }, []);
  
  // Ball drops automatically from calculated optimal position - no user control needed
  
  // Trigger epic win confetti celebration
  const triggerWinConfetti = () => {
    const goldColors = ['#ffd700', '#ffed4a', '#fbbf24', '#f59e0b', '#d97706'];
    const sparkleColors = ['#ffffff', '#fef3c7', '#fde68a', '#fcd34d'];
    const celebrationColors = ['#ffd700', '#22c55e', '#10b981', '#a855f7', '#ec4899', '#3b82f6'];
    const end = Date.now() + 4000;
    
    // Initial big burst from center
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors: goldColors,
      startVelocity: 60,
      gravity: 0.8,
      scalar: 1.2,
    });
    
    // Sparkle burst
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 360,
        origin: { x: 0.5, y: 0.5 },
        colors: sparkleColors,
        startVelocity: 30,
        gravity: 0.5,
        scalar: 0.8,
        shapes: ['circle'],
        ticks: 200,
      });
    }, 200);
    
    // Continuous side cannons
    const frame = () => {
      // Left cannon
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 40,
        origin: { x: 0, y: 0.75 },
        colors: celebrationColors,
        startVelocity: 65,
        gravity: 1,
        scalar: 1.1,
      });
      // Right cannon
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 40,
        origin: { x: 1, y: 0.75 },
        colors: celebrationColors,
        startVelocity: 65,
        gravity: 1,
        scalar: 1.1,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
    
    // Delayed firework bursts
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.3, y: 0.3 },
        colors: goldColors,
        startVelocity: 45,
      });
    }, 600);
    
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.7, y: 0.3 },
        colors: goldColors,
        startVelocity: 45,
      });
    }, 900);
    
    // Final grand burst
    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 180,
        origin: { x: 0.5, y: 0.6 },
        colors: [...goldColors, ...celebrationColors],
        startVelocity: 55,
        gravity: 0.9,
        scalar: 1.3,
      });
    }, 1500);
  };
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [localPlaysRemaining, setLocalPlaysRemaining] = useState(playsRemaining);
  const ballIdRef = useRef(0);
  
  const boardWidth = 420;
  const boardHeight = 540;
  const numSlots = prizes.length || 10;
  const slotWidth = boardWidth / numSlots;
  
  const getPegPositions = useCallback(() => {
    const pegs: { x: number; y: number }[] = [];
    const startY = 45;
    const endY = boardHeight - SLOT_HEIGHT - 10;
    const rowHeight = (endY - startY) / ROWS;
    
    // Full peg coverage - pegs across entire board including edges
    // This prevents ball from dropping directly into any segment
    const pegsPerRow = numSlots + 1;
    const pegSpacing = boardWidth / pegsPerRow;
    
    for (let row = 0; row < ROWS; row++) {
      const isOddRow = row % 2 === 1;
      const offset = isOddRow ? pegSpacing / 2 : 0;
      
      for (let col = 0; col < pegsPerRow; col++) {
        // Skip edge pegs on odd rows to keep ball in bounds
        if (isOddRow && (col === 0 || col === pegsPerRow - 1)) continue;
        
        const pegX = offset + col * pegSpacing;
        
        // Keep pegs within board bounds
        if (pegX < PEG_RADIUS + 5 || pegX > boardWidth - PEG_RADIUS - 5) continue;
        
        pegs.push({
          x: pegX,
          y: startY + row * rowHeight,
        });
      }
    }
    return pegs;
  }, [numSlots, slotWidth]);

  const drawBoard = useCallback((ctx: CanvasRenderingContext2D, currentBalls: Ball[]) => {
    ctx.clearRect(0, 0, boardWidth, boardHeight);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, boardHeight);
    gradient.addColorStop(0, "#0a0a1f");
    gradient.addColorStop(0.3, "#12122e");
    gradient.addColorStop(0.7, "#1a1a45");
    gradient.addColorStop(1, "#0a0a1f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, boardWidth, boardHeight);
    
    ctx.strokeStyle = "rgba(147, 51, 234, 0.4)";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, boardWidth - 4, boardHeight - 4);
    
    // No waiting ball shown - ball only appears when DROP is clicked
    
    const pegs = getPegPositions();
    pegs.forEach((peg) => {
      const glowGradient = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, PEG_RADIUS * 2.5);
      glowGradient.addColorStop(0, "rgba(168, 85, 247, 0.7)");
      glowGradient.addColorStop(0.5, "rgba(168, 85, 247, 0.3)");
      glowGradient.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS * 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      const pegGradient = ctx.createRadialGradient(peg.x - 2, peg.y - 2, 0, peg.x, peg.y, PEG_RADIUS);
      pegGradient.addColorStop(0, "#c084fc");
      pegGradient.addColorStop(0.4, "#a855f7");
      pegGradient.addColorStop(0.8, "#7c3aed");
      pegGradient.addColorStop(1, "#5b21b6");
      ctx.fillStyle = pegGradient;
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(peg.x - 2, peg.y - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    const slotY = boardHeight - SLOT_HEIGHT;
    prizes.forEach((prize, i) => {
      const slotX = i * slotWidth;
      
      const slotGradient = ctx.createLinearGradient(slotX, slotY, slotX, boardHeight);
      slotGradient.addColorStop(0, prize.color + "40");
      slotGradient.addColorStop(0.5, prize.color + "60");
      slotGradient.addColorStop(1, prize.color + "80");
      ctx.fillStyle = slotGradient;
      ctx.fillRect(slotX + 1, slotY, slotWidth - 2, SLOT_HEIGHT);
      
      ctx.strokeStyle = prize.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(slotX + 1, slotY, slotWidth - 2, SLOT_HEIGHT);
      
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      let displayName = prize.prizeName;
      if (displayName.includes("JACKPOT")) {
        displayName = "£1K";
      } else if (displayName.includes("Points")) {
        displayName = displayName.replace(" Points", "").replace("Points", "") + "P";
      } else if (displayName === "NO WIN") {
        displayName = "X";
      } else if (displayName === "FREE PLAY") {
        displayName = "FREE";
      }
      
      const fontSize = displayName.length > 4 ? 8 : displayName.length > 3 ? 9 : 11;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      
      ctx.fillText(displayName, slotX + slotWidth / 2, slotY + 20);
      ctx.restore();
    });
    
    // Draw all balls including landed ones (ball stays visible in segment)
    currentBalls.forEach(ball => {
      // Shadow under ball for 3D depth
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      // Realistic ball body - metallic gold sphere
      const ballGradient = ctx.createRadialGradient(
        ball.x - BALL_RADIUS * 0.35, 
        ball.y - BALL_RADIUS * 0.35, 
        BALL_RADIUS * 0.1,
        ball.x, 
        ball.y, 
        BALL_RADIUS
      );
      ballGradient.addColorStop(0, "#fff7cc");    // Bright highlight
      ballGradient.addColorStop(0.15, "#ffe066"); // Light gold
      ballGradient.addColorStop(0.4, "#ffc107");  // Golden yellow
      ballGradient.addColorStop(0.7, "#e6a800");  // Deep gold
      ballGradient.addColorStop(0.9, "#b38600");  // Bronze edge
      ballGradient.addColorStop(1, "#8B6914");    // Dark bronze shadow
      
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Subtle metallic rim
      ctx.strokeStyle = "rgba(139, 105, 20, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      
      // Main specular highlight (top-left)
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(ball.x - BALL_RADIUS * 0.4, ball.y - BALL_RADIUS * 0.4, BALL_RADIUS * 0.25, 0, Math.PI * 2);
      ctx.fill();
      
      // Secondary small highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(ball.x - BALL_RADIUS * 0.15, ball.y - BALL_RADIUS * 0.55, BALL_RADIUS * 0.1, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [getPegPositions, prizes, slotWidth]);

  // DETERMINISTIC PHYSICS - Uses seeded random for perfect accuracy
  // Ball lands exactly where pre-simulation predicted
  const animateBall = useCallback((ball: Ball, pegs: { x: number; y: number }[]): Ball => {
    if (ball.landed) return ball;
    
    let newBall = { ...ball, hitPegId: null as number | null };
    newBall.frame = (newBall.frame || 0) + 1;
    
    // Seeded random - MUST match simulateDrop exactly for 100% accuracy
    const seededRandom = () => {
      newBall.currentSeed = (newBall.currentSeed * 1103515245 + 12345) & 0x7fffffff;
      return newBall.currentSeed / 0x7fffffff;
    };
    
    // Real physics constants - MUST match simulateDrop
    const gravity = 0.18;
    const friction = 0.99;
    const bounce = 0.75;
    const maxVy = 5;
    
    // Apply gravity
    newBall.vy = (newBall.vy || 0) + gravity;
    
    // Apply air friction
    newBall.vx = (newBall.vx || 0) * friction;
    
    // Cap vertical speed
    newBall.vy = Math.min(maxVy, newBall.vy);
    
    // Apply velocity
    newBall.x += newBall.vx;
    newBall.y += newBall.vy;
    
    // Keep ball on screen
    if (newBall.y < BALL_RADIUS) {
      newBall.y = BALL_RADIUS;
      newBall.vy = Math.abs(newBall.vy) * 0.3;
    }
    
    // Peg collisions - realistic bouncing with seeded randomness
    pegs.forEach((peg, pegIdx) => {
      const dx = newBall.x - peg.x;
      const dy = newBall.y - peg.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = PEG_RADIUS + BALL_RADIUS;
      
      if (dist < minDist && dist > 0) {
        // Normal vector from peg to ball
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Push ball out of peg
        const overlap = minDist - dist;
        newBall.x += nx * overlap * 1.1;
        newBall.y += ny * overlap * 1.1;
        
        // Reflect velocity off the peg surface (real physics)
        const dot = newBall.vx * nx + newBall.vy * ny;
        if (dot < 0) {
          newBall.vx -= 2 * dot * nx * bounce;
          newBall.vy -= 2 * dot * ny * bounce;
        }
        
        // Seeded random deflection for deterministic unpredictability
        newBall.vx += (seededRandom() - 0.5) * 0.8;
        
        // Trigger hit sound
        newBall.hitPegId = pegIdx;
      }
    });
    
    // Wall collisions - soft bounce
    if (newBall.x < BALL_RADIUS + 5) {
      newBall.x = BALL_RADIUS + 5;
      newBall.vx = Math.abs(newBall.vx) * 0.4;
    }
    if (newBall.x > boardWidth - BALL_RADIUS - 5) {
      newBall.x = boardWidth - BALL_RADIUS - 5;
      newBall.vx = -Math.abs(newBall.vx) * 0.4;
    }
    
    // Check if ball reached slot area - 100% REAL PHYSICS, no correction
    const slotY = boardHeight - SLOT_HEIGHT;
    if (newBall.y >= slotY) {
      const slotBottom = boardHeight - BALL_RADIUS - 4;
      
      // Natural slowdown from friction in slot area
      newBall.vx *= 0.92;
      
      // Floor bounce - real physics
      if (newBall.y >= slotBottom) {
        newBall.y = slotBottom;
        newBall.vy = -Math.abs(newBall.vy) * 0.25;
        
        // Only mark as landed when ball is FULLY SETTLED (real position)
        if (Math.abs(newBall.vy) < 0.3 && Math.abs(newBall.vx) < 0.3) {
          // Determine slot based on actual physics position
          const actualSlot = Math.floor(newBall.x / slotWidth);
          const clampedSlot = Math.max(0, Math.min(numSlots - 1, actualSlot));
          const slotCenter = clampedSlot * slotWidth + slotWidth / 2;
          
          newBall.x = slotCenter;
          newBall.landed = true;
          newBall.landedSlot = clampedSlot; // Actual physics landing
          newBall.isAnimating = false;
        }
      }
    }
    
    return newBall;
  }, [slotWidth, numSlots]);
  
  // Store the seed that will produce matching physics
  const foundSeedRef = useRef<number>(Date.now());
  
  // PRE-SIMULATION: Find starting position that naturally lands in target slot
  // Uses exact same physics as real animation for 100% accuracy
  const findDropPosition = useCallback((targetSlot: number, pegs: { x: number; y: number }[]): { x: number; seed: number } => {
    const startY = 25;
    
    // Simulate ball physics - EXACT same as animateBall for consistency
    const simulateDrop = (startX: number, seed: number): number => {
      let x = startX;
      let y = startY;
      let vx = 0;
      let vy = 0;
      let currentSeed = seed;
      
      // Same seeded random as real physics
      const seededRandom = () => {
        currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
        return (currentSeed / 0x7fffffff);
      };
      
      const gravity = 0.18;
      const friction = 0.99;
      const bounce = 0.75;
      const maxVy = 5;
      const slotY = boardHeight - SLOT_HEIGHT;
      const slotBottom = boardHeight - BALL_RADIUS - 4;
      
      // Run full simulation until ball settles
      for (let frame = 0; frame < 3000; frame++) {
        vy += gravity;
        vx *= friction;
        vy = Math.min(maxVy, vy);
        
        x += vx;
        y += vy;
        
        // Wall collisions
        if (x < BALL_RADIUS + 5) {
          x = BALL_RADIUS + 5;
          vx = Math.abs(vx) * 0.4;
        }
        if (x > boardWidth - BALL_RADIUS - 5) {
          x = boardWidth - BALL_RADIUS - 5;
          vx = -Math.abs(vx) * 0.4;
        }
        
        // Peg collisions
        for (const peg of pegs) {
          const dx = x - peg.x;
          const dy = y - peg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = PEG_RADIUS + BALL_RADIUS;
          
          if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            x += nx * overlap * 1.1;
            y += ny * overlap * 1.1;
            
            const dot = vx * nx + vy * ny;
            if (dot < 0) {
              vx -= 2 * dot * nx * bounce;
              vy -= 2 * dot * ny * bounce;
            }
            vx += (seededRandom() - 0.5) * 0.8;
          }
        }
        
        // Slot area physics - same as real
        if (y >= slotY) {
          vx *= 0.92;
          if (y >= slotBottom) {
            y = slotBottom;
            vy = -Math.abs(vy) * 0.25;
            
            // Ball settled
            if (Math.abs(vy) < 0.3 && Math.abs(vx) < 0.3) {
              const actualSlot = Math.floor(x / slotWidth);
              return Math.max(0, Math.min(numSlots - 1, actualSlot));
            }
          }
        }
      }
      
      // Fallback
      return Math.floor(x / slotWidth);
    };
    
    // Search entire board for a position that lands in target slot
    // Fine-grained search for accuracy
    const step = 5;
    const minX = 40;
    const maxX = boardWidth - 40;
    
    // Try multiple seeds for each position
    for (let seedOffset = 0; seedOffset < 20; seedOffset++) {
      const baseSeed = Date.now() + seedOffset * 10000;
      
      // Search from center outward
      for (let offset = 0; offset <= (maxX - minX) / 2; offset += step) {
        const centerX = boardWidth / 2;
        const positions = offset === 0 ? [centerX] : [centerX + offset, centerX - offset];
        
        for (const testX of positions) {
          if (testX < minX || testX > maxX) continue;
          
          if (simulateDrop(testX, baseSeed) === targetSlot) {
            return { x: testX, seed: baseSeed };
          }
        }
      }
    }
    
    // Fallback: target slot center with current time seed
    const fallbackX = targetSlot * slotWidth + slotWidth / 2;
    return { x: fallbackX, seed: Date.now() };
  }, [slotWidth, numSlots]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const pegs = getPegPositions();
    
    const animate = () => {
      setBalls(prevBalls => {
        const newBalls = prevBalls.map(ball => animateBall(ball, pegs));
        
        // Check if any ball hit a peg this frame - play sound with peg ID tracking
        newBalls.forEach(ball => {
          if (ball.hitPegId !== null) {
            playHitSound(ball.hitPegId);
          }
        });
        
        drawBoard(ctx, newBalls);
        return newBalls;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getPegPositions, animateBall, drawBoard, playHitSound]);

  useEffect(() => {
    setLocalPlaysRemaining(playsRemaining);
  }, [playsRemaining]);

  const pendingResultRef = useRef<any>(null);
  const pendingBallIdRef = useRef<number | null>(null);
  const resultShownRef = useRef<boolean>(false);

  useEffect(() => {
    const landedBall = balls.find(b => b.landed && b.id === pendingBallIdRef.current);
    if (landedBall && pendingResultRef.current && !resultShownRef.current) {
      resultShownRef.current = true;
      
      // Use ACTUAL landing position to determine prize (100% physics-based)
      const actualSlot = landedBall.landedSlot;
      const actualPrize = prizes[actualSlot!];
      
      // Build result from actual landing position
      const serverResult = pendingResultRef.current;
      const result = {
        ...serverResult,
        slotIndex: actualSlot,
        prizeName: actualPrize?.prizeName || "NO WIN",
        prizeValue: actualPrize?.prizeValue || "0",
        rewardType: actualPrize?.rewardType || "none",
        isWin: actualPrize?.rewardType === "cash" || actualPrize?.rewardType === "points",
        isFreePlay: actualPrize?.prizeName === "FREE PLAY" || actualPrize?.rewardType === "free_play",
      };
      
      // NOW set currentResult - based on actual physics landing
      setCurrentResult(result);
      
      setTimeout(() => {
        // ONLY confetti AND sound for actual prize wins (cash or points)
        const isActualWin = result.isWin && result.rewardType && result.rewardType !== "none" && result.rewardType !== "free_play";
        
        if (isActualWin) {
          triggerWinConfetti();
          if (!isMuted && winSoundRef.current) {
            winSoundRef.current.currentTime = 0;
            winSoundRef.current.play().catch(() => {});
          }
        }
        
        setShowResultPopup(true);
        setLocalPlaysRemaining(serverResult.playsRemaining);
        setIsDropping(false);
        
        queryClient.invalidateQueries({ queryKey: ["/api/me"] });
        onPlayComplete?.();
      }, 500);
    }
  }, [balls, onPlayComplete, isMuted, prizes]);

  const dropBall = async () => {
    if (isDropping || localPlaysRemaining <= 0) return;
    
    setBalls([]);
    setShowResultPopup(false);
    setCurrentResult(null);
    setIsDropping(true);
    resultShownRef.current = false;
    pendingResultRef.current = null;
    pendingBallIdRef.current = null;
    resetPegHitCounts();
    onDropStart?.();
    
    try {
      const response = await apiRequest("/api/play-plinko", "POST", {
        orderId,
        competitionId,
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Failed to play");
      }
  
      // 🎯 ADD THIS CHECK FOR FREE REPLAY
      if (result.freeReplay) {
        // Show free play notification
        toast({
          title: "🎉 FREE REPLAY!",
          description: "You got a free replay! Your play count wasn't deducted.",
          variant: "default",
          duration: 3000,
        });
      }
      
      // // Debug logging
      // console.log("📊 DEBUG - Server response:", {
      //   freeReplay: result.freeReplay,
      //   playsRemaining: result.playsRemaining,
      //   localPlaysRemaining: localPlaysRemaining,
      //   playCountSame: result.playsRemaining === localPlaysRemaining,
      //   prizeName: result.prizeName,
      //   isWin: result.isWin
      // });
      
      if (result.freeReplay) {
        console.log("🎉 FREE REPLAY DETECTED!");
      }
      
      // DON'T set currentResult here - wait until ball lands
      // This prevents history from showing before ball reaches the slot
      pendingResultRef.current = result;
      
      // Get target slot from server result (probability-controlled)
      const targetSlot = result.slotIndex;
      
      const newBallId = ballIdRef.current++;
      pendingBallIdRef.current = newBallId;
      
      // PRE-SIMULATION: Find drop position that naturally lands in target slot
      // This keeps 100% real physics while controlling outcome
      const pegs = getPegPositions();
      const dropResult = findDropPosition(targetSlot, pegs);
      
      // Store seed for deterministic replay
      foundSeedRef.current = dropResult.seed;
      
      // Start ball at the calculated position with matching seed
      // Physics will naturally take it to target (100% real, no correction)
      const newBall: Ball = {
        id: newBallId,
        x: dropResult.x,
        y: 25,
        vx: 0,
        vy: 0,
        isAnimating: true,
        landed: false,
        landedSlot: null,
        targetSlot: targetSlot,
        seed: dropResult.seed,
        currentSeed: dropResult.seed,
        frame: 0,
        hitPegId: null,
      };
      
      setBalls([newBall]);
      
    } catch (error) {  // ← The error was here - missing closing brace before this line
      console.error("Error playing Plinko:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to play. Please try again.",
        variant: "destructive",
      });
      setIsDropping(false);
    }
  };

  const closeResultPopup = () => {
    setShowResultPopup(false);
    pendingResultRef.current = null;
    pendingBallIdRef.current = null;
    resultShownRef.current = false;
  };

  const getResultType = () => {
    if (!currentResult) return "lose";
    
    // Check for free replay first - IMPORTANT!
    if (currentResult.freeReplay === true) {
      return "freeplay";
    }
    
    // Check for free play from prize segment
    if (currentResult.segmentFreePlay === true || 
        currentResult.rewardType === "free_play" ||
        currentResult.prizeName?.includes("FREE PLAY")) {
      return "freeplay";
    }
    
    if (currentResult.isWin) return "win";
    return "lose";
  };

  const resultType = getResultType();

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-amber-500/30 blur-2xl" />
        
        <div className="relative bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-2xl p-4 border-2 border-purple-500/50 shadow-[0_0_60px_rgba(147,51,234,0.3)]">
          <div className="text-center mb-4">
            <h3 className="text-xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              RINGTONE PLINKO
            </h3>
            <p className="text-purple-300/80 text-sm">Drop the ball & win big!</p>
          </div>
          {showFreePlayNotification && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/60" />
    <div className="relative bg-gradient-to-r from-cyan-500 to-purple-500 p-8 rounded-2xl animate-bounce">
      <div className="text-4xl font-bold text-white text-center">
        🎉 FREE PLAY! 🎉
      </div>
      <div className="text-white text-center mt-2">
        Your play count wasn't deducted!
      </div>
    </div>
  </div>
)}
          <canvas
            ref={canvasRef}
            width={boardWidth}
            height={boardHeight}
            className="rounded-xl"
            style={{ maxWidth: "100%", height: "auto" }}
          />
          
          <div className="flex justify-between items-center mt-4 px-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <div className="text-xs text-purple-300/70">Plays Left</div>
                  <div className="text-xl font-black text-amber-400">{localPlaysRemaining}</div>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white/70 hover:text-white hover:bg-white/10 border border-white/20 rounded-full"
                data-testid="button-mute"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </div>
            
            <div className="relative">
              {/* Subtle glow background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 blur-md opacity-50" />
              
              {/* Main button */}
              <Button
                onClick={dropBall}
                disabled={isDropping || localPlaysRemaining <= 0}
                className="relative h-12 px-8 text-lg font-black rounded-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white border-2 border-cyan-300/40 shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group transition-all duration-300 hover:scale-105 active:scale-95"
                data-testid="button-drop-ball"
              >
                {/* Scanning line effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80" style={{ animation: 'scan-line 2s linear infinite' }} />
                </div>
                
                {/* Shimmer sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                
                {/* Inner glow border */}
                <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                
                {/* Button content */}
                <div className="relative flex items-center gap-2">
                  {isDropping ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="tracking-wider">DROPPING...</span>
                    </>
                  ) : localPlaysRemaining <= 0 ? (
                    <span className="tracking-wider">NO PLAYS LEFT</span>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span className="tracking-wider">DROP BALL</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {showResultPopup && currentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          {/* High Quality Game Result Popup - Entrance animation then static */}
          <div className="relative max-w-xs sm:max-w-sm w-full mx-3 sm:mx-4" style={{ animation: 'popup-entrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
            
            
            {/* Static glow effect - premium quality */}
            <div className={`absolute -inset-4 sm:-inset-6 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl ${
              resultType === "win" 
                ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 opacity-40"
                : resultType === "freeplay"
                ? "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 opacity-40"
                : "bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 opacity-20"
            }`} />
            
            {/* Main popup container - premium quality with solid background */}
            <div className={`relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-[3px] ${
              resultType === "win" 
                ? "bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-amber-400/70"
                : resultType === "freeplay"
                ? "bg-gradient-to-b from-cyan-950 via-slate-900 to-slate-950 border-cyan-400/70"
                : "bg-gradient-to-b from-gray-800 via-gray-900 to-slate-950 border-gray-500/40"
            }`}>
              
              {/* One-time shine sweep effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -inset-full w-[300%] h-[300%] bg-gradient-to-r from-transparent via-white/15 to-transparent rotate-12" style={{ animation: 'shine-sweep 0.8s ease-out forwards', animationDelay: '0.3s' }} />
              </div>
              
              {/* Top decorative banner - premium quality */}
              <div className={`relative h-24 sm:h-28 flex items-center justify-center overflow-hidden ${
                resultType === "win"
                  ? "bg-gradient-to-r from-amber-600/40 via-yellow-500/50 to-amber-600/40"
                  : resultType === "freeplay"
                  ? "bg-gradient-to-r from-cyan-600/40 via-blue-500/50 to-cyan-600/40"
                  : "bg-gradient-to-r from-gray-700/40 via-gray-600/30 to-gray-700/40"
              }`}>
                {/* Static sparkle decorations - only for wins and freeplay */}
                {resultType !== "lose" && (
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${resultType === "win" ? "bg-amber-300" : "bg-cyan-300"}`}
                        style={{
                          left: `${10 + i * 11}%`,
                          top: `${20 + (i % 4) * 18}%`,
                          opacity: 0.5 + (i % 3) * 0.15
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Main icon with entrance animation - larger for premium look */}
                <div className="relative z-10" style={{ animation: 'icon-entrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards', animationDelay: '0.15s', opacity: 0, transform: 'scale(0)' }}>
                  {resultType === "win" ? (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-amber-400 blur-xl opacity-50" />
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl border-3 sm:border-4 border-amber-100/60">
                        <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-900 drop-shadow-lg" />
                      </div>
                    </div>
                  ) : resultType === "freeplay" ? (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-cyan-400 blur-xl opacity-50" />
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-300 via-blue-500 to-purple-500 flex items-center justify-center shadow-2xl border-3 sm:border-4 border-cyan-200/60">
                        <Gift className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gray-500 blur-xl opacity-30" />
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 flex items-center justify-center shadow-2xl border-3 sm:border-4 border-gray-400/40">
                        <X className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 drop-shadow-lg" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative z-10 p-5 sm:p-7 pt-4 sm:pt-5" style={{ animation: 'content-fade-in 0.5s ease-out forwards', animationDelay: '0.4s', opacity: 0 }}>
                {/* Close button */}
                <button 
                  onClick={closeResultPopup}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                  data-testid="button-close-popup"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                </button>
                
                {resultType === "win" ? (
                  <div className="flex flex-col items-center text-center">
                    {/* Winner header - dynamic based on prize value */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                      <span className="text-sm sm:text-base font-black tracking-[0.15em] sm:tracking-[0.2em] text-amber-400 uppercase">
                        {currentResult.rewardType === "cash" && parseFloat(currentResult.prizeValue) >= 1000
                          ? "Jackpot Winner"
                          : currentResult.rewardType === "cash" && parseFloat(currentResult.prizeValue) >= 100
                          ? "Big Winner"
                          : currentResult.rewardType === "cash" && parseFloat(currentResult.prizeValue) >= 10
                          ? "Winner"
                          : currentResult.rewardType === "points" && parseFloat(currentResult.prizeValue) >= 1000
                          ? "Mega Points"
                          : currentResult.rewardType === "points" && parseFloat(currentResult.prizeValue) >= 100
                          ? "Points Won"
                          : "You Won"}
                      </span>
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                    </div>
                    
                    {/* Prize amount with premium styling - amber/gold theme */}
                    <div className="relative my-4 sm:my-5">
                      <div className="absolute inset-0 blur-2xl sm:blur-3xl bg-amber-400/40 rounded-full" />
                      <div className="relative text-5xl sm:text-6xl lg:text-7xl font-black" style={{
                        background: 'linear-gradient(180deg, #fffbeb 0%, #fde68a 20%, #fbbf24 50%, #f59e0b 75%, #d97706 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 4px 12px rgba(251,191,36,0.4))',
                      }}>
                        {currentResult.rewardType === "cash" 
                          ? `£${currentResult.prizeValue}` 
                          : `${currentResult.prizeValue}`}
                      </div>
                      {currentResult.rewardType !== "cash" && (
                        <div className="text-lg sm:text-xl font-bold text-amber-400 mt-1">POINTS WON</div>
                      )}
                    </div>
                    
                    {/* Success badge - static, high quality */}
                    <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-500/25 rounded-full border-2 border-emerald-400/50">
                      <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                      <span className="text-emerald-300 text-sm sm:text-base font-bold">Added to your account</span>
                    </div>
                  </div>
                ) : resultType === "freeplay" ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="text-sm sm:text-base font-black tracking-[0.15em] sm:tracking-[0.2em] text-cyan-400 uppercase mb-2 sm:mb-3">Bonus Unlocked</div>
                    
                    <div className="relative my-4 sm:my-5">
                      <div className="absolute inset-0 blur-2xl bg-cyan-400/30 rounded-full" />
                      <div className="relative text-5xl sm:text-6xl font-black" style={{
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #67e8f9 30%, #22d3ee 60%, #0891b2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 4px 12px rgba(34,211,238,0.4))',
                      }}>
                        +1 FREE
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-cyan-300 mt-1">PLAY</div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-cyan-500/25 rounded-full border-2 border-cyan-400/50">
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                      <span className="text-cyan-300 text-sm sm:text-base font-bold">Drop again for free!</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="text-sm sm:text-base font-black tracking-[0.15em] sm:tracking-[0.2em] text-red-400 uppercase mb-2 sm:mb-3">Unlucky!</div>
                    
                    <div className="relative my-4 sm:my-5">
                      <div className="absolute inset-0 blur-2xl bg-red-500/25 rounded-full" />
                      <div className="relative text-4xl sm:text-5xl font-black" style={{
                        background: 'linear-gradient(180deg, #fecaca 0%, #f87171 40%, #ef4444 70%, #dc2626 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 4px 12px rgba(239,68,68,0.3))',
                      }}>
                        NO WIN
                      </div>
                      <div className="text-base sm:text-lg text-gray-400 mt-2 sm:mt-3">You won nothing this time</div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-500/20 rounded-xl border-2 border-gray-500/40">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <span className="text-gray-400 text-sm sm:text-base font-medium">Try again for a chance to win!</span>
                    </div>
                  </div>
                )}
                
                {/* Action buttons - responsive sizing */}
                <div className="flex flex-col gap-2 sm:gap-3 mt-4 sm:mt-6">
                  {localPlaysRemaining > 0 && (
                    <Button
                      onClick={() => {
                        closeResultPopup();
                        setTimeout(() => dropBall(), 100);
                      }}
                      className={`w-full h-12 sm:h-14 text-base sm:text-lg font-black rounded-xl sm:rounded-2xl border-0 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        resultType === "win"
                          ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 text-amber-900 shadow-amber-500/40"
                          : resultType === "freeplay"
                          ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 hover:from-cyan-400 hover:via-blue-400 hover:to-cyan-400 text-white shadow-cyan-500/40"
                          : "bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 text-white shadow-gray-500/30"
                      }`}
                      data-testid="button-play-again"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      DROP AGAIN
                    </Button>
                  )}
                  <Button
                    onClick={closeResultPopup}
                    variant="ghost"
                    className="w-full h-9 sm:h-10 text-white/50 hover:text-white hover:bg-white/10 rounded-lg sm:rounded-xl text-sm"
                    data-testid="button-close-result"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(12deg); }
          100% { transform: translateX(100%) rotate(12deg); }
        }
        
        @keyframes mega-shimmer {
          0% { transform: translateX(-100%) rotate(12deg); }
          50%, 100% { transform: translateX(100%) rotate(12deg); }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes pulse-ray {
          0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
          50% { opacity: 0.7; transform: scaleY(1.1); }
        }
        
        @keyframes sparkle-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-8px) scale(1.3); opacity: 0.9; }
        }
        
        @keyframes icon-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        
        @keyframes winner-bounce {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.15); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes crown-shine {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        
        @keyframes gift-wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        
        @keyframes sparkle-rotate {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.2); }
          50% { transform: rotate(180deg) scale(1); }
          75% { transform: rotate(270deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes prize-pop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes bonus-slide {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes ring-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        @keyframes glow-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1600%); }
        }
        
        @keyframes zap-flash {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        /* Premium popup entrance animations */
        @keyframes popup-entrance {
          0% { 
            transform: scale(0.3) translateY(30px); 
            opacity: 0; 
          }
          50% { 
            transform: scale(1.05) translateY(-5px); 
            opacity: 1; 
          }
          70% { 
            transform: scale(0.98) translateY(2px); 
          }
          100% { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
          }
        }
        
        @keyframes rays-entrance {
          0% { 
            opacity: 0; 
            transform: scale(0.5); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        @keyframes shine-sweep {
          0% { 
            transform: translateX(-100%) rotate(12deg); 
          }
          100% { 
            transform: translateX(100%) rotate(12deg); 
          }
        }
        
        @keyframes icon-entrance {
          0% { 
            opacity: 0; 
            transform: scale(0) rotate(-15deg); 
          }
          60% { 
            transform: scale(1.15) rotate(5deg); 
          }
          80% { 
            transform: scale(0.95) rotate(-2deg); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1) rotate(0deg); 
          }
        }
        
        @keyframes content-fade-in {
          0% { 
            opacity: 0; 
            transform: translateY(15px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
}

export default PlinkoGame;