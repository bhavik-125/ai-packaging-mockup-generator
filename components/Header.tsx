"use client";

import { Package2, UploadCloud } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-black">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white">
            <Package2 size={18} />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-white">Packaging Mockup Generator</p>
            <p className="text-[12px] text-gray-400">Upload one label. Generate real product-family photos.</p>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors">
          <UploadCloud size={14} />
          Upload label
        </button>
      </div>
    </header>
  );
}
