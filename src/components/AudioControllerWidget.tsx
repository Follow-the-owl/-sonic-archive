import React, { useState, useEffect } from "react";
import { 
  registerAudioCallback, 
  registerAmbientCallback,
  stopAudio, 
  setMasterVolume, 
  getMasterVolume, 
  isAmbientOn, 
  toggleAmbientAtmosphere,
  ensureToneStarted
} from "../audio";
import { Volume2, VolumeX, Square, RefreshCw, Loader2, Radio } from "lucide-react";
import { FRAGMENTS } from "../data";

export default function AudioControllerWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFragmentId, setActiveFragmentId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [ambientEnabled, setAmbientEnabled] = useState(isAmbientOn());

  useEffect(() => {
    // Sync initial state
    setVolume(getMasterVolume());
    setAmbientEnabled(isAmbientOn());
    
    // Register for updates when songs/fragments start/stop
    const unsubAudio = registerAudioCallback((playing, id, loading) => {
      setIsPlaying(playing);
      setIsLoading(!!loading);
      setActiveFragmentId(id);
    });

    // Register for updates when ambient atmosphere state changes
    const unsubAmbient = registerAmbientCallback((enabled) => {
      setAmbientEnabled(enabled);
    });

    return () => {
      if (typeof unsubAudio === "function") unsubAudio();
      if (typeof unsubAmbient === "function") unsubAmbient();
    };
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMasterVolume(val);
  };

  const toggleMute = () => {
    ensureToneStarted();
    if (volume > 0) {
      setVolume(0);
      setMasterVolume(0);
    } else {
      setVolume(0.5);
      setMasterVolume(0.5);
    }
  };

  const handleToggleAmbient = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    ensureToneStarted();
    const nextVal = toggleAmbientAtmosphere();
    setAmbientEnabled(nextVal);
  };

  const activeFragment = FRAGMENTS.find(f => f.id === activeFragmentId);

  return (
    <div 
      id="global-audio-widget"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-50 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-zinc-950/95 border border-zinc-800/90 px-4 sm:px-5 py-3 rounded-lg backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.85)] transition-all duration-300 font-mono text-[11px] w-[calc(100%-1.5rem)] sm:w-auto max-w-sm select-none"
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Pulsing visual tracker indicator */}
        <div className="relative flex items-center justify-center w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-sm shrink-0">
          {isLoading ? (
            <Loader2 size={12} className="animate-spin text-gold-muted" />
          ) : isPlaying ? (
            <div className="flex items-end gap-[2px] h-3">
              <span className="w-[2px] bg-gold-muted animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
              <span className="w-[2px] bg-gold-muted animate-bounce h-3" style={{ animationDelay: '0.3s' }} />
              <span className="w-[2px] bg-gold-muted animate-bounce h-1" style={{ animationDelay: '0.5s' }} />
            </div>
          ) : (
            <Radio size={12} className={ambientEnabled ? "text-gold-muted animate-pulse" : "text-zinc-600"} />
          )}
        </div>

        {/* Info Text */}
        <div className="flex flex-col flex-1 min-w-[120px]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
            {isLoading ? (
              "LOADING SIGNAL..."
            ) : isPlaying ? (
              "ARCHIVE SIGNAL LIVE"
            ) : ambientEnabled ? (
              "ATMOSPHERE LOOP ACTIVE"
            ) : (
              "ATMOSPHERE MUTED"
            )}
          </span>
          <span className="text-zinc-200 tracking-wide truncate text-[10px]">
            {(isPlaying || isLoading) && activeFragment ? (
              <span className="text-gold-muted font-medium">{activeFragment.timestamp || activeFragment.name || `FRAGMENT ${activeFragment.id}`}</span>
            ) : ambientEnabled ? (
              <span className="text-zinc-300">SURROUND AMBIENCE</span>
            ) : (
              <span className="text-zinc-500">STANDBY MODE</span>
            )}
          </span>
        </div>
      </div>

      {/* Control sliders & mutes */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start border-t border-zinc-800/80 pt-2 sm:pt-0 sm:border-t-0 sm:pl-3 sm:border-l sm:border-zinc-800">
        {/* Seek Volume controls */}
        <div className="flex items-center gap-2">
          <button 
            id="widget-mute-toggle"
            onClick={toggleMute}
            className="text-zinc-400 hover:text-gold-muted active:scale-95 transition-all p-1 -m-1 cursor-pointer"
            title={volume === 0 ? "Unmute" : "Mute"}
            aria-label="Toggle Master Audio Mute"
          >
            {volume === 0 ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
          </button>
          <input 
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-14 sm:w-16 h-[2px] bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-gold-muted"
            style={{ color: '#C5A059' }}
            aria-label="Master Volume Slider"
          />
        </div>

        {/* Atmosphere loop control toggle */}
        <button
          id="widget-toggle-ambient"
          onClick={handleToggleAmbient}
          onTouchEnd={(e) => {
            // Ensure immediate responsiveness on iOS / mobile touch screens
            handleToggleAmbient(e);
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded border text-[9px] font-mono transition-all duration-200 uppercase tracking-wider cursor-pointer active:scale-95 touch-manipulation min-h-[32px] sm:min-h-0 ${
            ambientEnabled 
              ? "border-gold-muted/70 text-gold-muted bg-gold-muted/15 shadow-[0_0_12px_rgba(197,160,89,0.2)] font-semibold" 
              : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 bg-zinc-900/60"
          }`}
          title="Toggle Ambient Atmosphere Loops (ON / OFF)"
          aria-label={`Atmosphere Loop is ${ambientEnabled ? "ON" : "OFF"}. Tap to toggle.`}
        >
          <RefreshCw 
            size={10} 
            className={`shrink-0 transition-transform ${ambientEnabled ? "animate-spin text-gold-muted" : "text-zinc-500"}`} 
            style={{ animationDuration: '6s' }} 
          />
          <span className="whitespace-nowrap">ATMOS: <strong className={ambientEnabled ? "text-gold-muted" : "text-zinc-400"}>{ambientEnabled ? "ON" : "OFF"}</strong></span>
        </button>

        {/* Global manual safety stop */}
        {isPlaying && (
          <button 
            id="widget-stop-signal"
            onClick={stopAudio}
            className="flex items-center gap-1 border border-zinc-800 hover:border-[#D9D6CA]/40 hover:bg-[#D9D6CA]/20 active:scale-95 px-2.5 py-1.5 sm:py-1 rounded text-[9px] text-zinc-400 hover:text-[#D9D6CA] font-mono uppercase tracking-[0.1em] cursor-pointer touch-manipulation"
            title="Close Active Signal"
          >
            <Square size={9} className="fill-current" />
            <span className="hidden xs:inline">SILENCE</span>
          </button>
        )}
      </div>
    </div>
  );
}
