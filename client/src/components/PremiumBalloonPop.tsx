import React, { useState, useEffect, useRef } from 'react';
import { motion, animate, useMotionValue, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import popSoundFile from "@assets/balloon-pop-sound_1766057573479.mp3";
import logoUrl from "../../../attached_assets/Logo_1758885093860.gif";

interface PremiumBalloonPopProps {
  onComplete: () => void;
  isOpen: boolean;
  logoUrl?: string;
}

const PremiumBalloonPop: React.FC<PremiumBalloonPopProps> = ({ onComplete, isOpen }) => {
  const [balloonPopped, setBalloonPopped] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLogo, setShowLogo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    popSoundRef.current = new Audio(popSoundFile);
    popSoundRef.current.volume = 0.6;
  }, []);

  const balloonY = useMotionValue(0);
  const balloonRotate = useMotionValue(0);
  const balloonScale = useMotionValue(1);

  useEffect(() => {
    if (!isOpen || balloonPopped) return;

    const floatAnim = animate(balloonY, [-15, 15, -15], {
      duration: 5,
      ease: "easeInOut",
      repeat: Infinity,
    });

    const rotateAnim = animate(balloonRotate, [-3, 3, -3], {
      duration: 6,
      ease: "easeInOut",
      repeat: Infinity,
    });

    return () => {
      floatAnim.stop();
      rotateAnim.stop();
    };
  }, [isOpen, balloonPopped]);

  useEffect(() => {
    if (!isOpen || balloonPopped) return;
    const handleMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [isOpen, balloonPopped]);

  const firePremiumConfetti = (x: number, y: number) => {
    const count = 300;
    const defaults = {
      origin: { x, y },
      zIndex: 10000,
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A37CFF', '#FF99C8'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 40, startVelocity: 70, scalar: 1.2 });
    fire(0.2, { spread: 80, scalar: 1 });
    fire(0.35, { spread: 120, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 150, startVelocity: 35, decay: 0.92, scalar: 1.8 });
    fire(0.1, { spread: 150, startVelocity: 55, scalar: 1.3 });
  };

  const handlePop = async (e: React.MouseEvent) => {
    if (balloonPopped) return;
    setBalloonPopped(true);

    if (popSoundRef.current) {
      popSoundRef.current.currentTime = 0;
      popSoundRef.current.play().catch(() => {});
    }

    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    firePremiumConfetti(x, y);

    await animate(balloonScale, [1, 1.4, 0], { 
      duration: 0.25, 
      times: [0, 0.15, 1],
      ease: "circOut" 
    });

    setShowLogo(true);
    
    try {
      await fetch("/api/user/welcome-seen", { method: "POST" });
    } catch (err) {
      console.error("Failed to mark welcome seen", err);
    }

    setTimeout(onComplete, 4500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/95 backdrop-blur-2xl cursor-none"
      >
        {/* Realistic Needle Cursor */}
        {!balloonPopped && (
          <motion.div
             className="hidden md:block fixed pointer-events-none z-[10001]"
            style={{
              left: 0,
              top: 0,
              x: mousePos.x,
              y: mousePos.y,
            }}
            transition={{ type: "spring", stiffness: 1000, damping: 50, mass: 0.1 }}
          >
            <div className="relative" style={{ transform: "translate(-50%, -50%) rotate(-45deg)" }}>
              {/* Needle Body */}
              <div className="w-[2px] h-14 bg-gradient-to-b from-slate-50 via-slate-300 to-slate-500 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
              {/* Needle Grip */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-slate-200 to-slate-400 rounded-full border border-slate-500/50 shadow-lg" />
              {/* Metal Shine */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[1px] h-8 bg-white/50 blur-[0.5px]" />
            </div>
          </motion.div>
        )}

        {/* Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-red-500/10 via-purple-500/5 to-blue-500/10 rounded-full blur-[150px] animate-pulse" />
        </div>

        {!showLogo && (
          <motion.div
            className="relative"
            style={{ y: balloonY, rotate: balloonRotate, scale: balloonScale }}
            onClick={handlePop}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="relative w-72 h-96 group">
              <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-[0_25px_60px_rgba(239,68,68,0.4)]">
                <defs>
                  <radialGradient id="balloonGradient" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#ff5f5f" />
                    <stop offset="60%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                  </radialGradient>
                  <radialGradient id="shineGradient" cx="25%" cy="25%" r="35%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                  <filter id="premiumGlow">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* Balloon Body */}
                <path
                  d="M100 20 C145 20, 185 65, 185 125 C185 185, 145 210, 100 235 C55 210, 15 185, 15 125 C15 65, 55 20, 100 20"
                  fill="url(#balloonGradient)"
                  filter="url(#premiumGlow)"
                />
                
                {/* Reflections */}
                <ellipse cx="60" cy="65" rx="25" ry="15" fill="url(#shineGradient)" transform="rotate(-35 60 65)" />
                <path d="M140 100 Q150 130 145 160" stroke="white" strokeWidth="2" strokeOpacity="0.1" fill="none" />
                
                {/* Knot */}
                <path d="M92 232 L108 232 L104 245 L96 245 Z" fill="#7f1d1d" />
              </svg>
              
              {/* Logo Inside with premium glass effect */}
              <div className="absolute inset-0 flex items-center justify-center p-14">
                <div className="w-full aspect-square rounded-full bg-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.2)] overflow-hidden">
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-4/5 h-4/5 object-contain opacity-90 drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]"
                  />
                </div>
              </div>
            </div>
            
            {/* Elegant String */}
            <svg className="absolute top-[98%] left-1/2 -translate-x-1/2 w-4 h-40 overflow-visible">
              <path 
                d="M8 0 Q15 40 8 80 Q1 120 8 160" 
                stroke="rgba(255,255,255,0.3)" 
                strokeWidth="1.5" 
                fill="none" 
              />
            </svg>
          </motion.div>
        )}

        {/* Reveal State */}
        {/* <AnimatePresence>
          {showLogo && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 120 }}
              className="flex flex-col items-center gap-12"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-purple-500/30 blur-[100px] rounded-full scale-150 animate-pulse" />
                <motion.div 
                  initial={{ rotate: -15 }}
                  animate={{ rotate: 0 }}
                  className="relative w-64 h-64 bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.8)] flex items-center justify-center p-12 overflow-hidden"
                >
                  <img src={logoUrl} alt="Final Logo" className="w-full h-full object-contain" />
                </motion.div>
              </div>
              
              <div className="text-center space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, letterSpacing: "0.2em" }}
                  animate={{ opacity: 1, letterSpacing: "0.05em" }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-white text-6xl font-black tracking-tight"
                >
                  WELCOME
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.8 }}
                  className="text-white text-xl font-light tracking-widest uppercase"
                >
                  Experience the Extraordinary
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence> */}
        
        {/* Instruction */}
       {!balloonPopped && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.4 }}
    className="absolute bottom-12 text-white text-sm font-light tracking-[0.3em] uppercase"
  >
    {/* Mobile */}
    <span className="block md:hidden">Tap to pop</span>

    {/* Desktop */}
    <span className="hidden md:block">Click to pop</span>
  </motion.div>
)}

      </motion.div>
    </AnimatePresence>
  );
};

export default PremiumBalloonPop;
