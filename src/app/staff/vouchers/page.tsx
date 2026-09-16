import Link from "next/link";
import { requireStaff } from "@/features/staff/queries";
import { listVoucherCategories, getVoucherEntry, listVoucherEntries } from "@/features/vouchers/queries";
import { VoucherEntryForm } from "@/components/dashboard/forms/voucher-forms";
import { formatDateUK, isoDateOffset } from "@/lib/dates";
import { str } from "@/lib/pagination";

export const metadata = { title: "Vouchers" };

/** Log the day's vouchers and meals. Two taps from the home screen. */
export default async function StaffVouchersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, employee } = await requireStaff("/staff/vouchers");
  const sp = await searchParams;
  const date = str(sp.date) || isoDateOffset(0);

  // Their base site, or whichever site they're assigned to.
  const { data: assignments } = await ctx.supabase.from("site_assignments")
    .select("site_id, is_primary, sites(id, name, status)").eq("user_id", ctx.user.id);
  const options = (assignments ?? [])
    .map((a) => a.sites as unknown as { id: string; name: string; status: string } | null)
    .filter((s): s is { id: string; name: string; status: string } => !!s && s.status !== "closed");
  const chosen = str(sp.site) || employee.primary_site_id || options[0]?.id;

  if (!options.length) {
    return (
      <div className="space-y-4">
        <h1 className="font-display display-sm">Vouchers</h1>
        <p className="rounded-lg border border-dashed border-graphite/20 px-4 py-8 text-center text-sm text-muted-light">
          You’re not assigned to a site yet, so there’s nowhere to log vouchers. Ask your manager to add you to your kitchen.
        </p>
      </div>
    );
  }

  const site = options.find((s) => s.id === chosen) ?? options[0];
  const [categories, entry, recent] = await Promise.all([
    listVoucherCategories(ctx),
    getVoucherEntry(ctx, site.id, date),
    listVoucherEntries(ctx, { from: isoDateOffset(-7) }, { siteId: site.id }),
  ]);
  const lines = (entry?.voucher_entry_lines ?? []) as unknown as { category_id: string; quantity: number }[];
  const existing = Object.fromEntries(lines.map((l) => [l.category_id, l.quantity]));
  const locked = !!entry?.confirmed_at;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display display-sm">Vouchers</h1>
        <p className="mt-1 text-sm text-muted-light">
          {site.name} · {date === isoDateOffset(0) ? "today" : formatDateUK(date)}
          {entry ? " · already logged, change it below" : ""}
        </p>
      </div>

      {options.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {options.map((s) => (
            <Link key={s.id} href={`/staff/vouchers?site=${s.id}${date !== isoDateOffset(0) ? `&date=${date}` : ""}`}
              className={s.id === site.id ? "rounded-full bg-obsidian px-4 py-2 text-sm text-ivory" : "rounded-full border border-graphite/25 px-4 py-2 text-sm"}>
              {s.name}
            </Link>
          ))}
        </div>
      ) : null}

      {locked ? (
        <p className="rounded-md bg-status-success/10 px-4 py-3 text-sm text-status-success">
          Your manager has confirmed this day. Ask them if something needs changing.
        </p>
      ) : (
        <VoucherEntryForm siteId={site.id} date={date} categories={categories} existing={existing}
          returnTo="/staff/vouchers" allowDateChange={false} />
      )}

      {date === isoDateOffset(0) ? (
        <p className="text-sm">
          <Link href={`/staff/vouchers?site=${site.id}&date=${isoDateOffset(-1)}`} className="underline">Log yesterday instead</Link>
        </p>
      ) : (
        <p className="text-sm"><Link href={`/staff/vouchers?site=${site.id}`} className="underline">Back to today</Link></p>
      )}

      {recent.rows.length ? (
        <section>
          <h2 className="font-display text-xl">This week</h2>
          <ul className="mt-3 divide-y divide-graphite/10 rounded-lg border border-graphite/10 bg-white/50">
            {recent.rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <Link href={`/staff/vouchers?site=${site.id}&date=${r.entry_date}`} className="underline">{formatDateUK(r.entry_date)}</Link>
                <span className="num-lining text-muted-light">{r.total_quantity} logged{r.confirmed_at ? " · confirmed" : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
