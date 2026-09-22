import type { OrganisationRole } from "@/lib/supabase/types";

/**
 * Central permission map. Server code and RLS policies must agree with this.
 *
 * `project_manager` is the database role behind the label "Manager", and a
 * Manager here runs a kitchen: their site's staffing, vouchers, takings and
 * reports. They are deliberately NOT given sales.* or projects.*, because the
 * sales pipeline and fit-out contracts are not their job and showing them
 * Leads, Quotes and Clients was both noise and an information leak.
 *
 * If a dedicated fit-out project manager is ever hired, give them Admin or add
 * a role — do not widen this one back out.
 */
export const PERMISSIONS = {
  "org.manage": ["owner", "administrator"],
  "members.invite": ["owner", "administrator"],
  "sales.read": ["owner", "administrator", "finance", "read_only"],
  "sales.write": ["owner", "administrator", "finance"],
  // Fit-out contracts. A site manager runs a kitchen, which is a site, not a
  // project — see sites.* below.
  "projects.read": ["owner", "administrator", "finance", "read_only"],
  "projects.write": ["owner", "administrator"],
  // Running a kitchen: the site itself, its vouchers and its daily takings.
  "sites.read": ["owner", "administrator", "finance", "project_manager", "read_only"],
  "sites.write": ["owner", "administrator", "project_manager"],
  // The kitchen's own trading position. Not the client invoicing in finance.*,
  // and never visible to staff.
  "trading.read": ["owner", "administrator", "finance", "project_manager", "read_only"],
  "trading.write": ["owner", "administrator", "finance", "project_manager"],
  "finance.read": ["owner", "administrator", "finance", "read_only"],
  "finance.write": ["owner", "administrator", "finance"],
  "workforce.read": ["owner", "administrator", "project_manager", "read_only"],
  "workforce.write": ["owner", "administrator"],
  "reports.read": ["owner", "administrator", "finance", "project_manager", "read_only"],
} as const satisfies Record<string, readonly OrganisationRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: OrganisationRole | null | undefined, permission: Permission) {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly OrganisationRole[]).includes(role);
}

export function assertPermission(role: OrganisationRole | null | undefined, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new PermissionError(permission);
  }
}

export class PermissionError extends Error {
  constructor(public readonly permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "PermissionError";
  }
}
