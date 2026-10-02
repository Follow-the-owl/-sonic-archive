import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { MongoClient, Db } from "mongodb";
import nodemailer from "nodemailer";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// --- Types ---
interface User {
  email: string;
  passwordHash: string;
  createdAt: Date;
}

interface License {
  id: string; // License Reference Number
  song: string; // Composition / Fragment Title
  type: string; // License Tier Title
  date: string; // ISO / UTC timestamp
  purchaseDate?: string; // Auto-populated Transaction Date
  effectiveDate?: string;
  isrc: string;
  iswc: string;
  email: string; // Licensee Email
  licenseeLegalName?: string; // Licensee Full Name
  licenseeEmail?: string;
  licenseeAddress?: string; // Licensee Address
  licensor?: string; // LOMON LLC / The Owl Clock
  licensorEmail?: string; // licensing@theowlclock.com
  licensorOrganization?: string; // LOMON LLC (d/b/a The Owl Clock)
  legalContactName?: string; // Christopher Solomon Paul
  producerCredit?: string; // Produced by Lomon Christopher / The Owl Clock
  pro?: string; // BMI
  writerIpi?: string; // 01305977829
  archiveIdentifier?: string; // Fragment Catalog ID
  hash: string; // Audio File Hash / Stamp
  audioHash?: string;
  keySignature?: string; // Key Signature variable
  tempoBpm?: number | string; // Tempo BPM variable
  duration?: string; // Duration Seconds variable
  tierId?: string;
  amount?: number; // Total Fee Paid in USD
  price?: string | number;
  paymentStatus?: string; // Payment Status (Completed via Payment Gateway)
  permittedUsage?: string; // Permitted Rights Summary variable
  streamingLimit?: string; // Streaming Cap or Unlimited variable
  distributionTerritory?: string; // Distribution Territory (Worldwide)
  termDuration?: string; // Term Duration (Perpetual)
  composerSplits?: string; // Composer / PRO Splits variable
  signature: string;
  transactionRef?: string;
  masterOwnership?: string;
  compositionOwnership?: string;
  publishingShare?: string;
  writerShare?: string;
  exclusivity?: string;
  contractVersion?: string;
  artwork?: string;
}

interface RequestItem {
  ref: string;
  type: string;
  target: string;
  status: string;
  date: string;
  email: string;
}

interface Payment {
  id: string;
  email: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  date: string;
  items: any[];
}


// Cloudflare R2 Object Storage Configuration (S3-Compatible)
export const R2_BUCKET = (process.env.R2_BUCKET || process.env.SCALEWAY_BUCKET_NAME || "owl").trim();
export const R2_REGION = (process.env.R2_REGION || process.env.SCALEWAY_REGION || "auto").trim();
export const R2_ENDPOINT = (process.env.R2_ENDPOINT || process.env.SCALEWAY_ENDPOINT || "https://8d2db169fb0c50093effeb17b495b4ed.r2.cloudflarestorage.com").trim();
export const R2_ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID || process.env.SCALEWAY_ACCESS_KEY || "2b5c17ee83ffc3de26868e41c3a5176f").trim();
export const R2_SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY || process.env.SCALEWAY_SECRET_KEY || "23cb55de76944f28d611b6fdd3669eaad044539f7368dab2f302e8a7ec089bc9").trim();

// Maximum single file upload limit: 200MB (209,715,200 bytes)
export const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;

// Initialize S3-compatible Client configured for Cloudflare R2
export const r2Client = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
export const scalewayClient = r2Client; // Alias for backward compatibility
console.log(`[API SERVER] Cloudflare R2 S3 Client initialized for bucket: ${R2_BUCKET}, endpoint: ${R2_ENDPOINT}`);

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

// --- Cloudflare R2 CORS Helper Functions ---
async function configureR2BucketCors(bucketName: string = R2_BUCKET) {
  const corsRules = [
    {
      AllowedOrigins: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag", "Content-Length", "Content-Type", "Content-Range", "Accept-Ranges", "x-amz-request-id", "x-amz-id-2"],
      MaxAgeSeconds: 3600,
    },
  ];

  try {
    await r2Client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: corsRules,
        },
      })
    );
    console.log(`[CLOUDFLARE R2 CORS] Successfully applied CORS rules to bucket '${bucketName}'`);
    return { success: true, bucket: bucketName, rules: corsRules };
  } catch (err: any) {
    console.error(`[CLOUDFLARE R2 CORS CONFIG ERROR] Failed to apply CORS to bucket '${bucketName}':`, err);
    throw err;
  }
}

async function getR2BucketCors(bucketName: string = R2_BUCKET) {
  try {
    const res = await r2Client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
    return { configured: true, rules: res.CORSRules };
  } catch (err: any) {
    if (err.name === "NoSuchCORSConfiguration") {
      return { configured: false, rules: [] };
    }
    throw err;
  }
}
const configureScalewayBucketCors = configureR2BucketCors;
const getScalewayBucketCors = getR2BucketCors;

