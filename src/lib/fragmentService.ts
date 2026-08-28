import JSZip from "jszip";
import { Fragment, FRAGMENTS } from "../data";

export interface StemManifest {
  stemCount: number;
  fileNames: string[];
  totalSizeBytes: number;
  format: string;
  sampleRate: string;
  bitDepth: string;
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
  mp3: { enabled: boolean; price: number };
  wav: { enabled: boolean; price: number };
  trackouts: { enabled: boolean; price: number };
  unlimited: { enabled: boolean; price: number };
  exclusive: { enabled: boolean; price: number };
}

export interface AudioUploadRecord {
  fileType: "publicPreviewMp3" | "licensedMp3" | "masterWav" | "instrumental" | "taggedPreview" | "untaggedPreview" | "alternateVersion";
  fileName: string;
  fileSize: number;
  duration?: number;
  fileUrl: string;
  uploadedAt: string;
}

export interface FullFragmentRecord {
  id: string; // fragmentId
  compositionTitle: string; // internal-only
  compositionId: string;
  fragmentTimestamp: string;
  bpm: number;
  key: string;
  duration: string;
  genre: string[];
  mood: string[];
  status: "draft" | "published" | "archived" | "scheduled";
  availability: "available" | "reserved" | "sold";
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

const DEPRECATED_DEFAULT_IDS = new Set([
  "00:50", "07:46", "02:17", "05:58", "03:33", "10:14", "11:28", "11:59", "11:28-alt"
]);

// Helper: Get all full fragments
export function getStoredFullFragments(): FullFragmentRecord[] {
  if (typeof window === "undefined") return [];

  // Seed baseline from active FRAGMENTS
  const baselineSeed: FullFragmentRecord[] = FRAGMENTS.map((f, idx) => ({
    id: f.id,
    compositionTitle: f.name === "10:00 PM" ? "Internal Composition #1000" : f.name === "9:41 PM" ? "Time Capsule #0941" : "Deviation Reel #1111",
    compositionId: `LOC-COMP-${f.id.replace(/[^a-zA-Z0-9]/g, "")}`,
    fragmentTimestamp: f.timestamp,
    bpm: f.bpm,
    key: f.tonalSignature,
    duration: f.duration,
    genre: [f.classification || "Recovery State", "Cinematic Soundscape"],
    mood: ["Atmospheric", "Reflective", "Sub-harmonic"],
    status: "published" as const,
    availability: (f.isExclusive ? "sold" : "available") as "available" | "sold",
    archiveNote: f.observation || "Primary recovered acoustic master.",
    description: f.description || "Master archive recovery.",
    releaseDate: f.fullRecoveryDate || "2026-08-08",
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
        fileUrl: f.audioUrl || f.mp3Preview || "",
        uploadedAt: new Date().toISOString()
      }
    ],
    stemManifest: {
      stemCount: 6,
      fileNames: ["01_Drums.wav", "02_SubBass.wav", "03_Atmosphere_Drone.wav", "04_Keys_Melody.wav", "05_Harmonics.wav", "06_Transitions.wav"],
      totalSizeBytes: 142606336,
      format: "WAV / Lossless",
      sampleRate: "48.0 kHz",
      bitDepth: "24-bit"
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
      mp3: { enabled: true, price: 150 },
      wav: { enabled: true, price: 350 },
      trackouts: { enabled: true, price: 650 },
      unlimited: { enabled: true, price: 1200 },
      exclusive: { enabled: !f.isExclusive, price: 4500 }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: FullFragmentRecord[] = JSON.parse(raw);
      // Filter out removed/deprecated fragments from previous session
      const validStored = parsed.filter(item => !DEPRECATED_DEFAULT_IDS.has(item.id));

      if (validStored.length > 0) {
        // Ensure baseline seed fragments (09:41, 10:00, 11:11) exist if missing
        const existingIds = new Set(validStored.map(i => i.id));
        const merged = [...validStored];
        for (const base of baselineSeed) {
          if (!existingIds.has(base.id)) {
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

export function getAllActiveFragments(): Fragment[] {
  if (typeof window === "undefined") return FRAGMENTS;
  try {
    const stored = getStoredFullFragments();
    const published = stored.filter(f => f.status === "published" && !f.deletedAt);
    if (published.length > 0) {
      return published.map(sanitizeToPublicCatalog);
    }
  } catch (e) {
    console.warn("Error resolving active fragments:", e);
  }
  return FRAGMENTS;
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
  
  // 1. Try standard colon format e.g. "07:15 AM", "9:41 PM", "10:00", "07:15"
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
    // 2. Try 4-digit or 3-digit format e.g. "0715", "0941", "1000", "LOC-0715"
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

  // Determine AM/PM if not explicitly given
  let ampm: "AM" | "PM" = "AM";
  if (explicitAMPM) {
    ampm = explicitAMPM;
  } else if (clean.includes("PM")) {
    ampm = "PM";
  } else if (clean.includes("AM")) {
    ampm = "AM";
  } else if (rawH >= 12) {
    ampm = "PM";
  } else if (rawH >= 9 && rawH <= 11) {
    // Canonical 9:41, 10:00, 11:11 PM defaults
    ampm = "PM";
  } else {
    ampm = "AM";
  }

  const displayH = rawH % 12; // 0..11 where 0 is 12 o'clock

  let h24 = displayH;
  if (ampm === "PM") {
    h24 = (displayH === 0 ? 12 : displayH + 12);
  } else {
    h24 = (displayH === 0 ? 0 : displayH);
  }
  const totalMinutes = h24 * 60 + rawM;

  const displayH12 = displayH === 0 ? 12 : displayH;
  const formatted = `${String(displayH12).padStart(2, "0")}:${String(rawM).padStart(2, "0")} ${ampm}`;

  return {
    hour: displayH,
    minute: rawM,
    ampm,
    totalMinutes,
    formatted
  };
}

// Backend API CRUD sync helpers
export async function syncFragmentToBackend(record: FullFragmentRecord): Promise<boolean> {
  try {
    const res = await fetch("/api/fragments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
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
  const publicAudio = record.audioFiles.find(a => a.fileType === "publicPreviewMp3")?.fileUrl 
    || record.audioFiles.find(a => a.fileType === "untaggedPreview")?.fileUrl
    || record.audioFiles.find(a => a.fileType === "licensedMp3")?.fileUrl
    || record.audioFiles.find(a => a.fileType === "taggedPreview")?.fileUrl
    || record.audioFiles.find(a => a.fileType === "masterWav")?.fileUrl 
    || record.audioFiles.find(a => a.fileType === "instrumental")?.fileUrl
    || record.audioFiles.find(a => a.fileType === "alternateVersion")?.fileUrl
    || record.audioFiles[0]?.fileUrl 
    || "";

  return {
    id: record.id,
    name: record.fragmentTimestamp,
    timestamp: record.fragmentTimestamp,
    bpm: record.bpm,
    tonalSignature: record.key,
    duration: record.duration,
    recoveryState: record.availability === "sold" ? "Exclusively Acquired" : "Fully Recovered",
    archivist: "LOMON ARCHIVE",
    classification: record.genre?.[0] || "Acoustic / Ambient Master",
    synthType: "keys",
    frequency: 440,
    fullRecoveryDate: record.releaseDate || new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }),
    description: record.description || "Master acoustic archive recovery.",
    observation: record.archiveNote || "Acoustic master recovery.",
    audioUrl: publicAudio,
    previewAudioUrl: publicAudio,
    mp3Preview: publicAudio,
    isExclusive: record.availability === "sold" || !record.licenses.exclusive.enabled,
    timeCapsule: {
      entryNo: `TC-${record.id.replace(/[^a-zA-Z0-9]/g, "")}`,
      catalogNo: record.compositionId || `LOC-${record.id.replace(/[^a-zA-Z0-9]/g, "")}`,
      title: record.fragmentTimestamp,
      timeOfMark: record.fragmentTimestamp,
      recoveryStamp: record.releaseDate || "OCTOBER 14, 2024",
      completionStamp: new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }),
      tonalAxis: record.key,
      tempoPulse: `${record.bpm} BPM`,
      runtime: record.duration,
      masterControl: record.availability === "sold" ? "Exclusive Assignee" : "100% LOMON LLC",
      publishingControl: "100% LOMON Publishing (BMI)",
      origin: "Primary Field Master / LOMON Sonic Vault",
      thirdPartyAssets: "None (Zero Encumbrances)",
      clearanceStatus: record.availability === "sold" ? "EXCLUSIVELY ACQUIRED" : "AVAILABLE",
      deliverableAssets: [
        "Lossless 24-bit 48kHz Master WAV",
        "Multi-Track Stems Archive (Dry & Wet)",
        "Sync Master Certificate (Cryptographically Signed)",
        "Complete Publishing & Writer Cue Sheets"
      ],
      recoveryStatus: "Fully Restored",
      archivist: "LOMON ARCHIVE"
    }
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
 * Upload Audio / Video or Raw Document file via Cloudinary signed upload
 */
export async function uploadToCloudinarySigned(
  file: File,
  folder: string,
  resourceType: "video" | "raw" | "image" | "auto" = "video",
  onProgress?: (percent: number) => void
): Promise<{ url: string; publicId: string }> {
  // 1. Get signature from backend
  try {
    const signRes = await fetch("/api/storage/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder,
        resourceType,
        tags: "owl-clock-fragment"
      })
    });

    const signData = await signRes.json().catch(() => ({}));

    // If server keys are missing or signature generation skipped, fallback cleanly to server upload endpoint
    if (!signRes.ok || !signData.signature || signData.success === false) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("resourceType", resourceType);

      const fallbackRes = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData
      });
      const fallbackData = await fallbackRes.json().catch(() => ({}));
      if (fallbackRes.ok && fallbackData.url) {
        return { url: fallbackData.url, publicId: fallbackData.public_id || `loc-${Date.now()}` };
      }
      return { url: URL.createObjectURL(file), publicId: `local-${Date.now()}` };
    }

    // 2. Upload directly to Cloudinary
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", signData.uploadUrl);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url || response.url,
              publicId: response.public_id
            });
          } catch {
            resolve({ url: URL.createObjectURL(file), publicId: `local-${Date.now()}` });
          }
        } else {
          // Fallback to local server endpoint if Cloudinary network rejects
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folder);
          formData.append("resourceType", resourceType);

          fetch("/api/upload/cloudinary", { method: "POST", body: formData })
            .then(r => r.json())
            .then(d => {
              if (d.url) resolve({ url: d.url, publicId: d.public_id || `loc-${Date.now()}` });
              else resolve({ url: URL.createObjectURL(file), publicId: `local-${Date.now()}` });
            })
            .catch(() => resolve({ url: URL.createObjectURL(file), publicId: `local-${Date.now()}` }));
        }
      };

      xhr.onerror = () => {
        // Fallback on network failure
        resolve({ url: URL.createObjectURL(file), publicId: `local-${Date.now()}` });
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.apiKey);
      formData.append("timestamp", String(signData.timestamp));
      formData.append("signature", signData.signature);
      formData.append("folder", signData.folder);
      formData.append("tags", signData.tags);

      xhr.send(formData);
    });
  } catch (_e) {
    return { url: URL.createObjectURL(file), publicId: `local-${Date.now()}` };
  }
}

