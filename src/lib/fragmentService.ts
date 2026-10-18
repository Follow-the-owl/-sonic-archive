import JSZip from "jszip";
import { Fragment, FRAGMENTS, normalizeFragmentId, getFragmentTimeName, CANONICAL_TIME_CAPSULES, getTimeCapsuleForFragment, CANONICAL_TONAL_SIGNATURES, getTonalSignatureForFragment } from "../data";

export interface StemManifest {
  stemCount: number;
  fileNames: string[];
  totalSizeBytes: number;
  format: string;
  sampleRate: string;
  bitDepth: string;
  zipUrl?: string;
  extractedList?: { name: string; size: number; type: string }[];
}

export interface FragmentDocument {
  id: string;
  fileName: string;
  category: "PDF License" | "Split Sheet" | "Metadata" | "Contracts" | "Cue Sheets" | "Session Files" | "Other";
  fileSize: number;
  uploadedAt: string;
  fileUrl?: string;
}

export interface LicensePricingConfig {
  access: { enabled: boolean; price: number };
  release: { enabled: boolean; price: number };
  commercial: { enabled: boolean; price: number };
  exclusive: { enabled: boolean; price: number };
  collaboration?: { enabled: boolean; price: number };
  sync?: { enabled: boolean; price: number };
  mp3?: { enabled: boolean; price: number };
  wav?: { enabled: boolean; price: number };
  trackouts?: { enabled: boolean; price: number };
  unlimited?: { enabled: boolean; price: number };
}

export const DEFAULT_LICENSE_PRICING: LicensePricingConfig = {
  access: { enabled: true, price: 150 },
  release: { enabled: true, price: 500 },
  commercial: { enabled: true, price: 1000 },
  exclusive: { enabled: true, price: 5000 },
  collaboration: { enabled: true, price: 0 },
  sync: { enabled: true, price: 0 },
  mp3: { enabled: true, price: 150 },
  wav: { enabled: true, price: 500 },
  trackouts: { enabled: true, price: 1000 },
  unlimited: { enabled: true, price: 1000 }
};

export interface AudioUploadRecord {
  fileType: "publicPreviewMp3" | "licensedMp3" | "masterWav" | "instrumental" | "taggedPreview" | "untaggedPreview" | "alternateVersion" | "stemZip";
  fileName: string;
  fileSize: number;
  duration?: number;
  fileUrl: string;
  uploadedAt: string;
}

