import React, { useState } from "react";
import { motion } from "motion/react";
import { Eye, ShieldAlert } from "lucide-react";
import { playOwlResonance } from "../audio";

interface WelcomeScreenProps {
  onEnter: () => void;
}

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [eyeFlash, setEyeFlash] = useState(false);

  const handleOwlInteract = () => {
    playOwlResonance();
    setEyeFlash(true);
    setTimeout(() => setEyeFlash(false), 1200);
  };

  return (
    <div 
      id="welcome-portal"
      className="relative min-h-screen bg-dark-black text-white flex flex-col items-center justify-between p-8 md:p-16 overflow-hidden select-none"
    >
      {/* Background glowing owl shadow with hover & click engagement */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none md:scale-100 scale-75 z-10"
      >
        <div 
          className="relative w-80 h-80 flex items-center justify-center pointer-events-auto cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleOwlInteract}
          title="Interact with the Sentinel"
        >
          {/* Subtle owl eyes with interactive scaling / glowing flare */}
          <motion.div 
            animate={{ 
              scale: eyeFlash ? [1, 2.5, 1] : isHovered ? 1.25 : 1,
              opacity: eyeFlash ? [0.6, 1, 0.6] : isHovered ? 0.9 : 0.5
            }}
            transition={{ duration: eyeFlash ? 0.8 : 0.4 }}
            className={`absolute left-[33%] top-[45%] w-6 h-3 bg-gold-muted rounded-full blur-[2px] shadow-[0_0_15px_#C5A059]`} 
          />
          <motion.div 
            animate={{ 
              scale: eyeFlash ? [1, 2.5, 1] : isHovered ? 1.25 : 1,
              opacity: eyeFlash ? [0.6, 1, 0.6] : isHovered ? 0.9 : 0.5
            }}
            transition={{ duration: eyeFlash ? 0.8 : 0.4 }}
            className={`absolute right-[33%] top-[45%] w-6 h-3 bg-gold-muted rounded-full blur-[2px] shadow-[0_0_20px_#C5A059]`} 
          />
          
          {/* Silent owl silhouette outline using SVG */}
          <motion.svg 
            animate={{ 
              scale: isHovered ? 1.03 : 1,
              opacity: isHovered ? 0.45 : 0.25 
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="w-full h-full text-zinc-800" 
            viewBox="0 0 100 100" 
            fill="currentColor"
          >
            <path d="M50 15C38 15 32 25 32 38 C32 45 35 55 42 62 C40 68 35 72 30 75 C38 78 45 74 48 70 C49 70 50 70 50 70 C50 70 51 70 52 70 C55 74 62 78 70 75 C65 72 60 68 58 62 C65 55 68 45 68 38 C68 25 62 15 50 15 Z" />
          </motion.svg>
        </div>
      </div>

      {/* Decorative Top Accent */}
      <motion.div 
        id="portal-top-tag"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        className="text-[10px] tracking-[0.4em] font-mono uppercase text-zinc-500 z-20"
      >
        [ SECURE SONIC CELL // RE-0333 ]
      </motion.div>

      {/* Center Cinematic Typography Block */}
      <div className="flex flex-col items-center text-center justify-center flex-1 max-w-2xl py-12">
        <motion.h1 
          id="portal-main-title"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl font-serif tracking-[0.25em] text-zinc-200 glow-text select-none font-light mb-6 font-display"
        >
          UNKNOWN
        </motion.h1>

        <motion.div 
          id="portal-subtitle-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.6 }}
          className="space-y-3"
        >
          <p className="text-sm md:text-md uppercase tracking-[0.55em] font-light text-gold-muted">
            A Cinematic Sonic Archive
          </p>
          <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-zinc-500 font-mono">
            Guarded By The Owl
          </p>
        </motion.div>

        {/* Custom micro-interactive eye status */}
        <motion.div 
          id="portal-owl-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1.2, delay: 1.2 }}
          onClick={handleOwlInteract}
          className="mt-12 flex items-center gap-3 border border-zinc-900 bg-zinc-950/40 px-5 py-2.5 rounded-full backdrop-blur-md cursor-pointer hover:bg-zinc-900/60 hover:border-gold-muted/30 transition-all duration-300 select-none z-20"
          title="Listen to the Sentinel's Call"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-muted opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-muted"></span>
          </span>
          <span className="text-[10px] tracking-[0.3em] font-mono text-zinc-400 uppercase flex items-center gap-1.5">
            🦉 Follow the Owl [ CLICK TO HEAR ]
          </span>
        </motion.div>
      </div>

      {/* Action Area */}
      <motion.div 
        id="portal-action"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4 w-full max-w-sm relative z-20"
      >
        <button 
          id="enter-archive-btn"
          onClick={onEnter}
          className="group relative w-full py-4 text-center cursor-pointer overflow-hidden border border-zinc-800 bg-zinc-950 hover:border-gold-muted transition-all duration-700 ease-out rounded-sm"
        >
          {/* Accent hover backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-muted/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <span className="relative text-xs tracking-[0.6em] font-display uppercase text-zinc-300 group-hover:text-gold-muted group-hover:glow-text transition-all duration-300">
            ENTER THE ARCHIVE
          </span>
        </button>

        <p className="text-[9px] font-mono text-zinc-600 tracking-[0.2em] text-center select-none">
          BY ENTERING, YOU CONSENT TO AUDITORY CHRONOLOGY
        </p>
      </motion.div>
    </div>
  );
}
