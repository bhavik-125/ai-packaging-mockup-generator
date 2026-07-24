import JSZip from "jszip";
import type { GeneratedMockup } from "@/types";

/**
 * Bundles a set of generated mockups (each carrying a base64 data URL) into
 * a single downloadable ZIP archive, organized as:
 *   /<template-name>/<label-file-name>__<template-name>.png
 */
export async function buildMockupZip(mockups: GeneratedMockup[]): Promise<Buffer> {
  const zip = new JSZip();

  for (const mockup of mockups) {
    const folder = zip.folder(sanitizeSegment(mockup.templateName)) ?? zip;
    const base64 = mockup.dataUrl.split(",")[1] ?? "";
    folder.file(mockup.fileName, base64, { base64: true });
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return buffer;
}

function sanitizeSegment(name: string): string {
  return name.replace(/[^a-z0-9\-_ ]/gi, "").trim() || "mockups";
}
