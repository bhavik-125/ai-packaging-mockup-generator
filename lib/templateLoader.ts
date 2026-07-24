import fs from "node:fs";
import path from "node:path";
import type { PackagingTemplate } from "@/types";

const TEMPLATE_DATA_DIR = path.join(process.cwd(), "template-data");

let cache: PackagingTemplate[] | null = null;

/**
 * Loads every packaging template definition from /template-data/*.json.
 * Results are cached in-memory for the lifetime of the serverless function
 * instance — the files never change at runtime.
 */
export function loadAllTemplates(): PackagingTemplate[] {
  if (cache) return cache;

  if (!fs.existsSync(TEMPLATE_DATA_DIR)) {
    throw new Error(
      `Template data directory not found at ${TEMPLATE_DATA_DIR}. Run "npm run generate-templates" first.`
    );
  }

  const files = fs
    .readdirSync(TEMPLATE_DATA_DIR)
    .filter((f) => f.endsWith(".json") && f !== "manifest.json");

  const templates = files.map((file) => {
    const raw = fs.readFileSync(path.join(TEMPLATE_DATA_DIR, file), "utf-8");
    return JSON.parse(raw) as PackagingTemplate;
  });

  // Keep a stable, predictable ordering in the UI.
  templates.sort((a, b) => a.name.localeCompare(b.name));

  cache = templates;
  return templates;
}

export function loadTemplateById(id: string): PackagingTemplate | undefined {
  return loadAllTemplates().find((t) => t.id === id);
}

export function loadTemplatesByIds(ids: string[]): PackagingTemplate[] {
  const all = loadAllTemplates();
  return ids
    .map((id) => all.find((t) => t.id === id))
    .filter((t): t is PackagingTemplate => Boolean(t));
}

/** Absolute filesystem path to a template's base packaging image, for reading with sharp. */
export function templateImagePath(template: PackagingTemplate): string {
  // template.image is a public-relative path like "/templates/round-jar.png"
  return path.join(process.cwd(), "public", template.image.replace(/^\//, ""));
}
