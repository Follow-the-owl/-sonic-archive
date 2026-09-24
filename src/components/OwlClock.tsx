import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, RefreshCw, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Package, Mail, Download, Play, Pause, Lock } from "lucide-react";
import { FRAGMENTS, Fragment } from "../data";
import { getAllActiveFragments, parseFragmentTimeDetails } from "../lib/fragmentService";
import { stopAudio, getActiveId, registerAudioCallback, playTickSound, playSlotSpinTick, playSlotReelLock, ensureToneStarted } from "../audio";
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
  onRequestProposal?: (fragmentName?: string, tierTitle?: string) => void;
  onRequestCollaboration?: (fragmentName?: string) => void;
  initialTime?: { hour: number; minute: number; ampm: "AM" | "PM" } | null;
  onTimeChange?: (time: { hour: number; minute: number; ampm: "AM" | "PM" }) => void;
}

interface WheelDrumProps {
  value: any;
  options: any[];
  onChange: (val: any) => void;
  onMovingChange?: (isMoving: boolean) => void;
  format?: (val: any) => string;
  loop?: boolean;
}

function WheelDrum({ value, options, onChange, onMovingChange, format = (v) => String(v), loop = true }: WheelDrumProps) {
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
  const wheelTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalOffset(0);
    lastTickIndexRef.current = null;
  }, [value]);

  useEffect(() => {
    return () => {
      if (wheelTimerRef.current) {
        clearTimeout(wheelTimerRef.current);
      }
    };
  }, []);

  const startDrag = (clientY: number) => {
    isDragging.current = true;
    dragStartY.current = clientY;
    lastTickIndexRef.current = currentIdx;
    onMovingChange?.(true);
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
    onMovingChange?.(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMovingChange?.(true);
    if (wheelTimerRef.current) {
      clearTimeout(wheelTimerRef.current);
    }
    wheelTimerRef.current = setTimeout(() => {
      onMovingChange?.(false);
      wheelTimerRef.current = null;
    }, 280);

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
      data-drum="true"
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

export default function OwlClock({ 
  onSelectFragment, 
  onAddToCart,
  onRequestProposal,
  onRequestCollaboration,
  initialTime,
  onTimeChange
}: OwlClockProps) {
  const recoveredSectionRef = useRef<HTMLDivElement>(null);
  const [activePlayId, setActivePlayId] = useState<string | null>(getActiveId());
  const [fragments, setFragments] = useState<Fragment[]>(() => getAllActiveFragments());

  // Guarantee complete silence on Owl Clock page mount
  useEffect(() => {
    stopAudio();
  }, []);

  // Listen to live database sync and API updates
  useEffect(() => {
    const refreshFragments = () => {
      const active = getAllActiveFragments();
      if (active.length > 0) {
        setFragments(active);
      }
    };

    refreshFragments();

    fetch("/api/fragments?status=published&limit=500")
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.fragments) && data.fragments.length > 0) {
          const published = data.fragments.filter((f: any) => 
            (!f.status || f.status.toLowerCase() === "published") && !f.deletedAt
          );
          if (published.length > 0) {
            setFragments(published);
          }
        }
      })
      .catch(() => {
        // Keep local synchronized active fragments
      });

    window.addEventListener("fragments-updated", refreshFragments);
    window.addEventListener("storage", refreshFragments);
    return () => {
      window.removeEventListener("fragments-updated", refreshFragments);
      window.removeEventListener("storage", refreshFragments);
    };
  }, []);

  // Dynamically derive directional chronological fragments strictly from active published database fragments
  const dynamicDirectionalChronoFragments = useMemo(() => {
    const publishedOnly = fragments.filter(f => {
      const s = (f as any).status;
      return (!s || s.toLowerCase() === "published") && !(f as any).deletedAt;
    });

    const sourceList = publishedOnly.length > 0 ? publishedOnly : fragments;

    const list = sourceList.map(f => {
      const timeInfo = parseFragmentTimeDetails((f as any).fragmentTimestamp || f.timestamp || f.name || f.id);
      return {
        mappedId: f.id,
        hour: timeInfo.hour,
        minute: timeInfo.minute,
        ampm: timeInfo.ampm,
        totalMinutes: timeInfo.totalMinutes,
        label: timeInfo.formatted,
        rawFragment: f
      };
    });

    // Deduplicate any items with exact same hour, minute, ampm to ensure clean wheel slots
    const seen = new Set<string>();
    const uniqueList: typeof list = [];
    for (const item of list) {
      const standardH = item.hour === 0 ? 12 : (item.hour > 12 ? (item.hour % 12 === 0 ? 12 : item.hour % 12) : item.hour);
      const key = `${standardH}:${String(item.minute).padStart(2, "0")} ${item.ampm}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push({
          ...item,
          hour: standardH
        });
      }
    }

    // Sort ascending by totalMinutes in 24-hour day
    uniqueList.sort((a, b) => a.totalMinutes - b.totalMinutes);

    return uniqueList.length > 0 ? uniqueList : [
      { mappedId: "07:15", hour: 7, minute: 15, ampm: "AM" as const, totalMinutes: 435, label: "07:15 AM", rawFragment: FRAGMENTS[0] },
      { mappedId: "09:41", hour: 9, minute: 41, ampm: "PM" as const, totalMinutes: 1301, label: "09:41 PM", rawFragment: FRAGMENTS[1] },
      { mappedId: "10:00", hour: 10, minute: 0, ampm: "PM" as const, totalMinutes: 1320, label: "10:00 PM", rawFragment: FRAGMENTS[2] },
      { mappedId: "11:11", hour: 11, minute: 11, ampm: "PM" as const, totalMinutes: 1391, label: "11:11 PM", rawFragment: FRAGMENTS[3] }
    ];
  }, [fragments]);

  // Dynamically derive clock fragments catalog mapped 1:1 with dynamicDirectionalChronoFragments
  const dynamicClockFragments = useMemo<ClockFragment[]>(() => {
    return dynamicDirectionalChronoFragments.map(df => {
      const f = df.rawFragment;
      return {
        id: `frag-${f.id.replace(/[^a-zA-Z0-9]/g, "")}`,
        label: `FRAGMENT ${df.label}`,
        mappedId: f.id,
        synthType: (f.synthType as any) || "keys",
        frequency: f.frequency || 440,
        description: f.description || `Time Capsule Entry ${f.timestamp || f.name}. High-fidelity recovered tape fragment carrying a ${f.tonalSignature || "harmonic"} axis at ${f.bpm || 110} BPM.`
      };
    });
  }, [dynamicDirectionalChronoFragments]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isHooting, setIsHooting] = useState<boolean>(false);
  const [isDrumMoving, setIsDrumMoving] = useState<boolean>(false);
  const [showMutePrompt, setShowMutePrompt] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const isMovementActive = isHooting || isDrumMoving;

  // Directional timer ref
  const shuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (shuffleTimeoutRef.current) {
        clearTimeout(shuffleTimeoutRef.current);
        shuffleTimeoutRef.current = null;
      }
    };
  }, []);

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

  // Scroll wheel states initialized with initialTime prop if provided (persisting chosen time across screen switches)
  const [pickedHour, setPickedHour] = useState<number | null>(() => initialTime ? (initialTime.hour === 0 ? 12 : initialTime.hour) : 10);
  const [pickedMinute, setPickedMinute] = useState<number | null>(() => initialTime ? initialTime.minute : 0);
  const [pickedAMPM, setPickedAMPM] = useState<"AM" | "PM" | null>(() => initialTime ? initialTime.ampm : "PM");
  const [isManual, setIsManual] = useState<boolean>(() => !!initialTime);
  const [calibrationState, setCalibrationState] = useState<"idle" | "calibrating" | "available" | "restricted">("available");

  // Dynamic directional arrow indicator state (hidden by default, appears on click/interaction, then disappears)
  const [activeArrow, setActiveArrow] = useState<"backward" | "forward" | null>(null);
  const arrowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerDynamicArrow = (direction: "backward" | "forward") => {
    if (arrowTimeoutRef.current) {
      clearTimeout(arrowTimeoutRef.current);
      arrowTimeoutRef.current = null;
    }
    setActiveArrow(direction);
    arrowTimeoutRef.current = setTimeout(() => {
      setActiveArrow(null);
      arrowTimeoutRef.current = null;
    }, 750);
  };

  useEffect(() => {
    return () => {
      if (arrowTimeoutRef.current) {
        clearTimeout(arrowTimeoutRef.current);
      }
    };
  }, []);

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
      const activeFrag = dynamicClockFragments.find(f => f.id === activePlayId || f.mappedId === activePlayId);
      if (activeFrag) {
        const cleaned = activeFrag.label.replace("FRAGMENT ", "").trim(); // "07:15 AM"
        const [timeStr, ampmStr] = cleaned.split(" ");
        const [hStr, mStr] = timeStr.split(":");
        let h = parseInt(hStr, 10);
        if (h === 0) h = 12;
        if (h > 12) h = h % 12 === 0 ? 12 : h % 12;
        setPickedHour(h);
        setPickedMinute(parseInt(mStr, 10));
        setPickedAMPM((ampmStr || "AM") as "AM" | "PM");
        setIsManual(false); // reset manual if user switched to playing a different signal row
        setCalibrationState("available");
      }
    }
  }, [activePlayId, dynamicClockFragments]);

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

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [x, y]);

  // Synchronize active play state from main audio core callbacks
  useEffect(() => {
    const unsub = registerAudioCallback((_isPlaying, fragmentId) => {
      if (fragmentId) {
        const found = dynamicClockFragments.find(f => f.mappedId === fragmentId || f.id === fragmentId);
        setActivePlayId(found ? found.id : null);
      } else {
        setActivePlayId(null);
      }
    });
    return () => {
      unsub();
    };
  }, [dynamicClockFragments]);

  const activeFragment = dynamicClockFragments.find(f => f.id === activePlayId || f.mappedId === activePlayId);

  // Parse active fragment timestamp if available
  let activeFragH = 10;
  let activeFragM = 0;
  let activeFragAMPM: "AM" | "PM" = "PM";
  if (activeFragment) {
    const matched = fragments.find(f => f.id === activeFragment.mappedId);
    if (matched && (matched.timestamp || matched.name)) {
      const parsedTime = parseFragmentTimeDetails(matched.timestamp || matched.name);
      activeFragH = parsedTime.hour;
      activeFragM = parsedTime.minute;
      activeFragAMPM = parsedTime.ampm;
    }
  }

  // Dynamic variables for Clock Wheel Selector Card - defaults strictly to the first active published fragment
  const defaultFrag = dynamicDirectionalChronoFragments[0];
  const displayHour = pickedHour !== null 
    ? (pickedHour === 0 ? 12 : pickedHour) 
    : (activeFragment ? (activeFragH === 0 ? 12 : activeFragH) : (defaultFrag ? defaultFrag.hour : 10));
  const displayMinute = pickedMinute !== null ? pickedMinute : (activeFragment ? activeFragM : (defaultFrag ? defaultFrag.minute : 0));
  const displayAMPM = pickedAMPM !== null ? pickedAMPM : (activeFragment ? activeFragAMPM : (defaultFrag ? defaultFrag.ampm : "PM"));

  const prevHour = displayHour === 1 ? 12 : displayHour - 1;
  const prevMinute = displayMinute === 0 ? 59 : displayMinute - 1;
  const nextHour = displayHour === 12 ? 1 : displayHour + 1;
  const nextMinute = displayMinute === 59 ? 0 : displayMinute + 1;
  const fmt = (num: number) => String(num).padStart(2, "0");

  // Directional timestamp adjustments (Backward / Forward) strictly clamping/cycling through only active published fragments in database
  const handleDirectionalShuffle = (direction: "backward" | "forward") => {
    // Dynamically flash the directional arrow indicator in fixed position
    triggerDynamicArrow(direction);

    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
      shuffleTimeoutRef.current = null;
    }

    const totalAvailable = dynamicDirectionalChronoFragments.length;
    if (totalAvailable === 0) return;

    setIsHooting(true);
    setCalibrationState("idle");

    const curH = displayHour === 0 ? 12 : displayHour;
    const totalH24 = curH === 12 ? (displayAMPM === "PM" ? 12 : 0) : (displayAMPM === "PM" ? curH + 12 : curH);
    const curTotalMin = totalH24 * 60 + displayMinute;

    // Find index of current fragment in published array
    const exactIndex = dynamicDirectionalChronoFragments.findIndex(
      f => (f.hour === 0 ? 12 : f.hour) === curH && f.minute === displayMinute && f.ampm === displayAMPM
    );

    let targetIndex = 0;
    let fromIndex = 0;

    if (exactIndex !== -1) {
      fromIndex = exactIndex;
      if (direction === "forward") {
        targetIndex = (exactIndex + 1) % totalAvailable;
      } else {
        targetIndex = (exactIndex - 1 + totalAvailable) % totalAvailable;
      }
    } else {
      // If currently on an unassigned/manual timestamp (e.g. restricted),
      // smoothly cycle from the closest boundary to the next valid published fragment
      if (direction === "forward") {
        const laterFrags = dynamicDirectionalChronoFragments
          .map((f, idx) => ({ idx, diff: f.totalMinutes - curTotalMin }))
          .filter(item => item.diff > 0);
        if (laterFrags.length > 0) {
          laterFrags.sort((a, b) => a.diff - b.diff);
          targetIndex = laterFrags[0].idx;
        } else {
          targetIndex = 0;
        }
        fromIndex = (targetIndex - 1 + totalAvailable) % totalAvailable;
      } else {
        const earlierFrags = dynamicDirectionalChronoFragments
          .map((f, idx) => ({ idx, diff: curTotalMin - f.totalMinutes }))
          .filter(item => item.diff > 0);
        if (earlierFrags.length > 0) {
          earlierFrags.sort((a, b) => a.diff - b.diff);
          targetIndex = earlierFrags[0].idx;
        } else {
          targetIndex = totalAvailable - 1;
        }
        fromIndex = (targetIndex + 1) % totalAvailable;
      }
    }

    const targetFrag = dynamicDirectionalChronoFragments[targetIndex] || dynamicDirectionalChronoFragments[0];
    const stepDir = direction === "forward" ? 1 : -1;

    // Build reel trajectory frames STRICTLY through available published fragments.
    // Dynamic Array Bounds: clamps and cycles only through active database fragments.
    const stepFrames: { hour: number; minute: number; ampm: "AM" | "PM" }[] = [];

    if (totalAvailable === 1) {
      stepFrames.push({ hour: targetFrag.hour, minute: targetFrag.minute, ampm: targetFrag.ampm });
    } else {
      // Dynamic rotation count scaled automatically to published fragment count
      const fullRevolutions = totalAvailable <= 3 ? 3 : totalAvailable <= 8 ? 2 : 1;
      let hopsToTarget = direction === "forward"
        ? ((targetIndex - fromIndex) % totalAvailable + totalAvailable) % totalAvailable
        : ((fromIndex - targetIndex) % totalAvailable + totalAvailable) % totalAvailable;
      if (hopsToTarget === 0) {
        hopsToTarget = totalAvailable;
      }
      const totalHops = fullRevolutions * totalAvailable + hopsToTarget;

      for (let h = 1; h <= totalHops; h++) {
        const fragIdx = ((fromIndex + stepDir * h) % totalAvailable + totalAvailable) % totalAvailable;
        const f = dynamicDirectionalChronoFragments[fragIdx];
        stepFrames.push({ hour: f.hour, minute: f.minute, ampm: f.ampm });
      }
    }

    const totalSteps = stepFrames.length;
    const fastStepsCount = Math.max(1, Math.floor(totalSteps * 0.62));
    let currentStep = 0;

    const executeSlotStep = () => {
      const frame = stepFrames[currentStep];
      setPickedHour(frame.hour);
      setPickedMinute(frame.minute);
      setPickedAMPM(frame.ampm);

      const progress = totalSteps > 1 ? currentStep / (totalSteps - 1) : 1;

      if (currentStep < totalSteps - 1) {
        // Play rapid to easing ratchet clicks
        playSlotSpinTick(progress);
        currentStep++;

        let nextDelay = 32;
        if (currentStep >= fastStepsCount) {
          const decelProgress = (currentStep - fastStepsCount) / (totalSteps - 1 - fastStepsCount);
          nextDelay = Math.round(38 + Math.pow(decelProgress, 2.5) * 280);
        } else {
          nextDelay = 28 + Math.round((currentStep / fastStepsCount) * 10);
        }

        shuffleTimeoutRef.current = setTimeout(executeSlotStep, nextDelay);
      } else {
        // Final landing step: solid mechanical lock-in sound
        playSlotReelLock();
        setIsHooting(false);
        setIsManual(false); // Reset manual flag on successful shuffle landing
        setCalibrationState("available");
        shuffleTimeoutRef.current = null;
        if (onTimeChange) {
          onTimeChange({ hour: targetFrag.hour, minute: targetFrag.minute, ampm: targetFrag.ampm });
        }
      }
    };

    executeSlotStep();
  };

  // Keyboard navigation for Left/Right arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleDirectionalShuffle("backward");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleDirectionalShuffle("forward");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayHour, displayMinute, displayAMPM]);

  // Triggers automatic timestamp shuffle to an available fragment (visually silent)
  const handleOwlCall = () => {
    if (isHooting) return;
    handleDirectionalShuffle("forward");
  };

  const handleRowClick = (item: ClockFragment) => {
    const matchedFrag = fragments.find(f => f.id === item.mappedId);
    if (matchedFrag && onSelectFragment) {
      onSelectFragment(matchedFrag);
    }
  };

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
    const timeInfo = parseFragmentTimeDetails(item.label);
    const standardH = h === 0 ? 12 : h;
    const target24H = ampm === "PM" ? (standardH === 12 ? 12 : standardH + 12) : (standardH === 12 ? 0 : standardH);
    const targetMinutes = target24H * 60 + m;
    const itemMinutes = timeInfo.totalMinutes;

    let diff = Math.abs(targetMinutes - itemMinutes);
    if (diff > 720) {
      diff = 1440 - diff;
    }
    return diff;
  };

  const exactActualFrag = useMemo(() => {
    const curH = displayHour === 0 ? 12 : displayHour;
    const match = dynamicDirectionalChronoFragments.find(df => 
      (df.hour === 0 ? 12 : df.hour) === curH && 
      df.minute === displayMinute && 
      df.ampm === displayAMPM
    );
    return match ? (match.rawFragment || fragments.find(f => f.id === match.mappedId) || null) : null;
  }, [dynamicDirectionalChronoFragments, displayHour, displayMinute, displayAMPM, fragments]);

  const exactClockFragment = useMemo(() => {
    if (!exactActualFrag) return null;
    return dynamicClockFragments.find(cf => cf.mappedId === exactActualFrag.id) || null;
  }, [dynamicClockFragments, exactActualFrag]);

  const handleImmediateCheck = () => {
    if (exactActualFrag) {
      setCalibrationState("available");
    } else {
      setCalibrationState("restricted");
    }
  };

  // Automatically validate and calibrate when user manually inputs or finishes interaction
  useEffect(() => {
    if (!isManual) return;

    if (isDrumMoving) {
      setCalibrationState("idle");
      return;
    }

    const timer = setTimeout(() => {
      if (exactActualFrag) {
        setCalibrationState("available");
      } else {
        setCalibrationState("restricted");
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [displayHour, displayMinute, displayAMPM, isManual, isDrumMoving, exactActualFrag]);

  const handleTransmit = () => {
    ensureToneStarted();
    if (exactActualFrag && onSelectFragment) {
      if (onTimeChange) {
        onTimeChange({
          hour: displayHour === 0 ? 12 : displayHour,
          minute: displayMinute,
          ampm: displayAMPM
        });
      }
      onSelectFragment(exactActualFrag);
    }
  };

  const currentClockItem = exactClockFragment || dynamicClockFragments.find(item => item.id === activePlayId || item.mappedId === activePlayId) || dynamicClockFragments[0];
  const matchedFrag = exactActualFrag || fragments.find(f => f.id === currentClockItem?.mappedId) || fragments[0] || FRAGMENTS[0];
  const formattedTitle = (matchedFrag?.name || "RECOVERED FRAGMENT").toUpperCase();
  const isPlayingBeat = false;

  const toggleModalPlay = () => {
    if (exactActualFrag && onSelectFragment) {
      onSelectFragment(exactActualFrag);
    }
  };

  const handleStageClick = () => {
    // Stage background click does not trigger global shuffle; interaction is focused directly around the Owl
  };

  return (
    <div
      id="owl-clock-stage"
      onClick={handleStageClick}
      className="relative w-full h-full bg-black text-[#D9D6CA] flex flex-col justify-between items-center px-4 py-2 select-none overflow-hidden cursor-pointer"
    >
      {/* 1. Subtle global focus vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,10,12,0.15)_0%,rgba(0,0,0,1)_80%)] pointer-events-none z-0" />

      {/* 2. THE MAIN WRAPPER */}
      <div className="relative w-full max-w-xl h-full z-10 mx-auto flex flex-col items-center justify-between min-h-0 py-1">
        
        {/* CLOCK WHEEL SELECTOR SECTION - EXACTLY LIKE ATTACHED IMAGE */}
        <div className="w-full flex flex-col items-center relative z-20 pt-2 sm:pt-4 md:pt-6">
          
          <div 
            onClick={handleImmediateCheck}
            onWheel={(e) => {
              if ((e.target as HTMLElement)?.closest('[data-drum="true"]')) return;
              e.preventDefault();
              if (Math.abs(e.deltaY) < 15) return;
              if (isHooting || shuffleTimeoutRef.current) return;
              if (e.deltaY > 0) {
                handleDirectionalShuffle("forward");
              } else {
                handleDirectionalShuffle("backward");
              }
            }}
            className="relative w-full max-w-[320px] sm:max-w-[380px] flex items-center justify-center gap-2 sm:gap-4 font-mono select-none overflow-hidden py-1 cursor-pointer"
          >
            {/* Column 1: HOUR WHEEL DRUM (Strict 12-Hour Clock: 1 through 12) */}
            <WheelDrum 
              value={displayHour}
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
              onChange={(h) => handleHourClick(h)}
              onMovingChange={setIsDrumMoving}
              format={fmt}
              loop={true}
            />

            {/* Separator: Colon */}
            <div className="flex flex-col items-center justify-center h-32 text-center select-none w-4 z-10">
              <div className="text-white font-bold text-2xl sm:text-3xl h-8 flex items-center justify-center drop-shadow-[0_0_8px_rgba(217,214,202,0.5)]">:</div>
            </div>

            {/* Column 2: MINUTE WHEEL DRUM */}
            <WheelDrum 
              value={displayMinute}
              options={Array.from({ length: 60 }, (_, i) => i)}
              onChange={(m) => handleMinuteClick(m)}
              onMovingChange={setIsDrumMoving}
              format={fmt}
              loop={true}
            />

            {/* Column 3: AM/PM WHEEL DRUM */}
            <WheelDrum 
              value={displayAMPM}
              options={["AM", "PM"]}
              onChange={(ampm) => handleAMPMClick(ampm)}
              onMovingChange={setIsDrumMoving}
              format={(v) => v}
              loop={false}
            />
          </div>

          {/* Action indicator - displays smoothly when movements stop without blinking */}
          <div className="mt-1 w-full max-w-[280px] h-[36px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!isMovementActive && calibrationState === "available" && (
                <motion.button
                  key="transmit-signal-btn"
                  initial={{ opacity: 0, y: 3, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -3, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={handleTransmit}
                  className="w-full bg-white hover:bg-zinc-100 text-black font-sans font-bold text-[11px] tracking-widest uppercase py-2 px-4 rounded-[4px] cursor-pointer transition-all duration-300 shadow-[0_0_16px_rgba(255,255,255,0.35)] hover:shadow-[0_0_30px_rgba(255,255,255,0.85)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center select-none"
                >
                  <span>TRANSMIT SIGNAL</span>
                </motion.button>
              )}

              {!isMovementActive && calibrationState === "restricted" && (
                <motion.div
                  key="restricted-msg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-red-500/90 text-xs tracking-[0.2em] uppercase font-mono font-bold select-none flex items-center justify-center gap-1"
                >
                  <span>( restricted )</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* LOWER AREA: FULLY INTERACTIVE SENSITIVE ZONE ACROSS ENTIRE REGION */}
        <div 
          className="flex-grow w-full flex flex-col items-center justify-center min-h-0 relative z-10 gap-3 sm:gap-6 mt-1 sm:mt-4 md:mt-6 mb-2 select-none"
        >
          {/* FULL INTERACTIVE ZONE: LEFT HALF SHUFFLES BACKWARD, RIGHT HALF SHUFFLES FORWARD */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Shuffle timestamp backward"
            onClick={() => handleDirectionalShuffle("backward")}
            onWheel={(e) => {
              if (Math.abs(e.deltaY) < 15) return;
              if (isHooting || shuffleTimeoutRef.current) return;
              e.preventDefault();
              if (e.deltaY > 0) {
                handleDirectionalShuffle("forward");
              } else {
                handleDirectionalShuffle("backward");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleDirectionalShuffle("backward");
              }
            }}
            className="absolute inset-y-0 left-0 w-1/2 z-20 cursor-pointer focus:outline-none touch-manipulation"
            title="Previous Fragment"
          />

          <div
            role="button"
            tabIndex={0}
            aria-label="Shuffle timestamp forward"
            onClick={() => handleDirectionalShuffle("forward")}
            onWheel={(e) => {
              if (Math.abs(e.deltaY) < 15) return;
              if (isHooting || shuffleTimeoutRef.current) return;
              e.preventDefault();
              if (e.deltaY > 0) {
                handleDirectionalShuffle("forward");
              } else {
                handleDirectionalShuffle("backward");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleDirectionalShuffle("forward");
              }
            }}
            className="absolute inset-y-0 right-0 w-1/2 z-20 cursor-pointer focus:outline-none touch-manipulation"
            title="Next Fragment"
          />

          {/* DYNAMIC LEFT ARROW: Appears on backward / left-half interaction */}
          <div className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center">
            <AnimatePresence>
              {activeArrow === "backward" && (
                <motion.div
                  key="dynamic-left-arrow"
                  initial={{ opacity: 0, x: 8, scale: 0.85 }}
                  animate={{ opacity: 1, x: [4, -6, 0], scale: 1 }}
                  exit={{ opacity: 0, x: -8, scale: 0.85, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex items-center justify-center"
                >
                  <span className="font-mono text-xl sm:text-2xl text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.75)] select-none">
                    ←
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DYNAMIC RIGHT ARROW: Appears on forward / right-half interaction */}
          <div className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center">
            <AnimatePresence>
              {activeArrow === "forward" && (
                <motion.div
                  key="dynamic-right-arrow"
                  initial={{ opacity: 0, x: -8, scale: 0.85 }}
                  animate={{ opacity: 1, x: [-4, 6, 0], scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.85, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex items-center justify-center"
                >
                  <span className="font-mono text-xl sm:text-2xl text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.75)] select-none">
                    →
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Centered Sentinel Owl Visual */}
          <div className="w-full max-w-[380px] sm:max-w-[440px] md:max-w-[480px] flex items-center justify-center min-h-0 relative px-4 pointer-events-none">
            {/* Owl Image Canvas */}
            <motion.div 
              className="w-full aspect-[16/10] relative overflow-hidden bg-black group flex items-center justify-center pointer-events-none"
              style={{
                rotateX,
                rotateY,
                perspective: 1200
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
                  opacity: [0.4, 1, 0.4],
                  filter: [
                    "drop-shadow(0 0 0px rgba(255, 255, 255, 0))",
                    "drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))",
                    "drop-shadow(0 0 0px rgba(255, 255, 255, 0))"
                  ]
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
                                    const isCustomProposal = tier.price?.toUpperCase().includes("PROPOSAL") || tier.price?.toUpperCase().includes("CUSTOM") || tier.id === "sync";
                                    if (isCustomProposal && onRequestProposal) {
                                      setShowLicensePanel(false);
                                      setSelectedTier(null);
                                      setClientEmail("");
                                      onRequestProposal(matchedFrag.timestamp, tier.title);
                                      return;
                                    }
                                    if (onAddToCart) {
                                      onAddToCart(matchedFrag, tier.id, tier.title, tier.price);
                                    }
                                    setShowLicensePanel(false);
                                    setSelectedTier(null);
                                    setClientEmail("");
                                  }}
                                  className="w-full sm:w-auto justify-center bg-[#D9D6CA] hover:bg-white text-black font-sans font-bold text-[10px] sm:text-xs py-2 sm:py-1.5 px-3 rounded-lg sm:rounded-xl flex items-center gap-1.5 transition-all duration-300 shrink-0 shadow-sm mt-1 sm:mt-0 cursor-pointer"
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
                        const isCustomProposal = selectedTier === "sync" || selectedTier === "collaboration";
                        if (isCustomProposal && onRequestProposal) {
                          const currentTierObj = CONTRACT_TIERS.find(t => t.id === selectedTier);
                          setShowLicensePanel(false);
                          setSelectedTier(null);
                          setClientEmail("");
                          onRequestProposal(matchedFrag?.timestamp, currentTierObj?.title);
                          return;
                        }
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
                      ) : selectedTier === "sync" || selectedTier === "collaboration" ? (
                        <span>TRANSMIT CUSTOM PROPOSAL →</span>
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
