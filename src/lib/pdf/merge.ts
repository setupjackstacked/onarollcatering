import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PackSource = {
  id: string;
  name: string;
  mimeType: string;
  categoryLabel: string;
  bytes: Uint8Array;
};

export type MergeResult = {
  bytes: Uint8Array;
  pageCount: number;
  included: { id: string; name: string; pages: number }[];
  skipped: { id: string; name: string; reason: string }[];
};

const A4: [number, number] = [595.28, 841.89];

/**
 * Merges the pack documents into a single PDF, in the order given.
 *
 * PDFs are appended page for page. JPEG and PNG images become full A4 pages,
 * scaled to fit with a margin. Anything else (a Word file, a spreadsheet) can't
 * be rendered here, so it is skipped and reported rather than silently dropped —
 * the caller tells the user what didn't make it in.
 */
export async function mergeToPack(sources: PackSource[], header: { title: string; subtitle: string }): Promise<MergeResult> {
  const out = await PDFDocument.create();
  out.setTitle(header.title);
  out.setSubject(header.subtitle);
  out.setProducer("On A Roll Catering");
  out.setCreationDate(new Date());

  const included: MergeResult["included"] = [];
  const skipped: MergeResult["skipped"] = [];
  const font = await out.embedFont(StandardFonts.Helvetica);

  for (const source of sources) {
    const before = out.getPageCount();
    try {
      if (source.mimeType === "application/pdf") {
        const src = await PDFDocument.load(source.bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        for (const page of pages) out.addPage(page);
      } else if (source.mimeType === "image/jpeg" || source.mimeType === "image/png") {
        const image = source.mimeType === "image/jpeg"
          ? await out.embedJpg(source.bytes)
          : await out.embedPng(source.bytes);
        const page = out.addPage(A4);
        const margin = 36;
        const maxW = A4[0] - margin * 2;
        const maxH = A4[1] - margin * 2 - 24;
        const scale = Math.min(maxW / image.width, maxH / image.height, 1);
        const w = image.width * scale;
        const h = image.height * scale;
        page.drawImage(image, { x: (A4[0] - w) / 2, y: (A4[1] - h) / 2 - 12, width: w, height: h });
        page.drawText(`${source.categoryLabel} — ${source.name}`.slice(0, 110), {
          x: margin, y: A4[1] - margin, size: 9, font, color: rgb(0.42, 0.41, 0.4),
        });
      } else {
        skipped.push({ id: source.id, name: source.name, reason: `${source.mimeType} can’t be merged into a PDF` });
        continue;
      }
      included.push({ id: source.id, name: source.name, pages: out.getPageCount() - before });
    } catch {
      // A corrupt or password-protected file must not take the whole pack down.
      skipped.push({ id: source.id, name: source.name, reason: "The file couldn’t be read" });
    }
  }

  return { bytes: await out.save(), pageCount: out.getPageCount(), included, skipped };
}

/**
 * The order documents go into the pack. Anything not named here follows, so a
 * category added later still ends up in the pack rather than disappearing.
 */
export const PACK_ORDER = [
  "original-invoice",
  "payment-certificate",
  "signed-estimate",
  "site-approval",
  "original-estimate",
  "procurement",
  "backup",
  "supporting",
  "receipts",
  "correspondence",
] as const;

export function packSortKey(categoryKey: string) {
  const i = (PACK_ORDER as readonly string[]).indexOf(categoryKey);
  return i === -1 ? PACK_ORDER.length : i;
}
