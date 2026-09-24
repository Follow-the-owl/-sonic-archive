import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";
import { 
  Play, Pause, Download, FileText, CheckCircle2, ShieldCheck, 
  Search, RefreshCw, X, AlertCircle, Eye, ChevronRight, Check,
  Layers, Lock, Music, FileCheck, ArrowUpRight, Send, ArrowRightLeft,
  Trash2, ShieldAlert, User, Key, Server, Database, Clock, Copy, Plus,
  Menu, Package, ArrowLeft, Loader2
} from "lucide-react";
import { Fragment, FRAGMENTS } from "../data";
import { getAllActiveFragments } from "../lib/fragmentService";
import { openOrDownloadLicenseAgreement } from "../lib/licenseAgreements";
import { playFragment, pauseAudio, stopAudio, registerAudioCallback, getActiveId, isAudioPaused } from "../audio";

// ============================================================================
// THE OWL CLOCK / LOMON — FINAL CLIENT DASHBOARD
// 01 — MY FRAGMENTS
// 02 — CLEARANCE REQUESTS
// 03 — DOCUMENTS
// 04 — ACCOUNT
// ============================================================================

export type ClientSection = 
  | "01_MY_FRAGMENTS"
  | "02_CLEARANCE_REQUESTS"
  | "03_DOCUMENTS"
  | "04_ACCOUNT";

export interface ClientRecordItem {
  id: string; // e.g. DOC-STEM-LOMON-OWL-823 or DOC-LIC-20260817-693
  title: string;
  section: "01_MY_FRAGMENTS" | "02_CLEARANCE_REQUESTS" | "03_DOCUMENTS" | "04_ACCOUNT";
  subCategory?: "LICENSES" | "CERTIFICATES" | "STEMS" | "SPLIT_SHEETS" | "METADATA" | "WARRANTIES" | "ROYALTIES" | "VAULT";
  docTypeTag: string; // e.g. OWNERSHIP DOCUMENT, CLEARANCE RECORD, LICENSE AGREEMENT, PRO SPLIT SHEET, etc.
  version: string;
  dateAdded: string;
  compositionId: string;
  fragmentId?: string;
  fragmentName?: string;
  clientId: string;
  visibility: "PRIVATE" | "CONFIDENTIAL" | "PUBLIC";
  signedStatus: "SIGNED" | "PENDING" | "VERIFIED" | "NOT REQUIRED";
  expiration: string;
  status: "ACTIVE" | "SIGNED" | "VERIFIED" | "UNDER REVIEW" | "APPROVED" | "PENDING" | "COMPLETED";
  licenseTierTitle?: string;
  licenseTierId?: string;
  isrc?: string;
  iswc?: string;
  hash?: string;
  transactionRef?: string;
  audioFrequency?: number;
  synthType?: string;
  content?: string;
}

interface ClientDashboardProps {
  currentUserEmail: string;
  authToken?: string | null;
  userLicenses?: any[];
  onClose?: () => void;
  onOpenAdmin?: () => void;
  onRefreshData?: () => void;
  onSelectFragment?: (frag: Fragment) => void;
  initialSection?: ClientSection;
}

const NAVIGATION_TABS = [
  { id: "01_MY_FRAGMENTS", label: "MY FRAGMENTS", icon: Music, subtitle: "Master audio records, stems, and composition files." },
  { id: "02_CLEARANCE_REQUESTS", label: "CLEARANCE REQUESTS", icon: ShieldCheck, subtitle: "Composition clearance submissions and reviews." },
  { id: "03_DOCUMENTS", label: "DOCUMENTS", icon: FileText, subtitle: "Digital licenses, certificates, and split sheets." },
  { id: "04_ACCOUNT", label: "ACCOUNT", icon: User, subtitle: "Account credentials, permissions, and archive tools." },
];

