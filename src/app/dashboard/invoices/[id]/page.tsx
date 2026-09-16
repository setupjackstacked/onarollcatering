import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getInvoice, listInvoiceItems, listPayments, listCreditNotesFor } from "@/features/invoices/queries";
import { createCreditNote, archiveInvoice, deletePayment } from "@/features/invoices/actions";
import { listActivity, listNotes } from "@/features/shared/activity";
import { EntityHeader, DescriptionList, ActionLink } from "@/components/dashboard/entity";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { NotesPanel } from "@/components/dashboard/notes-panel";
import { IssueInvoiceForm, RecordPaymentForm, CancelInvoiceForm, SendInvoiceForm } from "@/components/dashboard/forms/invoice-forms";
import { RedirectingAction } from "@/components/dashboard/redirecting-action";
import { InvoiceBadge } from "@/lib/domain/badges";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK, isoDateOffset } from "@/lib/dates";
import { publicEnv } from "@/lib/env";
import { PAYMENT_METHODS } from "@/features/invoices/schema";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/invoices/${id}`);
  const inv = await getInvoice(ctx, id);
  if (!inv) notFound();
  if (!ctx.can("finance.read") && !inv.project_id) redirect("/dashboard");
  const [items, payments, activity, notes, creditNotes] = await Promise.all([listInvoiceItems(ctx, id), listPayments(ctx, id), listActivity(ctx, "invoices", id), listNotes(ctx, "invoice", id), listCreditNotesFor(ctx, id)]);
  const client = inv.clients as unknown as { id: string; name: string; email: string | null; payment_terms_days: number } | null;
  const contact = inv.client_contacts as unknown as { email: string | null } | null;
  const project = inv.projects as unknown as { id: string; name: string; project_number: string } | null;
  const quote = inv.quotes as unknown as { id: string; quote_number: string } | null;
  const canWrite = ctx.can("finance.write");
  const isCredit = inv.kind === "credit_note";
  const isDraft = inv.status === "draft";
  const outstanding = ["issued", "part_paid", "overdue"].includes(inv.status);
  const balance = toPence(inv.total) - toPence(inv.amount_paid);
  const path = `/dashboard/invoices/${id}`;
  const today = isoDateOffset(0);
  const customerUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/i/${inv.public_token}`;
  const label = isCredit ? "Credit note" : "Invoice";

  return (
    <>
      <EntityHeader
        back={{ href: "/dashboard/invoices", label: "Invoices" }}
        eyebrow={`${label} ${inv.invoice_number || "(draft — number assigned on issue)"}${inv.kind !== "standard" && !isCredit ? ` · ${inv.kind}` : ""}`}
        title={inv.title}
        badge={<InvoiceBadge status={inv.status} />}
        meta={<>{client ? <Link href={`/dashboard/clients/${client.id}`} className="underline">{client.name}</Link> : null}{project ? <Link href={`/dashboard/projects/${project.id}`} className="underline">{project.project_number}</Link> : null}{quote ? <Link href={`/dashboard/quotes/${quote.id}`} className="underline">From {quote.quote_number}</Link> : null}{inv.issue_date ? <span>Issued {formatDateUK(inv.issue_date)}</span> : null}{inv.due_date && !isCredit ? <span>Due {formatDateUK(inv.due_date)}</span> : null}</>}
        actions={
          <>
            <ActionLink href={`/api/invoices/${id}/pdf`}>PDF</ActionLink>
            {canWrite ? <ActionLink href={`${path}/edit`} variant="obsidian">{isDraft ? "Edit" : "Edit internal fields"}</ActionLink> : null}
            {canWrite && !isDraft && !isCredit && inv.status !== "cancelled" ? <RedirectingAction action={createCreditNote.bind(null, id)} label="Raise credit note" /> : null}
            {canWrite && isDraft ? <ConfirmAction action={archiveInvoice.bind(null, id)} label="Archive draft" title="Archive this draft?" confirmLabel="Archive" /> : null}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Net" value={formatMoney(toPence(inv.total) - toPence(inv.vat_amount), { showPence: false })} />
        <Metric label="Total inc. VAT" value={formatMoney(toPence(inv.total), { showPence: false })} />
        {!isCredit ? <Metric label="Paid" value={formatMoney(toPence(inv.amount_paid), { showPence: false })} /> : null}
        {!isCredit ? <Metric label="Balance due" value={formatMoney(balance, { showPence: false })} tone={inv.status === "overdue" ? "warning" : "default"} hint={inv.status === "overdue" && inv.due_date ? `Overdue since ${formatDateUK(inv.due_date)}` : undefined} /> : null}
      </div>

      {inv.status === "cancelled" ? <p className="mb-6 rounded-md bg-graphite/8 px-4 py-3 text-sm">Cancelled {formatDateUK(inv.cancelled_at, true)}{inv.cancel_reason ? ` — ${inv.cancel_reason}` : ""}.</p> : null}
      {creditNotes.length ? <p className="mb-6 rounded-md bg-graphite/8 px-4 py-3 text-sm">Credit notes against this invoice: {creditNotes.map((c, i) => <span key={c.id}>{i ? ", " : ""}<Link href={`/dashboard/invoices/${c.id}`} className="underline">{c.invoice_number || "draft"}</Link> ({formatMoney(toPence(c.total))})</span>)}</p> : null}
      {isCredit && inv.credit_for_invoice_id ? <p className="mb-6 rounded-md bg-graphite/8 px-4 py-3 text-sm">Credits <Link href={`/dashboard/invoices/${inv.credit_for_invoice_id}`} className="underline">the original invoice</Link>.</p> : null}

      {canWrite && isDraft ? (
        <Panel title={`Issue ${label.toLowerCase()}`} className="mb-6">
          <p className="mb-4 text-sm text-muted-light">Issuing assigns the next {isCredit ? "credit note" : "invoice"} number, locks the lines and starts the payment clock.{items.length === 0 ? " Add at least one line first." : ""}</p>
          {items.length > 0 ? <IssueInvoiceForm id={id} defaultIssue={today} termsDays={client?.payment_terms_days ?? 30} /> : null}
        </Panel>
      ) : null}

      {canWrite && !isDraft && inv.status !== "cancelled" ? (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title={inv.sent_at ? "Resend to customer" : "Send to customer"}>
            <p className="mb-4 text-sm text-muted-light">{inv.sent_at ? `Last sent ${formatDateUK(inv.sent_at, true)}. ` : ""}Customer link: <a href={customerUrl} className="underline break-all" target="_blank" rel="noreferrer">{customerUrl}</a></p>
            <SendInvoiceForm id={id} defaultTo={contact?.email ?? client?.email ?? ""} />
          </Panel>
          {outstanding ? (
            <Panel title="Record a payment">
              <RecordPaymentForm id={id} balance={(balance / 100).toFixed(2)} today={today} />
            </Panel>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title={`Lines (${items.length})`}>
            {items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-light"><tr><th className="py-2 pr-3 font-medium">Description</th><th className="py-2 pr-3 text-right font-medium">Qty</th><th className="py-2 pr-3 text-right font-medium">Unit</th><th className="py-2 pr-3 text-right font-medium">VAT</th><th className="py-2 text-right font-medium">Net</th></tr></thead>
                  <tbody className="divide-y divide-graphite/10">
                    {items.map((i) => (
                      <tr key={i.id}>
                        <td className="py-2 pr-3">{i.description}{Number(i.discount_pct) > 0 ? <span className="block text-xs text-muted-light">{Number(i.discount_pct)}% line discount</span> : null}</td>
                        <td className="py-2 pr-3 text-right num-lining">{Number(i.quantity)} {i.unit}</td>
                        <td className="py-2 pr-3 text-right num-lining">{formatMoney(toPence(i.sell_price))}</td>
                        <td className="py-2 pr-3 text-right">{Number(i.vat_rate)}%</td>
                        <td className="py-2 text-right num-lining">{formatMoney(toPence(i.line_net))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-light">Subtotal</dt><dd className="num-lining">{formatMoney(toPence(inv.subtotal))}</dd></div>
                  {toPence(inv.discount_amount) > 0 ? <div className="flex justify-between"><dt className="text-muted-light">Discount ({Number(inv.discount_pct)}%)</dt><dd className="num-lining">−{formatMoney(toPence(inv.discount_amount))}</dd></div> : null}
                  <div className="flex justify-between"><dt className="text-muted-light">VAT</dt><dd className="num-lining">{formatMoney(toPence(inv.vat_amount))}</dd></div>
                  <div className="flex justify-between border-t border-graphite/15 pt-1 text-base font-medium"><dt>Total</dt><dd className="num-lining">{formatMoney(toPence(inv.total))}</dd></div>
                  {!isCredit && toPence(inv.amount_paid) > 0 ? <><div className="flex justify-between"><dt className="text-muted-light">Paid</dt><dd className="num-lining">−{formatMoney(toPence(inv.amount_paid))}</dd></div><div className="flex justify-between font-medium"><dt>Balance due</dt><dd className="num-lining">{formatMoney(balance)}</dd></div></> : null}
                </dl>
              </div>
            ) : (
              <p className="text-sm text-muted-light">No lines yet.{canWrite && isDraft ? <> <Link href={`${path}/edit`} className="underline">Add lines</Link>.</> : null}</p>
            )}
          </Panel>

          {!isCredit ? (
            <Panel title={`Payments (${payments.length})`}>
              {payments.length ? (
                <ul className="divide-y divide-graphite/10 text-sm">
                  {payments.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span><span className="num-lining font-medium">{formatMoney(toPence(p.amount))}</span> <span className="text-muted-light">· {formatDateUK(p.paid_on)} · {PAYMENT_METHODS.find((m) => m.value === p.method)?.label ?? p.method}{p.reference ? ` · ${p.reference}` : ""}</span>{p.notes ? <span className="block text-xs text-muted-light">{p.notes}</span> : null}</span>
                      {ctx.can("org.manage") ? <ConfirmAction action={deletePayment.bind(null, p.id, id)} label="Remove" title="Remove this payment?" description="The invoice balance will be recalculated." confirmLabel="Remove" className="h-8 px-3 text-xs" /> : null}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-light">No payments recorded.</p>}
            </Panel>
          ) : null}

          {inv.notes ? <Panel title="Customer notes"><p className="whitespace-pre-wrap text-sm">{inv.notes}</p></Panel> : null}
          <NotesPanel entityType="invoice" entityId={id} notes={notes} canWrite={canWrite} currentUserId={ctx.user.id} revalidate={path} />
        </div>
        <div className="space-y-6">
          <Panel title="Details">
            <DescriptionList cols={1} items={[
              { label: "Type", value: inv.kind.replace("_", " ") }, { label: "Customer reference", value: inv.reference },
              { label: "Sent / first viewed", value: inv.sent_at ? formatDateUK(inv.sent_at, true) : null }, { label: "Issued", value: inv.issued_at ? formatDateUK(inv.issued_at, true) : null },
              { label: "Paid in full", value: inv.paid_at ? formatDateUK(inv.paid_at, true) : null }, { label: "Internal notes", value: inv.internal_notes },
            ]} />
          </Panel>
          {canWrite && outstanding ? (
            <Panel title="Cancel">
              <p className="mb-3 text-xs text-muted-light">Only for invoices raised in error with no payments. If it’s been paid, raise a credit note instead.</p>
              <CancelInvoiceForm id={id} />
            </Panel>
          ) : null}
          <Panel title="Activity"><ActivityTimeline rows={activity} /></Panel>
        </div>
      </div>
    </>
  );
}
