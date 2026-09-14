/**
 * Status vocabularies. Values match the Postgres enums in supabase/migrations.
 * Labels are the UI wording from the master spec. Keep both in sync.
 */
import type { LeadStatus, ProjectStatus, EnquiryStatus } from "@/lib/supabase/types";

export type StatusTone = "grey" | "blue" | "amber" | "green" | "red" | "copper";

export const LEAD_STATUSES: { value: LeadStatus; label: string; tone: StatusTone }[] = [
  { value: "new", label: "New", tone: "grey" },
  { value: "contacted", label: "Contacted", tone: "blue" },
  { value: "qualified", label: "Qualified", tone: "blue" },
  { value: "site_survey", label: "Site Survey", tone: "blue" },
  { value: "quote_required", label: "Quote Required", tone: "amber" },
  { value: "quote_sent", label: "Quote Sent", tone: "amber" },
  { value: "negotiation", label: "Negotiation", tone: "amber" },
  { value: "won", label: "Won", tone: "green" },
  { value: "lost", label: "Lost", tone: "red" },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; tone: StatusTone }[] = [
  { value: "lead", label: "Lead", tone: "grey" },
  { value: "quoted", label: "Quoted", tone: "amber" },
  { value: "approved", label: "Approved", tone: "green" },
  { value: "planning", label: "Planning", tone: "blue" },
  { value: "mobilisation", label: "Mobilisation", tone: "blue" },
  { value: "procurement", label: "Procurement", tone: "blue" },
  { value: "installation", label: "Installation", tone: "blue" },
  { value: "operational", label: "Operational", tone: "green" },
  { value: "on_hold", label: "On Hold", tone: "amber" },
  { value: "completed", label: "Completed", tone: "green" },
  { value: "cancelled", label: "Cancelled", tone: "red" },
];

export const ENQUIRY_STATUSES: { value: EnquiryStatus; label: string; tone: StatusTone }[] = [
  { value: "new", label: "New", tone: "copper" },
  { value: "reviewed", label: "Reviewed", tone: "blue" },
  { value: "converted", label: "Converted", tone: "green" },
  { value: "spam", label: "Spam", tone: "grey" },
  { value: "archived", label: "Archived", tone: "grey" },
];

export const OPEN_LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "site_survey", "quote_required", "quote_sent", "negotiation"];
export const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = ["approved", "planning", "mobilisation", "procurement", "installation", "operational"];

export function statusLabel<T extends string>(list: { value: T; label: string }[], value: T) {
  return list.find((s) => s.value === value)?.label ?? value;
}
