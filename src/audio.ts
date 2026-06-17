// Web Audio API Cinematic Synthesizer Engine for UNKNOWN

let audioCtx: AudioContext | null = null;
let currentNodes: {
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
  filterNode?: BiquadFilterNode;
  delayNode?: DelayNode;
} | null = null;

let lfoOsc: OscillatorNode | null = null;
let masterGain: GainNode | null = null;

// Ambient Background Loops State
let ambientGain: GainNode | null = null;
let currentAmbientSectionName: string | null = null;
let ambientState: {
  oscillators: (OscillatorNode | AudioBufferSourceNode)[];
  gainNodes: GainNode[];
  intervals: any[];
} | null = null;
let isAmbientEnabled: boolean = true;

let activeId: string | null = null;
let activeCallback: ((isPlaying: boolean, fragmentId: string | null) => void) | null = null;

let globalAnalyser: AnalyserNode | null = null;

export function getGlobalAnalyser(): AnalyserNode | null {
  return globalAnalyser;
}

export function getAudioContext(): AudioContext | null {
  return audioCtx;
}

export function registerAudioCallback(callback: (isPlaying: boolean, fragmentId: string | null) => void) {
  activeCallback = callback;
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime); // 50% default volume
    
    // Setup global high fidelity analyser
    globalAnalyser = audioCtx.createAnalyser();
    globalAnalyser.fftSize = 256;
    globalAnalyser.smoothingTimeConstant = 0.7;
    
    // Map output signal chain
    masterGain.connect(globalAnalyser);
    globalAnalyser.connect(audioCtx.destination);
    
    // Create dedicated ambient loop channel to avoid interference with plays/stops
    ambientGain = audioCtx.createGain();
    ambientGain.gain.setValueAtTime(isAmbientEnabled ? 1.0 : 0.0, audioCtx.currentTime);
    ambientGain.connect(masterGain);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function setMasterVolume(pct: number) {
  if (!masterGain || !audioCtx) return;
  masterGain.gain.linearRampToValueAtTime(Math.min(1, Math.max(0, pct)), audioCtx.currentTime + 0.1);
}

export function getMasterVolume(): number {
  return masterGain ? masterGain.gain.value : 0.5;
}

export function stopAudio() {
  if (currentNodes) {
    const fadeOutTime = 0.5;
    if (audioCtx) {
      const now = audioCtx.currentTime;
      // Fade out all current active gains to prevent harsh pops
      currentNodes.gainNodes.forEach(g => {
        try {
          g.gain.cancelScheduledValues(now);
          g.gain.setValueAtTime(g.gain.value, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + fadeOutTime);
        } catch (e) {
          // Fallback
          g.gain.setValueAtTime(0, now);
        }
      });
    }

    const localNodes = currentNodes;
    currentNodes = null;

    setTimeout(() => {
      localNodes.oscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      if (lfoOsc) {
        try { lfoOsc.stop(); } catch (e) {}
        lfoOsc = null;
      }
    }, fadeOutTime * 1000 + 50);
  }
  activeId = null;
  if (activeCallback) activeCallback(false, null);
}

