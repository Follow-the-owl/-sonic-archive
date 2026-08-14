import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, RefreshCw, X, ChevronUp, ChevronDown, Package, Mail, Download, Play, Pause, Lock } from "lucide-react";
import { FRAGMENTS, Fragment } from "../data";
import { stopAudio, getActiveId, registerAudioCallback, playTickSound } from "../audio";
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
    id: "frag-0941",
    label: "FRAGMENT 09:41 PM",
    mappedId: "09:41",
    synthType: "keys",
    frequency: 246.94,
    description: "Time Capsule Entry 0941. High-fidelity recovered tape fragment carrying a B Major tonal axis at 103 BPM."
  },
  {
    id: "frag-10",
    label: "FRAGMENT 10:00 PM",
    mappedId: "10:00",
    synthType: "keys",
    frequency: 311.13,
    description: "Lomon Recovery. Pure E♭ Major harmonic pulse, compiled and certified under Archivist Lomon's protocols."
  },
  {
    id: "frag-1111",
    label: "FRAGMENT 11:11 PM",
    mappedId: "11:11",
    synthType: "keys",
    frequency: 440,
    description: "Last Laugh Echoes. Rare celestial fragments decaying inside vintage tape reels at 125 BPM."
  },
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

interface WheelDrumProps {
  value: any;
  options: any[];
  onChange: (val: any) => void;
  format?: (val: any) => string;
  loop?: boolean;
}

