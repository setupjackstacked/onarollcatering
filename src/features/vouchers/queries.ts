import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";
import { isoDateOffset } from "@/lib/dates";

export const listVoucherCategories = cache(async (ctx: OrgContext, includeInactive = false) => {
  let q = ctx.supabase.from("voucher_categories").select("*").eq("organisation_id", ctx.organisation.id).order("sort_order").order("label");
  if (!includeInactive) q = q.eq("active", true);
  const { data } = await q;
  return data ?? [];
});

export async function listVoucherEntries(ctx: OrgContext, sp: Record<string, string | string[] | undefined>, filter?: { siteId?: string }) {
  const { from, to, page, size } = pageParams(sp);
  const fromDate = str(sp.from) || isoDateOffset(-30);
  const toDate = str(sp.to) || isoDateOffset(0);
  let q = ctx.supabase.from("voucher_entries")
    .select("*, sites(id, name), voucher_entry_lines(id, quantity, category_id)", { count: "exact" })
    .eq("organisation_id", ctx.organisation.id)
    .gte("entry_date", fromDate).lte("entry_date", toDate)
    .order("entry_date", { ascending: false }).range(from, to);
  if (filter?.siteId) q = q.eq("site_id", filter.siteId);
  const { data, count } = await q;
  return { rows: data ?? [], total: count ?? 0, page, size, fromDate, toDate };
}

/** The entry for one site and day, with its lines — what the phone form loads. */
export async function getVoucherEntry(ctx: OrgContext, siteId: string, date: string) {
  const { data } = await ctx.supabase.from("voucher_entries")
    .select("*, voucher_entry_lines(id, category_id, quantity)")
    .eq("site_id", siteId).eq("entry_date", date).maybeSingle();
  return data;
}

export type VoucherReportRow = {
  period: string; site_id: string; site_name: string;
  category_id: string; category_label: string; is_chargeable: boolean; quantity: number;
};

export async function voucherReport(ctx: OrgContext, opts: { from: string; to: string; grain: string; siteId?: string; categoryId?: string }) {
  const { data, error } = await ctx.supabase.rpc("report_vouchers", {
    p_org: ctx.organisation.id, p_from: opts.from, p_to: opts.to, p_grain: opts.grain,
    p_site_id: opts.siteId ?? undefined, p_category_id: opts.categoryId ?? undefined,
  });
  return { rows: (data ?? []) as unknown as VoucherReportRow[], error: error?.message ?? null };
}

export async function sitesMissingVouchers(ctx: OrgContext, date = isoDateOffset(-1)) {
  const { data } = await ctx.supabase.rpc("sites_missing_vouchers", { p_org: ctx.organisation.id, p_date: date });
  return (data ?? []) as unknown as { site_id: string; site_name: string }[];
}

/** Today's totals across every site — the management overview widget. */
export async function vouchersToday(ctx: OrgContext) {
  const today = isoDateOffset(0);
  const { rows } = await voucherReport(ctx, { from: today, to: today, grain: "day" });
  let chargeable = 0, complimentary = 0;
  for (const r of rows) {
    if (r.is_chargeable) chargeable += Number(r.quantity);
    else complimentary += Number(r.quantity);
  }
  return { chargeable, complimentary, total: chargeable + complimentary };
}
