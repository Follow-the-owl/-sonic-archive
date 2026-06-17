import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, RefreshCw } from "lucide-react";
import { FRAGMENTS, Fragment } from "../data";
import { playFragment, stopAudio, getActiveId, registerAudioCallback, playOwlResonance } from "../audio";

const owlBgImage = "https://res.cloudinary.com/dwtqn39as/image/upload/v1781452328/5870632527817543574_omdcor.jpg";

interface ClockFragment {
  id: string;
  label: string;
  mappedId: string;
  synthType: "drone" | "keys" | "bell" | "noise" | "pulse";
  frequency: number;
  description: string;
}

interface OwlClockProps {
  onSelectFragment?: (frag: Fragment) => void;
}

const CLOCK_FRAGMENTS: ClockFragment[] = [
  {
    id: "frag-1",
    label: "FRAGMENT 00:50 AM",
    mappedId: "00:50",
    synthType: "drone",
    frequency: 110,
    description: "Deep submerged sub-bass. The separation threshold between heavy thoughts and deep sleep."
  },
  {
    id: "frag-2",
    label: "FRAGMENT 02:17 AM",
    mappedId: "02:17",
    synthType: "keys",
    frequency: 293.66,
    description: "Cold copper shortwave signals found floating under the concrete radio tower shadow."
  },
  {
    id: "frag-3",
    label: "FRAGMENT 03:33 AM",
    mappedId: "03:33",
    synthType: "bell",
    frequency: 220,
    description: "High-energy industrial watch hour. Dark machine rumbles and hollow metal tolls."
  },
  {
    id: "frag-4",
    label: "FRAGMENT 05:58 AM",
    mappedId: "05:58",
    synthType: "pulse",
    frequency: 146.83,
    description: "Radioactive dawn sirens. Evolving warm wave-shapes as the night velvet dissolves."
  },
  {
    id: "frag-5",
    label: "FRAGMENT 11:28 PM",
    mappedId: "12:00",
    synthType: "drone",
    frequency: 196.0,
    description: "Chrono motorcycle anthem. Majestic tape-saturated synthesizer spanning miles of empty road."
  },
  {
    id: "frag-6",
    label: "FRAGMENT 01:44 AM",
    mappedId: "09:05",
    synthType: "noise",
    frequency: 164.81,
    description: "Outlaw leather frequencies. Saturated analog tape-static pulsing like an idle engine hum."
  }
];

