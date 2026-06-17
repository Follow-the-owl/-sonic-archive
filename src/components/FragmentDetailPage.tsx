import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Square, ShieldCheck, Mail, ArrowLeft, Download, Award, Volume2, VolumeX, Radio, Pause, RotateCcw, Sliders, Music, Layers, X, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { Fragment } from "../data";
import { stopAudio } from "../audio";
import { RadioactiveIcon } from "./WelcomeScreen";
const owlBackground = "https://res.cloudinary.com/dqg8pcmvz/image/upload/v1781704888/WhatsApp_Image_2026-06-17_at_14.50.42_nrxame.jpg";

const waveHeights = [
  8, 14, 18, 10, 6, 12, 24, 32, 16, 20, 
  38, 28, 42, 18, 30, 24, 12, 16, 32, 45, 
  38, 26, 14, 8, 22, 34, 18, 12, 10, 6
];

interface FragmentDetailPageProps {
  fragment: Fragment;
  onBack: () => void;
}

export default function FragmentDetailPage({ fragment, onBack }: FragmentDetailPageProps) {
  const [isPlayingBeat, setIsPlayingBeat] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showLicensePanel, setShowLicensePanel] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"mp3" | "mp3-wav" | "premium" | "exclusive" | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({
    "mp3": false,
    "mp3-wav": false,
    "premium": false,
    "exclusive": false
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
          innerCtx.strokeStyle = "rgba(197, 160, 89, 0.9)"; // Signature premium gold/amber
          innerCtx.shadowBlur = 4;
          innerCtx.shadowColor = "rgba(197, 160, 89, 0.4)";
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
      className="min-h-screen w-full bg-[#030303] text-[#D9D6CA] flex flex-col justify-end items-center p-4 sm:p-8 pb-3 sm:pb-5 relative select-none overflow-x-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${owlBackground})` }}
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

      {/* Widened content container aligned bottom and constrained to 850px */}
      <div className="w-full max-w-[850px] px-2 sm:px-5 pb-0 z-[3] flex flex-col space-y-4 text-left relative mt-auto">
        
        {/* Title block */}
        <div className="space-y-1 text-left pl-0.5">
          <span className="text-[10px] tracking-[0.4em] text-zinc-500 font-mono uppercase block font-medium leading-none">
            FRAGMENT
          </span>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-[0.08em] text-[#D9D6CA] font-mono uppercase mt-1">
            {fragment.timestamp}
          </h2>
          <p className="text-[10px] tracking-widest text-[#D9D6CA]/60 font-mono uppercase mt-0.5">
            {fragment.name}
          </p>
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

            {/* Static Waveform visualization spikes */}
            <div className="flex-grow flex items-center gap-[3px] h-8 justify-center min-w-0">
              {waveHeights.map((h, i) => {
                const progressLimit = (elapsedTime / 103);
                const isPassed = (i / waveHeights.length) <= progressLimit;
                // Add a highly responsive ripple if playing
                const ripple = isPlayingBeat ? Math.sin((elapsedTime * 4) + i * 0.4) * (h * 0.25) : 0;
                const finalH = Math.max(3, h + ripple);

                return (
                  <div
                    key={i}
                    className="w-[2px] rounded-sm transition-all duration-150"
                    style={{
                      height: `${finalH}px`,
                      backgroundColor: isPassed ? '#D9D6CA' : 'rgba(217, 214, 202, 0.15)'
                    }}
                  />
                );
              })}
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

          {/* METADATA GRID SECTION (Matches screenshot grid table) */}
          <div className="w-full border border-zinc-900 bg-zinc-950/40 rounded-sm overflow-hidden flex flex-row divide-x divide-zinc-900 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
            
            {/* Box 1: Recovered Artist */}
            <div className="flex-[1.5] min-w-0 p-2 sm:p-3 flex flex-col justify-between h-[48px] sm:h-[52px]">
              <span className="text-[7.5px] sm:text-[8.5px] font-mono text-zinc-500 tracking-[0.08em] sm:tracking-[0.12em] uppercase block font-medium leading-none truncate">
                RECOVERED ARTIST:
              </span>
              <span className="text-[#D9D6CA] text-[10px] sm:text-[12.5px] font-mono font-medium truncate mt-1">
                Unknown
              </span>
            </div>

            {/* Box 2: Track Length */}
            <div className="flex-[0.9] min-w-0 p-2 sm:p-3 flex flex-col justify-between h-[48px] sm:h-[52px]">
              <span className="text-[7.5px] sm:text-[8.5px] font-mono text-zinc-500 tracking-[0.08em] sm:tracking-[0.12em] uppercase block font-medium leading-none truncate">
                LENGTH:
              </span>
              <span className="text-[#D9D6CA] text-[10px] sm:text-[12.5px] font-mono font-medium mt-1">
                01:43
              </span>
            </div>

            {/* Box 3: Signal Integrity */}
            <div className="flex-[1.5] min-w-0 p-2 sm:p-3 flex flex-col justify-between h-[48px] sm:h-[52px] text-left">
              <span className="text-[7.5px] sm:text-[8.5px] font-mono text-zinc-500 tracking-[0.08em] sm:tracking-[0.12em] uppercase block font-medium leading-none truncate">
                SIGNAL INTEGRITY:
              </span>
              <div className="mt-1">
                <span className="text-[#D9D6CA] text-[10px] sm:text-[12.5px] font-mono font-medium block leading-none">
                  93%
                </span>
                <div className="w-full bg-zinc-900 h-[1.5px] mt-1 overflow-hidden">
                  <div className="bg-[#D9D6CA] h-full" style={{ width: "93%" }} />
                </div>
              </div>
            </div>

            {/* Box 4: Current Status */}
            <div className="flex-[0.9] min-w-0 p-2 sm:p-3 flex flex-col justify-between h-[48px] sm:h-[52px] text-left">
              <span className="text-[7.5px] sm:text-[8.5px] font-mono text-zinc-500 tracking-[0.08em] sm:tracking-[0.12em] uppercase block font-medium leading-none truncate">
                STATUS:
              </span>
              <span className="text-[#D9D6CA] text-[10px] sm:text-[12.5px] font-mono font-medium uppercase mt-1 truncate">
                Active
              </span>
            </div>

            {/* Box 5: Request Clearance */}
            <button
              onClick={() => setShowLicensePanel(true)}
              className="flex-[1.6] min-w-0 p-2 sm:px-3 sm:py-3.5 bg-zinc-950/85 hover:bg-zinc-900/60 font-mono font-medium text-[7.5px] sm:text-[9.5px] tracking-wider sm:tracking-widest text-[#D9D6CA] hover:text-white flex items-center justify-center cursor-pointer transition-all uppercase whitespace-nowrap gap-1 h-[48px] sm:h-[52px] border-0 outline-none"
            >
              <span className="truncate">REQUEST CLEARANCE</span>
              <span className="font-mono text-[9px] sm:text-xs shrink-0 select-none">→</span>
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
                <h3 className="text-sm sm:text-base font-mono font-bold tracking-[0.15em] text-[#C5A059] uppercase">
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
                  <div className="relative group w-44 h-44 bg-zinc-950 border border-[#C5A059]/30 overflow-hidden rounded-md shadow-[0_8px_30px_rgba(0,0,0,0.85)] flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-black to-zinc-950 flex flex-col items-center justify-center relative p-6">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.08)_0%,transparent_70%)]" />
                      <RadioactiveIcon className="w-16 h-16 text-[#C5A059] animate-spin-slow" />
                      <span className="text-[7.5px] font-mono text-[#C5A059] absolute bottom-3.5 tracking-widest text-center uppercase font-bold">FTO SECURE RECORDER</span>
                    </div>

                    {/* Circular Interactive Play Trigger Button Overlay */}
                    <button
                      onClick={() => {
                        if (isPlayingBeat) {
                          pauseBeatPlay();
                        } else {
                          startBeatPlay();
                        }
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
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
                        <span className="w-1 h-3.5 bg-[#C5A059] origin-bottom animate-bounce animate-duration-1000" style={{ animationDelay: "0.1s" }} />
                        <span className="w-1 h-2 bg-[#C5A059] origin-bottom animate-bounce animate-duration-750" style={{ animationDelay: "0.3s" }} />
                        <span className="w-1 h-3 bg-[#C5A059] origin-bottom animate-bounce animate-duration-1200" style={{ animationDelay: "0.2s" }} />
                      </div>
                    )}
                  </div>

                  <span className="text-white text-base font-bold text-center mt-5 truncate max-w-full block tracking-wide">
                    {fragment.name}
                  </span>
                  <span className="text-zinc-500 text-[10px] font-mono text-center mt-1.5 tracking-wider uppercase">
                    Ozedikus // FOLLOW THE OWL
                  </span>
                </div>

                {/* Right Column: Tiers Selection or Checkout Forms */}
                <div className="flex-grow space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {!selectedTier ? (
                    /* Display Tiers list matching mockup */
                    <div className="space-y-4 text-left">
                      {(["mp3", "mp3-wav", "premium", "exclusive"] as const).map((tierId) => {
                        const info = getTierDetails(tierId);
                        const isExpanded = expandedTiers[tierId] || false;

                        return (
                          <div
                            key={tierId}
                            className="bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-805 p-5 rounded-md flex flex-col transition-all duration-200"
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
                                className="bg-[#C5A059] hover:bg-white text-black font-mono font-bold text-[9.5px] tracking-wider px-4 py-2 flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(197,160,89,0.2)] rounded-sm cursor-pointer shrink-0"
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
                                className="flex items-center gap-1 text-[8.5px] font-mono tracking-widest text-[#C5A059]/80 hover:text-[#C5A059] cursor-pointer"
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
                                        <span className="text-zinc-650 text-[8px] font-mono font-bold tracking-wider block uppercase">
                                          SPECIFIC DELIVERABLES & RIGHTS:
                                        </span>
                                        <p className="text-zinc-500 text-[9.5px] font-mono leading-relaxed pl-1">
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
                          className="text-[9px] font-mono text-[#C5A059] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
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
                            className="text-[10px] font-mono text-black bg-[#C5A059] px-4 py-2 tracking-widest uppercase hover:bg-white transition-colors cursor-pointer mt-3"
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
                            className="w-full py-3.5 bg-[#C5A059] hover:bg-white text-black font-semibold tracking-widest uppercase transition-colors rounded-none cursor-pointer flex items-center justify-center gap-2 text-[10px] font-mono shadow-[0_4px_12px_rgba(197,160,89,0.15)]"
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
      <div className="w-full max-w-4xl text-center text-[8.5px] font-mono tracking-[0.38em] text-zinc-700 uppercase z-10 select-none pt-12">
        <span>FOLLOW THE OWL SECURED CORE // CALIBRATION METRICS ONLINE</span>
      </div>
    </div>
  );
}
