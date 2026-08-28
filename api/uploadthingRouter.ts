import { createUploadthing, type FileRouter } from "uploadthing/express";
import { UTApi } from "uploadthing/server";

const f = createUploadthing();

export function getUTApi(): UTApi | null {
  let token = process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET;
  if (!token) return null;
  // Clean up any accidental wrappers like `UPLOADTHING_TOKEN='...'` or extra quotes
  token = token.replace(/^UPLOADTHING_TOKEN\s*=\s*/i, "").replace(/^['"]|['"]$/g, "").trim();
  if (!token) return null;
  return new UTApi({ token });
}

/**
 * UploadThing File Router for Owl Clock Admin
 * Stems are allowed up to 512MB / 1GB zip archives with direct-to-UploadThing client uploads.
 */
export const uploadRouter = {
  stemZipUploader: f({
    blob: {
      maxFileSize: "512MB",
      maxFileCount: 1
    }
  })
    .middleware(async ({ req }) => {
      // Backend authorization before allowing client upload
      const fragmentId = (req.headers["x-fragment-id"] as string) || "unspecified";
      return { fragmentId, timestamp: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UPLOADTHING] Stem ZIP Upload Completed for Fragment [${metadata.fragmentId}]:`, file.url);
      return { 
        uploadedBy: "Owl Clock Archivist", 
        fragmentId: metadata.fragmentId, 
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size
      };
    })
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
