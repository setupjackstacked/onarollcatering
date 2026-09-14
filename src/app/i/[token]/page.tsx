import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicInvoice } from "@/features/invoices/public";
import { Logo } from "@/components/marketing/logo";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { site } from "@/content/site";
import { DEFAULT_INVOICE_TERMS, PAYMENT_DETAILS } from "@/features/invoices/schema";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };

/** Customer invoice page. Token in the URL is the only credential — no login. */
export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPublicInvoice(token);
  if (!data) notFound();
  const { invoice: inv, items } = data;
  const client = inv.clients as unknown as { name: string } | null;
  const isCredit = inv.kind === "credit_note";
  const balance = toPence(inv.total) - toPence(inv.amount_paid);
  const label = isCredit ? "Credit note" : "Invoice";

  return (
    <main className="min-h-dvh bg-ivory text-graphite">
      <header className="surface-dark"><div className="container-x flex h-20 items-center justify-between"><Logo variant="horizontal" className="h-9" /><span className="eyebrow text-copper">{label}</span></div></header>
      <div className="container-x max-w-4xl py-10 md:py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-copper-dark">{inv.invoice_number}</p>
            <h1 className="font-display display-md mt-2">{inv.title}</h1>
            <p className="mt-2 text-muted-light">{client?.name} · Issued {formatDateUK(inv.issue_date)}{!isCredit && inv.due_date ? ` · Due ${formatDateUK(inv.due_date)}` : ""}{inv.reference ? ` · Your ref ${inv.reference}` : ""}</p>
          </div>
          <a href={`/i/${token}/pdf`} className="inline-flex h-11 items-center rounded-full border border-graphite/25 px-5 text-sm font-medium hover:border-graphite">Download PDF</a>
        </div>

        {inv.status === "paid" ? <p className="mt-8 rounded-md bg-status-success/10 px-4 py-3 text-sm text-status-success">Paid in full{inv.paid_at ? ` on ${formatDateUK(inv.paid_at)}` : ""}. Thank you.</p> : null}
        {inv.status === "overdue" ? <p className="mt-8 rounded-md bg-status-danger/10 px-4 py-3 text-sm text-status-danger">This invoice is overdue. Balance due {formatGBP(balance)}.</p> : null}
        {inv.status === "cancelled" ? <p className="mt-8 rounded-md bg-graphite/8 px-4 py-3 text-sm">This invoice has been cancelled and is not payable.</p> : null}

        <div className="mt-10 overflow-hidden rounded-lg border border-graphite/10 bg-white/60">
          <table className="w-full text-sm">
            <thead className="bg-graphite/[0.04] text-left text-xs uppercase tracking-wider text-muted-light"><tr><th className="px-4 py-3 font-medium">Description</th><th className="px-4 py-3 text-right font-medium">Qty</th><th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Unit</th><th className="hidden px-4 py-3 text-right font-medium sm:table-cell">VAT</th><th className="px-4 py-3 text-right font-medium">Net</th></tr></thead>
            <tbody className="divide-y divide-graphite/10">
              {items.map((i) => (
                <tr key={i.id}><td className="px-4 py-3">{i.description}{Number(i.discount_pct) > 0 ? <span className="block text-xs text-muted-light">{Number(i.discount_pct)}% discount</span> : null}</td><td className="px-4 py-3 text-right num-lining">{Number(i.quantity)} {i.unit}</td><td className="hidden px-4 py-3 text-right num-lining sm:table-cell">{formatGBP(toPence(i.sell_price))}</td><td className="hidden px-4 py-3 text-right sm:table-cell">{Number(i.vat_rate)}%</td><td className="px-4 py-3 text-right num-lining">{formatGBP(toPence(i.line_net))}</td></tr>
              ))}
            </tbody>
          </table>
          <dl className="ml-auto max-w-xs space-y-1 px-4 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-light">Subtotal</dt><dd className="num-lining">{formatGBP(toPence(inv.subtotal))}</dd></div>
            {toPence(inv.discount_amount) > 0 ? <div className="flex justify-between"><dt className="text-muted-light">Discount</dt><dd className="num-lining">−{formatGBP(toPence(inv.discount_amount))}</dd></div> : null}
            <div className="flex justify-between"><dt className="text-muted-light">VAT</dt><dd className="num-lining">{formatGBP(toPence(inv.vat_amount))}</dd></div>
            <div className="flex justify-between border-t border-graphite/15 pt-2 text-base font-medium"><dt>Total</dt><dd className="num-lining">{formatGBP(toPence(inv.total))}</dd></div>
            {!isCredit && toPence(inv.amount_paid) > 0 ? <><div className="flex justify-between"><dt className="text-muted-light">Paid</dt><dd className="num-lining">−{formatGBP(toPence(inv.amount_paid))}</dd></div><div className="flex justify-between font-medium"><dt>Balance due</dt><dd className="num-lining">{formatGBP(balance)}</dd></div></> : null}
          </dl>
        </div>

        {!isCredit && inv.status !== "paid" && inv.status !== "cancelled" ? <section className="mt-8 rounded-lg border border-copper/30 bg-copper/5 p-5"><p className="eyebrow text-copper-dark">How to pay</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{PAYMENT_DETAILS}</p><p className="mt-2 text-xs text-muted-light">Please quote {inv.invoice_number} as your payment reference.</p></section> : null}
        {inv.notes ? <section className="mt-8"><p className="eyebrow text-copper-dark">Notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{inv.notes}</p></section> : null}
        <section className="mt-8"><p className="eyebrow text-copper-dark">Terms</p><p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-light">{inv.terms ?? DEFAULT_INVOICE_TERMS}</p></section>

        <p className="mt-12 text-xs text-muted-light">Questions about this {label.toLowerCase()}? Email <a className="underline" href={`mailto:${site.contact.email.display}`}>{site.contact.email.display}</a> or call {site.contact.phone.display}.</p>
      </div>
    </main>
  );
}
