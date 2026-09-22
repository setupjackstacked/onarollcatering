"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/context";
import { parseForm, type FormState } from "@/lib/forms";
import { logger } from "@/lib/logger";

const money = z
  .string()
  .trim()
  .transform((v) => (v === "" ? "0" : v))
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Enter an amount like 412.50");

const salesSchema = z.object({
  site_id: z.string().uuid("Choose a site"),
  sale_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  cash: money,
  card: money,
  account: money,
  transactions: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

/**
 * Record a day's takings for one kitchen.
 *
 * The whole day goes in one call so a half-saved day can't exist. The database
 * function checks the caller actually manages this site — the permission check
 * here stops the obvious case early and gives a readable message, but it is not
 * the thing keeping other people's money out of view.
 */
export async function saveDailySales(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("trading.write");
  const p = parseForm(salesSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;

  const transactions = d.transactions && /^\d+$/.test(d.transactions) ? Number(d.transactions) : null;

  const { error } = await ctx.supabase.rpc("record_daily_sales", {
    p_site_id: d.site_id,
    p_date: d.sale_date,
    p_cash: d.cash,
    p_card: d.card,
    p_account: d.account,
    p_transactions: transactions ?? undefined,
    p_notes: d.notes || undefined,
  });
  if (error) {
    logger.error("trading.save_failed", { code: error.code, message: error.message });
    if (error.code === "42501") return { error: "You can only record takings for a site you manage." };
    if (error.code === "23514" || error.message.includes("before it has happened")) {
      return { error: "That date hasn't happened yet." };
    }
    if (error.message.includes("signed off")) {
      return { error: "That day has been signed off by finance and can't be changed." };
    }
    return { error: "Couldn’t save the day’s takings." };
  }

  revalidatePath("/dashboard/sales");
  revalidatePath(`/dashboard/sites/${d.site_id}/sales`);
  return { success: "Saved." };
}

/** Finance signs a day off, after which the figure stops moving. */
export async function confirmDailySales(siteId: string, date: string) {
  const ctx = await requirePermission("finance.write");
  const { error } = await ctx.supabase.rpc("confirm_daily_sales", { p_site_id: siteId, p_date: date });
  if (error) logger.error("trading.confirm_failed", { code: error.code });
  revalidatePath("/dashboard/sales");
  revalidatePath(`/dashboard/sites/${siteId}/sales`);
}

const budgetSchema = z.object({
  site_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Choose a month"),
  food_budget: money,
  labour_budget: money,
  other_budget: money,
  revenue_target: money,
  approved_by_client: z.coerce.boolean().optional(),
  notes: z.string().trim().max(500).optional(),
});

/** The operating budget the client approved for a kitchen, month by month. */
export async function saveSiteBudget(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(budgetSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;

  const { error } = await ctx.supabase.from("site_budgets").upsert(
    {
      organisation_id: ctx.organisation.id,
      site_id: d.site_id,
      month: `${d.month}-01`,
      food_budget: d.food_budget,
      labour_budget: d.labour_budget,
      other_budget: d.other_budget,
      revenue_target: d.revenue_target,
      approved_by_client: Boolean(d.approved_by_client),
      notes: d.notes || null,
      created_by: ctx.user.id,
    },
    { onConflict: "site_id,month" },
  );
  if (error) {
    logger.error("trading.budget_failed", { code: error.code, message: error.message });
    return { error: error.code === "42501" ? "You don’t have permission to set budgets." : "Couldn’t save the budget." };
  }
  revalidatePath(`/dashboard/sites/${d.site_id}/sales`);
  return { success: "Budget saved." };
}