export interface FullFragmentRecord {
  id: string; // fragmentId
  name?: string;
  timestamp?: string;
  compositionTitle: string; // internal-only
  compositionId: string;
  fragmentTimestamp: string;
  bpm: number;
  key: string;
  tonalSignature?: string;
  duration: string;
  genre: string[];
  mood: string[];
  status: "draft" | "published" | "archived" | "scheduled";
  availability: "available" | "reserved" | "sold";
  isSold?: boolean;
  isExclusive?: boolean;
  exclusiveAcquired?: boolean;
  exclusiveBuyer?: string;
  soldAt?: string;
  recoveryState?: string;
  archiveNote?: string;
  description?: string; // internal-only
  releaseDate?: string;
  publishAt?: string;
  syncStatus?: "synced" | "pending" | "failed";
  audioFiles: AudioUploadRecord[];
  stemManifest?: StemManifest;
  individualStems?: { type: string; fileName: string; fileUrl: string; size: number }[];
  documents: FragmentDocument[];
  licenses: LicensePricingConfig;
  customAgreements?: any[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

const STORAGE_KEY = "lomon_full_fragments_v1";

// In-memory runtime cache to preserve full audio & stem objects in current session
const inMemoryFragmentsCache = new Map<string, FullFragmentRecord>();

function sanitizeForLocalStorage(list: FullFragmentRecord[]): FullFragmentRecord[] {
  return list.map(item => {
    // Keep in-memory cache updated with full resolution
    inMemoryFragmentsCache.set(item.id, item);

    return {
      ...item,
      audioFiles: (item.audioFiles || []).map(a => ({
        ...a,
        // If fileUrl is a large base64 data URL, strip the bulk in localStorage copy
        fileUrl: a.fileUrl && a.fileUrl.startsWith("data:") && a.fileUrl.length > 500
          ? `[IN_MEMORY_AUDIO_${a.fileName || a.fileType}]`
          : a.fileUrl
      })),
      individualStems: (item.individualStems || []).map(s => ({
        ...s,
        fileUrl: s.fileUrl && s.fileUrl.startsWith("data:") && s.fileUrl.length > 500
          ? `[IN_MEMORY_STEM_${s.fileName || s.type}]`
          : s.fileUrl
      }))
    };
  });
}

export const ALLOWED_DEFAULT_IDS = new Set([
  "10:00", "11:11", "01:16", "03:21", "09:41", "3:21", "9:41", "1:16"
]);

const DEPRECATED_DEFAULT_IDS = new Set([
  "00:50", "07:46", "02:17", "05:58", "03:33", "10:14", "11:28", "11:59", "11:28-alt", "07:15", "0715",
  "07:19", "7:19", "0719", "719", "7:19 PM", "07:19 PM", "7:19 AM", "07:19 AM",
  "09:19", "9:19", "0919", "919", "9:19 AM", "09:19 AM", "9:19 PM", "09:19 PM"
]);

// Helper: Get all full fragments
export function getStoredFullFragments(): FullFragmentRecord[] {
  if (typeof window === "undefined") return [];

  // Seed baseline from active FRAGMENTS
  const baselineSeed: FullFragmentRecord[] = FRAGMENTS.map((f, idx) => {
    const normId = normalizeFragmentId(f.id);
    const tc = CANONICAL_TIME_CAPSULES[normId] || f.timeCapsule || getTimeCapsuleForFragment(f);
    const keySig = CANONICAL_TONAL_SIGNATURES[normId] || f.tonalSignature || "Eb Major";
    return {
      id: f.id,
      name: tc.title,
      timestamp: tc.timeOfMark,
      compositionTitle: tc.title,
      compositionId: tc.catalogNo,
      fragmentTimestamp: tc.timeOfMark,
      bpm: f.bpm,
      key: keySig,
      tonalSignature: keySig,
      duration: tc.runtime || f.duration,
      genre: [f.classification || "Recovery State", "Cinematic Soundscape"],
      mood: ["Atmospheric", "Reflective", "Sub-harmonic"],
      status: "published" as const,
      availability: (f.isExclusive ? "sold" : "available") as "available" | "sold",
      archiveNote: f.observation || "Primary recovered acoustic master.",
      description: f.description || "Master archive recovery.",
      releaseDate: tc.recoveryStamp,
      syncStatus: "synced" as const,
    audioFiles: [
      {
        fileType: "publicPreviewMp3" as const,
        fileName: `${f.name.replace(/\s+/g, "_")}_Preview.mp3`,
        fileSize: 3145728,
        duration: 194,
        fileUrl: f.mp3Preview || f.previewAudioUrl || f.audioUrl || "",
        uploadedAt: new Date().toISOString()
      },
      {
        fileType: "masterWav" as const,
        fileName: `${f.name.replace(/\s+/g, "_")}_Master_24bit.wav`,
        fileSize: 35651584,
        duration: 194,
        fileUrl: f.wavMaster || f.wavUrl || f.audioUrl || f.mp3Preview || "",
        uploadedAt: new Date().toISOString()
      },
      ...(f.stemsZip || (f as any).zipUrl ? [{
        fileType: "stemZip" as const,
        fileName: `${f.name.replace(/\s+/g, "_")}_Stems_Archive.zip`,
        fileSize: 150000000,
        duration: 194,
        fileUrl: f.stemsZip || (f as any).zipUrl || "",
        uploadedAt: new Date().toISOString()
      }] : [])
    ],
    stemManifest: {
      stemCount: 6,
      fileNames: ["01_Drums.wav", "02_SubBass.wav", "03_Atmosphere_Drone.wav", "04_Keys_Melody.wav", "05_Harmonics.wav", "06_Transitions.wav"],
      totalSizeBytes: 142606336,
      format: "WAV / Lossless",
      sampleRate: "48.0 kHz",
      bitDepth: "24-bit",
      zipUrl: f.stemsZip || (f as any).zipUrl || ""
    },
    documents: [
      {
        id: `doc-${idx}-1`,
        fileName: "Master_Sync_Clearance_Schedule.pdf",
        category: "PDF License" as const,
        fileSize: 412000,
        uploadedAt: "2026-08-20"
      },
      {
        id: `doc-${idx}-2`,
        fileName: "Publishing_BMI_Split_Sheet.pdf",
        category: "Split Sheet" as const,
        fileSize: 224000,
        uploadedAt: "2026-08-20"
      }
    ],
    licenses: {
      access: { enabled: true, price: 150 },
      release: { enabled: true, price: 500 },
      commercial: { enabled: true, price: 1000 },
      exclusive: { enabled: !f.isExclusive, price: 5000 },
      collaboration: { enabled: true, price: 0 },
      sync: { enabled: true, price: 0 },
      mp3: { enabled: true, price: 150 },
      wav: { enabled: true, price: 500 },
      trackouts: { enabled: true, price: 1000 },
      unlimited: { enabled: true, price: 1000 }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: FullFragmentRecord[] = JSON.parse(raw);
      // Filter out any beat not in the authorized 5 beats
      const validStored = parsed
        .filter(item => {
          if (DEPRECATED_DEFAULT_IDS.has(item.id)) return false;
          const time = String(item.fragmentTimestamp || item.timestamp || item.name || "");
          const normTime = getFragmentTimeName(time || item.id);
          const normId = normalizeFragmentId(item.id || normTime);
          if (DEPRECATED_DEFAULT_IDS.has(normId) || DEPRECATED_DEFAULT_IDS.has(normTime)) return false;
          return ALLOWED_DEFAULT_IDS.has(normId) || ALLOWED_DEFAULT_IDS.has(normTime);
        })
        .map(item => {
          const normTime = getFragmentTimeName(item.fragmentTimestamp || item.timestamp || item.name || item.id);
          const normId = normalizeFragmentId(item.id || normTime);
          return {
            ...item,
            id: normId,
            name: normTime,
            timestamp: normTime,
            fragmentTimestamp: normTime,
            compositionTitle: item.compositionTitle && !item.compositionTitle.startsWith("Internal Master") && item.compositionTitle !== "719" && !item.compositionTitle.match(/^LOC-COMP/)
              ? getFragmentTimeName(item.compositionTitle)
              : normTime
          };
        });

      if (validStored.length > 0) {
        // Ensure baseline seed fragments (03:21, 09:41, 10:00, 01:16, 11:11) exist and have latest links
        const existingIds = new Set(validStored.map(i => normalizeFragmentId(i.id)));
        const baseMap = new Map(baselineSeed.map(b => [normalizeFragmentId(b.id), b]));
        const merged: FullFragmentRecord[] = validStored.map(item => {
          const normId = normalizeFragmentId(item.id);
          const tc = CANONICAL_TIME_CAPSULES[normId] || CANONICAL_TIME_CAPSULES["10:00"];
          const base = baseMap.get(normId);
          const keySig = CANONICAL_TONAL_SIGNATURES[normId] || item.tonalSignature || item.key || base?.tonalSignature || "Eb Major";
          return {
            ...item,
            id: normId,
            name: tc.title,
            timestamp: tc.timeOfMark,
            fragmentTimestamp: tc.timeOfMark,
            compositionTitle: tc.title,
            compositionId: tc.catalogNo,
            releaseDate: tc.recoveryStamp,
            bpm: base?.bpm ?? item.bpm,
            key: keySig,
            tonalSignature: keySig,
            duration: tc.runtime || item.duration,
            archiveNote: base?.archiveNote || item.archiveNote,
            description: base?.description || item.description,
            audioFiles: base?.audioFiles || item.audioFiles,
            stemManifest: base?.stemManifest || item.stemManifest,
          };
        });
        for (const base of baselineSeed) {
          if (!existingIds.has(normalizeFragmentId(base.id))) {
            merged.push(base);
          }
        }

        const hydrated = merged.map(item => {
          const mem = inMemoryFragmentsCache.get(item.id);
          if (mem) {
            return {
              ...item,
              audioFiles: item.audioFiles.map((af, i) => {
                const memAf = mem.audioFiles?.[i];
                return memAf && (!af.fileUrl || af.fileUrl.startsWith("[IN_MEMORY"))
                  ? memAf
                  : af;
              }),
              individualStems: (item.individualStems || []).map((st, i) => {
                const memSt = mem.individualStems?.[i];
                return memSt && (!st.fileUrl || st.fileUrl.startsWith("[IN_MEMORY"))
                  ? memSt
                  : st;
              })
            };
          }
          return item;
        });

        // Save sanitized state back
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeForLocalStorage(hydrated)));
        } catch (_e) {}

        return hydrated;
      }
    }
  } catch (e) {
    console.warn("Error reading full fragments from localStorage", e);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeForLocalStorage(baselineSeed)));
  } catch (_e) {}
  return baselineSeed;
}

