// HTTP routes: file streaming, R2 presigned uploads/downloads, direct uploads, audio proxy, Cloudinary.
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import crypto from "crypto";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import type { Express } from "express";
import { db, mockFragments, mockPayments, mockR2Files, persistFragments, saveR2FileRecord, useMockDb } from "../db.js";
import { escapeRegex, getEmailFromToken, isAllowedMediaUrl, isAuthorizedAdmin, requireAdmin } from "../security.js";
import { pendingTransactions } from "../services/paypal.js";
import { CLOUDFLARE_R2_PUBLIC_URL, MAX_UPLOAD_SIZE_BYTES, R2_BUCKET, R2_ENDPOINT, R2_REGION, configureR2BucketCors, generateCloudinarySignature, getR2BucketCors, inMemoryFileStore, r2Client } from "../services/storage.js";

// --- Real Storage Setup & Endpoints ---
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES }, // 200MB single file upload limit
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

export function registerFileStreamRoute(app: Express) {
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
}

export function registerStorageRoutes(app: Express) {
  /**
   * Check Cloudflare R2 / S3 Bucket CORS Configuration
   */
  app.get("/api/storage/r2/cors", requireAdmin, async (req, res) => {
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
  app.post("/api/storage/r2/cors", requireAdmin, async (req, res) => {
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
    ["/api/storage/r2/presign-upload", "/api/upload-url", "/api/storage/presign-upload"],
    requireAdmin,
    async (req, res) => {
      let targetObjectKey = "";
      try {
        const { filename, contentType, fileType, objectKey: customKey, folder, fragmentId, sizeBytes, size, fileSize: inputSize } = req.body || {};
        const fileSize = Number(sizeBytes || size || inputSize || 0);

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

        // Enforce proper MIME types: application/zip for beat stems, audio/mpeg or audio/wav for preview sample
        const lowerName = cleanFilename.toLowerCase();
        let mimeType = contentType || fileType || "application/octet-stream";
        if (lowerName.endsWith(".zip") || (folder && String(folder).includes("stem"))) {
          mimeType = "application/zip";
        } else if (lowerName.endsWith(".wav")) {
          mimeType = "audio/wav";
        } else if (lowerName.endsWith(".mp3")) {
          mimeType = "audio/mpeg";
        }

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
        // Streamable public URL prepending CLOUDFLARE_R2_PUBLIC_URL
        const publicStreamUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${objectKey.replace(/^\/+/, "")}`;
        const directUrl = publicStreamUrl;

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
          publicUrl: publicStreamUrl,
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

  app.get("/api/upload-url", requireAdmin, async (req, res) => {
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

      // For protected audio masters and stems, verify user authentication and completed order status
      const isProtectedAsset = key.toLowerCase().endsWith(".wav") || key.toLowerCase().endsWith(".zip") || key.toLowerCase().includes("master") || key.toLowerCase().includes("stem");
      if (isProtectedAsset) {
        const tokenEmail = await getEmailFromToken(req);
        if (!tokenEmail) {
          return res.status(401).json({
            error: "Authentication required to download master archive audio files.",
            status: "UNAUTHENTICATED"
          });
        }
        const email = tokenEmail.toLowerCase().trim();
        if (!isAuthorizedAdmin(email)) {
          let payments: any[] = [];
          if (useMockDb) {
            payments = mockPayments.filter(p => (p.userId || p.email || p.clientEmail || "").toLowerCase().trim() === email);
          } else if (db) {
            payments = await db.collection("payments").find({
              $or: [
                { email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } },
                { clientEmail: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } },
                { userId: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } }
              ]
            }).toArray();
          }
          const hasPending = Array.from(pendingTransactions.values()).some((p: any) => (p.email || "").toLowerCase().trim() === email && p.status !== "COMPLETED") ||
                             payments.some(p => p.status === "PENDING" || p.paymentStatus === "PENDING");
          if (hasPending) {
            return res.status(402).json({
              error: "Verifying Payment: Settlement is pending confirmation with PayPal. Master download is locked until verified.",
              status: "PENDING"
            });
          }
          const hasCompleted = payments.some(p => p.status === "COMPLETED" || p.paymentStatus === "COMPLETED");
          if (!hasCompleted) {
            return res.status(403).json({
              error: "Payment Incomplete: A confirmed COMPLETED order record in the archive database is required to download master audio files.",
              status: "PAYMENT_INCOMPLETE"
            });
          }
        }
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
  app.post("/api/storage/r2/save-record", requireAdmin, async (req, res) => {
    try {
      const { objectKey, key, filename, sizeBytes, size, contentType, fragmentId, tags, metadata } = req.body || {};
      const targetKey = objectKey || key;
      if (!targetKey) {
        return res.status(400).json({ error: "Missing 'objectKey' or 'key' parameter to save file record." });
      }

      const cleanFilename = (filename || path.basename(targetKey) || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      const directUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${targetKey.replace(/^\/+/, "")}`;

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

      // Save generated URLs into the exact same existing beat fields in MongoDB
      const beatId = fragmentId || req.body?.beatId;
      if (beatId) {
        const cleanBeatId = String(beatId).replace(/[^a-zA-Z0-9_-]/g, "");
        const isZip = cleanFilename.toLowerCase().endsWith(".zip") || (contentType && contentType.includes("zip"));
        const isAudio = cleanFilename.toLowerCase().match(/\.(mp3|wav|ogg|m4a|flac)$/i) || (contentType && contentType.startsWith("audio/"));
        const beatPatch: Record<string, any> = { updatedAt: new Date().toISOString() };
        if (isAudio) {
          beatPatch.audioUrl = directUrl;
          beatPatch.mp3Preview = directUrl;
          beatPatch.previewAudioUrl = directUrl;
        }
        if (isZip) {
          beatPatch.stemsZip = directUrl;
          beatPatch.zipUrl = directUrl;
        }
        if (isAudio || isZip) {
          if (!useMockDb && db) {
            await db.collection("fragments").updateOne(
              { $or: [{ id: cleanBeatId }, { fragmentId: cleanBeatId }] },
              { $set: beatPatch }
            );
          }
          const mockIdx = mockFragments.findIndex(f => f.id === cleanBeatId);
          if (mockIdx >= 0) {
            mockFragments[mockIdx] = { ...mockFragments[mockIdx], ...beatPatch };
            persistFragments(mockFragments);
          }
          console.log(`[MONGODB] Beat '${cleanBeatId}' updated with Cloudflare R2 file record URLs:`, beatPatch);
        }
      }

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
  app.get("/api/storage/r2/files", requireAdmin, async (req, res) => {
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

      if (!isAllowedMediaUrl(decodedUrl)) {
        return res.status(403).json({ error: "Audio host is not allowed." });
      }

      const reqHeaders: Record<string, string> = {};
      if (req.headers.range) {
        reqHeaders["range"] = req.headers.range;
      }

      const response = await fetch(decodedUrl, { headers: reqHeaders, redirect: "error" });

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

  // Codebase export endpoints removed for security.
  app.get(["/api/download/codebase.zip", "/api/download-code", "/api/export-code"], (_req, res) => {
    return res.status(404).json({ error: "Endpoint disabled." });
  });

  /**
   * Cloudflare R2 Direct Server Upload endpoint (Supports single file & beat archive/sample uploads up to 200MB)
   * Routes files directly to Cloudflare R2 'owl' bucket, sets proper MIME types (application/zip, audio/mpeg, audio/wav),
   * constructs streamable public URLs via CLOUDFLARE_R2_PUBLIC_URL, and persists URLs to MongoDB beat fields.
   */
  app.post(
    ["/api/upload/r2", "/api/upload", "/api/upload/beat", "/api/beats/upload", "/api/storage/r2/upload"],
    requireAdmin,
    upload.fields([
      { name: "file", maxCount: 1 },
      { name: "sample", maxCount: 1 },
      { name: "stems", maxCount: 1 },
      { name: "zip", maxCount: 1 },
      { name: "audio", maxCount: 1 },
    ]) as any,
    async (req, res) => {
      try {
        const filesMap = (req.files as Record<string, Express.Multer.File[]>) || {};
        const singleFile = req.file;

        const sampleFile = filesMap["sample"]?.[0] || filesMap["audio"]?.[0] || 
          (singleFile && (singleFile.originalname.match(/\.(mp3|wav|ogg|m4a|flac)$/i) || singleFile.mimetype?.startsWith("audio/")) ? singleFile : undefined);

        const zipFile = filesMap["stems"]?.[0] || filesMap["zip"]?.[0] || 
          (singleFile && (singleFile.originalname.toLowerCase().endsWith(".zip") || singleFile.mimetype?.includes("zip")) ? singleFile : undefined);

        const genericFile = singleFile || filesMap["file"]?.[0];

        if (!sampleFile && !zipFile && !genericFile) {
          return res.status(400).json({ error: "No file was uploaded." });
        }

        const rawBeatId = req.body.beatId || req.body.fragmentId || req.body.id;
        const cleanBeatId = rawBeatId ? String(rawBeatId).replace(/[^a-zA-Z0-9_-]/g, "") : "";
        const customKey = req.body.objectKey || req.body.key;
        const folder = req.body.folder ? String(req.body.folder).replace(/^\/+|\/+$/g, "") : "audio";

        let sampleAudioUrl: string | undefined;
        let sampleObjectKey: string | undefined;
        let stemsZipUrl: string | undefined;
        let stemsDownloadUrl: string | undefined;
        let stemsObjectKey: string | undefined;
        let genericUrl: string | undefined;
        let genericKey: string | undefined;
        let genericDownloadUrl: string | undefined;

        // 1. Upload sample preview audio file
        if (sampleFile) {
          if (sampleFile.size > MAX_UPLOAD_SIZE_BYTES) {
            return res.status(400).json({
              error: `Sample audio exceeds 200MB limit (${(sampleFile.size / (1024 * 1024)).toFixed(1)}MB > 200MB).`,
            });
          }
          const cleanSampleName = sampleFile.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
          sampleObjectKey = (customKey && !zipFile) ? customKey : `audio/${cleanBeatId || Date.now()}-${cleanSampleName}`;
          const sampleMime = cleanSampleName.toLowerCase().endsWith(".wav") ? "audio/wav" : "audio/mpeg";

          await r2Client.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: sampleObjectKey,
              Body: sampleFile.buffer,
              ContentType: sampleMime,
            })
          );

          sampleAudioUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${sampleObjectKey}`;

          await saveR2FileRecord({
            objectKey: sampleObjectKey,
            filename: cleanSampleName,
            sizeBytes: sampleFile.size,
            contentType: sampleMime,
            bucket: R2_BUCKET,
            directUrl: sampleAudioUrl,
            downloadUrl: sampleAudioUrl,
            fragmentId: cleanBeatId || req.body.fragmentId,
            status: "uploaded",
          });

          console.log(`[R2 SAMPLE UPLOAD] Beat '${cleanBeatId}' audio sample uploaded -> ${sampleAudioUrl}`);
        }

        // 2. Upload beat stems zip archive
        if (zipFile) {
          if (zipFile.size > MAX_UPLOAD_SIZE_BYTES) {
            return res.status(400).json({
              error: `Stems ZIP exceeds 200MB limit (${(zipFile.size / (1024 * 1024)).toFixed(1)}MB > 200MB).`,
            });
          }
          const cleanZipName = zipFile.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
          stemsObjectKey = (customKey && !sampleFile) ? customKey : `fragments/${cleanBeatId || "general"}/stems/${Date.now()}-${cleanZipName}`;
          const zipMime = "application/zip";

          await r2Client.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: stemsObjectKey,
              Body: zipFile.buffer,
              ContentType: zipMime,
            })
          );

          stemsZipUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${stemsObjectKey}`;

          const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: stemsObjectKey,
            ResponseContentDisposition: `attachment; filename="${cleanZipName}"`,
          });
          stemsDownloadUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 86400 }).catch(() => stemsZipUrl);

          await saveR2FileRecord({
            objectKey: stemsObjectKey,
            filename: cleanZipName,
            sizeBytes: zipFile.size,
            contentType: zipMime,
            bucket: R2_BUCKET,
            directUrl: stemsZipUrl,
            downloadUrl: stemsDownloadUrl,
            fragmentId: cleanBeatId || req.body.fragmentId,
            status: "uploaded",
          });

          console.log(`[R2 STEMS ZIP UPLOAD] Beat '${cleanBeatId}' stems ZIP uploaded -> ${stemsZipUrl}`);
        }

        // 3. Fallback for generic file if not handled by sample or zip
        if (!sampleFile && !zipFile && genericFile) {
          if (genericFile.size > MAX_UPLOAD_SIZE_BYTES) {
            return res.status(400).json({
              error: `File size exceeds 200MB limit (${(genericFile.size / (1024 * 1024)).toFixed(1)}MB > 200MB).`,
            });
          }
          const cleanName = genericFile.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
          genericKey = customKey || `${folder}/${Date.now()}-${cleanName}`;
          const lowerName = cleanName.toLowerCase();
          let mime = genericFile.mimetype || "application/octet-stream";
          if (lowerName.endsWith(".zip")) mime = "application/zip";
          else if (lowerName.endsWith(".wav")) mime = "audio/wav";
          else if (lowerName.endsWith(".mp3")) mime = "audio/mpeg";

          await r2Client.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: genericKey,
              Body: genericFile.buffer,
              ContentType: mime,
            })
          );

          genericUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${genericKey}`;
          const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: genericKey,
            ResponseContentDisposition: `attachment; filename="${cleanName}"`,
          });
          genericDownloadUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 86400 }).catch(() => genericUrl);

          await saveR2FileRecord({
            objectKey: genericKey,
            filename: cleanName,
            sizeBytes: genericFile.size,
            contentType: mime,
            bucket: R2_BUCKET,
            directUrl: genericUrl,
            downloadUrl: genericDownloadUrl,
            fragmentId: cleanBeatId || req.body.fragmentId,
            status: "uploaded",
          });

          if (mime === "application/zip") {
            stemsZipUrl = genericUrl;
            stemsObjectKey = genericKey;
            stemsDownloadUrl = genericDownloadUrl;
          } else if (mime.startsWith("audio/")) {
            sampleAudioUrl = genericUrl;
            sampleObjectKey = genericKey;
          }
        }

        // 4. Save generated URLs into the exact same existing beat fields in MongoDB
        if (cleanBeatId && (sampleAudioUrl || stemsZipUrl)) {
          const beatPatch: Record<string, any> = { updatedAt: new Date().toISOString() };
          if (sampleAudioUrl) {
            beatPatch.audioUrl = sampleAudioUrl;
            beatPatch.mp3Preview = sampleAudioUrl;
            beatPatch.previewAudioUrl = sampleAudioUrl;
          }
          if (stemsZipUrl) {
            beatPatch.stemsZip = stemsZipUrl;
            beatPatch.zipUrl = stemsZipUrl;
          }

          if (!useMockDb && db) {
            await db.collection("fragments").updateOne(
              { $or: [{ id: cleanBeatId }, { fragmentId: cleanBeatId }] },
              { $set: beatPatch }
            );
          }
          const mockIdx = mockFragments.findIndex(f => f.id === cleanBeatId);
          if (mockIdx >= 0) {
            mockFragments[mockIdx] = { ...mockFragments[mockIdx], ...beatPatch };
          }
          console.log(`[MONGODB] Beat '${cleanBeatId}' persisted with Cloudflare R2 URLs:`, beatPatch);
        }

        const primaryUrl = sampleAudioUrl || stemsZipUrl || genericUrl;
        const primaryKey = sampleObjectKey || stemsObjectKey || genericKey;
        const primaryDownload = stemsDownloadUrl || genericDownloadUrl || primaryUrl;

        return res.json({
          success: true,
          url: primaryUrl,
          fileUrl: primaryUrl,
          directUrl: primaryUrl,
          downloadUrl: primaryDownload,
          objectKey: primaryKey,
          public_id: primaryKey,
          sampleAudioUrl,
          stemsZipUrl,
          beatId: cleanBeatId,
          provider: "cloudflare-r2",
        });
      } catch (err: any) {
        console.error("[R2 UPLOAD ROUTE ERROR]", err);
        return res.status(500).json({
          error: err?.message || "Failed to upload file to Cloudflare R2.",
        });
      }
    }
  );

  // 1. Cloudinary Signed Upload Signature Generator (Audio resource_type="video", Documents resource_type="raw")
  app.post("/api/storage/cloudinary/sign", requireAdmin, async (req, res) => {
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

  // 7. Cloudinary direct buffer upload endpoint (for Artwork, PDF Documents, etc.)
  app.post("/api/upload/cloudinary", requireAdmin, upload.single("file") as any, async (req, res) => {
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
}
