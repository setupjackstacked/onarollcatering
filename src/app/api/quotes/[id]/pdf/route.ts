import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/auth/context";
import { getQuote, listQuoteItems } from "@/features/quotes/queries";
import { quotePdfBuffer } from "@/features/quotes/pdf";

export const runtime = "nodejs";

/** Internal PDF download (RLS-scoped). Same document the customer sees — no cost data. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const quote = await getQuote(ctx, id);
  if (!quote) return new NextResponse("Not found", { status: 404 });
  const items = await listQuoteItems(ctx, id);
  const pdf = await quotePdfBuffer(quote as never, items);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${quote.quote_number}${quote.revision ? `-r${quote.revision}` : ""}.pdf"` } });
}