export default function OwlClock({ onSelectFragment }: OwlClockProps) {
  const [activePlayId, setActivePlayId] = useState<string | null>(getActiveId());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isHooting, setIsHooting] = useState<boolean>(false);
  const [showMutePrompt, setShowMutePrompt] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Smooth springs for high-performance responsive eye tracking and 3D skewing
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 45, stiffness: 120, mass: 0.8 };
  const mouseX = useSpring(x, springConfig);
  const mouseY = useSpring(y, springConfig);

  // Parallax rotation mappings
  const rotateX = useTransform(mouseY, (val) => val * -12);
  const rotateY = useTransform(mouseX, (val) => val * 12);

  // Precise pupil eye movement bounds inside orbitals
  const pupilX = useTransform(mouseX, (val) => val * 8);
  const pupilY = useTransform(mouseY, (val) => val * 8);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const normX = (e.clientX / innerWidth) - 0.5;
      const normY = (e.clientY / innerHeight) - 0.5;
      x.set(normX);
      y.set(normY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Synchronize active play state from main audio core callbacks
    registerAudioCallback((isPlaying, fragmentId) => {
      // Check if any mapping correlates
      if (fragmentId) {
        const found = CLOCK_FRAGMENTS.find(f => f.mappedId === fragmentId);
        setActivePlayId(found ? found.id : null);
      } else {
        setActivePlayId(null);
      }
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [x, y]);

  // Plays signature hoot and triggers physical eye flares
  const handleOwlCall = () => {
    if (isHooting) return;
    setIsHooting(true);
    playOwlResonance();
    setTimeout(() => {
      setIsHooting(false);
    }, 1200);
  };

  const handleRowClick = (item: ClockFragment) => {
    const matchedFrag = FRAGMENTS.find(f => f.id === item.mappedId);
    if (matchedFrag && onSelectFragment) {
      onSelectFragment(matchedFrag);
    } else {
      if (activePlayId === item.id) {
        stopAudio();
        setActivePlayId(null);
      } else {
        playFragment(item.mappedId, item.frequency, item.synthType);
        setActivePlayId(item.id);
        
        // Auto pulse eye briefly on frequency click
        setIsHooting(true);
        setTimeout(() => setIsHooting(false), 600);
      }
    }
  };

  const activeFragment = CLOCK_FRAGMENTS.find(f => f.id === activePlayId);

  return (
    <div
      id="owl-clock-stage"
      className="relative w-full min-h-screen bg-black text-[#D9D6CA] flex flex-col justify-center items-center py-12 px-4 select-none overflow-hidden"
    >
      {/* 1. Subtle global glowing focus vignette behind the content */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,10,12,0.15)_0%,rgba(0,0,0,1)_80%)] pointer-events-none z-0" />

      {/* 2. THE CHERISHED CORE CONTAINER -- CENTERING OWL & TYPEWRITER ROWS */}
      <motion.div
        className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] md:w-[480px] md:h-[480px] z-10 mx-auto my-8 flex items-center justify-center"
        style={{ perspective: 1200 }}
      >
        {/* Tilting Parallax Owl Deck */}
        <motion.div
          id="interactive-owl-mesh"
          style={{
            rotateX,
            rotateY,
          }}
          onClick={handleOwlCall}
          className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer select-none overflow-hidden"
          animate={isHooting ? {
            scale: [1, 1.03, 0.98, 1],
            filter: ["brightness(1) drop-shadow(0 0 10px rgba(217,214,202,0.15))", "brightness(1.23) drop-shadow(0 0 45px rgba(217,214,202,0.55))", "brightness(1) drop-shadow(0 0 10px rgba(0,0,0,0))"]
          } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Main Background Owl Shadow - Rendered with maximum dark depth & contrast */}
          <img
            src={owlBgImage}
            alt="The Sentinel Owl"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-100 pointer-events-none select-none transition-all duration-700"
          />
        </motion.div>

        {/* 3. TYPEWRITER FRAGMENTS STACK OVERLAYED PRECISELY UNDER/OVER THE OWL */}
        {/* Bound strictly to start at 51% (safely below the eyes coordinates at 43.3%) to prevent upward drifting */}
        <div 
          id="typewriter-fragments-overlay"
          className="absolute inset-x-0 top-[51%] flex flex-col justify-start items-center font-mono text-center select-none pointer-events-none z-20"
        >
          {/* Floating typewriter text laid out organically on top of the owl's body, restricted cleanly to prevent bleeding over the head */}
          <div 
            className="w-[300px] sm:w-[360px] max-h-[240px] sm:max-h-[200px] md:max-h-[225px] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pointer-events-auto bg-black/40 backdrop-blur-[1px] p-2 rounded-sm border border-zinc-950/10 flex flex-col justify-start"
          >
            {(() => {
              const displayedFragments = isMobile ? CLOCK_FRAGMENTS.slice(0, 5) : CLOCK_FRAGMENTS;
              return displayedFragments.map((item, index) => {
                const reqActive = activePlayId === item.id;
                const isHovered = hoveredIndex === index;
                const anySelection = hoveredIndex !== null;

                return (
                  <div key={item.id} className="w-full shrink-0">
                    <button
                      onClick={() => handleRowClick(item)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="w-full text-center py-2 sm:py-2.5 outline-none transition-all duration-500 cursor-pointer relative group flex items-center justify-between animate-fade-in"
                      style={{
                        opacity: reqActive ? 1.0 : anySelection ? (isHovered ? 1.0 : 0.35) : 0.5
                      }}
                    >
                      {/* Centered text structure with optional subtle active signal tag */}
                      <div className="w-full flex items-center justify-center gap-2 relative">
                        <AnimatePresence>
                          {reqActive && (
                            <motion.span
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute left-0 w-1.5 h-1.5 rounded-full bg-[#D9D6CA] shadow-[0_0_8px_#D9D6CA]"
                            />
                          )}
                        </AnimatePresence>

                        <span 
                          className={`text-[10px] sm:text-[11px] font-normal tracking-[0.35em] transition-all duration-300 ${
                            reqActive ? "text-white font-semibold glow-text" : "text-[#D9D6CA]/70 group-hover:text-white"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    </button>

                    {/* Pristine hairline horizontal divider as requested */}
                    {index < displayedFragments.length - 1 && (
                      <div className="h-[1px] w-full bg-[#D9D6CA]/15 shrink-0" />
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* User-requested Text overlay: ENTER THE ARCHIVE with centered lowercase v pointing down */}
          <div className="mt-5 flex flex-col items-center gap-1 pointer-events-auto select-none">
            <span className="text-[12px] sm:text-[13px] font-bold tracking-[0.35em] text-[#D9D6CA] font-serif uppercase">
              REQUEST CLEARANCE
            </span>
            <span className="text-[11px] text-[#D9D6CA]/80 font-mono font-bold animate-bounce mt-1">
              v
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
