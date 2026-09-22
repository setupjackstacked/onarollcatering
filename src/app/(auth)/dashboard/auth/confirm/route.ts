import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation/auth";
import { logger } from "@/lib/logger";

const TYPES: EmailOtpType[] = ["invite", "recovery", "magiclink", "signup", "email_change"];

/**
 * Verifies an emailed one-time token and starts the session.
 *
 * This exists alongside /dashboard/auth/callback because the two links are not
 * the same thing. A link the *user* asked for (forgot password, from their own
 * browser) carries a PKCE code and a verifier cookie, and the callback route
 * exchanges it. A link generated *server-side* on someone's behalf — inviting
 * an employee, an admin resending a password link — has no verifier cookie,
 * because the browser that opens it was never the browser that asked. Handing
 * that to exchangeCodeForSession fails.
 *
 * So those links point here instead, carrying the hashed token from
 * generateLink, and verifyOtp turns it into a session. Same destination, and
 * the token is still one-time and short-lived.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next"));

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    logger.warn("auth.confirm_failed", { reason: error.message, type });
  }

  const login = new URL("/dashboard/login", url.origin);
  login.searchParams.set("error", "link");
  return NextResponse.redirect(login);
}
