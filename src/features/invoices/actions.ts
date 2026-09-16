"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requirePermission } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { invoiceHeaderSchema, invoiceLinesSchema, issueSchema, paymentSchema, sendInvoiceSchema } from "./schema";
import { getInvoice } from "./queries";
import { sendMail } from "@/lib/email/resend";
import { invoiceEmail } from "@/lib/email/documents";
import { publicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

function dbError(error: { code?: string; message: string }, fallback: string): FormState {
  if (error.code === "42501") return { error: "You don’t have permission to do that." };
  if (error.code === "23514") return { error: error.message.replace(/^[^:]*: /, "") };
  logger.error("db.error", { code: error.code, message: error.message });
  return { error: fallback };
}

export async function saveInvoiceHeader(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(invoiceHeaderSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = { title: d.title, kind: d.kind, client_id: d.client_id, contact_id: nullable(d.contact_id), project_id: nullable(d.project_id), reference: nullable(d.reference), discount_pct: d.discount_pct.toFixed(2), notes: nullable(d.notes), terms: nullable(d.terms), internal_notes: nullable(d.internal_notes) };
  if (id) {
    const inv = await getInvoice(ctx, id);
    if (!inv) return { error: "Not found." };
    const patch = inv.status === "draft" ? row : { internal_notes: row.internal_notes, reference: row.reference, contact_id: row.contact_id, project_id: row.project_id };
    const { error } = await ctx.supabase.from("invoices").update(patch).eq("id", id);
    if (error) return dbError(error, "Couldn’t save the invoice.");
    revalidatePath(`/dashboard/invoices/${id}`);
    return { success: "Saved." };
  }
  const { data, error } = await ctx.supabase.from("invoices").insert({ ...row, invoice_number: "", organisation_id: ctx.organisation.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return dbError(error ?? { message: "no row" }, "Couldn’t create the invoice.");
  revalidatePath("/dashboard/invoices");
  return { success: "Created.", redirectTo: `/dashboard/invoices/${data.id}/edit` };
}

export async function saveInvoiceLines(id: string, lines: unknown): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const parsed = invoiceLinesSchema.safeParse(lines);
  if (!parsed.success) return { error: "One or more lines are invalid." };
  const { error } = await ctx.supabase.rpc("replace_invoice_items", { p_invoice_id: id, p_items: parsed.data as never });
  if (error) return dbError(error, "Couldn’t save the lines.");
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath(`/dashboard/invoices/${id}/edit`);
  return { success: "Lines saved." };
}

export async function issueInvoice(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(issueSchema, formData);
  if (!p.ok) return p.state;
  const { data, error } = await ctx.supabase.rpc("issue_invoice", { p_invoice_id: id, p_issue_date: p.data.issue_date, p_due_date: nullable(p.data.due_date) ?? undefined });
  if (error) return dbError(error, "Couldn’t issue the invoice.");
  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  return { success: `Issued as ${data}.`, redirectTo: `/dashboard/invoices/${id}` };
}

export async function recordPayment(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(paymentSchema, formData);
  if (!p.ok) return p.state;
  const { error } = await ctx.supabase.from("payments").insert({ organisation_id: ctx.organisation.id, invoice_id: id, paid_on: p.data.paid_on, amount: p.data.amount, method: p.data.method, reference: nullable(p.data.reference), notes: nullable(p.data.notes), recorded_by: ctx.user.id });
  if (error) return dbError(error, "Couldn’t record the payment.");
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  return { success: "Payment recorded." };
}

export async function deletePayment(paymentId: string, invoiceId: string) {
  const ctx = await requirePermission("org.manage");
  await ctx.supabase.from("payments").delete().eq("id", paymentId);
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
}

export async function cancelInvoice(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) return { fieldErrors: { reason: ["Give a reason"] } };
  const { error } = await ctx.supabase.rpc("cancel_invoice", { p_invoice_id: id, p_reason: reason });
  if (error) return dbError(error, "Couldn’t cancel the invoice.");
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  return { success: "Cancelled." };
}

export async function createCreditNote(id: string) {
  const ctx = await requirePermission("finance.write");
  const { data, error } = await ctx.supabase.rpc("create_credit_note", { p_invoice_id: id });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/invoices");
  return { redirectTo: `/dashboard/invoices/${data}/edit` };
}

export async function sendInvoice(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(sendInvoiceSchema, formData);
  if (!p.ok) return p.state;
  const inv = await getInvoice(ctx, id);
  if (!inv) return { error: "Not found." };
  if (inv.status === "draft") return { error: "Issue the invoice before sending it." };
  const url = `${publicEnv.NEXT_PUBLIC_SITE_URL}/i/${inv.public_token}`;
  const mail = invoiceEmail({ number: inv.invoice_number, title: inv.title, total: inv.total, due: inv.due_date, url, message: p.data.message ?? "", isCredit: inv.kind === "credit_note" });
  const r = await sendMail({ ...mail, to: p.data.to, replyTo: ctx.user.email ?? undefined });
  if (!r.ok) return { error: "Email couldn’t be sent. Check RESEND_API_KEY, or share the customer link directly." };
  await ctx.supabase.from("invoices").update({ sent_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/dashboard/invoices/${id}`);
  return { success: `Sent to ${p.data.to}.` };
}

export async function refreshOverdue() {
  const ctx = await requireOrgContext();
  if (!ctx.can("finance.read")) return;
  await ctx.supabase.rpc("refresh_overdue_invoices", { p_org: ctx.organisation.id });
}

export async function archiveInvoice(id: string) {
  const ctx = await requirePermission("finance.write");
  const inv = await getInvoice(ctx, id);
  if (!inv || inv.status !== "draft") return { error: "Only drafts can be archived — cancel or credit issued invoices." };
  await ctx.supabase.from("invoices").update({ archived_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/invoices");
  return { redirectTo: "/dashboard/invoices" };
}

// ---------- approval workflow -------------------------------------------------

/** Moves the invoice along the client's approval chain. */
export async function setStage(id: string, stage: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const note = String(formData.get("note") ?? "").trim();
  const { error } = await ctx.supabase.rpc("set_invoice_stage", {
    p_invoice_id: id, p_stage: stage as never, p_note: note || undefined,
  });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  return { success: "Updated." };
}

/** Same move, without asking for a note — for the one-click next step. */
export async function advanceStage(id: string, stage: string) {
  const ctx = await requirePermission("finance.write");
  const { error } = await ctx.supabase.rpc("set_invoice_stage", { p_invoice_id: id, p_stage: stage as never });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
}

export async function addCaseNote(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const note = String(formData.get("note") ?? "").trim();
  if (note.length < 2) return { fieldErrors: { note: ["Write a note first"] } };
  const { error } = await ctx.supabase.rpc("add_invoice_note", { p_invoice_id: id, p_note: note });
  if (error) return { error: "Couldn’t add the note." };
  revalidatePath(`/dashboard/invoices/${id}`);
  return { success: "Note added." };
}

export async function assignInvoice(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const userId = String(formData.get("assigned_to") ?? "");
  const siteId = String(formData.get("site_id") ?? "");
  const reference = String(formData.get("client_reference") ?? "").trim();
  const { error } = await ctx.supabase.from("invoices").update({
    assigned_to: userId || null, site_id: siteId || null, client_reference: reference || null,
  }).eq("id", id);
  if (error) return { error: "Couldn’t update the case." };
  revalidatePath(`/dashboard/invoices/${id}`);
  return { success: "Saved." };
}
