import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, Download, ShieldCheck } from "lucide-react";
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

  // Format deliverable assets as 01., 02., etc.
  const formattedDeliverables = data.deliverableAssets.map((asset, i) => {
    if (/^\d{2}\./.test(asset)) {
      return asset.toUpperCase();
    }
    const num = String(i + 1).padStart(2, "0");
    return `${num}. ${asset.toUpperCase()}`;
  });

  const rawMetadataText = `${data.catalogNo}

[ SONIC IDENTIFIER ]
TITLE                : ${data.title}
CATALOG NO.          : ${data.catalogNo}
TIME OF MARK         : ${data.timeOfMark}
RECOVERY STAMP       : ${data.recoveryStamp}
COMPLETION STAMP     : ${data.completionStamp}

[ RIGHTS & CONTROL ]
MASTER CONTROL       : ${data.masterControl}
PUBLISHING CONTROL   : ${data.publishingControl}
ORIGIN               : ${data.origin}
THIRD-PARTY ASSETS   : ${data.thirdPartyAssets}
CLEARANCE STATUS     : ${data.clearanceStatus}

[ DELIVERABLE ASSETS ]
${formattedDeliverables.join("\n")}

[ ARCHIVAL METADATA ]
RECOVERY STATUS      : ${data.recoveryStatus}
ARCHIVIST            : ${data.archivist}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMetadataText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([rawMetadataText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `ARCHIVE_LOG_ENTRY_${data.entryNo}_METADATA.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-[#0a0a0a] border border-zinc-800/90 rounded-2xl sm:rounded-3xl text-[#D9D6CA] p-5 sm:p-7 flex flex-col shadow-2xl overflow-hidden max-h-[92vh] font-mono"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-full transition-colors cursor-pointer"
            title="Close overlay (Esc)"
          >
            <X size={18} />
          </button>

          {/* Scrollable Receipt-Like Card Content */}
          <div className="space-y-4 overflow-y-auto pr-1 relative z-10 custom-scrollbar text-[11px] sm:text-[13px] leading-relaxed tracking-wider select-text">
            
            {/* Header Title */}
            <div className="space-y-1">
              <div className="text-zinc-200 uppercase tracking-widest font-bold">
                {data.catalogNo}
              </div>
            </div>

            {/* [ SONIC IDENTIFIER ] */}
            <div className="space-y-1.5">
              <div className="text-zinc-100 uppercase tracking-widest font-bold">
                [ SONIC IDENTIFIER ]
              </div>
              <div className="space-y-1 pl-0.5">
                <DataRow label="TITLE" value={data.title} />
                <DataRow label="CATALOG NO." value={data.catalogNo} />
                <DataRow label="TIME OF MARK" value={data.timeOfMark} />
                <DataRow label="RECOVERY STAMP" value={data.recoveryStamp} />
                <DataRow label="COMPLETION STAMP" value={data.completionStamp} />
              </div>
            </div>

            {/* [ RIGHTS & CONTROL ] */}
            <div className="space-y-1.5 pt-1">
              <div className="text-zinc-100 uppercase tracking-widest font-bold">
                [ RIGHTS & CONTROL ]
              </div>
              <div className="space-y-1 pl-0.5">
                <DataRow label="MASTER CONTROL" value={data.masterControl} />
                <DataRow label="PUBLISHING CONTROL" value={data.publishingControl} />
                <DataRow label="ORIGIN" value={data.origin} />
                <DataRow label="THIRD-PARTY ASSETS" value={data.thirdPartyAssets} />
                <DataRow label="CLEARANCE STATUS" value={data.clearanceStatus} />
              </div>
            </div>

            {/* [ DELIVERABLE ASSETS ] */}
            <div className="space-y-1.5 pt-1">
              <div className="text-zinc-100 uppercase tracking-widest font-bold">
                [ DELIVERABLE ASSETS ]
              </div>
              <div className="space-y-1 pl-0.5">
                {formattedDeliverables.map((item, idx) => (
                  <div key={idx} className="text-zinc-300 uppercase tracking-wider text-[10.5px] sm:text-[12px]">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* [ ARCHIVAL METADATA ] */}
            <div className="space-y-1.5 pt-1">
              <div className="text-zinc-100 uppercase tracking-widest font-bold">
                [ ARCHIVAL METADATA ]
              </div>
              <div className="space-y-1 pl-0.5">
                <DataRow label="RECOVERY STATUS" value={data.recoveryStatus} />
                <DataRow label="ARCHIVIST" value={data.archivist} />
              </div>
            </div>

          </div>

          {/* Footer Action Bar */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] sm:text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700/60"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400 font-bold">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-zinc-400" />
                    <span>COPY LOG</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] sm:text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700/60"
              >
                <Download size={13} className="text-zinc-400" />
                <span>DOWNLOAD .TXT</span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-zinc-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>VERIFIED</span>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start text-[11px] sm:text-[13px] tracking-wider leading-relaxed font-mono">
      <span className="inline-block w-[175px] sm:w-[210px] shrink-0 text-zinc-300 uppercase select-none">{label}</span>
      <span className="text-[#D9D6CA] font-medium uppercase break-all sm:break-normal">: {value}</span>
    </div>
  );
}
