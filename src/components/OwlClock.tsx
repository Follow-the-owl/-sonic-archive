import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, RefreshCw, X, ChevronUp, ChevronDown, ShoppingBag, Mail, Download, Play, Pause } from "lucide-react";
import { FRAGMENTS, Fragment } from "../data";
import { playFragment, stopAudio, getActiveId, registerAudioCallback, playOwlResonance } from "../audio";
import { RadioactiveIcon } from "./WelcomeScreen";

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

  // High-fidelity license state variables
  const [showLicensePanel, setShowLicensePanel] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<"mp3" | "mp3-wav" | "premium" | "exclusive" | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});
  const [clientEmail, setClientEmail] = useState<string>("");
  const [isProcessingLicense, setIsProcessingLicense] = useState<boolean>(false);
  const [licenseSuccess, setLicenseSuccess] = useState<boolean>(false);

  const getTierDetails = (tier: "mp3" | "mp3-wav" | "premium" | "exclusive") => {
    switch (tier) {
      case "mp3":
        return {
          title: "MP3 License",
          sub: "MP3",
          price: "$30.00",
          usecase: "Standard non-exclusive license. Encoded at 320kbps.",
          deliverables: "High-quality engineered MP3 Master Track"
        };
      case "mp3-wav":
        return {
          title: "MP3 + WAV License",
          sub: "MP3 & WAV",
          price: "$50.00",
          usecase: "High quality audio split master license. Ideal for indie artists and films.",
          deliverables: "Uncompressed Stereo 24-bit WAV file + high-fidelity MP3"
        };
      case "premium":
        return {
          title: "Premium License",
          sub: "MP3 & WAV",
          price: "$100.00",
          usecase: "Complete commercial release rights including multi-track separates (stems).",
          deliverables: "HQ WAV separated stemming tracks (Drums, Bass, Synths) + master deliverables"
        };
      case "exclusive":
        return {
          title: "Exclusive Unlimited Buyout",
          sub: "Unlimited Usage Ownership",
          price: "$1,250.00",
          usecase: "Permanent master recording ownership title transfer. Retired from Follow The Owl archives.",
          deliverables: "All raw stems, master project agreements, and lifetime mechanical copyright contract"
        };
    }
  };

  const handleAcquireLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail) return;

    setIsProcessingLicense(true);

    setTimeout(() => {
      setIsProcessingLicense(false);
      setLicenseSuccess(true);
    }, 1400);
  };

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

  const currentClockItem = CLOCK_FRAGMENTS.find(item => item.id === activePlayId) || CLOCK_FRAGMENTS[1]; // fallback to 02:17 AM
  const matchedFrag = FRAGMENTS.find(f => f.id === currentClockItem.mappedId) || FRAGMENTS[1];
  const formattedTitle = matchedFrag.name.toUpperCase();
  const isPlayingBeat = !!activePlayId;

  const toggleModalPlay = () => {
    if (isPlayingBeat) {
      stopAudio();
      setActivePlayId(null);
    } else {
      playFragment(currentClockItem.mappedId, currentClockItem.frequency, currentClockItem.synthType);
      setActivePlayId(currentClockItem.id);
    }
  };

  return (
    <div
      id="owl-clock-stage"
      className="relative w-full min-h-screen bg-black text-[#D9D6CA] flex flex-col justify-start items-center pt-20 pb-16 sm:pt-28 md:pt-32 px-4 select-none overflow-hidden"
    >
      {/* 1. Subtle global focus vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,10,12,0.15)_0%,rgba(0,0,0,1)_80%)] pointer-events-none z-0" />

      {/* 2. THE MAIN WRAPPER */}
      <div className="relative w-full max-w-xl z-10 mx-auto flex flex-col items-center">
        
        {/* Parallax / Interactive Owl Body Background that encompasses head and buttons */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] sm:w-[460px] md:w-[485px] h-[580px] sm:h-[685px] md:h-[740px] pointer-events-none z-0 overflow-hidden"
          style={{
            rotateX,
            rotateY,
            perspective: 1200
          }}
          animate={isHooting ? {
            scale: [1, 1.02, 0.99, 1],
            filter: ["brightness(1)", "brightness(1.15)", "brightness(1)"]
          } : {}}
          transition={{ duration: 0.8 }}
        >
          <img
            src={owlBgImage}
            alt="The Sentinel Owl"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-85 pointer-events-none select-none"
          />
          {/* Gradients to blend seamless with black background on all sides */}
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent pointer-events-none" />
        </motion.div>

        {/* 2a. Interactive trigger box covering the upper section where the owl's head resides */}
        <div
          onClick={handleOwlCall}
          className="relative w-full h-[180px] sm:h-[220px] md:h-[250px] cursor-pointer z-10"
          title="Click the Sentinel Owl"
        />

        {/* 3. VERTICAL STACK OF HORIZONTAL TIMESTAMPS LAYERED DIRECTLY OVER OWL'S BODY */}
        <div className="w-full space-y-3 sm:space-y-4 px-2 sm:px-4 z-10">
          {(() => {
            const displayedFragments = CLOCK_FRAGMENTS.slice(0, 5); // display exactly 5 rows matching mockup
            return displayedFragments.map((item, index) => {
              const reqActive = activePlayId === item.id;
              const cleanLabel = item.label.replace("FRAGMENT ", "").trim();

              return (
                <button
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`w-full py-5 sm:py-6 px-6 sm:px-8 border transition-all duration-300 flex items-center justify-between cursor-pointer outline-none rounded-none text-left select-none relative group ${
                    reqActive
                      ? "bg-zinc-950/90 border-[#D9D6CA]/50 text-white shadow-[0_0_15px_rgba(217,214,202,0.12)]"
                      : "bg-black/20 border-zinc-900 hover:border-[#D9D6CA]/30 text-[#D9D6CA]/60 hover:text-white"
                  }`}
                >
                  {/* Subtle active state green/red/bone pulse dot on left edge inside the box if active */}
                  {reqActive && (
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0.5 }}
                      animate={{ scale: [0.6, 1.1, 0.6], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute left-4 w-1.5 h-1.5 rounded-full bg-[#D9D6CA]"
                    />
                  )}

                  {/* Centered Large Typewriter text */}
                  <span className="flex-grow text-center font-normal tracking-[0.35em] text-sm sm:text-base md:text-lg pl-4 select-none">
                    {cleanLabel}
                  </span>

                  {/* Fine horizontal chevron arrow symbol on right margin */}
                  <span className="text-[#D9D6CA]/30 group-hover:text-white group-hover:translate-x-1 duration-300 font-mono text-sm sm:text-base select-none pointer-events-none">
                    &gt;
                  </span>
                </button>
              );
            });
          })()}
        </div>

        {/* 4. HORIZONTAL RULE DIVIDER WITH INTEGRATED "REQUEST CLEARANCE →" LINK */}
        <div className="w-full flex items-center justify-center gap-4 mt-8 px-2 sm:px-4 cursor-pointer">
          <div className="h-[1px] flex-grow bg-[#D9D6CA]/10" />
          
          <button
            onClick={() => setShowLicensePanel(true)}
            className="flex items-center gap-2.5 bg-transparent border-0 py-1.5 px-3 cursor-pointer outline-none group text-[#D9D6CA]/70 hover:text-white transition-colors select-none whitespace-nowrap"
            title="Open clearance contracts modal"
          >
            <span className="text-[11px] sm:text-[12px] font-bold tracking-[0.35em] uppercase font-serif">
              REQUEST CLEARANCE
            </span>
            <span className="text-xs transform group-hover:translate-x-1.5 duration-300">
              →
            </span>
          </button>

          <div className="h-[1px] flex-grow bg-[#D9D6CA]/10" />
        </div>
      </div>

      {/* LICENSE MODAL OVERLAY IN HIGH FIDELITY */}
      <AnimatePresence>
        {showLicensePanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
            {/* Modal Container */}
            <motion.div
              id="licensing-modal-box"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="relative w-full max-w-4xl bg-[#0b0b0b] border border-zinc-900 rounded-lg text-white shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-5 bg-[#050505]">
                <h3 className="text-sm sm:text-base font-mono font-bold tracking-[0.15em] text-[#C5A059] uppercase">
                  Choose contract type
                </h3>
                <button
                  onClick={() => {
                    setShowLicensePanel(false);
                    setSelectedTier(null);
                    setLicenseSuccess(false);
                  }}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-900/40 rounded-full transition-all cursor-pointer border-0 bg-transparent flex items-center justify-center"
                  title="Close panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Multi-Column Layout */}
              <div className="flex flex-col md:flex-row p-6 md:p-8 gap-8 overflow-y-auto bg-gradient-to-b from-[#0b0b0b] to-[#040404] text-left">
                {/* Left Column: Track preview summary card */}
                <div className="w-full md:w-1/4 flex flex-col items-center border-b md:border-b-0 md:border-r border-zinc-900/65 pb-6 md:pb-0 md:pr-8 shrink-0">
                  <div className="relative group w-44 h-44 bg-zinc-950 border border-[#C5A059]/30 overflow-hidden rounded-md shadow-[0_8px_30px_rgba(0,0,0,0.85)] flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-black to-zinc-950 flex flex-col items-center justify-center relative p-6">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.08)_0%,transparent_70%)]" />
                      <RadioactiveIcon className="w-16 h-16 text-[#C5A059] animate-spin-slow" />
                      <span className="text-[7.5px] font-mono text-[#C5A059] absolute bottom-3.5 tracking-widest text-center uppercase font-bold">FTO SECURE RECORDER</span>
                    </div>

                    {/* Circular Interactive Play Trigger Button Overlay */}
                    <button
                      onClick={toggleModalPlay}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer border-0 bg-transparent"
                    >
                      <div className="w-12 h-12 rounded-full border border-[#C5A059] bg-[#0c0c0c]/90 flex items-center justify-center shadow-[0_0_15px_rgba(197,160,89,0.35)] transform hover:scale-105 transition-transform">
                        {isPlayingBeat ? (
                          <Pause size={14} className="fill-[#C5A059] text-[#C5A059] ml-0" />
                        ) : (
                          <Play size={14} className="fill-[#C5A059] text-[#C5A059] ml-0.5" />
                        )}
                      </div>
                    </button>

                    {/* Static visual audio player microindicator */}
                    {isPlayingBeat && (
                      <div className="absolute bottom-2.5 right-2.5 flex items-end gap-1 px-1.5 py-1 bg-black/80 rounded-sm border border-zinc-900 w-auto">
                        <span className="w-1 h-3.5 bg-[#C5A059] origin-bottom animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <span className="w-1 h-2 bg-[#C5A059] origin-bottom animate-bounce" style={{ animationDelay: "0.3s" }} />
                        <span className="w-1 h-3 bg-[#C5A059] origin-bottom animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    )}
                  </div>

                  <span className="text-white text-base font-bold text-center mt-5 truncate max-w-full block tracking-wide">
                    {matchedFrag.name}
                  </span>
                  <span className="text-zinc-500 text-[10px] font-mono text-center mt-1.5 tracking-wider uppercase">
                    Ozedikus // THE OWL CLOCK
                  </span>
                </div>

                {/* Right Column: Tiers Selection or Checkout Forms */}
                <div className="flex-grow space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {!selectedTier ? (
                    /* Display Tiers list matching mockup */
                    <div className="space-y-4 text-left">
                      {(["mp3", "mp3-wav", "premium", "exclusive"] as const).map((tierId) => {
                        const info = getTierDetails(tierId);
                        const isExpanded = expandedTiers[tierId] || false;

                        return (
                          <div
                            key={tierId}
                            className="bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-900 hover:border-[#C5A059]/40 p-5 rounded-md flex flex-col transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="font-bold text-[#D9D6CA] text-sm tracking-wide">
                                  {info.title}
                                </h4>
                                <span className="text-zinc-500 text-[9px] font-mono tracking-wider block uppercase">
                                  {info.sub}
                                </span>
                              </div>

                              {/* Price check out buttons */}
                              <button
                                onClick={() => setSelectedTier(tierId)}
                                className="bg-[#C5A059] hover:bg-white text-black font-mono font-bold text-[9.5px] tracking-wider px-4 py-2 flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(197,160,89,0.2)] rounded-sm cursor-pointer shrink-0 border-0"
                              >
                                <ShoppingBag size={10} className="fill-current text-current" />
                                <span>+ {info.price}</span>
                              </button>
                            </div>

                            {/* Show/Hide usage terms accordion link */}
                            <div className="mt-3 text-left">
                              <button
                                onClick={() =>
                                  setExpandedTiers((prev) => ({
                                    ...prev,
                                    [tierId]: !prev[tierId],
                                  }))
                                }
                                className="flex items-center gap-1 text-[8.5px] font-mono tracking-widest text-[#C5A059]/80 hover:text-[#C5A059] cursor-pointer bg-transparent border-0 p-0"
                              >
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                <span className="uppercase">{isExpanded ? "Hide usage terms" : "Show usage terms"}</span>
                              </button>

                              {/* Collapsible details container */}
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-3.5 pl-3 border-l border-zinc-900/80 space-y-2 py-0.5">
                                      <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed font-light">
                                        {info.usecase}
                                      </p>
                                      
                                      <div className="space-y-1 text-left pt-1">
                                        <span className="text-zinc-500 text-[8px] font-mono font-bold tracking-wider block uppercase">
                                          SPECIFIC DELIVERABLES & RIGHTS:
                                        </span>
                                        <p className="text-zinc-400 text-[9.5px] font-mono leading-relaxed pl-1">
                                          • {info.deliverables}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Display secure checkout slide inside modal */
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border border-zinc-900 bg-zinc-950 p-6 rounded-md space-y-5"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                        <button
                          onClick={() => {
                            setSelectedTier(null);
                            setLicenseSuccess(false);
                          }}
                          className="text-[9px] font-mono text-[#C5A059] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-transparent border-0"
                        >
                          ← Select another contract
                        </button>
                        <span className="text-[8.5px] font-mono text-zinc-500 tracking-wider">
                          SECURE CHANCELLOR LINK
                        </span>
                      </div>

                      {licenseSuccess ? (
                        <div className="text-center py-6 space-y-3 font-mono">
                          <span className="text-xs font-bold text-[#C5A059] tracking-widest block">
                            ✓ TRANSACTION SECURED & DISPATCHED
                          </span>
                          <p className="text-[11px] text-zinc-400 font-sans font-light leading-relaxed">
                            All calibrated mechanical outputs and premium stems for <strong className="text-white">{formattedTitle}</strong> have been compiled into your contract vault. A validation key and stem downloads catalog has been sent to <strong className="text-white">{clientEmail}</strong>.
                          </p>
                          <button
                            onClick={() => {
                              setSelectedTier(null);
                              setLicenseSuccess(false);
                              setShowLicensePanel(false);
                            }}
                            className="text-[10px] font-mono text-black bg-[#C5A059] px-4 py-2 tracking-widest uppercase hover:bg-white transition-colors cursor-pointer mt-3 border-0"
                          >
                            Close Port
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleAcquireLicense} className="space-y-4 font-mono text-left">
                          <div className="space-y-1">
                            <span className="text-zinc-500 text-[8px] tracking-wider uppercase block font-bold">
                              CONTRACT DEED // TIER SELECTED
                            </span>
                            <div className="text-white text-xs font-bold tracking-wide">
                              {getTierDetails(selectedTier).title.toUpperCase()} — {getTierDetails(selectedTier).price}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block">
                              Client Credentials Email Address *
                            </label>
                            <div className="relative flex items-center bg-zinc-950 border border-zinc-900 px-3 py-2.5 rounded-sm focus-within:border-[#C5A059]">
                              <Mail size={12} className="text-zinc-650 mr-2 shrink-0" />
                              <input
                                type="email"
                                required
                                placeholder="YOUR DESIGNATED EMAIL VAULT..."
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                className="w-full bg-transparent border-none text-[11px] text-zinc-300 outline-none placeholder:text-zinc-800"
                              />
                            </div>
                          </div>

                          <div className="p-3.5 bg-black border border-zinc-900 text-[9.5px] text-zinc-500 rounded-sm leading-relaxed space-y-1">
                            <span className="text-zinc-400 text-[7.5px] font-bold block tracking-wider">
                              LICENSING MECHANICAL AGREEMENT:
                            </span>
                            <p className="font-sans font-light text-zinc-400">
                              By approving this secure checkout contract transfer, you acknowledge the terms of the mechanical and master raw audio stem usage guidelines. ZERO audio tag marks are embedded on final delivery tracks.
                            </p>
                          </div>

                          <button
                            type="submit"
                            disabled={isProcessingLicense}
                            className="w-full py-3.5 bg-[#C5A059] hover:bg-white text-black font-semibold tracking-widest uppercase transition-colors rounded-none cursor-pointer flex items-center justify-center gap-2 text-[10px] font-mono shadow-[0_4px_12px_rgba(197,160,89,0.15)] border-0"
                          >
                            <Download size={11} className="text-black" />
                            <span>
                              {isProcessingLicense ? "GENERATING SECURE CONTRACTS..." : "CONFIRM SECURE TRANSFER"}
                            </span>
                          </button>
                        </form>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
