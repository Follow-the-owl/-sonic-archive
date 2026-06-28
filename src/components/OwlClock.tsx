import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, RefreshCw, X, ChevronUp, ChevronDown, ShoppingBag, Mail, Download, Play, Pause, Lock } from "lucide-react";
import { FRAGMENTS, Fragment } from "../data";
import { playFragment, stopAudio, getActiveId, registerAudioCallback, playOwlResonance, playCalibrationDenied, playCalibrationSuccess, playTickSound } from "../audio";
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
    label: "FRAGMENT 07:46 AM",
    mappedId: "07:46",
    synthType: "pulse",
    frequency: 329.63,
    description: "Radioactive forest canopies. Outlaw radio transmission oscillating through early fog."
  },
  {
    id: "frag-3",
    label: "FRAGMENT 02:17 AM",
    mappedId: "02:17",
    synthType: "keys",
    frequency: 293.66,
    description: "Cold copper shortwave signals found floating under the concrete radio tower shadow."
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
    label: "FRAGMENT 03:33 AM",
    mappedId: "03:33",
    synthType: "bell",
    frequency: 220,
    description: "High-energy industrial watch hour. Dark machine rumbles and hollow metal tolls."
  },
  {
    id: "frag-6",
    label: "FRAGMENT 10:14 PM",
    mappedId: "10:14",
    synthType: "drone",
    frequency: 98.0,
    description: "Dark ambient sub-harmonic landscape reflecting security chambers and chrome steel finishes."
  },
  {
    id: "frag-7",
    label: "FRAGMENT 11:28 PM",
    mappedId: "11:28",
    synthType: "drone",
    frequency: 196.0,
    description: "Chrono motorcycle anthem. Majestic tape-saturated synthesizer spanning miles of empty road."
  },
  {
    id: "frag-8",
    label: "FRAGMENT 11:59 PM",
    mappedId: "11:59",
    synthType: "keys",
    frequency: 440,
    description: "A beautiful, decaying celestial chord sequence played on vintage magnetic tape reels."
  },
  {
    id: "frag-9",
    label: "FRAGMENT 11:28 PM",
    mappedId: "11:28-alt",
    synthType: "noise",
    frequency: 164.81,
    description: "Saturated analog tape-static pulsing like a dark motorcycle rev. Raw and heavy."
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

  // Scroll wheel states
  const [pickedHour, setPickedHour] = useState<number | null>(null);
  const [pickedMinute, setPickedMinute] = useState<number | null>(null);
  const [pickedAMPM, setPickedAMPM] = useState<"AM" | "PM" | null>(null);
  const [isManual, setIsManual] = useState<boolean>(false);
  const [calibrationState, setCalibrationState] = useState<"idle" | "calibrating" | "available" | "restricted">("idle");

  // Tactile drag calibration state
  const dragStartRef = useRef<{ y: number; val: number } | null>(null);
  const ribbonDragStartRef = useRef<{ x: number; totalMinutes: number } | null>(null);

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
    if (activePlayId) {
      const activeFrag = CLOCK_FRAGMENTS.find(f => f.id === activePlayId);
      if (activeFrag) {
        const cleaned = activeFrag.label.replace("FRAGMENT ", "").trim(); // "02:17 AM"
        const [timeStr, ampmStr] = cleaned.split(" ");
        const [hStr, mStr] = timeStr.split(":");
        let h = parseInt(hStr, 10) % 12;
        setPickedHour(h);
        setPickedMinute(parseInt(mStr, 10));
        setPickedAMPM((ampmStr || "AM") as "AM" | "PM");
        setIsManual(false); // reset manual if user switched to playing a different signal row
        setCalibrationState("available");
      }
    } else if (!isManual) {
      let h = currentTime.getHours();
      const am = h >= 12 ? "PM" : "AM";
      h = h % 12;
      setPickedHour(h);
      setPickedMinute(currentTime.getMinutes());
      setPickedAMPM(am);
    }
  }, [activePlayId, currentTime, isManual]);

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
  const displayHour = pickedHour !== null ? pickedHour : (activeFragment ? 2 : currentTime.getHours() % 12);
  const displayMinute = pickedMinute !== null ? pickedMinute : (activeFragment ? 17 : currentTime.getMinutes());
  const displayAMPM = pickedAMPM !== null ? pickedAMPM : (activeFragment ? "AM" : (currentTime.getHours() >= 12 ? "PM" : "AM"));

  const prevHour = displayHour === 0 ? 11 : displayHour - 1;
  const prevMinute = displayMinute === 0 ? 59 : displayMinute - 1;
  const nextHour = displayHour === 11 ? 0 : displayHour + 1;
  const nextMinute = displayMinute === 59 ? 0 : displayMinute + 1;
  const fmt = (num: number) => String(num).padStart(2, "0");

  // Wheel interaction event handlers
  const handleScrollHour = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsManual(true);
    setCalibrationState("idle");
    const step = e.deltaY > 0 ? 1 : -1;
    let next = displayHour + step;
    if (next > 11) next = 0;
    if (next < 0) next = 11;
    setPickedHour(next);
  };

  const handleScrollMinute = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsManual(true);
    setCalibrationState("idle");
    const step = e.deltaY > 0 ? 1 : -1;
    let next = displayMinute + step;
    if (next > 59) next = 0;
    if (next < 0) next = 59;
    setPickedMinute(next);
  };

  const handleScrollAMPM = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsManual(true);
    setCalibrationState("idle");
    setPickedAMPM(displayAMPM === "AM" ? "PM" : "AM");
  };

  const handleHourClick = (h: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsManual(true);
    setCalibrationState("idle");
    setPickedHour(h);
    playTickSound("high");
  };

  const handleMinuteClick = (m: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsManual(true);
    setCalibrationState("idle");
    setPickedMinute(m);
    playTickSound("low");
  };

  const handleAMPMClick = (ampm: "AM" | "PM", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsManual(true);
    setCalibrationState("idle");
    setPickedAMPM(ampm);
    playTickSound("high");
  };

  // Tactile Direct Digit Drag Handlers
  const handleDigitTouchStart = (e: React.TouchEvent | React.MouseEvent, type: "hour" | "minute") => {
    setIsManual(true);
    setCalibrationState("idle");
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const startVal = type === "hour" ? displayHour : displayMinute;
    dragStartRef.current = { y: clientY, val: startVal };
  };

  const handleDigitTouchMove = (e: React.TouchEvent | React.MouseEvent, type: "hour" | "minute") => {
    if (!dragStartRef.current) return;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const deltaY = dragStartRef.current.y - clientY;
    const stepSize = 12; // pixels per increment
    const steps = Math.round(deltaY / stepSize);
    if (steps !== 0) {
      if (type === "hour") {
        let next = (dragStartRef.current.val + steps) % 12;
        if (next < 0) next += 12;
        if (next !== displayHour) {
          setPickedHour(next);
          playTickSound(next % 3 === 0 ? "low" : "high");
          dragStartRef.current.y -= steps * stepSize;
        }
      } else {
        let next = (dragStartRef.current.val + steps) % 60;
        if (next < 0) next += 60;
        if (next !== displayMinute) {
          setPickedMinute(next);
          playTickSound(next % 5 === 0 ? "low" : "high");
          dragStartRef.current.y -= steps * stepSize;
        }
      }
    }
  };

  const handleDigitTouchEnd = () => {
    dragStartRef.current = null;
  };

  // Tactile Ribbon Scroll Handlers (Apple Crown / Bezel Simulation)
  const handleRibbonTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsManual(true);
    setCalibrationState("idle");
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const currentTotalMinutes = displayHour * 60 + displayMinute + (displayAMPM === "PM" ? 720 : 0);
    ribbonDragStartRef.current = { x: clientX, totalMinutes: currentTotalMinutes };
  };

  const handleRibbonTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!ribbonDragStartRef.current) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - ribbonDragStartRef.current.x;
    const stepSize = 8; // 8 pixels of horizontal swipe equals 1 minute shift
    const steps = Math.round(deltaX / stepSize);
    if (steps !== 0) {
      const nextTotalMinutes = (ribbonDragStartRef.current.totalMinutes + steps + 1440) % 1440;
      const newHour24 = Math.floor(nextTotalMinutes / 60);
      const newMin = nextTotalMinutes % 60;
      const ampm = newHour24 >= 12 ? "PM" : "AM";
      const h12 = newHour24 % 12;

      if (h12 !== displayHour || newMin !== displayMinute || ampm !== displayAMPM) {
        setPickedHour(h12);
        setPickedMinute(newMin);
        setPickedAMPM(ampm);
        playTickSound(newMin % 5 === 0 ? "low" : "high");
        ribbonDragStartRef.current.x += steps * stepSize;
      }
    }
  };

  const handleRibbonTouchEnd = () => {
    ribbonDragStartRef.current = null;
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

  const exactClockFragment = CLOCK_FRAGMENTS.find(item => {
    const cleaned = item.label.replace("FRAGMENT ", "").trim(); // "02:17 AM"
    const [timeStr, ampmStr] = cleaned.split(" ");
    const [hStr, mStr] = timeStr.split(":");
    let itemH = parseInt(hStr, 10) % 12;
    const itemAMPM = (ampmStr || "AM") as "AM" | "PM";
    return itemH === displayHour && itemAMPM === displayAMPM;
  });

  const exactActualFrag = exactClockFragment
    ? (FRAGMENTS.find(f => f.id === exactClockFragment.mappedId) || null)
    : null;

  const handleImmediateCheck = () => {
    if (exactClockFragment) {
      setCalibrationState("available");
      playCalibrationSuccess();
    } else {
      setCalibrationState("restricted");
      playCalibrationDenied();
    }
  };

  // Automatically search and calibrate when user stops interacting (finishes interaction)
  useEffect(() => {
    if (!isManual) return;

    setCalibrationState("idle");

    const timer = setTimeout(() => {
      if (exactClockFragment) {
        setCalibrationState("available");
        playCalibrationSuccess();
      } else {
        setCalibrationState("restricted");
        playCalibrationDenied();
      }
    }, 750); // 750ms of inactivity represents finishing interaction

    return () => clearTimeout(timer);
  }, [displayHour, displayMinute, displayAMPM, isManual, exactClockFragment]);

  const handleTransmit = () => {
    if (exactActualFrag && onSelectFragment) {
      onSelectFragment(exactActualFrag);
    }
  };

  const currentClockItem = CLOCK_FRAGMENTS.find(item => item.id === activePlayId) || CLOCK_FRAGMENTS[2]; // fallback to 02:17 AM
  const matchedFrag = FRAGMENTS.find(f => f.id === currentClockItem.mappedId) || FRAGMENTS[2];
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
      className="relative w-full h-full bg-black text-[#D9D6CA] flex flex-col justify-between items-center px-4 py-2 select-none overflow-hidden"
    >
      {/* 1. Subtle global focus vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,10,12,0.15)_0%,rgba(0,0,0,1)_80%)] pointer-events-none z-0" />

      {/* 2. THE MAIN WRAPPER */}
      <div className="relative w-full max-w-xl h-full z-10 mx-auto flex flex-col items-center justify-between min-h-0 py-1">
        
        {/* CLOCK WHEEL SELECTOR SECTION - EXACTLY LIKE ATTACHED IMAGE */}
        <div className="w-full flex flex-col items-center relative z-20">
          
          <div 
            onClick={handleImmediateCheck}
            className="relative w-full max-w-[260px] flex items-center justify-center gap-4 sm:gap-6 font-mono select-none overflow-hidden py-1.5 cursor-pointer"
          >
            {/* Column 1: HOUR */}
            <div 
              onWheel={handleScrollHour}
              onMouseDown={(e) => handleDigitTouchStart(e, "hour")}
              onMouseMove={(e) => handleDigitTouchMove(e, "hour")}
              onMouseUp={handleDigitTouchEnd}
              onMouseLeave={handleDigitTouchEnd}
              onTouchStart={(e) => handleDigitTouchStart(e, "hour")}
              onTouchMove={(e) => handleDigitTouchMove(e, "hour")}
              onTouchEnd={handleDigitTouchEnd}
              className="flex flex-col items-center justify-center h-20 text-center cursor-ns-resize z-10 w-12 select-none"
            >
              {/* Prev Hour */}
              <button
                type="button"
                onClick={(e) => handleHourClick(prevHour, e)}
                className="text-[#D9D6CA]/15 text-lg sm:text-xl h-6 flex items-center justify-center transition-all duration-300 hover:text-[#D9D6CA]/50 bg-transparent border-0 outline-none cursor-pointer select-none font-mono"
              >
                {fmt(prevHour)}
              </button>
              {/* Target Hour */}
              <motion.div
                animate={{
                  opacity: [0.65, 1, 0.65],
                  filter: [
                    "drop-shadow(0 0 0px rgba(217, 214, 202, 0))",
                    "drop-shadow(0 0 5px rgba(217, 214, 202, 0.85))",
                    "drop-shadow(0 0 0px rgba(217, 214, 202, 0))"
                  ],
                  scale: [0.98, 1.04, 0.98]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-white font-bold text-2xl sm:text-3xl h-8 flex items-center justify-center tracking-wide select-none font-mono pointer-events-none"
              >
                {fmt(displayHour)}
              </motion.div>
              {/* Next Hour */}
              <button
                type="button"
                onClick={(e) => handleHourClick(nextHour, e)}
                className="text-[#D9D6CA]/15 text-lg sm:text-xl h-6 flex items-center justify-center transition-all duration-300 hover:text-[#D9D6CA]/50 bg-transparent border-0 outline-none cursor-pointer select-none font-mono"
              >
                {fmt(nextHour)}
              </button>
            </div>

            {/* Separator: Colon */}
            <div className="flex flex-col items-center justify-center h-20 text-center z-10 select-none w-4">
              <div className="text-transparent h-6 flex items-center justify-center select-none text-lg sm:text-xl">:</div>
              <motion.div
                animate={{
                  opacity: [0.65, 1, 0.65],
                  filter: [
                    "drop-shadow(0 0 0px rgba(217, 214, 202, 0))",
                    "drop-shadow(0 0 5px rgba(217, 214, 202, 0.85))",
                    "drop-shadow(0 0 0px rgba(217, 214, 202, 0))"
                  ],
                  scale: [0.98, 1.04, 0.98]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-white font-bold text-2xl sm:text-3xl h-8 flex items-center justify-center"
              >
                :
              </motion.div>
              <div className="text-transparent h-6 flex items-center justify-center select-none text-lg sm:text-xl">:</div>
            </div>

            {/* Column 2: MINUTE */}
            <div 
              onWheel={handleScrollMinute}
              onMouseDown={(e) => handleDigitTouchStart(e, "minute")}
              onMouseMove={(e) => handleDigitTouchMove(e, "minute")}
              onMouseUp={handleDigitTouchEnd}
              onMouseLeave={handleDigitTouchEnd}
              onTouchStart={(e) => handleDigitTouchStart(e, "minute")}
              onTouchMove={(e) => handleDigitTouchMove(e, "minute")}
              onTouchEnd={handleDigitTouchEnd}
              className="flex flex-col items-center justify-center h-20 text-center cursor-ns-resize z-10 w-12 select-none"
            >
              {/* Prev Minute */}
              <button
                type="button"
                onClick={(e) => handleMinuteClick(prevMinute, e)}
                className="text-[#D9D6CA]/15 text-lg sm:text-xl h-6 flex items-center justify-center transition-all duration-300 hover:text-[#D9D6CA]/50 bg-transparent border-0 outline-none cursor-pointer select-none font-mono"
              >
                {fmt(prevMinute)}
              </button>
              {/* Target Minute */}
              <motion.div
                animate={{
                  opacity: [0.65, 1, 0.65],
                  filter: [
                    "drop-shadow(0 0 0px rgba(217, 214, 202, 0))",
                    "drop-shadow(0 0 5px rgba(217, 214, 202, 0.85))",
                    "drop-shadow(0 0 0px rgba(217, 214, 202, 0))"
                  ],
                  scale: [0.98, 1.04, 0.98]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-white font-bold text-2xl sm:text-3xl h-8 flex items-center justify-center tracking-wide select-none font-mono pointer-events-none"
              >
                {fmt(displayMinute)}
              </motion.div>
              {/* Next Minute */}
              <button
                type="button"
                onClick={(e) => handleMinuteClick(nextMinute, e)}
                className="text-[#D9D6CA]/15 text-lg sm:text-xl h-6 flex items-center justify-center transition-all duration-300 hover:text-[#D9D6CA]/50 bg-transparent border-0 outline-none cursor-pointer select-none font-mono"
              >
                {fmt(nextMinute)}
              </button>
            </div>

            {/* Column 3: MERIDIEM (AM/PM) */}
            <div 
              onWheel={handleScrollAMPM}
              className="flex flex-col items-center justify-center h-20 text-center cursor-ns-resize z-10 w-16"
            >
              {/* Prev AM/PM */}
              <button
                type="button"
                onClick={(e) => handleAMPMClick(displayAMPM === "AM" ? "PM" : "AM", e)}
                className="text-[#D9D6CA]/15 text-sm sm:text-base h-6 flex items-center justify-center tracking-wider transition-all duration-300 hover:text-[#D9D6CA]/50 bg-transparent border-0 outline-none cursor-pointer select-none font-mono"
              >
                {displayAMPM === "AM" ? "PM" : "AM"}
              </button>
              {/* Target AM/PM */}
              <motion.div
                animate={{
                  opacity: [0.65, 1, 0.65],
                  filter: [
                    "drop-shadow(0 0 0px rgba(217, 214, 202, 0))",
                    "drop-shadow(0 0 5px rgba(217, 214, 202, 0.85))",
                    "drop-shadow(0 0 0px rgba(217, 214, 202, 0))"
                  ],
                  scale: [0.98, 1.04, 0.98]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-white font-bold text-xl sm:text-2xl h-8 flex items-center justify-center tracking-wider select-none font-mono"
              >
                {displayAMPM}
              </motion.div>
              {/* Next AM/PM */}
              <button
                type="button"
                onClick={(e) => handleAMPMClick(displayAMPM === "AM" ? "PM" : "AM", e)}
                className="text-[#D9D6CA]/15 text-sm sm:text-base h-6 flex items-center justify-center tracking-wider transition-all duration-300 hover:text-[#D9D6CA]/50 bg-transparent border-0 outline-none cursor-pointer select-none font-mono"
              >
                {displayAMPM === "AM" ? "PM" : "AM"}
              </button>
            </div>
          </div>

          {/* TACTILE BEZEL CALIBRATION RIBBON (Apple Crown / Ruler Simulation) */}
          <div className="w-full max-w-[280px] mt-1 mb-2.5 flex flex-col items-center select-none relative z-30">
            <span className="text-[8px] font-mono tracking-[0.25em] text-[#D9D6CA]/30 uppercase mb-1.5">BEZEL CALIBRATION DIAL</span>
            <div 
              onMouseDown={(e) => handleRibbonTouchStart(e)}
              onMouseMove={(e) => handleRibbonTouchMove(e)}
              onMouseUp={handleRibbonTouchEnd}
              onMouseLeave={handleRibbonTouchEnd}
              onTouchStart={(e) => handleRibbonTouchStart(e)}
              onTouchMove={(e) => handleRibbonTouchMove(e)}
              onTouchEnd={handleRibbonTouchEnd}
              className="relative w-full h-9 border border-zinc-900/80 bg-zinc-950/60 rounded-md flex items-center justify-center cursor-ew-resize overflow-hidden shadow-inner"
            >
              {/* Left/Right ambient fades */}
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black via-black/60 to-transparent pointer-events-none z-10" />
              
              {/* Sliding notch ticks */}
              <div className="flex gap-[6px] items-center justify-center h-full opacity-65 pointer-events-none">
                {Array.from({ length: 27 }).map((_, idx) => {
                  const tickOffset = idx - 13;
                  const currentTickMin = (displayMinute + tickOffset + 60) % 60;
                  const isMajor = currentTickMin % 5 === 0;
                  return (
                    <div 
                      key={idx} 
                      className={`w-[1px] transition-all duration-100 ${
                        tickOffset === 0 
                          ? "h-5 bg-[#D9D6CA] w-[1.5px] shadow-[0_0_8px_rgba(217,214,202,0.8)]" 
                          : isMajor 
                            ? "h-3.5 bg-[#D9D6CA]/45" 
                            : "h-2 bg-zinc-800"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Center target cursor */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-[#D9D6CA] shadow-[0_0_6px_rgba(217,214,202,0.9)] pointer-events-none z-20" />
            </div>
            <div className="w-full flex justify-between text-[7px] font-mono text-[#D9D6CA]/30 px-1 mt-1">
              <span>- SUB 15M</span>
              <span className="text-[#D9D6CA]/40 font-bold tracking-widest uppercase">DRAG LEFT OR RIGHT TO ADJUST</span>
              <span>+ ADD 15M</span>
            </div>
          </div>

          {/* Action indicator - extremely minimal */}
          <div className="mt-1 w-full max-w-[280px] h-[36px] flex items-center justify-center">
            {calibrationState === "available" && (
              <button
                onClick={handleTransmit}
                className="w-full bg-[#D9D6CA] hover:bg-white text-black font-sans font-bold text-[11px] tracking-widest uppercase py-2 px-4 rounded-[4px] cursor-pointer transition-all duration-200 animate-pulse shadow-[0_0_15px_rgba(217,214,202,0.35)] flex items-center justify-center gap-1.5"
              >
                <span>TRANSMIT SIGNAL</span>
                <span className="font-mono text-[9px]">&gt;</span>
              </button>
            )}

            {calibrationState === "restricted" && (
              <div className="text-red-500/90 text-xs tracking-[0.2em] uppercase font-mono font-bold animate-pulse">
                it is restricted
              </div>
            )}
          </div>
        </div>

        {/* Beautiful framed Owl image in standard layout flow - no timer overlay! */}
        <div className="flex-grow w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] flex items-center justify-center py-2 min-h-0 relative z-10">
          <motion.div 
            className="w-full aspect-[16/10] relative rounded-xl border border-zinc-900/60 overflow-hidden cursor-pointer bg-black/40 group shadow-2xl flex items-center justify-center"
            style={{
              rotateX,
              rotateY,
              perspective: 1200
            }}
            onClick={handleOwlCall}
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
              className="w-full h-full object-cover opacity-85 pointer-events-none select-none animate-fade-in"
            />
            {/* Gradients to blend seamless with black background on all sides */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black to-transparent pointer-events-none" />
          </motion.div>
        </div>

        {/* 3. ELEGANT WRITEUP: RECOVER A FRAGMENT FROM TIME */}
        <div className="w-full flex flex-col items-center gap-2 z-20 pb-2 pointer-events-none">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="text-[12px] sm:text-[13px] md:text-[14px] font-bold tracking-[0.65em] text-[#D9D6CA] uppercase font-mono text-center select-none"
          >
            RECOVER A FRAGMENT FROM TIME
          </motion.h2>

          {/* Hairline spacer with central hollow ring target */}
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.5, scaleX: 1 }}
            transition={{ duration: 1.8, delay: 0.5 }}
            className="flex items-center justify-center gap-3 w-[160px] sm:w-[200px]"
          >
            <div className="h-[1.2px] flex-grow bg-gradient-to-r from-transparent to-[#D9D6CA]/30" />
            {/* Perfectly rendering a sharp geometric miter-joined triangle that glows slowly with organic breathing */}
            <motion.svg
              viewBox="0 0 12 12"
              className="w-[11px] h-[11px] text-[#D9D6CA] flex-shrink-0"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{
                opacity: [0.35, 1, 0.35],
                filter: [
                  "drop-shadow(0 0 0px rgba(217, 214, 202, 0))",
                  "drop-shadow(0 0 4px rgba(217, 214, 202, 0.85))",
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
            <div className="h-[1.2px] flex-grow bg-gradient-to-l from-transparent to-[#D9D6CA]/30" />
          </motion.div>
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
