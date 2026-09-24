import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Layers, 
  Radio, 
  Building2, 
  Sliders, 
  Music,
  Clock,
  Film,
  Tv,
  Gamepad2,
  Share2,
  Briefcase
} from "lucide-react";
import DocumentScrollControls from "./DocumentScrollControls";

interface ProposalPageProps {
  onBack?: () => void;
  initialFragment?: string;
  initialProjectScope?: string;
  onOpenClearanceGuide?: () => void;
  onOpenLicensingSchedule?: () => void;
}

export default function ProposalPage({
  onBack,
  initialFragment = "",
  initialProjectScope = "Synchronization / Commercial Media",
  onOpenClearanceGuide,
  onOpenLicensingSchedule
}: ProposalPageProps) {
  const [formData, setFormData] = useState({
    proposerName: "",
    organization: "",
    email: "",
    phone: "",
    proposalType: "Custom Sync & Master License",
    targetFragment: initialFragment || "10:00 PM (TOC-001)",
    mediaType: "Film / Feature Production",
    territory: "Worldwide",
    term: "Perpetual",
    distributionScope: "Theatrical, Broadcast TV & Streaming VoD",
    budgetRange: "$1,000 – $5,000 USD",
    projectTitle: "",
    projectOverview: "",
    stemsRequired: true,
    customSoundDesign: false,
    collaborativePublishing: true,
    additionalNotes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [proposalRef, setProposalRef] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.proposerName || !formData.email || !formData.projectOverview) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      const generatedRef = `PROP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      setProposalRef(generatedRef);

      // Register proposal into administrative clearance ledger
      if (typeof window !== "undefined") {
        try {
          const rawSaved = localStorage.getItem("lomon_admin_clearance_requests");
          const currentList = rawSaved ? JSON.parse(rawSaved) : [];
          
          let parsedFee = 1000;
          if (formData.budgetRange.includes("5,000") || formData.budgetRange.includes("10,000")) {
            parsedFee = 5000;
          } else if (formData.budgetRange.includes("1,000")) {
            parsedFee = 1000;
          }

          const newRecord = {
            ref: `CLR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            fragmentId: formData.targetFragment.split(" ")[0] || "10:00",
            fragmentName: formData.targetFragment ? formData.targetFragment.toUpperCase() : "CUSTOM SYNC PROPOSAL",
            clientId: `LOC-PROP-${Math.floor(1000 + Math.random() * 9000)}`,
            clientName: formData.proposerName + (formData.organization ? ` (${formData.organization})` : ""),
            clientEmail: formData.email,
            requestedLicense: `${formData.proposalType} — ${formData.mediaType}`,
            status: "NEW",
            paymentStatus: "PAYMENT PENDING",
            feeAmount: parsedFee,
            date: new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }),
            projectDescription: `[COLLABORATION PROPOSAL: ${formData.projectTitle || "Untitled"}] ${formData.projectOverview}\n\nScope: ${formData.distributionScope} | Territory: ${formData.territory} | Term: ${formData.term} | Budget: ${formData.budgetRange}`,
            distributionLimit: formData.distributionScope,
            streamingLimit: "Broadcast / Theatrical / VoD / DSPs",
            territory: formData.territory,
            term: formData.term,
            usageType: formData.mediaType,
            historyLog: [
              {
                date: `${new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC`,
                author: "APPLICANT",
                message: `Submitted bespoke Collaboration Proposal ref ${generatedRef}. Target: ${formData.targetFragment}.`
              }
            ]
          };

          const updatedList = [newRecord, ...currentList];
          localStorage.setItem("lomon_admin_clearance_requests", JSON.stringify(updatedList));

          // Also attempt background sync to express backend if available
          fetch("/api/clearance-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRecord)
          }).catch(() => {
            // LocalStorage persistence remains rock-solid fallback
          });
        } catch (err) {
          console.error("Failed to register clearance proposal into registry:", err);
        }
      }
    }, 1200);
  };

  return (
    <div className="proposal-page min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Container - Max Width 920px */}
      <div className="max-w-[920px] mx-auto space-y-10 text-left font-mono">
        
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

          <div className="flex items-center gap-2 text-[9.5px] text-zinc-500 uppercase tracking-widest text-left break-words">
            <Radio size={14} className="text-zinc-400 shrink-0" />
            <span className="break-words">LOMON LLC • COLLABORATION &amp; CUSTOM PROPOSAL PORTAL</span>
          </div>
        </div>

        {/* Header Block */}
        <div className="space-y-4 border-b border-zinc-900/80 pb-8 text-left">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] text-zinc-400 uppercase block text-left break-words">
              RIGHTS ADMINISTRATION &amp; ARTISTIC CO-CREATION
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-[0.12em] sm:tracking-[0.15em] uppercase leading-tight text-left break-words">
              SUBMIT COLLABORATION PROPOSAL
            </h1>
          </div>

          <p className="text-[13px] leading-relaxed text-zinc-300 font-sans pt-1">
            Propose a custom synchronization agreement, bespoke score co-creation, brand campaign soundtrack, or creative production collaboration with <strong className="text-white">LOMON LLC</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="p-3 bg-zinc-950 border border-zinc-900 text-[10.5px] font-mono text-zinc-400 rounded-sm flex items-center gap-2 w-full">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>All submissions receive direct review by our Rights Registrar and Archivist within 24–48 operational hours.</span>
            </div>
          </div>
        </div>

        {/* MAIN FORM OR SUCCESS CONFIRMATION */}
        {isSubmitted ? (
          <div className="p-8 sm:p-12 bg-zinc-950 border border-zinc-700 rounded-sm space-y-6 text-center">
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-white">
              <CheckCircle2 size={28} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-zinc-400 block">
                TRANSMISSION DISPATCHED &amp; QUEUED
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wider">
                COLLABORATION PROPOSAL RECEIVED
              </h2>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Your proposal has been logged into the clearance ledger under docket reference <strong className="text-white font-mono">{proposalRef}</strong>. An archival specialist will review your project parameters and reply to <strong className="text-zinc-200">{formData.email}</strong> with contract terms and next steps.
              </p>
            </div>

            <div className="p-4 bg-black/60 border border-zinc-900 rounded text-[11px] text-left font-mono space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">PROPOSAL REF:</span>
                <span className="text-white font-bold">{proposalRef}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">APPLICANT:</span>
                <span className="text-zinc-200">{formData.proposerName}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">TARGET FRAGMENT:</span>
                <span className="text-zinc-200">{formData.targetFragment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">CATEGORY:</span>
                <span className="text-zinc-200">{formData.proposalType}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={handleReturn}
                className="bg-white hover:bg-zinc-200 text-black text-[11px] font-bold uppercase tracking-wider px-6 py-2.5 rounded-sm cursor-pointer transition-all shadow-md"
              >
                RETURN TO ARCHIVE
              </button>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    proposerName: "",
                    organization: "",
                    email: "",
                    phone: "",
                    proposalType: "Custom Sync & Master License",
                    targetFragment: "10:00 PM (TOC-001)",
                    mediaType: "Film / Feature Production",
                    territory: "Worldwide",
                    term: "Perpetual",
                    distributionScope: "Theatrical, Broadcast TV & Streaming VoD",
                    budgetRange: "$1,000 – $5,000 USD",
                    projectTitle: "",
                    projectOverview: "",
                    stemsRequired: true,
                    customSoundDesign: false,
                    collaborativePublishing: true,
                    additionalNotes: ""
                  });
                }}
                className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-sm cursor-pointer transition-all"
              >
                SUBMIT ANOTHER PROPOSAL
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* SECTION 1: APPLICANT & PRODUCTION CO */}
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Briefcase size={15} className="text-white" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  01. APPLICANT &amp; ENTITY DETAILS
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    CONTACT NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Hayes"
                    value={formData.proposerName}
                    onChange={(e) => setFormData({ ...formData, proposerName: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3.5 py-2.5 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    ORGANIZATION / STUDIO / RECORD LABEL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paramount / Horizon Interactive"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3.5 py-2.5 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    OFFICIAL EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. j.hayes@production.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3.5 py-2.5 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    PHONE / DIRECT CONTACT (OPTIONAL)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (404) 555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3.5 py-2.5 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PROPOSAL TYPE & TARGET FRAGMENT */}
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Music size={15} className="text-white" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  02. TARGET ARCHIVE FRAGMENT &amp; PROPOSAL TYPE
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    PROPOSAL ARCHETYPE *
                  </label>
                  <select
                    value={formData.proposalType}
                    onChange={(e) => setFormData({ ...formData, proposalType: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
                  >
                    <option value="Custom Sync & Master License">Synchronization &amp; Master License (Custom Proposal)</option>
                    <option value="Producer Collaboration">Producer &amp; Writer Collaboration</option>
                    <option value="Bespoke Sound Design / Score">Bespoke Sound Design / Custom Score</option>
                    <option value="Exclusive Archive Acquisition">Exclusive Acquisition Negotiation</option>
                    <option value="Brand Campaign Partnership">Brand Campaign / Commercial Integration</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    TARGET FRAGMENT / TIME CAPSULE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 PM (FRAGMENT 10:00 PM) or Full Catalog"
                    value={formData.targetFragment}
                    onChange={(e) => setFormData({ ...formData, targetFragment: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3.5 py-2.5 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: MEDIA SPECIFICATIONS & SCOPE */}
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Sliders size={15} className="text-white" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  03. MEDIA SCOPE, TERRITORY &amp; BUDGET
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    PRIMARY MEDIA TYPE
                  </label>
                  <select
                    value={formData.mediaType}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
                  >
                    <option value="Film / Feature Production">Feature Film / Independent Cinema</option>
                    <option value="Television / Series Broadcast">Television Series / Documentary</option>
                    <option value="Video Game / Interactive Soundtrack">Video Game / Interactive Media</option>
                    <option value="Commercial Advertising / Brand Campaign">Commercial Advertising / Global Campaign</option>
                    <option value="Major Label Commercial Music Release">Major Label / Commercial Music Release</option>
                    <option value="Immersive Audio / Museum Exhibition">Immersive Exhibition / Installation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    LICENSING TERRITORY
                  </label>
                  <select
                    value={formData.territory}
                    onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
                  >
                    <option value="Worldwide">Worldwide (All Territories)</option>
                    <option value="North America (US & Canada)">North America (US &amp; Canada)</option>
                    <option value="Europe / UK">Europe &amp; United Kingdom</option>
                    <option value="Asia-Pacific">Asia-Pacific Region</option>
                    <option value="Custom Territory Schedule">Custom Territory Schedule</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    TERM / DURATION
                  </label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
                  >
                    <option value="Perpetual (In Perpetuity)">Perpetual (In Perpetuity)</option>
                    <option value="5 Years">5 Years</option>
                    <option value="2 Years">2 Years</option>
                    <option value="1 Year Campaign">1 Year Campaign</option>
                    <option value="Festival Rights Only">Festival Run Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    BUDGET / ALLOCATION RANGE
                  </label>
                  <select
                    value={formData.budgetRange}
                    onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
                  >
                    <option value="$1,000 – $5,000 USD">$1,000 – $5,000 USD (Standard Commercial / Indie Sync)</option>
                    <option value="$5,000 – $15,000 USD">$5,000 – $15,000 USD (Theatrical / Broad TV / AAA Game)</option>
                    <option value="$15,000+ USD">$15,000+ USD (Major Brand Global Campaign)</option>
                    <option value="Co-Publishing & Backend Share (No Upfront)">Co-Publishing &amp; Backend Share (Collaboration Tier)</option>
                    <option value="Quote Upon Review">Quote Upon Review</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 4: PROJECT NARRATIVE & SPECIFICATIONS */}
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <FileText size={15} className="text-white" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  04. PROJECT BRIEF &amp; COLLABORATION DETAILS
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    PROJECT WORKING TITLE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chronos Feature Film / Nightfall Commercial"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3.5 py-2.5 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block">
                    COLLABORATION SCOPE &amp; SCENE / USE DESCRIPTION *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe how the recovered audio fragment will be incorporated, scene cues, distribution channels, release timeline, and any custom stem requirements..."
                    value={formData.projectOverview}
                    onChange={(e) => setFormData({ ...formData, projectOverview: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded px-3.5 py-2.5 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors resize-none leading-relaxed font-mono"
                  />
                </div>

                {/* Checkbox Options */}
                <div className="pt-2 border-t border-zinc-900 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-[11px] text-zinc-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.stemsRequired}
                      onChange={(e) => setFormData({ ...formData, stemsRequired: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-800 bg-black accent-white"
                    />
                    <span>Require individual multitrack stems (Drums, Bass, Synths, FX, Atmospheres)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-[11px] text-zinc-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.customSoundDesign}
                      onChange={(e) => setFormData({ ...formData, customSoundDesign: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-800 bg-black accent-white"
                    />
                    <span>Request custom harmonic rearrangement or tailored sound design from LOMON</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ACTION SUBMIT BUTTON */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-[10px] text-zinc-500 font-mono">
                BY SUBMITTING, YOU AGREE TO CONFIDENTIAL ARCHIVE REVIEW TERMS • LOMON LLC
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReturn}
                  className="w-1/3 sm:w-auto border border-zinc-800 hover:bg-zinc-900 text-zinc-400 px-4 py-3 rounded-sm uppercase font-bold text-[11px] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 sm:w-auto bg-white hover:bg-zinc-200 text-black font-bold px-6 py-3 rounded-sm uppercase tracking-wider text-[11px] cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>DISPATCHING PROPOSAL...</span>
                  ) : (
                    <>
                      <span>TRANSMIT PROPOSAL</span>
                      <Send size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Directory & Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-zinc-900">
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1.5">
            <span className="text-[11px] font-bold text-white uppercase block">
              CLEARANCE DOCUMENTATION GUIDE
            </span>
            <p className="text-[11.5px] text-zinc-400 leading-relaxed font-sans">
              Learn how master recordings, metadata cue sheets, and digital clearance certificates are authenticated.
            </p>
            {onOpenClearanceGuide && (
              <button
                type="button"
                onClick={onOpenClearanceGuide}
                className="text-[10px] text-zinc-300 hover:text-white hover:underline uppercase pt-1 font-bold block"
              >
                OPEN CLEARANCE GUIDE →
              </button>
            )}
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-sm space-y-1.5">
            <span className="text-[11px] font-bold text-white uppercase block">
              PUBLIC LICENSING SCHEDULE
            </span>
            <p className="text-[11.5px] text-zinc-400 leading-relaxed font-sans">
              Review standard tiered pricing, publishing splits, and distribution limits for catalog fragments.
            </p>
            {onOpenLicensingSchedule && (
              <button
                type="button"
                onClick={onOpenLicensingSchedule}
                className="text-[10px] text-zinc-300 hover:text-white hover:underline uppercase pt-1 font-bold block"
              >
                VIEW LICENSING SCHEDULE →
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-900/80 pt-6 text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-left">
          <span>LOMON LLC • ATLANTA, GEORGIA</span>
          <span>© 2026 LOMON LLC • ALL RIGHTS RESERVED</span>
        </div>

        <DocumentScrollControls />
      </div>
    </div>
  );
}