export function saveStoredFullFragments(list: FullFragmentRecord[]) {
  if (typeof window === "undefined") return;
  // Filter out any deprecated ids just in case
  const filtered = list.filter(item => !DEPRECATED_DEFAULT_IDS.has(item.id));

  // Always update in-memory cache first
  filtered.forEach(item => inMemoryFragmentsCache.set(item.id, item));

  try {
    const sanitized = sanitizeForLocalStorage(filtered);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.warn("Notice: LocalStorage quota reached. Fragments retained safely in runtime memory.");
  }

  // Dispatch global sync event so Owl Clock and other components instantly refresh
  try {
    window.dispatchEvent(new CustomEvent("fragments-updated", { detail: filtered }));
  } catch (_e) {}
}

export function isFragmentExclusivelyAcquired(fragOrId: any): boolean {
  if (!fragOrId) return false;
  if (typeof window === "undefined") return false;
  try {
    const rawId = typeof fragOrId === "string" ? fragOrId : (fragOrId.id || fragOrId.fragmentId || fragOrId.timestamp || fragOrId.name || "");
    const cleanId = String(rawId).trim().toLowerCase();
    const cleanClean = cleanId.replace(/[^a-z0-9]/g, "");

    const soldRaw = localStorage.getItem("lomon_exclusive_sold_fragments");
    const soldList: string[] = soldRaw ? JSON.parse(soldRaw) : [];
    if (soldList.some(s => {
      const c = String(s).trim().toLowerCase();
      return c === cleanId || c.replace(/[^a-z0-9]/g, "") === cleanClean;
    })) {
      return true;
    }

    if (typeof fragOrId === "object") {
      if (fragOrId.availability === "sold" || fragOrId.isSold || fragOrId.exclusiveAcquired) return true;
      if (fragOrId.recoveryState === "Exclusively Acquired" || (typeof fragOrId.recoveryState === "string" && fragOrId.recoveryState.toLowerCase().includes("exclusive"))) return true;
      if (fragOrId.timeCapsule?.clearanceStatus === "EXCLUSIVELY ACQUIRED") return true;
    }
  } catch (_e) {}
  return false;
}

