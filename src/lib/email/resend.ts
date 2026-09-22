import "server-only";

import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

let client: Resend | null = null;

function getClient() {
  const { RESEND_API_KEY } = serverEnv();
  if (!RESEND_API_KEY) return null;
  if (!client) client = new Resend(RESEND_API_KEY);
  return client;
}

export type MailAttachment = { filename: string; content: Buffer; contentType?: string };
export type Mail = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

/**
 * Sends an email via Resend. When RESEND_API_KEY is absent (local dev) the
 * message is logged instead of thrown so the enquiry flow still completes.
 */
export async function sendMail(mail: Mail): Promise<{ ok: boolean; id?: string }> {
  const resend = getClient();
  const { EMAIL_FROM, EMAIL_REPLY_TO } = serverEnv();
  if (!resend) {
    logger.warn("email.skipped", { reason: "RESEND_API_KEY not set", to: mail.to, subject: mail.subject });
    return { ok: false };
  }
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    // The business sends from the verified website domain but reads its email
    // somewhere else, so every message needs a reply-to a human actually
    // watches. A caller can override it; otherwise the account default wins.
    replyTo: mail.replyTo ?? EMAIL_REPLY_TO,
    attachments: mail.attachments,
  });
  if (error) {
    logger.error("email.failed", { error: error.message, subject: mail.subject });
    return { ok: false };
  }
  return { ok: true, id: data?.id };
}
