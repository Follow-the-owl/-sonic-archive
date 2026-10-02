import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Calendar, Clock, ArrowRight, X } from "lucide-react";
import { JOURNAL_ENTRIES, JournalEntry } from "../data";

export default function MidnightJournalSection() {
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  return (
    <div id="section-journal" className="max-w-5xl mx-auto py-12 px-4 md:px-8 space-y-16">
      {/* Narrative Section Header */}
      <div className="text-center space-y-4">
        <span className="text-[10px] tracking-[0.5em] font-mono text-gold-muted uppercase block">
          LOCATION VI // THE MIDNIGHT JOURNAL
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-light tracking-[0.1em] text-zinc-100">
          The Midnight Journal
        </h2>
        <p className="font-serif text-zinc-500 italic text-sm">
          "Thoughts compiled when daylight behaves like a memory."
        </p>
        <div className="h-[1px] w-12 bg-gold-muted/30 mx-auto mt-6" />
      </div>

      {/* Editorial Posts Grid */}
      <div className="grid md:grid-cols-2 gap-10">
        {JOURNAL_ENTRIES.map((entry, idx) => (
          <motion.div
            id={`journal-item-${entry.id}`}
            key={entry.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: idx * 0.1 }}
            className="group flex flex-col justify-between border-b border-zinc-900 pb-8 space-y-4"
          >
            <div className="space-y-3">
              {/* Journal Meta */}
              <div className="flex items-center gap-4 font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {entry.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {entry.time}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-serif text-zinc-200 group-hover:text-gold-muted hover:underline cursor-pointer transition-colors" onClick={() => setActiveEntry(entry)}>
                {entry.title}
              </h3>

              {/* Excerpt */}
              <p className="text-xs text-zinc-500 font-sans font-light leading-relaxed h-[50px] overflow-hidden line-clamp-3">
                {entry.excerpt}
              </p>
            </div>

            {/* Read more trigger */}
            <button
              id={`read-${entry.id}`}
              onClick={() => setActiveEntry(entry)}
              className="flex items-center gap-2 text-[9px] font-mono text-zinc-400 hover:text-gold-muted/90 uppercase tracking-[0.25em] pt-2 cursor-pointer"
            >
              <span>INSPECT CHRONOLOGY</span>
              <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Poetic Quote Filler */}
      <div className="border-t border-zinc-900 pt-16 text-center select-none">
        <p className="font-serif text-lg italic text-zinc-650 max-w-lg mx-auto">
          "The night does not exist to hide things. It exists to show resources that daylight washes away."
        </p>
      </div>

      {/* Full Essay Reading Modal Drawer */}
      <AnimatePresence>
        {activeEntry && (
          <motion.div
            id="journal-reader-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-end z-50 overflow-hidden"
          >
            {/* Modal Drawer Shell */}
            <motion.div
              id="journal-reader-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 180 }}
              className="bg-zinc-950 border-l border-zinc-900 w-full max-w-xl h-full p-8 md:p-12 overflow-y-auto flex flex-col justify-between"
            >
              {/* Header Meta */}
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
                  <span className="text-[10px] font-mono text-gold-muted uppercase tracking-[0.2em]">
                    // ARCHIVED REFLECTION JOURNAL
                  </span>
                  <button
                    id="close-journal-reader"
                    onClick={() => setActiveEntry(null)}
                    className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 hover:text-zinc-200 cursor-pointer uppercase tracking-wider"
                  >
                    <X size={12} />
                    <span>BACK</span>
                  </button>
                </div>

                {/* Date & Time Segment */}
                <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600 uppercase">
                  <span>DATE: {activeEntry.date}</span>
                  <span>TIME OF ENTRY: {activeEntry.time}</span>
                </div>

                {/* Editorial Essay Area */}
                <div className="space-y-6">
                  <h3 className="text-4xl font-serif text-zinc-100 font-normal leading-normal italic text-gold-muted glow-text">
                    {activeEntry.title}
                  </h3>
                  <div className="h-[1px] w-24 bg-zinc-900" />
                  <div className="font-sans text-sm md:text-md text-zinc-400 font-light leading-relaxed space-y-4">
                    {activeEntry.content.split("\n\n").map((para, pidx) => (
                      <p key={pidx}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Stamp */}
              <div className="border-t border-zinc-900 pt-10 mt-12 text-center text-[10px] font-mono text-zinc-650 tracking-widest uppercase">
                {activeEntry.time} — LOG COMPLETE BY SENTINEL WATCHER
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
