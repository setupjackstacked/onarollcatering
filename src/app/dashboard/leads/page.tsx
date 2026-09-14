import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listLeads, pipeline } from "@/features/leads/queries";
import { listMembers, memberOptions, memberMap, memberLabel } from "@/features/shared/members";
import { listLeadSources } from "@/features/shared/lookups";
import { PageHeader } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { PipelineBoard } from "@/components/dashboard/pipeline-board";
import { LeadBadge } from "@/lib/domain/badges";
import { LEAD_STATUSES } from "@/lib/domain/statuses";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";
import { str } from "@/lib/pagination";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Leads" };
type SP = Record<string, string | string[] | undefined>;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireOrgContext("/dashboard/leads");
  if (!ctx.can("sales.read")) redirect("/dashboard");
  const sp = await searchParams;
  const view = str(sp.view) === "board" ? "board" : "list";
  const [members, sources, mmap] = await Promise.all([listMembers(ctx), listLeadSources(ctx), memberMap(ctx)]);

  const tabs = (
    <div className="flex rounded-full border border-graphite/15 p-0.5 text-sm">
      {(["list", "board"] as const).map((v) => (
        <Link key={v} href={`/dashboard/leads${v === "board" ? "?view=board" : ""}`} className={cn("rounded-full px-3 py-1.5 capitalize", view === v ? "bg-obsidian text-ivory" : "text-muted-light hover:text-graphite")}>
          {v}
        </Link>
      ))}
    </div>
  );

  if (view === "board") {
    const rows = await pipeline(ctx);
    return (
      <>
        <PageHeader eyebrow="Sales" title="Pipeline" actions={<>{tabs}{ctx.can("sales.write") ? <ActionLink href="/dashboard/leads/new" variant="copper">New lead</ActionLink> : null}</>} />
        <PipelineBoard leads={rows.map((l) => ({ id: l.id, title: l.title, status: l.status, company: (l.clients as unknown as { name: string } | null)?.name ?? l.company_name ?? "", value: toPence(l.estimated_value), assignee: memberLabel(l.assigned_user_id ? mmap.get(l.assigned_user_id) : null), updated: l.updated_at }))} canMove={ctx.can("sales.write")} />
      </>
    );
  }

  const { rows, total, page, size } = await listLeads(ctx, sp);
  return (
    <>
      <PageHeader eyebrow="Sales" title="Leads" actions={<>{tabs}{ctx.can("sales.write") ? <ActionLink href="/dashboard/leads/new" variant="copper">New lead</ActionLink> : null}</>} />
      <FilterBar
        filters={[
          { name: "status", label: "All stages", options: [{ value: "open", label: "Open" }, ...LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))] },
          { name: "assigned", label: "Anyone", options: [{ value: "me", label: "Assigned to me" }, ...memberOptions(members)] },
          { name: "source", label: "Any source", options: sources.map((s) => ({ value: s.key, label: s.label })) },
        ]}
        searchPlaceholder="Title or company"
      />
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        rowHref={(r) => `/dashboard/leads/${r.id}`}
        columns={[
          { key: "title", header: "Lead", render: (r) => r.title },
          { key: "company", header: "Company", render: (r) => (r.clients as unknown as { name: string } | null)?.name ?? r.company_name ?? "—" },
          { key: "status", header: "Stage", render: (r) => <LeadBadge status={r.status} /> },
          { key: "value", header: "Est. value", align: "right", render: (r) => (r.estimated_value ? formatGBP(toPence(r.estimated_value), { showPence: false }) : "—") },
          { key: "assigned", header: "Assigned", render: (r) => memberLabel(r.assigned_user_id ? mmap.get(r.assigned_user_id) : null) },
          { key: "updated", header: "Updated", render: (r) => formatDateUK(r.updated_at) },
        ]}
        empty={{ title: "No leads match", description: "Create a lead or convert a website enquiry.", action: ctx.can("sales.write") ? { label: "New lead", href: "/dashboard/leads/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/leads", sp) }}
      />
    </>
  );
}