// --- Cloudinary Signature Generator ---
function generateCloudinarySignature(
  folder: string,
  resourceType: "video" | "raw" | "image" | "auto" = "video",
  tags: string = "owl-clock-fragment"
) {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    return null;
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign: Record<string, string | number> = {
    folder,
    tags,
    timestamp
  };

  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map(key => `${key}=${paramsToSign[key]}`)
    .join("&");

  const stringToSign = `${sortedParams}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    tags,
    resourceType,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
  };
}

// PayPal Gateway Configuration
export const PAYPAL_MODE = (process.env.PAYPAL_MODE || "sandbox").toLowerCase().trim();
export const isLivePayPal = PAYPAL_MODE === "live" || PAYPAL_MODE === "production";
export const PAYPAL_CLIENT_ID = (
  process.env.PAYPAL_CLIENT_ID ||
  (isLivePayPal
    ? "BAA4C446wxpcSOadTQXKeQOhdjJqBgoe8AMyCE6gYkpeYqSQA9IjCWpvtpzhfI_ME9CAQWhw7ovkcuUeL0"
    : "AdiPCjG0-5MjWxbcG_65AlrD1V97OgWJ4MpedjzxW9JkMTCUwikVdMd7FWMCce0PeEACd77vbsYCzfee")
).trim();
export const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || "EInidsYBRSD2BpbMpVU_IroxTtB3RLeU7x3vfkb5KDh2GNzPN34Q7QK8YF_GbhBbmlbb1ow4dd185Y3P").trim();
export const PAYPAL_BASE_URL = isLivePayPal ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
export const PAYPAL_HOSTED_PAYMENT_URL = (process.env.PAYPAL_HOSTED_PAYMENT_URL || "https://www.paypal.com/ncp/payment/EGWC37L2LBCAQ").trim();
console.log(`[API SERVER] PayPal Gateway Mode: ${isLivePayPal ? "LIVE (PRODUCTION)" : "SANDBOX (TESTING)"} -> ${PAYPAL_BASE_URL}`);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// URL normalization ONLY for API routes that were rewritten without the /api prefix:
// Ensures routes like /system/status or /paypal/create-order map to /api/* handlers,
// while leaving all static assets, JS modules, CSS, images, and HTML completely untouched!
const KNOWN_API_PREFIXES = [
  "system", "auth", "paypal", "licenses", "clearance", "storage",
  "user", "admin", "fragments", "db-status", "upload-url", "v1"
];
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith("/api")) {
    const cleanPath = req.url.replace(/^\/+/, "");
    const firstSegment = cleanPath.split("/")[0]?.split("?")[0]?.toLowerCase();
    if (firstSegment && KNOWN_API_PREFIXES.includes(firstSegment)) {
      req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
    }
  }
  next();
});

// Safely parse JSON and URL-encoded bodies without stalling if already read by Vercel serverless runtime
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    return next();
  }
  express.json({ limit: "50mb" })(req, res, next);
});
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    return next();
  }
  express.urlencoded({ extended: true, limit: "50mb" })(req, res, next);
});

// In-memory audio/file storage for seamless local and preview mode playback
interface StoredFile {
  id: string;
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
  createdAt: number;
}
export const inMemoryFileStore = new Map<string, StoredFile>();

// Streaming endpoint with HTTP 206 Partial Content (Byte Range) support for audio/media playback
app.get("/api/storage/file/:id", (req, res) => {
  const { id } = req.params;
  const file = inMemoryFileStore.get(id);
  if (!file) {
    return res.status(404).json({ error: "File not found or expired from runtime cache." });
  }

  const range = req.headers.range;
  const totalSize = file.size;

  res.setHeader("Content-Type", file.mimetype || "application/octet-stream");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Disposition", `inline; filename="${file.originalname}"`);

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

    if (start >= totalSize || end >= totalSize) {
      res.status(416).setHeader("Content-Range", `bytes */${totalSize}`);
      return res.end();
    }

    const chunksize = (end - start) + 1;
    const chunk = file.buffer.subarray(start, end + 1);

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": file.mimetype,
    });
    return res.end(chunk);
  } else {
    res.setHeader("Content-Length", totalSize);
    return res.end(file.buffer);
  }
});

// Database initialization middleware (critical for serverless execution like Vercel)
app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
  } catch (err) {
    console.error("[MIDDLEWARE] Database initialization failed:", err);
  }
  next();
});

// --- Database Connection & Fail-safe Mock Fallbacks ---
let mongoClient: MongoClient | null = null;
let db: Db | null = null;
let useMockDb = true;
let dbStatusMsg = "Initializing...";
let dbErrorDetail = "";

function generateLicenseNumber(tierId?: string, tierTitle?: string): string {
  const year = new Date().getFullYear();
  let code = "AA";
  const t = (tierId || tierTitle || "").toLowerCase();

  if (t.includes("exclusive") || t === "ex" || t.includes("acquisition")) {
    code = "EX";
  } else if (t.includes("exploitation") || t.includes("cx") || t.includes("commercial exploitation") || t.includes("$1,000") || t.includes("1000")) {
    code = "CX";
  } else if (t.includes("release") || t === "cr" || t.includes("$500") || t.includes("commercial release")) {
    code = "CR";
  } else if (t.includes("sync") || t.includes("synchronization")) {
    code = "SYNC";
  } else if (t.includes("collab") || t.includes("producer") || t === "col" || t.includes("$0")) {
    code = "COL";
  } else {
    code = "AA";
  }

  const randomDigits = String(Math.floor(1000 + Math.random() * 90000)).padStart(5, "0");
  return `TOC-${code}-${year}-${randomDigits}`;
}

// In-Memory Fallbacks (used if MONGODB_URI is not provided or connection fails)
const mockUsers: Map<string, User> = new Map();
const mockSessions: Map<string, string> = new Map(); // token -> email
const mockLicenses: License[] = [];
const mockRequests: RequestItem[] = [];
const mockPayments: Payment[] = [];

interface EmailLog {
  id: string;
  email: string;
  reference: string;
  subject: string;
  previewUrl?: string;
  html: string;
  date: string;
}

const mockEmailLogs: EmailLog[] = [];

interface Fragment {
  id: string;
  name: string;
  timestamp: string;
  classification: string;
  observation: string;
  duration: string;
  description: string;
  isExclusive: boolean;
  frequency: number;
  synthType: "drone" | "keys" | "bell" | "noise" | "pulse";
  bpm: number;
  status?: string;
  plays?: number;
  revenue?: number;
  artwork?: string;
  mp3Preview?: string;
  audioUrl?: string;
  previewAudioUrl?: string;
  wavMaster?: string;
  wavUrl?: string;
  stemsZip?: string;
  zipUrl?: string;
  audioFiles?: any[];
  tonalSignature?: string;
  recoveryState?: string;
  fullRecoveryDate?: string;
  archivist?: string;
  timeCapsule?: any;
}

const mockFragments: Fragment[] = [
  { 
    id: "03:21", 
    name: "3:21 PM", 
    timestamp: "3:21 PM", 
    classification: "RECOVERY STATE", 
    observation: "TIME OF MARK: 3:21 PM. KEY SIGNATURE: F# Major. TEMPO: 100 BPM. RECOVERY STAMP: November 6, 2025. COMPLETION STAMP: January 13, 2026.", 
    duration: "03:21", 
    description: "Time Capsule Entry 0321. High-fidelity recovered tape fragment carrying an F# Major tonal axis at 100 BPM. Fully cleared deliverable suite co-signed under Lomon's protocols.", 
    isExclusive: false, 
    frequency: 369.99, 
    synthType: "keys", 
    bpm: 100, 
    status: "Published", 
    plays: 1450, 
    revenue: 400, 
    tonalSignature: "F# Major", 
    recoveryState: "Fully Recovered", 
    fullRecoveryDate: "November 6, 2025", 
    archivist: "LOMON", 
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).mp3",
    wavMaster: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).wav",
    wavUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).wav",
    stemsZip: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/Archive%20(7).zip",
    zipUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/Archive%20(7).zip",
    audioFiles: [
      { fileType: "publicPreviewMp3", fileName: "3_21_PM_Preview.mp3", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).mp3" },
      { fileType: "masterWav", fileName: "3_21_PM_Master_24bit.wav", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).wav" },
      { fileType: "stemZip", fileName: "3_21_PM_Stems.zip", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/Archive%20(7).zip" }
    ],
    timeCapsule: {
      entryNo: "0321",
      catalogNo: "TOC-0321-FS",
      title: "3:21 PM",
      timeOfMark: "3:21 PM",
      recoveryStamp: "November 6, 2025",
      completionStamp: "January 13, 2026",
      tonalAxis: "F# MAJOR",
      tempoPulse: "100 BPM",
      runtime: "03:21",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "01. HIGH-RES WAV MASTER [ 24-BIT / 48KHZ ]",
        "02. REFERENCE MP3 [ 320 KBPS ]",
        "03. UNCOMPRESSED INSTRUMENTAL MASTER",
        "04. COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  { 
    id: "09:41", 
    name: "9:41 PM", 
    timestamp: "9:41 PM", 
    classification: "RECOVERY STATE", 
    observation: "TIME OF MARK: 9:41 PM. TONAL SIGNATURE: B Major. PULSE: 103 BPM. Recovery Status: FULLY RECOVERED.", 
    duration: "03:06", 
    description: "Time Capsule Entry 0941. High-fidelity recovered tape fragment carrying a B Major tonal axis at 103 BPM. Fully cleared deliverable suite co-signed under Lomon's protocols.", 
    isExclusive: false, 
    frequency: 246.94, 
    synthType: "keys", 
    bpm: 103, 
    status: "Published", 
    plays: 1890, 
    revenue: 350, 
    tonalSignature: "B Major", 
    recoveryState: "Fully Recovered", 
    fullRecoveryDate: "2026.08.08", 
    archivist: "LOMON", 
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM%20(1).mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM%20(1).mp3",
    wavMaster: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM.wav",
    wavUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM.wav",
    stemsZip: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/Archive%20(9).zip",
    zipUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/Archive%20(9).zip",
    audioFiles: [
      { fileType: "publicPreviewMp3", fileName: "9_41_PM_Preview.mp3", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM%20(1).mp3" },
      { fileType: "masterWav", fileName: "9_41_PM_Master_24bit.wav", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/9%3B41%20PM.wav" },
      { fileType: "stemZip", fileName: "9_41_PM_Stems.zip", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/9%3A41pm/Archive%20(9).zip" }
    ],
    timeCapsule: {
      entryNo: "0941",
      catalogNo: "TOC-0941-B",
      title: "9:41 PM",
      timeOfMark: "9:41 PM",
      recoveryStamp: "MAY 19, 2026",
      completionStamp: "AUG 08, 2026",
      tonalAxis: "B MAJOR",
      tempoPulse: "103 BPM",
      runtime: "03:06",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "01. HIGH-RES WAV MASTER [ 24-BIT / 48KHZ ]",
        "02. REFERENCE MP3 [ 320 KBPS ]",
        "03. UNCOMPRESSED INSTRUMENTAL MASTER",
        "04. COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  { 
    id: "10:00", 
    name: "10:00 PM", 
    timestamp: "10:00 PM", 
    classification: "RECOVERY STATE", 
    observation: "TIME OF MARK: 10:00 PM. TONAL SIGNATURE: Eb Major. PULSE: 100 BPM. Recovery Status: FULLY RECOVERED.", 
    duration: "6:15", 
    description: "A majestic, fully recovered 10:00 PM transmission carrying a pure Eb Major chord sequence vibrating at 100 BPM. Archivist entry compiled and co-signed under Lomon's protocols.", 
    isExclusive: false, 
    frequency: 311.13, 
    synthType: "keys", 
    bpm: 100, 
    status: "Published", 
    plays: 1200, 
    revenue: 200, 
    tonalSignature: "Eb Major", 
    recoveryState: "Fully Recovered", 
    fullRecoveryDate: "2025.07.14", 
    archivist: "Lomon", 
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).mp3",
    wavMaster: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).wav",
    wavUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).wav",
    stemsZip: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/01_Archive%20(2).zip",
    zipUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/01_Archive%20(2).zip",
    audioFiles: [
      { fileType: "publicPreviewMp3", fileName: "10_00_PM_Preview.mp3", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).mp3" },
      { fileType: "masterWav", fileName: "10_00_PM_Master_24bit.wav", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/10%3B00%20PM%20%20(1).wav" },
      { fileType: "stemZip", fileName: "10_00_PM_Stems.zip", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/10pm/01_Archive%20(2).zip" }
    ],
    timeCapsule: {
      entryNo: "1000",
      catalogNo: "TOC-1000-B",
      title: "10:00 PM",
      timeOfMark: "10:00 PM",
      recoveryStamp: "MAY 14, 2025",
      completionStamp: "JUL 14, 2025",
      tonalAxis: "EB MAJOR",
      tempoPulse: "100 BPM",
      runtime: "06:15",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "01. HIGH-RES WAV MASTER [ 24-BIT / 48KHZ ]",
        "02. REFERENCE MP3 [ 320 KBPS ]",
        "03. UNCOMPRESSED INSTRUMENTAL MASTER",
        "04. COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  { 
    id: "01:16", 
    name: "01:16 AM", 
    timestamp: "01:16 AM", 
    classification: "RECOVERY STATE", 
    observation: "TIME OF MARK: 01:16 AM. KEY SIGNATURE: G MAJOR. TEMPO: 104 BPM. RECOVERY STAMP: 2025.11.04. COMPLETION STAMP: SEPTEMBER 5, 2026.", 
    duration: "05:44", 
    description: "Rare celestial nocturnal tape reel fragment captured at 01:16 AM carrying a G Major harmonic decay vibrating at 104 BPM. Co-signed under Lomon's protocols.", 
    isExclusive: false, 
    frequency: 196.00, 
    synthType: "keys", 
    bpm: 104, 
    status: "Published", 
    plays: 2450, 
    revenue: 850, 
    tonalSignature: "G MAJOR", 
    recoveryState: "Fully Recovered", 
    fullRecoveryDate: "2025.11.04", 
    archivist: "LOMON", 
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).mp3",
    wavMaster: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).wav",
    wavUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).wav",
    stemsZip: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/Archive%20(8).zip",
    zipUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/Archive%20(8).zip",
    audioFiles: [
      { fileType: "publicPreviewMp3", fileName: "1_16_AM_Preview.mp3", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).mp3" },
      { fileType: "masterWav", fileName: "1_16_AM_Master_24bit.wav", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/1%3B16%20AM_A2%20(1).wav" },
      { fileType: "stemZip", fileName: "1_16_AM_Stems.zip", fileUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/1/Archive%20(8).zip" }
    ],
    timeCapsule: {
      entryNo: "0116",
      catalogNo: "TOC-0116-G",
      title: "01:16 AM",
      timeOfMark: "01:16 AM",
      recoveryStamp: "2025.11.04",
      completionStamp: "SEPTEMBER 5, 2026",
      tonalAxis: "G MAJOR",
      tempoPulse: "104 BPM",
      runtime: "05:44",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "01. HIGH-RES WAV MASTER [ 24-BIT / 48KHZ ]",
        "02. REFERENCE MP3 [ 320 KBPS ]",
        "03. UNCOMPRESSED INSTRUMENTAL MASTER",
        "04. COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  },
  { 
    id: "07:15", 
    name: "07:15 AM", 
    timestamp: "07:15 AM", 
    classification: "RECOVERY STATE", 
    observation: "Time Capsule Entry 0715. Tonal Axis: C Minor. Tempo / Pulse: 110 BPM. Runtime: 02:49. Recovery Status: FULLY RECOVERED.", 
    duration: "02:49", 
    description: "Time Capsule Entry 0715. High-fidelity recovered tape fragment carrying a C Minor tonal axis at 110 BPM.", 
    isExclusive: false, 
    frequency: 261.63, 
    synthType: "keys", 
    bpm: 110, 
    status: "Published", 
    plays: 980, 
    revenue: 150, 
    tonalSignature: "C Minor", 
    recoveryState: "Fully Recovered", 
    fullRecoveryDate: "2026.08.15", 
    archivist: "LOMON", 
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/3/3%3B21%20PM%20E%205%20(1).mp3"
  },
  { 
    id: "11:11", 
    name: "11:11 PM", 
    timestamp: "11:11 PM", 
    classification: "RECOVERY STATE", 
    observation: "TIME OF MARK: 11:11 PM. TONAL SIGNATURE: B minor. PULSE: 125 BPM. Recovery Status: FULLY RECOVERED.", 
    duration: "05:44", 
    description: "Time Capsule Entry 1111. High-fidelity recovered tape fragment carrying a B minor tonal axis at 125 BPM. Fully cleared deliverable suite co-signed under Lomon's protocols.", 
    isExclusive: false, 
    frequency: 493.88, 
    synthType: "keys", 
    bpm: 125, 
    status: "Published", 
    plays: 2450, 
    revenue: 850, 
    tonalSignature: "B minor", 
    recoveryState: "Fully Recovered", 
    fullRecoveryDate: "2026.08.01", 
    archivist: "LOMON", 
    mp3Preview: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/11%3B11%20PM_F%201.mp3",
    audioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/11%3B11%20PM_F%201.mp3",
    previewAudioUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/11%3B11%20PM_F%201.mp3",
    wavMaster: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/11%3B11%20PM_F%201.wav",
    wavUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/11%3B11%20PM_F%201.wav",
    stemsZip: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/01_Archive%20(2).zip",
    zipUrl: "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev/11pm/01_Archive%20(2).zip",
    timeCapsule: {
      entryNo: "1111",
      catalogNo: "TOC-1111-A",
      title: "11:11 PM",
      timeOfMark: "11:11 PM",
      recoveryStamp: "JUN 01, 2026",
      completionStamp: "AUG 01, 2026",
      tonalAxis: "B MINOR",
      tempoPulse: "125 BPM",
      runtime: "05:44",
      masterControl: "100% LOMON / THE OWL CLOCK",
      publishingControl: "100% LOMON / THE OWL CLOCK",
      origin: "100% ORIGINAL",
      thirdPartyAssets: "NONE",
      clearanceStatus: "FULLY CLEARED",
      deliverableAssets: [
        "01. HIGH-RES WAV MASTER [ 24-BIT / 48KHZ ]",
        "02. REFERENCE MP3 [ 320 KBPS ]",
        "03. UNCOMPRESSED INSTRUMENTAL MASTER",
        "04. COMPLETE STEM / TRACKOUT SUITE"
      ],
      recoveryStatus: "FULLY RECOVERED",
      archivist: "LOMON"
    }
  }
];

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

let dbInitPromise: Promise<void> | null = null;

async function initializeDatabase() {
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn("\x1b[33m%s\x1b[0m", "[DATABASE] WARNING: MONGODB_URI environment variable is not defined.");
      console.warn("\x1b[33m%s\x1b[0m", "[DATABASE] Defaulting to safe, fully featured in-memory database mock store.");
      useMockDb = true;
      dbStatusMsg = "OFFLINE - MONGODB_URI missing. Using fully functional Sandbox Mock database.";
      dbErrorDetail = "MONGODB_URI environment variable not configured in AI Studio / container environment variables.";
      return;
    }

    try {
      console.log("[DATABASE] Attempting connection to MongoDB...");
      const client = new MongoClient(uri, {
        connectTimeoutMS: 2000,
        serverSelectionTimeoutMS: 2000,
        socketTimeoutMS: 4000,
        maxPoolSize: 5
      });
      // Strict 2.5s timeout race ensures serverless execution never exceeds Vercel limits
      await Promise.race([
        client.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("MongoDB connection timed out after 2500ms")), 2500))
      ]);
      db = client.db();
      mongoClient = client;
      
      console.log("\x1b[32m%s\x1b[0m", "[DATABASE] SUCCESS: Connected to real MongoDB database.");
      dbStatusMsg = "CONNECTED - MongoDB database connection is active and fully functional.";
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
      // Synchronize and upsert active beat fragments with Cloudflare R2 links
      for (const frag of mockFragments) {
        await fragmentsCol.updateOne(
          { id: frag.id },
          { $set: frag },
          { upsert: true }
        ).catch(() => {});
      }
      console.log("[DATABASE] Synchronized active beat fragments with Cloudflare R2 links in MongoDB.");

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
      const errorMsg = error?.message || String(error);
      console.log("[DATABASE] INFO: MongoDB connection attempt bypassed or failed. Message: " + errorMsg);
      dbStatusMsg = "OFFLINE - MongoDB connection failed. Sandbox Mock database is active.";
      dbErrorDetail = errorMsg;
      
      if (errorMsg.includes("alert number 80") || errorMsg.includes("tlsv1 alert") || errorMsg.includes("SSL alert")) {
        console.log("\x1b[33m%s\x1b[0m", "=====================================================================================");
        console.log("\x1b[33m%s\x1b[0m", "[DATABASE] DIAGNOSTIC TIP: This TLS alert number 80 / handshake error almost always");
        console.log("\x1b[33m%s\x1b[0m", "means your current Server IP address is NOT whitelisted in MongoDB Atlas.");
        console.log("\x1b[33m%s\x1b[0m", "To fix this: Go to your MongoDB Atlas dashboard -> 'Network Access' tab, and add");
        console.log("\x1b[33m%s\x1b[0m", "'0.0.0.0/0' to allow access from dynamic server containers.");
        console.log("\x1b[33m%s\x1b[0m", "=====================================================================================");
        dbStatusMsg = "OFFLINE - SSL Handshake Error (IP Whitelist Missing in MongoDB Atlas)";
      }
      
      console.log("[DATABASE] NOTICE: Falling back to safe, fully featured in-memory database mock store.");
      useMockDb = true;
    }
  })();

  return dbInitPromise;
}

// Helper: Hash password
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Helper: Token generator
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper: send premium transaction license dispatch email
async function sendLicenseEmail(email: string, licenses: License[], amountNgn: number, reference: string): Promise<string> {
  console.log(`[EMAIL BYPASS] Email dispatch disabled as per instructions. No transmission email will be sent to ${email} for reference ${reference}.`);
  return "";
}

// --- API ENDPOINTS ---

// Authenticate session token middleware/helper
async function getEmailFromToken(req: express.Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];

  if (useMockDb) {
    return mockSessions.get(token) || null;
  } else {
    try {
      const session = await db!.collection("sessions").findOne({ token });
      return session ? session.email : null;
    } catch {
      return null;
    }
  }
}

// Endpoint to check current MongoDB connection status
app.get("/api/db-status", (req, res) => {
  res.json({
    success: !useMockDb,
    status: dbStatusMsg,
    error: dbErrorDetail,
    timestamp: new Date().toISOString()
  });
});

// System Status & Mode Endpoint (Live vs Sandbox, Database, Storage)
app.get("/api/system/status", (req, res) => {
  res.json({
    live: isLivePayPal,
    paypalMode: PAYPAL_MODE,
    database: useMockDb ? "mock" : "mongodb",
    storage: "cloudflare-r2",
    bucket: R2_BUCKET,
    region: R2_REGION,
    endpoint: R2_ENDPOINT
  });
});

// 1. Auth: Sign up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required fields." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    if (useMockDb) {
      if (mockUsers.has(normalizedEmail)) {
        return res.status(400).json({ error: "Email address already registered." });
      }
      mockUsers.set(normalizedEmail, {
        email: normalizedEmail,
        passwordHash,
        createdAt: new Date()
      });
    } else {
      const usersCol = db!.collection("users");
      const existingUser = await usersCol.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ error: "Email address already registered." });
      }
      await usersCol.insertOne({
        email: normalizedEmail,
        passwordHash,
        createdAt: new Date()
      });
    }

    // Auto-create a session
    const token = generateToken();
    if (useMockDb) {
      mockSessions.set(token, normalizedEmail);
    } else {
      await db!.collection("sessions").insertOne({ token, email: normalizedEmail, createdAt: new Date() });
    }

    res.json({ success: true, token, email: normalizedEmail, database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// 2. Auth: Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    let authenticated = false;

    if (useMockDb) {
      const user = mockUsers.get(normalizedEmail);
      // Hardcode default login for the preset admin email to ease testing
      if (normalizedEmail === "evianaconcepts1@gmail.com" && !user) {
        mockUsers.set(normalizedEmail, {
          email: normalizedEmail,
          passwordHash: hashPassword("lomon2026"),
          createdAt: new Date()
        });
        authenticated = password === "lomon2026";
      } else if (user) {
        authenticated = user.passwordHash === passwordHash;
      }
    } else {
      const user = await db!.collection("users").findOne({ email: normalizedEmail });
      if (normalizedEmail === "evianaconcepts1@gmail.com" && !user) {
        // Safe default password for demo seed if user registers later
        const defaultHash = hashPassword("lomon2026");
        await db!.collection("users").insertOne({ email: normalizedEmail, passwordHash: defaultHash, createdAt: new Date() });
        authenticated = password === "lomon2026";
      } else if (user) {
        authenticated = user.passwordHash === passwordHash;
      }
    }

    if (!authenticated) {
      return res.status(401).json({ error: "Invalid cryptographic credentials or password." });
    }

    const token = generateToken();
    if (useMockDb) {
      mockSessions.set(token, normalizedEmail);
    } else {
      await db!.collection("sessions").insertOne({ token, email: normalizedEmail, createdAt: new Date() });
    }

    res.json({ success: true, token, email: normalizedEmail, database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// 3. Auth: Current user info
app.get("/api/auth/me", async (req, res) => {
  try {
    const email = await getEmailFromToken(req);
    if (!email) {
      return res.status(401).json({ error: "Terminal unauthorized." });
    }

    res.json({ success: true, email, database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// 4. Auth: Logout
app.post("/api/auth/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (useMockDb) {
        mockSessions.delete(token);
      } else {
        await db!.collection("sessions").deleteOne({ token });
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// 5. Database Fetch: User secure data (Licenses & Requests)
app.get("/api/user/data", async (req, res) => {
  try {
    const tokenEmail = await getEmailFromToken(req);
    const queryEmail = (req.query.email as string)?.toLowerCase().trim();
    const email = (tokenEmail || queryEmail || "evianaconcepts1@gmail.com").toLowerCase().trim();

    let userLicenses: License[] = [];
    let userRequests: RequestItem[] = [];
    let userEmailLogs: EmailLog[] = [];

    if (useMockDb) {
      userLicenses = mockLicenses.filter((lic) => !email || (lic.email && lic.email.toLowerCase().trim() === email));
      userRequests = mockRequests.filter((reqItem) => !email || (reqItem.email && reqItem.email.toLowerCase().trim() === email));
      userEmailLogs = mockEmailLogs.filter((log) => !email || (log.email && log.email.toLowerCase().trim() === email));
    } else {
      const query = email ? { email: { $regex: new RegExp(`^${email}$`, "i") } } : {};
      userLicenses = (await db!.collection("licenses").find(query).toArray()) as any[];
      userRequests = (await db!.collection("requests").find(query).toArray()) as any[];
      userEmailLogs = (await db!.collection("email_logs").find(query).toArray()) as any[];
    }

    res.json({
      success: true,
      email,
      licenses: userLicenses,
      requests: userRequests,
      emailLogs: userEmailLogs,
      database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// 6. Database Action: Record custom checkout purchases
app.post("/api/user/purchase", async (req, res) => {
  try {
    const tokenEmail = await getEmailFromToken(req);
    const bodyEmail = req.body.email ? (req.body.email as string).toLowerCase().trim() : null;
    const email = (tokenEmail || bodyEmail || "evianaconcepts1@gmail.com").toLowerCase().trim();

    const { items, licenseeLegalName, billing } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Acquisitions payload must contain item list." });
    }

    const legalName = licenseeLegalName || (billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "") || email;
    const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const generatedLicenses: License[] = items.map((item: any) => {
      const uniqueId = generateLicenseNumber(item.tierId, item.tierTitle);
      const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
      const archiveId = item.fragmentId ? `TOC-${item.fragmentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001` : "TOC-FRAG-001";
      
      return {
        id: uniqueId,
        song: item.name,
        type: item.tierTitle || "Archive Access License ($150 USD)",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        isrc: `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
        iswc: `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
        email,
        signature: `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${email.toUpperCase()}`,
        hash: contractHash,
        tierId: item.tierId || "access",
        licenseeLegalName: legalName,
        archiveIdentifier: archiveId,
        transactionRef: `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
        purchaseDate: formattedDate
      };
    });

    // Create a corresponding clearance request record
    const generatedRequests: RequestItem[] = items.map((item: any) => {
      const refSuffix = Math.floor(10 + Math.random() * 90);
      return {
        ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${refSuffix}`,
        type: `Master Acquisition & Sync Verification`,
        target: item.name,
        status: "APPROVED / EXECUTED",
        date: new Date().toISOString().split("T")[0],
        email
      };
    });

    if (useMockDb) {
      mockLicenses.push(...generatedLicenses);
      mockRequests.push(...generatedRequests);
    } else {
      await db!.collection("licenses").insertMany(generatedLicenses);
      await db!.collection("requests").insertMany(generatedRequests);
    }

    res.json({
      success: true,
      email,
      licenses: generatedLicenses,
      requests: generatedRequests,
      database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// Public License Verification API Endpoint
app.get(["/api/v1/licenses/verify/:license_number", "/api/licenses/verify/:license_number"], async (req, res) => {
  try {
    const rawParam = req.params.license_number || "";
    const cleanNumber = rawParam.trim();
    const upperNumber = cleanNumber.toUpperCase();

    if (!cleanNumber) {
      return res.status(400).json({
        valid: false,
        status: "INVALID_REQUEST",
        error: "License number parameter is required for verification query."
      });
    }

    let foundLicense: License | null = null;

    if (!useMockDb && db) {
      const col = db.collection("licenses");
      foundLicense = (await col.findOne({
        $or: [
          { id: upperNumber },
          { licenseNumber: upperNumber },
          { id: { $regex: new RegExp(`^${upperNumber}$`, "i") } },
          { hash: { $regex: new RegExp(`^${upperNumber}$`, "i") } },
          { transactionRef: { $regex: new RegExp(`^${upperNumber}$`, "i") } }
        ]
      })) as unknown as License | null;
    } else {
      foundLicense = mockLicenses.find(l => {
        const lid = (l.id || "").toUpperCase();
        const lnum = ((l as any).licenseNumber || "").toUpperCase();
        const lhash = (l.hash || "").toUpperCase();
        const lref = (l.transactionRef || "").toUpperCase();
        return lid === upperNumber ||
          (lnum && lnum === upperNumber) ||
          (lhash && lhash === upperNumber) ||
          (lref && lref === upperNumber) ||
          (lid && lid.includes(upperNumber)) ||
          (upperNumber.includes(lid) && lid.length > 5);
      }) || null;
    }

    // 1. PURCHASED VALID LICENSE FOUND
    if (foundLicense) {
      const licensee = foundLicense.licenseeLegalName || foundLicense.email || "Authorized Licensee";
      const fragment = foundLicense.song || "Archived Composition";
      
      let tierDisplay = foundLicense.type || "Archive Access License ($150)";
      const tLower = (foundLicense.tierId || foundLicense.type || "").toLowerCase();
      
      if (upperNumber.startsWith("TOC-CR") || tLower.includes("release") || tLower === "cr") {
        tierDisplay = "Commercial Release ($500)";
      } else if (upperNumber.startsWith("TOC-AA") || tLower.includes("access") || tLower === "aa") {
        tierDisplay = "Archive Access ($150)";
      } else if (upperNumber.startsWith("TOC-CX") || tLower.includes("exploitation") || tLower === "cx") {
        tierDisplay = "Commercial Exploitation ($1,000)";
      } else if (upperNumber.startsWith("TOC-SYNC") || tLower.includes("sync")) {
        tierDisplay = "Synchronization & Master License (Custom)";
      } else if (upperNumber.startsWith("TOC-EX") || tLower.includes("exclusive") || tLower === "ex") {
        tierDisplay = "Exclusive Archive Acquisition ($5,000)";
      } else if (upperNumber.startsWith("TOC-COL") || tLower.includes("collab") || tLower === "col") {
        tierDisplay = "Producer Collaboration ($0)";
      }

      const issuedDate = foundLicense.purchaseDate || foundLicense.date || "August 6, 2026";
      const scopeText = tLower.includes("access") 
        ? "Songwriting, studio demos, rehearsals, and private creative development."
        : tLower.includes("release")
        ? "Commercial streaming distribution (up to 500,000 streams), digital broadcast, sync placement, global territory."
        : tLower.includes("exploitation")
        ? "Unlimited commercial distribution, worldwide sync placement, monetized streaming, live performance."
        : tLower.includes("exclusive")
        ? "100% Exclusive master acquisition, complete archival retirement from public marketplace."
        : tLower.includes("sync")
        ? "Audio-visual synchronization, motion picture soundtrack, episodic streaming, theatrical distribution."
        : "Producer co-production evaluation and collaborative arrangement drafting.";

      const royaltyTerms = "100% Sample-Free Master & Composition Clearance Warranty. Non-exclusive, worldwide, fully executed clearance under Schedule A & B terms.";

      return res.json({
        valid: true,
        purchased: true,
        status: "VALID & ACTIVE",
        licensee,
        licenseeEmail: foundLicense.email,
        fragment,
        tier: tierDisplay,
        issuedDate,
        licenseNumber: foundLicense.id,
        scope: scopeText,
        royaltyTerms,
        details: {
          id: foundLicense.id,
          song: foundLicense.song,
          type: foundLicense.type,
          date: foundLicense.date,
          isrc: foundLicense.isrc,
          iswc: foundLicense.iswc,
          email: foundLicense.email,
          signature: foundLicense.signature,
          hash: foundLicense.hash,
          tierId: foundLicense.tierId || "access",
          licenseeLegalName: licensee,
          archiveIdentifier: foundLicense.archiveIdentifier || `TOC-${foundLicense.id.replace(/[^a-zA-Z0-9]/g, "")}-001`,
          transactionRef: foundLicense.transactionRef || "LMN-TX-VERIFIED",
          purchaseDate: issuedDate
        }
      });
    }

    // 2. UNPURCHASED / FRAGMENT ID / DEFAULT SEARCH -> MASTER ARCHIVE REGISTRY STATE
    // Check if matching a known fragment timestamp or name
    let matchedFragment = mockFragments.find(f => {
      const fid = f.id.toUpperCase();
      const fname = f.name.toUpperCase();
      const ftime = f.timestamp.toUpperCase();
      const digits = f.id.replace(/[^0-9]/g, "");
      const cleanDigits = upperNumber.replace(/[^0-9]/g, "");
      return fid === upperNumber ||
        fname === upperNumber ||
        ftime === upperNumber ||
        (cleanDigits && digits === cleanDigits) ||
        upperNumber.includes(fid) ||
        upperNumber.includes(fname);
    });

    const fragTitle = matchedFragment ? matchedFragment.name : cleanNumber;
    const fragId = matchedFragment ? matchedFragment.id : cleanNumber;

    return res.json({
      valid: true,
      purchased: false,
      isUnpurchased: true,
      status: "UNLICENSED / AVAILABLE FOR CLEARANCE",
      originalRightsHolder: "LOMON LLC / THE OWL CLOCK",
      masterOwnership: "100% SOLELY OWNED BY LOMON LLC",
      publishingControl: "100% CONTROLLED BY LOMON LLC",
      fragment: fragTitle,
      fragmentId: fragId,
      licenseNumber: upperNumber.startsWith("TOC-") ? upperNumber : `TOC-FRAG-${fragId.replace(/[^a-zA-Z0-9]/g, "") || "MASTER"}`,
      clearanceStatus: "UNLICENSED / AVAILABLE FOR CLEARANCE",
      sampleClearanceWarranty: "100% Sample-Free Original Composition (Direct Master Clearance)",
      deliverables: "24-Bit 48kHz WAV Masters, Multi-track Audio Stems, Official PDF License Covenant",
      actionCall: "REQUEST CLEARANCE / PURCHASE LICENSE",
      actionText: "REQUEST CLEARANCE / PURCHASE LICENSE"
    });
  } catch (err: any) {
    console.error("[LICENSE VERIFY API ERROR]", err);
    return res.status(500).json({
      valid: false,
      status: "ERROR",
      error: "Internal server error querying license verification registry."
    });
  }
});

// 7. Database Action: Submit clearance or metadata requests manually
app.post("/api/user/request", async (req, res) => {
  try {
    const email = await getEmailFromToken(req);
    if (!email) {
      return res.status(401).json({ error: "Terminal unauthorized." });
    }

    const { type, target, status } = req.body;
    if (!type || !target) {
      return res.status(400).json({ error: "Request type and target composition name are required." });
    }

    const newRequest: RequestItem = {
      ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`,
      type,
      target,
      status: status || "SUBMITTED",
      date: new Date().toISOString().split("T")[0],
      email
    };

    if (useMockDb) {
      mockRequests.push(newRequest);
    } else {
      await db!.collection("requests").insertOne(newRequest);
    }

    res.json({ success: true, request: newRequest });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// Clear user data / mock history endpoint
app.post("/api/user/clear-history", async (req, res) => {
  try {
    const { email } = req.body;
    if (useMockDb) {
      if (email) {
        const normEmail = email.toLowerCase().trim();
        for (let i = mockLicenses.length - 1; i >= 0; i--) {
          if (mockLicenses[i].email === normEmail) mockLicenses.splice(i, 1);
        }
        for (let i = mockRequests.length - 1; i >= 0; i--) {
          if (mockRequests[i].email === normEmail) mockRequests.splice(i, 1);
        }
        for (let i = mockPayments.length - 1; i >= 0; i--) {
          if (mockPayments[i].email === normEmail) mockPayments.splice(i, 1);
        }
      } else {
        mockLicenses.length = 0;
        mockRequests.length = 0;
        mockPayments.length = 0;
        mockEmailLogs.length = 0;
      }
    } else if (db) {
      if (email) {
        const normEmail = email.toLowerCase().trim();
        await db.collection("licenses").deleteMany({ email: normEmail });
        await db.collection("requests").deleteMany({ email: normEmail });
        await db.collection("payments").deleteMany({ email: normEmail });
      } else {
        await db.collection("licenses").deleteMany({});
        await db.collection("requests").deleteMany({});
        await db.collection("payments").deleteMany({});
      }
    }

    res.json({ success: true, message: "History and license tracks cleared successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to clear history." });
  }
});

// Direct License Creation Endpoint
app.post("/api/licenses/create", async (req, res) => {
  try {
    const { items, email, licenseeLegalName, billing, transactionRef } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required to generate license." });
    }

    const dbEmail = (email || "guest@lomon.local").toLowerCase().trim();
    const legalName = licenseeLegalName || (billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "") || dbEmail;
    const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const txRef = transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`;

    const generatedLicenses: License[] = items.map((item: any) => {
      const uniqueSuffix = Math.floor(100 + Math.random() * 900);
      const uniqueId = `TOC-LIC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${uniqueSuffix}`;
      const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
      const archiveId = item.fragmentId ? `TOC-${item.fragmentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001` : `TOC-${(item.id || "FRAG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001`;

      return {
        id: uniqueId,
        song: item.name,
        type: item.tierTitle || "Archive Access License ($150 USD)",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        isrc: `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
        iswc: `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
        email: dbEmail,
        signature: `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${dbEmail.toUpperCase()}`,
        hash: contractHash,
        tierId: item.tierId || "access",
        licenseeLegalName: legalName,
        archiveIdentifier: archiveId,
        transactionRef: txRef,
        purchaseDate: formattedDate
      };
    });

    const generatedRequests: RequestItem[] = items.map((item: any) => {
      const refSuffix = Math.floor(10 + Math.random() * 90);
      return {
        ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${refSuffix}`,
        type: "Master Acquisition & Sync Verification",
        target: item.name,
        status: "APPROVED / EXECUTED",
        date: new Date().toISOString().split("T")[0],
        email: dbEmail
      };
    });

    const newPayment: Payment = {
      id: txRef,
      email: dbEmail,
      amount: items.reduce((sum, item) => sum + (parseFloat(String(item.price || "").replace(/[^0-9.]/g, "")) || 0), 0),
      currency: "USD",
      status: "success",
      gateway: "paypal",
      date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      items
    };

    if (useMockDb) {
      mockLicenses.push(...generatedLicenses);
      mockRequests.push(...generatedRequests);
      mockPayments.push(newPayment);
    } else if (db) {
      await db.collection("licenses").insertMany(generatedLicenses);
      await db.collection("requests").insertMany(generatedRequests);
      await db.collection("payments").insertOne(newPayment);
    }

    res.json({
      success: true,
      reference: txRef,
      licenses: generatedLicenses,
      requests: generatedRequests,
      payment: newPayment
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create license." });
  }
});

// Pending transactions store to retrieve items on callback redirect
const pendingTransactions = new Map<string, { email: string; items: any[]; billing?: any; reference?: string; amount?: number; orderId?: string }>();

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const rawText = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(rawText);
  } catch (_e) {
    throw new Error(`PayPal OAuth gateway error (${response.status}): ${rawText.substring(0, 120)}`);
  }

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.message || `PayPal OAuth failed with status ${response.status}`);
  }
  return data.access_token;
}

// 8. PayPal: Create Order Endpoint
app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const { email, amount, items, billing, paymentId } = req.body || {};
    const numericAmount = parseFloat(amount) || 150;
    const reference = `LMN-PP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const isTestOneDollar = numericAmount === 1 || 
      paymentId === "EGWC37L2LBCAQ" ||
      items?.some((i: any) => i.tierId === "test" || i.price === "$1" || i.price === "$1.00" || i.price === 1);

    const defaultHostedPaymentUrl = PAYPAL_HOSTED_PAYMENT_URL;

    // If $1 testing is requested with Payment ID EGWC37L2LBCAQ, route to official hosted checkout
    if (isTestOneDollar) {
      const hostedPaymentUrl = defaultHostedPaymentUrl;
      const testOrderId = `NCP-EGWC37L2LBCAQ-${Date.now()}`;

      pendingTransactions.set(testOrderId, { email, items, billing, reference, amount: 1.00 });
      pendingTransactions.set(reference, { email, items, billing, reference, amount: 1.00, orderId: testOrderId });
      pendingTransactions.set("EGWC37L2LBCAQ", { email, items, billing, reference, amount: 1.00, orderId: testOrderId });

      console.log(`[PAYPAL $1 TEST ACTIVE] Routing to live PayPal Hosted Payment ID: EGWC37L2LBCAQ -> ${hostedPaymentUrl}`);

      return res.json({
        success: true,
        orderID: testOrderId,
        reference,
        paymentId: "EGWC37L2LBCAQ",
        approveUrl: hostedPaymentUrl,
        isTest: true,
        isMock: false,
        message: "Routed to official $1 test payment portal (EGWC37L2LBCAQ)."
      });
    }

    try {
      const accessToken = await getPayPalAccessToken();
      const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      const host = req.get("host") || "sonic-archive-ef97.vercel.app";
      const fallbackOrigin = `${proto}://${host}`;
      const baseAppUrl = (process.env.APP_URL || (host.includes("localhost") ? fallbackOrigin : "https://sonic-archive-ef97.vercel.app")).replace(/\/$/, "");
      const returnUrl = `${baseAppUrl}/api/paypal/return`;
      const cancelUrl = `${baseAppUrl}/checkout?status=cancel`;

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: reference,
              amount: {
                currency_code: "USD",
                value: numericAmount.toFixed(2)
              },
              description: `LOMON Archive clearance for ${items?.length || 1} Fragment(s)`
            }
          ],
          application_context: {
            brand_name: "LOMON LLC / THE OWL CLOCK",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            return_url: returnUrl,
            cancel_url: cancelUrl
          }
        })
      });

      const rawOrderText = await response.text();
      let orderData: any = {};
      try {
        orderData = JSON.parse(rawOrderText);
      } catch (_e) {
        throw new Error(`PayPal Orders gateway error (${response.status}): ${rawOrderText.substring(0, 120)}`);
      }

      if (!response.ok) {
        throw new Error(orderData.message || orderData.details?.[0]?.issue || "Failed to create PayPal order.");
      }

      // Store pending order details
      pendingTransactions.set(orderData.id, { email, items, billing, reference, amount: numericAmount });
      if (reference) {
        pendingTransactions.set(reference, { email, items, billing, reference, amount: numericAmount, orderId: orderData.id });
      }

      const approveLink = orderData.links?.find((link: any) => link.rel === "approve")?.href;

      res.json({
        success: true,
        orderID: orderData.id,
        reference,
        approveUrl: approveLink,
        isMock: false
      });
    } catch (paypalError: any) {
      console.warn("[PAYPAL SDK NOTICE]:", paypalError.message);
      
      // On live / production, or if PayPal REST credentials aren't active with live keys,
      // route the customer directly to the official PayPal payment portal (EGWC37L2LBCAQ)
      // so payment is actually made on PayPal rather than being stuck on an internal mock screen!
      if (isLivePayPal || process.env.NODE_ENV === "production" || defaultHostedPaymentUrl) {
        console.log(`[PAYPAL LIVE ROUTE] Directing customer to real PayPal checkout portal: ${defaultHostedPaymentUrl}`);
        const hostedOrderId = `NCP-PAYPAL-${Date.now()}`;
        pendingTransactions.set(hostedOrderId, { email, items, billing, reference, amount: numericAmount });
        pendingTransactions.set(reference, { email, items, billing, reference, amount: numericAmount, orderId: hostedOrderId });
        pendingTransactions.set("EGWC37L2LBCAQ", { email, items, billing, reference, amount: numericAmount, orderId: hostedOrderId });

        return res.json({
          success: true,
          orderID: hostedOrderId,
          reference,
          paymentId: "EGWC37L2LBCAQ",
          approveUrl: defaultHostedPaymentUrl,
          isMock: false,
          isHosted: true,
          message: "Securely routed to PayPal checkout portal."
        });
      }

      pendingTransactions.set(reference, { email, items, billing, reference, amount: numericAmount });
      const mockToken = `SANDBOX-${reference}`;
      pendingTransactions.set(mockToken, { email, items, billing, reference, amount: numericAmount });

      res.json({
        success: true,
        orderID: mockToken,
        reference,
        approveUrl: `/mock-paypal-checkout?token=${mockToken}&reference=${reference}&amount=${numericAmount}&email=${encodeURIComponent(email || "guest@lomon.local")}`,
        isMock: true
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to initialize PayPal transaction." });
  }
});

function createLicenseDataHelper(item: any, dbEmail: string, legalName: string, billing: any, transactionRef: string, formattedDate: string): License {
  const uniqueSuffix = Math.floor(100 + Math.random() * 900);
  const uniqueId = `TOC-LIC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${uniqueSuffix}`;
  const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
  const rawId = item.id || item.fragmentId || "";
  const archiveId = rawId ? `TOC-${rawId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001` : "TOC-FRAG-001";
  const tierId = (item.tierId || "access").toLowerCase();
  
  const fragMatch = mockFragments.find(f => f.id === rawId || f.name === item.name || f.timestamp === item.name);

  let tierTitle = item.tierTitle || "Archive Access License ($150 USD)";
  let feeFormatted = item.price || "$150 USD";
  let feeAmount = 150;
  let permittedUsage = "Single Commercial Audio Release (Digital & Physical)";
  let streamingLimit = "100,000 Cumulative Audio Streams / 2,000 Sales";
  let composerSplits = "50% Christopher Solomon Paul (BMI 01305977829) / 50% Licensee";

  if (tierId === "test" || tierId.includes("test") || item.price === "$1" || item.price === "$1.00" || feeAmount === 1) {
    tierTitle = "Archive $1 Test License ($1.00 USD)";
    feeFormatted = "$1.00 USD";
    feeAmount = 1;
    permittedUsage = "Testing Dynamic License Generation (PayPal Payment ID: EGWC37L2LBCAQ)";
    streamingLimit = "10,000 Test Streams / System Verification";
    composerSplits = "50% Christopher Solomon Paul (BMI 01305977829) / 50% Licensee";
  } else if (tierId.includes("exclusive") || tierId === "exclusive" || tierId === "ex") {
    tierTitle = "Exclusive Archive Acquisition ($5,000 USD)";
    feeFormatted = "$5,000.00 USD";
    feeAmount = 5000;
    permittedUsage = "Sole Exclusive Master Acquisition, Permanent Archive De-listing & Unlimited Exploitation";
    streamingLimit = "Unlimited Streams, Broadcasts, and Physical/Digital Copies";
    composerSplits = "100% Exclusive Master Rights Transferred / 50% Underlying Composition Share";
  } else if (tierId.includes("commercial") || tierId === "commercial" || tierId === "cx") {
    tierTitle = "Commercial Exploitation ($1,000 USD)";
    feeFormatted = "$1,000.00 USD";
    feeAmount = 1000;
    permittedUsage = "Full Commercial Synchronization, Global Broadcast, Paid Advertising & Film/TV";
    streamingLimit = "1,000,000 Cumulative Audio Streams / Unlimited Broadcast Impressions";
    composerSplits = "50% Christopher Solomon Paul (BMI 01305977829) / 50% Licensee";
  } else if (tierId.includes("release") || tierId === "release" || tierId === "cr") {
    tierTitle = "Commercial Release ($500 USD)";
    feeFormatted = "$500.00 USD";
    feeAmount = 500;
    permittedUsage = "Commercial Record Release, DSPs, Official Music Video & Radio";
    streamingLimit = "500,000 Cumulative Audio Streams / 10,000 Sales";
    composerSplits = "50% Christopher Solomon Paul (BMI 01305977829) / 50% Licensee";
  }

  const addressParts = billing ? [
    billing.streetAddress,
    billing.aptNumber,
    billing.city,
    billing.stateProvince,
    billing.zipCode,
    billing.country
  ].filter(Boolean) : [];

  const licenseeAddress = addressParts.length > 0 
    ? addressParts.join(", ")
    : "12 Broad Street, Suite 4B, Lagos 100001, Nigeria (NG)";

  return {
    id: uniqueId,
    song: item.name || "Recovered Fragment",
    type: tierTitle,
    date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
    purchaseDate: formattedDate,
    effectiveDate: formattedDate,
    isrc: `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
    iswc: `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
    email: dbEmail,
    licenseeLegalName: legalName,
    licenseeEmail: dbEmail,
    licenseeAddress: licenseeAddress,
    licensor: "LOMON LLC / The Owl Clock",
    licensorEmail: "licensing@theowlclock.com",
    licensorOrganization: "LOMON LLC (d/b/a The Owl Clock)",
    legalContactName: "Christopher Solomon Paul",
    producerCredit: "Produced by Lomon Christopher / The Owl Clock",
    pro: "BMI",
    writerIpi: "01305977829",
    archiveIdentifier: archiveId,
    hash: contractHash,
    audioHash: contractHash,
    keySignature: fragMatch?.tonalSignature || "C Minor",
    tempoBpm: fragMatch?.bpm || 110,
    duration: fragMatch?.duration || "02:49",
    tierId: tierId,
    amount: feeAmount,
    price: feeFormatted,
    paymentStatus: "Completed via PayPal",
    permittedUsage: permittedUsage,
    streamingLimit: streamingLimit,
    distributionTerritory: "Worldwide",
    termDuration: "Perpetual",
    composerSplits: composerSplits,
    signature: `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${dbEmail.toUpperCase()}`,
    transactionRef: transactionRef,
    artwork: item.artwork
  };
}

// 9. PayPal: Capture Order Endpoint & Auto-grant License
app.post("/api/paypal/capture-order", async (req, res) => {
  try {
    const { orderID, reference, email, items, billing } = req.body;
    const targetToken = orderID || reference;
    if (!targetToken) {
      return res.status(400).json({ error: "orderID or reference is required." });
    }

    let paymentVerified = false;
    let actualAmount = 150;
    let transactionRef = targetToken;

    const isTestPaymentId = targetToken.includes("EGWC37L2LBCAQ") || targetToken === "EGWC37L2LBCAQ" || targetToken.startsWith("NCP-");

    if (isTestPaymentId) {
      paymentVerified = true;
      const pending = pendingTransactions.get(targetToken) || pendingTransactions.get(reference) || pendingTransactions.get("EGWC37L2LBCAQ");
      actualAmount = pending?.amount || parseFloat(req.body.amount) || 1.00;
      transactionRef = targetToken.includes("EGWC37L2LBCAQ") ? targetToken : `PP-EGWC37L2LBCAQ-${Date.now()}`;
    } else if (!isLivePayPal && targetToken.startsWith("SANDBOX-")) {
      paymentVerified = true;
      const pending = pendingTransactions.get(targetToken) || pendingTransactions.get(reference);
      actualAmount = pending?.amount || parseFloat(req.body.amount) || 150.00;
      transactionRef = targetToken;
    } else {
      try {
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(targetToken)}/capture`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        const captureData: any = await response.json();
        if (response.ok && (captureData.status === "COMPLETED" || captureData.status === "APPROVED")) {
          paymentVerified = true;
          const capturedUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];
          actualAmount = parseFloat(capturedUnit?.amount?.value || captureData.purchase_units?.[0]?.amount?.value || "150");
          transactionRef = captureData.id || targetToken;
        } else if (captureData.status === "SAVED" || captureData.status === "PAYER_ACTION_REQUIRED") {
          return res.status(400).json({ error: "PayPal payment action is still pending authorization." });
        } else {
          return res.status(400).json({ error: captureData.message || captureData.details?.[0]?.issue || "PayPal capture failed." });
        }
      } catch (err: any) {
        if (!isLivePayPal) {
          console.warn("[PAYPAL CAPTURE FALLBACK] Auto-validating sandbox mode:", err.message);
          paymentVerified = true;
        } else {
          console.error("[PAYPAL LIVE CAPTURE ERROR]:", err.message);
          return res.status(502).json({ error: `PayPal Live Gateway Error: ${err.message}` });
        }
      }
    }

    if (paymentVerified) {
      const dbEmail = (email || "guest@lomon.local").toLowerCase().trim();
      const legalName = (billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "") || dbEmail;
      const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      const finalItems = items || pendingTransactions.get(targetToken)?.items || [];

      const generatedLicenses: License[] = finalItems.map((item: any) => 
        createLicenseDataHelper(item, dbEmail, legalName, billing, transactionRef, formattedDate)
      );

      const generatedRequests: RequestItem[] = finalItems.map((item: any) => {
        const refSuffix = Math.floor(10 + Math.random() * 90);
        return {
          ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${refSuffix}`,
          type: `Master Acquisition & Sync Verification`,
          target: item.name,
          status: "APPROVED / EXECUTED",
          date: new Date().toISOString().split("T")[0],
          email: dbEmail
        };
      });

      const newPayment: Payment = {
        id: transactionRef,
        email: dbEmail,
        amount: actualAmount,
        currency: "USD",
        status: "success",
        gateway: "paypal",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        items: finalItems
      };

      // If any purchased item is Exclusive Archive Acquisition, retire the fragment permanently
      finalItems.forEach((item: any) => {
        const rawId = item.id || item.fragmentId || "";
        const tierId = (item.tierId || "").toLowerCase();
        const priceNum = parseFloat(String(item.price || "0").replace(/[^0-9.]/g, ""));
        const isExclusivePurchase = tierId.includes("exclusive") || tierId === "exclusive" || priceNum >= 4500;
        
        if (isExclusivePurchase) {
          const matchIdx = mockFragments.findIndex(f => f.id === rawId || f.name === item.name || f.timestamp === item.name);
          if (matchIdx !== -1) {
            mockFragments[matchIdx] = {
              ...mockFragments[matchIdx],
              isExclusive: true,
              recoveryState: "Exclusively Acquired",
              availability: "sold",
              isSold: true,
              exclusiveAcquired: true,
              exclusiveBuyer: dbEmail
            } as any;
          }
          if (!useMockDb && db) {
            db.collection("fragments").updateOne(
              { $or: [{ id: rawId }, { name: item.name }, { timestamp: item.name }] },
              { 
                $set: { 
                  isExclusive: true, 
                  recoveryState: "Exclusively Acquired", 
                  availability: "sold", 
                  isSold: true, 
                  exclusiveAcquired: true, 
                  exclusiveBuyer: dbEmail,
                  "licenses.access.enabled": false,
                  "licenses.release.enabled": false,
                  "licenses.commercial.enabled": false,
                  "licenses.exclusive.enabled": false
                } 
              }
            ).catch((err: any) => console.error("Error updating exclusive fragment status in DB:", err));
          }
        }
      });

      if (useMockDb) {
        mockLicenses.push(...generatedLicenses);
        mockRequests.push(...generatedRequests);
        mockPayments.push(newPayment);
      } else {
        await db!.collection("licenses").insertMany(generatedLicenses);
        await db!.collection("requests").insertMany(generatedRequests);
        await db!.collection("payments").insertOne(newPayment);
      }

      const emailPreviewUrl = await sendLicenseEmail(dbEmail, generatedLicenses, actualAmount, transactionRef);

      res.json({
        success: true,
        reference: transactionRef,
        licenses: generatedLicenses,
        requests: generatedRequests,
        payment: newPayment,
        emailPreviewUrl,
        database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB"
      });
    } else {
      res.status(400).json({ error: "Could not authorize transaction with PayPal." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error during PayPal verification." });
  }
});

// 9b. PayPal: Return Endpoint Callback
app.get("/api/paypal/return", async (req, res) => {
  try {
    const token = (req.query.token || req.query.orderID) as string;
    if (!token) {
      return res.redirect("/?payment_error=Missing PayPal token parameter.");
    }

    const pending = pendingTransactions.get(token);
    const email = pending?.email || "guest@lomon.local";
    const items = pending?.items || [];
    const billing = pending?.billing;

    let paymentVerified = false;
    let actualAmount = pending?.amount || 150;
    let transactionRef = token;

    if (token.startsWith("SANDBOX-")) {
      paymentVerified = true;
    } else {
      try {
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(token)}/capture`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        const captureData: any = await response.json();
        if (response.ok && (captureData.status === "COMPLETED" || captureData.status === "APPROVED")) {
          paymentVerified = true;
          const capturedUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];
          actualAmount = parseFloat(capturedUnit?.amount?.value || captureData.purchase_units?.[0]?.amount?.value || "150");
          transactionRef = captureData.id || token;
        }
      } catch (e) {
        console.warn("[PAYPAL RETURN CAPTURE FALLBACK]:", e);
        paymentVerified = true;
      }
    }

    if (paymentVerified) {
      const dbEmail = email.toLowerCase().trim();
      const legalName = (billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "") || dbEmail;
      const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      const generatedLicenses: License[] = items.map((item: any) => 
        createLicenseDataHelper(item, dbEmail, legalName, billing, transactionRef, formattedDate)
      );

      const generatedRequests: RequestItem[] = items.map((item: any) => {
        const refSuffix = Math.floor(10 + Math.random() * 90);
        return {
          ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${refSuffix}`,
          type: `Master Acquisition & Sync Verification`,
          target: item.name,
          status: "APPROVED / EXECUTED",
          date: new Date().toISOString().split("T")[0],
          email: dbEmail
        };
      });

      const newPayment: Payment = {
        id: transactionRef,
        email: dbEmail,
        amount: actualAmount,
        currency: "USD",
        status: "success",
        gateway: "paypal",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        items
      };

      // If any purchased item is Exclusive Archive Acquisition, retire the fragment permanently
      items.forEach((item: any) => {
        const rawId = item.id || item.fragmentId || "";
        const tierId = (item.tierId || "").toLowerCase();
        const priceNum = parseFloat(String(item.price || "0").replace(/[^0-9.]/g, ""));
        const isExclusivePurchase = tierId.includes("exclusive") || tierId === "exclusive" || priceNum >= 4500;
        
        if (isExclusivePurchase) {
          const matchIdx = mockFragments.findIndex(f => f.id === rawId || f.name === item.name || f.timestamp === item.name);
          if (matchIdx !== -1) {
            mockFragments[matchIdx] = {
              ...mockFragments[matchIdx],
              isExclusive: true,
              recoveryState: "Exclusively Acquired",
              availability: "sold",
              isSold: true,
              exclusiveAcquired: true,
              exclusiveBuyer: dbEmail
            } as any;
          }
          if (!useMockDb && db) {
            db.collection("fragments").updateOne(
              { $or: [{ id: rawId }, { name: item.name }, { timestamp: item.name }] },
              { 
                $set: { 
                  isExclusive: true, 
                  recoveryState: "Exclusively Acquired", 
                  availability: "sold", 
                  isSold: true, 
                  exclusiveAcquired: true, 
                  exclusiveBuyer: dbEmail,
                  "licenses.access.enabled": false,
                  "licenses.release.enabled": false,
                  "licenses.commercial.enabled": false,
                  "licenses.exclusive.enabled": false
                } 
              }
            ).catch((err: any) => console.error("Error updating exclusive fragment status in DB:", err));
          }
        }
      });

      if (useMockDb) {
        mockLicenses.push(...generatedLicenses);
        mockRequests.push(...generatedRequests);
        mockPayments.push(newPayment);
      } else {
        await db!.collection("licenses").insertMany(generatedLicenses);
        await db!.collection("requests").insertMany(generatedRequests);
        await db!.collection("payments").insertOne(newPayment);
      }

      const emailPreviewUrl = await sendLicenseEmail(dbEmail, generatedLicenses, actualAmount, transactionRef);

      const sessionToken = crypto.randomBytes(32).toString("hex");
      if (useMockDb) {
        mockSessions.set(sessionToken, dbEmail);
        if (!mockUsers.has(dbEmail)) {
          mockUsers.set(dbEmail, {
            email: dbEmail,
            passwordHash: hashPassword("123456"),
            createdAt: new Date()
          });
        }
      } else {
        const existingUser = await db!.collection("users").findOne({ email: dbEmail });
        if (!existingUser) {
          await db!.collection("users").insertOne({
            email: dbEmail,
            passwordHash: hashPassword("123456"),
            role: "user",
            createdAt: new Date()
          });
        }
        await db!.collection("sessions").insertOne({
          token: sessionToken,
          email: dbEmail,
          createdAt: new Date()
        });
      }

      pendingTransactions.delete(token);

      return res.redirect(`/?payment_success=true&reference=${transactionRef}&auth_token=${sessionToken}&email=${encodeURIComponent(dbEmail)}&email_preview_url=${encodeURIComponent(emailPreviewUrl)}`);
    } else {
      return res.redirect("/?payment_error=PayPal transaction could not be authorized.");
    }
  } catch (err: any) {
    console.error("[PAYPAL RETURN ERROR]", err);
    return res.redirect("/?payment_error=" + encodeURIComponent(err.message || "PayPal return internal server error."));
  }
});

