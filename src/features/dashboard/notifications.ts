"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/context";

export async function markNotificationRead(id: string) {
  const { supabase, user } = await requireOrgContext();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard", "layout");
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await requireOrgContext();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  revalidatePath("/dashboard", "layout");
}
