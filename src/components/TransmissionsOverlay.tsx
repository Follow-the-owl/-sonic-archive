import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Check, AlertCircle, FileText, Search, ShieldCheck, 
  Send, DollarSign, List, Plus, Landmark, History, FileCheck, ExternalLink, Mail
} from "lucide-react";

interface TransmissionsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  type: string; // The specific menu action/slug
  title: string;
  subtitle: string;
  userEmail?: string;
}

export default function TransmissionsOverlay({
  isOpen,
  onClose,
  type,
  title,
  subtitle,
  userEmail = "evianaconcepts1@gmail.com"
}: TransmissionsOverlayProps) {
  // License verification state
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Clearance state
  const [clearanceStep, setClearanceStep] = useState<"choose" | "review" | "approval" | "final">("choose");
  const [selectedContractType, setSelectedContractType] = useState<string | null>(null);
  const [contractSignature, setContractSignature] = useState("");

  // Publishing form state
  const [isPublishingSubmitting, setIsPublishingSubmitting] = useState(false);
  const [publishingSuccess, setPublishingSuccess] = useState(false);
  const [iswcRequestSong, setIswcRequestSong] = useState("");

  // Metadata form state
  const [isMetadataSubmitting, setIsMetadataSubmitting] = useState(false);
  const [metadataSuccess, setMetadataSuccess] = useState(false);
  const [isrcRequestSong, setIsrcRequestSong] = useState("");

  // Ownership state
  const [isOwnershipSubmitting, setIsOwnershipSubmitting] = useState(false);
  const [ownershipSuccess, setOwnershipSuccess] = useState(false);
  const [sampleDeclarationText, setSampleDeclarationText] = useState("");

  // Royalty payment state
  const [isRoyaltySaving, setIsRoyaltySaving] = useState(false);
  const [royaltySuccess, setRoyaltySuccess] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState("");

  // Enterprise form state
  const [isEnterpriseSubmitting, setIsEnterpriseSubmitting] = useState(false);
  const [enterpriseSuccess, setEnterpriseSuccess] = useState(false);

  // General contact/support form states
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);

  // Document Vault modal state inside dashboards
  const [showDocumentVault, setShowDocumentVault] = useState(false);

  if (!isOpen) return null;

  // Handle license verification lookup
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      const isOwlCode = verificationInput.toUpperCase().includes("OWL") || verificationInput.includes("823") || verificationInput.includes("01");
      
      setVerificationResult({
        id: verificationInput.toUpperCase(),
        status: isOwlCode ? "SECURED / ACTIVE" : "VALIDATED / REGISTERED",
        composition: "The Owl Clock - Midnight Drift (Theme II)",
        type: "Commercial Sync & Broadcast License",
        isrc: "US-LMN-26-00301",
        iswc: "T-302.459.882-1",
        issuedTo: userEmail,
        issuedDate: "2026-06-30 UTC",
        signature: "DIGITALLY REGISTERED VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL",
        hash: "0x8F9C2B7A1E4D039F"
      });
    }, 1200);
  };

  // Render content based on mapped slug or title
  const renderContent = () => {
    const slug = type.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // ----------------------------------------------------
    // 1. LICENSE VERIFICATION & CERTIFICATE RECORD
    // ----------------------------------------------------
    if (slug === "license-verification" || slug === "license-certificate" || slug === "verification") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ SECURED VERIFICATION PORTAL ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Enter a License ID, Certificate ID, or Composition ID to query the LOMON LLC cryptographic registry.
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex gap-2">
            <input 
              type="text"
              placeholder="e.g. LOMON-OWL-823"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              className="flex-grow bg-black border border-zinc-850 px-3.5 py-2.5 text-[11px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
            />
            <button 
              type="submit"
              className="bg-[#D9D6CA] text-black font-mono font-bold text-[10px] tracking-widest px-4 py-2.5 hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
            >
              {isVerifying ? "QUERYING..." : "VERIFY"}
            </button>
          </form>

          {isVerifying && (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] text-zinc-500 tracking-widest uppercase">LOOKING UP REGISTRY...</span>
            </div>
          )}

          {verificationResult && !isVerifying && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-zinc-850 bg-neutral-950 p-4 space-y-4 rounded-sm relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 text-[7px] text-zinc-700 uppercase font-mono tracking-wider">
                CERTIFICATE RECORD
              </div>

              <div className="flex items-start gap-2.5 border-b border-zinc-900 pb-3">
                <div className="w-6 h-6 bg-[#00E676]/10 border border-[#00E676]/40 text-[#00E676] rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck size={13} />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9.5px] font-bold text-[#00E676] tracking-wider uppercase">
                    LICENSE AUTHENTICATED — {verificationResult.status}
                  </div>
                  <div className="text-[8.5px] text-zinc-500 font-mono">
                    ID: {verificationResult.id}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-[10px] font-mono">
                <div>
                  <span className="text-zinc-650 text-[8px] uppercase block tracking-wider">COMPOSITION:</span>
                  <span className="text-zinc-300 font-medium uppercase">{verificationResult.composition}</span>
                </div>
                <div>
                  <span className="text-zinc-650 text-[8px] uppercase block tracking-wider">TYPE:</span>
                  <span className="text-[#D9D6CA] uppercase">{verificationResult.type}</span>
                </div>
                <div>
                  <span className="text-zinc-650 text-[8px] uppercase block tracking-wider">ISRC / ISWC:</span>
                  <span className="text-zinc-400 font-mono uppercase">{verificationResult.isrc} / {verificationResult.iswc}</span>
                </div>
                <div>
                  <span className="text-zinc-650 text-[8px] uppercase block tracking-wider">ISSUED TO:</span>
                  <span className="text-zinc-400 truncate block">{verificationResult.issuedTo}</span>
                </div>
                <div className="col-span-2 border-t border-zinc-900 pt-3">
                  <span className="text-zinc-650 text-[8px] uppercase block tracking-wider">SIGNATURE RECORD:</span>
                  <span className="text-[8.5px] text-zinc-500 font-mono leading-relaxed block tracking-tight">
                    {verificationResult.signature}
                  </span>
                  <span className="text-[8px] text-[#D9D6CA]/40 font-mono mt-1 block">
                    HASH: {verificationResult.hash}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick links as requested */}
          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>REGISTRY VERSION 4.02</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase flex items-center gap-1"
            >
              Access Document Vault ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 2. REQUEST CLEARANCE (CONTRACTS SEQUENCE)
    // ----------------------------------------------------
    if (slug === "request-clearance") {
      const contractTypes = [
        { id: "Access", name: "Access License Agreement", desc: "Non-commercial evaluation, private streaming, and architectural study." },
        { id: "Release", name: "Release License Agreement", desc: "Indie release rights, streaming distribution up to 50,000 plays." },
        { id: "Commercial", name: "Commercial License Agreement", desc: "Global DSP distribution, broadcast rights, unlimited streaming." },
        { id: "Exclusive", name: "Exclusive Acquisition Agreement", desc: "Full buyout, complete ownership transfer, catalog removal." },
        { id: "Sync", name: "Sync License Agreement", desc: "Master synchronization rights for films, games, series, and advertising." }
      ];

      return (
        <div className="space-y-5 text-left">
          {clearanceStep === "choose" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
                  [ STEP 1: CHOOSE CONTRACT TYPE ]
                </span>
                <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
                  Select the required license archetype to initiate the LOMON LLC clearance procedure.
                </p>
              </div>

              <div className="space-y-2.5">
                {contractTypes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedContractType(c.name);
                      setClearanceStep("review");
                    }}
                    className="w-full text-left border border-zinc-850 hover:border-[#D9D6CA]/40 bg-black hover:bg-zinc-950 p-3.5 transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="text-[11px] font-bold text-white group-hover:text-[#D9D6CA] uppercase tracking-wider">
                        {c.name}
                      </div>
                      <div className="text-[9px] text-zinc-500 uppercase leading-snug">
                        {c.desc}
                      </div>
                    </div>
                    <span className="text-[#D9D6CA] text-[10px] tracking-widest shrink-0 uppercase group-hover:translate-x-1 transition-transform">
                      SELECT &gt;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {clearanceStep === "review" && selectedContractType && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
                  [ STEP 2: REVIEW LICENSE ]
                </span>
                <h4 className="text-white font-bold text-xs uppercase tracking-widest">
                  {selectedContractType}
                </h4>
              </div>

              <div className="border border-zinc-850 bg-neutral-950 p-4 h-[200px] overflow-y-auto text-[9.5px] font-mono text-zinc-400 space-y-4 scrollbar-thin select-text">
                <p className="font-bold text-white">LOMON COVENANT &amp; INTELLECTUAL LICENSE</p>
                <p>This document constitutes a binding agreement between LOMON LLC (operating on behalf of the Sonic Archive catalog) and the licensee ({userEmail}).</p>
                <p>1. LICENSED MATERIAL: The corresponding sonic master recordings, stems, and metadata generated under THE OWL CLOCK umbrella.</p>
                <p>2. SCOPE OF RIGHTS: Licensee is granted non-exclusive rights to exploit the works strictly in accordance with the parameters defined under the {selectedContractType} archetype.</p>
                <p>3. RESTRICTIONS: Re-selling, sub-licensing, or deploying the assets to external generative machine learning models is strictly prohibited without the express physical co-signature of LOMON administration.</p>
                <p>4. JURISDICTION: This license is governed by federal copyright law and administered under the statutory guidelines of the state of Atlanta, Georgia and Lagos, Nigeria.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setClearanceStep("choose")}
                  className="flex-grow border border-zinc-850 hover:border-white text-zinc-400 hover:text-white font-mono text-[9px] tracking-widest uppercase py-3 transition-all cursor-pointer text-center"
                >
                  &lt; BACK
                </button>
                <button
                  onClick={() => setClearanceStep("approval")}
                  className="flex-grow bg-[#D9D6CA] text-black font-mono font-bold text-[9px] tracking-widest uppercase py-3 hover:bg-white transition-all cursor-pointer text-center"
                >
                  CLEARANCE REVIEW &gt;
                </button>
              </div>
            </div>
          )}

          {clearanceStep === "approval" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[8px] tracking-[0.25em] text-red-500 font-bold uppercase block">
                  [ STEP 3: CLEARANCE REVIEW &amp; SIGNATURE ]
                </span>
                <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
                  Sign below with your full name to submit this Master Clearance Agreement to LOMON systems for Final Approval.
                </p>
              </div>

              <div className="space-y-3">
                <input 
                  type="text"
                  placeholder="TYPE FULL NAME TO SIGN"
                  value={contractSignature}
                  onChange={(e) => setContractSignature(e.target.value)}
                  className="w-full bg-black border border-zinc-850 px-3.5 py-3 text-[11px] font-mono text-[#D9D6CA] focus:outline-none focus:border-red-500/40 uppercase placeholder-zinc-700"
                />

                <button
                  onClick={() => {
                    if (!contractSignature.trim()) return;
                    setClearanceStep("final");
                  }}
                  disabled={!contractSignature.trim()}
                  className={`w-full font-mono font-bold text-[10px] tracking-widest py-3.5 transition-all text-center uppercase ${
                    contractSignature.trim() 
                      ? "bg-red-500 text-white cursor-pointer hover:bg-red-600" 
                      : "bg-zinc-900 text-zinc-650 cursor-not-allowed"
                  }`}
                >
                  APPROVE MASTER CLEARANCE AGREEMENT
                </button>
              </div>
            </div>
          )}

          {clearanceStep === "final" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-zinc-850 bg-neutral-950 p-5 space-y-4 rounded-sm text-center"
            >
              <div className="w-10 h-10 bg-[#00E676]/10 border border-[#00E676]/40 text-[#00E676] rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Check size={20} />
              </div>

              <h4 className="text-white font-bold text-xs uppercase tracking-widest">
                CLEARANCE APPROVED
              </h4>

              <p className="text-zinc-450 text-[10px] leading-relaxed uppercase">
                The Master Clearance Agreement has been digitally executed, archived, and transmitted to your verified terminal ({userEmail}).
              </p>

              <div className="border border-zinc-900 bg-black p-3 text-[9px] text-zinc-500 font-mono uppercase text-left space-y-1">
                <div>CONTRACT HASH: 0xBB823D3F1E8</div>
                <div>SIGNATURE: {contractSignature.toUpperCase()}</div>
                <div>STATUS: REGISTERED IN LOMON VAULT</div>
              </div>

              <button
                onClick={() => {
                  setClearanceStep("choose");
                  setSelectedContractType(null);
                  setContractSignature("");
                }}
                className="w-full bg-zinc-900 text-zinc-300 font-mono text-[9px] tracking-widest py-3 hover:text-white transition-all cursor-pointer uppercase"
              >
                REQUEST ANOTHER CLEARANCE
              </button>
            </motion.div>
          )}
        </div>
      );
    }

    // ----------------------------------------------------
    // 3. PUBLISHING REQUEST DASHBOARD (SPLIT SHEET / PRO / ISWC)
    // ----------------------------------------------------
    if (slug === "publishing" || slug === "publishing-request-dashboard") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ PUBLISHING REQUEST DASHBOARD ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Manage composition PRO declarations, request ISWC registration, and review split sheet allocations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-zinc-900 bg-neutral-950 p-3 space-y-2">
              <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wider font-extrabold">Split Sheet Record</span>
              <div className="text-[11px] font-bold text-white uppercase">OWL-01 Splits</div>
              <div className="text-[9.5px] text-zinc-400 font-mono space-y-1">
                <div>• LOMON LLC — 50% (Pub)</div>
                <div>• COMPOSER — 50% (Writer)</div>
              </div>
            </div>

            <div className="border border-zinc-900 bg-neutral-950 p-3 space-y-2">
              <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wider font-extrabold">PRO Affiliations</span>
              <div className="text-[11px] font-bold text-[#D9D6CA] uppercase">ASCAP / BMI / PRS</div>
              <div className="text-[9px] text-zinc-500 leading-normal uppercase">
                Global performance rights administered securely via Lomon network.
              </div>
            </div>
          </div>

          {publishingSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center space-y-2"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest">
                ISWC REQUEST SUBMITTED
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-normal">
                Composition "{iswcRequestSong}" has been queued for ASCAP/BMI registration index. An agent will confirm within 48 hours.
              </p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!iswcRequestSong.trim()) return;
                setIsPublishingSubmitting(true);
                setTimeout(() => {
                  setIsPublishingSubmitting(false);
                  setPublishingSuccess(true);
                }, 1200);
              }}
              className="space-y-3 border-t border-zinc-900 pt-4"
            >
              <span className="text-[8.5px] text-zinc-400 block uppercase tracking-wider font-bold">
                INITIATE NEW ISWC REQUEST
              </span>
              <input 
                type="text"
                placeholder="ENTER COMPOSITION TITLE"
                value={iswcRequestSong}
                onChange={(e) => setIswcRequestSong(e.target.value)}
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-3 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isPublishingSubmitting ? "PROCESSING COVENANT..." : "SUBMIT PUBLISHING REQUEST"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>ADMINISTRATOR: LOMON GLOBAL</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Open Split Sheets Vault ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 4. METADATA REQUEST DASHBOARD (METADATA SHEET / ISRC / UPC)
    // ----------------------------------------------------
    if (slug === "metadata" || slug === "metadata-request-dashboard") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ METADATA REQUEST DASHBOARD ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Configure track-level metadata sheets, register ISRC audio codes, and manage master credits.
            </p>
          </div>

          <div className="border border-zinc-900 bg-neutral-950 p-3.5 space-y-3">
            <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wider font-extrabold">Active Metadata Sheets</span>
            <div className="grid grid-cols-2 gap-y-2 text-[10px] font-mono text-zinc-400 uppercase">
              <div>• Format: WAV 24-bit</div>
              <div>• Tunings: 432 Hz</div>
              <div>• Genres: Ambient Drone</div>
              <div>• Authors: THE SENTINELS</div>
            </div>
          </div>

          {metadataSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center space-y-2"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest">
                ISRC ASSIGNED SUCCESSFULLY
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-normal">
                Audio ID "{isrcRequestSong}" has been assigned ISRC code: <span className="text-white font-mono font-bold">US-LMN-26-00824</span>.
              </p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!isrcRequestSong.trim()) return;
                setIsMetadataSubmitting(true);
                setTimeout(() => {
                  setIsMetadataSubmitting(false);
                  setMetadataSuccess(true);
                }, 1200);
              }}
              className="space-y-3 border-t border-zinc-900 pt-4"
            >
              <span className="text-[8.5px] text-zinc-400 block uppercase tracking-wider font-bold">
                GENERATE NEW ISRC / UPC FOR RELEASE
              </span>
              <input 
                type="text"
                placeholder="ENTER UNREGISTERED SONG NAME"
                value={isrcRequestSong}
                onChange={(e) => setIsrcRequestSong(e.target.value)}
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-3 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isMetadataSubmitting ? "ALLOCATING CODES..." : "GENERATE SECURED ISRC CODE"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>CATALOG ARCHIVE V3</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Inspect Metadata Sheets ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 5. OWNERSHIP VERIFICATION (SAMPLE DECLARATION / WARRANTY)
    // ----------------------------------------------------
    if (slug === "ownership-verification" || slug === "ownership") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ OWNERSHIP VERIFICATION DASHBOARD ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Submit clearance covenants, assert sample-free warranties, and review intellectual property statements.
            </p>
          </div>

          <div className="border border-zinc-900 bg-neutral-950 p-3.5 space-y-2">
            <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wider font-extrabold">No-Sample Warranty Status</span>
            <div className="flex items-center gap-2 text-[#00E676] text-[10.5px] font-bold uppercase">
              <ShieldCheck size={14} />
              <span>ACTIVE GUARANTEE — 100% ORIGINAL COMPOSITIONS</span>
            </div>
            <p className="text-[8.5px] text-zinc-500 uppercase leading-relaxed">
              Lomon LLC guarantees all masters in the Owl Clock are cleared, containing zero unauthorized samples.
            </p>
          </div>

          {ownershipSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center space-y-2"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest">
                SAMPLE DECLARATION LOGGED
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-normal">
                Your legal assertion has been securely registered to the LOMON LLC Ledger under the warranty block.
              </p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!sampleDeclarationText.trim()) return;
                setIsOwnershipSubmitting(true);
                setTimeout(() => {
                  setIsOwnershipSubmitting(false);
                  setOwnershipSuccess(true);
                }, 1200);
              }}
              className="space-y-3 border-t border-zinc-900 pt-4"
            >
              <span className="text-[8.5px] text-zinc-400 block uppercase tracking-wider font-bold">
                SUBMIT NEW WARRANTY &amp; SAMPLE DECLARATION
              </span>
              <textarea 
                placeholder="ENTER ORIGINAL WORK DETAILS & WARRANTY ASSERTION"
                value={sampleDeclarationText}
                onChange={(e) => setSampleDeclarationText(e.target.value)}
                rows={3}
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700 resize-none"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-3 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isOwnershipSubmitting ? "NOTARIZING DECREE..." : "RECORD COMPOSITION WARRANTY"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>LEGAL JURISDICTION: DEED LOCK</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Inspect Ownership Deeds ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 6. ROYALTY ADMINISTRATION (SPLITS / STATEMENTS)
    // ----------------------------------------------------
    if (slug === "royalty-administration" || slug === "royalty" || slug === "royalty-dashboard") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ ROYALTY LEDGER DASHBOARD ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Track synchronization licensing payouts, examine ledger balances, and configure payment instructions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="border border-zinc-900 bg-neutral-950 p-3 space-y-1">
              <span className="text-[7.5px] text-zinc-500 uppercase block tracking-wider">Unpaid Balance</span>
              <div className="text-lg font-extrabold text-[#D9D6CA]">$1,842.50</div>
              <span className="text-[8px] text-[#00E676] uppercase block">AVAILABLE FOR PAYOUT</span>
            </div>
            <div className="border border-zinc-900 bg-neutral-950 p-3 space-y-1">
              <span className="text-[7.5px] text-zinc-500 uppercase block tracking-wider">Total Distributed</span>
              <div className="text-lg font-extrabold text-zinc-500">$14,500.00</div>
              <span className="text-[8px] text-zinc-600 uppercase block">SINCE ARCHIVE BIRTH</span>
            </div>
          </div>

          {royaltySuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center"
            >
              <div className="text-[9.5px] font-bold text-[#00E676] uppercase tracking-widest">
                PAYMENT INSTRUCTIONS UPDATED
              </div>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!paymentInstructions.trim()) return;
                setIsRoyaltySaving(true);
                setTimeout(() => {
                  setIsRoyaltySaving(false);
                  setRoyaltySuccess(true);
                }, 1000);
              }}
              className="space-y-2 border-t border-zinc-900 pt-3"
            >
              <span className="text-[8.5px] text-zinc-400 block uppercase tracking-wider font-bold">
                CONFIGURE PAYOUT INSTRUCTIONS
              </span>
              <input 
                type="text"
                placeholder="e.g. WIRE TRANS, PAYONEER EMAIL, BANK DETAILS"
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                className="w-full bg-black border border-zinc-850 px-3 py-2 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9px] tracking-widest py-2.5 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isRoyaltySaving ? "STORING PAYOUT METHOD..." : "SAVE DISBURSEMENT PATHWAY"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-3.5 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>LEDGER: STANDALONE CRYPTO</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Inspect Royalty Statements ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 7. RIGHTS ADMINISTRATION CENTER
    // ----------------------------------------------------
    if (slug === "rights-administration" || slug === "rights" || slug === "rights-dashboard") {
      return (
        <div className="space-y-5 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ RIGHTS ADMINISTRATION CENTER ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Secure copyright records, monitor third-party licensing usage, and view active global declarations.
            </p>
          </div>

          <div className="border border-zinc-850 bg-neutral-950 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 text-[9.5px] font-mono font-bold">
              <span className="text-white">ENFORCEMENT VECTOR</span>
              <span className="text-zinc-500">STATUS</span>
            </div>
            <div className="space-y-2.5 text-[10px] font-mono text-zinc-400">
              <div className="flex justify-between">
                <span>• YouTube ContentID Sync</span>
                <span className="text-[#00E676] font-bold">[ ARMORED ]</span>
              </div>
              <div className="flex justify-between">
                <span>• Broadcast Airplay Monitored</span>
                <span className="text-[#00E676] font-bold">[ ONLINE ]</span>
              </div>
              <div className="flex justify-between">
                <span>• Metadata Fingerprint Registry</span>
                <span className="text-zinc-500">[ INDEXED ]</span>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-zinc-500 leading-normal uppercase">
            All rights asserted globally on behalf of the registered owners under LOMON LLC legal proxy structures.
          </p>

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>COMPLIANCE INDEX 88</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Open Rights Dashboard ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 8. BRAND STORY / MISSION / ABOUT
    // ----------------------------------------------------
    if (slug === "about-the-archive" || slug === "about") {
      return (
        <div className="space-y-4 text-left select-text">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ STORY &amp; MISSION ]
            </span>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest">
              The Owl Clock: A Temporal Sonic Vault
            </h4>
          </div>

          <div className="text-[10px] font-mono text-zinc-400 space-y-3.5 leading-relaxed uppercase">
            <p>
              Born from a pursuit to capture fleeting frequencies, THE OWL CLOCK serves as a public-facing sonic archive.
            </p>
            <p>
              Every audio fragment recorded inside this threshold represents a specific temporal marker—measured, verified, and sealed with a custom frequency and signature.
            </p>
            <p>
              Operated behind the veil by LOMON LLC, we provide modern creators, media directors, and labels with a verified catalog of cleared compositions, stems, and atmospheric loops designed for deep cinematic immersion.
            </p>
          </div>

          <div className="border-t border-zinc-900 pt-4 text-[9px] text-zinc-500 font-mono flex justify-between">
            <span>OPERATOR: LOMON LLC</span>
            <span>ESTABLISHED 2026</span>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 9. ENTERPRISE INTAKE PORTAL
    // ----------------------------------------------------
    if (slug === "enterprise") {
      return (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ ENTERPRISE INTAKE PORTAL ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Bespoke sync licensing clearance, publishing administration, and catalog integration services for high-volume buyers, streaming platforms, and media agencies.
            </p>
          </div>

          {enterpriseSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest mb-1">
                SECURE BRIEF RECEIVED
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-relaxed">
                An Enterprise Curator will establish encrypted contact at your terminal email within 12 business hours.
              </p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setIsEnterpriseSubmitting(true);
                setTimeout(() => {
                  setIsEnterpriseSubmitting(false);
                  setEnterpriseSuccess(true);
                }, 1500);
              }}
              className="space-y-3 border-t border-zinc-900 pt-3"
            >
              <input 
                type="text"
                placeholder="AGENCY, LABEL, OR COMPANY NAME"
                required
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
              />
              <textarea 
                placeholder="BRIEF DESCRIPTION OF SYNC / BRAND NEEDS"
                rows={3}
                required
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700 resize-none"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-3 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isEnterpriseSubmitting ? "TRANSMITTING SPECIFICATION..." : "SUBMIT ENTERPRISE BRIEF"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>GLOBAL PORTAL</span>
            <button 
              onClick={() => setShowDocumentVault(true)}
              className="text-[#D9D6CA] hover:underline cursor-pointer uppercase"
            >
              Open Enterprise Dashboard ↗
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 10. HELP CENTER & SUPPORT
    // ----------------------------------------------------
    if (slug === "support") {
      return (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ SUPPORT / VAULT HELP DESK ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              Having issues downloading WAV stems or verifying digital license records? Submit a priority ticket directly to our terminal admin.
            </p>
          </div>

          {supportSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest mb-1">
                TICKET DISPATCHED SECURELY
              </div>
              <p className="text-[9.5px] text-zinc-400 uppercase leading-relaxed">
                Registered to code: <span className="text-white font-bold">LMN-SUPPORT-2921</span>. Support agents will contact you shortly.
              </p>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!supportMessage.trim()) return;
                setIsEnterpriseSubmitting(true);
                setTimeout(() => {
                  setIsEnterpriseSubmitting(false);
                  setSupportSuccess(true);
                }, 1200);
              }}
              className="space-y-3"
            >
              <textarea 
                placeholder="HOW CAN WE ASSIST YOU?"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                rows={3}
                required
                className="w-full bg-black border border-zinc-850 px-3 py-2.5 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700 resize-none"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-3 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isEnterpriseSubmitting ? "TRANSMITTING INQUIRY..." : "SEND SUPPORT REQUEST"}
              </button>
            </form>
          )}

          <div className="border-t border-zinc-900 pt-4 text-[9px] text-zinc-650 font-mono uppercase text-center">
            24/7 ENCRYPTED VAULT ESCALATION ACTIVE
          </div>
        </div>
      );
    }

    // ----------------------------------------------------
    // 11. GENERAL CONTACT PAGE
    // ----------------------------------------------------
    if (slug === "contact") {
      return (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ TRANSMISSIONS OFFICE ]
            </span>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase">
              General inquiries, sync representations, or feedback for the curators. Reach us at our operations hubs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 border border-zinc-900 bg-neutral-950 p-3.5 text-[9.5px] font-mono text-zinc-400">
            <div>
              <span className="text-white font-bold block uppercase tracking-wider mb-1">ATLANTA HUB</span>
              <div>LOMON CO. Atlanta</div>
              <div>Georgia, USA</div>
              <div className="text-zinc-650 mt-1">atl@credentials.local</div>
            </div>
            <div>
              <span className="text-white font-bold block uppercase tracking-wider mb-1">LAGOS HUB</span>
              <div>LOMON CO. Lagos</div>
              <div>Lagos, Nigeria</div>
              <div className="text-zinc-650 mt-1">los@credentials.local</div>
            </div>
          </div>

          {contactSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3.5 bg-[#00E676]/5 border border-[#00E676]/20 rounded-sm text-center"
            >
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest">
                MESSAGE DELIVERED
              </div>
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!contactMessage.trim()) return;
                setIsEnterpriseSubmitting(true);
                setTimeout(() => {
                  setIsEnterpriseSubmitting(false);
                  setContactSuccess(true);
                }, 1000);
              }}
              className="space-y-3"
            >
              <input 
                type="text"
                placeholder="YOUR NAME"
                required
                className="w-full bg-black border border-zinc-850 px-3 py-2 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700"
              />
              <textarea 
                placeholder="WRITE MESSAGE"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={2}
                required
                className="w-full bg-black border border-zinc-850 px-3 py-2 text-[10.5px] font-mono text-[#D9D6CA] focus:outline-none focus:border-[#D9D6CA]/40 uppercase placeholder-zinc-700 resize-none"
              />
              <button 
                type="submit"
                className="w-full bg-[#D9D6CA] text-black font-mono font-bold text-[9.5px] tracking-widest py-2.5 hover:bg-white transition-colors cursor-pointer uppercase"
              >
                {isEnterpriseSubmitting ? "SENDING BRIEF..." : "DISPATCH SIGNAL"}
              </button>
            </form>
          )}
        </div>
      );
    }

    // ----------------------------------------------------
    // 12. LEGAL POLICIES (TERMS, PRIVACY, COOKIES, ETC.)
    // ----------------------------------------------------
    if (["terms", "privacy", "cookies", "refunds", "acceptable-use", "protocols-dep"].includes(slug)) {
      const legalTitles: Record<string, string> = {
        "terms": "TERMS OF USE (PROTOCOLS)",
        "privacy": "PRIVACY CONVENTIONS",
        "cookies": "COOKIE DISCLOSURE",
        "refunds": "REFUND POLICY",
        "acceptable-use": "ACCEPTABLE USE DIRECTIVE"
      };

      const legalText: Record<string, string[]> = {
        "terms": [
          "1. ACCEPTANCE: By accessing this portal, the user agrees to be bound by LOMON LLC's digital governance protocols.",
          "2. INTELLECTUAL STATUS: All audio, waveform metadata, clock algorithms, and cryptographic files are sole property of LOMON LLC.",
          "3. USAGE: Redistribution or algorithmic mining of archive materials without validated licenses is heavily prosecuted under international copyright covenants."
        ],
        "privacy": [
          "1. REGISTRATION DATA: We collect terminal identifiers, purchase histories, and secure emails strictly for clearance tracking.",
          "2. ENCRYPTION: Communication signals are routed through secure, server-side proxies. We never retain payment codes.",
          "3. COMPLIANCE: Data operations satisfy all federal privacy requirements in Lagos, Nigeria and Atlanta, USA."
        ],
        "cookies": [
          "1. SESSIONS: The portal utilizes secure local tokens to cache media bag items and maintain active audio loops.",
          "2. OPT-OUT: By maintaining connection, you assent to temporary cookie states required for clock calibration."
        ],
        "refunds": [
          "1. DIGITAL WAIVER: Due to the instant delivery of master WAV stems and clearance certificates, all completed acquisitions are final.",
          "2. DISCREPANCIES: If file corruption occurs, LOMON LLC will re-generate and sign a fresh stem package."
        ],
        "acceptable-use": [
          "1. FORBIDDEN VECTORS: You may not use Owl Clock fragments to feed deep artificial networks or audio mimicry frameworks.",
          "2. DEFIANT ACTION: Any unauthorized server probing will automatically lock access terminals via Security Protocol LOMON-44."
        ]
      };

      const targetTitle = legalTitles[slug] || "PROTOCOLS MANUAL";
      const targetParas = legalText[slug] || ["1. STANDARD PROTOCOL IS ACTIVE. REFER ALL INQUIRIES TO LOMON LLC CORE STAFF."];

      return (
        <div className="space-y-4 text-left select-text">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.25em] text-[#D9D6CA] font-bold uppercase block">
              [ LEGAL COVENANT ]
            </span>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest">
              {targetTitle}
            </h4>
          </div>

          <div className="text-[10px] font-mono text-zinc-400 space-y-4 leading-relaxed uppercase">
            {targetParas.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="border-t border-zinc-900 pt-4 text-[9px] text-zinc-500 font-mono text-center">
            LAST MODIFIED: JUNE 2026 • LOMON LEGAL DEPT
          </div>
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="space-y-3.5 py-2">
        <p className="text-zinc-400 text-[10.5px] leading-relaxed uppercase tracking-wider">
          {body || `ACCESS TO "${title}" IS CURRENTLY UNREACHABLE OR DEMANDS HIGHER CRYPTOGRAPHIC CLEARANCE. CONTACT TRANSMISSIONS ADMIN.`}
        </p>
        
        <div className="border border-zinc-900 bg-neutral-950 p-2.5 flex items-center gap-2.5">
          <span className="text-red-500 animate-pulse text-sm shrink-0">⚠️</span>
          <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest leading-normal">
            SECURITY PROTOCOL LOMON-44 IS ACTIVE. ATTEMPTS HAVE BEEN LOGGED.
          </span>
        </div>
      </div>
    );
  };

  const body = `ACCESS TO "${title}" IS CURRENTLY UNREACHABLE OR DEMANDS HIGHER CRYPTOGRAPHIC CLEARANCE. CONTACT TRANSMISSIONS ADMIN.`;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 select-none font-mono"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="border border-zinc-850 bg-[#050505] p-6 max-w-md w-full text-left space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative rounded-sm"
        >
          <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
            <div className="space-y-1">
              <span className="text-[8px] tracking-[0.3em] uppercase text-[#D9D6CA]/50 font-bold block">
                [ {subtitle || "TRANSMISSION"} ]
              </span>
              <h4 className="text-[#D9D6CA] font-bold text-xs uppercase tracking-widest leading-tight">
                {title}
              </h4>
            </div>
            <button 
              onClick={onClose} 
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs p-1"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
          
          <div className="py-1">
            {renderContent()}
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-zinc-900 border border-zinc-800 hover:border-[#D9D6CA]/40 hover:text-white text-zinc-300 font-mono text-[9px] tracking-[0.25em] uppercase py-3 transition-all cursor-pointer rounded-none"
          >
            DISMISS TRANSMISSION
          </button>
        </motion.div>
      </motion.div>

      {/* 8. HIDDEN DOCUMENT VAULT SUB-MODAL */}
      <AnimatePresence>
        {showDocumentVault && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 backdrop-blur-lg z-[200] flex items-center justify-center p-4 select-none font-mono"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="border border-zinc-850 bg-[#020202] p-6 max-w-lg w-full text-left space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                <div className="space-y-1">
                  <span className="text-[8px] tracking-[0.3em] uppercase text-red-500 font-bold block">
                    [ CRYPTOGRAPHIC SECURE LEVEL ]
                  </span>
                  <h4 className="text-white font-bold text-xs uppercase tracking-widest leading-tight">
                    DOCUMENT VAULT
                  </h4>
                </div>
                <button 
                  onClick={() => setShowDocumentVault(false)} 
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-zinc-500 text-[10px] leading-relaxed uppercase">
                Displays legally executed digital signature certificates, download logs, expired agreements, and revoked credentials.
              </p>

              <div className="space-y-2 border border-zinc-900 p-3 bg-zinc-950/40 rounded-sm">
                <span className="text-[8px] text-zinc-650 tracking-wider font-bold uppercase block">ARCHIVED VAULT FILES</span>
                
                <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-950">
                    <span className="flex items-center gap-1.5"><FileText size={11} className="text-zinc-600" /> OWL_LICENSE_CERT_0333.PDF</span>
                    <span className="text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 text-[8.5px] font-bold">[ SIGNED ]</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-950">
                    <span className="flex items-center gap-1.5"><FileText size={11} className="text-zinc-600" /> COVENANT_SPLIT_SHEET_M01.XLS</span>
                    <span className="text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 text-[8.5px] font-bold">[ EXECUTED ]</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-950">
                    <span className="flex items-center gap-1.5"><FileText size={11} className="text-zinc-600" /> MASTER_CLEARANCE_AGREEMENT.WAV</span>
                    <span className="text-zinc-500 bg-zinc-900 px-1.5 py-0.5 text-[8.5px]">[ DOWNLOAD RECORD ]</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-950">
                    <span className="flex items-center gap-1.5"><FileText size={11} className="text-zinc-600" /> TEMP_EVALUATION_ACCESS_38.PDF</span>
                    <span className="text-yellow-600 bg-yellow-600/10 px-1.5 py-0.5 text-[8.5px]">[ EXPIRED ]</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5"><FileText size={11} className="text-zinc-600" /> REVOKED_LICENSE_SAMPLE_92.PDF</span>
                    <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 text-[8.5px] font-bold">[ REVOKED ]</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowDocumentVault(false)}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-white text-zinc-300 font-mono text-[9px] tracking-widest uppercase py-3 transition-all cursor-pointer text-center"
                >
                  CLOSE VAULT ACCESS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
