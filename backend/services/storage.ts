// Cloudflare R2 + Cloudinary helpers and the in-memory file store used for local playback.
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// Cloudflare R2 Object Storage Configuration (S3-Compatible)
export const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || "8d2db169fb0c50093effeb17b495b4ed").trim();

export const R2_BUCKET = (process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.R2_BUCKET || "owl").trim();

export const R2_REGION = (process.env.R2_REGION || "auto").trim();

export const R2_ENDPOINT = (process.env.R2_ENDPOINT || `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`).trim();

export const R2_ACCESS_KEY_ID = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "").trim();

export const R2_SECRET_ACCESS_KEY = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "").trim();

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn("[CONFIG WARNING] Cloudflare R2 credentials are not set (CLOUDFLARE_R2_ACCESS_KEY_ID / CLOUDFLARE_R2_SECRET_ACCESS_KEY). Uploads and protected downloads will fail.");
}

export const CLOUDFLARE_R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev").replace(/\/+$/, "").trim();

// Maximum single file upload limit: 200MB (209,715,200 bytes)
export const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;

// Initialize S3-compatible Client configured for Cloudflare R2
export const r2Client = new S3Client({
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  region: "auto",
  forcePathStyle: true,
});

console.log(`[API SERVER] Cloudflare R2 S3 Client initialized for bucket: ${R2_BUCKET}, endpoint: https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`);

// --- Cloudflare R2 CORS Helper Functions ---
export async function configureR2BucketCors(bucketName: string = R2_BUCKET) {
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

export async function getR2BucketCors(bucketName: string = R2_BUCKET) {
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

// --- Cloudinary Signature Generator ---
export function generateCloudinarySignature(
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