export function playFragment(
  id: string,
  frequency: number,
  synthType: "drone" | "keys" | "bell" | "noise" | "pulse"
) {
  try {
    initAudio();
  } catch (err) {
    console.error("Failed to init audio context:", err);
    return;
  }

  if (!audioCtx || !masterGain) return;

  // If already playing this fragment, toggle off
  if (activeId === id) {
    stopAudio();
    return;
  }

  // Stop current sound first
  stopAudio();

  const now = audioCtx.currentTime;
  const oscillators: OscillatorNode[] = [];
  const gainNodes: GainNode[] = [];

  // Reverb/Delay nodes for space
  const delay = audioCtx.createDelay(2.0);
  delay.delayTime.setValueAtTime(0.4, now);
  
  const delayGain = audioCtx.createGain();
  delayGain.gain.setValueAtTime(0.3, now); // Feedback volume

  // Loop delay back into itself
  delay.connect(delayGain);
  delayGain.connect(delay);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, now);

  if (synthType === "drone") {
    // DRONE: Warm detuned layers and sub bass
    filter.frequency.setValueAtTime(450, now);

    // Osc 1: Root sub
    const osc1 = audioCtx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(frequency, now);

    // Osc 2: Slight detuned saw (filtered)
    const osc2 = audioCtx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(frequency * 1.5 + 0.5, now); // perfect fifth + a little detune

    // Osc 3: Very low sub bass
    const osc3 = audioCtx.createOscillator();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(frequency / 2 - 1, now); 

    const g1 = audioCtx.createGain();
    const g2 = audioCtx.createGain();
    const g3 = audioCtx.createGain();

    // Volume curves
    g1.gain.setValueAtTime(0.001, now);
    g1.gain.exponentialRampToValueAtTime(0.25, now + 1.5);

    g2.gain.setValueAtTime(0.001, now);
    g2.gain.exponentialRampToValueAtTime(0.12, now + 2.0);

    g3.gain.setValueAtTime(0.001, now);
    g3.gain.exponentialRampToValueAtTime(0.35, now + 1.0);

    osc1.connect(g1);
    osc2.connect(g2);
    osc3.connect(g3);

    // Slow breath filter LFO
    const lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.15, now); // very slow 6-second cycle
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(150, now); // sweep 150hz up and down

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    g1.connect(filter);
    g2.connect(filter);
    g3.connect(filter);

    lfo.start(now);
    lfoOsc = lfo;

    filter.connect(masterGain);
    // Add subtle delay
    filter.connect(delay);
    delayGain.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    oscillators.push(osc1, osc2, osc3);
    gainNodes.push(g1, g2, g3);

  } else if (synthType === "keys") {
    // KEYS: Slow melodic pluck echoes
    filter.frequency.setValueAtTime(1200, now);

    // Pluck chord
    const freqs = [frequency, frequency * 1.25, frequency * 1.5, frequency * 2.0]; // Major/Minor atmospheric chord
    
    freqs.forEach((f, index) => {
      const osc = audioCtx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now);

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, now);
      // Gentle delayed triggers
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

    filter.connect(masterGain);
    filter.connect(delay);
    delayGain.connect(masterGain);

    // Setup an interval to play repeating moody key plucks as long as it's active
    let cycleCounter = 1;
    const intervalId = setInterval(() => {
      if (activeId !== id || !audioCtx) {
        clearInterval(intervalId);
        return;
      }
      const triggerTime = audioCtx.currentTime;
      // Change chord degree slightly for cinematic movement
      const modifier = cycleCounter % 3 === 0 ? 0.9 : cycleCounter % 3 === 1 ? 1.0 : 1.12;
      
      freqs.forEach((f, index) => {
        if (!audioCtx) return;
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
    // BELL: Pure bell registers and rich overtones (guarded bell chime)
    filter.frequency.setValueAtTime(1500, now);
    
    // Inharmonic bell partials
    const partials = [1.0, 1.5, 1.98, 2.44, 3.0, 4.1];
    const partialGains = [0.22, 0.15, 0.1, 0.08, 0.05, 0.03];

    partials.forEach((p, idx) => {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency * p, now);

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, now);
      // Instant attack, long exponential release
      g.gain.exponentialRampToValueAtTime(partialGains[idx], now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);

      osc.connect(g);
      g.connect(masterGain);
      g.connect(delay);

      osc.start(now);
      oscillators.push(osc);
      gainNodes.push(g);
    });

    delayGain.connect(masterGain);

    // Repeating slow tolls
    const bellInterval = setInterval(() => {
      if (activeId !== id || !audioCtx) {
        clearInterval(bellInterval);
        return;
      }
      const tollTime = audioCtx.currentTime;
      partials.forEach((p, idx) => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        osc.type = "sine";
        // Slightly wobble frequency to sound aged
        osc.frequency.setValueAtTime(frequency * p * (1 + (Math.random() * 0.004 - 0.002)), tollTime);

        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.001, tollTime);
        g.gain.exponentialRampToValueAtTime(partialGains[idx], tollTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, tollTime + 5.0);

        osc.connect(g);
        osc.connect(delay);
        g.connect(masterGain);

        osc.start(tollTime);
        osc.stop(tollTime + 6.0);

        if (currentNodes) {
          currentNodes.oscillators.push(osc);
          currentNodes.gainNodes.push(g);
        }
      });
    }, 6000);

  } else if (synthType === "noise") {
    // NOISE: Muffled vintage tape hiss, warm static, and remote storm breeze
    // Generate white noise buffer
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to turn it into pink/brown muffled room whisper
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(250, now);
    noiseFilter.Q.setValueAtTime(1.0, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.12, now + 1.5);

    // Warm pad oscillator hidden behind the static
    const padOsc = audioCtx.createOscillator();
    padOsc.type = "triangle";
    padOsc.frequency.setValueAtTime(frequency, now);

    const padGain = audioCtx.createGain();
    padGain.gain.setValueAtTime(0.001, now);
    padGain.gain.exponentialRampToValueAtTime(0.15, now + 2.0);

    // Modulate bandpass frequency slowly for wind wave movement
    const waveLfo = audioCtx.createOscillator();
    waveLfo.type = "sine";
    waveLfo.frequency.setValueAtTime(0.08, now); // ultra slow wind waves
    const wavesGain = audioCtx.createGain();
    wavesGain.gain.setValueAtTime(120, now);

    waveLfo.connect(wavesGain);
    wavesGain.connect(noiseFilter.frequency);

    // Connections
    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    padOsc.connect(padGain);
    padGain.connect(masterGain);

    whiteNoise.start(now);
    padOsc.start(now);
    waveLfo.start(now);

    lfoOsc = waveLfo;
    oscillators.push(padOsc); // For cleanup (bufferSource clean below)
    gainNodes.push(noiseGain, padGain);

    // Add whiteNoise to oscillators so we can stop it
    oscillators.push(whiteNoise as any);

  } else if (synthType === "pulse") {
    // PULSE: Heavy low-frequency radar heartbeat beacon
    filter.frequency.setValueAtTime(120, now); // deep, deep pulse

    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency / 2, now); // drop an octave for heavy impact

    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.6, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(g);
    g.connect(filter);
    filter.connect(masterGain);

    osc.start(now);
    oscillators.push(osc);
    gainNodes.push(g);

    // Setup rhythmic sonar heartbeats (every 1.5 seconds)
    const pulseInterval = setInterval(() => {
      if (activeId !== id || !audioCtx) {
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
  if (!audioCtx) {
    try { initAudio(); } catch (e) {}
  }
  if (ambientGain && audioCtx) {
    const targetVal = isAmbientEnabled ? 1.0 : 0.0;
    ambientGain.gain.cancelScheduledValues(audioCtx.currentTime);
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, audioCtx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(targetVal, audioCtx.currentTime + 1.2);
  }
  
  // If we just turned ambient ON and a section was waiting, play it!
  if (isAmbientEnabled && currentAmbientSectionName) {
    const sec = currentAmbientSectionName;
    currentAmbientSectionName = null; // force restart
    transitionAmbient(sec);
  } else if (!isAmbientEnabled && ambientState) {
    // If we turned it OFF, immediately clean up active oscillators to ensure silence
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
  try {
    initAudio();
  } catch (err) {
    console.error("Failed to init audio context for ambient:", err);
    return;
  }

  if (!audioCtx || !ambientGain) return;

  // Don't restart the same section's loop if it is already playing
  if (currentAmbientSectionName === sectionName && ambientState) {
    return;
  }

  const now = audioCtx.currentTime;

  // 1. Gently fade out previous ambient loop
  if (ambientState) {
    const fadeOutTime = 1.5;
    const oldState = ambientState;
    ambientState = null;

    // Clear background timers
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

  // If ambient is disabled, we store the current section name but do not spawn nodes
  if (!isAmbientEnabled) {
    return;
  }

  const oscillators: (OscillatorNode | AudioBufferSourceNode)[] = [];
  const gainNodes: GainNode[] = [];
  const intervals: any[] = [];

  // Create a slow delay line for premium echoing elements in background tracks
  const ambDelay = audioCtx.createDelay(3.0);
  ambDelay.delayTime.setValueAtTime(1.2, now);
  
  const ambFeedback = audioCtx.createGain();
  ambFeedback.gain.setValueAtTime(0.38, now); // 38% feedback
  
  ambDelay.connect(ambFeedback);
  ambFeedback.connect(ambDelay);
  ambDelay.connect(ambientGain);

  if (sectionName === "The Nest") {
    // 55Hz (A1) & 82.5Hz (E2) sub organ drone
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

    // Subtle volume breather LFO
    const lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.08, now); // 12.5s cycle

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
    // 110Hz triangle drone through a resonant bandpass filter centered around 450Hz
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

    // filter frequency LFO
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

    // Sparkling starry chimes playing beautiful pentatonic high chime notes
    const intervalId = setInterval(() => {
      if (!audioCtx || !ambientGain || currentAmbientSectionName !== "The Flight Path") return;
      const t = audioCtx.currentTime;
      const chime = audioCtx.createOscillator();
      chime.type = "sine";

      const freqs = [880, 990, 1100, 1320, 1485];
      const randomFreq = freqs[Math.floor(Math.random() * freqs.length)];
      chime.frequency.setValueAtTime(randomFreq, t);

      const gChime = audioCtx.createGain();
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
    // Generate whispering wind pinkish noise
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

    // slow wind waves
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

    // Gentle dry forest twig cracks
    const forestInterval = setInterval(() => {
      if (!audioCtx || !ambientGain || currentAmbientSectionName !== "The Forest") return;
      const t = audioCtx.currentTime;

      const wood = audioCtx.createOscillator();
      wood.type = "triangle";
      wood.frequency.setValueAtTime(160 + Math.random() * 120, t);
      wood.frequency.exponentialRampToValueAtTime(40, t + 0.1);

      const gWood = audioCtx.createGain();
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
    // Elegant stellar cosmic sweep pads (E3 and B3)
    const cosmicPad1 = audioCtx.createOscillator();
    cosmicPad1.type = "sine";
    cosmicPad1.frequency.setValueAtTime(164.8, now); // E3

    const cosmicPad2 = audioCtx.createOscillator();
    cosmicPad2.type = "sine";
    cosmicPad2.frequency.setValueAtTime(246.9, now); // B3

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

    // sweep LFO: 30s cycle
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

    // Deep space crystalline echoes
    const observatoryInterval = setInterval(() => {
      if (!audioCtx || !ambientGain || currentAmbientSectionName !== "The Observatory") return;
      const t = audioCtx.currentTime;

      const star = audioCtx.createOscillator();
      star.type = "sine";
      star.frequency.setValueAtTime(2100 + Math.random() * 700, t);

      const gStar = audioCtx.createGain();
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
    // Low mechanical engine hum structure
    const engine1 = audioCtx.createOscillator();
    engine1.type = "sawtooth";
    engine1.frequency.setValueAtTime(41.2, now); // E1

    const engine2 = audioCtx.createOscillator();
    engine2.type = "triangle";
    engine2.frequency.setValueAtTime(82.4, now); // E2

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(90, now); // heavy lowpass filter

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

    // Echoing alarm radar ping symbolizing secured status
    const vaultInterval = setInterval(() => {
      if (!audioCtx || !ambientGain || currentAmbientSectionName !== "The Vault") return;
      const t = audioCtx.currentTime;

      const ping = audioCtx.createOscillator();
      ping.type = "sine";
      ping.frequency.setValueAtTime(1150, t);

      const gPing = audioCtx.createGain();
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
    // Generate vintage dusty tape hiss and soft major pad
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

    // Warm nostaligic E-major pad triads
    const padFreqs = [164.8, 207.7, 246.9, 329.6]; // E3, G#3, B3, E4
    padFreqs.forEach((freq, idx) => {
      if (!audioCtx) return;
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

  } else if (sectionName === "The Signal Tower") {
    // Constant high elevation bandpassed storm bise
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

    // Dynamic tech packet telemetry sequences every 4 seconds
    const signalInterval = setInterval(() => {
      if (!audioCtx || !ambientGain || currentAmbientSectionName !== "The Signal Tower") return;
      const t = audioCtx.currentTime;

      const packetFreqs = [1820, 1960, 2120];
      packetFreqs.forEach((freq, idx) => {
        if (!audioCtx) return;
        const bleep = audioCtx.createOscillator();
        bleep.type = "sine";
        bleep.frequency.setValueAtTime(freq, t + idx * 0.12);

        const gBleep = audioCtx.createGain();
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

  // Save the state of current ambient nodes so they can be disposed or handled properly on transition
  ambientState = {
    oscillators,
    gainNodes,
    intervals
  };
}

export function playOwlResonance() {
  try {
    initAudio();
  } catch (e) {
    console.error("Failed to init audio for owl call:", e);
    return;
  }
  if (!audioCtx || !masterGain) return;
  const now = audioCtx.currentTime;

  // Hollow low double-hoot: Hoot (0.45s) -> silence (0.1s) -> Hoot (0.65s)
  const hootee = (startTime: number, duration: number, pitch: number, volume: number) => {
    if (!audioCtx || !masterGain) return;
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    // Soft pitch slide down
    osc.frequency.setValueAtTime(pitch, startTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.94, startTime + duration);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(pitch, startTime);
    filter.Q.setValueAtTime(3.5, startTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.001, startTime);
    // Exponential envelope
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.12);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Create a reverb or delay feed for owl hoot
    const delay = audioCtx.createDelay(1.5);
    delay.delayTime.setValueAtTime(0.35, startTime);
    const delayGain = audioCtx.createGain();
    delayGain.gain.setValueAtTime(0.25, startTime);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    // Feed to delay line for echoing effect
    gainNode.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  };

  // Double hoot
  hootee(now, 0.42, 175, 0.22);
  hootee(now + 0.52, 0.62, 160, 0.18);
}