export function markFragmentExclusivelyAcquired(fragmentIdOrName: string): void {
  if (!fragmentIdOrName || typeof window === "undefined") return;
  try {
    const clean = String(fragmentIdOrName).trim();
    const soldRaw = localStorage.getItem("lomon_exclusive_sold_fragments");
    const soldList: string[] = soldRaw ? JSON.parse(soldRaw) : [];
    if (!soldList.includes(clean)) {
      soldList.push(clean);
      localStorage.setItem("lomon_exclusive_sold_fragments", JSON.stringify(soldList));
    }

    // Also update full fragments storage if available
    const records = getStoredFullFragments();
    const updated = records.map(r => {
      const match = r.id === clean || r.fragmentTimestamp === clean || r.compositionTitle === clean || r.compositionId === clean;
      if (match) {
        return {
          ...r,
          availability: "sold" as const,
          isExclusive: true,
          recoveryState: "Exclusively Acquired",
          licenses: {
            ...r.licenses,
            access: { ...r.licenses.access, enabled: false },
            release: { ...r.licenses.release, enabled: false },
            commercial: { ...r.licenses.commercial, enabled: false },
            exclusive: { ...r.licenses.exclusive, enabled: false }
          }
        };
      }
      return r;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeForLocalStorage(updated)));
    
    // Dispatch events
    window.dispatchEvent(new CustomEvent("lomon_exclusive_purchased", { detail: { fragmentId: clean } }));
    window.dispatchEvent(new CustomEvent("lomon_fragment_sold", { detail: { fragmentId: clean } }));
    window.dispatchEvent(new CustomEvent("fragments-updated"));
  } catch (err) {
    console.warn("Could not mark fragment exclusively acquired:", err);
  }
}

export function getAllActiveFragments(): Fragment[] {
  if (typeof window === "undefined") return FRAGMENTS;
  try {
    const stored = getStoredFullFragments();
    const published = stored.filter(f => (!f.status || f.status === "published") && !f.deletedAt);
    if (published.length > 0) {
      return published.map(sanitizeToPublicCatalog);
    }
  } catch (e) {
    console.warn("Error resolving active fragments:", e);
  }
  // Even if using baseline FRAGMENTS, check if any have been exclusively acquired
  return FRAGMENTS.map(f => {
    const isSold = isFragmentExclusivelyAcquired(f.id) || isFragmentExclusivelyAcquired(f.timestamp) || isFragmentExclusivelyAcquired(f.name);
    if (isSold) {
      return {
        ...f,
        isExclusive: true,
        recoveryState: "Exclusively Acquired",
        licenseOverrides: {
          access: { enabled: false, priceOverride: 150 },
          release: { enabled: false, priceOverride: 500 },
          commercial: { enabled: false, priceOverride: 1000 },
          exclusive: { enabled: false, priceOverride: 5000 }
        }
      };
    }
    return f;
  });
}

export interface ParsedTimeDetails {
  hour: number;
  minute: number;
  ampm: "AM" | "PM";
  totalMinutes: number;
  formatted: string;
}

