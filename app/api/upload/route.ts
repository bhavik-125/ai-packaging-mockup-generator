import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import type { UploadRequestBody, UploadResponseBody, UploadedLabel } from "@/types";
import { validateUpload, parseDataUrl } from "@/utils/validation";
import { generateId } from "@/utils/id";
import { normalizeToPng, getImageDimensions } from "@/lib/imageProcessor";
import { removeWhiteBackground } from "@/lib/removeBackground";
import { extractImageFromPdf, isPdf } from "@/lib/pdfConverter";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UploadRequestBody;
    const { fileName, mimeType, dataUrl, removeBackground } = body;

    if (!fileName || !dataUrl) {
      return NextResponse.json<UploadResponseBody>(
        { success: false, error: "Missing fileName or dataUrl." },
        { status: 400 }
      );
    }

    const { buffer: rawBuffer } = parseDataUrl(dataUrl);

    const validation = validateUpload(fileName, mimeType, rawBuffer.byteLength);
    if (!validation.valid) {
      return NextResponse.json<UploadResponseBody>(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 1. Get a decodable raster buffer regardless of source format.
    let decodable: Buffer;
    if (isPdf(mimeType, fileName)) {
      decodable = await extractImageFromPdf(rawBuffer);
    } else if (mimeType === "image/svg+xml" || fileName.toLowerCase().endsWith(".svg")) {
      // sharp can rasterize SVG natively.
      decodable = await sharp(rawBuffer, { density: 300 }).png().toBuffer();
    } else {
      decodable = rawBuffer;
    }

    // 2. Normalize to a clean, bounded PNG.
    let processed = await normalizeToPng(decodable);
    let hadBackgroundRemoved = false;

    // 3. Optionally remove a flat/near-flat background (no-op if already transparent).
    if (removeBackground) {
      processed = await removeWhiteBackground(processed);
      hadBackgroundRemoved = true;
    }

    const { width, height } = await getImageDimensions(processed);
    const outDataUrl = `data:image/png;base64,${processed.toString("base64")}`;

    const label: UploadedLabel = {
      id: generateId("label"),
      fileName,
      mimeType: "image/png",
      width,
      height,
      dataUrl: outDataUrl,
      hadBackgroundRemoved,
      sizeBytes: processed.byteLength,
    };

    return NextResponse.json<UploadResponseBody>({ success: true, label });
  } catch (err) {
    console.error("[/api/upload] error:", err);
    const message = err instanceof Error ? err.message : "Failed to process upload.";
    // Errors that are really about *what the user uploaded* (bad PDF content,
    // corrupt image, etc.) are surfaced as 400s so the UI treats them as
    // recoverable input problems rather than server failures.
    const isUserFixable = /PDF|raster|vector|image format|Invalid data URL/i.test(message);
    return NextResponse.json<UploadResponseBody>(
      { success: false, error: message },
      { status: isUserFixable ? 400 : 500 }
    );
  }
}