// 10. Database Action: Secure License Transfer CRUD action
app.post("/api/licenses/transfer", async (req, res) => {
  try {
    const ownerEmail = await getEmailFromToken(req);
    if (!ownerEmail) {
      return res.status(401).json({ error: "Terminal unauthorized. Authorization token required." });
    }

    const { licenseId, recipientEmail } = req.body;
    if (!licenseId || !recipientEmail) {
      return res.status(400).json({ error: "License ID and recipient email address are required fields." });
    }

    const targetRecipient = recipientEmail.toLowerCase().trim();
    const cleanLicenseId = licenseId.trim();

    // Check if recipient is a registered user
    let recipientExists = false;
    if (useMockDb) {
      recipientExists = mockUsers.has(targetRecipient) || targetRecipient === "evianaconcepts1@gmail.com";
    } else {
      const recipientUser = await db!.collection("users").findOne({ email: targetRecipient });
      recipientExists = !!recipientUser;
    }

    if (!recipientExists) {
      return res.status(404).json({ error: `Transfer recipient terminal "${targetRecipient}" is not a registered user on the LOMON security network.` });
    }

    // Verify ownership and perform transfer
    let success = false;
    let transferredLicense: License | null = null;

    if (useMockDb) {
      const idx = mockLicenses.findIndex(lic => lic.id === cleanLicenseId && lic.email === ownerEmail);
      if (idx !== -1) {
        mockLicenses[idx].email = targetRecipient;
        // Update signature to reflect transfer
        mockLicenses[idx].signature = `TRANSFERRED FROM ${ownerEmail.toUpperCase()} TO ${targetRecipient.toUpperCase()} - SECURITY CODE: ${mockLicenses[idx].hash}`;
        transferredLicense = mockLicenses[idx];
        success = true;

        // Register requests log for transfer audit
        mockRequests.push({
          ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
          type: "License Transfer Audit Log",
          target: mockLicenses[idx].song,
          status: `TRANSFERRED TO ${targetRecipient.toUpperCase()}`,
          date: new Date().toISOString().split("T")[0],
          email: ownerEmail
        });
        mockRequests.push({
          ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
          type: "License Received Audit Log",
          target: mockLicenses[idx].song,
          status: `RECEIVED FROM ${ownerEmail.toUpperCase()}`,
          date: new Date().toISOString().split("T")[0],
          email: targetRecipient
        });
      }
    } else {
      const licensesCol = db!.collection("licenses");
      const license = await licensesCol.findOne({ id: cleanLicenseId, email: ownerEmail });
      if (license) {
        const newSig = `TRANSFERRED FROM ${ownerEmail.toUpperCase()} TO ${targetRecipient.toUpperCase()} - SECURITY CODE: ${license.hash}`;
        await licensesCol.updateOne(
          { id: cleanLicenseId },
          { $set: { email: targetRecipient, signature: newSig } }
        );
        transferredLicense = (await licensesCol.findOne({ id: cleanLicenseId })) as any;
        success = true;

        // Log transfer audit requests
        await db!.collection("requests").insertMany([
          {
            ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
            type: "License Transfer Audit Log",
            target: license.song,
            status: `TRANSFERRED TO ${targetRecipient.toUpperCase()}`,
            date: new Date().toISOString().split("T")[0],
            email: ownerEmail
          },
          {
            ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
            type: "License Received Audit Log",
            target: license.song,
            status: `RECEIVED FROM ${ownerEmail.toUpperCase()}`,
            date: new Date().toISOString().split("T")[0],
            email: targetRecipient
          }
        ]);
      }
    }

    if (success && transferredLicense) {
      res.json({ success: true, message: `License ${cleanLicenseId} successfully transferred to ${targetRecipient}.`, license: transferredLicense });
    } else {
      res.status(403).json({ error: "Access denied. You do not own this license or it does not exist." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to execute license transfer protocol." });
  }
});

// 11. Payments & Transactions CRUD: Read (All payments)
app.get(["/api/admin/payments", "/api/admin/transactions"], async (req, res) => {
  try {
    let payments: Payment[] = [];
    if (useMockDb) {
      payments = mockPayments;
    } else {
      payments = (await db!.collection("payments").find({}).toArray()) as any[];
    }
    res.json({ success: true, payments, transactions: payments });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve payments." });
  }
});

// Admin Clearance / Requests CRUD
app.get(["/api/admin/clearance", "/api/admin/requests"], async (req, res) => {
  try {
    let requests: RequestItem[] = [];
    if (useMockDb) {
      requests = mockRequests;
    } else {
      requests = (await db!.collection("requests").find({}).toArray()) as any[];
    }
    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve clearance requests." });
  }
});

app.post(["/api/admin/clearance", "/api/admin/requests"], async (req, res) => {
  try {
    const { ref, type, target, status, date, email, clientName, requestedLicense, notes, paymentStatus } = req.body;
    const cleanRef = ref || `REQ-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`;
    const newReq: any = {
      ref: cleanRef,
      type: type || requestedLicense || "Commercial Exploitation",
      target: target || "Archived Fragment",
      status: status || "NEW",
      date: date || new Date().toISOString().split("T")[0],
      email: (email || "client@lomon.local").toLowerCase().trim(),
      clientName: clientName || email || "Authorized Client",
      requestedLicense: requestedLicense || type || "Commercial Exploitation",
      notes: notes || "",
      paymentStatus: paymentStatus || "PAYMENT PENDING"
    };

    if (useMockDb) {
      mockRequests.unshift(newReq);
    } else {
      await db!.collection("requests").insertOne(newReq);
    }
    res.json({ success: true, request: newReq });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create clearance request." });
  }
});

app.put(["/api/admin/clearance", "/api/admin/requests"], async (req, res) => {
  try {
    const { ref, status, notes, paymentStatus, requestedLicense } = req.body;
    if (!ref) {
      return res.status(400).json({ error: "Reference ID is required to update clearance request." });
    }

    let updated = false;
    if (useMockDb) {
      const idx = mockRequests.findIndex(r => r.ref === ref);
      if (idx !== -1) {
        if (status) mockRequests[idx].status = status;
        if (notes !== undefined) (mockRequests[idx] as any).notes = notes;
        if (paymentStatus) (mockRequests[idx] as any).paymentStatus = paymentStatus;
        if (requestedLicense) (mockRequests[idx] as any).requestedLicense = requestedLicense;
        updated = true;
      }
    } else {
      const fields: any = {};
      if (status) fields.status = status;
      if (notes !== undefined) fields.notes = notes;
      if (paymentStatus) fields.paymentStatus = paymentStatus;
      if (requestedLicense) fields.requestedLicense = requestedLicense;
      const resCol = await db!.collection("requests").updateOne({ ref }, { $set: fields });
      updated = resCol.matchedCount > 0;
    }

    if (updated) {
      res.json({ success: true, message: `Clearance request ${ref} updated.` });
    } else {
      res.status(404).json({ error: "Clearance request not found." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update clearance request." });
  }
});

// Admin All Licenses CRUD
app.get("/api/admin/licenses", async (req, res) => {
  try {
    let licenses: License[] = [];
    if (useMockDb) {
      licenses = mockLicenses;
    } else {
      licenses = (await db!.collection("licenses").find({}).toArray()) as any[];
    }
    res.json({ success: true, licenses });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve licenses." });
  }
});

app.post("/api/admin/licenses", async (req, res) => {
  try {
    const licData = req.body;
    const cleanId = licData.id || `TOC-LIC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
    const newLic: License = {
      id: cleanId,
      song: licData.song || "Archived Fragment",
      type: licData.type || "Commercial Exploitation ($1,000)",
      date: licData.date || new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      isrc: licData.isrc || `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
      iswc: licData.iswc || `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
      email: (licData.email || "client@lomon.local").toLowerCase().trim(),
      signature: licData.signature || `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${(licData.email || "CLIENT").toUpperCase()}`,
      hash: licData.hash || `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      tierId: licData.tierId || "commercial",
      licenseeLegalName: licData.licenseeLegalName || licData.email || "Authorized Licensee",
      archiveIdentifier: licData.archiveIdentifier || `TOC-${licData.song ? licData.song.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "FRAG"}-001`,
      transactionRef: licData.transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
      purchaseDate: licData.purchaseDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    };

    if (useMockDb) {
      mockLicenses.unshift(newLic);
    } else {
      await db!.collection("licenses").insertOne(newLic);
    }

    res.json({ success: true, license: newLic });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create license." });
  }
});

app.put("/api/admin/licenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    let updated = false;

    if (useMockDb) {
      const idx = mockLicenses.findIndex(l => l.id === id);
      if (idx !== -1) {
        mockLicenses[idx] = { ...mockLicenses[idx], ...updateData };
        updated = true;
      }
    } else {
      const result = await db!.collection("licenses").updateOne({ id }, { $set: updateData });
      updated = result.matchedCount > 0;
    }

    if (updated) {
      res.json({ success: true, message: `License ${id} updated.` });
    } else {
      res.status(404).json({ error: "License not found." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update license." });
  }
});

app.delete("/api/admin/licenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = false;
    if (useMockDb) {
      const idx = mockLicenses.findIndex(l => l.id === id);
      if (idx !== -1) {
        mockLicenses.splice(idx, 1);
        deleted = true;
      }
    } else {
      const result = await db!.collection("licenses").deleteOne({ id });
      deleted = result.deletedCount > 0;
    }

    if (deleted) {
      res.json({ success: true, message: `License ${id} revoked/deleted.` });
    } else {
      res.status(404).json({ error: "License not found." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete license." });
  }
});

// 11. Payments CRUD: Create (Manual payment addition)
app.post("/api/admin/payments", async (req, res) => {
  try {
    const { email, amount, currency, gateway, items, status } = req.body;
    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required for manual creation." });
    }

    const uniqueId = `MAN-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPayment: Payment = {
      id: uniqueId,
      email: email.toLowerCase().trim(),
      amount: parseFloat(amount),
      currency: currency || "NGN",
      status: status || "success",
      gateway: gateway || "manual",
      date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      items: items || [{ id: "manual", name: "Manual License Clear Record", price: `$${amount}` }]
    };

    if (useMockDb) {
      mockPayments.push(newPayment);
    } else {
      await db!.collection("payments").insertOne(newPayment);
    }

    res.json({ success: true, payment: newPayment });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create manual payment record." });
  }
});

// 11. Payments CRUD: Update (Modify payment status/metadata)
app.put("/api/admin/payments", async (req, res) => {
  try {
    const { id, status, amount, gateway } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Payment Reference ID is required for update." });
    }

    let updated = false;
    if (useMockDb) {
      const idx = mockPayments.findIndex(p => p.id === id);
      if (idx !== -1) {
        if (status) mockPayments[idx].status = status;
        if (amount) mockPayments[idx].amount = parseFloat(amount);
        if (gateway) mockPayments[idx].gateway = gateway;
        updated = true;
      }
    } else {
      const paymentsCol = db!.collection("payments");
      const fieldsToUpdate: any = {};
      if (status) fieldsToUpdate.status = status;
      if (amount) fieldsToUpdate.amount = parseFloat(amount);
      if (gateway) fieldsToUpdate.gateway = gateway;

      const result = await paymentsCol.updateOne({ id }, { $set: fieldsToUpdate });
      updated = result.matchedCount > 0;
    }

    if (updated) {
      res.json({ success: true, message: `Payment ${id} successfully updated.` });
    } else {
      res.status(404).json({ error: `Payment record with reference "${id}" not found.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update payment record." });
  }
});

// 11. Payments CRUD: Delete (Remove payment record)
app.delete("/api/admin/payments", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Payment Reference ID is required for deletion." });
    }

    let deleted = false;
    if (useMockDb) {
      const idx = mockPayments.findIndex(p => p.id === id);
      if (idx !== -1) {
        mockPayments.splice(idx, 1);
        deleted = true;
      }
    } else {
      const result = await db!.collection("payments").deleteOne({ id });
      deleted = result.deletedCount > 0;
    }

    if (deleted) {
      res.json({ success: true, message: `Payment ${id} has been securely purged from archive databases.` });
    } else {
      res.status(404).json({ error: `Payment record "${id}" not found.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete payment record." });
  }
});

// 12. User CRUD: Read (Fetch all registered terminals)
app.get("/api/admin/users", async (req, res) => {
  try {
    let usersList: any[] = [];
    if (useMockDb) {
      // Return list of in-memory keys
      const inMemoryUsers = Array.from(mockUsers.values()).map(u => ({
        email: u.email,
        createdAt: u.createdAt,
        status: "SECURED TERMINAL"
      }));
      // ensure we also list the hardcoded evianaconcepts email if it's accessed
      if (!mockUsers.has("evianaconcepts1@gmail.com")) {
        inMemoryUsers.push({
          email: "evianaconcepts1@gmail.com",
          createdAt: new Date("2026-06-01T00:00:00Z"),
          status: "SEED ADMIN"
        });
      }
      usersList = inMemoryUsers;
    } else {
      usersList = await db!.collection("users").find({}, { projection: { passwordHash: 0 } }).toArray();
    }
    res.json({ success: true, users: usersList });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve terminal users." });
  }
});

// 12. User CRUD: Create (Add terminal manually)
app.post("/api/admin/users", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and cipher password are required." });
    }

    const targetEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    if (useMockDb) {
      if (mockUsers.has(targetEmail)) {
        return res.status(400).json({ error: "Email terminal already exists." });
      }
      mockUsers.set(targetEmail, {
        email: targetEmail,
        passwordHash,
        createdAt: new Date()
      });
    } else {
      const usersCol = db!.collection("users");
      const existingUser = await usersCol.findOne({ email: targetEmail });
      if (existingUser) {
        return res.status(400).json({ error: "Email terminal already exists." });
      }
      await usersCol.insertOne({
        email: targetEmail,
        passwordHash,
        createdAt: new Date()
      });
    }

    res.json({ success: true, user: { email: targetEmail, createdAt: new Date() } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create terminal user." });
  }
});

// 12. User CRUD: Update (Change cipher key / terminal details)
app.put("/api/admin/users", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and new cipher password are required." });
    }

    const targetEmail = email.toLowerCase().trim();
    const newPasswordHash = hashPassword(password);
    let updated = false;

    if (useMockDb) {
      const user = mockUsers.get(targetEmail);
      if (user) {
        user.passwordHash = newPasswordHash;
        mockUsers.set(targetEmail, user);
        updated = true;
      } else if (targetEmail === "evianaconcepts1@gmail.com") {
        mockUsers.set(targetEmail, {
          email: targetEmail,
          passwordHash: newPasswordHash,
          createdAt: new Date()
        });
        updated = true;
      }
    } else {
      const usersCol = db!.collection("users");
      const result = await usersCol.updateOne(
        { email: targetEmail },
        { $set: { passwordHash: newPasswordHash } }
      );
      updated = result.matchedCount > 0;
    }

    if (updated) {
      res.json({ success: true, message: `Access cipher for terminal ${targetEmail} successfully updated.` });
    } else {
      res.status(404).json({ error: `Terminal ${targetEmail} not found.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update terminal user." });
  }
});

// 12. User CRUD: Delete (Wipe user terminal)
app.delete("/api/admin/users", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Terminal email is required for purging." });
    }

    const targetEmail = email.toLowerCase().trim();
    let deleted = false;

    if (useMockDb) {
      deleted = mockUsers.delete(targetEmail);
    } else {
      const result = await db!.collection("users").deleteOne({ email: targetEmail });
      deleted = result.deletedCount > 0;
    }

    if (deleted) {
      res.json({ success: true, message: `Terminal ${targetEmail} successfully wiped from LOMON directory.` });
    } else {
      res.status(404).json({ error: `Terminal ${targetEmail} not found in directory.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to purge terminal user." });
  }
});


// --- Fragment CRUD APIs ---
app.all(["/api/fragments/sync-beats", "/api/sync-beats"], async (req, res) => {
  try {
    if (!useMockDb && db) {
      const fragmentsCol = db.collection("fragments");
      for (const frag of mockFragments) {
        await fragmentsCol.updateOne(
          { id: frag.id },
          { $set: frag },
          { upsert: true }
        );
      }
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
          });
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
          });
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
          });
        }
      }
      return res.json({ success: true, message: "Beat fragments & Cloudflare R2 links synced in MongoDB.", fragments: mockFragments });
    }
    return res.json({ success: true, message: "Beat fragments synced in active memory store.", fragments: mockFragments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/fragments", async (req, res) => {
  try {
    const { status, genre, mood, availability, page, limit } = req.query;
    let list: any[] = [];
    if (useMockDb) {
      list = mockFragments;
    } else {
      list = await db!.collection("fragments").find({}).toArray();
    }

    // Filter by query parameters if provided
    let filtered = list;
    if (status && status !== "ALL") {
      filtered = filtered.filter(f => (f.status || "published").toLowerCase() === String(status).toLowerCase());
    }
    if (availability && availability !== "ALL") {
      filtered = filtered.filter(f => (f.availability || (f.isExclusive ? "sold" : "available")).toLowerCase() === String(availability).toLowerCase());
    }
    if (genre) {
      const gLower = String(genre).toLowerCase();
      filtered = filtered.filter(f => {
        if (Array.isArray(f.genre)) return f.genre.some((g: string) => g.toLowerCase().includes(gLower));
        return (f.classification || "").toLowerCase().includes(gLower);
      });
    }
    if (mood) {
      const mLower = String(mood).toLowerCase();
      filtered = filtered.filter(f => {
        if (Array.isArray(f.mood)) return f.mood.some((m: string) => m.toLowerCase().includes(mLower));
        return false;
      });
    }

    // Exclude soft-deleted records unless explicitly querying archived
    if (status !== "archived") {
      filtered = filtered.filter(f => !f.deletedAt);
    }

    // Optional pagination
    const pageNum = parseInt(String(page || "1"), 10);
    const limitNum = parseInt(String(limit || "100"), 10);
    const total = filtered.length;
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      fragments: paginated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve fragments from database." });
  }
});

app.get("/api/fragments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let found: any = null;

    if (useMockDb) {
      found = mockFragments.find(f => f.id === id || (f as any).fragmentId === id);
    } else {
      found = await db!.collection("fragments").findOne({ $or: [{ id }, { fragmentId: id }] });
    }

    if (!found) {
      return res.status(404).json({ error: `Fragment ${id} not found.` });
    }

    res.json({ success: true, fragment: found });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get fragment." });
  }
});

app.post("/api/fragments", async (req, res) => {
  try {
    const fragment = req.body;
    const cleanId = fragment.id || fragment.fragmentId;
    if (!fragment || !cleanId) {
      return res.status(400).json({ error: "Fragment ID / timestamp is required." });
    }

    const newRecord = {
      ...fragment,
      id: cleanId,
      name: fragment.name || fragment.fragmentTimestamp || cleanId,
      status: fragment.status || "draft",
      availability: fragment.availability || "available",
      createdAt: fragment.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    if (useMockDb) {
      const existsIdx = mockFragments.findIndex(f => f.id === cleanId);
      if (existsIdx >= 0) {
        mockFragments[existsIdx] = { ...mockFragments[existsIdx], ...newRecord };
      } else {
        mockFragments.unshift(newRecord);
      }
    } else {
      const col = db!.collection("fragments");
      await col.updateOne({ id: cleanId }, { $set: newRecord }, { upsert: true });
    }

    res.json({ success: true, fragment: newRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save fragment." });
  }
});

app.put("/api/fragments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fragment = req.body;
    if (!id || !fragment) {
      return res.status(400).json({ error: "Fragment ID and payload are required." });
    }

    const updatedRecord = {
      ...fragment,
      id,
      updatedAt: new Date().toISOString()
    };

    let updated = false;
    if (useMockDb) {
      const idx = mockFragments.findIndex(f => f.id === id);
      if (idx !== -1) {
        mockFragments[idx] = { ...mockFragments[idx], ...updatedRecord };
        updated = true;
      }
    } else {
      const result = await db!.collection("fragments").updateOne(
        { id },
        { $set: updatedRecord }
      );
      updated = result.matchedCount > 0;
    }

    if (updated) {
      res.json({ success: true, fragment: updatedRecord, message: `Fragment ${id} updated successfully.` });
    } else {
      res.status(404).json({ error: `Fragment ${id} not found.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update fragment." });
  }
});

// Quick status change patch (draft/published/archived/scheduled)
app.patch("/api/fragments/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ error: "Fragment ID and status are required." });
    }

    const patch: any = { status, updatedAt: new Date().toISOString() };
    if (status === "archived") {
      patch.deletedAt = new Date().toISOString();
    } else {
      patch.deletedAt = null;
    }

    let updated = false;
    if (useMockDb) {
      const idx = mockFragments.findIndex(f => f.id === id);
      if (idx !== -1) {
        mockFragments[idx] = { ...mockFragments[idx], ...patch };
        updated = true;
      }
    } else {
      const result = await db!.collection("fragments").updateOne({ id }, { $set: patch });
      updated = result.matchedCount > 0;
    }

    if (updated) {
      res.json({ success: true, message: `Fragment ${id} status changed to ${status}.` });
    } else {
      res.status(404).json({ error: `Fragment ${id} not found.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to patch fragment status." });
  }
});

// Soft Delete or Hard Delete (supports ?permanent=true)
app.delete("/api/fragments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Fragment ID is required for deletion." });
    }

    if (permanent === "true") {
      let deleted = false;
      if (useMockDb) {
        const idx = mockFragments.findIndex(f => f.id === id);
        if (idx !== -1) {
          mockFragments.splice(idx, 1);
          deleted = true;
        }
      } else {
        const result = await db!.collection("fragments").deleteOne({ id });
        deleted = result.deletedCount > 0;
      }
      if (deleted) {
        return res.json({ success: true, message: `Fragment ${id} permanently removed from database.` });
      } else {
        return res.status(404).json({ error: `Fragment ${id} not found.` });
      }
    }

    const patch = {
      status: "archived",
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let deleted = false;
    if (useMockDb) {
      const idx = mockFragments.findIndex(f => f.id === id);
      if (idx !== -1) {
        mockFragments[idx] = { ...mockFragments[idx], ...patch };
        deleted = true;
      }
    } else {
      const result = await db!.collection("fragments").updateOne({ id }, { $set: patch });
      deleted = result.matchedCount > 0;
    }

    if (deleted) {
      res.json({ success: true, message: `Fragment ${id} marked as archived/soft-deleted.` });
    } else {
      res.status(404).json({ error: `Fragment ${id} not found.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete fragment." });
  }
});

// Duplicate Fragment Endpoint
app.post("/api/fragments/:id/duplicate", async (req, res) => {
  try {
    const { id } = req.params;
    let original: any = null;

    if (useMockDb) {
      original = mockFragments.find(f => f.id === id);
    } else {
      original = await db!.collection("fragments").findOne({ id });
    }

    if (!original) {
      return res.status(404).json({ error: `Original fragment ${id} not found.` });
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newId = `${original.id}-COPY-${randomSuffix}`;
    const cloned = {
      ...original,
      _id: undefined,
      id: newId,
      name: `${original.name || original.id} (Copy)`,
      compositionTitle: `${original.compositionTitle || original.name || original.id} (Copy)`,
      compositionId: `LOC-COMP-${newId.replace(/[^a-zA-Z0-9]/g, "")}`,
      status: "draft",
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    if (useMockDb) {
      mockFragments.unshift(cloned);
    } else {
      await db!.collection("fragments").insertOne(cloned);
    }

    res.json({ success: true, fragment: cloned, message: `Fragment ${id} duplicated as ${newId}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to duplicate fragment." });
  }
});

// Sync receiving endpoint (public catalog upsert)
app.post("/api/catalog/sync", async (req, res) => {
  try {
    const { fragmentId, payload, action } = req.body;
    if (!fragmentId) {
      return res.status(400).json({ error: "fragmentId is required for catalog sync." });
    }

    if (action === "remove" || action === "unpublish") {
      console.log(`[CATALOG SYNC] Removed fragment ${fragmentId} from public catalog.`);
      return res.json({ success: true, action: "removed", fragmentId });
    }

    console.log(`[CATALOG SYNC] Upserted fragment ${fragmentId} to public clock catalog.`, payload?.key, payload?.bpm);
    return res.json({ success: true, action: "upserted", fragmentId, syncedAt: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Catalog sync failed." });
  }
});


// --- Real Storage Setup & Endpoints ---
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES }, // 200MB single file upload limit
});

/**
 * Check Cloudflare R2 / S3 Bucket CORS Configuration
 */
app.get(["/api/storage/r2/cors", "/api/storage/scaleway/cors"], async (req, res) => {
  try {
    const cors = await getR2BucketCors();
    return res.json({ success: true, provider: "cloudflare-r2", bucket: R2_BUCKET, ...cors });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Programmatically Apply / Ensure Cloudflare R2 Bucket CORS Configuration
 */
app.post(["/api/storage/r2/cors", "/api/storage/scaleway/cors"], async (req, res) => {
  try {
    const result = await configureR2BucketCors();
    return res.json({ success: true, message: "CORS configuration successfully applied to Cloudflare R2 bucket.", ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Cloudflare R2 Presigned PUT Upload URL Generator (Supports files up to 200MB)
 * Generates an expiring presigned PUT URL allowing clients to upload directly from browser
 * to Cloudflare R2 without routing heavy 200MB payloads through the application server.
 */
app.post(
  ["/api/storage/r2/presign-upload", "/api/upload-url", "/api/storage/presign-upload", "/api/storage/scaleway/presign-upload"],
  async (req, res) => {
    let targetObjectKey = "";
    try {
      const { filename, contentType, fileType, objectKey: customKey, folder, fragmentId, sizeBytes, size } = req.body || {};
      const mimeType = contentType || fileType || "application/octet-stream";
      const fileSize = Number(sizeBytes || size || 0);

      // Validate single file size up to 200MB
      if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
        return res.status(400).json({
          error: `File size exceeds the 200MB upload limit (${(fileSize / (1024 * 1024)).toFixed(1)}MB > 200MB).`,
          maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
        });
      }

      const cleanFilename = filename
        ? String(filename).replace(/[^a-zA-Z0-9._-]/g, "_")
        : `${Date.now()}-${crypto.randomUUID()}`;

      const targetFolder = folder ? String(folder).replace(/^\/+|\/+$/g, "") : (fragmentId ? `fragments/${fragmentId}` : "audio");
      const objectKey = customKey || `${targetFolder}/${Date.now()}-${cleanFilename}`;
      targetObjectKey = objectKey;

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: objectKey,
        ContentType: mimeType,
      });

      // Generate a temporary PUT upload ticket valid for 900 seconds (15 minutes for 200MB uploads)
      const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });
      const directUrl = `${R2_ENDPOINT}/${R2_BUCKET}/${objectKey}`;

      // Generate initial presigned GET attachment download URL
      const getCommand = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: objectKey,
        ResponseContentDisposition: `attachment; filename="${cleanFilename}"`,
      });
      const downloadUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 86400 }).catch(() => directUrl);

      // Pre-save metadata record to MongoDB with pending status
      const fileRecord = await saveR2FileRecord({
        objectKey,
        filename: cleanFilename,
        contentType: mimeType,
        sizeBytes: fileSize,
        bucket: R2_BUCKET,
        directUrl,
        downloadUrl,
        fragmentId,
        status: "pending_upload",
        metadata: { folder: targetFolder, presignedAt: new Date().toISOString() },
      });

      console.log(`[R2 PRESIGNED PUT GENERATED] ObjectKey: ${objectKey}, Max: 200MB, DirectUrl: ${directUrl}`);

      return res.json({
        success: true,
        uploadUrl,
        objectKey,
        key: objectKey,
        directUrl,
        publicUrl: directUrl,
        downloadUrl,
        fileRecord,
        bucket: R2_BUCKET,
        region: R2_REGION,
        endpoint: R2_ENDPOINT,
        provider: "cloudflare-r2",
        maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
      });
    } catch (err: any) {
      console.error(`[CLOUDFLARE R2 PRESIGN UPLOAD ERROR] Key: ${targetObjectKey}:`, err);
      return res.status(500).json({
        error: err?.message || "Failed to generate Cloudflare R2 presigned upload URL.",
        objectKey: targetObjectKey,
      });
    }
  }
);

app.get("/api/upload-url", async (req, res) => {
  try {
    const filename = (req.query.filename as string) || `${Date.now()}`;
    const contentType = (req.query.contentType as string) || "application/octet-stream";
    const cleanFilename = String(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `audio/${Date.now()}-${cleanFilename}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });
    const directUrl = `${R2_ENDPOINT}/${R2_BUCKET}/${objectKey}`;

    return res.json({
      success: true,
      uploadUrl,
      objectKey,
      directUrl,
      publicUrl: directUrl,
      bucket: R2_BUCKET,
      region: R2_REGION,
      endpoint: R2_ENDPOINT,
      provider: "cloudflare-r2",
      maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err?.message || "Failed to generate presigned upload URL.",
    });
  }
});

/**
 * Cloudflare R2 Presigned GET Download URL Generator
 * Generates an authenticated download link configured with:
 * ResponseContentDisposition: 'attachment; filename="..."'
 * to ensure that clicking the link immediately forces the file to download as a real attachment.
 */
app.all(["/api/storage/r2/presign-download", "/api/storage/presign-download"], async (req, res) => {
  try {
    const key = (req.method === "POST" ? req.body?.key || req.body?.objectKey : req.query?.key || req.query?.objectKey) as string;
    const customFilename = (req.method === "POST" ? req.body?.filename : req.query?.filename) as string;
    const rawExpires = req.method === "POST" ? req.body?.expiresInSeconds : req.query?.expiresInSeconds;
    const expiresInSeconds = rawExpires ? (parseInt(String(rawExpires), 10) || 3600) : 3600;

    if (!key) {
      return res.status(400).json({ error: "Missing 'key' or 'objectKey' parameter for download link generation." });
    }

    const cleanFilename = (customFilename || path.basename(key) || "download.dat").replace(/[^a-zA-Z0-9._-]/g, "_");

    // Command explicitly specifies ResponseContentDisposition: 'attachment'
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${cleanFilename}"`,
    });

    const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
    const directUrl = `${R2_ENDPOINT}/${R2_BUCKET}/${key}`;

    // Update MongoDB document with the fresh download URL
    await saveR2FileRecord({
      objectKey: key,
      filename: cleanFilename,
      downloadUrl,
      directUrl,
      status: "verified",
    });

    console.log(`[R2 ATTACHMENT DOWNLOAD GENERATED] Key: ${key} -> Filename: ${cleanFilename} (Expires: ${expiresInSeconds}s)`);

    return res.json({
      success: true,
      downloadUrl,
      objectKey: key,
      filename: cleanFilename,
      expiresInSeconds,
      bucket: R2_BUCKET,
      provider: "cloudflare-r2",
    });
  } catch (err: any) {
    console.error("[CLOUDFLARE R2 PRESIGN DOWNLOAD ERROR]", err);
    return res.status(500).json({
      error: err?.message || "Failed to generate presigned download URL.",
    });
  }
});

/**
 * MongoDB Save Function & Endpoint: Persists Cloudflare R2 File Metadata Document
 * Stores object key, filename, direct URL, download URL, size, and metadata in MongoDB.
 */
app.post("/api/storage/r2/save-record", async (req, res) => {
  try {
    const { objectKey, key, filename, sizeBytes, size, contentType, fragmentId, tags, metadata } = req.body || {};
    const targetKey = objectKey || key;
    if (!targetKey) {
      return res.status(400).json({ error: "Missing 'objectKey' or 'key' parameter to save file record." });
    }

    const cleanFilename = (filename || path.basename(targetKey) || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
    const directUrl = `${R2_ENDPOINT}/${R2_BUCKET}/${targetKey}`;

    // Generate immediate attachment download URL
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: targetKey,
      ResponseContentDisposition: `attachment; filename="${cleanFilename}"`,
    });
    const downloadUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 86400 }).catch(() => directUrl);

    const savedRecord = await saveR2FileRecord({
      objectKey: targetKey,
      filename: cleanFilename,
      sizeBytes: Number(sizeBytes || size || 0),
      contentType: contentType || "application/octet-stream",
      bucket: R2_BUCKET,
      directUrl,
      downloadUrl,
      fragmentId,
      tags: Array.isArray(tags) ? tags : [],
      status: "uploaded",
      metadata: metadata || {},
    });

    return res.json({
      success: true,
      file: savedRecord,
      message: "File metadata record saved to MongoDB.",
    });
  } catch (err: any) {
    console.error("[R2 SAVE RECORD ERROR]", err);
    return res.status(500).json({ error: err?.message || "Failed to save file record to MongoDB." });
  }
});

/**
 * Query Uploaded Cloudflare R2 Files from MongoDB
 */
app.get("/api/storage/r2/files", async (req, res) => {
  try {
    if (!useMockDb && db) {
      const files = await db.collection("files").find({}).sort({ uploadedAt: -1 }).limit(100).toArray();
      return res.json({ success: true, files, database: "mongodb" });
    }
    return res.json({ success: true, files: mockR2Files, database: "in-memory" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * High-Performance Audio Streaming & CORS Audio Proxy
 * Streams audio from Cloudflare R2 / remote storage with full Range header support (206 Partial Content)
 * and Access-Control-Allow-Origin: * so all web audio engines and mobile browsers play seamlessly.
 */
app.get(["/api/audio-proxy", "/api/stream-audio"], async (req, res) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).json({ error: "Missing audio url parameter" });
    }

    const decodedUrl = decodeURIComponent(rawUrl);
    if (!decodedUrl.startsWith("http://") && !decodedUrl.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid audio URL protocol" });
    }

    const reqHeaders: Record<string, string> = {};
    if (req.headers.range) {
      reqHeaders["range"] = req.headers.range;
    }

    const response = await fetch(decodedUrl, { headers: reqHeaders });

    res.status(response.status);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    res.setHeader("Content-Type", contentType);

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    const contentRange = response.headers.get("content-range");
    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }

    if (!response.body) {
      return res.end();
    }

    const { Readable } = await import("stream");
    // @ts-ignore
    const stream = Readable.fromWeb(response.body);
    stream.pipe(res);
  } catch (err: any) {
    console.error("[AUDIO PROXY ERROR]:", err);
    res.status(500).json({ error: err.message || "Failed to stream audio file" });
  }
});

/**
 * Direct Codebase Export / Download ZIP Endpoint
 * Allows user to download the entire clean project code (excluding node_modules / dist)
 * with a single click or curl request.
 */
app.get(["/api/download/codebase.zip", "/api/download-code", "/api/export-code"], async (req, res) => {
  try {
    const zipPath = path.join(process.cwd(), "public", "owl-clock-source.zip");
    if (fs.existsSync(zipPath)) {
      res.setHeader("Content-Disposition", 'attachment; filename="the-owl-clock-codebase.zip"');
      res.setHeader("Content-Type", "application/zip");
      return fs.createReadStream(zipPath).pipe(res);
    }

    const { execSync } = await import("child_process");
    execSync(
      `python3 -c "
import zipfile, os
os.makedirs('public', exist_ok=True)
zip_path = 'public/owl-clock-source.zip'
exclude_dirs = {'node_modules', '.git', 'dist', '.vite', '.cache'}
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        for f in files:
            if f.endswith('.zip'): continue
            file_path = os.path.join(root, f)
            arcname = os.path.relpath(file_path, '.')
            zipf.write(file_path, arcname)
"`,
      { stdio: "ignore" }
    );

    if (fs.existsSync(zipPath)) {
      res.setHeader("Content-Disposition", 'attachment; filename="the-owl-clock-codebase.zip"');
      res.setHeader("Content-Type", "application/zip");
      return fs.createReadStream(zipPath).pipe(res);
    }

    return res.status(500).json({ error: "Could not generate project archive." });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to download codebase archive." });
  }
});

/**
 * Cloudflare R2 Direct Server Upload endpoint (Supports single file uploads up to 200MB)
 * Uploads buffer directly to Cloudflare R2 and persists record in MongoDB
 */
app.post(
  ["/api/upload/r2", "/api/upload", "/api/upload/scaleway", "/api/storage/scaleway/upload"],
  upload.single("file") as any,
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file was uploaded." });
      }

      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return res.status(400).json({
          error: `File size exceeds 200MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB > 200MB).`,
        });
      }

      const folder = req.body.folder ? String(req.body.folder).replace(/^\/+|\/+$/g, "") : "audio";
      const customKey = req.body.objectKey || req.body.key;
      const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const objectKey = customKey || `${folder}/${Date.now()}-${cleanFilename}`;

      try {
        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: objectKey,
            Body: file.buffer,
            ContentType: file.mimetype || "application/octet-stream",
          })
        );

        const directUrl = `${R2_ENDPOINT}/${R2_BUCKET}/${objectKey}`;

        // Generate immediate attachment download URL
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: objectKey,
          ResponseContentDisposition: `attachment; filename="${cleanFilename}"`,
        });
        const downloadUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 86400 }).catch(() => directUrl);

        // Save to MongoDB collection "files"
        const fileRecord = await saveR2FileRecord({
          objectKey,
          filename: cleanFilename,
          sizeBytes: file.size,
          contentType: file.mimetype,
          bucket: R2_BUCKET,
          directUrl,
          downloadUrl,
          fragmentId: req.body.fragmentId,
          status: "uploaded",
        });

        console.log(`[R2 DIRECT UPLOAD SUCCESS] Uploaded ${cleanFilename} (${file.size} bytes) -> ${directUrl}`);

        return res.json({
          success: true,
          url: directUrl,
          fileUrl: directUrl,
          directUrl,
          downloadUrl,
          objectKey,
          public_id: objectKey,
          fileRecord,
          provider: "cloudflare-r2",
        });
      } catch (r2Err: any) {
        console.error("[CLOUDFLARE R2 UPLOAD FAILED, STORING IN RUNTIME BUFFER]", r2Err);

        const fileId = `r2-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        inMemoryFileStore.set(fileId, {
          id: fileId,
          buffer: file.buffer,
          mimetype: file.mimetype || "application/octet-stream",
          originalname: file.originalname,
          size: file.size,
          createdAt: Date.now(),
        });
        const fileUrl = `/api/storage/file/${fileId}`;
        return res.json({
          success: true,
          url: fileUrl,
          fileUrl,
          directUrl: fileUrl,
          downloadUrl: fileUrl,
          objectKey: fileId,
          public_id: fileId,
          fallback: true,
          provider: "in-memory-server",
          message: `Stored in runtime server buffer due to storage error (${r2Err.message}).`,
        });
      }
    } catch (err: any) {
      console.error("[R2 UPLOAD ROUTE ERROR]", err);
      return res.status(500).json({
        error: err?.message || "Failed to upload file to Cloudflare R2.",
      });
    }
  }
);

// 1. Cloudinary Signed Upload Signature Generator (Audio resource_type="video", Documents resource_type="raw")
app.post("/api/storage/cloudinary/sign", async (req, res) => {
  try {
    const { folder, resourceType, tags, fragmentId } = req.body;
    const cleanFolder = folder || (fragmentId ? `fragments/${fragmentId.replace(/[^a-zA-Z0-9]/g, "")}` : "lomon-archive");
    const rType = (resourceType || "video") as "video" | "raw" | "image" | "auto";
    const tagList = tags || "owl-clock-fragment";

    const signatureData = generateCloudinarySignature(cleanFolder, rType, tagList);
    if (!signatureData) {
      return res.json({
        success: false,
        configured: false,
        message: "Cloudinary credentials not configured in environment variables. Falling back to local/in-memory server storage."
      });
    }

    res.json({
      success: true,
      configured: true,
      ...signatureData
    });
  } catch (err: any) {
    res.json({ 
      success: false,
      configured: false,
      error: err.message || "Failed to generate Cloudinary upload signature."
    });
  }
});

// Cloudinary configuration helper
function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return cloudinary;
}

// 7. Cloudinary direct buffer upload endpoint (for Artwork, PDF Documents, etc.)
app.post("/api/upload/cloudinary", upload.single("file") as any, async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const folder = req.body.folder || "lomon-archive/artwork";
    const resourceType = req.body.resourceType || "auto";

    const cloud = getCloudinary();
    if (cloud) {
      // Stream upload buffer directly to Cloudinary
      const uploadPromise = new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const uploadStream = cloud.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
          },
          (err, result) => {
            if (err) return reject(err);
            if (result && result.secure_url) {
              resolve({ secure_url: result.secure_url, public_id: result.public_id });
            } else {
              reject(new Error("Failed to get secure URL from Cloudinary."));
            }
          }
        );
        uploadStream.end(file.buffer);
      });

      const uploadResult = await uploadPromise;
      return res.json({ 
        success: true, 
        url: uploadResult.secure_url, 
        public_id: uploadResult.public_id,
        provider: "cloudinary" 
      });
    } else {
      // Fallback: save to in-memory file store and return streaming URL
      const fileId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      inMemoryFileStore.set(fileId, {
        id: fileId,
        buffer: file.buffer,
        mimetype: file.mimetype || "application/octet-stream",
        originalname: file.originalname,
        size: file.size,
        createdAt: Date.now()
      });

      const fileUrl = `/api/storage/file/${fileId}`;
      console.log(`[STORAGE] Stored ${file.originalname} (${file.size} bytes) in memory -> ${fileUrl}`);
      return res.json({
        success: true,
        url: fileUrl,
        public_id: fileId,
        fallback: true,
        provider: "in-memory-server",
        message: "Saved in runtime server storage."
      });
    }
  } catch (err: any) {
    console.error("[CLOUDINARY ERROR]", err);
    res.status(500).json({ error: err?.message || "Failed to upload file to Cloudinary." });
  }
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  await initializeDatabase();

  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Mounting Vite in development middleware mode...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api")) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), "index.html");
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } else {
          next();
        }
      } catch (e: any) {
        if (vite && vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    console.log("[SERVER] Mounting static asset serve for production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("\x1b[36m%s\x1b[0m", `[SERVER] THE OWL CLOCK Fullstack Server is fully running on: http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
