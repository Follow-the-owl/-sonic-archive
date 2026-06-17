import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
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
          currentCtx.strokeStyle = "rgba(197, 160, 89, 0.9)"; // Signature Gold/Amber
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

  const handleInteraction = () => {
    if (isHooting) return;
    setIsHooting(true);
    try {
      playOwlResonance();
    } catch (e) {
      console.warn("Audio context not initialized yet", e);
    }
    
    // Smooth delay for the hoot sound before transitioning
    setTimeout(() => {
      onEnter();
    }, 1100);
  };

  return (
    <div
      id="landing-portal"
      onClick={handleInteraction}
      className="fixed inset-0 bg-black text-[#D9D6CA] flex flex-col items-center justify-between select-none cursor-pointer z-50 overflow-hidden py-12 px-6"
    >
      {/* Absolute faint concentric coordinate circles to indicate spatial audio interface */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
        <div className="w-[300px] h-[300px] border border-[#D9D6CA] rounded-full animate-pulse" />
        <div className="absolute w-[500px] h-[500px] border border-[#D9D6CA] rounded-full border-dashed" />
      </div>

      {/* Top right "ARCHIVE ACCESS 🔒" badge - Styled exactly like the user's reference */}
      <div className="w-full flex justify-end items-center z-50">
        <div className="flex items-center gap-1.5 text-zinc-500/80 font-mono text-[9px] sm:text-[10px] tracking-[0.35em] uppercase hover:text-white transition-colors duration-300">
          <span>ARCHIVE ACCESS</span>
          <Lock size={11} className="stroke-[1.5] text-zinc-600 group-hover:text-zinc-400" />
        </div>
      </div>

      {/* Center Image Deck wrapped in matching Parallax Skews */}
      <div className="flex-1 w-full max-w-5xl flex items-center justify-center relative z-10 py-6">
        <motion.div
          style={{
            rotateX: rotateX,
            rotateY: rotateY,
            x: translateHeadX,
            y: translateHeadY,
            perspective: 1200,
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative w-[340px] h-[191px] sm:w-[500px] sm:h-[281px] md:w-[680px] md:h-[382px] lg:w-[800px] lg:h-[450px] flex items-center justify-center select-none overflow-hidden"
        >
          {/* Real-image background perfectly matching the site's primary owl branding */}
          <motion.img
            src={owlBgImage}
            alt="The Sentinel Entrance"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none pointer-events-none"
            animate={isHooting ? {
              scale: [1, 1.04, 0.98, 1],
            } : {}}
            transition={{ duration: 0.8 }}
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

            {/* Hairline spacer with central hollow ring target */}
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 0.5, scaleX: 1 }}
              transition={{ duration: 1.8, delay: 0.5 }}
              className="flex items-center justify-center gap-3 w-[160px] sm:w-[200px]"
            >
              <div className="h-[1.2px] flex-grow bg-gradient-to-r from-transparent to-[#D9D6CA]/30" />
              {/* Perfectly rendering a sharp geometric miter-joined triangle as requested */}
              <svg viewBox="0 0 12 12" className="w-[11px] h-[11px] text-[#D9D6CA]/45 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="6,2.5 11,10.5 1,10.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="miter" />
              </svg>
              <div className="h-[1.2px] flex-grow bg-gradient-to-l from-transparent to-[#D9D6CA]/30" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Dynamic continuous oscillation wave bar player */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-md bg-zinc-950/80 border border-zinc-900/80 p-5 rounded-sm space-y-3 z-30 mb-4 shadow-[0_8px_40px_rgba(0,0,0,0.95)]"
      >
        <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono tracking-[0.2em] text-[#C5A059]">
          <span className="flex items-center gap-1.5 uppercase font-bold text-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] inline-block animate-ping" />
            LIVE SENTINEL DISPATCH // ACTIVE BROADCAST
          </span>
          <span className="text-zinc-500 font-mono">BPM: 110</span>
        </div>

        {/* Oscillating Pill Wave Canvas */}
        <div className="w-full bg-black border border-zinc-900/60 rounded-sm overflow-hidden flex items-center justify-center h-16 relative">
          <canvas ref={canvasRef} className="w-full h-[70px] block" />
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <button 
            id="welcome-play-beat-btn"
            onClick={toggleEntranceBeat}
            className={`flex items-center gap-2 px-4 py-2 border font-mono text-[9px] uppercase tracking-[0.2em] transition-all duration-300 rounded-none cursor-pointer ${
              isPlaying
                ? "border-[#C5A059] bg-[#C5A059] text-black font-black shadow-[0_0_12px_rgba(197,160,89,0.35)]"
                : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-650 bg-black/60"
            }`}
          >
            {isPlaying ? (
              <>
                <Square size={10} className="fill-current text-black" />
                <span>SUSPEND BEAT</span>
              </>
            ) : (
              <>
                <Play size={10} className="fill-current text-zinc-400" />
                <span>PLAY SENTINEL BEAT</span>
              </>
            )}
          </button>
          
          <span className="text-[9px] tracking-[0.1em] font-mono text-zinc-500 text-right leading-none">
            CLICK SCREEN TO ACCESS ARCHIVE
          </span>
        </div>
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


