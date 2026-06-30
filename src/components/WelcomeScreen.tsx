import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { Lock, Play, Square } from "lucide-react";
import { playOwlResonance, getGlobalAnalyser, playFragment, stopAudio, registerAudioCallback } from "../audio";

const owlBgImage = "https://res.cloudinary.com/dwtqn39as/image/upload/v1781452328/5870632527817543574_omdcor.jpg";

interface WelcomeScreenProps {
  onEnter: () => void;
}

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [isHooting, setIsHooting] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRestricted, setShowRestricted] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);

  // Auto-reset "Access Restricted" state after 3 seconds
  useEffect(() => {
    if (showRestricted) {
      const timer = setTimeout(() => {
        setShowRestricted(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showRestricted]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Setup motion values for high-performance direct DOM updates at 60fps
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Buttery smooth physics for organic looking head-tracking
  const springConfig = { damping: 30, stiffness: 100, mass: 0.6 };
  const mouseX = useSpring(x, springConfig);
  const mouseY = useSpring(y, springConfig);

  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const interval = setInterval(() => {
      // Trigger an organic double-blink pattern
      setIsBlinking(true);
      blinkTimeout = setTimeout(() => {
        setIsBlinking(false);
        setTimeout(() => {
          setIsBlinking(true);
          setTimeout(() => {
            setIsBlinking(false);
          }, 80);
        }, 120);
      }, 80);
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(blinkTimeout);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalize coordinate offset from center of viewport (-0.5 to 0.5)
      const normX = (e.clientX / innerWidth) - 0.5;
      const normY = (e.clientY / innerHeight) - 0.5;
      x.set(normX);
      y.set(normY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [x, y]);

  // Transform 3D perspectives on mouse coordinates
  const rotateX = useTransform(mouseY, (val) => val * -15);
  const rotateY = useTransform(mouseX, (val) => val * 15);
  const translateHeadX = useTransform(mouseX, (val) => val * 8);
  const translateHeadY = useTransform(mouseY, (val) => val * 8);
  
  // Make pupils shift precisely inside orbits to stare directly at cursor
  const pupilX = useTransform(mouseX, (val) => val * 5);
  const pupilY = useTransform(mouseY, (val) => val * 5);

  // Sync state if audio stops or starts
  useEffect(() => {
    registerAudioCallback((playing, id) => {
      if (id === "sentinel_entrance_beat") {
        setIsPlaying(playing);
      } else {
        setIsPlaying(false);
      }
    });
    return () => {
      registerAudioCallback(() => {});
    };
  }, []);

  const toggleEntranceBeat = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      // Dispatch a gorgeous dynamic cinematic lowpad synth frequency beat
      playFragment("sentinel_entrance_beat", 110, "drone");
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use absolute layout sizes to prevent Canvas scaling deformation
    canvas.width = 460;
    canvas.height = 70;

    const draw = () => {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;
      const currentCtx = currentCanvas.getContext("2d");
      if (!currentCtx) return;

      animationFrameRef.current = requestAnimationFrame(draw);

      const analyser = getGlobalAnalyser();
      const bufferLength = analyser ? analyser.frequencyBinCount : 128;
      const dataArray = new Uint8Array(bufferLength);
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      // Clear layout with elegant transparent trails
      currentCtx.fillStyle = "rgba(4, 4, 3, 1)";
      currentCtx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);

      const width = currentCanvas.width;
      const height = currentCanvas.height;
      const centerY = height / 2;

      const barWidth = 3;
      const gap = 1.8;
      const totalBarWidth = barWidth + gap;
      const numBars = Math.floor(width / totalBarWidth);

      const timeSecs = Date.now() * 0.0028;

      for (let i = 0; i < numBars; i++) {
        const xOffset = (width - (numBars * totalBarWidth)) / 2;
        const x = xOffset + i * totalBarWidth + barWidth / 2;

        let amplitude = 0;
        if (isPlaying && analyser) {
          const freqIndex = Math.floor((i / numBars) * (bufferLength * 0.65));
          amplitude = (dataArray[freqIndex] / 255.0) * (height * 0.9);
        } else {
          // Soft undulating ambient wave moving at 60fps
          const s1 = Math.sin(i * 0.16 - timeSecs) * 9;
          const s2 = Math.cos(i * 0.28 + timeSecs * 1.5) * 5;
          amplitude = 3 + Math.abs(s1 + s2);
        }

        const finalHeight = Math.max(3, Math.min(height - 8, amplitude));

        currentCtx.beginPath();
        currentCtx.lineWidth = barWidth;
        currentCtx.lineCap = "round";

        const progressPercent = isPlaying ? 0.72 : 0.6;
        if (i / numBars <= progressPercent) {
          currentCtx.strokeStyle = "rgba(217, 214, 202, 0.9)"; // Signature Premium Bone
        } else {
          currentCtx.strokeStyle = "rgba(100, 95, 85, 0.35)"; // Slate muted
        }

        currentCtx.moveTo(x, centerY - finalHeight / 2);
        currentCtx.lineTo(x, centerY + finalHeight / 2);
        currentCtx.stroke();
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const handleInteraction = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isHooting || isTriggered) return;
    setIsTriggered(true);
    setIsHooting(true);
    try {
      playOwlResonance();
    } catch (err) {
      console.warn("Audio context not initialized yet", err);
    }
    
    // Satisfy requirement: "there should be a red delayed glow before giving the archive access"
    setTimeout(() => {
      onEnter();
    }, 1600);
  };

  return (
    <div
      id="landing-portal"
      className="fixed inset-0 bg-black text-[#D9D6CA] flex flex-col items-center justify-between select-none cursor-default z-50 overflow-hidden py-12 px-6"
    >
      {/* Absolute faint concentric coordinate circles to indicate spatial audio interface */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
        <div className="w-[300px] h-[300px] border border-[#D9D6CA] rounded-full animate-pulse" />
        <div className="absolute w-[500px] h-[500px] border border-[#D9D6CA] rounded-full border-dashed" />
      </div>

      {/* Top right "ARCHIVE ACCESS 🔒" badge - Styled exactly like the user's reference */}
      <div className="w-full flex justify-end items-center z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowRestricted(true);
          }}
          className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] tracking-[0.35em] uppercase transition-colors duration-300 pointer-events-auto bg-transparent border-0 outline-none p-0 group"
          style={{ cursor: "pointer" }}
        >
          {showRestricted ? (
            <motion.span
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#FF4444] font-bold tracking-[0.2em] flex items-center gap-1"
            >
              ACCESS RESTRICTED 🔴
            </motion.span>
          ) : (
            <>
              <span className="text-zinc-500/80 group-hover:text-white transition-colors duration-300">ARCHIVE ACCESS</span>
              <Lock size={11} className="stroke-[1.5] text-zinc-600 group-hover:text-white transition-colors duration-300" />
            </>
          )}
        </button>
      </div>

      {/* Center Image Deck wrapped in matching Parallax Skews */}
      <div className="flex-1 w-full max-w-5xl flex items-center justify-center relative z-10 py-6">
        <motion.div
          onClick={handleInteraction}
          style={{
            rotateX: rotateX,
            rotateY: rotateY,
            x: translateHeadX,
            y: translateHeadY,
            perspective: 1200,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.99 }}
          className="relative w-[340px] h-[191px] sm:w-[500px] sm:h-[281px] md:w-[680px] md:h-[382px] lg:w-[800px] lg:h-[450px] flex items-center justify-center select-none overflow-hidden cursor-pointer rounded-lg group"
        >
          {/* Real-image background perfectly matching the site's primary owl branding */}
          <motion.img
            src={owlBgImage}
            alt="The Sentinel Entrance"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none pointer-events-none transition-all duration-700"
            animate={{
              scale: isHooting ? [1, 1.05, 0.98, 1] : 1,
              filter: isTriggered 
                ? "sepia(0.35) saturate(3) hue-rotate(320deg) brightness(0.85) drop-shadow(0 0 25px rgba(220,38,38,0.7))"
                : "none"
            }}
            transition={{ duration: 1.5 }}
          />



          {/* Spaced aesthetic title and axis slider marker precisely matching the uploaded layout */}
          <div className="absolute inset-x-0 bottom-4 sm:bottom-6 md:bottom-10 lg:bottom-12 flex flex-col items-center gap-4 z-20 pointer-events-none">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="text-[12px] sm:text-[13px] md:text-[14px] font-bold tracking-[0.75em] text-[#D9D6CA] uppercase font-mono text-center select-none"
            >
              FOLLOW THE OWL
            </motion.h1>

            {/* Hairline spacer with central geometric arrow divider */}
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 0.5, scaleX: 1 }}
              transition={{ duration: 1.8, delay: 0.5 }}
              className="flex items-center justify-center gap-3 w-[160px] sm:w-[200px]"
            >
              <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent to-[#D9D6CA]/30" />
              {/* Perfect matching geometric miter-joined triangle that glows and pulses slowly */}
              <motion.svg
                viewBox="0 0 12 12"
                className="w-[11px] h-[11px] text-[#D9D6CA] flex-shrink-0"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                animate={{
                  opacity: [0.35, 1, 0.35],
                  filter: [
                    "drop-shadow(0 0 0px rgba(217, 214, 202, 0))",
                    "drop-shadow(0 0 5px rgba(217, 214, 202, 0.85))",
                    "drop-shadow(0 0 0px rgba(217, 214, 202, 0))"
                  ],
                  scale: [0.95, 1.08, 0.95]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <polygon points="6,2.5 11,10.5 1,10.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="miter" />
              </motion.svg>
              <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent to-[#D9D6CA]/30" />
            </motion.div>
          </div>
        </motion.div>
      </div>

    
    
    </div>
  );
}

// Custom mathematical SVG Nuclear/Radioactive warning symbol
export function RadioactiveIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin-slow inline-block shrink-0`} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <circle cx="12" cy="12" r="9.3" fill="black" />
      {/* 3 hazard fans */}
      <path d="M12 12 L12 4.1 A7.9 7.9 0 0 1 18.8 8.1 Z" fill="currentColor" />
      <path d="M12 12 L18.8 15.9 A7.9 7.9 0 0 1 12 19.9 Z" fill="currentColor" />
      <path d="M12 12 L5.2 15.9 A7.9 7.9 0 0 1 5.2 8.1 Z" fill="currentColor" />
      {/* Core */}
      <circle cx="12" cy="12" r="2.3" fill="black" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}


