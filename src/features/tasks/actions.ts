"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { taskSchema } from "./schema";

export async function saveTask(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(taskSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = { title: d.title, description: nullable(d.description), project_id: nullable(d.project_id), assignee_user_id: nullable(d.assignee_user_id), due_date: nullable(d.due_date), priority: d.priority, status: d.status };
  const res = id
    ? await ctx.supabase.from("tasks").update(row).eq("id", id)
    : await ctx.supabase.from("tasks").insert({ ...row, organisation_id: ctx.organisation.id, created_by: ctx.user.id });
  if (res.error) return { error: res.error.code === "42501" ? "You don’t have permission to do that." : "Couldn’t save the task." };
  revalidatePath("/dashboard/tasks");
  if (row.project_id) revalidatePath(`/dashboard/projects/${row.project_id}/tasks`);
  return { success: "Saved.", redirectTo: d.return_to || "/dashboard/tasks" };
}

export async function setTaskStatus(id: string, status: "todo" | "in_progress" | "blocked" | "complete", revalidate = "/dashboard/tasks") {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("tasks").update({ status }).eq("id", id);
  revalidatePath(revalidate);
  revalidatePath("/dashboard/tasks");
}

export async function deleteTask(id: string, revalidate = "/dashboard/tasks") {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("tasks").delete().eq("id", id);
  revalidatePath(revalidate);
  revalidatePath("/dashboard/tasks");
}
