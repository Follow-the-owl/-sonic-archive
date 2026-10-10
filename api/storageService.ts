import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Db } from "mongodb";

// =================================================================
// CLOUDFLARE R2 OBJECT STORAGE CONFIGURATION (S3-COMPATIBLE)
// =================================================================

export const CLOUDFLARE_ACCOUNT_ID = (
  process.env.CLOUDFLARE_ACCOUNT_ID || "8d2db169fb0c50093effeb17b495b4ed"
).trim();

export const R2_BUCKET = (
  process.env.CLOUDFLARE_R2_BUCKET_NAME ||
  process.env.R2_BUCKET ||
  "owl"
).trim();

export const R2_REGION = (process.env.R2_REGION || "auto").trim();

export const R2_ENDPOINT = (
  process.env.R2_ENDPOINT ||
  `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
).trim();

export const R2_ACCESS_KEY_ID = (
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
  process.env.R2_ACCESS_KEY_ID ||
  "b7fe69e9ede2c1dd66ae22916721ca13"
).trim();

export const R2_SECRET_ACCESS_KEY = (
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
  process.env.R2_SECRET_ACCESS_KEY ||
  "261129b96f9b91d9cde6010625687d0ad1b7c22c90196c399a9a150913ca25a7"
).trim();

export const CLOUDFLARE_R2_PUBLIC_URL = (
  process.env.CLOUDFLARE_R2_PUBLIC_URL ||
  process.env.R2_PUBLIC_URL ||
  "https://pub-330327ad4a1d48cc845ec672277e634d.r2.dev"
).replace(/\/+$/, "").trim();

// Maximum single file upload limit: 200MB (209,715,200 bytes)
export const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;

let r2ClientInstance: S3Client | null = null;

/**
 * Initializes and returns an S3Client configured explicitly for Cloudflare R2.
 */
export function getR2Client(): S3Client {
  if (!r2ClientInstance) {
    const endpoint = R2_ENDPOINT;
    const region = R2_REGION;

    r2ClientInstance = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    console.log(
      `[CLOUDFLARE R2 S3 CLIENT] Initialized for bucket: '${R2_BUCKET}', endpoint: ${endpoint}, region: ${region}`
    );
  }
  return r2ClientInstance;
}

// =================================================================
// METADATA RECORD INTERFACE & MONGODB SAVE FUNCTION
// =================================================================

export interface R2FileMetadata {
  id?: string;
  objectKey: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  bucket: string;
  directUrl: string;
  downloadUrl?: string;
  uploadedAt: string;
  uploadedBy?: string;
  status: "pending_upload" | "uploaded" | "verified";
  metadata?: Record<string, any>;
}

// In-memory fallback if MongoDB connection is pending or unavailable
export const mockFileStore: R2FileMetadata[] = [];

/**
 * Saves or updates Cloudflare R2 file metadata record (including direct & presigned download URLs)
 * directly into MongoDB collection "files".
 * Upserts on objectKey to prevent duplicates.
 */
export async function saveR2FileRecordToMongoDB(
  record: Partial<R2FileMetadata> & { objectKey: string; filename: string },
  dbInstance?: Db | null
): Promise<R2FileMetadata> {
  const fullRecord: R2FileMetadata = {
    id: record.id || `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    objectKey: record.objectKey,
    filename: record.filename,
    contentType: record.contentType || "application/octet-stream",
    sizeBytes: record.sizeBytes || 0,
    bucket: record.bucket || R2_BUCKET,
    directUrl: record.directUrl || `${R2_ENDPOINT}/${record.bucket || R2_BUCKET}/${record.objectKey}`,
    downloadUrl: record.downloadUrl,
    uploadedAt: record.uploadedAt || new Date().toISOString(),
    uploadedBy: record.uploadedBy || "user",
    status: record.status || "uploaded",
    metadata: record.metadata || {},
  };

  if (dbInstance) {
    try {
      const collection = dbInstance.collection("files");
      await collection.updateOne(
        { objectKey: fullRecord.objectKey },
        { $set: fullRecord },
        { upsert: true }
      );
      console.log(`[MONGODB] Saved Cloudflare R2 file record for key: ${fullRecord.objectKey}`);
    } catch (err) {
      console.error(`[MONGODB] Failed saving R2 file record to MongoDB, caching in memory fallback:`, err);
      upsertMockStore(fullRecord);
    }
  } else {
    upsertMockStore(fullRecord);
  }

  return fullRecord;
}

