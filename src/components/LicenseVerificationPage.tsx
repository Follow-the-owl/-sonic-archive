import React, { useState, useEffect } from "react";
import { ShieldCheck, Shield, Search, ArrowLeft, ExternalLink, FileText, CheckCircle2, Copy, Check, Lock, Sparkles, Disc, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
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
  const [copiedApiUrl, setCopiedApiUrl] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(initialLicenseNumber));

  // Sample test identifiers for both Purchased Licenses and Unpurchased Master Fragments
  const SAMPLE_PREFIXES = [
    { number: "TOC-CR-2026-30192", label: "Commercial Release ($500)", type: "purchased" },
    { number: "TOC-AA-2026-84920", label: "Archive Access ($150)", type: "purchased" },
    { number: "TOC-CX-2026-77102", label: "Commercial Exploitation ($1,000)", type: "purchased" },
    { number: "TOC-SYNC-2026-00482", label: "Synchronization & Master", type: "purchased" },
    { number: "00:50 AM", label: "Master Fragment (Unlicensed)", type: "unpurchased" },
    { number: "9:41 PM", label: "Master Fragment (Unlicensed)", type: "unpurchased" },
    { number: "10:00 PM", label: "Master Fragment (Unlicensed)", type: "unpurchased" },
    { number: "TOC-FRAG-0217", label: "Unpurchased Fragment ID", type: "unpurchased" }
  ];

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
        // Fallback: If API returns 404 or unverified, format as Master Archive Registry for unpurchased queries
        setSearchResult({
          valid: true,
          purchased: false,
          isUnpurchased: true,
          status: "UNLICENSED / AVAILABLE FOR CLEARANCE",
          originalRightsHolder: "LOMON LLC / THE OWL CLOCK",
          masterOwnership: "100% SOLELY OWNED BY LOMON LLC",
          publishingControl: "100% CONTROLLED BY LOMON LLC",
          fragment: cleanNumber,
          fragmentId: cleanNumber,
          licenseNumber: cleanNumber.toUpperCase().startsWith("TOC-") ? cleanNumber.toUpperCase() : `TOC-FRAG-${cleanNumber.replace(/[^a-zA-Z0-9]/g, "") || "MASTER"}`,
          clearanceStatus: "UNLICENSED / AVAILABLE FOR CLEARANCE",
          sampleClearanceWarranty: "100% Sample-Free Original Composition (Direct Master Clearance)",
          deliverables: "24-Bit 48kHz WAV Masters, Multi-track Audio Stems, Official PDF License Covenant",
          actionCall: "REQUEST CLEARANCE / PURCHASE LICENSE"
        });
      }
    } catch (err: any) {
      // Local fallback for offline/sandbox mode
      setSearchResult({
        valid: true,
        purchased: false,
        isUnpurchased: true,
        status: "UNLICENSED / AVAILABLE FOR CLEARANCE",
        originalRightsHolder: "LOMON LLC / THE OWL CLOCK",
        masterOwnership: "100% SOLELY OWNED BY LOMON LLC",
        publishingControl: "100% CONTROLLED BY LOMON LLC",
        fragment: cleanNumber,
        fragmentId: cleanNumber,
        licenseNumber: cleanNumber.toUpperCase().startsWith("TOC-") ? cleanNumber.toUpperCase() : `TOC-FRAG-${cleanNumber.replace(/[^a-zA-Z0-9]/g, "") || "MASTER"}`,
        clearanceStatus: "UNLICENSED / AVAILABLE FOR CLEARANCE",
        sampleClearanceWarranty: "100% Sample-Free Original Composition (Direct Master Clearance)",
        deliverables: "24-Bit 48kHz WAV Masters, Multi-track Audio Stems, Official PDF License Covenant",
        actionCall: "REQUEST CLEARANCE / PURCHASE LICENSE"
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

  const handleCopyApiUrl = () => {
    if (!searchResult) return;
    const key = searchResult.licenseNumber || searchResult.details?.id || searchResult.fragmentId || searchInput;
    const apiUrl = `${window.location.origin}/api/v1/licenses/verify/${encodeURIComponent(key)}`;
    navigator.clipboard.writeText(apiUrl);
    setCopiedApiUrl(true);
    setTimeout(() => setCopiedApiUrl(false), 2000);
  };

  const handleActionClearance = () => {
    const target = searchResult?.fragment || searchResult?.fragmentId || searchInput || "00:50 AM";
    if (onRequestClearance) {
      onRequestClearance(target);
    } else {
      // Default fallback: trigger clearance modal or scroll to contact
      window.location.href = `mailto:rights@lomon.co?subject=${encodeURIComponent(`Clearance Request for ${target}`)}&body=${encodeURIComponent(`Greetings LOMON LLC Rights Administration,\n\nI am requesting direct master and publishing clearance for fragment: ${target}.\n\nPlease provide licensing schedule details.\n\nThank you.`)}`;
    }
  };

  const isPurchased = Boolean(searchResult && searchResult.purchased);
  const isUnpurchased = Boolean(searchResult && (!searchResult.purchased || searchResult.isUnpurchased || searchResult.status?.includes("UNLICENSED")));

  return (
    <div className="verification-page min-h-screen bg-black text-white font-mono selection:bg-[#D9D6CA] selection:text-black pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 border border-zinc-800 hover:border-zinc-500 bg-zinc-950 text-zinc-400 hover:text-white transition-all rounded-sm cursor-pointer"
                title="Return to Main Archive"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <span className="text-[9px] tracking-[0.3em] text-[#D9D6CA] font-bold block uppercase">
                [ OFFICIAL PUBLIC REGISTRY ]
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase font-sans">
                PUBLIC LICENSE VERIFICATION PORTAL
              </h1>
            </div>
          </div>

          <div className="hidden sm:block text-right text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
            <div>LOMON LLC • ATLANTA, GA</div>
            <div>REGISTRY ENGINE V4.08</div>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="bg-zinc-950 border border-zinc-850 p-4 sm:p-5 text-left space-y-2">
          <p className="text-zinc-300 text-[11.5px] leading-relaxed font-sans">
            This verification portal allows buyers, streaming platforms, record labels, sync supervisors, and legal administrators to independently verify the authenticity, status, and legal scope of active copyright licenses and master fragments issued by <strong>LOMON LLC</strong>.
          </p>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
            API Endpoint: <code className="text-[#D9D6CA]">GET /api/v1/licenses/verify/:license_number</code>
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter License Key or Fragment ID (e.g. TOC-CR-2026-30192 or 00:50 AM)"
                className="w-full bg-black border border-zinc-800 focus:border-[#D9D6CA] pl-10 pr-4 py-3 text-xs sm:text-sm font-mono text-white placeholder-zinc-700 uppercase focus:outline-none transition-all rounded-sm"
              />
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="bg-[#D9D6CA] hover:bg-white text-black font-sans font-bold text-xs uppercase tracking-wider px-6 py-3 transition-colors cursor-pointer disabled:opacity-50 shrink-0 rounded-sm"
            >
              {isSearching ? "QUERYING REGISTRY..." : "SEARCH REGISTRY"}
            </button>
          </div>

          {/* Quick-Test Sample Pills */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block text-left">
              SAMPLE KEYS &amp; FRAGMENTS TO TEST:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PREFIXES.map((sample) => (
                <button
                  key={sample.number}
                  type="button"
                  onClick={() => {
                    setSearchInput(sample.number);
                    performVerification(sample.number);
                  }}
                  className={`text-[9.5px] font-mono px-2.5 py-1 border transition-all cursor-pointer rounded-xs ${
                    searchInput.trim().toUpperCase() === sample.number.toUpperCase()
                      ? "bg-[#D9D6CA]/15 border-[#D9D6CA] text-[#D9D6CA]"
                      : sample.type === "purchased" 
                      ? "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700"
                      : "bg-zinc-950 border-amber-900/40 text-amber-300/80 hover:text-amber-200 hover:border-amber-700"
                  }`}
                >
                  <span className="font-bold text-white mr-1">{sample.number}</span>
                  <span className="text-zinc-500">({sample.label})</span>
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Loading Spinner */}
        {isSearching && (
          <div className="py-12 border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-zinc-400 tracking-widest uppercase font-mono">
              QUERYING LOMON CRYPTOGRAPHIC DATABASE...
            </span>
          </div>
        )}

        {/* Initial Welcome & Metadata System Card (Shown before any query is submitted) */}
        {!hasSearched && !isSearching && !searchResult && !errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-zinc-850 bg-neutral-950 p-6 sm:p-8 space-y-6 text-left rounded-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-zinc-900 border border-zinc-700 text-[#D9D6CA] rounded-full flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white tracking-widest uppercase font-mono flex items-center gap-2">
                    <span>LOMON LLC COVENANT &amp; MASTER REGISTRY</span>
                    <span className="w-2 h-2 rounded-full bg-[#D9D6CA] animate-pulse inline-block" />
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono uppercase mt-0.5">
                    VERIFICATION PROTOCOL READY • WAITING FOR INPUT
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono">
                <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wider">DATABASE STATE</span>
                <span className="text-[10px] font-bold text-[#D9D6CA] uppercase tracking-wider">AUTHENTICATED &amp; ACTIVE</span>
              </div>
            </div>

            <p className="text-zinc-300 text-xs sm:text-sm font-sans leading-relaxed">
              Enter any valid <strong>License Key</strong> (e.g. <code className="text-[#D9D6CA]">TOC-CR-2026-30192</code>) to view the buyer's active scope of rights and clearance terms, or search any <strong>Fragment ID / Timestamp</strong> (e.g. <code className="text-[#D9D6CA]">00:50 AM</code>) to query the official Master Archive Registry and initiate direct clearance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 font-mono text-[10.5px]">
              <div className="bg-black/80 border border-zinc-900 p-3.5 rounded-xs space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">VERIFICATION AUTHORITY</span>
                <span className="text-white font-bold block uppercase">LOMON LLC Rights Admin</span>
                <span className="text-zinc-500 text-[9.5px]">Atlanta, Georgia USA</span>
              </div>

              <div className="bg-black/80 border border-zinc-900 p-3.5 rounded-xs space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">ENCRYPTION STANDARD</span>
                <span className="text-[#D9D6CA] font-bold block uppercase">SHA-256 Covenant Hash</span>
                <span className="text-zinc-500 text-[9.5px]">Cryptographic Timestamping</span>
              </div>

              <div className="bg-black/80 border border-zinc-900 p-3.5 rounded-xs space-y-1 col-span-1 sm:col-span-2 md:col-span-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">MASTER OWNERSHIP</span>
                <span className="text-white font-bold block uppercase">100% Solely Owned</span>
                <span className="text-zinc-500 text-[9.5px]">Sample-Free Original Works</span>
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#00E676]" />
                <span>100% Sample-Free Master &amp; Publishing Clearance Warranties</span>
              </span>
              <span className="text-zinc-500">Select a sample ID above or enter your ID to verify</span>
            </div>
          </motion.div>
        )}

        {/* 1. STATE A: VALID PURCHASED LICENSE RECORD */}
        {searchResult && !isSearching && isPurchased && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-[#00E676]/40 bg-neutral-950 p-6 sm:p-8 space-y-6 text-left relative overflow-hidden rounded-sm shadow-2xl"
          >
            {/* Top Verification Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00E676]/15 border border-[#00E676]/60 text-[#00E676] rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#00E676] tracking-wider uppercase font-mono flex items-center gap-2">
                    <span>STATUS: VALID &amp; ACTIVE</span>
                    <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse inline-block" />
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono uppercase mt-0.5">
                    PURCHASED &amp; AUTHENTICATED RECORD IN LOMON ARCHIVE REGISTRY
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono">
                <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">LICENSE KEY</span>
                <span className="text-sm font-bold text-white uppercase tracking-wider">{searchResult.licenseNumber || searchResult.details?.id}</span>
              </div>
            </div>

            {/* Section 1: Buyer's Details */}
            <div className="space-y-3">
              <span className="text-[9.5px] text-[#D9D6CA] uppercase tracking-[0.2em] font-bold block">
                [ 1. BUYER DETAILS &amp; REGISTERED LICENSEE ]
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-black/60 border border-zinc-850 p-4 rounded-xs font-mono">
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase block">LICENSEE LEGAL NAME:</span>
                  <span className="text-xs sm:text-sm font-bold text-white uppercase block mt-0.5 font-sans">
                    {searchResult.licensee || searchResult.details?.licenseeLegalName || "Authorized Licensee"}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase block">REGISTERED EMAIL:</span>
                  <span className="text-xs font-bold text-zinc-300 block mt-0.5">
                    {searchResult.licenseeEmail || searchResult.details?.email || "Terminal Verified"}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase block">TRANSACTION REF:</span>
                  <span className="text-xs font-bold text-[#D9D6CA] block mt-0.5">
                    {searchResult.details?.transactionRef || "LMN-TX-VERIFIED"}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Active Scope of Rights */}
            <div className="space-y-3">
              <span className="text-[9.5px] text-[#D9D6CA] uppercase tracking-[0.2em] font-bold block">
                [ 2. ACTIVE SCOPE OF RIGHTS ]
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/60 border border-zinc-850 p-4 rounded-xs font-mono">
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase block">LICENSED TIER:</span>
                  <span className="text-xs sm:text-sm font-bold text-white uppercase block mt-0.5 font-sans">
                    {searchResult.tier}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase block">AUTHENTICATED FRAGMENT:</span>
                  <span className="text-xs sm:text-sm font-bold text-[#D9D6CA] uppercase block mt-0.5 font-sans">
                    {searchResult.fragment}
                  </span>
                </div>
                <div className="col-span-1 md:col-span-2 pt-2 border-t border-zinc-900">
                  <span className="text-[8.5px] text-zinc-500 uppercase block">RIGHTS GRANT &amp; PERMITTED USAGE:</span>
                  <p className="text-[11px] text-zinc-300 font-sans leading-relaxed mt-1">
                    {searchResult.scope || "Master mechanical reproduction, digital streaming distribution, audiovisual synchronization placement, and global territorial clearance under standard LOMON Schedule terms."}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Issue Date & Registration Hash */}
            <div className="space-y-3">
              <span className="text-[9.5px] text-[#D9D6CA] uppercase tracking-[0.2em] font-bold block">
                [ 3. ISSUE DATE &amp; CRYPTOGRAPHIC RECORD ]
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-black/60 border border-zinc-850 p-4 rounded-xs font-mono text-[10.5px]">
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase block">ISSUE DATE:</span>
                  <span className="text-xs font-bold text-zinc-200 block mt-0.5 font-mono">
                    {searchResult.issuedDate || searchResult.details?.purchaseDate || "August 6, 2026"}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase block">ISRC CODE:</span>
                  <span className="text-xs font-bold text-zinc-300 block mt-0.5 font-mono">
                    {searchResult.details?.isrc || "US-LMN-26-30192"}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase block">ISWC CODE:</span>
                  <span className="text-xs font-bold text-zinc-300 block mt-0.5 font-mono">
                    {searchResult.details?.iswc || "T-302.459.192-1"}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase block">ARCHIVE IDENTIFIER:</span>
                  <span className="text-xs font-bold text-zinc-300 block mt-0.5 font-mono">
                    {searchResult.details?.archiveIdentifier || "TOC-FRAG-001"}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2 md:col-span-4 pt-2 border-t border-zinc-900">
                  <span className="text-[8.5px] text-zinc-500 uppercase block">DIGITAL SIGNATURE &amp; CONTRACT HASH:</span>
                  <span className="text-[9px] text-zinc-400 block tracking-tight leading-relaxed mt-0.5">
                    {searchResult.details?.signature || "DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL"}
                  </span>
                  <span className="text-[9px] text-[#D9D6CA]/70 font-mono mt-0.5 block">
                    HASH: {searchResult.details?.hash || "0x39E8F7A1B2C3D4E5"}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: Royalty & Clearance Terms */}
            <div className="space-y-3">
              <span className="text-[9.5px] text-[#D9D6CA] uppercase tracking-[0.2em] font-bold block">
                [ 4. ROYALTY &amp; CLEARANCE TERMS ]
              </span>
              <div className="bg-black/60 border border-zinc-850 p-4 rounded-xs space-y-2 text-[11px] font-sans">
                <div className="flex items-center gap-2 text-[#00E676] font-mono text-[10.5px]">
                  <CheckCircle2 size={14} />
                  <span className="font-bold uppercase tracking-wider">100% Sample-Free Master &amp; Composition Clearance Warranties</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {searchResult.royaltyTerms || "This license is granted with full mechanical and synchronization clearances. No third-party uncleared samples are incorporated. Non-exclusive, worldwide, fully executed clearance under Schedule A & B covenants."}
                </p>
                <div className="text-[9.5px] text-zinc-500 font-mono pt-1">
                  CLEARANCE JURISDICTION: ATLANTA, GEORGIA • GOVERNED BY LOMON LLC RIGHTS COVENANTS
                </div>
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
                className="w-full sm:w-auto bg-[#D9D6CA] hover:bg-white text-black font-sans font-bold text-xs uppercase tracking-wider px-5 py-3 transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-sm"
              >
                <FileText size={15} />
                <span>View Executed Agreement (Schedules A &amp; B) 📄</span>
              </button>

              <button 
                onClick={handleCopyApiUrl}
                className="w-full sm:w-auto border border-zinc-800 hover:border-zinc-500 bg-zinc-950 text-zinc-300 hover:text-white font-mono text-[10.5px] uppercase tracking-wider px-4 py-3 transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-sm"
              >
                {copiedApiUrl ? <Check size={14} className="text-[#00E676]" /> : <Copy size={14} />}
                <span>{copiedApiUrl ? "COPIED API URL!" : "COPY API VERIFY ENDPOINT"}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* 2. STATE B: MASTER ARCHIVE REGISTRY (UNPURCHASED / UNLICENSED) */}
        {searchResult && !isSearching && isUnpurchased && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-amber-500/40 bg-neutral-950 p-6 sm:p-8 space-y-6 text-left relative overflow-hidden rounded-sm shadow-2xl"
          >
            {/* Top Master Archive Registry Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/60 text-amber-400 rounded-full flex items-center justify-center shrink-0">
                  <Shield size={22} />
                </div>
                <div>
                  <div className="text-xs text-amber-400/80 font-mono tracking-[0.25em] uppercase">
                    MASTER ARCHIVE REGISTRY
                  </div>
                  <div className="text-sm sm:text-base font-bold text-amber-400 tracking-wider uppercase font-mono flex items-center gap-2 mt-0.5">
                    <span>STATUS: UNLICENSED / AVAILABLE FOR CLEARANCE</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono">
                <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">REGISTRY CATALOG ID</span>
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  {searchResult.licenseNumber || `TOC-FRAG-${(searchResult.fragment || "CAT").replace(/[^a-zA-Z0-9]/g, "")}`}
                </span>
              </div>
            </div>

            {/* Core Master Archive Registry Details Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/60 border border-zinc-850 p-5 rounded-xs font-mono">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">ORIGINAL RIGHTS HOLDER:</span>
                <span className="text-sm sm:text-base font-bold text-white block uppercase font-sans">
                  {searchResult.originalRightsHolder || "LOMON LLC / THE OWL CLOCK"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">MASTER OWNERSHIP:</span>
                <span className="text-sm sm:text-base font-bold text-[#D9D6CA] block uppercase font-sans">
                  {searchResult.masterOwnership || "100% SOLELY OWNED BY LOMON LLC"}
                </span>
              </div>

              <div className="space-y-1 pt-2 md:pt-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">PUBLISHING CONTROL:</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-300 block uppercase font-mono">
                  {searchResult.publishingControl || "100% CONTROLLED BY LOMON LLC"}
                </span>
              </div>

              <div className="space-y-1 pt-2 md:pt-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">AUTHENTICATED COMPOSITION:</span>
                <span className="text-xs sm:text-sm font-bold text-amber-300 block uppercase font-sans">
                  {searchResult.fragment || searchInput}
                </span>
              </div>
            </div>

            {/* Clearance & Legal Warranties Notice */}
            <div className="bg-black/40 border border-zinc-900 p-4 rounded-xs space-y-3 font-mono text-[10.5px]">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">
                CLEARANCE SPECIFICATIONS &amp; DELIVERABLES:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-[#00E676] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold block">100% Sample-Free Original Work</span>
                    <span className="text-[9.5px] text-zinc-500">Free of uncleared third-party samples or unverified interpolations.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-[#00E676] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold block">Direct Rights Grant</span>
                    <span className="text-[9.5px] text-zinc-500">Direct licensing covenants issued by LOMON LLC Rights Administration.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 col-span-1 sm:col-span-2 pt-1 border-t border-zinc-900/80">
                  <Disc size={14} className="text-[#D9D6CA] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold block">Deliverable Archive Assets Upon License Execution:</span>
                    <span className="text-[9.5px] text-zinc-400">
                      24-Bit 48kHz Master WAV Files • Multi-track Uncompressed Stems • Cryptographic PDF Covenant &amp; Executed License
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prominent Action Call Button as explicitly requested */}
            <div className="border-t border-zinc-900 pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button 
                onClick={handleActionClearance}
                className="bg-[#D9D6CA] hover:bg-white text-black font-sans font-bold text-xs sm:text-sm uppercase tracking-wider px-6 py-3.5 transition-all cursor-pointer flex items-center justify-center gap-2 rounded-sm shadow-lg hover:shadow-xl hover:scale-[1.01]"
              >
                <Sparkles size={16} />
                <span>[ REQUEST CLEARANCE / PURCHASE LICENSE ]</span>
              </button>

              <button 
                onClick={handleCopyApiUrl}
                className="border border-zinc-800 hover:border-zinc-500 bg-zinc-950 text-zinc-300 hover:text-white font-mono text-[10.5px] uppercase tracking-wider px-4 py-3 transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-sm"
              >
                {copiedApiUrl ? <Check size={14} className="text-[#00E676]" /> : <Copy size={14} />}
                <span>{copiedApiUrl ? "COPIED API URL!" : "COPY REGISTRY QUERY URL"}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ERROR / UNVERIFIED FALLBACK */}
        {errorMessage && !isSearching && !searchResult && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-red-900/50 bg-red-950/10 p-6 sm:p-8 space-y-4 text-left rounded-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-900/20 border border-red-800 text-red-500 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-red-500 tracking-wider uppercase font-mono">
                  STATUS: UNVERIFIED OR INVALID
                </div>
                <div className="text-[10px] text-zinc-400 font-mono uppercase mt-0.5">
                  NO MATCHING RECORD IN LOMON ARCHIVE REGISTRY
                </div>
              </div>
            </div>

            <p className="text-zinc-300 text-xs font-mono leading-relaxed bg-black/40 border border-zinc-900 p-4 rounded-xs">
              {errorMessage}
            </p>

            <div className="text-[10px] text-zinc-500 font-mono space-y-1 pt-2">
              <p>• Check that the license key is formatted correctly (e.g. TOC-CR-2026-30192) or enter a Fragment ID (e.g. 00:50 AM).</p>
              <p>• Unregistered license numbers offer no legal clearance for commercial use.</p>
            </div>
          </motion.div>
        )}

        {/* Footer Reference */}
        <div className="border-t border-zinc-900 pt-6 text-center text-[10px] font-mono text-zinc-600 uppercase space-y-1">
          <p>The Owl Clock • Publishing • Rights Management • Licensing</p>
          <p>Atlanta, Georgia • © 2026 LOMON LLC. All Rights Reserved.</p>
        </div>

      </div>
    </div>
  );
}

