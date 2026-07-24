/**
 * Shared type definitions for the AI Packaging Mockup Generator.
 */

/** The rectangular (optionally rotated) area on a template where a label gets composited. */
export interface LabelArea {
  /** X offset in pixels, measured from the top-left of the template image. */
  x: number;
  /** Y offset in pixels, measured from the top-left of the template image. */
  y: number;
  /** Width of the label area in pixels. */
  width: number;
  /** Height of the label area in pixels. */
  height: number;
  /** Rotation of the label area in degrees (clockwise). */
  rotation: number;
  /** Corner radius applied to the composited label, in pixels. */
  borderRadius: number;
  /** Opacity of the label once composited (0-1). Useful for glass/translucent jars. */
  opacity?: number;
  /** Optional soft-light shading overlay to sell the "wrapped around the product" look. */
  applyShading?: boolean;
  /** How the label should be fit inside the label area. */
  fit?: "cover" | "contain" | "fill";
}

/** A single named "hotspot" for templates that expose more than one label area (e.g. front + back). */
export interface TemplateLabelSlot extends LabelArea {
  id: string;
  name: string;
}

/** Full configuration for a packaging template, as stored in /template-data/*.json */
export interface PackagingTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Path (relative to /public) to the base packaging photo/render. */
  image: string;
  /** Pixel dimensions of the base template image. */
  canvas: {
    width: number;
    height: number;
  };
  /** Primary label area. Kept for backwards compatibility with the single-slot workflow. */
  labelArea: LabelArea;
  /** Optional additional label slots (e.g. a jar with a front + back label). */
  additionalSlots?: TemplateLabelSlot[];
  /** Background color rendered behind the template (useful for transparent PNG templates). */
  backgroundColor?: string;
}

export type TemplateCategory =
  | "jar"
  | "bottle"
  | "box"
  | "pouch"
  | "sachet";

/** Metadata describing an uploaded label, once processed and stored server-side for the session. */
export interface UploadedLabel {
  id: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  /** Base64 data URL of the processed (background-removed, if applicable) PNG. */
  dataUrl: string;
  hadBackgroundRemoved: boolean;
  sizeBytes: number;
}

/** Result of generating a single mockup (one label x one template). */
export interface GeneratedMockup {
  id: string;
  labelId: string;
  labelFileName: string;
  templateId: string;
  templateName: string;
  fileName: string;
  dataUrl: string;
  width: number;
  height: number;
}

/** Request body for POST /api/upload */
export interface UploadRequestBody {
  fileName: string;
  mimeType: string;
  /** Base64 data URL of the raw uploaded file. */
  dataUrl: string;
  removeBackground: boolean;
}

export interface UploadResponseBody {
  success: boolean;
  label?: UploadedLabel;
  error?: string;
}

/** Request body for POST /api/generate */
export interface GenerateRequestBody {
  labels: UploadedLabel[];
  templateIds: string[];
}

export interface GenerateResponseBody {
  success: boolean;
  mockups?: GeneratedMockup[];
  error?: string;
  /** Present if some combinations failed while others succeeded. */
  warnings?: string[];
}

/** Request body for POST /api/download (ZIP export) */
export interface DownloadRequestBody {
  mockups: GeneratedMockup[];
  zipFileName?: string;
}

export interface ProcessingProgress {
  total: number;
  completed: number;
  currentLabel?: string;
  currentTemplate?: string;
}
