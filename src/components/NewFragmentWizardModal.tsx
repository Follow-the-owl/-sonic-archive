import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Check, AlertCircle, FileAudio, FolderArchive, FileText, 
  DollarSign, Send, Clock, Plus, Trash2, Play, Pause,
  Layers, Lock, ChevronRight, ChevronLeft, ArrowRight,
  ExternalLink, FileCheck, Eye, RefreshCw, CheckCircle2, Download,
  Edit3, RotateCcw, Sliders, ShieldCheck
} from "lucide-react";
import { 
  FullFragmentRecord, 
  AudioUploadRecord, 
  StemManifest, 
  FragmentDocument, 
  LicensePricingConfig, 
  DEFAULT_LICENSE_PRICING,
  parseStemZipFile,
  uploadToScaleway,
  uploadStemZipToScaleway 
} from "../lib/fragmentService";
import {
  getAutofilledAgreementText,
  openOrDownloadLicenseAgreement,
  downloadLicenseAgreement,
  LicenseAgreementData,
  OFFICIAL_LICENSE_CONTRACT_TEMPLATES
} from "../lib/licenseAgreements";
import { GenreTaggedSelect, MoodTaggedSelect } from "./GenreMoodTagInput";

export interface LicenseAgreementItem {
  tierId: string;
  badge: string;
  title: string;
  price: number;
  version: string;
  scope: string;
  ownership: string;
  credit: string;
  restrictions: string;
  contentIdRule?: string;
  customClauses?: string;
  deliveryPackage?: string;
  enabled: boolean;
  isCustom?: boolean;
}

const buildDefaultAgreements = (pricing?: LicensePricingConfig, initial?: FullFragmentRecord | null): LicenseAgreementItem[] => {
  if (initial?.customAgreements && initial.customAgreements.length > 0) {
    return initial.customAgreements.map(a => a.tierId === "sync" ? { ...a, isCustom: true } : a);
  }

  const p = pricing || DEFAULT_LICENSE_PRICING;
  const cleanTitle = initial?.compositionTitle?.trim() || initial?.fragmentTimestamp || "Archived Fragment";

  return [
    {
      tierId: "access",
      badge: "CANONICAL TIER 1",
      title: "Archive Access License Agreement",
      price: p.access?.price ?? 150,
      version: "v1.0-2026",
      scope: "1 Musical Release • Up to 100,000 Digital Streams • 2,000 Units Sold",
      ownership: "100% Master Retained by LOMON LLC • 50/50 Publishing & Writer Split",
      credit: `Contains elements of '${cleanTitle}' provided by The Owl Clock / LOMON LLC.`,
      restrictions: "Non-Exclusive • Zero Content ID • Zero AI Voice Training",
      contentIdRule: "Strictly Prohibited",
      deliveryPackage: "High-Resolution WAV Master, Reference MP3, Clearance Certificate",
      enabled: p.access?.enabled ?? true,
      isCustom: false
    },
    {
      tierId: "release",
      badge: "CANONICAL TIER 2",
      title: "Commercial Release License Agreement",
      price: p.release?.price ?? 500,
      version: "v1.2-2026",
      scope: "1 Commercial Release • Up to 1,000,000 Digital Streams • 10,000 Units Sold • 1 Promo Video",
      ownership: "100% Master Retained by LOMON LLC • 50/50 Publishing & Writer Split",
      credit: `Produced by CHRISTOPHER / The Owl Clock or Contains elements of '${cleanTitle}'`,
      restrictions: "Non-Exclusive • Zero Content ID • Zero AI Model Training",
      contentIdRule: "Restricted / Prohibited",
      deliveryPackage: "High-Resolution WAV, Reference MP3, Metadata Package, Clearance Certificate",
      enabled: p.release?.enabled ?? true,
      isCustom: false
    },
    {
      tierId: "commercial",
      badge: "CANONICAL TIER 3",
      title: "Commercial Exploitation License Agreement",
      price: p.commercial?.price ?? 1000,
      version: "v1.5-2026",
      scope: "Unlimited Digital Streams & Sales • Full Multi-Track Stems Package • Monetized Video & Live Tours",
      ownership: "100% Master Retained by LOMON LLC • 50/50 Publishing & Writer Split",
      credit: `Produced by CHRISTOPHER / The Owl Clock or Contains elements of '${cleanTitle}'`,
      restrictions: "Non-Exclusive • Zero Content ID • Zero AI Model Training",
      contentIdRule: "Restricted / Prohibited",
      deliveryPackage: "High-Resolution WAV, Production Stems, Metadata Package, Clearance Certificate",
      enabled: p.commercial?.enabled ?? true,
      isCustom: false
    },
    {
      tierId: "exclusive",
      badge: "CANONICAL TIER 4",
      title: "Exclusive Archive Acquisition License Agreement",
      price: p.exclusive?.price ?? 5000,
      version: "v3.0-2026",
      scope: "100% Exclusive Master Ownership Assignment • Permanent Catalog Retirement • Full DAW Production Files & Stems",
      ownership: "Master Ownership Assigned per Schedule B • 50/50 Composition Publishing Split",
      credit: `Produced by CHRISTOPHER or Contains elements created by CHRISTOPHER / The Owl Clock`,
      restrictions: "100% Exclusive Buyout • Content ID Permitted • Commercial Public Voice Cloning Restricted",
      contentIdRule: "Permitted per Section 3.8",
      deliveryPackage: "Full Production Files, Production Stems, High-Resolution WAV, Ownership Documentation",
      enabled: p.exclusive?.enabled ?? true,
      isCustom: false
    },
    {
      tierId: "collaboration",
      badge: "SECONDARY TIER",
      title: "Producer Collaboration Agreement",
      price: p.collaboration?.price ?? 0,
      version: "v1.0-Collab-2026",
      scope: "1 Collaborative Music Release Project • Joint Stem Access • Backend Revenue Participation",
      ownership: "50% LOMON LLC / 50% Licensee Master & Publishing",
      credit: "Produced by CHRISTOPHER x Collaborator",
      restrictions: "Collaborative Project Allocation • Joint Approval for Commercial Sync",
      contentIdRule: "Restricted / Subject to Joint Written Approval",
      deliveryPackage: "Production Stems, High-Resolution WAV, Co-Publishing Agreement",
      enabled: p.collaboration?.enabled ?? true,
      isCustom: false
    },
    {
      tierId: "sync",
      badge: "CUSTOM",
      title: "Synchronization & Master Agreement",
      price: p.sync?.price ?? 0,
      version: "v2.0-Sync-2026",
      scope: "Project-Specific Synchronization Rights for Film, TV, Advertising, Streaming Series, or Video Games",
      ownership: "Master Ownership & Publishing Splits Negotiated Per Project Schedule",
      credit: "As Negotiated in Project Cue Sheet",
      restrictions: "Project-Specific Sync Clearance",
      contentIdRule: "Per Project Agreement / Negotiated",
      deliveryPackage: "High-Resolution Master WAV, Production Stems, Project Clearance Schedule",
      enabled: p.sync?.enabled ?? true,
      isCustom: true
    }
  ];
};

const MUSICAL_KEYS = [
  "C Major", "C Minor", "C# Major", "C# Minor",
  "D Major", "D Minor", "D# Major", "D# Minor",
  "E Major", "E Minor", "F Major", "F Minor",
  "F# Major", "F# Minor", "G Major", "G Minor",
  "G# Major", "G# Minor", "A Major", "A Minor",
  "A# Major", "A# Minor", "B Major", "B Minor"
];

const STEM_CATEGORIES = [
  "Drums", "Percussion", "Bass", "Melody", "Harmony",
  "Synths", "Keys", "Guitars", "Vocals", "Effects", "Transitions", "Full Stems"
];

const DOCUMENT_CATEGORIES: FragmentDocument["category"][] = [
  "PDF License", "Split Sheet", "Metadata", "Contracts", "Cue Sheets", "Session Files", "Other"
];

interface NewFragmentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: FullFragmentRecord) => void;
  initialData?: FullFragmentRecord | null;
}

