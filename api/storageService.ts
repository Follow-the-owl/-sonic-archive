import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

// --- Cloudinary Setup ---
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
