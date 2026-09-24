import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Folder, FileText, Check, Plus, Trash2, Copy, Archive, Edit2, 
  Download, ExternalLink, Settings as SettingsIcon, Activity, Users, 
  ShoppingBag, Database, ArrowUpRight, BarChart3, Upload, Loader2, Play, 
  Pause, X, Search, Filter, ShieldCheck, Mail, RefreshCw, Layers, CheckCircle2,
  AlertCircle, Clock, DollarSign, FileCheck, Landmark, Lock, ArrowRight, ChevronRight,
  Eye, User, Key, Server, ArrowRightLeft, Send, Menu, Music, Sliders,
  HelpCircle, Shield, Award, Terminal, Cpu, FileSignature, CheckSquare, Hash
} from "lucide-react";
import { Fragment, FRAGMENTS, CLOCK_MEANINGS, getFragmentTimeName } from "../data";
import { 
  FullFragmentRecord, 
  getStoredFullFragments, 
  saveStoredFullFragments, 
  sanitizeToPublicCatalog,
  syncFragmentToBackend,
  deleteFragmentFromBackend,
  patchFragmentStatusOnBackend
} from "../lib/fragmentService";
import NewFragmentWizardModal from "./NewFragmentWizardModal";
import ScalewayUploader from "./ScalewayUploader";
import { DEFAULT_LICENSE_TEMPLATES, LicenseTemplate } from "../licenses";
import { 
  openOrDownloadLicenseAgreement,
  generateFullAgreementText,
  getScheduleAData,
  getScheduleBData,
  getLegalArticlesForTier,
  normalizeTierId,
  LicenseAgreementData 
} from "../lib/licenseAgreements";
import { playFragment, stopAudio } from "../audio";

// ============================================================================
// THE OWL CLOCK / LOMON — ADMIN / ARCHIVIST DASHBOARD
// Six Primary Sections:
// 01 — ARCHIVE
// 02 — CLEARANCE
// 03 — CLIENTS
// 04 — LICENSES
// 05 — TRANSACTIONS
// 06 — SYSTEM
// ============================================================================

export type AdminSection = 
  | "01_ARCHIVE"
  | "02_CLEARANCE"
  | "03_CLIENTS"
  | "04_LICENSES"
  | "05_TRANSACTIONS"
  | "06_SYSTEM";

export type ClearanceStatus = 
  | "NEW" 
  | "UNDER REVIEW" 
  | "ACTION REQUIRED" 
  | "APPROVED" 
  | "PAYMENT PENDING" 
  | "COMPLETED" 
  | "DECLINED";

export interface ClearanceRequestRecord {
  ref: string; // e.g. CLR-2026-0941
  fragmentId: string;
  fragmentName: string;
  clientId: string; // LOC-CLT-0014
  clientName: string;
  clientEmail: string;
  requestedLicense: string;
  status: ClearanceStatus;
  paymentStatus: "PAID" | "PAYMENT PENDING" | "REFUNDED" | "WAIVED";
  feeAmount: number;
  date: string;
  notes?: string;
  projectDescription?: string;
  historyLog?: { date: string; message: string; author: string }[];
  connectedLicenseId?: string;
  connectedTransactionId?: string;
}

export interface IssuedLicenseRecord {
  id: string; // e.g. TOC-LIC-2026-00481
  archiveIdentifier: string; // e.g. TOC-0941PM-001
  fragmentId: string;
  song: string; // Human-readable Fragment Name (e.g. 9:41 PM)
  clientName: string;
  clientEmail: string;
  clientId: string; // e.g. LOC-CLT-0014
  documentId: string; // e.g. LOC-DOC-0029
  type: string; // e.g. Commercial Exploitation ($1,000 USD)
  tierId: string;
  agreementVersion: string;
  status: "ACTIVE" | "EXCLUSIVELY TRANSFERRED" | "EXPIRED" | "REVOKED";
  executionStatus: "Fully Executed & Sealed" | "Signed" | "Pending Counter-signature";
  effectiveDate: string;
  purchaseDate: string;
  expirationDate: string;
  transactionRef: string; // Connected Transaction ID (e.g. LMN-TX-883102)
  certificateId: string; // e.g. TOC-CERT-00481
  hash: string;
  signature: string;
  isrc?: string;
  iswc?: string;
  masterOwnership?: string;
  publishingShare?: string;
}

export interface TransactionRecord {
  id: string; // e.g. LMN-TX-883102
  clientId: string;
  clientName: string;
  clientEmail: string;
  fragmentId: string;
  fragmentName: string;
  licenseType: string;
  amount: number;
  currency: string;
  paymentMethod: "PayPal" | "Stripe" | "Manual Wire" | "Crypto";
  paymentStatus: "Completed" | "Pending" | "Refunded" | "Failed";
  transactionDate: string;
  refundStatus: "None" | "Eligible" | "Refunded";
  connectedClearanceRef?: string;
  connectedLicenseId?: string;
  receiptUrl?: string;
}

export interface ClientProfile {
  id: string; // e.g. LOC-CLT-0014
  name: string;
  email: string;
  organization?: string;
  registeredDate: string;
  activeFragmentsCount: number;
  clearanceRequestsCount: number;
  totalSpent: number;
  status: "ACTIVE" | "VERIFIED" | "PENDING";
  location?: string;
}

interface AdminDashboardProps {
  onClose?: () => void;
  onOpenClient?: () => void;
  currentUserEmail: string;
}

const ADMIN_NAVIGATION_TABS = [
  { id: "01_ARCHIVE", label: "ARCHIVE", icon: Music, subtitle: "Master sound recordings and permanent fragment database." },
  { id: "02_CLEARANCE", label: "CLEARANCE", icon: ShieldCheck, subtitle: "Clearance petitions and approval workflows." },
  { id: "03_CLIENTS", label: "CLIENTS", icon: Users, subtitle: "Licensee directory, account dossiers, and spend ledger." },
  { id: "04_LICENSES", label: "LICENSES", icon: FileText, subtitle: "Issued digital agreements, covenants, and certificates." },
  { id: "05_TRANSACTIONS", label: "TRANSACTIONS", icon: Database, subtitle: "Commercial payment logs, PayPal ledger, and receipts." },
  { id: "06_SYSTEM", label: "SYSTEM", icon: Server, subtitle: "Legal contract templates, licensing schedules, and audit infrastructure." },
];

// Master Seed Records for Admin Single Source of Truth
const SEED_CLEARANCE_REQUESTS: ClearanceRequestRecord[] = [];

const DEMO_CLEARANCE_SAMPLE: ClearanceRequestRecord[] = [
  {
    ref: "CLR-2026-0941",
    fragmentId: "09:41",
    fragmentName: "9:41 PM",
    clientId: "LOC-CLT-0014",
    clientName: "Paramount Pictures / Sync Dept",
    clientEmail: "sync@paramount.com",
    requestedLicense: "Commercial Synchronization ($1,000 USD)",
    status: "APPROVED",
    paymentStatus: "PAID",
    feeAmount: 1000,
    date: "August 08, 2026",
    projectDescription: "Original trailer synchronization and broadcast campaign for upcoming feature film.",
    historyLog: [
      { date: "August 08, 2026 14:20 UTC", author: "SYSTEM", message: "Commercial license executed and sealed." },
      { date: "August 08, 2026 11:15 UTC", author: "ADMIN", message: "Clearance petition approved by Rights Registrar." },
      { date: "August 08, 2026 09:30 UTC", author: "CLIENT", message: "Petition submitted with multi-track stem request." }
    ],
    connectedLicenseId: "TOC-LIC-2026-00941",
    connectedTransactionId: "LMN-TX-941001"
  }
];

const SEED_LICENSES: IssuedLicenseRecord[] = [];

const SEED_TRANSACTIONS: TransactionRecord[] = [];