/**
 * Upload Stem ZIP archive directly to UploadThing with server authorization
 */
export async function uploadStemZipToUploadThing(
  file: File,
  fragmentId: string,
  onProgress?: (percent: number) => void
): Promise<{ fileUrl: string; fileKey: string; sizeBytes: number }> {
  const cleanFragId = (fragmentId || "temp").replace(/[^a-zA-Z0-9]/g, "");

  return new Promise((resolve) => {
    try {
      if (onProgress) onProgress(45);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fragmentId", cleanFragId);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload/uploadthing");
      xhr.setRequestHeader("x-fragment-id", cleanFragId);
      xhr.timeout = 45000; // 45s safety timeout

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.min(95, Math.round(45 + (e.loaded / e.total) * 50));
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (onProgress) onProgress(100);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.url) {
              return resolve({
                fileUrl: data.url,
                fileKey: data.key || data.fileKey || `ut-${cleanFragId}-${file.name}`,
                sizeBytes: file.size
              });
            }
          } catch (_e) {}
        }
        // Graceful fallback to client Object URL if server storage returns fallback or error
        resolve({
          fileUrl: URL.createObjectURL(file),
          fileKey: `local-${cleanFragId}-${file.name}`,
          sizeBytes: file.size
        });
      };

      xhr.onerror = () => {
        if (onProgress) onProgress(100);
        resolve({
          fileUrl: URL.createObjectURL(file),
          fileKey: `local-${cleanFragId}-${file.name}`,
          sizeBytes: file.size
        });
      };

      xhr.ontimeout = () => {
        if (onProgress) onProgress(100);
        resolve({
          fileUrl: URL.createObjectURL(file),
          fileKey: `local-${cleanFragId}-${file.name}`,
          sizeBytes: file.size
        });
      };

      xhr.send(formData);
    } catch (err) {
      console.warn("UploadThing direct upload fallback:", err);
      if (onProgress) onProgress(100);
      resolve({
        fileUrl: URL.createObjectURL(file),
        fileKey: `local-${cleanFragId}-${file.name}`,
        sizeBytes: file.size
      });
    }
  });
}

