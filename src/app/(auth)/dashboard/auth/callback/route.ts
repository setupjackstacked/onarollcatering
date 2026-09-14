import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation/auth";
import { logger } from "@/lib/logger";

/**
 * PKCE callback for password-reset (and future magic-link / invite) emails.
 * Exchanges the one-time code for a session cookie, then redirects.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    logger.warn("auth.callback_failed", { reason: error.message });
  }
  const login = new URL("/dashboard/login", url.origin);
  login.searchParams.set("error", "link");
  return NextResponse.redirect(login);
}