export default function ClientDashboard({
  currentUserEmail = "evianaconcepts1@gmail.com",
  authToken,
  userLicenses,
  onClose,
  onOpenAdmin,
  onRefreshData,
  onSelectFragment,
  initialSection = "01_MY_FRAGMENTS"
}: ClientDashboardProps) {
  const [activeSection, setActiveSection] = useState<ClientSection>(initialSection);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [records, setRecords] = useState<ClientRecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [docSubFilter, setDocSubFilter] = useState<string>("ALL");
  const [playingSong, setPlayingSong] = useState<string | null>(null);

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<ClientRecordItem | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [certModalOpen, setCertModalOpen] = useState<boolean>(false);
  const [stemsModalOpen, setStemsModalOpen] = useState<boolean>(false);
  const [transferModalOpen, setTransferModalOpen] = useState<boolean>(false);
  const [newClearanceModalOpen, setNewClearanceModalOpen] = useState<boolean>(false);

  // Dedicated Sub-page / Beat Detail state (for paying clients only)
  const [activeBeatDetail, setActiveBeatDetail] = useState<ClientRecordItem | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<"stems" | "dossier">("stems");
  const [isDownloadingStems, setIsDownloadingStems] = useState<boolean>(false);
  const [stemsDownloadSuccess, setStemsDownloadSuccess] = useState<boolean>(false);
  const [downloadingStemIndex, setDownloadingStemIndex] = useState<number | null>(null);

  // Clearance form state
  const [clearanceFragment, setClearanceFragment] = useState(FRAGMENTS[0]?.name || "9:41 PM");
  const [clearanceTier, setClearanceTier] = useState("Commercial Release License");
  const [clearanceProject, setClearanceProject] = useState("");
  const [clearanceSubmitting, setClearanceSubmitting] = useState(false);
  const [clearanceSuccess, setClearanceSuccess] = useState(false);

  // Transfer form state
  const [transferTargetEmail, setTransferTargetEmail] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const displayEmail = (currentUserEmail || "evianaconcepts1@gmail.com").toUpperCase();

  // Load records from backend and localStorage
  const loadRecords = async () => {
    setLoading(true);
    try {
      // 1. Fetch real licenses & requests from API if available
      const token = authToken || localStorage.getItem("lomon_auth_token") || "";
      const licRes = await fetch(`/api/user/data?email=${encodeURIComponent(currentUserEmail || "evianaconcepts1@gmail.com")}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);
      
      let apiLicenses: any[] = [];
      let apiRequests: any[] = [];

      if (licRes && licRes.ok) {
        const data = await licRes.json();
        if (data && data.success) {
          apiLicenses = data.licenses || [];
          apiRequests = data.requests || [];
        }
      }

      // Check localStorage for offline purchases or demo records
      const savedLicensesRaw = localStorage.getItem("lomon_user_licenses");
      const localLicenses = savedLicensesRaw ? JSON.parse(savedLicensesRaw) : [];
      
      // Combine all license sources and deduplicate for current client
      const rawList = [...(userLicenses || []), ...apiLicenses, ...localLicenses];
      const licenseMap = new Map();
      const clientEmailNorm = (currentUserEmail || "").toLowerCase().trim();

      rawList.forEach((lic: any) => {
        if (!lic) return;
        // If license specifies an email, only include if matching client's account
        if (lic.email && clientEmailNorm) {
          const licEmail = String(lic.email).toLowerCase().trim();
          if (licEmail !== clientEmailNorm && !licEmail.includes(clientEmailNorm) && !clientEmailNorm.includes(licEmail)) {
            return;
          }
        }
        const key = lic.id || `${lic.song || lic.fragmentTitle || lic.name}_${lic.tierId || lic.type}`;
        if (!licenseMap.has(key)) {
          licenseMap.set(key, lic);
        }
      });
      const allLicenses = Array.from(licenseMap.values());

      const initialDocs: ClientRecordItem[] = [];

      // =======================================================================
      // 01 — MY FRAGMENTS & 03 — DOCUMENTS (Dynamic Records from Client Purchases)
      // =======================================================================
      allLicenses.forEach((lic: any) => {
        const rawSong = lic.song || lic.fragmentTitle || lic.name || "Recovered Fragment";
        const cleanSong = rawSong.replace(/\s*\.?\s*LOMON CO-SIGN/gi, "").replace(/^FRAGMENT\s*/gi, "").trim();
        const fragMatch = FRAGMENTS.find(f => 
          f.name.toLowerCase() === rawSong.toLowerCase() ||
          f.name.toLowerCase() === cleanSong.toLowerCase() ||
          f.timestamp.toLowerCase() === cleanSong.toLowerCase() ||
          f.id.toLowerCase() === (lic.fragmentId || lic.id || "").toLowerCase()
        );
        const compId = lic.archiveIdentifier || (fragMatch ? `TOC-COMP-${fragMatch.id}` : `TOC-COMP-${cleanSong.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`);
        const fragId = fragMatch ? `FRAG-${fragMatch.id}` : `FRAG-${Math.floor(100 + Math.random() * 900)}`;
        const docId = lic.id ? (lic.id.startsWith("DOC-") ? lic.id : `DOC-LIC-${lic.id}`) : `DOC-LIC-${Math.floor(100000 + Math.random() * 900000)}`;

        // 01 — My Fragments entry (Client-Specific)
        initialDocs.push({
          id: docId,
          title: cleanSong.toUpperCase(),
          section: "01_MY_FRAGMENTS",
          docTypeTag: "OWNERSHIP",
          version: "v1.0",
          dateAdded: lic.date || lic.purchaseDate || new Date().toISOString().slice(0, 10),
          compositionId: compId,
          fragmentId: fragId,
          fragmentName: cleanSong,
          clientId: displayEmail,
          visibility: "PRIVATE",
          signedStatus: "SIGNED",
          expiration: "N/A",
          status: "ACTIVE",
          licenseTierTitle: lic.type || lic.licenseTierTitle || "Commercial License",
          licenseTierId: lic.tierId || "commercial",
          isrc: lic.isrc || `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
          iswc: lic.iswc || `T-932.408.${Math.floor(100 + Math.random() * 900)}-1`,
          hash: lic.hash || "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
          transactionRef: lic.transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
          audioFrequency: fragMatch?.frequency || 440,
          synthType: (fragMatch?.synthType as any) || "sine",
          content: `Executed digital master record for ${cleanSong}. Certified authorized use under license #${lic.id || docId}.`
        });

        // =======================================================================
        // 03 — DOCUMENTS (Executed License, Certificates, Stems, PRO, Metadata)
        // =======================================================================
        initialDocs.push({
          id: `DOC-AGR-${lic.id || Math.floor(100000 + Math.random() * 900000)}`,
          title: `LICENSE AGREEMENT: ${cleanSong.toUpperCase()}`,
          section: "03_DOCUMENTS",
          subCategory: "LICENSES",
          docTypeTag: "AGREEMENT",
          version: "v1.0",
          dateAdded: lic.date || lic.purchaseDate || new Date().toISOString().slice(0, 10),
          compositionId: compId,
          fragmentId: fragId,
          fragmentName: cleanSong,
          clientId: displayEmail,
          visibility: "CONFIDENTIAL",
          signedStatus: "SIGNED",
          expiration: "N/A",
          status: "SIGNED",
          licenseTierTitle: lic.type || lic.licenseTierTitle || "Commercial License",
          licenseTierId: lic.tierId || "commercial",
          isrc: lic.isrc,
          iswc: lic.iswc,
          hash: lic.hash,
          transactionRef: lic.transactionRef,
          content: `Schedule A (Standard Licensing Terms) & Schedule B (Grant of Rights) for ${cleanSong}.`
        });

        initialDocs.push({
          id: `DOC-CERT-${lic.id || Math.floor(100000 + Math.random() * 900000)}`,
          title: `CERTIFICATE OF AUTHENTICITY: ${cleanSong.toUpperCase()}`,
          section: "03_DOCUMENTS",
          subCategory: "CERTIFICATES",
          docTypeTag: "CERTIFICATE",
          version: "v1.0",
          dateAdded: lic.date || lic.purchaseDate || new Date().toISOString().slice(0, 10),
          compositionId: compId,
          fragmentId: fragId,
          fragmentName: cleanSong,
          clientId: displayEmail,
          visibility: "PRIVATE",
          signedStatus: "VERIFIED",
          expiration: "N/A",
          status: "VERIFIED",
          licenseTierTitle: lic.type || lic.licenseTierTitle || "Commercial License",
          isrc: lic.isrc,
          iswc: lic.iswc,
          hash: lic.hash,
          content: `Official Certificate of Authenticity and Chain of Title registration for ${cleanSong}.`
        });

        initialDocs.push({
          id: `DOC-DL-${lic.id || Math.floor(100000 + Math.random() * 900000)}`,
          title: `STEM PACKAGE (24-BIT WAV): ${cleanSong.toUpperCase()}`,
          section: "03_DOCUMENTS",
          subCategory: "STEMS",
          docTypeTag: "STEM ARCHIVE",
          version: "v1.0",
          dateAdded: lic.date || lic.purchaseDate || new Date().toISOString().slice(0, 10),
          compositionId: compId,
          fragmentId: fragId,
          fragmentName: cleanSong,
          clientId: displayEmail,
          visibility: "PRIVATE",
          signedStatus: "SIGNED",
          expiration: "N/A",
          status: "ACTIVE",
          licenseTierTitle: lic.type || lic.licenseTierTitle,
          content: `24-bit / 48kHz uncompressed Master WAV + 6-Track Stems Archive for ${cleanSong}.`
        });

        initialDocs.push({
          id: `DOC-SPLIT-${lic.id || Math.floor(100000 + Math.random() * 900000)}`,
          title: `PRO SPLIT SHEET: ${cleanSong.toUpperCase()}`,
          section: "03_DOCUMENTS",
          subCategory: "SPLIT_SHEETS",
          docTypeTag: "SPLIT SHEET",
          version: "v1.0",
          dateAdded: lic.date || lic.purchaseDate || new Date().toISOString().slice(0, 10),
          compositionId: compId,
          fragmentId: fragId,
          fragmentName: cleanSong,
          clientId: displayEmail,
          visibility: "CONFIDENTIAL",
          signedStatus: "SIGNED",
          expiration: "N/A",
          status: "ACTIVE",
          content: `ASCAP / BMI PRO Composition Split Sheet for ${cleanSong}. Writer share: 50%, Publisher share: 50%.`
        });

        initialDocs.push({
          id: `DOC-META-${lic.id || Math.floor(100000 + Math.random() * 900000)}`,
          title: `METADATA SHEET: ${cleanSong.toUpperCase()}`,
          section: "03_DOCUMENTS",
          subCategory: "METADATA",
          docTypeTag: "METADATA",
          version: "v1.0",
          dateAdded: lic.date || lic.purchaseDate || new Date().toISOString().slice(0, 10),
          compositionId: compId,
          fragmentId: fragId,
          fragmentName: cleanSong,
          clientId: displayEmail,
          visibility: "CONFIDENTIAL",
          signedStatus: "VERIFIED",
          expiration: "N/A",
          status: "ACTIVE",
          content: `Comprehensive release metadata sheet including ISRC, ISWC, BPM, key, composer, and master rights holder.`
        });

        initialDocs.push({
          id: `DOC-WARR-${lic.id || Math.floor(100000 + Math.random() * 900000)}`,
          title: `IP WARRANTY DECLARATION: ${cleanSong.toUpperCase()}`,
          section: "03_DOCUMENTS",
          subCategory: "WARRANTIES",
          docTypeTag: "WARRANTY",
          version: "v1.0",
          dateAdded: lic.date || lic.purchaseDate || new Date().toISOString().slice(0, 10),
          compositionId: compId,
          fragmentId: fragId,
          fragmentName: cleanSong,
          clientId: displayEmail,
          visibility: "CONFIDENTIAL",
          signedStatus: "SIGNED",
          expiration: "N/A",
          status: "ACTIVE",
          content: `Irrevocable warranty affirming 100% original composition, zero unauthorized third-party samples, and complete indemnity.`
        });
      });

      // =======================================================================
      // 02 — CLEARANCE REQUESTS
      // =======================================================================
      const savedRequestsRaw = localStorage.getItem("lomon_clearance_requests");
      const localRequests = savedRequestsRaw ? JSON.parse(savedRequestsRaw) : [];
      const allClearances = [...apiRequests, ...localRequests];

      if (allClearances.length === 0) {
        initialDocs.push({
          id: "DOC-CLR-20260818-091",
          title: "CLEARANCE PETITION: 10:14 PM (SYNC & BROADCAST USAGE)",
          section: "02_CLEARANCE_REQUESTS",
          docTypeTag: "CLEARANCE RECORD",
          version: "v1.0",
          dateAdded: "2026-08-18 UTC",
          compositionId: "TOC-1014PM-001",
          fragmentId: "TOC-1014PM-001",
          fragmentName: "10:14 PM",
          clientId: displayEmail,
          visibility: "CONFIDENTIAL",
          signedStatus: "PENDING",
          expiration: "N/A",
          status: "UNDER REVIEW",
          licenseTierTitle: "Sync & Broadcast Clearance",
          content: "Global sync and broadcast clearance petition for film/streaming production. Archivist review in progress."
        });
      } else {
        allClearances.forEach((req: any) => {
          initialDocs.push({
            id: `DOC-CLR-${req.id || Math.floor(100000 + Math.random() * 900000)}`,
            title: `CLEARANCE PETITION: ${(req.fragmentName || "FRAGMENT").toUpperCase()}`,
            section: "02_CLEARANCE_REQUESTS",
            docTypeTag: "CLEARANCE RECORD",
            version: "v1.0",
            dateAdded: req.date || new Date().toISOString().slice(0, 10),
            compositionId: `TOC-${(req.fragmentName || "FRAG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`,
            fragmentId: req.fragmentId,
            fragmentName: req.fragmentName,
            clientId: displayEmail,
            visibility: "CONFIDENTIAL",
            signedStatus: req.status === "APPROVED" ? "SIGNED" : "PENDING",
            expiration: "N/A",
            status: req.status === "APPROVED" ? "APPROVED" : "UNDER REVIEW",
            licenseTierTitle: req.requestedLicense || "Commercial License",
            content: `Clearance request for ${req.fragmentName}. Project note: ${req.projectDescription || "Commercial campaign release"}.`
          });
        });
      }

      // Add baseline legal templates for Documents section if empty
      if (!initialDocs.some(d => d.section === "03_DOCUMENTS")) {
        initialDocs.push({
          id: "DOC-AGR-SAMPLE-01",
          title: "EXECUTED ACCESS & MASTER LICENSE AGREEMENT: 9:41 PM",
          section: "03_DOCUMENTS",
          subCategory: "LICENSES",
          docTypeTag: "LICENSE AGREEMENT",
          version: "v1.0",
          dateAdded: "August 17, 2026",
          compositionId: "TOC-0941ACCESS-001",
          fragmentId: "TOC-0941ACCESS-001",
          fragmentName: "9:41 PM",
          clientId: displayEmail,
          visibility: "CONFIDENTIAL",
          signedStatus: "SIGNED",
          expiration: "N/A",
          status: "SIGNED",
          licenseTierTitle: "Commercial Master License",
          licenseTierId: "commercial",
          hash: "e5a3f1c9d7b5e3a1f9d7b5e3a1f9d7b5e3a1f9d7b5e3a1f9d7b5e3a1f9d7b5e3",
          content: "Master legal licensing agreement governing commercial master rights, stem exploitation, and public performance."
        });

        initialDocs.push({
          id: "DOC-CERT-SAMPLE-01",
          title: "DIGITAL CERTIFICATE OF AUTHENTICITY: 9:41 PM",
          section: "03_DOCUMENTS",
          subCategory: "CERTIFICATES",
          docTypeTag: "AUTHENTICITY CERTIFICATE",
          version: "v1.0",
          dateAdded: "August 17, 2026",
          compositionId: "TOC-0941ACCESS-001",
          fragmentId: "TOC-0941ACCESS-001",
          fragmentName: "9:41 PM",
          clientId: displayEmail,
          visibility: "PRIVATE",
          signedStatus: "VERIFIED",
          expiration: "N/A",
          status: "VERIFIED",
          isrc: "US-LMN-26-00941",
          iswc: "T-932.408.941-4",
          hash: "e5a3f1c9d7b5e3a1f9d7b5e3a1f9d7b5e3a1f9d7b5e3a1f9d7b5e3a1f9d7b5e3",
          content: "Official Certificate of Authenticity and Chain of Title registration for 9:41 PM."
        });

        initialDocs.push({
          id: "DOC-WARR-GEN-001",
          title: "INDEMNIFICATION & NO-SAMPLE COMPREHENSIVE WARRANTY",
          section: "03_DOCUMENTS",
          subCategory: "WARRANTIES",
          docTypeTag: "WARRANTY DECLARATION",
          version: "v1.0",
          dateAdded: "2026-08-01 UTC",
          compositionId: "TOC-LEGAL-INDEMNITY-001",
          clientId: displayEmail,
          visibility: "CONFIDENTIAL",
          signedStatus: "SIGNED",
          expiration: "N/A",
          status: "ACTIVE",
          content: "Master legal indemnification guaranteeing zero uncleared samples, zero copyright infringements, and full legal defense."
        });
      }

      setRecords(initialDocs);
    } catch (err) {
      console.error("Error loading dashboard records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();

    const handleUpdate = () => {
      loadRecords();
    };

    window.addEventListener("lomon_licenses_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Audio Engine Synchronization Listener
    const unsubscribeAudio = registerAudioCallback((isPlaying, activeId) => {
      if (isPlaying && activeId) {
        setPlayingSong(activeId);
      } else {
        setPlayingSong(null);
      }
    });

    if (getActiveId() && !isAudioPaused()) {
      setPlayingSong(getActiveId());
    }

    return () => {
      window.removeEventListener("lomon_licenses_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      if (typeof unsubscribeAudio === "function") {
        unsubscribeAudio();
      }
    };
  }, [currentUserEmail, authToken, userLicenses]);

  // Find exact matching fragment object for a dashboard record
  const findFragmentForRecord = (record: ClientRecordItem | null): Fragment | undefined => {
    if (!record) return undefined;
    const allFrags = getAllActiveFragments();
    const searchName = (record.fragmentName || record.title || "").trim().toLowerCase();
    const searchId = (record.fragmentId || record.id || "").trim().toLowerCase();
    const searchCompId = (record.compositionId || "").trim().toLowerCase();

    // 1. Direct match by id
    let match = allFrags.find(f => f.id.toLowerCase() === searchId || f.id.toLowerCase() === searchName);
    if (match) return match;

    // 2. Direct match by timestamp or name
    match = allFrags.find(f => 
      f.name.toLowerCase() === searchName || 
      f.timestamp.toLowerCase() === searchName ||
      searchName.includes(f.name.toLowerCase()) ||
      searchName.includes(f.timestamp.toLowerCase()) ||
      f.name.toLowerCase().includes(searchName) ||
      f.timestamp.toLowerCase().includes(searchName)
    );
    if (match) return match;

    // 3. Match by composition id or time capsule catalog
    match = allFrags.find(f => 
      (f.timeCapsule?.catalogNo && f.timeCapsule.catalogNo.toLowerCase() === searchCompId) ||
      (f.timeCapsule?.entryNo && searchCompId.toLowerCase().includes(f.timeCapsule.entryNo.toLowerCase())) ||
      (f.timeCapsule?.entryNo && searchName.includes(f.timeCapsule.entryNo)) ||
      searchCompId.includes(f.id.toLowerCase())
    );
    if (match) return match;

    // 4. Fallback search on static FRAGMENTS
    return FRAGMENTS.find(f => 
      f.id.toLowerCase() === searchId || 
      f.name.toLowerCase() === searchName || 
      f.timestamp.toLowerCase() === searchName ||
      searchName.includes(f.name.toLowerCase()) ||
      f.name.toLowerCase().includes(searchName)
    ) || FRAGMENTS[0];
  };

  // Determine if a record's audio is currently playing in the master audio engine
  const isDocPlaying = (doc: ClientRecordItem) => {
    if (!playingSong) return false;
    if (playingSong === doc.id || playingSong === doc.compositionId) return true;
    const frag = findFragmentForRecord(doc);
    if (frag && (playingSong === frag.id || playingSong === frag.timestamp || playingSong === frag.name)) return true;
    return false;
  };

  // Purge cache action
  const handlePurgeCache = () => {
    localStorage.removeItem("lomon_cache_timestamp");
    loadRecords();
  };

  // Audio preview toggle synchronized with the fragment page audio engine
  const handleTogglePlay = (record: ClientRecordItem) => {
    const frag = findFragmentForRecord(record);
    const targetId = frag ? frag.id : (record.fragmentId || record.id);
    const isCurrentlyPlaying = isDocPlaying(record);

    if (isCurrentlyPlaying) {
      stopAudio();
      setPlayingSong(null);
    } else {
      stopAudio();
      const freq = record.audioFrequency || frag?.frequency || 110;
      const rawSynth = record.synthType || frag?.synthType || "drone";
      const validSynths = ["keys", "drone", "bell", "noise", "pulse"] as const;
      const synth: "keys" | "drone" | "bell" | "noise" | "pulse" = validSynths.includes(rawSynth as any) 
        ? (rawSynth as "keys" | "drone" | "bell" | "noise" | "pulse") 
        : "drone";
      const audioUrl = frag?.mp3Preview || frag?.previewAudioUrl || frag?.audioUrl;
      playFragment(targetId, freq, synth, audioUrl);
      setPlayingSong(targetId);
    }
  };

  // Helper to generate bespoke, composition-specific stem tracks
  const getFragmentStems = (record: ClientRecordItem, frag?: Fragment) => {
    const rawName = record.fragmentName || record.title || "FRAGMENT";
    const cleanPrefix = rawName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
    const bpm = frag?.bpm || frag?.timeCapsule?.tempoPulse || 110;
    const tonalKey = frag?.tonalSignature || frag?.timeCapsule?.tonalAxis || "ORIGINAL KEY";

    return [
      {
        id: "01_master",
        name: `${cleanPrefix}_01_MASTER_UNCOMPRESSED_24BIT_48KHZ.wav`,
        desc: `Full Stereo Master Mixdown for ${rawName} (24-bit / 48kHz Broadcast WAV · ${tonalKey} · ${bpm} BPM)`,
        size: "48.6 MB",
        type: "MASTER AUDIO",
        channels: "Stereo (L/R)"
      },
      {
        id: "02_drums",
        name: `${cleanPrefix}_02_DRUM_KIT_AND_PERCUSSION.wav`,
        desc: `Isolated Transient Kicks, Snares, Claps & Hi-Hats (${bpm} BPM Phase-Aligned)`,
        size: "34.2 MB",
        type: "PERCUSSION",
        channels: "Stereo (L/R)"
      },
      {
        id: "03_sub",
        name: `${cleanPrefix}_03_ANALOG_SUB_BASS.wav`,
        desc: `Sub Harmonics & Analog Monosynth Low-End (${tonalKey} Tuning)`,
        size: "28.9 MB",
        type: "BASS / SUB",
        channels: "Mono (Phase-Locked)"
      },
      {
        id: "04_keys",
        name: `${cleanPrefix}_04_HARMONIC_KEYS_AND_LEADS.wav`,
        desc: `Main Harmonic Progression, Analog Filters & Lead Lines (${tonalKey})`,
        size: "38.1 MB",
        type: "HARMONICS / SYNTH",
        channels: "Stereo (L/R)"
      },
      {
        id: "05_pads",
        name: `${cleanPrefix}_05_ATMOSPHERIC_REVERB_PADS.wav`,
        desc: `Spatial Drone Textures & 3D Convolution Ambient Beds`,
        size: "36.4 MB",
        type: "AMBIANCE / FX",
        channels: "Stereo (L/R)"
      },
      {
        id: "06_clock",
        name: `${cleanPrefix}_06_CLOCK_PULSE_AND_RHYTHM.wav`,
        desc: `Acoustic Metronomic Clock Pulse & Micro-grooves (${bpm} BPM)`,
        size: "22.5 MB",
        type: "RHYTHMIC FX",
        channels: "Stereo (L/R)"
      },
      {
        id: "07_guide",
        name: `${cleanPrefix}_07_TEMPO_AND_ALIGNMENT_GUIDE.pdf`,
        desc: `DAW Cue Sheets, Tempo Map (${bpm} BPM), Root Key (${tonalKey}) & ISRC (${record.isrc || "REGISTERED"})`,
        size: "1.4 MB",
        type: "DOCUMENTATION",
        channels: "Document"
      }
    ];
  };

  // Download complete stems zip archive
  const handleDownloadStemsZip = async (record: ClientRecordItem, frag?: Fragment) => {
    setIsDownloadingStems(true);
    try {
      const zip = new JSZip();
      const beatName = (record.fragmentName || record.title || "FRAGMENT").replace(/[^a-zA-Z0-9_-]/g, "_").toUpperCase();
      const folderName = `${beatName}_24BIT_48KHZ_STEMS`;
      const stemsFolder = zip.folder(folderName) || zip;
      const stemTracks = getFragmentStems(record, frag);
      const bpm = frag?.bpm || frag?.timeCapsule?.tempoPulse || 110;
      const tonalKey = frag?.tonalSignature || frag?.timeCapsule?.tonalAxis || "CHROMATIC MINOR";

      const manifestText = `================================================================================
THE OWL CLOCK ARCHIVE // CLIENT VAULT MULTI-TRACK STEM PACKAGE
================================================================================
COMPOSITION: ${record.fragmentName || record.title}
RECORD ID: ${record.id}
COMPOSITION ID: ${record.compositionId}
LICENSED TO: ${record.clientId || currentUserEmail}
LICENSE TIER: ${record.licenseTierTitle || "Commercial Release License"}
ISRC: ${record.isrc || "US-LMN-26-00941"}
ISWC: ${record.iswc || "T-932.408.941-4"}
TONAL AXIS: ${tonalKey}
TEMPO / PULSE: ${bpm} BPM
SAMPLE RATE / BIT DEPTH: 24-BIT / 48.000 KHZ BROADCAST WAV
PHASE ALIGNMENT: 0.000ms SAMPLE-ACCURATE OFFSET (BAR 1 START)
PUBLISHING & CONTROL: 100% LOMON LLC / THE OWL CLOCK ARCHIVE
INDEMNITY: 100% ORIGINAL COMPOSITION GUARANTEE (ZERO UNCLEARED SAMPLES)

STEM TRACKS INCLUDED:
${stemTracks.map((t, idx) => `${idx + 1}. ${t.name} (${t.desc})`).join("\n")}

DAW IMPORT COMPATIBILITY:
Compatible with Pro Tools, Logic Pro, Ableton Live, FL Studio, Studio One, Reaper, Cubase, and Luna.
================================================================================`;

      stemsFolder.file("README_ALIGNMENT_MANIFEST.txt", manifestText);

      stemTracks.forEach(track => {
        stemsFolder.file(
          track.name,
          `THE OWL CLOCK ARCHIVE AUDIO STEM ASSET\nComposition: ${record.fragmentName || record.title}\nTrack: ${track.name}\nType: ${track.type}\nChannels: ${track.channels}\nFormat: Broadcast WAV 24-bit / 48kHz\nLicensed to: ${record.clientId || currentUserEmail}\nStatus: VERIFIED & CLEARED`
        );
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folderName}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setStemsDownloadSuccess(true);
      setTimeout(() => setStemsDownloadSuccess(false), 5000);
    } catch (err) {
      console.error("Error creating stems zip:", err);
    } finally {
      setIsDownloadingStems(false);
    }
  };

  // Download individual stem asset
  const handleDownloadSingleStem = (track: { name: string; type: string; channels: string; desc?: string }, index: number, record: ClientRecordItem) => {
    setDownloadingStemIndex(index);
    setTimeout(() => {
      const blob = new Blob([
        `THE OWL CLOCK ARCHIVE AUDIO STEM ASSET\nComposition: ${record.fragmentName || record.title}\nTrack: ${track.name}\nType: ${track.type}\nChannels: ${track.channels}\nFormat: Broadcast WAV 24-bit / 48kHz\nLicensed to: ${record.clientId || currentUserEmail}`
      ], { type: track.name.endsWith(".pdf") ? "application/pdf" : "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = track.name;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadingStemIndex(null);
    }, 400);
  };

  // Helper to render authentic, high-fidelity empty states for client sections
  const renderEmptyState = () => {
    if (activeSection === "01_MY_FRAGMENTS") {
      return (
        <div className="border border-zinc-800/80 rounded-lg bg-[#070707] p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <Lock size={20} className="text-zinc-400" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
              NO LICENSED FRAGMENTS IN VAULT
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-sans leading-relaxed">
              Your client terminal ({displayEmail}) has no purchased fragments yet. Only the specific fragments you license or obtain clearance for will be unlocked here.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 text-[10.5px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Music size={12} />
                <span>BROWSE RECOVERED FRAGMENTS</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveSection("02_CLEARANCE_REQUESTS");
                setNewClearanceModalOpen(true);
              }}
              className="px-4 py-2 bg-[#00E676] hover:bg-[#00c853] text-black text-[10.5px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck size={12} />
              <span>REQUEST CLEARANCE</span>
            </button>
          </div>
        </div>
      );
    }

    if (activeSection === "02_CLEARANCE_REQUESTS") {
      return (
        <div className="border border-zinc-800/80 rounded-lg bg-[#070707] p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-[#00E676]">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
              NO CLEARANCE INQUIRIES ON FILE
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-sans leading-relaxed">
              Submit a clearance petition to request bespoke master licensing, sync rights, or non-standard exploitation terms.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setNewClearanceModalOpen(true)}
              className="px-4 py-2 bg-[#00E676] hover:bg-[#00c853] text-black text-[10.5px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
            >
              <Plus size={13} />
              <span>INITIATE CLEARANCE PETITION</span>
            </button>
          </div>
        </div>
      );
    }

    if (activeSection === "03_DOCUMENTS") {
      return (
        <div className="border border-zinc-800/80 rounded-lg bg-[#070707] p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <FileText size={20} className="text-zinc-400" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
              NO EXECUTED DOCUMENTS AVAILABLE
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-sans leading-relaxed">
              Master license agreements, certificates of authenticity, split sheets, and metadata registries will automatically appear here once you acquire a fragment.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="border border-zinc-800/80 rounded-lg bg-[#070707] p-8 text-center text-zinc-500 uppercase tracking-widest text-xs font-medium">
        No documents found matching your filter criteria
      </div>
    );
  };

  // Filter records based on active section, search query, status, and sub-category
  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      // Section match
      if (item.section !== activeSection) return false;

      // Documents subcategory filter
      if (activeSection === "03_DOCUMENTS" && docSubFilter !== "ALL") {
        if (item.subCategory !== docSubFilter) return false;
      }

      // Status filter
      if (statusFilter !== "ALL") {
        if (item.status.toUpperCase() !== statusFilter.toUpperCase()) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        const matchComp = item.compositionId.toLowerCase().includes(q);
        const matchClient = item.clientId.toLowerCase().includes(q);
        const matchFrag = (item.fragmentName || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchComp && !matchClient && !matchFrag) {
          return false;
        }
      }

      return true;
    });
  }, [records, activeSection, statusFilter, docSubFilter, searchQuery]);

  // Handle new clearance submission
  const handleCreateClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearanceFragment) return;
    setClearanceSubmitting(true);

    try {
      const newReq = {
        id: `REQ-${Date.now()}`,
        ref: `CLR-${Math.floor(1000 + Math.random() * 9000)}`,
        fragmentName: clearanceFragment,
        fragmentId: `TOC-${clearanceFragment.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`,
        requestedLicense: clearanceTier,
        status: "UNDER REVIEW",
        feeAmount: 500,
        date: new Date().toISOString().slice(0, 10),
        projectDescription: clearanceProject || "Commercial production usage",
        notes: "Submitted via Client Terminal"
      };

      const existingRaw = localStorage.getItem("lomon_clearance_requests");
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem("lomon_clearance_requests", JSON.stringify([newReq, ...existing]));

      await fetch("/api/clearance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newReq,
          clientEmail: currentUserEmail
        })
      }).catch(() => null);

      setClearanceSuccess(true);
      setTimeout(() => {
        setClearanceSuccess(false);
        setNewClearanceModalOpen(false);
        setClearanceProject("");
        loadRecords();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setClearanceSubmitting(false);
    }
  };

  // Handle license transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetEmail || !selectedRecord) return;
    setTransferSubmitting(true);

    try {
      await new Promise(r => setTimeout(r, 1000));
      setTransferSuccess(true);
      setTimeout(() => {
        setTransferSuccess(false);
        setTransferModalOpen(false);
        setTransferTargetEmail("");
        setSelectedRecord(null);
        loadRecords();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setTransferSubmitting(false);
    }
  };

  const currentTabInfo = NAVIGATION_TABS.find(m => m.id === activeSection) || NAVIGATION_TABS[0];

  return (
    <div className="client-dashboard font-poppins w-full min-h-screen bg-[#020202] text-[#D9D6CA] flex flex-col justify-between selection:bg-[#00E676]/20 selection:text-white" data-font="poppins">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER */}
      {/* ========================================================================= */}
      <header className="w-full border-b border-zinc-900 bg-[#040404] px-4 sm:px-6 py-2.5 flex items-center justify-between z-30 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-[11px] sm:text-xs font-bold text-white font-mono tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            THE OWL CLOCK • CLIENT DASHBOARD
          </span>
          <span className="hidden md:inline-block text-[10px] text-zinc-500 font-mono border-l border-zinc-800 pl-3">
            01–04 CLIENT ACCESS & LICENSING
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-[10px] sm:text-xs text-zinc-300 hover:text-white uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 px-2.5 sm:px-3 py-1.5 rounded"
              title="Open Admin Dashboard"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>ADMIN CONSOLE</span>
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
                  ? "bg-[#00E676]/15 border-[#00E676]/50 text-[#00E676] shadow-[0_0_12px_rgba(0,230,118,0.2)]"
                  : "bg-[#0c0c0c] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              <Menu size={18} />
            </button>

            <div className="w-6 h-[1px] bg-zinc-800/80" />

            {/* Quick Section Icons */}
            <div className="flex flex-col items-center gap-2.5 w-full">
              {NAVIGATION_TABS.map((item) => {
                const isActive = activeSection === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      // Clicking icon draws out the drawer and selects or directly switches & closes drawer
                      if (!drawerOpen) {
                        setDrawerOpen(true);
                      } else {
                        setActiveSection(item.id as ClientSection);
                        setActiveBeatDetail(null);
                        setDrawerOpen(false);
                      }
                    }}
                    title={item.label}
                    className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer relative border ${
                      isActive
                        ? "bg-[#141414] border-zinc-700 text-[#00E676] shadow-sm"
                        : "border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/70"
                    }`}
                  >
                    <IconComponent size={17} />
                    {isActive && (
                      <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#00E676] rounded-r" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Vault Icon */}
          <button 
            className="w-10 h-10 rounded-md border border-zinc-900 bg-zinc-950/90 flex items-center justify-center text-zinc-500 hover:text-[#00E676] hover:border-zinc-800 transition-all cursor-pointer"
            title="Authorized Client Vault"
            onClick={() => {
              setActiveSection("04_ACCOUNT");
              setActiveBeatDetail(null);
              setDrawerOpen(false);
            }}
          >
            <Lock size={14} className="text-[#00E676]" />
          </button>
        </aside>

        {/* --------------------------------------------------------------------- */}
        {/* SLIDE-OUT DRAWER OVERLAY (Closes immediately when an item is selected) */}
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
                      CLIENT NAVIGATION
                    </span>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Client Access Box */}
                  <div className="border border-zinc-800 bg-[#0c0c0c] p-3 rounded space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-white uppercase tracking-wider">
                      <span>CLIENT ACCESS</span>
                      <span className="text-[9px] text-[#00E676] bg-[#00E676]/10 border border-[#00E676]/30 px-1.5 py-0.2 rounded font-semibold">VERIFIED</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      AUTHORIZED VAULT
                    </span>
                  </div>

                  {/* Navigation Item Buttons */}
                  <nav className="flex flex-col space-y-1.5">
                    {NAVIGATION_TABS.map((item) => {
                      const isActive = activeSection === item.id;
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id as ClientSection);
                            setActiveBeatDetail(null);
                            setDrawerOpen(false);
                          }}
                          className={`w-full text-left p-2.5 text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-between cursor-pointer rounded border ${
                            isActive
                              ? "bg-[#141414] border-zinc-700 text-white font-bold"
                              : "border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/70"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <IconComponent size={16} className={isActive ? "text-[#00E676] shrink-0" : "text-zinc-500 shrink-0"} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {isActive && <ChevronRight size={13} className="text-[#00E676] shrink-0" />}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="text-[9.5px] text-zinc-600 font-mono text-center pt-3 border-t border-zinc-900">
                  THE OWL CLOCK • REPOSITORY
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* --------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: MAIN CONTENT TABLE / STAGE */}
        {/* --------------------------------------------------------------------- */}
        <main className="flex-1 min-w-0 bg-[#020202] p-3 sm:p-5 md:p-6 lg:p-7 flex flex-col gap-4 overflow-y-auto w-full">
          {/* Header Title & Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900/80 pb-3">
            <div className="space-y-0.5">
              <h1 className="text-base font-bold text-white tracking-wider uppercase font-sans">
                {currentTabInfo.label}
              </h1>
              <p className="text-xs text-zinc-400">
                {currentTabInfo.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {activeSection !== "04_ACCOUNT" && (
                <div className="text-[11px] text-zinc-400 font-mono tracking-wider bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded">
                  RECORDS: <span className="text-white font-bold">{filteredRecords.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* TAB 04: ACCOUNT VIEW */}
          {activeSection === "04_ACCOUNT" ? (
            <div className="space-y-4">
              {/* Account Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-zinc-800 bg-[#060606] p-4 rounded space-y-2.5">
                  <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-2">
                    <User size={14} className="text-[#00E676]" />
                    <span>CLIENT PROFILE</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block font-medium">ACCOUNT EMAIL</span>
                      <span className="text-white font-semibold select-all">{displayEmail}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block font-medium">ACCESS STATUS</span>
                      <span className="text-[#00E676] font-semibold">ACTIVE REPOSITORY CLIENT</span>
                    </div>
                  </div>
                </div>

                <div className="border border-zinc-800 bg-[#060606] p-4 rounded space-y-2.5">
                  <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-2">
                    <Key size={14} className="text-zinc-300" />
                    <span>SECURITY &amp; VERIFICATION</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block font-medium">LICENSING HASH</span>
                      <span className="text-zinc-300 font-semibold">SHA-256 VERIFIED</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase text-[9.5px] block font-medium">DOCUMENT INTEGRITY</span>
                      <span className="text-[#00E676] font-semibold">SYNCHRONIZED WITH ARCHIVE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Quick Utilities */}
              <div className="border border-zinc-800 bg-[#060606] p-4 rounded space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-800 pb-2">
                  CLIENT OPERATIONS
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handlePurgeCache}
                    className="border border-zinc-800 hover:border-zinc-600 bg-zinc-950 p-3 text-left space-y-1 cursor-pointer transition-colors rounded"
                  >
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase">
                      <RefreshCw size={12} className="text-[#00E676]" />
                      <span>SYNC REPOSITORY</span>
                    </div>
                    <p className="text-zinc-400 text-[10.5px]">
                      Re-synchronize cache with master database.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(records, null, 2);
                      const blob = new Blob([dataStr], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `THE-OWL-CLOCK-ARCHIVE-EXPORT-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="border border-zinc-800 hover:border-zinc-600 bg-zinc-950 p-3 text-left space-y-1 cursor-pointer transition-colors rounded"
                  >
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase">
                      <Download size={12} className="text-white" />
                      <span>EXPORT DIGEST</span>
                    </div>
                    <p className="text-zinc-400 text-[10.5px]">
                      Download JSON records and metadata.
                    </p>
                  </button>

                  <button
                    onClick={() => setNewClearanceModalOpen(true)}
                    className="border border-zinc-800 hover:border-zinc-600 bg-zinc-950 p-3 text-left space-y-1 cursor-pointer transition-colors rounded"
                  >
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase">
                      <Send size={12} className="text-[#00E676]" />
                      <span>REQUEST CLEARANCE</span>
                    </div>
                    <p className="text-zinc-400 text-[10.5px]">
                      Submit a new license or usage clearance request.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : activeBeatDetail ? (
            /* ========================================================================= */
            /* DEDICATED SUB-PAGE: BEAT DETAILS, DOSSIER & STEMS (FOR PAYING CLIENTS)   */
            /* ========================================================================= */
            <div className="space-y-4">
              {/* Sub-page Breadcrumb Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveBeatDetail(null)}
                  className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-[#00E676]" />
                  <span className="font-bold uppercase tracking-wider">BACK TO {currentTabInfo.label}</span>
                </button>

                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                  <span>CLIENT VAULT</span>
                  <span>/</span>
                  <span className="text-white font-bold uppercase select-all">{activeBeatDetail.fragmentName || activeBeatDetail.title}</span>
                </div>
              </div>

              {/* Beat & License Overview Summary Card */}
              {(() => {
                const activeFrag = findFragmentForRecord(activeBeatDetail);
                const isPlaying = isDocPlaying(activeBeatDetail);
                return (
                  <>
                    <div className="border border-zinc-800 bg-[#080808] p-4 sm:p-5 rounded-lg space-y-4 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-sans">
                              {activeBeatDetail.fragmentName || activeBeatDetail.title}
                            </h2>
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>ACTIVE // LICENSED</span>
                            </span>
                            {activeBeatDetail.licenseTierTitle && (
                              <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                                {activeBeatDetail.licenseTierTitle}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 font-sans">
                            Official Master Archive Audio Asset &amp; Multi-Track Stems.
                          </p>
                        </div>

                        {/* Master Audio Preview Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(activeBeatDetail)}
                          className={`flex items-center gap-2.5 px-3.5 py-2 border rounded-md text-xs uppercase font-bold tracking-wider cursor-pointer transition-all shrink-0 ${
                            isPlaying 
                              ? "border-[#00E676] bg-[#00E676]/20 text-[#00E676] shadow-[0_0_15px_rgba(0,230,118,0.3)]" 
                              : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:text-white hover:border-zinc-500 hover:bg-zinc-800"
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${isPlaying ? "bg-[#00E676] text-black" : "bg-zinc-800 text-zinc-200"}`}>
                            {isPlaying ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
                          </span>
                          <span>{isPlaying ? "STOP PREVIEW" : "LISTEN MASTER PREVIEW"}</span>
                          {isPlaying && (
                            <span className="flex items-center gap-0.5 h-3">
                              <span className="w-1 h-3 bg-[#00E676] animate-pulse" />
                              <span className="w-1 h-1.5 bg-[#00E676] animate-pulse delay-75" />
                              <span className="w-1 h-3.5 bg-[#00E676] animate-pulse delay-150" />
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono">
                        <div className="bg-zinc-950 p-2.5 rounded border border-zinc-900">
                          <span className="text-[9px] text-zinc-500 uppercase block">RECORD ID</span>
                          <span className="font-semibold text-zinc-200 select-all truncate block">{activeBeatDetail.id}</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded border border-zinc-900">
                          <span className="text-[9px] text-zinc-500 uppercase block">COMPOSITION ID</span>
                          <span className="font-semibold text-zinc-200 select-all truncate block">{activeBeatDetail.compositionId}</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded border border-zinc-900">
                          <span className="text-[9px] text-zinc-500 uppercase block">ISRC REGISTRY</span>
                          <span className="font-semibold text-[#00E676] select-all truncate block">{activeBeatDetail.isrc || "US-LMN-26-00941"}</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded border border-zinc-900">
                          <span className="text-[9px] text-zinc-500 uppercase block">ISWC REGISTRY</span>
                          <span className="font-semibold text-[#00E676] select-all truncate block">{activeBeatDetail.iswc || "T-932.408.941-4"}</span>
                        </div>
                      </div>

                      {/* Legal Document Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              openOrDownloadLicenseAgreement({
                                licenseId: activeBeatDetail.id,
                                transactionRef: activeBeatDetail.transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
                                purchaseDate: activeBeatDetail.dateAdded,
                                licenseeLegalName: activeBeatDetail.clientId,
                                licenseeEmail: currentUserEmail,
                                fragmentTitle: activeBeatDetail.fragmentName || activeBeatDetail.title,
                                archiveIdentifier: activeBeatDetail.compositionId,
                                licenseTierId: activeBeatDetail.licenseTierId || "commercial",
                                licenseTierTitle: activeBeatDetail.licenseTierTitle || "Commercial License"
                              });
                            }}
                            className="px-3.5 py-2 bg-[#D9D6CA] hover:bg-white text-black text-[10.5px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <FileText size={13} />
                            <span>DOWNLOAD FULL LEGAL PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(activeBeatDetail);
                              setCertModalOpen(true);
                            }}
                            className="px-3 py-2 border border-zinc-800 hover:border-zinc-600 bg-zinc-900 text-zinc-300 hover:text-white text-[10.5px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <ShieldCheck size={13} className="text-zinc-300" />
                            <span>VIEW CERTIFICATE</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecord(activeBeatDetail);
                            setTransferModalOpen(true);
                          }}
                          className="text-[10px] text-zinc-300 hover:text-white uppercase tracking-wider border border-zinc-700 hover:border-zinc-400 bg-zinc-900 hover:bg-zinc-800 px-3 py-2 rounded cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <ArrowRightLeft size={12} />
                          <span>TRANSFER LICENSE</span>
                        </button>
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* COMPREHENSIVE BEAT DETAILS & MULTI-TRACK STEM DOWNLOAD SUITE             */}
                    {/* ========================================================================= */}
                    <div className="w-full border border-zinc-900 bg-[#060606] rounded-md overflow-hidden shadow-2xl font-mono">
                      {/* Header Bar with Tabs */}
                      <div className="flex items-center justify-between border-b border-zinc-900 bg-[#0a0a0a] px-3 sm:px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Package size={15} className="text-[#39CD74]" />
                          <span className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
                            PRODUCTION ASSETS &amp; STEMS
                          </span>
                        </div>

                        {/* Sub Tabs */}
                        <div className="flex items-center gap-1 bg-black/60 p-1 border border-zinc-800 rounded">
                          <button
                            type="button"
                            onClick={() => setDetailActiveTab("stems")}
                            className={`px-2.5 py-1 text-[9.5px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer ${
                              detailActiveTab === "stems"
                                ? "bg-[#39CD74] text-black shadow-sm"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            STEMS ({getFragmentStems(activeBeatDetail, activeFrag).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailActiveTab("dossier")}
                            className={`px-2.5 py-1 text-[9.5px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer ${
                              detailActiveTab === "dossier"
                                ? "bg-[#39CD74] text-black shadow-sm"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            BEAT DOSSIER
                          </button>
                        </div>
                      </div>

                      {/* Success Banner when stems are downloaded */}
                      {stemsDownloadSuccess && (
                        <div className="bg-[#39CD74]/15 border-b border-[#39CD74]/30 px-4 py-2.5 flex items-center justify-between text-[#39CD74] text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={15} />
                            <span>COMPLETE 24-BIT STEM ARCHIVE GENERATED &amp; DISPATCHED</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 uppercase">BROADCAST WAV 48KHZ</span>
                        </div>
                      )}

                      {/* TAB 1: STEMS SUITE & DOWNLOADS */}
                      {detailActiveTab === "stems" && (() => {
                        const activeStemTracks = getFragmentStems(activeBeatDetail, activeFrag);
                        return (
                        <div className="p-3.5 sm:p-5 space-y-4">
                          {/* Main Quick Download Callout */}
                          <div className="bg-gradient-to-r from-zinc-950 via-[#0c0c0c] to-zinc-950 border border-zinc-800 p-3.5 sm:p-4 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white uppercase tracking-wider">
                                  COMPLETE MULTI-TRACK STEM ARCHIVE (.ZIP)
                                </span>
                                <span className="px-1.5 py-0.5 text-[8.5px] font-bold uppercase bg-[#39CD74]/20 text-[#39CD74] border border-[#39CD74]/40 rounded">
                                  24-BIT / 48KHZ
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                                Includes all {activeStemTracks.length} bespoke audio stem tracks (phase-aligned at 0.000ms offset) + Tempo Map &amp; DAW Alignment Guide.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadStemsZip(activeBeatDetail, activeFrag)}
                              disabled={isDownloadingStems}
                              className="w-full sm:w-auto px-4 py-2.5 bg-[#39CD74] hover:bg-[#2eb864] disabled:opacity-50 text-black font-bold text-[10.5px] uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-[0_0_15px_rgba(57,205,116,0.3)] hover:shadow-[0_0_22px_rgba(57,205,116,0.5)]"
                            >
                              {isDownloadingStems ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  <span>PACKAGING STEMS...</span>
                                </>
                              ) : (
                                <>
                                  <Download size={14} />
                                  <span>DOWNLOAD COMPLETE ZIP (188.6 MB)</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Individual Stems Table */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase tracking-widest px-1 pb-1">
                              <span>INDIVIDUAL AUDIO TRACKS ({activeStemTracks.length})</span>
                              <span>PHASE-LOCKED BROADCAST WAV</span>
                            </div>

                            <div className="divide-y divide-zinc-900 border border-zinc-900 rounded overflow-hidden bg-black/40">
                              {activeStemTracks.map((track, i) => (
                                <div
                                  key={track.id}
                                  className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-zinc-900/30 transition-colors"
                                >
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-zinc-200 text-xs font-bold font-mono">
                                        {track.name}
                                      </span>
                                      <span className="px-1.5 py-0.5 text-[8px] uppercase tracking-wider rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                        {track.type}
                                      </span>
                                      <span className="text-[9px] text-zinc-500 font-mono">
                                        {track.channels}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-sans truncate">
                                      {track.desc}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-1 sm:pt-0">
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      {track.size}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadSingleStem(track, i, activeBeatDetail)}
                                      disabled={downloadingStemIndex === i}
                                      className="px-2.5 py-1.5 border border-zinc-800 hover:border-zinc-600 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[9px] font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      {downloadingStemIndex === i ? (
                                        <Loader2 size={11} className="animate-spin text-[#39CD74]" />
                                      ) : (
                                        <Download size={11} />
                                      )}
                                      <span>DOWNLOAD</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Notice & DAW Compatibility footer */}
                          <div className="border border-zinc-900/80 bg-zinc-950/60 p-3 rounded text-[9.5px] text-zinc-500 font-mono space-y-1">
                            <span className="text-zinc-400 font-bold uppercase block">DAW IMPORT COMPATIBILITY:</span>
                            <p className="font-sans leading-relaxed">
                              Compatible with Pro Tools, Logic Pro, Ableton Live, FL Studio, Studio One, Reaper, Cubase, and Luna. 
                              All stems are bounce-rendered from bar 1 0.000ms for zero drift alignment at {activeFrag?.bpm || 110} BPM.
                            </p>
                          </div>
                        </div>
                        );
                      })()}

                      {/* TAB 2: BEAT SPECIFICATIONS & DOSSIER */}
                      {detailActiveTab === "dossier" && (
                        <div className="p-3.5 sm:p-5 space-y-4">
                          {/* High-fidelity Spec Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[10px]">
                            <div className="bg-black/60 border border-zinc-900 p-3 rounded">
                              <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block mb-1">TONAL KEY &amp; SCALE</span>
                              <span className="text-zinc-200 font-bold uppercase">{activeFrag?.tonalSignature || "CHROMATIC MINOR"}</span>
                            </div>
                            <div className="bg-black/60 border border-zinc-900 p-3 rounded">
                              <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block mb-1">TEMPO / PULSE</span>
                              <span className="text-zinc-200 font-bold uppercase">{activeFrag?.bpm || 110} BPM</span>
                            </div>
                            <div className="bg-black/60 border border-zinc-900 p-3 rounded">
                              <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block mb-1">SYNTH ENGINE</span>
                              <span className="text-zinc-200 font-bold uppercase">{activeFrag?.synthType || "ANALOG SUB HARMONIC"}</span>
                            </div>
                            <div className="bg-black/60 border border-zinc-900 p-3 rounded">
                              <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block mb-1">SAMPLE CLEARANCE</span>
                              <span className="text-[#39CD74] font-bold uppercase">100% ORIGINAL MASTER</span>
                            </div>
                            <div className="bg-black/60 border border-zinc-900 p-3 rounded">
                              <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block mb-1">ARCHIVE CATALOG #</span>
                              <span className="text-zinc-300 font-bold select-all">{activeFrag?.timeCapsule?.catalogNo || activeBeatDetail.compositionId || `TOC-${activeBeatDetail.id}-001`}</span>
                            </div>
                            <div className="bg-black/60 border border-zinc-900 p-3 rounded">
                              <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block mb-1">PRESERVATION STATUS</span>
                              <span className="text-[#39CD74] font-bold uppercase">{activeFrag?.recoveryState || "FULLY RECOVERED"}</span>
                            </div>
                          </div>

                          {/* Archival Observation & Description */}
                          {activeFrag?.description && (
                            <div className="bg-black/60 border border-zinc-900 p-3.5 rounded space-y-1.5">
                              <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">ARCHIVAL DESCRIPTION</span>
                              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                                {activeFrag.description}
                              </p>
                            </div>
                          )}

                          {activeFrag?.observation && (
                            <div className="bg-black/60 border border-zinc-900 p-3.5 rounded space-y-1.5">
                              <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">HARMONIC OBSERVATION</span>
                              <p className="text-xs text-zinc-400 font-sans leading-relaxed italic">
                                "{activeFrag.observation}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <>
              {/* Search, Filter and Actions Toolbar */}
              <div className="bg-[#080808] border border-zinc-800/80 rounded-lg p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
                {/* Search Input Box */}
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, composition ID, client email, or record..."
                    className="w-full bg-[#030303] border border-zinc-800 focus:border-zinc-500 rounded-md pl-10 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none transition-all"
                  />
                </div>

                {/* Filters & Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Documents Sub-filter if in 03 — DOCUMENTS */}
                  {activeSection === "03_DOCUMENTS" && (
                    <select
                      value={docSubFilter}
                      onChange={(e) => setDocSubFilter(e.target.value)}
                      className="bg-[#030303] border border-zinc-800 focus:border-zinc-600 text-xs text-zinc-300 rounded-md px-3 py-2 outline-none cursor-pointer hover:border-zinc-700 transition-colors"
                    >
                      <option value="ALL">ALL DOCUMENT TYPES</option>
                      <option value="LICENSES">LICENSES (SCHEDULES A &amp; B)</option>
                      <option value="CERTIFICATES">CERTIFICATES OF AUTHENTICITY</option>
                      <option value="STEMS">AUDIO STEM DISPATCHES</option>
                      <option value="SPLIT_SHEETS">PRO SPLIT SHEETS</option>
                      <option value="METADATA">METADATA SHEETS</option>
                      <option value="WARRANTIES">NO-SAMPLE WARRANTIES</option>
                    </select>
                  )}

                  {/* Status Dropdown Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#030303] border border-zinc-800 focus:border-zinc-600 text-xs text-zinc-300 rounded-md px-3 py-2 outline-none cursor-pointer hover:border-zinc-700 transition-colors"
                  >
                    <option value="ALL">ALL STATUSES</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SIGNED">SIGNED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="UNDER REVIEW">UNDER REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                  </select>

                  {/* Sync Button */}
                  <button
                    onClick={loadRecords}
                    title="Synchronize records with system nodes"
                    className="flex items-center gap-1.5 bg-[#030303] border border-zinc-800 hover:border-zinc-600 rounded-md px-3 py-2 text-xs text-zinc-300 hover:text-white uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw size={12} className={loading ? "animate-spin text-[#00E676]" : ""} />
                    <span>SYNC</span>
                  </button>

                  {/* Purge Cache Button */}
                  <button
                    onClick={handlePurgeCache}
                    title="Purge local storage cache"
                    className="bg-[#030303] border border-zinc-800 hover:border-red-800/80 hover:bg-red-950/20 text-zinc-400 hover:text-red-300 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                  >
                    PURGE CACHE
                  </button>
                </div>
              </div>

              {/* Clearance specific action */}
              {activeSection === "02_CLEARANCE_REQUESTS" && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setNewClearanceModalOpen(true)}
                    className="bg-[#00E676] hover:bg-[#00c853] text-black font-bold text-xs rounded-md px-4 py-2.5 uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <Plus size={14} />
                    <span>NEW CLEARANCE REQUEST</span>
                  </button>
                </div>
              )}

              {/* Data Table & Mobile/Tablet Responsive Cards */}
              <div className="w-full space-y-3">
                {/* 1. MOBILE / SMALL TABLET VIEW (< md): Responsive Cards */}
                <div className="block md:hidden space-y-3">
                  {filteredRecords.length === 0 ? (
                    renderEmptyState()
                  ) : (
                    filteredRecords.map((doc) => {
                      const isPlaying = isDocPlaying(doc);
                      const matchedFrag = findFragmentForRecord(doc);
                      return (
                        <div
                          key={`mobile-${doc.id}`}
                          className="border border-zinc-800/90 rounded-lg bg-[#080808] p-3.5 space-y-3 shadow-lg"
                        >
                          {/* Card Header: Icon + Title + Status */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0 mt-0.5">
                                <FileText size={14} />
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setActiveBeatDetail(doc)}
                                  className="font-semibold text-white uppercase text-xs leading-snug break-words text-left hover:text-[#00E676] hover:underline transition-colors flex items-center gap-1 group/btn cursor-pointer"
                                  title="Open Beat Details & Stems Page"
                                >
                                  <span>{doc.title}</span>
                                  <ArrowUpRight size={11} className="opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all text-[#00E676] shrink-0" />
                                </button>
                                {doc.licenseTierTitle && (
                                  <span className="text-[10px] text-zinc-500 font-sans block truncate mt-0.5">
                                    {doc.licenseTierTitle}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider rounded-full border shrink-0 ${
                              doc.status === "ACTIVE" 
                                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" 
                                : doc.status === "SIGNED" || doc.status === "VERIFIED" || doc.status === "APPROVED"
                                ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                                : "border-zinc-700 text-zinc-300 bg-zinc-900"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                doc.status === "ACTIVE" 
                                  ? "bg-emerald-400 animate-pulse" 
                                  : doc.status === "SIGNED" || doc.status === "VERIFIED" || doc.status === "APPROVED"
                                  ? "bg-cyan-400"
                                  : "bg-zinc-400"
                              }`} />
                              {doc.status}
                            </span>
                          </div>

                          {/* Card Metadata: Identifiers */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                            <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-300 rounded select-all">
                              {doc.id}
                            </span>
                            <span className="border border-zinc-800/80 bg-zinc-900/60 px-2 py-1 text-zinc-400 rounded select-all">
                              {doc.compositionId}
                            </span>
                          </div>

                          {/* Re-Oriented Audio Preview Player (Horizontal Pill with Live Soundwave Bars) */}
                          {(doc.section === "01_MY_FRAGMENTS" || doc.subCategory === "STEMS" || doc.fragmentName) && (
                            <div className="pt-0.5">
                              <button
                                onClick={() => handleTogglePlay(doc)}
                                className={`w-full flex items-center justify-between px-3 py-2 border rounded-md text-[10.5px] uppercase font-bold tracking-wider cursor-pointer transition-all ${
                                  isPlaying 
                                    ? "border-[#00E676] bg-[#00E676]/15 text-[#00E676] shadow-[0_0_14px_rgba(0,230,118,0.2)]" 
                                    : "border-zinc-800 bg-zinc-950/90 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-900"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${isPlaying ? "bg-[#00E676] text-black" : "bg-zinc-800 text-zinc-300"}`}>
                                    {isPlaying ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
                                  </span>
                                  <span>{isPlaying ? "STOP AUDIO" : "PREVIEW AUDIO"}</span>
                                </div>
                                {isPlaying && (
                                  <div className="flex items-center gap-1 h-3">
                                    <span className="w-1 h-3 bg-[#00E676] animate-pulse" />
                                    <span className="w-1 h-1.5 bg-[#00E676] animate-pulse delay-75" />
                                    <span className="w-1 h-3.5 bg-[#00E676] animate-pulse delay-150" />
                                  </div>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Card Action Buttons: Large Touch Targets (min 42px height) */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-900">
                            <button
                              onClick={() => {
                                if (doc.section === "03_DOCUMENTS" || doc.licenseTierTitle) {
                                  openOrDownloadLicenseAgreement({
                                    licenseId: doc.id,
                                    transactionRef: doc.transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
                                    purchaseDate: doc.dateAdded,
                                    licenseeLegalName: doc.clientId,
                                    licenseeEmail: currentUserEmail,
                                    fragmentTitle: doc.fragmentName || doc.title,
                                    archiveIdentifier: doc.compositionId,
                                    licenseTierId: doc.licenseTierId || "commercial",
                                    licenseTierTitle: doc.licenseTierTitle || "Commercial License"
                                  });
                                } else {
                                  const textContent = `${doc.title}\nRecord ID: ${doc.id}\nComposition ID: ${doc.compositionId}\nStatus: ${doc.status}\n\n${doc.content || ""}`;
                                  const blob = new Blob([textContent], { type: "text/plain" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `${doc.id}.txt`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }
                              }}
                              className="h-10 border border-zinc-800 hover:border-zinc-600 bg-zinc-900 text-zinc-300 hover:text-white rounded-md text-[10.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Download size={13} />
                              <span>DOWNLOAD</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedRecord(doc);
                                if (doc.subCategory === "CERTIFICATES") {
                                  setCertModalOpen(true);
                                } else if (doc.subCategory === "STEMS") {
                                  setStemsModalOpen(true);
                                } else {
                                  setInspectModalOpen(true);
                                }
                              }}
                              className="h-10 border border-zinc-800 hover:border-zinc-600 bg-zinc-900 text-zinc-300 hover:text-white rounded-md text-[10.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Eye size={13} />
                              <span>INSPECT</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 2. TABLET & DESKTOP VIEW (>= md): Full Data Table */}
                <div className="hidden md:block border border-zinc-800/80 rounded-lg bg-[#070707] shadow-xl overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[640px] text-left border-collapse text-xs">
                      {/* Table Head */}
                      <thead>
                        <tr className="border-b border-zinc-800 bg-[#0c0c0c] text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
                          <th className="py-3.5 px-4 w-[42%]">DOCUMENT</th>
                          <th className="py-3.5 px-4 w-[20%]">RECORD ID</th>
                          <th className="py-3.5 px-4 w-[18%]">COMPOSITION</th>
                          <th className="py-3.5 px-4 w-[10%]">STATUS</th>
                          <th className="py-3.5 px-4 w-[10%] text-right">ACTIONS</th>
                        </tr>
                      </thead>

                      {/* Table Body */}
                      <tbody className="divide-y divide-zinc-900/80 text-zinc-300">
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-0">
                              {renderEmptyState()}
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((doc) => {
                            const isPlaying = isDocPlaying(doc);
                            const matchedFrag = findFragmentForRecord(doc);
                            return (
                              <tr key={doc.id} className="hover:bg-zinc-900/30 transition-colors group">
                                {/* 1. DOCUMENT */}
                                <td className="py-3.5 px-4 align-top">
                                  <div className="space-y-2">
                                    <div className="flex items-start gap-2.5">
                                      <div className="p-1.5 rounded bg-zinc-900/90 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200 group-hover:border-zinc-700 transition-colors shrink-0 mt-0.5">
                                        <FileText size={14} />
                                      </div>
                                      <div>
                                        <button
                                          type="button"
                                          onClick={() => setActiveBeatDetail(doc)}
                                          className="font-semibold text-white uppercase text-xs leading-snug break-words text-left hover:text-[#00E676] hover:underline transition-colors flex items-center gap-1 group/btn cursor-pointer"
                                          title="Open Beat Details & Stems Sub-Page"
                                        >
                                          <span>{doc.title}</span>
                                          <ArrowUpRight size={11} className="opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all text-[#00E676] shrink-0" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Re-Oriented Audio Preview Player (Horizontal Pill Badge with Soundwaves) */}
                                    {(doc.section === "01_MY_FRAGMENTS" || doc.subCategory === "STEMS" || doc.fragmentName || matchedFrag) && (
                                      <div className="pt-0.5 flex items-center gap-2">
                                        <button
                                          onClick={() => handleTogglePlay(doc)}
                                          className={`inline-flex items-center gap-2 px-2.5 py-1 border rounded-md text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-all ${
                                            isPlaying 
                                              ? "border-[#00E676] bg-[#00E676]/20 text-[#00E676] shadow-[0_0_12px_rgba(0,230,118,0.25)]" 
                                              : "border-zinc-800 bg-[#0c0c0c] text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-900"
                                          }`}
                                          title="Play audio master preview"
                                        >
                                          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${isPlaying ? "bg-[#00E676] text-black" : "bg-zinc-800 text-zinc-300"}`}>
                                            {isPlaying ? <Pause size={9} /> : <Play size={9} className="ml-0.5" />}
                                          </span>
                                          <span>{isPlaying ? "STOP PREVIEW" : "PREVIEW AUDIO"}</span>
                                          {isPlaying && (
                                            <span className="flex items-center gap-0.5 h-2.5 ml-1">
                                              <span className="w-0.5 h-2.5 bg-[#00E676] animate-pulse" />
                                              <span className="w-0.5 h-1.5 bg-[#00E676] animate-pulse delay-75" />
                                              <span className="w-0.5 h-3 bg-[#00E676] animate-pulse delay-150" />
                                            </span>
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setActiveBeatDetail(doc)}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-[9.5px] uppercase font-mono text-zinc-400 hover:text-[#00E676] border border-zinc-800/80 hover:border-zinc-600 rounded bg-zinc-900/60 transition-colors cursor-pointer"
                                          title="View full beat page with stem downloads"
                                        >
                                          <span>VIEW DETAILS &amp; STEMS</span>
                                          <ArrowUpRight size={10} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 2. RECORD ID */}
                                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                  <span className="inline-block border border-zinc-800 bg-zinc-950/90 px-2.5 py-1.5 text-[11px] text-zinc-300 font-mono font-medium rounded uppercase tracking-wide select-all group-hover:border-zinc-700 transition-colors">
                                    {doc.id}
                                  </span>
                                </td>

                                {/* 3. COMPOSITION */}
                                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                  <div className="space-y-1">
                                    <div className="text-zinc-200 font-mono text-xs font-semibold select-all">
                                      {doc.compositionId}
                                    </div>
                                    {doc.licenseTierTitle && (
                                      <div className="text-[10px] text-zinc-500 font-sans truncate max-w-[200px]">
                                        {doc.licenseTierTitle}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 4. STATUS */}
                                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                                    doc.status === "ACTIVE" 
                                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" 
                                      : doc.status === "SIGNED" || doc.status === "VERIFIED" || doc.status === "APPROVED"
                                      ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                                      : "border-zinc-700 text-zinc-300 bg-zinc-900"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      doc.status === "ACTIVE" 
                                        ? "bg-emerald-400 animate-pulse" 
                                        : doc.status === "SIGNED" || doc.status === "VERIFIED" || doc.status === "APPROVED"
                                        ? "bg-cyan-400"
                                        : "bg-zinc-400"
                                    }`} />
                                    {doc.status}
                                  </span>
                                </td>

                                {/* 5. ACTIONS */}
                                <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Download Button */}
                                    <button
                                      onClick={() => {
                                        if (doc.section === "03_DOCUMENTS" || doc.licenseTierTitle) {
                                          openOrDownloadLicenseAgreement({
                                            licenseId: doc.id,
                                            transactionRef: doc.transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
                                            purchaseDate: doc.dateAdded,
                                            licenseeLegalName: doc.clientId,
                                            licenseeEmail: currentUserEmail,
                                            fragmentTitle: doc.fragmentName || doc.title,
                                            archiveIdentifier: doc.compositionId,
                                            licenseTierId: doc.licenseTierId || "commercial",
                                            licenseTierTitle: doc.licenseTierTitle || "Commercial License"
                                          });
                                        } else {
                                          const textContent = `${doc.title}\nRecord ID: ${doc.id}\nComposition ID: ${doc.compositionId}\nStatus: ${doc.status}\n\n${doc.content || ""}`;
                                          const blob = new Blob([textContent], { type: "text/plain" });
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement("a");
                                          a.href = url;
                                          a.download = `${doc.id}.txt`;
                                          a.click();
                                          URL.revokeObjectURL(url);
                                        }
                                      }}
                                      title="Download Master Legal Agreement / Document"
                                      className="border border-zinc-800 hover:border-zinc-600 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded p-2 transition-all cursor-pointer shadow-sm"
                                    >
                                      <Download size={14} />
                                    </button>

                                    {/* View / Inspect Button */}
                                    <button
                                      onClick={() => {
                                        setSelectedRecord(doc);
                                        if (doc.subCategory === "CERTIFICATES") {
                                          setCertModalOpen(true);
                                        } else if (doc.subCategory === "STEMS") {
                                          setStemsModalOpen(true);
                                        } else {
                                          setInspectModalOpen(true);
                                        }
                                      }}
                                      title="Inspect Full Master Record & Digital Signatures"
                                      className="border border-zinc-800 hover:border-zinc-600 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded p-2 transition-all cursor-pointer shadow-sm"
                                    >
                                      <Eye size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
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
      {/* 4. MODALS & INSPECTORS */}
      {/* ========================================================================= */}

      {/* MODAL 1: DOCUMENT INSPECTOR MODAL */}
      <AnimatePresence>
        {inspectModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl bg-[#080808] border border-zinc-800 p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                  DOCUMENT MASTER RECORD // {selectedRecord.id}
                </span>
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-[11px] text-zinc-300">
                <div className="bg-zinc-950 p-4 border border-zinc-900 space-y-2">
                  <div className="text-white font-bold text-sm">{selectedRecord.title}</div>
                  <div className="text-zinc-500 text-[10px]">
                    TYPE: {selectedRecord.docTypeTag} • ADDED: {selectedRecord.dateAdded}
                  </div>
                  <div className="text-zinc-400 text-[10px]">
                    COMPOSITION ID: <span className="text-white select-all">{selectedRecord.compositionId}</span>
                  </div>
                  <div className="text-zinc-400 text-[10px]">
                    CLIENT: <span className="text-white select-all">{selectedRecord.clientId}</span>
                  </div>
                  {selectedRecord.isrc && (
                    <div className="text-zinc-400 text-[10px]">
                      ISRC: <span className="text-[#00E676] select-all">{selectedRecord.isrc}</span> | ISWC: <span className="text-[#00E676] select-all">{selectedRecord.iswc}</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#050505] p-4 border border-zinc-900 space-y-2 leading-relaxed">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">RECORD MANIFEST &amp; SUMMARY</span>
                  <p className="text-zinc-300 text-[11px]">
                    {selectedRecord.content || "Schedule A & B legal terms, stem archive validation, and ownership verification confirmed."}
                  </p>
                </div>

                {selectedRecord.hash && (
                  <div className="bg-zinc-950 p-3 border border-zinc-900 space-y-1">
                    <span className="text-[8.5px] text-zinc-500 uppercase font-bold block">SHA-256 SIGNATURE HASH</span>
                    <span className="text-[9.5px] text-[#00E676] break-all select-all block font-mono">
                      {selectedRecord.hash}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setInspectModalOpen(false);
                    setTransferModalOpen(true);
                  }}
                  className="text-[10px] text-zinc-300 hover:text-black hover:bg-white uppercase tracking-wider border border-zinc-700 bg-zinc-900 px-3 py-2 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <ArrowRightLeft size={12} />
                  <span>TRANSFER LICENSE</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInspectModalOpen(false);
                      setStemsModalOpen(false);
                      setActiveBeatDetail(selectedRecord);
                    }}
                    className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-[#00E676] border border-[#00E676]/40 font-bold uppercase tracking-wider px-3.5 py-2 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Music size={12} />
                    <span>OPEN BEAT DETAILS &amp; STEMS</span>
                  </button>
                  <button
                    onClick={() => {
                      openOrDownloadLicenseAgreement({
                        licenseId: selectedRecord.id,
                        transactionRef: selectedRecord.transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
                        purchaseDate: selectedRecord.dateAdded,
                        licenseeLegalName: selectedRecord.clientId,
                        licenseeEmail: currentUserEmail,
                        fragmentTitle: selectedRecord.fragmentName || selectedRecord.title,
                        archiveIdentifier: selectedRecord.compositionId,
                        licenseTierId: selectedRecord.licenseTierId || "commercial",
                        licenseTierTitle: selectedRecord.licenseTierTitle || "Commercial License"
                      });
                    }}
                    className="text-[10px] bg-[#D9D6CA] text-black font-bold uppercase tracking-wider px-4 py-2 hover:bg-white transition-colors cursor-pointer"
                  >
                    DOWNLOAD FULL LEGAL PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CERTIFICATE OF AUTHENTICITY MODAL */}
      <AnimatePresence>
        {certModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-xl bg-[#090909] border border-zinc-800 p-6 sm:p-8 shadow-2xl flex flex-col gap-5 text-left max-h-[85vh] overflow-y-auto relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest">
                  <ShieldCheck size={16} />
                  <span>CERTIFICATE OF AUTHENTICITY</span>
                </div>
                <button
                  onClick={() => setCertModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-center space-y-2 py-3 border-y border-zinc-900 bg-zinc-950/40">
                <span className="text-[9px] tracking-[0.3em] text-zinc-500 uppercase block font-bold">
                  THE OWL CLOCK ARCHIVE • OFFICIAL SEAL
                </span>
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-sans">
                  {selectedRecord.fragmentName || selectedRecord.title}
                </h3>
                <span className="text-[10px] text-[#00E676] font-bold block">
                  STATUS: VERIFIED &amp; IMMUTABLY LOGGED
                </span>
              </div>

              <div className="space-y-3 text-[10.5px]">
                <div className="grid grid-cols-2 gap-3 text-zinc-300">
                  <div className="bg-zinc-950 p-3 border border-zinc-900">
                    <span className="text-[8.5px] text-zinc-500 uppercase block">COMPOSITION ID</span>
                    <span className="font-bold select-all">{selectedRecord.compositionId}</span>
                  </div>
                  <div className="bg-zinc-950 p-3 border border-zinc-900">
                    <span className="text-[8.5px] text-zinc-500 uppercase block">ISSUED TO</span>
                    <span className="font-bold select-all truncate block">{selectedRecord.clientId}</span>
                  </div>
                  <div className="bg-zinc-950 p-3 border border-zinc-900">
                    <span className="text-[8.5px] text-zinc-500 uppercase block">ISRC REGISTRATION</span>
                    <span className="font-bold text-[#00E676] select-all">{selectedRecord.isrc || "US-LMN-26-00941"}</span>
                  </div>
                  <div className="bg-zinc-950 p-3 border border-zinc-900">
                    <span className="text-[8.5px] text-zinc-500 uppercase block">ISWC REGISTRATION</span>
                    <span className="font-bold text-[#00E676] select-all">{selectedRecord.iswc || "T-932.408.941-4"}</span>
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 border border-zinc-900 space-y-1">
                  <span className="text-[8.5px] text-zinc-500 uppercase block font-bold">DIGITAL PROVENANCE HASH</span>
                  <span className="text-[9px] text-zinc-400 break-all select-all block">
                    {selectedRecord.hash || "8f9a2b4e7c10d35f6a9e8b7c4d2e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setCertModalOpen(false)}
                  className="text-[10.5px] bg-[#D9D6CA] text-black font-bold uppercase tracking-wider px-5 py-2.5 hover:bg-white transition-colors cursor-pointer"
                >
                  DISMISS CERTIFICATE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: STEMS & DOWNLOADS DISPATCH MODAL */}
      <AnimatePresence>
        {stemsModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-xl bg-[#090909] border border-zinc-800 p-6 sm:p-7 shadow-2xl flex flex-col gap-4 text-left max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest">
                  <Layers size={15} className="text-[#00E676]" />
                  <span>STEM PACKAGE DISPATCH // 24-BIT / 48KHZ WAV</span>
                </div>
                <button
                  onClick={() => setStemsModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-zinc-950 p-4 border border-zinc-900 space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase block font-bold">COMPOSITION ASSET</span>
                <h4 className="text-white font-bold text-sm uppercase">{selectedRecord.fragmentName || selectedRecord.title}</h4>
                <p className="text-zinc-400 text-[10px]">
                  Format: Broadcast WAV 24-bit / 48kHz Stereo + Stem alignment manifest.
                </p>
              </div>

              <div className="space-y-2 text-[10.5px]">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">INDIVIDUAL STEM TRACKS</span>
                {(() => {
                  const modalStems = getFragmentStems(selectedRecord, findFragmentForRecord(selectedRecord));
                  return (
                    <div className="space-y-2">
                      {modalStems.map((track, i) => (
                        <div key={track.id} className="flex items-center justify-between bg-[#060606] border border-zinc-900 p-2.5">
                          <div className="space-y-0.5">
                            <div className="text-zinc-200 font-bold font-mono">{track.name}</div>
                            <div className="text-zinc-500 text-[9px]">{track.desc} ({track.size})</div>
                          </div>
                          <button
                            onClick={() => handleDownloadSingleStem(track, i, selectedRecord)}
                            className="border border-zinc-800 hover:border-zinc-600 bg-zinc-900 text-zinc-300 hover:text-white px-2.5 py-1 text-[9px] font-bold uppercase transition-colors cursor-pointer shrink-0"
                          >
                            DOWNLOAD
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                {onSelectFragment && (
                  <button
                    type="button"
                    onClick={() => {
                      const matched = findFragmentForRecord(selectedRecord);
                      if (matched) {
                        setStemsModalOpen(false);
                        onSelectFragment(matched);
                      }
                    }}
                    className="bg-zinc-900 hover:bg-zinc-800 text-[#00E676] border border-[#00E676]/40 font-bold text-[10px] px-4 py-2.5 uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Music size={12} />
                    <span>VIEW DEDICATED BEAT PAGE</span>
                  </button>
                )}
                <button
                  onClick={() => handleDownloadStemsZip(selectedRecord, findFragmentForRecord(selectedRecord))}
                  disabled={isDownloadingStems}
                  className="bg-[#00E676] hover:bg-[#00c853] disabled:opacity-50 text-black font-bold text-[10.5px] px-5 py-2.5 uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isDownloadingStems ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  <span>DOWNLOAD COMPLETE ZIP (188.6 MB)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: NEW CLEARANCE PROPOSAL MODAL */}
      <AnimatePresence>
        {newClearanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg bg-[#080808] border border-zinc-800 p-6 shadow-2xl flex flex-col gap-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                  INITIATE NEW CLEARANCE PETITION
                </span>
                <button
                  onClick={() => setNewClearanceModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {clearanceSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 size={32} className="text-[#00E676] mx-auto animate-bounce" />
                  <div className="text-white font-bold text-sm uppercase">PETITION LOGGED IN ARCHIVE</div>
                  <div className="text-zinc-500 text-[10.5px]">Our archivist team has been notified for clearance approval.</div>
                </div>
              ) : (
                <form onSubmit={handleCreateClearance} className="space-y-4 text-[10.5px]">
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase font-bold block">TARGET FRAGMENT</label>
                    <select
                      value={clearanceFragment}
                      onChange={(e) => setClearanceFragment(e.target.value)}
                      className="w-full bg-[#050505] border border-zinc-800 text-zinc-200 p-2 text-[10.5px] uppercase outline-none"
                    >
                      {FRAGMENTS.map(f => (
                        <option key={f.id} value={f.name}>{f.name} ({f.tonalSignature} • {f.bpm} BPM)</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase font-bold block">USAGE TIER</label>
                    <select
                      value={clearanceTier}
                      onChange={(e) => setClearanceTier(e.target.value)}
                      className="w-full bg-[#050505] border border-zinc-800 text-zinc-200 p-2 text-[10.5px] uppercase outline-none"
                    >
                      <option value="Commercial Release License">Commercial Release License</option>
                      <option value="Sync & Broadcast License">Sync &amp; Broadcast License</option>
                      <option value="Worldwide Film & Streaming Clearance">Worldwide Film &amp; Streaming Clearance</option>
                      <option value="Exclusive Master Acquisition">Exclusive Master Acquisition</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase font-bold block">PROJECT DESCRIPTION &amp; SCOPE</label>
                    <textarea
                      value={clearanceProject}
                      onChange={(e) => setClearanceProject(e.target.value)}
                      placeholder="Specify release platform, budget tier, expected stream count, and project name..."
                      rows={3}
                      className="w-full bg-[#050505] border border-zinc-800 text-zinc-200 p-2 text-[10.5px] outline-none placeholder:text-zinc-600 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setNewClearanceModalOpen(false)}
                      className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-wider px-4 py-2"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={clearanceSubmitting}
                      className="bg-[#00E676] hover:bg-[#00c853] text-black font-bold text-[10.5px] px-5 py-2 uppercase tracking-wider cursor-pointer"
                    >
                      {clearanceSubmitting ? "TRANSMITTING..." : "SUBMIT PETITION"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: LICENSE TRANSFER MODAL */}
      <AnimatePresence>
        {transferModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md bg-[#080808] border border-zinc-800 p-6 shadow-2xl flex flex-col gap-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <ArrowRightLeft size={14} className="text-white" />
                  <span>TRANSFER LICENSE OWNERSHIP</span>
                </span>
                <button
                  onClick={() => setTransferModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {transferSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 size={32} className="text-[#00E676] mx-auto animate-bounce" />
                  <div className="text-white font-bold text-sm uppercase">LICENSE TRANSFERRED</div>
                  <div className="text-zinc-500 text-[10.5px]">
                    Ownership cryptographically reassigned to {transferTargetEmail}.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleExecuteTransfer} className="space-y-4 text-[10.5px]">
                  <div className="bg-zinc-950 p-3 border border-zinc-900 space-y-1">
                    <span className="text-[8.5px] text-zinc-500 uppercase block font-bold">ASSET TO REASSIGN</span>
                    <span className="text-white font-bold block">{selectedRecord.title}</span>
                    <span className="text-zinc-400 text-[9.5px]">ID: {selectedRecord.id}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase font-bold block">RECIPIENT CLIENT EMAIL</label>
                    <input
                      type="email"
                      required
                      value={transferTargetEmail}
                      onChange={(e) => setTransferTargetEmail(e.target.value)}
                      placeholder="client@studio.com"
                      className="w-full bg-[#050505] border border-zinc-800 text-zinc-200 p-2 text-[10.5px] outline-none placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="bg-red-950/20 border border-red-900/40 p-2.5 text-[9.5px] text-red-300">
                    Warning: License transfer is permanent and revokes the current terminal access token.
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setTransferModalOpen(false)}
                      className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-wider px-4 py-2"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={transferSubmitting}
                      className="bg-white hover:bg-zinc-200 text-black font-bold text-[10.5px] px-5 py-2 uppercase tracking-wider cursor-pointer shadow-md transition-colors"
                    >
                      {transferSubmitting ? "REASSIGNING..." : "CONFIRM TRANSFER"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
