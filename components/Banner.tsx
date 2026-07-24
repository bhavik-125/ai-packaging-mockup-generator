"use client";

import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BannerProps {
  tone?: "error" | "info";
  message: string;
  onDismiss?: () => void;
}

export function Banner({ tone = "info", message, onDismiss }: BannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] animate-fade-in",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          : "border-accent/20 bg-accent/5 text-foreground"
      )}
    >
      {tone === "error" ? (
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      ) : (
        <Info size={16} className="mt-0.5 shrink-0 text-accent" />
      )}
      <p className="flex-1 leading-snug">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
