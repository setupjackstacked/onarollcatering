"use server";

import { headers } from "next/headers";
import { enquirySchema, contactMessageSchema, type EnquiryInput } from "@/lib/validation/enquiry";
import { sendMail } from "@/lib/email/resend";
import { enquiryInternalAlert, enquiryCustomerConfirmation, contactInternalAlert } from "@/lib/email/templates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export type ActionResult =
  | { ok: true; reference: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Submit a project enquiry from /quote.
 * 1. Validate server-side (never trust the client).
 * 2. Persist to `enquiries` via service role (if Supabase configured).
 * 3. Email internal alert + customer confirmation via Resend.
 * Phase 4 adds enquiry → lead/company/contact/opportunity conversion.
 */
export async function submitEnquiry(input: EnquiryInput): Promise<ActionResult> {
  const ip = await clientIp();
  if (!rateLimit(`enquiry:${ip}`, 5, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many submissions from this connection. Please try again later or email us directly." };
  }

  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;
  if (data.website) {
    // Honeypot filled — pretend success, do nothing.
    logger.warn("enquiry.honeypot", { ip });
    return { ok: true, reference: null };
  }

  let reference: string | null = null;
  const { ENQUIRY_ORGANISATION_ID, INTERNAL_NOTIFICATION_EMAIL } = serverEnv();

  if (isSupabaseConfigured && ENQUIRY_ORGANISATION_ID) {
    try {
      const supabase = createSupabaseAdminClient();
      const h = await headers();
      const { data: row, error } = await supabase
        .from("enquiries")
        .insert({
          organisation_id: ENQUIRY_ORGANISATION_ID,
          source: "website_quote",
          company_name: data.companyName,
          contact_name: data.contactName,
          job_title: data.jobTitle || null,
          email: data.email,
          phone: data.phone,
          project_name: data.projectName,
          location: data.location,
          required_start_date: data.requiredStartDate || null,
          expected_duration: data.expectedDuration || null,
          description: data.description,
          services: data.services,
          catering_details: data.catering ?? null,
          kitchen_details: data.kitchen ?? null,
          attachments: data.attachments,
          metadata: {
            userAgent: h.get("user-agent"),
            referer: h.get("referer"),
          },
        })
        .select("id")
        .single();
      if (error) throw error;
      reference = row.id;
    } catch (err) {
      // Persisting failed — still notify by email so the lead is never lost.
      logger.error("enquiry.persist_failed", { error: err instanceof Error ? err.message : String(err) });
    }
  } else {
    logger.warn("enquiry.not_persisted", { reason: "Supabase or ENQUIRY_ORGANISATION_ID not configured" });
  }

  const internal = enquiryInternalAlert(data, reference);
  const customer = enquiryCustomerConfirmation(data);

  const [internalResult, customerResult] = await Promise.all([
    INTERNAL_NOTIFICATION_EMAIL
      ? sendMail({ ...internal, to: INTERNAL_NOTIFICATION_EMAIL, replyTo: data.email })
      : Promise.resolve({ ok: false }),
    sendMail({ ...customer, to: data.email }),
  ]);

  logger.info("enquiry.submitted", {
    reference,
    company: data.companyName,
    services: data.services,
    internalEmail: internalResult.ok,
    customerEmail: customerResult.ok,
  });

  if (!reference && !internalResult.ok) {
    // Nothing recorded anywhere — surface an honest error rather than a fake success.
    return { ok: false, error: "We couldn't submit your enquiry just now. Please email us directly or try again shortly." };
  }

  return { ok: true, reference };
}

export async function submitContactMessage(input: unknown): Promise<ActionResult> {
  const ip = await clientIp();
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many messages from this connection. Please try again later." };
  }
  const parsed = contactMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  if (parsed.data.website) return { ok: true, reference: null };

  const { INTERNAL_NOTIFICATION_EMAIL } = serverEnv();
  if (!INTERNAL_NOTIFICATION_EMAIL) {
    logger.warn("contact.no_recipient", {});
    return { ok: false, error: "Messaging isn't available right now. Please email us directly." };
  }
  const mail = contactInternalAlert(parsed.data);
  const result = await sendMail({ ...mail, to: INTERNAL_NOTIFICATION_EMAIL, replyTo: parsed.data.email });
  if (!result.ok) return { ok: false, error: "We couldn't send your message. Please email us directly." };
  logger.info("contact.submitted", { name: parsed.data.name });
  return { ok: true, reference: result.id ?? null };
}
