import type { OverviewData } from "@/features/dashboard/overview";
import Link from "next/link";
import { PageHeader, Metric, Panel, EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { formatMoney, toPence } from "@/lib/money";
import { stageLabel } from "@/features/invoices/schema";
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

      {data.workforce ? (
        <section className="mb-6">
          <h2 className="eyebrow mb-3 text-copper-dark">Today</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 md:gap-4">
            <Metric label="On shift" value={data.workforce.onShift} href="/dashboard/rota" />
            <Metric label="On holiday" value={data.workforce.onLeave} href="/dashboard/leave?status=approved" />
            <Metric label="Off sick" value={data.workforce.offSick} tone={data.workforce.offSick > 0 ? "warning" : "default"} />
            <Metric label="Timesheets to approve" value={data.workforce.pendingTimesheets} tone={data.workforce.pendingTimesheets ? "warning" : "default"} href="/dashboard/timesheets?status=submitted" />
            <Metric label="Leave to decide" value={data.workforce.pendingLeave} tone={data.workforce.pendingLeave ? "warning" : "default"} href="/dashboard/leave?status=requested" />
            {data.operations ? <Metric label="Meals logged today" value={data.operations.vouchersToday} hint={data.operations.complimentaryToday ? `${data.operations.complimentaryToday} free / complimentary` : undefined} href="/dashboard/vouchers" /> : null}
          </div>
        </section>
      ) : null}

      {data.operations && data.operations.unreadMessages > 0 ? (
        <p className="mb-6 rounded-md bg-copper/10 px-4 py-3 text-sm">
          You have <Link href="/dashboard/messages" className="font-medium underline">{data.operations.unreadMessages} unread {data.operations.unreadMessages === 1 ? "message" : "messages"}</Link>.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Metric label="Active projects" value={data.kpis.activeProjects} />
        <Metric label="Open leads" value={data.kpis.openLeads} />
        {canSales ? <Metric label="New enquiries" value={data.kpis.newEnquiries} tone={data.kpis.newEnquiries ? "warning" : "default"} /> : null}
        <Metric label="Clients" value={data.kpis.clients} />
        {data.finance ? <Metric label="Quotes awaiting decision" value={data.finance.openQuotes} hint={formatMoney(data.finance.openQuoteValue, { showPence: false })} href="/dashboard/quotes?status=sent" /> : null}
        {data.finance ? <Metric label="Invoices outstanding" value={formatMoney(data.finance.outstanding, { showPence: false })} hint={data.finance.overdueCount ? `${formatMoney(data.finance.overdue, { showPence: false })} overdue (${data.finance.overdueCount})` : "Nothing overdue"} tone={data.finance.overdueCount ? "warning" : "default"} href="/dashboard/invoices?status=outstanding" /> : null}
      </div>

      {data.invoicePipeline.length ? (
        <section className="mt-8">
          <h2 className="eyebrow mb-3 text-copper-dark">Invoices in the approval chain</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {data.invoicePipeline.map((p) => (
              <Metric key={p.stage} label={stageLabel(p.stage)} value={p.invoice_count}
                hint={formatMoney(toPence(p.value), { showPence: false })}
                tone={p.oldest_days > 21 ? "warning" : "default"}
                href={`/dashboard/invoices?stage=${p.stage}`} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Needs attention" className="lg:col-span-2">
          {data.attention.length ? (
            <ul className="divide-y divide-graphite/10">
              {data.attention.map((a) => (
                <li key={a.key} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${a.tone === "red" ? "bg-status-danger" : a.tone === "amber" ? "bg-status-warning" : "bg-copper"}`} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{a.href ? <Link href={a.href} className="underline">{a.title}</Link> : a.title}</p>
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
              <dd className="font-display num-lining text-3xl">{formatMoney(data.snapshot.pipelineValue, { showPence: false })}</dd>
              <dd className="text-xs text-muted-light">{data.snapshot.openLeadCount} open lead{data.snapshot.openLeadCount === 1 ? "" : "s"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-light">Contracted value (all projects)</dt>
              <dd className="font-display num-lining text-3xl">{formatMoney(data.snapshot.contractedValue, { showPence: false })}</dd>
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
