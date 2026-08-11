// Tone.js Web Audio Engine for LOMON / UNKNOWN
import * as Tone from "tone";
import { FRAGMENTS } from "./data";

let isToneInitialized = false;
let toneMasterVolume: Tone.Volume | null = null;
let rawAnalyser: AnalyserNode | null = null;
let masterVolumeLevel = 0.7;

// Tone.Player state for MP3 fragment playback
let currentTonePlayer: Tone.Player | null = null;
let currentBufferDuration = 0;
let playbackStartedAt = 0;
let playbackOffsetSec = 0;
let isPlayingState = false;
let isLoadingState = false;
let activeId: string | null = null;
let activeCallback: ((isPlaying: boolean, fragmentId: string | null) => void) | null = null;

// Ambient and Synth Node state
let ambientGain: GainNode | null = null;
let currentAmbientSectionName: string | null = null;
let ambientState: {
  oscillators: (OscillatorNode | AudioBufferSourceNode)[];
  gainNodes: GainNode[];
  intervals: any[];
} | null = null;
let isAmbientEnabled = true;

let currentNodes: {
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
  filterNode?: BiquadFilterNode;
  delayNode?: DelayNode;
} | null = null;
let lfoOsc: OscillatorNode | null = null;

function pctToDb(pct: number): number {
  const clamped = Math.max(0, Math.min(1, pct));
  if (clamped <= 0.0001) return -100;
  return 20 * Math.log10(clamped);
}

function getAudioCtx(): AudioContext | null {
  try {
    initToneEngine();
    return (Tone.getContext().rawContext as AudioContext) || null;
  } catch (e) {
    return null;
  }
}

export function getGlobalAnalyser(): AnalyserNode | null {
  initToneEngine();
  return rawAnalyser;
}

export function getAudioContext(): AudioContext | null {
  return getAudioCtx();
}

export function registerAudioCallback(callback: (isPlaying: boolean, fragmentId: string | null) => void) {
  activeCallback = callback;
}

export async function ensureToneStarted() {
  initToneEngine();
  if (Tone.getContext().state !== "running") {
    await Tone.start();
  }
}

function initToneEngine() {
  if (!isToneInitialized) {
    try {
      toneMasterVolume = new Tone.Volume(pctToDb(masterVolumeLevel));
      toneMasterVolume.toDestination();

      const rawCtx = Tone.getContext().rawContext as AudioContext;
      if (rawCtx) {
        rawAnalyser = rawCtx.createAnalyser();
        rawAnalyser.fftSize = 256;
        rawAnalyser.smoothingTimeConstant = 0.7;

        // Route Destination output to rawAnalyser so spectrum analysis works globally
        Tone.getDestination().connect(rawAnalyser);

        // Setup ambient gain channel
        ambientGain = rawCtx.createGain();
        ambientGain.gain.setValueAtTime(isAmbientEnabled ? 1.0 : 0.0, rawCtx.currentTime);
        ambientGain.connect(rawCtx.destination);
      }
      isToneInitialized = true;
    } catch (e) {
      console.error("Failed to initialize Tone.js engine:", e);
    }
  }
}

export function setMasterVolume(pct: number) {
  masterVolumeLevel = Math.min(1, Math.max(0, pct));
  const db = pctToDb(masterVolumeLevel);
  if (toneMasterVolume) {
    toneMasterVolume.volume.rampTo(db, 0.05);
  } else {
    Tone.getDestination().volume.rampTo(db, 0.05);
  }
}

export function getMasterVolume(): number {
  return masterVolumeLevel;
}

export function getOptimizedAudioUrl(url: string | undefined | null): string {
  if (!url) return "";

  let result = url.trim();

  // Handle Cloudinary delivery URLs
  if (result.includes("cloudinary.com") && result.includes("/upload/")) {
    if (!result.includes("f_mp3,br_128k") && !result.includes("f_mp3")) {
      result = result.replace("/upload/", "/upload/f_mp3,br_128k/");
    }
    result = result.replace(/\.wav(\?.*)?$/i, ".mp3$1");
    return result;
  }

  if (result.endsWith(".wav")) {
    return result.replace(/\.wav$/, ".mp3");
  }

  return result;
}

