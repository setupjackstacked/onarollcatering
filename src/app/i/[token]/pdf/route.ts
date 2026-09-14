import { NextResponse } from "next/server";
import { getPublicInvoice } from "@/features/invoices/public";
import { invoicePdfBuffer } from "@/features/invoices/pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPublicInvoice(token);
  if (!data) return new NextResponse("Not found", { status: 404 });
  const pdf = await invoicePdfBuffer(data.invoice as never, data.items as never);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${data.invoice.invoice_number}.pdf"`, "Cache-Control": "private, no-store" } });
}
