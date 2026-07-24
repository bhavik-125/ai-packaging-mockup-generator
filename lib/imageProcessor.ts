import sharp from "sharp";
import type { LabelArea, PackagingTemplate } from "@/types";
import { templateImagePath } from "@/lib/templateLoader";

export interface CompositeOptions {
  /** Raw bytes of the (already background-processed) label PNG. */
  labelBuffer: Buffer;
  template: PackagingTemplate;
  /** Override the template's default label area (used for multi-slot templates). */
  labelArea?: LabelArea;
}

/**
 * Builds a rounded-rect (or plain rect) alpha mask as an SVG buffer, used to
 * clip the label's corners and, in the same pass, apply a uniform opacity.
 */
function roundedMaskSvg(width: number, height: number, radius: number, opacity: number): Buffer {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" rx="${r}" ry="${r}"
            fill="#000000" fill-opacity="${opacity}" />
    </svg>
  `;
  return Buffer.from(svg);
}

/**
 * Resizes the label to fill (or fit within) the target label-area box
 * according to `fit`, returning a buffer already cropped/padded to exactly
 * targetW x targetH.
 */
async function fitLabelToBox(
  labelBuffer: Buffer,
  targetW: number,
  targetH: number,
  fit: "cover" | "contain" | "fill"
): Promise<Buffer> {
  const w = Math.round(targetW);
  const h = Math.round(targetH);

  if (fit === "fill") {
    return sharp(labelBuffer).resize(w, h, { fit: "fill" }).png().toBuffer();
  }

  if (fit === "contain") {
    return sharp(labelBuffer)
      .resize(w, h, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  }

  // "cover" (default) — fill the box completely, cropping any overflow, centered.
  return sharp(labelBuffer)
    .resize(w, h, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

/**
 * Produces a "shading" overlay sampled from the template's own pixels under
 * the label area. Blending this back over the label at reduced opacity using
 * a soft-light blend sells the illusion that the label is actually wrapped
 * around / printed onto a lit, three-dimensional object, without any real
 * 3D rendering or computer vision.
 */
async function buildShadingLayer(
  templatePath: string,
  area: { x: number; y: number; width: number; height: number },
  targetW: number,
  targetH: number
): Promise<Buffer> {
  const crop = await sharp(templatePath)
    .extract({
      left: Math.round(area.x),
      top: Math.round(area.y),
      width: Math.round(area.width),
      height: Math.round(area.height),
    })
    .resize(targetW, targetH, { fit: "fill" })
    .greyscale()
    .modulate({ brightness: 1.0 })
    .toBuffer();

  // Reduce the shading layer's strength via an alpha mask so it tints rather
  // than replaces the label artwork underneath it.
  const mask = Buffer.from(
    `<svg width="${targetW}" height="${targetH}"><rect width="100%" height="100%" fill="#000" fill-opacity="0.38"/></svg>`
  );

  return sharp(crop)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

/**
 * Composites a single processed label onto a single packaging template,
 * returning the finished mockup as a PNG buffer.
 */
export async function compositeLabelOntoTemplate({
  labelBuffer,
  template,
  labelArea,
}: CompositeOptions): Promise<{ buffer: Buffer; width: number; height: number }> {
  const area = labelArea ?? template.labelArea;
  const templatePath = templateImagePath(template);

  const targetW = Math.round(area.width);
  const targetH = Math.round(area.height);

  // 1. Resize the label to fill the target label area.
  let fitted = await fitLabelToBox(labelBuffer, targetW, targetH, area.fit ?? "cover");

  // 2. Apply rounded corners + uniform opacity in a single dest-in pass.
  const mask = roundedMaskSvg(targetW, targetH, area.borderRadius, area.opacity ?? 1);
  fitted = await sharp(fitted)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  // 3. Optional shading pass so the label reads as "on" the packaging rather
  //    than floating flat above it.
  if (area.applyShading) {
    const shading = await buildShadingLayer(templatePath, area, targetW, targetH);
    fitted = await sharp(fitted)
      .composite([{ input: shading, blend: "soft-light" }])
      .png()
      .toBuffer();
  }

  // 4. Rotate, if requested, expanding the canvas so nothing gets clipped,
  //    then re-center the offset so the rotated patch still lands on the
  //    same midpoint as the un-rotated label area.
  let placeLeft = Math.round(area.x);
  let placeTop = Math.round(area.y);

  if (area.rotation && area.rotation % 360 !== 0) {
    const rotated = sharp(fitted).rotate(area.rotation, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    const meta = await rotated.metadata();
    const rotatedBuffer = await rotated.png().toBuffer();
    const newW = meta.width ?? targetW;
    const newH = meta.height ?? targetH;
    const centerX = area.x + targetW / 2;
    const centerY = area.y + targetH / 2;
    placeLeft = Math.round(centerX - newW / 2);
    placeTop = Math.round(centerY - newH / 2);
    fitted = rotatedBuffer;
  }

  // 5. Composite the finished label patch onto the base packaging photo.
  const base = sharp(templatePath);
  const baseMeta = await base.metadata();

  const finalBuffer = await base
    .composite([{ input: fitted, left: placeLeft, top: placeTop, blend: "over" }])
    .png({ palette: false })
    .toBuffer();

  return {
    buffer: finalBuffer,
    width: baseMeta.width ?? template.canvas.width,
    height: baseMeta.height ?? template.canvas.height,
  };
}

/**
 * Normalizes any supported incoming image (PNG/JPG/etc, already-decoded
 * buffer) into a clean PNG buffer with alpha channel, capped to a sane
 * maximum dimension to keep serverless memory/time bounded.
 */
export async function normalizeToPng(input: Buffer, maxDimension = 2000): Promise<Buffer> {
  return sharp(input)
    .rotate() // auto-orient based on EXIF
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .png()
    .toBuffer();
}

export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const meta = await sharp(buffer).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}
