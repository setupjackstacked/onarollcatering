import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Edge proxy (Next 16 name for middleware).
 * - Refreshes Supabase auth cookies.
 * - Optimistically gates /dashboard and /staff. Server layouts re-check with
 *   requireUser(); this is not the authorisation boundary — RLS is.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected =
    (pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/login") &&
      !pathname.startsWith("/dashboard/reset-password")) ||
    pathname.startsWith("/staff");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/staff/:path*"],
};
