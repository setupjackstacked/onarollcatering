import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listPayPeriods } from "@/features/payroll/queries";
import { PAY_PERIOD_STATUSES } from "@/features/payroll/schema";
import { PageHeader, StatusBadge } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionLink } from "@/components/dashboard/entity";
import { formatDateUK } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Payroll" };

const TONE: Record<string, "grey" | "amber" | "green" | "copper"> = { draft: "grey", review: "amber", finalised: "green", exported: "copper" };

export default async function PayrollPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/payroll");
  if (!ctx.can("finance.read")) redirect("/dashboard");
  const sp = await searchParams;
  const { rows, total, page, size } = await listPayPeriods(ctx, sp);
  return (
    <>
      <PageHeader eyebrow="Finance" title="Payroll preparation"
        description="Turns approved timesheets into per-employee pay inputs you can export. It does not calculate PAYE, NI or pension — your payroll provider does that."
        actions={ctx.can("finance.write") ? <ActionLink href="/dashboard/payroll/new" variant="copper">New pay period</ActionLink> : null} />
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/payroll/${r.id}`}
        columns={[
          { key: "n", header: "Period", render: (r) => r.name },
          { key: "d", header: "Dates", render: (r) => `${formatDateUK(r.start_date)} – ${formatDateUK(r.end_date)}` },
          { key: "p", header: "Pay date", render: (r) => formatDateUK(r.pay_date) },
          { key: "s", header: "Status", render: (r) => <StatusBadge label={PAY_PERIOD_STATUSES.find((s) => s.value === r.status)?.label ?? r.status} tone={TONE[r.status] ?? "grey"} /> },
          { key: "f", header: "Finalised", render: (r) => (r.finalised_at ? formatDateUK(r.finalised_at) : "—") },
        ]}
        empty={{ title: "No pay periods yet", description: "Create a period, build it from approved timesheets, then export the CSV for your payroll provider.", action: ctx.can("finance.write") ? { label: "New pay period", href: "/dashboard/payroll/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/payroll", sp) }} />
    </>
  );
}
