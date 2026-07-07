import React, { useState, useEffect } from "react";
import { 
  FileText, ShieldCheck, Download, Search, Lock, Settings, 
  Activity, User, Edit, CheckSquare, RefreshCw, AlertTriangle, 
  Plus, X, ChevronRight, Check, Eye
} from "lucide-react";

// --- Types & Interfaces ---
export interface DocumentItem {
  id: string; // LOC-DOC-XXXX
  name: string;
  section: string; // ARCHIVE, CLEARANCE, etc.
  compositionId: string;
  clientId: string;
  licenseId?: string;
  clearanceId?: string;
  royaltyId?: string;
  publishingId?: string;
  metadataId?: string;
  fragmentId?: string;
  certificateId?: string;
  dateCreated: string;
  status: "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected" | "Pending Signature" | "Signed" | "Active" | "Expired" | "Revoked" | "Archived";
  signatureStatus: "Draft" | "Pending Signature" | "Executed" | "Verified" | "Not Required";
  verificationStatus: "Valid" | "Under Review" | "Warning" | "Unverified";
  adminNotes: string;
  activityLog: { date: string; action: string }[];
}

interface DocumentDashboardProps {
  currentUserEmail: string;
  isLoggedIn: boolean;
  onClose?: () => void;
  onRefreshData?: () => void;
  mode?: "CLIENT" | "ADMIN";
}

// Map Section to detailed description
const SECTION_INFO: Record<string, { purpose: string; index: number }> = {
  "ARCHIVE": { purpose: "Where all compositions and audio fragments live.", index: 1 },
  "CLEARANCE": { purpose: "Where users request and manage permission to use a composition.", index: 2 },
  "LICENSES": { purpose: "Where all digital license types are displayed and managed.", index: 3 },
  "RIGHTS ADMINISTRATION": { purpose: "Where rights, ownership, registrations, and administration are controlled.", index: 4 },
  "PUBLISHING": { purpose: "Where songwriter, publisher, and composition income information is handled.", index: 5 },
  "METADATA": { purpose: "Where release and catalog information is collected.", index: 6 },
  "OWNERSHIP": { purpose: "Where ownership is verified before licensing or release.", index: 7 },
  "ROYALTIES": { purpose: "Where payment splits, royalty obligations, and income tracking live.", index: 8 },
  "VERIFICATION": { purpose: "Where licenses and digital documents can be authenticated.", index: 9 },
  "ENTERPRISE": { purpose: "For higher-level clients, labels, sync buyers, brands, and internal admin.", index: 10 },
  "LEGAL": { purpose: "General website and company legal documents.", index: 11 },
  "DOCUMENT VAULT": { purpose: "Final signed and issued legal documents.", index: 12 }
};

// Raw template list of documents per section to populate initial state
const INITIAL_DOC_MAPPING: Record<string, string[]> = {
  "ARCHIVE": [
    "Composition Archive", "Fragment Record", "Composition Profile", 
    "Audio File Delivery Record", "Artwork / Visual Asset Record", 
    "Stem Delivery Record", "BPM & Key Sheet", "Mood / Genre / Tag Sheet"
  ],
  "CLEARANCE": [
    "Master Clearance Agreement", "Clearance Request Form", "Clearance Approval Letter", 
    "Clearance Rejection Notice", "Clearance Status Record", "Usage Declaration Form", 
    "Commercial Use Declaration", "Sync Use Declaration"
  ],
  "LICENSES": [
    "Access License Agreement", "Release License Agreement", "Commercial License Agreement", 
    "Unlimited License Agreement", "Exclusive Acquisition Agreement", "Sync License Agreement", 
    "Stem License Agreement", "Sample License Agreement", "Producer Collaboration Agreement", 
    "Work-for-Hire Agreement"
  ],
  "RIGHTS ADMINISTRATION": [
    "Rights Administration Agreement", "Rights Administration Request Form", "Rights Control Sheet", 
    "Chain of Title Record", "Copyright Registration Record", "PRO Registration Record", 
    "Sound Recording Rights Record", "Composition Rights Record", "Neighboring Rights Record", 
    "Takedown / Dispute Record"
  ],
  "PUBLISHING": [
    "Publishing Request Form", "Publishing Administration Agreement", "Split Sheet Template", 
    "Writer Share Confirmation", "Publisher Share Confirmation", "Controlled Composition Schedule", 
    "Mechanical Royalty Notice", "PRO Information Form", "Songwriter Information Form"
  ],
  "METADATA": [
    "Metadata Request Form", "Metadata Sheet", "Release Metadata Sheet", 
    "Composition Metadata Sheet", "Master Metadata Sheet", "ISRC Request Form", 
    "ISWC Request Form", "UPC Request Form", "Credits Sheet"
  ],
  "OWNERSHIP": [
    "Ownership Verification Form", "Ownership Declaration", "Producer Ownership Statement", 
    "Artist Ownership Statement", "Contributor Declaration", "Sample Declaration", 
    "Third-Party Rights Declaration", "No-Sample Warranty", "Ownership Dispute Notice"
  ],
  "ROYALTIES": [
    "Royalty Administration Form", "Royalty Split Sheet", "Royalty Payment Instruction Form", 
    "Mechanical Royalty Statement", "Performance Royalty Statement", "Master Royalty Statement", 
    "Producer Royalty Statement", "Royalty Audit Request", "Royalty Dispute Notice"
  ],
  "VERIFICATION": [
    "License Certificate", "License Verification Record", "Certificate Verification Page", 
    "Digital Signature Certificate", "License ID Record", "Composition ID Record", 
    "Clearance ID Record", "QR Verification Record", "Verification Status Report"
  ],
  "ENTERPRISE": [
    "Enterprise Portal Access Agreement", "Enterprise Client Agreement", "Label Clearance Agreement", 
    "Sync Buyer Agreement", "Brand Usage Agreement", "Music Supervisor Agreement", 
    "Bulk Licensing Agreement", "NDA / Confidentiality Agreement", "Enterprise Service Order", 
    "Custom License Order"
  ],
  "LEGAL": [
    "Terms of Use", "Privacy Policy", "Cookie Policy", "Copyright Policy", 
    "DMCA Policy", "Refund Policy", "Acceptable Use Policy", "Trademark Policy", 
    "Disclaimer", "Governing Law Notice"
  ],
  "DOCUMENT VAULT": [
    "Signed License Agreements", "Signed Clearance Agreements", "Signed Split Sheets", 
    "Signed Publishing Documents", "Signed Ownership Documents", "Signed Royalty Documents", 
    "Issued License Certificates", "Executed Digital Signatures", "Client Download Records", 
    "Archived Expired Licenses", "Archived Revoked Licenses"
  ]
};

