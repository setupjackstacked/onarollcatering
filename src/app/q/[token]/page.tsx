import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicQuote, markQuoteViewed } from "@/features/quotes/public";
import { Logo } from "@/components/marketing/logo";
import { DecisionForm } from "./decision-form";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { site } from "@/content/site";
import { DEFAULT_TERMS } from "@/features/quotes/schema";

export const metadata: Metadata = { title: "Quotation", robots: { index: false, follow: false } };

/** Customer quote page. Token in the URL is the only credential — no login. */
export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPublicQuote(token);
  if (!data) notFound();
  const { quote, items } = data;
  if (quote.status === "sent") await markQuoteViewed(token);
  const client = quote.clients as unknown as { name: string } | null;
  const expired = quote.expiry_date < new Date().toISOString().slice(0, 10);
  const open = ["sent", "viewed"].includes(quote.status) && !expired;
  const ref = quote.revision ? `${quote.quote_number} · Revision ${quote.revision}` : quote.quote_number;

  return (
    <main className="min-h-dvh bg-ivory text-graphite">
      <header className="surface-dark"><div className="container-x flex h-20 items-center justify-between"><Logo variant="horizontal" className="h-9" /><span className="eyebrow text-copper">Quotation</span></div></header>
      <div className="container-x max-w-4xl py-10 md:py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-copper-dark">{ref}</p>
            <h1 className="font-display display-md mt-2">{quote.title}</h1>
            <p className="mt-2 text-muted-light">Prepared for {client?.name} · Issued {formatDateUK(quote.issue_date)} · Valid until {formatDateUK(quote.expiry_date)}</p>
          </div>
          <a href={`/q/${token}/pdf`} className="inline-flex h-11 items-center rounded-full border border-graphite/25 px-5 text-sm font-medium hover:border-graphite">Download PDF</a>
        </div>

        {quote.status === "accepted" ? <p className="mt-8 rounded-md bg-status-success/10 px-4 py-3 text-sm text-status-success">Accepted{quote.decision_name ? ` by ${quote.decision_name}` : ""} on {formatDateUK(quote.accepted_at)}. Thank you — we’ll be in touch to confirm next steps.</p> : null}
        {quote.status === "rejected" ? <p className="mt-8 rounded-md bg-graphite/8 px-4 py-3 text-sm">This quotation was declined{quote.decision_name ? ` by ${quote.decision_name}` : ""}.</p> : null}
        {quote.status === "superseded" ? <p className="mt-8 rounded-md bg-status-warning/10 px-4 py-3 text-sm">This quotation has been superseded by a newer revision. Please use the latest link you were sent.</p> : null}
        {(quote.status === "expired" || (expired && open === false && ["sent", "viewed"].includes(quote.status))) ? <p className="mt-8 rounded-md bg-status-warning/10 px-4 py-3 text-sm">This quotation expired on {formatDateUK(quote.expiry_date)}. Contact us for an updated quotation.</p> : null}

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
            <div className="flex justify-between"><dt className="text-muted-light">Subtotal</dt><dd className="num-lining">{formatGBP(toPence(quote.subtotal))}</dd></div>
            {toPence(quote.discount_amount) > 0 ? <div className="flex justify-between"><dt className="text-muted-light">Discount</dt><dd className="num-lining">−{formatGBP(toPence(quote.discount_amount))}</dd></div> : null}
            <div className="flex justify-between"><dt className="text-muted-light">VAT</dt><dd className="num-lining">{formatGBP(toPence(quote.vat_amount))}</dd></div>
            <div className="flex justify-between border-t border-graphite/15 pt-2 text-base font-medium"><dt>Total</dt><dd className="num-lining">{formatGBP(toPence(quote.total))}</dd></div>
          </dl>
        </div>

        {quote.scope_notes ? <section className="mt-8"><p className="eyebrow text-copper-dark">Scope notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{quote.scope_notes}</p></section> : null}
        <section className="mt-8"><p className="eyebrow text-copper-dark">Terms</p><p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-light">{quote.terms ?? DEFAULT_TERMS}</p></section>

        {open ? (
          <section className="mt-10 rounded-lg border border-graphite/10 bg-white/60 p-6">
            <h2 className="font-display text-2xl">Respond to this quotation</h2>
            <p className="mt-1 text-sm text-muted-light">Accepting confirms you’d like to proceed on the basis of this quotation. We’ll follow up with contract and mobilisation details.</p>
            <div className="mt-5"><DecisionForm token={token} /></div>
          </section>
        ) : null}

        <p className="mt-12 text-xs text-muted-light">Questions? Email <a className="underline" href={`mailto:${site.contact.email.display}`}>{site.contact.email.display}</a> or call {site.contact.phone.display}.</p>
      </div>
    </main>
  );
}
