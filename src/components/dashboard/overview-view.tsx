import type { OverviewData } from "@/features/dashboard/overview";
import { PageHeader, Metric, Panel, EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { formatGBP } from "@/lib/money";
import { RelativeTime } from "./relative-time";

const ACTION_LABEL: Record<string, string> = {
  "leads.created": "Lead created",
  "leads.status_changed": "Lead status changed",
  "leads.archived": "Lead archived",
  "projects.created": "Project created",
  "projects.status_changed": "Project status changed",
  "projects.archived": "Project archived",
};

export function OverviewView({ data, orgName, canSales }: { data: OverviewData; orgName: string; canSales: boolean }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader eyebrow={orgName} title={`${greeting}`} description="Operational overview. Quotes, invoices and workforce figures appear here as those modules are delivered." />

      {data.errors.length ? (
        <p role="alert" className="mb-6 rounded-md bg-status-danger/10 px-4 py-3 text-sm text-status-danger">Some figures couldn’t be loaded. Try refreshing.</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Metric label="Active projects" value={data.kpis.activeProjects} />
        <Metric label="Open leads" value={data.kpis.openLeads} />
        {canSales ? <Metric label="New enquiries" value={data.kpis.newEnquiries} tone={data.kpis.newEnquiries ? "warning" : "default"} /> : null}
        <Metric label="Clients" value={data.kpis.clients} />
        {data.finance ? <Metric label="Quotes awaiting decision" value={data.finance.openQuotes} hint={formatGBP(data.finance.openQuoteValue, { showPence: false })} href="/dashboard/quotes?status=sent" /> : null}
        {data.finance ? <Metric label="Invoices outstanding" value={formatGBP(data.finance.outstanding, { showPence: false })} hint={data.finance.overdueCount ? `${formatGBP(data.finance.overdue, { showPence: false })} overdue (${data.finance.overdueCount})` : "Nothing overdue"} tone={data.finance.overdueCount ? "warning" : "default"} href="/dashboard/invoices?status=outstanding" /> : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Needs attention" className="lg:col-span-2">
          {data.attention.length ? (
            <ul className="divide-y divide-graphite/10">
              {data.attention.map((a) => (
                <li key={a.key} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${a.tone === "red" ? "bg-status-danger" : a.tone === "amber" ? "bg-status-warning" : "bg-copper"}`} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="truncate text-sm text-muted-light">{a.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing needs attention" description="New enquiries, stale leads and unassigned projects will show here." />
          )}
        </Panel>

        <Panel title="Business snapshot">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs text-muted-light">Open pipeline (estimated)</dt>
              <dd className="font-display num-lining text-3xl">{formatGBP(data.snapshot.pipelineValue, { showPence: false })}</dd>
              <dd className="text-xs text-muted-light">{data.snapshot.openLeadCount} open lead{data.snapshot.openLeadCount === 1 ? "" : "s"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-light">Contracted value (all projects)</dt>
              <dd className="font-display num-lining text-3xl">{formatGBP(data.snapshot.contractedValue, { showPence: false })}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-light">Estimated gross margin</dt>
              <dd className="font-display num-lining text-3xl">{data.snapshot.estimatedMargin === null ? "—" : `${data.snapshot.estimatedMargin}%`}</dd>
              <dd className="text-xs text-muted-light">Contract value vs estimated cost. Actual costs arrive in Phase 7.</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title="Recent activity" className="mt-6">
        {data.activity.length ? (
          <ol className="divide-y divide-graphite/10">
            {data.activity.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 text-sm">
                <span className="font-medium">{ACTION_LABEL[a.action] ?? a.action}</span>
                {typeof a.metadata.to === "string" ? <StatusBadge label={String(a.metadata.to).replace(/_/g, " ")} tone="blue" /> : null}
                <RelativeTime value={a.created_at} className="ml-auto text-xs text-muted-light" />
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="No activity yet" description="Status changes, notes and document uploads are recorded here automatically." />
        )}
      </Panel>
    </>
  );
}
