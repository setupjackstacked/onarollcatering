import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getQuote, listQuoteItems, listRevisions } from "@/features/quotes/queries";
import { markQuoteSent, markQuoteDecision, createRevision, duplicateQuote, archiveQuote } from "@/features/quotes/actions";
import { listActivity, listNotes } from "@/features/shared/activity";
import { listMembers, memberOptions } from "@/features/shared/members";
import { listSiteOptions } from "@/features/shared/lookups";
import { EntityHeader, DescriptionList, ActionLink } from "@/components/dashboard/entity";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { NotesPanel } from "@/components/dashboard/notes-panel";
import { SendQuoteForm, ConvertQuoteForm, InvoiceFromQuoteForm } from "@/components/dashboard/forms/quote-forms";
import { QuoteBadge } from "@/lib/domain/badges";
import { formatGBP, toPence, marginPct } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { publicEnv } from "@/lib/env";
import { RedirectingAction } from "@/components/dashboard/redirecting-action";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/quotes/${id}`);
  const quote = await getQuote(ctx, id);
  if (!quote) notFound();
  if (!ctx.can("sales.read") && !quote.project_id) redirect("/dashboard");
  const [items, revisions, activity, notes, members, sites] = await Promise.all([
    listQuoteItems(ctx, id), listRevisions(ctx, quote.root_quote_id ?? id), listActivity(ctx, "quotes", id), listNotes(ctx, "quote", id), listMembers(ctx), listSiteOptions(ctx, quote.client_id),
  ]);
  const client = quote.clients as unknown as { id: string; name: string; email: string | null } | null;
  const contact = quote.client_contacts as unknown as { email: string | null } | null;
  const project = quote.projects as unknown as { id: string; name: string; project_number: string } | null;
  const canWrite = ctx.can("sales.write");
  const showCost = ctx.can("finance.read") || ctx.role === "administrator";
  const net = toPence(quote.total) - toPence(quote.vat_amount);
  const margin = marginPct(net, toPence(quote.cost_total));
  const path = `/dashboard/quotes/${id}`;
  const isDraft = quote.status === "draft";
  const isOpen = ["draft", "sent", "viewed"].includes(quote.status);
  const customerUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/q/${quote.public_token}`;

  return (
    <>
      <EntityHeader
        back={{ href: "/dashboard/quotes", label: "Quotes" }}
        eyebrow={`Quotation ${quote.quote_number}${quote.revision ? ` · Revision ${quote.revision}` : ""}`}
        title={quote.title}
        badge={<QuoteBadge status={quote.status} />}
        meta={<>{client ? <Link href={`/dashboard/clients/${client.id}`} className="underline">{client.name}</Link> : null}{project ? <Link href={`/dashboard/projects/${project.id}`} className="underline">{project.project_number}</Link> : null}<span>Issued {formatDateUK(quote.issue_date)}</span><span>Valid until {formatDateUK(quote.expiry_date)}</span></>}
        actions={
          <>
            <ActionLink href={`/api/quotes/${id}/pdf`}>PDF</ActionLink>
            {canWrite && isDraft ? <ActionLink href={`${path}/edit`} variant="obsidian">Edit</ActionLink> : null}
            {canWrite && !isDraft && quote.status !== "accepted" ? <RedirectingAction action={createRevision.bind(null, id)} label="New revision" /> : null}
            {canWrite ? <RedirectingAction action={duplicateQuote.bind(null, id)} label="Duplicate" /> : null}
            {canWrite && isOpen ? <ConfirmAction action={archiveQuote.bind(null, id)} label="Archive" title="Archive this quote?" confirmLabel="Archive" /> : null}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Net" value={formatGBP(net, { showPence: false })} />
        <Metric label="Total inc. VAT" value={formatGBP(toPence(quote.total), { showPence: false })} />
        {showCost ? <Metric label="Internal cost" value={formatGBP(toPence(quote.cost_total), { showPence: false })} /> : null}
        {showCost ? <Metric label="Expected margin" value={margin === null ? "—" : `${margin}%`} tone={margin !== null && margin < 15 ? "warning" : "default"} hint={`Profit ${formatGBP(net - toPence(quote.cost_total), { showPence: false })}`} /> : null}
      </div>

      {canWrite && isOpen ? (
        <Panel title={isDraft ? "Send to customer" : "Resend"} className="mb-6">
          <p className="mb-4 text-sm text-muted-light">Emails a link to the customer page where they can view, download the PDF, accept or decline. Customer link: <a href={customerUrl} className="underline break-all" target="_blank" rel="noreferrer">{customerUrl}</a></p>
          <SendQuoteForm id={id} defaultTo={contact?.email ?? client?.email ?? ""} />
          <div className="mt-4 flex flex-wrap gap-2 border-t border-graphite/10 pt-4">
            {isDraft ? <ConfirmAction action={markQuoteSent.bind(null, id)} label="Mark as sent (without email)" title="Mark as sent?" description="Use this if you’ve sent the PDF another way. Lines become locked." variant="outline" confirmLabel="Mark sent" /> : null}
            <ConfirmAction action={markQuoteDecision.bind(null, id, "accepted")} label="Mark accepted" title="Mark this quote accepted?" description="Records acceptance on the customer’s behalf (e.g. accepted by email or phone)." variant="outline" confirmLabel="Mark accepted" />
            <ConfirmAction action={markQuoteDecision.bind(null, id, "rejected")} label="Mark rejected" title="Mark this quote rejected?" confirmLabel="Mark rejected" />
          </div>
        </Panel>
      ) : null}

      {quote.status === "accepted" ? (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Project">
            {quote.converted_project_id ? <p className="text-sm">Linked to <Link href={`/dashboard/projects/${quote.converted_project_id}`} className="underline">the project</Link>.</p> : ctx.can("projects.write") ? <ConvertQuoteForm id={id} members={memberOptions(members)} sites={sites} /> : <p className="text-sm text-muted-light">An owner or administrator can convert this to a project.</p>}
          </Panel>
          <Panel title="Invoice">
            {quote.converted_invoice_id ? <p className="mb-3 text-sm">Full invoice: <Link href={`/dashboard/invoices/${quote.converted_invoice_id}`} className="underline">open</Link>.</p> : null}
            {ctx.can("finance.write") ? <InvoiceFromQuoteForm id={id} /> : <p className="text-sm text-muted-light">Finance can raise invoices from this quote.</p>}
          </Panel>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title={`Lines (${items.length})`}>
            {items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-light"><tr><th className="py-2 pr-3 font-medium">Description</th><th className="py-2 pr-3 text-right font-medium">Qty</th>{showCost ? <th className="py-2 pr-3 text-right font-medium">Cost</th> : null}<th className="py-2 pr-3 text-right font-medium">Sell</th><th className="py-2 pr-3 text-right font-medium">VAT</th><th className="py-2 text-right font-medium">Net</th></tr></thead>
                  <tbody className="divide-y divide-graphite/10">
                    {items.map((i) => (
                      <tr key={i.id}>
                        <td className="py-2 pr-3">{i.description}{i.internal_notes && showCost ? <span className="block text-xs text-muted-light">Internal: {i.internal_notes}</span> : null}{Number(i.discount_pct) > 0 ? <span className="block text-xs text-muted-light">{Number(i.discount_pct)}% line discount</span> : null}</td>
                        <td className="py-2 pr-3 text-right num-lining">{Number(i.quantity)} {i.unit}</td>
                        {showCost ? <td className="py-2 pr-3 text-right num-lining text-muted-light">{formatGBP(toPence(i.cost_price))}</td> : null}
                        <td className="py-2 pr-3 text-right num-lining">{formatGBP(toPence(i.sell_price))}</td>
                        <td className="py-2 pr-3 text-right">{Number(i.vat_rate)}%</td>
                        <td className="py-2 text-right num-lining">{formatGBP(toPence(i.line_net))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-light">Subtotal</dt><dd className="num-lining">{formatGBP(toPence(quote.subtotal))}</dd></div>
                  {toPence(quote.discount_amount) > 0 ? <div className="flex justify-between"><dt className="text-muted-light">Discount ({Number(quote.discount_pct)}%)</dt><dd className="num-lining">−{formatGBP(toPence(quote.discount_amount))}</dd></div> : null}
                  <div className="flex justify-between"><dt className="text-muted-light">VAT</dt><dd className="num-lining">{formatGBP(toPence(quote.vat_amount))}</dd></div>
                  <div className="flex justify-between border-t border-graphite/15 pt-1 text-base font-medium"><dt>Total</dt><dd className="num-lining">{formatGBP(toPence(quote.total))}</dd></div>
                </dl>
              </div>
            ) : (
              <p className="text-sm text-muted-light">No lines yet.{canWrite && isDraft ? <> <Link href={`${path}/edit`} className="underline">Add lines</Link>.</> : null}</p>
            )}
          </Panel>
          {quote.scope_notes ? <Panel title="Scope notes"><p className="whitespace-pre-wrap text-sm">{quote.scope_notes}</p></Panel> : null}
          <NotesPanel entityType="quote" entityId={id} notes={notes} canWrite={canWrite} currentUserId={ctx.user.id} revalidate={path} />
        </div>
        <div className="space-y-6">
          <Panel title="Status">
            <DescriptionList cols={1} items={[
              { label: "Sent", value: quote.sent_at ? formatDateUK(quote.sent_at, true) : null }, { label: "Viewed by customer", value: quote.viewed_at ? formatDateUK(quote.viewed_at, true) : null },
              { label: "Accepted", value: quote.accepted_at ? `${formatDateUK(quote.accepted_at, true)}${quote.decision_name ? ` · ${quote.decision_name}` : ""}` : null },
              { label: "Rejected", value: quote.rejected_at ? `${formatDateUK(quote.rejected_at, true)}${quote.decision_name ? ` · ${quote.decision_name}` : ""}` : null },
              { label: "Customer note", value: quote.decision_note }, { label: "Internal notes", value: quote.internal_notes },
            ]} />
          </Panel>
          {revisions.length > 1 ? (
            <Panel title="Revisions">
              <ul className="space-y-2 text-sm">
                {revisions.map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    {r.id === id ? <span className="font-medium">Revision {r.revision} (this)</span> : <Link href={`/dashboard/quotes/${r.id}`} className="underline">Revision {r.revision}</Link>}
                    <span className="flex items-center gap-2"><QuoteBadge status={r.status} /><span className="num-lining text-muted-light">{formatGBP(toPence(r.total), { showPence: false })}</span></span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
          <Panel title="Activity"><ActivityTimeline rows={activity} /></Panel>
        </div>
      </div>
    </>
  );
}
