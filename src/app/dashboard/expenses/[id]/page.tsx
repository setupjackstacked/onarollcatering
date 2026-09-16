import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getExpense } from "@/features/expenses/queries";
import { setExpenseStatus, archiveExpense } from "@/features/expenses/actions";
import { categoryLabel } from "@/features/expenses/schema";
import { listActivity } from "@/features/shared/activity";
import { EntityHeader, DescriptionList, ActionLink } from "@/components/dashboard/entity";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { ReceiptUpload } from "@/components/dashboard/forms/expense-forms";
import { ExpenseBadge } from "@/lib/domain/badges";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";

export default async function ExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/expenses/${id}`);
  const e = await getExpense(ctx, id);
  if (!e) notFound();
  const activity = await listActivity(ctx, "expenses", id);
  const project = e.projects as unknown as { id: string; name: string; project_number: string } | null;
  const receipt = e.documents as unknown as { id: string; name: string } | null;
  const supplier = e.suppliers as unknown as { id: string; name: string } | null;
  const canApprove = ctx.can("finance.write");
  const canEdit = canApprove || (ctx.role === "project_manager" && e.status === "pending");
  return (
    <>
      <EntityHeader back={{ href: "/dashboard/expenses", label: "Expenses" }} eyebrow={`${categoryLabel(e.category)} · ${formatDateUK(e.expense_date)}`} title={e.description} badge={<ExpenseBadge status={e.status} />}
        meta={<>{project ? <Link href={`/dashboard/projects/${project.id}/costs`} className="underline">{project.project_number} · {project.name}</Link> : <span>Overhead</span>}{supplier ? <Link href={`/dashboard/suppliers/${supplier.id}`} className="underline">{supplier.name}</Link> : e.supplier_name ? <span>{e.supplier_name}</span> : null}{e.reference ? <span>Ref {e.reference}</span> : null}</>}
        actions={<>
          {canEdit ? <ActionLink href={`/dashboard/expenses/${id}/edit`} variant="obsidian">Edit</ActionLink> : null}
          {canApprove ? <ConfirmAction action={archiveExpense.bind(null, id)} label="Remove" title="Remove this cost?" description="It will no longer count towards project costs." confirmLabel="Remove" /> : null}
        </>} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Metric label="Net" value={formatMoney(toPence(e.net))} /><Metric label="VAT" value={formatMoney(toPence(e.vat))} /><Metric label="Gross" value={formatMoney(toPence(e.gross))} />
      </div>
      {canApprove ? (
        <Panel title="Status" className="mb-6">
          <p className="mb-3 text-sm text-muted-light">Pending costs don’t count towards project totals. Committed counts as forecast; actual and paid count as incurred.</p>
          <div className="flex flex-wrap gap-2">
            {(["committed", "actual", "paid", "rejected"] as const).filter((s) => s !== e.status).map((s) => (
              <ConfirmAction key={s} action={setExpenseStatus.bind(null, id, s)} label={`Mark ${s}`} title={`Mark this cost as ${s}?`} variant={s === "rejected" ? "danger" : "outline"} confirmLabel="Confirm" />
            ))}
          </div>
        </Panel>
      ) : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Details">
            <DescriptionList cols={2} items={[{ label: "Category", value: categoryLabel(e.category) }, { label: "Date", value: formatDateUK(e.expense_date) }, { label: "Supplier", value: supplier?.name ?? e.supplier_name }, { label: "Reference", value: e.reference }, { label: "Approved", value: e.approved_at ? formatDateUK(e.approved_at, true) : null }, { label: "Notes", value: e.notes }]} />
          </Panel>
          <Panel title="Receipt">
            {receipt ? <p className="text-sm"><a href={`/api/documents/${receipt.id}`} className="underline">{receipt.name}</a></p> : <p className="mb-3 text-sm text-muted-light">No receipt attached.</p>}
            {canEdit && e.project_id ? <div className="mt-3"><ReceiptUpload expenseId={id} projectId={e.project_id} /></div> : null}
            {canEdit && !e.project_id ? <p className="text-xs text-muted-light">Receipts are stored against a project — set one to attach a file.</p> : null}
          </Panel>
        </div>
        <Panel title="Activity"><ActivityTimeline rows={activity} /></Panel>
      </div>
    </>
  );
}
