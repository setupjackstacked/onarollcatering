import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listVoucherCategories, voucherReport, sitesMissingVouchers } from "@/features/vouchers/queries";
import { listSiteOptionsForUser } from "@/features/sites/queries";
import { GRAINS } from "@/features/vouchers/schema";
import { PageHeader, Panel, Metric, EmptyState } from "@/components/dashboard/primitives";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { CategoryBarChart } from "@/components/dashboard/charts";
import { formatDateUK, isoDateOffset } from "@/lib/dates";
import { str } from "@/lib/pagination";

export const metadata = { title: "Vouchers" };

export default async function VouchersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/vouchers");
  if (!ctx.can("sites.read") && !ctx.can("finance.read")) redirect("/dashboard");
  const sp = await searchParams;
  const from = str(sp.from) || isoDateOffset(-30);
  const to = str(sp.to) || isoDateOffset(0);
  const grain = str(sp.grain) || "day";
  const siteId = str(sp.site) || undefined;

  const [{ rows, error }, categories, sites, missing] = await Promise.all([
    voucherReport(ctx, { from, to, grain, siteId }),
    listVoucherCategories(ctx), listSiteOptionsForUser(ctx), sitesMissingVouchers(ctx, isoDateOffset(-1)),
  ]);

  const chargeable = rows.filter((r) => r.is_chargeable).reduce((n, r) => n + Number(r.quantity), 0);
  const free = rows.filter((r) => !r.is_chargeable).reduce((n, r) => n + Number(r.quantity), 0);

  // period → site → category
  const periods = [...new Set(rows.map((r) => r.period))];
  const byCategory = new Map<string, number>();
  for (const r of rows) byCategory.set(r.category_label, (byCategory.get(r.category_label) ?? 0) + Number(r.quantity));

  return (
    <>
      <PageHeader eyebrow="Operations" title="Vouchers & meals"
        description="What each kitchen served, day by day. Staff log it on their phones; managers confirm it."
        actions={<ActionLink href="/dashboard/settings/vouchers">Categories</ActionLink>} />

      {missing.length ? (
        <p className="mb-6 rounded-md bg-status-warning/10 px-4 py-3 text-sm">
          No numbers logged yesterday for {missing.map((m, i) => (
            <span key={m.site_id}>{i ? ", " : ""}<Link href={`/dashboard/sites/${m.site_id}/vouchers`} className="underline">{m.site_name}</Link></span>
          ))}.
        </p>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Total logged" value={chargeable + free} hint={`${formatDateUK(from)} – ${formatDateUK(to)}`} />
        <Metric label="Chargeable" value={chargeable} />
        <Metric label="Free & complimentary" value={free} tone={free > chargeable * 0.15 ? "warning" : "default"} hint={chargeable > 0 ? `${Math.round((free / (chargeable + free)) * 100)}% of all meals` : undefined} />
        <Metric label="Sites reporting" value={new Set(rows.map((r) => r.site_id)).size} />
      </div>

      <FilterBar showSearch={false} filters={[
        { name: "grain", label: "By day", options: GRAINS },
        { name: "site", label: "All sites", options: sites },
      ]} />

      {error ? <p role="alert" className="mb-6 rounded-md bg-status-danger/10 px-4 py-3 text-sm text-status-danger">The report couldn’t be loaded.</p> : null}

      {rows.length === 0 ? (
        <EmptyState title="Nothing logged in this period" description="Kitchens record their vouchers and meals from the staff portal, or from the site’s Vouchers tab." />
      ) : (
        <div className="space-y-6">
          <Panel title="By category"><CategoryBarChart data={[...byCategory.entries()].map(([label, value]) => ({ label, value }))} valueLabel="Meals" money={false} /></Panel>

          <Panel title="Detail">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-light">
                  <tr>
                    <th className="py-2 pr-3 font-medium">{grain === "day" ? "Date" : grain === "week" ? "Week of" : "Month"}</th>
                    <th className="py-2 pr-3 font-medium">Site</th>
                    {categories.map((c) => <th key={c.id} className="py-2 pr-3 text-right font-medium">{c.label}</th>)}
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite/10">
                  {periods.flatMap((period) => {
                    const siteIds = [...new Set(rows.filter((r) => r.period === period).map((r) => r.site_id))];
                    return siteIds.map((sid) => {
                      const cells = rows.filter((r) => r.period === period && r.site_id === sid);
                      const rowTotal = cells.reduce((n, c) => n + Number(c.quantity), 0);
                      return (
                        <tr key={`${period}-${sid}`}>
                          <td className="py-2 pr-3 whitespace-nowrap">{formatDateUK(period)}</td>
                          <td className="py-2 pr-3"><Link href={`/dashboard/sites/${sid}/vouchers`} className="underline">{cells[0]?.site_name}</Link></td>
                          {categories.map((c) => {
                            const cell = cells.find((x) => x.category_id === c.id);
                            return <td key={c.id} className="py-2 pr-3 text-right num-lining">{cell ? Number(cell.quantity) : <span className="text-muted-light">—</span>}</td>;
                          })}
                          <td className="py-2 text-right num-lining font-medium">{rowTotal}</td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
