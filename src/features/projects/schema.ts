import { z } from "zod";
import { optionalText, requiredText, optionalUuid, optionalDate, optionalMoney } from "@/lib/forms/fields";

export const PROJECT_STATUS_VALUES = ["lead", "quoted", "approved", "planning", "mobilisation", "procurement", "installation", "operational", "on_hold", "completed", "cancelled"] as const;

export const projectSchema = z
  .object({
    name: requiredText(2, 160, "Enter a project name"),
    description: optionalText(5000),
    status: z.enum(PROJECT_STATUS_VALUES).default("approved"),
    client_id: z.string().uuid("Select a client"),
    site_id: optionalUuid,
    lead_id: optionalUuid,
    project_manager_id: optionalUuid,
    start_date: optionalDate,
    end_date: optionalDate,
    contract_value: optionalMoney,
    estimated_cost: optionalMoney,
    service_keys: z.array(z.string().max(60)).default([]),
    notes: optionalText(10000),
  })
  .refine((d) => !d.start_date || !d.end_date || d.end_date >= d.start_date, { path: ["end_date"], message: "End date must be after the start date" });

export const projectStatusSchema = z.object({ status: z.enum(PROJECT_STATUS_VALUES) });
