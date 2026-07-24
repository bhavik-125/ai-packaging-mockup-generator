"use client";

import { X, Wand2 } from "lucide-react";
import type { UploadedLabel } from "@/types";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LabelStripProps {
  labels: UploadedLabel[];
  onRemove: (id: string) => void;
}

export function LabelStrip({ labels, onRemove }: LabelStripProps) {
  if (!labels.length) return null;

  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-muted">
        {labels.length} label{labels.length > 1 ? "s" : ""} ready
      </p>
      <div className="flex flex-wrap gap-3">
        {labels.map((label) => (
          <div
            key={label.id}
            className="group relative flex w-[132px] flex-col overflow-hidden rounded-xl border border-border bg-surface animate-fade-in"
          >
            <button
              onClick={() => onRemove(label.id)}
              aria-label={`Remove ${label.fileName}`}
              className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
            >
              <X size={13} />
            </button>
            <div
              className="flex h-24 items-center justify-center bg-[repeating-conic-gradient(#00000008_0%_25%,transparent_0%_50%)] bg-[length:14px_14px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={label.dataUrl} alt={label.fileName} className="max-h-full max-w-full object-contain p-2" />
            </div>
            <div className="px-2.5 py-2">
              <p className="truncate text-[11.5px] font-medium">{label.fileName}</p>
              <div className="mt-0.5 flex items-center justify-between">
                <p className="text-[10.5px] text-muted">{formatBytes(label.sizeBytes)}</p>
                {label.hadBackgroundRemoved && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[9.5px] font-medium text-accent"
                    )}
                    title="Background removed"
                  >
                    <Wand2 size={9} /> BG
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
