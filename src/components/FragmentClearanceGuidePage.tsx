import React, { useEffect, useState } from "react";
import { ArrowLeft, FileText, Mail, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Send } from "lucide-react";
import DocumentScrollControls from "./DocumentScrollControls";

interface FragmentClearanceGuidePageProps {
  onBack?: () => void;
  onRequestClearance?: () => void;
  onContact?: () => void;
}

export default function FragmentClearanceGuidePage({
  onBack,
  onRequestClearance,
  onContact
}: FragmentClearanceGuidePageProps) {
  const [expandedFaq, setExpandedFaq] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false,
    3: false,
    4: false
  });

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

  const toggleFaq = (index: number) => {
    setExpandedFaq(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const faqs = [
    {
      q: "Can I release music before my license is approved?",
      a: "No. Commercial use is only permitted after an official license has been issued."
    },
    {
      q: "Can I modify a fragment?",
      a: "Yes, provided your modifications remain within the permissions granted by your license agreement."
    },
    {
      q: "Can I transfer my license to another person or company?",
      a: "No. Licenses are non-transferable unless expressly authorized in writing by LOMON LLC."
    },
    {
      q: "Does purchasing a license transfer copyright ownership?",
      a: "No. A license grants permission to use a fragment under specific terms. Copyright ownership remains with LOMON LLC unless transferred through a separate written agreement."
    },
    {
      q: "Can I purchase exclusive rights after licensing a fragment?",
      a: "Where available, exclusive acquisitions may be offered. Availability depends on the licensing status of the fragment at the time of the request."
    }
  ];

  return (
    <div className="clearance-guide-page min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Container - Max Width 850px matching Terms of Use */}
      <div className="max-w-[850px] mx-auto space-y-10 text-left">
        
        {/* Top Header / Navigation Bar */}
        <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
          <button
            onClick={handleReturn}
            className="inline-flex items-center justify-center text-[11px] font-bold tracking-[0.2em] text-zinc-400 hover:text-white transition-colors uppercase cursor-pointer group border border-zinc-900 bg-zinc-950 px-3.5 py-2 rounded-sm w-fit"
            title="Return"
            aria-label="Return"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-zinc-300" />
          </button>

          <div className="flex items-center gap-2 text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest text-left break-words">
            <FileText size={14} className="text-zinc-300 shrink-0" />
            <span className="break-words">LOMON LLC • FRAGMENT CLEARANCE GUIDE</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-8 text-left">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] text-zinc-400 uppercase block text-left break-words">
              LOMON LLC • CLEARANCE PROTOCOLS
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.12em] sm:tracking-[0.15em] uppercase leading-tight text-left break-words">
              FRAGMENT CLEARANCE GUIDE
            </h1>
          </div>

          <div className="flex flex-wrap items-start sm:items-center gap-x-6 gap-y-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-900/50 pt-4 text-left">
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Effective Date:</span>
              <span className="text-zinc-200">August 9, 2026</span>
            </div>
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Administration:</span>
              <span className="text-zinc-200">LOMON LLC</span>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-zinc-300 font-sans pt-2">
            Welcome to <strong className="text-white">The Owl Clock</strong>. Every fragment within this archive is an original copyrighted musical work created and administered by LOMON LLC. Before any fragment may be used in a recording, production, synchronization, advertisement, film, television program, game, or any other commercial project, the appropriate rights must be obtained through our clearance process.
          </p>

          <div className="p-4 bg-zinc-950 border border-zinc-900 text-[11px] text-zinc-400 font-mono leading-relaxed space-y-1.5 rounded-sm">
            <p className="text-zinc-200 font-bold">
              This guide explains how to legally acquire, license, and commercially exploit a fragment from the archive.
            </p>
          </div>
        </div>

        {/* Guide Body Steps */}
        <div className="space-y-10 text-[12.5px] leading-relaxed font-sans text-zinc-300">

          {/* STEP 01 */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-start gap-2 break-words">
              <span className="text-zinc-400">STEP 01 —</span> DISCOVER A FRAGMENT
            </h2>
            <p className="leading-relaxed">
              Browse the archive and explore the available fragments.
            </p>
            <p className="leading-relaxed text-zinc-400 font-mono text-[11.5px]">
              Each fragment represents an original composition preserved within The Owl Clock archive and is identified by its timestamp.
            </p>
            <div className="p-3 bg-zinc-950/80 border border-zinc-900 text-[11.5px] font-mono text-zinc-300 rounded-sm">
              When you find a fragment that fits your project, record its timestamp and title before requesting clearance.
            </div>
          </section>

          {/* STEP 02 */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-start gap-2 break-words">
              <span className="text-zinc-400">STEP 02 —</span> SELECT YOUR LICENSE
            </h2>
            <p>
              Choose the licensing option that best matches your intended use:
            </p>

            <div className="grid grid-cols-1 gap-3 pt-1">
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1">
                <span className="text-white font-mono font-bold text-[12px] uppercase tracking-wider block">
                  • ACCESS LICENSE
                </span>
                <p className="text-[12px] text-zinc-400 leading-relaxed font-sans">
                  Designed for artists who wish to create and independently release music built around a fragment while operating within the permitted usage limits defined in the license agreement.
                </p>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1">
                <span className="text-white font-mono font-bold text-[12px] uppercase tracking-wider block">
                  • COMMERCIAL RELEASE LICENSE
                </span>
                <p className="text-[12px] text-zinc-400 leading-relaxed font-sans">
                  Designed for commercial releases intended for wider public distribution, marketing, streaming platforms, monetization, and professional release campaigns.
                </p>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1">
                <span className="text-white font-mono font-bold text-[12px] uppercase tracking-wider block">
                  • COMMERCIAL EXPLOITATION LICENSE
                </span>
                <p className="text-[12px] text-zinc-400 leading-relaxed font-sans">
                  Designed for labels, publishers, film studios, television productions, brands, advertising agencies, gaming companies, and other large-scale commercial projects requiring expanded usage rights.
                </p>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1">
                <span className="text-white font-mono font-bold text-[12px] uppercase tracking-wider block">
                  • EXCLUSIVE ACQUISITION
                </span>
                <p className="text-[12px] text-zinc-400 leading-relaxed font-sans">
                  Selected fragments may be acquired exclusively. Once an exclusive acquisition has been completed, the fragment is permanently removed from future licensing and will no longer be available to additional clients. Availability is determined on a fragment-by-fragment basis.
                </p>
              </div>
            </div>
          </section>

          {/* STEP 03 */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-start gap-2 break-words">
              <span className="text-zinc-400">STEP 03 —</span> REQUEST CLEARANCE
            </h2>
            <p>
              Submit a clearance request before beginning production.
            </p>
            <p className="text-[12px] font-mono text-zinc-400">
              Your request should include:
            </p>

            <ul className="space-y-2 pl-4 border-l-2 border-zinc-800 font-mono text-[11.5px] text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-zinc-600">—</span>
                <span className="text-white font-bold">Fragment timestamp</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-zinc-600">—</span>
                <span className="text-white font-bold">Artist or company name</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-zinc-600">—</span>
                <span className="text-white font-bold">Project title</span> (if available)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-zinc-600">—</span>
                <span className="text-white font-bold">Intended commercial use</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-zinc-600">—</span>
                <span className="text-white font-bold">Preferred licensing option</span>
              </li>
            </ul>

            <p className="text-[12px] text-zinc-400 pt-1 font-sans">
              Requests are reviewed individually to ensure the selected license aligns with the intended use.
            </p>
          </section>

          {/* STEP 04 */}
          <section className="space-y-3 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-start gap-2 break-words">
              <span className="text-zinc-400">STEP 04 —</span> REVIEW &amp; APPROVAL
            </h2>
            <p>
              After your request is received, The Owl Clock will review your intended use and determine the appropriate licensing pathway.
            </p>
            <p className="text-zinc-400 text-[12px]">
              If additional information is required, our team will contact you before preparing your documentation.
            </p>
            <div className="p-3 bg-zinc-950 border border-zinc-900 text-[11.5px] font-mono text-white rounded-sm font-bold">
              Approval is granted only after all licensing requirements have been satisfied.
            </div>
          </section>

          {/* STEP 05 */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-start gap-2 break-words">
              <span className="text-zinc-400">STEP 05 —</span> DOCUMENTATION
            </h2>
            <p>
              Upon approval, you will receive the documentation applicable to your transaction, which may include:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11.5px] text-zinc-300">
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                <CheckCircle2 size={13} className="text-zinc-500 shrink-0" />
                <span>Fragment License Agreement</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                <CheckCircle2 size={13} className="text-zinc-500 shrink-0" />
                <span>Exclusive Acquisition Agreement (where applicable)</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                <CheckCircle2 size={13} className="text-zinc-500 shrink-0" />
                <span>Split Sheet (where applicable)</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                <CheckCircle2 size={13} className="text-zinc-500 shrink-0" />
                <span>Rights Documentation</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                <CheckCircle2 size={13} className="text-zinc-500 shrink-0" />
                <span>Metadata Instructions</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2">
                <CheckCircle2 size={13} className="text-zinc-500 shrink-0" />
                <span>Credit Requirements</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-sm flex items-center gap-2 sm:col-span-2">
                <CheckCircle2 size={13} className="text-zinc-500 shrink-0" />
                <span>Invoice and Payment Confirmation</span>
              </div>
            </div>

            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider pt-1">
              All documentation is issued electronically.
            </p>
          </section>

          {/* STEP 06 */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-start gap-2 break-words">
              <span className="text-zinc-400">STEP 06 —</span> DELIVERY
            </h2>
            <p>
              Once documentation has been completed and payment has been confirmed (where applicable), your licensed materials will be delivered.
            </p>
            <p className="text-[12px] font-mono text-zinc-400">
              Depending on the license granted, delivery may include:
            </p>

            <ul className="space-y-2 pl-4 border-l-2 border-zinc-800 font-mono text-[11.5px] text-zinc-300">
              <li>• High-quality audio files</li>
              <li>• WAV files</li>
              <li>• Stems (when included)</li>
              <li>• Session materials (where applicable)</li>
              <li>• Metadata package</li>
              <li>• Credit information</li>
            </ul>

            <p className="text-[11.5px] font-mono text-zinc-400 pt-1">
              Delivery contents vary according to the license purchased.
            </p>
          </section>

          {/* IMPORTANT NOTICE BLOCK */}
          <section className="p-5 bg-zinc-950 border border-zinc-800 rounded-sm space-y-3 my-6">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px] font-bold tracking-widest uppercase">
              <AlertTriangle size={15} />
              <span>IMPORTANT NOTICE &amp; LEGAL REQUIREMENT</span>
            </div>

            <p className="text-[12.5px] text-zinc-200 leading-relaxed font-sans font-semibold">
              No fragment may be commercially used, distributed, released, uploaded, monetized, synchronized, sampled, adapted, or publicly exploited until an official license has been issued by The Owl Clock.
            </p>

            <p className="text-[12px] text-zinc-400 leading-relaxed font-sans">
              Downloading, previewing, or accessing a fragment does not transfer ownership or grant any usage rights.
            </p>

            <p className="text-[12px] text-zinc-300 font-mono pt-1">
              All intellectual property remains the exclusive property of LOMON LLC unless expressly transferred through a written agreement.
            </p>
          </section>

          {/* FREQUENTLY ASKED QUESTIONS */}
          <section className="space-y-4 border-b border-zinc-900/60 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left">
                FREQUENTLY ASKED QUESTIONS
              </h2>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">CLEARANCE FAQ</span>
            </div>

            <div className="space-y-3 pt-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-zinc-900 bg-zinc-950 rounded-sm overflow-hidden">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left font-mono text-[12px] font-bold text-white hover:text-zinc-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-zinc-500 text-xs shrink-0">
                      {expandedFaq[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                  {expandedFaq[idx] && (
                    <div className="px-4 pb-4 pt-1 text-[12px] text-zinc-300 font-sans leading-relaxed border-t border-zinc-900/60 bg-black/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* NEED ASSISTANCE? */}
          <section className="space-y-4 pt-2">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase">
              NEED ASSISTANCE?
            </h2>
            <p className="text-[12.5px] leading-relaxed">
              If you have questions about licensing, collaborations, publishing, rights administration, or custom projects, contact The Owl Clock before beginning your release.
            </p>

            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-sm space-y-4">
              <p className="text-[12px] font-mono text-zinc-200 font-bold tracking-wider uppercase">
                Every clearance begins with proper documentation.
              </p>

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
                    <Mail size={12} />
                    <span>CONTACT ARCHIVE</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Sign-off & Return */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[11px] text-zinc-500 text-left">
          <div className="space-y-1 text-left">
            <p className="text-white font-bold tracking-wider uppercase text-[12px] text-left">THE OWL CLOCK</p>
            <p className="text-zinc-500 text-[10.5px] text-left">An archival music system by LOMON LLC.</p>
          </div>
          <button
            onClick={handleReturn}
            className="inline-flex items-center justify-center text-[11px] font-bold tracking-[0.2em] text-zinc-300 hover:text-white transition-colors uppercase cursor-pointer bg-transparent border border-zinc-800 hover:border-zinc-500 px-4 py-2 rounded-sm group"
            title="Return"
            aria-label="Return"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-zinc-300" />
          </button>
        </div>

        <DocumentScrollControls />
      </div>
    </div>
  );
}
