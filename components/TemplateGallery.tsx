"use client";

import { Check } from "lucide-react";
import type { PackagingTemplate } from "@/types";
import { cn } from "@/lib/utils";

interface TemplateGalleryProps {
  templates: PackagingTemplate[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

export function TemplateGallery({ templates, selectedIds, onToggle, onSelectAll, onClear }: TemplateGalleryProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted">
          {selectedIds.length} of {templates.length} templates selected
        </p>
        <div className="flex gap-3">
          <button onClick={onSelectAll} className="text-[12.5px] font-medium text-accent hover:underline">
            Select all
          </button>
          <button onClick={onClear} className="text-[12.5px] font-medium text-muted hover:underline">
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {templates.map((template) => {
          const selected = selectedIds.includes(template.id);
          return (
            <button
              key={template.id}
              onClick={() => onToggle(template.id)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-surface text-left transition-all",
                selected ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-muted"
              )}
            >
              <div className="relative aspect-[9/11] w-full overflow-hidden bg-[var(--background)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.image}
                  alt={template.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  className={cn(
                    "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                    selected
                      ? "border-accent bg-accent text-white scale-100"
                      : "border-white/70 bg-black/25 text-transparent scale-90 backdrop-blur"
                  )}
                >
                  <Check size={13} strokeWidth={3} />
                </div>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-[13px] font-semibold leading-tight">{template.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{template.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