// Static helper to assign appropriate status to mock documents
const determineDefaultStatus = (name: string, section: string): DocumentItem["status"] => {
  if (section === "LEGAL") return "Active";
  if (section === "DOCUMENT VAULT") {
    if (name.includes("Expired")) return "Expired";
    if (name.includes("Revoked")) return "Revoked";
    return "Signed";
  }
  if (name.includes("Form") || name.includes("Request") || name.includes("Notice")) {
    if (name.includes("Notice") || name.includes("Rejection")) return "Rejected";
    if (name.includes("Approval") || name.includes("Statement")) return "Approved";
    return "Submitted";
  }
  if (name.includes("Template") || name.includes("Sheet") || name.includes("Draft")) {
    return "Draft";
  }
  if (name.includes("Agreement") || name.includes("Contract")) {
    return "Pending Signature";
  }
  return "Active";
};

// Static helper to generate complete list of mock documents
const generateDefaultDocuments = (): DocumentItem[] => {
  const list: DocumentItem[] = [];
  let index = 1;

  Object.entries(INITIAL_DOC_MAPPING).forEach(([section, docNames]) => {
    docNames.forEach((name, sIndex) => {
      const docNum = String(index).padStart(4, "0");
      const compNum = String((index % 8) + 1).padStart(4, "0");
      const cltNum = String(((index * 3) % 15) + 1).padStart(4, "0");
      
      const docId = `LOC-DOC-${docNum}`;
      const compId = `LOC-COMP-${compNum}`;
      const cltId = `LOC-CLT-${cltNum}`;

      const item: DocumentItem = {
        id: docId,
        name,
        section,
        compositionId: compId,
        clientId: cltId,
        dateCreated: `2026-06-${String((index % 25) + 1).padStart(2, "0")} UTC`,
        status: determineDefaultStatus(name, section),
        signatureStatus: "Draft",
        verificationStatus: "Unverified",
        adminNotes: `SYSTEM VERIFICATION LOG: Initialization completed. Integrity verified. Associated with client ID ${cltId}.`,
        activityLog: [
          { date: "2026-06-01 00:00 UTC", action: "Document registration initialized." },
          { date: "2026-06-15 14:32 UTC", action: "System Registry synchronized with Database Nodes." }
        ]
      };

      // Set contextual ID values
      if (section === "ARCHIVE") {
        item.fragmentId = `LOC-FRAG-${String(sIndex + 1).padStart(4, "0")}`;
      } else if (section === "CLEARANCE") {
        item.clearanceId = `LOC-CLR-${String(sIndex + 1).padStart(4, "0")}`;
        item.activityLog.push({ date: "2026-06-20 09:12 UTC", action: "Clearance tracking ID mapped successfully." });
      } else if (section === "LICENSES") {
        item.licenseId = `LOC-LIC-${String(sIndex + 1).padStart(4, "0")}`;
        item.activityLog.push({ date: "2026-06-20 10:45 UTC", action: "Tokenized license key minted in ledger." });
      } else if (section === "ROYALTIES") {
        item.royaltyId = `LOC-ROY-${String(sIndex + 1).padStart(4, "0")}`;
      } else if (section === "PUBLISHING") {
        item.publishingId = `LOC-PUB-${String(sIndex + 1).padStart(4, "0")}`;
      } else if (section === "METADATA") {
        item.metadataId = `LOC-META-${String(sIndex + 1).padStart(4, "0")}`;
      } else if (section === "VERIFICATION") {
        item.certificateId = `LOC-CERT-${String(sIndex + 1).padStart(4, "0")}`;
        item.activityLog.push({ date: "2026-06-22 11:30 UTC", action: "QR verification blockhash calculated." });
      }

      // Configure default signature and verification states based on status
      if (item.status === "Active" || item.status === "Approved") {
        item.signatureStatus = "Executed";
        item.verificationStatus = "Valid";
      } else if (item.status === "Signed") {
        item.signatureStatus = "Verified";
        item.verificationStatus = "Valid";
      } else if (item.status === "Pending Signature") {
        item.signatureStatus = "Pending Signature";
        item.verificationStatus = "Under Review";
      } else if (item.status === "Draft") {
        item.signatureStatus = "Draft";
        item.verificationStatus = "Unverified";
      } else if (item.status === "Rejected" || item.status === "Revoked") {
        item.signatureStatus = "Not Required";
        item.verificationStatus = "Warning";
      }

      list.push(item);
      index++;
    });
  });

  return list;
};

