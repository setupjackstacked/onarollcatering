"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";

export async function convertEnquiry(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("sales.write");
  const p = parseForm(z.object({ assignee: z.string().uuid().optional().or(z.literal("")) }), formData);
  if (!p.ok) return p.state;
  const { data, error } = await ctx.supabase.rpc("convert_enquiry_to_lead", { p_enquiry_id: id, p_assignee: nullable(p.data.assignee) ?? undefined });
  if (error) return { error: error.code === "42501" ? "You don’t have permission to do that." : "Couldn’t convert the enquiry." };
  revalidatePath("/dashboard/enquiries");
  revalidatePath("/dashboard/leads");
  return { success: "Converted.", redirectTo: `/dashboard/leads/${data}` };
}

export async function setEnquiryStatus(id: string, status: "new" | "reviewed" | "spam" | "archived") {
  const ctx = await requirePermission("sales.write");
  await ctx.supabase.from("enquiries").update({ status }).eq("id", id);
  revalidatePath("/dashboard/enquiries");
  revalidatePath(`/dashboard/enquiries/${id}`);
}
