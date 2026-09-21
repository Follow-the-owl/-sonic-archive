import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize a single S3 Client for Scaleway Object Storage
const s3Client = new S3Client({
  region: process.env.SCALEWAY_REGION || "fr-par",
  endpoint: process.env.SCALEWAY_ENDPOINT || "https://s3.fr-par.scw.cloud",
  credentials: {
    accessKeyId: process.env.SCALEWAY_ACCESS_KEY || "",
    secretAccessKey: process.env.SCALEWAY_SECRET_KEY || "",
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { filename, contentType, fileType, objectKey: customKey } = body || {};
    const mimeType = contentType || fileType || "application/zip";
    const bucketName = process.env.SCALEWAY_BUCKET_NAME || "owl";

    const cleanFilename = filename
      ? String(filename).replace(/[^a-zA-Z0-9._-]/g, "_")
      : `${Date.now()}-archive.zip`;

    const objectKey = customKey || `music/${Date.now()}-${cleanFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: mimeType,
    });

    // Generate a temporary PUT upload ticket valid for 300 seconds
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return Response.json({
      uploadUrl,
      objectKey,
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to generate Scaleway presigned upload URL." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename") || `${Date.now()}-archive.zip`;
    const contentType = searchParams.get("contentType") || "application/zip";
    const bucketName = process.env.SCALEWAY_BUCKET_NAME || "owl";

    const cleanFilename = String(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `music/${Date.now()}-${cleanFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return Response.json({
      uploadUrl,
      objectKey,
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to generate Scaleway presigned upload URL." },
      { status: 500 }
    );
  }
}
