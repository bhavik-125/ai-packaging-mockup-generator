/**
 * generate-templates.ts
 * ----------------------------------------------------------------------------
 * One-off build script that procedurally renders the base packaging photos
 * used by the app (/public/templates/*.png) from hand-tuned SVG shapes, and
 * writes their matching /template-data/*.json configuration.
 *
 * These are stylised studio-style renders (gradients + soft shadows standing
 * in for real product photography) so the whole project — including its
 * template art — ships with zero external image dependencies and zero
 * licensing concerns. Swap any PNG in /public/templates for a real product
 * photo at any time; see README.md "Adding new packaging templates".
 *
 * Run with: npm run generate-templates
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import type { PackagingTemplate } from "../types";

const CANVAS_W = 900;
const CANVAS_H = 1100;
const OUT_DIR = path.join(process.cwd(), "public", "templates");
const DATA_DIR = path.join(process.cwd(), "template-data");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

function studioBackdrop(): string {
  return `
    <radialGradient id="backdrop" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#fbfbfa"/>
      <stop offset="60%" stop-color="#f1f1ef"/>
      <stop offset="100%" stop-color="#e3e2df"/>
    </radialGradient>
    <rect x="0" y="0" width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#backdrop)"/>
    <ellipse cx="${CANVAS_W / 2}" cy="${CANVAS_H - 90}" rx="260" ry="34" fill="#000000" opacity="0.14"/>
  `;
}

interface TemplateSpec {
  id: string;
  name: string;
  description: string;
  category: PackagingTemplate["category"];
  svgBody: string;
  labelArea: PackagingTemplate["labelArea"];
  additionalSlots?: PackagingTemplate["additionalSlots"];
}

const specs: TemplateSpec[] = [
  // ---------------------------------------------------------------- ROUND JAR
  {
    id: "round-jar",
    name: "Round Glass Jar",
    description: "Classic cylindrical glass jar with a brushed-metal screw lid. Great for jams, honey, skincare balms and spice blends.",
    category: "jar",
    svgBody: `
      <defs>
        <linearGradient id="glass1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#d7dee2"/>
          <stop offset="12%" stop-color="#f5f8f9"/>
          <stop offset="28%" stop-color="#c4cdd2"/>
          <stop offset="50%" stop-color="#eef2f3"/>
          <stop offset="72%" stop-color="#c4cdd2"/>
          <stop offset="88%" stop-color="#f5f8f9"/>
          <stop offset="100%" stop-color="#d7dee2"/>
        </linearGradient>
        <linearGradient id="lid1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#8b8f92"/>
          <stop offset="45%" stop-color="#c7cbcd"/>
          <stop offset="55%" stop-color="#9a9ea1"/>
          <stop offset="100%" stop-color="#6d7174"/>
        </linearGradient>
      </defs>
      <rect x="255" y="330" width="390" height="560" rx="26" fill="url(#glass1)" stroke="#b7c0c4" stroke-width="2"/>
      <rect x="255" y="330" width="390" height="560" rx="26" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.6"/>
      <rect x="290" y="230" width="320" height="120" rx="16" fill="url(#lid1)" stroke="#5f6366" stroke-width="2"/>
      <rect x="290" y="230" width="320" height="18" rx="9" fill="#ffffff" opacity="0.35"/>
      <rect x="255" y="330" width="60" height="560" rx="26" fill="#ffffff" opacity="0.25"/>
    `,
    labelArea: { x: 300, y: 470, width: 300, height: 280, rotation: 0, borderRadius: 14, opacity: 0.96, applyShading: true, fit: "cover" },
  },
  // ------------------------------------------------------------- PREMIUM JAR
  {
    id: "premium-jar",
    name: "Premium Glass Jar",
    description: "Taller apothecary-style jar with a matte black cap — suited for premium skincare, supplements and gourmet foods.",
    category: "jar",
    svgBody: `
      <defs>
        <linearGradient id="glass2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#dfe3e2"/>
          <stop offset="15%" stop-color="#f7f9f8"/>
          <stop offset="35%" stop-color="#cdd2d0"/>
          <stop offset="50%" stop-color="#f1f4f3"/>
          <stop offset="65%" stop-color="#cdd2d0"/>
          <stop offset="85%" stop-color="#f7f9f8"/>
          <stop offset="100%" stop-color="#dfe3e2"/>
        </linearGradient>
        <linearGradient id="lidBlack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3a3a3c"/>
          <stop offset="45%" stop-color="#1c1c1e"/>
          <stop offset="100%" stop-color="#050505"/>
        </linearGradient>
      </defs>
      <rect x="270" y="290" width="360" height="640" rx="18" fill="url(#glass2)" stroke="#c1c6c4" stroke-width="2"/>
      <rect x="300" y="200" width="300" height="110" rx="10" fill="url(#lidBlack)"/>
      <rect x="300" y="200" width="300" height="14" rx="7" fill="#ffffff" opacity="0.15"/>
      <rect x="270" y="290" width="55" height="640" fill="#ffffff" opacity="0.22"/>
    `,
    labelArea: { x: 320, y: 450, width: 260, height: 380, rotation: 0, borderRadius: 8, opacity: 0.97, applyShading: true, fit: "cover" },
  },
  // -------------------------------------------------------------------- V JAR
  {
    id: "v-jar",
    name: "V Jar",
    description: "Tapered cosmetic jar, wide at the shoulder and narrow at the base — the signature silhouette for creams and cosmetics.",
    category: "jar",
    svgBody: `
      <defs>
        <linearGradient id="glass3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#e2e6e5"/>
          <stop offset="20%" stop-color="#f8faf9"/>
          <stop offset="45%" stop-color="#ccd2d0"/>
          <stop offset="55%" stop-color="#f2f5f4"/>
          <stop offset="80%" stop-color="#ccd2d0"/>
          <stop offset="100%" stop-color="#e2e6e5"/>
        </linearGradient>
        <linearGradient id="lidWhite" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="60%" stop-color="#e9e9ea"/>
          <stop offset="100%" stop-color="#cfcfd1"/>
        </linearGradient>
      </defs>
      <path d="M 245 340 L 655 340 L 590 880 Q 450 920 310 880 Z" fill="url(#glass3)" stroke="#c4c9c7" stroke-width="2"/>
      <rect x="270" y="240" width="360" height="105" rx="14" fill="url(#lidWhite)" stroke="#c9c9ca" stroke-width="1.5"/>
      <path d="M 260 340 L 300 340 L 280 850 Z" fill="#ffffff" opacity="0.3"/>
    `,
    labelArea: { x: 330, y: 470, width: 240, height: 300, rotation: 0, borderRadius: 10, opacity: 0.96, applyShading: true, fit: "cover" },
  },
  // ---------------------------------------------------------------- SPECIALITY
  {
    id: "speciality-jar",
    name: "Speciality Jar",
    description: "Hexagonal-faceted specialty jar with a kraft-style lid — a distinctive shape for artisanal and small-batch products.",
    category: "jar",
    svgBody: `
      <defs>
        <linearGradient id="glass4" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#dce1e0"/>
          <stop offset="25%" stop-color="#f6f8f7"/>
          <stop offset="50%" stop-color="#c9cfcd"/>
          <stop offset="75%" stop-color="#f6f8f7"/>
          <stop offset="100%" stop-color="#dce1e0"/>
        </linearGradient>
        <linearGradient id="kraftLid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#b98a5c"/>
          <stop offset="50%" stop-color="#93683f"/>
          <stop offset="100%" stop-color="#6f4b29"/>
        </linearGradient>
      </defs>
      <polygon points="320,330 580,330 660,420 660,830 580,900 320,900 240,830 240,420" fill="url(#glass4)" stroke="#bcc3c0" stroke-width="2"/>
      <rect x="300" y="235" width="300" height="105" rx="10" fill="url(#kraftLid)"/>
      <rect x="300" y="235" width="300" height="14" fill="#ffffff" opacity="0.18"/>
    `,
    labelArea: { x: 310, y: 470, width: 280, height: 300, rotation: 0, borderRadius: 6, opacity: 0.97, applyShading: true, fit: "cover" },
  },
  // -------------------------------------------------------------------- SACHET
  {
    id: "sachet",
    name: "Sachet",
    description: "Flat single-serve sachet with crimped top and bottom seams — ideal for powders, single-use skincare or sample packs.",
    category: "sachet",
    svgBody: `
      <defs>
        <linearGradient id="sachetFoil" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#c7cbce"/>
          <stop offset="10%" stop-color="#eef0f1"/>
          <stop offset="30%" stop-color="#b6bcc0"/>
          <stop offset="50%" stop-color="#e7e9ea"/>
          <stop offset="70%" stop-color="#b6bcc0"/>
          <stop offset="90%" stop-color="#eef0f1"/>
          <stop offset="100%" stop-color="#c7cbce"/>
        </linearGradient>
      </defs>
      <rect x="270" y="270" width="360" height="620" rx="20" fill="url(#sachetFoil)" stroke="#a6acaf" stroke-width="2"/>
      <rect x="270" y="270" width="360" height="34" fill="#9aa0a3"/>
      <rect x="270" y="856" width="360" height="34" fill="#9aa0a3"/>
      <g opacity="0.5" stroke="#ffffff" stroke-width="1.5">
        <line x1="280" y1="287" x2="620" y2="287"/>
        <line x1="280" y1="873" x2="620" y2="873"/>
      </g>
    `,
    labelArea: { x: 300, y: 330, width: 300, height: 500, rotation: 0, borderRadius: 4, opacity: 0.98, applyShading: true, fit: "cover" },
  },
  // -------------------------------------------------------------------- BOTTLE
  {
    id: "bottle",
    name: "Bottle",
    description: "Slim cylindrical bottle with a tapered neck and screw cap — suited to oils, syrups, sauces and beverages.",
    category: "bottle",
    svgBody: `
      <defs>
        <linearGradient id="bottleGlass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#d8dfdc"/>
          <stop offset="15%" stop-color="#f6f9f7"/>
          <stop offset="35%" stop-color="#c3ccc7"/>
          <stop offset="50%" stop-color="#eef3f0"/>
          <stop offset="65%" stop-color="#c3ccc7"/>
          <stop offset="85%" stop-color="#f6f9f7"/>
          <stop offset="100%" stop-color="#d8dfdc"/>
        </linearGradient>
        <linearGradient id="capGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#d9b976"/>
          <stop offset="50%" stop-color="#b3903f"/>
          <stop offset="100%" stop-color="#8a6b28"/>
        </linearGradient>
      </defs>
      <rect x="330" y="150" width="90" height="120" rx="8" fill="url(#capGold)"/>
      <path d="M 330 270 L 420 270 L 440 340 L 460 380 L 460 940 Q 460 970 430 970 L 320 970 Q 290 970 290 940 L 290 380 L 310 340 Z" fill="url(#bottleGlass)" stroke="#b7c1bc" stroke-width="2"/>
      <rect x="300" y="400" width="35" height="540" fill="#ffffff" opacity="0.3"/>
    `,
    labelArea: { x: 300, y: 470, width: 150, height: 380, rotation: 0, borderRadius: 6, opacity: 0.97, applyShading: true, fit: "cover" },
  },
  // ----------------------------------------------------------------------- BOX
  {
    id: "box",
    name: "Box",
    description: "Rectangular retail carton shown front-on — perfect for cereals, supplements, electronics and subscription boxes.",
    category: "box",
    svgBody: `
      <defs>
        <linearGradient id="boxShade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f2f2f0"/>
          <stop offset="50%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#e7e7e4"/>
        </linearGradient>
        <linearGradient id="boxSide" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#c9c9c6"/>
          <stop offset="100%" stop-color="#dcdcd9"/>
        </linearGradient>
        <linearGradient id="boxTop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#e5e5e2"/>
          <stop offset="100%" stop-color="#d0d0cd"/>
        </linearGradient>
      </defs>
      <polygon points="250,330 650,330 650,900 250,900" fill="url(#boxShade)" stroke="#c7c7c4" stroke-width="2"/>
      <polygon points="650,330 710,290 710,860 650,900" fill="url(#boxSide)" stroke="#b9b9b6" stroke-width="1.5"/>
      <polygon points="250,330 310,290 710,290 650,330" fill="url(#boxTop)" stroke="#b9b9b6" stroke-width="1.5"/>
    `,
    labelArea: { x: 280, y: 380, width: 340, height: 460, rotation: 0, borderRadius: 4, opacity: 1, applyShading: false, fit: "cover" },
  },
  // --------------------------------------------------------------------- POUCH
  {
    id: "pouch",
    name: "Pouch",
    description: "Stand-up flexible pouch with a rounded gusseted base and zip seal — great for coffee, snacks, pet food and granola.",
    category: "pouch",
    svgBody: `
      <defs>
        <linearGradient id="pouchMatte" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#cfd3d1"/>
          <stop offset="14%" stop-color="#eef0ee"/>
          <stop offset="32%" stop-color="#bcc1be"/>
          <stop offset="50%" stop-color="#e7e9e7"/>
          <stop offset="68%" stop-color="#bcc1be"/>
          <stop offset="86%" stop-color="#eef0ee"/>
          <stop offset="100%" stop-color="#cfd3d1"/>
        </linearGradient>
      </defs>
      <path d="M 260 300
               Q 260 260 300 260
               L 600 260
               Q 640 260 640 300
               L 640 780
               Q 640 920 500 940
               Q 450 950 400 940
               Q 260 920 260 780
               Z" fill="url(#pouchMatte)" stroke="#a9aead" stroke-width="2"/>
      <rect x="260" y="330" width="380" height="26" fill="#9ea3a1" opacity="0.85"/>
      <rect x="330" y="356" width="60" height="30" fill="#7d8280" opacity="0.7"/>
      <path d="M 280 320 L 320 900" stroke="#ffffff" stroke-width="18" opacity="0.22"/>
    `,
    labelArea: { x: 300, y: 400, width: 300, height: 470, rotation: 0, borderRadius: 10, opacity: 0.98, applyShading: true, fit: "cover" },
  },
];

async function build() {
  const manifest: { id: string; name: string; category: string }[] = [];

  for (const spec of specs) {
    const svg = `
      <svg width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
        ${studioBackdrop()}
        ${spec.svgBody}
      </svg>
    `;

    const outPath = path.join(OUT_DIR, `${spec.id}.png`);
    await sharp(Buffer.from(svg)).png({ palette: false }).toFile(outPath);

    const template: PackagingTemplate = {
      id: spec.id,
      name: spec.name,
      description: spec.description,
      category: spec.category,
      image: `/templates/${spec.id}.png`,
      canvas: { width: CANVAS_W, height: CANVAS_H },
      labelArea: spec.labelArea,
      additionalSlots: spec.additionalSlots,
    };

    fs.writeFileSync(
      path.join(DATA_DIR, `${spec.id}.json`),
      JSON.stringify(template, null, 2)
    );

    manifest.push({ id: spec.id, name: spec.name, category: spec.category });
    console.log(`✔ generated ${spec.id}.png + ${spec.id}.json`);
  }

  fs.writeFileSync(
    path.join(DATA_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`\nDone. ${specs.length} templates written to /public/templates and /template-data.`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
