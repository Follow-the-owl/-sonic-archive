import React, { useState, useEffect } from "react";
import { registerAudioCallback, stopAudio, setMasterVolume, getMasterVolume, isAmbientOn, toggleAmbientAtmosphere } from "../audio";
import { Volume2, VolumeX, Square, RefreshCw } from "lucide-react";
import { FRAGMENTS } from "../data";

export default function AudioControllerWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFragmentId, setActiveFragmentId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [ambientEnabled, setAmbientEnabled] = useState(isAmbientOn());

  useEffect(() => {
    // Sync state on load
    setVolume(getMasterVolume());
    setAmbientEnabled(isAmbientOn());
    
    // Register for updates when songs/fragments start/stop
    registerAudioCallback((playing, id) => {
      setIsPlaying(playing);
      setActiveFragmentId(id);
    });
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMasterVolume(val);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setVolume(0);
      setMasterVolume(0);
    } else {
      setVolume(0.5);
      setMasterVolume(0.5);
    }
  };

  const handleToggleAmbient = () => {
    const nextVal = toggleAmbientAtmosphere();
    setAmbientEnabled(nextVal);
  };

  const activeFragment = FRAGMENTS.find(f => f.id === activeFragmentId);

  return (
    <div 
      id="global-audio-widget"
      className="fixed bottom-6 right-6 z-50 flex flex-col md:flex-row items-center gap-4 bg-zinc-950/80 border border-zinc-900 px-5 py-3 rounded-md backdrop-blur-lg shadow-2xl transition-all duration-700 font-mono text-[11px] w-[90%] sm:w-auto max-w-sm"
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Pulsing visual tracker indicator */}
        <div className="relative flex items-center justify-center w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-sm">
          {isPlaying ? (
            <div className="flex items-end gap-[2px] h-3">
              <span className="w-[2px] bg-gold-muted animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
              <span className="w-[2px] bg-gold-muted animate-bounce h-3" style={{ animationDelay: '0.3s' }} />
              <span className="w-[2px] bg-gold-muted animate-bounce h-1" style={{ animationDelay: '0.5s' }} />
            </div>
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          )}
        </div>

        {/* Info Text */}
        <div className="flex flex-col flex-1 min-w-[120px]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-600">
            {isPlaying ? "ARCHIVE SIGNAL LIVE" : "ARCHIVE ASLEEP"}
          </span>
          <span className="text-zinc-200 tracking-wide truncate">
            {isPlaying && activeFragment ? (
              <span className="text-gold-muted font-medium">FRAGMENT {activeFragment.id}</span>
            ) : (
              "SELECT FRAGMENT"
            )}
          </span>
        </div>
      </div>

      {/* Control sliders & mutes */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start border-t border-zinc-900 pt-2 sm:pt-0 sm:border-t-0 sm:pl-3 sm:border-l">
        {/* Seek Volume controls */}
        <div className="flex items-center gap-2">
          <button 
            id="widget-mute-toggle"
            onClick={toggleMute}
            className="text-zinc-500 hover:text-gold-muted transition-colors cursor-pointer"
            title="Mute/Unmute"
          >
            {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input 
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-[2px] bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-gold-muted"
            style={{ color: '#C5A059' }}
          />
        </div>

        {/* Atmosphere loop control toggle */}
        <button
          id="widget-toggle-ambient"
          onClick={handleToggleAmbient}
          className={`flex items-center gap-1.5 px-2 py-0.5 border rounded-sm text-[8px] font-mono transition-all duration-300 uppercase tracking-wider cursor-pointer ${
            ambientEnabled 
              ? "border-gold-muted/40 text-gold-muted hover:bg-gold-muted/10 bg-gold-muted/5" 
              : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 bg-transparent"
          }`}
          title="Toggle Ambient Atmosphere Loops"
        >
          <RefreshCw size={9} className={`${ambientEnabled ? "animate-spin" : ""}`} style={{ animationDuration: '6s' }} />
          <span>ATMOS: {ambientEnabled ? "ON" : "OFF"}</span>
        </button>

        {/* Global manual safety stop */}
        {isPlaying && (
          <button 
            id="widget-stop-signal"
            onClick={stopAudio}
            className="flex items-center gap-1 border border-zinc-800 hover:border-[#D9D6CA]/40 hover:bg-[#D9D6CA]/20 px-2 py-1 rounded-sm text-[9px] text-zinc-400 hover:text-[#D9D6CA] font-mono uppercase tracking-[0.1em] cursor-pointer"
            title="Close Active Signal"
          >
            <Square size={10} className="fill-current" />
            <span>SILENCE</span>
          </button>
        )}
      </div>
    </div>
  );
}
