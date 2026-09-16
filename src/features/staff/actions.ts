"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "./queries";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { timesheetSchema, leaveSchema } from "@/features/workforce/schema";
import { z } from "zod";

/** Staff-side timesheet entry: the employee is always the signed-in person. */
export async function submitMyHours(_: FormState, formData: FormData): Promise<FormState> {
  const { ctx, employee } = await requireStaff();
  const p = parseForm(timesheetSchema.omit({ employee_id: true }), formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const submit = String(formData.get("submit_now") ?? "") === "true";
  const shiftId = nullable(String(formData.get("shift_id") ?? ""));
  const { data, error } = await ctx.supabase.from("timesheets").insert({
    organisation_id: ctx.organisation.id, employee_id: employee.id, shift_id: shiftId,
    project_id: nullable(d.project_id), site_id: nullable(d.site_id), work_date: d.work_date,
    start_time: d.start_time, end_time: d.end_time, break_minutes: d.break_minutes,
    overtime_hours: d.overtime_hours.toFixed(2), notes: nullable(d.notes), created_by: ctx.user.id,
  }).select("id").single();
  if (error || !data) {
    if (error?.code === "23505") return { error: "You’ve already logged hours starting at that time on that date." };
    return { error: "Couldn’t save your hours. Please try again." };
  }
  if (submit) await ctx.supabase.from("timesheets").update({ status: "submitted" }).eq("id", data.id);
  revalidatePath("/staff/timesheets"); revalidatePath("/staff");
  return { success: submit ? "Sent for approval." : "Saved as a draft.", redirectTo: "/staff/timesheets" };
}

export async function submitTimesheet(id: string) {
  const { ctx, employee } = await requireStaff();
  await ctx.supabase.from("timesheets").update({ status: "submitted" }).eq("id", id).eq("employee_id", employee.id).in("status", ["draft", "rejected"]);
  revalidatePath("/staff/timesheets");
}

export async function deleteMyTimesheet(id: string) {
  const { ctx, employee } = await requireStaff();
  await ctx.supabase.from("timesheets").delete().eq("id", id).eq("employee_id", employee.id).eq("status", "draft");
  revalidatePath("/staff/timesheets");
}

export async function requestMyLeave(_: FormState, formData: FormData): Promise<FormState> {
  const { ctx, employee } = await requireStaff();
  const p = parseForm(leaveSchema.omit({ employee_id: true }), formData);
  if (!p.ok) return p.state;
  const d = p.data;
  if (d.end_date < d.start_date) return { fieldErrors: { end_date: ["End date is before the start date"] } };
  const { error } = await ctx.supabase.from("leave_requests").insert({
    organisation_id: ctx.organisation.id, employee_id: employee.id, leave_type: d.leave_type,
    start_date: d.start_date, end_date: d.end_date, days: d.days.toFixed(2), reason: nullable(d.reason),
  });
  if (error) return { error: "Couldn’t send your request. Please try again." };
  revalidatePath("/staff/leave"); revalidatePath("/staff");
  return { success: "Request sent to your manager.", redirectTo: "/staff/leave" };
}

export async function cancelMyLeave(id: string) {
  const { ctx, employee } = await requireStaff();
  await ctx.supabase.from("leave_requests").update({ status: "cancelled" }).eq("id", id).eq("employee_id", employee.id).eq("status", "requested");
  revalidatePath("/staff/leave");
}

const contactSchema = z.object({
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  emergency_name: z.string().trim().max(120).optional().or(z.literal("")),
  emergency_relationship: z.string().trim().max(60).optional().or(z.literal("")),
  emergency_phone: z.string().trim().max(40).optional().or(z.literal("")),
});

/** Staff may correct their own phone and emergency contact; pay and role are read-only. */
export async function updateMyContactDetails(_: FormState, formData: FormData): Promise<FormState> {
  const { ctx, employee } = await requireStaff();
  const p = parseForm(contactSchema, formData);
  if (!p.ok) return p.state;
  const { error } = await ctx.supabase.from("employees").update({
    phone: nullable(p.data.phone),
    emergency_contact: { name: p.data.emergency_name || null, relationship: p.data.emergency_relationship || null, phone: p.data.emergency_phone || null },
  }).eq("id", employee.id);
  if (error) return { error: "Couldn’t save your details — ask your manager to update them." };
  revalidatePath("/staff/profile");
  return { success: "Saved." };
}

const sickSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

/** Sick absences are reported, not requested — they are recorded immediately. */
export async function reportSickness(_: FormState, formData: FormData): Promise<FormState> {
  const { ctx, employee } = await requireStaff();
  const p = parseForm(sickSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  if (d.end_date < d.start_date) return { fieldErrors: { end_date: ["That's before the first day off"] } };
  const days = workingDaysBetween(d.start_date, d.end_date);
  const { data, error } = await ctx.supabase.from("leave_requests").insert({
    organisation_id: ctx.organisation.id, employee_id: employee.id, leave_type: "sick",
    start_date: d.start_date, end_date: d.end_date, days: days.toFixed(2), reason: nullable(d.reason),
  }).select("id").single();
  if (error || !data) return { error: "Couldn’t record your absence. Please try again." };
  revalidatePath("/staff/leave"); revalidatePath("/staff");
  return { success: "Recorded. Please upload your doctor’s note when you have it.", redirectTo: "/staff/leave" };
}

export async function attachSickNote(leaveId: string, documentId: string) {
  const { ctx } = await requireStaff();
  const { error } = await ctx.supabase.rpc("attach_leave_document", { p_leave_id: leaveId, p_document_id: documentId });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  revalidatePath("/staff/leave"); revalidatePath("/staff");
}

/** Mon–Fri between two ISO dates, inclusive. Bank holidays are not modelled. */
function workingDaysBetween(from: string, to: string) {
  let n = 0;
  for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) n++;
  }
  return n || 1;
}
