import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, RefreshCw, X, ChevronUp, ChevronDown, ShoppingBag, Mail, Download, Play, Pause, Search, Lock } from "lucide-react";
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
  onAddToCart?: (fragment: Fragment, tierId: string, tierTitle: string, price: string) => void;
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

export default function OwlClock({ onSelectFragment, onAddToCart }: OwlClockProps) {
  const recoveredSectionRef = useRef<HTMLDivElement>(null);
  const [activePlayId, setActivePlayId] = useState<string | null>(getActiveId());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isHooting, setIsHooting] = useState<boolean>(false);
  const [showMutePrompt, setShowMutePrompt] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // High-fidelity license state variables
  const [showLicensePanel, setShowLicensePanel] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState<string>("");
  const [isProcessingLicense, setIsProcessingLicense] = useState<boolean>(false);
  const [licenseSuccess, setLicenseSuccess] = useState<boolean>(false);
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});

  const CONTRACT_TIERS = [
    { 
      id: "access", 
      title: "ACCESS LICENSE", 
      price: "$100", 
      subtitle: "For artists testing concepts.", 
      includes: [
        "MP3 Download",
        "Non-exclusive",
        "1 Commercial Release",
        "Up to 100,000 Streams",
        "1 Music Video",
        "Live Performances Allowed"
      ],
      restrictions: [
        "No Stems",
        "No Content ID",
        "No TV/Film",
        "No Transfer"
      ],
      extraNote: "Upgrade required if limits are exceeded."
    },
    { 
      id: "release", 
      title: "RELEASE LICENSE", 
      price: "$250", 
      subtitle: "For professional independent releases.", 
      includes: [
        "WAV Download",
        "MP3 Download",
        "Non-exclusive",
        "1 Commercial Release",
        "Up to 1,000,000 Streams",
        "2 Music Videos",
        "Live Performances",
        "Radio Use"
      ],
      restrictions: [
        "No Content ID",
        "No Transfer",
        "No Sync Licensing"
      ],
      extraNote: ""
    },
    { 
      id: "commercial", 
      title: "COMMERCIAL LICENSE", 
      price: "$500", 
      subtitle: "For brands, creators, and larger campaigns.", 
      includes: [
        "WAV",
        "MP3",
        "Stems",
        "Commercial Advertising",
        "Online Campaigns",
        "Unlimited Streams",
        "Unlimited Videos"
      ],
      restrictions: [
        "Non-exclusive",
        "No Ownership Transfer"
      ],
      extraNote: ""
    },
    { 
      id: "exclusive", 
      title: "EXCLUSIVE ACQUISITION", 
      price: "Starting at $2,500", 
      subtitle: "Exclusive rights and beat removal.", 
      includes: [
        "Exclusive Rights",
        "Beat Removed From Archive",
        "WAV",
        "MP3",
        "Stems",
        "Commercial Exploitation Rights",
        "Unlimited Streams",
        "Unlimited Videos"
      ],
      restrictions: [],
      extraNote: "Ownership of composition and publishing does not automatically transfer. Separate negotiation required."
    }
  ] as const;

  // Search & scroll wheel states
  const [pickedHour, setPickedHour] = useState<number | null>(null);
  const [pickedMinute, setPickedMinute] = useState<number | null>(null);
  const [pickedAMPM, setPickedAMPM] = useState<"AM" | "PM" | null>(null);
  const [isManual, setIsManual] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleAcquireLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail) return;

    setIsProcessingLicense(true);

    setTimeout(() => {
      setIsProcessingLicense(false);
      setLicenseSuccess(true);
    }, 1400);
  };

  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync picked values with current active signal or real time if user hasn't gone manual
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      // Direct focus on search results, do not overwrite with real time or unrelated active play cues
      return;
    }
    if (activePlayId) {
      const activeFrag = CLOCK_FRAGMENTS.find(f => f.id === activePlayId);
      if (activeFrag) {
        const cleaned = activeFrag.label.replace("FRAGMENT ", "").trim(); // "02:17 AM"
        const [timeStr, ampmStr] = cleaned.split(" ");
        const [hStr, mStr] = timeStr.split(":");
        setPickedHour(parseInt(hStr, 10));
        setPickedMinute(parseInt(mStr, 10));
        setPickedAMPM((ampmStr || "AM") as "AM" | "PM");
        setIsManual(false); // reset manual if user switched to playing a different signal row
      }
    } else if (!isManual) {
      let h = currentTime.getHours();
      const am = h >= 12 ? "PM" : "AM";
      h = h % 12;
      h = h ? h : 12;
      setPickedHour(h);
      setPickedMinute(currentTime.getMinutes());
      setPickedAMPM(am);
    }
  }, [activePlayId, currentTime, isManual, searchQuery]);

  // Set picked clock scroll wheel values dynamically based on search matches
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      const queryLower = searchQuery.toLowerCase();
      const matches = CLOCK_FRAGMENTS.filter(frag => {
        const rawVal = `${frag.label} ${frag.description} ${frag.synthType}`.toLowerCase();
        return rawVal.includes(queryLower);
      });
      if (matches.length > 0) {
        const firstMatch = matches[0];
        const cleaned = firstMatch.label.replace("FRAGMENT", "").trim(); // e.g. "02:17 AM"
        const [timePart, ampmPart] = cleaned.split(" ");
        const [hourStr, minStr] = timePart.split(":");
        const h = parseInt(hourStr, 10);
        const m = parseInt(minStr, 10);
        const ampm = (ampmPart || "AM") as "AM" | "PM";

        setPickedHour(h);
        setPickedMinute(m);
        setPickedAMPM(ampm);
        setIsManual(true);
      }
    }
  }, [searchQuery]);

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

  // Dynamic variables for Clock Wheel Selector Card
  const displayHour = pickedHour !== null ? pickedHour : (activeFragment ? 2 : currentTime.getHours() % 12 || 12);
  const displayMinute = pickedMinute !== null ? pickedMinute : (activeFragment ? 17 : currentTime.getMinutes());
  const displayAMPM = pickedAMPM !== null ? pickedAMPM : (activeFragment ? "AM" : (currentTime.getHours() >= 12 ? "PM" : "AM"));

  const prevHour = displayHour === 1 ? 12 : displayHour - 1;
  const prevMinute = displayMinute === 0 ? 59 : displayMinute - 1;
  const nextHour = displayHour === 12 ? 1 : displayHour + 1;
  const nextMinute = displayMinute === 59 ? 0 : displayMinute + 1;
  const fmt = (num: number) => String(num).padStart(2, "0");

  // Wheel interaction event handlers
  const handleScrollHour = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsManual(true);
    const step = e.deltaY > 0 ? 1 : -1;
    let next = displayHour + step;
    if (next > 12) next = 1;
    if (next < 1) next = 12;
    setPickedHour(next);
  };

  const handleScrollMinute = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsManual(true);
    const step = e.deltaY > 0 ? 1 : -1;
    let next = displayMinute + step;
    if (next > 59) next = 0;
    if (next < 0) next = 59;
    setPickedMinute(next);
  };

  const handleScrollAMPM = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsManual(true);
    setPickedAMPM(displayAMPM === "AM" ? "PM" : "AM");
  };

  const handleHourClick = (h: number) => {
    setIsManual(true);
    setPickedHour(h);
  };

  const handleMinuteClick = (m: number) => {
    setIsManual(true);
    setPickedMinute(m);
  };

  const handleAMPMClick = (ampm: "AM" | "PM") => {
    setIsManual(true);
    setPickedAMPM(ampm);
  };

  // Find the closest fragment circular in time (1440 minutes)
  const getFragmentCloseness = (item: ClockFragment, h: number, m: number, ampm: "AM" | "PM") => {
    const cleaned = item.label.replace("FRAGMENT ", "").trim(); // "02:17 AM"
    const [timeStr, ampmStr] = cleaned.split(" ");
    const [hStr, mStr] = timeStr.split(":");
    const itemH = parseInt(hStr, 10);
    const itemM = parseInt(mStr, 10);
    const itemAMPM = ampmStr || "AM";

    const get24Min = (hour: number, minute: number, mer: string) => {
      let h24 = hour % 12;
      if (mer === "PM") h24 += 12;
      return h24 * 60 + minute;
    };

    const targetMinutes = get24Min(h, m, ampm);
    const itemMinutes = get24Min(itemH, itemM, itemAMPM);

    let diff = Math.abs(targetMinutes - itemMinutes);
    if (diff > 720) {
      diff = 1440 - diff;
    }
    return diff;
  };

  // Filtered fragments based on user typing
  const filteredClockFragments = CLOCK_FRAGMENTS.filter(frag => {
    const rawVal = `${frag.label} ${frag.description} ${frag.synthType}`.toLowerCase();
    return rawVal.includes(searchQuery.toLowerCase());
  });

  const exactClockFragment = CLOCK_FRAGMENTS.find(item => {
    const cleaned = item.label.replace("FRAGMENT ", "").trim(); // "02:17 AM"
    const [timeStr, ampmStr] = cleaned.split(" ");
    const [hStr, mStr] = timeStr.split(":");
    let itemH = parseInt(hStr, 10);
    if (itemH === 0) itemH = 12; // Midnight is 12 in 12-hour
    const itemM = parseInt(mStr, 10);
    const itemAMPM = (ampmStr || "AM") as "AM" | "PM";
    return itemH === displayHour && itemM === displayMinute && itemAMPM === displayAMPM;
  });

  const exactActualFrag = exactClockFragment
    ? (FRAGMENTS.find(f => f.id === exactClockFragment.mappedId) || null)
    : null;

  const handleTransmit = () => {
    if (exactActualFrag && onSelectFragment) {
      onSelectFragment(exactActualFrag);
    }
  };

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
      className="relative w-full min-h-screen bg-black text-[#D9D6CA] flex flex-col justify-start items-center pt-8 pb-16 sm:pt-12 px-4 select-none overflow-hidden"
    >
      {/* 1. Subtle global focus vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,10,12,0.15)_0%,rgba(0,0,0,1)_80%)] pointer-events-none z-0" />

      {/* 2. THE MAIN WRAPPER */}
      <div className="relative w-full max-w-xl z-10 mx-auto flex flex-col items-center">
        
        {/* CLOCK WHEEL SELECTOR CARD */}
        <div className="w-full bg-[#101010]/50 border border-zinc-900 rounded-2xl py-5 sm:py-6 px-6 sm:px-10 flex flex-col items-center justify-between mb-8 relative shadow-2xl z-20">
          
          <div className="w-full flex items-center justify-between">
            {/* Left: Search with Input */}
            <div className="flex items-center gap-2 flex-grow max-w-[140px] sm:max-w-[220px]">
              <Search 
                size={18} 
                strokeWidth={1.5} 
                className="text-[#D9D6CA]/40 hover:text-white cursor-pointer shrink-0 transition-colors" 
                onClick={() => setIsSearching(!isSearching)} 
              />
              {isSearching ? (
                <input
                  type="text"
                  autoFocus
                  placeholder="Filter fragments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-b border-zinc-800 text-xs text-[#D9D6CA] focus:border-[#D9D6CA]/50 outline-none w-full tracking-widest font-mono py-0.5"
                />
              ) : (
                <button
                  onClick={() => setIsSearching(true)}
                  className="text-[9px] sm:text-[10px] tracking-[0.2em] text-[#D9D6CA]/30 font-mono hover:text-[#D9D6CA]/60 transition-colors cursor-pointer bg-transparent border-0 select-none pb-0.5"
                >
                  SEARCH SIGNALS
                </button>
              )}
            </div>

            {/* Right/Center: Time Picker Wheels Column */}
            <div className="flex items-center gap-5 sm:gap-7 pr-2 font-mono select-none">
              {!searchQuery || searchQuery.trim() === "" ? (
                <div className="text-[#D9D6CA]/20 text-[10px] sm:text-xs tracking-widest uppercase font-mono py-6 pr-4">
                  &mdash; &mdash;
                </div>
              ) : filteredClockFragments.length === 0 ? (
                <div className="text-red-500/90 text-[10px] sm:text-xs tracking-widest uppercase font-mono font-bold border border-red-950/40 bg-red-950/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                  it is is not available
                </div>
              ) : (
                <>
                  {/* Column 1: HOUR */}
                  <div 
                    onWheel={handleScrollHour}
                    className="flex flex-col items-center justify-center h-20 text-center cursor-ns-resize"
                    title="Scroll wheel or click to select hour"
                  >
                    {/* Prev Hour */}
                    <button
                      type="button"
                      onClick={() => handleHourClick(prevHour)}
                      className="text-[#D9D6CA]/20 text-xs sm:text-sm h-6 flex items-center justify-center transition-all duration-300 hover:text-[#D9D6CA]/60 bg-transparent border-0 outline-none cursor-pointer"
                    >
                      {fmt(prevHour)}
                    </button>
                    {/* Target Hour */}
                    <button
                      type="button"
                      onClick={handleTransmit}
                      className={`${
                        exactClockFragment 
                          ? "text-white hover:scale-110 active:scale-95 cursor-pointer" 
                          : "text-zinc-600 cursor-not-allowed opacity-40 inline-block pointer-events-none"
                      } font-bold text-base sm:text-lg h-8 flex items-center justify-center tracking-widest transition-all duration-300 bg-transparent border-0 outline-none`}
                      title={exactClockFragment ? "Click to transmit signal" : "No fragment available at this time"}
                    >
                      {fmt(displayHour)}
                    </button>
                    {/* Next Hour */}
                    <button
                      type="button"
                      onClick={() => handleHourClick(nextHour)}
                      className="text-[#D9D6CA]/20 text-xs sm:text-sm h-6 flex items-center justify-center transition-all duration-300 hover:text-[#D9D6CA]/60 bg-transparent border-0 outline-none cursor-pointer"
                    >
                      {fmt(nextHour)}
                    </button>
                  </div>

                  {/* Separator: Colons */}
                  <div className="flex flex-col items-center justify-center h-20 text-center">
                    <div className="text-transparent h-6 flex items-center justify-center select-none">:</div>
                    <button 
                      type="button"
                      onClick={handleTransmit}
                      className={`${
                        exactClockFragment 
                          ? "text-white animate-pulse hover:scale-115 active:scale-95 cursor-pointer" 
                          : "text-zinc-600 cursor-not-allowed opacity-40 inline-block pointer-events-none"
                      } font-bold text-base sm:text-lg h-8 flex items-center justify-center transition-all duration-300 bg-transparent border-0 outline-none`}
                      title={exactClockFragment ? "Click to transmit signal" : "No fragment available at this time"}
                    >
                      :
                    </button>
                    <div className="text-transparent h-6 flex items-center justify-center select-none">:</div>
                  </div>

                  {/* Column 2: MINUTE */}
                  <div 
                    onWheel={handleScrollMinute}
                    className="flex flex-col items-center justify-center h-20 text-center cursor-ns-resize"
                    title="Scroll wheel or click to select minute"
                  >
                    {/* Prev Minute */}
                    <button
                      type="button"
                      onClick={() => handleMinuteClick(prevMinute)}
                      className="text-[#D9D6CA]/20 text-xs sm:text-sm h-6 flex items-center justify-center transition-all duration-300 hover:text-[#D9D6CA]/60 bg-transparent border-0 outline-none cursor-pointer"
                    >
                      {fmt(prevMinute)}
                    </button>
                    {/* Target Minute */}
                    <button
                      type="button"
                      onClick={handleTransmit}
                      className={`${
                        exactClockFragment 
                          ? "text-white hover:scale-110 active:scale-95 cursor-pointer" 
                          : "text-zinc-600 cursor-not-allowed opacity-40 inline-block pointer-events-none"
                      } font-bold text-base sm:text-lg h-8 flex items-center justify-center tracking-widest transition-all duration-300 bg-transparent border-0 outline-none`}
                      title={exactClockFragment ? "Click to transmit signal" : "No fragment available at this time"}
                    >
                      {fmt(displayMinute)}
                    </button>
                    {/* Next Minute */}
                    <button
                      type="button"
                      onClick={() => handleMinuteClick(nextMinute)}
                      className="text-[#D9D6CA]/20 text-xs sm:text-sm h-6 flex items-center justify-center transition-all duration-300 hover:text-[#D9D6CA]/60 bg-transparent border-0 outline-none cursor-pointer"
                    >
                      {fmt(nextMinute)}
                    </button>
                  </div>

                  {/* Column 3: MERIDIEM (AM/PM) */}
                  <div 
                    onWheel={handleScrollAMPM}
                    className="flex flex-col items-center justify-center h-20 text-center min-w-[32px] cursor-ns-resize"
                    title="Scroll wheel or click to toggle AM/PM"
                  >
                    <button
                      type="button"
                      onClick={() => handleAMPMClick(displayAMPM === "AM" ? "PM" : "AM")}
                      className="text-[#D9D6CA]/20 text-[10px] sm:text-xs h-6 flex items-center justify-center tracking-wider transition-all duration-300 hover:text-[#D9D6CA]/50 bg-transparent border-0 outline-none cursor-pointer"
                    >
                      {displayAMPM === "AM" ? "PM" : "AM"}
                    </button>
                    {/* Target Meridiem */}
                    <button
                      type="button"
                      onClick={handleTransmit}
                      className={`${
                        exactClockFragment 
                          ? "text-white hover:scale-110 active:scale-95 cursor-pointer" 
                          : "text-zinc-600 cursor-not-allowed opacity-40 inline-block pointer-events-none"
                      } font-bold text-xs sm:text-sm h-8 flex items-center justify-center tracking-wider transition-all duration-300 bg-transparent border-0 outline-none`}
                      title={exactClockFragment ? "Click to transmit signal" : "No fragment available at this time"}
                    >
                      {displayAMPM}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAMPMClick(displayAMPM === "AM" ? "PM" : "AM")}
                      className="text-[#D9D6CA]/20 text-[10px] sm:text-xs h-6 flex items-center justify-center tracking-wider transition-all duration-300 hover:text-[#D9D6CA]/50 bg-transparent border-0 outline-none cursor-pointer"
                    >
                      {displayAMPM === "AM" ? "PM" : "AM"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          {searchQuery.trim() !== "" && !exactClockFragment && (
            <div className="w-full text-center mt-3 pt-2 border-t border-zinc-900/40 text-red-500/80 text-[10px] sm:text-xs tracking-widest uppercase font-mono font-bold animate-pulse">
              it is is not available
            </div>
          )}
        </div>

        {/* Parallax / Interactive Owl Body Background that encompasses head and buttons */}
        <motion.div 
          className="absolute top-28 left-1/2 -translate-x-1/2 w-[340px] sm:w-[460px] md:w-[485px] h-[360px] sm:h-[480px] md:h-[510px] pointer-events-none z-0 overflow-hidden"
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
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent pointer-events-none" />
        </motion.div>

        {/* 2a. Interactive trigger box covering the upper section where the owl's head resides (placed with z-index behind cards) */}
        <div
          onClick={handleOwlCall}
          className="absolute top-[160px] sm:top-[200px] left-1/2 -translate-x-1/2 w-[240px] h-[160px] cursor-pointer z-10"
          title="Click the Sentinel Owl"
        />

        {/* RECOVERED SIGNALS Section Header */}
        <div className="w-full text-center z-10 mt-[260px] sm:mt-[320px] mb-4">
          <h2 className="text-[10px] sm:text-xs leading-none tracking-[0.3em] text-[#D9D6CA]/40 font-bold uppercase select-none">
            RECOVERED SIGNALS
          </h2>
        </div>

        {/* 3. VERTICAL STACK OF HORIZONTAL TIMESTAMPS */}
        <div ref={recoveredSectionRef} className="w-full space-y-3 sm:space-y-4 px-2 sm:px-4 z-10">
          {(() => {
            let displayedFragments = [...CLOCK_FRAGMENTS.slice(0, 5)];
            if (searchQuery.trim() !== "" && filteredClockFragments.length > 0) {
              const matched = filteredClockFragments[0];
              // Prepend matching search signal as the first recovered signal, slice to limit top 5
              displayedFragments = [
                matched,
                ...displayedFragments.filter(f => f.id !== matched.id)
              ].slice(0, 5);
            }

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
      </div>

      <AnimatePresence>
        {showLicensePanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/95 backdrop-blur-sm">
            {/* Modal Container */}
            <motion.div
              id="licensing-modal-box"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-[480px] bg-black border border-zinc-900 text-[#D9D6CA] p-6 sm:p-8 flex flex-col items-center select-none font-mono text-center shadow-2xl rounded-2xl"
            >
              {/* Header section with Choose Contract Type and Close button */}
              <div className="w-full flex items-center justify-between border-b border-zinc-900 pb-4 mb-5">
                <h3 className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#D6C291] uppercase">
                  CHOOSE CONTRACT TYPE
                </h3>
                <button
                  onClick={() => {
                    setShowLicensePanel(false);
                    setSelectedTier(null);
                    setLicenseSuccess(false);
                    setClientEmail("");
                  }}
                  className="text-[#D9D6CA]/40 hover:text-white font-mono text-base cursor-pointer border-0 bg-transparent p-1 transition-colors outline-none"
                  title="Exit clearance state"
                >
                  ✕
                </button>
              </div>

              <div className="w-full flex flex-col items-center">
                
                {/* 2. Beautiful owl artwork representing fragment artwork */}
                <div className="relative w-44 h-44 border border-zinc-900 bg-black/40 flex flex-col items-center justify-center rounded-2xl mb-4 group overflow-hidden shadow-xl">
                  <img
                    src={owlBgImage}
                    alt="The Sentinel Owl"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700 pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
                  
                  <span className="text-[8px] font-mono tracking-[0.25em] text-[#D6C291] absolute bottom-3 uppercase select-none pointer-events-none z-10 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    FTO SECURE RECORDER
                  </span>
                  
                  {/* Subtle active / playing sound waves */}
                  {isPlayingBeat && (
                    <div className="absolute inset-x-0 bottom-7 flex items-end justify-center gap-1 z-10">
                      <span className="w-[1.5px] h-3 bg-[#D6C291]/80 origin-bottom animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-[1.5px] h-5 bg-[#D6C291]/80 origin-bottom animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <span className="w-[1.5px] h-2 bg-[#D6C291]/80 origin-bottom animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>
                  )}
                </div>

                {/* 5. Decorative border */}
                <div className="w-full h-[1px] bg-zinc-900/40 mt-4 mb-5" />

                {/* 6. MIDDLE CONTAINER: EITHER THE TIERS LIST OR SUCCESS CONTENT */}
                <div className="w-full min-h-[140px] flex flex-col justify-center">
                  {licenseSuccess ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full py-8 text-center flex flex-col items-center bg-zinc-950/45 border border-zinc-900 rounded-2xl p-6"
                    >
                      <span className="text-[11px] font-bold text-emerald-500 tracking-[0.25em] uppercase mb-3">
                        ✓ SECURED & REGISTERED
                      </span>
                      <p className="text-[10px] sm:text-xs text-[#D9D6CA]/80 tracking-[0.14em] leading-relaxed font-light font-mono">
                        Contract calibration metrics dispatched to:<br />
                        <span className="text-white font-bold block mt-2 text-sm select-all">{clientEmail}</span>
                      </p>
                      <button
                        onClick={() => {
                          setLicenseSuccess(false);
                          setSelectedTier(null);
                          setClientEmail("");
                        }}
                        className="mt-6 text-[10px] tracking-[0.2em] font-bold text-[#D6C291] bg-transparent border border-zinc-900 hover:border-[#D6C291]/30 hover:bg-zinc-950 rounded-lg px-4 py-2 uppercase transition-all duration-300"
                      >
                        RESET VAULT
                      </button>
                    </motion.div>
                  ) : (
                    <>
                      {/* List of 4 cards representing the updated user clearance tiers */}
                      <div className="w-full space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {CONTRACT_TIERS.map((tier) => {
                          const isSelected = selectedTier === tier.id;
                          const isExpanded = !!expandedTerms[tier.id];
                          return (
                            <div
                              key={tier.id}
                              onClick={() => setSelectedTier(tier.id)}
                              className={`w-full bg-[#101010]/30 border rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden flex flex-col cursor-pointer ${
                                isSelected
                                  ? "border-[#D6C291] shadow-[0_0_15px_rgba(214,194,145,0.12)] bg-[#12110e]/50"
                                  : "border-zinc-900/60 hover:border-zinc-800"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col min-w-0 pr-3">
                                  <span className={`font-serif tracking-wide text-xs sm:text-sm font-medium ${isSelected ? "text-white" : "text-[#D9D6CA]/90"}`}>
                                    {tier.title}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 tracking-widest font-mono uppercase mt-1">
                                    {tier.subtitle}
                                  </span>
                                </div>
                                
                                {/* Gold Price Pill Button with lock */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onAddToCart) {
                                      onAddToCart(matchedFrag, tier.id, tier.title, tier.price);
                                    }
                                    setShowLicensePanel(false);
                                    setSelectedTier(null);
                                    setClientEmail("");
                                  }}
                                  className="bg-[#D6C291] hover:bg-white text-black font-sans font-bold text-[10px] sm:text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all duration-300 shrink-0 shadow-[0_0_8px_rgba(214,194,145,0.2)]"
                                >
                                  <Lock size={10} strokeWidth={2.5} className="text-black shrink-0" />
                                  <span>{tier.price}</span>
                                </button>
                              </div>
                              
                              {/* Show Usage terms button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTerms(prev => ({ ...prev, [tier.id]: !prev[tier.id] }));
                                }}
                                className="text-[9px] font-mono tracking-widest text-[#D6C291]/70 hover:text-white mt-3 flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-left py-0.5 select-none font-bold"
                              >
                                <span>{isExpanded ? "▲ HIDE DETAILS" : "▼ SHOW DETAILS"}</span>
                              </button>
                              
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="mt-3 text-[10px] leading-relaxed text-[#D9D6CA]/80 font-mono border-t border-zinc-900/40 pt-3 select-text space-y-3"
                                  >
                                    {tier.includes && tier.includes.length > 0 && (
                                      <div>
                                        <div className="text-[#D6C291]/90 font-bold tracking-wider text-[9px] uppercase mb-1">
                                          Includes:
                                        </div>
                                        <ul className="list-disc pl-4 space-y-0.5 text-[#D9D6CA]/70">
                                          {tier.includes.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {tier.restrictions && tier.restrictions.length > 0 && (
                                      <div>
                                        <div className="text-red-400/80 font-bold tracking-wider text-[9px] uppercase mb-1">
                                          Restrictions:
                                        </div>
                                        <ul className="list-disc pl-4 space-y-0.5 text-[#D9D6CA]/50">
                                          {tier.restrictions.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {tier.extraNote && (
                                      <div className="text-[#D6C291]/60 text-[9px] italic pt-1 border-t border-zinc-900/20 leading-relaxed">
                                        {tier.extraNote}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>

                      {/* Email input field appears if a tier is selected */}
                      <AnimatePresence>
                        {selectedTier && (
                          <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleAcquireLicense}
                            className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 mt-4 text-left font-mono"
                          >
                            <div className="flex justify-between items-center text-[10px] tracking-wider mb-2">
                              <span className="text-[#D9D6CA]/40 uppercase">CONTRACT RESERVED</span>
                              <span className="text-white font-bold">{CONTRACT_TIERS.find(t => t.id === selectedTier)?.title}</span>
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-[8px] text-[#D6C291]/80 tracking-widest block uppercase font-bold">
                                ENTER VAULT CREDIT EMAIL
                              </label>
                              <input
                                type="email"
                                required
                                placeholder="vault@credentials.local"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                className="w-full bg-black border border-zinc-900 text-center py-2.5 px-3 text-xs outline-none text-[#D9D6CA] focus:border-[#D6C291]/40 placeholder:text-zinc-800 tracking-wider font-mono rounded-lg"
                              />
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>

                {/* 7. Bottom active button triggers final action */}
                {!licenseSuccess && (
                  <div className="w-full mt-5">
                    <button
                      type="button"
                      onClick={(e) => {
                        if (!selectedTier) return;
                        if (!clientEmail) {
                          const inputEl = document.querySelector('input[type="email"]') as HTMLInputElement;
                          if (inputEl) inputEl.focus();
                          return;
                        }
                        handleAcquireLicense(e);
                      }}
                      disabled={!selectedTier || isProcessingLicense}
                      className={`w-full border py-3.5 tracking-[0.25em] uppercase font-mono text-xs transition-all duration-300 flex items-center justify-center gap-2 rounded-xl ${
                        selectedTier
                          ? "border-[#D6C291] bg-neutral-950/80 text-[#D6C291] hover:bg-[#D6C291] hover:text-black cursor-pointer shadow-[0_0_15px_rgba(214,194,145,0.1)]"
                          : "border-zinc-900 bg-neutral-950 text-zinc-600 cursor-not-allowed"
                      }`}
                    >
                      {isProcessingLicense ? (
                        <span>PROCESSING...</span>
                      ) : (
                        <span>&lt; REQUEST CLEARANCE →</span>
                      )}
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
