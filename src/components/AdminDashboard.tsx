import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import FragmentDetailPage from "./FragmentDetailPage";
import { 
  Folder, File, Image, Music, FileText, Check, Plus, Trash2, 
  Copy, Archive, Edit2, Download, ExternalLink, Settings as SettingsIcon, 
  Activity, Users, ShoppingBag, Database, ArrowUpRight, BarChart3, Upload, Loader2, Play, X
} from "lucide-react";
import { Fragment } from "../data";
import { DEFAULT_LICENSE_TEMPLATES, LicenseTemplate } from "../licenses";

// Type definitions matching user specifications
export type AdminTab = 
  | "Dashboard" 
  | "Fragments" 
  | "New Fragment" 
  | "Orders" 
  | "Customers" 
  | "Analytics" 
  | "Media Library" 
  | "Settings";

interface AdminDashboardProps {
  onClose?: () => void;
  currentUserEmail: string;
}

// Initial default settings
const INITIAL_SETTINGS = {
  paymentMethods: { paystack: true, stripe: false, crypto: true },
  storeName: "LOMON ARCHIVE",
  address: "Atlanta, Georgia",
  branding: "Classic Monochromatic Slate",
  taxRate: 0,
  emailNotifications: true
};

export default function AdminDashboard({ onClose, currentUserEmail }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("Dashboard");

  // Load / initialize fragments list
  const [fragments, setFragments] = useState<Fragment[]>([]);

  useEffect(() => {
    fetch("/api/fragments")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.fragments)) {
          setFragments(data.fragments);
        } else {
          // Fallback to local storage if API is unsuccessful
          const saved = localStorage.getItem("lomon_stored_fragments");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setFragments(parsed);
          }
        }
      })
      .catch(err => {
        console.error("Failed to fetch fragments from database API:", err);
        const saved = localStorage.getItem("lomon_stored_fragments");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setFragments(parsed);
        }
      });
  }, []);

  // Track state in local storage to keep updates synchronized as secondary backup
  useEffect(() => {
    if (fragments.length > 0) {
      try {
        localStorage.setItem("lomon_stored_fragments", JSON.stringify(fragments));
      } catch (e) {
        console.error(e);
      }
    }
  }, [fragments]);

  // Initial mock orders matching specs
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("lomon_admin_orders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load admin orders", e);
    }
    return [
      { id: "ORD-2026-001", customerName: "John Doe", customerEmail: "john@example.com", fragmentName: "BANDIT", licenseType: "WAV", amountPaid: 150, date: "2026-07-01", files: ["bandit_master.wav", "bandit_preview.mp3"] },
      { id: "ORD-2026-002", customerName: "Jane Smith", customerEmail: "jane@domain.com", fragmentName: "DEEP IN THE WATER", licenseType: "Exclusive", amountPaid: 1200, date: "2026-07-03", files: ["deep_water_master.wav", "deep_water_stems.zip", "license_exclusive.pdf"] },
      { id: "ORD-2026-003", customerName: "Carlos Slim", customerEmail: "carlos@telecom.net", fragmentName: "TORE UP", licenseType: "MP3", amountPaid: 50, date: "2026-07-04", files: ["tore_up_preview.mp3"] },
      { id: "ORD-2026-004", customerName: "Alice Vance", customerEmail: "alice@sound.design", fragmentName: "OCTANE", licenseType: "Trackouts", amountPaid: 300, date: "2026-07-05", files: ["octane_stems.zip", "octane_preview.mp3"] },
      { id: "ORD-2026-005", customerName: "Bob Dylan", customerEmail: "bob@folk.com", fragmentName: "LAST LAUGH", licenseType: "Unlimited", amountPaid: 750, date: "2026-07-06", files: ["last_laugh_master.wav", "last_laugh_stems.zip", "unlimited_license.pdf"] }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("lomon_admin_orders", JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Initial mock customers matching specs
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem("lomon_admin_customers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load admin customers", e);
    }
    return [
      { name: "John Doe", email: "john@example.com", purchases: 1, totalSpent: 150 },
      { name: "Jane Smith", email: "jane@domain.com", purchases: 1, totalSpent: 1200 },
      { name: "Carlos Slim", email: "carlos@telecom.net", purchases: 1, totalSpent: 50 },
      { name: "Alice Vance", email: "alice@sound.design", purchases: 1, totalSpent: 300 },
      { name: "Bob Dylan", email: "bob@folk.com", purchases: 1, totalSpent: 750 }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("lomon_admin_customers", JSON.stringify(customers));
    } catch (e) {
      console.error(e);
    }
  }, [customers]);

  // Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("lomon_admin_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return {
            ...INITIAL_SETTINGS,
            ...parsed,
            paymentMethods: {
              ...INITIAL_SETTINGS.paymentMethods,
              ...(parsed.paymentMethods || {})
            }
          };
        }
      }
    } catch (e) {
      console.error("Failed to load admin settings", e);
    }
    return INITIAL_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("lomon_admin_settings", JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Media Library State
  const [mediaFolders, setMediaFolders] = useState({
    Images: ["cover_bandit.jpg", "cover_deep_water.jpg", "cover_kryptonite.jpg", "default_artwork.png"],
    MP3: ["bandit_preview.mp3", "deep_water_preview.mp3", "kryptonite_preview.mp3", "tore_up_preview.mp3", "octane_preview.mp3"],
    WAV: ["bandit_master.wav", "deep_water_master.wav", "kryptonite_master.wav"],
    Stems: ["bandit_stems.zip", "deep_water_stems.zip", "octane_stems.zip"],
    Documents: ["bandit_license_agreement.pdf", "split_sheet_deep_water.pdf", "lomon_terms_2026.pdf"]
  });
  const [activeMediaFolder, setActiveMediaFolder] = useState<keyof typeof mediaFolders>("Images");
  const [mediaUploadProgress, setMediaUploadProgress] = useState<number | null>(null);

  // New Fragment Creation / Editing State with local storage restore (Rule 2)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lomon_wizard_currentStep");
      if (saved) return parseInt(saved, 10) || 1;
    }
    return 1;
  });
  const [editingFragmentId, setEditingFragmentId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lomon_wizard_editingFragmentId");
    }
    return null;
  });

  // Custom interactive publishing validation and preview states
  const [ownershipConfirmed, setOwnershipConfirmed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lomon_wizard_ownershipConfirmed") === "true";
    }
    return false;
  });
  const [publicPreviewApproved, setPublicPreviewApproved] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lomon_wizard_publicPreviewApproved") === "true";
    }
    return false;
  });
  const [previewFragmentObj, setPreviewFragmentObj] = useState<Fragment | null>(null);
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});
  const [globalTemplates, setGlobalTemplates] = useState<LicenseTemplate[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lomon_license_templates");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_LICENSE_TEMPLATES;
  });

  // Step-by-Step Form state
  const [formInfo, setFormInfo] = useState<{
    timestamp: string;
    name: string;
    classification: string;
    bpm: number | "";
    key: string;
    genre: string;
    mood: string;
    status: string;
    duration: string;
  }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lomon_wizard_formInfo");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      timestamp: "",
      name: "",
      classification: "",
      bpm: "",
      key: "",
      genre: "",
      mood: "",
      status: "Draft",
      duration: ""
    };
  });

  const [formArtwork, setFormArtwork] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lomon_wizard_formArtwork") || "";
    }
    return "";
  });
  const [formAudioFiles, setFormAudioFiles] = useState<{ mp3Preview: string; wavMaster: string }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lomon_wizard_formAudioFiles");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      mp3Preview: "",
      wavMaster: ""
    };
  });

  const [formStems, setFormStems] = useState<{ type: "file" | "multiple"; list: string[] }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lomon_wizard_formStems");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      type: "multiple",
      list: []
    };
  });

  const [formDocuments, setFormDocuments] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lomon_wizard_formDocuments");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const [newDocName, setNewDocName] = useState("");
  const [newDocVersion, setNewDocVersion] = useState("1.0");

  const [formLicensing, setFormLicensing] = useState<Record<string, { enabled: boolean; price: number; overrides?: Partial<LicenseTemplate> }>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lomon_wizard_formLicensing");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      access: { enabled: true, price: 100 },
      release: { enabled: true, price: 250 },
      commercial: { enabled: true, price: 500 },
      exclusive: { enabled: true, price: 2500 },
      sync: { enabled: true, price: 750 },
      clearance: { enabled: true, price: 150 }
    };
  });

  // Keep Wizard state synchronized to localStorage to prevent losing it (Rules 1 & 2)
  useEffect(() => {
    localStorage.setItem("lomon_wizard_formInfo", JSON.stringify(formInfo));
  }, [formInfo]);

  useEffect(() => {
    localStorage.setItem("lomon_wizard_formArtwork", formArtwork);
  }, [formArtwork]);

  useEffect(() => {
    localStorage.setItem("lomon_wizard_formAudioFiles", JSON.stringify(formAudioFiles));
  }, [formAudioFiles]);

  useEffect(() => {
    localStorage.setItem("lomon_wizard_formStems", JSON.stringify(formStems));
  }, [formStems]);

  useEffect(() => {
    localStorage.setItem("lomon_wizard_formDocuments", JSON.stringify(formDocuments));
  }, [formDocuments]);

  useEffect(() => {
    localStorage.setItem("lomon_wizard_formLicensing", JSON.stringify(formLicensing));
  }, [formLicensing]);

  useEffect(() => {
    localStorage.setItem("lomon_wizard_currentStep", String(currentStep));
  }, [currentStep]);

  useEffect(() => {
    if (editingFragmentId) {
      localStorage.setItem("lomon_wizard_editingFragmentId", editingFragmentId);
    } else {
      localStorage.removeItem("lomon_wizard_editingFragmentId");
    }
  }, [editingFragmentId]);

  useEffect(() => {
    localStorage.setItem("lomon_wizard_ownershipConfirmed", String(ownershipConfirmed));
  }, [ownershipConfirmed]);

  useEffect(() => {
    localStorage.setItem("lomon_wizard_publicPreviewApproved", String(publicPreviewApproved));
  }, [publicPreviewApproved]);

  const clearWizardStorage = () => {
    localStorage.removeItem("lomon_wizard_formInfo");
    localStorage.removeItem("lomon_wizard_formArtwork");
    localStorage.removeItem("lomon_wizard_formAudioFiles");
    localStorage.removeItem("lomon_wizard_formStems");
    localStorage.removeItem("lomon_wizard_formDocuments");
    localStorage.removeItem("lomon_wizard_formLicensing");
    localStorage.removeItem("lomon_wizard_currentStep");
    localStorage.removeItem("lomon_wizard_editingFragmentId");
    localStorage.removeItem("lomon_wizard_ownershipConfirmed");
    localStorage.removeItem("lomon_wizard_publicPreviewApproved");
  };

  // Rule 3: Show completion status on every tab helper
  const isStepCompleted = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return !!formInfo.name && !!formInfo.timestamp;
      case 2:
        return !!formArtwork;
      case 3:
        return !!formAudioFiles.mp3Preview && !!formAudioFiles.wavMaster;
      case 4:
        return formStems.list.length > 0;
      case 5:
        return formDocuments.length > 0;
      case 6:
        return Object.values(formLicensing).some((l: any) => l.enabled);
      case 7:
        return ownershipConfirmed && publicPreviewApproved;
      default:
        return false;
    }
  };

  // Rule 6: Structured activity log tracking
  const [activityLogs, setActivityLogs] = useState<{ id: string; timestamp: string; action: string; details: string }[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lomon_activity_logs");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      { id: "log-1", timestamp: new Date().toISOString(), action: "SYSTEM_START", details: "Lomon Archive Management Engine v3.0 started." },
      { id: "log-2", timestamp: new Date().toISOString(), action: "AUTH_SUCCESS", details: `Secure session established for terminal ${currentUserEmail}` }
    ];
  });

  const logActivity = (action: string, details: string) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      details
    };
    setActivityLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem("lomon_activity_logs", JSON.stringify(updated));
      return updated;
    });
    const timeStr = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev, `[${timeStr}] ${action}: ${details}`]);
  };

  // Rule 1: Autosave step as draft on database (and local state)
  const handleAutosaveDraft = () => {
    if (!formInfo.name) return; // Must have name to save draft

    const targetId = editingFragmentId || formInfo.timestamp.replace(/\s+/g, "").toLowerCase() || `frag_draft_${Date.now()}`;
    const licenseOverridesObj: Record<string, any> = {};
    Object.entries(formLicensing).forEach(([key, value]: [string, any]) => {
      licenseOverridesObj[key] = {
        enabled: value.enabled,
        priceOverride: value.price,
        overrides: value.overrides || {}
      };
    });

    const draftPayload = {
      id: targetId,
      timestamp: formInfo.timestamp || new Date().toISOString().slice(0, 10).replace(/-/g, "/"),
      name: formInfo.name,
      classification: formInfo.classification || "THRESHOLD COIL",
      bpm: formInfo.bpm ? Number(formInfo.bpm) : 120,
      key: formInfo.key || "C Minor",
      genre: formInfo.genre || "Ambient",
      mood: formInfo.mood || "Mysterious",
      status: "Draft", // Step progress wizard autosaves are drafts
      duration: formInfo.duration || "4:00",
      artwork: formArtwork || "cover_bandit.jpg",
      mp3Preview: formAudioFiles.mp3Preview || "bandit_preview.mp3",
      wavMaster: formAudioFiles.wavMaster || "bandit_master.wav",
      stems: formStems.list,
      documents: formDocuments,
      licensing: {
        mp3: { enabled: formLicensing.access?.enabled ?? false, price: formLicensing.access?.price ?? 100 },
        wav: { enabled: formLicensing.release?.enabled ?? false, price: formLicensing.release?.price ?? 250 },
        trackouts: { enabled: formLicensing.commercial?.enabled ?? false, price: formLicensing.commercial?.price ?? 500 },
        unlimited: { enabled: formLicensing.commercial?.enabled ?? false, price: formLicensing.commercial?.price ?? 500 },
        exclusive: { enabled: formLicensing.exclusive?.enabled ?? false, price: formLicensing.exclusive?.price ?? 2500 }
      },
      licenseOverrides: licenseOverridesObj,
      plays: editingFragmentId ? (fragments.find(f => f.id === editingFragmentId) as any)?.plays || 0 : 0,
      revenue: editingFragmentId ? (fragments.find(f => f.id === editingFragmentId) as any)?.revenue || 0 : 0
    };

    // Save locally
    setFragments(prev => {
      const exists = prev.some(f => f.id === targetId);
      if (exists) {
        return prev.map(f => f.id === targetId ? (draftPayload as any) : f);
      } else {
        return [draftPayload as any, ...prev];
      }
    });

    if (!editingFragmentId) {
      setEditingFragmentId(targetId);
    }

    const method = editingFragmentId ? "PUT" : "POST";
    const url = editingFragmentId ? `/api/fragments/${editingFragmentId}` : "/api/fragments";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftPayload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log("[Autosave DB saved successful]", data.fragment);
        logActivity("AUTOSAVE_DRAFT", `Autosaved draft composition "${formInfo.name}" to database (Step ${currentStep})`);
      }
    })
    .catch(err => {
      console.warn("[Autosave DB failed, remaining in state/localStorage]", err);
    });
  };

  // Autosave when stepping through the wizard
  useEffect(() => {
    if (formInfo.name && activeTab === "New Fragment") {
      handleAutosaveDraft();
    }
  }, [currentStep]);


  // Calculate Metrics
  const totalFragmentsCount = fragments.length;
  const publishedFragmentsCount = fragments.filter(f => (f as any).status === "Published").length;
  const draftFragmentsCount = fragments.filter(f => (f as any).status === "Draft" || !(f as any).status).length;
  const totalOrdersCount = orders.length;
  const totalRevenueSum = orders.reduce((sum, o) => sum + o.amountPaid, 0);

  // Dynamic Beat Sales Analysis (Ranked by revenue generation & orders)
  const mostSoldBeats = fragments.map(frag => {
    const fragmentOrders = orders.filter(o => o.fragmentName.toLowerCase() === frag.name.toLowerCase());
    const salesCount = fragmentOrders.length;
    const orderRevenue = fragmentOrders.reduce((sum, o) => sum + o.amountPaid, 0);
    // Combine order sales with play counts to represent engagement
    const plays = (frag as any).plays || 0;
    const revenue = Math.max(orderRevenue, (frag as any).revenue || 0);
    return {
      id: frag.id,
      name: frag.name,
      classification: frag.classification || "ARCHIVAL",
      plays,
      salesCount,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue || b.plays - a.plays);

  // Top Customers Ledger (Ranked by total spent)
  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent || b.purchases - a.purchases);


  // Alert/Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Interactive Dashboard States
  const [terminalLogs, setTerminalLogs] = useState<string[]>(() => [
    "SYSTEM JOURNAL [SYSTEM STABILIZED]",
    `> authenticated session: ${currentUserEmail}`,
    "> archive directory: /srv/lomon-archive/fragments",
    "> active gateways: paystack-active, stripe-offline",
    "> state: safe, ready for composition registration"
  ]);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState<boolean>(false);
  const [logQuery, setLogQuery] = useState<string>("");
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);

  const chartData = [
    { label: "MON", plays: 1200, revenue: 150 },
    { label: "TUE", plays: 1800, revenue: 300 },
    { label: "WED", plays: 1400, revenue: 50 },
    { label: "THU", plays: 2200, revenue: 750 },
    { label: "FRI", plays: 2800, revenue: 1200 },
    { label: "SAT", plays: 2100, revenue: 300 },
    { label: "SUN", plays: 2500, revenue: 950 }
  ];

  const handleRunDiagnostics = () => {
    if (isDiagnosticRunning) return;
    setIsDiagnosticRunning(true);
    showToast("Initializing Diagnostics...");
    logActivity("DIAGNOSTICS", "Initiated comprehensive system diagnostic scan.");

    // Clear logs and run step-by-step
    setTerminalLogs([
      "SYSTEM JOURNAL [DIAGNOSTICS MODE INITIALIZED]",
      "> Loading cryptographic signatures...",
    ]);

    const steps = [
      { delay: 400, log: "> Mounting secure nodes... OK" },
      { delay: 800, log: `> Directory verified: /srv/lomon-archive/fragments (${fragments.length} entries)` },
      { delay: 1200, log: `> Active Gateway Ping: Paystack (ONLINE), Stripe (OFFLINE)` },
      { delay: 1600, log: `> Financial reconciliation: total accrued $${totalRevenueSum.toLocaleString()} across ${orders.length} orders.` },
      { delay: 2000, log: "> System health: 100% operational. Integrity verified." },
      { delay: 2400, log: "SYSTEM JOURNAL [SYSTEM STABILIZED]" }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, step.log]);
        if (step.log.startsWith("SYSTEM JOURNAL [SYSTEM STABILIZED]")) {
          setIsDiagnosticRunning(false);
          showToast("Diagnostics complete. System secure.");
          logActivity("DIAGNOSTICS", "Diagnostics complete. System health 100% operational.");
        }
      }, step.delay);
    });
  };

  // Operations inside Fragment Library
  const handleDeleteFragment = (id: string) => {
    if (window.confirm(`[LOMON COMPLIANCE PROTOCOL]
Permanent deletion is disabled by default to protect historical order records.
This operation will soft-delete the fragment and transition it to "Archived" status.

Proceed with soft deletion?`)) {
      fetch(`/api/fragments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Archived" })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFragments(prev => prev.map(f => f.id === id ? { ...f, status: "Archived" } : f));
          showToast(`Fragment ${id} soft-deleted and archived.`);
          logActivity("SOFT_DELETE", `Soft-deleted and archived fragment ID: ${id}`);
        } else {
          showToast(`Error: ${data.error}`);
        }
      })
      .catch(err => {
        console.error(err);
        setFragments(prev => prev.map(f => f.id === id ? { ...f, status: "Archived" } : f));
        showToast(`Fragment ${id} soft-deleted locally.`);
        logActivity("SOFT_DELETE", `Soft-deleted fragment ID: ${id} locally (offline fallback)`);
      });
    }
  };

  const handleArchiveFragment = (id: string) => {
    const target = fragments.find(f => f.id === id);
    if (!target) return;
    const currentStatus = (target as any).status;
    const nextStatus = currentStatus === "Archived" ? "Draft" : "Archived";

    fetch(`/api/fragments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setFragments(prev => prev.map(f => f.id === id ? { ...f, status: nextStatus } : f));
        showToast(`Fragment ${id} archive status updated to ${nextStatus}.`);
        logActivity("ARCHIVE_STATUS", `Archived status of ${id} set to "${nextStatus}"`);
      } else {
        showToast(`Error: ${data.error}`);
      }
    })
    .catch(err => {
      console.error(err);
      setFragments(prev => prev.map(f => f.id === id ? { ...f, status: nextStatus } : f));
      showToast(`Fragment ${id} archive status updated locally.`);
      logActivity("ARCHIVE_STATUS", `Archived status of ${id} set to "${nextStatus}" locally (offline fallback)`);
    });
  };

  const handleDuplicateFragment = (frag: Fragment) => {
    const newId = `${frag.id}-copy-${Math.floor(Math.random() * 100)}`;
    const newName = `${frag.name} (Copy)`;
    const duplicated: Fragment = {
      ...frag,
      id: newId,
      name: newName,
      status: "Draft",
      plays: 0,
      revenue: 0
    } as any;

    fetch("/api/fragments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duplicated)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setFragments(prev => [...prev, duplicated]);
        showToast(`Duplicated ${frag.name} to DB successfully.`);
      } else {
        showToast(`DB Save Error: ${data.error}`);
      }
    })
    .catch(err => {
      console.error(err);
      setFragments(prev => [...prev, duplicated]);
      showToast(`Duplicated ${frag.name} locally.`);
    });
  };

  const handleEditFragmentClick = (frag: Fragment) => {
    setEditingFragmentId(frag.id);
    setFormInfo({
      timestamp: frag.timestamp || "12:00 AM",
      name: frag.name || "",
      classification: frag.classification || "THRESHOLD COIL",
      bpm: frag.bpm || 120,
      key: (frag as any).key || "C Minor",
      genre: (frag as any).genre || "Ambient",
      mood: (frag as any).mood || "Mysterious",
      status: (frag as any).status || "Draft",
      duration: frag.duration || "4:00"
    });
    setFormArtwork((frag as any).artwork || "cover_bandit.jpg");
    setFormAudioFiles({
      mp3Preview: (frag as any).mp3Preview || "bandit_preview.mp3",
      wavMaster: (frag as any).wavMaster || "bandit_master.wav"
    });
    let initialLicensing = {
      access: { enabled: true, price: 100, overrides: {} },
      release: { enabled: true, price: 250, overrides: {} },
      commercial: { enabled: true, price: 500, overrides: {} },
      exclusive: { enabled: true, price: 2500, overrides: {} },
      sync: { enabled: true, price: 750, overrides: {} },
      clearance: { enabled: true, price: 150, overrides: {} }
    };

    if ((frag as any).licenseOverrides) {
      Object.entries((frag as any).licenseOverrides).forEach(([key, value]: [string, any]) => {
        if (initialLicensing[key as keyof typeof initialLicensing]) {
          initialLicensing[key as keyof typeof initialLicensing] = {
            enabled: value.enabled !== false,
            price: value.priceOverride !== undefined ? value.priceOverride : (value.price || 0),
            overrides: value.overrides || {}
          };
        }
      });
    } else if ((frag as any).licensing) {
      const legacy = (frag as any).licensing;
      initialLicensing.access = { enabled: !!legacy.mp3?.enabled, price: legacy.mp3?.price || 100, overrides: {} };
      initialLicensing.release = { enabled: !!legacy.wav?.enabled, price: legacy.wav?.price || 250, overrides: {} };
      initialLicensing.commercial = { enabled: !!legacy.trackouts?.enabled, price: legacy.trackouts?.price || 500, overrides: {} };
      initialLicensing.exclusive = { enabled: !!legacy.exclusive?.enabled, price: legacy.exclusive?.price || 2500, overrides: {} };
    }
    setFormLicensing(initialLicensing);
    setCurrentStep(1);
    setActiveTab("New Fragment");
  };

  const handleSaveFragmentForm = (finalStatus?: string) => {
    const statusToUse = finalStatus || (formInfo.status as any) || "Draft";
    
    const targetId = editingFragmentId || formInfo.timestamp.replace(" ", "").toLowerCase();
    
    const licenseOverridesObj: Record<string, any> = {};
    Object.entries(formLicensing).forEach(([key, value]: [string, any]) => {
      licenseOverridesObj[key] = {
        enabled: value.enabled,
        priceOverride: value.price,
        overrides: value.overrides || {}
      };
    });

    const newFragData: Fragment = {
      id: targetId,
      name: formInfo.name,
      timestamp: formInfo.timestamp,
      classification: formInfo.classification,
      observation: `Handled via admin portal by ${currentUserEmail}.`,
      duration: formInfo.duration,
      description: `Custom ${formInfo.mood} fragment with BPM ${formInfo.bpm} in KEY ${formInfo.key}.`,
      isExclusive: formLicensing.exclusive?.enabled ?? false,
      frequency: 220,
      synthType: "keys",
      bpm: Number(formInfo.bpm),
      status: statusToUse,
      plays: editingFragmentId ? (fragments.find(f => f.id === editingFragmentId) as any)?.plays || 0 : 0,
      revenue: editingFragmentId ? (fragments.find(f => f.id === editingFragmentId) as any)?.revenue || 0 : 0,
      artwork: formArtwork || "cover_bandit.jpg",
      mp3Preview: formAudioFiles.mp3Preview || "bandit_preview.mp3",
      wavMaster: formAudioFiles.wavMaster || "bandit_master.wav",
      stems: formStems.list,
      documents: formDocuments,
      licensing: {
        mp3: { enabled: formLicensing.access?.enabled ?? false, price: formLicensing.access?.price ?? 100 },
        wav: { enabled: formLicensing.release?.enabled ?? false, price: formLicensing.release?.price ?? 250 },
        trackouts: { enabled: formLicensing.commercial?.enabled ?? false, price: formLicensing.commercial?.price ?? 500 },
        unlimited: { enabled: formLicensing.commercial?.enabled ?? false, price: formLicensing.commercial?.price ?? 500 },
        exclusive: { enabled: formLicensing.exclusive?.enabled ?? false, price: formLicensing.exclusive?.price ?? 2500 }
      },
      licenseOverrides: licenseOverridesObj,
      key: formInfo.key,
      genre: formInfo.genre,
      mood: formInfo.mood
    } as any;

    if (editingFragmentId) {
      fetch(`/api/fragments/${editingFragmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFragData)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFragments(prev => prev.map(f => f.id === editingFragmentId ? newFragData : f));
          showToast(`Fragment ${formInfo.name} updated in database.`);
          logActivity("FRAGMENT_UPDATE", `Updated composition "${newFragData.name}" (ID: ${newFragData.id}, Status: ${statusToUse})`);
        } else {
          showToast(`DB Error: ${data.error}`);
        }
      })
      .catch(err => {
        console.error(err);
        setFragments(prev => prev.map(f => f.id === editingFragmentId ? newFragData : f));
        showToast(`Fragment ${formInfo.name} updated locally.`);
        logActivity("FRAGMENT_UPDATE", `Updated composition "${newFragData.name}" locally (ID: ${newFragData.id}, Status: ${statusToUse})`);
      });
    } else {
      const finalId = fragments.some(f => f.id === targetId)
         ? `${targetId}-${Math.floor(Math.random() * 100)}`
         : targetId;
      newFragData.id = finalId;

      fetch("/api/fragments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFragData)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFragments(prev => [newFragData, ...prev]);
          showToast(`New Fragment ${formInfo.name} saved to database.`);
          logActivity("FRAGMENT_CREATE", `Registered new composition "${newFragData.name}" (ID: ${newFragData.id}, Status: ${statusToUse})`);
        } else {
          showToast(`DB Error: ${data.error}`);
        }
      })
      .catch(err => {
        console.error(err);
        setFragments(prev => [newFragData, ...prev]);
        showToast(`New Fragment ${formInfo.name} added locally.`);
        logActivity("FRAGMENT_CREATE", `Registered new composition "${newFragData.name}" locally (ID: ${newFragData.id}, Status: ${statusToUse})`);
      });
    }

    // Reset Form and exit
    setEditingFragmentId(null);
    setCurrentStep(1);
    // Clear fields
    setFormInfo({
      timestamp: "",
      name: "",
      classification: "",
      bpm: "",
      key: "",
      genre: "",
      mood: "",
      status: "Draft",
      duration: ""
    });
    setFormArtwork("");
    setFormAudioFiles({
      mp3Preview: "",
      wavMaster: ""
    });
    setFormStems({
      type: "multiple",
      list: []
    });
    setFormDocuments([]);
    setOwnershipConfirmed(false);
    setPublicPreviewApproved(false);
    setPreviewFragmentObj(null);
    clearWizardStorage(); // Clear the localStorage backup (Rule 1 & 2)
    setActiveTab("Fragments");
  };

  // Real Upload function for Cloudinary / Uploadthing
  const uploadFileToServer = (
    file: File,
    endpoint: "cloudinary" | "uploadthing",
    onSuccess: (url: string) => void
  ) => {
    const performTraditionalUpload = () => {
      setMediaUploadProgress(5);
      const formData = new FormData();
      formData.append("file", file);

      const interval = setInterval(() => {
        setMediaUploadProgress(prev => {
          if (prev === null) return null;
          if (prev >= 85) {
            clearInterval(interval);
            return 85;
          }
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 150);

      fetch(`/api/upload/${endpoint}`, {
        method: "POST",
        body: formData
      })
      .then(async res => {
        if (res.status === 413) {
          throw new Error("File too large (413 Payload Too Large). The server environment has a request size limit. Please use the direct URL field below to link this file instead!");
        }
        if (!res.ok) {
          const text = await res.text();
          let errMsg = "Server error during upload.";
          try {
            const parsed = JSON.parse(text);
            errMsg = parsed.error || errMsg;
          } catch (e) {}
          throw new Error(errMsg);
        }
        return res.json();
      })
      .then(data => {
        clearInterval(interval);
        if (data.success) {
          setMediaUploadProgress(100);
          setTimeout(() => {
            setMediaUploadProgress(null);
            onSuccess(data.url);
            if (data.fallback) {
              showToast(`Cached ${file.name} locally (using base64 data url)`);
            } else {
              showToast(`Uploaded ${file.name} successfully via ${data.provider}!`);
            }
          }, 400);
        } else {
          setMediaUploadProgress(null);
          showToast(`Upload error: ${data.error || "Failed to process upload."}`);
        }
      })
      .catch(err => {
        clearInterval(interval);
        setMediaUploadProgress(null);
        console.error("[UPLOAD CLIENT ERROR]", err);
        showToast(`Upload failed: ${err.message || String(err)}`);
      });
    };

    if (endpoint === "uploadthing") {
      setMediaUploadProgress(5);
      import("uploadthing/client")
        .then(async ({ genUploader }) => {
          let interval: any = null;
          try {
            setMediaUploadProgress(10);
            interval = setInterval(() => {
              setMediaUploadProgress(prev => {
                if (prev === null) return null;
                if (prev >= 90) {
                  clearInterval(interval);
                  return 90;
                }
                return prev + 5;
              });
            }, 200);

            // In uploadthing v7, genUploader is used to create client-side upload helpers
            const { uploadFiles } = genUploader({
              url: "/api/uploadthing",
            });

            // Attempt direct client-to-S3 upload
            const response = await uploadFiles("podcastUploader" as any, {
              files: [file],
            });

            if (interval) clearInterval(interval);
            const uploadedFile = response && response[0];
            if (uploadedFile && uploadedFile.url) {
              setMediaUploadProgress(100);
              setTimeout(() => {
                setMediaUploadProgress(null);
                onSuccess(uploadedFile.url);
                showToast(`Directly uploaded ${file.name} successfully via UploadThing (bypassed server limits)!`);
              }, 400);
            } else {
              throw new Error("Direct upload returned invalid response format.");
            }
          } catch (err: any) {
            if (interval) clearInterval(interval);
            console.warn("[UPLOADTHING DIRECT ATTEMPT FAILED, FALLING BACK]", err);
            // Fallback to traditional backend upload
            performTraditionalUpload();
          }
        })
        .catch(err => {
          console.error("Failed to dynamically import uploadthing/client, falling back:", err);
          performTraditionalUpload();
        });
    } else {
      performTraditionalUpload();
    }
  };

  // Mock Upload Progress bar
  const triggerMockUpload = (fileName: string, fieldSetter: (name: string) => void) => {
    setMediaUploadProgress(1);
    const interval = setInterval(() => {
      setMediaUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setMediaUploadProgress(null);
            fieldSetter(fileName);
            showToast(`Uploaded ${fileName} successfully.`);
          }, 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 25) + 10;
      });
    }, 150);
  };

  // Step Indicators for Fragment Wizard
  const renderStepIndicators = () => {
    const steps = [
      "Information", "Artwork", "Audio Files", "Stems", "Documents", "Pricing", "Publish"
    ];
    return (
      <div className="grid grid-cols-7 gap-1 bg-[#090909] p-1 border border-zinc-900 rounded-none mb-6">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isDone = isStepCompleted(stepNum);
          return (
            <button
              key={step}
              onClick={() => setCurrentStep(stepNum)}
              className={`py-2 text-[10px] tracking-[0.1em] font-mono font-bold uppercase transition-colors text-center border ${
                isActive 
                  ? "bg-zinc-800 text-white border-zinc-700" 
                  : isDone 
                    ? "bg-zinc-900/40 text-emerald-400 border-zinc-950 hover:bg-zinc-900/60" 
                    : "bg-transparent text-zinc-600 border-transparent hover:text-zinc-400"
              }`}
            >
              <div className="block sm:hidden">
                {stepNum}{isDone ? "✓" : ""}
              </div>
              <div className="hidden sm:block">
                {stepNum}. {step} {isDone ? "✓" : ""}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#020202] text-zinc-200 font-mono select-text text-left pb-12 flex flex-col md:flex-row gap-6">
      {/* Dynamic Toast Message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#0a0a0a] border border-[#D9D6CA] px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.8)] text-xs text-white flex items-center gap-2 font-bold uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT NAVIGATION COLUMN */}
      <div className="w-full md:w-56 flex-shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 pb-4 md:pb-0 md:pr-4">
        <div className="space-y-6">
          <div className="py-2 border-b border-zinc-900">
            <h1 className="text-sm font-bold tracking-[0.2em] text-[#D9D6CA] uppercase">LOMON ADMIN</h1>
            <span className="text-[10px] text-zinc-500 tracking-[0.1em] uppercase font-bold block">Archive Management v3.0</span>
          </div>

          <nav className="flex flex-col gap-1">
            {(["Dashboard", "Fragments", "New Fragment", "Orders", "Customers", "Analytics", "Media Library", "Settings"] as AdminTab[]).map(tab => {
              const isActive = activeTab === tab;
              
              const getTabBadge = () => {
                switch (tab) {
                  case "Dashboard":
                    return { text: "LIVE", className: "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" };
                  case "Fragments":
                    return { text: `${fragments.length} SEC`, className: "bg-zinc-950 text-zinc-400 border border-zinc-800" };
                  case "New Fragment": {
                    const completedSteps = [1, 2, 3, 4, 5, 6].filter(s => isStepCompleted(s)).length;
                    const isAll = completedSteps === 6;
                    return {
                      text: isAll ? "READY" : `${completedSteps}/7 OK`,
                      className: isAll 
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 animate-pulse" 
                        : "bg-amber-950/20 text-amber-500 border border-amber-900/20"
                    };
                  }
                  case "Orders":
                    return { text: `${orders.length} OK`, className: "bg-zinc-950 text-zinc-400 border border-zinc-800" };
                  case "Customers":
                    return { text: `${customers.length} REG`, className: "bg-zinc-950 text-zinc-400 border border-zinc-800" };
                  case "Analytics":
                    return { text: "ACTIVE", className: "bg-emerald-950/20 text-emerald-500 border border-emerald-900/10" };
                  case "Media Library": {
                    const totalFilesCount = Object.values(mediaFolders).flat().length;
                    return { text: `${totalFilesCount} FL`, className: "bg-zinc-950 text-zinc-400 border border-zinc-800" };
                  }
                  case "Settings":
                    return { text: "SECURE", className: "bg-emerald-950/20 text-emerald-500 border border-emerald-900/10" };
                  default:
                    return { text: "", className: "" };
                }
              };
              
              const badge = getTabBadge();

              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === "New Fragment" && !editingFragmentId) {
                      setFormInfo({
                        timestamp: "",
                        name: "",
                        classification: "",
                        bpm: "",
                        key: "",
                        genre: "",
                        mood: "",
                        status: "Draft",
                        duration: ""
                      });
                      setFormArtwork("");
                      setFormAudioFiles({
                        mp3Preview: "",
                        wavMaster: ""
                      });
                      setFormStems({
                        type: "multiple",
                        list: []
                      });
                      setFormDocuments([]);
                      setCurrentStep(1);
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs tracking-wider uppercase transition-colors flex items-center justify-between font-bold cursor-pointer border ${
                    isActive 
                      ? "bg-zinc-900/80 border-zinc-800 text-white font-black" 
                      : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/30"
                  }`}
                >
                  <span>{tab}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {badge.text && (
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 leading-none ${badge.className}`}>
                        {badge.text}
                      </span>
                    )}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#D9D6CA]" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-8 border-t border-zinc-900 mt-6 md:mt-0 space-y-2">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">SECURE SHELL</div>
          <div className="text-xs text-zinc-400 font-bold truncate">{currentUserEmail.toUpperCase()}</div>
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors uppercase font-bold cursor-pointer tracking-wider text-left"
          >
            ← EXIT PORTAL
          </button>
        </div>
      </div>

      {/* MAIN CONTENT DISPLAY AREA */}
      <div className="flex-grow min-w-0">
        <AnimatePresence mode="wait">
          {activeTab === "Dashboard" && (
            <motion.div
              key="Dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400">DASHBOARD OVERVIEW</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Archive Management System Overview</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9D6CA]" />
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    SYSTEM ACTIVE
                  </span>
                </div>
              </div>

              {/* GRID STATS - SHOWS ONLY THE 5 REQUIRED METRICS, NOTHING ELSE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Total Fragments */}
                <div className="border border-zinc-900 bg-[#060606] p-5 space-y-3 relative overflow-hidden">
                  <span className="text-[9px] tracking-widest text-zinc-500 font-bold block uppercase">TOTAL FRAGMENTS</span>
                  <div className="text-3xl font-bold font-mono tracking-tight text-white">{totalFragmentsCount}</div>
                  <div className="w-full bg-zinc-950 h-[1px]">
                    <div className="bg-zinc-700 h-full" style={{ width: "100%" }} />
                  </div>
                </div>

                {/* Published Fragments */}
                <div className="border border-zinc-900 bg-[#060606] p-5 space-y-3 relative overflow-hidden">
                  <span className="text-[9px] tracking-widest text-zinc-500 font-bold block uppercase">PUBLISHED FRAGMENTS</span>
                  <div className="text-3xl font-bold font-mono tracking-tight text-white">{publishedFragmentsCount}</div>
                  <div className="w-full bg-zinc-950 h-[1px]">
                    <div className="bg-[#D9D6CA] h-full" style={{ width: `${(publishedFragmentsCount / (totalFragmentsCount || 1)) * 100}%` }} />
                  </div>
                </div>

                {/* Draft Fragments */}
                <div className="border border-zinc-900 bg-[#060606] p-5 space-y-3 relative overflow-hidden">
                  <span className="text-[9px] tracking-widest text-zinc-500 font-bold block uppercase">DRAFT FRAGMENTS</span>
                  <div className="text-3xl font-bold font-mono tracking-tight text-white">{draftFragmentsCount}</div>
                  <div className="w-full bg-zinc-950 h-[1px]">
                    <div className="bg-zinc-700 h-full" style={{ width: `${(draftFragmentsCount / (totalFragmentsCount || 1)) * 100}%` }} />
                  </div>
                </div>

                {/* Total Orders */}
                <div className="border border-zinc-900 bg-[#060606] p-5 space-y-3 relative overflow-hidden">
                  <span className="text-[9px] tracking-widest text-zinc-500 font-bold block uppercase">TOTAL ORDERS</span>
                  <div className="text-3xl font-bold font-mono tracking-tight text-white">{totalOrdersCount}</div>
                  <div className="w-full bg-zinc-950 h-[1px]">
                    <div className="bg-zinc-700 h-full" style={{ width: "100%" }} />
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="border border-zinc-900 bg-[#060606] p-5 space-y-3 relative overflow-hidden col-span-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-[9px] tracking-widest text-zinc-500 font-bold block uppercase">TOTAL REVENUE</span>
                  <div className="text-3xl font-bold font-mono tracking-tight text-[#D9D6CA]">${totalRevenueSum.toLocaleString()}</div>
                  <div className="w-full bg-zinc-950 h-[1px]">
                    <div className="bg-[#D9D6CA] h-full" style={{ width: "100%" }} />
                  </div>
                </div>
              </div>

              {/* SYSTEM DIAGNOSTICS & SYSTEM JOURNAL LOGS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
                {/* SYSTEM JOURNAL LOG TERMINAL (8 COLS) */}
                <div className="border border-zinc-900 bg-[#060606] p-5 space-y-4 col-span-1 lg:col-span-8 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] tracking-widest text-zinc-400 font-bold uppercase">SYSTEM JOURNAL / AUDIT DEED</span>
                    </div>
                    <span className="text-[9px] text-zinc-600 font-mono uppercase">SECURE SHELL JOURNAL</span>
                  </div>

                  {/* Search and control buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/40 p-2.5 border border-zinc-900/60">
                    <div className="relative flex-grow max-w-sm">
                      <input
                        type="text"
                        placeholder="FILTER SYSTEM JOURNAL LOGS..."
                        id="log-search-input"
                        className="bg-neutral-950 border border-zinc-900 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-700 px-3 py-1.5 font-mono w-full"
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase();
                          setLogQuery(val);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRunDiagnostics}
                        disabled={isDiagnosticRunning}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-none cursor-pointer"
                      >
                        {isDiagnosticRunning ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> RUNNING...
                          </>
                        ) : (
                          <>
                            <Activity className="w-3 h-3 text-emerald-400" /> RUN DIAGNOSTICS
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to purge local system activity logs? This is irreversible.")) {
                            setActivityLogs([
                              { id: "log-reset", timestamp: new Date().toISOString(), action: "LOGS_CLEARED", details: "Administrative activity logs cleared by user." }
                            ]);
                            localStorage.setItem("lomon_activity_logs", JSON.stringify([{ id: "log-reset", timestamp: new Date().toISOString(), action: "LOGS_CLEARED", details: "Administrative activity logs cleared by user." }]));
                            showToast("System Activity Logs cleared.");
                          }
                        }}
                        className="bg-zinc-900/50 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-500 hover:text-zinc-400 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer"
                      >
                        PURGE JOURNAL
                      </button>
                    </div>
                  </div>

                  {/* Terminal console window */}
                  <div className="bg-[#030303] border border-zinc-900 p-4 h-64 overflow-y-auto font-mono text-[10.5px] leading-relaxed relative flex flex-col text-left">
                    <div className="space-y-1.5">
                      {activityLogs
                        .filter(log => {
                          if (!logQuery) return true;
                          return (
                            log.action.toLowerCase().includes(logQuery) ||
                            log.details.toLowerCase().includes(logQuery) ||
                            log.timestamp.includes(logQuery)
                          );
                        })
                        .map((log) => {
                          const timeStr = new Date(log.timestamp).toLocaleTimeString();
                          return (
                            <div key={log.id} className="grid grid-cols-12 gap-1 group py-0.5 hover:bg-zinc-900/30">
                              <span className="col-span-2 text-zinc-600 font-bold select-none">{timeStr}</span>
                              <span className={`col-span-3 font-bold ${
                                log.action.includes("ERROR") || log.action.includes("BLOCKED")
                                  ? "text-red-500" 
                                  : log.action.includes("CREATE") || log.action.includes("ATTACH") || log.action.includes("AUTH")
                                    ? "text-emerald-400" 
                                    : "text-amber-500"
                              }`}>
                                [{log.action}]
                              </span>
                              <span className="col-span-7 text-zinc-300 break-all">{log.details}</span>
                            </div>
                          );
                        })}
                    </div>
                    {/* Retro Scanline effect overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_100%)] opacity-10" />
                  </div>
                </div>

                {/* SYSTEM INTEGRITY AND TELEMETRY (4 COLS) */}
                <div className="border border-zinc-900 bg-[#060606] p-5 space-y-4 col-span-1 lg:col-span-4 text-left">
                  <span className="text-[10px] tracking-widest text-zinc-400 font-bold uppercase block border-b border-zinc-900 pb-2">
                    INTEGRITY TELEMETRY
                  </span>
                  
                  <div className="space-y-3.5 pt-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase font-bold">DATABASE ENGINES</span>
                      <span className="text-emerald-400 font-bold">MONGODB SECURE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase font-bold">GATEWAY (PAYSTACK)</span>
                      <span className="text-emerald-400 font-bold">ONLINE (LIVE)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase font-bold">GATEWAY (STRIPE)</span>
                      <span className="text-zinc-600 font-bold">OFFLINE (MAINT)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase font-bold">WIZARD PERSISTENCE</span>
                      <span className="text-emerald-400 font-bold">localStorage STABLE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase font-bold">ADMIN ENCRYPTION</span>
                      <span className="text-zinc-400 font-mono">RSA-4096-AES-GCM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase font-bold">ADMINISTRATIVE ID</span>
                      <span className="text-zinc-400 font-mono truncate max-w-[120px]">{currentUserEmail}</span>
                    </div>
                  </div>

                  <div className="bg-neutral-950 p-3.5 border border-zinc-900 text-[10px] text-zinc-500 space-y-1 font-mono uppercase">
                    <p className="font-bold text-zinc-400">LLC OPERATIONAL PROTOCOL:</p>
                    <p>ALL AUDIT ENGINES ARE CO-SIGNED AND PERSISTED LOCALLY AND REMOTE-REPLICATED UPON SECURE DEPLOYMENT ACTIONS.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "Fragments" && (
            <motion.div
              key="Fragments"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400">FRAGMENT LIBRARY</h2>
                <button
                  onClick={() => {
                    setEditingFragmentId(null);
                    setFormInfo({
                      timestamp: "",
                      name: "",
                      classification: "",
                      bpm: "",
                      key: "",
                      genre: "",
                      mood: "",
                      status: "Draft",
                      duration: ""
                    });
                    setFormArtwork("");
                    setFormAudioFiles({
                      mp3Preview: "",
                      wavMaster: ""
                    });
                    setFormStems({
                      type: "multiple",
                      list: []
                    });
                    setFormDocuments([]);
                    setOwnershipConfirmed(false);
                    setPublicPreviewApproved(false);
                    setPreviewFragmentObj(null);
                    setCurrentStep(1);
                    setActiveTab("New Fragment");
                  }}
                  className="bg-[#D9D6CA] text-black hover:bg-white text-xs font-bold tracking-widest px-3 py-1.5 uppercase rounded-none transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> REGISTER NEW
                </button>
              </div>

              {/* TABLE CONTAINER */}
              <div className="border border-zinc-900 rounded-none overflow-x-auto bg-neutral-950/20">
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 uppercase tracking-wider text-[10.5px]">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">BPM</th>
                      <th className="p-3">KEY</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Plays</th>
                      <th className="p-3 text-right">Revenue</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fragments.map((frag, idx) => {
                      const isDraft = (frag as any).status === "Draft";
                      const isArchived = (frag as any).status === "Archived";
                      return (
                        <tr 
                          key={frag.id || idx} 
                          className="border-b border-zinc-900/60 hover:bg-zinc-900/20 transition-colors"
                        >
                          <td className="p-3 font-bold text-white whitespace-nowrap">{frag.timestamp}</td>
                          <td className="p-3 text-zinc-300 font-bold uppercase whitespace-nowrap">{frag.name}</td>
                          <td className="p-3 text-zinc-400">{frag.bpm}</td>
                          <td className="p-3 text-zinc-400">{(frag as any).key || "N/A"}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isDraft 
                                ? "bg-amber-950/30 text-amber-400 border border-amber-900/60" 
                                : isArchived
                                  ? "bg-zinc-800/40 text-zinc-500 border border-zinc-900"
                                  : "bg-emerald-950/30 text-emerald-400 border border-emerald-900/60"
                            }`}>
                              {(frag as any).status || "Published"}
                            </span>
                          </td>
                          <td className="p-3 text-right text-zinc-400 font-bold">
                            {((frag as any).plays || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-bold text-[#D9D6CA]">
                            ${((frag as any).revenue || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleEditFragmentClick(frag)}
                                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer" 
                                title="Edit Fragment"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDuplicateFragment(frag)}
                                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-[#D9D6CA] transition-colors cursor-pointer" 
                                title="Duplicate Fragment"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleArchiveFragment(frag.id)}
                                className={`p-1 hover:bg-zinc-800 transition-colors cursor-pointer ${isArchived ? "text-amber-400" : "text-zinc-400 hover:text-amber-400"}`} 
                                title={isArchived ? "Unarchive" : "Archive"}
                              >
                                <Archive className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDeleteFragment(frag.id)}
                                className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer" 
                                title="Delete Fragment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "New Fragment" && (
            <motion.div
              key="New Fragment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400">
                  {editingFragmentId ? `EDIT FRAGMENT: ${formInfo.name}` : "REGISTER NEW FRAGMENT"}
                </h2>
                <button
                  onClick={() => {
                    setEditingFragmentId(null);
                    setActiveTab("Fragments");
                  }}
                  className="text-zinc-500 hover:text-white text-[11px] font-bold tracking-widest uppercase transition-colors"
                >
                  CANCEL
                </button>
              </div>

              {/* STEP WIZARD INDICATORS */}
              {renderStepIndicators()}

              {/* WIZARD CARD PANEL */}
              <div className="border border-zinc-900 bg-zinc-950/20 p-6 space-y-6">
                {/* STEP 1: FRAGMENT INFORMATION */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="border-b border-zinc-900 pb-2">
                      <span className="text-[11px] font-bold text-zinc-400 tracking-widest block uppercase">STEP 1 // FRAGMENT INFORMATION</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-widest block">Fragment Timestamp</label>
                        <input 
                          type="text" 
                          value={formInfo.timestamp}
                          onChange={(e) => setFormInfo(prev => ({ ...prev, timestamp: e.target.value }))}
                          placeholder="e.g. 11:28 PM"
                          className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-2 text-xs text-white focus:outline-none placeholder-zinc-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-widest block">Fragment Name</label>
                        <input 
                          type="text" 
                          value={formInfo.name}
                          onChange={(e) => setFormInfo(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. SHADOW SHIFT"
                          className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-2 text-xs text-white focus:outline-none placeholder-zinc-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-widest block">BPM</label>
                        <input 
                          type="number" 
                          value={formInfo.bpm}
                          onChange={(e) => setFormInfo(prev => ({ ...prev, bpm: e.target.value === "" ? "" : Number(e.target.value) }))}
                          placeholder="e.g. 120"
                          className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-2 text-xs text-white focus:outline-none placeholder-zinc-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-widest block">KEY</label>
                        <input 
                          type="text" 
                          value={formInfo.key}
                          onChange={(e) => setFormInfo(prev => ({ ...prev, key: e.target.value }))}
                          placeholder="e.g. G Minor"
                          className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-2 text-xs text-white focus:outline-none placeholder-zinc-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-widest block">Genre</label>
                        <input 
                          type="text" 
                          value={formInfo.genre}
                          onChange={(e) => setFormInfo(prev => ({ ...prev, genre: e.target.value }))}
                          placeholder="e.g. Ambient Trap"
                          className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-2 text-xs text-white focus:outline-none placeholder-zinc-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-widest block">Mood</label>
                        <input 
                          type="text" 
                          value={formInfo.mood}
                          onChange={(e) => setFormInfo(prev => ({ ...prev, mood: e.target.value }))}
                          placeholder="e.g. Restless"
                          className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-2 text-xs text-white focus:outline-none placeholder-zinc-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-widest block">Duration (M:SS)</label>
                        <input 
                          type="text" 
                          value={formInfo.duration}
                          onChange={(e) => setFormInfo(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="e.g. 4:32"
                          className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-2 text-xs text-white focus:outline-none placeholder-zinc-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-widest block">Status</label>
                        <select 
                          value={formInfo.status}
                          onChange={(e) => setFormInfo(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-2 text-xs text-white focus:outline-none font-mono"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: ARTWORK */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="border-b border-zinc-900 pb-2">
                      <span className="text-[11px] font-bold text-zinc-400 tracking-widest block uppercase">STEP 2 // COVER IMAGE ARTWORK</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-32 h-32 border border-zinc-900 bg-neutral-950 flex items-center justify-center relative overflow-hidden shrink-0">
                        {formArtwork ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[11px] text-zinc-400">
                            <Image className="w-8 h-8 text-zinc-600 mb-1" />
                            <span className="truncate w-full font-bold uppercase">{formArtwork}</span>
                          </div>
                        ) : (
                          <Image className="w-8 h-8 text-zinc-800" />
                        )}
                      </div>

                      <div className="flex-grow w-full text-left space-y-3">
                        <label className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-widest block">Upload Cover Art</label>
                        
                        <div className="border border-dashed border-zinc-800 p-6 text-center hover:border-zinc-700 transition-colors cursor-pointer bg-neutral-950/40 relative">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                uploadFileToServer(file, "cloudinary", setFormArtwork);
                              }
                            }}
                          />
                          <Upload className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                          <p className="text-xs text-zinc-400">DRAG AND DROP OR CLICK TO CHOOSE COVER IMAGE</p>
                          <p className="text-[10px] text-zinc-600 mt-1 uppercase">MAXIMUM FILE SIZE: 10MB (JPG, PNG)</p>
                        </div>

                        {/* Direct URL Input for Cover Art */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">OR PASTE DIRECT COVER ART URL:</span>
                          <input
                            type="text"
                            value={formArtwork}
                            onChange={(e) => setFormArtwork(e.target.value.trim())}
                            placeholder="https://example.com/artwork.jpg"
                            className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                          />
                        </div>

                        {/* Preset assets selector */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-zinc-600 font-bold uppercase block">OR REUSE FROM MEDIA LIBRARY PRESETS:</span>
                          <div className="flex flex-wrap gap-2">
                            {["cover_bandit.jpg", "cover_deep_water.jpg", "cover_kryptonite.jpg"].map(art => (
                              <button
                                key={art}
                                onClick={() => setFormArtwork(art)}
                                className={`px-2 py-1 text-[10.5px] border font-bold uppercase transition-colors ${
                                  formArtwork === art 
                                    ? "bg-zinc-800 border-zinc-600 text-white" 
                                    : "bg-neutral-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                {art}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: AUDIO FILES */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="border-b border-zinc-900 pb-2">
                      <span className="text-[11px] font-bold text-zinc-400 tracking-widest block uppercase">STEP 3 // CORE AUDIO FILES</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      {/* MP3 PREVIEW */}
                      <div className="border border-zinc-900 bg-neutral-950/20 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-widest block">1. MP3 PREVIEW (STREAMABLE)</span>
                          {formAudioFiles.mp3Preview && (
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Check className="w-3 h-3" /> ATTACHED
                            </span>
                          )}
                        </div>
                        <div className="border border-dashed border-zinc-800 p-4 text-center hover:border-zinc-700 transition-colors cursor-pointer bg-neutral-950 relative">
                          <input 
                            type="file" 
                            accept="audio/mp3,audio/mpeg" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                uploadFileToServer(file, "uploadthing", (url) => setFormAudioFiles(prev => ({ ...prev, mp3Preview: url })));
                              }
                            }}
                          />
                          <Music className="w-5 h-5 text-zinc-600 mx-auto mb-1.5" />
                          <p className="text-[11px] text-zinc-400 uppercase">UPLOAD MP3 PREVIEW</p>
                          {formAudioFiles.mp3Preview && (
                            <p className="text-[10px] text-[#D9D6CA] font-bold mt-1 uppercase truncate max-w-full">
                              FILE: {formAudioFiles.mp3Preview}
                            </p>
                          )}
                        </div>

                        {/* Direct URL Input for MP3 */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">OR PASTE DIRECT MP3 URL:</span>
                          <input
                            type="text"
                            value={formAudioFiles.mp3Preview}
                            onChange={(e) => setFormAudioFiles(prev => ({ ...prev, mp3Preview: e.target.value.trim() }))}
                            placeholder="https://example.com/track_preview.mp3"
                            className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      {/* WAV MASTER */}
                      <div className="border border-zinc-900 bg-neutral-950/20 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-widest block">2. WAV MASTER (HIGH-FIDELITY)</span>
                          {formAudioFiles.wavMaster && (
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Check className="w-3 h-3" /> ATTACHED
                            </span>
                          )}
                        </div>
                        <div className="border border-dashed border-zinc-800 p-4 text-center hover:border-zinc-700 transition-colors cursor-pointer bg-neutral-950 relative">
                          <input 
                            type="file" 
                            accept="audio/wav,audio/x-wav" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                uploadFileToServer(file, "uploadthing", (url) => setFormAudioFiles(prev => ({ ...prev, wavMaster: url })));
                              }
                            }}
                          />
                          <Music className="w-5 h-5 text-zinc-600 mx-auto mb-1.5" />
                          <p className="text-[11px] text-zinc-400 uppercase">UPLOAD WAV MASTER</p>
                          {formAudioFiles.wavMaster && (
                            <p className="text-[10px] text-[#D9D6CA] font-bold mt-1 uppercase truncate max-w-full">
                              FILE: {formAudioFiles.wavMaster}
                            </p>
                          )}
                        </div>

                        {/* Direct URL Input for WAV */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">OR PASTE DIRECT WAV URL (UP TO 50MB):</span>
                          <input
                            type="text"
                            value={formAudioFiles.wavMaster}
                            onChange={(e) => setFormAudioFiles(prev => ({ ...prev, wavMaster: e.target.value.trim() }))}
                            placeholder="https://example.com/track_master.wav"
                            className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: STEM FILES */}
                {currentStep === 4 && (
                  <div className="space-y-4 text-left">
                    <div className="border-b border-zinc-900 pb-2">
                      <span className="text-[11px] font-bold text-zinc-400 tracking-widest block uppercase">STEP 4 // STEMS / TRACKOUT ASSETS</span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-4 border-b border-zinc-900 pb-3">
                        <button
                          onClick={() => setFormStems(prev => ({ ...prev, type: "multiple" }))}
                          className={`px-3 py-1.5 text-xs font-bold uppercase border ${
                            formStems.type === "multiple" 
                              ? "bg-zinc-800 border-zinc-600 text-white" 
                              : "bg-transparent border-zinc-900 text-zinc-500"
                          }`}
                        >
                          MULTIPLE STEM FIELDS
                        </button>
                        <button
                          onClick={() => setFormStems(prev => ({ ...prev, type: "file" }))}
                          className={`px-3 py-1.5 text-xs font-bold uppercase border ${
                            formStems.type === "file" 
                              ? "bg-zinc-800 border-zinc-600 text-white" 
                              : "bg-transparent border-zinc-900 text-zinc-500"
                          }`}
                        >
                          SINGLE ZIP FILE
                        </button>
                      </div>

                      {formStems.type === "multiple" ? (
                        <div className="space-y-3">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">CONFIGURE MANDATORY TRACKOUT STEMS:</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {["Drums", "808", "Melody", "Bass", "FX", "Vocals", "Full Stems"].map(stem => {
                              const isChecked = formStems.list.includes(stem);
                              return (
                                <button
                                  key={stem}
                                  onClick={() => {
                                    setFormStems(prev => {
                                      const isExist = prev.list.includes(stem);
                                      const updatedList = isExist 
                                        ? prev.list.filter(x => x !== stem) 
                                        : [...prev.list, stem];
                                      return { ...prev, list: updatedList };
                                    });
                                  }}
                                  className={`p-2 text-xs font-bold border transition-colors flex items-center justify-between uppercase ${
                                    isChecked 
                                      ? "bg-zinc-900 border-zinc-700 text-white" 
                                      : "bg-neutral-950 border-zinc-900/60 text-zinc-600 hover:text-zinc-400"
                                  }`}
                                >
                                  <span>{stem}</span>
                                  {isChecked && <Check className="w-3 h-3 text-emerald-400" />}
                                </button>
                              );
                            })}
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <input 
                              type="text" 
                              placeholder="ADD CUSTOM STEM (E.G. SYNTH REVERB)" 
                              id="custom-stem-input"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const val = (e.target as HTMLInputElement).value.trim();
                                  if (val) {
                                    setFormStems(prev => ({ ...prev, list: [...prev.list, val] }));
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              }}
                              className="bg-neutral-950 border border-zinc-900 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 font-mono w-full max-w-sm"
                            />
                            <button
                              onClick={() => {
                                const el = document.getElementById("custom-stem-input") as HTMLInputElement;
                                if (el && el.value.trim()) {
                                  setFormStems(prev => ({ ...prev, list: [...prev.list, el.value.trim()] }));
                                  el.value = "";
                                }
                              }}
                              className="bg-zinc-800 hover:bg-zinc-700 px-3 text-xs font-bold uppercase transition-colors rounded-none cursor-pointer"
                            >
                              ADD
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">UPLOAD COMPACT ZIP ARCHIVE:</span>
                          <div className="border border-dashed border-zinc-800 p-6 text-center hover:border-zinc-700 transition-colors bg-neutral-950 relative">
                            <input 
                              type="file" 
                              accept=".zip,.rar,.tar" 
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  uploadFileToServer(file, "uploadthing", (url) => setFormStems(prev => ({ ...prev, list: [url] })));
                                }
                              }}
                            />
                            <Folder className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                            <p className="text-xs text-zinc-400">UPLOAD TRACKOUTS_ALL.ZIP</p>
                            {formStems.list.length === 1 && (
                              <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase truncate max-w-full">
                                MOUNTED: {formStems.list[0]}
                              </p>
                            )}
                          </div>

                          {/* Direct URL Input for Stems ZIP */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase block">OR PASTE DIRECT ZIP ARCHIVE URL:</span>
                            <input
                              type="text"
                              value={(formStems.list.length === 1 && formStems.list[0].startsWith("http")) ? formStems.list[0] : ""}
                              onChange={(e) => setFormStems(prev => ({ ...prev, list: e.target.value.trim() ? [e.target.value.trim()] : [] }))}
                              placeholder="https://example.com/stems_master.zip"
                              className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}                {/* STEP 5: DOCUMENTS */}
                {currentStep === 5 && (() => {
                  const handleAddDocument = (name: string, ver: string) => {
                    const trimmedName = name.trim();
                    if (!trimmedName) return;
                    const fullDocString = `${trimmedName} (v${ver})`;
                    if (formDocuments.includes(fullDocString)) {
                      showToast("Document with this name and version already attached.");
                      return;
                    }
                    setFormDocuments(prev => [...prev, fullDocString]);
                    logActivity("DOCUMENT_ATTACHED", `Attached document "${trimmedName}" version ${ver}`);
                    setNewDocName("");
                    setNewDocVersion("1.0");
                  };

                  const handleBumpVersion = (index: number, docString: string) => {
                    let name = docString;
                    let ver = "1.0";
                    const match = docString.match(/^(.*?)\s*\(v([\d\.]+)\)$/);
                    if (match) {
                      name = match[1];
                      ver = match[2];
                    }

                    const parts = ver.split(".");
                    let nextVer = "1.1";
                    if (parts.length === 2) {
                      const major = parseInt(parts[0], 10);
                      const minor = parseInt(parts[1], 10);
                      const option = window.prompt(`Select version bump option for "${name}":
1. Increment Minor (v${major}.${minor + 1})
2. Increment Major (v${major + 1}.0)
Or type a custom version:`, `${major}.${minor + 1}`);
                      
                      if (!option) return;
                      if (option === "1") {
                        nextVer = `${major}.${minor + 1}`;
                      } else if (option === "2") {
                        nextVer = `${major + 1}.0`;
                      } else {
                        nextVer = option.trim().replace(/^v/, "");
                      }
                    } else {
                      const custom = window.prompt(`Type new version for "${name}" (current: v${ver}):`, "1.1");
                      if (!custom) return;
                      nextVer = custom.trim().replace(/^v/, "");
                    }

                    const updatedString = `${name} (v${nextVer})`;
                    setFormDocuments(prev => prev.map((d, i) => i === index ? updatedString : d));
                    logActivity("DOCUMENT_VERSION_BUMP", `Bumped version of "${name}" from v${ver} to v${nextVer}`);
                    showToast(`Document "${name}" version updated to v${nextVer}`);
                  };

                  return (
                    <div className="space-y-4 text-left">
                      <div className="border-b border-zinc-900 pb-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-400 tracking-widest block uppercase">STEP 5 // COMPOSITION DOCUMENTS</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">Rule 8: Legal Versioning</span>
                      </div>

                      <div className="space-y-4">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block">UNLIMITED LEGAL & METADATA ATTACHMENTS (VERSIONED):</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {formDocuments.map((doc, index) => {
                            let name = doc;
                            let ver = "1.0";
                            const match = doc.match(/^(.*?)\s*\(v([\d\.]+)\)$/);
                            if (match) {
                              name = match[1];
                              ver = match[2];
                            }

                            return (
                              <div 
                                key={index}
                                className="border border-zinc-900 bg-neutral-950 p-3 text-xs flex flex-col justify-between space-y-2.5"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <span className="text-zinc-300 font-bold uppercase flex items-center gap-1.5 leading-snug">
                                      <FileText className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                      {name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono px-1.5 py-0.5 rounded-none uppercase">
                                        ACTIVE: v{ver}
                                      </span>
                                      <span className="text-[8px] text-zinc-500 uppercase tracking-tight">
                                        LOMON SECURE RECORD
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to remove document "${name}"?`)) {
                                        setFormDocuments(prev => prev.filter((_, i) => i !== index));
                                        logActivity("DOCUMENT_REMOVED", `Removed document "${name}"`);
                                      }
                                    }}
                                    className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                                    title="Remove Document"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="pt-2 border-t border-zinc-900/60 flex items-center justify-between">
                                  <button
                                    onClick={() => handleBumpVersion(index, doc)}
                                    className="text-[9px] bg-neutral-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-2 py-0.5 font-bold uppercase transition-all tracking-wider"
                                  >
                                    BUMP VERSION
                                  </button>
                                  <span className="text-[8px] text-zinc-600 font-mono uppercase">
                                    VERIFIED AGREEMENT
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {formDocuments.length === 0 && (
                          <div className="p-6 border border-dashed border-zinc-900 text-center text-zinc-600 text-xs">
                            NO VERSIONED DOCUMENTS ATTACHED. REQUIRED FOR LEGAL COMPLIANCE BEFORE PUBLISHING.
                          </div>
                        )}

                        <div className="bg-neutral-950 p-4 border border-zinc-900 space-y-3">
                          <span className="text-[9px] text-zinc-500 font-bold tracking-wider block uppercase">ATTACH NEW LEGAL AGREEMENT / RECORD</span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-8 space-y-1">
                              <label className="text-[8px] text-zinc-600 uppercase font-mono font-bold tracking-wider block">Document Name</label>
                              <input 
                                type="text" 
                                placeholder="E.G. EXCLUSIVE LICENSE AGREEMENT" 
                                value={newDocName}
                                onChange={(e) => setNewDocName(e.target.value)}
                                className="bg-neutral-950 border border-zinc-800 focus:border-zinc-500 px-3 py-1.5 text-xs text-white focus:outline-none font-mono w-full"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[8px] text-zinc-600 uppercase font-mono font-bold tracking-wider block">Initial Version</label>
                              <select
                                value={newDocVersion}
                                onChange={(e) => setNewDocVersion(e.target.value)}
                                className="bg-neutral-950 border border-zinc-800 focus:border-zinc-500 px-2 py-1.5 text-xs text-zinc-300 focus:outline-none font-mono w-full"
                              >
                                <option value="1.0">1.0 (Initial)</option>
                                <option value="1.1">1.1 (Draft Patch)</option>
                                <option value="2.0">2.0 (Revision)</option>
                                <option value="0.1">0.1 (Internal)</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2 flex items-end">
                              <button
                                onClick={() => handleAddDocument(newDocName, newDocVersion)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white w-full py-1.5 text-xs font-bold uppercase transition-colors rounded-none cursor-pointer flex-shrink-0"
                              >
                                ATTACH
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="border border-zinc-900 bg-neutral-950/10 p-3 text-[10.5px] text-zinc-500 space-y-1">
                          <p className="font-bold text-zinc-400 uppercase tracking-wide">Rule 8: Document Integrity Guidelines:</p>
                          <p>• Agreements like exclusive contracts and split sheets must carry semantic version identifiers (e.g. v1.0, v2.0).</p>
                          <p>• Whenever split allocations or administrative overrides change, the document MUST be updated using the "Bump Version" protocol.</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* STEP 6: LICENSING & PRICING */}
                {currentStep === 6 && (
                  <div className="space-y-4 text-left">
                    <div className="border-b border-zinc-900 pb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 tracking-widest block uppercase">STEP 6 // LICENSING RIGS & TEMPLATES</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">TEMPLATE-DRIVEN</span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase">CONFIGURE TEMPLATES & OVERRIDES FOR THIS FRAGMENT:</p>
                        <span className="text-[9px] text-zinc-500 font-mono italic">Edits made below will only affect this specific fragment</span>
                      </div>

                      <div className="space-y-4">
                        {(["access", "release", "commercial", "exclusive", "sync", "clearance"] as const).map(key => {
                          const license = formLicensing[key] || { enabled: false, price: 0, overrides: {} };
                          const defaultTemplate = DEFAULT_LICENSE_TEMPLATES.find(t => t.id === key);

                          const labelMap: Record<string, string> = {
                            access: "ACCESS LICENSE (MP3)",
                            release: "RELEASE LICENSE (WAV)",
                            commercial: "COMMERCIAL LICENSE (STEMS)",
                            exclusive: "EXCLUSIVE ACQUISITION",
                            sync: "SYNC LICENSE (FILM/TV)",
                            clearance: "CUSTOM CLEARANCE"
                          };

                          const codeMap: Record<string, string> = {
                            access: "MTR-MP3-LEASE",
                            release: "MTR-WAV-LEASE",
                            commercial: "MTR-STEMS-LEASE",
                            exclusive: "MTR-EXCLUSIVE-BUY",
                            sync: "MTR-SYNC-BROADCAST",
                            clearance: "MTR-CUSTOM-JV"
                          };

                          const fieldsToOverride = [
                            { id: "fileDelivery", label: "File Delivery" },
                            { id: "distributionLimit", label: "Distribution Limit" },
                            { id: "streamingLimit", label: "Streaming Limit" },
                            { id: "videoUse", label: "Video Use" },
                            { id: "monetization", label: "Monetization" },
                            { id: "performanceRights", label: "Performance Rights" },
                            { id: "term", label: "Term" },
                            { id: "territory", label: "Territory" },
                            { id: "publishingSplit", label: "Publishing Split" },
                            { id: "masterOwnership", label: "Master Ownership" },
                            { id: "exclusivity", label: "Exclusivity" },
                            { id: "contractVersion", label: "Contract Version" }
                          ] as const;

                          const isExpanded = !!expandedOverrides[key];

                          return (
                            <div 
                              key={key} 
                              className={`border transition-colors ${
                                license.enabled 
                                  ? "bg-neutral-950/40 border-zinc-900" 
                                  : "bg-neutral-950/10 border-zinc-900/40 opacity-60"
                              }`}
                            >
                              {/* HEADER BAR */}
                              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setFormLicensing(prev => ({
                                      ...prev,
                                      [key]: { ...prev[key], enabled: !prev[key].enabled }
                                    }))}
                                    className={`w-4 h-4 border flex items-center justify-center transition-colors cursor-pointer ${
                                      license.enabled 
                                        ? "bg-[#D9D6CA] border-[#D9D6CA] text-black" 
                                        : "bg-transparent border-zinc-800 text-transparent hover:border-zinc-700"
                                    }`}
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <div>
                                    <span className="text-xs font-bold uppercase text-white block">
                                      {labelMap[key]}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 font-bold block uppercase font-mono">
                                      {codeMap[key]}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                  {license.enabled && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">PRICE:</span>
                                        <div className="relative">
                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">$</span>
                                          <input 
                                            type="number"
                                            value={license.price}
                                            onChange={(e) => setFormLicensing(prev => ({
                                              ...prev,
                                              [key]: { ...prev[key], price: Number(e.target.value) }
                                            }))}
                                            className="bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] focus:outline-none pl-5 pr-2.5 py-1 text-xs text-white w-24 font-bold font-mono"
                                          />
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => setExpandedOverrides(prev => ({
                                          ...prev,
                                          [key]: !prev[key]
                                        }))}
                                        className="text-[10px] font-bold uppercase tracking-wider text-[#D9D6CA] hover:text-white border border-[#D9D6CA]/20 hover:border-[#D9D6CA] px-2 py-1 transition-all cursor-pointer"
                                      >
                                        {isExpanded ? "COLLAPSE OVERRIDES" : "EDIT OVERRIDES"}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* OVERRIDES SUBFORM PANEL */}
                              <AnimatePresence>
                                {license.enabled && isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-zinc-900/60 bg-zinc-950/80 p-4"
                                  >
                                    <div className="mb-3">
                                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                                        OVERRIDE DEFAULT PARAMS // {labelMap[key]}
                                      </span>
                                      <span className="text-[9px] text-zinc-600 uppercase font-mono block">
                                        LEAVE EMPTY TO MERGE SYSTEM TEMPLATE DEFAULTS
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                      {fieldsToOverride.map((field) => {
                                        const defaultValue = defaultTemplate ? defaultTemplate[field.id] : "";
                                        const currentValue = (license.overrides as any)?.[field.id] || "";

                                        return (
                                          <div key={field.id} className="space-y-1">
                                            <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">
                                              {field.label}
                                            </label>
                                            <input
                                              type="text"
                                              value={currentValue}
                                              placeholder={String(defaultValue)}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setFormLicensing(prev => {
                                                  const currLicense = prev[key] || { enabled: true, price: 0, overrides: {} };
                                                  const currOverrides = currLicense.overrides || {};
                                                  return {
                                                    ...prev,
                                                    [key]: {
                                                      ...currLicense,
                                                      overrides: {
                                                        ...currOverrides,
                                                        [field.id]: val
                                                      }
                                                    }
                                                  };
                                                });
                                              }}
                                              className="bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] focus:outline-none px-2.5 py-1 text-[11px] text-white w-full font-mono placeholder:text-zinc-700"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7: PUBLISH */}
                {currentStep === 7 && (() => {
                  const checklistItems = [
                    {
                      id: "timestamp",
                      label: "Timestamp assigned",
                      isVerified: !!formInfo.timestamp,
                      value: formInfo.timestamp || "Missing",
                      step: 1,
                      description: "Configured in Step 1 // Fragment Info",
                    },
                    {
                      id: "composition",
                      label: "Composition linked",
                      isVerified: !!formInfo.name,
                      value: formInfo.name || "Missing",
                      step: 1,
                      description: "Configured in Step 1 // Fragment Info",
                    },
                    {
                      id: "artwork",
                      label: "Artwork uploaded",
                      isVerified: !!formArtwork,
                      value: formArtwork ? "Artwork verified" : "Missing",
                      step: 2,
                      description: "Uploaded in Step 2 // Artwork",
                    },
                    {
                      id: "preview",
                      label: "Preview uploaded",
                      isVerified: !!formAudioFiles.mp3Preview,
                      value: formAudioFiles.mp3Preview || "Missing",
                      step: 3,
                      description: "Configured in Step 3 // Preview Audio",
                    },
                    {
                      id: "master",
                      label: "Master uploaded",
                      isVerified: !!formAudioFiles.wavMaster,
                      value: formAudioFiles.wavMaster || "Missing",
                      step: 3,
                      description: "Configured in Step 3 // Master Audio",
                    },
                    {
                      id: "stems",
                      label: "Stem package verified",
                      isVerified: !!(formStems.list && formStems.list.length > 0),
                      value: formStems.list && formStems.list.length > 0 ? `${formStems.list.length} Files` : "Missing",
                      step: 4,
                      description: "Verified in Step 4 // Stems Archive",
                    },
                    {
                      id: "ownership",
                      label: "Ownership confirmed",
                      isVerified: ownershipConfirmed,
                      value: ownershipConfirmed ? "Confirmed by Admin" : "Needs Verification",
                      isInteractive: true,
                      onToggle: () => setOwnershipConfirmed(!ownershipConfirmed),
                      description: "Requires administrator verification click",
                    },
                    {
                      id: "documents",
                      label: "Documents attached",
                      isVerified: !!(formDocuments && formDocuments.length > 0),
                      value: formDocuments && formDocuments.length > 0 ? `${formDocuments.length} Deed(s)` : "No Documents",
                      step: 5,
                      description: "Configured in Step 5 // Legal Deeds",
                    },
                    {
                      id: "licenses",
                      label: "Licenses selected",
                      isVerified: Object.values(formLicensing).some((l: any) => l.enabled),
                      value: Object.values(formLicensing).filter((l: any) => l.enabled).length + " Tier(s) enabled",
                      step: 6,
                      description: "Configured in Step 6 // Licensing Grid",
                    },
                    {
                      id: "prices",
                      label: "Prices entered",
                      isVerified: Object.values(formLicensing).filter((l: any) => l.enabled).length > 0 && 
                                  Object.values(formLicensing).filter((l: any) => l.enabled).every((l: any) => Number(l.price) > 0),
                      value: "Prices set & verified",
                      step: 6,
                      description: "Configured in Step 6 // Licensing Grid",
                    },
                    {
                      id: "metadata",
                      label: "Metadata complete",
                      isVerified: !!(formInfo.bpm && formInfo.key && formInfo.genre && formInfo.mood),
                      value: formInfo.bpm && formInfo.key ? `${formInfo.bpm} BPM // ${formInfo.key}` : "Incomplete",
                      step: 1,
                      description: "BPM, Key, Genre, Mood set in Step 1",
                    },
                    {
                      id: "preview_approved",
                      label: "Public page preview approved",
                      isVerified: publicPreviewApproved,
                      value: publicPreviewApproved ? "Approved by Admin" : "Needs Approval",
                      isInteractive: true,
                      onToggle: () => setPublicPreviewApproved(!publicPreviewApproved),
                      description: "Requires administrator review click",
                    }
                  ];

                  const handleDeploymentAction = (actionType: string) => {
                    if (actionType === "preview") {
                      const targetId = editingFragmentId || formInfo.timestamp.replace(" ", "").toLowerCase() || "temp_preview";
                      const previewObj: Fragment = {
                        id: targetId,
                        name: formInfo.name || "UNNAMED COMPOSITION",
                        timestamp: formInfo.timestamp || "12:00 AM",
                        classification: formInfo.classification || "THRESHOLD COIL",
                        observation: `Previewing administrative draft.`,
                        duration: formInfo.duration || "04:00",
                        description: `Custom ${formInfo.mood || "archival"} fragment with BPM ${formInfo.bpm || "120"} in KEY ${formInfo.key || "C minor"}.`,
                        isExclusive: formLicensing.exclusive.enabled,
                        frequency: 220,
                        synthType: "keys",
                        bpm: Number(formInfo.bpm) || 120,
                        status: "Draft",
                        plays: 0,
                        revenue: 0,
                        artwork: formArtwork || "cover_bandit.jpg",
                        mp3Preview: formAudioFiles.mp3Preview || "bandit_preview.mp3",
                        wavMaster: formAudioFiles.wavMaster || "bandit_master.wav",
                        stems: formStems.list,
                        documents: formDocuments,
                        licensing: formLicensing,
                        key: formInfo.key || "C minor",
                        genre: formInfo.genre || "Archival",
                        mood: formInfo.mood || "Calm"
                      } as any;
                      setPreviewFragmentObj(previewObj);
                      showToast("Opening live client-side page preview...");
                      return;
                    }

                    if (actionType === "draft") {
                      handleSaveFragmentForm("Draft");
                      showToast(`Fragment saved as Draft.`);
                      return;
                    }

                    // Rule 4: Prevent publishing when required assets are missing (Publish, Schedule, Restricted)
                    if (actionType === "publish" || actionType === "schedule" || actionType === "restricted") {
                      const missingAssets = [];
                      if (!formArtwork) missingAssets.push("Artwork (Cover Image)");
                      if (!formAudioFiles.mp3Preview) missingAssets.push("MP3 Preview File");
                      if (!formAudioFiles.wavMaster) missingAssets.push("WAV Master File");

                      if (missingAssets.length > 0) {
                        alert(`[LOMON PUBLISHING BLOCKED]
Critical assets are missing. Publishing is strictly prohibited until all required assets are uploaded:
${missingAssets.map(asset => `• ${asset}`).join("\n")}

Please upload these assets in the respective wizard steps before proceeding.`);
                        logActivity("PUBLISH_BLOCKED", `Publish action blocked for "${formInfo.name || "Unnamed"}" due to missing assets: ${missingAssets.join(", ")}`);
                        return;
                      }
                    }

                    if (actionType === "publish") {
                      const unverified = checklistItems.filter(item => !item.isInteractive && !item.isVerified);
                      if (unverified.length > 0) {
                        showToast(`Warning: Auto-verifications incomplete (${unverified.map(u => u.label).join(", ")}).`);
                      }
                      if (!ownershipConfirmed || !publicPreviewApproved) {
                        const confirmSave = window.confirm("Admin Checklists (Ownership / Preview Approval) are currently incomplete. Force publish anyway?");
                        if (!confirmSave) return;
                      }
                      handleSaveFragmentForm("Published");
                      showToast(`Fragment published now.`);
                      return;
                    }

                    if (actionType === "schedule") {
                      const schedTime = window.prompt("Enter schedule date/time (e.g., 2026-07-15 12:00 AM):", "2026-07-15 12:00 AM");
                      if (schedTime) {
                        handleSaveFragmentForm("Scheduled");
                        showToast(`Fragment successfully scheduled for deployment on ${schedTime}`);
                        logActivity("PUBLISH_SCHEDULED", `Scheduled publication for "${formInfo.name}" at ${schedTime}`);
                      }
                      return;
                    }

                    if (actionType === "restricted") {
                      handleSaveFragmentForm("Restricted");
                      showToast(`Fragment published with Restricted clearance.`);
                      logActivity("PUBLISH_RESTRICTED", `Published "${formInfo.name}" with restricted clearance status`);
                      return;
                    }

                    if (actionType === "archive") {
                      handleSaveFragmentForm("Archived");
                      showToast(`Fragment archived.`);
                      logActivity("PUBLISH_ARCHIVED", `Archived composition "${formInfo.name}"`);
                      return;
                    }
                  };

                  return (
                    <div className="space-y-6 text-left">
                      <div className="border-b border-zinc-900 pb-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-400 tracking-[0.2em] block uppercase">STEP 7 // VALIDATION CHECKLIST & DEPLOYMENT</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">12 ARCHIVAL PROTOCOLS</span>
                      </div>

                      {/* 12-ITEM VALIDATION CHECKLIST GRID */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">FINAL INTEGRITY CHECKS:</span>
                          <span className="text-[9px] text-zinc-500 uppercase font-mono italic">Click auto-checks to return to that step</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {checklistItems.map((item) => {
                            const IconComponent = item.isVerified ? Check : Activity;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  if (item.isInteractive && item.onToggle) {
                                    item.onToggle();
                                  } else if (item.step) {
                                    setCurrentStep(item.step);
                                    showToast(`Jumping back to Step ${item.step}`);
                                  }
                                }}
                                className={`text-left p-3 border transition-all rounded-none flex flex-col justify-between h-24 select-none relative group ${
                                  item.isVerified 
                                    ? "bg-emerald-950/10 border-emerald-950/50 hover:bg-emerald-950/20 text-white" 
                                    : "bg-neutral-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                                }`}
                              >
                                <div className="flex items-start justify-between w-full">
                                  <span className={`text-xs font-bold tracking-wider ${item.isVerified ? "text-emerald-400" : "text-zinc-300"}`}>
                                    {item.label}
                                  </span>
                                  <div className={`p-1 ${item.isVerified ? "bg-emerald-950/40 text-emerald-400" : "bg-zinc-950 text-amber-500 animate-pulse"}`}>
                                    <IconComponent className="w-3.5 h-3.5" />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[10px] font-mono block truncate opacity-80 uppercase">
                                    {item.value}
                                  </span>
                                  <span className="text-[8px] text-zinc-500 block uppercase tracking-tight group-hover:text-zinc-400 transition-colors">
                                    {item.description}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* COMPOSITION BRIEF SUMMARY */}
                      <div className="bg-neutral-950/60 p-4 border border-zinc-900 text-xs rounded-none">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-2 tracking-wider">COMPOSITION METADATA SUMMARY</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-zinc-500 block uppercase text-[10px] font-bold">NAME</span>
                            <span className="font-bold text-white uppercase">{formInfo.name || "UNNAMED"}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[10px] font-bold">TIMESTAMP</span>
                            <span className="font-bold text-white">{formInfo.timestamp || "None"}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[10px] font-bold">BPM / KEY</span>
                            <span className="font-bold text-zinc-300">{formInfo.bpm ? `${formInfo.bpm} BPM` : "Missing"} / {formInfo.key || "C Minor"}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[10px] font-bold">GENRE / MOOD</span>
                            <span className="font-bold text-zinc-300 uppercase">{formInfo.genre || "Ambient"} • {formInfo.mood || "Mysterious"}</span>
                          </div>
                        </div>
                      </div>

                      {/* DEPLOYMENT CONTROLS */}
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">DEPLOYMENT CLEARANCE CONTROLS:</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            { id: "draft", label: "Save as Draft", desc: "Commit wizard state as offline draft", icon: Folder, style: "border-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-white hover:bg-neutral-900/30" },
                            { id: "preview", label: "Preview Fragment", desc: "Interactive public client-side layout review", icon: ExternalLink, style: "border-[#D9D6CA]/30 text-[#D9D6CA] hover:border-[#D9D6CA] hover:text-white hover:bg-[#D9D6CA]/5" },
                            { id: "publish", label: "Publish Now", desc: "Deploy composition directly to active archive", icon: Check, style: "bg-[#D9D6CA] text-black hover:bg-white border-[#D9D6CA] font-extrabold" },
                            { id: "schedule", label: "Schedule Publication", desc: "Establish timed release timestamp", icon: Activity, style: "border-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-white hover:bg-neutral-900/30 border-dashed" },
                            { id: "restricted", label: "Mark Restricted", desc: "Lock visibility to high cryptographic clearance", icon: Database, style: "border-red-950/40 text-red-400 hover:border-red-900 hover:bg-red-950/10" },
                            { id: "archive", label: "Archive", desc: "Vault composition as cold secondary record", icon: Archive, style: "border-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 hover:bg-neutral-950/40" }
                          ].map((opt) => {
                            const OptIcon = opt.icon;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleDeploymentAction(opt.id)}
                                className={`p-3.5 border transition-all text-left flex items-start gap-3 select-none cursor-pointer ${opt.style}`}
                              >
                                <div className="mt-0.5">
                                  <OptIcon className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold uppercase tracking-wide block">{opt.label}</span>
                                  <span className="text-[9px] opacity-75 block leading-tight">{opt.desc}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* BACK / NEXT BUTTON RIGS FOR WIZARD */}
                {mediaUploadProgress !== null && (
                  <div className="h-1.5 w-full bg-zinc-900 overflow-hidden relative mt-4">
                    <motion.div 
                      className="h-full bg-[#D9D6CA]" 
                      style={{ width: `${mediaUploadProgress}%` }}
                    />
                  </div>
                )}

                <div className="pt-6 border-t border-zinc-900 flex justify-between items-center">
                  <button
                    disabled={currentStep === 1}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-3 py-1 text-xs font-bold tracking-widest uppercase border border-zinc-900 bg-neutral-950 text-zinc-500 hover:text-white hover:border-zinc-700 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    ← PREVIOUS
                  </button>

                  <div className="text-xs text-zinc-600 font-bold uppercase">
                    STEP {currentStep} OF 7
                  </div>

                  {currentStep < 7 ? (
                    <button
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="px-4 py-1 text-xs font-bold tracking-widest uppercase border border-[#D9D6CA] bg-[#D9D6CA] text-black hover:bg-white hover:border-white transition-colors"
                    >
                      NEXT →
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!ownershipConfirmed || !publicPreviewApproved) {
                          const force = window.confirm("Admin checklists (Ownership / Preview Approval) are currently incomplete. Force publish anyway?");
                          if (!force) return;
                        }
                        handleSaveFragmentForm("Published");
                      }}
                      className="px-4 py-1 text-xs font-bold tracking-widest uppercase border border-emerald-400 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-400 hover:text-black transition-colors cursor-pointer"
                    >
                      PUBLISH FRAGMENT
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "Orders" && (
            <motion.div
              key="Orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400">ORDERS RECORD</h2>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">DATABASE CAP: 500 RECORDS</span>
              </div>

              {/* TABLE */}
              <div className="border border-zinc-900 rounded-none overflow-x-auto bg-[#040404]">
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 uppercase tracking-wider text-[10.5px]">
                      <th className="p-3">ID / Date</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Fragment Purchased</th>
                      <th className="p-3">License</th>
                      <th className="p-3 text-right">Paid</th>
                      <th className="p-3 text-right">Payloads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o: any, idx) => (
                      <tr key={o.id || idx} className="border-b border-zinc-900/60 hover:bg-zinc-900/10 transition-colors">
                        <td className="p-3 font-bold text-white whitespace-nowrap">
                          <div>{o.id}</div>
                          <div className="text-[10px] text-zinc-600 mt-0.5">{o.date}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-zinc-300">{o.customerName}</div>
                          <div className="text-[10.5px] text-zinc-500">{o.customerEmail}</div>
                        </td>
                        <td className="p-3 font-bold text-zinc-300 uppercase">{o.fragmentName}</td>
                        <td className="p-3 text-zinc-400">{o.licenseType}</td>
                        <td className="p-3 text-right font-bold text-[#D9D6CA]">${o.amountPaid}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => showToast(`Initiating downloads for: ${o.files.join(", ")}`)}
                              className="px-2 py-0.5 border border-zinc-900 bg-neutral-950 text-zinc-400 hover:text-white hover:border-zinc-700 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3" /> FILES
                            </button>
                            <button
                              onClick={() => {
                                window.alert(`[INVOICE ${o.id}]\n\nLOMON LLC\nAtlanta, GA\n\nClient: ${o.customerName} (${o.customerEmail})\nFragment: ${o.fragmentName}\nLicense: ${o.licenseType}\nTotal Paid: $${o.amountPaid}\n\nStatus: Paid & Executed`);
                              }}
                              className="px-2 py-0.5 border border-zinc-900 bg-neutral-950 text-zinc-400 hover:text-white hover:border-zinc-700 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3 h-3" /> INVOICE
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "Customers" && (
            <motion.div
              key="Customers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400">CUSTOMERS RECORD</h2>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">SECURE CUSTOMER LEDGER</span>
              </div>

              {/* TABLE */}
              <div className="border border-zinc-900 rounded-none overflow-x-auto bg-[#040404]">
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 uppercase tracking-wider text-[10.5px]">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3 text-center">Purchases</th>
                      <th className="p-3 text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c: any, idx) => (
                      <tr key={idx} className="border-b border-zinc-900/60 hover:bg-zinc-900/10 transition-colors">
                        <td className="p-3 font-bold text-white">{c.name}</td>
                        <td className="p-3 text-zinc-300 font-bold select-text">{c.email}</td>
                        <td className="p-3 text-center text-zinc-400 font-bold">{c.purchases}</td>
                        <td className="p-3 text-right font-bold text-[#D9D6CA]">${c.totalSpent.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "Analytics" && (
            <motion.div
              key="Analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400">ANALYTICS LEDGER</h2>
                <span className="text-[10px] text-[#D9D6CA] font-bold uppercase tracking-wider">LIVE TELEMETRY FEED</span>
              </div>

              {/* STATS ROW (Plays, Downloads, Sales, Revenue) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border border-zinc-900 bg-neutral-950/20 p-4 space-y-1">
                  <span className="text-[10px] tracking-widest text-zinc-500 font-bold block uppercase">TOTAL PLAYS</span>
                  <div className="text-xl font-bold font-mono tracking-tight text-white">12,450</div>
                </div>
                <div className="border border-zinc-900 bg-neutral-950/20 p-4 space-y-1">
                  <span className="text-[10px] tracking-widest text-zinc-500 font-bold block uppercase">TOTAL DOWNLOADS</span>
                  <div className="text-xl font-bold font-mono tracking-tight text-white">3,842</div>
                </div>
                <div className="border border-zinc-900 bg-neutral-950/20 p-4 space-y-1">
                  <span className="text-[10px] tracking-widest text-zinc-500 font-bold block uppercase">SALES COUNT</span>
                  <div className="text-xl font-bold font-mono tracking-tight text-white">{orders.length}</div>
                </div>
                <div className="border border-zinc-900 bg-neutral-950/20 p-4 space-y-1">
                  <span className="text-[10px] tracking-widest text-zinc-500 font-bold block uppercase">TOTAL REVENUE</span>
                  <div className="text-xl font-bold font-mono tracking-tight text-[#D9D6CA]">${totalRevenueSum.toLocaleString()}</div>
                </div>
              </div>

              {/* TOP FRAGMENTS LIST */}
              <div className="border border-zinc-900 p-5 space-y-4 text-left">
                <div className="border-b border-zinc-900 pb-2">
                  <span className="text-[11px] font-bold text-zinc-400 tracking-widest block uppercase">TOP COMPOSITIONS / FRAGMENTS</span>
                </div>
                
                <div className="space-y-2">
                  {fragments.slice(0, 4).map((frag, idx) => {
                    const progressVal = (idx === 0) ? "w-full" : (idx === 1) ? "w-4/5" : (idx === 2) ? "w-2/3" : "w-1/2";
                    return (
                      <div key={frag.id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-300 font-bold uppercase">{frag.timestamp} — {frag.name}</span>
                          <span className="text-zinc-500 font-bold uppercase">{((frag as any).plays || 1200).toLocaleString()} Plays</span>
                        </div>
                        <div className="h-1 bg-zinc-950 border border-zinc-900/40 relative">
                          <div className={`h-full bg-zinc-800 ${progressVal}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "Media Library" && (
            <motion.div
              key="Media Library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400">MEDIA ENGINE LIBRARY</h2>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">PERSISTENT STORAGE: 100% SECURE</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* FOLDERS VIEW BAR */}
                <div className="md:col-span-1 space-y-2">
                  <span className="text-[10px] tracking-widest text-zinc-500 font-bold block uppercase border-b border-zinc-900 pb-1.5 text-left">FOLDERS</span>
                  <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                    {(Object.keys(mediaFolders) as Array<keyof typeof mediaFolders>).map(folder => {
                      const isActive = activeMediaFolder === folder;
                      const fileCount = mediaFolders[folder].length;
                      return (
                        <button
                          key={folder}
                          onClick={() => setActiveMediaFolder(folder)}
                          className={`w-full text-left px-3 py-2 text-xs uppercase font-bold tracking-wider transition-colors flex items-center justify-between border cursor-pointer shrink-0 ${
                            isActive 
                              ? "bg-zinc-900 border-zinc-800 text-white" 
                              : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {folder === "Images" ? <Image className="w-3.5 h-3.5" /> : folder === "Documents" ? <FileText className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
                            {folder}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-bold">({fileCount})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FILES GRID LIST */}
                <div className="md:col-span-3 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                    <span className="text-xs tracking-widest text-zinc-400 font-bold uppercase">{activeMediaFolder} LISTING</span>
                    
                    <div className="relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer w-24 h-6"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            triggerMockUpload(file.name, (name) => {
                              setMediaFolders(prev => ({
                                ...prev,
                                [activeMediaFolder]: [...prev[activeMediaFolder], name]
                              }));
                            });
                          }
                        }}
                      />
                      <button className="bg-zinc-900 text-[#D9D6CA] border border-zinc-800 hover:border-zinc-700 text-xs font-bold px-2 py-0.5 uppercase cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" /> UPLOAD TO {activeMediaFolder.toUpperCase()}
                      </button>
                    </div>
                  </div>

                  {mediaUploadProgress !== null && (
                    <div className="border border-zinc-900 p-4 bg-zinc-950/20 flex items-center justify-between gap-4 text-xs text-zinc-400 font-bold">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        STORING ASSET IN SECURE CLOUD STORAGE GATEWAY...
                      </span>
                      <span className="text-emerald-400">{mediaUploadProgress}%</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mediaFolders[activeMediaFolder].map((file, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 border border-zinc-900/60 bg-neutral-950/40 hover:border-zinc-800 transition-colors flex items-center justify-between text-xs"
                      >
                        <span className="text-zinc-300 font-bold truncate pr-3 flex items-center gap-2">
                          <File className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
                          {file}
                        </span>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(file);
                              showToast(`Copied filename to clipboard: ${file}`);
                            }}
                            className="p-1 hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                            title="Copy File Link"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Delete file?")) {
                                setMediaFolders(prev => ({
                                  ...prev,
                                  [activeMediaFolder]: prev[activeMediaFolder].filter(f => f !== file)
                                }));
                                showToast(`Deleted asset: ${file}`);
                              }
                            }}
                            className="p-1 hover:bg-zinc-900 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete File"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "Settings" && (
            <motion.div
              key="Settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400">SETTINGS HUB</h2>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">CONFIG FILE FOR ALL GATEWAYS</span>
              </div>

              <div className="border border-zinc-900 bg-zinc-950/10 p-6 space-y-6 text-left">
                {/* PAYMENT METHODS */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#D9D6CA] tracking-widest block uppercase border-b border-zinc-900 pb-1.5">1. PAYMENT METHODS CONFIG</span>
                  
                  <div className="space-y-2">
                    {Object.entries(settings.paymentMethods).map(([method, isEnabled]) => (
                      <div key={method} className="flex items-center justify-between p-2 border border-zinc-900/60 bg-neutral-950/20 text-xs">
                        <span className="font-bold uppercase text-zinc-300">{method} GATEWAY</span>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            paymentMethods: {
                              ...prev.paymentMethods,
                              [method]: !(prev.paymentMethods as any)[method]
                            }
                          }))}
                          className={`px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors rounded-none border ${
                            isEnabled 
                              ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/60" 
                              : "bg-transparent border-zinc-800 text-zinc-500"
                          }`}
                        >
                          {isEnabled ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STORE INFORMATION */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#D9D6CA] tracking-widest block uppercase border-b border-zinc-900 pb-1.5">2. STORE INFORMATION</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Store Brand Name</label>
                      <input 
                        type="text" 
                        value={settings.storeName}
                        onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                        className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Location (Atlanta, GA)</label>
                      <input 
                        type="text" 
                        value={settings.address}
                        onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* BRANDING PRESETS */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#D9D6CA] tracking-widest block uppercase border-b border-zinc-900 pb-1.5">3. BRANDING PRESETS</span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {["Classic Monochromatic Slate", "Industrial Amber Core", "Cold Space Emerald"].map(theme => (
                      <button
                        key={theme}
                        onClick={() => {
                          setSettings(prev => ({ ...prev, branding: theme }));
                          showToast(`Branding updated: ${theme}`);
                        }}
                        className={`p-2.5 text-[11px] font-bold uppercase text-left border transition-colors ${
                          settings.branding === theme 
                            ? "bg-zinc-800 border-zinc-600 text-white" 
                            : "bg-neutral-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TAXES & NOTIFICATIONS */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#D9D6CA] tracking-widest block uppercase border-b border-zinc-900 pb-1.5">4. TAXES & EMAIL SYSTEMS</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-2 border border-zinc-900 bg-neutral-950/20 text-xs">
                      <div>
                        <span className="font-bold text-zinc-300 block">TAX RATE (VAT 15%)</span>
                        <span className="text-[10px] text-zinc-500 uppercase block font-bold">INVOICE ACCRUAL</span>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, taxRate: prev.taxRate === 0 ? 15 : 0 }))}
                        className={`px-3 py-0.5 text-[10px] font-bold border ${
                          settings.taxRate > 0 
                            ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/60" 
                            : "bg-transparent border-zinc-800 text-zinc-500"
                        }`}
                      >
                        {settings.taxRate > 0 ? "ENABLED (15%)" : "DISABLED (0%)"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 border border-zinc-900 bg-neutral-950/20 text-xs">
                      <div>
                        <span className="font-bold text-zinc-300 block">EMAIL NOTIFICATIONS</span>
                        <span className="text-[10px] text-zinc-500 uppercase block font-bold">TRANSACTIONAL NOTIFY</span>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                        className={`px-3 py-0.5 text-[10px] font-bold border ${
                          settings.emailNotifications 
                            ? "bg-[#D9D6CA] border-[#D9D6CA] text-black" 
                            : "bg-transparent border-zinc-800 text-zinc-500"
                        }`}
                      >
                        {settings.emailNotifications ? "ENABLED" : "DISABLED"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* GLOBAL LICENSE TEMPLATE DEFAULTS */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#D9D6CA] tracking-widest block uppercase border-b border-zinc-900 pb-1.5">5. GLOBAL LICENSE TEMPLATE DEFAULTS</span>
                  
                  <div className="border border-zinc-900 bg-neutral-950/20 p-4 space-y-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold font-mono">
                      Modify global default prices & values applied automatically to all fragments.
                    </p>

                    <div className="space-y-4">
                      {globalTemplates.map((tpl, tplIdx) => {
                        return (
                          <div key={tpl.id} className="border border-zinc-900 bg-neutral-950 p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-900/40 pb-2">
                              <div>
                                <span className="text-xs font-bold text-white block uppercase">{tpl.title}</span>
                                <span className="text-[10px] text-zinc-500 font-mono block uppercase">{tpl.subtitle}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase">DEFAULT PRICE:</span>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold font-mono">$</span>
                                  <input 
                                    type="number"
                                    value={tpl.price}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setGlobalTemplates(prev => {
                                        const updated = [...prev];
                                        updated[tplIdx] = { ...updated[tplIdx], price: val };
                                        return updated;
                                      });
                                    }}
                                    className="bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] focus:outline-none pl-5 pr-2.5 py-1 text-xs text-white w-24 font-bold font-mono"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {[
                                { id: "fileDelivery", label: "File Delivery" },
                                { id: "distributionLimit", label: "Distribution Limit" },
                                { id: "streamingLimit", label: "Streaming Limit" },
                                { id: "videoUse", label: "Video Use" },
                                { id: "monetization", label: "Monetization" },
                                { id: "performanceRights", label: "Performance Rights" },
                                { id: "term", label: "Term" },
                                { id: "territory", label: "Territory" },
                                { id: "publishingSplit", label: "Publishing Split" },
                                { id: "masterOwnership", label: "Master Ownership" },
                                { id: "exclusivity", label: "Exclusivity" },
                                { id: "contractVersion", label: "Contract Version" }
                              ].map((field) => (
                                <div key={field.id} className="space-y-1">
                                  <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">
                                    {field.label}
                                  </label>
                                  <input
                                    type="text"
                                    value={(tpl as any)[field.id] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setGlobalTemplates(prev => {
                                        const updated = [...prev];
                                        updated[tplIdx] = { ...updated[tplIdx], [field.id]: val };
                                        return updated;
                                      });
                                    }}
                                    className="bg-neutral-950 border border-zinc-900 focus:border-[#D9D6CA] focus:outline-none px-2.5 py-1 text-[11px] text-white w-full font-mono"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SAVE BUTTON */}
                <div className="pt-4 border-t border-zinc-900 flex justify-end">
                  <button
                    onClick={() => {
                      localStorage.setItem("lomon_admin_settings", JSON.stringify(settings));
                      localStorage.setItem("lomon_license_templates", JSON.stringify(globalTemplates));
                      showToast("All Administrative settings and global templates saved to node.");
                    }}
                    className="bg-[#D9D6CA] hover:bg-white text-black text-xs font-bold tracking-widest px-6 py-2 uppercase transition-colors cursor-pointer"
                  >
                    SAVE CONFIGURATION
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full screen client preview portal */}
        <AnimatePresence>
          {previewFragmentObj && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-y-auto bg-black flex flex-col"
            >
              <div className="bg-zinc-950/95 border-b border-zinc-900 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <span className="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                    ADMIN PREVIEW GATEWAY // PREVIEWING {previewFragmentObj.name}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewFragmentObj(null)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-xs text-[#D9D6CA] border border-zinc-800 hover:border-zinc-700 transition-colors uppercase font-mono cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> CLOSE PREVIEW
                </button>
              </div>
              <div className="flex-1 bg-black">
                <FragmentDetailPage
                  fragment={previewFragmentObj}
                  onBack={() => setPreviewFragmentObj(null)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
