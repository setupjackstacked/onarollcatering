import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { mergeToPack, packSortKey, type PackSource } from "@/lib/pdf/merge";

async function pdfWith(pages: number) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([595, 842]);
  return new Uint8Array(await doc.save());
}

const source = (over: Partial<PackSource> & { bytes: Uint8Array }): PackSource => ({
  id: "x", name: "x.pdf", mimeType: "application/pdf", categoryLabel: "Invoice", ...over,
});

describe("payment pack merge", () => {
  it("appends every page of every PDF, in the order given", async () => {
    const result = await mergeToPack([
      source({ id: "a", name: "invoice.pdf", bytes: await pdfWith(1) }),
      source({ id: "b", name: "certificate.pdf", bytes: await pdfWith(3) }),
      source({ id: "c", name: "estimate.pdf", bytes: await pdfWith(2) }),
    ], { title: "Pack", subtitle: "Test" });

    expect(result.pageCount).toBe(6);
    expect(result.included.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(result.included.map((i) => i.pages)).toEqual([1, 3, 2]);
    expect(result.skipped).toHaveLength(0);
  });

  it("reports what it could not merge instead of dropping it silently", async () => {
    const result = await mergeToPack([
      source({ id: "a", bytes: await pdfWith(1) }),
      source({ id: "b", name: "notes.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: new Uint8Array([1, 2, 3]) }),
      source({ id: "c", name: "broken.pdf", bytes: new Uint8Array([9, 9, 9]) }),
    ], { title: "Pack", subtitle: "Test" });

    expect(result.pageCount).toBe(1);
    expect(result.skipped.map((s) => s.id).sort()).toEqual(["b", "c"]);
    expect(result.skipped.find((s) => s.id === "b")?.reason).toContain("can’t be merged");
  });

  it("produces a readable PDF", async () => {
    const result = await mergeToPack([source({ bytes: await pdfWith(2) })], { title: "Pack", subtitle: "Test" });
    const reopened = await PDFDocument.load(result.bytes);
    expect(reopened.getPageCount()).toBe(2);
    expect(reopened.getTitle()).toBe("Pack");
  });

  it("orders the invoice, certificate, signed estimate and backup first", () => {
    const keys = ["correspondence", "signed-estimate", "original-invoice", "backup", "payment-certificate"];
    expect([...keys].sort((a, b) => packSortKey(a) - packSortKey(b)))
      .toEqual(["original-invoice", "payment-certificate", "signed-estimate", "backup", "correspondence"]);
  });

  it("puts unknown categories at the end rather than losing them", () => {
    expect(packSortKey("something-new")).toBeGreaterThan(packSortKey("correspondence"));
  });
});
