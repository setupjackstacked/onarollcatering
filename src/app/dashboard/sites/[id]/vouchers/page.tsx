import { requireOrgContext } from "@/lib/auth/context";
import { getSite } from "@/features/sites/queries";
import { listVoucherCategories, listVoucherEntries, getVoucherEntry } from "@/features/vouchers/queries";
import { confirmVouchers } from "@/features/vouchers/actions";
import { Panel, Metric, StatusBadge } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { VoucherEntryForm } from "@/components/dashboard/forms/voucher-forms";
import { formatDateUK, isoDateOffset } from "@/lib/dates";
import { str } from "@/lib/pagination";

export default async function SiteVouchersPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const date = str(sp.date) || isoDateOffset(0);
  const [site, categories, entry, { rows }] = await Promise.all([
    getSite(ctx, id), listVoucherCategories(ctx), getVoucherEntry(ctx, id, date), listVoucherEntries(ctx, sp, { siteId: id }),
  ]);
  if (!site) return null;

  const lines = (entry?.voucher_entry_lines ?? []) as unknown as { category_id: string; quantity: number }[];
  const existing = Object.fromEntries(lines.map((l) => [l.category_id, l.quantity]));
  const canConfirm = ctx.can("org.manage") || ctx.can("finance.write") || site.oar_manager_id === ctx.user.id;
  const periodTotal = rows.reduce((n, r) => n + r.total_quantity, 0);
  const label = (cid: string) => categories.find((c) => c.id === cid)?.label ?? "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric label="Logged today" value={date === isoDateOffset(0) ? (entry?.total_quantity ?? 0) : "—"} />
        <Metric label="Last 30 days" value={periodTotal} />
        <Metric label="Days recorded" value={rows.length} />
      </div>

      <Panel title={`Record ${date === isoDateOffset(0) ? "today" : formatDateUK(date)}`}>
        {entry?.confirmed_at ? (
          <p className="mb-4 rounded-md bg-status-success/10 px-4 py-3 text-sm text-status-success">
            Confirmed {formatDateUK(entry.confirmed_at, true)}. Only a manager can change it now.
          </p>
        ) : null}
        <VoucherEntryForm siteId={id} siteName={site.name} date={date} categories={categories} existing={existing}
          returnTo={`/dashboard/sites/${id}/vouchers`} />
      </Panel>

      <Panel title="Recent days">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-light">
                <tr><th className="py-2 pr-3 font-medium">Date</th>{categories.map((c) => <th key={c.id} className="py-2 pr-3 text-right font-medium">{c.label}</th>)}<th className="py-2 pr-3 text-right font-medium">Total</th><th className="py-2 font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-graphite/10">
                {rows.map((r) => {
                  const rl = (r.voucher_entry_lines ?? []) as unknown as { category_id: string; quantity: number }[];
                  return (
                    <tr key={r.id}>
                      <td className="py-2 pr-3 whitespace-nowrap"><a href={`?date=${r.entry_date}`} className="underline">{formatDateUK(r.entry_date)}</a></td>
                      {categories.map((c) => {
                        const l = rl.find((x) => x.category_id === c.id);
                        return <td key={c.id} className="py-2 pr-3 text-right num-lining">{l ? l.quantity : <span className="text-muted-light">—</span>}</td>;
                      })}
                      <td className="py-2 pr-3 text-right num-lining font-medium">{r.total_quantity}</td>
                      <td className="py-2">
                        {r.confirmed_at
                          ? <StatusBadge label="Confirmed" tone="green" />
                          : canConfirm
                            ? <ConfirmAction action={confirmVouchers.bind(null, r.id, id)} label="Confirm" title={`Confirm ${formatDateUK(r.entry_date)}?`} description="Staff won’t be able to change it afterwards — you still can." variant="outline" confirmLabel="Confirm" className="h-8 px-3 text-xs" />
                            : <StatusBadge label="Awaiting review" tone="amber" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="sr-only">{lines.map((l) => label(l.category_id)).join(", ")}</p>
          </div>
        ) : <p className="text-sm text-muted-light">Nothing logged here in the last 30 days.</p>}
      </Panel>
    </div>
  );
}
