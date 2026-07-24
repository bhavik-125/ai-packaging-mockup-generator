"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Box, Share2, Copy, Check, ExternalLink } from "lucide-react";
import type { UploadedLabel, UploadRequestBody, UploadResponseBody } from "@/types";
import { Jar3DViewer } from "./Jar3DViewer";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function MockupStudio() {
  const [topLabel, setTopLabel] = useState<UploadedLabel | null>(null);
  const [bottomLabel, setBottomLabel] = useState<UploadedLabel | null>(null);
  const [isUploadingTop, setIsUploadingTop] = useState(false);
  const [isUploadingBottom, setIsUploadingBottom] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const topFileInputRef = useRef<HTMLInputElement>(null);
  const bottomFileInputRef = useRef<HTMLInputElement>(null);

  const handleShare = async () => {
    if (!topLabel && !bottomLabel) return;
    setIsSharing(true);
    setShareError(null);
    setShareUrl(null);
    setCopied(false);

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topLabel: topLabel?.dataUrl,
          bottomLabel: bottomLabel?.dataUrl,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to generate share link.");
      }
      
      const params = new URLSearchParams();
      if (json.urls.top) params.set("top", json.urls.top);
      if (json.urls.bottom) params.set("bottom", json.urls.bottom);
      
      const url = `${window.location.origin}/share?${params.toString()}`;
      setShareUrl(url);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : "Sharing failed");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFilesSelected = useCallback(
    async (files: FileList | null, target: "top" | "bottom") => {
      if (!files || files.length === 0) return;
      const file = files[0];
      
      if (target === "top") setIsUploadingTop(true);
      else setIsUploadingBottom(true);
      
      setUploadError(null);

      try {
        const dataUrl = await fileToDataUrl(file);
        const body: UploadRequestBody = {
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
          removeBackground: true,
        };
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as UploadResponseBody;
        if (!json.success || !json.label) {
          setUploadError(`${file.name}: ${json.error ?? "upload failed"}`);
        } else {
          if (target === "top") setTopLabel(json.label);
          else setBottomLabel(json.label);
        }
      } catch (err) {
        setUploadError(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
      
      if (target === "top") {
        setIsUploadingTop(false);
        if (topFileInputRef.current) topFileInputRef.current.value = "";
      } else {
        setIsUploadingBottom(false);
        if (bottomFileInputRef.current) bottomFileInputRef.current.value = "";
      }
    },
    []
  );

  return (
    <div className="mx-auto px-6 py-10 max-w-[1200px] h-[calc(100vh-80px)] flex flex-col">
      <div className="flex flex-col md:flex-row gap-8 h-full">
        
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
          
          {/* Top Label Uploader */}
          <div className="rounded-xl border border-gray-800 bg-[#151515] p-5">
            <StepHeading step={1} label="Upload Top Label" />
            <input
              type="file"
              ref={topFileInputRef}
              className="hidden"
              accept=".png,.jpg,.jpeg"
              onChange={(e) => handleFilesSelected(e.target.files, "top")}
            />
            
            <div 
              onClick={() => topFileInputRef.current?.click()}
              className="mt-4 flex h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 bg-black/40 hover:bg-gray-900 transition-colors"
            >
              {isUploadingTop ? (
                <div className="text-gray-400 flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4188F1] border-t-transparent"></div>
                  <span className="text-[13px]">Uploading...</span>
                </div>
              ) : topLabel ? (
                <div className="flex flex-col items-center text-center">
                  <ImagePlus size={28} className="text-[#4188F1] mb-2" />
                  <span className="text-[13px] text-gray-300 font-medium">{topLabel.fileName}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center text-gray-400">
                  <ImagePlus size={28} className="text-[#4188F1] mb-2" />
                  <span className="text-[13px] font-medium">Click to select top label</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Label Uploader */}
          <div className="rounded-xl border border-gray-800 bg-[#151515] p-5">
            <StepHeading step={2} label="Upload Bottom Label" />
            <input
              type="file"
              ref={bottomFileInputRef}
              className="hidden"
              accept=".png,.jpg,.jpeg"
              onChange={(e) => handleFilesSelected(e.target.files, "bottom")}
            />
            
            <div 
              onClick={() => bottomFileInputRef.current?.click()}
              className="mt-4 flex h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 bg-black/40 hover:bg-gray-900 transition-colors"
            >
              {isUploadingBottom ? (
                <div className="text-gray-400 flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4188F1] border-t-transparent"></div>
                  <span className="text-[13px]">Uploading...</span>
                </div>
              ) : bottomLabel ? (
                <div className="flex flex-col items-center text-center">
                  <ImagePlus size={28} className="text-[#4188F1] mb-2" />
                  <span className="text-[13px] text-gray-300 font-medium">{bottomLabel.fileName}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center text-gray-400">
                  <ImagePlus size={28} className="text-[#4188F1] mb-2" />
                  <span className="text-[13px] font-medium">Click to select bottom label</span>
                </div>
              )}
            </div>
            {uploadError && <p className="mt-2 text-[12px] text-red-500">{uploadError}</p>}
          </div>
          
          <div className="text-[13px] text-gray-400 p-4 border border-gray-800 rounded-xl bg-[#151515]">
            <p className="mb-2 text-white font-medium">Tips for the perfect jar:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Upload two separate designs for the top and bottom sections.</li>
              <li>The top edge color of your Top Label determines the cap color.</li>
              <li>The middle section will naturally reveal the coffee inside.</li>
              <li>Right-click and drag (or two-finger drag) to pan and inspect different parts of the jar.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT MAIN AREA (3D Viewer) */}
        <div className="flex-1 min-w-0 flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Box size={20} className="text-[#4188F1]" />
              <h2 className="text-[18px] font-semibold text-white tracking-tight">Interactive 3D Mockup</h2>
            </div>
            
            <button
              onClick={handleShare}
              disabled={(!topLabel && !bottomLabel) || isSharing}
              className="flex items-center gap-2 rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 px-4 py-2 text-[13px] font-medium text-white transition-colors"
            >
              {isSharing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Share2 size={16} />
              )}
              Share 3D Model
            </button>
          </div>

          {shareUrl && (
            <div className="mb-4 rounded-xl border border-green-900/50 bg-green-900/10 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 overflow-hidden">
                  <p className="text-[13px] text-green-400 font-medium mb-1">Shareable link generated!</p>
                  <p className="text-[12px] text-gray-400 truncate">{shareUrl}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg bg-[#222] hover:bg-[#333] px-3 py-1.5 text-[12px] font-medium text-white transition-colors"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                  <a 
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-[#4188F1] hover:bg-[#5a9aff] px-3 py-1.5 text-[12px] font-medium text-white transition-colors"
                  >
                    <ExternalLink size={14} />
                    Open
                  </a>
                </div>
              </div>
            </div>
          )}

          {shareError && (
            <div className="mb-4 rounded-xl border border-red-900/50 bg-red-900/10 p-4 text-[13px] text-red-400">
              {shareError}
            </div>
          )}

          <div className="flex-1 rounded-xl border border-gray-800 bg-[#151515] p-2 overflow-hidden">
            <Jar3DViewer 
              topLabelUrl={topLabel?.dataUrl} 
              bottomLabelUrl={bottomLabel?.dataUrl} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function StepHeading({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-bold text-black">
        {step}
      </span>
      <h2 className="text-[14.5px] font-semibold text-white tracking-tight">{label}</h2>
    </div>
  );
}
