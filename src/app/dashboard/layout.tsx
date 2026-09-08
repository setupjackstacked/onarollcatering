import { requireUser } from "@/lib/auth/session";

/** All /dashboard routes require an authenticated user (proxy.ts + this check). */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/dashboard");
  return <div className="surface-light min-h-dvh">{children}</div>;
}
