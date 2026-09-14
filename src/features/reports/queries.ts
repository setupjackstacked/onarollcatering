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
export async function loadReports(ctx: OrgContext, opts: { months: number; days: number }) {
  const org = ctx.organisation.id;
  const [revenue, quotes, conversion, profitability, debt, clients, labour, employees, costs] = await Promise.all([
    ctx.supabase.rpc("report_revenue_by_month", { p_org: org, p_months: opts.months }),
    ctx.supabase.rpc("report_quotes_by_status", { p_org: org, p_days: opts.days }),
    ctx.supabase.rpc("report_quote_conversion", { p_org: org, p_months: opts.months }),
    ctx.supabase.rpc("report_project_profitability", { p_org: org }),
    ctx.supabase.rpc("report_outstanding_invoices", { p_org: org }),
    ctx.supabase.rpc("report_revenue_by_client", { p_org: org, p_months: opts.months }),
    ctx.supabase.rpc("report_labour_by_project", { p_org: org, p_days: opts.days }),
    ctx.supabase.rpc("report_employee_hours", { p_org: org, p_days: opts.days }),
    ctx.supabase.rpc("report_cost_breakdown", { p_org: org, p_days: opts.days }),
  ]);
  const errors = [revenue, quotes, conversion, profitability, debt, clients, labour, employees, costs].filter((r) => r.error).map((r) => r.error!.message);
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
    errors,
  };
}

export type ReportsData = Awaited<ReturnType<typeof loadReports>>;
export type { Row };
