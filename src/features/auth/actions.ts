"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema, safeNext } from "@/lib/validation/auth";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: string;
};

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const NOT_CONFIGURED: AuthFormState = { error: "Sign-in isn't available in this environment yet." };

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  if (!rateLimit(`login:${await ip()}`, 10, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    logger.warn("auth.login_failed", { email: parsed.data.email, reason: error.code ?? error.message });
    return { error: "Incorrect email or password." };
  }
  logger.info("auth.login", { email: parsed.data.email });
  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/dashboard/login");
}

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  if (!rateLimit(`reset:${await ip()}`, 5, 60 * 60 * 1000)) {
    return { error: "Too many requests. Please try again later." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/dashboard/auth/callback?next=/dashboard/reset-password`,
  });
  if (error) logger.warn("auth.reset_request_failed", { reason: error.message });
  // Always the same response — never reveal whether an account exists.
  return { success: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logger.warn("auth.password_update_failed", { reason: error.message });
    return { error: error.message.includes("different") ? "Choose a password you haven't used before." : "Couldn't update the password. Try again." };
  }
  logger.info("auth.password_updated", { userId: user.id });
  redirect("/dashboard");
}