export function parseFragmentTimeDetails(timestampStr: string): ParsedTimeDetails {
  if (!timestampStr) {
    return { hour: 10, minute: 0, ampm: "PM", totalMinutes: 1320, formatted: "10:00 PM" };
  }

  const clean = String(timestampStr).trim().toUpperCase();
  
  // 1. Try standard colon format e.g. "11:11 PM", "9:41 PM", "10:00", "01:16 AM", "3:21 PM"
  const colonMatch = clean.match(/(0?[0-9]|1[0-9]|2[0-3]):([0-5]\d)\s*(AM|PM)?/i);
  
  let rawH = 10;
  let rawM = 0;
  let explicitAMPM: "AM" | "PM" | null = null;

  if (colonMatch) {
    rawH = parseInt(colonMatch[1], 10);
    rawM = parseInt(colonMatch[2], 10);
    if (colonMatch[3]) {
      explicitAMPM = colonMatch[3].toUpperCase() === "PM" ? "PM" : "AM";
    }
  } else {
    // 2. Try 4-digit or 3-digit format e.g. "1111", "0941", "1000", "0116", "0321"
    const digitMatch = clean.match(/(?:LOC-?|COMP-?|TC-?)?(\d{1,2})(\d{2})\s*(AM|PM)?/i);
    if (digitMatch) {
      rawH = parseInt(digitMatch[1], 10);
      rawM = parseInt(digitMatch[2], 10);
      if (digitMatch[3]) {
        explicitAMPM = digitMatch[3].toUpperCase() === "PM" ? "PM" : "AM";
      }
    }
  }

  if (isNaN(rawH)) rawH = 10;
  if (isNaN(rawM)) rawM = 0;

  // Enforce strict 12-hour clock bounds: 1 through 12
  let hour12: number;
  let ampm: "AM" | "PM" = "AM";

  if (explicitAMPM) {
    ampm = explicitAMPM;
    if (rawH === 0) {
      hour12 = 12;
    } else if (rawH > 12) {
      hour12 = rawH % 12 === 0 ? 12 : rawH % 12;
    } else {
      hour12 = rawH;
    }
  } else if (clean.includes("PM")) {
    ampm = "PM";
    if (rawH === 0) hour12 = 12;
    else if (rawH > 12) hour12 = rawH % 12 === 0 ? 12 : rawH % 12;
    else hour12 = rawH;
  } else if (clean.includes("AM")) {
    ampm = "AM";
    if (rawH === 0) hour12 = 12;
    else if (rawH > 12) hour12 = rawH % 12 === 0 ? 12 : rawH % 12;
    else hour12 = rawH;
  } else if (rawH === 0) {
    // 00:xx in 12-hour clock is 12:xx AM
    hour12 = 12;
    ampm = "AM";
  } else if (rawH === 12) {
    // 12:xx without modifier defaults to noon PM
    hour12 = 12;
    ampm = "PM";
  } else if (rawH > 12) {
    // 13..23 converted to 12-hour PM
    hour12 = rawH % 12 === 0 ? 12 : rawH % 12;
    ampm = "PM";
  } else if ((rawH >= 7 && rawH <= 11) || rawH === 3) {
    // Canonical 7:19, 9:41, 10:00, 11:11, 3:21 defaults to PM
    hour12 = rawH;
    ampm = "PM";
  } else {
    hour12 = rawH;
    ampm = "AM";
  }

  // Calculate 24-hour totalMinutes for chronological sorting
  let totalHours24 = hour12 % 12; // 12 becomes 0, 1..11 remain 1..11
  if (ampm === "PM") {
    totalHours24 += 12;
  }
  const totalMinutes = totalHours24 * 60 + rawM;

  const formatted = `${String(hour12).padStart(2, "0")}:${String(rawM).padStart(2, "0")} ${ampm}`;

  return {
    hour: hour12,
    minute: rawM,
    ampm,
    totalMinutes,
    formatted
  };
}

// Backend API CRUD sync helpers
export async function syncFragmentToBackend(record: FullFragmentRecord): Promise<boolean> {
  try {
    const cleanTime = getFragmentTimeName(record.fragmentTimestamp || record.id);
    const cleanId = normalizeFragmentId(record.id || cleanTime);
    const normalizedRecord: FullFragmentRecord = {
      ...record,
      id: cleanId,
      fragmentTimestamp: cleanTime,
      compositionTitle: record.compositionTitle && !record.compositionTitle.startsWith("Internal Master") && record.compositionTitle !== "719"
        ? getFragmentTimeName(record.compositionTitle)
        : cleanTime
    };

    const res = await fetch("/api/fragments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedRecord)
    });
    return res.ok;
  } catch (e) {
    console.warn("Backend /api/fragments sync skipped/failed:", e);
    return false;
  }
}

