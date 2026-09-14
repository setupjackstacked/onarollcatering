import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

/** Token-scoped read for the customer page. Uses the service role; exposes only what the page renders. */
export async function getPublicQuote(token: string) {
  if (!isSupabaseConfigured || !/^[a-f0-9]{48}$/.test(token)) return null;
  const admin = createSupabaseAdminClient();
  const { data: quote } = await admin
    .from("quotes")
    .select("*, clients(name, billing_address), client_contacts(first_name, last_name), projects(name, project_number)")
    .eq("public_token", token)
    .is("archived_at", null)
    .maybeSingle();
  if (!quote) return null;
  const { data: items } = await admin.from("quote_items").select("id, position, description, quantity, unit, sell_price, discount_pct, vat_rate, line_net, line_vat, line_total").eq("quote_id", quote.id).order("position");
  // never return internal fields
  const { internal_notes: _i, cost_total: _c, ...safe } = quote;
  void _i; void _c;
  return { quote: safe, items: items ?? [] };
}

export async function markQuoteViewed(token: string) {
  if (!isSupabaseConfigured) return;
  const admin = createSupabaseAdminClient();
  await admin.rpc("quote_mark_viewed", { p_token: token });
}

export async function customerDecision(token: string, decision: "accept" | "decline", name: string, note: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("quote_customer_decision", { p_token: token, p_decision: decision, p_name: name, p_note: note });
  return !error && data === true;
}
