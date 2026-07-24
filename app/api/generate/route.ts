import { NextRequest, NextResponse } from "next/server";
import type { GenerateRequestBody, GenerateResponseBody, GeneratedMockup } from "@/types";
import { loadTemplatesByIds } from "@/lib/templateLoader";
import { compositeLabelOntoTemplate } from "@/lib/imageProcessor";
import { parseDataUrl } from "@/utils/validation";
import { generateId } from "@/utils/id";

export const runtime = "nodejs";
export const maxDuration = 60;

// Guardrail so a single request can't blow past Vercel's serverless function
// duration limits. Batches larger than this should be split client-side into
// multiple sequential calls (the frontend does this automatically).
const MAX_COMBINATIONS_PER_REQUEST = 24;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequestBody;
    const { labels, templateIds } = body;

    if (!labels?.length || !templateIds?.length) {
      return NextResponse.json<GenerateResponseBody>(
        { success: false, error: "At least one label and one template are required." },
        { status: 400 }
      );
    }

    const templates = loadTemplatesByIds(templateIds);
    if (!templates.length) {
      return NextResponse.json<GenerateResponseBody>(
        { success: false, error: "None of the requested templates were found." },
        { status: 400 }
      );
    }

    const totalCombinations = labels.length * templates.length;
    if (totalCombinations > MAX_COMBINATIONS_PER_REQUEST) {
      return NextResponse.json<GenerateResponseBody>(
        {
          success: false,
          error: `Requested ${totalCombinations} mockups in one call, which exceeds the ${MAX_COMBINATIONS_PER_REQUEST}-per-request limit used to stay within serverless time limits. Please generate in smaller batches.`,
        },
        { status: 400 }
      );
    }

    const mockups: GeneratedMockup[] = [];
    const warnings: string[] = [];

    for (const label of labels) {
      let labelBuffer: Buffer;
      try {
        labelBuffer = parseDataUrl(label.dataUrl).buffer;
      } catch {
        warnings.push(`Skipped "${label.fileName}": invalid image data.`);
        continue;
      }

      for (const template of templates) {
        try {
          const { buffer, width, height } = await compositeLabelOntoTemplate({
            labelBuffer,
            template,
          });

          const baseName = stripExtension(label.fileName);
          const fileName = `${baseName}__${template.id}.png`;

          mockups.push({
            id: generateId("mockup"),
            labelId: label.id,
            labelFileName: label.fileName,
            templateId: template.id,
            templateName: template.name,
            fileName,
            dataUrl: `data:image/png;base64,${buffer.toString("base64")}`,
            width,
            height,
          });
        } catch (err) {
          console.error(`[/api/generate] failed for ${label.fileName} x ${template.id}:`, err);
          warnings.push(
            `Failed to generate "${template.name}" for "${label.fileName}": ${
              err instanceof Error ? err.message : "unknown error"
            }`
          );
        }
      }
    }

    if (!mockups.length) {
      return NextResponse.json<GenerateResponseBody>(
        { success: false, error: "No mockups could be generated.", warnings },
        { status: 500 }
      );
    }

    return NextResponse.json<GenerateResponseBody>({
      success: true,
      mockups,
      warnings: warnings.length ? warnings : undefined,
    });
  } catch (err) {
    console.error("[/api/generate] error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate mockups.";
    return NextResponse.json<GenerateResponseBody>({ success: false, error: message }, { status: 500 });
  }
}

function stripExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  const stem = idx > 0 ? fileName.slice(0, idx) : fileName;
  return stem.replace(/[^a-z0-9\-_]+/gi, "_");
}
