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

  const publicAuthRoutes = ["/dashboard/login", "/dashboard/forgot-password", "/dashboard/reset-password", "/dashboard/auth/"];
  const isProtected =
    (pathname.startsWith("/dashboard") && !publicAuthRoutes.some((r) => pathname.startsWith(r))) ||
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
