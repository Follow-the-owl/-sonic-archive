import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Square, Eye, Compass, Info, X } from "lucide-react";
import { FRAGMENTS, Fragment } from "../data";
import { playFragment, stopAudio, registerAudioCallback, getActiveId } from "../audio";
import { RadioactiveIcon } from "./WelcomeScreen";

export default function FeaturedSection() {
  const [activeSignal, setActiveSignal] = useState<string | null>(null);
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);

  useEffect(() => {
    // Keep local player state synchronized with the synthesiser
    setActiveSignal(getActiveId());
    registerAudioCallback((isPlaying, id) => {
      setActiveSignal(id);
    });
  }, []);

  const handleTogglePlay = (frag: Fragment) => {
    if (activeSignal === frag.id) {
      stopAudio();
    } else {
      playFragment(frag.id, frag.frequency, frag.synthType);
    }
  };

  // Only display the 4 main requested featured fragments in this section
  const featuredIds = ["00:50", "02:17", "03:33", "05:58"];
  const featuredFragments = FRAGMENTS.filter(f => featuredIds.includes(f.id));

  return (
    <div id="section-flight-path" className="max-w-5xl mx-auto py-12 px-4 md:px-8 space-y-16">
      {/* Narrative Section Header */}
      <div className="text-center space-y-4">
        <span className="text-[10px] tracking-[0.5em] font-mono text-zinc-500 uppercase block">
          LOCATION II // THE FLIGHT PATH
        </span>
        <h2 className="text-3xl md:text-4xl font-display font-black uppercase tracking-widest text-zinc-100 scale-y-105">
          CHRONOLOGY FRAGMENTS
        </h2>
        <p className="text-zinc-500 font-mono text-xs max-w-sm mx-auto uppercase tracking-widest mt-2 leading-relaxed">
          THE MOST CRITICAL FREQUENCY COMBUSTIONS RECORDED AT NIGHT
        </p>
        <div className="h-[1px] w-12 bg-[#D9D6CA]/30 mx-auto mt-6" />
      </div>

      {/* Grid of Audio Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {featuredFragments.map((frag, idx) => {
          const isCurrentPlay = activeSignal === frag.id;

          return (
            <motion.div
              id={`featured-card-${frag.id}`}
              key={frag.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className={`p-6 border rounded-none transition-all duration-700 relative flex flex-col justify-between ${
                isCurrentPlay
                  ? "bg-neutral-950/80 border-[#D9D6CA]/60 gold-glow shadow-2xl"
                  : "bg-neutral-950/20 border-zinc-950 hover:border-zinc-800"
              }`}
            >
              <div>
                {/* Card Meta Row */}
                <div className="flex items-center justify-between mb-6 font-mono text-[9px] tracking-[0.2em] text-zinc-600">
                  <span className="text-[#D9D6CA] font-bold uppercase flex items-center gap-1.5">
                    <RadioactiveIcon className="w-3.5 h-3.5" />
                    <span>[ {frag.classification} ]</span>
                  </span>
                  <span>DURATION: {frag.duration}</span>
                </div>

                {/* Fragment Title */}
                <div className="mb-4">
                  <span className="text-[9px] font-mono text-zinc-500 tracking-widest block uppercase mb-1">
                    FRAGMENT_INDEX_{frag.id}
                  </span>
                  <h3 className="text-xl font-display font-medium uppercase tracking-wider text-zinc-100">
                    {frag.name}
                  </h3>
                </div>

                {/* Short Description */}
                <p className="text-xs text-zinc-400 font-mono tracking-wide leading-relaxed font-light mb-8 h-12 overflow-hidden line-clamp-2">
                  {frag.description}
                </p>
              </div>

              <div>
                {/* Interactive Player Deck Bar */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-900">
                  {/* Audio Signal Dial button */}
                  <button
                    id={`play-frag-${frag.id}`}
                    onClick={() => handleTogglePlay(frag)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-none text-[9px] font-mono font-bold uppercase tracking-[0.25em] transition-all duration-300 cursor-pointer ${
                      isCurrentPlay
                        ? "bg-[#D9D6CA] text-black border border-[#D9D6CA]"
                        : "bg-neutral-950 text-zinc-400 border border-zinc-900 hover:border-[#D9D6CA] hover:text-white"
                    }`}
                  >
                    {isCurrentPlay ? (
                      <>
                        <Square size={10} className="fill-current animate-pulse text-black" />
                        <span>SILENCE SIGNAL</span>
                      </>
                    ) : (
                      <>
                        <Play size={10} className="fill-current text-zinc-400" />
                        <span>LISTEN FRAGMENT</span>
                      </>
                    )}
                  </button>

                  {/* Inspect Details button */}
                  <button
                    id={`inspect-frag-${frag.id}`}
                    onClick={() => setSelectedFragment(frag)}
                    className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 hover:text-zinc-200 tracking-widest transition-colors cursor-pointer uppercase font-bold"
                  >
                    <Eye size={12} />
                    <span>VIEW DETAILS</span>
                  </button>
                </div>

                {/* Decorative Audio Grid Waveform Line (glowing slightly if active) */}
                <div className="mt-4 h-[2px] w-full bg-zinc-950 overflow-hidden relative">
                  {isCurrentPlay && (
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-y-0 w-1/3 bg-[#D9D6CA]"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal Overlay for Inspect Details */}
      <AnimatePresence>
        {selectedFragment && (
          <motion.div
            id="detail-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-hidden"
          >
            <motion.div
              id="detail-modal-content"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.4 }}
              className="bg-black border border-zinc-800 max-w-lg w-full p-8 relative rounded-none shadow-2xl"
            >
              {/* Close Button */}
              <button
                id="close-detail-modal"
                onClick={() => setSelectedFragment(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors p-1 cursor-pointer"
              >
                <X size={15} />
              </button>

              {/* Location Tag */}
              <div className="text-[9px] font-mono tracking-[0.3em] text-[#D9D6CA] uppercase mb-5 flex items-center gap-1.5 font-bold">
                <RadioactiveIcon className="w-3.5 h-3.5 text-[#D9D6CA]" />
                <span>// SPECTRAL COORDINATE LOG</span>
              </div>

              {/* Header Title */}
              <div className="space-y-1 mb-6">
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest block uppercase">
                  INDEX: FRAGMENT {selectedFragment.id}
                </span>
                <h3 className="text-2xl font-display font-semibold uppercase tracking-wider text-zinc-100 scale-y-105">
                  {selectedFragment.name}
                </h3>
              </div>

              {/* Diagnostic data box */}
              <div className="grid grid-cols-2 gap-4 bg-neutral-900/10 border border-zinc-900 p-4 rounded-none font-mono text-[9px] tracking-wide text-zinc-400 mb-6">
                <div>
                  <span className="text-zinc-650 block uppercase tracking-widest mb-0.5">TIMESTAMP:</span>
                  <span className="text-zinc-300 font-bold">{selectedFragment.timestamp}</span>
                </div>
                <div>
                  <span className="text-zinc-650 block uppercase tracking-widest mb-0.5">CLASSIFICATION:</span>
                  <span className="text-zinc-300 font-bold">{selectedFragment.classification}</span>
                </div>
                <div className="col-span-2 border-t border-zinc-900 pt-2.5 mt-1">
                  <span className="text-zinc-650 block uppercase tracking-widest mb-1.5">SENTINEL OBSERVED:</span>
                  <p className="text-zinc-400 italic h-auto leading-relaxed">{selectedFragment.observation}</p>
                </div>
              </div>

              {/* Poetic description */}
              <div className="space-y-3 font-mono text-xs text-zinc-400 font-light leading-relaxed mb-8">
                <p className="tracking-wide">{selectedFragment.description}</p>
                <p className="text-zinc-650 text-[9px] tracking-tight">
                  * Core Resonance Variable: Base tuned at {selectedFragment.frequency}Hz utilizing clean {selectedFragment.synthType} harmonics. Filtered for high night-time audio density.
                </p>
              </div>

              {/* Trigger within modal */}
              <button
                id="modal-play-trigger"
                onClick={() => {
                  handleTogglePlay(selectedFragment);
                }}
                className={`w-full py-4 text-center font-mono text-[9px] tracking-[0.4em] uppercase transition-all duration-300 rounded-none cursor-pointer ${
                  activeSignal === selectedFragment.id
                    ? "bg-[#D9D6CA]/10 text-[#D9D6CA] border border-[#D9D6CA]/30 hover:bg-[#D9D6CA]/20"
                    : "bg-[#D9D6CA] text-black hover:bg-white hover:text-black font-bold"
                }`}
              >
                {activeSignal === selectedFragment.id ? "CLOSE SIGNAL SOURCE" : "OPEN SIGNAL SOURCE"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