/**
 * Upload Stem ZIP archive directly to Cloudflare R2 using presigned PUT URL (zero backend bottleneck)
 */
export async function uploadStemZipToR2(
  file: File,
  fragmentId: string,
  onProgress?: (percent: number) => void
): Promise<{ key: string; publicUrl?: string; sizeBytes: number }> {
  const cleanFragId = (fragmentId || "temp").replace(/[^a-zA-Z0-9]/g, "");
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `fragments/${cleanFragId}/stems/${filename}`;

  // 1. Get presigned upload URL from backend
  const presignRes = await fetch("/api/storage/r2/presign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: storageKey,
      fragmentId: cleanFragId,
      filename,
      contentType: file.type || "application/zip"
    })
  });

  const presignData = await presignRes.json();
  if (!presignRes.ok || !presignData.uploadUrl) {
    console.warn("[R2 PRESIGN] Backend R2 credentials unconfigured or failed, caching reference locally.");
    return {
      key: storageKey,
      publicUrl: URL.createObjectURL(file),
      sizeBytes: file.size
    };
  }

  // 2. Direct PUT upload to R2
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignData.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/zip");

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          key: presignData.key,
          publicUrl: presignData.publicUrl,
          sizeBytes: file.size
        });
      } else {
        reject(new Error(`R2 direct upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during direct R2 upload"));
    xhr.send(file);
  });
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