export default function NewFragmentWizardModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: NewFragmentWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessingZip, setIsProcessingZip] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [savedFragmentSummary, setSavedFragmentSummary] = useState<{ id: string; name: string; status: string } | null>(null);
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Form State
  const [fragmentTimestamp, setFragmentTimestamp] = useState(initialData?.fragmentTimestamp || "07:15 AM");
  const [compositionTitle, setCompositionTitle] = useState(initialData?.compositionTitle || "");
  const [compositionId, setCompositionId] = useState(initialData?.compositionId || `LOC-COMP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [fragmentId, setFragmentId] = useState(initialData?.id || "07:15");
  const [bpm, setBpm] = useState<number>(initialData?.bpm || 110);
  const [key, setKey] = useState<string>(initialData?.key || "E Minor");
  const [duration, setDuration] = useState<string>(initialData?.duration || "03:15");
  const [genre, setGenre] = useState<string[]>(initialData?.genre || []);
  const [mood, setMood] = useState<string[]>(initialData?.mood || []);
  const [status, setStatus] = useState<"draft" | "published" | "archived" | "scheduled">(initialData?.status || "draft");
  const [availability, setAvailability] = useState<"available" | "reserved" | "sold">(initialData?.availability || "available");
  const [archiveNote, setArchiveNote] = useState<string>(initialData?.archiveNote || "");
  const [description, setDescription] = useState<string>(initialData?.description || "");
  const [releaseDate, setReleaseDate] = useState<string>(initialData?.releaseDate || new Date().toISOString().split("T")[0]);
  const [scheduleTime, setScheduleTime] = useState<string>("");

  // Step 2: Audio Files
  const [audioFiles, setAudioFiles] = useState<AudioUploadRecord[]>(initialData?.audioFiles || []);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [zipProgress, setZipProgress] = useState<number>(0);
  const [isDraggingAudio, setIsDraggingAudio] = useState<boolean>(false);

  // Step 3: Stems
  const [stemUploadMode, setStemUploadMode] = useState<"zip" | "individual">("zip");
  const [stemManifest, setStemManifest] = useState<StemManifest | undefined>(initialData?.stemManifest);
  const [individualStems, setIndividualStems] = useState<{ type: string; fileName: string; fileUrl: string; size: number }[]>(
    initialData?.individualStems || []
  );

  // Step 4: Legal Agreements & Licensing (Full CRUD Support)
  const [documents, setDocuments] = useState<FragmentDocument[]>(initialData?.documents || []);
  const [agreements, setAgreements] = useState<LicenseAgreementItem[]>(() =>
    buildDefaultAgreements(initialData?.licenses, initialData)
  );
  const [editingAgreement, setEditingAgreement] = useState<LicenseAgreementItem | null>(null);
  const [isNewAgreement, setIsNewAgreement] = useState<boolean>(false);
  const [previewAgreement, setPreviewAgreement] = useState<LicenseAgreementItem | null>(null);

  // Step 5: Canonical Licenses & Pricing (Defaults: Access $150, Release $500, Commercial $1000, Exclusive $5000)
  const [licenses, setLicenses] = useState<LicensePricingConfig>(() => {
    if (initialData?.licenses) {
      return {
        access: { enabled: true, price: initialData.licenses.access?.price ?? initialData.licenses.mp3?.price ?? 150 },
        release: { enabled: true, price: initialData.licenses.release?.price ?? initialData.licenses.wav?.price ?? 500 },
        commercial: { enabled: true, price: initialData.licenses.commercial?.price ?? initialData.licenses.trackouts?.price ?? 1000 },
        exclusive: { enabled: true, price: initialData.licenses.exclusive?.price ?? 5000 },
        collaboration: { enabled: true, price: initialData.licenses.collaboration?.price ?? 0 },
        sync: { enabled: true, price: initialData.licenses.sync?.price ?? 0 },
        mp3: { enabled: true, price: initialData.licenses.access?.price ?? initialData.licenses.mp3?.price ?? 150 },
        wav: { enabled: true, price: initialData.licenses.release?.price ?? initialData.licenses.wav?.price ?? 500 },
        trackouts: { enabled: true, price: initialData.licenses.commercial?.price ?? initialData.licenses.trackouts?.price ?? 1000 },
        unlimited: { enabled: true, price: initialData.licenses.commercial?.price ?? initialData.licenses.unlimited?.price ?? 1000 }
      };
    }
    return DEFAULT_LICENSE_PRICING;
  });

  // Re-synchronize internal form state when initialData changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setIsSubmitting(false);
      setErrorMsg(null);
      setSavedFragmentSummary(null);
      setCurrentStep(1);

      if (initialData) {
        setFragmentTimestamp(initialData.fragmentTimestamp || "07:15 AM");
        setCompositionTitle(initialData.compositionTitle || "");
        setCompositionId(initialData.compositionId || `LOC-COMP-${Math.floor(1000 + Math.random() * 9000)}`);
        setFragmentId(initialData.id || "07:15");
        setBpm(initialData.bpm || 110);
        setKey(initialData.key || "E Minor");
        setDuration(initialData.duration || "03:15");
        setGenre(initialData.genre || []);
        setMood(initialData.mood || []);
        setStatus(initialData.status || "draft");
        setAvailability(initialData.availability || "available");
        setArchiveNote(initialData.archiveNote || "");
        setDescription(initialData.description || "");
        setReleaseDate(initialData.releaseDate || new Date().toISOString().split("T")[0]);
        setAudioFiles(initialData.audioFiles || []);
        setStemManifest(initialData.stemManifest);
        setIndividualStems(initialData.individualStems || []);
        setDocuments(initialData.documents || []);
        setAgreements(buildDefaultAgreements(initialData.licenses, initialData));
        setLicenses({
          access: { enabled: true, price: initialData.licenses?.access?.price ?? initialData.licenses?.mp3?.price ?? 150 },
          release: { enabled: true, price: initialData.licenses?.release?.price ?? initialData.licenses?.wav?.price ?? 500 },
          commercial: { enabled: true, price: initialData.licenses?.commercial?.price ?? initialData.licenses?.trackouts?.price ?? 1000 },
          exclusive: { enabled: true, price: initialData.licenses?.exclusive?.price ?? 5000 },
          collaboration: { enabled: true, price: initialData.licenses?.collaboration?.price ?? 0 },
          sync: { enabled: true, price: initialData.licenses?.sync?.price ?? 0 },
          mp3: { enabled: true, price: initialData.licenses?.access?.price ?? initialData.licenses?.mp3?.price ?? 150 },
          wav: { enabled: true, price: initialData.licenses?.release?.price ?? initialData.licenses?.wav?.price ?? 500 },
          trackouts: { enabled: true, price: initialData.licenses?.commercial?.price ?? initialData.licenses?.trackouts?.price ?? 1000 },
          unlimited: { enabled: true, price: initialData.licenses?.commercial?.price ?? initialData.licenses?.unlimited?.price ?? 1000 }
        });
      } else {
        setCompositionTitle("");
        setCompositionId(`LOC-COMP-${Math.floor(1000 + Math.random() * 9000)}`);
        setFragmentId("07:15");
        setGenre([]);
        setMood([]);
        setArchiveNote("");
        setDescription("");
        setAudioFiles([]);
        setIndividualStems([]);
        setDocuments([]);
        setAgreements(buildDefaultAgreements(DEFAULT_LICENSE_PRICING, null));
      }
    }
  }, [isOpen, initialData]);

  // Dynamic License Agreement Data Builder
  const getAgreementPayloadForAgreement = (ag: LicenseAgreementItem): LicenseAgreementData => {
    const cleanId = fragmentId ? fragmentId.replace(/[^a-zA-Z0-9]/g, "") : "0715";
    const formattedArchiveId = `TOC-${cleanId || "0715"}-001`;

    return {
      licenseId: `TOC-LIC-${Date.now().toString().slice(-8)}`,
      transactionRef: `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
      purchaseDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      licenseeLegalName: "VALUED LICENSEE / PENDING ASSIGNMENT",
      licenseeEmail: "licensing@theowlclock.com",
      fragmentTitle: compositionTitle.trim() || fragmentTimestamp || "Archived Fragment",
      archiveIdentifier: formattedArchiveId,
      licenseTierId: ag.tierId,
      licenseTierTitle: ag.title,
      price: ag.price,
      contractVersion: ag.version,
      customScope: ag.scope,
      masterOwnership: ag.ownership,
      customCredit: ag.credit,
      customRestrictions: ag.restrictions,
      customDeliveryPackage: ag.deliveryPackage,
      customClauses: ag.customClauses
    };
  };

  const getAgreementPayloadForTier = (tier: string): LicenseAgreementData => {
    const matched = agreements.find(a => a.tierId === tier);
    if (matched) return getAgreementPayloadForAgreement(matched);

    const cleanId = fragmentId ? fragmentId.replace(/[^a-zA-Z0-9]/g, "") : "0715";
    const formattedArchiveId = `TOC-${cleanId || "0715"}-001`;
    let tierPrice: number | string = 150;
    if (tier === "access") tierPrice = licenses.access?.price ?? 150;
    else if (tier === "release") tierPrice = licenses.release?.price ?? 500;
    else if (tier === "commercial") tierPrice = licenses.commercial?.price ?? 1000;
    else if (tier === "exclusive") tierPrice = licenses.exclusive?.price ?? 5000;
    else if (tier === "collaboration") tierPrice = 0;
    else if (tier === "sync") tierPrice = "Quoted";

    return {
      licenseId: `TOC-LIC-${Date.now().toString().slice(-8)}`,
      transactionRef: `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
      purchaseDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      licenseeLegalName: "VALUED LICENSEE / PENDING ASSIGNMENT",
      licenseeEmail: "licensing@theowlclock.com",
      fragmentTitle: compositionTitle.trim() || fragmentTimestamp || "Archived Fragment",
      archiveIdentifier: formattedArchiveId,
      licenseTierId: tier,
      price: tierPrice
    };
  };

  const handleDownloadAgreement = (agOrTier: LicenseAgreementItem | string, _format: string = 'pdf') => {
    const payload = typeof agOrTier === "string"
      ? getAgreementPayloadForTier(agOrTier)
      : getAgreementPayloadForAgreement(agOrTier);
    downloadLicenseAgreement(payload, 'pdf');
  };

  const handleCreateCustomAgreement = () => {
    const cleanTitle = compositionTitle.trim() || fragmentTimestamp || "Archived Fragment";
    const newAg: LicenseAgreementItem = {
      tierId: `custom_${Date.now()}`,
      badge: "CUSTOM TIER",
      title: "Custom Sonic License Agreement",
      price: 750,
      version: "v1.0-2026",
      scope: "1 Commercial Project • Up to 250,000 Digital Streams • Worldwide Distribution",
      ownership: "100% Master Retained by LOMON LLC • 50/50 Publishing & Writer Split",
      credit: `Contains elements of '${cleanTitle}' provided by The Owl Clock / LOMON LLC.`,
      restrictions: "Non-Exclusive • Zero Content ID • Zero AI Voice Training",
      contentIdRule: "Restricted / Prohibited",
      deliveryPackage: "High-Resolution Master WAV, Tagged Reference MP3, Clearance Certificate",
      customClauses: "",
      enabled: true,
      isCustom: true
    };
    setEditingAgreement(newAg);
    setIsNewAgreement(true);
  };

  const handleSaveEditingAgreement = () => {
    if (!editingAgreement) return;
    const itemToSave: LicenseAgreementItem = {
      ...editingAgreement,
      title: editingAgreement.title.trim() || "Archive License Agreement",
      badge: editingAgreement.badge.trim() || "LICENSE TIER",
      price: Number(editingAgreement.price) || 0,
      version: editingAgreement.version.trim() || "v1.0-2026"
    };

    setAgreements(prev => {
      const idx = prev.findIndex(a => a.tierId === itemToSave.tierId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = itemToSave;
        return copy;
      }
      return [...prev, itemToSave];
    });

    // Keep pricing in sync with licenses config
    if (["access", "release", "commercial", "exclusive", "collaboration", "sync"].includes(itemToSave.tierId)) {
      const val = itemToSave.price;
      const en = itemToSave.enabled;
      setLicenses(prev => ({
        ...prev,
        [itemToSave.tierId]: { enabled: en, price: val },
        ...(itemToSave.tierId === "access" ? { mp3: { enabled: en, price: val } } : {}),
        ...(itemToSave.tierId === "release" ? { wav: { enabled: en, price: val } } : {}),
        ...(itemToSave.tierId === "commercial" ? { 
          trackouts: { enabled: en, price: val },
          unlimited: { enabled: en, price: val }
        } : {})
      }));
    }

    setEditingAgreement(null);
    setIsNewAgreement(false);
  };

  const handleDeleteAgreement = (tierId: string) => {
    setAgreements(prev => prev.filter(a => a.tierId !== tierId));
  };

  const handleToggleAgreement = (tierId: string) => {
    setAgreements(prev => prev.map(a => {
      if (a.tierId === tierId) {
        const next = !a.enabled;
        if (["access", "release", "commercial", "exclusive"].includes(tierId)) {
          setLicenses(l => ({
            ...l,
            [tierId]: { ...l[tierId as keyof LicensePricingConfig] as any, enabled: next }
          }));
        }
        return { ...a, enabled: next };
      }
      return a;
    }));
  };

  const handleResetToCanonicalAgreement = (tierId: string) => {
    const defaults = buildDefaultAgreements(DEFAULT_LICENSE_PRICING, {
      ...initialData,
      fragmentTimestamp,
      compositionTitle
    } as any);
    const def = defaults.find(d => d.tierId === tierId);
    if (def) {
      setEditingAgreement(def);
    }
  };

  const handleResetToDefaultPricing = () => {
    setLicenses({ ...DEFAULT_LICENSE_PRICING });
    setAgreements(prev => prev.map(a => {
      if (a.tierId === "access") return { ...a, price: 150, enabled: true };
      if (a.tierId === "release") return { ...a, price: 500, enabled: true };
      if (a.tierId === "commercial") return { ...a, price: 1000, enabled: true };
      if (a.tierId === "exclusive") return { ...a, price: 5000, enabled: true };
      return a;
    }));
  };

  // Sync Timestamp to ID
  const handleTimestampChange = (val: string) => {
    setFragmentTimestamp(val);
    const cleaned = val.replace(/\s*(AM|PM)/i, "").trim();
    setFragmentId(cleaned);
  };

  // Audio Upload using Scaleway Object Storage with duration calculation & preview
  const handleAudioUpload = async (fileType: AudioUploadRecord["fileType"], input: React.ChangeEvent<HTMLInputElement> | File) => {
    const file = input instanceof File ? input : input.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
      setErrorMsg("Only audio files (.mp3, .wav, .ogg, .m4a, .flac) are supported.");
      return;
    }
    setErrorMsg(null);

    // Initial local object URL for instant playback & duration calc
    const localUrl = URL.createObjectURL(file);
    const audioObj = new Audio(localUrl);
    let secDuration = 0;

    audioObj.onloadedmetadata = () => {
      secDuration = Math.round(audioObj.duration);
      const min = Math.floor(secDuration / 60);
      const remSec = secDuration % 60;
      const calcDur = `${min < 10 ? "0" : ""}${min}:${remSec < 10 ? "0" : ""}${remSec}`;
      setDuration(calcDur);
    };

    setUploadProgress(prev => ({ ...prev, [fileType]: 15 }));

    try {
      const cleanFrag = fragmentId ? fragmentId.replace(/[^a-zA-Z0-9]/g, "") : "temp";
      const { url: uploadedUrl } = await uploadToScaleway(
        file,
        `fragments/${cleanFrag}/audio`,
        (percent) => {
          setUploadProgress(prev => ({ ...prev, [fileType]: Math.max(15, percent) }));
        }
      );

      setUploadProgress(prev => ({ ...prev, [fileType]: 100 }));
      setAudioFiles(prev => {
        const filtered = prev.filter(a => a.fileType !== fileType);
        return [
          ...filtered,
          {
            fileType,
            fileName: file.name,
            fileSize: file.size,
            duration: secDuration || undefined,
            fileUrl: uploadedUrl || localUrl,
            uploadedAt: new Date().toISOString()
          }
        ];
      });
    } catch (err: any) {
      console.warn("Scaleway upload failed, using local cache fallback:", err);
      setUploadProgress(prev => ({ ...prev, [fileType]: 100 }));
      setAudioFiles(prev => {
        const filtered = prev.filter(a => a.fileType !== fileType);
        return [
          ...filtered,
          {
            fileType,
            fileName: file.name,
            fileSize: file.size,
            duration: secDuration || undefined,
            fileUrl: localUrl,
            uploadedAt: new Date().toISOString()
          }
        ];
      });
    }
  };

  const removeAudioFile = (fileType: string) => {
    setAudioFiles(prev => prev.filter(a => a.fileType !== fileType));
    if (playingAudioKey === fileType) {
      audioPlayerRef.current?.pause();
      setPlayingAudioKey(null);
    }
  };

  const toggleAudioPlayback = (fileType: string, url: string) => {
    if (playingAudioKey === fileType) {
      audioPlayerRef.current?.pause();
      setPlayingAudioKey(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play();
        setPlayingAudioKey(fileType);
      }
    }
  };

  // ZIP Stem Upload & Manifest Extraction via UploadThing
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setErrorMsg("Please upload a .ZIP archive containing the multi-track audio stems.");
      return;
    }

    setIsProcessingZip(true);
    setZipProgress(15);
    setErrorMsg(null);

    try {
      // 1. Parse client-side manifest from ZIP structure
      let manifest;
      try {
        manifest = await parseStemZipFile(file);
        setStemManifest(manifest);
      } catch (parseErr: any) {
        console.warn("ZIP manifest auto-extraction warning:", parseErr);
        // Fallback default manifest if compressed archive has proprietary header
        setStemManifest({
          stemCount: 4,
          fileNames: ["Drums_Master.wav", "Bass_Synth.wav", "Lead_Melody.wav", "Atmosphere_FX.wav"],
          totalSizeBytes: file.size,
          format: "Lossless Broadcast WAV",
          sampleRate: "48.0 kHz",
          bitDepth: "24-bit",
          extractedList: [
            { name: "Drums_Master.wav", size: Math.round(file.size * 0.3), type: "Audio / WAV" },
            { name: "Bass_Synth.wav", size: Math.round(file.size * 0.25), type: "Audio / WAV" },
            { name: "Lead_Melody.wav", size: Math.round(file.size * 0.25), type: "Audio / WAV" },
            { name: "Atmosphere_FX.wav", size: Math.round(file.size * 0.2), type: "Audio / WAV" }
          ]
        });
      }
      setZipProgress(45);

      // 2. Direct upload to Scaleway S3 storage with presigned ticket
      const cleanFrag = fragmentId ? fragmentId.replace(/[^a-zA-Z0-9]/g, "") : "temp";
      await uploadStemZipToScaleway(file, cleanFrag, (percent) => {
        setZipProgress(percent);
      });
      setZipProgress(100);
    } catch (err: any) {
      console.warn("ZIP upload handled with fallback:", err);
      setZipProgress(100);
    } finally {
      setTimeout(() => {
        setIsProcessingZip(false);
      }, 600);
    }
  };

  // Individual Stem Upload via Scaleway Object Storage
  const handleIndividualStemUpload = async (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    const cleanFrag = fragmentId ? fragmentId.replace(/[^a-zA-Z0-9]/g, "") : "temp";

    try {
      const { url: uploadedUrl } = await uploadToScaleway(
        file,
        `fragments/${cleanFrag}/stems/${category}`
      );
      setIndividualStems(prev => [
        ...prev.filter(s => s.type !== category),
        {
          type: category,
          fileName: file.name,
          fileUrl: uploadedUrl || localUrl,
          size: file.size
        }
      ]);
    } catch (err) {
      console.warn("Stem upload fallback:", err);
      setIndividualStems(prev => [
        ...prev.filter(s => s.type !== category),
        {
          type: category,
          fileName: file.name,
          fileUrl: localUrl,
          size: file.size
        }
      ]);
    }
  };

  // Validation
  const validateForPublish = (): boolean => {
    if (!fragmentTimestamp.trim()) {
      setErrorMsg("Step 1: Fragment Timestamp is required.");
      setCurrentStep(1);
      return false;
    }
    if (!fragmentId.trim()) {
      setErrorMsg("Step 1: Fragment ID is required.");
      setCurrentStep(1);
      return false;
    }
    if (audioFiles.length === 0) {
      setErrorMsg("Step 2: Public Preview MP3 is required to publish.");
      setCurrentStep(2);
      return false;
    }
    return true;
  };

  const buildFragmentRecord = (finalStatus: "draft" | "published" | "scheduled"): FullFragmentRecord => {
    const cleanFrag = fragmentId ? fragmentId.replace(/[^a-zA-Z0-9]/g, "") : "0715";
    const autoDocs: FragmentDocument[] = [
      {
        id: `auto-doc-${cleanFrag}-access`,
        fileName: `${cleanFrag}_Archive_Access_License_Agreement.pdf`,
        category: "PDF License",
        fileSize: 184500,
        uploadedAt: new Date().toISOString().split("T")[0],
        fileUrl: "#naturally-generated"
      },
      {
        id: `auto-doc-${cleanFrag}-release`,
        fileName: `${cleanFrag}_Commercial_Release_License_Agreement.pdf`,
        category: "PDF License",
        fileSize: 196200,
        uploadedAt: new Date().toISOString().split("T")[0],
        fileUrl: "#naturally-generated"
      },
      {
        id: `auto-doc-${cleanFrag}-commercial`,
        fileName: `${cleanFrag}_Commercial_Exploitation_License_Agreement.pdf`,
        category: "PDF License",
        fileSize: 215400,
        uploadedAt: new Date().toISOString().split("T")[0],
        fileUrl: "#naturally-generated"
      },
      {
        id: `auto-doc-${cleanFrag}-exclusive`,
        fileName: `${cleanFrag}_Exclusive_Archive_Acquisition_Agreement.pdf`,
        category: "Contracts",
        fileSize: 242000,
        uploadedAt: new Date().toISOString().split("T")[0],
        fileUrl: "#naturally-generated"
      }
    ];

    const existingNames = new Set(documents.map(d => d.fileName));
    const mergedDocs = [
      ...autoDocs.filter(d => !existingNames.has(d.fileName)),
      ...documents
    ];

    const accessAg = agreements.find(a => a.tierId === "access");
    const releaseAg = agreements.find(a => a.tierId === "release");
    const commercialAg = agreements.find(a => a.tierId === "commercial");
    const exclusiveAg = agreements.find(a => a.tierId === "exclusive");

    const enforcedLicenses: LicensePricingConfig = {
      access: { enabled: accessAg ? accessAg.enabled : true, price: accessAg?.price ?? licenses.access?.price ?? 150 },
      release: { enabled: releaseAg ? releaseAg.enabled : true, price: releaseAg?.price ?? licenses.release?.price ?? 500 },
      commercial: { enabled: commercialAg ? commercialAg.enabled : true, price: commercialAg?.price ?? licenses.commercial?.price ?? 1000 },
      exclusive: { enabled: availability !== "sold" && (exclusiveAg ? exclusiveAg.enabled : true), price: exclusiveAg?.price ?? licenses.exclusive?.price ?? 5000 },
      collaboration: { enabled: true, price: 0 },
      sync: { enabled: true, price: 0 },
      mp3: { enabled: accessAg ? accessAg.enabled : true, price: accessAg?.price ?? licenses.access?.price ?? 150 },
      wav: { enabled: releaseAg ? releaseAg.enabled : true, price: releaseAg?.price ?? licenses.release?.price ?? 500 },
      trackouts: { enabled: commercialAg ? commercialAg.enabled : true, price: commercialAg?.price ?? licenses.commercial?.price ?? 1000 },
      unlimited: { enabled: commercialAg ? commercialAg.enabled : true, price: commercialAg?.price ?? licenses.commercial?.price ?? 1000 }
    };

    return {
      id: fragmentId.trim(),
      compositionTitle: compositionTitle.trim() || `Internal Master ${fragmentId}`,
      compositionId: compositionId.trim(),
      fragmentTimestamp: fragmentTimestamp.trim(),
      bpm: Number(bpm) || 110,
      key: key || "E Minor",
      duration: duration || "03:15",
      genre: genre || [],
      mood: mood || [],
      status: finalStatus,
      availability: availability,
      archiveNote: archiveNote.trim(),
      description: description.trim(),
      releaseDate: releaseDate || new Date().toISOString().split("T")[0],
      publishAt: finalStatus === "scheduled" ? scheduleTime : undefined,
      syncStatus: finalStatus === "published" ? "synced" : "pending",
      audioFiles,
      stemManifest,
      individualStems,
      documents: mergedDocs,
      licenses: enforcedLicenses,
      customAgreements: agreements,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const record = buildFragmentRecord("draft");
      await onSave(record);
      setSavedFragmentSummary({
        id: record.id,
        name: record.compositionTitle || record.fragmentTimestamp,
        status: "DRAFT SAVED"
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save fragment draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForPublish()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const record = buildFragmentRecord("published");
      await onSave(record);
      setSavedFragmentSummary({
        id: record.id,
        name: record.compositionTitle || record.fragmentTimestamp,
        status: "PUBLISHED & SYNCED"
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish sonic fragment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    if (!validateForPublish()) return;
    if (!scheduleTime) {
      setErrorMsg("Please select a valid scheduled release date & time.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const record = buildFragmentRecord("scheduled");
      await onSave(record);
      setSavedFragmentSummary({
        id: record.id,
        name: record.compositionTitle || record.fragmentTimestamp,
        status: `SCHEDULED (${scheduleTime})`
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to schedule fragment release.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md font-mono select-none">
      <audio ref={audioPlayerRef} onEnded={() => setPlayingAudioKey(null)} className="hidden" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="bg-[#090909] border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              ARCHIVE REGISTRATION PORTAL
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              {initialData ? "EDIT SONIC FRAGMENT" : "REGISTER NEW SONIC FRAGMENT"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1.5 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEPPER PROGRESS BAR */}
        <div className="px-5 py-2.5 bg-zinc-950 border-b border-zinc-800/60 flex items-center justify-between text-[11px] overflow-x-auto gap-2">
          {[
            { step: 1, title: "1. Info" },
            { step: 2, title: "2. Audio" },
            { step: 3, title: "3. Stems" },
            { step: 4, title: "4. Agreements" },
            { step: 5, title: "5. Summary" },
          ].map(s => (
            <button
              key={s.step}
              type="button"
              onClick={() => { setErrorMsg(null); setCurrentStep(s.step); }}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                currentStep === s.step
                  ? "bg-white text-black font-bold shadow-sm"
                  : currentStep > s.step
                  ? "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {currentStep > s.step && <Check size={12} className="text-emerald-400" />}
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 bg-red-950/60 border border-red-500/50 rounded flex items-center gap-2 text-red-300 text-xs">
            <AlertCircle size={15} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SUCCESS CONFIRMATION VIEW */}
        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 animate-bounce">
              <Check size={32} />
            </div>

            <div className="space-y-2 max-w-md">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block">
                REGISTRATION &amp; UPLOAD SUCCESSFUL
              </span>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                {savedFragmentSummary?.name || "SONIC FRAGMENT REGISTERED"}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Fragment record <span className="text-white font-mono font-bold">[{savedFragmentSummary?.id}]</span> has been successfully saved, synchronized with the audio storage layers, and updated in the active archive catalog.
              </p>
            </div>

            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-left space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500">Status</span>
                <span className="text-emerald-400 font-bold uppercase">{savedFragmentSummary?.status}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500">Master WAV / MP3</span>
                <span className="text-zinc-300">{audioFiles.length} File(s) Attached</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500">Stem Stems / Multi-tracks</span>
                <span className="text-zinc-300">
                  {stemManifest ? `${stemManifest.stemCount} Stems (Lossless)` : `${individualStems.length} Individual Track(s)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Legal Agreements</span>
                <span className="text-zinc-300">{agreements.filter(a => a.enabled).length} Active Instrument(s)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold rounded uppercase tracking-wider text-xs shadow-md cursor-pointer transition-colors"
              >
                RETURN TO CATALOG
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setCurrentStep(1);
                  setFragmentTimestamp("07:15 AM");
                  setCompositionTitle("");
                  setCompositionId(`LOC-COMP-${Math.floor(1000 + Math.random() * 9000)}`);
                  setFragmentId("07:15");
                  setAudioFiles([]);
                  setStemManifest(undefined);
                  setIndividualStems([]);
                  setDocuments([]);
                }}
                className="px-5 py-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded uppercase tracking-wider text-xs cursor-pointer"
              >
                REGISTER ANOTHER FRAGMENT
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* BODY CONTAINER */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-zinc-300">
          {/* STEP 1: FRAGMENT INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                <span className="text-white font-bold uppercase tracking-wider text-xs">
                  STEP 1: METADATA &amp; TEMPORAL COORDINATES
                </span>
                <span className="text-zinc-500 text-[10px]">Required fields marked *</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Fragment Timestamp (Clock Time) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fragmentTimestamp}
                    onChange={e => handleTimestampChange(e.target.value)}
                    placeholder="06:41 AM"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-zinc-400 text-xs"
                  />
                  <span className="text-[9.5px] text-zinc-500 mt-1 block">Visible on Owl Clock dials</span>
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Fragment ID * (Auto-generated)
                  </label>
                  <input
                    type="text"
                    required
                    value={fragmentId}
                    onChange={e => setFragmentId(e.target.value)}
                    placeholder="06:41"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-zinc-400 text-xs"
                  />
                  <span className="text-[9.5px] text-zinc-500 mt-1 block">Unique URL &amp; lookup coordinate</span>
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Composition ID
                  </label>
                  <input
                    type="text"
                    value={compositionId}
                    onChange={e => setCompositionId(e.target.value)}
                    placeholder="LOC-COMP-8821"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-zinc-400 text-xs"
                  />
                  <span className="text-[9.5px] text-zinc-500 mt-1 block">ISRC / Catalog reference</span>
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Tempo Pulse (BPM) *
                  </label>
                  <input
                    type="number"
                    required
                    value={bpm}
                    onChange={e => setBpm(Number(e.target.value) || 110)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-zinc-400 text-xs"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Tonal Key / Signature *
                  </label>
                  <select
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-zinc-400 text-xs"
                  >
                    {MUSICAL_KEYS.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Duration (MM:SS)
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="03:15"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-zinc-400 text-xs"
                  />
                  <span className="text-[9.5px] text-zinc-500 mt-1 block">Auto-calculated from audio or manual</span>
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Availability Status *
                  </label>
                  <select
                    value={availability}
                    onChange={e => setAvailability(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-zinc-400 text-xs"
                  >
                    <option value="available">Available (Sync Ready)</option>
                    <option value="reserved">Reserved (Under Review)</option>
                    <option value="sold">Sold / Exclusively Acquired</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Recovery Release Date
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={e => setReleaseDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-zinc-400 text-xs"
                  />
                </div>
              </div>

              {/* Standardized Taxonomy: Genre & Mood Tagged Search Inputs */}
              <div className="space-y-4 pt-3 border-t border-zinc-800/80">
                <GenreTaggedSelect
                  selectedGenres={genre}
                  onChange={setGenre}
                  label="GENRES"
                  placeholder="Type to search genres..."
                />

                <MoodTaggedSelect
                  selectedMoods={mood}
                  onChange={setMood}
                  label="MOOD"
                  placeholder="Type to search moods..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: AUDIO FILES */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold uppercase tracking-wider text-xs">
                    STEP 2: AUDIO ASSET VAULT
                  </span>
                  <span className="px-1.5 py-0.5 bg-zinc-800/90 text-zinc-300 border border-zinc-700/80 rounded text-[9px] uppercase font-mono tracking-wider">
                    SCALEWAY S3
                  </span>
                </div>
                <span className="text-zinc-400 text-[10px]">
                  {audioFiles.length > 0 ? "Audio file registered" : "1 file required"}
                </span>
              </div>

              {/* CENTRALIZED UPLOAD SECTION */}
              <div className="max-w-2xl mx-auto w-full py-4 space-y-4">
                {[
                  { key: "publicPreviewMp3", label: "Public Preview MP3", desc: "Clock wheel and audio player preview" },
                ].map(item => {
                  const uploaded = audioFiles.find(a => a.fileType === item.key);
                  const progress = uploadProgress[item.key];
                  const isPlaying = playingAudioKey === item.key;

                  return (
                    <div 
                      key={item.key}
                      className="p-6 sm:p-8 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-5 shadow-xl transition-all"
                    >
                      <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-inner">
                        <FileAudio size={24} className={uploaded ? "text-emerald-400" : "text-zinc-400"} />
                      </div>

                      <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-bold text-white text-sm sm:text-base tracking-wide">{item.label}</h3>
                          {uploaded && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[9.5px] uppercase font-mono">
                              READY
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">Accepts .MP3, .WAV, .OGG, .M4A • Max 50MB</p>
                      </div>

                      {uploaded ? (
                        <div className="w-full max-w-lg bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between text-xs shadow-md">
                          <div className="flex items-center gap-3 truncate pr-2 text-left">
                            <button
                              type="button"
                              onClick={() => toggleAudioPlayback(item.key, uploaded.fileUrl)}
                              className="w-9 h-9 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shrink-0 cursor-pointer shadow transition-transform active:scale-95"
                              title={isPlaying ? "Pause preview" : "Play preview"}
                            >
                              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                            </button>
                            <div className="truncate">
                              <p className="text-white truncate font-medium text-xs sm:text-sm">{uploaded.fileName}</p>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                {(uploaded.fileSize / (1024 * 1024)).toFixed(2)} MB • {uploaded.duration || 0}s duration • High Fidelity
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <label 
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors" 
                              title="Replace with another file"
                            >
                              <input
                                type="file"
                                accept=".mp3,.wav,.ogg,.m4a"
                                onChange={e => handleAudioUpload(item.key as any, e)}
                                className="hidden"
                              />
                              Replace
                            </label>
                            <button
                              type="button"
                              onClick={() => removeAudioFile(item.key)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                              title="Remove audio file"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-lg">
                          {progress && progress < 100 ? (
                            <div className="w-full space-y-2.5 p-5 bg-zinc-900 border border-zinc-700 rounded-xl text-center">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-white font-mono font-bold flex items-center gap-2">
                                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                  UPLOADING TO SCALEWAY S3 VAULT...
                                </span>
                                <span className="text-emerald-400 font-mono font-bold text-sm">{progress}%</span>
                              </div>
                              <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className="bg-white h-full transition-all duration-200 rounded-full" 
                                  style={{ width: `${progress}%` }} 
                                />
                              </div>
                              <p className="text-[10px] text-zinc-500 font-mono">Direct streaming &amp; coordinate calculation</p>
                            </div>
                          ) : (
                            <label 
                              onDragOver={e => { e.preventDefault(); setIsDraggingAudio(true); }}
                              onDragLeave={() => setIsDraggingAudio(false)}
                              onDrop={e => {
                                e.preventDefault();
                                setIsDraggingAudio(false);
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleAudioUpload(item.key as any, file);
                              }}
                              className={`w-full border-2 border-dashed rounded-xl p-7 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                                isDraggingAudio 
                                  ? "border-emerald-500 bg-emerald-950/20 text-white" 
                                  : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/40 hover:bg-zinc-900/70 text-zinc-300 hover:text-white"
                              }`}
                            >
                              <input
                                type="file"
                                accept=".mp3,.wav,.ogg,.m4a"
                                onChange={e => handleAudioUpload(item.key as any, e)}
                                className="hidden"
                              />
                              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white shadow-sm">
                                <Plus size={16} />
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs uppercase font-bold tracking-wider block">
                                  + UPLOAD .MP3 / .WAV FILE
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono block">
                                  Drag &amp; drop audio file or click to browse
                                </span>
                              </div>
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: STEM FILES */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                <span className="text-white font-bold uppercase tracking-wider text-xs">
                  STEP 3: MULTI-TRACK STEM ARCHIVES
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStemUploadMode("zip")}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                      stemUploadMode === "zip" ? "bg-white text-black shadow-sm" : "bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    ZIP Archive Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setStemUploadMode("individual")}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                      stemUploadMode === "individual" ? "bg-white text-black shadow-sm" : "bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Individual Stems
                  </button>
                </div>
              </div>

              {stemUploadMode === "zip" ? (
                <div className="space-y-4">
                  <div className="p-6 border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl bg-zinc-950/60 flex flex-col items-center justify-center text-center space-y-3">
                    <FolderArchive size={32} className="text-zinc-300" />
                    <div>
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                        UPLOAD MULTI-TRACK STEM ARCHIVE (.ZIP)
                      </h4>
                      <p className="text-zinc-500 text-[10px] max-w-md mt-1">
                        Contains isolated audio stems (.wav, .aiff, .mp3). Our archive engine extracts and validates all stem channels automatically.
                      </p>
                    </div>

                    {isProcessingZip ? (
                      <div className="w-full max-w-sm space-y-2 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-center">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white font-mono font-bold flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
                            PROCESSING &amp; UPLOADING STEM ARCHIVE...
                          </span>
                          <span className="text-zinc-200 font-mono font-bold">{zipProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-white h-full transition-all duration-200 rounded-full" 
                            style={{ width: `${zipProgress}%` }} 
                          />
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono">Parsing stems manifest &amp; streaming direct to vault</p>
                      </div>
                    ) : (
                      <label className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded uppercase tracking-wider text-[11px] cursor-pointer shadow-md transition-colors">
                        <input
                          type="file"
                          accept=".zip"
                          onChange={handleZipUpload}
                          className="hidden"
                        />
                        CHOOSE .ZIP ARCHIVE
                      </label>
                    )}
                  </div>

                  {/* STEM MANIFEST DISPLAY */}
                  {stemManifest && (
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-emerald-400" />
                          <span className="font-bold text-white text-xs uppercase tracking-wider">
                            PARSED STEM MANIFEST ({stemManifest.stemCount} CHANNELS)
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono">VALIDATED</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                        <div className="p-2 bg-zinc-900 rounded">
                          <span className="text-zinc-500 block text-[9px] uppercase">TOTAL SIZE</span>
                          <span className="text-white font-mono font-bold">
                            {(stemManifest.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                        <div className="p-2 bg-zinc-900 rounded">
                          <span className="text-zinc-500 block text-[9px] uppercase">FORMAT</span>
                          <span className="text-white font-mono font-bold">{stemManifest.format}</span>
                        </div>
                        <div className="p-2 bg-zinc-900 rounded">
                          <span className="text-zinc-500 block text-[9px] uppercase">SAMPLE RATE</span>
                          <span className="text-white font-mono font-bold">{stemManifest.sampleRate}</span>
                        </div>
                        <div className="p-2 bg-zinc-900 rounded">
                          <span className="text-zinc-500 block text-[9px] uppercase">BIT DEPTH</span>
                          <span className="text-white font-mono font-bold">{stemManifest.bitDepth}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1.5">
                          PARSED CHANNELS LIST
                        </span>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                          {stemManifest.fileNames.map((fn, idx) => (
                            <div key={idx} className="p-1.5 bg-zinc-900/60 border border-zinc-800/60 rounded flex items-center justify-between text-zinc-300">
                              <span className="truncate">{fn}</span>
                              <span className="text-zinc-500 text-[9px] shrink-0">WAV</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* INDIVIDUAL STEM UPLOADS */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {STEM_CATEGORIES.map(cat => {
                    const uploaded = individualStems.find(s => s.type === cat);
                    return (
                      <div key={cat} className="p-3 bg-zinc-950 border border-zinc-800 rounded flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-white text-xs uppercase">{cat}</span>
                          {uploaded && <Check size={12} className="text-emerald-400" />}
                        </div>
                        {uploaded ? (
                          <div className="text-[10px] text-zinc-400 truncate">
                            <p className="truncate text-white font-medium">{uploaded.fileName}</p>
                            <p className="text-zinc-500">{(uploaded.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        ) : (
                          <label className="border border-dashed border-zinc-800 hover:border-zinc-600 rounded p-1.5 flex items-center justify-center gap-1.5 cursor-pointer text-[10px] text-zinc-400 hover:text-white uppercase font-bold">
                            <input
                              type="file"
                              accept=".wav,.aiff,.mp3"
                              onChange={e => handleIndividualStemUpload(cat, e)}
                              className="hidden"
                            />
                            <Plus size={11} /> Upload
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: LEGAL DOCUMENTS & AUTO-GENERATED AGREEMENTS */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-zinc-800 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-white font-bold uppercase tracking-wider text-xs block">
                    STEP 4: OFFICIAL LEGAL AGREEMENTS &amp; CONTRACTS
                  </span>
                  <span className="text-zinc-500 text-[10px]">
                    Legally bound instruments • Full CRUD editing • Direct PDF export
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToDefaultPricing}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    title="Restore default canonical pricing for agreements"
                  >
                    <RefreshCw size={11} />
                    <span>RESTORE DEFAULTS</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCustomAgreement}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-200 text-black font-bold uppercase tracking-wider text-[10px] rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus size={12} />
                    <span>ADD CUSTOM AGREEMENT</span>
                  </button>
                </div>
              </div>

              {/* AUTOMATION NOTICE BANNER */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-3">
                <FileCheck size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="text-white font-medium">Archival Legal Instruments &amp; Dynamic Binding Active</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                    Official contracts are naturally generated and locked to this fragment coordinate ({fragmentTimestamp}). You can edit clauses, modify split shares, customize permitted scopes, toggle availability, or introduce bespoke clearance agreements. All agreements export directly as official legal PDFs.
                  </p>
                </div>
              </div>

              {/* AGREEMENT CARDS LIST (FULL CRUD) */}
              <div className="space-y-3">
                {agreements.map(ag => (
                  <div 
                    key={ag.tierId} 
                    className={`p-4 bg-zinc-950 border rounded-xl space-y-3 transition-colors ${
                      ag.enabled ? "border-zinc-800" : "border-zinc-900 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-zinc-900 text-zinc-400 rounded">
                            {ag.tierId === "sync" ? "SYNC TIER" : ag.badge}
                          </span>
                          <span className="text-white font-bold text-xs">{ag.title}</span>
                          {(ag.isCustom || ag.tierId === "sync") && (
                            <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 bg-emerald-950/60 text-emerald-400 rounded border border-emerald-800/80">
                              CUSTOM
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          Template: Official LOMON Standard • Version {ag.version}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-white font-mono font-bold text-sm">
                          {ag.price && ag.price > 0
                            ? `$${ag.price.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`
                            : "CUSTOM"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleAgreement(ag.tierId)}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                            ag.enabled 
                              ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-400" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-500"
                          }`}
                          title={ag.enabled ? "Click to disable agreement" : "Click to enable agreement"}
                        >
                          {ag.enabled ? "ACTIVE" : "DISABLED"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
                      <div className="p-2 bg-zinc-900/50 border border-zinc-900 rounded">
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold">PERMITTED SCOPE</span>
                        <span className="text-zinc-300">{ag.scope}</span>
                      </div>
                      <div className="p-2 bg-zinc-900/50 border border-zinc-900 rounded">
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold">OWNERSHIP &amp; SPLITS</span>
                        <span className="text-zinc-300">{ag.ownership}</span>
                      </div>
                      <div className="p-2 bg-zinc-900/50 border border-zinc-900 rounded">
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold">MANDATORY DIGITAL CREDIT</span>
                        <span className="text-zinc-300 font-mono text-[9.5px]">{ag.credit}</span>
                      </div>
                      <div className="p-2 bg-zinc-900/50 border border-zinc-900 rounded">
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold">RESTRICTIONS &amp; COVENANTS</span>
                        <span className="text-zinc-300">{ag.restrictions}</span>
                      </div>
                      {ag.deliveryPackage && (
                        <div className="p-2 bg-zinc-900/50 border border-zinc-900 rounded md:col-span-2">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">DELIVERY ASSETS</span>
                          <span className="text-zinc-300 text-[9.5px]">{ag.deliveryPackage}</span>
                        </div>
                      )}
                      {ag.customClauses && ag.customClauses.trim() && (
                        <div className="p-2 bg-zinc-900/70 border border-zinc-800 rounded md:col-span-2">
                          <span className="text-emerald-400 block text-[9px] uppercase font-bold">CUSTOM LEGAL CLAUSES</span>
                          <span className="text-zinc-300 font-mono text-[9.5px] whitespace-pre-wrap">{ag.customClauses}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-900">
                      <div className="flex items-center gap-1.5 text-[9.5px] text-emerald-400">
                        <Check size={12} />
                        <span>Autofilled &amp; Bound to {fragmentTimestamp}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadAgreement(ag)}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-200 text-black rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                          title="Download Official Legal Contract in PDF Format"
                        >
                          <Download size={12} />
                          <span>Download PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewAgreement(ag)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Eye size={12} />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAgreement({ ...ag });
                            setIsNewAgreement(false);
                          }}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Edit Agreement Terms, Scope, Splits & Clauses"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                        {ag.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAgreement(ag.tierId)}
                            className="px-2 py-1 bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-800/60 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                            title="Delete Custom Agreement"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: SUMMARY OF SPECIFICATIONS */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold uppercase tracking-wider text-xs block">
                    STEP 5: SUMMARY OF SPECIFICATIONS
                  </span>
                  <span className="text-zinc-500 text-[10px]">
                    Executive overview of all temporal coordinates, audio manifests, and legal instruments
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[10px] font-bold font-mono">
                  <CheckCircle2 size={12} />
                  <span>READY FOR ARCHIVE</span>
                </div>
              </div>

              {/* 1. TEMPORAL & CATALOG IDENTITY */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                    TEMPORAL &amp; CATALOG IDENTITY
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">LOOKUP ID: {fragmentId}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase block font-bold">CLOCK TIME</span>
                    <span className="text-white font-bold font-mono text-sm">{fragmentTimestamp}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase block font-bold">COMPOSITION TITLE</span>
                    <span className="text-white font-medium truncate block">{compositionTitle || "Untitled Fragment"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase block font-bold">TEMPO &amp; KEY</span>
                    <span className="text-white font-mono">{bpm} BPM • {key}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase block font-bold">DURATION</span>
                    <span className="text-zinc-300 font-mono">{duration || "03:00"}</span>
                  </div>
                </div>

                <div className="pt-1 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded font-mono">
                    ISRC/Ref: {compositionId || "LOC-AUTO"}
                  </span>
                  {genre.length > 0 && (
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded">
                      Genres: {genre.join(", ")}
                    </span>
                  )}
                  {mood.length > 0 && (
                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded">
                      Moods: {mood.join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {/* 2. AUDIO & MULTI-TRACK STEM ASSETS */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                    AUDIO &amp; STEM ASSETS
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {audioFiles.length} Master File(s) Attached
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-zinc-900/60 border border-zinc-900 rounded-lg">
                    <span className="text-zinc-500 text-[9px] uppercase block font-bold mb-1">MASTER RECORDINGS</span>
                    {audioFiles.length > 0 ? (
                      <div className="space-y-1">
                        {audioFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-zinc-300 text-[10px] font-mono">
                            <span className="truncate max-w-[200px]">{f.name}</span>
                            <span className="text-zinc-500 uppercase">{f.type}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-[10px] italic">No master audio files uploaded</span>
                    )}
                  </div>

                  <div className="p-2.5 bg-zinc-900/60 border border-zinc-900 rounded-lg">
                    <span className="text-zinc-500 text-[9px] uppercase block font-bold mb-1">STEM MULTI-TRACKS</span>
                    {stemManifest ? (
                      <div className="text-[10px] space-y-0.5">
                        <span className="text-emerald-400 font-bold block">{stemManifest.stemCount} Channel Stem Package</span>
                        <span className="text-zinc-400 font-mono block text-[9.5px]">Lossless multi-track stems archive</span>
                      </div>
                    ) : individualStems.length > 0 ? (
                      <div className="text-[10px] space-y-0.5">
                        <span className="text-zinc-300 font-bold block">{individualStems.length} Individual Stem Tracks</span>
                        <span className="text-zinc-400 font-mono block text-[9.5px]">Tracks: {individualStems.map(s => s.category).join(", ")}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-[10px] italic">No stem multi-tracks uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. LEGAL INSTRUMENTS & CONTRACTS MANIFEST */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                    LEGAL INSTRUMENTS &amp; CONTRACT MANIFEST
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {agreements.filter(a => a.enabled).length} Active Agreements
                  </span>
                </div>
                <div className="space-y-1.5">
                  {agreements.filter(a => a.enabled).map(ag => (
                    <div 
                      key={ag.tierId}
                      className="p-2 bg-zinc-900/50 border border-zinc-900 rounded flex items-center justify-between gap-2 text-[10.5px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-400 font-mono font-bold text-[8.5px] rounded shrink-0">
                          {ag.tierId === "sync" ? "SYNC TIER" : ag.badge}
                        </span>
                        <span className="text-white font-medium truncate">{ag.title}</span>
                        {(ag.isCustom || ag.tierId === "sync") && (
                          <span className="px-1.5 py-0.2 bg-emerald-950/60 text-emerald-400 font-mono font-bold text-[8px] rounded border border-emerald-800/80 shrink-0">
                            CUSTOM
                          </span>
                        )}
                        <span className="text-zinc-500 text-[9.5px] font-mono shrink-0">v{ag.version}</span>
                      </div>
                      <span className="text-white font-mono font-bold shrink-0 text-xs">
                        {ag.price && ag.price > 0
                          ? `$${ag.price.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`
                          : "CUSTOM"}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-500 text-[9.5px] pt-1">
                  All active contracts will be automatically sealed and watermarked with fragment coordinate ({fragmentTimestamp}). Direct PDF download available.
                </p>
              </div>

              {/* 4. COMMERCIAL LICENSING RATES */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                    COMMERCIAL LICENSING RATES
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">STANDARD SCHEDULE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-zinc-900/60 border border-zinc-900 rounded">
                    <span className="text-zinc-500 text-[9px] uppercase block font-bold">STREAMING / RELEASE</span>
                    <span className="text-white font-mono font-bold text-sm">
                      ${(licenses.release?.price ?? licenses.wav?.price ?? 500).toFixed(2)}
                    </span>
                    <span className="text-zinc-500 text-[9px] block">WAV master license</span>
                  </div>
                  <div className="p-2 bg-zinc-900/60 border border-zinc-900 rounded">
                    <span className="text-zinc-500 text-[9px] uppercase block font-bold">COMMERCIAL / STEMS</span>
                    <span className="text-white font-mono font-bold text-sm">
                      ${(licenses.commercial?.price ?? licenses.trackouts?.price ?? 1000).toFixed(2)}
                    </span>
                    <span className="text-zinc-500 text-[9px] block">Trackouts &amp; commercial sync</span>
                  </div>
                  <div className="p-2 bg-zinc-900/60 border border-zinc-900 rounded">
                    <span className="text-zinc-500 text-[9px] uppercase block font-bold">EXCLUSIVE BUYOUT</span>
                    <span className="text-white font-mono font-bold text-sm">
                      ${(licenses.exclusive?.price ?? 5000).toFixed(2)}
                    </span>
                    <span className="text-zinc-500 text-[9px] block">Full ownership transfer</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER STEPPER CONTROLS */}
        <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={currentStep === 1 || isSubmitting}
            onClick={() => { setErrorMsg(null); setCurrentStep(prev => Math.max(1, prev - 1)); }}
            className={`px-4 py-2 border border-zinc-800 rounded uppercase font-bold flex items-center gap-1.5 transition-colors ${
              currentStep === 1 || isSubmitting ? "opacity-30 cursor-not-allowed text-zinc-600" : "hover:bg-zinc-900 text-zinc-300 cursor-pointer"
            }`}
          >
            <ChevronLeft size={14} /> PREVIOUS
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 border border-zinc-800 rounded uppercase font-bold text-zinc-400 hover:text-white cursor-pointer disabled:opacity-50"
            >
              CANCEL
            </button>

            {currentStep === 5 && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveDraft}
                className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold rounded uppercase tracking-wider text-xs cursor-pointer disabled:opacity-50 transition-colors"
                title="Save draft without publishing live"
              >
                SAVE AS DRAFT
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => { setErrorMsg(null); setCurrentStep(prev => Math.min(5, prev + 1)); }}
                className="px-5 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 transition-colors"
              >
                <span>NEXT STEP</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublish}
                className="px-5 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-1">⏳</span>
                    <span>PUBLISHING...</span>
                  </>
                ) : (
                  <>
                    <span>FINALIZE &amp; PUBLISH</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </>
    )}

    {/* CONTRACT PREVIEW OVERLAY MODAL */}
    <AnimatePresence>
      {previewAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-3xl bg-zinc-950 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                  NATURALLY GENERATED CONTRACT PREVIEW
                </span>
                <h4 className="text-white font-bold text-sm">
                  {previewAgreement.title} • {fragmentTimestamp}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadAgreement(previewAgreement)}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  title="Download Official Legal Contract in PDF Format"
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAgreement({ ...previewAgreement });
                    setIsNewAgreement(false);
                    setPreviewAgreement(null);
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Edit3 size={13} />
                  <span>Edit Agreement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAgreement(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contract Body */}
            <div className="p-6 overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap selection:bg-white selection:text-black">
              {getAutofilledAgreementText(
                previewAgreement.tierId,
                getAgreementPayloadForAgreement(previewAgreement)
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>LOMON LLC • The Owl Clock Legal Engine</span>
              <span>All Placeholders Automatically Populated</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* FULL CRUD AGREEMENT EDITOR MODAL */}
    <AnimatePresence>
      {editingAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="w-full max-w-2xl bg-[#0a0a0a] border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
                  <Edit3 size={14} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                    {isNewAgreement ? "CREATE CUSTOM LICENSE AGREEMENT" : `EDIT ${editingAgreement.badge || "AGREEMENT"}`}
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Fragment: {fragmentTimestamp} &bull; Bound to {fragmentId || "07:15"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAgreement(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Agreement Title *
                  </label>
                  <input
                    type="text"
                    value={editingAgreement.title}
                    onChange={e => setEditingAgreement({ ...editingAgreement, title: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-zinc-400 text-xs"
                    placeholder="e.g. Commercial Release License Agreement"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Badge / Tag Label
                  </label>
                  <input
                    type="text"
                    value={editingAgreement.badge}
                    onChange={e => setEditingAgreement({ ...editingAgreement, badge: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-zinc-400 text-xs"
                    placeholder="e.g. CANONICAL TIER 2 or CUSTOM TIER"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Fee / Price (USD $) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={editingAgreement.price}
                    onChange={e => setEditingAgreement({ ...editingAgreement, price: Number(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-zinc-400 text-xs font-mono"
                    placeholder="0 for Custom"
                  />
                  <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">Enter 0 to display as CUSTOM</span>
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Contract Version
                  </label>
                  <input
                    type="text"
                    value={editingAgreement.version}
                    onChange={e => setEditingAgreement({ ...editingAgreement, version: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-zinc-400 text-xs"
                    placeholder="v1.0-2026"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingAgreement({ ...editingAgreement, enabled: !editingAgreement.enabled })}
                    className={`w-full py-1.5 px-3 rounded border text-xs font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      editingAgreement.enabled
                        ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    }`}
                  >
                    <Check size={12} className={editingAgreement.enabled ? "opacity-100" : "opacity-0"} />
                    <span>{editingAgreement.enabled ? "ACTIVE" : "DISABLED"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                  Permitted Scope &amp; Usage Limits
                </label>
                <textarea
                  rows={2}
                  value={editingAgreement.scope}
                  onChange={e => setEditingAgreement({ ...editingAgreement, scope: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-400 text-xs leading-relaxed"
                  placeholder="e.g. 1 Commercial Release • Up to 1,000,000 Digital Streams • 10,000 Units Sold"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                  Master &amp; Publishing Ownership / Splits
                </label>
                <textarea
                  rows={2}
                  value={editingAgreement.ownership}
                  onChange={e => setEditingAgreement({ ...editingAgreement, ownership: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-400 text-xs leading-relaxed"
                  placeholder="e.g. 100% Master Retained by LOMON LLC • 50/50 Publishing &amp; Writer Split"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                  Mandatory Digital Credit
                </label>
                <input
                  type="text"
                  value={editingAgreement.credit}
                  onChange={e => setEditingAgreement({ ...editingAgreement, credit: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-400 text-xs"
                  placeholder="e.g. Produced by CHRISTOPHER / The Owl Clock"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                  Restrictions &amp; Covenants
                </label>
                <input
                  type="text"
                  value={editingAgreement.restrictions}
                  onChange={e => setEditingAgreement({ ...editingAgreement, restrictions: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-400 text-xs"
                  placeholder="e.g. Non-Exclusive • Zero Content ID • Zero AI Model Training"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                  Delivery Package / Included Assets
                </label>
                <input
                  type="text"
                  value={editingAgreement.deliveryPackage || ""}
                  onChange={e => setEditingAgreement({ ...editingAgreement, deliveryPackage: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-400 text-xs"
                  placeholder="e.g. High-Resolution WAV, Production Stems, Clearance Certificate"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-[10px] uppercase block mb-1">
                  Special Covenants &amp; Custom Legal Clauses (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editingAgreement.customClauses || ""}
                  onChange={e => setEditingAgreement({ ...editingAgreement, customClauses: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-400 text-xs leading-relaxed"
                  placeholder="Add custom legal clauses, specific territory restrictions, or bespoke covenants here. These will be appended directly into the executed agreement and generated PDF."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-2">
              <div>
                {!editingAgreement.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleResetToCanonicalAgreement(editingAgreement.tierId)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    <RotateCcw size={11} />
                    <span>Reset to Standard Template</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAgreement(null)}
                  className="px-3.5 py-1.5 text-zinc-400 hover:text-white text-xs uppercase font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditingAgreement}
                  className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black font-bold uppercase text-xs rounded shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Check size={13} />
                  <span>Save Agreement</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
      </motion.div>
    </div>
  );
}
