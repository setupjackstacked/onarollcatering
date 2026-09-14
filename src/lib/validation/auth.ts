import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z.string().min(1, "Enter your password").max(200),
  next: z.string().max(500).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(10, "Use at least 10 characters").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

/** Only allow same-origin relative redirects inside the app. */
export function safeNext(next: string | undefined | null, fallback = "/dashboard") {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (!next.startsWith("/dashboard") && !next.startsWith("/staff")) return fallback;
  return next;
}
