"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requirePermission } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { quoteHeaderSchema, linesSchema, sendQuoteSchema } from "./schema";
import { getQuote } from "./queries";
import { sendMail } from "@/lib/email/resend";
import { quoteEmail } from "@/lib/email/documents";
import { publicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

function dbError(error: { code?: string; message: string }, fallback: string): FormState {
  if (error.code === "42501") return { error: "You don’t have permission to do that." };
  if (error.code === "23514") return { error: error.message.replace(/^[^:]*: /, "") };
  logger.error("db.error", { code: error.code, message: error.message });
  return { error: fallback };
}

export async function saveQuoteHeader(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("sales.write");
  const p = parseForm(quoteHeaderSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = {
    title: d.title, client_id: d.client_id, contact_id: nullable(d.contact_id), project_id: nullable(d.project_id), lead_id: nullable(d.lead_id),
    issue_date: d.issue_date, expiry_date: d.expiry_date, discount_pct: d.discount_pct.toFixed(2), scope_notes: nullable(d.scope_notes), terms: nullable(d.terms), internal_notes: nullable(d.internal_notes),
  };
  if (id) {
    const { error } = await ctx.supabase.from("quotes").update(row).eq("id", id);
    if (error) return dbError(error, "Couldn’t save the quote.");
    revalidatePath(`/dashboard/quotes/${id}`);
    return { success: "Saved." };
  }
  const { data, error } = await ctx.supabase.from("quotes").insert({ ...row, quote_number: "", organisation_id: ctx.organisation.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return dbError(error ?? { message: "no row" }, "Couldn’t create the quote.");
  if (row.lead_id) await ctx.supabase.from("leads").update({ status: "quote_required" }).eq("id", row.lead_id).eq("status", "qualified");
  revalidatePath("/dashboard/quotes");
  return { success: "Created.", redirectTo: `/dashboard/quotes/${data.id}/edit` };
}

/** Replace all line items (atomic RPC). Body: JSON array from the builder. */
export async function saveQuoteLines(id: string, lines: unknown): Promise<FormState> {
  const ctx = await requirePermission("sales.write");
  const parsed = linesSchema.safeParse(lines);
  if (!parsed.success) return { error: "One or more lines are invalid. Check quantities and prices." };
  const { error } = await ctx.supabase.rpc("replace_quote_items", { p_quote_id: id, p_items: parsed.data as never });
  if (error) return dbError(error, "Couldn’t save the lines.");
  revalidatePath(`/dashboard/quotes/${id}`);
  revalidatePath(`/dashboard/quotes/${id}/edit`);
  return { success: "Lines saved." };
}

export async function sendQuote(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("sales.write");
  const p = parseForm(sendQuoteSchema, formData);
  if (!p.ok) return p.state;
  const quote = await getQuote(ctx, id);
  if (!quote) return { error: "Quote not found." };
  if (!["draft", "sent", "viewed"].includes(quote.status)) return { error: `This quote is ${quote.status} and can’t be sent.` };
  const { count } = await ctx.supabase.from("quote_items").select("id", { count: "exact", head: true }).eq("quote_id", id);
  if (!count) return { error: "Add at least one line before sending." };

  const url = `${publicEnv.NEXT_PUBLIC_SITE_URL}/q/${quote.public_token}`;
  const mail = quoteEmail({ number: quote.quote_number, revision: quote.revision, title: quote.title, clientName: (quote.clients as unknown as { name: string }).name, total: quote.total, expiry: quote.expiry_date, url, message: p.data.message || "" });
  const result = await sendMail({ ...mail, to: p.data.to, replyTo: ctx.user.email ?? undefined });
  if (!result.ok) return { error: "Email couldn’t be sent. Check RESEND_API_KEY is configured, or share the customer link directly." };

  const { error } = await ctx.supabase.from("quotes").update({ status: quote.status === "draft" ? "sent" : quote.status, sent_at: new Date().toISOString() }).eq("id", id);
  if (error) return dbError(error, "Sent, but couldn’t update the status.");
  if (quote.lead_id) await ctx.supabase.from("leads").update({ status: "quote_sent" }).eq("id", quote.lead_id).in("status", ["new", "contacted", "qualified", "site_survey", "quote_required"]);
  revalidatePath(`/dashboard/quotes/${id}`);
  return { success: `Sent to ${p.data.to}.` };
}

export async function markQuoteSent(id: string) {
  const ctx = await requirePermission("sales.write");
  await ctx.supabase.from("quotes").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  revalidatePath(`/dashboard/quotes/${id}`);
}

export async function markQuoteDecision(id: string, decision: "accepted" | "rejected") {
  const ctx = await requirePermission("sales.write");
  const now = new Date().toISOString();
  const { error } = await ctx.supabase.from("quotes").update(decision === "accepted" ? { status: "accepted", accepted_at: now, decision_name: ctx.user.email } : { status: "rejected", rejected_at: now, decision_name: ctx.user.email }).eq("id", id).in("status", ["sent", "viewed", "draft"]);
  if (!error) {
    const q = await getQuote(ctx, id);
    if (q?.lead_id) await ctx.supabase.from("leads").update({ status: decision === "accepted" ? "won" : "lost" }).eq("id", q.lead_id);
  }
  revalidatePath(`/dashboard/quotes/${id}`);
}

export async function createRevision(id: string) {
  const ctx = await requirePermission("sales.write");
  const { data, error } = await ctx.supabase.rpc("create_quote_revision", { p_quote_id: id });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/quotes");
  return { redirectTo: `/dashboard/quotes/${data}/edit` };
}

export async function duplicateQuote(id: string) {
  const ctx = await requirePermission("sales.write");
  const src = await getQuote(ctx, id);
  if (!src) return { error: "Not found" };
  const { data, error } = await ctx.supabase.from("quotes").insert({
    quote_number: "", organisation_id: ctx.organisation.id, created_by: ctx.user.id, title: `${src.title} (copy)`, client_id: src.client_id, contact_id: src.contact_id, project_id: src.project_id,
    discount_pct: src.discount_pct, scope_notes: src.scope_notes, terms: src.terms, internal_notes: src.internal_notes,
  }).select("id").single();
  if (error || !data) return { error: "Couldn’t duplicate." };
  const { data: items } = await ctx.supabase.from("quote_items").select("catalogue_item_id, description, category, quantity, unit, cost_price, sell_price, discount_pct, vat_rate, internal_notes").eq("quote_id", id).order("position");
  if (items?.length) await ctx.supabase.rpc("replace_quote_items", { p_quote_id: data.id, p_items: items as never });
  revalidatePath("/dashboard/quotes");
  return { redirectTo: `/dashboard/quotes/${data.id}/edit` };
}

export async function convertQuoteToProject(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("projects.write");
  const pm = nullable(String(formData.get("project_manager_id") ?? ""));
  const site = nullable(String(formData.get("site_id") ?? ""));
  const { data, error } = await ctx.supabase.rpc("convert_quote_to_project", { p_quote_id: id, p_project_manager: pm ?? undefined, p_site_id: site ?? undefined });
  if (error) return dbError(error, "Couldn’t convert the quote.");
  revalidatePath("/dashboard/projects");
  return { success: "Converted.", redirectTo: `/dashboard/projects/${data}` };
}

export async function createInvoiceFromQuote(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const kind = String(formData.get("kind") ?? "standard") as "standard" | "deposit" | "milestone" | "final";
  const percent = Number(formData.get("percent") ?? 100);
  const { data, error } = await ctx.supabase.rpc("create_invoice_from_quote", { p_quote_id: id, p_kind: kind, p_percent: percent });
  if (error) return dbError(error, "Couldn’t create the invoice.");
  revalidatePath("/dashboard/invoices");
  return { success: "Draft invoice created.", redirectTo: `/dashboard/invoices/${data}/edit` };
}

export async function archiveQuote(id: string) {
  const ctx = await requirePermission("sales.write");
  await ctx.supabase.from("quotes").update({ archived_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/quotes");
  return { redirectTo: "/dashboard/quotes" };
}

export async function expireQuotes() {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("quotes").update({ status: "expired" }).eq("organisation_id", ctx.organisation.id).in("status", ["sent", "viewed"]).lt("expiry_date", new Date().toISOString().slice(0, 10));
}
