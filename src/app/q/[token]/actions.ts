"use server";

import { headers } from "next/headers";
import { parseForm, type FormState } from "@/lib/forms";
import { decisionSchema } from "@/features/quotes/schema";
import { customerDecision, getPublicQuote } from "@/features/quotes/public";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email/resend";
import { serverEnv, publicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function submitDecision(_: FormState, formData: FormData): Promise<FormState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`qdecision:${ip}`, 10, 60 * 60 * 1000)) return { error: "Too many attempts. Please try again later." };
  const p = parseForm(decisionSchema, formData);
  if (!p.ok) return p.state;
  const ok = await customerDecision(p.data.token, p.data.decision, p.data.name, p.data.note ?? "");
  if (!ok) return { error: "This quotation can no longer be responded to. Please contact us." };
  logger.info("quote.customer_decision", { decision: p.data.decision });

  const { INTERNAL_NOTIFICATION_EMAIL } = serverEnv();
  if (INTERNAL_NOTIFICATION_EMAIL) {
    const data = await getPublicQuote(p.data.token);
    if (data) {
      const q = data.quote;
      await sendMail({
        to: INTERNAL_NOTIFICATION_EMAIL,
        subject: `Quotation ${q.quote_number} ${p.data.decision === "accept" ? "ACCEPTED" : "declined"} — ${q.title}`,
        text: `${p.data.name} ${p.data.decision === "accept" ? "accepted" : "declined"} quotation ${q.quote_number} (${q.title}).\n\n${p.data.note ?? ""}\n\n${publicEnv.NEXT_PUBLIC_SITE_URL}/dashboard/quotes/${q.id}`,
        html: `<p><strong>${p.data.name}</strong> ${p.data.decision === "accept" ? "accepted" : "declined"} quotation <strong>${q.quote_number}</strong> (${q.title}).</p><p>${(p.data.note ?? "").replace(/</g, "&lt;")}</p><p><a href="${publicEnv.NEXT_PUBLIC_SITE_URL}/dashboard/quotes/${q.id}">Open in dashboard</a></p>`,
      });
    }
  }
  return { success: p.data.decision === "accept" ? "Thank you — your acceptance has been recorded. We’ll be in touch shortly." : "Thanks for letting us know. We’ve recorded your response." };
}
