import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/auth/context";
import { toCsv, csvResponse } from "@/lib/csv";
import { isoDateOffset } from "@/lib/dates";
import { stageLabel } from "@/features/invoices/schema";
import { categoryLabel } from "@/features/expenses/schema";

export const runtime = "nodejs";

type Row = Record<string, unknown>;
const rows = (data: unknown) => (data ?? []) as Row[];

/**
 * CSV export for any report. The report does the work in SQL under RLS, so a
 * manager exporting "hours by site" gets only their sites, exactly as they see
 * them on screen.
 */
export async function GET(request: Request, { params }: { params: Promise<{ report: string }> }) {
  const { report } = await params;
  const ctx = await requireOrgContext();
  if (!ctx.can("reports.read") && !ctx.can("finance.read") && !ctx.can("workforce.read")) {
    return NextResponse.json({ error: "You don’t have permission to export reports." }, { status: 403 });
  }
  const url = new URL(request.url);
  const org = ctx.organisation.id;
  const from = url.searchParams.get("from") || isoDateOffset(-90);
  const to = url.searchParams.get("to") || isoDateOffset(0);
  const site = url.searchParams.get("site") || undefined;
  const stamp = `${from}_${to}`;

  switch (report) {
    case "hours-by-employee": {
      const { data } = await ctx.supabase.rpc("report_employee_hours", { p_org: org, p_days: daysBetween(from, to) });
      return csvResponse(`employee-hours_${stamp}.csv`, toCsv(
        ["Employee number", "Employee", "Hours", "Overtime", "Labour cost"],
        rows(data).map((r) => [r.employee_number, r.full_name, r.hours, r.overtime, r.labour_cost]),
      ));
    }
    case "hours-by-site": {
      const { data } = await ctx.supabase.rpc("report_hours_by_site", { p_org: org, p_from: from, p_to: to });
      return csvResponse(`hours-by-site_${stamp}.csv`, toCsv(
        ["Site", "People", "Hours", "Overtime", "Labour cost"],
        rows(data).map((r) => [r.site_name, r.employees, r.hours, r.overtime, r.labour_cost]),
      ));
    }
    case "absence": {
      const { data } = await ctx.supabase.rpc("report_absence", { p_org: org, p_from: from, p_to: to });
      return csvResponse(`absence_${stamp}.csv`, toCsv(
        ["Employee", "Site", "Holiday days", "Sick days", "Unpaid days", "Other days", "Sick occasions", "Notes outstanding"],
        rows(data).map((r) => [r.employee_name, r.site_name, r.holiday_days, r.sick_days, r.unpaid_days, r.other_days, r.sick_occasions, r.missing_notes]),
      ));
    }
    case "vouchers": {
      const { data } = await ctx.supabase.rpc("report_vouchers", {
        p_org: org, p_from: from, p_to: to, p_grain: url.searchParams.get("grain") || "day", p_site_id: site,
      });
      return csvResponse(`vouchers_${stamp}.csv`, toCsv(
        ["Period", "Site", "Category", "Chargeable", "Quantity"],
        rows(data).map((r) => [r.period, r.site_name, r.category_label, r.is_chargeable ? "Yes" : "No", r.quantity]),
      ));
    }
    case "invoice-pipeline": {
      const { data } = await ctx.supabase.rpc("report_invoice_pipeline", { p_org: org });
      return csvResponse(`invoice-pipeline_${isoDateOffset(0)}.csv`, toCsv(
        ["Stage", "Invoices", "Outstanding value", "Oldest (days)"],
        rows(data).map((r) => [stageLabel(String(r.stage)), r.invoice_count, r.value, r.oldest_days]),
      ));
    }
    case "outstanding-invoices": {
      const { data } = await ctx.supabase.from("invoices")
        .select("invoice_number, title, status, workflow_stage, issue_date, due_date, total, amount_paid, clients(name)")
        .eq("organisation_id", org).is("archived_at", null).in("status", ["issued", "part_paid", "overdue"])
        .order("due_date");
      return csvResponse(`outstanding-invoices_${isoDateOffset(0)}.csv`, toCsv(
        ["Invoice", "Client", "Title", "Issued", "Due", "Total", "Paid", "Outstanding", "Payment status", "Approval stage"],
        rows(data).map((r) => {
          const client = r.clients as { name: string } | null;
          const outstanding = Number(r.total) - Number(r.amount_paid);
          return [r.invoice_number, client?.name, r.title, r.issue_date, r.due_date, r.total, r.amount_paid, outstanding.toFixed(2), r.status, stageLabel(String(r.workflow_stage))];
        }),
      ));
    }
    case "payment-time": {
      const { data } = await ctx.supabase.rpc("report_payment_time", { p_org: org, p_months: 12 });
      return csvResponse(`payment-time_${isoDateOffset(0)}.csv`, toCsv(
        ["Month", "Invoices paid", "Average days to pay"],
        rows(data).map((r) => [r.month, r.invoices, r.avg_days]),
      ));
    }
    case "project-costs": {
      const { data } = await ctx.supabase.rpc("report_cost_breakdown", { p_org: org, p_days: daysBetween(from, to) });
      return csvResponse(`cost-breakdown_${stamp}.csv`, toCsv(
        ["Category", "Committed", "Actual"],
        rows(data).map((r) => [categoryLabel(String(r.category)), r.committed, r.actual]),
      ));
    }
    default:
      return NextResponse.json({ error: "Unknown report." }, { status: 404 });
  }
}

function daysBetween(from: string, to: string) {
  const d = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5);
  return Number.isFinite(d) && d > 0 ? d : 90;
}
