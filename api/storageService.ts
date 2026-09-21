import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

// --- Scaleway Object Storage Setup ---
let scalewayClientInstance: S3Client | null = null;

export function getScalewayClient(): S3Client {
  if (!scalewayClientInstance) {
    scalewayClientInstance = new S3Client({
      region: process.env.SCALEWAY_REGION || "fr-par",
      endpoint: process.env.SCALEWAY_ENDPOINT || "https://s3.fr-par.scw.cloud",
      credentials: {
        accessKeyId: process.env.SCALEWAY_ACCESS_KEY || "SCWH705M0YY16XCH6PH4",
        secretAccessKey: process.env.SCALEWAY_SECRET_KEY || "08539153-f0d2-4865-8df8-40d04e346fb8",
      },
    });
  }
  return scalewayClientInstance;
}

export async function generateScalewayPresignedUpload(params: {
  filename: string;
  contentType?: string;
  folder?: string;
  customKey?: string;
  expiresInSeconds?: number;
}) {
  const client = getScalewayClient();
  const bucketName = process.env.SCALEWAY_BUCKET_NAME || "owl";
  const region = process.env.SCALEWAY_REGION || "fr-par";
  const cleanFolder = (params.folder || "audio").replace(/^\/+|\/+$/g, "");
  const cleanFilename = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = params.customKey || `${cleanFolder}/${Date.now()}-${cleanFilename}`;
  const contentType = params.contentType || "application/octet-stream";

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: contentType,
    ACL: "public-read",
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds || 600,
  });

  const publicUrl = `https://${bucketName}.s3.${region}.scw.cloud/${objectKey}`;

  return {
    uploadUrl,
    objectKey,
    publicUrl,
    bucket: bucketName,
  };
}

// --- Cloudinary Setup (Deprecated - Migrated to Scaleway) ---
export function getCloudinaryClient() {
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
    secure: true
  });

  return cloudinary;
}

/**
 * Generate signed upload parameters for direct client -> Cloudinary upload
 * @param folder Target folder inside Cloudinary (e.g., 'fragments/12-00/audio')
 * @param resourceType 'video' for audio (MP3/WAV), 'raw' for documents (PDF/ZIP/TXT)
 * @param tags Optional tags for asset indexing
 */
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

  // Cloudinary signature computation requires parameters sorted alphabetically
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
