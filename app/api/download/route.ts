import { NextRequest, NextResponse } from "next/server";
import type { DownloadRequestBody } from "@/types";
import { buildMockupZip } from "@/lib/zipGenerator";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DownloadRequestBody;
    const { mockups, zipFileName } = body;

    if (!mockups?.length) {
      return NextResponse.json({ success: false, error: "No mockups provided." }, { status: 400 });
    }

    const zipBuffer = await buildMockupZip(mockups);
    const fileName = (zipFileName ?? "packaging-mockups").replace(/[^a-z0-9\-_]+/gi, "_") + ".zip";

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(zipBuffer.byteLength),
      },
    });
  } catch (err) {
    console.error("[/api/download] error:", err);
    const message = err instanceof Error ? err.message : "Failed to build ZIP.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
