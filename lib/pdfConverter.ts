import { PDFDocument, PDFName, PDFRawStream, PDFArray } from "pdf-lib";
import { inflateSync } from "node:zlib";
import sharp from "sharp";

/**
 * Extracts a usable label image out of an uploaded PDF, without any native
 * rasterization engine (no poppler/ghostscript/canvas — none of those are
 * available on Vercel serverless functions).
 *
 * Strategy: the overwhelming majority of "label PDFs" that come out of design
 * tools (Illustrator, Canva, Photoshop "Save as PDF") are a single embedded
 * raster image dropped onto an otherwise-empty page. We walk the PDF's
 * embedded XObjects, manually unwrap each image stream's filter chain
 * (ASCII85Decode / ASCIIHexDecode / FlateDecode / RunLengthDecode) up to —
 * but not including — a final image codec filter (DCTDecode/JPXDecode,
 * i.e. JPEG/JPEG2000 data), pick the largest decoded candidate, and hand it
 * to sharp, which decodes the final JPEG/JPEG2000 codec itself. If a PDF
 * instead contains only vector artwork (paths/text with no embedded
 * raster), there is no reliable dependency-free way to rasterize it on
 * Vercel, and we throw a descriptive error so the UI can ask the user to
 * export a PNG/JPG instead.
 */
export async function extractImageFromPdf(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  let bestCandidate: Uint8Array | null = null;

  for (const page of pdfDoc.getPages()) {
    const resources = page.node.Resources();
    if (!resources) continue;

    const xObjects = resources.lookup(PDFName.of("XObject"));
    if (!xObjects || !("entries" in xObjects)) continue;

    // @ts-expect-error -- pdf-lib's low-level dict typing doesn't expose entries() publicly, but it exists at runtime.
    const entries = xObjects.entries() as [PDFName, unknown][];

    for (const [, ref] of entries) {
      const obj = pdfDoc.context.lookup(ref as never);
      if (!(obj instanceof PDFRawStream)) continue;

      const dict = obj.dict;
      const subtype = dict.get(PDFName.of("Subtype"));
      if (!subtype || subtype.toString() !== "/Image") continue;

      let decoded: Uint8Array;
      try {
        decoded = unwrapImageStreamFilters(obj);
      } catch {
        continue; // unsupported/unknown filter chain — skip this XObject
      }

      if (!bestCandidate || decoded.length > bestCandidate.length) {
        bestCandidate = decoded;
      }
    }
  }

  if (!bestCandidate) {
    throw new Error(
      "This PDF doesn't contain an embedded raster image we can extract (it may be vector artwork). " +
        "Please export/flatten your label as a PNG or JPG and upload that instead."
    );
  }

  // Decode with sharp to validate + normalize to PNG. sharp can read a bare
  // JPEG/JP2 codec stream directly; if the PDF instead stored raw decoded
  // samples (no final image codec), sharp will reject it and we surface a
  // clear error rather than silently producing garbage pixels.
  try {
    return await sharp(Buffer.from(bestCandidate)).png().toBuffer();
  } catch {
    throw new Error(
      "Found an embedded image in this PDF, but it uses a raw/uncompressed pixel format sharp can't decode directly. " +
        "Please export/flatten your label as a PNG or JPG and upload that instead."
    );
  }
}

/**
 * Walks a PDF image XObject's /Filter chain, fully decoding general-purpose
 * compression filters (Flate, ASCII85, ASCIIHex, RunLength) and stopping at
 * — while still returning — the bytes for a terminal image codec filter
 * (DCTDecode/JPXDecode), since those are meant to be decoded by an image
 * library (sharp) rather than a PDF parser.
 */
function unwrapImageStreamFilters(stream: PDFRawStream): Uint8Array {
  const filterObj = stream.dict.lookup(PDFName.of("Filter"));
  const filters: PDFName[] = !filterObj
    ? []
    : filterObj instanceof PDFArray
      ? Array.from({ length: filterObj.size() }, (_, i) => filterObj.lookup(i, PDFName))
      : [filterObj as PDFName];

  let bytes: Uint8Array = stream.contents;

  for (const filter of filters) {
    const name = filter.toString(); // e.g. "/FlateDecode"

    if (name === "/FlateDecode") {
      bytes = new Uint8Array(inflateSync(Buffer.from(bytes)));
    } else if (name === "/ASCII85Decode") {
      bytes = decodeAscii85(bytes);
    } else if (name === "/ASCIIHexDecode") {
      bytes = decodeAsciiHex(bytes);
    } else if (name === "/RunLengthDecode") {
      bytes = decodeRunLength(bytes);
    } else if (name === "/DCTDecode" || name === "/JPXDecode") {
      // Terminal image codec — leave bytes as-is for sharp to decode.
      break;
    } else {
      throw new Error(`Unsupported PDF filter: ${name}`);
    }
  }

  return bytes;
}

function decodeAscii85(input: Uint8Array): Uint8Array {
  const text = Buffer.from(input)
    .toString("latin1")
    .replace(/^<~/, "")
    .replace(/~>$/, "")
    .replace(/\s+/g, "");
  const out: number[] = [];
  let group: number[] = [];

  const flushGroup = (g: number[], isFinal: boolean) => {
    const len = g.length;
    while (g.length < 5) g.push(117); // pad with 'u' (85)
    let value = 0;
    for (const ch of g) value = value * 85 + (ch - 33);
    const bytes = [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
    out.push(...bytes.slice(0, isFinal ? len - 1 : 4));
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    if (ch === 122 && group.length === 0) {
      // 'z' shorthand for four zero bytes
      out.push(0, 0, 0, 0);
      continue;
    }
    group.push(ch);
    if (group.length === 5) {
      flushGroup(group, false);
      group = [];
    }
  }
  if (group.length > 0) flushGroup(group, true);

  return new Uint8Array(out);
}

function decodeAsciiHex(input: Uint8Array): Uint8Array {
  const text = Buffer.from(input).toString("latin1").replace(/>$/, "").replace(/\s+/g, "");
  const clean = text.length % 2 === 0 ? text : text + "0";
  return new Uint8Array(Buffer.from(clean, "hex"));
}

function decodeRunLength(input: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i < input.length) {
    const length = input[i];
    i++;
    if (length === 128) break; // EOD
    if (length < 128) {
      for (let j = 0; j <= length; j++) out.push(input[i + j]);
      i += length + 1;
    } else {
      const byte = input[i];
      for (let j = 0; j < 257 - length; j++) out.push(byte);
      i += 1;
    }
  }
  return new Uint8Array(out);
}

export function isPdf(mimeType: string, fileName: string): boolean {
  return mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}
