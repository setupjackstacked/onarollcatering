import { NextResponse } from "next/server";
import { getPublicQuote } from "@/features/quotes/public";
import { quotePdfBuffer } from "@/features/quotes/pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPublicQuote(token);
  if (!data) return new NextResponse("Not found", { status: 404 });
  const pdf = await quotePdfBuffer(data.quote as never, data.items as never);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${data.quote.quote_number}.pdf"`, "Cache-Control": "private, no-store" } });
}