function normalizeRawLicense(raw: any, index: number): IssuedLicenseRecord {
  const song = raw.song || raw.fragmentName || raw.fragmentTitle || "Recovered Fragment";
  const email = (raw.clientEmail || raw.email || "client@lomon.local").toLowerCase().trim();
  const name = raw.clientName || raw.licenseeLegalName || raw.email || "Authorized Licensee";
  const id = raw.id || `TOC-LIC-${202600 + index}`;
  const archiveId = raw.archiveIdentifier || `TOC-${song.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001`;

  return {
    id,
    archiveIdentifier: archiveId,
    fragmentId: raw.fragmentId || "09:41",
    song,
    clientName: name,
    clientEmail: email,
    clientId: raw.clientId || `LOC-CLT-${1000 + index}`,
    documentId: raw.documentId || `LOC-DOC-${1000 + index}`,
    type: raw.type || raw.tierTitle || "Commercial Synchronization ($1,000 USD)",
    tierId: raw.tierId || "commercial",
    agreementVersion: raw.agreementVersion || "v2.4 - Standard Synchronization",
    status: raw.status || "ACTIVE",
    executionStatus: raw.executionStatus || "Fully Executed & Sealed",
    effectiveDate: raw.effectiveDate || raw.date || raw.purchaseDate || "August 2026",
    purchaseDate: raw.purchaseDate || raw.date || "August 2026",
    expirationDate: raw.expirationDate || "Perpetual / Worldwide",
    transactionRef: raw.transactionRef || `LMN-TX-${800000 + index}`,
    certificateId: raw.certificateId || `TOC-CERT-${1000 + index}`,
    hash: raw.hash || "0x" + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase(),
    signature: raw.signature || `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${email.toUpperCase()}`,
    isrc: raw.isrc || `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
    iswc: raw.iswc || `T-932.408.${Math.floor(100 + Math.random() * 900)}-1`,
    masterOwnership: raw.masterOwnership || "100% LOMON LLC",
    publishingShare: raw.publishingShare || "100% LOMON Publishing (BMI)"
  };
}

function normalizeRawRequest(raw: any, index: number): ClearanceRequestRecord {
  const fragName = raw.fragmentName || raw.target || "9:41 PM";
  const email = (raw.clientEmail || raw.email || "applicant@client.local").toLowerCase().trim();
  const name = raw.clientName || raw.email || "Authorized Licensee";
  const ref = raw.ref || `CLR-2026-${1000 + index}`;
  const fee = typeof raw.feeAmount === "number" ? raw.feeAmount : typeof raw.amount === "number" ? raw.amount : 1000;

  return {
    ref,
    fragmentId: raw.fragmentId || "09:41",
    fragmentName: fragName,
    clientId: raw.clientId || `LOC-CLT-${1000 + index}`,
    clientName: name,
    clientEmail: email,
    requestedLicense: raw.requestedLicense || raw.type || "Commercial Synchronization ($1,000 USD)",
    status: raw.status || "UNDER REVIEW",
    paymentStatus: raw.paymentStatus || (raw.status === "APPROVED" || raw.status === "COMPLETED" ? "PAID" : "PAYMENT PENDING"),
    feeAmount: fee,
    date: raw.date || "August 2026",
    notes: raw.notes || "",
    projectDescription: raw.projectDescription || raw.notes || "Commercial broadcast & streaming sync placement.",
    historyLog: Array.isArray(raw.historyLog) && raw.historyLog.length > 0 ? raw.historyLog : [
      { date: raw.date || "August 2026", author: "SYSTEM", message: "Petition received and logged into archive database." }
    ],
    connectedLicenseId: raw.connectedLicenseId,
    connectedTransactionId: raw.connectedTransactionId
  };
}

function normalizeRawTransaction(raw: any, index: number): TransactionRecord {
  const email = (raw.clientEmail || raw.email || "partner@client.local").toLowerCase().trim();
  const name = raw.clientName || raw.email || "Commercial Partner";
  const fragName = raw.fragmentName || (raw.items?.[0]?.name) || "9:41 PM";
  const numAmount = typeof raw.amount === "number" ? raw.amount : (parseFloat(raw.amount) || 1000);

  return {
    id: raw.id || `LMN-TX-${900000 + index}`,
    clientId: raw.clientId || `LOC-CLT-${1000 + index}`,
    clientName: name,
    clientEmail: email,
    fragmentId: raw.fragmentId || (raw.items?.[0]?.fragmentId) || "09:41",
    fragmentName: fragName,
    licenseType: raw.licenseType || (raw.items?.[0]?.tierTitle) || "Commercial Synchronization",
    amount: numAmount,
    currency: raw.currency || "USD",
    paymentMethod: raw.paymentMethod || (raw.gateway === "paypal" ? "PayPal" : "PayPal"),
    paymentStatus: raw.paymentStatus || (raw.status === "success" || raw.status === "COMPLETED" ? "Completed" : "Completed"),
    transactionDate: raw.transactionDate || raw.date || "August 2026",
    refundStatus: raw.refundStatus || "None",
    connectedClearanceRef: raw.connectedClearanceRef,
    connectedLicenseId: raw.connectedLicenseId
  };
}

export default function AdminDashboard({ onClose, onOpenClient, currentUserEmail }: AdminDashboardProps) {
  // Navigation State
  const [activeSection, setActiveSection] = useState<AdminSection>("01_ARCHIVE");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Global search & filter query
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Master Fragments State with Full CRUD & Sync support
  const [fullFragments, setFullFragments] = useState<FullFragmentRecord[]>(() => getStoredFullFragments());
  const [editingFragment, setEditingFragment] = useState<FullFragmentRecord | null>(null);
  const [showCreateFragmentModal, setShowCreateFragmentModal] = useState<boolean>(false);
  const [archiveFilterStatus, setArchiveFilterStatus] = useState<string>("ALL");

  // Keep public catalog fragments reactive
  const fragments = useMemo(() => {
    return fullFragments
      .filter(f => !f.deletedAt)
      .map(f => sanitizeToPublicCatalog(f));
  }, [fullFragments]);

  // Handle Create / Update Fragment from 6-Step Wizard
  const handleSaveFullFragment = async (record: FullFragmentRecord) => {
    setFullFragments(prev => {
      const idx = prev.findIndex(item => item.id === record.id);
      let updated: FullFragmentRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = record;
      } else {
        updated = [record, ...prev];
      }
      saveStoredFullFragments(updated);
      return updated;
    });

    // Also persist directly to backend API database
    syncFragmentToBackend(record);
  };

  // Quick Status Patch (draft / published / archived)
  const handleQuickStatusChange = (fragId: string, newStatus: "draft" | "published" | "archived") => {
    setFullFragments(prev => {
      const updated = prev.map(f => {
        if (f.id === fragId) {
          return {
            ...f,
            status: newStatus,
            syncStatus: newStatus === "published" ? "synced" : "pending",
            updatedAt: new Date().toISOString()
          };
        }
        return f;
      });
      saveStoredFullFragments(updated);
      return updated;
    });
    patchFragmentStatusOnBackend(fragId, newStatus);
  };

  // Delete Fragment (removes from active list & persists to localStorage and MongoDB)
  const handleSoftDeleteFragment = (fragId: string) => {
    setFullFragments(prev => {
      const updated = prev.filter(f => f.id !== fragId);
      saveStoredFullFragments(updated);
      return updated;
    });
    deleteFragmentFromBackend(fragId, true);
  };

  // Hard / Permanent Delete Fragment
  const handlePermanentDeleteFragment = (fragId: string) => {
    setFullFragments(prev => {
      const updated = prev.filter(f => f.id !== fragId);
      saveStoredFullFragments(updated);
      return updated;
    });
    deleteFragmentFromBackend(fragId, true);
  };

  // Duplicate Fragment
  const handleDuplicateFragment = (frag: FullFragmentRecord) => {
    const newId = `${frag.id}-COPY-${Math.floor(100 + Math.random() * 900)}`;
    const duplicated: FullFragmentRecord = {
      ...frag,
      id: newId,
      compositionId: `LOC-COMP-${newId.replace(/[^a-zA-Z0-9]/g, "")}`,
      compositionTitle: `${frag.compositionTitle} (Copy)`,
      fragmentTimestamp: `${frag.fragmentTimestamp} (Duplicate)`,
      status: "draft",
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    setFullFragments(prev => {
      const updated = [duplicated, ...prev];
      saveStoredFullFragments(updated);
      return updated;
    });
    syncFragmentToBackend(duplicated);
  };

  // Manual Sync Trigger
  const handleManualSync = (fragId: string) => {
    setFullFragments(prev => {
      const updated = prev.map(f => {
        if (f.id === fragId) {
          return {
            ...f,
            syncStatus: "synced" as const,
            updatedAt: new Date().toISOString()
          };
        }
        return f;
      });
      saveStoredFullFragments(updated);
      return updated;
    });
  };
  const [clearanceRequests, setClearanceRequests] = useState<ClearanceRequestRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lomon_admin_clearance_requests");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [licenses, setLicenses] = useState<IssuedLicenseRecord[]>(SEED_LICENSES);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(SEED_TRANSACTIONS);

  // New Clearance Petition State
  const [showCreateClearanceModal, setShowCreateClearanceModal] = useState<boolean>(false);
  const [newPetitionForm, setNewPetitionForm] = useState({
    fragmentId: "10:00",
    fragmentName: "10:00 PM",
    clientName: "",
    clientEmail: "",
    tier: "commercial",
    requestedLicense: "Commercial Synchronization ($1,000 USD)",
    feeAmount: 1000,
    status: "NEW",
    projectDescription: ""
  });

  const handleCreatePetition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetitionForm.clientName || !newPetitionForm.clientEmail) return;

    const newRecord: ClearanceRequestRecord = {
      ref: `CLR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      fragmentId: newPetitionForm.fragmentId,
      fragmentName: newPetitionForm.fragmentName,
      clientId: `LOC-CLT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: newPetitionForm.clientName,
      clientEmail: newPetitionForm.clientEmail,
      requestedLicense: newPetitionForm.requestedLicense,
      status: (newPetitionForm.status as any) || "NEW",
      paymentStatus: "PAYMENT PENDING",
      feeAmount: Number(newPetitionForm.feeAmount) || 1000,
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }),
      projectDescription: newPetitionForm.projectDescription || "Commercial fragment rights clearance petition.",
      historyLog: [
        {
          date: `${new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC`,
          author: "ADMIN",
          message: "Petition created and registered into archive clearance ledger."
        }
      ]
    };

    setClearanceRequests(prev => [newRecord, ...prev]);
    setShowCreateClearanceModal(false);
    setNewPetitionForm({
      fragmentId: "10:00",
      fragmentName: "10:00 PM",
      clientName: "",
      clientEmail: "",
      tier: "commercial",
      requestedLicense: "Commercial Synchronization ($1,000 USD)",
      feeAmount: 1000,
      status: "NEW",
      projectDescription: ""
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lomon_admin_clearance_requests", JSON.stringify(clearanceRequests));
    }
  }, [clearanceRequests]);

  // Fetch real data from backend endpoints on mount with safe normalization
  useEffect(() => {
    // 1. Fetch Fragments
    fetch("/api/fragments")
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.fragments) && data.fragments.length > 0) {
          // If server fragments returned, merge into fullFragments
          const serverConverted: FullFragmentRecord[] = data.fragments.map((f: any) => ({
            id: f.id,
            fragmentTimestamp: f.timestamp || f.name || f.id,
            compositionTitle: f.name || f.id,
            compositionId: f.timeCapsule?.catalogNo || `LOC-${f.id.replace(/[^a-zA-Z0-9]/g, "")}`,
            bpm: f.bpm || 108,
            key: f.tonalSignature || "C Minor",
            duration: f.duration || "03:00",
            genre: [f.classification || "Acoustic / Ambient Sound Recording"],
            mood: ["Atmospheric", "Reflective"],
            status: "published",
            availability: f.isExclusive ? "sold" : "available",
            archiveNote: f.observation || "",
            description: f.description || "",
            releaseDate: f.fullRecoveryDate || "2024-10-14",
            syncStatus: "synced",
            audioFiles: [
              {
                fileType: "publicPreviewMp3",
                fileName: `${(f.name || f.id).replace(/\s+/g, "_")}_Preview.mp3`,
                fileSize: 3145728,
                duration: 194,
                fileUrl: f.previewAudioUrl || f.audioUrl || "",
                uploadedAt: new Date().toISOString()
              }
            ],
            stemManifest: {
              stemCount: 6,
              fileNames: ["01_Drums.wav", "02_SubBass.wav", "03_Atmosphere.wav", "04_Keys.wav", "05_Harmonics.wav", "06_Transitions.wav"],
              totalSizeBytes: 142606336,
              format: "WAV / Lossless",
              sampleRate: "48.0 kHz",
              bitDepth: "24-bit"
            },
            documents: [],
            licenses: {
              mp3: { enabled: true, price: 150 },
              wav: { enabled: true, price: 350 },
              trackouts: { enabled: true, price: 650 },
              unlimited: { enabled: true, price: 1200 },
              exclusive: { enabled: !f.isExclusive, price: 4500 }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          setFullFragments(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const merged = [...prev];
            for (const s of serverConverted) {
              if (!existingIds.has(s.id)) {
                merged.push(s);
              }
            }
            saveStoredFullFragments(merged);
            return merged;
          });
        }
      })
      .catch(() => {});

    // 2. Fetch Clearance Requests
    fetch("/api/admin/clearance")
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.requests) && data.requests.length > 0) {
          const normalized = data.requests.map((r: any, i: number) => normalizeRawRequest(r, i));
          // Merge with seeds without duplicates
          setClearanceRequests(prev => {
            const existingRefs = new Set(prev.map(p => p.ref));
            const newOnes = normalized.filter((n: ClearanceRequestRecord) => !existingRefs.has(n.ref));
            return [...prev, ...newOnes];
          });
        }
      })
      .catch(() => {});

    // 3. Fetch Issued Licenses
    fetch("/api/admin/licenses")
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.licenses) && data.licenses.length > 0) {
          const normalized = data.licenses.map((l: any, i: number) => normalizeRawLicense(l, i));
          setLicenses(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = normalized.filter((n: IssuedLicenseRecord) => !existingIds.has(n.id));
            return [...prev, ...newOnes];
          });
        }
      })
      .catch(() => {});

    // 4. Fetch Transactions / Payments
    fetch("/api/admin/transactions")
      .then(res => res.json())
      .then(data => {
        const rawPayments = data?.payments || data?.transactions;
        if (data && data.success && Array.isArray(rawPayments) && rawPayments.length > 0) {
          const normalized = rawPayments.map((t: any, i: number) => normalizeRawTransaction(t, i));
          setTransactions(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = normalized.filter((n: TransactionRecord) => !existingIds.has(n.id));
            return [...prev, ...newOnes];
          });
        }
      })
      .catch(() => {});
  }, []);

  // System Configuration & Legal Templates
  const [systemConfig, setSystemConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("lomon_admin_system_config");
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
    return {
      storeName: "THE OWL CLOCK / LOMON ARCHIVE",
      jurisdiction: "Atlanta, Georgia",
      currency: "USD",
      paypalMode: "live",
      paypalActive: true,
      stripeActive: false,
      taxRate: 0,
      adminUsers: [
        { name: "Master Archivist", email: currentUserEmail || "evianaconcepts1@gmail.com", role: "Super Admin / Master Archivist", status: "Active" },
        { name: "Rights Compliance Manager", email: "rights@lomon.local", role: "Licensing Specialist", status: "Active" },
        { name: "Legal Counsel & Rights Registrar", email: "counsel@lomon.local", role: "Legal Reviewer", status: "Active" }
      ],
      auditLogs: [
        { date: "2026-08-19 18:40 UTC", event: "Master repository cryptographic handshake authenticated.", user: "SYSTEM" },
        { date: "2026-08-19 16:15 UTC", event: "Live PayPal merchant capture verified for clearance pipelines.", user: "ADMIN" },
        { date: "2026-08-18 10:30 UTC", event: "Automated license certificate sealing protocol active.", user: "SYSTEM" },
        { date: "2026-08-17 14:22 UTC", event: "Clearance petition logged for active fragment.", user: "CLIENT" }
      ]
    };
  });

  // Modal State for Inspecting Records
  const [selectedFragmentMaster, setSelectedFragmentMaster] = useState<Fragment | null>(null);
  const [selectedClearanceRequest, setSelectedClearanceRequest] = useState<ClearanceRequestRecord | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<IssuedLicenseRecord | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);

  // Sub-tabs for System section
  const [systemSubTab, setSystemSubTab] = useState<"TEMPLATES" | "CONFIG" | "COMMUNICATIONS" | "ADMINISTRATION" | "STORAGE">("TEMPLATES");

  // Audio Playback Preview State for Master Records
  const [playingFragmentId, setPlayingFragmentId] = useState<string | null>(null);

  // License inspection modal tabs & clipboard
  const [adminLicenseModalTab, setAdminLicenseModalTab] = useState<"overview" | "schedules" | "articles">("overview");
  const [copiedAdminContract, setCopiedAdminContract] = useState(false);

  useEffect(() => {
    localStorage.setItem("lomon_admin_system_config", JSON.stringify(systemConfig));
  }, [systemConfig]);

  // Derive Deduplicated Client Profiles
  const clientsList = useMemo<ClientProfile[]>(() => {
    const map = new Map<string, ClientProfile>();

    licenses.forEach(lic => {
      const email = (lic.clientEmail || (lic as any).email || "licensee@client.local").toLowerCase().trim();
      if (!map.has(email)) {
        map.set(email, {
          id: lic.clientId || `LOC-CLT-${Math.floor(1000 + Math.random() * 9000)}`,
          name: lic.clientName || email,
          email,
          organization: lic.clientName && lic.clientName !== email ? lic.clientName : "Independent Licensee",
          registeredDate: lic.purchaseDate || "August 2026",
          activeFragmentsCount: 0,
          clearanceRequestsCount: 0,
          totalSpent: 0,
          status: "VERIFIED",
          location: "Atlanta, GA / Remote"
        });
      }
    });

    clearanceRequests.forEach(req => {
      const email = (req.clientEmail || (req as any).email || "applicant@client.local").toLowerCase().trim();
      if (!map.has(email)) {
        map.set(email, {
          id: req.clientId || `LOC-CLT-${Math.floor(1000 + Math.random() * 9000)}`,
          name: req.clientName || email,
          email,
          organization: req.clientName && req.clientName !== email ? req.clientName : "Media Applicant",
          registeredDate: req.date || "August 2026",
          activeFragmentsCount: 0,
          clearanceRequestsCount: 0,
          totalSpent: 0,
          status: "ACTIVE",
          location: "United States"
        });
      }
    });

    transactions.forEach(tx => {
      const email = (tx.clientEmail || (tx as any).email || "partner@client.local").toLowerCase().trim();
      if (!map.has(email)) {
        map.set(email, {
          id: tx.clientId || `LOC-CLT-${Math.floor(1000 + Math.random() * 9000)}`,
          name: tx.clientName || email,
          email,
          organization: "Commercial Partner",
          registeredDate: tx.transactionDate || "August 2026",
          activeFragmentsCount: 0,
          clearanceRequestsCount: 0,
          totalSpent: 0,
          status: "VERIFIED",
          location: "Global"
        });
      }
    });

    const clients = Array.from(map.values());
    clients.forEach(c => {
      const userLics = licenses.filter(l => ((l.clientEmail || (l as any).email || "").toLowerCase().trim() === c.email));
      const userReqs = clearanceRequests.filter(r => ((r.clientEmail || (r as any).email || "").toLowerCase().trim() === c.email));
      const userTxs = transactions.filter(t => ((t.clientEmail || (t as any).email || "").toLowerCase().trim() === c.email));

      c.activeFragmentsCount = userLics.length;
      c.clearanceRequestsCount = userReqs.length;
      c.totalSpent = userTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
    });

    return clients;
  }, [licenses, clearanceRequests, transactions]);

  // Audio preview toggle using playFragment (plays actual uploaded audio if present)
  const handleTogglePlay = (frag: Fragment, directAudioUrl?: string) => {
    if (playingFragmentId === frag.id) {
      stopAudio();
      setPlayingFragmentId(null);
    } else {
      stopAudio();
      const rawSynth = frag.synthType || "keys";
      const validSynths = ["keys", "drone", "bell", "noise", "pulse"] as const;
      const synth: "keys" | "drone" | "bell" | "noise" | "pulse" = validSynths.includes(rawSynth as any)
        ? (rawSynth as "keys" | "drone" | "bell" | "noise" | "pulse")
        : "keys";
      const audioToPlay = directAudioUrl || frag.mp3Preview || frag.previewAudioUrl || frag.audioUrl;
      playFragment(frag.id, frag.frequency || 440, synth, audioToPlay);
      setPlayingFragmentId(frag.id);
    }
  };

  // Exclusive Acquisition Handler (Preserves Archive & provenance without deleting or renumbering)
  const handleAcquireExclusively = async (frag: Fragment, buyerName: string, buyerEmail: string, acquisitionPrice: number) => {
    const updatedFragment: Fragment = {
      ...frag,
      isExclusive: true,
      timeCapsule: {
        ...(frag.timeCapsule || {} as any),
        clearanceStatus: "EXCLUSIVELY ACQUIRED",
        masterControl: "EXCLUSIVE ASSIGNMENT TO BUYER",
        publishingControl: "EXCLUSIVE BUYER / LOMON CO-PUB"
      }
    };

    const newTxId = `LMN-TX-EX-${Math.floor(100000 + Math.random() * 900000)}`;
    const newLicId = `TOC-EX-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newCertId = `TOC-CERT-EX-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowFormatted = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const newTransaction: TransactionRecord = {
      id: newTxId,
      clientId: `LOC-CLT-EX-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: buyerName || "Exclusive Assignee",
      clientEmail: buyerEmail || "assignee@client.local",
      fragmentId: frag.id,
      fragmentName: frag.name,
      licenseType: "Exclusive Master Transfer",
      amount: acquisitionPrice || 5000,
      currency: "USD",
      paymentMethod: "PayPal",
      paymentStatus: "Completed",
      transactionDate: nowFormatted,
      refundStatus: "None",
      connectedLicenseId: newLicId
    };

    const newLicense: IssuedLicenseRecord = {
      id: newLicId,
      archiveIdentifier: `TOC-${frag.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-EX-001`,
      fragmentId: frag.id,
      song: frag.name,
      clientName: buyerName || "Exclusive Assignee",
      clientEmail: buyerEmail || "assignee@client.local",
      clientId: `LOC-CLT-EX-${Math.floor(1000 + Math.random() * 9000)}`,
      documentId: `LOC-DOC-EX-${Math.floor(1000 + Math.random() * 9000)}`,
      type: `Exclusive Master Transfer ($${(acquisitionPrice || 5000).toLocaleString()} USD)`,
      tierId: "exclusive",
      agreementVersion: "v2.4 - Exclusive Acquisition Covenants",
      status: "EXCLUSIVELY TRANSFERRED",
      executionStatus: "Fully Executed & Sealed",
      effectiveDate: nowFormatted,
      purchaseDate: nowFormatted,
      expirationDate: "Perpetual / Exclusive Worldwide",
      transactionRef: newTxId,
      certificateId: newCertId,
      hash: "0x" + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase(),
      signature: "EXCLUSIVE ARCHIVE ACQUISITION CONCLUDED",
      isrc: `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
      iswc: `T-932.408.${Math.floor(100 + Math.random() * 900)}-1`,
      masterOwnership: "100% Exclusive Assignee",
      publishingShare: "50% Assignee / 50% LOMON Co-Pub"
    };

    // Mark fragment exclusive in fullFragments
    setFullFragments(prev => {
      const updated = prev.map(f => {
        if (f.id === frag.id) {
          return {
            ...f,
            availability: "sold" as const,
            licenses: {
              ...f.licenses,
              exclusive: { ...f.licenses.exclusive, enabled: false }
            },
            updatedAt: new Date().toISOString()
          };
        }
        return f;
      });
      saveStoredFullFragments(updated);
      return updated;
    });
    setLicenses(prev => [newLicense, ...prev]);
    setTransactions(prev => [newTransaction, ...prev]);

    fetch(`/api/fragments/${frag.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFragment)
    }).catch(() => {});

    setSelectedFragmentMaster(updatedFragment);
  };

  const currentTabInfo = ADMIN_NAVIGATION_TABS.find(m => m.id === activeSection) || ADMIN_NAVIGATION_TABS[0];

  return (
    <div className="admin-dashboard font-poppins w-full min-h-screen bg-[#020202] text-[#D9D6CA] flex flex-col justify-between selection:bg-[#00E676]/20 selection:text-white" data-font="poppins">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER */}
      {/* ========================================================================= */}
      <header className="w-full border-b border-zinc-900 bg-[#040404] px-4 sm:px-6 py-2.5 flex items-center justify-between z-30 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-bold text-white font-mono tracking-widest uppercase">
            THE OWL CLOCK
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenClient && (
            <button
              onClick={onOpenClient}
              className="text-[10px] sm:text-xs text-zinc-300 hover:text-white uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 px-2.5 sm:px-3 py-1.5 rounded"
              title="Open Client Dashboard"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
              <span>CLIENT PORTAL</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="text-[10px] sm:text-xs text-zinc-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 sm:px-3 py-1.5 rounded"
            >
              <span>EXIT</span>
              <span className="text-zinc-400 font-bold">✕</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN SPLIT BODY WITH ICON DOCK & SLIDE-OUT DRAWER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* --------------------------------------------------------------------- */}
        {/* LEFT COLUMN: COMPACT ICON RAIL */}
        {/* --------------------------------------------------------------------- */}
        <aside className="w-14 sm:w-16 border-r border-zinc-900 bg-[#050505] py-4 px-2 flex flex-col items-center justify-between shrink-0 z-20 select-none">
          <div className="flex flex-col items-center gap-3.5 w-full">
            {/* Drawer Toggle Trigger */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              title={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
              className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer border ${
                drawerOpen
                  ? "bg-white text-black border-white shadow-sm"
                  : "bg-[#0c0c0c] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              <Menu size={18} />
            </button>

            <div className="w-6 h-[1px] bg-zinc-800/80" />

            {/* Quick Section Icons */}
            <div className="flex flex-col items-center gap-2.5 w-full">
              {ADMIN_NAVIGATION_TABS.map((item) => {
                const isActive = activeSection === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (!drawerOpen) {
                        setDrawerOpen(true);
                      } else {
                        setActiveSection(item.id as AdminSection);
                        setStatusFilter("ALL");
                        setSearchQuery("");
                        setDrawerOpen(false);
                      }
                    }}
                    title={item.label}
                    className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer relative border ${
                      isActive
                        ? "bg-white text-black border-white shadow-sm"
                        : "border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/70"
                    }`}
                  >
                    <IconComponent size={17} />
                    {isActive && (
                      <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-r" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Admin Shield Icon */}
          <button 
            className="w-10 h-10 rounded-md border border-zinc-900 bg-zinc-950/90 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
            title="Archivist Administration"
            onClick={() => {
              setActiveSection("06_SYSTEM");
              setDrawerOpen(false);
            }}
          >
            <ShieldCheck size={15} className="text-white" />
          </button>
        </aside>

        {/* --------------------------------------------------------------------- */}
        {/* SLIDE-OUT DRAWER OVERLAY (Closes immediately upon selecting a section) */}
        {/* --------------------------------------------------------------------- */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-30"
              />

              {/* Drawer Container */}
              <motion.div
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute left-14 sm:left-16 top-0 bottom-0 w-[260px] sm:w-[280px] bg-[#070707] border-r border-zinc-800/90 shadow-2xl z-40 p-4 flex flex-col justify-between overflow-y-auto"
              >
                <div className="space-y-4">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      ARCHIVIST MENU
                    </span>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Navigation List */}
                  <div className="space-y-1.5">
                    {ADMIN_NAVIGATION_TABS.map((item) => {
                      const isActive = activeSection === item.id;
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id as AdminSection);
                            setStatusFilter("ALL");
                            setSearchQuery("");
                            setDrawerOpen(false); // Auto-closes upon selection
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all cursor-pointer border ${
                            isActive
                              ? "bg-white text-black font-bold shadow-sm"
                              : "border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                          }`}
                        >
                          <IconComponent size={16} className={isActive ? "text-black" : "text-zinc-500"} />
                          <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-wider">{item.label}</span>
                            <span className="text-[9.5px] text-zinc-500 font-normal leading-tight line-clamp-1">{item.subtitle}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="pt-4 border-t border-zinc-900 space-y-2 text-[10px] text-zinc-500">
                  <div className="flex items-center justify-between">
                    <span>VAULT SECURITY:</span>
                    <span className="text-[#00E676] font-mono">SEALED</span>
                  </div>
                  <div className="text-zinc-600 text-[9px]">
                    Single source of truth archive database.
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* --------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: MAIN CONTENT WORKSPACE */}
        {/* --------------------------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-5 bg-[#030303]">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-900 pb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white uppercase tracking-wider">
                {currentTabInfo.label}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {currentTabInfo.subtitle}
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2">
              {activeSection === "01_ARCHIVE" && (
                <button
                  onClick={() => setShowCreateFragmentModal(true)}
                  className="bg-white hover:bg-zinc-200 text-black text-[10.5px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <Plus size={13} />
                  <span>CREATE NEW FRAGMENT</span>
                </button>
              )}
              {activeSection === "02_CLEARANCE" && (
                <button
                  onClick={() => setShowCreateClearanceModal(true)}
                  className="bg-white hover:bg-zinc-200 text-black text-[10.5px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <Plus size={13} />
                  <span>NEW CLEARANCE PETITION</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#080808] p-3 rounded-lg border border-zinc-800/80">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder={`Filter ${currentTabInfo.label.toLowerCase()} by name, id, or client...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter for Archive */}
            {activeSection === "01_ARCHIVE" && (
              <div className="flex flex-wrap items-center gap-1">
                {(["ALL", "published", "draft", "scheduled", "archived"] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setArchiveFilterStatus(st)}
                    className={`px-2.5 py-1 text-[9.5px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer border ${
                      archiveFilterStatus === st 
                        ? "bg-white border-white text-black font-bold shadow-sm" 
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
            {/* Status Filter for Clearance */}
            {activeSection === "02_CLEARANCE" && (
              <div className="flex flex-wrap items-center gap-1">
                {(["ALL", "NEW", "UNDER REVIEW", "ACTION REQUIRED", "APPROVED", "PAYMENT PENDING", "COMPLETED", "DECLINED"] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-[9.5px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer border ${
                      statusFilter === st 
                        ? "bg-white border-white text-black font-bold shadow-sm" 
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* SECTION 01: ARCHIVE (Master Database - Single Source of Truth) */}
          {/* ======================================================================= */}
          {activeSection === "01_ARCHIVE" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {fullFragments
                  .filter(f => !f.deletedAt)
                  .filter(f => {
                    if (archiveFilterStatus !== "ALL" && f.status !== archiveFilterStatus) return false;
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (f.fragmentTimestamp || "").toLowerCase().includes(q) ||
                      (f.id || "").toLowerCase().includes(q) ||
                      (f.compositionTitle || "").toLowerCase().includes(q) ||
                      (f.key || "").toLowerCase().includes(q) ||
                      (f.compositionId || "").toLowerCase().includes(q)
                    );
                  })
                  .map(fragRecord => {
                    const isPlaying = playingFragmentId === fragRecord.id;
                    const fragPublic = sanitizeToPublicCatalog(fragRecord);
                    const isExcl = fragRecord.availability === "sold" || !fragRecord.licenses.exclusive.enabled;
                    const bpm = fragRecord.bpm;
                    const tonal = fragRecord.key;
                    const duration = fragRecord.duration;
                    const recoveryState = fragRecord.status.toUpperCase();

                    return (
                      <div
                        key={fragRecord.id}
                        className="border border-zinc-800/90 rounded-lg bg-[#080808] p-4 sm:p-5 flex flex-col gap-3.5 shadow-lg hover:border-zinc-700/80 transition-all group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Primary Fragment Info */}
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-bold text-white text-sm sm:text-base uppercase tracking-wide">
                                {getFragmentTimeName(fragRecord.fragmentTimestamp || fragRecord.id)}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ({fragRecord.compositionId || `LOC-${fragRecord.id}`})
                              </span>
                              <span className="text-[10px] text-zinc-300 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                {fragRecord.compositionTitle}
                              </span>
                            </div>

                            {/* Metadata Line */}
                            <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-1.5 font-medium">
                              <span className="text-zinc-200">{tonal}</span>
                              <span className="text-zinc-600">·</span>
                              <span className="text-zinc-200">{bpm} BPM</span>
                              <span className="text-zinc-600">·</span>
                              <span className="text-zinc-200">{duration}</span>
                              <span className="text-zinc-600">·</span>
                              <span className="text-zinc-400">{fragRecord.audioFiles.length} Audio Files</span>
                              <span className="text-zinc-600">·</span>
                              <span className="text-zinc-400">
                                {fragRecord.stemManifest ? `${fragRecord.stemManifest.stemCount} Stems` : `${fragRecord.individualStems?.length || 0} Stems`}
                              </span>
                            </div>

                            {/* State, Availability & Sync Status Tags */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                              {/* Status Badge */}
                              <span className={`px-2 py-0.5 border rounded font-semibold uppercase tracking-wider ${
                                fragRecord.status === "published"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : fragRecord.status === "scheduled"
                                  ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                  : "bg-zinc-900 text-zinc-400 border-zinc-800"
                              }`}>
                                STATUS: {recoveryState}
                              </span>

                              {/* Availability Badge */}
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider rounded border ${
                                isExcl
                                  ? "border-zinc-700 text-zinc-300 bg-zinc-900"
                                  : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isExcl ? "bg-zinc-400" : "bg-emerald-400 animate-pulse"}`} />
                                {fragRecord.availability.toUpperCase()}
                              </span>

                              {/* Sync Status Badge */}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono border ${
                                fragRecord.syncStatus === "synced"
                                  ? "text-emerald-400 border-emerald-500/20 bg-emerald-950/20"
                                  : fragRecord.syncStatus === "failed"
                                  ? "text-red-400 border-red-500/30 bg-red-950/30"
                                  : "text-zinc-300 border-zinc-700 bg-zinc-900"
                              }`}>
                                <RefreshCw size={10} className={fragRecord.syncStatus === "pending" ? "animate-spin" : ""} />
                                <span>SYNC: {fragRecord.syncStatus?.toUpperCase() || "SYNCED"}</span>
                              </span>
                            </div>
                          </div>

                          {/* Actions Row */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0">
                            {/* Audio Preview Button */}
                            <button
                              onClick={() => {
                                const directAudio = fragRecord.audioFiles?.find(a => a.fileType === "publicPreviewMp3")?.fileUrl
                                  || fragRecord.audioFiles?.find(a => a.fileType === "untaggedPreview")?.fileUrl
                                  || fragRecord.audioFiles?.find(a => a.fileType === "licensedMp3")?.fileUrl
                                  || fragRecord.audioFiles?.find(a => a.fileType === "taggedPreview")?.fileUrl
                                  || fragRecord.audioFiles?.find(a => a.fileType === "masterWav")?.fileUrl
                                  || fragRecord.audioFiles?.find(a => a.fileType === "instrumental")?.fileUrl
                                  || fragRecord.audioFiles?.find(a => a.fileType === "alternateVersion")?.fileUrl
                                  || fragRecord.audioFiles?.[0]?.fileUrl;
                                handleTogglePlay(fragPublic, directAudio);
                              }}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border rounded-md text-[10.5px] uppercase font-bold tracking-wider cursor-pointer transition-all ${
                                isPlaying 
                                  ? "border-[#00E676] bg-[#00E676]/20 text-[#00E676] shadow-[0_0_12px_rgba(0,230,118,0.25)]" 
                                  : "border-zinc-800 bg-[#0c0c0c] text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-900"
                              }`}
                              title="Play audio preview"
                            >
                              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isPlaying ? "bg-[#00E676] text-black" : "bg-zinc-800 text-zinc-300"}`}>
                                {isPlaying ? <Pause size={8} /> : <Play size={8} className="ml-0.5" />}
                              </span>
                              <span>{isPlaying ? "STOP" : "PREVIEW"}</span>
                            </button>

                            {/* Quick Publish / Unpublish Toggle */}
                            <button
                              onClick={() => handleQuickStatusChange(fragRecord.id, fragRecord.status === "published" ? "draft" : "published")}
                              className={`px-3 py-1.5 border rounded-md text-[10.5px] uppercase font-bold tracking-wider cursor-pointer transition-all ${
                                fragRecord.status === "published"
                                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40"
                                  : "border-zinc-800 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800"
                              }`}
                            >
                              {fragRecord.status === "published" ? "UNPUBLISH" : "PUBLISH"}
                            </button>

                            {/* Edit in 6-Step Wizard */}
                            <button
                              onClick={() => {
                                setEditingFragment(fragRecord);
                                setShowCreateFragmentModal(true);
                              }}
                              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-md cursor-pointer transition-colors"
                              title="Edit in Wizard"
                            >
                              <Edit2 size={13} />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicateFragment(fragRecord)}
                              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-md cursor-pointer transition-colors"
                              title="Duplicate Fragment"
                            >
                              <Copy size={13} />
                            </button>

                            {/* Soft Delete */}
                            <button
                              onClick={() => handleSoftDeleteFragment(fragRecord.id)}
                              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded-md cursor-pointer transition-colors"
                              title="Soft Delete Fragment"
                            >
                              <Trash2 size={13} />
                            </button>

                            {/* Open Master Record Inspector */}
                            <button
                              onClick={() => setSelectedFragmentMaster(fragPublic)}
                              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-white font-bold text-[10.5px] px-3 py-1.5 rounded-md uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <span>RECORD</span>
                              <ArrowRight size={12} className="text-zinc-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* SECTION 02: CLEARANCE — ADMIN (Central Clearance Pipeline) */}
          {/* ======================================================================= */}
          {activeSection === "02_CLEARANCE" && (
            <div className="space-y-3">
              {(() => {
                const filtered = clearanceRequests.filter(req => {
                  if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    (req.fragmentName || "").toLowerCase().includes(q) ||
                    (req.clientName || "").toLowerCase().includes(q) ||
                    (req.clientEmail || "").toLowerCase().includes(q) ||
                    (req.ref || "").toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  if (clearanceRequests.length === 0) {
                    return (
                      <div className="p-8 sm:p-12 text-center bg-[#080808] border border-zinc-800/80 rounded-xl space-y-4 my-2">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-white">
                          <Shield size={22} />
                        </div>
                        <div className="space-y-1.5 max-w-md mx-auto">
                          <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                            NO ACTIVE CLEARANCE PETITIONS IN QUEUE
                          </h3>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            The clearance registry is online and operating. Submissions from the public <strong className="text-zinc-200">"Request Clearance"</strong> transmission portal and custom archivist agreements will automatically populate this ledger.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => setShowCreateClearanceModal(true)}
                            className="bg-white hover:bg-zinc-200 text-black text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-md cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                          >
                            <Plus size={14} />
                            <span>CREATE CLEARANCE PETITION</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-8 text-center bg-[#080808] border border-zinc-800/80 rounded-xl space-y-3">
                      <p className="text-xs text-zinc-400">
                        No clearance petitions match status "<span className="text-white font-bold">{statusFilter}</span>"{searchQuery ? ` or search "${searchQuery}"` : ""}.
                      </p>
                      <button
                        onClick={() => { setStatusFilter("ALL"); setSearchQuery(""); }}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10.5px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer"
                      >
                        RESET FILTERS
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-3">
                    {filtered.map(req => {
                      return (
                        <div
                          key={req.ref}
                          className="border border-zinc-800/90 rounded-lg bg-[#080808] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg hover:border-zinc-700/80 transition-all group"
                        >
                          {/* Primary Request Info: Fragment -> Client -> Requested License -> Status -> Payment */}
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm sm:text-base uppercase tracking-wide">
                                {getFragmentTimeName(req.fragmentName || req.ref)}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                ({req.ref})
                              </span>
                            </div>

                            <div className="text-xs text-zinc-300 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <div>
                                <span className="text-zinc-500 uppercase text-[10px]">Client:</span>{" "}
                                <strong className="text-zinc-100">{req.clientName || "Licensee"}</strong>{" "}
                                <span className="text-zinc-500 text-[10px]">({req.clientEmail})</span>
                              </div>
                              <span className="hidden sm:inline text-zinc-700">•</span>
                              <div>
                                <span className="text-zinc-500 uppercase text-[10px]">Request:</span>{" "}
                                <span className="text-zinc-200 font-medium">{req.requestedLicense}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider rounded border ${
                                req.status === "APPROVED" || req.status === "COMPLETED"
                                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                  : req.status === "DECLINED"
                                  ? "border-red-500/30 text-red-400 bg-red-500/10"
                                  : req.status === "PAYMENT PENDING"
                                  ? "border-zinc-700 text-zinc-300 bg-zinc-900"
                                  : "border-blue-500/30 text-blue-400 bg-blue-500/10"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  req.status === "APPROVED" || req.status === "COMPLETED"
                                    ? "bg-emerald-400 animate-pulse"
                                    : req.status === "PAYMENT PENDING"
                                    ? "bg-zinc-400 animate-pulse"
                                    : req.status === "DECLINED"
                                    ? "bg-red-400"
                                    : "bg-blue-400"
                                }`} />
                                STATUS: {req.status}
                              </span>

                              <span className="bg-zinc-950 text-[#00E676] px-2 py-0.5 border border-zinc-800 rounded font-bold uppercase tracking-wider">
                                FEE: ${(req.feeAmount || 0).toLocaleString()} USD
                              </span>

                              <span className="text-zinc-500 text-[10px]">
                                PETITION DATE: {req.date}
                              </span>
                            </div>
                          </div>

                          {/* Open Request Action */}
                          <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-900 flex items-center justify-end">
                            <button
                              onClick={() => setSelectedClearanceRequest(req)}
                              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-white font-bold text-[10.5px] px-4 py-2 rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm w-full sm:w-auto"
                            >
                              <span>OPEN REQUEST</span>
                              <ArrowRight size={13} className="text-zinc-300" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ======================================================================= */}
          {/* SECTION 03: CLIENTS — ADMIN (Account Directory & Dossiers) */}
          {/* ======================================================================= */}
          {activeSection === "03_CLIENTS" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {clientsList
                  .filter(client => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (client.name || "").toLowerCase().includes(q) ||
                      (client.email || "").toLowerCase().includes(q) ||
                      (client.id || "").toLowerCase().includes(q)
                    );
                  })
                  .map(client => {
                    return (
                      <div
                        key={client.id}
                        className="border border-zinc-800/90 rounded-lg bg-[#080808] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg hover:border-zinc-700/80 transition-all group"
                      >
                        {/* Primary Client List Format: CLIENT NAME, Email, Active Fragments, Clearance Requests */}
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm sm:text-base uppercase tracking-wide">
                              {client.name || client.email}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ({client.id})
                            </span>
                          </div>

                          <div className="text-xs text-zinc-400">
                            <span className="text-[#00E676] select-all font-medium">{client.email}</span>
                            {client.organization && client.organization !== client.name && (
                              <span className="text-zinc-500 ml-2">· {client.organization}</span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                            <div className="bg-zinc-950 px-2 py-0.5 border border-zinc-800 rounded text-zinc-300">
                              Active Fragments: <strong className="text-white ml-1">{client.activeFragmentsCount || 0}</strong>
                            </div>
                            <div className="bg-zinc-950 px-2 py-0.5 border border-zinc-800 rounded text-zinc-300">
                              Clearance Requests: <strong className="text-white ml-1">{client.clearanceRequestsCount || 0}</strong>
                            </div>
                            <div className="bg-zinc-950 px-2 py-0.5 border border-zinc-800 rounded text-zinc-300">
                              Total Spend: <strong className="text-[#00E676] ml-1">${(client.totalSpent || 0).toLocaleString()} USD</strong>
                            </div>
                          </div>
                        </div>

                        {/* Open Client Action */}
                        <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-900 flex items-center justify-end">
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-white font-bold text-[10.5px] px-4 py-2 rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm w-full sm:w-auto"
                          >
                            <span>OPEN CLIENT</span>
                            <ArrowRight size={13} className="text-zinc-300" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {clientsList.length === 0 && (
                  <div className="p-8 text-center bg-[#080808] border border-zinc-800/80 rounded-xl space-y-2">
                    <p className="text-xs text-zinc-400">
                      No client records found in database. Records are dynamically synchronized when licenses, clearances, or transactions are logged.
                    </p>
                  </div>
                )}

                {clientsList.length > 0 && clientsList.filter(client => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    (client.name || "").toLowerCase().includes(q) ||
                    (client.email || "").toLowerCase().includes(q) ||
                    (client.id || "").toLowerCase().includes(q)
                  );
                }).length === 0 && (
                  <div className="p-8 text-center bg-[#080808] border border-zinc-800/80 rounded-xl space-y-3">
                    <p className="text-xs text-zinc-400">
                      No client records match search "{searchQuery}".
                    </p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10.5px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer"
                    >
                      RESET SEARCH
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* SECTION 04: LICENSES — ADMIN (Issued Digital Covenants & Agreements) */}
          {/* ======================================================================= */}
          {activeSection === "04_LICENSES" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {licenses
                  .filter(lic => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (lic.song || "").toLowerCase().includes(q) ||
                      (lic.clientName || "").toLowerCase().includes(q) ||
                      (lic.clientEmail || "").toLowerCase().includes(q) ||
                      (lic.id || "").toLowerCase().includes(q) ||
                      (lic.type || "").toLowerCase().includes(q)
                    );
                  })
                  .map(lic => {
                    const cleanType = ((lic.type || "Commercial License").split("(")[0] || lic.type || "Commercial License").trim();
                    return (
                      <div
                        key={lic.id}
                        className="border border-zinc-800/90 rounded-lg bg-[#080808] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg hover:border-zinc-700/80 transition-all group"
                      >
                        {/* Primary View: Fragment -> Client -> License Type -> Status */}
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm sm:text-base uppercase tracking-wide">
                              {getFragmentTimeName(lic.song || lic.archiveIdentifier || lic.id)} — {cleanType}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ({lic.id})
                            </span>
                          </div>

                          <div className="text-xs text-zinc-300 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <div>
                              <span className="text-zinc-500 uppercase text-[10px]">Client:</span>{" "}
                              <strong className="text-zinc-100">{lic.clientName || "Licensee"}</strong>{" "}
                              <span className="text-zinc-500 text-[10px]">({lic.clientEmail})</span>
                            </div>
                            <span className="hidden sm:inline text-zinc-700">•</span>
                            <div className="text-zinc-400 text-[10.5px]">
                              Issued: <strong className="text-zinc-200">{lic.effectiveDate || lic.purchaseDate || "August 2026"}</strong>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {lic.status || "ACTIVE"}
                            </span>
                            <span className="bg-zinc-950 text-zinc-400 px-2 py-0.5 border border-zinc-800 rounded font-mono text-[9.5px]">
                              CERT: {lic.certificateId || "TOC-CERT"}
                            </span>
                            <span className="bg-zinc-950 text-zinc-400 px-2 py-0.5 border border-zinc-800 rounded font-mono text-[9.5px]">
                              TX: {lic.transactionRef || "LMN-TX"}
                            </span>
                          </div>
                        </div>

                        {/* Actions (Download PDF & Open License Record) */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-900">
                          <button
                            onClick={() => {
                              openOrDownloadLicenseAgreement({
                                licenseId: lic.id,
                                transactionRef: lic.transactionRef,
                                purchaseDate: lic.purchaseDate,
                                licenseeLegalName: lic.clientName,
                                licenseeEmail: lic.clientEmail,
                                fragmentTitle: lic.song,
                                archiveIdentifier: lic.archiveIdentifier,
                                licenseTierId: lic.tierId || "commercial",
                                licenseTierTitle: lic.type
                              });
                            }}
                            className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-[10.5px] px-3 py-2 rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Download Executed Agreement PDF"
                          >
                            <Download size={13} />
                            <span>PDF AGREEMENT</span>
                          </button>

                          <button
                            onClick={() => setSelectedLicense(lic)}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-white font-bold text-[10.5px] px-4 py-2 rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <span>OPEN LICENSE</span>
                            <ArrowRight size={13} className="text-zinc-300" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {licenses.length === 0 && (
                  <div className="p-8 text-center bg-[#080808] border border-zinc-800/80 rounded-xl space-y-2">
                    <p className="text-xs text-zinc-400">
                      No issued licenses in database. Licenses will appear here once executed via checkout or issued by admin.
                    </p>
                  </div>
                )}

                {licenses.length > 0 && licenses.filter(lic => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    (lic.song || "").toLowerCase().includes(q) ||
                    (lic.clientName || "").toLowerCase().includes(q) ||
                    (lic.clientEmail || "").toLowerCase().includes(q) ||
                    (lic.id || "").toLowerCase().includes(q) ||
                    (lic.type || "").toLowerCase().includes(q)
                  );
                }).length === 0 && (
                  <div className="p-8 text-center bg-[#080808] border border-zinc-800/80 rounded-xl space-y-3">
                    <p className="text-xs text-zinc-400">
                      No licenses match search "{searchQuery}".
                    </p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10.5px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer"
                    >
                      RESET SEARCH
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* SECTION 05: TRANSACTIONS (Financial Ledger & PayPal Records) */}
          {/* ======================================================================= */}
          {activeSection === "05_TRANSACTIONS" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {transactions
                  .filter(tx => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (tx.fragmentName || "").toLowerCase().includes(q) ||
                      (tx.clientName || "").toLowerCase().includes(q) ||
                      (tx.clientEmail || "").toLowerCase().includes(q) ||
                      (tx.id || "").toLowerCase().includes(q)
                    );
                  })
                  .map(tx => {
                    return (
                      <div
                        key={tx.id}
                        className="border border-zinc-800/90 rounded-lg bg-[#080808] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg hover:border-zinc-700/80 transition-all group"
                      >
                        {/* Connected Chain: Payment -> Client -> Fragment -> Clearance Request -> License */}
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm sm:text-base uppercase tracking-wide">
                              {getFragmentTimeName(tx.fragmentName || tx.id)}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ({tx.id})
                            </span>
                          </div>

                          <div className="text-xs text-zinc-300 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <div>
                              <span className="text-zinc-500 uppercase text-[10px]">Client:</span>{" "}
                              <strong className="text-zinc-100">{tx.clientName || "Client"}</strong>{" "}
                              <span className="text-zinc-500 text-[10px]">({tx.clientEmail})</span>
                            </div>
                            <span className="hidden sm:inline text-zinc-700">•</span>
                            <div>
                              <span className="text-zinc-500 uppercase text-[10px]">Tier:</span>{" "}
                              <span className="text-zinc-200">{tx.licenseType || "Commercial Synchronization"}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                            <span className="font-bold text-[#00E676] text-xs bg-zinc-950 px-2 py-0.5 border border-zinc-800 rounded">
                              ${(tx.amount || 0).toLocaleString()} {tx.currency || "USD"}
                            </span>

                            <span className="bg-zinc-950 text-zinc-300 px-2 py-0.5 border border-zinc-800 rounded font-semibold uppercase tracking-wider">
                              METHOD: {tx.paymentMethod || "PayPal"}
                            </span>

                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold uppercase rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                              STATUS: {tx.paymentStatus || "Completed"}
                            </span>

                            <span className="text-zinc-500 text-[10px]">
                              DATE: {tx.transactionDate || "August 2026"}
                            </span>
                          </div>
                        </div>

                        {/* Open Transaction Receipt Action */}
                        <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-900 flex items-center justify-end">
                          <button
                            onClick={() => setSelectedTransaction(tx)}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-white font-bold text-[10.5px] px-4 py-2 rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm w-full sm:w-auto"
                          >
                            <span>VIEW RECEIPT</span>
                            <ArrowRight size={13} className="text-zinc-300" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {transactions.length === 0 && (
                  <div className="p-8 text-center bg-[#080808] border border-zinc-800/80 rounded-xl space-y-2">
                    <p className="text-xs text-zinc-400">
                      No transaction records in database. Completed checkout payments and clearance orders will appear here automatically.
                    </p>
                  </div>
                )}

                {transactions.length > 0 && transactions.filter(tx => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    (tx.fragmentName || "").toLowerCase().includes(q) ||
                    (tx.clientName || "").toLowerCase().includes(q) ||
                    (tx.clientEmail || "").toLowerCase().includes(q) ||
                    (tx.id || "").toLowerCase().includes(q)
                  );
                }).length === 0 && (
                  <div className="p-8 text-center bg-[#080808] border border-zinc-800/80 rounded-xl space-y-3">
                    <p className="text-xs text-zinc-400">
                      No transactions match search "{searchQuery}".
                    </p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10.5px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer"
                    >
                      RESET SEARCH
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* SECTION 06: SYSTEM (Administrative Infrastructure & Legal Configuration) */}
          {/* ======================================================================= */}
          {activeSection === "06_SYSTEM" && (
            <div className="space-y-5">
              {/* System Subtabs */}
              <div className="flex flex-wrap border-b border-zinc-800 bg-[#060606] p-1 gap-1 rounded-t-lg">
                {(["TEMPLATES", "CONFIG", "COMMUNICATIONS", "ADMINISTRATION", "STORAGE"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSystemSubTab(tab)}
                    className={`px-4 py-2 text-[10.5px] uppercase font-bold tracking-wider cursor-pointer border rounded-t ${
                      systemSubTab === tab 
                        ? "bg-zinc-900 border-zinc-700 text-white shadow-sm" 
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab === "TEMPLATES" ? "DOCUMENT TEMPLATES" : tab === "CONFIG" ? "LICENSING CONFIGURATION" : tab === "STORAGE" ? "SCALEWAY S3 STORAGE" : tab}
                  </button>
                ))}
              </div>

              {/* TAB 1: DOCUMENT TEMPLATES */}
              {systemSubTab === "TEMPLATES" && (
                <div className="border border-zinc-800/80 rounded-lg bg-[#070707] p-5 space-y-4 shadow-xl">
                  <div className="text-white text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-2.5 flex items-center justify-between">
                    <span>MASTER LEGAL INSTRUMENTS &amp; CONTRACT COVENANTS</span>
                    <span className="text-[10px] text-[#00E676] font-mono">STANDARDIZED SCHEDULES ACTIVE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded space-y-2">
                      <div className="text-white font-bold text-xs flex items-center justify-between">
                        <span>01. COMMERCIAL SYNCHRONIZATION &amp; MASTER LICENSE</span>
                        <span className="text-[9.5px] text-zinc-400 font-mono">SCHEDULE A</span>
                      </div>
                      <p className="text-zinc-400 text-[10.5px] leading-relaxed">
                        Worldwide non-exclusive synchronization and master exploitation rights grant. Governs television, broadcast, OTT/streaming, podcast, advertising, and video game synchronization with complete stem warranties.
                      </p>
                      <div className="pt-2 flex items-center justify-between border-t border-zinc-900 text-[10px] text-zinc-500 font-mono">
                        <span>VERSION: v2.4 (2026 REVISION)</span>
                        <span className="text-zinc-400">JURISDICTION: GEORGIA, USA</span>
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded space-y-2">
                      <div className="text-white font-bold text-xs flex items-center justify-between">
                        <span>02. EXCLUSIVE MASTER ACQUISITION &amp; ASSIGNMENT</span>
                        <span className="text-[9.5px] text-zinc-400 font-mono">SCHEDULE EX</span>
                      </div>
                      <p className="text-zinc-400 text-[10.5px] leading-relaxed">
                        Full permanent assignment of sound recording copyright, uncompressed master multi-track stems, and co-publishing registration while permanently preserving historical archive chain of custody.
                      </p>
                      <div className="pt-2 flex items-center justify-between border-t border-zinc-900 text-[10px] text-zinc-500 font-mono">
                        <span>VERSION: v2.4 (EXCLUSIVE ACQUISITION)</span>
                        <span className="text-zinc-400">PERPETUAL WORLDWIDE</span>
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded space-y-2">
                      <div className="text-white font-bold text-xs flex items-center justify-between">
                        <span>03. COLLABORATION &amp; SPLIT-SHEET COVENANT</span>
                        <span className="text-[9.5px] text-zinc-400 font-mono">SCHEDULE C</span>
                      </div>
                      <p className="text-zinc-400 text-[10.5px] leading-relaxed">
                        Co-writer, co-producer, and sampling derivation covenants determining BMI/ASCAP share splits, publishing administration, and mechanical reproduction clearances.
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded space-y-2">
                      <div className="text-white font-bold text-xs flex items-center justify-between">
                        <span>04. CERTIFICATE OF PROVENANCE &amp; AUTHENTICITY</span>
                        <span className="text-[9.5px] text-zinc-400 font-mono">SCHEDULE CERT</span>
                      </div>
                      <p className="text-zinc-400 text-[10.5px] leading-relaxed">
                        Cryptographically sealed authenticity certificate bearing SHA-256 integrity hash, ISRC code, catalog serial, and archivist timestamp signature.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LICENSING CONFIGURATION */}
              {systemSubTab === "CONFIG" && (
                <div className="border border-zinc-800/80 rounded-lg bg-[#070707] p-5 space-y-4 shadow-xl">
                  <div className="text-white text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-2.5 flex items-center justify-between">
                    <span>LICENSING SCHEDULE, TIERS &amp; DELIVERABLES</span>
                    <span className="text-[10px] text-zinc-400 font-mono">FIRST EDITION CONTRACT ENGINE</span>
                  </div>

                  <div className="space-y-3 text-[11px]">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="bg-zinc-950 p-3.5 border border-zinc-800/80 rounded space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block">TIER 1: ARCHIVE ACCESS</span>
                        <div className="text-[#00E676] font-bold text-sm">$150.00 USD</div>
                        <p className="text-zinc-400 text-[10px]">Reference MP3 + Watermarked WAV + Non-commercial evaluation &amp; demo development rights.</p>
                      </div>

                      <div className="bg-zinc-950 p-3.5 border border-zinc-800/80 rounded space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block">TIER 2: COMMERCIAL RELEASE</span>
                        <div className="text-[#00E676] font-bold text-sm">$500.00 USD</div>
                        <p className="text-zinc-400 text-[10px]">Lossless Master WAV + Major DSP Distribution (Spotify/Apple Music) + 50/50 publishing split.</p>
                      </div>

                      <div className="bg-zinc-950 p-3.5 border border-zinc-800/80 rounded space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block">TIER 3: COMMERCIAL EXPLOITATION</span>
                        <div className="text-[#00E676] font-bold text-sm">$1,000.00 USD</div>
                        <p className="text-zinc-400 text-[10px]">Multi-track Production Stems + Unlimited streaming + Commercial video &amp; broadcast monetization.</p>
                      </div>

                      <div className="bg-zinc-950 p-3.5 border border-zinc-800/80 rounded space-y-1">
                        <span className="text-[9px] text-zinc-400 uppercase font-bold block">TIER 4: EXCLUSIVE ACQUISITION</span>
                        <div className="text-white font-bold text-sm">$5,000.00 USD</div>
                        <p className="text-zinc-400 text-[10px]">Complete Master assignment + DAW Project files + Permanent public archive removal.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COMMUNICATIONS */}
              {systemSubTab === "COMMUNICATIONS" && (
                <div className="border border-zinc-800/80 rounded-lg bg-[#070707] p-5 space-y-4 shadow-xl">
                  <div className="text-white text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-2.5">
                    TRANSMISSION &amp; EMAIL TEMPLATES
                  </div>
                  <div className="space-y-2.5 text-[11px]">
                    <div className="bg-zinc-950 p-3.5 border border-zinc-800/80 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-white font-bold text-xs">CLEARANCE PETITION CONFIRMATION</div>
                        <div className="text-zinc-400 text-[10px]">Triggered immediately when licensee submits clearance request.</div>
                      </div>
                      <span className="text-emerald-400 text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">
                        AUTOMATED (ACTIVE)
                      </span>
                    </div>

                    <div className="bg-zinc-950 p-3.5 border border-zinc-800/80 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-white font-bold text-xs">PAYPAL PAYMENT INVOICE &amp; CLEARANCE APPROVAL</div>
                        <div className="text-zinc-400 text-[10px]">Dispatches approved fee invoice with instant PayPal capture links.</div>
                      </div>
                      <span className="text-emerald-400 text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">
                        AUTOMATED (ACTIVE)
                      </span>
                    </div>

                    <div className="bg-zinc-950 p-3.5 border border-zinc-800/80 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-white font-bold text-xs">VAULT ACCESS &amp; EXECUTED AGREEMENT DELIVERY</div>
                        <div className="text-zinc-400 text-[10px]">Sends signed PDF license, authenticity certificate, and lossless stems download links.</div>
                      </div>
                      <span className="text-emerald-400 text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">
                        AUTOMATED (ACTIVE)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ADMINISTRATION */}
              {systemSubTab === "ADMINISTRATION" && (
                <div className="border border-zinc-800/80 rounded-lg bg-[#070707] p-5 space-y-4 shadow-xl">
                  <div className="text-white text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-2.5">
                    ARCHIVIST ACCESS ROLES &amp; AUDIT LOG
                  </div>

                  <div className="space-y-4 text-[11px]">
                    <div className="space-y-2">
                      <span className="text-zinc-400 font-bold uppercase text-[10px] block">ADMIN USERS:</span>
                      {systemConfig.adminUsers.map((user: any, idx: number) => (
                        <div key={idx} className="bg-zinc-950 p-3 border border-zinc-800/80 rounded flex items-center justify-between">
                          <div>
                            <div className="text-white font-bold">{user.name} ({user.email})</div>
                            <div className="text-zinc-500 text-[10px]">{user.role}</div>
                          </div>
                          <span className="border border-[#00E676]/40 bg-[#00E676]/10 text-[#00E676] px-2 py-0.5 text-[9.5px] font-bold rounded">
                            {user.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                      <span className="text-zinc-400 font-bold uppercase text-[10px] block">REAL-TIME AUDIT LOG:</span>
                      <div className="space-y-1.5 font-mono text-[10px]">
                        {systemConfig.auditLogs.map((log: any, idx: number) => (
                          <div key={idx} className="bg-zinc-950 p-2.5 border border-zinc-900 rounded flex items-center justify-between text-zinc-400">
                            <span>{log.event}</span>
                            <span className="text-zinc-500 text-[9px] shrink-0 ml-2">{log.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: STORAGE (SCALEWAY S3 PIPELINE VERIFICATION) */}
              {systemSubTab === "STORAGE" && (
                <div className="border border-zinc-800/80 rounded-lg bg-[#070707] p-5 space-y-4 shadow-xl">
                  <div className="text-white text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-2.5 flex items-center justify-between">
                    <span>SCALEWAY S3 OBJECT STORAGE — DIRECT PRESIGNED PIPELINE</span>
                    <span className="text-[10px] text-emerald-400 font-mono">200MB PAYLOAD CAPABLE • ACTIVE</span>
                  </div>

                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Test the direct-to-storage architecture. Files uploaded here generate a temporary 300s presigned PUT ticket via <code className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded">/api/upload-url</code> and stream raw binary payloads directly to Scaleway bucket <code className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded">owl</code>, bypassing Vercel serverless function limits.
                  </p>

                  <ScalewayUploader />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full border-t border-zinc-900 bg-[#040404] px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between text-zinc-500 z-30 shrink-0 gap-2 font-mono text-[10px]">
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left">
          <span className="text-[#D9D6CA] font-bold tracking-wider uppercase text-[10.5px]">THE OWL CLOCK</span>
          <span className="hidden sm:inline text-zinc-700">•</span>
          <span className="text-zinc-400 text-[9.5px]">Publishing • Rights Management • Licensing</span>
          <span className="hidden sm:inline text-zinc-700">•</span>
          <span className="text-zinc-400 text-[9.5px]">Atlanta, Georgia</span>
        </div>
        <div className="text-zinc-500 tracking-wider text-[9.5px]">
          © 2026 LOMON LLC
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 4. MODALS & DEEP RECORD INSPECTORS */}
      {/* ========================================================================= */}

      {/* MODAL 1: MASTER FRAGMENT RECORD (SECTION 01: ARCHIVE) */}
      <AnimatePresence>
        {selectedFragmentMaster && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-4xl bg-[#080808] border border-zinc-800 p-5 sm:p-6 shadow-2xl flex flex-col gap-5 text-left max-h-[90vh] overflow-y-auto rounded-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                    MASTER FRAGMENT RECORD
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white uppercase mt-0.5">
                    {getFragmentTimeName(selectedFragmentMaster.name || selectedFragmentMaster.id)}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedFragmentMaster(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Sub-Sections */}
              <div className="space-y-4 text-xs text-zinc-300">
                {/* 1. ARCHIVE DATA */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2.5">
                  <div className="text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between border-b border-zinc-900 pb-1.5">
                    <span>ARCHIVE DATA</span>
                    <span className="text-[#00E676] font-mono text-[10px]">TOC-{selectedFragmentMaster.id.replace(/[^a-zA-Z0-9]/g, "")}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Archive Identifier / Timestamp</span>
                      <strong className="text-white">TOC-{selectedFragmentMaster.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Tonal Signature</span>
                      <strong className="text-white">{selectedFragmentMaster.tonalSignature || "B Major"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Pulse / BPM</span>
                      <strong className="text-white">{selectedFragmentMaster.bpm || 103} BPM</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Duration</span>
                      <strong className="text-white">{selectedFragmentMaster.duration || "03:06"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Recovery State</span>
                      <strong className="text-emerald-400">{selectedFragmentMaster.recoveryState || "FULLY RECOVERED"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Archivist</span>
                      <strong className="text-white">{selectedFragmentMaster.archivist || "LOMON / Lead Archivist"}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. RECOVERY DATA */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2.5">
                  <div className="text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                    RECOVERY DATA
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Discovery Date</span>
                      <strong className="text-white">{selectedFragmentMaster.timeCapsule?.recoveryStamp || "May 19, 2026"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Full Recovery Date</span>
                      <strong className="text-white">{selectedFragmentMaster.fullRecoveryDate || selectedFragmentMaster.timeCapsule?.completionStamp || "August 08, 2026"}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. RIGHTS DATA */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2.5">
                  <div className="text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                    RIGHTS DATA
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Master Control %</span>
                      <strong className="text-white">{selectedFragmentMaster.isExclusive ? "Exclusive Assignee" : "100% LOMON LLC"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Composition Control %</span>
                      <strong className="text-white">100% LOMON Publishing (BMI)</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Original Composition</span>
                      <strong className="text-emerald-400">Yes (100% Original)</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Third-Party Material</span>
                      <strong className="text-zinc-300">No (Zero Encumbrances)</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Samples / Interpolations</span>
                      <strong className="text-zinc-300">No (None Registered)</strong>
                    </div>
                  </div>
                </div>

                {/* 4. AVAILABLE ASSETS */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2.5">
                  <div className="text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                    AVAILABLE ASSETS
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10.5px]">
                    <div className="p-2.5 bg-[#0a0a0a] border border-zinc-900 rounded text-center">
                      <span className="text-zinc-500 block text-[9px]">AUDIO</span>
                      <strong className="text-white block mt-0.5">MP3 (320kbps)</strong>
                      <span className="text-emerald-400 text-[9px] block">READY</span>
                    </div>
                    <div className="p-2.5 bg-[#0a0a0a] border border-zinc-900 rounded text-center">
                      <span className="text-zinc-500 block text-[9px]">BROADCAST</span>
                      <strong className="text-white block mt-0.5">24-bit WAV</strong>
                      <span className="text-emerald-400 text-[9px] block">READY</span>
                    </div>
                    <div className="p-2.5 bg-[#0a0a0a] border border-zinc-900 rounded text-center">
                      <span className="text-zinc-500 block text-[9px]">INSTRUMENTAL</span>
                      <strong className="text-white block mt-0.5">Master Track</strong>
                      <span className="text-emerald-400 text-[9px] block">READY</span>
                    </div>
                    <div className="p-2.5 bg-[#0a0a0a] border border-zinc-900 rounded text-center">
                      <span className="text-zinc-500 block text-[9px]">MULTI-TRACK</span>
                      <strong className="text-white block mt-0.5">Stems / Trackouts</strong>
                      <span className="text-emerald-400 text-[9px] block">READY</span>
                    </div>
                    <div className="p-2.5 bg-[#0a0a0a] border border-zinc-900 rounded text-center">
                      <span className="text-zinc-500 block text-[9px]">ARTWORK</span>
                      <strong className="text-white block mt-0.5">Cover Canvas</strong>
                      <span className="text-emerald-400 text-[9px] block">READY</span>
                    </div>
                  </div>
                </div>

                {/* 5. CLEARANCE DATA */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2.5">
                  <div className="text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                    <span>CLEARANCE DATA &amp; AVAILABILITY</span>
                    <span className={selectedFragmentMaster.isExclusive ? "text-white font-bold" : "text-emerald-400"}>
                      {selectedFragmentMaster.isExclusive ? "EXCLUSIVELY ACQUIRED" : "AVAILABLE FOR LICENSING"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] text-zinc-400">
                      Standard commercial, sync, and exclusive master transfer workflows are configured under Georgia jurisdiction.
                    </div>
                    {!selectedFragmentMaster.isExclusive && (
                      <button
                        onClick={() => {
                          const buyer = prompt("Enter Exclusive Buyer Legal Entity Name:", "Apex Global Media LLC");
                          const email = prompt("Enter Exclusive Buyer Email:", "licensing@apexmedia.io");
                          if (buyer && email) {
                            handleAcquireExclusively(selectedFragmentMaster, buyer, email, 5000);
                          }
                        }}
                        className="bg-white hover:bg-zinc-200 text-black font-bold text-[10px] px-3.5 py-2 rounded uppercase tracking-wider cursor-pointer shrink-0 shadow-sm"
                      >
                        EXECUTE EXCLUSIVE ACQUISITION ($5,000 USD)
                      </button>
                    )}
                  </div>
                </div>

                {/* 6. CONNECTED RECORDS (Single Source of Truth) */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2.5">
                  <div className="text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                    <span>CONNECTED RECORDS (RELATIONAL GRAPH)</span>
                    <span className="text-zinc-500 font-mono text-[10px]">SINGLE SOURCE OF TRUTH</span>
                  </div>

                  {/* Connected Clearance Requests */}
                  <div className="space-y-1.5">
                    <span className="text-zinc-400 font-semibold text-[10.5px]">Connected Clearance Requests:</span>
                    {clearanceRequests.filter(r => r.fragmentId === selectedFragmentMaster.id || r.fragmentName === selectedFragmentMaster.name).length === 0 ? (
                      <div className="text-zinc-600 text-[10px]">No active clearance petitions for this fragment.</div>
                    ) : (
                      clearanceRequests
                        .filter(r => r.fragmentId === selectedFragmentMaster.id || r.fragmentName === selectedFragmentMaster.name)
                        .map(cr => (
                          <div key={cr.ref} className="bg-[#0c0c0c] p-2 rounded border border-zinc-900 flex items-center justify-between text-[10.5px]">
                            <div>
                              <strong className="text-white">{cr.ref}</strong> — <span className="text-zinc-300">{cr.clientName}</span> ({cr.requestedLicense})
                            </div>
                            <span className="text-zinc-300 font-bold text-[10px]">{cr.status}</span>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Connected Licenses */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-zinc-400 font-semibold text-[10.5px]">Connected Issued Licenses:</span>
                    {licenses.filter(l => l.fragmentId === selectedFragmentMaster.id || l.song === selectedFragmentMaster.name).length === 0 ? (
                      <div className="text-zinc-600 text-[10px]">No licenses issued yet for this fragment.</div>
                    ) : (
                      licenses
                        .filter(l => l.fragmentId === selectedFragmentMaster.id || l.song === selectedFragmentMaster.name)
                        .map(lic => (
                          <div key={lic.id} className="bg-[#0c0c0c] p-2 rounded border border-zinc-900 flex items-center justify-between text-[10.5px]">
                            <div>
                              <strong className="text-white">{lic.id}</strong> — <span className="text-zinc-300">{lic.clientName}</span> ({lic.type})
                            </div>
                            <span className="text-emerald-400 font-bold text-[10px]">{lic.status}</span>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Connected Transactions */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-zinc-400 font-semibold text-[10.5px]">Connected Financial Transactions:</span>
                    {transactions.filter(t => t.fragmentId === selectedFragmentMaster.id || t.fragmentName === selectedFragmentMaster.name).length === 0 ? (
                      <div className="text-zinc-600 text-[10px]">No commercial payments recorded for this fragment.</div>
                    ) : (
                      transactions
                        .filter(t => t.fragmentId === selectedFragmentMaster.id || t.fragmentName === selectedFragmentMaster.name)
                        .map(tx => (
                          <div key={tx.id} className="bg-[#0c0c0c] p-2 rounded border border-zinc-900 flex items-center justify-between text-[10.5px]">
                            <div>
                              <strong className="text-white">{tx.id}</strong> — <span className="text-zinc-300">{tx.clientName}</span> (${tx.amount} {tx.currency})
                            </div>
                            <span className="text-[#00E676] font-bold text-[10px]">{tx.paymentStatus}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setSelectedFragmentMaster(null)}
                  className="bg-[#D9D6CA] hover:bg-white text-black font-bold text-xs px-5 py-2 rounded uppercase tracking-wider cursor-pointer"
                >
                  CLOSE MASTER RECORD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CLEARANCE PETITION REVIEW (SECTION 02: CLEARANCE) */}
      <AnimatePresence>
        {selectedClearanceRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-2xl bg-[#080808] border border-zinc-800 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto rounded-lg"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                    CLEARANCE PETITION REVIEW
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white uppercase mt-0.5">
                    {selectedClearanceRequest.ref} — {getFragmentTimeName(selectedClearanceRequest.fragmentName)}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedClearanceRequest(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-zinc-300">
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Applicant Client</span>
                      <strong className="text-white">{selectedClearanceRequest.clientName}</strong>
                      <div className="text-zinc-400 text-[10px] select-all">{selectedClearanceRequest.clientEmail}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Requested License Tier</span>
                      <strong className="text-white">{selectedClearanceRequest.requestedLicense}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Clearance Fee</span>
                      <strong className="text-[#00E676]">${(selectedClearanceRequest.feeAmount || 0).toLocaleString()} USD</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block">Current Status</span>
                      <strong className="text-white font-bold">{selectedClearanceRequest.status}</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-1.5">
                  <span className="text-zinc-500 uppercase text-[9.5px] font-bold block">PROJECT USE CASE &amp; DESCRIPTION</span>
                  <p className="text-zinc-200 text-[11px] leading-relaxed">
                    {selectedClearanceRequest.projectDescription || "Commercial sync campaign clearance for global multi-platform broadcasting."}
                  </p>
                </div>

                {/* History Log */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2">
                  <span className="text-zinc-500 uppercase text-[9.5px] font-bold block">CLEARANCE AUDIT &amp; DECISION TIMELINE</span>
                  <div className="space-y-1.5 text-[10px]">
                    {(selectedClearanceRequest.historyLog || []).map((h, i) => (
                      <div key={i} className="bg-[#0c0c0c] p-2 rounded border border-zinc-900 flex items-center justify-between text-zinc-400">
                        <span><strong className="text-zinc-200">{h.author}:</strong> {h.message}</span>
                        <span className="text-zinc-500 text-[9px] shrink-0 ml-2">{h.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Workflow */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setClearanceRequests(prev => prev.filter(r => r.ref !== selectedClearanceRequest.ref));
                    setSelectedClearanceRequest(null);
                  }}
                  className="border border-zinc-800 hover:border-red-800/60 text-zinc-500 hover:text-red-400 px-3 py-2 rounded text-[10.5px] uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>DELETE PETITION</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const updated: ClearanceRequestRecord = {
                        ...selectedClearanceRequest,
                        status: "DECLINED",
                        historyLog: [
                          ...(selectedClearanceRequest.historyLog || []),
                          {
                            date: `${new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC`,
                            author: "ADMIN",
                            message: "Clearance petition declined by Rights Registrar."
                          }
                        ]
                      };
                      setClearanceRequests(prev => prev.map(r => r.ref === selectedClearanceRequest.ref ? updated : r));
                      setSelectedClearanceRequest(updated);
                    }}
                    className="border border-red-900/80 hover:bg-red-950/30 text-red-400 px-3.5 py-2 rounded text-[10.5px] uppercase font-bold cursor-pointer transition-all"
                  >
                    DECLINE PETITION
                  </button>

                  <button
                    onClick={() => {
                      const updated: ClearanceRequestRecord = {
                        ...selectedClearanceRequest,
                        status: "ACTION REQUIRED",
                        historyLog: [
                          ...(selectedClearanceRequest.historyLog || []),
                          {
                            date: `${new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC`,
                            author: "ADMIN",
                            message: "Requested supplemental client production details and sync distribution scope."
                          }
                        ]
                      };
                      setClearanceRequests(prev => prev.map(r => r.ref === selectedClearanceRequest.ref ? updated : r));
                      setSelectedClearanceRequest(updated);
                    }}
                    className="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3.5 py-2 rounded text-[10.5px] uppercase font-bold cursor-pointer transition-all"
                  >
                    REQUEST ACTION
                  </button>

                  <button
                    onClick={() => {
                      const updated: ClearanceRequestRecord = {
                        ...selectedClearanceRequest,
                        status: "APPROVED",
                        paymentStatus: "PAYMENT PENDING",
                        historyLog: [
                          ...(selectedClearanceRequest.historyLog || []),
                          {
                            date: `${new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC`,
                            author: "ADMIN",
                            message: "Clearance approved. Rights clearance invoice and license agreement dispatched."
                          }
                        ]
                      };
                      setClearanceRequests(prev => prev.map(r => r.ref === selectedClearanceRequest.ref ? updated : r));
                      setSelectedClearanceRequest(updated);
                    }}
                    className="bg-[#00E676] hover:bg-[#00c864] text-black font-bold px-4 py-2 rounded text-[10.5px] uppercase tracking-wider cursor-pointer transition-all shadow-sm"
                  >
                    APPROVE &amp; ISSUE INVOICE
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE NEW CLEARANCE PETITION */}
      <AnimatePresence>
        {showCreateClearanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-xl bg-[#080808] border border-zinc-800 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto rounded-lg"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                    MANUAL CLEARANCE LOG
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white uppercase mt-0.5">
                    CREATE CLEARANCE PETITION
                  </h2>
                </div>
                <button
                  onClick={() => setShowCreateClearanceModal(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePetition} className="space-y-4 text-xs">
                {/* Fragment selection */}
                <div>
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1">
                    TARGET RECOVERED FRAGMENT
                  </label>
                  <select
                    value={newPetitionForm.fragmentId}
                    onChange={(e) => {
                      const selFrag = fragments.find(f => f.id === e.target.value);
                      setNewPetitionForm(prev => ({
                        ...prev,
                        fragmentId: e.target.value,
                        fragmentName: selFrag ? selFrag.name : `${e.target.value} PM`
                      }));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                  >
                    {fragments.map(f => (
                      <option key={f.id} value={f.id}>
                        {getFragmentTimeName(f.name || f.id)} — (TOC-{(f.id || "001").replace(/[^a-zA-Z0-9]/g, "")})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1">
                      APPLICANT / PRODUCTION CO.
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Warner Bros / Sound Dept"
                      value={newPetitionForm.clientName}
                      onChange={(e) => setNewPetitionForm(prev => ({ ...prev, clientName: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 placeholder-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1">
                      CLIENT CONTACT EMAIL
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. licensing@studio.com"
                      value={newPetitionForm.clientEmail}
                      onChange={(e) => setNewPetitionForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 placeholder-zinc-700"
                    />
                  </div>
                </div>

                {/* License Tier & Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1">
                      REQUESTED LICENSE TIER
                    </label>
                    <select
                      value={newPetitionForm.tier}
                      onChange={(e) => {
                        const tier = e.target.value;
                        let fee = 1000;
                        let label = "Commercial Synchronization ($1,000 USD)";
                        if (tier === "archive") {
                          fee = 150;
                          label = "Archive Access License ($150 USD)";
                        } else if (tier === "commercial_release") {
                          fee = 500;
                          label = "Commercial Release License ($500 USD)";
                        } else if (tier === "exclusive") {
                          fee = 5000;
                          label = "Exclusive Archive Acquisition ($5,000 USD)";
                        }
                        setNewPetitionForm(prev => ({
                          ...prev,
                          tier,
                          requestedLicense: label,
                          feeAmount: fee
                        }));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                    >
                      <option value="archive">Archive Access ($150 USD)</option>
                      <option value="commercial_release">Commercial Release ($500 USD)</option>
                      <option value="commercial">Commercial Synchronization ($1,000 USD)</option>
                      <option value="exclusive">Exclusive Acquisition ($5,000 USD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1">
                      CLEARANCE FEE (USD)
                    </label>
                    <input
                      type="number"
                      value={newPetitionForm.feeAmount}
                      onChange={(e) => setNewPetitionForm(prev => ({ ...prev, feeAmount: Number(e.target.value) }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>

                {/* Project Description */}
                <div>
                  <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1">
                    PROJECT USE CASE &amp; SYNC SPECIFICATIONS
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the media production, distribution channels, and stem asset requirements..."
                    value={newPetitionForm.projectDescription}
                    onChange={(e) => setNewPetitionForm(prev => ({ ...prev, projectDescription: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 placeholder-zinc-700 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateClearanceModal(false)}
                    className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 px-4 py-2 rounded uppercase font-bold text-[10.5px] cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="bg-white hover:bg-zinc-200 text-black font-bold px-5 py-2 rounded uppercase tracking-wider text-[10.5px] cursor-pointer transition-all shadow-md"
                  >
                    LOG &amp; QUEUE PETITION
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: CLIENT RECORD (SECTION 03: CLIENTS) */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-3xl bg-[#080808] border border-zinc-800 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto rounded-lg"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                    CLIENT DOSSIER &amp; ACCOUNT RECORD
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white uppercase mt-0.5">
                    {selectedClient.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs text-zinc-300">
                {/* 1. PROFILE */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2">
                  <span className="text-zinc-500 uppercase text-[9.5px] font-bold block">PROFILE &amp; IDENTITY</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Client ID</span>
                      <strong className="text-white">{selectedClient.id}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Email</span>
                      <strong className="text-[#00E676] select-all">{selectedClient.email}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Status</span>
                      <strong className="text-emerald-400">{selectedClient.status}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Registered Date</span>
                      <strong className="text-white">{selectedClient.registeredDate}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Total Spend</span>
                      <strong className="text-[#00E676]">${(selectedClient.totalSpent || 0).toLocaleString()} USD</strong>
                    </div>
                  </div>
                </div>

                {/* 2. FRAGMENTS ASSOCIATED */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2">
                  <span className="text-zinc-500 uppercase text-[9.5px] font-bold block">ASSOCIATED FRAGMENTS</span>
                  <div className="space-y-1.5 text-[11px]">
                    {licenses.filter(l => l.clientEmail.toLowerCase() === selectedClient.email.toLowerCase()).length === 0 ? (
                      <div className="text-zinc-600 text-[10.5px]">No active licensed fragments associated with this account.</div>
                    ) : (
                      licenses
                        .filter(l => l.clientEmail.toLowerCase() === selectedClient.email.toLowerCase())
                        .map(lic => (
                          <div key={lic.id} className="bg-[#0c0c0c] p-2.5 rounded border border-zinc-900 flex items-center justify-between">
                            <div>
                              <strong className="text-white">{lic.song}</strong> — <span className="text-zinc-400">{lic.type}</span>
                            </div>
                            <span className="text-emerald-400 font-mono text-[10px]">{lic.status}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* 3. CLEARANCE HISTORY */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2">
                  <span className="text-zinc-500 uppercase text-[9.5px] font-bold block">CLEARANCE HISTORY</span>
                  <div className="space-y-1.5 text-[11px]">
                    {clearanceRequests.filter(r => r.clientEmail.toLowerCase() === selectedClient.email.toLowerCase()).length === 0 ? (
                      <div className="text-zinc-600 text-[10.5px]">No clearance requests submitted by this client.</div>
                    ) : (
                      clearanceRequests
                        .filter(r => r.clientEmail.toLowerCase() === selectedClient.email.toLowerCase())
                        .map(req => (
                          <div key={req.ref} className="bg-[#0c0c0c] p-2.5 rounded border border-zinc-900 flex items-center justify-between">
                            <div>
                              <strong className="text-white">{req.ref}</strong> — <span className="text-zinc-300">{req.fragmentName}</span> ({req.requestedLicense})
                            </div>
                            <span className="text-zinc-300 font-bold text-[10px]">{req.status}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* 4. TRANSACTIONS */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2">
                  <span className="text-zinc-500 uppercase text-[9.5px] font-bold block">TRANSACTIONS &amp; PAYMENTS</span>
                  <div className="space-y-1.5 text-[11px]">
                    {transactions.filter(t => t.clientEmail.toLowerCase() === selectedClient.email.toLowerCase()).length === 0 ? (
                      <div className="text-zinc-600 text-[10.5px]">No payment records for this account.</div>
                    ) : (
                      transactions
                        .filter(t => t.clientEmail.toLowerCase() === selectedClient.email.toLowerCase())
                        .map(tx => (
                          <div key={tx.id} className="bg-[#0c0c0c] p-2.5 rounded border border-zinc-900 flex items-center justify-between">
                            <div>
                              <strong className="text-white">{tx.id}</strong> — <span className="text-zinc-300">{tx.fragmentName}</span> (${tx.amount} {tx.currency})
                            </div>
                            <span className="text-[#00E676] font-bold text-[10px]">{tx.paymentStatus}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setSelectedClient(null)}
                  className="bg-[#D9D6CA] hover:bg-white text-black font-bold text-xs px-5 py-2 rounded uppercase tracking-wider cursor-pointer"
                >
                  CLOSE DOSSIER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: LICENSE RECORD (SECTION 04: LICENSES) */}
      <AnimatePresence>
        {selectedLicense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-3xl bg-[#080808] border border-zinc-800 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto rounded-lg"
            >
              {(() => {
                const normalizedTier = normalizeTierId(selectedLicense.tierId || selectedLicense.type);
                const licenseData: LicenseAgreementData = {
                  licenseId: selectedLicense.id,
                  transactionRef: selectedLicense.transactionRef || "LMN-TX-VAULT",
                  purchaseDate: selectedLicense.purchaseDate || selectedLicense.effectiveDate || "August 2026",
                  licenseeLegalName: selectedLicense.clientName || "Authorized Licensee",
                  licenseeEmail: selectedLicense.clientEmail || "licensee@lomon.local",
                  fragmentTitle: selectedLicense.song,
                  archiveIdentifier: selectedLicense.archiveIdentifier,
                  licenseTierId: selectedLicense.tierId || normalizedTier,
                  licenseTierTitle: selectedLicense.type,
                  price: selectedLicense.type.includes("5,000") ? 5000 : selectedLicense.type.includes("1,000") ? 1000 : selectedLicense.type.includes("500") ? 500 : 150
                };

                const schedA = getScheduleAData(licenseData);
                const schedB = getScheduleBData(licenseData);
                const legalTier = getLegalArticlesForTier(normalizedTier);

                const handleCopyContract = () => {
                  const fullText = generateFullAgreementText(licenseData);
                  navigator.clipboard.writeText(fullText);
                  setCopiedAdminContract(true);
                  setTimeout(() => setCopiedAdminContract(false), 2500);
                };

                const handleDownloadPdf = () => {
                  openOrDownloadLicenseAgreement(licenseData);
                };

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-zinc-800 pb-3.5">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono font-bold tracking-widest text-[#00E676] uppercase bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-[2px]">
                            {schedA.licenseFee}
                          </span>
                          <span className="text-[10px] text-zinc-300 font-mono font-bold tracking-widest uppercase">
                            {selectedLicense.status || "ACTIVE"}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-white uppercase font-sans">
                          {getFragmentTimeName(selectedLicense.song || selectedLicense.id)} — {selectedLicense.id}
                        </h2>
                        <p className="text-zinc-400 text-xs font-mono mt-0.5">
                          Grantee: <strong className="text-white">{selectedLicense.clientName}</strong> ({selectedLicense.clientEmail})
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLicense(null);
                          setAdminLicenseModalTab("overview");
                        }}
                        className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800/60 transition-colors cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-zinc-800 text-[11px] font-mono uppercase tracking-wider gap-1">
                      <button
                        onClick={() => setAdminLicenseModalTab("overview")}
                        className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                          adminLicenseModalTab === "overview"
                            ? "border-[#D9D6CA] text-white"
                            : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Vault Registry
                      </button>
                      <button
                        onClick={() => setAdminLicenseModalTab("schedules")}
                        className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                          adminLicenseModalTab === "schedules"
                            ? "border-[#D9D6CA] text-white"
                            : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Schedules A &amp; B
                      </button>
                      <button
                        onClick={() => setAdminLicenseModalTab("articles")}
                        className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                          adminLicenseModalTab === "articles"
                            ? "border-[#D9D6CA] text-white"
                            : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Legal Articles (1–7)
                      </button>
                    </div>

                    {/* Modal Tab Content */}
                    <div className="space-y-3.5 text-xs text-zinc-300 max-h-[50vh] overflow-y-auto pr-1">
                      {adminLicenseModalTab === "overview" && (
                        <div className="space-y-3">
                          <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2.5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">License ID</span>
                                <strong className="text-white">{selectedLicense.id}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">Archive Identifier</span>
                                <strong className="text-white">{selectedLicense.archiveIdentifier}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">Client / Grantee</span>
                                <strong className="text-white">{selectedLicense.clientName}</strong>
                                <div className="text-zinc-400 text-[10px]">{selectedLicense.clientEmail}</div>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">Client ID &amp; Document ID</span>
                                <strong className="text-zinc-300">{selectedLicense.clientId} • {selectedLicense.documentId}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">License Type</span>
                                <strong className="text-emerald-400">{selectedLicense.type}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">Agreement Version</span>
                                <strong className="text-white">{selectedLicense.agreementVersion || schedB.contractVersion}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">Execution Status</span>
                                <strong className="text-emerald-400">{selectedLicense.executionStatus || "Fully Executed & Sealed"}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">Effective Date</span>
                                <strong className="text-white">{selectedLicense.effectiveDate || selectedLicense.purchaseDate}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">Transaction ID</span>
                                <strong className="text-[#00E676]">{selectedLicense.transactionRef}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">Certificate ID</span>
                                <strong className="text-white">{selectedLicense.certificateId || "TOC-CERT-VAULT"}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">ISRC &amp; ISWC</span>
                                <strong className="text-zinc-300">{selectedLicense.isrc || "US-LMN-26-XXXXX"} • {selectedLicense.iswc || "T-932.408.XXX-X"}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase text-[9px] block">Expiration / Term</span>
                                <strong className="text-zinc-300">{selectedLicense.expirationDate || "Perpetual / Worldwide"}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-1.5">
                            <span className="text-zinc-500 uppercase text-[9px] font-bold block">CRYPTOGRAPHIC INTEGRITY HASH (SHA-256)</span>
                            <div className="text-[#00E676] text-[10px] break-all select-all font-mono">
                              {selectedLicense.hash || "0xE5A3F1C9D7B5E3A1F9D7B5E3A1F9D7B5"}
                            </div>
                          </div>
                        </div>
                      )}

                      {adminLicenseModalTab === "schedules" && (
                        <div className="space-y-4">
                          {/* Schedule A Table */}
                          <div className="border border-zinc-800 rounded-[4px] overflow-hidden bg-zinc-950/60">
                            <div className="bg-zinc-900/80 px-3 py-2 border-b border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 tracking-wider uppercase">
                              SCHEDULE A: TRANSACTION &amp; LICENSED ASSET
                            </div>
                            <div className="divide-y divide-zinc-900 text-[11px]">
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Licensor:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedA.licensor}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">License Tier:</span>
                                <span className="col-span-2 text-[#00E676] font-bold">{schedA.licenseTier}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Delivery Package:</span>
                                <span className="col-span-2 text-zinc-200">{schedA.deliveryPackage}</span>
                              </div>
                              {schedA.catalogStatus && (
                                <div className="grid grid-cols-3 p-2.5">
                                  <span className="text-zinc-500 font-mono">Catalog Status:</span>
                                  <span className="col-span-2 text-zinc-300 font-mono">{schedA.catalogStatus}</span>
                                </div>
                              )}
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Permitted Scope:</span>
                                <div className="col-span-2 space-y-1 text-zinc-300">
                                  {schedA.permittedScope.map((scopeItem, i) => (
                                    <div key={i} className="flex items-start gap-1.5">
                                      <span className="text-[#00E676] font-bold">•</span>
                                      <span>{scopeItem}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Schedule B Table */}
                          <div className="border border-zinc-800 rounded-[4px] overflow-hidden bg-zinc-950/60">
                            <div className="bg-zinc-900/80 px-3 py-2 border-b border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 tracking-wider uppercase">
                              SCHEDULE B: OWNERSHIP, PRO &amp; PUBLISHING SPLITS
                            </div>
                            <div className="divide-y divide-zinc-900 text-[11px]">
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Licensor Legal Entity:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.licensorEntity}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Master Ownership:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.masterOwnership}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Publishing Split:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.publishingShare}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Writer Split:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.writerShare}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Content ID:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.contentIdRegistration}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Exclusivity:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.exclusivity}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Licensor PRO:</span>
                                <span className="col-span-2 text-zinc-200 font-medium">{schedB.licensorPro}</span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Licensor Writer &amp; IPI:</span>
                                <span className="col-span-2 text-zinc-200 font-mono text-[10.5px]">
                                  {schedB.licensorWriterName} <span className="text-zinc-400 font-sans">• IPI:</span> <span className="text-[#00E676]">{schedB.licensorWriterIpi}</span>
                                </span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Licensor Publisher &amp; IPI:</span>
                                <span className="col-span-2 text-zinc-200 font-mono text-[10.5px]">
                                  {schedB.licensorPublisherName} <span className="text-zinc-400 font-sans">• IPI:</span> <span className="text-[#00E676]">{schedB.licensorPublisherIpi}</span>
                                </span>
                              </div>
                              <div className="grid grid-cols-3 p-2.5">
                                <span className="text-zinc-500 font-mono">Contract Version:</span>
                                <span className="col-span-2 text-zinc-400 font-mono text-[10.5px]">{schedB.contractVersion}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {adminLicenseModalTab === "articles" && (
                        <div className="space-y-3.5 font-mono text-[11px] text-zinc-300">
                          {legalTier.articles.map((article, aIdx) => (
                            <div key={aIdx} className="border border-zinc-900 p-3 bg-zinc-950/70 rounded space-y-2">
                              <h4 className="text-white font-bold font-sans tracking-wide text-xs uppercase border-b border-zinc-900 pb-1.5">
                                {article.title}
                              </h4>
                              {article.sections.map((section, sIdx) => (
                                <div key={sIdx} className="space-y-1 pt-1">
                                  <p className="text-[#D9D6CA] font-bold text-[10.5px]">{section.heading}</p>
                                  <p className="text-zinc-400 font-sans text-[11px] leading-relaxed whitespace-pre-line">
                                    {section.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleDownloadPdf}
                          className="bg-[#D9D6CA] hover:bg-white text-black font-bold text-xs px-5 py-2 rounded uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                        >
                          <Download size={13} />
                          <span>PRINT / PDF AGREEMENT</span>
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: TRANSACTION RECEIPT RECORD (SECTION 05: TRANSACTIONS) */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-xl bg-[#080808] border border-zinc-800 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto rounded-lg"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                    COMMERCIAL TRANSACTION RECEIPT
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white uppercase mt-0.5">
                    {selectedTransaction.id}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-zinc-300">
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-2.5">
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Composition Fragment</span>
                      <strong className="text-white">{getFragmentTimeName(selectedTransaction.fragmentName)}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">License Tier</span>
                      <strong className="text-white">{selectedTransaction.licenseType}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Amount Paid</span>
                      <strong className="text-[#00E676] text-sm">${(selectedTransaction.amount || 0).toLocaleString()} {selectedTransaction.currency || "USD"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Payment Gateway / Method</span>
                      <strong className="text-white">{selectedTransaction.paymentMethod} (Live Capture)</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Payer Client</span>
                      <strong className="text-white">{selectedTransaction.clientName}</strong>
                      <div className="text-zinc-400 text-[10px] select-all">{selectedTransaction.clientEmail}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Transaction Date</span>
                      <strong className="text-white">{selectedTransaction.transactionDate}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Payment Status</span>
                      <strong className="text-emerald-400">{selectedTransaction.paymentStatus}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9px] block">Refund Status</span>
                      <strong className="text-zinc-300">{selectedTransaction.refundStatus}</strong>
                    </div>
                  </div>
                </div>

                {/* Connected Chain */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-lg space-y-1.5">
                  <span className="text-zinc-500 uppercase text-[9px] font-bold block">RELATIONAL CHAIN REFERENCES</span>
                  <div className="text-[10.5px] space-y-1 text-zinc-300">
                    <div>Connected License ID: <strong className="text-white font-mono">{selectedTransaction.connectedLicenseId || "TOC-LIC-2026-00481"}</strong></div>
                    <div>Connected Clearance Ref: <strong className="text-white font-mono">{selectedTransaction.connectedClearanceRef || "CLR-2026-0941"}</strong></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="bg-[#D9D6CA] hover:bg-white text-black font-bold text-xs px-5 py-2 rounded uppercase tracking-wider cursor-pointer"
                >
                  DONE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* 6-STEP COMPREHENSIVE FRAGMENT REGISTRATION & EDIT WIZARD */}
      <NewFragmentWizardModal
        isOpen={showCreateFragmentModal}
        onClose={() => {
          setShowCreateFragmentModal(false);
          setEditingFragment(null);
        }}
        onSave={handleSaveFullFragment}
        initialData={editingFragment}
      />
    </div>
  );
}
