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
