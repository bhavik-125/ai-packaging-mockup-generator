export const ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "application/pdf",
] as const;

export const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg", ".pdf"];

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB per file, generous for a label

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUpload(fileName: string, mimeType: string, sizeBytes: number): ValidationResult {
  const ext = "." + (fileName.split(".").pop() ?? "").toLowerCase();

  const mimeOk = (ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType);
  const extOk = ACCEPTED_EXTENSIONS.includes(ext);

  if (!mimeOk && !extOk) {
    return {
      valid: false,
      error: `Unsupported file type "${mimeType || ext}". Please upload a PNG, JPG, SVG or PDF.`,
    };
  }

  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB). Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`,
    };
  }

  return { valid: true };
}

export function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid data URL format.");
  }
  const [, mimeType, base64] = match;
  return { mimeType, buffer: Buffer.from(base64, "base64") };
}
