import { z } from "zod";
import { optionalText, requiredText, optionalEmail, optionalUuid, optionalDate, optionalMoney } from "@/lib/forms/fields";

export const LEAD_STATUS_VALUES = ["new", "contacted", "qualified", "site_survey", "quote_required", "quote_sent", "negotiation", "won", "lost"] as const;

export const leadSchema = z.object({
  title: requiredText(2, 200, "Give the lead a title"),
  status: z.enum(LEAD_STATUS_VALUES).default("new"),
  client_id: optionalUuid,
  contact_id: optionalUuid,
  company_name: optionalText(160),
  contact_name: optionalText(120),
  contact_email: optionalEmail,
  contact_phone: optionalText(40),
  source_key: requiredText(1, 40, "Select a source"),
  service_keys: z.array(z.string().max(60)).default([]),
  estimated_value: optionalMoney,
  project_location: optionalText(200),
  expected_start_date: optionalDate,
  assigned_user_id: optionalUuid,
  notes: optionalText(10000),
  lost_reason: optionalText(500),
});

export const leadStatusSchema = z.object({
  status: z.enum(LEAD_STATUS_VALUES),
  lost_reason: optionalText(500),
});

export const convertLeadSchema = z.object({
  name: requiredText(2, 160, "Enter a project name"),
  site_id: optionalUuid,
  project_manager_id: optionalUuid,
  contract_value: optionalMoney,
  start_date: optionalDate,
});
