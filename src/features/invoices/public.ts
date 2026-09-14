import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

export async function getPublicInvoice(token: string) {
  if (!isSupabaseConfigured || !/^[a-f0-9]{48}$/.test(token)) return null;
  const admin = createSupabaseAdminClient();
  const { data: inv } = await admin.from("invoices").select("*, clients(name, billing_address), client_contacts(first_name, last_name), projects(name, project_number)").eq("public_token", token).is("archived_at", null).neq("status", "draft").maybeSingle();
  if (!inv) return null;
  const { data: items } = await admin.from("invoice_items").select("id, position, description, quantity, unit, sell_price, discount_pct, vat_rate, line_net").eq("invoice_id", inv.id).order("position");
  const { internal_notes: _i, ...safe } = inv;
  void _i;
  await admin.rpc("invoice_mark_viewed", { p_token: token });
  return { invoice: safe, items: items ?? [] };
}
