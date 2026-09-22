import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";
import { isoDateOffset } from "@/lib/dates";

export type SitePL = {
  site_id: string;
  site_name: string;
  revenue: string;
  cash: string;
  card: string;
  account: string;
  trading_days: number;
  food_cost: string;
  other_cost: string;
  labour_cost: string;
  total_cost: string;
  gross_profit: string;
  margin_pct: string | null;
  budget: string;
  budget_variance: string;
};

export type DailySaleRow = {
  sale_date: string;
  cash: string;
  card: string;
  account: string;
  total: string;
  transactions: number | null;
  confirmed: boolean;
};

/**
 * The trading position of every kitchen the caller is allowed to see.
 * security invoker in the database, so a site manager gets their own sites and
 * an administrator gets all of them from the same call.
 */
export async function siteProfitAndLoss(ctx: OrgContext, range: { from: string; to: string }) {
  const { data } = await ctx.supabase.rpc("report_site_pl", {
    p_org: ctx.organisation.id,
    p_from: range.from,
    p_to: range.to,
  });
  return (data ?? []) as unknown as SitePL[];
}

/** Day by day for one kitchen. */
export async function dailySales(ctx: OrgContext, siteId: string, range: { from: string; to: string }) {
  const { data } = await ctx.supabase.rpc("report_daily_sales", {
    p_site_id: siteId,
    p_from: range.from,
    p_to: range.to,
  });
  return (data ?? []) as unknown as DailySaleRow[];
}

/** One day's figures, for the entry form to pre-fill rather than blank over. */
export const saleForDay = cache(async (ctx: OrgContext, siteId: string, date: string) => {
  const { data } = await ctx.supabase
    .from("daily_sales")
    .select("id, cash, card, account, total, transactions, notes, confirmed_at")
    .eq("site_id", siteId)
    .eq("sale_date", date)
    .maybeSingle();
  return data;
});

/** Kitchens that traded yesterday and recorded nothing. */
export async function sitesMissingSales(ctx: OrgContext, date = isoDateOffset(-1)) {
  const { data } = await ctx.supabase.rpc("sites_missing_sales", { p_org: ctx.organisation.id, p_date: date });
  return (data ?? []) as unknown as { site_id: string; site_name: string }[];
}

/** The sites this person may record takings for. Admins and finance get all. */
export async function sitesForTrading(ctx: OrgContext) {
  const { data } = await ctx.supabase
    .from("sites")
    .select("id, name")
    .eq("organisation_id", ctx.organisation.id)
    .eq("site_type", "kitchen")
    .is("archived_at", null)
    .order("name");
  return (data ?? []).map((s) => ({ value: s.id, label: s.name }));
}

/** The approved operating budget for a month, if one has been agreed. */
export async function siteBudget(ctx: OrgContext, siteId: string, month: string) {
  const { data } = await ctx.supabase
    .from("site_budgets")
    .select("*")
    .eq("site_id", siteId)
    .eq("month", month)
    .maybeSingle();
  return data;
}