export function preloadAllAudio() {
  if (typeof window === "undefined") return;
  FRAGMENTS.forEach((frag) => {
    if (frag.mp3Preview) {
      const optimizedUrl = getOptimizedAudioUrl(frag.mp3Preview);
      Tone.ToneAudioBuffer.fromUrl(optimizedUrl).catch(() => {});
    }
  });
}

export function getCurrentAudioElement(): HTMLAudioElement | null {
  return null;
}

export function getCurrentTime(): number {
  if (currentTonePlayer && isPlayingState && currentBufferDuration > 0) {
    const elapsed = Tone.now() - playbackStartedAt;
    return (elapsed % currentBufferDuration);
  }
  return playbackOffsetSec;
}

export function getDuration(): number {
  if (currentTonePlayer && currentBufferDuration > 0) {
    return currentBufferDuration;
  }
  return 0;
}

export function seekAudio(seconds: number) {
  const dur = getDuration() || seconds;
  const validSec = Math.max(0, Math.min(seconds, dur));
  playbackOffsetSec = validSec;

  if (currentTonePlayer && isPlayingState) {
    playbackStartedAt = Tone.now() - validSec;
    try {
      currentTonePlayer.stop();
      currentTonePlayer.start(0, validSec);
    } catch (e) {
      console.error("Error seeking Tone.Player:", e);
    }
  }
}

export function pauseAudio() {
  if (currentTonePlayer && isPlayingState) {
    playbackOffsetSec = getCurrentTime();
    try {
      currentTonePlayer.stop();
    } catch (e) {}
  }
  isPlayingState = false;
  if (activeCallback) activeCallback(false, activeId);
}

export async function resumeAudio() {
  await ensureToneStarted();
  if (currentTonePlayer && activeId) {
    playbackStartedAt = Tone.now() - playbackOffsetSec;
    try {
      currentTonePlayer.start(0, playbackOffsetSec);
      isPlayingState = true;
      if (activeCallback) activeCallback(true, activeId);
    } catch (e) {
      console.error("Error resuming Tone.Player:", e);
    }
  } else if (activeId) {
    const frag = FRAGMENTS.find((f) => f.id === activeId);
    if (frag) {
      playFragment(frag.id, frag.frequency || 110, frag.synthType || "drone");
    }
  }
}

export function isAudioPaused(): boolean {
  return !isPlayingState;
}

export function isAudioLoading(): boolean {
  return isLoadingState;
}

export function stopAudio() {
  // CRITICAL: Stop and dispose Tone.Player instance to avoid memory leaks
  if (currentTonePlayer) {
    try {
      currentTonePlayer.stop();
      currentTonePlayer.dispose();
    } catch (e) {}
    currentTonePlayer = null;
  }

  if (currentNodes) {
    currentNodes.oscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    if (lfoOsc) {
      try {
        lfoOsc.stop();
      } catch (e) {}
      lfoOsc = null;
    }
    currentNodes = null;
  }

  isPlayingState = false;
  isLoadingState = false;
  playbackOffsetSec = 0;
  currentBufferDuration = 0;
  activeId = null;

  if (activeCallback) activeCallback(false, null);
}

// Global window unload, pagehide, and visibilitychange listeners
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    stopAudio();
  });
  window.addEventListener("pagehide", () => {
    stopAudio();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAudio();
    }
  });
}

export function toggleFragment(
  id: string,
  frequency: number,
  synthType: "drone" | "keys" | "bell" | "noise" | "pulse"
) {
  if (activeId === id && isPlayingState) {
    pauseAudio();
  } else if (activeId === id && !isPlayingState) {
    resumeAudio();
  } else {
    playFragment(id, frequency, synthType);
  }
}

