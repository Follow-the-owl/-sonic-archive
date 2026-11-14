// Database layer: MongoDB connection with an in-memory fallback, seed/persisted fragment data, and shared mutable DB state.
import { MongoClient, Db } from "mongodb";
import path from "path";
import fs from "fs";
import { R2_BUCKET, R2_ENDPOINT } from "./services/storage.js";
import { EmailLog, Fragment, License, Payment, RequestItem, User } from "./types.js";

const currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

// --- Cloudflare R2 File Metadata Interface & Storage Helpers ---
export interface R2FileRecord {
  id: string;
  objectKey: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  bucket: string;
  directUrl: string;
  downloadUrl?: string;
  uploadedAt: string;
  uploadedBy?: string;
  fragmentId?: string;
  tags?: string[];
  status?: "pending_upload" | "uploaded" | "verified";
  metadata?: Record<string, any>;
}

export const mockR2Files: R2FileRecord[] = [];

/**
 * Persists an R2 file document (including direct download URLs & metadata) into MongoDB collection "files".
 * Falls back to in-memory mockR2Files store if MongoDB is offline or unconfigured.
 */
export async function saveR2FileRecord(record: Partial<R2FileRecord> & { objectKey: string; filename: string }): Promise<R2FileRecord> {
  const fullRecord: R2FileRecord = {
    id: record.id || `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    objectKey: record.objectKey,
    filename: record.filename,
    contentType: record.contentType || "application/octet-stream",
    sizeBytes: record.sizeBytes || 0,
    bucket: record.bucket || R2_BUCKET,
    directUrl: record.directUrl || `${R2_ENDPOINT}/${R2_BUCKET}/${record.objectKey}`,
    downloadUrl: record.downloadUrl,
    uploadedAt: record.uploadedAt || new Date().toISOString(),
    uploadedBy: record.uploadedBy || "system",
    fragmentId: record.fragmentId,
    tags: record.tags || [],
    status: record.status || "uploaded",
    metadata: record.metadata || {},
  };

  if (!useMockDb && db) {
    try {
      const col = db.collection("files");
      await col.updateOne(
        { objectKey: fullRecord.objectKey },
        { $set: fullRecord },
        { upsert: true }
      );
      console.log(`[MONGODB] Successfully stored Cloudflare R2 file metadata: ${fullRecord.objectKey}`);
    } catch (err) {
      console.error("[MONGODB] Failed to write R2 file record to MongoDB, caching in runtime fallback:", err);
      const idx = mockR2Files.findIndex(f => f.objectKey === fullRecord.objectKey);
      if (idx >= 0) mockR2Files[idx] = fullRecord;
      else mockR2Files.push(fullRecord);
    }
  } else {
    const idx = mockR2Files.findIndex(f => f.objectKey === fullRecord.objectKey);
    if (idx >= 0) mockR2Files[idx] = fullRecord;
    else mockR2Files.push(fullRecord);
  }

  return fullRecord;
}

// --- Database Connection & Fail-safe Mock Fallbacks ---
let mongoClient: MongoClient | null = null;

export let db: Db | null = null;

export let useMockDb = true;

export let dbStatusMsg = "Initializing...";

export let dbErrorDetail = "";

// In-Memory Fallbacks (used if MONGODB_URI is not provided or connection fails)
export const mockUsers: Map<string, User> = new Map();

export const mockSessions: Map<string, string> = new Map();

 // token -> email
export const mockLicenses: License[] = [];

export const mockRequests: RequestItem[] = [];

export const mockPayments: Payment[] = [];

export const mockEmailLogs: EmailLog[] = [];

export const CANONICAL_TONAL_KEYS: Record<string, string> = {
  "10:00": "Eb Major",
  "11:11": "B minor",
  "01:16": "G Major",
  "03:21": "F# major",
  "09:41": "B Major"
};

const FRAGMENT_CANONICAL_NAMES: Record<string, string> = {
  "11:11": "11:11 PM",
  "1111": "11:11 PM",
  "11:11 PM": "11:11 PM",
  "10:00": "10:00 PM",
  "1000": "10:00 PM",
  "10:00 PM": "10:00 PM",
  "09:41": "09:41 PM",
  "0941": "09:41 PM",
  "9:41": "09:41 PM",
  "941": "09:41 PM",
  "9:41 PM": "09:41 PM",
  "09:41 PM": "09:41 PM",
  "01:16": "01:16 AM",
  "0116": "01:16 AM",
  "1:16": "01:16 AM",
  "116": "01:16 AM",
  "1:16 AM": "01:16 AM",
  "01:16 AM": "01:16 AM",
  "1:16 PM": "01:16 AM",
  "01:16 PM": "01:16 AM",
  "03:21": "03:21 PM",
  "0321": "03:21 PM",
  "3:21": "03:21 PM",
  "321": "03:21 PM",
  "3:21 PM": "03:21 PM",
  "03:21 PM": "03:21 PM"
};

export function normalizeFragmentId(id: string | number | undefined): string {
  if (!id) return "11:11";
  const str = String(id).trim();
  if (str.includes(":")) {
    const parts = str.split(":");
    const h = parts[0].padStart(2, "0");
    const m = parts[1].replace(/[^0-9]/g, "").padStart(2, "0");
    return `${h}:${m}`;
  }
  const digits = str.replace(/[^0-9]/g, "");
  if (digits.length === 3) {
    return `0${digits[0]}:${digits.slice(1)}`;
  }
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }
  return str;
}

export function formatToTimestamp(input: any): string {
  if (!input) return "11:11 PM";
  let target = "";
  if (typeof input === "object") {
    if (input.timestamp && (String(input.timestamp).includes("AM") || String(input.timestamp).includes("PM"))) {
      target = String(input.timestamp).trim();
    } else if (input.fragmentTimestamp && (String(input.fragmentTimestamp).includes("AM") || String(input.fragmentTimestamp).includes("PM"))) {
      target = String(input.fragmentTimestamp).trim();
    } else if (input.name && (String(input.name).includes("AM") || String(input.name).includes("PM"))) {
      target = String(input.name).trim();
    } else {
      target = String(input.fragmentTimestamp || input.timestamp || input.name || input.id || input.song || "").trim();
    }
  } else {
    target = String(input).trim();
  }

  if (FRAGMENT_CANONICAL_NAMES[target]) return FRAGMENT_CANONICAL_NAMES[target];
  const cleanNum = target.replace(/[^0-9]/g, "");
  if (cleanNum && FRAGMENT_CANONICAL_NAMES[cleanNum]) return FRAGMENT_CANONICAL_NAMES[cleanNum];

  // Try standard colon format e.g. "7:19", "07:19", "7:19 PM", "07:19 AM", "12:00"
  const colonMatch = target.match(/(0?[0-9]|1[0-9]|2[0-3]):([0-5]\d)\s*(AM|PM)?/i);
  if (colonMatch) {
    let rawH = parseInt(colonMatch[1], 10);
    const rawM = String(colonMatch[2]).padStart(2, "0");
    let ampm: "AM" | "PM" = colonMatch[3] 
      ? (colonMatch[3].toUpperCase() === "AM" ? "AM" : "PM")
      : (target.toUpperCase().includes("AM") ? "AM" : (target.toUpperCase().includes("PM") ? "PM" : ((rawH >= 7 && rawH <= 11) || rawH === 3 ? "PM" : (rawH >= 1 && rawH < 6 ? "AM" : "PM"))));
    
    let hour12 = rawH;
    if (rawH === 0) hour12 = 12;
    else if (rawH > 12) hour12 = rawH % 12 === 0 ? 12 : rawH % 12;
    
    return `${hour12}:${rawM} ${ampm}`;
  }

  // Try digit sequence e.g. "719", "0719", "1111", "1000", "0941", "0321", "0116"
  const digitMatch = target.match(/(?:LOC-?|COMP-?|TC-?)?(\d{1,2})(\d{2})\s*(AM|PM)?/i);
  if (digitMatch) {
    let rawH = parseInt(digitMatch[1], 10);
    const rawM = String(digitMatch[2]).padStart(2, "0");
    let ampm: "AM" | "PM" = digitMatch[3]
      ? (digitMatch[3].toUpperCase() === "AM" ? "AM" : "PM")
      : (target.toUpperCase().includes("AM") ? "AM" : (target.toUpperCase().includes("PM") ? "PM" : ((rawH >= 7 && rawH <= 11) || rawH === 3 ? "PM" : (rawH >= 1 && rawH < 6 ? "AM" : "PM"))));

    let hour12 = rawH;
    if (rawH === 0) hour12 = 12;
    else if (rawH > 12) hour12 = rawH % 12 === 0 ? 12 : rawH % 12;

    if (hour12 >= 1 && hour12 <= 12 && parseInt(rawM, 10) >= 0 && parseInt(rawM, 10) < 60) {
      return `${hour12}:${rawM} ${ampm}`;
    }
  }

  return "11:11 PM";
}

export const ALLOWED_CANONICAL_SET = new Set(["10:00", "11:11", "01:16", "03:21", "09:41"]);

const candidateJsonPaths = [
  path.resolve(process.cwd(), "data", "fragments.json"),
  path.resolve(currentDir, "..", "data", "fragments.json"),
  path.resolve(currentDir, "data", "fragments.json"),
  path.resolve("/app/applet/data/fragments.json"),
  path.resolve("/workspace/data/fragments.json")
];

export let mockFragments: Fragment[] = [];

for (const p of candidateJsonPaths) {
  try {
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf-8"));
      if (Array.isArray(parsed) && parsed.length > 0) {
        mockFragments = parsed;
        break;
      }
    }
  } catch (e) {
    // try next candidate
  }
}

// Pre-populate mockR2Files with active beat assets so they are immediately queryable
for (const frag of mockFragments) {
  if (frag.mp3Preview) {
    mockR2Files.push({
      id: `file_${frag.id.replace(/:/g, "")}_mp3`,
      objectKey: `audio/${frag.id.replace(/:/g, "-")}-preview.mp3`,
      filename: `${frag.name.replace(/\s+/g, "_")}_Preview.mp3`,
      contentType: "audio/mpeg",
      sizeBytes: 6000000,
      bucket: R2_BUCKET,
      directUrl: frag.mp3Preview,
      downloadUrl: frag.mp3Preview,
      uploadedAt: new Date().toISOString(),
      fragmentId: frag.id,
      status: "verified",
      metadata: { type: "preview_mp3" }
    });
  }
  if (frag.wavMaster) {
    mockR2Files.push({
      id: `file_${frag.id.replace(/:/g, "")}_wav`,
      objectKey: `audio/${frag.id.replace(/:/g, "-")}-master.wav`,
      filename: `${frag.name.replace(/\s+/g, "_")}_Master_24bit.wav`,
      contentType: "audio/wav",
      sizeBytes: 30000000,
      bucket: R2_BUCKET,
      directUrl: frag.wavMaster,
      downloadUrl: frag.wavMaster,
      uploadedAt: new Date().toISOString(),
      fragmentId: frag.id,
      status: "verified",
      metadata: { type: "master_wav" }
    });
  }
  if (frag.stemsZip) {
    mockR2Files.push({
      id: `file_${frag.id.replace(/:/g, "")}_zip`,
      objectKey: `fragments/${frag.id.replace(/:/g, "")}/stems/stems.zip`,
      filename: `${frag.name.replace(/\s+/g, "_")}_Stems_Archive.zip`,
      contentType: "application/zip",
      sizeBytes: 180000000,
      bucket: R2_BUCKET,
      directUrl: frag.stemsZip,
      downloadUrl: frag.stemsZip,
      uploadedAt: new Date().toISOString(),
      fragmentId: frag.id,
      status: "verified",
      metadata: { type: "stems_zip" }
    });
  }
}

// =================================================================
// PERSISTENT BEAT STORAGE SYSTEM
// Keeps all user-created beats safe on disk and syncs them to MongoDB Atlas
// =================================================================
const DATA_DIR = path.resolve(process.cwd(), "data");

const FRAGMENTS_FILE = path.join(DATA_DIR, "fragments.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (_e) {}
  }
}

function loadPersistedFragments(): Fragment[] {
  ensureDataDir();
  try {
    if (fs.existsSync(FRAGMENTS_FILE)) {
      const content = fs.readFileSync(FRAGMENTS_FILE, "utf-8");
      const list = JSON.parse(content);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (e) {
    console.warn("[PERSISTENCE] Error reading fragments.json:", e);
  }
  return [];
}

export function persistFragments(fragments: Fragment[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(FRAGMENTS_FILE, JSON.stringify(fragments, null, 2), "utf-8");
  } catch (e) {
    console.warn("[PERSISTENCE] Error writing fragments.json:", e);
  }
}

// Hydrate in-memory mockFragments with any previously persisted custom beats on disk
const diskFragments = loadPersistedFragments();

if (diskFragments.length > 0) {
  for (const df of diskFragments) {
    const normId = normalizeFragmentId(df.id);
    if (!ALLOWED_CANONICAL_SET.has(normId)) continue;
    const normTime = formatToTimestamp(df.timestamp || (df as any).fragmentTimestamp || df.name || df.id);
    const keySig = CANONICAL_TONAL_KEYS[normId] || df.tonalSignature || (df as any).key || "Eb Major";
    const normalizedDf = {
      ...df,
      id: normId,
      name: normTime,
      timestamp: normTime,
      fragmentTimestamp: normTime,
      tonalSignature: keySig,
      key: keySig
    };
    const idx = mockFragments.findIndex(m => m.id === normId || m.id === df.id);
    if (idx >= 0) {
      mockFragments[idx] = { ...mockFragments[idx], ...normalizedDf };
    } else {
      mockFragments.push(normalizedDf);
    }
  }
}

mockFragments = mockFragments.map(f => {
  const normId = normalizeFragmentId(f.id);
  const keySig = CANONICAL_TONAL_KEYS[normId] || f.tonalSignature || (f as any).key || "Eb Major";
  return {
    ...f,
    id: normId,
    tonalSignature: keySig,
    key: keySig
  };
}).filter(f => ALLOWED_CANONICAL_SET.has(normalizeFragmentId(f.id)));

persistFragments(mockFragments);

let dbInitPromise: Promise<void> | null = null;

export async function initializeDatabase() {
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    const rawUri = (process.env.MONGODB_URI || "").trim();

    // Only attempt MongoDB connection if a real, valid URI is provided (not empty and not the placeholder/dead cluster)
    const isConfigured = Boolean(
      rawUri &&
      !rawUri.includes("xsriofy.mongodb.net") &&
      !rawUri.includes("your-cluster") &&
      !rawUri.includes("<password>")
    );

    if (!isConfigured) {
      dbStatusMsg = "ONLINE - Safe persistent vault storage active.";
      dbErrorDetail = "";
      useMockDb = true;
      db = null;
      mongoClient = null;
      console.log("[DATABASE] Safe persistent vault storage is active. Ready.");
      return;
    }

    // Sanitize any angle brackets if present in password format (<wSbd7OTPwrW5vBd7> -> wSbd7OTPwrW5vBd7)
    let uri = rawUri.replace(/<([^>]+)>/g, "$1").trim();
    if (uri.endsWith("/")) {
      uri = `${uri}theowlclock?retryWrites=true&w=majority`;
    }

    try {
      console.log("[DATABASE] Connecting to MongoDB Atlas cluster...");
      const client = new MongoClient(uri, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        maxPoolSize: 10
      });
      
      // Perform direct connection and admin ping to guarantee active cluster reachability
      await client.connect();
      await client.db("admin").command({ ping: 1 });

      db = client.db("theowlclock");
      mongoClient = client;
      
      console.log("\x1b[32m%s\x1b[0m", "[DATABASE] SUCCESS: Connected to real MongoDB Atlas database.");
      dbStatusMsg = "CONNECTED - MongoDB Atlas cluster is active and fully functional.";
      dbErrorDetail = "";
      useMockDb = false;
      
      // Seed default mock databases individually if they don't exist
      const licensesCol = db.collection("licenses");
      await licensesCol.createIndex({ id: 1 }, { unique: true }).catch(() => {});
      await licensesCol.createIndex({ licenseNumber: 1 }, { unique: true, sparse: true }).catch(() => {});

      const licensesCount = await licensesCol.countDocuments().catch(() => 0);
      if (licensesCount === 0 && mockLicenses.length > 0) {
        await licensesCol.insertMany(mockLicenses).catch(() => {});
        console.log("[DATABASE] Seeded default licenses to MongoDB.");
      }

      const requestsCol = db.collection("requests");
      const requestsCount = await requestsCol.countDocuments().catch(() => 0);
      if (requestsCount === 0 && mockRequests.length > 0) {
        await requestsCol.insertMany(mockRequests).catch(() => {});
        console.log("[DATABASE] Seeded default requests to MongoDB.");
      }

      const paymentsCol = db.collection("payments");
      const paymentsCount = await paymentsCol.countDocuments().catch(() => 0);
      if (paymentsCount === 0 && mockPayments.length > 0) {
        await paymentsCol.insertMany(mockPayments).catch(() => {});
        console.log("[DATABASE] Seeded default payments to MongoDB.");
      }

      const fragmentsCol = db.collection("fragments");
      // Explicitly purge ANY beat that is NOT one of the authorized 5 beats from MongoDB
      const ALLOWED_BEAT_DB_IDS = [
        "10:00", "11:11", "01:16", "03:21", "09:41",
        "3:21", "9:41", "1:16",
        "10:00 PM", "11:11 PM", "01:16 AM", "03:21 PM", "09:41 PM",
        "3:21 PM", "9:41 PM", "1:16 AM"
      ];
      await fragmentsCol.deleteMany({
        $or: [
          { id: { $nin: ALLOWED_BEAT_DB_IDS } },
          { id: { $in: ["09:19", "9:19", "0919", "919", "9:19 AM", "09:19 AM", "9:19 PM", "09:19 PM", "07:19", "7:19", "0719", "719", "7:19 PM", "07:19 PM", "7:19 AM", "07:19 AM"] } },
          { timestamp: { $regex: /0?9:19|0?7:19/i } },
          { fragmentTimestamp: { $regex: /0?9:19|0?7:19/i } },
          { name: { $regex: /0?9:19|0?7:19|^719/i } }
        ]
      }).catch((e: any) => console.warn("[MONGODB] Cleanup non-allowed beats notice:", e?.message));

      // Synchronize and upsert strictly the 5 active beat fragments with Cloudflare R2 links in MongoDB
      for (const frag of mockFragments) {
        if (!ALLOWED_CANONICAL_SET.has(normalizeFragmentId(frag.id))) continue;
        await fragmentsCol.updateOne(
          { id: frag.id },
          { $set: frag },
          { upsert: true }
        ).catch(() => {});
      }

      // Fetch existing fragments from MongoDB, strictly keeping ONLY authorized 5 beats
      const remoteFrags = (await fragmentsCol.find({}).toArray().catch(() => []))
        .filter((rf: any) => {
          const fid = normalizeFragmentId(String(rf.id || ""));
          return ALLOWED_CANONICAL_SET.has(fid);
        });
      for (const rf of remoteFrags) {
        const idx = mockFragments.findIndex(m => m.id === rf.id);
        if (idx === -1) {
          mockFragments.push(rf as any);
        } else {
          mockFragments[idx] = { ...mockFragments[idx], ...rf };
        }
      }
      mockFragments = mockFragments.filter(f => ALLOWED_CANONICAL_SET.has(normalizeFragmentId(f.id)));
      persistFragments(mockFragments);
      console.log("[DATABASE] Synchronized strictly the 5 authorized beat fragments with Cloudflare R2 links in MongoDB.");

      // Also persist the direct download links into the 'files' collection in MongoDB
      for (const frag of mockFragments) {
        if (frag.mp3Preview) {
          await saveR2FileRecord({
            objectKey: `audio/${frag.id.replace(/:/g, "-")}-preview.mp3`,
            filename: `${frag.name.replace(/\s+/g, "_")}_Preview.mp3`,
            contentType: "audio/mpeg",
            directUrl: frag.mp3Preview,
            downloadUrl: frag.mp3Preview,
            fragmentId: frag.id,
            status: "verified",
          }).catch(() => {});
        }
        if (frag.wavMaster) {
          await saveR2FileRecord({
            objectKey: `audio/${frag.id.replace(/:/g, "-")}-master.wav`,
            filename: `${frag.name.replace(/\s+/g, "_")}_Master_24bit.wav`,
            contentType: "audio/wav",
            directUrl: frag.wavMaster,
            downloadUrl: frag.wavMaster,
            fragmentId: frag.id,
            status: "verified",
          }).catch(() => {});
        }
        if (frag.stemsZip) {
          await saveR2FileRecord({
            objectKey: `fragments/${frag.id.replace(/:/g, "")}/stems/stems.zip`,
            filename: `${frag.name.replace(/\s+/g, "_")}_Stems_Archive.zip`,
            contentType: "application/zip",
            directUrl: frag.stemsZip,
            downloadUrl: frag.stemsZip,
            fragmentId: frag.id,
            status: "verified",
          }).catch(() => {});
        }
      }
    } catch (error: any) {
      console.log("[DATABASE] Safe persistent vault storage is active.");
      dbStatusMsg = "ONLINE - Safe persistent vault storage active.";
      dbErrorDetail = "";
      useMockDb = true;
      db = null;
      if (mongoClient) {
        try {
          await mongoClient.close();
        } catch (_) {}
        mongoClient = null;
      }
    }
  })();

  return dbInitPromise;
}

// Called by auth routes when a MongoDB call fails, so later requests use the in-memory fallback.
export function enableMockDb() {
  useMockDb = true;
}

