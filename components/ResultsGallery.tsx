"use client";

import { useState } from "react";
import { Download, PackageCheck, X } from "lucide-react";
import type { GeneratedMockup } from "@/types";
import { Button } from "@/components/Button";

interface ResultsGalleryProps {
  mockups: GeneratedMockup[];
  onDownloadAll: () => void;
  isZipping: boolean;
}

export function ResultsGallery({ mockups, onDownloadAll, isZipping }: ResultsGalleryProps) {
  const [preview, setPreview] = useState<GeneratedMockup | null>(null);

  if (!mockups.length) return null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PackageCheck size={17} className="text-accent" />
          <p className="text-[14px] font-semibold">
            {mockups.length} mockup{mockups.length > 1 ? "s" : ""} generated
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onDownloadAll} loading={isZipping}>
          <Download size={14} />
          Download all (.zip)
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {mockups.map((mockup) => (
          <div
            key={mockup.id}
            className="group overflow-hidden rounded-2xl border border-border bg-surface animate-fade-in"
          >
            <button
              onClick={() => setPreview(mockup)}
              className="block aspect-[9/11] w-full overflow-hidden bg-[var(--background)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mockup.dataUrl}
                alt={mockup.fileName}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
            <div className="flex items-center justify-between gap-1.5 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium">{mockup.templateName}</p>
                <p className="truncate text-[10.5px] text-muted">{mockup.labelFileName}</p>
              </div>
              <a
                href={mockup.dataUrl}
                download={mockup.fileName}
                aria-label={`Download ${mockup.fileName}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border hover:border-accent hover:text-accent transition-colors"
              >
                <Download size={13} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreview(null)}
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={18} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.dataUrl}
            alt={preview.fileName}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
