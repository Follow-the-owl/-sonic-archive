import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Compass, BookOpen, Radio, Zap, ShieldAlert } from "lucide-react";
import { playOwlResonance } from "../audio";

interface IntroductionSectionProps {
  onFollowOwl: () => void;
}

export default function IntroductionSection({ onFollowOwl }: IntroductionSectionProps) {
  const [time, setTime] = useState(new Date());
  const [signalEmitting, setSignalEmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEmitSignal = () => {
    setSignalEmitting(true);
    playOwlResonance();
    setTimeout(() => setSignalEmitting(false), 1400);
  };

  // Calculate interference offset based on how close time is to peak stillness (03:33 AM)
  const calculateInterference = () => {
    const currentHours = time.getHours() + time.getMinutes() / 60 + time.getSeconds() / 3600;
    // Difference from 3.55 (corresponding to 03:33)
    const diff = Math.min(Math.abs(currentHours - 3.55), Math.abs(currentHours - 27.55));
    // Max difference is 12 hours. Map 0-12 diff to 3% - 94% interference level
    const pct = Math.round(3 + (diff / 12) * 91);
    return Math.min(Math.round(pct), 100);
  };

  const interference = calculateInterference();
  
  // Decide appropriate atmospheric status string
  const getArchivalStatus = () => {
    if (interference < 22) return "OPTIMAL ARCHIVAL COHERENCE [ PEAK SILENCE ]";
    if (interference < 50) return "STABLE CHRONOLOGY [ DUSK ENVELOPE ]";
    if (interference < 80) return "DAYLIGHT INTERFERENCE MODERATE [ MINIMAL RESISTANCE ]";
    return "SOLAR DISTURBANCE ACTIVE [ ARCHIVE SHIELDED BY OWLS ]";
  };

  return (
    <div id="section-nest" className="max-w-4xl mx-auto py-12 px-4 md:px-8 space-y-16">
      {/* Editorial Header */}
      <div className="text-center space-y-4">
        <span className="text-[10px] tracking-[0.5em] font-mono text-gold-muted uppercase block">
          LOCATION I // THE NEST
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-light tracking-[0.1em] text-zinc-100">
          The Cradle of Silence
        </h2>
        <div className="h-[1px] w-12 bg-gold-muted/30 mx-auto mt-6" />
      </div>

      {/* Main Narrative Split Column */}
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="space-y-6 text-zinc-400 font-sans text-sm md:text-base leading-relaxed font-light">
          <p>
            <strong className="text-zinc-200 font-normal">UNKNOWN</strong> is a cinematic sonic archive. It is not a catalog of product offerings, nor a gallery of commercial beats. It is a secure vault for fragments of raw audio frequency and genuine midnight emotion. 
          </p>
          <p>
            Every frequency preserved here was captured during hours when the world was sleeping, when daylight interference was fully muted.
          </p>
          <p className="border-l border-gold-muted/20 pl-4 py-2 italic text-zinc-500 font-serif">
            "Not every sound belongs to daylight. Some are found in the hours nobody remembers."
          </p>
        </div>

        <div className="space-y-6 text-zinc-400 font-sans text-sm md:text-base leading-relaxed font-light">
          <h3 className="text-sm uppercase tracking-[0.2em] font-display text-zinc-300 font-medium font-mono">
            🛡️ Guarded by the Sentinel
          </h3>
          <p>
            The owl is the guide, the watcher, and the sole guardian of the archive. The owl sits at the peak of the signal tower, observing who attempts to enter, mapping frequencies into specific hours.
          </p>
          <p>
            By following the owl, you agree to move through the dark with quiet attention. Focus on the resonance, let the visual overloads go, and listen to what the shadows say.
          </p>

          {/* Interactive Core Principles list */}
          <div className="pt-4 grid grid-cols-2 gap-4 text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-muted" />
              <span>NO CONVENTIONAL BEATS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-muted" />
              <span>POETIC RESONANCE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-muted" />
              <span>TEMPORAL INDEXES</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-muted" />
              <span>GUARDED COMBUSTION</span>
            </div>
          </div>
        </div>
      </div>

      {/* Atmospheric Real-Time Sentinel Diagnostic Widget */}
      <div className="border border-zinc-900 bg-zinc-950/20 backdrop-blur-sm p-6 rounded-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-650 block uppercase">
              // CHRONOLOGICAL SYNCHRONY INDEX
            </span>
            <span className="text-xs font-mono text-gold-muted uppercase tracking-wider block mt-1">
              {getArchivalStatus()}
            </span>
          </div>
          <div className="text-right font-mono">
            <span className="text-[9px] text-zinc-600 block uppercase tracking-[0.2em]">CURRENT CLIENT TIME</span>
            <span className="text-md text-zinc-300 font-medium tracking-widest">
              {time.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 text-[11px] font-mono text-zinc-500">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-zinc-650">
              <span className="tracking-wider uppercase">ATMOSPHERIC RESISTANCE:</span>
              <span className={`${interference > 70 ? "text-red-500/80" : "text-zinc-400"} font-bold`}>
                {interference}%
              </span>
            </div>
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-1000 ${
                  interference > 70 ? "bg-red-500/50" : "bg-gold-muted/50"
                }`}
                style={{ width: `${interference}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-650 tracking-wider uppercase block">TEMPORAL OFFSET TO SILENCE:</span>
            <p className="text-zinc-400 leading-normal">
              Target Peak: <strong className="text-gold-muted font-normal">03:33 AM</strong> (Offset: {Math.round(Math.abs((time.getHours() + time.getMinutes()/60) - 3.55) * 10) / 10} hours)
            </p>
          </div>

          <div className="flex items-center justify-start sm:justify-end">
            <button
              id="nest-test-sentinel-freq"
              onClick={handleEmitSignal}
              className={`flex items-center gap-2 px-3.5 py-2 border rounded-sm font-mono text-[9px] uppercase tracking-wider transition-all duration-300 select-none cursor-pointer ${
                signalEmitting
                  ? "border-gold-muted bg-gold-muted text-black font-semibold shadow-[0_0_15px_#C5A059]"
                  : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 bg-zinc-950/40"
              }`}
              title="Click to hear a custom synthesized owl hoot soundscape"
            >
              <Radio size={11} className={`${signalEmitting ? "animate-pulse" : ""}`} />
              <span>{signalEmitting ? "COHESIVE EMISSION ACTIVE" : "EMIT SENTINEL SIGNAL"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Call To Action Block */}
      <motion.div 
        id="nest-cta"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="border border-zinc-900 bg-zinc-950/30 p-8 md:p-12 text-center rounded-sm space-y-6"
      >
        <p className="font-serif text-xl md:text-2xl italic tracking-wide text-zinc-300 max-w-xl mx-auto leading-relaxed">
          The trees are quiet, and the signal frequency is stable. Ready to explore the path?
        </p>
        
        <button
          id="nest-explore-btn"
          onClick={onFollowOwl}
          className="group relative inline-flex items-center gap-3 px-8 py-3 border border-zinc-800 bg-zinc-950 text-xs tracking-[0.4em] text-zinc-300 hover:text-gold-muted hover:border-gold-muted transition-all duration-500 rounded-sm cursor-pointer"
        >
          <span>FOLLOW THE OWL</span>
          <span className="text-sm font-sans group-hover:translate-x-1.5 transition-transform duration-300">🦉</span>
        </button>
      </motion.div>
    </div>
  );
}

