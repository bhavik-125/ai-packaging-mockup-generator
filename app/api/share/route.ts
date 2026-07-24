import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { parseDataUrl } from "@/utils/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ShareRequestBody {
  topLabel?: string; // dataUrl
  bottomLabel?: string; // dataUrl
}

interface ShareResponseBody {
  success: boolean;
  urls?: {
    top?: string;
    bottom?: string;
  };
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ShareRequestBody;
    const { topLabel, bottomLabel } = body;

    const urls: { top?: string; bottom?: string } = {};

    if (topLabel) {
      const { buffer, mimeType } = parseDataUrl(topLabel);
      const { url } = await put(`share/top-${Date.now()}.png`, buffer, {
        access: "public",
        contentType: mimeType,
      });
      urls.top = url;
    }

    if (bottomLabel) {
      const { buffer, mimeType } = parseDataUrl(bottomLabel);
      const { url } = await put(`share/bottom-${Date.now()}.png`, buffer, {
        access: "public",
        contentType: mimeType,
      });
      urls.bottom = url;
    }

    return NextResponse.json<ShareResponseBody>({ success: true, urls });
  } catch (err) {
    console.error("[/api/share] error:", err);
    return NextResponse.json<ShareResponseBody>(
      { success: false, error: err instanceof Error ? err.message : "Failed to generate share link." },
      { status: 500 }
    );
  }
}
