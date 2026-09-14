import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { PERMISSIONS, hasPermission, type Permission } from "@/lib/auth/permissions";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata = { robots: { index: false, follow: false } };

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner", administrator: "Administrator", finance: "Finance", project_manager: "Project Manager", staff: "Staff", read_only: "Read only",
};

/** All /dashboard routes: authenticated + org member (proxy.ts pre-check, this is the real one). */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrgContext();
  // Staff have no management permissions — their home is the mobile portal.
  if (ctx.role === "staff") redirect("/staff");
  const permissions = (Object.keys(PERMISSIONS) as Permission[]).filter((p) => hasPermission(ctx.role, p));
  const { count } = await ctx.supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.user.id)
    .is("read_at", null);

  return (
    <DashboardShell
      orgName={ctx.organisation.name}
      userEmail={ctx.user.email ?? ""}
      roleLabel={ROLE_LABEL[ctx.role] ?? ctx.role}
      permissions={permissions}
      unreadNotifications={count ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
