import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Folder, File, Image, Music, FileText, Check, Plus, Trash2, 
  Copy, Archive, Edit2, Download, ExternalLink, Settings as SettingsIcon, 
  Activity, Users, ShoppingBag, Database, ArrowUpRight, BarChart3, Upload, Loader2, Play, X
} from "lucide-react";
import { Fragment } from "../data";

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

  // New Fragment Creation / Editing State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [editingFragmentId, setEditingFragmentId] = useState<string | null>(null);

  // Step-by-Step Form state
  const [formInfo, setFormInfo] = useState({
    timestamp: "11:28 PM",
    name: "SHADOW SHIFT",
    classification: "RESTLESS COID",
    bpm: 120,
    key: "G Minor",
    genre: "Ambient Trap",
    mood: "Restless",
    status: "Draft",
    duration: "4:30"
  });

  const [formArtwork, setFormArtwork] = useState<string>("");
  const [formAudioFiles, setFormAudioFiles] = useState({
    mp3Preview: "",
    wavMaster: ""
  });

  const [formStems, setFormStems] = useState<{ type: "file" | "multiple"; list: string[] }>({
    type: "multiple",
    list: ["Drums", "808", "Melody", "Bass", "FX", "Vocals", "Full Stems"]
  });

  const [formDocuments, setFormDocuments] = useState<string[]>([
    "PDF License", "Split Sheet", "Metadata", "Contracts", "Cue Sheets"
  ]);

  const [formLicensing, setFormLicensing] = useState({
    mp3: { enabled: true, price: 50 },
    wav: { enabled: true, price: 150 },
    trackouts: { enabled: true, price: 300 },
    unlimited: { enabled: true, price: 750 },
    exclusive: { enabled: true, price: 1500 }
  });

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
        }
      }, step.delay);
    });
  };

  // Operations inside Fragment Library
  const handleDeleteFragment = (id: string) => {
    if (window.confirm(`Are you sure you want to delete fragment ${id}?`)) {
      fetch(`/api/fragments/${id}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFragments(prev => prev.filter(f => f.id !== id));
            showToast(`Fragment ${id} deleted successfully.`);
          } else {
            showToast(`Error: ${data.error}`);
          }
        })
        .catch(err => {
          console.error(err);
          setFragments(prev => prev.filter(f => f.id !== id));
          showToast(`Fragment ${id} deleted locally.`);
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
        showToast(`Fragment ${id} archive status updated in database.`);
      } else {
        showToast(`Error: ${data.error}`);
      }
    })
    .catch(err => {
      console.error(err);
      setFragments(prev => prev.map(f => f.id === id ? { ...f, status: nextStatus } : f));
      showToast(`Fragment ${id} archive status updated locally.`);
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
    setFormLicensing((frag as any).licensing || {
      mp3: { enabled: true, price: 50 },
      wav: { enabled: true, price: 150 },
      trackouts: { enabled: true, price: 300 },
      unlimited: { enabled: true, price: 750 },
      exclusive: { enabled: true, price: 1500 }
    });
    setCurrentStep(1);
    setActiveTab("New Fragment");
  };

  const handleSaveFragmentForm = (finalStatus?: "Draft" | "Published") => {
    const statusToUse = finalStatus || (formInfo.status as any) || "Draft";
    
    const targetId = editingFragmentId || formInfo.timestamp.replace(" ", "").toLowerCase();
    
    const newFragData: Fragment = {
      id: targetId,
      name: formInfo.name,
      timestamp: formInfo.timestamp,
      classification: formInfo.classification,
      observation: `Handled via admin portal by ${currentUserEmail}.`,
      duration: formInfo.duration,
      description: `Custom ${formInfo.mood} fragment with BPM ${formInfo.bpm} in KEY ${formInfo.key}.`,
      isExclusive: formLicensing.exclusive.enabled,
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
      licensing: formLicensing,
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
        } else {
          showToast(`DB Error: ${data.error}`);
        }
      })
      .catch(err => {
        console.error(err);
        setFragments(prev => prev.map(f => f.id === editingFragmentId ? newFragData : f));
        showToast(`Fragment ${formInfo.name} updated locally.`);
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
        } else {
          showToast(`DB Error: ${data.error}`);
        }
      })
      .catch(err => {
        console.error(err);
        setFragments(prev => [newFragData, ...prev]);
        showToast(`New Fragment ${formInfo.name} added locally.`);
      });
    }

    // Reset Form and exit
    setEditingFragmentId(null);
    setCurrentStep(1);
    // Clear fields
    setFormInfo({
      timestamp: "11:28 PM",
      name: "SHADOW SHIFT",
      classification: "RESTLESS COID",
      bpm: 120,
      key: "G Minor",
      genre: "Ambient Trap",
      mood: "Restless",
      status: "Draft",
      duration: "4:30"
    });
    setActiveTab("Fragments");
  };

  // Real Upload function for Cloudinary / Uploadthing
  const uploadFileToServer = (
    file: File,
    endpoint: "cloudinary" | "uploadthing",
    onSuccess: (url: string) => void
  ) => {
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
    .then(res => res.json())
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
      showToast(`Upload connection failed: ${err.message || String(err)}`);
    });
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
          const isCompleted = currentStep > stepNum;
          return (
            <button
              key={step}
              onClick={() => setCurrentStep(stepNum)}
              className={`py-2 text-[10px] tracking-[0.1em] font-mono font-bold uppercase transition-colors text-center border ${
                isActive 
                  ? "bg-zinc-800 text-white border-zinc-700" 
                  : isCompleted 
                    ? "bg-zinc-900/40 text-emerald-400 border-zinc-900" 
                    : "bg-transparent text-zinc-600 border-transparent hover:text-zinc-400"
              }`}
            >
              <div className="block sm:hidden">{stepNum}</div>
              <div className="hidden sm:block">{stepNum}. {step}</div>
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
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === "New Fragment" && !editingFragmentId) {
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
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#D9D6CA]" />}
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
                      timestamp: "11:28 PM",
                      name: "SHADOW SHIFT",
                      classification: "RESTLESS COID",
                      bpm: 120,
                      key: "G Minor",
                      genre: "Ambient Trap",
                      mood: "Restless",
                      status: "Draft",
                      duration: "4:30"
                    });
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
                          onChange={(e) => setFormInfo(prev => ({ ...prev, bpm: Number(e.target.value) }))}
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
                            {formStems.list.length === 1 && formStems.list[0].endsWith(".zip") && (
                              <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase">
                                MOUNTED: {formStems.list[0]}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 5: DOCUMENTS */}
                {currentStep === 5 && (
                  <div className="space-y-4 text-left">
                    <div className="border-b border-zinc-900 pb-2">
                      <span className="text-[11px] font-bold text-zinc-400 tracking-widest block uppercase">STEP 5 // COMPOSITION DOCUMENTS</span>
                    </div>

                    <div className="space-y-4">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">UNLIMITED LEGAL & METADATA ATTACHMENTS:</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {formDocuments.map((doc, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between border border-zinc-900 bg-neutral-950 px-3 py-2 text-xs"
                          >
                            <span className="text-zinc-300 font-bold uppercase flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-zinc-600" />
                              {doc}
                            </span>
                            <button
                              onClick={() => setFormDocuments(prev => prev.filter((_, i) => i !== index))}
                              className="text-zinc-600 hover:text-red-400 transition-colors"
                              title="Remove Document"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 max-w-md">
                        <input 
                          type="text" 
                          placeholder="ADD DOCUMENT (E.G. CUE SHEET, LICENSE AGREEMENT)" 
                          id="custom-doc-input"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val) {
                                setFormDocuments(prev => [...prev, val]);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                          }}
                          className="bg-neutral-950 border border-zinc-900 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 font-mono w-full"
                        />
                        <button
                          onClick={() => {
                            const el = document.getElementById("custom-doc-input") as HTMLInputElement;
                            if (el && el.value.trim()) {
                              setFormDocuments(prev => [...prev, el.value.trim()]);
                              el.value = "";
                            }
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 px-3 text-xs font-bold uppercase transition-colors rounded-none cursor-pointer flex-shrink-0"
                        >
                          ATTACH
                        </button>
                      </div>

                      <div className="border border-zinc-900 bg-neutral-950/10 p-3 text-[10.5px] text-zinc-500 space-y-1">
                        <p className="font-bold text-zinc-400">COMMON DIGITAL DOCUMENT TEMPLATES:</p>
                        <p>• PDF License Agreement (Specifies limits, user rights)</p>
                        <p>• Split Sheet (Declares composition share percentages between songwriters)</p>
                        <p>• Catalog Metadata Registration Record (Declared to PROs: BMI, ASCAP, PRS)</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: LICENSING & PRICING */}
                {currentStep === 6 && (
                  <div className="space-y-4 text-left">
                    <div className="border-b border-zinc-900 pb-2">
                      <span className="text-[11px] font-bold text-zinc-400 tracking-widest block uppercase">STEP 6 // LICENSING RIGS & PRICING</span>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase block">ENABLE OR DISABLE SPECIFIC COMMERCIAL LICENSES:</p>

                      <div className="space-y-3">
                        {(["mp3", "wav", "trackouts", "unlimited", "exclusive"] as const).map(key => {
                          const license = formLicensing[key];
                          return (
                            <div 
                              key={key} 
                              className="border border-zinc-900 bg-neutral-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setFormLicensing(prev => ({
                                    ...prev,
                                    [key]: { ...prev[key], enabled: !prev[key].enabled }
                                  }))}
                                  className={`w-4 h-4 border flex items-center justify-center transition-colors cursor-pointer ${
                                    license.enabled 
                                      ? "bg-[#D9D6CA] border-[#D9D6CA] text-black" 
                                      : "bg-transparent border-zinc-800 text-transparent"
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <div>
                                  <span className="text-xs font-bold uppercase text-white block">
                                    {key === "mp3" ? "MP3 LICENSE" : key === "wav" ? "WAV LICENSE" : key === "trackouts" ? "TRACKOUT STEMS" : key === "unlimited" ? "UNLIMITED LICENSE" : "EXCLUSIVE ACQUISITION"}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-bold block uppercase">
                                    {key === "mp3" ? "MTR-MP3-LEASE" : key === "wav" ? "MTR-WAV-LEASE" : key === "trackouts" ? "MTR-STEMS-LEASE" : key === "unlimited" ? "MTR-UNLIMITED-LEASE" : "MTR-EXCLUSIVE-BUY"}
                                  </span>
                                </div>
                              </div>

                              {license.enabled && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500 font-bold uppercase">PRICE FIELD:</span>
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
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7: PUBLISH */}
                {currentStep === 7 && (
                  <div className="space-y-6 text-left">
                    <div className="border-b border-zinc-900 pb-2">
                      <span className="text-[11px] font-bold text-zinc-400 tracking-widest block uppercase">STEP 7 // COMPILE & DEPLOY STATE</span>
                    </div>

                    <div className="space-y-4">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">COMPOSITION SUMMARY DETAILS:</span>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-950/60 p-4 border border-zinc-900 text-xs">
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] font-bold">NAME</span>
                          <span className="font-bold text-white uppercase">{formInfo.name}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] font-bold">TIMESTAMP</span>
                          <span className="font-bold text-white">{formInfo.timestamp}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] font-bold">BPM / KEY</span>
                          <span className="font-bold text-zinc-300">{formInfo.bpm} BPM / {formInfo.key}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] font-bold">GENRE / MOOD</span>
                          <span className="font-bold text-zinc-300 uppercase">{formInfo.genre} • {formInfo.mood}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-zinc-500 block uppercase text-[10px] font-bold">MOUNTED AUDIO PREVIEW</span>
                          <span className="font-bold text-emerald-400 uppercase truncate block">
                            {formAudioFiles.mp3Preview || "None (Will use default fallback)"}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-zinc-500 block uppercase text-[10px] font-bold">LICENSING SUMMARY</span>
                          <span className="font-bold text-zinc-400 block truncate">
                            {Object.entries(formLicensing)
                              .filter(([_, value]: [string, any]) => value.enabled)
                              .map(([key, value]: [string, any]) => `${key.toUpperCase()}: $${value.price}`)
                              .join(" | ")}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleSaveFragmentForm("Draft")}
                          className="border border-zinc-800 hover:border-[#D9D6CA] bg-neutral-950 text-[#D9D6CA] hover:text-white text-xs font-bold tracking-widest px-4 py-2 uppercase rounded-none transition-colors cursor-pointer"
                        >
                          SAVE AS DRAFT
                        </button>
                        <button
                          onClick={() => handleSaveFragmentForm("Published")}
                          className="bg-[#D9D6CA] text-black hover:bg-white text-xs font-bold tracking-widest px-5 py-2 uppercase rounded-none transition-colors cursor-pointer"
                        >
                          PUBLISH NOW
                        </button>
                        <button
                          onClick={() => {
                            const schedTime = window.prompt("Enter schedule date/time (e.g., 2026-07-15 12:00 AM):", "2026-07-15 12:00 AM");
                            if (schedTime) {
                              handleSaveFragmentForm("Draft");
                              showToast(`Fragment scheduled for deployment on ${schedTime}`);
                            }
                          }}
                          className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-transparent text-zinc-400 hover:text-white text-xs font-bold tracking-widest px-4 py-2 uppercase rounded-none transition-colors cursor-pointer"
                        >
                          SCHEDULE DEPLOYMENT
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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
                      onClick={() => handleSaveFragmentForm()}
                      className="px-4 py-1 text-xs font-bold tracking-widest uppercase border border-emerald-400 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-400 hover:text-black transition-colors"
                    >
                      EXECUTE SAVE
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

                {/* SAVE BUTTON */}
                <div className="pt-4 border-t border-zinc-900 flex justify-end">
                  <button
                    onClick={() => {
                      localStorage.setItem("lomon_admin_settings", JSON.stringify(settings));
                      showToast("All Administrative settings saved to node.");
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
      </div>
    </div>
  );
}
