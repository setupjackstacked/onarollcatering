import { z } from "zod";
import { optionalText, requiredText, optionalUuid, optionalDate } from "@/lib/forms/fields";

export const TASK_STATUS_VALUES = ["todo", "in_progress", "blocked", "complete"] as const;
export const TASK_PRIORITY_VALUES = ["low", "medium", "high", "urgent"] as const;

export const taskSchema = z.object({
  title: requiredText(1, 200, "Enter a task title"),
  description: optionalText(5000),
  project_id: optionalUuid,
  assignee_user_id: optionalUuid,
  due_date: optionalDate,
  priority: z.enum(TASK_PRIORITY_VALUES).default("medium"),
  status: z.enum(TASK_STATUS_VALUES).default("todo"),
  return_to: z.string().startsWith("/dashboard").optional().or(z.literal("")),
});

export const TASK_STATUS_LABEL: Record<(typeof TASK_STATUS_VALUES)[number], string> = { todo: "To do", in_progress: "In progress", blocked: "Blocked", complete: "Complete" };
export const TASK_PRIORITY_LABEL: Record<(typeof TASK_PRIORITY_VALUES)[number], string> = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
