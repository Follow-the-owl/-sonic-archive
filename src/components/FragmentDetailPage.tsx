import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Square, ShieldCheck, Mail, ArrowLeft, Download, Award, Volume2, VolumeX, Radio, Pause, RotateCcw, Sliders, Music, Layers, X, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { Fragment } from "../data";
import { stopAudio } from "../audio";
import { RadioactiveIcon } from "./WelcomeScreen";
import { getLicensesForFragment, LicenseTemplate } from "../licenses";

const owlBackground = "https://res.cloudinary.com/dqg8pcmvz/image/upload/v1782454702/Owl_2_c5ebif.png";
const fragmentPageBackground = "https://res.cloudinary.com/dwtqn39as/image/upload/v1781452328/5870632527817543574_omdcor.jpg";

const waveHeights = [
  8, 14, 18, 10, 6, 12, 24, 32, 16, 20, 
  38, 28, 42, 18, 30, 24, 12, 16, 32, 45, 
  38, 26, 14, 8, 22, 34, 18, 12, 10, 6
];

interface FragmentDetailPageProps {
  fragment: Fragment;
  onBack: () => void;
  onAddToCart?: (fragment: Fragment, tierId: string, tierTitle: string, price: string) => void;
}

export default function FragmentDetailPage({ fragment, onBack, onAddToCart }: FragmentDetailPageProps) {
  const CONTRACT_TIERS = getLicensesForFragment(fragment);
  const [isPlayingBeat, setIsPlayingBeat] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showLicensePanel, setShowLicensePanel] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({
    "access": false,
    "release": false,
    "commercial": false,
    "exclusive": false,
    "sync": false,
    "clearance": false
  });
  const [licenseSuccess, setLicenseSuccess] = useState(false);
  const [clientEmail, setClientEmail] = useState("evianaconcepts1@gmail.com");
  const [isProcessingLicense, setIsProcessingLicense] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0.7); // Default high volume
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isPlayingBeat) {
      interval = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev >= 103) {
            pauseBeatPlay();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingBeat]);

  // Interactive Synthesizer and Sequencer parameters
  const [bpm, setBpm] = useState(fragment.bpm || 110);
  const [filterCutoff, setFilterCutoff] = useState(1800);
  const [filterResonance, setFilterResonance] = useState(3.0);
  const [synthType, setSynthType] = useState<"sine" | "triangle" | "sawtooth" | "square">(
    fragment.synthType === "keys" ? "triangle" : "sine"
  );
  const [activeTracks, setActiveTracks] = useState({
    kick: true,
    snare: true,
    hihat: true,
    synth: true
  });
  const [sequenceMatrix, setSequenceMatrix] = useState<{
    kick: boolean[];
    snare: boolean[];
    hihat: boolean[];
    synth: boolean[];
  }>({
    kick: [true, false, false, false, true, false, false, false],
    snare: [false, false, true, false, false, false, true, false],
    hihat: [true, true, true, true, true, true, true, true],
    synth: [true, false, true, true, false, true, false, true]
  });

  // Web Audio Context & Analyzer Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const beatIntervalRef = useRef<any>(null);
  const stepTrackerRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);

  // Synchronized refs to safeguard against stale React state closures in the Web Audio interval loop
  const bpmRef = useRef(bpm);
  const filterCutoffRef = useRef(filterCutoff);
  const filterResonanceRef = useRef(filterResonance);
  const synthTypeRef = useRef(synthType);
  const activeTracksRef = useRef(activeTracks);
  const sequenceMatrixRef = useRef(sequenceMatrix);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { filterCutoffRef.current = filterCutoff; }, [filterCutoff]);
  useEffect(() => { filterResonanceRef.current = filterResonance; }, [filterResonance]);
  useEffect(() => { synthTypeRef.current = synthType; }, [synthType]);
  useEffect(() => { activeTracksRef.current = activeTracks; }, [activeTracks]);
  useEffect(() => { sequenceMatrixRef.current = sequenceMatrix; }, [sequenceMatrix]);

  // Synth hum reference nodes for background oscillation
  const humOscRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Canvas visualizer reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Automatically pause the main site clock audio and start our local test beat immediately upon mount
  useEffect(() => {
    // 1. Silent check & cleanup any running global site soundtrack
    try {
      stopAudio();
    } catch (e) {
      console.warn("Global audio stop err:", e);
    }

    // 2. Safely trigger the immersive sound sequencer automatically (thanks to the user click event)
    const initTimer = setTimeout(() => {
      startBeatPlay();
    }, 150);

    return () => {
      clearTimeout(initTimer);
      stopBeatPlay();
    };
  }, [fragment.id]);

  // Sync volume node when slider changes
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      masterGainRef.current.gain.setValueAtTime(volumeLevel, now);
    }
  }, [volumeLevel]);

  // Adjust canvas dimensions inside container dynamically
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Set actual pixel dimensions to match display bounds for pristine sharpness
        canvas.width = canvas.parentElement?.clientWidth || 550;
        canvas.height = 110;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isPlayingBeat]);

  // Dynamically update or recreate the step-sequencer interval timer when BPM or play state changes
  useEffect(() => {
    if (!isPlayingBeat) {
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }
      return;
    }

    // Always clear the previous interval before creating the new one to prevent frequency overlap
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
    }

    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    // Compute exact MS per step based on current BPM (using eighth notes)
    const stepTimeMs = (60 / bpm) / 2 * 1000;

    beatIntervalRef.current = setInterval(() => {
      const analyser = analyserRef.current;
      if (!ctx || !analyser) return;

      const step = stepTrackerRef.current % 8;
      triggerBeatStep(ctx, analyser, step);
      setCurrentStep(step);
      stepTrackerRef.current += 1;
    }, stepTimeMs);

    return () => {
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }
    };
  }, [bpm, isPlayingBeat]);

  const startBeatPlay = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Pre-clear old interval to prevent double triggers
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }

      // Initialize master volume node
      if (!masterGainRef.current) {
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volumeLevel, ctx.currentTime);
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;
      }

      // Setup analyser
      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.65;
        analyser.connect(masterGainRef.current);
        analyserRef.current = analyser;
      }

      setIsPlayingBeat(true);

      // Start the interactive visualization loop
      startWaveformRender();

      // Background drone hum
      if (!humOscRef.current) {
        startConsoleHum(ctx, analyserRef.current);
      }

    } catch (e) {
      console.error("Audio Sequence start failure:", e);
    }
  };

  const pauseBeatPlay = () => {
    setIsPlayingBeat(false);

    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }

    // Stop background drone hum nodes so it is silent when paused
    if (humOscRef.current) {
      try {
        humOscRef.current.stop();
      } catch (e) {}
      humOscRef.current = null;
    }
    humGainRef.current = null;
  };

  const stopBeatPlay = () => {
    setIsPlayingBeat(false);
    
    // 1. Clear intervals
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }

    // 2. Stop running animation frames
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    // 3. Stop background drone hum nodes
    if (humOscRef.current) {
      try {
        humOscRef.current.stop();
      } catch (e) {}
      humOscRef.current = null;
    }
    humGainRef.current = null;

    // 4. Close context to free systemic sound pipelines and clear visualizer analyzer values
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close().then(() => {
          audioCtxRef.current = null;
          analyserRef.current = null;
          masterGainRef.current = null;
        });
      } catch (e) {
        audioCtxRef.current = null;
        analyserRef.current = null;
        masterGainRef.current = null;
      }
    } else {
      analyserRef.current = null;
      masterGainRef.current = null;
    }

    setCurrentStep(0);
    stepTrackerRef.current = 0;
  };

  const handleToggleBeat = () => {
    if (isPlayingBeat) {
      stopBeatPlay();
    } else {
      startBeatPlay();
    }
  };

  // Synthesizes a warm analog console mechanical noise and 55Hz sub oscillation
  const startConsoleHum = (ctx: AudioContext, destination: AudioNode) => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(55, now); // Low deep sub baseline hum

      // Delicate hum volume level to maintain mood without disturbing the user
      gain.gain.setValueAtTime(0.015, now);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(now);
      humOscRef.current = osc;
      humGainRef.current = gain;
    } catch (e) {
      console.error("Hum oscillator crash:", e);
    }
  };

  // Synthesizes high-fidelity lo-fi rhythmic drum elements on the fly
  const triggerBeatStep = (ctx: AudioContext, analyser: AnalyserNode, step: number) => {
    const now = ctx.currentTime;

    // Resonant Lowpass filter giving it that signature low-altitude sub-bunker or bright cyber soundscape
    const bandFilter = ctx.createBiquadFilter();
    bandFilter.type = "lowpass";
    bandFilter.frequency.setValueAtTime(filterCutoffRef.current, now);
    bandFilter.Q.setValueAtTime(filterResonanceRef.current, now);
    bandFilter.connect(analyser);

    // 1. DYNAMIC MELODIC CHORD PHRASE (Custom-scaled with fragment's exact attributes!)
    if (activeTracksRef.current.synth && sequenceMatrixRef.current.synth[step]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Derive base frequency from original fragment metrics
      const notes = [1.0, 1.2, 1.5, 0.8, 1.1, 1.3, 1.6, 0.95];
      const stepFreq = fragment.frequency * notes[step % notes.length];
      
      osc.type = synthTypeRef.current;
      osc.frequency.setValueAtTime(stepFreq, now);

      // Pitch sweep to make the synth feel humanized and fluid
      osc.frequency.exponentialRampToValueAtTime(stepFreq * 0.98, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(bandFilter);

      osc.start(now);
      osc.stop(now + 0.4);
    }

    // 2. HEAVY DEEP 808 SUB BASS SPLIT (Kicks)
    if (activeTracksRef.current.kick && sequenceMatrixRef.current.kick[step]) {
      const kick = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kick.type = "sine";
      kick.frequency.setValueAtTime(110, now); // high slap
      kick.frequency.exponentialRampToValueAtTime(40, now + 0.18); // sub slide

      kickGain.gain.setValueAtTime(0.75, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      kick.connect(kickGain);
      kickGain.connect(bandFilter);

      kick.start(now);
      kick.stop(now + 0.28);
    }

    // 3. RETRO CHOPPY CYBERMETIC TRAP SLAP (Claps / Snares on alternate beats)
    if (activeTracksRef.current.snare && sequenceMatrixRef.current.snare[step]) {
      // Synthesize noise buffer for pure sand texture
      const bufferSize = ctx.sampleRate * 0.12; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1400, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.14, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(bandFilter);

      noiseNode.start(now);
      noiseNode.stop(now + 0.13);
    }

    // 4. METALLIC METRONOME SPEED HAT (Eighth note pulses)
    if (activeTracksRef.current.hihat && sequenceMatrixRef.current.hihat[step]) {
      const hat = ctx.createOscillator();
      const hatGain = ctx.createGain();

      hat.type = "triangle";
      hat.frequency.setValueAtTime(12000, now); 

      hatGain.gain.setValueAtTime(0.045, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      hat.connect(hatGain);
      hatGain.connect(bandFilter);

      hat.start(now);
      hat.stop(now + 0.05);
    }
  };

  // Draws a beautiful premium vertical pill-shaped solid soundwave that oscillates to frequencies when playing, and shows slow sinusoidal movement when paused
  const startWaveformRender = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    if (!analyser) return;

    // We use frequency data for a classic spectrum analyzer wave
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      animationFrameIdRef.current = requestAnimationFrame(draw);

      const innerCanvas = canvasRef.current;
      const innerCtx = innerCanvas.getContext("2d");
      if (!innerCtx) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // 1. Draw solid dark background matching the surrounding card aesthetics
      innerCtx.fillStyle = "rgba(4, 4, 3, 1)"; // Deep obsidian
      innerCtx.fillRect(0, 0, innerCanvas.width, innerCanvas.height);

      const width = innerCanvas.width;
      const height = innerCanvas.height;
      const centerY = height / 2;

      // Vertical rounded pills configuration
      const barWidth = 3.5;
      const gap = 2;
      const totalBarWidth = barWidth + gap;
      const numBars = Math.min(110, Math.floor(width / totalBarWidth));
      
      const timeSecs = Date.now() * 0.0025; // Continuous timestamp for idle wave oscillation

      for (let i = 0; i < numBars; i++) {
        // Calculate centered x coordinate for this bar
        const xOffset = (width - (numBars * totalBarWidth)) / 2;
        const x = xOffset + i * totalBarWidth + barWidth / 2;

        let amplitude = 0;
        if (isPlayingBeat) {
          // Map frequency spectrum indices from low to mid/high frequencies
          const freqIndex = Math.floor((i / numBars) * (bufferLength * 0.7));
          amplitude = (dataArray[freqIndex] / 255.0) * (height * 0.85);
        } else {
          // GENTLE IDLE OSCILLATION - Overlapping natural sine/cosine wave peaks for a continuous organic pulse
          const sine1 = Math.sin(i * 0.12 - timeSecs) * 14;
          const sine2 = Math.cos(i * 0.22 + timeSecs * 1.5) * 8;
          const sine3 = Math.sin(i * 0.05 + timeSecs * 0.6) * 10;
          amplitude = 5 + Math.abs(sine1 + sine2 + sine3);
        }

        const finalHeight = Math.max(4, Math.min(height - 10, amplitude));

        // Draw vertical pill bar with round line ends
        innerCtx.beginPath();
        innerCtx.lineWidth = barWidth;
        innerCtx.lineCap = "round";

        // Progress coloring to mimic premium tracks (amber-gold on left, muted grey on right)
        const progressLimit = isPlayingBeat ? (stepTrackerRef.current % 16) / 16 : 0.6;
        const barFraction = i / numBars;

        if (barFraction <= progressLimit) {
          innerCtx.strokeStyle = "rgba(217, 214, 202, 0.9)"; // Signature Premium Bone
          innerCtx.shadowBlur = 4;
          innerCtx.shadowColor = "rgba(217, 214, 202, 0.4)";
        } else {
          innerCtx.strokeStyle = "rgba(100, 95, 85, 0.35)"; // Muted gray-brown
          innerCtx.shadowBlur = 0;
        }

        innerCtx.moveTo(x, centerY - finalHeight / 2);
        innerCtx.lineTo(x, centerY + finalHeight / 2);
        innerCtx.stroke();
      }

      // Reset shadow properties for other UI components
      innerCtx.shadowBlur = 0;
    };

    draw();
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

  const getTierDetails = (tierId: string | null) => {
    const tier = CONTRACT_TIERS.find(t => t.id === tierId);
    if (tier) return tier;
    return CONTRACT_TIERS[0];
  };

  const formattedTitle = fragment.name.toUpperCase();

  const formattedSegmentId = `0x${fragment.id.replace(":", "")}`;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      id={`fragment-detail-${fragment.id}`} 
      className="min-h-screen w-full bg-[#030303] text-[#D9D6CA] flex flex-col justify-start items-center p-4 sm:p-8 pb-12 relative select-none overflow-x-hidden bg-no-repeat"
      style={{ 
        backgroundImage: `linear-gradient(to bottom, rgba(3, 3, 3, 0) 0%, rgba(3, 3, 3, 0.5) 50%, rgba(3, 3, 3, 0.95) 90%, #030303 100%), url(${fragmentPageBackground})`,
        backgroundPosition: "center 60px",
        backgroundSize: "min(100%, 850px) auto"
      }}
    >
      {/* 1. Global CRT horizontal scanline texture overlay */}
      <div className="film-grain pointer-events-none opacity-20 z-[2]" />

      {/* Absolute dark vignette overlay around the edges for atmospheric depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90 pointer-events-none z-0" />

      {/* Minimal back button positioned top-left over the illustration */}
      <button 
        onClick={onBack}
        className="absolute top-5 left-5 z-[10] flex items-center gap-1.5 text-zinc-500 hover:text-white font-mono text-[8.5px] tracking-[0.25em] transition-colors cursor-pointer uppercase py-1 px-2.5 border border-zinc-900 bg-black/70 rounded-sm"
      >
        ← EXIT
      </button>

      {/* Widened content container aligned directly under the background image */}
      <div 
        className="w-full max-w-[850px] px-2 sm:px-5 pb-0 z-[3] flex flex-col space-y-4 text-left relative"
        style={{ marginTop: "calc(60px + min(56.25vw, 478px))" }}
      >
        
        {/* Title block */}
        <div className="space-y-1 text-left pl-0.5">
          <span className="text-[10px] tracking-[0.4em] text-zinc-500 font-mono uppercase block font-medium leading-none">
            FRAGMENT
          </span>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-[0.08em] text-[#D9D6CA] font-mono uppercase mt-1">
            {fragment.timestamp}
          </h2>
          
          {/* Hairline spacer with central geometric arrow divider */}
          <div className="flex items-center justify-start gap-3 w-[160px] sm:w-[200px] pt-1.5 opacity-60">
            <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent to-white/30" />
            <motion.svg
              viewBox="0 0 12 12"
              className="w-[10px] h-[10px] text-white flex-shrink-0"
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
            <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent to-white/30" />
          </div>
        </div>

        {/* PLAYBACK CONTROL BAR DIAL (Matches image play/pause widget block) */}
        <div className="w-full border border-zinc-900 bg-zinc-950/80 py-3.5 px-4 rounded-sm flex items-center justify-between gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            
            {/* Play/Pause Button */}
            <button
              onClick={() => {
                if (isPlayingBeat) {
                  pauseBeatPlay();
                } else {
                  startBeatPlay();
                }
              }}
              className="p-1.5 text-[#D9D6CA] hover:text-white transition-colors cursor-pointer shrink-0 flex items-center justify-center hover:scale-105 active:scale-95 duration-100"
              title={isPlayingBeat ? "Pause" : "Play"}
            >
              {isPlayingBeat ? (
                <Pause size={13} className="fill-[#D9D6CA] text-[#D9D6CA]" />
              ) : (
                <Play size={13} className="fill-[#D9D6CA] text-[#D9D6CA] ml-0.5" />
              )}
            </button>

            {/* Current Playback Marker Elapsed Time */}
            <span className="text-[9.5px] font-mono text-zinc-500 tracking-wider w-8 select-none">
              {formatTime(elapsedTime)}
            </span>

            {/* Sleek Interactive Progress Bar */}
            <div 
              id="progress-bar-seeker"
              className="flex-grow mx-4 h-1 bg-zinc-900 rounded-full relative cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                const targetTime = Math.floor(percentage * 103);
                setElapsedTime(Math.max(0, Math.min(103, targetTime)));
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-[#D9D6CA] rounded-full transition-all duration-150"
                style={{ width: `${(elapsedTime / 103) * 100}%` }}
              />
              {/* Little knob that appears on hover */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${(elapsedTime / 103) * 100}% - 4px)` }}
              />
            </div>

            {/* Total Duration Track length */}
            <span className="text-[9.5px] font-mono text-zinc-500 tracking-wider select-none shrink-0">
              01:43
            </span>

            {/* Volume feedback indicator and slider */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-zinc-900 shrink-0">
              <button
                onClick={() => setVolumeLevel(volumeLevel === 0 ? 0.7 : 0)}
                className="text-zinc-500 hover:text-[#D9D6CA] transition-colors cursor-pointer"
              >
                {volumeLevel === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumeLevel}
                onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                className="w-12 h-[2px] accent-[#D9D6CA] bg-zinc-800 rounded-lg cursor-pointer appearance-none range-sm focus:outline-none"
              />
            </div>
          </div>

          {/* METADATA GRID SECTION (No Recovered Artist, Full Width Request Clearance) */}
          <div className="w-full border border-zinc-900 bg-zinc-950/40 rounded-sm overflow-hidden flex shadow-[0_4px_12px_rgba(0,0,0,0.35)] !mt-24 sm:!mt-4">
            {/* Request Clearance Button */}
            <button
              id="request-clearance-btn"
              onClick={() => setShowLicensePanel(true)}
              className="w-full p-4 bg-zinc-950/80 hover:bg-zinc-900/60 font-mono font-medium text-[9px] sm:text-[11px] tracking-widest text-[#D9D6CA] hover:text-white flex items-center justify-center cursor-pointer transition-all uppercase whitespace-nowrap gap-2 h-[52px] sm:h-[58px] border-0 outline-none"
            >
              <span>REQUEST CLEARANCE</span>
              <span className="font-mono text-[10px] sm:text-sm shrink-0 select-none">→</span>
            </button>
          </div>

          {/* Under-Grid small decoration line */}
          <div className="w-full flex justify-center py-1 mt-1 z-10 font-mono text-zinc-700 text-[10px] select-none tracking-[0.3em]">
            |||
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
                <h3 className="text-sm sm:text-base font-mono font-bold tracking-[0.15em] text-[#D9D6CA] uppercase">
                  Choose contract type
                </h3>
                <button
                  onClick={() => {
                    setShowLicensePanel(false);
                    setSelectedTier(null);
                    setLicenseSuccess(false);
                  }}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-900/40 rounded-full transition-all cursor-pointer"
                  title="Close panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Multi-Column Layout */}
              <div className="flex flex-col md:flex-row p-6 md:p-8 gap-8 overflow-y-auto bg-gradient-to-b from-[#0b0b0b] to-[#040404]">
                {/* Left Column: Track preview summary card */}
                <div className="w-full md:w-1/4 flex flex-col items-center border-b md:border-b-0 md:border-r border-zinc-900/65 pb-6 md:pb-0 md:pr-8 shrink-0">
                  <div className="relative group w-44 h-44 bg-zinc-950 border border-[#D9D6CA]/30 overflow-hidden rounded-md shadow-[0_8px_30px_rgba(0,0,0,0.85)] flex items-center justify-center">
                    <img
                      src={owlBackground}
                      alt="The Sentinel Owl"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700 pointer-events-none select-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

                    {/* Circular Interactive Play Trigger Button Overlay */}
                    <button
                      onClick={() => {
                        if (isPlayingBeat) {
                          pauseBeatPlay();
                        } else {
                          startBeatPlay();
                        }
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer z-20"
                    >
                      <div className="w-12 h-12 rounded-full border border-[#D9D6CA] bg-[#0c0c0c]/90 flex items-center justify-center shadow-[0_0_15px_rgba(217,214,202,0.35)] transform hover:scale-105 transition-transform">
                        {isPlayingBeat ? (
                          <Pause size={14} className="fill-[#D9D6CA] text-[#D9D6CA] ml-0" />
                        ) : (
                          <Play size={14} className="fill-[#D9D6CA] text-[#D9D6CA] ml-0.5" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Empty space after image */}
                </div>

                {/* Right Column: Tiers Selection or Checkout Forms */}
                <div className="flex-grow space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {!selectedTier ? (
                    /* Display Tiers list matching mockup */
                    <div className="space-y-4 text-left">
                      {CONTRACT_TIERS.map((tier) => {
                        const isExpanded = expandedTiers[tier.id] || false;

                        return (
                          <div
                            key={tier.id}
                            className="bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 p-5 rounded-md flex flex-col transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="font-bold text-[#D9D6CA] text-sm tracking-wide">
                                  {tier.title}
                                </h4>
                                <span className="text-zinc-500 text-[10px] font-mono tracking-wider block uppercase">
                                  {tier.subtitle}
                                </span>
                              </div>

                              {/* Price check out buttons */}
                              <button
                                onClick={() => {
                                  if (onAddToCart) {
                                    onAddToCart(fragment, tier.id, tier.title, `$${tier.price}`);
                                  }
                                  setShowLicensePanel(false);
                                }}
                                className="bg-[#D9D6CA] hover:bg-white text-black font-mono font-bold text-[9.5px] tracking-wider px-4 py-2 flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(217,214,202,0.2)] rounded-sm cursor-pointer shrink-0"
                              >
                                <ShoppingBag size={10} className="fill-current text-current" />
                                <span>+ ${tier.price}</span>
                              </button>
                            </div>

                            {/* Show/Hide usage terms accordion link */}
                            <div className="mt-3 text-left">
                              <button
                                onClick={() =>
                                  setExpandedTiers((prev) => ({
                                    ...prev,
                                    [tier.id]: !prev[tier.id],
                                  }))
                                }
                                className="flex items-center gap-1 text-[8.5px] font-mono tracking-widest text-[#D9D6CA]/80 hover:text-[#D9D6CA] cursor-pointer"
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
                                    <div className="mt-4 pl-3 border-l border-[#D9D6CA]/35 py-1 text-[10px] font-mono text-zinc-300">
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">File Delivery</span>
                                          <span className="text-zinc-200">{tier.fileDelivery}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Distribution Limit</span>
                                          <span className="text-zinc-200">{tier.distributionLimit}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Streaming Limit</span>
                                          <span className="text-zinc-200">{tier.streamingLimit}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Video Use</span>
                                          <span className="text-zinc-200">{tier.videoUse}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Monetization</span>
                                          <span className="text-zinc-200">{tier.monetization}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Performance Rights</span>
                                          <span className="text-zinc-200">{tier.performanceRights}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Term</span>
                                          <span className="text-zinc-200">{tier.term}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Territory</span>
                                          <span className="text-zinc-200">{tier.territory}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Publishing Split</span>
                                          <span className="text-zinc-200">{tier.publishingSplit}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Master Ownership</span>
                                          <span className="text-zinc-200">{tier.masterOwnership}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Exclusivity</span>
                                          <span className="text-zinc-200">{tier.exclusivity}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">Contract Version</span>
                                          <span className="text-zinc-200">{tier.contractVersion}</span>
                                        </div>
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
                          className="text-[9px] font-mono text-[#D9D6CA] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          ← Select another contract
                        </button>
                        <span className="text-[8.5px] font-mono text-zinc-500 tracking-wider">
                          SECURE CHANCELLOR LINK
                        </span>
                      </div>

                      {licenseSuccess ? (
                        <div className="text-center py-6 space-y-3 font-mono">
                          <span className="text-xs font-bold text-[#D9D6CA] tracking-widest block">
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
                            className="text-[10px] font-mono text-black bg-[#D9D6CA] px-4 py-2 tracking-widest uppercase hover:bg-white transition-colors cursor-pointer mt-3"
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
                              {getTierDetails(selectedTier).title.toUpperCase()} — ${getTierDetails(selectedTier).price}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block">
                              Client Credentials Email Address *
                            </label>
                            <div className="relative flex items-center bg-zinc-950 border border-zinc-900 px-3 py-2.5 rounded-sm focus-within:border-[#D9D6CA]">
                              <Mail size={12} className="text-zinc-600 mr-2 shrink-0" />
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
                            <p className="font-sans font-light">
                              By approving this secure checkout contract transfer, you acknowledge the terms of the mechanical and master raw audio stem usage guidelines. ZERO audio tag marks are embedded on final delivery tracks.
                            </p>
                          </div>

                          <button
                            type="submit"
                            disabled={isProcessingLicense}
                            className="w-full py-3.5 bg-[#D9D6CA] hover:bg-white text-black font-semibold tracking-widest uppercase transition-colors rounded-none cursor-pointer flex items-center justify-center gap-2 text-[10px] font-mono shadow-[0_4px_12px_rgba(217,214,202,0.15)]"
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

      {/* FOOTER BAR */}
   
    </div>
  );
}