export default function DocumentDashboard({ 
  currentUserEmail, 
  isLoggedIn, 
  onClose,
  onRefreshData,
  mode
}: DocumentDashboardProps) {
  
  // Dashboard view mode selection (CLIENT, ADMIN)
  const [activeMenuMode, setActiveMenuMode] = useState<"CLIENT" | "ADMIN">((() => {
    if (mode) return mode;
    if (typeof window !== "undefined" && window.location.pathname === "/AdminDashboard") {
      return "ADMIN";
    }
    return "CLIENT";
  }) as any);
  
  // Dynamic document database state
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem("dashboard_vault_documents");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return generateDefaultDocuments();
  });

  // Persistent state synchronization
  useEffect(() => {
    localStorage.setItem("dashboard_vault_documents", JSON.stringify(documents));
  }, [documents]);

  // Set default view menu mode on load depending on login state, route, or mode prop
  useEffect(() => {
    if (mode) {
      setActiveMenuMode(mode);
    } else if (typeof window !== "undefined" && window.location.pathname === "/AdminDashboard") {
      setActiveMenuMode("ADMIN");
    } else {
      setActiveMenuMode("CLIENT");
    }
  }, [isLoggedIn, currentUserEmail, mode]);

  // Selected menu item state
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("My Archive Access");

  // Sync menu selection when changing active tab mode
  useEffect(() => {
    if (activeMenuMode === "CLIENT") {
      setSelectedMenuItem("My Archive Access");
    } else if (activeMenuMode === "ADMIN") {
      setSelectedMenuItem("Composition Archive");
    }
  }, [activeMenuMode]);

  // Document inspection details state
  const [inspectingDoc, setInspectingDoc] = useState<DocumentItem | null>(null);
  
  // Search and status filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Admin note custom edits
  const [editingNotes, setEditingNotes] = useState("");
  const [editingStatus, setEditingStatus] = useState<DocumentItem["status"]>("Draft");
  const [editingSigStatus, setEditingSigStatus] = useState<DocumentItem["signatureStatus"]>("Draft");
  const [editingVerStatus, setEditingVerStatus] = useState<DocumentItem["verificationStatus"]>("Unverified");
  const [customLogAction, setCustomLogAction] = useState("");

  // Download simulation UI action
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Set values when a document is opened for inspection
  const openInspector = (doc: DocumentItem) => {
    setInspectingDoc(doc);
    setEditingNotes(doc.adminNotes || "");
    setEditingStatus(doc.status);
    setEditingSigStatus(doc.signatureStatus);
    setEditingVerStatus(doc.verificationStatus);
    setCustomLogAction("");
  };

  // Admin saves edited document metadata
  const handleSaveAdminEdits = () => {
    if (!inspectingDoc) return;

    setDocuments((prevDocs) => {
      return prevDocs.map((doc) => {
        if (doc.id === inspectingDoc.id) {
          const updatedLog = [...doc.activityLog];
          
          if (doc.status !== editingStatus) {
            updatedLog.push({
              date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
              action: `Admin adjusted document status from ${doc.status} to ${editingStatus}`
            });
          }
          if (doc.adminNotes !== editingNotes) {
            updatedLog.push({
              date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
              action: `Admin updated document notes.`
            });
          }
          if (customLogAction.trim()) {
            updatedLog.push({
              date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
              action: `Admin Entry: ${customLogAction.trim()}`
            });
          }

          const updatedDoc: DocumentItem = {
            ...doc,
            status: editingStatus,
            signatureStatus: editingSigStatus,
            verificationStatus: editingVerStatus,
            adminNotes: editingNotes,
            activityLog: updatedLog
          };
          
          // Sync current inspected doc preview state
          setInspectingDoc(updatedDoc);
          return updatedDoc;
        }
        return doc;
      });
    });

    setCustomLogAction("");
    if (onRefreshData) onRefreshData();
  };

  // Client triggers digital signature execution
  const handleClientSign = () => {
    if (!inspectingDoc) return;

    setDocuments((prevDocs) => {
      return prevDocs.map((doc) => {
        if (doc.id === inspectingDoc.id) {
          const updatedLog = [...doc.activityLog];
          updatedLog.push({
            date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
            action: `Client Secure Key Authenticated: Digital Signature Executed.`
          });

          const updatedDoc: DocumentItem = {
            ...doc,
            status: "Signed",
            signatureStatus: "Executed",
            verificationStatus: "Valid",
            activityLog: updatedLog
          };

          setInspectingDoc(updatedDoc);
          return updatedDoc;
        }
        return doc;
      });
    });
  };

  // Simulate file download
  const handleDownloadFile = (doc: DocumentItem) => {
    setDownloadingId(doc.id);
    
    // Simulate compilation of PDF license
    setTimeout(() => {
      setDownloadingId(null);
      // Trigger native download simulation
      const text = `
SECURE ARCHIVE CERTIFICATE
------------------------------
DOCUMENT ID   : ${doc.id}
DOCUMENT TYPE : ${doc.name}
SECTION       : ${doc.section}
CLIENT ID     : ${doc.clientId}
COMPOSITION ID: ${doc.compositionId}
DATE SECURED  : ${doc.dateCreated}
STATUS        : ${doc.status.toUpperCase()}
SIGNATURE     : ${doc.signatureStatus.toUpperCase()}
VERIFICATION  : ${doc.verificationStatus.toUpperCase()}

MD5 CIPHER BLOCK HASH:
0x${Math.floor(Math.random() * 1000000000).toString(16).toUpperCase()}${Math.floor(Math.random() * 1000000000).toString(16).toUpperCase()}

SYSTEM ARCHIVE RECORD CO-SIGNATURE SAVED SECURELY.
ATLANTA, GEORGIA • CERTIFIED DOCUMENT SECURED UNDER 2026 REGISTER.
      `;
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.id}_${doc.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1200);
  };

  // FRONT-END USER MENU DEFINITIONS
  const PUBLIC_MENU = [
    { name: "Enter the Archive", targetSection: "ARCHIVE" },
    { name: "Recover a Fragment", targetSection: "ARCHIVE" },
    { name: "Request Clearance", targetSection: "CLEARANCE" },
    { name: "License Verification", targetSection: "VERIFICATION" },
    { name: "Rights Administration", targetSection: "RIGHTS ADMINISTRATION" },
    { name: "Publishing Requests", targetSection: "PUBLISHING" },
    { name: "Metadata Requests", targetSection: "METADATA" },
    { name: "Ownership Verification", targetSection: "OWNERSHIP" },
    { name: "Enterprise Portal", targetSection: "ENTERPRISE" }
  ];

  // CLIENT DASHBOARD MENU DEFINITIONS
  const CLIENT_MENU = [
    { name: "My Archive Access", targetSection: "ARCHIVE" },
    { name: "My Clearance Requests", targetSection: "CLEARANCE" },
    { name: "My Licenses", targetSection: "LICENSES" },
    { name: "My Certificates", targetSection: "VERIFICATION" },
    { name: "My Downloads", targetSection: "DOCUMENT VAULT" },
    { name: "My Publishing Requests", targetSection: "PUBLISHING" },
    { name: "My Metadata Requests", targetSection: "METADATA" },
    { name: "My Ownership Verification", targetSection: "OWNERSHIP" },
    { name: "My Royalty Documents", targetSection: "ROYALTIES" },
    { name: "My Signed Documents", targetSection: "DOCUMENT VAULT" }
  ];

  // ADMIN DASHBOARD MENU DEFINITIONS
  const ADMIN_MENU = [
    { name: "Composition Archive", targetSection: "ARCHIVE" },
    { name: "Clearance Requests", targetSection: "CLEARANCE" },
    { name: "License Management", targetSection: "LICENSES" },
    { name: "Rights Administration", targetSection: "RIGHTS ADMINISTRATION" },
    { name: "Publishing Management", targetSection: "PUBLISHING" },
    { name: "Metadata Management", targetSection: "METADATA" },
    { name: "Ownership Verification", targetSection: "OWNERSHIP" },
    { name: "Royalty Administration", targetSection: "ROYALTIES" },
    { name: "License Verification", targetSection: "VERIFICATION" },
    { name: "Digital Signatures", targetSection: "DOCUMENT VAULT" },
    { name: "Enterprise Clients", targetSection: "ENTERPRISE" },
    { name: "Document Vault", targetSection: "DOCUMENT VAULT" },
    { name: "Activity Log", targetSection: "ARCHIVE" }, // Uses Archive or Global Log
    { name: "Dispute / Takedown Center", targetSection: "RIGHTS ADMINISTRATION" }
  ];

  // Dynamic menu matching based on mode selection
  const currentMenu = activeMenuMode === "CLIENT" 
    ? CLIENT_MENU 
    : ADMIN_MENU;

  // Find target section based on selection
  const activeMenuObj = currentMenu.find(m => m.name === selectedMenuItem);
  const activeSection = activeMenuObj ? activeMenuObj.targetSection : "ARCHIVE";

  // Filter documents displayed in table based on section, query, and status
  const filteredDocs = documents.filter((doc) => {
    // 1. Must match active selected category section
    if (doc.section !== activeSection) return false;

    // 2. Status filtering
    if (statusFilter !== "ALL" && doc.status !== statusFilter) return false;

    // 3. Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchId = doc.id.toLowerCase().includes(q);
      const matchComp = doc.compositionId.toLowerCase().includes(q);
      const matchClient = doc.clientId.toLowerCase().includes(q);
      const matchLicense = doc.licenseId?.toLowerCase().includes(q) || false;
      const matchClearance = doc.clearanceId?.toLowerCase().includes(q) || false;
      const matchRoyalty = doc.royaltyId?.toLowerCase().includes(q) || false;
      const matchPublishing = doc.publishingId?.toLowerCase().includes(q) || false;
      const matchMetadata = doc.metadataId?.toLowerCase().includes(q) || false;
      const matchFragment = doc.fragmentId?.toLowerCase().includes(q) || false;
      const matchCert = doc.certificateId?.toLowerCase().includes(q) || false;
      return (
        matchName || matchId || matchComp || matchClient || 
        matchLicense || matchClearance || matchRoyalty || 
        matchPublishing || matchMetadata || matchFragment || matchCert
      );
    }

    return true;
  });

  return (
    <div className="w-full text-zinc-300 font-mono select-text text-left max-w-7xl mx-auto flex flex-col md:flex-row h-full min-h-[550px] gap-6 p-1">
      
      {/* LEFT COLUMN: Sidebar Navigation Panel */}
      <div className="w-full md:w-64 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-zinc-900 pb-4 md:pb-0 md:pr-4 select-none">
        
        {/* Simple Dashboard Header */}
        <div className="space-y-1 bg-zinc-950 p-4 border border-zinc-900 rounded-sm">
          <div className="text-[11px] text-white font-bold tracking-wider uppercase">
            Document Repository
          </div>
          <div className="text-[9px] text-zinc-400 font-medium tracking-tight uppercase truncate">
            {isLoggedIn ? currentUserEmail : "Guest User Mode"}
          </div>
        </div>

        {/* Dynamic Sidebar Menu Section */}
        <div className="space-y-2 flex-grow overflow-y-auto max-h-[300px] md:max-h-[500px] pr-1 scrollbar-thin">
          <span className="text-[7.5px] tracking-[0.2em] font-bold text-zinc-600 block uppercase">
            {activeMenuMode === "CLIENT" ? "[ CLIENT DASHBOARD MENU ]" : "[ ADMIN DASHBOARD MENU ]"}
          </span>

          <div className="space-y-1">
            {currentMenu.map((item, idx) => {
              const isActive = selectedMenuItem === item.name;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedMenuItem(item.name)}
                  className={`w-full text-left py-2 px-2.5 transition-all text-[9.5px] font-mono tracking-wider uppercase border rounded-sm flex items-center justify-between group cursor-pointer ${
                    isActive 
                      ? "bg-[#D9D6CA]/10 border-[#D9D6CA]/30 text-white font-bold" 
                      : "border-transparent text-zinc-400 hover:text-white hover:bg-zinc-950/40"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`text-[8px] font-sans ${isActive ? "text-[#00E676]" : "text-zinc-700"}`}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <ChevronRight size={10} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "text-[#D9D6CA] opacity-100" : "text-zinc-600"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Back button or dismiss */}
        <button
          onClick={onClose}
          className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 text-[8.5px] tracking-[0.2em] uppercase py-2.5 rounded-sm transition-colors text-center cursor-pointer"
        >
          ← CLOSE PANEL
        </button>
      </div>

      {/* RIGHT COLUMN: Document Table & Interactive Workspace */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        
        {/* Section Header */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 text-left">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest leading-snug">
              {selectedMenuItem}
            </h4>
            <p className="text-zinc-500 text-[10px] uppercase leading-relaxed font-sans max-w-xl">
              {SECTION_INFO[activeSection]?.purpose || "Standard archive vault access."}
            </p>
          </div>
          
          <div className="shrink-0 text-right text-[8.5px] text-zinc-500 font-mono self-end sm:self-center">
            DOCUMENTS DETECTED: <strong className="text-white font-mono">{filteredDocs.length}</strong>
          </div>
        </div>

        {/* Search, Filter, and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search bar */}
          <div className="relative flex-grow min-w-0">
            <Search size={11} className="absolute left-3 top-3.5 text-zinc-600" />
            <input
              type="text"
              placeholder="SEARCH BY DOCUMENT, COMPOSITION, CLIENT OR ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-zinc-900 focus:border-[#D9D6CA]/40 text-white font-mono placeholder-zinc-700 text-[10px] pl-8.5 pr-4.5 py-3 rounded-none uppercase transition-colors focus:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-zinc-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status filtering */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-zinc-900 focus:border-[#D9D6CA]/40 text-zinc-400 font-mono text-[9px] px-3.5 py-3 rounded-none uppercase transition-colors outline-none shrink-0 cursor-pointer"
          >
            <option value="ALL">ALL STATUS LABELS</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Pending Signature">Pending Signature</option>
            <option value="Signed">Signed</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Revoked">Revoked</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        {/* Document Grid / Table */}
        <div className="border border-zinc-900 bg-black flex-grow overflow-x-auto rounded-sm min-h-[300px]">
          {filteredDocs.length > 0 ? (
            <table className="w-full border-collapse text-left text-[10px] font-mono leading-normal">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-900 text-[8.5px] tracking-wider uppercase text-zinc-500 font-bold font-mono">
                  <th className="py-3 px-3.5">DOCUMENT DETAILS</th>
                  <th className="py-3 px-3">RECORD ID</th>
                  <th className="py-3 px-3">ASSOCIATION REFERENCE</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950">
                {filteredDocs.map((doc) => {
                  // Get color tags based on status
                  const statusColors: Record<string, string> = {
                    "Draft": "bg-zinc-900 text-zinc-400 border-zinc-800",
                    "Submitted": "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    "Under Review": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                    "Approved": "bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20",
                    "Rejected": "bg-red-500/10 text-red-400 border-red-500/20",
                    "Pending Signature": "bg-purple-500/10 text-purple-400 border-purple-500/20",
                    "Signed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    "Active": "bg-amber-500/10 text-[#D9D6CA] border-[#D9D6CA]/20",
                    "Expired": "bg-zinc-800/20 text-zinc-500 border-zinc-900",
                    "Revoked": "bg-red-950/20 text-red-600 border-red-900/30",
                    "Archived": "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  };

                  return (
                    <tr 
                      key={doc.id} 
                      className="hover:bg-zinc-950/30 transition-colors group"
                    >
                      {/* Document Name */}
                      <td className="py-3.5 px-3.5 min-w-[180px]">
                        <div className="flex items-start gap-2.5">
                          <FileText size={13} className="text-zinc-500 group-hover:text-[#D9D6CA] transition-colors mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-white font-bold block uppercase tracking-wide group-hover:text-[#D9D6CA] transition-colors">
                              {doc.name}
                            </span>
                            <span className="text-[8.5px] text-zinc-500 block">
                              MINTED: {doc.dateCreated}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Record ID */}
                      <td className="py-3.5 px-3 font-mono">
                        <span className="text-white bg-zinc-950 border border-zinc-900 px-2 py-0.5 text-[9px] rounded-none">
                          {doc.id}
                        </span>
                      </td>

                      {/* Association IDs */}
                      <td className="py-3.5 px-3 font-mono space-y-1">
                        <div className="text-[8px] flex flex-wrap gap-x-2 gap-y-0.5 text-zinc-500 uppercase">
                          <span>COMP: <strong className="text-zinc-300 font-mono">{doc.compositionId}</strong></span>
                          <span>CLT: <strong className="text-zinc-300 font-mono">{doc.clientId}</strong></span>
                        </div>
                        <div className="text-[7.5px] flex flex-wrap gap-x-2 gap-y-0.5 text-zinc-500 uppercase">
                          {doc.licenseId && <span>LIC: <strong className="text-zinc-400 font-mono">{doc.licenseId}</strong></span>}
                          {doc.clearanceId && <span>CLR: <strong className="text-zinc-400 font-mono">{doc.clearanceId}</strong></span>}
                          {doc.fragmentId && <span>FRAG: <strong className="text-zinc-400 font-mono">{doc.fragmentId}</strong></span>}
                          {doc.certificateId && <span>CERT: <strong className="text-zinc-400 font-mono">{doc.certificateId}</strong></span>}
                          {doc.royaltyId && <span>ROY: <strong className="text-zinc-400 font-mono">{doc.royaltyId}</strong></span>}
                          {doc.publishingId && <span>PUB: <strong className="text-zinc-400 font-mono">{doc.publishingId}</strong></span>}
                          {doc.metadataId && <span>META: <strong className="text-zinc-400 font-mono">{doc.metadataId}</strong></span>}
                        </div>
                      </td>

                      {/* Status Tag */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-block border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-none ${statusColors[doc.status] || "bg-zinc-900 text-zinc-300 border-zinc-800"}`}>
                          {doc.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Download button */}
                        <button
                          onClick={() => handleDownloadFile(doc)}
                          disabled={downloadingId === doc.id}
                          className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-[#D9D6CA]/30 text-zinc-400 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center rounded-none"
                          title="Download Security Copy"
                        >
                          {downloadingId === doc.id ? (
                            <div className="w-3.5 h-3.5 border border-zinc-500 border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <Download size={11} />
                          )}
                        </button>

                        {/* Inspect button */}
                        <button
                          onClick={() => openInspector(doc)}
                          className="p-1.5 bg-[#D9D6CA]/10 border border-[#D9D6CA]/20 text-[#D9D6CA] hover:bg-[#D9D6CA]/20 hover:text-white hover:border-[#D9D6CA]/40 transition-all cursor-pointer inline-flex items-center justify-center rounded-none"
                          title="Inspect Document Properties"
                        >
                          <Eye size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-zinc-600 space-y-2 uppercase px-4">
              <AlertTriangle className="mx-auto text-zinc-750" size={24} />
              <div className="text-[10px] font-bold tracking-wider text-zinc-500">
                NO SYSTEM DOCUMENTS FOUND
              </div>
              <p className="text-[8.5px] max-w-sm mx-auto leading-relaxed text-zinc-600 font-sans">
                Adjust your filters or query constraints to locate records on this server cluster.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING INSPECTOR SIDE-PANEL / MODAL */}
      {inspectingDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[210] flex items-center justify-end font-mono">
          <div className="w-full max-w-md h-full bg-[#030303] border-l border-zinc-900 p-6 flex flex-col gap-4 shadow-2xl relative overflow-y-auto select-text text-left">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
              <div className="space-y-1">
                <span className="text-[8px] tracking-[0.25em] text-[#00E676] font-bold uppercase block">
                  [ DOCUMENT PROPERTIES ]
                </span>
                <h4 className="text-white font-bold text-xs uppercase tracking-widest leading-tight truncate max-w-[280px]">
                  {inspectingDoc.name}
                </h4>
                <div className="text-[8.5px] text-zinc-500 font-mono">
                  REF ID: <strong className="text-white font-mono">{inspectingDoc.id}</strong>
                </div>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Document stats grid */}
            <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono border border-zinc-900 bg-zinc-950/40 p-3 rounded-none">
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">COMPOSITION ID:</span>
                <span className="text-zinc-300 font-mono">{inspectingDoc.compositionId}</span>
              </div>
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">CLIENT ID:</span>
                <span className="text-zinc-300 font-mono">{inspectingDoc.clientId}</span>
              </div>
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">MINT DATE:</span>
                <span className="text-zinc-300 font-mono">{inspectingDoc.dateCreated}</span>
              </div>
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">SECTION:</span>
                <span className="text-[#D9D6CA] uppercase font-bold">{inspectingDoc.section}</span>
              </div>

              {inspectingDoc.licenseId && (
                <div className="col-span-2 pt-1 border-t border-zinc-900/60">
                  <span className="text-zinc-650 text-[7.5px] uppercase block tracking-wider">LICENSE ID:</span>
                  <span className="text-zinc-400 font-mono">{inspectingDoc.licenseId}</span>
                </div>
              )}
              {inspectingDoc.clearanceId && (
                <div className="col-span-2 pt-1 border-t border-zinc-900/60">
                  <span className="text-zinc-650 text-[7.5px] uppercase block tracking-wider">CLEARANCE ID:</span>
                  <span className="text-zinc-400 font-mono">{inspectingDoc.clearanceId}</span>
                </div>
              )}
              {inspectingDoc.fragmentId && (
                <div className="col-span-2 pt-1 border-t border-zinc-900/60">
                  <span className="text-zinc-650 text-[7.5px] uppercase block tracking-wider">FRAGMENT ID:</span>
                  <span className="text-zinc-400 font-mono">{inspectingDoc.fragmentId}</span>
                </div>
              )}
              {inspectingDoc.certificateId && (
                <div className="col-span-2 pt-1 border-t border-zinc-900/60">
                  <span className="text-zinc-650 text-[7.5px] uppercase block tracking-wider">CERTIFICATE ID:</span>
                  <span className="text-zinc-400 font-mono">{inspectingDoc.certificateId}</span>
                </div>
              )}
              {inspectingDoc.royaltyId && (
                <div className="col-span-2 pt-1 border-t border-zinc-900/60">
                  <span className="text-zinc-650 text-[7.5px] uppercase block tracking-wider">ROYALTY ID:</span>
                  <span className="text-zinc-400 font-mono">{inspectingDoc.royaltyId}</span>
                </div>
              )}
              {inspectingDoc.publishingId && (
                <div className="col-span-2 pt-1 border-t border-zinc-900/60">
                  <span className="text-zinc-650 text-[7.5px] uppercase block tracking-wider">PUBLISHING ID:</span>
                  <span className="text-zinc-400 font-mono">{inspectingDoc.publishingId}</span>
                </div>
              )}
              {inspectingDoc.metadataId && (
                <div className="col-span-2 pt-1 border-t border-zinc-900/60">
                  <span className="text-zinc-650 text-[7.5px] uppercase block tracking-wider">METADATA ID:</span>
                  <span className="text-zinc-400 font-mono">{inspectingDoc.metadataId}</span>
                </div>
              )}
            </div>

            {/* Dynamic Status Badges Display */}
            <div className="grid grid-cols-3 gap-1.5 py-1">
              <div className="bg-zinc-950 border border-zinc-900 p-2 text-center rounded-none">
                <span className="text-[7.5px] text-zinc-650 uppercase block tracking-wider mb-1">DOC STATUS</span>
                <span className="text-[8.5px] text-white font-bold uppercase">{inspectingDoc.status}</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-900 p-2 text-center rounded-none">
                <span className="text-[7.5px] text-zinc-650 uppercase block tracking-wider mb-1">SIGNATURE</span>
                <span className="text-[8.5px] text-[#00E676] font-bold uppercase">{inspectingDoc.signatureStatus}</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-900 p-2 text-center rounded-none">
                <span className="text-[7.5px] text-zinc-650 uppercase block tracking-wider mb-1">INTEGRITY</span>
                <span className="text-[8.5px] text-yellow-500 font-bold uppercase">{inspectingDoc.verificationStatus}</span>
              </div>
            </div>

            {/* Admin editable workspace OR Client view block */}
            <div className="space-y-3.5 border-t border-b border-zinc-900 py-4">
              {activeMenuMode === "ADMIN" ? (
                // ADMIN MANAGEMENT FORM CONTROLS
                <div className="space-y-3">
                  <div className="space-y-1 bg-yellow-500/5 border border-yellow-500/20 p-2.5">
                    <span className="text-[7.5px] tracking-[0.2em] font-bold text-yellow-500 block uppercase">
                      ⚠️ ADMIN CONSOLE PRIVILEGES ENABLED
                    </span>
                    <p className="text-zinc-400 text-[8px] uppercase font-sans tracking-wide">
                      adjust the variables below to modify this record in the master registry.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Status dropdown */}
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-500 uppercase block">STATUS:</span>
                      <select
                        value={editingStatus}
                        onChange={(e: any) => setEditingStatus(e.target.value)}
                        className="w-full bg-black border border-zinc-850 text-white text-[9px] p-1.5 focus:outline-none focus:border-yellow-500"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Pending Signature">Pending Signature</option>
                        <option value="Signed">Signed</option>
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                        <option value="Revoked">Revoked</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>

                    {/* Signature dropdown */}
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-500 uppercase block">SIGNATURE:</span>
                      <select
                        value={editingSigStatus}
                        onChange={(e: any) => setEditingSigStatus(e.target.value)}
                        className="w-full bg-black border border-zinc-850 text-white text-[9px] p-1.5 focus:outline-none focus:border-yellow-500"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Pending Signature">Pending</option>
                        <option value="Executed">Executed</option>
                        <option value="Verified">Verified</option>
                        <option value="Not Required">N/A</option>
                      </select>
                    </div>

                    {/* Verification dropdown */}
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-500 uppercase block">INTEGRITY:</span>
                      <select
                        value={editingVerStatus}
                        onChange={(e: any) => setEditingVerStatus(e.target.value)}
                        className="w-full bg-black border border-zinc-850 text-white text-[9px] p-1.5 focus:outline-none focus:border-yellow-500"
                      >
                        <option value="Valid">Valid</option>
                        <option value="Under Review">Review</option>
                        <option value="Warning">Warning</option>
                        <option value="Unverified">Unverified</option>
                      </select>
                    </div>
                  </div>

                  {/* Admin notes field */}
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-zinc-500 uppercase block">ADMIN NOTES:</span>
                    <textarea
                      rows={2}
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      className="w-full bg-black border border-zinc-850 focus:border-yellow-500 text-white font-mono p-2 text-[9px] uppercase resize-none outline-none"
                    />
                  </div>

                  {/* Custom Log entry field */}
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-zinc-500 uppercase block">APPEND TO ACTIVITY LOG:</span>
                    <input
                      type="text"
                      placeholder="e.g. Physical license copy dispatched to Atlanta."
                      value={customLogAction}
                      onChange={(e) => setCustomLogAction(e.target.value)}
                      className="w-full bg-black border border-zinc-850 focus:border-yellow-500 text-white font-mono p-2 text-[9px] uppercase outline-none placeholder-zinc-800"
                    />
                  </div>

                  <button
                    onClick={handleSaveAdminEdits}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black text-[9px] font-bold tracking-widest uppercase py-2.5 transition-colors cursor-pointer rounded-none text-center"
                  >
                    SAVE LEDGER UPDATES
                  </button>
                </div>
              ) : (
                // CLIENT / PUBLIC INFORMATION VIEW (VIEW ONLY)
                <div className="space-y-3.5 text-left">
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-zinc-500 uppercase block">ADMINISTRATIVE ANNOTATION:</span>
                    <div className="bg-zinc-950 p-2.5 border border-zinc-900 text-zinc-400 text-[9px] leading-relaxed uppercase select-text rounded-none">
                      {inspectingDoc.adminNotes || "NO CURRENT NOTES PROVIDED BY ARCHIVE ADMINISTRATOR."}
                    </div>
                  </div>

                  {inspectingDoc.signatureStatus === "Pending Signature" && (
                    <div className="space-y-2 pt-1 border-t border-zinc-900/60">
                      <span className="text-[7.5px] text-red-400 font-bold tracking-wider uppercase block">
                        ⚠️ YOUR SIGNATURE IS PENDING ON THIS DOCUMENT
                      </span>
                      <button
                        onClick={handleClientSign}
                        className="w-full bg-[#00E676]/15 hover:bg-[#00E676]/25 border border-[#00E676]/40 hover:border-[#00E676] text-[#00E676] hover:text-white text-[9px] font-bold tracking-widest uppercase py-2.5 transition-all cursor-pointer rounded-none text-center flex items-center justify-center gap-1.5"
                      >
                        <CheckSquare size={11} />
                        <span>EXECUTE DIGITAL SIGNATURE</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Complete Activity Log */}
            <div className="space-y-2 flex-grow overflow-y-auto max-h-[160px] pr-1">
              <span className="text-[7.5px] text-zinc-650 tracking-wider font-bold uppercase block flex items-center gap-1">
                <Activity size={10} className="text-[#00E676]" />
                <span>CRYPTOGRAPHIC ACTIVITY LOG TIMELINE</span>
              </span>

              <div className="space-y-1.5 font-mono text-[8px] leading-normal uppercase">
                {inspectingDoc.activityLog && inspectingDoc.activityLog.length > 0 ? (
                  inspectingDoc.activityLog.map((log, i) => (
                    <div key={i} className="border border-zinc-950 bg-zinc-950/20 p-2 space-y-0.5 rounded-sm">
                      <div className="text-zinc-550 font-sans tracking-wide">{log.date}</div>
                      <div className="text-zinc-400 font-bold">{log.action}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-600 text-center py-2">No active timeline tracks registered.</div>
                )}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900 shrink-0">
              <button
                onClick={() => handleDownloadFile(inspectingDoc)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 hover:border-[#D9D6CA]/30 text-[#D9D6CA] font-bold text-[8.5px] tracking-widest uppercase py-2.5 transition-colors cursor-pointer rounded-none flex items-center justify-center gap-1.5"
              >
                <Download size={11} />
                <span>DOWNLOAD FILE</span>
              </button>
              <button
                onClick={() => setInspectingDoc(null)}
                className="bg-[#0c0c0c] border border-zinc-900 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 font-bold text-[8.5px] tracking-widest uppercase py-2.5 transition-colors cursor-pointer rounded-none text-center"
              >
                CLOSE VIEW
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
