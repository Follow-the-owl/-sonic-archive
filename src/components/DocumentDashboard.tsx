import React, { useState, useEffect } from "react";
import { 
  FileText, ShieldCheck, Download, Search, Lock, Settings, 
  Activity, User, Edit, CheckSquare, RefreshCw, AlertTriangle, 
  Plus, X, ChevronRight, Check, Eye
} from "lucide-react";

// --- Types & Interfaces ---
export type DocumentType =
  | "Ownership Document"
  | "Split Sheet"
  | "Metadata Sheet"
  | "Sample Declaration"
  | "No-Sample Warranty"
  | "Producer Agreement"
  | "Work-for-Hire Agreement"
  | "Clearance Record"
  | "Copyright Registration"
  | "PRO Registration"
  | "Other";

export interface DocumentItem {
  id: string; // LOC-DOC-XXXX
  name: string;
  documentType: DocumentType;
  version: string;
  dateAdded: string; // string representation of the added date
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
  visibility: "Private" | "Authorized Only" | "Public";
  signatureStatus: "Draft" | "Pending Signature" | "Executed" | "Verified" | "Not Required";
  isSigned: "Signed" | "Unsigned";
  expirationDate: string; // "YYYY-MM-DD UTC" or "N/A"
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

// Map names to the 11 requested document types
const determineDocumentType = (name: string): DocumentType => {
  const n = name.toLowerCase();
  if (n.includes("split sheet") || n.includes("split-sheet") || n.includes("split template")) return "Split Sheet";
  if (n.includes("metadata sheet") || n.includes("metadata")) return "Metadata Sheet";
  if (n.includes("sample declaration")) return "Sample Declaration";
  if (n.includes("no-sample warranty") || n.includes("no sample") || n.includes("no-sample")) return "No-Sample Warranty";
  if (n.includes("producer collaboration") || n.includes("producer agreement")) return "Producer Agreement";
  if (n.includes("work-for-hire") || n.includes("work for hire")) return "Work-for-Hire Agreement";
  if (n.includes("clearance record") || n.includes("clearance agreement") || n.includes("clearance request") || n.includes("clearance approval") || n.includes("clearance rejection") || n.includes("clearance status")) return "Clearance Record";
  if (n.includes("copyright")) return "Copyright Registration";
  if (n.includes("pro registration") || n.includes("pro information") || n.includes("pro form")) return "PRO Registration";
  if (n.includes("ownership") || n.includes("composition archive") || n.includes("composition profile") || n.includes("contributor declaration")) return "Ownership Document";
  return "Other";
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

      const docStatus = determineDefaultStatus(name, section);
      const docType = determineDocumentType(name);
      const isSignedState: "Signed" | "Unsigned" = (docStatus === "Signed" || docStatus === "Approved" || docStatus === "Active") ? "Signed" : "Unsigned";
      
      // Expire only appropriate files
      let expDate = "N/A";
      if (docStatus === "Expired") {
        expDate = "2026-06-30 UTC";
      } else if (docType === "Producer Agreement" || docType === "Work-for-Hire Agreement" || docType === "Clearance Record") {
        expDate = `2028-12-31 UTC`;
      }

      // Default Visibility setting
      let visibilitySetting: "Private" | "Authorized Only" | "Public" = "Private";
      if (section === "LEGAL") {
        visibilitySetting = "Public";
      } else if (section === "VERIFICATION") {
        visibilitySetting = "Public";
      } else if (name.includes("Template") || name.includes("Form")) {
        visibilitySetting = "Authorized Only";
      }

      const item: DocumentItem = {
        id: docId,
        name,
        documentType: docType,
        version: name.includes("Draft") || docStatus === "Draft" ? "v1.0-draft" : "v1.0",
        dateAdded: `2026-06-${String((index % 25) + 1).padStart(2, "0")} UTC`,
        section,
        compositionId: compId,
        clientId: cltId,
        dateCreated: `2026-06-${String((index % 25) + 1).padStart(2, "0")} UTC`,
        status: docStatus,
        visibility: visibilitySetting,
        signatureStatus: "Draft",
        isSigned: isSignedState,
        expirationDate: expDate,
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
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>(() => {
    return !isLoggedIn ? "Enter the Archive" : "My Archive Access";
  });

  // State for tracking user-authorized documents for guest/public users
  const [authorizedDocIds, setAuthorizedDocIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("dashboard_authorized_doc_ids");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("dashboard_authorized_doc_ids", JSON.stringify(authorizedDocIds));
  }, [authorizedDocIds]);

  // Global authorization passcode state
  const [globalPasscode, setGlobalPasscode] = useState("");
  const [isGloballyAuthorized, setIsGloballyAuthorized] = useState(() => {
    return localStorage.getItem("dashboard_globally_authorized") === "true";
  });

  const handleGlobalPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalPasscode.toUpperCase() === "LOMON-SECURE-2026") {
      setIsGloballyAuthorized(true);
      localStorage.setItem("dashboard_globally_authorized", "true");
      setGlobalPasscode("");
    } else {
      alert("INVALID PASSCODE - ACCESS REFUSED");
    }
  };

  // Guest clearance modal state
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [clearanceDoc, setClearanceDoc] = useState<DocumentItem | null>(null);
  const [clearanceEmail, setClearanceEmail] = useState("");
  const [clearanceReason, setClearanceReason] = useState("");
  const [clearancePasscode, setClearancePasscode] = useState("");
  const [clearanceError, setClearanceError] = useState("");
  const [clearanceSuccess, setClearanceSuccess] = useState(false);

  const handleRequestClearanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClearanceError("");
    setClearanceSuccess(false);

    if (!clearanceEmail || !clearanceReason) {
      setClearanceError("Please fill out all required fields.");
      return;
    }

    // Check passcode
    if (clearancePasscode.toUpperCase() === "LOMON-SECURE-2026") {
      if (clearanceDoc) {
        const updatedIds = [...authorizedDocIds, clearanceDoc.id];
        setAuthorizedDocIds(updatedIds);
        localStorage.setItem("authorized_doc_ids", JSON.stringify(updatedIds));
      }
      setClearanceSuccess(true);
      setTimeout(() => {
        setShowClearanceModal(false);
        setClearanceEmail("");
        setClearanceReason("");
        setClearancePasscode("");
        setClearanceSuccess(false);
      }, 2000);
    } else {
      setClearanceError("GATEWAY PASSCODE IS MANDATORY OR INVALID FOR EMERGENCY DE-REDACTION. ACCESS HAS BEEN LOGGED AND IS PENDING MANUAL ADMIN RELEASE.");
    }
  };

  // Sync menu selection when changing active tab mode or login state
  useEffect(() => {
    if (!isLoggedIn) {
      setSelectedMenuItem("Enter the Archive");
    } else if (activeMenuMode === "CLIENT") {
      setSelectedMenuItem("My Archive Access");
    } else if (activeMenuMode === "ADMIN") {
      setSelectedMenuItem("Composition Archive");
    }
  }, [activeMenuMode, isLoggedIn]);

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

  // New requested document metadata editable states
  const [editingDocType, setEditingDocType] = useState<DocumentType>("Other");
  const [editingVersion, setEditingVersion] = useState("");
  const [editingDateAdded, setEditingDateAdded] = useState("");
  const [editingVisibility, setEditingVisibility] = useState<DocumentItem["visibility"]>("Private");
  const [editingIsSigned, setEditingIsSigned] = useState<DocumentItem["isSigned"]>("Unsigned");
  const [editingExpirationDate, setEditingExpirationDate] = useState("");

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

    setEditingDocType(doc.documentType || "Other");
    setEditingVersion(doc.version || "v1.0");
    setEditingDateAdded(doc.dateAdded || doc.dateCreated || "");
    setEditingVisibility(doc.visibility || "Private");
    setEditingIsSigned(doc.isSigned || "Unsigned");
    setEditingExpirationDate(doc.expirationDate || "N/A");
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
          if (doc.documentType !== editingDocType) {
            updatedLog.push({
              date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
              action: `Admin updated document type to ${editingDocType}`
            });
          }
          if (doc.version !== editingVersion) {
            updatedLog.push({
              date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
              action: `Admin updated document version to ${editingVersion}`
            });
          }
          if (doc.visibility !== editingVisibility) {
            updatedLog.push({
              date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
              action: `Admin updated document visibility to ${editingVisibility}`
            });
          }
          if (doc.isSigned !== editingIsSigned) {
            updatedLog.push({
              date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
              action: `Admin set signature status to ${editingIsSigned}`
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
            documentType: editingDocType,
            version: editingVersion,
            dateAdded: editingDateAdded,
            visibility: editingVisibility,
            isSigned: editingIsSigned,
            expirationDate: editingExpirationDate,
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

  // Dynamic menu matching based on login state and mode selection
  const currentMenu = !isLoggedIn
    ? PUBLIC_MENU
    : activeMenuMode === "CLIENT" 
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

        {/* Public Mode Security Passcode Gateway */}
        {!isLoggedIn && (
          <form 
            onSubmit={handleGlobalPasscodeSubmit}
            className="border border-yellow-500/20 bg-yellow-500/5 p-3 rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div className="space-y-0.5">
              <div className="text-[10px] text-yellow-500 font-bold uppercase flex items-center gap-1.5">
                <Lock size={11} className="text-yellow-500 animate-pulse" />
                SECURITY GATEWAY ACTIVE
              </div>
              <p className="text-[8.5px] text-zinc-500 uppercase leading-normal">
                RESTRICTED DOCUMENTS ARE REDACTED BY DEFAULT. ENTER SECURE PASSCODE <code className="text-yellow-500 bg-yellow-500/10 px-1 py-0.2 font-mono">LOMON-SECURE-2026</code> TO DE-REDACT SESSION.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ENTER GATEWAY PASSCODE..."
                value={globalPasscode}
                onChange={(e) => setGlobalPasscode(e.target.value)}
                className="bg-black border border-zinc-900 focus:border-yellow-500/40 text-yellow-500 font-mono placeholder-zinc-800 text-[9px] px-3.5 py-2 rounded-none uppercase transition-colors outline-none max-w-[200px]"
              />
              <button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-bold text-[9px] tracking-wider px-4 py-2 cursor-pointer transition-colors uppercase"
              >
                AUTHORIZE
              </button>
            </div>
          </form>
        )}

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
                  <th className="py-3 px-3">METADATA & ASSOCIATION</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950">
                {filteredDocs.map((doc) => {
                  const isRedacted = !isLoggedIn && doc.visibility !== "Public" && !isGloballyAuthorized && !authorizedDocIds.includes(doc.id);

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

                  if (isRedacted) {
                    return (
                      <tr 
                        key={doc.id} 
                        className="border-b border-zinc-950 bg-red-950/5 hover:bg-red-950/10 transition-colors"
                      >
                        {/* Redacted details */}
                        <td className="py-3.5 px-3.5 min-w-[200px]">
                          <div className="flex items-start gap-2.5">
                            <Lock size={13} className="text-red-500/70 mt-0.5 shrink-0 animate-pulse" />
                            <div className="space-y-0.5">
                              <span className="text-red-500/80 font-bold block uppercase tracking-wide">
                                [REDACTED - SECURITY LEVEL ACCESS]
                              </span>
                              <span className="text-[8px] text-zinc-600 block uppercase font-mono">
                                TYPE: RESTRICTED // SECURE GATEWAY AUTHORIZATION REQUIRED
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ID is shown so they can request clearance */}
                        <td className="py-3.5 px-3 font-mono">
                          <span className="text-red-500/50 bg-red-950/10 border border-red-900/20 px-2 py-0.5 text-[9px]">
                            {doc.id}
                          </span>
                        </td>

                        {/* Association redacted */}
                        <td className="py-3.5 px-3 font-mono space-y-1">
                          <div className="text-[8px] text-zinc-700 uppercase font-mono">
                            COMPOSITION: [REDACTED] // CLIENT: [REDACTED]
                          </div>
                          <div className="text-[7.5px] text-zinc-750 uppercase font-mono">
                            VISIBILITY: PRIVATE // SIGNATURE: REQ SECURE KEY
                          </div>
                        </td>

                        {/* Status is shown as locked */}
                        <td className="py-3.5 px-3">
                          <span className="inline-block border border-red-900/30 bg-red-950/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-500">
                            LOCKED
                          </span>
                        </td>

                        {/* Request action */}
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setClearanceDoc(doc);
                              setClearanceEmail("");
                              setClearanceReason("");
                              setClearancePasscode("");
                              setClearanceError("");
                              setClearanceSuccess(false);
                              setShowClearanceModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-red-950 hover:bg-red-900 text-white border border-red-900 text-[8.5px] font-mono uppercase tracking-wider font-bold cursor-pointer transition-all rounded-sm"
                          >
                            REQUEST CLEARANCE
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr 
                      key={doc.id} 
                      className="hover:bg-zinc-950/30 transition-colors border-b border-zinc-950 group"
                    >
                      {/* Document Name & Type / Version */}
                      <td className="py-3.5 px-3.5 min-w-[200px]">
                        <div className="flex items-start gap-2.5">
                          <FileText size={13} className="text-zinc-500 group-hover:text-[#D9D6CA] transition-colors mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-white font-bold block uppercase tracking-wide group-hover:text-[#D9D6CA] transition-colors">
                              {doc.name}
                            </span>
                            <div className="text-[8px] text-zinc-400 font-mono flex items-center gap-1.5 flex-wrap">
                              <span className="text-yellow-500 bg-yellow-500/10 px-1 py-0.2 font-bold font-mono">{doc.documentType.toUpperCase()}</span>
                              <span className="text-zinc-600">•</span>
                              <span className="text-zinc-500 font-mono">{doc.version}</span>
                              <span className="text-zinc-600">•</span>
                              <span className="text-zinc-500 font-mono">ADDED: {doc.dateAdded}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Record ID */}
                      <td className="py-3.5 px-3 font-mono">
                        <span className="text-white bg-zinc-950 border border-zinc-900 px-2 py-0.5 text-[9px] rounded-none">
                          {doc.id}
                        </span>
                      </td>

                      {/* Metadata & Association IDs */}
                      <td className="py-3.5 px-3 font-mono space-y-1">
                        <div className="text-[8.5px] flex flex-wrap gap-x-2.5 gap-y-0.5 text-zinc-300 uppercase font-mono">
                          <span>COMP: <strong className="text-white font-mono">{doc.compositionId}</strong></span>
                          <span>CLT: <strong className="text-white font-mono">{doc.clientId}</strong></span>
                        </div>
                        <div className="text-[7.5px] flex flex-wrap gap-x-2 gap-y-0.5 text-zinc-500 uppercase font-bold">
                          <span className={`px-1 py-0.2 border ${doc.visibility === "Public" ? "border-[#00E676]/20 text-[#00E676]" : "border-red-900/30 text-red-500"}`}>
                            {doc.visibility.toUpperCase()}
                          </span>
                          <span className={`px-1 py-0.2 border ${doc.isSigned === "Signed" ? "border-[#00E676]/20 text-[#00E676]" : "border-zinc-800 text-zinc-400"}`}>
                            {doc.isSigned.toUpperCase()}
                          </span>
                          <span className="text-zinc-400 font-mono">
                            EXP: {doc.expirationDate}
                          </span>
                        </div>
                        <div className="text-[7.5px] flex flex-wrap gap-x-2 gap-y-0.5 text-zinc-500 uppercase">
                          {doc.licenseId && <span>LIC: <strong className="text-zinc-400 font-mono">{doc.licenseId}</strong></span>}
                          {doc.clearanceId && <span>CLR: <strong className="text-zinc-400 font-mono">{doc.clearanceId}</strong></span>}
                          {doc.fragmentId && <span>FRAG: <strong className="text-zinc-400 font-mono">{doc.fragmentId}</strong></span>}
                          {doc.certificateId && <span>CERT: <strong className="text-zinc-400 font-mono">{doc.certificateId}</strong></span>}
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
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">DOCUMENT TYPE:</span>
                <span className="text-yellow-500 font-bold uppercase font-mono">{inspectingDoc.documentType}</span>
              </div>
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">VERSION:</span>
                <span className="text-zinc-300 font-mono">{inspectingDoc.version}</span>
              </div>
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">DATE ADDED:</span>
                <span className="text-zinc-300 font-mono">{inspectingDoc.dateAdded}</span>
              </div>
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">MINT DATE:</span>
                <span className="text-zinc-300 font-mono">{inspectingDoc.dateCreated}</span>
              </div>
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">VISIBILITY:</span>
                <span className={`uppercase font-bold ${inspectingDoc.visibility === "Public" ? "text-emerald-400" : "text-red-500"}`}>{inspectingDoc.visibility}</span>
              </div>
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">SIGNED / UNSIGNED:</span>
                <span className="text-zinc-300 uppercase font-mono">{inspectingDoc.isSigned}</span>
              </div>
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">EXPIRATION DATE:</span>
                <span className="text-zinc-300 font-mono">{inspectingDoc.expirationDate}</span>
              </div>
              <div>
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">SECTION:</span>
                <span className="text-[#D9D6CA] uppercase font-bold">{inspectingDoc.section}</span>
              </div>
              <div className="border-t border-zinc-900/60 pt-1">
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">COMPOSITION ID:</span>
                <span className="text-zinc-300 font-mono">{inspectingDoc.compositionId}</span>
              </div>
              <div className="border-t border-zinc-900/60 pt-1">
                <span className="text-zinc-600 text-[7.5px] uppercase block tracking-wider">CLIENT ID:</span>
                <span className="text-zinc-300 font-mono">{inspectingDoc.clientId}</span>
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

                  {/* Document Metadata Fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-500 uppercase block">DOCUMENT TYPE:</span>
                      <select
                        value={editingDocType}
                        onChange={(e: any) => setEditingDocType(e.target.value)}
                        className="w-full bg-black border border-zinc-850 text-white text-[9px] p-1.5 focus:outline-none focus:border-yellow-500"
                      >
                        <option value="Ownership Document">Ownership Document</option>
                        <option value="Split Sheet">Split Sheet</option>
                        <option value="Metadata Sheet">Metadata Sheet</option>
                        <option value="Sample Declaration">Sample Declaration</option>
                        <option value="No-Sample Warranty">No-Sample Warranty</option>
                        <option value="Producer Agreement">Producer Agreement</option>
                        <option value="Work-for-Hire Agreement">Work-for-Hire Agreement</option>
                        <option value="Clearance Record">Clearance Record</option>
                        <option value="Copyright Registration">Copyright Registration</option>
                        <option value="PRO Registration">PRO Registration</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-500 uppercase block">VERSION:</span>
                      <input
                        type="text"
                        value={editingVersion}
                        onChange={(e) => setEditingVersion(e.target.value)}
                        className="w-full bg-black border border-zinc-850 text-white text-[9px] p-1.5 focus:outline-none focus:border-yellow-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-500 uppercase block">DATE ADDED:</span>
                      <input
                        type="text"
                        value={editingDateAdded}
                        onChange={(e) => setEditingDateAdded(e.target.value)}
                        className="w-full bg-black border border-zinc-850 text-white text-[9px] p-1.5 focus:outline-none focus:border-yellow-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-500 uppercase block">VISIBILITY:</span>
                      <select
                        value={editingVisibility}
                        onChange={(e: any) => setEditingVisibility(e.target.value)}
                        className="w-full bg-black border border-zinc-850 text-white text-[9px] p-1.5 focus:outline-none focus:border-yellow-500"
                      >
                        <option value="Private">Private</option>
                        <option value="Authorized Only">Authorized Only</option>
                        <option value="Public">Public</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-500 uppercase block">SIGNED STATE:</span>
                      <select
                        value={editingIsSigned}
                        onChange={(e: any) => setEditingIsSigned(e.target.value)}
                        className="w-full bg-black border border-zinc-850 text-white text-[9px] p-1.5 focus:outline-none focus:border-yellow-500"
                      >
                        <option value="Signed">Signed</option>
                        <option value="Unsigned">Unsigned</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-500 uppercase block">EXPIRATION DATE:</span>
                      <input
                        type="text"
                        value={editingExpirationDate}
                        onChange={(e) => setEditingExpirationDate(e.target.value)}
                        className="w-full bg-black border border-zinc-850 text-white text-[9px] p-1.5 focus:outline-none focus:border-yellow-500 font-mono"
                      />
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

      {/* CLEARANCE REQUEST MODAL */}
      {showClearanceModal && clearanceDoc && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[220] flex items-center justify-center p-4 font-mono">
          <div className="w-full max-w-md bg-[#050505] border border-red-900/40 p-6 flex flex-col gap-4 shadow-2xl relative text-left">
            <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
              <div className="space-y-1">
                <span className="text-[8px] tracking-[0.25em] text-red-500 font-bold uppercase block flex items-center gap-1.5 animate-pulse">
                  <Lock size={10} className="text-red-500" />
                  [ SECURE ACCESS PROTOCOL REQ ]
                </span>
                <h4 className="text-white font-bold text-xs uppercase tracking-widest leading-tight truncate max-w-[280px]">
                  CLEARANCE REQUEST: {clearanceDoc.name}
                </h4>
                <div className="text-[8px] text-zinc-500">
                  DOCUMENT ID: {clearanceDoc.id}
                </div>
              </div>
              <button
                onClick={() => setShowClearanceModal(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs p-1"
              >
                ✕
              </button>
            </div>

            {clearanceSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 border border-[#00E676]/30 bg-[#00E676]/10 text-[#00E676] rounded-full flex items-center justify-center mx-auto text-sm font-bold animate-bounce">
                  ✓
                </div>
                <div className="text-[10px] text-[#00E676] font-bold uppercase tracking-wider">
                  CLEARANCE GRANTED // SYSTEM DE-REDACTED
                </div>
                <p className="text-[8.5px] text-zinc-500 uppercase leading-relaxed max-w-xs mx-auto">
                  Your identity has been temporarily authorized for access to document hash {clearanceDoc.id}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestClearanceSubmit} className="space-y-3.5">
                <div className="space-y-1 bg-red-950/5 border border-red-900/20 p-2.5">
                  <p className="text-zinc-400 text-[8px] uppercase leading-normal">
                    This file is restricted to authorized clients and administrators. To request emergency access, provide your email and legal justification. Entering the gateway passcode <code className="text-yellow-500 font-bold">LOMON-SECURE-2026</code> approves instantly.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[7.5px] text-zinc-500 uppercase block">EMAIL ADDRESS:</span>
                  <input
                    type="email"
                    required
                    placeholder="e.g. licensing@lomon.llc"
                    value={clearanceEmail}
                    onChange={(e) => setClearanceEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-900 focus:border-red-500/50 text-white font-mono p-2.5 text-[9px] uppercase outline-none placeholder-zinc-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[7.5px] text-zinc-500 uppercase block">JUSTIFICATION / REASON:</span>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Audit request for ownership validation split sheets..."
                    value={clearanceReason}
                    onChange={(e) => setClearanceReason(e.target.value)}
                    className="w-full bg-black border border-zinc-900 focus:border-red-500/50 text-white font-mono p-2.5 text-[9px] uppercase resize-none outline-none placeholder-zinc-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[7.5px] text-zinc-500 uppercase block">SECURE GATEWAY PASSCODE (OPTIONAL):</span>
                  <input
                    type="text"
                    placeholder="ENTER GATEWAY PASSCODE..."
                    value={clearancePasscode}
                    onChange={(e) => setClearancePasscode(e.target.value)}
                    className="w-full bg-black border border-zinc-900 focus:border-yellow-500/50 text-yellow-500 font-mono p-2.5 text-[9px] uppercase outline-none placeholder-zinc-800"
                  />
                </div>

                {clearanceError && (
                  <div className="text-red-500 font-bold uppercase text-[8px] tracking-wide">
                    ⚠️ {clearanceError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClearanceModal(false)}
                    className="flex-1 bg-[#0f0f0f] border border-zinc-900 hover:border-zinc-850 text-zinc-500 hover:text-zinc-300 font-bold text-[9px] tracking-widest uppercase py-2.5 transition-colors cursor-pointer rounded-none text-center"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-950 hover:bg-red-900 border border-red-900 text-white font-bold text-[9px] tracking-widest uppercase py-2.5 transition-colors cursor-pointer rounded-none text-center"
                  >
                    SUBMIT REQUEST
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