export async function deleteFragmentFromBackend(id: string, permanent: boolean = false): Promise<boolean> {
  try {
    const res = await fetch(`/api/fragments/${encodeURIComponent(id)}${permanent ? "?permanent=true" : ""}`, {
      method: "DELETE"
    });
    return res.ok;
  } catch (e) {
    console.warn(`Backend DELETE /api/fragments/${id} failed:`, e);
    return false;
  }
}

export async function patchFragmentStatusOnBackend(id: string, status: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/fragments/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    return res.ok;
  } catch (e) {
    console.warn(`Backend PATCH /api/fragments/${id}/status failed:`, e);
    return false;
  }
}

// Convert FullFragmentRecord to public clock catalog Fragment (strips internal fields)
export function sanitizeToPublicCatalog(record: FullFragmentRecord): Fragment {
  const publicAudio = record.audioFiles?.find(a => a.fileType === "publicPreviewMp3")?.fileUrl 
    || record.audioFiles?.find(a => a.fileType === "untaggedPreview")?.fileUrl
    || record.audioFiles?.find(a => a.fileType === "licensedMp3")?.fileUrl
    || record.audioFiles?.find(a => a.fileType === "taggedPreview")?.fileUrl
    || record.audioFiles?.find(a => a.fileType === "masterWav")?.fileUrl 
    || record.audioFiles?.find(a => a.fileType === "instrumental")?.fileUrl
    || record.audioFiles?.find(a => a.fileType === "alternateVersion")?.fileUrl
    || (record as any).audioUrl
    || (record as any).previewAudioUrl
    || (record as any).mp3Preview
    || (Array.isArray(record.audioFiles) && record.audioFiles[0]?.fileUrl)
    || "";

  const cleanTimestamp = getFragmentTimeName(record.fragmentTimestamp || record.id);
  const cleanId = normalizeFragmentId(record.id || cleanTimestamp);
  const isSold = record.availability === "sold" || isFragmentExclusivelyAcquired(cleanId) || isFragmentExclusivelyAcquired(cleanTimestamp);
  const keySig = CANONICAL_TONAL_SIGNATURES[cleanId] || record.tonalSignature || record.key || "Eb Major";

  return {
    id: cleanId,
    name: cleanTimestamp,
    timestamp: cleanTimestamp,
    bpm: record.bpm,
    tonalSignature: keySig,
    key: keySig,
    duration: record.duration,
    recoveryState: isSold ? "Exclusively Acquired" : "Fully Recovered",
    archivist: "LOMON",
    classification: record.genre?.[0] || "Acoustic / Ambient Master",
    synthType: "keys",
    frequency: 440,
    fullRecoveryDate: record.releaseDate || new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }),
    description: record.description || "Master acoustic archive recovery.",
    observation: record.archiveNote || "Acoustic master recovery.",
    audioUrl: publicAudio,
    previewAudioUrl: publicAudio,
    mp3Preview: publicAudio,
    isExclusive: isSold,
    licenseOverrides: {
      access: {
        enabled: !isSold && (record.licenses?.access?.enabled ?? record.licenses?.mp3?.enabled ?? true),
        priceOverride: record.licenses?.access?.price ?? record.licenses?.mp3?.price ?? 150
      },
      release: {
        enabled: !isSold && (record.licenses?.release?.enabled ?? record.licenses?.wav?.enabled ?? true),
        priceOverride: record.licenses?.release?.price ?? record.licenses?.wav?.price ?? 500
      },
      commercial: {
        enabled: !isSold && (record.licenses?.commercial?.enabled ?? record.licenses?.trackouts?.enabled ?? true),
        priceOverride: record.licenses?.commercial?.price ?? record.licenses?.trackouts?.price ?? 1000
      },
      exclusive: {
        enabled: !isSold && (record.licenses?.exclusive ? record.licenses.exclusive.enabled : true),
        priceOverride: record.licenses?.exclusive?.price ?? 5000
      }
    },
    timeCapsule: CANONICAL_TIME_CAPSULES[cleanId] || CANONICAL_TIME_CAPSULES[normalizeFragmentId(cleanId)] || CANONICAL_TIME_CAPSULES["10:00"]
  };
}

