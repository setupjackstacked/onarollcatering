import { z } from "zod";
import { optionalText, requiredText, optionalDate, money } from "@/lib/forms/fields";

export const PAY_PERIOD_STATUSES = [
  { value: "draft", label: "Draft" }, { value: "review", label: "In review" }, { value: "finalised", label: "Finalised" }, { value: "exported", label: "Exported" },
];

export const ADJUSTMENT_KINDS = [
  { value: "bonus", label: "Bonus" }, { value: "expense_reimbursement", label: "Expense reimbursement" }, { value: "holiday_pay", label: "Holiday pay" }, { value: "deduction", label: "Deduction" }, { value: "other", label: "Other" },
];

export const payPeriodSchema = z.object({
  name: requiredText(2, 120, "Name the period"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  pay_date: optionalDate,
  notes: optionalText(2000),
});

export const adjustmentSchema = z.object({
  kind: z.enum(["bonus", "expense_reimbursement", "holiday_pay", "deduction", "other"]),
  label: requiredText(1, 160, "Describe the adjustment"),
  amount: money.refine((v) => Number(v) !== 0, "Enter an amount"),
  negative: z.string().optional(),
});

/** Overtime multiplier used when building a period. Not a statutory rate. */
export const DEFAULT_OVERTIME_MULTIPLIER = 1.5;
