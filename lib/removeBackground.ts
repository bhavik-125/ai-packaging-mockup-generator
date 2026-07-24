import sharp from "sharp";

/**
 * Lightweight, dependency-free background removal.
 *
 * This is NOT a machine-learning segmentation model (there is intentionally
 * no Python/OpenCV in this project so it can run on the Vercel Hobby plan).
 * Instead it uses a classic "color-key" approach that works well for the
 * overwhelmingly common case of product labels exported on a flat white (or
 * near-flat) background:
 *
 *  1. Sample the four corners of the image to estimate the background color.
 *  2. Walk every pixel and compute its Euclidean distance, in RGB space,
 *     from that background color.
 *  3. Pixels within `threshold` become fully transparent; pixels within the
 *     next `featherRange` get a smooth partial-alpha ramp so edges don't get
 *     a hard cutout ("jaggies"); everything else is left untouched.
 *
 * If the source image already has meaningful transparency (i.e. it's
 * already a proper transparent PNG), this function short-circuits and
 * returns the image unmodified, per the spec ("Keep transparent PNG
 * untouched").
 */
export async function removeWhiteBackground(input: Buffer): Promise<Buffer> {
  const image = sharp(input).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  if (channels < 4) {
    // Shouldn't happen since we called ensureAlpha(), but guard anyway.
    return sharp(input).png().toBuffer();
  }

  if (alreadyHasTransparency(data, width, height, channels)) {
    return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
  }

  const bg = sampleCornerColor(data, width, height, channels);

  const threshold = 28; // fully transparent below this distance
  const featherRange = 42; // additional distance over which alpha ramps back up

  const out = Buffer.from(data); // clone, we mutate alpha only

  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    const dist = colorDistance(r, g, b, bg.r, bg.g, bg.b);

    if (dist <= threshold) {
      out[idx + 3] = 0;
    } else if (dist <= threshold + featherRange) {
      const t = (dist - threshold) / featherRange; // 0..1
      out[idx + 3] = Math.round(data[idx + 3] * easeInOutCubic(t));
    }
    // else: leave alpha untouched (fully opaque foreground pixel)
  }

  return sharp(out, { raw: { width, height, channels } }).png().toBuffer();
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sampleCornerColor(
  data: Buffer,
  width: number,
  height: number,
  channels: number
): { r: number; g: number; b: number } {
  const samplePoints: [number, number][] = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  const sampleSize = Math.max(1, Math.floor(Math.min(width, height) * 0.02));

  for (const [cx, cy] of samplePoints) {
    for (let dy = -sampleSize; dy <= sampleSize; dy++) {
      for (let dx = -sampleSize; dx <= sampleSize; dx++) {
        const x = clamp(cx + dx, 0, width - 1);
        const y = clamp(cy + dy, 0, height - 1);
        const idx = (y * width + x) * channels;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
    }
  }

  return { r: r / count, g: g / count, b: b / count };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Heuristic: if a meaningful fraction of pixels are already non-opaque, treat as pre-cut. */
function alreadyHasTransparency(data: Buffer, width: number, height: number, channels: number): boolean {
  if (channels < 4) return false;
  const totalPixels = width * height;
  const sampleEvery = Math.max(1, Math.floor(totalPixels / 5000)); // sample ~5000 pixels
  let transparentCount = 0;
  let sampled = 0;

  for (let i = 0; i < totalPixels; i += sampleEvery) {
    const idx = i * channels;
    if (data[idx + 3] < 250) transparentCount++;
    sampled++;
  }

  return sampled > 0 && transparentCount / sampled > 0.02;
}
