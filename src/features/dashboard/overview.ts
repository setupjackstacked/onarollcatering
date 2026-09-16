import "server-only";

import type { OrgContext } from "@/lib/auth/context";
import { OPEN_LEAD_STATUSES, ACTIVE_PROJECT_STATUSES } from "@/lib/domain/statuses";
import { toPence, formatMoney, type Pence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";

export type OverviewData = {
  kpis: { activeProjects: number; openLeads: number; newEnquiries: number; clients: number };
  finance: { openQuotes: number; openQuoteValue: Pence; outstanding: Pence; overdue: Pence; overdueCount: number } | null;
  attention: { key: string; title: string; detail: string; href?: string; tone: "amber" | "red" | "copper" }[];
  snapshot: { pipelineValue: Pence; contractedValue: Pence; estimatedMargin: number | null; openLeadCount: number };
  activity: { id: string; action: string; entity_type: string; entity_id: string; created_at: string; metadata: Record<string, unknown> }[];
  errors: string[];
};

/**
 * Everything on the overview comes from live tables via the RLS-scoped client.
 * Modules that don't exist yet (quotes, invoices, timesheets) are not faked —
 * their KPIs simply aren't shown until their phase ships.
 */
export async function loadOverview(ctx: OrgContext): Promise<OverviewData> {
  const { supabase, organisation, can } = ctx;
  const errors: string[] = [];
  const org = organisation.id;
  const soon = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  const stale = new Date(Date.now() - 14 * 864e5).toISOString();

  const [projects, leads, enquiries, clients, staleLeads, unassigned, financials, activity, openQuotes, openInvoices] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("organisation_id", org).is("archived_at", null).in("status", ACTIVE_PROJECT_STATUSES),
    supabase.from("leads").select("id, estimated_value", ).eq("organisation_id", org).is("archived_at", null).in("status", OPEN_LEAD_STATUSES),
    can("sales.read") ? supabase.from("enquiries").select("id, company_name, project_name, created_at").eq("organisation_id", org).eq("status", "new").order("created_at", { ascending: false }).limit(5) : Promise.resolve({ data: [], error: null }),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("organisation_id", org).is("archived_at", null),
    supabase.from("leads").select("id, title, updated_at").eq("organisation_id", org).is("archived_at", null).in("status", OPEN_LEAD_STATUSES).lt("updated_at", stale).limit(5),
    supabase.from("projects").select("id, name, start_date").eq("organisation_id", org).is("archived_at", null).is("project_manager_id", null).lte("start_date", soon).gte("start_date", new Date().toISOString().slice(0, 10)).limit(5),
    supabase.from("project_financials").select("contract_value, estimated_cost").eq("organisation_id", org),
    supabase.from("activity_logs").select("id, action, entity_type, entity_id, created_at, metadata").eq("organisation_id", org).order("created_at", { ascending: false }).limit(10),
    can("sales.read") ? supabase.from("quotes").select("total").eq("organisation_id", org).is("archived_at", null).in("status", ["sent", "viewed"]) : Promise.resolve({ data: null, error: null }),
    can("finance.read") ? supabase.from("invoices").select("id, invoice_number, total, amount_paid, status, due_date").eq("organisation_id", org).is("archived_at", null).in("status", ["issued", "part_paid", "overdue"]) : Promise.resolve({ data: null, error: null }),
  ]);

  for (const r of [projects, leads, enquiries, clients, staleLeads, unassigned, financials, activity, openQuotes, openInvoices]) {
    if (r.error) errors.push(r.error.message);
  }

  const openLeads = leads.data ?? [];
  const pipelineValue = openLeads.reduce((sum, l) => sum + toPence(l.estimated_value), 0);
  const contracted = (financials.data ?? []).reduce((acc, f) => ({ v: acc.v + toPence(f.contract_value), c: acc.c + toPence(f.estimated_cost) }), { v: 0, c: 0 });
  const estimatedMargin = contracted.v > 0 ? Math.round(((contracted.v - contracted.c) / contracted.v) * 10000) / 100 : null;

  let finance: OverviewData["finance"] = null;
  if (openQuotes.data || openInvoices.data) {
    const q = openQuotes.data ?? [];
    const inv = openInvoices.data ?? [];
    let outstanding = 0, overdue = 0, overdueCount = 0;
    for (const i of inv) { const bal = toPence(i.total) - toPence(i.amount_paid); outstanding += bal; if (i.status === "overdue") { overdue += bal; overdueCount++; } }
    finance = { openQuotes: q.length, openQuoteValue: q.reduce((s, r) => s + toPence(r.total), 0), outstanding, overdue, overdueCount };
  }

  const attention: OverviewData["attention"] = [];
  for (const i of (openInvoices.data ?? []).filter((x) => x.status === "overdue").slice(0, 5)) {
    attention.push({ key: `inv-${i.id}`, title: `Invoice ${i.invoice_number} overdue`, detail: `${formatMoney(toPence(i.total) - toPence(i.amount_paid))} outstanding · due ${formatDateUK(i.due_date)}`, href: `/dashboard/invoices/${i.id}`, tone: "red" });
  }
  for (const e of enquiries.data ?? []) {
    attention.push({ key: `enq-${e.id}`, title: `New enquiry — ${e.company_name}`, detail: e.project_name, tone: "copper" });
  }
  for (const l of staleLeads.data ?? []) {
    attention.push({ key: `lead-${l.id}`, title: `Lead not updated in 14 days`, detail: l.title, tone: "amber" });
  }
  for (const p of unassigned.data ?? []) {
    attention.push({ key: `proj-${p.id}`, title: `Project starting soon with no project manager`, detail: `${p.name} · starts ${formatDateUK(p.start_date)}`, tone: "red" });
  }

  return {
    kpis: {
      activeProjects: projects.count ?? 0,
      openLeads: openLeads.length,
      newEnquiries: (enquiries.data ?? []).length,
      clients: clients.count ?? 0,
    },
    attention,
    finance,
    snapshot: { pipelineValue, contractedValue: contracted.v, estimatedMargin, openLeadCount: openLeads.length },
    activity: (activity.data ?? []).map((a) => ({ ...a, metadata: (a.metadata ?? {}) as Record<string, unknown> })),
    errors,
  };
}
