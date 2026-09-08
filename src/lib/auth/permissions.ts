import type { OrganisationRole } from "@/lib/supabase/types";

/**
 * Central permission map. Server code and RLS policies must agree with this.
 * Phase 0 defines the vocabulary; modules add checks as they are built.
 */
export const PERMISSIONS = {
  "org.manage": ["owner", "administrator"],
  "members.invite": ["owner", "administrator"],
  "sales.read": ["owner", "administrator", "finance", "project_manager", "read_only"],
  "sales.write": ["owner", "administrator", "finance"],
  "projects.read": ["owner", "administrator", "finance", "project_manager", "read_only"],
  "projects.write": ["owner", "administrator", "project_manager"],
  "finance.read": ["owner", "administrator", "finance", "read_only"],
  "finance.write": ["owner", "administrator", "finance"],
  "workforce.read": ["owner", "administrator", "project_manager", "read_only"],
  "workforce.write": ["owner", "administrator"],
  "reports.read": ["owner", "administrator", "finance", "read_only"],
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
