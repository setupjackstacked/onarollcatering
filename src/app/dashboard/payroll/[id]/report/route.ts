import { NextResponse } from "next/server";
import { buildPayrollPdf } from "@/features/payroll/reporting";

/**
 * Download the payroll report for a period.
 *
 * Rendered on demand from the same query the send uses, so what you check here
 * is what the payroll company receives. Finance-level only — buildPayrollPdf
 * enforces that, and the data it reads is RLS-scoped besides.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const built = await buildPayrollPdf(id);
  if (!built) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(built.bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${built.fileName}"`,
      "cache-control": "no-store",
    },
  });
}