// Client-Side Simulated ZIP parser & validator
export async function parseStemZipFile(file: File): Promise<StemManifest> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const fileNames: string[] = [];
  const extractedList: { name: string; size: number; type: string }[] = [];
  let totalSizeBytes = 0;
  
  const validExtensions = [".wav", ".aiff", ".mp3", ".flac", ".m4a"];
  const invalidFiles: string[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && !relativePath.startsWith("__MACOSX") && !relativePath.endsWith(".DS_Store")) {
      const lower = relativePath.toLowerCase();
      const isValid = validExtensions.some(ext => lower.endsWith(ext));
      if (!isValid) {
        invalidFiles.push(relativePath);
      } else {
        const pureName = relativePath.split("/").pop() || relativePath;
        fileNames.push(pureName);
        extractedList.push({
          name: pureName,
          size: (zipEntry as any)._data?.uncompressedSize || file.size / (fileNames.length + 1),
          type: pureName.endsWith(".wav") ? "Audio / WAV" : "Audio"
        });
      }
    }
  });

  if (invalidFiles.length > 0 && fileNames.length === 0) {
    throw new Error(`Unsupported stem formats found in ZIP: ${invalidFiles.slice(0, 3).join(", ")}. Please include .wav, .aiff, or .mp3.`);
  }

  totalSizeBytes = extractedList.reduce((acc, curr) => acc + curr.size, 0) || file.size;

  return {
    stemCount: fileNames.length,
    fileNames,
    totalSizeBytes,
    format: "Lossless Broadcast WAV / AIFF",
    sampleRate: "48.0 kHz",
    bitDepth: "24-bit",
    extractedList
  };
}

/**
 * Parse XML or HTTP error from Scaleway / S3 responses to extract the exact error code
 * (e.g., AccessDenied, NoSuchKey, InvalidAccessKeyId, SignatureDoesNotMatch, etc.)
 */
export function extractS3ErrorCode(responseText: string, status: number): { code: string; message: string } {
  let code = "UnknownError";
  let message = "";

  if (responseText) {
    const codeMatch = responseText.match(/<Code>(.*?)<\/Code>/i);
    const msgMatch = responseText.match(/<Message>(.*?)<\/Message>/i);
    if (codeMatch && codeMatch[1]) {
      code = codeMatch[1].trim();
    }
    if (msgMatch && msgMatch[1]) {
      message = msgMatch[1].trim();
    }
  }

  if (status === 0) {
    code = "CORSErrorOrNetworkBlocked";
    message = "Request was blocked by browser CORS policy or network connection failed.";
  } else if (status === 403 && code === "UnknownError") {
    code = "AccessDenied";
    message = "Access Denied by Cloudflare R2 Object Storage. Verify bucket ACL, permissions, or credentials.";
  } else if (status === 404 && code === "UnknownError") {
    code = "NoSuchKey";
    message = "The specified key or bucket does not exist.";
  } else if (status === 400 && code === "UnknownError") {
    code = "BadRequest";
  }

  return { code, message };
}

/**
 * Direct Browser-to-Cloudflare R2 File Uploader (Supports single files up to 200MB)
 * 1. Requests a presigned PUT URL from /api/storage/r2/presign-upload
 * 2. Streams the 200MB file directly to Cloudflare R2 via XMLHttpRequest PUT without routing through application server
 * 3. Persists file metadata record (including direct download URL) to MongoDB
 */