export async function playFragment(
  id: string,
  frequency: number = 110,
  synthType: "drone" | "keys" | "bell" | "noise" | "pulse" = "drone"
) {
  await ensureToneStarted();

  if (activeId === id && currentTonePlayer && isPlayingState) {
    return;
  }

  // Cleanly stop and dispose previous player instance
  stopAudio();

  const fragment = FRAGMENTS.find((f) => f.id === id);
  if (fragment && fragment.mp3Preview) {
    const optimizedUrl = getOptimizedAudioUrl(fragment.mp3Preview);
    isLoadingState = true;
    activeId = id;
    playbackOffsetSec = 0;

    try {
      const player = new Tone.Player({
        url: optimizedUrl,
        loop: true,
        autostart: false,
        onload: () => {
          isLoadingState = false;
          if (activeId === id && player === currentTonePlayer) {
            currentBufferDuration = player.buffer.duration || 0;
            playbackStartedAt = Tone.now() - playbackOffsetSec;
            player.start(0, playbackOffsetSec);
            isPlayingState = true;
            if (activeCallback) activeCallback(true, id);
          }
        },
        onerror: (err) => {
          console.error("Tone.Player load error for fragment " + id, err);
          isLoadingState = false;
          if (activeCallback) activeCallback(false, id);
        }
      });

      if (toneMasterVolume) {
        player.connect(toneMasterVolume);
      } else {
        player.toDestination();
      }

      player.loop = true; // Sample-accurate, gapless looping
      currentTonePlayer = player;

      if (player.loaded) {
        isLoadingState = false;
        currentBufferDuration = player.buffer.duration || 0;
        playbackStartedAt = Tone.now() - playbackOffsetSec;
        player.start(0, playbackOffsetSec);
        isPlayingState = true;
        if (activeCallback) activeCallback(true, id);
      } else {
        if (activeCallback) activeCallback(true, id);
      }
      return;
    } catch (e) {
      console.error("Failed to load or play MP3 with Tone.Player. Falling back to synth.", e);
      isLoadingState = false;
    }
  }

  // Synth Fallback using Tone Context
  const audioCtx = getAudioCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const oscillators: OscillatorNode[] = [];
  const gainNodes: GainNode[] = [];

  const delay = audioCtx.createDelay(2.0);
  delay.delayTime.setValueAtTime(0.4, now);
  
  const delayGain = audioCtx.createGain();
  delayGain.gain.setValueAtTime(0.3, now);

  delay.connect(delayGain);
  delayGain.connect(delay);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, now);

  const masterOut = ambientGain || audioCtx.destination;

  if (synthType === "drone") {
    filter.frequency.setValueAtTime(450, now);

    const osc1 = audioCtx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(frequency, now);

    const osc2 = audioCtx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(frequency * 1.5 + 0.5, now);

    const osc3 = audioCtx.createOscillator();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(frequency / 2 - 1, now);

    const g1 = audioCtx.createGain();
    const g2 = audioCtx.createGain();
    const g3 = audioCtx.createGain();

    g1.gain.setValueAtTime(0.001, now);
    g1.gain.exponentialRampToValueAtTime(0.25, now + 1.5);

    g2.gain.setValueAtTime(0.001, now);
    g2.gain.exponentialRampToValueAtTime(0.12, now + 2.0);

    g3.gain.setValueAtTime(0.001, now);
    g3.gain.exponentialRampToValueAtTime(0.35, now + 1.0);

    osc1.connect(g1);
    osc2.connect(g2);
    osc3.connect(g3);

    const lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.15, now);
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(150, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    g1.connect(filter);
    g2.connect(filter);
    g3.connect(filter);

    lfo.start(now);
    lfoOsc = lfo;

    filter.connect(masterOut);
    filter.connect(delay);
    delayGain.connect(masterOut);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    oscillators.push(osc1, osc2, osc3);
    gainNodes.push(g1, g2, g3);

  } else if (synthType === "keys") {
    filter.frequency.setValueAtTime(1200, now);
    const freqs = [frequency, frequency * 1.25, frequency * 1.5, frequency * 2.0];
    
    freqs.forEach((f, index) => {
      const osc = audioCtx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now);

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, now);
      const delayOffset = index * 0.18;
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.1 + delayOffset);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.5 + delayOffset);

      osc.connect(g);
      g.connect(filter);
      
      osc.start(now);
      osc.stop(now + 3.5);
      oscillators.push(osc);
      gainNodes.push(g);
    });

    filter.connect(masterOut);
    filter.connect(delay);
    delayGain.connect(masterOut);

    let cycleCounter = 1;
    const intervalId = setInterval(() => {
      if (activeId !== id) {
        clearInterval(intervalId);
        return;
      }
      const triggerTime = audioCtx.currentTime;
      const modifier = cycleCounter % 3 === 0 ? 0.9 : cycleCounter % 3 === 1 ? 1.0 : 1.12;
      
      freqs.forEach((f, index) => {
        const oInput = audioCtx.createOscillator();
        oInput.type = "triangle";
        oInput.frequency.setValueAtTime(f * modifier, triggerTime);

        const gVal = audioCtx.createGain();
        gVal.gain.setValueAtTime(0.001, triggerTime);
        const delayOffset = index * 0.15;
        gVal.gain.exponentialRampToValueAtTime(0.15, triggerTime + 0.1 + delayOffset);
        gVal.gain.exponentialRampToValueAtTime(0.001, triggerTime + 2.8 + delayOffset);

        oInput.connect(gVal);
        gVal.connect(filter);

        oInput.start(triggerTime);
        oInput.stop(triggerTime + 4.0);

        if (currentNodes) {
          currentNodes.oscillators.push(oInput);
          currentNodes.gainNodes.push(gVal);
        }
      });
      cycleCounter++;
    }, 4500);

  } else if (synthType === "bell") {
    filter.frequency.setValueAtTime(1500, now);
    const partials = [1.0, 1.5, 1.98, 2.44, 3.0, 4.1];
    const partialGains = [0.22, 0.15, 0.1, 0.08, 0.05, 0.03];

    partials.forEach((p, idx) => {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency * p, now);

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(partialGains[idx], now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);

      osc.connect(g);
      g.connect(masterOut);
      g.connect(delay);

      osc.start(now);
      oscillators.push(osc);
      gainNodes.push(g);
    });

    delayGain.connect(masterOut);

    const bellInterval = setInterval(() => {
      if (activeId !== id) {
        clearInterval(bellInterval);
        return;
      }
      const tollTime = audioCtx.currentTime;
      partials.forEach((p, idx) => {
        const osc = audioCtx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency * p * (1 + (Math.random() * 0.004 - 0.002)), tollTime);

        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.001, tollTime);
        g.gain.exponentialRampToValueAtTime(partialGains[idx], tollTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, tollTime + 5.0);

        osc.connect(g);
        osc.connect(delay);
        g.connect(masterOut);

        osc.start(tollTime);
        osc.stop(tollTime + 6.0);

        if (currentNodes) {
          currentNodes.oscillators.push(osc);
          currentNodes.gainNodes.push(g);
        }
      });
    }, 6000);

  } else if (synthType === "noise") {
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(250, now);
    noiseFilter.Q.setValueAtTime(1.0, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.12, now + 1.5);

    const padOsc = audioCtx.createOscillator();
    padOsc.type = "triangle";
    padOsc.frequency.setValueAtTime(frequency, now);

    const padGain = audioCtx.createGain();
    padGain.gain.setValueAtTime(0.001, now);
    padGain.gain.exponentialRampToValueAtTime(0.15, now + 2.0);

    const waveLfo = audioCtx.createOscillator();
    waveLfo.type = "sine";
    waveLfo.frequency.setValueAtTime(0.08, now);
    const wavesGain = audioCtx.createGain();
    wavesGain.gain.setValueAtTime(120, now);

    waveLfo.connect(wavesGain);
    wavesGain.connect(noiseFilter.frequency);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterOut);

    padOsc.connect(padGain);
    padGain.connect(masterOut);

    whiteNoise.start(now);
    padOsc.start(now);
    waveLfo.start(now);

    lfoOsc = waveLfo;
    oscillators.push(padOsc, whiteNoise as any);
    gainNodes.push(noiseGain, padGain);

  } else if (synthType === "pulse") {
    filter.frequency.setValueAtTime(120, now);

    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency / 2, now);

    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.6, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(g);
    g.connect(filter);
    filter.connect(masterOut);

    osc.start(now);
    oscillators.push(osc);
    gainNodes.push(g);

    const pulseInterval = setInterval(() => {
      if (activeId !== id) {
        clearInterval(pulseInterval);
        return;
      }
      const trigger = audioCtx.currentTime;
      const pulseOsc = audioCtx.createOscillator();
      pulseOsc.type = "sine";
      pulseOsc.frequency.setValueAtTime(frequency / 2, trigger);

      const pulseG = audioCtx.createGain();
      pulseG.gain.setValueAtTime(0.001, trigger);
      pulseG.gain.exponentialRampToValueAtTime(0.5, trigger + 0.05);
      pulseG.gain.exponentialRampToValueAtTime(0.001, trigger + 0.5);

      pulseOsc.connect(pulseG);
      pulseG.connect(filter);

      pulseOsc.start(trigger);
      pulseOsc.stop(trigger + 1.0);

      if (currentNodes) {
        currentNodes.oscillators.push(pulseOsc);
        currentNodes.gainNodes.push(pulseG);
      }
    }, 1500);
  }

  currentNodes = {
    oscillators,
    gainNodes,
    filterNode: filter,
    delayNode: delay
  };

  activeId = id;
  isPlayingState = true;
  if (activeCallback) activeCallback(true, id);
}

