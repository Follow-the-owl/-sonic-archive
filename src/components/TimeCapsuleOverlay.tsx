import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, Download, ShieldCheck, Music, Disc, Shield, Clock, Calendar, Hash, FileCheck, Sparkles } from "lucide-react";
import { TimeCapsuleData } from "../data";

interface TimeCapsuleOverlayProps {
  data: TimeCapsuleData;
  onClose: () => void;
}

export default function TimeCapsuleOverlay({ data, onClose }: TimeCapsuleOverlayProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const cleanMetadataText = `TIME CAPSULE ENTRY ${data.entryNo} - THE OWL CLOCK ARCHIVES
Title: ${data.title}
Catalog No: ${data.catalogNo}
Time of Mark: ${data.timeOfMark}
Recovery Stamp: ${data.recoveryStamp}
Completion Stamp: ${data.completionStamp}

SONIC PARAMETERS
Tonal Axis: ${data.tonalAxis}
Tempo / Pulse: ${data.tempoPulse}
Runtime: ${data.runtime}

RIGHTS & CONTROL
Master Control: ${data.masterControl}
Publishing Control: ${data.publishingControl}
Origin: ${data.origin}
Third-Party Assets: ${data.thirdPartyAssets}
Clearance Status: ${data.clearanceStatus}

DELIVERABLE ASSETS
${data.deliverableAssets.map(asset => `- ${asset}`).join("\n")}

ARCHIVAL METADATA
Recovery Status: ${data.recoveryStatus}
Archivist: ${data.archivist}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanMetadataText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([cleanMetadataText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `TIME_CAPSULE_ENTRY_${data.entryNo}_METADATA.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto poppins-font"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[#0d0d0d] border border-zinc-800/80 rounded-2xl text-[#D9D6CA] p-5 sm:p-8 flex flex-col shadow-2xl overflow-hidden poppins-font max-h-[90vh]"
        >
          {/* Glowing subtle ambient backlight */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-sm sm:text-base font-bold tracking-wider text-white uppercase font-mono">
                    CATALOG: {data.catalogNo}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    {data.recoveryStatus || "FULLY RECOVERED"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
              title="Close overlay (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content - Website Ready Cards */}
          <div className="space-y-4 overflow-y-auto pr-1 relative z-10 custom-scrollbar max-h-[62vh]">
            
            {/* Section 1: Sonic Identifier */}
            <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <Disc size={15} />
                <span>Sonic Identifier</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium block mb-1">Title</span>
                  <span className="text-sm font-bold text-white">{data.title}</span>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium block mb-1">Catalog No.</span>
                  <span className="text-xs font-semibold text-zinc-200">{data.catalogNo}</span>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium block mb-1">Time of Mark</span>
                  <span className="text-xs font-semibold text-zinc-200">{data.timeOfMark}</span>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium block mb-1">Recovery Stamp</span>
                  <span className="text-xs font-semibold text-zinc-300">{data.recoveryStamp}</span>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium block mb-1">Completion Stamp</span>
                  <span className="text-xs font-semibold text-zinc-300">{data.completionStamp}</span>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium block mb-1">Archivist</span>
                  <span className="text-xs font-bold text-emerald-400">{data.archivist}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Sonic Parameters */}
            <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Music size={15} />
                <span>Sonic Parameters</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium block mb-1">Tonal Axis</span>
                  <span className="text-xs font-bold text-white">{data.tonalAxis}</span>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium block mb-1">Tempo / Pulse</span>
                  <span className="text-xs font-bold text-white">{data.tempoPulse}</span>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium block mb-1">Runtime</span>
                  <span className="text-xs font-bold text-white">{data.runtime}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Rights & Clearance */}
            <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                  <Shield size={15} />
                  <span>Rights &amp; Control</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-md uppercase">
                  {data.clearanceStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40 flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Master Control</span>
                  <span className="text-xs font-semibold text-white">{data.masterControl}</span>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40 flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Publishing Control</span>
                  <span className="text-xs font-semibold text-white">{data.publishingControl}</span>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40 flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Composition Origin</span>
                  <span className="text-xs font-semibold text-white">{data.origin}</span>
                </div>

                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/40 flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Third-Party Assets</span>
                  <span className="text-xs font-semibold text-emerald-400">{data.thirdPartyAssets}</span>
                </div>
              </div>
            </div>

            {/* Section 4: Deliverable Assets Suite */}
            <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                <FileCheck size={15} />
                <span>Deliverable Master Assets</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {data.deliverableAssets.map((asset, idx) => (
                  <div key={idx} className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/50 flex items-center gap-2.5 text-xs text-zinc-200">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                      ✓
                    </div>
                    <span className="font-medium text-[11px] sm:text-xs">{asset}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-zinc-700/60 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="text-zinc-400" />
                    <span>Copy Metadata Text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-zinc-700/60 shadow-sm"
              >
                <Download size={14} className="text-zinc-400" />
                <span>Download .TXT</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span>100% Cleared • LOMON LLC Registered</span>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