export async function uploadFileToR2Direct(
  file: File,
  folder: string = "audio",
  onProgress?: (percent: number) => void
): Promise<{ url: string; directUrl: string; downloadUrl?: string; publicId: string; objectKey: string; sizeBytes: number }> {
  const MAX_200MB = 200 * 1024 * 1024;
  if (file.size > MAX_200MB) {
    throw new Error(`File '${file.name}' exceeds the 200MB single-file upload limit (${(file.size / (1024 * 1024)).toFixed(1)}MB > 200MB).`);
  }

  const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const cleanFolder = (folder || "audio").replace(/^\/+|\/+$/g, "");
  const targetObjectKey = `${cleanFolder}/${Date.now()}-${cleanFilename}`;

  if (onProgress) onProgress(10);

  // 1. Request presigned upload URL from backend
  const presignRes = await fetch("/api/storage/r2/presign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: cleanFilename,
      contentType: file.type || "application/octet-stream",
      folder: cleanFolder,
      objectKey: targetObjectKey,
      sizeBytes: file.size,
    }),
  });

  if (!presignRes.ok) {
    const errData = await presignRes.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to generate Cloudflare R2 presigned upload URL (HTTP ${presignRes.status}).`);
  }

  const presignData = await presignRes.json();
  if (!presignData.uploadUrl) {
    throw new Error("Invalid presigned upload URL response from Cloudflare R2 storage server.");
  }

  if (onProgress) onProgress(20);

  // 2. Direct PUT upload to Cloudflare R2 bucket with live progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignData.uploadUrl, true);
    if (file.type) {
      xhr.setRequestHeader("Content-Type", file.type);
    }

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.min(98, Math.round(20 + (e.loaded / e.total) * 78));
          onProgress(percent);
        }
      };
    }

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);

        const objectKey = presignData.objectKey || targetObjectKey;
        const directUrl = presignData.directUrl || presignData.publicUrl || `https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/${objectKey}`;
        const downloadUrl = presignData.downloadUrl;

        // 3. Confirm & persist record in MongoDB
        try {
          await fetch("/api/storage/r2/save-record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              objectKey,
              filename: cleanFilename,
              sizeBytes: file.size,
              contentType: file.type || "application/octet-stream",
              directUrl,
              downloadUrl,
            }),
          });
        } catch (dbErr) {
          console.warn("[MONGODB SYNC] Non-critical warning saving R2 file record:", dbErr);
        }

        console.log(`[CLOUDFLARE R2 DIRECT UPLOAD SUCCESS] Uploaded ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB) -> ${directUrl}`);

        return resolve({
          url: directUrl,
          directUrl,
          downloadUrl,
          publicId: objectKey,
          objectKey,
          sizeBytes: file.size,
        });
      }

      const { code, message } = extractS3ErrorCode(xhr.responseText, xhr.status);
      console.error(`[CLOUDFLARE R2 DIRECT UPLOAD FAILED] HTTP ${xhr.status} (${code}): ${message}`);
      reject(new Error(`Cloudflare R2 direct upload failed (${code}): ${message || xhr.statusText}`));
    };

    xhr.onerror = () => {
      const { code, message } = extractS3ErrorCode("", xhr.status || 0);
      console.error(`[CLOUDFLARE R2 NETWORK / CORS ERROR] Code: ${code} - ${message}`);
      reject(new Error(`Network or CORS error uploading directly to Cloudflare R2 bucket 'owl'. Ensure bucket CORS allows PUT from your origin.`));
    };

    xhr.send(file);
  });
}

/**
 * Upload Audio, Stems, Documents or Media files directly to Cloudflare R2
 */
export async function uploadToScaleway(
  file: File,
  folder: string = "audio",
  arg3?: ("video" | "raw" | "image" | "auto") | ((percent: number) => void),
  arg4?: (percent: number) => void
): Promise<{ url: string; publicId: string; objectKey: string }> {
  const onProgress = typeof arg3 === "function" ? arg3 : arg4;
  return uploadFileToR2Direct(file, folder, onProgress);
}

// Backward compatibility alias
export const uploadToCloudinarySigned = uploadToScaleway;

/**
 * Upload Stem ZIP archive directly to Cloudflare R2 (Supports up to 200MB archives)
 */
export async function uploadStemZipToScaleway(
  file: File,
  fragmentId: string,
  onProgress?: (percent: number) => void
): Promise<{ fileUrl: string; fileKey: string; sizeBytes: number }> {
  const cleanFragId = (fragmentId || "temp").replace(/[^a-zA-Z0-9]/g, "");
  const res = await uploadFileToR2Direct(file, `fragments/${cleanFragId}/stems`, onProgress);
  return {
    fileUrl: res.directUrl,
    fileKey: res.objectKey,
    sizeBytes: res.sizeBytes,
  };
}

export const uploadStemZipToUploadThing = uploadStemZipToScaleway;

/**
 * Upload Stem ZIP archive directly to Cloudflare R2 using presigned PUT URL (zero backend bottleneck)
 */
export async function uploadStemZipToR2(
  file: File,
  fragmentId: string,
  onProgress?: (percent: number) => void
): Promise<{ key: string; publicUrl?: string; sizeBytes: number }> {
  const cleanFragId = (fragmentId || "temp").replace(/[^a-zA-Z0-9]/g, "");
  const res = await uploadFileToR2Direct(file, `fragments/${cleanFragId}/stems`, onProgress);
  return {
    key: res.objectKey,
    publicUrl: res.directUrl,
    sizeBytes: res.sizeBytes,
  };
}

/**
 * Get expiring presigned GET download URL for licensed stem customer acquisition
 */
export async function getLicensedStemDownloadUrl(key: string, filename?: string): Promise<string> {
  try {
    const res = await fetch("/api/storage/r2/presign-download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, filename })
    });
    const data = await res.json();
    if (res.ok && data.downloadUrl) {
      return data.downloadUrl;
    }
  } catch (err) {
    console.error("Failed to obtain R2 download URL", err);
  }
  return "";
}