function upsertMockStore(record: R2FileMetadata) {
  const idx = mockFileStore.findIndex((f) => f.objectKey === record.objectKey);
  if (idx >= 0) {
    mockFileStore[idx] = record;
  } else {
    mockFileStore.push(record);
  }
}

// =================================================================
// PRESIGNED URL GENERATION (UPLOAD & DOWNLOAD)
// =================================================================

export interface PresignedUploadOptions {
  filename: string;
  contentType?: string;
  folder?: string;
  customKey?: string;
  sizeBytes?: number;
  expiresInSeconds?: number;
}

/**
 * Generates an expiring presigned PUT URL for Cloudflare R2.
 * Clients can upload up to 200MB directly from the browser to Cloudflare R2
 * without routing heavy binary payloads through the Node.js / Vercel application server.
 */
export async function generateR2PresignedUpload(params: PresignedUploadOptions) {
  const client = getR2Client();
  const bucketName = R2_BUCKET;
  const endpoint = R2_ENDPOINT;
  const region = R2_REGION;

  // Validate single file size up to 200MB
  if (params.sizeBytes && params.sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(
      `File size exceeds 200MB limit (${(params.sizeBytes / (1024 * 1024)).toFixed(1)}MB > 200MB).`
    );
  }

  const cleanFolder = (params.folder || "uploads").replace(/^\/+|\/+$/g, "");
  const cleanFilename = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = params.customKey || `${cleanFolder}/${Date.now()}-${cleanFilename}`;
  const contentType = params.contentType || "application/octet-stream";
  const expiresIn = params.expiresInSeconds || 900; // 15 minutes default for 200MB uploads

  try {
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, putCommand, { expiresIn });
    const directUrl = `${endpoint}/${bucketName}/${objectKey}`;

    // Also pre-generate an immediate attachment download URL
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename="${cleanFilename}"`,
    });
    const downloadUrl = await getSignedUrl(client, getCommand, { expiresIn: 86400 }).catch(
      () => directUrl
    );

    console.log(`[R2 PRESIGNED PUT READY] Key: ${objectKey}, Max: 200MB, Expires: ${expiresIn}s`);

    return {
      success: true,
      uploadUrl,
      objectKey,
      directUrl,
      downloadUrl,
      bucket: bucketName,
      region,
      endpoint,
      maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    };
  } catch (error: any) {
    console.error(`[CLOUDFLARE R2 PRESIGN UPLOAD ERROR] Key: ${objectKey}:`, error);
    throw error;
  }
}

export interface PresignedDownloadOptions {
  key: string;
  filename?: string;
  expiresInSeconds?: number;
}

/**
 * Generates an expiring presigned GET download URL for Cloudflare R2.
 * Configured explicitly with ResponseContentDisposition: 'attachment; filename="..."'
 * to ensure files download immediately upon clicking in the browser.
 */
export async function generateR2PresignedDownload(params: PresignedDownloadOptions) {
  const client = getR2Client();
  const bucketName = R2_BUCKET;
  const endpoint = R2_ENDPOINT;
  const expiresIn = params.expiresInSeconds || 3600; // 1 hour default

  const cleanFilename = (
    params.filename ||
    params.key.split("/").pop() ||
    "download.dat"
  ).replace(/[^a-zA-Z0-9._-]/g, "_");

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: params.key,
      ResponseContentDisposition: `attachment; filename="${cleanFilename}"`,
    });

    const downloadUrl = await getSignedUrl(client, command, { expiresIn });
    const directUrl = `${endpoint}/${bucketName}/${params.key}`;

    console.log(
      `[R2 PRESIGNED GET READY] Key: ${params.key} -> Filename: ${cleanFilename} (Expires: ${expiresIn}s)`
    );

    return {
      success: true,
      downloadUrl,
      directUrl,
      objectKey: params.key,
      filename: cleanFilename,
      expiresInSeconds: expiresIn,
      bucket: bucketName,
      provider: "cloudflare-r2",
    };
  } catch (error: any) {
    console.error(`[CLOUDFLARE R2 PRESIGN DOWNLOAD ERROR] Key: ${params.key}:`, error);
    throw error;
  }
}

/**
 * Server-side fallback buffer upload to Cloudflare R2 (supports up to 200MB buffer)
 */
export async function uploadBufferToR2(params: {
  buffer: Buffer;
  key: string;
  contentType: string;
  bucket?: string;
}) {
  const client = getR2Client();
  const bucketName = params.bucket || R2_BUCKET;
  const endpoint = R2_ENDPOINT;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: params.key,
    Body: params.buffer,
    ContentType: params.contentType,
  });

  const result = await client.send(command);
  const directUrl = `${endpoint}/${bucketName}/${params.key}`;

  console.log(`[R2 DIRECT BUFFER UPLOAD SUCCESS] Key: '${params.key}' -> ${directUrl}`);

  return {
    success: true,
    directUrl,
    objectKey: params.key,
    etag: result.ETag,
  };
}

// =================================================================
// CORS CONFIGURATION HELPER FOR CLOUDFLARE R2
// =================================================================

export async function configureR2BucketCors(bucketName: string = R2_BUCKET) {
  const client = getR2Client();
  const corsRules = [
    {
      AllowedOrigins: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: [
        "ETag",
        "Content-Length",
        "Content-Type",
        "Content-Range",
        "Accept-Ranges",
        "x-amz-request-id",
        "x-amz-id-2",
      ],
      MaxAgeSeconds: 3600,
    },
  ];

  try {
    await client.send(
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
    console.error(`[CLOUDFLARE R2 CORS CONFIG ERROR] Failed on bucket '${bucketName}':`, err);
    throw err;
  }
}

export async function getR2BucketCors(bucketName: string = R2_BUCKET) {
  const client = getR2Client();
  try {
    const res = await client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
    return { configured: true, rules: res.CORSRules };
  } catch (err: any) {
    if (err.name === "NoSuchCORSConfiguration") {
      return { configured: false, rules: [] };
    }
    throw err;
  }
}

// =================================================================
// BEAT ARCHIVE & SAMPLE AUDIO UPLOAD SERVICE FOR CLOUDFLARE R2
// =================================================================

export interface UploadBeatParams {
  beatId: string;
  sampleFile?: { buffer: Buffer; originalname: string; mimetype?: string };
  stemsZipFile?: { buffer: Buffer; originalname: string; mimetype?: string };
  dbInstance?: Db | null;
}

export interface UploadBeatResult {
  success: boolean;
  beatId: string;
  sampleAudioUrl?: string;
  stemsZipUrl?: string;
  sampleObjectKey?: string;
  stemsObjectKey?: string;
}

/**
 * Uploads beat zip archives and sample audio files directly to Cloudflare R2 'owl' bucket.
 * Sets proper MIME types (application/zip for beat stems, audio/mpeg or audio/wav for sample).
 * Prepend CLOUDFLARE_R2_PUBLIC_URL for sample audio streaming.
 * Saves both URLs into the exact existing beat fields in MongoDB (audioUrl, mp3Preview, stemsZip, zipUrl).
 */
export async function uploadBeatAssetsToR2({
  beatId,
  sampleFile,
  stemsZipFile,
  dbInstance,
}: UploadBeatParams): Promise<UploadBeatResult> {
  const client = getR2Client();
  const cleanBeatId = (beatId || "temp").replace(/[^a-zA-Z0-9_-]/g, "");
  let sampleAudioUrl: string | undefined;
  let stemsZipUrl: string | undefined;
  let sampleObjectKey: string | undefined;
  let stemsObjectKey: string | undefined;

  // 1. Upload sample preview audio file
  if (sampleFile && sampleFile.buffer) {
    const cleanSampleName = sampleFile.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    sampleObjectKey = `audio/${cleanBeatId || Date.now()}-${cleanSampleName}`;
    const sampleMime =
      cleanSampleName.toLowerCase().endsWith(".wav")
        ? "audio/wav"
        : sampleFile.mimetype && sampleFile.mimetype.startsWith("audio/")
        ? sampleFile.mimetype
        : "audio/mpeg";

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: sampleObjectKey,
        Body: sampleFile.buffer,
        ContentType: sampleMime,
      })
    );

    // Prepend CLOUDFLARE_R2_PUBLIC_URL for public audio streamability
    sampleAudioUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${sampleObjectKey}`;

    await saveR2FileRecordToMongoDB(
      {
        objectKey: sampleObjectKey,
        filename: cleanSampleName,
        contentType: sampleMime,
        sizeBytes: sampleFile.buffer.length,
        bucket: R2_BUCKET,
        directUrl: sampleAudioUrl,
        downloadUrl: sampleAudioUrl,
        status: "uploaded",
        metadata: { beatId, type: "preview_sample" },
      },
      dbInstance
    );

    console.log(
      `[CLOUDFLARE R2] Beat sample audio uploaded for '${cleanBeatId}' -> ${sampleAudioUrl}`
    );
  }

  // 2. Upload stems zip archive
  if (stemsZipFile && stemsZipFile.buffer) {
    const cleanZipName = stemsZipFile.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    stemsObjectKey = `fragments/${cleanBeatId}/stems/${Date.now()}-${cleanZipName}`;
    const zipMime = "application/zip";

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: stemsObjectKey,
        Body: stemsZipFile.buffer,
        ContentType: zipMime,
      })
    );

    const directZipUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${stemsObjectKey}`;
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: stemsObjectKey,
      ResponseContentDisposition: `attachment; filename="${cleanZipName}"`,
    });
    const downloadZipUrl = await getSignedUrl(client, getCommand, { expiresIn: 86400 }).catch(
      () => directZipUrl
    );

    stemsZipUrl = directZipUrl;

    await saveR2FileRecordToMongoDB(
      {
        objectKey: stemsObjectKey,
        filename: cleanZipName,
        contentType: zipMime,
        sizeBytes: stemsZipFile.buffer.length,
        bucket: R2_BUCKET,
        directUrl: directZipUrl,
        downloadUrl: downloadZipUrl,
        status: "uploaded",
        metadata: { beatId, type: "stems_zip" },
      },
      dbInstance
    );

    console.log(
      `[CLOUDFLARE R2] Beat stems zip uploaded for '${cleanBeatId}' -> ${stemsZipUrl}`
    );
  }

  // 3. Save resulting file URLs into exact existing beat fields in MongoDB
  if (dbInstance && cleanBeatId && (sampleAudioUrl || stemsZipUrl)) {
    try {
      const updateFields: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };
      if (sampleAudioUrl) {
        updateFields.audioUrl = sampleAudioUrl;
        updateFields.mp3Preview = sampleAudioUrl;
        updateFields.previewAudioUrl = sampleAudioUrl;
      }
      if (stemsZipUrl) {
        updateFields.stemsZip = stemsZipUrl;
        updateFields.zipUrl = stemsZipUrl;
      }

      await dbInstance.collection("fragments").updateOne(
        { $or: [{ id: cleanBeatId }, { fragmentId: cleanBeatId }] },
        { $set: updateFields }
      );
      console.log(
        `[MONGODB] Updated beat '${cleanBeatId}' with Cloudflare R2 file URLs:`,
        updateFields
      );
    } catch (dbErr) {
      console.error(`[MONGODB] Failed to update beat record with R2 URLs:`, dbErr);
    }
  }

  return {
    success: true,
    beatId: cleanBeatId,
    sampleAudioUrl,
    stemsZipUrl,
    sampleObjectKey,
    stemsObjectKey,
  };
}
