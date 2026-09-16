import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/auth/context";
import { getInvoice, listInvoiceItems } from "@/features/invoices/queries";
import { invoicePdfBuffer } from "@/features/invoices/pdf";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mergeToPack, packSortKey, type PackSource } from "@/lib/pdf/merge";
import { documentCategories } from "@/features/documents/queries";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Builds the single PDF that goes to the client's finance department:
 * invoice → payment certificate → signed estimate → backup, then anything else.
 *
 * The invoice itself is rendered fresh rather than taken from storage, so the
 * pack always opens with the real document. The result is stored against the
 * invoice as a new numbered version — never overwriting a previous pack.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  if (!ctx.can("finance.write")) return NextResponse.json({ error: "You don’t have permission to do that." }, { status: 403 });

  const invoice = await getInvoice(ctx, id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status === "draft") {
    return NextResponse.json({ error: "Issue the invoice before generating a payment pack." }, { status: 400 });
  }

  const [items, categories, { data: documents }] = await Promise.all([
    listInvoiceItems(ctx, id),
    documentCategories(ctx, "invoice"),
    ctx.supabase.from("documents").select("id, name, mime_type, category_key, bucket, storage_path")
      .eq("entity_type", "invoice").eq("entity_id", id).is("archived_at", null)
      .neq("category_key", "final-pack").order("created_at"),
  ]);

  const admin = createSupabaseAdminClient();
  const label = (key: string) => categories.find((c) => c.key === key)?.label ?? key;

  // 1. The invoice itself, rendered now.
  const sources: PackSource[] = [{
    id: "invoice", name: `${invoice.invoice_number}.pdf`, mimeType: "application/pdf",
    categoryLabel: "Invoice", bytes: new Uint8Array(await invoicePdfBuffer(invoice as never, items)),
  }];

  // 2. Everything attached, in pack order.
  const ordered = [...(documents ?? [])].sort((a, b) => packSortKey(a.category_key) - packSortKey(b.category_key));
  for (const doc of ordered) {
    const { data, error } = await admin.storage.from(doc.bucket).download(doc.storage_path);
    if (error || !data) {
      logger.error("pack.download_failed", { document: doc.id, message: error?.message });
      continue;
    }
    sources.push({
      id: doc.id, name: doc.name, mimeType: doc.mime_type,
      categoryLabel: label(doc.category_key), bytes: new Uint8Array(await data.arrayBuffer()),
    });
  }

  const client = invoice.clients as unknown as { name: string } | null;
  const merged = await mergeToPack(sources, {
    title: `${invoice.invoice_number} — final payment pack`,
    subtitle: `${client?.name ?? ""} · ${invoice.title}`,
  });

  // Store it as a document, then record the version.
  const { data: version } = await ctx.supabase.rpc("next_pack_version", { p_invoice_id: id });
  const slug = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
  const filename = `OAR_${invoice.invoice_number}_${slug(client?.name ?? "CLIENT")}_FINAL${Number(version) > 1 ? `_V${version}` : ""}.pdf`;
  const path = `${ctx.organisation.id}/invoice/${id}/${crypto.randomUUID()}-${filename}`;

  const { data: row, error: rowError } = await ctx.supabase.from("documents").insert({
    organisation_id: ctx.organisation.id, entity_type: "invoice", entity_id: id,
    category_key: "final-pack", name: filename, mime_type: "application/pdf",
    size_bytes: merged.bytes.byteLength, bucket: "invoice-documents", storage_path: path,
    uploaded_by: ctx.user.id,
  }).select("id").single();
  if (rowError || !row) {
    logger.error("pack.document_failed", { message: rowError?.message });
    return NextResponse.json({ error: "Couldn’t save the pack." }, { status: 500 });
  }

  const upload = await admin.storage.from("invoice-documents").upload(path, merged.bytes, { contentType: "application/pdf", upsert: false });
  if (upload.error) {
    await admin.from("documents").delete().eq("id", row.id);
    logger.error("pack.upload_failed", { message: upload.error.message });
    return NextResponse.json({ error: "Couldn’t store the pack. Please try again." }, { status: 500 });
  }

  const { error: recordError } = await ctx.supabase.rpc("record_payment_pack", {
    p_invoice_id: id, p_document_id: row.id,
    p_sources: merged.included.map((i) => ({ id: i.id, name: i.name, pages: i.pages })) as never,
    p_pages: merged.pageCount,
  });
  if (recordError) logger.error("pack.record_failed", { message: recordError.message });

  return NextResponse.json({
    documentId: row.id, filename, version: Number(version),
    pages: merged.pageCount, included: merged.included, skipped: merged.skipped,
  });
}
