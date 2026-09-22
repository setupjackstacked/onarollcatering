import { z } from "zod";

/**
 * Environment access. Server-only values are validated lazily so that
 * marketing pages can build without Supabase/Resend configured, while any
 * code path that actually needs them fails loudly with a clear message.
 *
 * Never import `serverEnv` from a client component.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z
    .string()
    .min(3)
    .default("On A Roll Catering <noreply@onarollcatering.com>"),
  EMAIL_REPLY_TO: z.string().email().optional(),
  INTERNAL_NOTIFICATION_EMAIL: z.string().email().optional(),
  ENQUIRY_ORGANISATION_ID: z.string().uuid().optional(),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must not be called in the browser.");
  }
  if (!cachedServerEnv) {
    cachedServerEnv = serverSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
      INTERNAL_NOTIFICATION_EMAIL: process.env.INTERNAL_NOTIFICATION_EMAIL,
      ENQUIRY_ORGANISATION_ID: process.env.ENQUIRY_ORGANISATION_ID,
    });
  }
  return cachedServerEnv;
}

export const isSupabaseConfigured = Boolean(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
