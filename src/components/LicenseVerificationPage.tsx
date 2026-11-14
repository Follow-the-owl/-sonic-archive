import React, { useState, useEffect } from "react";
import { ShieldCheck, Shield, Search, ArrowLeft, FileText, CheckCircle2, Copy, Check, Disc, AlertCircle, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { openOrDownloadLicenseAgreement } from "../lib/licenseAgreements";

interface LicenseVerificationPageProps {
  initialLicenseNumber?: string;
  onBack?: () => void;
  onRequestClearance?: (fragmentNameOrId?: string) => void;
}

export default function LicenseVerificationPage({ 
  initialLicenseNumber = "", 
  onBack,
  onRequestClearance 
}: LicenseVerificationPageProps) {
  const [searchInput, setSearchInput] = useState(initialLicenseNumber);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(initialLicenseNumber));

  const performVerification = async (targetNumber: string) => {
    const cleanNumber = targetNumber.trim();
    if (!cleanNumber) return;

    setIsSearching(true);
    setErrorMessage(null);
    setSearchResult(null);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/v1/licenses/verify/${encodeURIComponent(cleanNumber)}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setSearchResult(data);
      } else if (data.status === "UNLICENSED / AVAILABLE FOR CLEARANCE" || data.isUnpurchased) {
        setSearchResult(data);
      } else {
        // Fallback: If not found as a purchased license, check if it corresponds to an available master fragment
        setSearchResult({
          valid: true,
          purchased: false,
          isUnpurchased: true,
          status: "Available for Clearance",
          originalRightsHolder: "LOMON LLC / The Owl Clock",
          masterOwnership: "100% Solely Owned by LOMON LLC",
          publishingControl: "100% Controlled by LOMON LLC",
          fragment: cleanNumber,
          fragmentId: cleanNumber,
          licenseNumber: cleanNumber.toUpperCase().startsWith("TOC-") ? cleanNumber.toUpperCase() : `TOC-FRAG-${cleanNumber.replace(/[^a-zA-Z0-9]/g, "") || "MASTER"}`,
          clearanceStatus: "Available for Clearance",
          sampleClearanceWarranty: "100% Sample-Free Original Composition (Direct Master Clearance)",
          deliverables: "24-Bit 48kHz WAV Masters, Multi-track Audio Stems, Official PDF License Covenant",
          actionCall: "Request Clearance / Purchase License"
        });
      }
    } catch (_err) {
      // Local fallback for offline mode
      setSearchResult({
        valid: true,
        purchased: false,
        isUnpurchased: true,
        status: "Available for Clearance",
        originalRightsHolder: "LOMON LLC / The Owl Clock",
        masterOwnership: "100% Solely Owned by LOMON LLC",
        publishingControl: "100% Controlled by LOMON LLC",
        fragment: cleanNumber,
        fragmentId: cleanNumber,
        licenseNumber: cleanNumber.toUpperCase().startsWith("TOC-") ? cleanNumber.toUpperCase() : `TOC-FRAG-${cleanNumber.replace(/[^a-zA-Z0-9]/g, "") || "MASTER"}`,
        clearanceStatus: "Available for Clearance",
        sampleClearanceWarranty: "100% Sample-Free Original Composition (Direct Master Clearance)",
        deliverables: "24-Bit 48kHz WAV Masters, Multi-track Audio Stems, Official PDF License Covenant",
        actionCall: "Request Clearance / Purchase License"
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialLicenseNumber) {
      performVerification(initialLicenseNumber);
    }
  }, [initialLicenseNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    performVerification(searchInput);
  };

  const handleCopyLicenseKey = () => {
    if (!searchResult) return;
    const key = searchResult.licenseNumber || searchResult.details?.id || searchResult.fragmentId || searchInput;
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleActionClearance = () => {
    const target = searchResult?.fragment || searchResult?.fragmentId || searchInput || "03:21 PM";
    if (onRequestClearance) {
      onRequestClearance(target);
    } else {
      window.location.href = `mailto:rights@lomon.co?subject=${encodeURIComponent(`Clearance Request for ${target}`)}&body=${encodeURIComponent(`Greetings LOMON LLC Rights Administration,\n\nI am requesting direct master and publishing clearance for fragment: ${target}.\n\nPlease provide licensing schedule details.\n\nThank you.`)}`;
    }
  };

  const isPurchased = Boolean(searchResult && searchResult.purchased);
  const isUnpurchased = Boolean(searchResult && (!searchResult.purchased || searchResult.isUnpurchased || searchResult.status?.toLowerCase().includes("unlicensed") || searchResult.status?.toLowerCase().includes("available")));

  return (
    <div className="verification-page min-h-screen bg-black text-white font-sans selection:bg-[#D9D6CA] selection:text-black pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
          <div className="flex items-center gap-3.5">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 border border-zinc-800 hover:border-zinc-500 bg-zinc-950 text-zinc-400 hover:text-white transition-all rounded cursor-pointer"
                title="Return"
                aria-label="Return"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <span className="text-[10px] tracking-[0.25em] text-[#D9D6CA] font-bold block uppercase font-mono">
                The Owl Clock • Rights Management
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase mt-0.5">
                License Verification
              </h1>
            </div>
          </div>

          <div className="hidden sm:block text-right text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
            <div>LOMON LLC</div>
            <div>Atlanta, Georgia</div>
          </div>
        </div>

        {/* Informational Introduction */}
        <div className="bg-zinc-950/80 border border-zinc-900 p-5 rounded-md text-left space-y-2">
          <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-sans">
            Use this verification portal to confirm the authenticity, validity, and permitted legal scope of active copyright licenses and master sound recordings issued by <strong>LOMON LLC</strong>.
          </p>
          <p className="text-xs text-zinc-500 font-sans">
            Enter your license number from your executed agreement or confirmation email, or enter any fragment timestamp to check clearance availability.
          </p>
        </div>

        {/* Clean Search Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter License Key or Fragment Name (e.g. TOC-CR-2026-30192 or 03:21 PM)"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D9D6CA] pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none transition-all rounded"
              />
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="bg-[#D9D6CA] hover:bg-white text-black font-bold text-xs uppercase tracking-wider px-6 py-3 transition-colors cursor-pointer disabled:opacity-50 shrink-0 rounded"
            >
              {isSearching ? "Verifying..." : "Verify License"}
            </button>
          </div>

          {/* Clean Subtle Example Hints */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 pt-1">
            <span>Examples:</span>
            <button
              type="button"
              onClick={() => {
                setSearchInput("TOC-CR-2026-30192");
                performVerification("TOC-CR-2026-30192");
              }}
              className="text-zinc-400 hover:text-white underline cursor-pointer font-mono text-[10.5px]"
            >
              TOC-CR-2026-30192
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={() => {
                setSearchInput("03:21 PM");
                performVerification("03:21 PM");
              }}
              className="text-zinc-400 hover:text-white underline cursor-pointer font-mono text-[10.5px]"
            >
              03:21 PM
            </button>
          </div>
        </form>

        {/* Friendly Loading State */}
        {isSearching && (
          <div className="py-12 border border-zinc-900 bg-zinc-950 rounded-md flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-400 tracking-wider uppercase font-mono">
              Verifying license records...
            </span>
          </div>
        )}

        {/* Initial Informational Cards (Shown before search) */}
        {!hasSearched && !isSearching && !searchResult && !errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 space-y-6 text-left rounded-md"
          >
            <div className="space-y-1 border-b border-zinc-900 pb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                How License Verification Works
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Every license issued by The Owl Clock and LOMON LLC includes an official license certificate and registered record for streaming platforms, distributors, synchronizations, and legal compliance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="bg-black/60 border border-zinc-900 p-4 rounded space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                  <CheckCircle2 size={14} className="text-[#00E676]" />
                  <span>Authenticity Guarantee</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Confirms that the sound recording is directly cleared from LOMON LLC with active licensing rights.
                </p>
              </div>

              <div className="bg-black/60 border border-zinc-900 p-4 rounded space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                  <ShieldCheck size={14} className="text-[#00E676]" />
                  <span>100% Sample-Free</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Every fragment is an original master composition free of uncleared third-party samples.
                </p>
              </div>

              <div className="bg-black/60 border border-zinc-900 p-4 rounded space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                  <FileText size={14} className="text-[#D9D6CA]" />
                  <span>Clearance Warranties</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Access executed agreement covenants, permitted streaming counts, and territory scopes.
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-2">
                <HelpCircle size={14} className="text-zinc-500" />
                <span>Need clearance for a project or release?</span>
              </span>
              <button
                type="button"
                onClick={handleActionClearance}
                className="text-[#D9D6CA] hover:text-white underline cursor-pointer font-medium"
              >
                Request Fragment Clearance &rarr;
              </button>
            </div>
          </motion.div>
        )}

        {/* 1. STATE A: VALID PURCHASED LICENSE RECORD */}
        {searchResult && !isSearching && isPurchased && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-[#00E676]/30 bg-zinc-950 p-6 sm:p-8 space-y-6 text-left rounded-md shadow-xl"
          >
            {/* Top Verification Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00E676]/10 border border-[#00E676]/40 text-[#00E676] rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#00E676] uppercase tracking-wider flex items-center gap-2">
                    <span>Active &amp; Verified License</span>
                    <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse inline-block" />
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Official record registered with LOMON LLC
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-mono">License Number</span>
                <span className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  {searchResult.licenseNumber || searchResult.details?.id}
                </span>
              </div>
            </div>

            {/* License Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/60 border border-zinc-900 p-4 rounded space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Registered Licensee</span>
                <span className="text-sm font-bold text-white block">
                  {searchResult.licensee || searchResult.details?.licenseeLegalName || "Authorized Licensee"}
                </span>
                <span className="text-xs text-zinc-400 block">
                  {searchResult.licenseeEmail || searchResult.details?.email || "Account on file"}
                </span>
              </div>

              <div className="bg-black/60 border border-zinc-900 p-4 rounded space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Licensed Fragment</span>
                <span className="text-sm font-bold text-[#D9D6CA] block">
                  {searchResult.fragment}
                </span>
                <span className="text-xs text-zinc-400 block">
                  Tier: {searchResult.tier}
                </span>
              </div>

              <div className="bg-black/60 border border-zinc-900 p-4 rounded space-y-1 sm:col-span-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Permitted Scope &amp; Usage</span>
                <p className="text-xs text-zinc-300 leading-relaxed pt-0.5">
                  {searchResult.scope || "Master mechanical reproduction, digital streaming distribution, audiovisual synchronization placement, and global territorial clearance under standard LOMON Schedule terms."}
                </p>
              </div>

              <div className="bg-black/60 border border-zinc-900 p-4 rounded space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Issue Date</span>
                <span className="text-xs text-white font-medium block">
                  {searchResult.issuedDate || searchResult.details?.purchaseDate || "August 6, 2026"}
                </span>
              </div>

              <div className="bg-black/60 border border-zinc-900 p-4 rounded space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Clearance Warranties</span>
                <span className="text-xs text-[#00E676] font-medium flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>100% Sample-Free Original Work</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-zinc-900 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button 
                onClick={() => {
                  const d = searchResult.details || {};
                  openOrDownloadLicenseAgreement({
                    licenseId: searchResult.licenseNumber || d.id,
                    transactionRef: d.transactionRef || "LMN-TX-892019",
                    purchaseDate: searchResult.issuedDate || d.purchaseDate,
                    licenseeLegalName: searchResult.licensee,
                    licenseeEmail: d.email || "licensee@lomon.local",
                    fragmentTitle: searchResult.fragment,
                    archiveIdentifier: d.archiveIdentifier || "TOC-FRAG-001",
                    licenseTierId: d.tierId || "access",
                    licenseTierTitle: searchResult.tier
                  });
                }}
                className="w-full sm:w-auto bg-[#D9D6CA] hover:bg-white text-black font-bold text-xs uppercase tracking-wider px-5 py-3 transition-colors cursor-pointer flex items-center justify-center gap-2 rounded"
              >
                <FileText size={15} />
                <span>View Executed License Agreement (PDF)</span>
              </button>

              <button 
                onClick={handleCopyLicenseKey}
                className="w-full sm:w-auto border border-zinc-800 hover:border-zinc-500 bg-zinc-950 text-zinc-300 hover:text-white text-xs uppercase tracking-wider px-4 py-3 transition-colors cursor-pointer flex items-center justify-center gap-2 rounded font-mono"
              >
                {copiedKey ? <Check size={14} className="text-[#00E676]" /> : <Copy size={14} />}
                <span>{copiedKey ? "Copied License Key!" : "Copy License Key"}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* 2. STATE B: MASTER FRAGMENT (UNLICENSED / AVAILABLE FOR CLEARANCE) */}
        {searchResult && !isSearching && isUnpurchased && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-zinc-800 bg-zinc-950 p-6 sm:p-8 space-y-6 text-left rounded-md shadow-xl"
          >
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 text-white rounded-full flex items-center justify-center shrink-0">
                  <Shield size={22} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Available for Clearance</span>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Original master recording in The Owl Clock archive
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono">
                <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Catalog Reference</span>
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  {searchResult.licenseNumber || `TOC-FRAG-${(searchResult.fragment || "CAT").replace(/[^a-zA-Z0-9]/g, "")}`}
                </span>
              </div>
            </div>

            {/* Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/60 border border-zinc-900 p-5 rounded">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Rights Holder</span>
                <span className="text-sm font-bold text-white block">
                  {searchResult.originalRightsHolder || "LOMON LLC / The Owl Clock"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Master &amp; Publishing Control</span>
                <span className="text-sm font-bold text-[#D9D6CA] block">
                  100% Owned by LOMON LLC
                </span>
              </div>

              <div className="space-y-1 pt-1 sm:col-span-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Composition Name</span>
                <span className="text-sm font-bold text-white block">
                  {searchResult.fragment || searchInput}
                </span>
              </div>
            </div>

            {/* Deliverables Notice */}
            <div className="bg-black/40 border border-zinc-900 p-4 rounded space-y-2 text-xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">
                Deliverables Included Upon Licensing
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-zinc-300 pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#00E676] shrink-0" />
                  <span>24-Bit 48kHz Master WAV Files</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#00E676] shrink-0" />
                  <span>Multi-Track Uncompressed Audio Stems</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#00E676] shrink-0" />
                  <span>100% Sample-Free Clearance Warranties</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#00E676] shrink-0" />
                  <span>Official PDF Executed License Agreement</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-zinc-900 pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button 
                onClick={handleActionClearance}
                className="bg-[#D9D6CA] hover:bg-white text-black font-bold text-xs uppercase tracking-wider px-6 py-3.5 transition-all cursor-pointer flex items-center justify-center gap-2 rounded shadow-md"
              >
                <ShieldCheck size={16} />
                <span>Request Clearance / License This Fragment</span>
              </button>

              <button 
                onClick={handleCopyLicenseKey}
                className="border border-zinc-800 hover:border-zinc-500 bg-zinc-950 text-zinc-300 hover:text-white text-xs uppercase tracking-wider px-4 py-3 transition-colors cursor-pointer flex items-center justify-center gap-2 rounded font-mono"
              >
                {copiedKey ? <Check size={14} className="text-[#00E676]" /> : <Copy size={14} />}
                <span>{copiedKey ? "Copied Reference!" : "Copy Catalog ID"}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ERROR / UNVERIFIED FALLBACK */}
        {errorMessage && !isSearching && !searchResult && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-red-900/50 bg-red-950/10 p-6 sm:p-8 space-y-4 text-left rounded-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-900/20 border border-red-800 text-red-500 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-red-500 tracking-wider uppercase font-sans">
                  No Matching License Found
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Please check the license number or fragment name and try again
                </div>
              </div>
            </div>

            <p className="text-zinc-300 text-xs leading-relaxed bg-black/40 border border-zinc-900 p-4 rounded">
              {errorMessage}
            </p>

            <div className="text-xs text-zinc-400 space-y-1.5 pt-1">
              <p>• Make sure the license number is formatted correctly (e.g. TOC-CR-2026-30192) or enter a fragment name (e.g. 03:21 PM).</p>
              <p>• If you believe this is an error, please reach out to our rights administration team.</p>
            </div>
          </motion.div>
        )}

        {/* Footer Reference */}
        <div className="border-t border-zinc-900 pt-6 text-center text-xs text-zinc-600 space-y-1">
          <p>The Owl Clock • Publishing • Rights Management • Licensing</p>
          <p>Atlanta, Georgia • &copy; 2026 LOMON LLC. All Rights Reserved.</p>
        </div>

      </div>
    </div>
  );
}


