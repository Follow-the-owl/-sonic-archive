import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { playOwlResonance } from "../audio";

interface WelcomeScreenProps {
  onEnter: () => void;
}

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [isHooting, setIsHooting] = useState(false);

  // Setup motion values for high-performance direct DOM updates at 60fps
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Buttery smooth physics for organic looking head-tracking
  const springConfig = { damping: 30, stiffness: 100, mass: 0.6 };
  const mouseX = useSpring(x, springConfig);
  const mouseY = useSpring(y, springConfig);

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
  const rotateX = useTransform(mouseY, (val) => val * -22);
  const rotateY = useTransform(mouseX, (val) => val * 22);
  const translateHeadX = useTransform(mouseX, (val) => val * 10);
  const translateHeadY = useTransform(mouseY, (val) => val * 10);
  
  // Make pupils shift precisely inside orbits to stare directly at cursor
  const pupilX = useTransform(mouseX, (val) => val * 14);
  const pupilY = useTransform(mouseY, (val) => val * 14);

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
    }, 900);
  };

  return (
    <div
      id="landing-portal"
      onClick={handleInteraction}
      className="fixed inset-0 bg-black text-[#D9D6CA] flex flex-col items-center justify-center select-none cursor-pointer z-50 overflow-hidden"
    >
      {/* Absolute faint concentric coordinate circles to indicate spatial audio interface */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-[300px] h-[300px] border border-[#D9D6CA] rounded-full animate-pulse" />
        <div className="absolute w-[500px] h-[500px] border border-[#D9D6CA] rounded-full border-dashed" />
        <div className="absolute w-[700px] h-[700px] border border-zinc-800 rounded-full" />
      </div>

      <motion.div
        className="text-center flex flex-col items-center justify-center gap-12 relative z-10"
        style={{ perspective: 1000 }}
      >
        {/* Dynamic Interactive SVG Sentinel Owl Head */}
        <motion.div
          style={{
            rotateX: rotateX,
            rotateY: rotateY,
            x: translateHeadX,
            y: translateHeadY,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          animate={isHooting ? {
            scale: [1, 1.15, 0.9],
            filter: "drop-shadow(0 0 35px rgba(217, 214, 202, 0.6))"
          } : {}}
          transition={{ duration: 0.5 }}
          className="relative w-56 h-56 flex items-center justify-center select-none cursor-pointer filter drop-shadow-[0_0_15px_rgba(217,214,202,0.06)]"
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full transition-all duration-300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ambient Aura behind head */}
            <circle cx="100" cy="100" r="85" stroke="rgba(217, 214, 202, 0.03)" strokeWidth="1" />
            <circle cx="100" cy="100" r="70" stroke="rgba(217, 214, 202, 0.05)" strokeWidth="1" strokeDasharray="4 4" />

            {/* Geometric Sharp Feathers/Spikes of the Outer Mask (Hardstone Goth style) */}
            <path d="M50 40 L40 65 L25 80 L35 110 L50 140 L70 165 L100 180 L130 165 L150 140 L165 110 L175 80 L160 65 L150 40 L125 50 L100 35 L75 50 Z" stroke="#D9D6CA" strokeWidth="1.5" strokeLinejoin="miter" strokeMiterlimit="3" />
            
            {/* Sleek Angry Brow/Plates overlay */}
            <path d="M45 75 L100 95 L155 75" stroke="#D9D6CA" strokeWidth="2.5" />
            <path d="M100 95 L100 135" stroke="rgba(217, 214, 202, 0.3)" strokeWidth="1.5" />

            {/* Sharp ears */}
            <polygon points="50,40 58,22 74,48" fill="black" stroke="#D9D6CA" strokeWidth="1.5" />
            <polygon points="150,40 142,22 126,48" fill="black" stroke="#D9D6CA" strokeWidth="1.5" />

            {/* Sleek Beak plate */}
            <polygon points="100,105 92,128 108,128" fill="#D9D6CA" />

            {/* LEFT EYE ASSEMBLY */}
            <g transform="translate(68, 92)">
              {/* Outer metallic orbital socket */}
              <circle cx="0" cy="0" r="24" stroke="#D9D6CA" strokeWidth="1" />
              <circle cx="0" cy="0" r="18" stroke="rgba(217, 214, 202, 0.35)" strokeWidth="1.5" strokeDasharray="3 2" />
              
              {/* Camera reticle tick marks */}
              <line x1="-24" y1="0" x2="-20" y2="0" stroke="#D9D6CA" strokeWidth="1" />
              <line x1="24" y1="0" x2="20" y2="0" stroke="#D9D6CA" strokeWidth="1" />
              <line x1="0" y1="-24" x2="0" y2="-20" stroke="#D9D6CA" strokeWidth="1" />
              <line x1="0" y1="24" x2="0" y2="20" stroke="#D9D6CA" strokeWidth="1" />

              {/* Dynamic Pupil - Spring tracked looking target */}
              <motion.circle
                style={{
                  x: pupilX,
                  y: pupilY,
                }}
                cx="0"
                cy="0"
                r={isHooting ? 8 : 6}
                fill="#D9D6CA"
                className="transition-all duration-300"
              />
              {/* Glowing camera lens pinhole center */}
              <motion.circle
                style={{
                  x: pupilX,
                  y: pupilY,
                }}
                cx="0"
                cy="0"
                r="2"
                fill={isHooting ? "#ef4444" : "#10b981"}
                className="transition-[fill] duration-300"
              />
            </g>

            {/* RIGHT EYE ASSEMBLY */}
            <g transform="translate(132, 92)">
              {/* Outer metallic orbital socket */}
              <circle cx="0" cy="0" r="24" stroke="#D9D6CA" strokeWidth="1" />
              <circle cx="0" cy="0" r="18" stroke="rgba(217, 214, 202, 0.35)" strokeWidth="1.5" strokeDasharray="3 2" />

              {/* Camera reticle tick marks */}
              <line x1="-24" y1="0" x2="-20" y2="0" stroke="#D9D6CA" strokeWidth="1" />
              <line x1="24" y1="0" x2="20" y2="0" stroke="#D9D6CA" strokeWidth="1" />
              <line x1="0" y1="-24" x2="0" y2="-20" stroke="#D9D6CA" strokeWidth="1" />
              <line x1="0" y1="24" x2="0" y2="20" stroke="#D9D6CA" strokeWidth="1" />

              {/* Dynamic Pupil - Spring tracked looking target */}
              <motion.circle
                style={{
                  x: pupilX,
                  y: pupilY,
                }}
                cx="0"
                cy="0"
                r={isHooting ? 8 : 6}
                fill="#D9D6CA"
                className="transition-all duration-300"
              />
              {/* Glowing camera lens pinhole center */}
              <motion.circle
                style={{
                  x: pupilX,
                  y: pupilY,
                }}
                cx="0"
                cy="0"
                r="2"
                fill={isHooting ? "#ef4444" : "#10b981"}
                className="transition-[fill] duration-300"
              />
            </g>

            {/* Left and Right side auxiliary cyber lines */}
            <path d="M25 110 L50 115" stroke="rgba(217, 214, 202, 0.2)" strokeWidth="1" />
            <path d="M175 110 L150 115" stroke="rgba(217, 214, 202, 0.2)" strokeWidth="1" />
            <path d="M60 152 L140 152" stroke="rgba(217, 214, 202, 0.3)" strokeWidth="1" strokeDasharray="2 3" />
          </svg>
        </motion.div>

        {/* Brand Command promot elements */}
        <div className="space-y-3 pointer-events-none">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="text-md sm:text-lg font-bold tracking-[0.55em] text-[#D9D6CA] uppercase font-mono"
          >
            FOLLOW THE OWL
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="text-[9px] tracking-[0.3em] font-mono uppercase text-zinc-500"
          >
            [ CHRONICLE SENSORY PORTAL COMPLIANT ]
          </motion.p>
        </div>
      </motion.div>

      {/* Touch indicator / instruction prompt */}
      <div className="absolute bottom-10 flex flex-col items-center gap-1.5 pointer-events-none">
        <span className="text-[9px] font-mono text-zinc-600 tracking-[0.35em] uppercase animate-pulse">
          {isHooting ? "TRANSMITTING TO THE CORES..." : "[ TAP ANYWHERE TO INITIATE SEQUENCE ]"}
        </span>
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

