import React, { useEffect } from "react";
import { ArrowLeft, FileText, CheckCircle2, ShieldCheck, Send, Sparkles, HelpCircle, Layers, Lock, Zap } from "lucide-react";
import DocumentScrollControls from "./DocumentScrollControls";
import { DEFAULT_LICENSE_TEMPLATES } from "../licenses";

interface FragmentLicensingSchedulePageProps {
  onBack?: () => void;
  onRequestClearance?: (licenseId?: string) => void;
  onContact?: () => void;
}

export default function FragmentLicensingSchedulePage({
  onBack,
  onRequestClearance,
  onContact
}: FragmentLicensingSchedulePageProps) {

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
    <div className="licensing-schedule-page min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Container - Max Width 950px */}
      <div className="max-w-[950px] mx-auto space-y-10 text-left">
        
        {/* Navigation Bar */}
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
            <span className="break-words">LOMON LLC • LICENSING SCHEDULE &amp; PRICING</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-8 text-left">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] text-zinc-400 uppercase block text-left break-words">
              LOMON LLC • PUBLIC PRICING &amp; RIGHTS SCHEDULE
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.12em] sm:tracking-[0.15em] uppercase leading-tight text-left break-words">
              FRAGMENT LICENSING SCHEDULE
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
            <div>
              <span className="text-zinc-600 uppercase tracking-wider mr-2 font-bold">Currency:</span>
              <span className="text-emerald-400 font-bold">USD ($)</span>
            </div>
          </div>

          <p className="text-[13.5px] leading-relaxed text-zinc-200 font-sans pt-2">
            Public pricing and licensing options for all available fragment licenses administered by <strong className="text-white">LOMON LLC</strong> within <strong className="text-white">The Owl Clock</strong> archive.
          </p>

          <p className="text-[13px] leading-relaxed text-zinc-300 font-sans">
            Every audio fragment in the archive is catalogued under standard contractual tiers designed for songwriters, independent artists, record labels, film directors, gaming studios, and commercial brand campaigns.
          </p>

          <div className="p-3 bg-zinc-950 border border-zinc-900 text-[11px] font-mono text-zinc-400 rounded-sm flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>All licenses are issued directly by LOMON LLC with guaranteed 100% sample-free clearance documentation.</span>
          </div>
        </div>

        {/* SECTION 1: LICENSING TIERS GRID */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-start gap-2 break-words">
              <span className="text-zinc-400">01.</span> AVAILABLE LICENSING TIERS &amp; PRICING
            </h2>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              5 STANDARDIZED TIERS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DEFAULT_LICENSE_TEMPLATES.map((tpl) => {
              const isSync = tpl.id === "sync";
              const isExclusive = tpl.id === "exclusive";

              return (
                <div 
                  key={tpl.id}
                  className={`p-6 bg-zinc-950 border rounded-sm flex flex-col justify-between gap-6 transition-all ${
                    isExclusive 
                      ? "border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-zinc-950" 
                      : isSync
                      ? "border-zinc-700 bg-zinc-950"
                      : "border-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-900/80 pb-3">
                      <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                        {tpl.id.toUpperCase()} TIER
                      </span>
                      <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${
                        isExclusive 
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                      }`}>
                        {tpl.exclusivity || "Non-Exclusive"}
                      </span>
                    </div>

                    {/* Title & Price */}
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white tracking-wide uppercase">
                        {tpl.title}
                      </h3>
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-2xl font-mono font-bold text-white tracking-tight">
                          {tpl.priceDisplay || `$${tpl.price.toLocaleString()}`}
                        </span>
                        {tpl.price > 0 && (
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            ONE-TIME FEE
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[12px] text-zinc-300 leading-relaxed font-sans">
                      {tpl.subtitle || tpl.description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900/60">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                        Included Rights &amp; Deliverables:
                      </span>
                      <ul className="space-y-1.5 text-[11px] font-mono text-zinc-300">
                        {tpl.usageTerms.map((term, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{term}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Specs */}
                    <div className="pt-3 border-t border-zinc-900/60 grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                      <div>
                        <span className="text-zinc-500 uppercase block font-bold text-[9px]">File Delivery</span>
                        <span className="text-zinc-300">{tpl.fileDelivery}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 uppercase block font-bold text-[9px]">Publishing Split</span>
                        <span className="text-zinc-300">{tpl.publishingSplit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => onRequestClearance && onRequestClearance(tpl.id)}
                      className={`w-full py-2.5 px-4 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        isExclusive
                          ? "bg-amber-400 text-black hover:bg-amber-300"
                          : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      <span>{tpl.buttonText || "REQUEST CLEARANCE"}</span>
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: COMPARISON FEATURE MATRIX */}
        <section className="space-y-6 pt-6 border-t border-zinc-900/80">
          <div className="space-y-1 border-b border-zinc-900 pb-3">
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-start gap-2 break-words">
              <span className="text-zinc-400">02.</span> LICENSE TIER COMPARISON MATRIX
            </h2>
            <p className="text-[11px] font-mono text-zinc-500 uppercase">
              DETAILED BREAKDOWN OF PERMITTED USAGE, DELIVERABLES &amp; PUBLISHING SPLITS
            </p>
          </div>

          <div className="overflow-x-auto border border-zinc-900 rounded-sm bg-zinc-950">
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-300 uppercase tracking-wider text-[10px]">
                  <th className="p-3.5 font-bold">Rights / Feature</th>
                  <th className="p-3.5 font-bold">Archive Access ($150)</th>
                  <th className="p-3.5 font-bold">Commercial Release ($500)</th>
                  <th className="p-3.5 font-bold">Commercial Exploitation ($1,000)</th>
                  <th className="p-3.5 font-bold">Sync / Media (Proposal)</th>
                  <th className="p-3.5 font-bold text-amber-400">Exclusive ($5,000)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/80 text-zinc-300">
                <tr>
                  <td className="p-3.5 font-bold text-white bg-zinc-900/30">Target Audience</td>
                  <td className="p-3.5">Demos &amp; Rehearsals</td>
                  <td className="p-3.5">Indie Releases</td>
                  <td className="p-3.5">Commercial Artists</td>
                  <td className="p-3.5">Film / TV / Ads</td>
                  <td className="p-3.5 font-bold text-amber-300">Exclusive Owners</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white bg-zinc-900/30">Delivered Audio</td>
                  <td className="p-3.5">Tagged MP3 + WAV</td>
                  <td className="p-3.5">Hi-Res WAV + MP3</td>
                  <td className="p-3.5 font-bold text-white">Hi-Res WAV + Stems</td>
                  <td className="p-3.5">Custom Package</td>
                  <td className="p-3.5 font-bold text-amber-300">Full Production Stems</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white bg-zinc-900/30">Streaming Release</td>
                  <td className="p-3.5 text-zinc-500">Not Allowed</td>
                  <td className="p-3.5">Per Agreement</td>
                  <td className="p-3.5 font-bold text-emerald-400">Unlimited Streaming</td>
                  <td className="p-3.5">Broadcast / VoD</td>
                  <td className="p-3.5 font-bold text-emerald-400">Unlimited Commercial</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white bg-zinc-900/30">Production Stems</td>
                  <td className="p-3.5 text-zinc-500">No</td>
                  <td className="p-3.5 text-zinc-500">No</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Yes (Full Stems)</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Yes</td>
                  <td className="p-3.5 text-amber-400 font-bold">Yes (Complete Stems)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white bg-zinc-900/30">Publishing Split</td>
                  <td className="p-3.5">100% Lomon LLC</td>
                  <td className="p-3.5">50% Writer / 50% Pub</td>
                  <td className="p-3.5">50% Writer / 50% Pub</td>
                  <td className="p-3.5">Negotiated Schedule</td>
                  <td className="p-3.5 font-bold text-amber-300">Ownership Transfer (as agreed)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white bg-zinc-900/30">Monetized Video</td>
                  <td className="p-3.5 text-zinc-500">No</td>
                  <td className="p-3.5">Approved Channels</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Full Monetization</td>
                  <td className="p-3.5">Broadcast / Sync</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Full Commercial</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white bg-zinc-900/30">Exclusivity</td>
                  <td className="p-3.5">Non-Exclusive</td>
                  <td className="p-3.5">Non-Exclusive</td>
                  <td className="p-3.5">Non-Exclusive</td>
                  <td className="p-3.5">Project Specific</td>
                  <td className="p-3.5 font-bold text-amber-400">100% Exclusive (Removed from Archive)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: ARCHIVAL & LEGAL TERMS SUMMARY */}
        <section className="space-y-4 pt-6 border-t border-zinc-900/80">
          <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase text-left flex items-start gap-2 break-words">
            <span className="text-zinc-400">03.</span> ARCHIVAL &amp; LICENSING STANDARDS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[12px] font-sans">
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1.5">
              <span className="font-mono text-white font-bold text-[11px] uppercase block">
                100% ORIGINAL COMPOSITIONS
              </span>
              <p className="text-zinc-400 leading-relaxed text-[11.5px]">
                Every fragment in The Owl Clock archive is an original, sample-free composition recorded and owned by LOMON LLC.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1.5">
              <span className="font-mono text-white font-bold text-[11px] uppercase block">
                DIGITAL CERTIFICATES
              </span>
              <p className="text-zinc-400 leading-relaxed text-[11.5px]">
                All approved licenses are issued with an authenticated digital Clearance Certificate and cryptographic metadata ID for DSP registration.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1.5">
              <span className="font-mono text-white font-bold text-[11px] uppercase block">
                FAST STEMS DISPATCH
              </span>
              <p className="text-zinc-400 leading-relaxed text-[11.5px]">
                High-resolution audio masters and multitrack stems are dispatched securely upon clearance approval and checkout execution.
              </p>
            </div>
          </div>
        </section>

        {/* ACTION BUTTONS & FOOTER SIGNOFF */}
        <section className="p-6 bg-zinc-950 border border-zinc-900 rounded-sm space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
              CLEARANCE TRANSMISSIONS
            </span>
            <p className="text-[12px] font-mono text-zinc-100 font-bold uppercase">
              READY TO LICENSE A FRAGMENT OR START A COLLABORATION?
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onRequestClearance && (
              <button
                onClick={() => onRequestClearance()}
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

        {/* Footer Return */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[11px] text-zinc-500 text-left">
          <div className="space-y-1 text-left">
            <p className="text-white font-bold tracking-wider uppercase text-[12px] text-left">THE OWL CLOCK</p>
            <p className="text-zinc-500 text-[10.5px] text-left">Fragment Licensing Schedule &amp; Rights Administration • LOMON LLC</p>
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
