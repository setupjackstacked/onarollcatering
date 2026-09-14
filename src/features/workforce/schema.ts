import { z } from "zod";
import { optionalText, requiredText, optionalUuid, optionalEmail, optionalDate, optionalMoney } from "@/lib/forms/fields";

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full time" }, { value: "part_time", label: "Part time" }, { value: "casual", label: "Casual" }, { value: "contractor", label: "Contractor" }, { value: "agency", label: "Agency" },
];
export const EMPLOYEE_STATUSES = [
  { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "on_leave", label: "On leave" }, { value: "former", label: "Former" },
];
export const SHIFT_STATUSES = [
  { value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" },
];
export const TIMESHEET_STATUSES = [
  { value: "draft", label: "Draft" }, { value: "submitted", label: "Submitted" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }, { value: "paid", label: "Paid" },
];
export const LEAVE_TYPES = [
  { value: "holiday", label: "Holiday" }, { value: "sick", label: "Sick" }, { value: "unpaid", label: "Unpaid" }, { value: "other", label: "Other" },
];
export const LEAVE_STATUSES = [
  { value: "requested", label: "Requested" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }, { value: "cancelled", label: "Cancelled" },
];
export const VERIFICATIONS = [
  { value: "unverified", label: "Unverified" }, { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }, { value: "expired", label: "Expired" },
];

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Enter a time like 08:00");

export const employeeSchema = z.object({
  first_name: requiredText(1, 80, "Enter a first name"),
  last_name: requiredText(1, 80, "Enter a last name"),
  email: optionalEmail,
  phone: optionalText(40),
  address_line1: optionalText(120),
  address_city: optionalText(80),
  address_postcode: optionalText(12),
  emergency_name: optionalText(120),
  emergency_relationship: optionalText(60),
  emergency_phone: optionalText(40),
  role_key: z.string().min(1).max(60),
  employment_type: z.enum(["full_time", "part_time", "casual", "contractor", "agency"]),
  start_date: optionalDate,
  end_date: optionalDate,
  hourly_rate: optionalMoney,
  salary: optionalMoney,
  status: z.enum(["active", "inactive", "on_leave", "former"]).default("active"),
  notes: optionalText(4000),
});

export const shiftSchema = z.object({
  employee_id: z.string().uuid("Select an employee"),
  project_id: optionalUuid,
  site_id: optionalUuid,
  shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  start_time: time,
  end_time: time,
  break_minutes: z.coerce.number().int().min(0).max(599).default(0),
  role_key: optionalText(60),
  status: z.enum(["draft", "published", "completed", "cancelled"]).default("draft"),
  notes: optionalText(1000),
});

export const timesheetSchema = z.object({
  employee_id: z.string().uuid("Select an employee"),
  project_id: optionalUuid,
  site_id: optionalUuid,
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  start_time: time,
  end_time: time,
  break_minutes: z.coerce.number().int().min(0).max(599).default(0),
  overtime_hours: z.coerce.number().min(0).max(24).default(0),
  notes: optionalText(1000),
});

export const leaveSchema = z.object({
  employee_id: z.string().uuid("Select an employee"),
  leave_type: z.enum(["holiday", "sick", "unpaid", "other"]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  days: z.coerce.number().min(0.5).max(365),
  reason: optionalText(1000),
});

/** Hours worked, mirroring the SQL generated column (handles shifts past midnight). */
export function shiftHours(start: string, end: string, breakMinutes: number) {
  const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  let m = mins(end) - mins(start);
  if (m <= 0) m += 24 * 60;
  return Math.round((m - breakMinutes) / 0.6) / 100;
}
