import React, { useState, useRef } from "react";
import { 
  UploadCloud, 
  FileArchive, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  RefreshCw,
  Music,
  HardDrive
} from "lucide-react";

export interface ScalewayUploadResult {
  objectKey: string;
  uploadUrl: string;
  file: File;
  fileSize: number;
}

interface ScalewayUploaderProps {
  onUploadComplete?: (result: ScalewayUploadResult) => void;
  accept?: string;
  maxSizeBytes?: number; // Default 200MB
  title?: string;
  subtitle?: string;
  className?: string;
}

type UploadStatus = "idle" | "generating" | "uploading" | "complete" | "error";

export function ScalewayUploader({
  onUploadComplete,
  accept = ".zip,application/zip,application/x-zip-compressed,audio/*",
  maxSizeBytes = 200 * 1024 * 1024, // 200MB constraint
  title = "Scaleway Direct-to-Storage Uploader",
  subtitle = "Direct Presigned PUT Upload — Bypasses Vercel 4.5MB Serverless Limit (Up to 200MB)",
  className = ""
}: ScalewayUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;

    if (selected.size > maxSizeBytes) {
      setErrorMessage(`File exceeds maximum size limit of ${formatFileSize(maxSizeBytes)} (${formatFileSize(selected.size)}).`);
      setFile(null);
      return;
    }

    setErrorMessage(null);
    setFile(selected);
    setStatus("idle");
    setProgress(0);
    setUploadedBytes(0);
    setTotalBytes(selected.size);
    setUploadedKey(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setErrorMessage(null);
      setStatus("generating");
      setProgress(0);

      // Step 1: Call /api/upload-url to generate the temporary Presigned PUT upload ticket
      const presignResponse = await fetch("/api/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/zip",
          fileSize: file.size,
        }),
      });

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate presigned upload ticket from backend.");
      }

      const { uploadUrl, objectKey } = await presignResponse.json();
      if (!uploadUrl || !objectKey) {
        throw new Error("Invalid presigned URL response received from storage API.");
      }

      setUploadedKey(objectKey);

      // Step 2: Execute direct XMLHttpRequest PUT directly to Scaleway S3 bucket
      setStatus("uploading");

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.open("PUT", uploadUrl, true);
      // Raw file direct upload with matching Content-Type MIME header
      xhr.setRequestHeader("Content-Type", file.type || "application/zip");

      if (xhr.upload) {
        xhr.upload.onprogress = (event: ProgressEvent) => {
          if (event.lengthComputable) {
            const percentComplete = Math.min(100, Math.round((event.loaded / event.total) * 100));
            setProgress(percentComplete);
            setUploadedBytes(event.loaded);
            setTotalBytes(event.total);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          setStatus("complete");
          if (onUploadComplete) {
            onUploadComplete({
              objectKey,
              uploadUrl,
              file,
              fileSize: file.size,
            });
          }
        } else {
          setStatus("error");
          setErrorMessage(`Scaleway S3 storage rejected the upload (Status: ${xhr.status} ${xhr.statusText}).`);
        }
      };

      xhr.onerror = () => {
        setStatus("error");
        setErrorMessage("Network error during direct S3 transmission. Please check your internet connection or bucket CORS settings.");
      };

      xhr.ontimeout = () => {
        setStatus("error");
        setErrorMessage("Upload connection timed out. For large files, verify network stability and ticket expiry.");
      };

      // Direct upload of raw file binary payload
      xhr.send(file);
    } catch (err: any) {
      console.error("[SCALEWAY UPLOAD ERROR]", err);
      setStatus("error");
      setErrorMessage(err?.message || "An unexpected error occurred while initiating the upload.");
    }
  };

  const handleCancel = () => {
    if (xhrRef.current && status === "uploading") {
      xhrRef.current.abort();
    }
    setStatus("idle");
    setProgress(0);
    setUploadedBytes(0);
  };

  const handleReset = () => {
    handleCancel();
    setFile(null);
    setUploadedKey(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`w-full rounded-xl bg-[#0d1117] border border-[#21262d] p-6 text-gray-200 font-sans shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-[#21262d] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-wide">{title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            200MB Max
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Scaleway S3
          </span>
        </div>
      </div>

      {/* Dropzone & File Picker */}
      {status !== "complete" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => {
            if (status === "idle" || status === "error") {
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging 
              ? "border-white bg-white/5" 
              : file 
              ? "border-[#30363d] bg-[#161b22]" 
              : "border-[#30363d] hover:border-gray-500 bg-[#090d13]"
          } ${status === "generating" || status === "uploading" ? "pointer-events-none opacity-80" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-left overflow-hidden">
                <div className="w-9 h-9 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  {file.name.endsWith(".zip") ? (
                    <FileArchive className="w-5 h-5" />
                  ) : (
                    <Music className="w-5 h-5" />
                  )}
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.size)} • {file.type || "application/zip"}
                  </p>
                </div>
              </div>

              {status === "idle" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center text-gray-400 group-hover:text-white">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Click to browse or drag & drop `.zip` music archive
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports up to 200MB lossless stems, master tracks, and session archives
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Status Progress Card */}
      {status !== "idle" && (
        <div className="mt-4 p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-3">
          {/* Status 1: Generating Ticket */}
          {status === "generating" && (
            <div className="flex items-center space-x-3 text-white">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <div>
                <p className="text-sm font-semibold tracking-wide">Generating Ticket...</p>
                <p className="text-xs text-gray-400">Requesting 300s presigned PUT token from Scaleway S3 API</p>
              </div>
            </div>
          )}

          {/* Status 2: Uploading directly to storage */}
          {status === "uploading" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-sm font-semibold tracking-wide">Uploading directly to storage...</span>
                </div>
                <span className="text-xs font-mono font-medium text-white">{progress}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#0d1117] rounded-full h-2 overflow-hidden border border-[#30363d]">
                <div
                  className="bg-white h-full rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>{formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}</span>
                <span>Bypassing 4.5MB Vercel proxy</span>
              </div>
            </div>
          )}

          {/* Status 3: Upload Complete */}
          {status === "complete" && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-emerald-400">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <p className="text-sm font-bold tracking-wide">Upload Complete</p>
                  <p className="text-xs text-gray-400">Successfully stored in Scaleway bucket <code className="text-white">owl</code></p>
                </div>
              </div>

              {uploadedKey && (
                <div className="p-2.5 rounded bg-[#090d13] border border-[#21262d] text-xs font-mono break-all text-gray-300 flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-sans tracking-wider">Object Key:</span>
                    <span>{uploadedKey}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
                <span className="text-xs text-gray-400">File size: {file ? formatFileSize(file.size) : "200MB"}</span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-white transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload Another File</span>
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="space-y-2">
              <div className="flex items-start space-x-2 text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Upload Failed</p>
                  <p className="text-xs text-rose-300/80 mt-0.5">{errorMessage || "Unknown transmission error."}</p>
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-white"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  className="px-3 py-1 text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md hover:bg-rose-500/30"
                >
                  Retry Upload
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      {status === "idle" && file && (
        <div className="mt-4 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-200 text-black shadow-md transition active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Directly to Scaleway</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ScalewayUploader;
