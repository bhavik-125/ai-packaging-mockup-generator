"use client";

import type { ProcessingProgress } from "@/types";

export function ProgressBar({ progress }: { progress: ProcessingProgress }) {
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 animate-fade-in">
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="font-medium">
          Generating mockups… {progress.completed}/{progress.total}
        </span>
        <span className="text-muted">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {(progress.currentLabel || progress.currentTemplate) && (
        <p className="mt-2 text-[11.5px] text-muted">
          {progress.currentLabel} → {progress.currentTemplate}
        </p>
      )}
    </div>
  );
}
