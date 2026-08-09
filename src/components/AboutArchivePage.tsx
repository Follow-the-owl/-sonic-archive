import React, { useEffect } from "react";
import { ArrowLeft, BookOpen, ShieldCheck, Sparkles, Music, Disc, Layers, Send } from "lucide-react";
import DocumentScrollControls from "./DocumentScrollControls";

interface AboutArchivePageProps {
  onBack?: () => void;
  onRequestClearance?: () => void;
  onContact?: () => void;
}

export default function AboutArchivePage({
  onBack,
  onRequestClearance,
  onContact
}: AboutArchivePageProps) {

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReturn = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="about-archive-page min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Container - Max Width 850px matching Terms of Use */}
      <div className="max-w-[850px] mx-auto space-y-10 text-left">
        
        {/* Navigation Bar */}
        <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={handleReturn}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-zinc-400 hover:text-white transition-colors uppercase cursor-pointer group border border-zinc-900 bg-zinc-950 px-3.5 py-2 rounded-sm w-fit"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform text-zinc-300" />
            <span>RETURN TO PREVIOUS PAGE</span>
          </button>

          <div className="flex items-center gap-2 text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest">
            <BookOpen size={14} className="text-zinc-300" />
            <span>LOMON LLC • ABOUT THE ARCHIVE</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-8">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-400 uppercase block">
              LOMON LLC • ARCHIVAL SYSTEM
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.18em] uppercase leading-tight">
              ABOUT THE ARCHIVE
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-900/50 pt-4">
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">System Status:</span>
              <span className="text-emerald-400 font-bold">ACTIVE &amp; INDEXED</span>
            </div>
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Administration:</span>
              <span className="text-zinc-200">LOMON LLC</span>
            </div>
          </div>

          <p className="text-[13.5px] leading-relaxed text-zinc-200 font-sans pt-2">
            <strong className="text-white">The Owl Clock</strong> is an archival music system dedicated to preserving original musical fragments as timeless creative assets.
          </p>

          <p className="text-[13px] leading-relaxed text-zinc-300 font-sans">
            The archive documents moments of musical inspiration, each fragment catalogued under a unique timestamp and maintained as an authenticated record within a growing collection.
          </p>

          <p className="text-[13px] leading-relaxed text-zinc-300 font-sans">
            Every fragment represents a recoverable moment in time, carefully preserved for artists, producers, filmmakers, composers, and creative partners seeking original source material.
          </p>

          <div className="p-3 bg-zinc-950 border border-zinc-900 text-[11px] font-mono text-zinc-400 rounded-sm">
            The archive is maintained by <strong className="text-white font-bold">LOMON LLC</strong>.
          </div>
        </div>

        {/* Archive Main Body Sections */}
        <div className="space-y-10 text-[12.5px] leading-relaxed font-sans text-zinc-300">

          {/* SECTION 1: THE ARCHIVE */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-center gap-2">
              <span className="text-zinc-400">01.</span> THE ARCHIVE
            </h2>

            <p>
              Every entry within the archive is individually catalogued.
            </p>

            <p className="text-zinc-300">
              Each fragment receives its own identity through a timestamp, allowing it to exist as a documented creative work rather than an unnamed demo or unfinished idea.
            </p>

            <div className="space-y-2 pt-1">
              <span className="text-[11.5px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                Every archive entry may include:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11.5px] text-zinc-300">
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                  <span className="text-zinc-600 font-bold">*</span>
                  <span className="text-white font-semibold">Timestamp Identification</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                  <span className="text-zinc-600 font-bold">*</span>
                  <span className="text-white font-semibold">Audio Preview</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                  <span className="text-zinc-600 font-bold">*</span>
                  <span className="text-white font-semibold">Musical Key</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                  <span className="text-zinc-600 font-bold">*</span>
                  <span className="text-white font-semibold">Tempo (BPM)</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                  <span className="text-zinc-600 font-bold">*</span>
                  <span className="text-white font-semibold">Recovery Status</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                  <span className="text-zinc-600 font-bold">*</span>
                  <span className="text-white font-semibold">Archive Metadata</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                  <span className="text-zinc-600 font-bold">*</span>
                  <span className="text-white font-semibold">Licensing Status</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                  <span className="text-zinc-600 font-bold">*</span>
                  <span className="text-white font-semibold">Ownership Documentation</span>
                </div>
              </div>
            </div>

            <p className="text-[12px] font-mono text-zinc-400 pt-2">
              Fragments remain part of a permanent archival collection regardless of whether they are licensed.
            </p>
          </section>

          {/* SECTION 2: THE ARCHIVIST */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-center gap-2">
              <span className="text-zinc-400">02.</span> THE ARCHIVIST
            </h2>

            <p>
              The archive is curated by <strong className="text-white font-bold">LOMON</strong>, producer, composer, and founder of The Owl Clock.
            </p>

            <p className="text-zinc-300">
              Every fragment originates from an authentic writing session and reflects a real creative moment preserved exactly as it was discovered.
            </p>

            <p className="text-zinc-300">
              Rather than releasing every idea as a finished production, selected moments are documented, preserved, and made available for future creative collaboration through structured licensing.
            </p>
          </section>

          {/* SECTION 3: AUTHENTICITY */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-center gap-2">
              <span className="text-zinc-400">03.</span> AUTHENTICITY
            </h2>

            <p>
              Every fragment published within The Owl Clock is original intellectual property.
            </p>

            <p className="text-zinc-300">
              Each archive entry is documented with supporting metadata and maintained through internal archival standards to preserve its authenticity and history.
            </p>

            <div className="p-3 bg-zinc-950 border border-zinc-900 text-[11.5px] font-mono text-zinc-300 rounded-sm">
              Official licensing documentation is issued directly by <strong className="text-white">LOMON LLC</strong> for every approved clearance.
            </div>
          </section>

          {/* SECTION 4: CLEARANCE */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-center gap-2">
              <span className="text-zinc-400">04.</span> CLEARANCE
            </h2>

            <p>
              The Owl Clock operates through a structured clearance system.
            </p>

            <p className="text-zinc-300">
              No fragment is released for commercial use without proper authorization.
            </p>

            <p className="text-zinc-300 leading-relaxed">
              Every approved project receives documentation appropriate to its licensing pathway, ensuring that creators, collaborators, and commercial partners have clearly defined rights before release.
            </p>

            <p className="text-[12px] font-mono text-zinc-400">
              This process protects both the archive and the artists who choose to build from it.
            </p>
          </section>

          {/* QUOTE BLOCK */}
          <section className="my-8">
            <div className="p-6 bg-zinc-950 border-l-2 border-zinc-400 border-y border-r border-zinc-900/80 rounded-sm space-y-2">
              <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
                ARCHIVAL CREDO
              </span>
              <blockquote className="text-[13.5px] sm:text-[14.5px] font-serif italic text-zinc-200 leading-relaxed">
                &ldquo;The Owl Clock exists to give unfinished ideas a permanent home until the right artist, producer, filmmaker, or collaborator discovers them.&rdquo;
              </blockquote>
            </div>
          </section>

          {/* SECTION 5: THE FUTURE OF THE ARCHIVE */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-center gap-2">
              <span className="text-zinc-400">05.</span> THE FUTURE OF THE ARCHIVE
            </h2>

            <p>
              The archive continues to grow through ongoing documentation and preservation.
            </p>

            <p className="text-zinc-300">
              New fragments are recovered, catalogued, authenticated, and made available over time, ensuring that every addition meets the archival standards of The Owl Clock.
            </p>

            <div className="p-4 bg-zinc-950 border border-zinc-900 text-[12px] font-mono text-white rounded-sm font-semibold">
              The archive is a catalogue of preserved musical moments, maintained for creators who value originality and documentation.
            </div>
          </section>

          {/* ACTION BUTTONS */}
          <section className="p-5 bg-zinc-950 border border-zinc-900 rounded-sm space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
                EXPLORE &amp; CLEARANCE
              </span>
              <p className="text-[12px] font-mono text-zinc-200 font-bold uppercase">
                READY TO REVIEW AVAILABLE FRAGMENTS OR INQUIRE ABOUT A COMPOSITION?
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {onRequestClearance && (
                <button
                  onClick={onRequestClearance}
                  className="inline-flex items-center gap-2 text-[11px] font-mono font-bold tracking-widest bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-sm uppercase transition-colors cursor-pointer"
                >
                  <span>REQUEST CLEARANCE</span>
                  <Send size={12} />
                </button>
              )}

              {onContact && (
                <button
                  onClick={onContact}
                  className="inline-flex items-center gap-2 text-[11px] font-mono font-bold tracking-widest bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800 border border-zinc-700 px-4 py-2.5 rounded-sm uppercase transition-colors cursor-pointer"
                >
                  <span>CONTACT ARCHIVIST</span>
                </button>
              )}
            </div>
          </section>

        </div>

        {/* Footer Signoff */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-zinc-500">
          <div className="space-y-1">
            <p className="text-white font-bold tracking-wider uppercase text-[12px]">THE OWL CLOCK</p>
            <p className="text-zinc-500 text-[10.5px]">An archival music system by LOMON LLC.</p>
          </div>
          <button
            onClick={handleReturn}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-zinc-300 hover:text-white transition-colors uppercase cursor-pointer bg-transparent border border-zinc-800 hover:border-zinc-500 px-4 py-2 rounded-sm"
          >
            <span>← RETURN TO PREVIOUS PAGE</span>
          </button>
        </div>

        <DocumentScrollControls />
      </div>
    </div>
  );
}
