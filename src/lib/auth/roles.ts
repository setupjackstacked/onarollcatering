import type { OrganisationRole } from "@/lib/supabase/types";

/**
 * The business thinks in three roles — Admin, Manager, Staff. The database keeps
 * six, because Finance and Read only are real distinctions the invoice and
 * reporting modules depend on, and removing enum values would mean rewriting
 * every RLS policy. This module is the single place the two vocabularies meet.
 */
export type RoleGroup = "admin" | "manager" | "staff" | "other";

export const ROLE_GROUP: Record<OrganisationRole, RoleGroup> = {
  owner: "admin",
  administrator: "admin",
  project_manager: "manager",
  staff: "staff",
  finance: "other",
  read_only: "other",
};

export const ROLE_LABEL: Record<OrganisationRole, string> = {
  owner: "Admin (owner)",
  administrator: "Admin",
  project_manager: "Manager",
  staff: "Staff",
  finance: "Finance",
  read_only: "Read only",
};

export const ROLE_DESCRIPTION: Record<OrganisationRole, string> = {
  owner: "Everything, including removing other admins.",
  administrator: "Everything across every site. Amy’s role.",
  project_manager: "The sites and projects they are assigned to — their team’s hours, leave and vouchers.",
  staff: "The mobile portal only: their own shifts, hours, leave, vouchers and documents.",
  finance: "Quotes, invoices, payments, costs, payroll and reports across every site.",
  read_only: "Can look at everything they are shown, but change nothing.",
};

/** The three roles offered when inviting someone. Finance and Read only stay
 *  available for existing members but are not pushed at whoever is inviting. */
export const PRIMARY_ROLES: OrganisationRole[] = ["administrator", "project_manager", "staff"];
export const SECONDARY_ROLES: OrganisationRole[] = ["finance", "read_only"];

export const roleLabel = (role: string) => ROLE_LABEL[role as OrganisationRole] ?? role;
export const roleGroup = (role: string): RoleGroup => ROLE_GROUP[role as OrganisationRole] ?? "other";

/**
 * What system role a job title probably needs. This only pre-selects the
 * dropdown when inviting someone — whoever sends the invitation decides, and
 * anything not listed here defaults to Staff, which is the safe answer.
 */
const JOB_ROLE_SUGGESTION: Record<string, OrganisationRole> = {
  "managing-director": "administrator",
  "hr-finance-bp": "administrator",
  administrator: "administrator",
  "accounts-coordinator": "finance",
  "foh-manager": "project_manager",
  "foh-supervisor": "project_manager",
  "catering-manager": "project_manager",
  "catering-supervisor": "project_manager",
  "project-manager": "project_manager",
};

export function suggestedRoleForJob(roleKey: string | null | undefined): OrganisationRole {
  return (roleKey && JOB_ROLE_SUGGESTION[roleKey]) || "staff";
}

/** A site roster entry is either manager or staff; admins and managers manage. */
export function siteRoleFor(role: OrganisationRole): "manager" | "staff" {
  return role === "owner" || role === "administrator" || role === "project_manager" ? "manager" : "staff";
}