function WheelDrum({ value, options, onChange, format = (v) => String(v), loop = true }: WheelDrumProps) {
  const selectedIndex = options.indexOf(value);
  const currentIdx = selectedIndex === -1 ? 0 : selectedIndex;
  const itemHeight = 36;
  const radius = 56;

  const [localOffset, setLocalOffset] = useState(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;
  const lastTickIndexRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalOffset(0);
    lastTickIndexRef.current = null;
  }, [value]);

  const startDrag = (clientY: number) => {
    isDragging.current = true;
    dragStartY.current = clientY;
    lastTickIndexRef.current = currentIdx;
  };

  const moveDrag = (clientY: number) => {
    if (!isDragging.current) return;
    const deltaY = clientY - dragStartY.current;
    setLocalOffset(deltaY);

    const indexOffset = Math.round(-deltaY / itemHeight);
    const rawTarget = currentIdxRef.current + indexOffset;
    let targetIdx = rawTarget % options.length;
    if (targetIdx < 0) targetIdx += options.length;

    if (lastTickIndexRef.current !== targetIdx) {
      lastTickIndexRef.current = targetIdx;
    }
  };

  const endDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const indexOffset = Math.round(-localOffset / itemHeight);
    let targetIdx = (currentIdxRef.current + indexOffset) % options.length;
    if (targetIdx < 0) targetIdx += options.length;

    setLocalOffset(0);
    onChange(options[targetIdx]);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const direction = e.deltaY > 0 ? 1 : -1;
    let targetIdx = (currentIdx + direction) % options.length;
    if (targetIdx < 0) targetIdx += options.length;
    onChange(options[targetIdx]);
  };

  const handleItemClick = (idx: number) => {
    if (idx !== currentIdx) {
      onChange(options[idx]);
    }
  };

  const virtualScrollPos = currentIdx - (localOffset / itemHeight);

  return (
    <div 
      onWheel={handleWheel}
      onTouchStart={(e) => startDrag(e.touches[0].clientY)}
      onTouchMove={(e) => moveDrag(e.touches[0].clientY)}
      onTouchEnd={endDrag}
      onMouseDown={(e) => startDrag(e.clientY)}
      onMouseMove={(e) => {
        if (isDragging.current) {
          moveDrag(e.clientY);
        }
      }}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      className="relative h-32 w-20 sm:w-24 flex items-center justify-center overflow-hidden cursor-ns-resize select-none touch-none"
      style={{ perspective: "1000px" }}
    >
      {/* Rotating drum list */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        {options.map((option, idx) => {
          let diff = idx - virtualScrollPos;
          const len = options.length;

          if (loop) {
            const half = len / 2;
            while (diff > half) diff -= len;
            while (diff < -half) diff += len;
          }

          if (Math.abs(diff) > 2.5) return null;

          const angle = diff * 28;
          const opacity = Math.max(0.12, 1 - Math.abs(diff) * 0.42);
          const scale = 1 - Math.abs(diff) * 0.08;

          return (
            <div
              key={idx}
              onClick={() => handleItemClick(idx)}
              className={`absolute text-center select-none font-mono cursor-pointer transition-colors duration-150 ${
                Math.abs(diff) < 0.4 
                  ? "text-white font-bold text-2xl sm:text-3xl drop-shadow-[0_0_8px_rgba(217,214,202,0.5)]" 
                  : "text-[#D9D6CA]/15 text-lg sm:text-xl"
              }`}
              style={{
                transform: `rotateX(${-angle}deg) translateZ(${radius}px)`,
                opacity,
                scale,
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                height: `${itemHeight}px`,
                lineHeight: `${itemHeight}px`,
              }}
            >
              {format(option)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OwlClock({ onSelectFragment, onAddToCart }: OwlClockProps) {
  const recoveredSectionRef = useRef<HTMLDivElement>(null);
  const [activePlayId, setActivePlayId] = useState<string | null>(getActiveId());
  const [fragments, setFragments] = useState<Fragment[]>(FRAGMENTS);

  // Guarantee complete silence on Owl Clock page mount
  useEffect(() => {
    stopAudio();
  }, []);

  useEffect(() => {
    fetch("/api/fragments")
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.fragments) && data.fragments.length > 0) {
          setFragments(data.fragments);
        }
      })
      .catch(() => {
        // Gracefully keep pre-loaded local FRAGMENTS
      });
  }, []);
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
      title: "Archive Access License", 
      price: "$150", 
      subtitle: "For songwriting, demos, rehearsals, and private creative development.", 
      description: "For songwriting, demos, rehearsals, and private creative development.",
      usageTerms: [
        "Tagged Reference MP3",
        "Watermarked WAV",
        "Archive Access Certificate",
        "No commercial release",
        "No distribution",
        "No monetization",
        "No public exploitation"
      ],
      buttonText: "REQUEST ACCESS — $150"
    },
    { 
      id: "release", 
      title: "Commercial Release License", 
      price: "$500", 
      subtitle: "For approved commercial releases on digital music platforms.", 
      description: "For approved commercial releases on digital music platforms.",
      usageTerms: [
        "High-Resolution WAV",
        "Reference MP3",
        "License Agreement",
        "Metadata Package",
        "Clearance Certificate",
        "Commercial distribution permitted within the executed agreement"
      ],
      buttonText: "REQUEST LICENSE — $500"
    },
    { 
      id: "commercial", 
      title: "Commercial Exploitation License", 
      price: "$1,000", 
      subtitle: "For professional releases, monetized content, live performance, and promotional use.", 
      description: "For professional releases, monetized content, live performance, and promotional use.",
      usageTerms: [
        "High-Resolution WAV",
        "Production Stems",
        "License Agreement",
        "Metadata Package",
        "Documentation Package",
        "Clearance Certificate",
        "Commercial use permitted within the executed agreement"
      ],
      buttonText: "REQUEST LICENSE — $1,000"
    },
    { 
      id: "sync", 
      title: "Synchronization & Master License", 
      price: "CUSTOM PROPOSAL", 
      subtitle: "For film, television, advertising, brand campaigns, games, and broadcast media.", 
      description: "For film, television, advertising, brand campaigns, games, and broadcast media.",
      usageTerms: [
        "Project-Specific License",
        "Approved Media Usage",
        "Territory & Term Schedule",
        "Master & Composition Clearance",
        "Pricing quoted per project"
      ],
      buttonText: "REQUEST PROPOSAL"
    },
    { 
      id: "exclusive", 
      title: "Exclusive Archive Acquisition", 
      price: "$5,000", 
      subtitle: "For exclusive control and permanent removal from future public licensing.", 
      description: "For exclusive control and permanent removal from future public licensing.",
      usageTerms: [
        "Exclusive Acquisition Agreement",
        "Full Production Files",
        "Production Stems",
        "Metadata Transfer",
        "Exclusive Clearance Certificate",
        "Ownership Documentation (where applicable)",
        "Existing non-exclusive licenses remain valid",
        "Rights transfer only as stated in the executed agreement"
      ],
      buttonText: "REQUEST ACQUISITION — $5,000"
    },
    { 
      id: "collaboration", 
      title: "Producer Collaboration", 
      price: "REVIEW", 
      subtitle: "Selected projects may qualify for collaboration without an upfront licensing fee.", 
      description: "Selected projects may qualify for collaboration without an upfront licensing fee. Writer shares, publishing participation, master ownership, royalties, credits, and administrative responsibilities are negotiated individually and documented before commercial release.",
      usageTerms: [
        "Selected projects may qualify for collaboration without an upfront licensing fee",
        "Writer shares, publishing participation, master ownership, royalties, credits, and administrative responsibilities are negotiated individually and documented before commercial release."
      ],
      buttonText: "SUBMIT PROJECT FOR REVIEW"
    }
  ] as const;

  // Scroll wheel states
  const [pickedHour, setPickedHour] = useState<number | null>(10);
  const [pickedMinute, setPickedMinute] = useState<number | null>(0);
  const [pickedAMPM, setPickedAMPM] = useState<"AM" | "PM" | null>("PM");
  const [isManual, setIsManual] = useState<boolean>(false);
  const [calibrationState, setCalibrationState] = useState<"idle" | "calibrating" | "available" | "restricted">("available");

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

  // Sync picked values with current active signal or default to 10:00 PM if user hasn't gone manual
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
      // Overridden previous logic to let 10:00 PM be the first initial available fragment rather than current time
      setPickedHour(10);
      setPickedMinute(0);
      setPickedAMPM("PM");
      setCalibrationState("available");
    }
  }, [activePlayId, isManual]);

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

  // Triggers automatic timestamp shuffle to an available fragment (visually silent)
  const handleOwlCall = () => {
    if (isHooting) return;
    setIsHooting(true);

    // Settle into manual adjustment mode and clear current temporary state
    setIsManual(true);
    setCalibrationState("idle");

    let count = 0;
    const maxShuffles = 9;
    const allowedFrags = CLOCK_FRAGMENTS.filter(
      f => f.mappedId === "09:41" || f.mappedId === "10:00" || f.mappedId === "11:11"
    );

    const interval = setInterval(() => {
      count++;
      let randomFrag: ClockFragment;

      if (count < maxShuffles) {
        // Rapidly cycle through allowed fragments during shuffle ticks
        randomFrag = allowedFrags[(count - 1) % allowedFrags.length];
      } else {
        // On final tick, select randomly among the allowed recovered fragments
        const currentCleaned = `${displayHour === 0 ? 12 : displayHour}:${displayMinute.toString().padStart(2, "0")} ${displayAMPM}`;
        const alternatives = allowedFrags.filter(f => !f.label.includes(currentCleaned));
        const finalPool = alternatives.length > 0 ? alternatives : allowedFrags;
        randomFrag = finalPool[Math.floor(Math.random() * finalPool.length)];
      }

      const cleaned = randomFrag.label.replace("FRAGMENT ", "").trim(); // "09:41 PM", "10:00 PM", or "11:11 PM"
      const [timeStr, ampmStr] = cleaned.split(" ");
      const [hStr, mStr] = timeStr.split(":");
      let h = parseInt(hStr, 10) % 12;
      if (h === 0) h = 12;
      const m = parseInt(mStr, 10);
      const ampm = (ampmStr || "AM") as "AM" | "PM";

      setPickedHour(h);
      setPickedMinute(m);
      setPickedAMPM(ampm);

      // Play mechanical shuffle tick sound
      playTickSound(count % 2 === 0 ? "low" : "high");

      if (count >= maxShuffles) {
        clearInterval(interval);
        setIsHooting(false);
        setCalibrationState("available");
      }
    }, 100);
  };

  const handleRowClick = (item: ClockFragment) => {
    const matchedFrag = fragments.find(f => f.id === item.mappedId);
    if (matchedFrag && onSelectFragment) {
      onSelectFragment(matchedFrag);
    }
  };

  const activeFragment = CLOCK_FRAGMENTS.find(f => f.id === activePlayId);

  // Parse active fragment timestamp if available
  let activeFragH = 2;
  let activeFragM = 17;
  let activeFragAMPM: "AM" | "PM" = "AM";
  if (activeFragment) {
    const matched = FRAGMENTS.find(f => f.id === activeFragment.mappedId);
    if (matched && matched.timestamp) {
      const timeParts = matched.timestamp.split(" ");
      if (timeParts.length === 2) {
        const hhmm = timeParts[0].split(":");
        if (hhmm.length === 2) {
          const h12 = parseInt(hhmm[0], 10);
          const m = parseInt(hhmm[1], 10);
          if (!isNaN(h12) && !isNaN(m)) {
            activeFragH = h12 % 12;
            activeFragM = m;
            activeFragAMPM = timeParts[1].toUpperCase() === "PM" ? "PM" : "AM";
          }
        }
      }
    }
  }

  // Dynamic variables for Clock Wheel Selector Card
  const displayHour = pickedHour !== null ? pickedHour : (activeFragment ? activeFragH : currentTime.getHours() % 12);
  const displayMinute = pickedMinute !== null ? pickedMinute : (activeFragment ? activeFragM : currentTime.getMinutes());
  const displayAMPM = pickedAMPM !== null ? pickedAMPM : (activeFragment ? activeFragAMPM : (currentTime.getHours() >= 12 ? "PM" : "AM"));

  const prevHour = displayHour === 0 ? 11 : displayHour - 1;
  const prevMinute = displayMinute === 0 ? 59 : displayMinute - 1;
  const nextHour = displayHour === 11 ? 0 : displayHour + 1;
  const nextMinute = displayMinute === 59 ? 0 : displayMinute + 1;
  const fmt = (num: number) => String(num).padStart(2, "0");

  const handleHourClick = (h: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsManual(true);
    setCalibrationState("idle");
    setPickedHour(h);
  };

  const handleMinuteClick = (m: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsManual(true);
    setCalibrationState("idle");
    setPickedMinute(m);
  };

  const handleAMPMClick = (ampm: "AM" | "PM", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsManual(true);
    setCalibrationState("idle");
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

  const exactClockFragment = CLOCK_FRAGMENTS.find(item => {
    const cleaned = item.label.replace("FRAGMENT ", "").trim(); // "02:17 AM"
    const [timeStr, ampmStr] = cleaned.split(" ");
    const [hStr, mStr] = timeStr.split(":");
    let itemH = parseInt(hStr, 10) % 12;
    let itemM = parseInt(mStr, 10);
    const itemAMPM = (ampmStr || "AM") as "AM" | "PM";
    return itemH === displayHour && itemM === displayMinute && itemAMPM === displayAMPM;
  });

  const exactActualFrag = exactClockFragment
    ? (fragments.find(f => f.id === exactClockFragment.mappedId) || FRAGMENTS.find(f => f.id === exactClockFragment.mappedId) || null)
    : null;

  const handleImmediateCheck = () => {
    if (exactClockFragment) {
      setCalibrationState("available");
    } else {
      setCalibrationState("restricted");
    }
  };

  // Automatically search and calibrate when user stops interacting (finishes interaction)
  useEffect(() => {
    if (!isManual) return;

    setCalibrationState("idle");

    const timer = setTimeout(() => {
      if (exactClockFragment) {
        setCalibrationState("available");
      } else {
        setCalibrationState("restricted");
      }
    }, 750); // 750ms of inactivity represents finishing interaction

    return () => clearTimeout(timer);
  }, [displayHour, displayMinute, displayAMPM, isManual, exactClockFragment]);

  const handleTransmit = () => {
    if (exactActualFrag && onSelectFragment) {
      onSelectFragment(exactActualFrag);
    }
  };

  const currentClockItem = exactClockFragment || CLOCK_FRAGMENTS.find(item => item.id === activePlayId) || CLOCK_FRAGMENTS[0]; // fallback to exactClockFragment or active or 10:00 PM
  const matchedFrag = FRAGMENTS.find(f => f.id === currentClockItem.mappedId) || FRAGMENTS.find(f => f.id === "10:00") || FRAGMENTS[0];
  const formattedTitle = matchedFrag.name.toUpperCase();
  const isPlayingBeat = false;

  const toggleModalPlay = () => {
    if (exactActualFrag && onSelectFragment) {
      onSelectFragment(exactActualFrag);
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
        <div className="w-full flex flex-col items-center relative z-20 pt-2 sm:pt-4 md:pt-6">
          
          <div 
            onClick={handleImmediateCheck}
            className="relative w-full max-w-[320px] sm:max-w-[380px] flex items-center justify-center gap-2 sm:gap-4 font-mono select-none overflow-hidden py-1 cursor-pointer"
          >
            {/* Column 1: HOUR WHEEL DRUM */}
            <WheelDrum 
              value={displayHour}
              options={Array.from({ length: 12 }, (_, i) => i)}
              onChange={(h) => handleHourClick(h)}
              format={(h) => fmt(h === 0 ? 12 : h)}
              loop={true}
            />

            {/* Separator: Colon */}
            <div className="flex flex-col items-center justify-center h-32 text-center select-none w-4 z-10">
              <div className="text-white font-bold text-2xl sm:text-3xl h-8 flex items-center justify-center drop-shadow-[0_0_8px_rgba(217,214,202,0.5)] animate-pulse">:</div>
            </div>

            {/* Column 2: MINUTE WHEEL DRUM */}
            <WheelDrum 
              value={displayMinute}
              options={Array.from({ length: 60 }, (_, i) => i)}
              onChange={(m) => handleMinuteClick(m)}
              format={fmt}
              loop={true}
            />

            {/* Column 3: AM/PM WHEEL DRUM */}
            <WheelDrum 
              value={displayAMPM}
              options={["AM", "PM"]}
              onChange={(ampm) => handleAMPMClick(ampm)}
              format={(v) => v}
              loop={false}
            />
          </div>

          {/* Action indicator - extremely minimal */}
          <div className="mt-1 w-full max-w-[280px] h-[36px] flex items-center justify-center">
            {calibrationState === "available" && (
              <button
                onClick={handleTransmit}
                className="w-full bg-white hover:bg-zinc-200 text-black font-sans font-bold text-[11px] tracking-widest uppercase py-2 px-4 rounded-[4px] cursor-pointer transition-all duration-200 animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.35)] flex items-center justify-center gap-1.5"
              >
                <span>TRANSMIT SIGNAL</span>
                <span className="font-mono text-[9px]">&gt;</span>
              </button>
            )}

            {calibrationState === "restricted" && (
              <div className="text-red-500/90 text-xs tracking-[0.2em] uppercase font-mono font-bold animate-pulse">
                restricted
              </div>
            )}
          </div>
        </div>

        {/* Beautiful full-bleed, organic Owl image and elegant writeup grouped to keep them tight on mobile */}
        <div 
          onClick={handleOwlCall}
          className="flex-grow w-full flex flex-col items-center justify-center min-h-0 relative z-10 gap-3 sm:gap-6 mt-1 sm:mt-4 md:mt-6 mb-2 cursor-pointer"
        >
          <div className="w-full max-w-[380px] sm:max-w-[440px] md:max-w-[480px] flex items-center justify-center min-h-0 relative">
            <motion.div 
              className="w-full aspect-[16/10] relative overflow-hidden bg-black group flex items-center justify-center"
              style={{
                rotateX,
                rotateY,
                perspective: 1200
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleOwlCall();
              }}
            >
              <motion.img
                src={owlBgImage}
                alt="The Sentinel Owl"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-85 pointer-events-none select-none animate-fade-in"
                style={{
                  WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 12%, rgba(0,0,0,0) 45%)",
                  maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 12%, rgba(0,0,0,0) 45%)",
                }}
                animate={isHooting ? {
                  scale: [1, 1.02, 0.99, 1],
                  filter: ["brightness(1)", "brightness(1.15)", "brightness(1)"]
                } : {}}
                transition={{ duration: 0.8 }}
              />
            </motion.div>
          </div>

          {/* 3. ELEGANT WRITEUP: RECOVER A FRAGMENT FROM TIME */}
          <div className="w-full flex flex-col items-center gap-2 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="w-full flex items-center justify-center"
            >
              <h2 className="text-[10px] sm:text-[11px] md:text-[12px] font-bold tracking-[0.35em] sm:tracking-[0.45em] text-white uppercase font-mono text-center select-none whitespace-nowrap">
                RECOVER A FRAGMENT FROM TIME
              </h2>
            </motion.div>

            {/* Hairline spacer with central glowing geometric triangle */}
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 0.5, scaleX: 1 }}
              transition={{ duration: 1.8, delay: 0.5 }}
              className="flex items-center justify-center gap-3 w-[160px] sm:w-[200px]"
            >
              <div className="h-[1.2px] flex-grow bg-gradient-to-r from-transparent to-white/20" />
              <motion.svg
                viewBox="0 0 12 12"
                className="w-[11px] h-[11px] text-white flex-shrink-0"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                animate={{
                  opacity: [0.35, 1, 0.35],
                  filter: [
                    "drop-shadow(0 0 0px rgba(255, 255, 255, 0))",
                    "drop-shadow(0 0 5px rgba(255, 255, 255, 0.85))",
                    "drop-shadow(0 0 0px rgba(255, 255, 255, 0))"
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
              <div className="h-[1.2px] flex-grow bg-gradient-to-l from-transparent to-white/20" />
            </motion.div>


          </div>
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
              className="relative w-full max-w-[480px] my-auto max-h-[92vh] overflow-y-auto bg-black border border-zinc-900 text-[#D9D6CA] p-4 sm:p-8 flex flex-col items-center select-none font-mono text-center shadow-2xl rounded-2xl"
            >
              {/* Header section with Choose Clearance Type and Close button */}
              <div className="w-full flex items-center justify-between border-b border-zinc-900 pb-3 sm:pb-4 mb-3 sm:mb-5 shrink-0">
                <h3 className="text-xs sm:text-sm font-bold tracking-[0.18em] sm:tracking-[0.22em] text-[#D9D6CA] uppercase">
                  CHOOSE CLEARANCE TYPE
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
                <div className="relative w-28 h-28 sm:w-44 sm:h-44 border border-zinc-900 bg-black/40 flex flex-col items-center justify-center rounded-xl sm:rounded-2xl mb-3 sm:mb-4 group overflow-hidden shadow-xl shrink-0">
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
                      <span className="w-[1.5px] h-3 bg-[#D9D6CA]/80 origin-bottom animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-[1.5px] h-5 bg-[#D9D6CA]/80 origin-bottom animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <span className="w-[1.5px] h-2 bg-[#D9D6CA]/80 origin-bottom animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>
                  )}
                </div>

                {/* 5. Decorative border */}
                <div className="w-full h-[1px] bg-zinc-900/40 mt-2 sm:mt-4 mb-3 sm:mb-5" />

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
                        className="mt-6 text-[10px] tracking-[0.2em] font-bold text-[#D9D6CA] bg-transparent border border-zinc-900 hover:border-[#D9D6CA]/30 hover:bg-zinc-950 rounded-lg px-4 py-2 uppercase transition-all duration-300"
                      >
                        RESET VAULT
                      </button>
                    </motion.div>
                  ) : (
                    <>
                      {/* List of 4 cards representing the updated user clearance tiers */}
                      <div className="w-full space-y-2.5 sm:space-y-3 max-h-[320px] sm:max-h-[360px] overflow-y-auto pr-1">
                        {CONTRACT_TIERS.map((tier) => {
                          const isSelected = selectedTier === tier.id;
                          const isExpanded = !!expandedTerms[tier.id];
                          return (
                            <div
                              key={tier.id}
                              onClick={() => setSelectedTier(tier.id)}
                              className={`w-full bg-[#101010]/30 border rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left transition-all duration-300 relative overflow-hidden flex flex-col cursor-pointer ${
                                isSelected
                                  ? "border-zinc-700 shadow-xl bg-zinc-950/80"
                                  : "border-zinc-900/60 hover:border-zinc-800"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 sm:gap-0">
                                <div className="flex flex-col min-w-0 sm:pr-3">
                                  <span className={`font-serif tracking-wide text-xs sm:text-sm font-medium ${isSelected ? "text-white" : "text-[#D9D6CA]/90"}`}>
                                    {tier.title}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 tracking-widest font-mono uppercase mt-0.5 sm:mt-1">
                                    {tier.subtitle}
                                  </span>
                                </div>
                                
                                {/* White/Off-white Price Pill Button with lock */}
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
                                  className="w-full sm:w-auto justify-center bg-[#D9D6CA] hover:bg-white text-black font-sans font-bold text-[10px] sm:text-xs py-2 sm:py-1.5 px-3 rounded-lg sm:rounded-xl flex items-center gap-1.5 transition-all duration-300 shrink-0 shadow-sm mt-1 sm:mt-0"
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
                                className="text-[9px] font-mono tracking-widest text-[#D9D6CA]/70 hover:text-white mt-3 flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-left py-0.5 select-none font-bold"
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
                                    {tier.usageTerms && tier.usageTerms.length > 0 && (
                                      <div>
                                        <div className="text-[#D9D6CA]/90 font-bold tracking-wider text-[9px] uppercase mb-1">
                                          Usage Terms:
                                        </div>
                                        <ul className="list-disc pl-4 space-y-0.5 text-[#D9D6CA]/70">
                                          {tier.usageTerms.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                          ))}
                                        </ul>
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
                              <label className="text-[8px] text-[#D9D6CA]/80 tracking-widest block uppercase font-bold">
                                ENTER VAULT CREDIT EMAIL
                              </label>
                              <input
                                type="email"
                                required
                                placeholder="vault@credentials.local"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                className="w-full bg-black border border-zinc-900 text-center py-2.5 px-3 text-xs outline-none text-[#D9D6CA] focus:border-[#D9D6CA]/40 placeholder:text-zinc-800 tracking-wider font-mono rounded-lg"
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
                          ? "border-[#D9D6CA] bg-neutral-950/80 text-[#D9D6CA] hover:bg-[#D9D6CA] hover:text-black cursor-pointer shadow-md"
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
