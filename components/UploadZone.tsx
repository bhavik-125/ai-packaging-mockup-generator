"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_UPLOAD_BYTES } from "@/utils/validation";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
}

export function UploadZone({ onFilesSelected, isUploading }: UploadZoneProps) {
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setRejectionError(
        rejections.length
          ? `${rejections.length} file(s) were skipped — check type (PNG/JPG/SVG/PDF) and size (≤15MB).`
          : null
      );
      if (accepted.length) onFilesSelected(accepted);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: MAX_UPLOAD_BYTES,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/svg+xml": [".svg"],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all cursor-pointer",
          isDragActive ? "border-accent bg-accent/5 scale-[1.01]" : "border-border bg-surface hover:bg-surface-hover"
        )}
      >
        <input {...getInputProps()} />
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent transition-transform",
            isDragActive && "scale-110"
          )}
        >
          {isUploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
        </div>
        <div>
          <p className="text-[15px] font-medium">
            {isUploading ? "Processing labels…" : isDragActive ? "Drop to upload" : "Drag & drop your label artwork"}
          </p>
          <p className="mt-1 text-[13px] text-muted">PNG, JPG, SVG or PDF · up to 15MB each · multiple files supported</p>
        </div>
        <span className="mt-1 rounded-full border border-border px-4 py-1.5 text-[13px] font-medium group-hover:border-accent group-hover:text-accent transition-colors">
          Browse files
        </span>
      </div>
      {rejectionError && <p className="mt-2 text-[12px] text-red-500">{rejectionError}</p>}
    </div>
  );
}
