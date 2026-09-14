import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/auth/context";
import { getInvoice, listInvoiceItems } from "@/features/invoices/queries";
import { invoicePdfBuffer } from "@/features/invoices/pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const inv = await getInvoice(ctx, id);
  if (!inv) return new NextResponse("Not found", { status: 404 });
  const items = await listInvoiceItems(ctx, id);
  const pdf = await invoicePdfBuffer(inv as never, items);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${inv.invoice_number || "draft-invoice"}.pdf"` } });
}
