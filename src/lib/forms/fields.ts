import { z } from "zod";

export const optionalText = (max = 500) => z.string().trim().max(max).optional().or(z.literal(""));
export const requiredText = (min = 1, max = 200, msg = "Required") => z.string().trim().min(min, msg).max(max);
export const optionalEmail = z.string().trim().email("Enter a valid email").max(254).optional().or(z.literal(""));
export const optionalDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date").optional().or(z.literal(""));
export const uuid = z.string().uuid();
export const optionalUuid = z.string().uuid().optional().or(z.literal(""));
export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
/** Pounds as typed by a user ("1,250.50") → decimal string "1250.50" for numeric columns. */
export const money = z
  .string()
  .trim()
  .transform((s) => s.replace(/[€£,\s]/g, ""))
  .refine((s) => s === "" || /^\d+(\.\d{1,2})?$/.test(s), "Enter an amount like 1250.00")
  .transform((s) => (s === "" ? "0.00" : Number(s).toFixed(2)));
export const optionalMoney = money.optional();
