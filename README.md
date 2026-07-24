# AI Packaging Mockup Generator

Upload a product label once, and instantly generate realistic packaging mockups —
round jars, premium jars, V-jars, speciality jars, sachets, bottles, boxes and
pouches — entirely inside a single Next.js app. No Python, no OpenCV, no
Docker, no external backend, and no database. It runs on the **free Vercel
Hobby plan** as-is.

![Node](https://img.shields.io/badge/node-%3E%3D18.17-339933)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## How it works

1. **Upload** one or more label images (PNG / JPG / SVG / PDF).
2. The app **normalizes** the artwork and (optionally) **removes a flat/white
   background** using a lightweight corner-sampled color-key algorithm — no
   ML model required.
3. **Pick one or more packaging templates** from the built-in gallery.
4. Click **Generate** — every label × template combination is composited
   server-side with [`sharp`](https://sharp.pixelplumbing.com/), including
   resizing, rounded corners, rotation, opacity, and a subtle shading pass
   that makes the label read as "printed on" the packaging rather than
   pasted flat on top of it.
5. **Download** any mockup individually, or grab the whole batch as a single
   ZIP (built with [`JSZip`](https://stuk.github.io/jszip/), organized into
   one folder per template).

Everything — upload handling, background removal, compositing, and
zipping — happens inside Next.js **Route Handlers** (`app/api/*/route.ts`).
There is no separate server process, no queue, and no persistent storage;
each request is stateless, which is exactly what Vercel's serverless
functions want.

---

## Tech stack

| Concern                        | Library                                                                   |
| ------------------------------- | -------------------------------------------------------------------------- |
| Framework                       | Next.js 15 (App Router) + TypeScript                                      |
| Styling                         | Tailwind CSS                                                               |
| Image compositing                | `sharp`                                                                    |
| Background removal (color-key)    | implemented directly on `sharp` raw pixel buffers — see `lib/removeBackground.ts` |
| PDF label parsing                  | `pdf-lib` (manual filter-chain unwrapping — see below)                     |
| ZIP export                          | `jszip`                                                                    |
| Uploads / drag & drop                 | `react-dropzone`                                                           |
| Icons                                  | `lucide-react`                                                             |

No Python, FastAPI, Flask, Django, OpenCV, Docker, Redis, PostgreSQL,
MongoDB, or Express — as required.

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> The 8 built-in templates are already generated and committed
> (`/public/templates/*.png`, `/template-data/*.json`), so `npm install && npm run dev`
> works immediately. If you change `scripts/generate-templates.ts`, or want
> to regenerate the base template art, run:
> ```bash
> npm run generate-templates
> ```

### Production build

```bash
npm run build
npm start
```

### Deploying to Vercel

**Option A — CLI**

```bash
npm i -g vercel
vercel
```

**Option B — GitHub import**

1. Push this repo to GitHub.
2. In the Vercel dashboard: **Add New → Project → Import Git Repository**.
3. Framework preset: Next.js (auto-detected). No environment variables are
   required.
4. Deploy.

No configuration changes are needed — `next.config.ts` already marks `sharp`
as an external server package (required for its native binary to work inside
a Vercel serverless function), and each API route declares a `maxDuration`
that stays comfortably inside Hobby-plan limits.

---

## Folder structure

```
app/
  api/
    upload/route.ts       # POST — normalize + optionally background-remove one label
    generate/route.ts     # POST — composite label(s) × template(s) → mockup PNGs
    download/route.ts     # POST — zip a set of generated mockups
  layout.tsx
  page.tsx                 # loads templates server-side, renders <MockupStudio />
  globals.css
components/
  MockupStudio.tsx         # main client-side orchestrator (state, requests, batching)
  UploadZone.tsx            # drag & drop uploader
  LabelStrip.tsx             # uploaded-label thumbnails
  TemplateGallery.tsx        # packaging template picker
  ProgressBar.tsx
  ResultsGallery.tsx          # generated mockups + lightbox + per-item download
  Banner.tsx                  # inline error / info alerts
  Button.tsx, Header.tsx, ThemeProvider.tsx
hooks/
  useUndoRedo.ts             # generic undo/redo history stack (labels + template selection)
lib/
  imageProcessor.ts           # core sharp compositing engine
  removeBackground.ts          # color-key background removal
  pdfConverter.ts               # PDF → raster label extraction
  templateLoader.ts              # reads /template-data/*.json
  zipGenerator.ts                 # JSZip bundling
  utils.ts
types/
  index.ts                        # shared TypeScript types
utils/
  id.ts, validation.ts
public/
  templates/*.png                  # base packaging photos (see below)
template-data/
  *.json                            # one config per template (label area, etc.)
scripts/
  generate-templates.ts              # procedurally renders the template PNGs + JSON
```

---

## Adding new packaging templates

Every template is just **one PNG** in `/public/templates/` plus **one JSON
file** in `/template-data/` with the same id:

```jsonc
// template-data/my-new-jar.json
{
  "id": "my-new-jar",
  "name": "My New Jar",
  "description": "A short description shown in the template gallery.",
  "category": "jar", // "jar" | "bottle" | "box" | "pouch" | "sachet"
  "image": "/templates/my-new-jar.png",
  "canvas": { "width": 900, "height": 1100 }, // must match the PNG's pixel size
  "labelArea": {
    "x": 300,
    "y": 470,
    "width": 300,
    "height": 280,
    "rotation": 0,
    "borderRadius": 14,
    "opacity": 0.96,
    "applyShading": true,
    "fit": "cover" // "cover" | "contain" | "fill"
  }
}
```

That's it — the new template shows up in the gallery automatically on next
load (`lib/templateLoader.ts` reads every `*.json` file in `/template-data/`
at request time, cached per serverless instance).

To use a **real product photo** instead of the procedurally-rendered art
this project ships with, just replace the PNG at `image` with your own photo
(any resolution — update `canvas` to match) and re-measure the `labelArea`
rectangle in an image editor (e.g. Photoshop/Figma's pixel ruler) to line up
with where the label sits on that photo.

### About the built-in template art

The 8 templates that ship with this project (`round-jar`, `premium-jar`,
`v-jar`, `speciality-jar`, `sachet`, `bottle`, `box`, `pouch`) are
**procedurally rendered** studio-style illustrations (`scripts/generate-templates.ts`
builds them from hand-tuned SVG shapes via `sharp`), not photographs. This
keeps the repository dependency- and licensing-free out of the box. Swap in
real product photography any time using the steps above — the compositing
pipeline doesn't care where the base image came from.

### Adding new label areas / multi-slot templates

Some packaging (e.g. a jar with a front label *and* a back label) needs more
than one placement. Add an `additionalSlots` array to the template JSON:

```jsonc
{
  // ...
  "labelArea": { /* front slot, used by default */ },
  "additionalSlots": [
    {
      "id": "back",
      "name": "Back label",
      "x": 300, "y": 470, "width": 300, "height": 280,
      "rotation": 180, "borderRadius": 14, "opacity": 0.96,
      "applyShading": true, "fit": "cover"
    }
  ]
}
```

`compositeLabelOntoTemplate()` in `lib/imageProcessor.ts` accepts an optional
`labelArea` override, so a future UI could let users assign a different (or
the same) label image to each slot. The current UI drives the primary
`labelArea` only; wiring up `additionalSlots` in the gallery is a
straightforward follow-up (see `types/index.ts` → `TemplateLabelSlot`).

---

## Batch processing & Vercel limits

If you upload **N labels** and select **M templates**, the app requests
**N × M** mockups. To stay comfortably within Vercel serverless function
duration limits, `/api/generate` caps any single request at **24
combinations**; the frontend (`components/MockupStudio.tsx`) automatically
splits larger batches into multiple sequential requests and shows a live
progress bar. There's no hard ceiling on total labels or templates — just on
how many combinations are processed per request.

If you deploy on a paid Vercel plan with longer function durations, raise
`MAX_COMBINATIONS_PER_REQUEST` in both `app/api/generate/route.ts` and
`components/MockupStudio.tsx`.

---

## Background removal

`lib/removeBackground.ts` implements a **color-key** removal (not a
segmentation ML model — there's intentionally no Python/OpenCV in this
project):

1. Sample the four corners of the image to estimate the background color.
2. Compute each pixel's color distance from that estimate.
3. Pixels below a threshold become transparent; a feather zone smooths the
   cutout edge instead of leaving hard jaggies.
4. If the source image already has meaningful transparency, it's returned
   untouched (per spec: *"Keep transparent PNG untouched"*).

This works well for the common case — labels exported on a flat white (or
near-flat) background — but isn't a full subject-segmentation model, so
complex/patterned backgrounds may not fully disappear. Users can also just
upload a pre-cut transparent PNG and disable the toggle.

## PDF label support

Most "label PDFs" from design tools are a single embedded raster image on an
otherwise empty page. `lib/pdfConverter.ts` walks the PDF's image XObjects,
manually decodes their filter chain (FlateDecode / ASCII85Decode /
ASCIIHexDecode / RunLengthDecode), and stops at a terminal image codec
(DCTDecode/JPXDecode — i.e. JPEG/JPEG2000), which `sharp` then decodes
directly. There is intentionally no bundled PDF rasterizer (poppler /
ghostscript / headless Chromium aren't available on Vercel serverless
functions), so a PDF containing **only vector artwork** (paths/text, no
embedded raster) can't be converted — the API returns a clear error asking
the user to export a PNG/JPG instead.

---

## Feature checklist

- [x] Drag & drop multi-file upload (PNG/JPG/SVG/PDF)
- [x] Automatic white/flat-background removal (transparent PNGs left as-is)
- [x] 8 packaging templates across 5 categories (jar/bottle/box/pouch/sachet)
- [x] Multi-select template gallery
- [x] Batch generation (N labels × M templates), auto-chunked client-side
- [x] Resize, rotate, round corners, opacity, and shading during compositing
- [x] Individual PNG download + "download all" ZIP export
- [x] Live progress indicator during generation
- [x] Full-size lightbox preview of results
- [x] Dark mode
- [x] Undo/redo (Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z) across uploads & template
      selection
- [x] Deployable on Vercel Hobby plan with zero configuration

---

## License

This scaffold and its procedurally-generated template art are provided for
you to build on — swap in your own packaging photography and branding as
needed.
