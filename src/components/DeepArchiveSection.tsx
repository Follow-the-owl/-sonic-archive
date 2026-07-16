import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Square, Key, Bell, Search, Clock, ShieldAlert } from "lucide-react";
import { FRAGMENTS, ARCHIVE_CATEGORIES, CLOCK_MEANINGS, Fragment } from "../data";
import { playFragment, stopAudio, registerAudioCallback, getActiveId } from "../audio";

interface DeepArchiveSectionProps {
  onRequestVaultAccess: () => void;
}

export default function DeepArchiveSection({ onRequestVaultAccess }: DeepArchiveSectionProps) {
  const [activeSignal, setActiveSignal] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeClockHour, setActiveClockHour] = useState<string>("03:33");

  useEffect(() => {
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

  const handleClockHourClick = (hour: string, category: string) => {
    setActiveClockHour(hour);
    // Auto-filter by this classification category if found
    const cat = ARCHIVE_CATEGORIES.find(c => 
      c.toLowerCase().includes(category.toLowerCase()) || 
      category.toLowerCase().includes(c.toLowerCase())
    );
    if (cat) {
      setSelectedCategory(cat);
    }
  };

  // Filter Fragments based on Category and Search Query
  const filteredFragments = FRAGMENTS.filter(frag => {
    const matchesCategory = selectedCategory === "All" || frag.classification === selectedCategory;
    const matchesSearch = 
      frag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      frag.id.includes(searchQuery) ||
      frag.classification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedClockMeaning = CLOCK_MEANINGS.find(c => c.hour === activeClockHour) || CLOCK_MEANINGS[2];

  return (
    <div id="section-forest" className="max-w-6xl mx-auto py-12 px-4 md:px-8 space-y-16">
      {/* Narrative Section Header */}
      <div className="text-center space-y-4">
        <span className="text-[10px] tracking-[0.5em] font-mono text-gold-muted uppercase block">
          LOCATION III // THE FOREST & THE OWL CLOCK
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-light tracking-[0.1em] text-zinc-100">
          The Forest of Frequencies
        </h2>
        <p className="text-zinc-500 font-sans text-xs max-w-xl mx-auto leading-relaxed">
          The deep repository of sounds. Move through the branches, check temporal locks, or search specific coordinates. Use the interactive Owl Clock below to understand temporal indexing.
        </p>
        <div className="h-[1px] w-12 bg-gold-muted/30 mx-auto mt-6" />
      </div>

      {/* STEP 6: Interactive Owl Clock Segment */}
      <div className="border border-zinc-900 bg-zinc-950/25 p-8 rounded-sm grid md:grid-cols-12 gap-8 items-center">
        {/* Clock Visual Dial */}
        <div className="md:col-span-5 flex flex-col items-center justify-center space-y-4 py-4">
          <div className="relative w-48 h-48 rounded-full border border-zinc-800/80 flex items-center justify-center bg-zinc-950/40">
            {/* Clock center eye */}
            <div className="absolute w-12 h-12 rounded-full border border-gold-muted/10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gold-muted/80 animate-ping" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-gold-muted" />
            </div>

            {/* Simulated clock hands */}
            <div className="absolute inset-0 p-4 rotate-45 pointer-events-none opacity-50">
              <div className="h-full w-[1px] bg-zinc-800 mx-auto" />
            </div>
            <div className="absolute inset-0 p-4 -rotate-45 pointer-events-none opacity-30">
              <div className="h-full w-[1px] bg-zinc-900 mx-auto" />
            </div>

            {/* Interactive hour hot-points */}
            {CLOCK_MEANINGS.map((entry, idx) => {
              const angles = [0, 60, 120, 180, 240, 300]; // Distributed around clock rim for 6 items
              const angle = angles[idx % angles.length];
              const isSelected = activeClockHour === entry.hour;

              return (
                <button
                  id={`clock-point-${entry.hour}`}
                  key={entry.hour}
                  onClick={() => handleClockHourClick(entry.hour, entry.name)}
                  className="absolute p-1 focus:outline-none group cursor-pointer"
                  style={{
                    transform: `rotate(${angle}deg) translate(76px) rotate(-${angle}deg)`
                  }}
                  title={entry.name}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    isSelected 
                      ? "bg-gold-muted border-gold-muted shadow-[0_0_10px_#C5A059]" 
                      : "bg-zinc-950 border-zinc-800 group-hover:border-gold-muted"
                  }`}>
                    {isSelected && <div className="w-1 h-1 bg-black rounded-full" />}
                  </div>
                  {/* Subtle hover label */}
                  <span className="absolute left-1/2 -bottom-5 -translate-x-1/2 text-[8px] font-mono opacity-0 group-hover:opacity-100 text-gold-muted uppercase whitespace-nowrap transition-opacity">
                    {entry.hour}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-[9px] font-mono tracking-widest text-zinc-600 uppercase">
            [ INTERACTIVE WATCH DIAL ]
          </span>
        </div>

        {/* Clock Meaning Copy */}
        <div className="md:col-span-7 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-gold-muted" />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                THE OWL CLOCK COORDINATES
              </span>
            </div>
            <h3 className="text-2xl font-serif tracking-wide text-zinc-100">
              The Timestamp System
            </h3>
          </div>

          <p className="text-xs text-zinc-400 font-sans leading-relaxed font-light">
            Every fragment enters the archive through an hour. The register time is never random. The owl marks what the sound remembers under the quiet night sky.
          </p>

          {/* Active Meanings Showcase Box */}
          <div className="border border-zinc-900 bg-zinc-950/80 p-5 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-md font-mono text-gold-muted tracking-wider">
                {selectedClockMeaning.hour} — {selectedClockMeaning.name}
              </span>
              <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-sm">
                TIME LOCKED
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              {selectedClockMeaning.description}
            </p>
          </div>

          {/* Nav links to quickly tap meanings */}
          <div className="flex flex-wrap gap-2 pt-2">
            {CLOCK_MEANINGS.map((meaning) => (
              <button
                id={`btn-clock-hour-${meaning.hour}`}
                key={meaning.hour}
                onClick={() => handleClockHourClick(meaning.hour, meaning.name)}
                className={`px-3 py-1 border text-[9px] font-mono tracking-widest rounded-sm transition-all duration-300 uppercase cursor-pointer ${
                  activeClockHour === meaning.hour 
                    ? "bg-zinc-900 text-gold-muted border-gold-muted" 
                    : "bg-transparent text-zinc-500 border-zinc-900 hover:border-zinc-800"
                }`}
              >
                {meaning.hour}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter Station */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          {/* Categories select row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mr-2 shrink-0">
              CLASSIFIED:
            </span>
            <div className="flex gap-1.5">
              {ARCHIVE_CATEGORIES.map((cat) => (
                <button
                  id={`btn-category-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 border text-[9px] font-mono tracking-wide rounded-sm transition-all duration-300 whitespace-nowrap cursor-pointer hover:border-zinc-700 ${
                    selectedCategory === cat
                      ? "bg-gold-muted text-black border-gold-muted font-medium"
                      : "bg-zinc-950 text-zinc-400 border-zinc-900"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Search text field */}
          <div className="relative flex items-center max-w-sm w-full md:w-64 border border-zinc-900 bg-zinc-950 px-3 py-1.5 rounded-sm">
            <Search size={12} className="text-zinc-650 absolute left-3 pointer-events-none" />
            <input
              id="forest-search-input"
              type="text"
              placeholder="SEARCH ARCHIVE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none pl-6 text-[10px] font-mono tracking-widest text-zinc-200 outline-none placeholder:text-zinc-700"
            />
          </div>
        </div>

        {/* Forest Fragments list */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredFragments.map((frag, index) => {
              const isCurrentPlay = activeSignal === frag.id;

              return (
                <motion.div
                  id={`forest-item-${frag.id}`}
                  key={frag.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`border p-5 rounded-sm flex flex-col justify-between transition-all duration-700 ${
                    isCurrentPlay
                      ? "bg-zinc-950/70 border-gold-muted/40 gold-glow"
                      : "bg-zinc-950/10 border-zinc-900/60 hover:border-zinc-800"
                  }`}
                >
                  <div>
                    {/* Header index row */}
                    <div className="flex items-center justify-between text-[9px] font-mono tracking-wider text-zinc-500 mb-4">
                      <span>FRAGMENT {frag.id}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {frag.timestamp}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="mb-2">
                      <h4 className="text-lg font-serif text-zinc-300">
                        {frag.name}
                      </h4>
                      <span className="text-[9px] font-mono bg-zinc-900 px-2 py-0.5 rounded-sm inline-block text-zinc-500 border border-zinc-800 uppercase mt-1">
                        {frag.classification}
                      </span>
                    </div>

                    {/* Poetic description */}
                    <p className="text-zinc-500 font-sans text-xs font-light tracking-wide leading-relaxed mt-3 mb-6 line-clamp-3">
                      {frag.description}
                    </p>

                    {/* Metadata specs */}
                    <div className="border-t border-zinc-900/50 pt-4 mb-6 space-y-1.5 text-[9px] font-mono text-zinc-500">
                      <div>
                        <span className="text-zinc-650">OBSERVATION:</span>{" "}
                        <span className="italic text-zinc-400">"{frag.observation}"</span>
                      </div>
                    </div>
                  </div>

                  {/* Context controls */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-900/40">
                    {frag.isExclusive ? (
                      // Restricted Access to exclusive vault items
                      <button
                        id={`request-access-${frag.id}`}
                        onClick={onRequestVaultAccess}
                        className="group flex items-center justify-center gap-1.5 w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-red-950/30 text-[10px] font-mono text-zinc-400 hover:text-gold-muted transition-all duration-300 rounded-sm cursor-pointer"
                      >
                        <ShieldAlert size={10} className="text-red-500/70" />
                        <span className="tracking-[0.15em] uppercase">REQUEST ACCESS</span>
                      </button>
                    ) : (
                      // Listen live to standard fragments
                      <button
                        id={`forest-play-trigger-${frag.id}`}
                        onClick={() => handleTogglePlay(frag)}
                        className={`w-full py-2 flex items-center justify-center gap-1.5 text-[10px] font-mono tracking-widest uppercase transition-all duration-500 rounded-sm cursor-pointer ${
                          isCurrentPlay
                            ? "bg-gold-muted text-black font-semibold"
                            : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        }`}
                      >
                        {isCurrentPlay ? <Square size={9} className="fill-current text-black" /> : <Play size={9} className="fill-current" />}
                        <span>{isCurrentPlay ? "MUTE" : "LISTEN"}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredFragments.length === 0 && (
            <div className="col-span-full border border-zinc-900 bg-zinc-950/20 text-center py-16 space-y-3 rounded-sm">
              <span className="text-zinc-700 font-mono text-[11px] uppercase tracking-[0.25em] block">
                NO FRAGMENTS REGISTERED IN THIS SHADOW RANGE
              </span>
              <button
                id="reset-filter-btn"
                onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                className="text-xs font-mono text-gold-muted hover:underline uppercase tracking-widest cursor-pointer"
              >
                Clear Coordinates
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
