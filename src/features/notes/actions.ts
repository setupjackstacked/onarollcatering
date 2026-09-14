"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgContext } from "@/lib/auth/context";
import { parseForm, type FormState } from "@/lib/forms";

const schema = z.object({
  entityType: z.string().min(1).max(40),
  entityId: z.string().uuid(),
  revalidate: z.string().startsWith("/dashboard"),
  body: z.string().trim().min(1, "Write something first").max(10000),
});

export async function addNote(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(schema, formData);
  if (!p.ok) return p.state;
  const { error } = await ctx.supabase.from("notes").insert({
    organisation_id: ctx.organisation.id,
    entity_type: p.data.entityType,
    entity_id: p.data.entityId,
    body: p.data.body,
    created_by: ctx.user.id,
  });
  if (error) return { error: "Couldn’t save the note." };
  revalidatePath(p.data.revalidate);
  return { success: "Note added." };
}

export async function deleteNote(id: string, revalidate: string) {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("notes").delete().eq("id", id);
  revalidatePath(revalidate);
}
