"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/context";
import { parseForm, type FormState } from "@/lib/forms";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { sendMail } from "@/lib/email/resend";
import { payrollReportEmail } from "@/lib/email/templates";
import { renderPayrollReport, payrollFileName, type PayrollRow, type PayrollUnapproved, type PayrollPeriod } from "@/lib/pdf/payroll-pdf";
import { logger } from "@/lib/logger";

const BUCKET = "invoice-documents";

/** Everything the report needs, fetched under the caller's own permissions. */
async function loadPeriod(ctx: Awaited<ReturnType<typeof requirePermission>>, periodId: string) {
  const [{ data: period }, { data: rows }, { data: unapproved }] = await Promise.all([
    ctx.supabase.from("pay_periods").select("id, name, start_date, end_date, pay_date, status").eq("id", periodId).maybeSingle(),
    ctx.supabase.rpc("payroll_report", { p_period_id: periodId }),
    ctx.supabase.rpc("payroll_unapproved", { p_period_id: periodId }),
  ]);
  return {
    period: period as PayrollPeriod & { id: string } | null,
    rows: (rows ?? []) as unknown as PayrollRow[],
    unapproved: (unapproved ?? []) as unknown as PayrollUnapproved[],
  };
}

const totalsOf = (rows: PayrollRow[]) => ({
  hours: rows.reduce((a, r) => a + Number(r.standard_hours) + Number(r.overtime_hours), 0),
  gross: rows.reduce((a, r) => a + Number(r.gross_pay), 0),
});

/**
 * Builds the PDF for a pay period and hands it back as bytes.
 * Shared by the download route and the send action, so what you preview is
 * byte-for-byte what the payroll company receives.
 */
export async function buildPayrollPdf(periodId: string) {
  const ctx = await requirePermission("finance.read");
  const { period, rows, unapproved } = await loadPeriod(ctx, periodId);
  if (!period) return null;
  const bytes = await renderPayrollReport({
    period,
    rows,
    unapproved,
    organisationName: ctx.organisation.name,
    generatedBy: ctx.user.email ?? "the dashboard",
  });
  return { bytes, period, rows, unapproved, fileName: payrollFileName(period) };
}

const sendSchema = z.object({
  recipients: z.array(z.string().email()).min(1, "Choose at least one recipient"),
  note: z.string().trim().max(500).optional(),
});

/**
 * Sends the period to the saved payroll recipients with the PDF attached.
 *
 * Finance-level only — pay data leaving the building is not a manager's call.
 * The report is stored alongside the record of the send, so "what exactly did
 * the bureau get on the 12th" has an answer that is the actual file.
 *
 * Unapproved hours do not block the send. They are excluded from the figures,
 * stated on the face of the report, and counted on the record, so the decision
 * to send a week with gaps is a deliberate one rather than an accident.
 */
export async function sendPayrollReport(periodId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(sendSchema, formData);
  if (!p.ok) return p.state;

  const { RESEND_API_KEY } = serverEnv();
  if (!RESEND_API_KEY) return { error: "Email isn’t configured. Set it up in Settings → Email first." };

  // The recipients must be ones saved on this organisation — an address posted
  // into the form that isn't on the list is not sent to.
  const { data: saved } = await ctx.supabase
    .from("payroll_recipients")
    .select("email, name")
    .eq("organisation_id", ctx.organisation.id)
    .eq("active", true);
  const allowed = new Map((saved ?? []).map((r) => [r.email.toLowerCase(), r.name]));
  const recipients = p.data.recipients.filter((e) => allowed.has(e.toLowerCase()));
  if (!recipients.length) return { error: "None of those recipients are saved. Add them in Settings first." };

  const built = await buildPayrollPdf(periodId);
  if (!built) return { error: "That pay period no longer exists." };
  const { bytes, period, rows, unapproved, fileName } = built;
  if (!rows.length) return { error: "There is nothing in this period yet. Build it first." };

  const totals = totalsOf(rows);
  const mail = payrollReportEmail({
    organisationName: ctx.organisation.name,
    periodName: period.name,
    from: period.start_date,
    to: period.end_date,
    payDate: period.pay_date,
    employees: rows.length,
    hours: totals.hours,
    gross: totals.gross,
    unapprovedSheets: unapproved.reduce((a, u) => a + Number(u.sheets), 0),
    unapprovedHours: unapproved.reduce((a, u) => a + Number(u.hours), 0),
    note: p.data.note || null,
    sentBy: ctx.user.email ?? "",
  });

  const sent = await sendMail({
    to: recipients,
    ...mail,
    attachments: [{ filename: fileName, content: Buffer.from(bytes), contentType: "application/pdf" }],
  });
  if (!sent.ok) return { error: "The report couldn’t be emailed. Check Settings → Email, then try again." };

  // Keep a copy of exactly what went out. A failure here must not make the
  // send look like it didn't happen — it did, the email is gone.
  const path = `${ctx.organisation.id}/payroll/${periodId}/${Date.now()}-${fileName}`;
  let storagePath: string | null = null;
  try {
    const admin = createSupabaseAdminClient();
    const upload = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (upload.error) logger.error("payroll.store_failed", { message: upload.error.message });
    else storagePath = path;
  } catch (error) {
    logger.error("payroll.store_threw", { message: error instanceof Error ? error.message : "unknown" });
  }

  const { error } = await ctx.supabase.rpc("record_payroll_send", {
    p_period_id: periodId,
    p_recipients: recipients,
    p_storage_path: storagePath as string,
    p_file_name: fileName,
    p_size_bytes: bytes.byteLength,
    p_employee_count: rows.length,
    p_total_hours: totals.hours.toFixed(2),
    p_total_gross: totals.gross.toFixed(2),
    p_unapproved: unapproved.reduce((a, u) => a + Number(u.sheets), 0),
    p_note: p.data.note || undefined,
  });
  if (error) {
    logger.error("payroll.record_failed", { code: error.code, message: error.message });
    return { error: "The report was emailed, but recording the send failed. Tell your administrator." };
  }

  logger.info("payroll.sent", { periodId, recipients: recipients.length });
  revalidatePath(`/dashboard/payroll/${periodId}`);
  return { success: `Sent to ${recipients.join(", ")}.` };
}

const recipientSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  role_note: z.string().trim().max(120).optional(),
});

export async function savePayrollRecipient(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(recipientSchema, formData);
  if (!p.ok) return p.state;
  const { error } = await ctx.supabase.from("payroll_recipients").upsert(
    {
      organisation_id: ctx.organisation.id,
      name: p.data.name,
      email: p.data.email,
      role_note: p.data.role_note || null,
      active: true,
      created_by: ctx.user.id,
    },
    { onConflict: "organisation_id,email" },
  );
  if (error) {
    logger.error("payroll.recipient_failed", { code: error.code });
    return { error: error.code === "42501" ? "You don’t have permission to do that." : "Couldn’t save the recipient." };
  }
  revalidatePath("/dashboard/settings/payroll");
  return { success: `${p.data.name} will receive payroll reports.` };
}

/** Deactivates rather than deletes — the send history still refers to them. */
export async function removePayrollRecipient(id: string) {
  const ctx = await requirePermission("finance.write");
  await ctx.supabase.from("payroll_recipients").update({ active: false }).eq("id", id);
  revalidatePath("/dashboard/settings/payroll");
}
