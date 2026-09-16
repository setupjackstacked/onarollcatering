import "server-only";

import type { OrgContext } from "@/lib/auth/context";

type Row = Record<string, string | number | null>;
const rows = <T>(data: unknown) => (data ?? []) as unknown as T[];

export type RevenueMonth = { month: string; invoiced_net: string; received: string };
export type QuoteStatusRow = { status: string; quote_count: number; value: string };
export type ConversionRow = { month: string; sent: number; accepted: number; accepted_value: string };
export type ProfitabilityRow = { project_id: string; project_number: string; name: string; status: string; contract_value: string; actual_cost: string; committed_cost: string; labour_cost: string; forecast_gross_profit: string; forecast_margin_pct: string | null };
export type DebtRow = { bucket: string; invoice_count: number; balance: string };
export type ClientRevenueRow = { client_id: string; client_name: string; invoiced_net: string; received: string; outstanding: string };
export type LabourRow = { project_id: string; project_number: string; name: string; hours: string; labour_cost: string };
export type EmployeeHoursRow = { employee_id: string; employee_number: string; full_name: string; hours: string; overtime: string; labour_cost: string };
export type CostRow = { category: string; committed: string; actual: string };

/** Every report in one round trip. RLS still applies — each function is security invoker. */
export type HoursBySiteRow = { site_id: string; site_name: string; employees: number; hours: string; overtime: string; labour_cost: string };
export type AbsenceRow = { employee_id: string; employee_name: string; site_name: string | null; holiday_days: string; sick_days: string; unpaid_days: string; other_days: string; sick_occasions: number; missing_notes: number };
export type PipelineRow = { stage: string; invoice_count: number; value: string; oldest_days: number };
export type PaymentTimeRow = { month: string; invoices: number; avg_days: string };

export async function loadReports(ctx: OrgContext, opts: { months: number; days: number }) {
  const org = ctx.organisation.id;
  const from = new Date(Date.now() - opts.days * 864e5).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  const [revenue, quotes, conversion, profitability, debt, clients, labour, employees, costs,
         hoursBySite, absence, pipeline, paymentTime, vouchers] = await Promise.all([
    ctx.supabase.rpc("report_revenue_by_month", { p_org: org, p_months: opts.months }),
    ctx.supabase.rpc("report_quotes_by_status", { p_org: org, p_days: opts.days }),
    ctx.supabase.rpc("report_quote_conversion", { p_org: org, p_months: opts.months }),
    ctx.supabase.rpc("report_project_profitability", { p_org: org }),
    ctx.supabase.rpc("report_outstanding_invoices", { p_org: org }),
    ctx.supabase.rpc("report_revenue_by_client", { p_org: org, p_months: opts.months }),
    ctx.supabase.rpc("report_labour_by_project", { p_org: org, p_days: opts.days }),
    ctx.supabase.rpc("report_employee_hours", { p_org: org, p_days: opts.days }),
    ctx.supabase.rpc("report_cost_breakdown", { p_org: org, p_days: opts.days }),
    ctx.supabase.rpc("report_hours_by_site", { p_org: org, p_from: from, p_to: to }),
    ctx.supabase.rpc("report_absence", { p_org: org, p_from: from, p_to: to }),
    ctx.supabase.rpc("report_invoice_pipeline", { p_org: org }),
    ctx.supabase.rpc("report_payment_time", { p_org: org, p_months: opts.months }),
    ctx.supabase.rpc("report_vouchers", { p_org: org, p_from: from, p_to: to, p_grain: "month" }),
  ]);
  const errors = [revenue, quotes, conversion, profitability, debt, clients, labour, employees, costs,
                  hoursBySite, absence, pipeline, paymentTime, vouchers].filter((r) => r.error).map((r) => r.error!.message);
  return {
    revenue: rows<RevenueMonth>(revenue.data),
    quotes: rows<QuoteStatusRow>(quotes.data),
    conversion: rows<ConversionRow>(conversion.data),
    profitability: rows<ProfitabilityRow>(profitability.data),
    debt: rows<DebtRow>(debt.data),
    clients: rows<ClientRevenueRow>(clients.data),
    labour: rows<LabourRow>(labour.data),
    employees: rows<EmployeeHoursRow>(employees.data),
    costs: rows<CostRow>(costs.data),
    hoursBySite: rows<HoursBySiteRow>(hoursBySite.data),
    absence: rows<AbsenceRow>(absence.data),
    pipeline: rows<PipelineRow>(pipeline.data),
    paymentTime: rows<PaymentTimeRow>(paymentTime.data),
    vouchers: rows<{ period: string; site_name: string; category_label: string; is_chargeable: boolean; quantity: number }>(vouchers.data),
    range: { from, to },
    errors,
  };
}

export type ReportsData = Awaited<ReturnType<typeof loadReports>>;
export type { Row };