export function getActiveId(): string | null {
  return activeId;
}

export function isAmbientOn(): boolean {
  return isAmbientEnabled;
}

export function toggleAmbientAtmosphere(): boolean {
  isAmbientEnabled = !isAmbientEnabled;
  const audioCtx = getAudioCtx();
  if (ambientGain && audioCtx) {
    const targetVal = isAmbientEnabled ? 1.0 : 0.0;
    ambientGain.gain.cancelScheduledValues(audioCtx.currentTime);
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, audioCtx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(targetVal, audioCtx.currentTime + 1.2);
  }
  
  if (isAmbientEnabled && currentAmbientSectionName) {
    const sec = currentAmbientSectionName;
    currentAmbientSectionName = null;
    transitionAmbient(sec);
  } else if (!isAmbientEnabled && ambientState) {
    const oldState = ambientState;
    ambientState = null;
    oldState.intervals.forEach((intervalId) => clearInterval(intervalId));
    oldState.oscillators.forEach((osc) => {
      try { osc.stop(); } catch (e) {}
    });
  }

  return isAmbientEnabled;
}

export function transitionAmbient(sectionName: string) {
  const audioCtx = getAudioCtx();
  if (!audioCtx || !ambientGain) return;

  if (currentAmbientSectionName === sectionName && ambientState) {
    return;
  }

  const now = audioCtx.currentTime;

  if (ambientState) {
    const fadeOutTime = 1.5;
    const oldState = ambientState;
    ambientState = null;

    oldState.intervals.forEach((intervalId) => clearInterval(intervalId));

    oldState.gainNodes.forEach((g) => {
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + fadeOutTime);
      } catch (e) {
        try { g.gain.setValueAtTime(0, now); } catch (err) {}
      }
    });

    setTimeout(() => {
      oldState.oscillators.forEach((osc) => {
        try { osc.stop(); } catch (e) {}
      });
    }, fadeOutTime * 1000 + 100);
  }

  currentAmbientSectionName = sectionName;

  if (!isAmbientEnabled) {
    return;
  }

  const oscillators: (OscillatorNode | AudioBufferSourceNode)[] = [];
  const gainNodes: GainNode[] = [];
  const intervals: any[] = [];

  const ambDelay = audioCtx.createDelay(3.0);
  ambDelay.delayTime.setValueAtTime(1.2, now);
  
  const ambFeedback = audioCtx.createGain();
  ambFeedback.gain.setValueAtTime(0.38, now);
  
  ambDelay.connect(ambFeedback);
  ambFeedback.connect(ambDelay);
  ambDelay.connect(ambientGain);

  if (sectionName === "The Nest") {
    const osc1 = audioCtx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(55, now);

    const osc2 = audioCtx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(82.5, now);

    const g1 = audioCtx.createGain();
    const g2 = audioCtx.createGain();

    g1.gain.setValueAtTime(0.001, now);
    g1.gain.linearRampToValueAtTime(0.08, now + 3.0);

    g2.gain.setValueAtTime(0.001, now);
    g2.gain.linearRampToValueAtTime(0.05, now + 3.5);

    const lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.08, now);

    const lfoG = audioCtx.createGain();
    lfoG.gain.setValueAtTime(0.02, now);

    lfo.connect(lfoG);
    lfoG.connect(g1.gain);

    osc1.connect(g1);
    osc2.connect(g2);

    g1.connect(ambientGain);
    g2.connect(ambientGain);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);

    oscillators.push(osc1, osc2, lfo);
    gainNodes.push(g1, g2);

  } else if (sectionName === "The Flight Path") {
    const carrier = audioCtx.createOscillator();
    carrier.type = "triangle";
    carrier.frequency.setValueAtTime(110, now);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(3.0, now);

    const gCarrier = audioCtx.createGain();
    gCarrier.gain.setValueAtTime(0.001, now);
    gCarrier.gain.linearRampToValueAtTime(0.035, now + 2.5);

    const lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.06, now);
    const lfoG = audioCtx.createGain();
    lfoG.gain.setValueAtTime(140, now);
    
    lfo.connect(lfoG);
    lfoG.connect(filter.frequency);

    carrier.connect(filter);
    filter.connect(gCarrier);
    gCarrier.connect(ambientGain);

    lfo.start(now);
    carrier.start(now);
    
    oscillators.push(carrier, lfo);
    gainNodes.push(gCarrier);

    const intervalId = setInterval(() => {
      if (!ambientGain || currentAmbientSectionName !== "The Flight Path") return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const chime = ctx.createOscillator();
      chime.type = "sine";

      const freqs = [880, 990, 1100, 1320, 1485];
      const randomFreq = freqs[Math.floor(Math.random() * freqs.length)];
      chime.frequency.setValueAtTime(randomFreq, t);

      const gChime = ctx.createGain();
      gChime.gain.setValueAtTime(0.001, t);
      gChime.gain.exponentialRampToValueAtTime(0.015, t + 0.08);
      gChime.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);

      chime.connect(gChime);
      gChime.connect(ambientGain);
      gChime.connect(ambDelay);

      chime.start(t);
      chime.stop(t + 4.0);

      if (ambientState) {
        ambientState.oscillators.push(chime);
        ambientState.gainNodes.push(gChime);
      }
    }, 4500);
    intervals.push(intervalId);

  } else if (sectionName === "The Forest") {
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const windFilter = audioCtx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.setValueAtTime(280, now);
    windFilter.Q.setValueAtTime(1.8, now);

    const gWind = audioCtx.createGain();
    gWind.gain.setValueAtTime(0.001, now);
    gWind.gain.linearRampToValueAtTime(0.045, now + 3.5);

    const windLfo = audioCtx.createOscillator();
    windLfo.type = "sine";
    windLfo.frequency.setValueAtTime(0.065, now);
    const windLfoG = audioCtx.createGain();
    windLfoG.gain.setValueAtTime(160, now);

    windLfo.connect(windLfoG);
    windLfoG.connect(windFilter.frequency);

    noiseSource.connect(windFilter);
    windFilter.connect(gWind);
    gWind.connect(ambientGain);

    noiseSource.start(now);
    windLfo.start(now);

    oscillators.push(noiseSource, windLfo);
    gainNodes.push(gWind);

    const forestInterval = setInterval(() => {
      if (!ambientGain || currentAmbientSectionName !== "The Forest") return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      const t = ctx.currentTime;

      const wood = ctx.createOscillator();
      wood.type = "triangle";
      wood.frequency.setValueAtTime(160 + Math.random() * 120, t);
      wood.frequency.exponentialRampToValueAtTime(40, t + 0.1);

      const gWood = ctx.createGain();
      gWood.gain.setValueAtTime(0.001, t);
      gWood.gain.exponentialRampToValueAtTime(0.012, t + 0.01);
      gWood.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

      wood.connect(gWood);
      gWood.connect(ambientGain);
      gWood.connect(ambDelay);

      wood.start(t);
      wood.stop(t + 0.3);

      if (ambientState) {
        ambientState.oscillators.push(wood);
        ambientState.gainNodes.push(gWood);
      }
    }, 5500);
    intervals.push(forestInterval);

  } else if (sectionName === "The Observatory") {
    const cosmicPad1 = audioCtx.createOscillator();
    cosmicPad1.type = "sine";
    cosmicPad1.frequency.setValueAtTime(164.8, now);

    const cosmicPad2 = audioCtx.createOscillator();
    cosmicPad2.type = "sine";
    cosmicPad2.frequency.setValueAtTime(246.9, now);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3.5, now);

    const gPad1 = audioCtx.createGain();
    const gPad2 = audioCtx.createGain();

    gPad1.gain.setValueAtTime(0.001, now);
    gPad1.gain.linearRampToValueAtTime(0.045, now + 4.0);

    gPad2.gain.setValueAtTime(0.001, now);
    gPad2.gain.linearRampToValueAtTime(0.035, now + 4.0);

    const sweepLfo = audioCtx.createOscillator();
    sweepLfo.type = "sine";
    sweepLfo.frequency.setValueAtTime(0.033, now);
    const sweepG = audioCtx.createGain();
    sweepG.gain.setValueAtTime(450, now);

    sweepLfo.connect(sweepG);
    sweepG.connect(filter.frequency);

    cosmicPad1.connect(gPad1);
    cosmicPad2.connect(gPad2);

    gPad1.connect(filter);
    gPad2.connect(filter);
    filter.connect(ambientGain);

    sweepLfo.start(now);
    cosmicPad1.start(now);
    cosmicPad2.start(now);

    oscillators.push(cosmicPad1, cosmicPad2, sweepLfo);
    gainNodes.push(gPad1, gPad2);

    const observatoryInterval = setInterval(() => {
      if (!ambientGain || currentAmbientSectionName !== "The Observatory") return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      const t = ctx.currentTime;

      const star = ctx.createOscillator();
      star.type = "sine";
      star.frequency.setValueAtTime(2100 + Math.random() * 700, t);

      const gStar = ctx.createGain();
      gStar.gain.setValueAtTime(0.001, t);
      gStar.gain.exponentialRampToValueAtTime(0.006, t + 0.15);
      gStar.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

      star.connect(gStar);
      gStar.connect(ambientGain);
      gStar.connect(ambDelay);

      star.start(t);
      star.stop(t + 3.0);

      if (ambientState) {
        ambientState.oscillators.push(star);
        ambientState.gainNodes.push(gStar);
      }
    }, 6000);
    intervals.push(observatoryInterval);

  } else if (sectionName === "The Vault") {
    const engine1 = audioCtx.createOscillator();
    engine1.type = "sawtooth";
    engine1.frequency.setValueAtTime(41.2, now);

    const engine2 = audioCtx.createOscillator();
    engine2.type = "triangle";
    engine2.frequency.setValueAtTime(82.4, now);

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(90, now);

    const gEng1 = audioCtx.createGain();
    const gEng2 = audioCtx.createGain();

    gEng1.gain.setValueAtTime(0.001, now);
    gEng1.gain.linearRampToValueAtTime(0.055, now + 3.0);

    gEng2.gain.setValueAtTime(0.001, now);
    gEng2.gain.linearRampToValueAtTime(0.065, now + 3.0);

    engine1.connect(gEng1);
    engine2.connect(gEng2);

    gEng1.connect(lowpass);
    gEng2.connect(lowpass);
    lowpass.connect(ambientGain);

    engine1.start(now);
    engine2.start(now);

    oscillators.push(engine1, engine2);
    gainNodes.push(gEng1, gEng2);

    const vaultInterval = setInterval(() => {
      if (!ambientGain || currentAmbientSectionName !== "The Vault") return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      const t = ctx.currentTime;

      const ping = ctx.createOscillator();
      ping.type = "sine";
      ping.frequency.setValueAtTime(1150, t);

      const gPing = ctx.createGain();
      gPing.gain.setValueAtTime(0.001, t);
      gPing.gain.exponentialRampToValueAtTime(0.006, t + 0.03);
      gPing.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);

      ping.connect(gPing);
      gPing.connect(ambientGain);
      gPing.connect(ambDelay);

      ping.start(t);
      ping.stop(t + 4.5);

      if (ambientState) {
        ambientState.oscillators.push(ping);
        ambientState.gainNodes.push(gPing);
      }
    }, 7000);
    intervals.push(vaultInterval);

  } else if (sectionName === "The Midnight Journal") {
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const hissSource = audioCtx.createBufferSource();
    hissSource.buffer = noiseBuffer;
    hissSource.loop = true;

    const highpass = audioCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(1800, now);

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(4200, now);

    const gHiss = audioCtx.createGain();
    gHiss.gain.setValueAtTime(0.001, now);
    gHiss.gain.linearRampToValueAtTime(0.014, now + 3.0);

    hissSource.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gHiss);
    gHiss.connect(ambientGain);

    hissSource.start(now);
    oscillators.push(hissSource);
    gainNodes.push(gHiss);

    const padFreqs = [164.8, 207.7, 246.9, 329.6];
    padFreqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      const padFilter = audioCtx.createBiquadFilter();
      padFilter.type = "lowpass";
      padFilter.frequency.setValueAtTime(380, now);

      const gPad = audioCtx.createGain();
      gPad.gain.setValueAtTime(0.001, now);
      gPad.gain.linearRampToValueAtTime(0.024 - idx * 0.003, now + 4.0);

      osc.connect(padFilter);
      padFilter.connect(gPad);
      gPad.connect(ambientGain!);

      osc.start(now);
      oscillators.push(osc);
      gainNodes.push(gPad);
    });

  } else if (sectionName === "Signal tower") {
    const stormNoise = audioCtx.createBufferSource();
    const bufSize = audioCtx.sampleRate * 2;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const bufOut = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      bufOut[i] = Math.random() * 2 - 1;
    }
    stormNoise.buffer = buf;
    stormNoise.loop = true;

    const stormFilter = audioCtx.createBiquadFilter();
    stormFilter.type = "bandpass";
    stormFilter.frequency.setValueAtTime(850, now);
    stormFilter.Q.setValueAtTime(1.2, now);

    const gStorm = audioCtx.createGain();
    gStorm.gain.setValueAtTime(0.001, now);
    gStorm.gain.linearRampToValueAtTime(0.025, now + 3.0);

    const windLfo = audioCtx.createOscillator();
    windLfo.type = "sine";
    windLfo.frequency.setValueAtTime(0.05, now);
    const windLfoG = audioCtx.createGain();
    windLfoG.gain.setValueAtTime(350, now);

    windLfo.connect(windLfoG);
    windLfoG.connect(stormFilter.frequency);

    stormNoise.connect(stormFilter);
    stormFilter.connect(gStorm);
    gStorm.connect(ambientGain);

    stormNoise.start(now);
    windLfo.start(now);

    oscillators.push(stormNoise, windLfo);
    gainNodes.push(gStorm);

    const signalInterval = setInterval(() => {
      if (!ambientGain || currentAmbientSectionName !== "Signal tower") return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      const t = ctx.currentTime;

      const packetFreqs = [1820, 1960, 2120];
      packetFreqs.forEach((freq, idx) => {
        const bleep = ctx.createOscillator();
        bleep.type = "sine";
        bleep.frequency.setValueAtTime(freq, t + idx * 0.12);

        const gBleep = ctx.createGain();
        gBleep.gain.setValueAtTime(0.001, t + idx * 0.12);
        gBleep.gain.exponentialRampToValueAtTime(0.005, t + idx * 0.12 + 0.015);
        gBleep.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.12 + 0.18);

        bleep.connect(gBleep);
        gBleep.connect(ambientGain!);
        gBleep.connect(ambDelay);

        bleep.start(t + idx * 0.12);
        bleep.stop(t + idx * 0.12 + 0.3);

        if (ambientState) {
          ambientState.oscillators.push(bleep);
          ambientState.gainNodes.push(gBleep);
        }
      });
    }, 4500);
    intervals.push(signalInterval);
  }

  ambientState = {
    oscillators,
    gainNodes,
    intervals
  };
}

