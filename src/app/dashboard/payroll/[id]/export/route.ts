import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/auth/context";
import { getPayPeriod, listPayrollEntries } from "@/features/payroll/queries";
import { employeeMap } from "@/features/workforce/queries";

export const runtime = "nodejs";

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  // Guard against spreadsheet formula injection in name/label columns.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Payroll input CSV — hours and gross pay only; no statutory deductions. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  if (!ctx.can("finance.read")) return new NextResponse("Forbidden", { status: 403 });
  const period = await getPayPeriod(ctx, id);
  if (!period) return new NextResponse("Not found", { status: 404 });
  const [entries, emap] = await Promise.all([listPayrollEntries(ctx, id), employeeMap(ctx)]);

  const header = ["Employee number", "First name", "Last name", "Standard hours", "Hourly rate", "Base pay", "Overtime hours", "Overtime rate", "Overtime pay", "Adjustments", "Gross pay", "Expenses (non-taxable)", "Timesheets", "Period start", "Period end", "Pay date"];
  const lines = [header.map(csvCell).join(",")];
  for (const e of entries) {
    const emp = emap.get(e.employee_id);
    lines.push([
      emp?.employee_number ?? "", emp?.full_name?.split(" ")[0] ?? "", emp?.full_name?.split(" ").slice(1).join(" ") ?? "",
      e.standard_hours, e.hourly_rate, e.base_pay, e.overtime_hours, e.overtime_rate, e.overtime_pay,
      e.adjustments, e.gross_pay, e.expenses, e.timesheet_count, period.start_date, period.end_date, period.pay_date ?? "",
    ].map(csvCell).join(","));
  }
  const slug = period.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pay-period";
  return new NextResponse(`﻿${lines.join("\r\n")}\r\n`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="payroll-${slug}.csv"`, "Cache-Control": "no-store" },
  });
}