export function playOwlResonance() {
  const audioCtx = getAudioCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const hootee = (startTime: number, duration: number, pitch: number, volume: number) => {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch, startTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.94, startTime + duration);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(pitch, startTime);
    filter.Q.setValueAtTime(3.5, startTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.12);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    const delay = audioCtx.createDelay(1.5);
    delay.delayTime.setValueAtTime(0.35, startTime);
    const delayGain = audioCtx.createGain();
    delayGain.gain.setValueAtTime(0.25, startTime);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  };

  hootee(now, 0.42, 175, 0.22);
  hootee(now + 0.52, 0.62, 160, 0.18);
}

export function playCalibrationDenied() {
  const audioCtx = getAudioCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gainNode = audioCtx.createGain();

  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(110, now);
  osc1.frequency.linearRampToValueAtTime(70, now + 0.35);

  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(115, now);
  osc2.frequency.linearRampToValueAtTime(75, now + 0.35);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(280, now);

  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.linearRampToValueAtTime(0.18, now + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.4);
  osc2.stop(now + 0.4);
}

export function playCalibrationSuccess() {
  const audioCtx = getAudioCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const freqs = [523.25, 659.25, 783.99];
  freqs.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const t = now + idx * 0.12;

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.7);
  });
}

export function playTickSound(type: "high" | "low" = "high") {
  const audioCtx = getAudioCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  const freq = type === "high" ? 1200 : 800;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.015, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.04);
}
