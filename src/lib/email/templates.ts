import "server-only";

import { site } from "@/content/site";
import { SERVICE_OPTIONS, type Enquiry, type ContactMessage } from "@/lib/validation/enquiry";

/**
 * Centralised branded email templates. Plain, robust HTML (no external CSS)
 * that renders well in Outlook/Gmail. Keep copy factual.
 */

const brand = {
  obsidian: "#0A0A0A",
  ivory: "#F3EFE8",
  copper: "#C96A32",
  muted: "#66615A",
};

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:${brand.ivory};font-family:Inter,Helvetica,Arial,sans-serif;color:#171717;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${brand.ivory};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
  <tr><td style="background:${brand.obsidian};padding:28px 32px;">
    <img src="${site.url}/brand/logo-copper.png" alt="${escape(site.name)}" height="56" style="height:56px;width:auto;display:block;" />
  </td></tr>
  <tr><td style="background:#ffffff;padding:32px;">
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:26px;line-height:1.2;">${escape(title)}</h1>
    ${body}
  </td></tr>
  <tr><td style="padding:20px 32px;font-size:12px;color:${brand.muted};">
    ${escape(site.legalName)} · <a href="${site.url}" style="color:${brand.copper};">${site.url.replace(/^https?:\/\//, "")}</a>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

function row(label: string, value?: string | null) {
  if (!value) return "";
  return `<tr><td style="padding:8px 0;border-bottom:1px solid #E8E2D8;color:${brand.muted};font-size:13px;width:38%;vertical-align:top;">${escape(label)}</td><td style="padding:8px 0;border-bottom:1px solid #E8E2D8;font-size:14px;vertical-align:top;">${escape(value)}</td></tr>`;
}

function serviceLabels(values: string[]) {
  return values.map((v) => SERVICE_OPTIONS.find((o) => o.value === v)?.label ?? v).join(", ");
}

function yesNo(v?: boolean) {
  return v ? "Yes" : undefined;
}

export function enquiryInternalAlert(e: Enquiry, enquiryId: string | null) {
  const meals = [e.catering?.breakfast && "Breakfast", e.catering?.lunch && "Lunch", e.catering?.dinner && "Dinner"].filter(Boolean).join(", ");
  const attachments = e.attachments.length
    ? `<p style="margin:16px 0 0;font-size:14px;"><strong>${e.attachments.length} attachment(s)</strong> uploaded — available from the dashboard once Phase 4 is live.</p>`
    : "";
  const html = layout(
    `New project enquiry — ${e.companyName}`,
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      ${row("Company", e.companyName)}${row("Contact", e.contactName)}${row("Job title", e.jobTitle)}${row("Email", e.email)}${row("Phone", e.phone)}
      ${row("Project", e.projectName)}${row("Location", e.location)}${row("Required start", e.requiredStartDate)}${row("Duration", e.expectedDuration)}
      ${row("Services", serviceLabels(e.services))}
      ${row("Diners / workforce", e.catering?.estimatedDiners)}${row("Meals per day", e.catering?.mealsPerDay)}${row("Meals", meals || undefined)}
      ${row("7-day service", yesNo(e.catering?.sevenDay))}${row("Operating hours", e.catering?.operatingHours)}${row("Contract duration", e.catering?.contractDuration)}
      ${row("Existing kitchen", e.catering?.existingKitchen)}${row("Temporary facility", e.catering?.temporaryFacility)}
      ${row("Kitchen type", e.kitchen?.kitchenType?.join(", "))}${row("Approx. size", e.kitchen?.approximateSize)}${row("Throughput", e.kitchen?.requiredThroughput)}
      ${row("Completion date", e.kitchen?.requiredCompletionDate)}${row("Existing drawings", e.kitchen?.existingDrawings)}${row("Existing equipment", e.kitchen?.existingEquipment)}
      ${enquiryId ? row("Enquiry ID", enquiryId) : ""}
    </table>
    <h2 style="margin:24px 0 8px;font-size:14px;color:${brand.muted};text-transform:uppercase;letter-spacing:.1em;">Description</h2>
    <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escape(e.description)}</p>
    ${attachments}`,
  );
  const text = `New project enquiry from ${e.companyName} (${e.contactName}, ${e.email}, ${e.phone})
Project: ${e.projectName} — ${e.location}
Services: ${serviceLabels(e.services)}
${e.description}`;
  return { subject: `New project enquiry — ${e.companyName} — ${e.projectName}`, html, text };
}

export function enquiryCustomerConfirmation(e: Enquiry) {
  const html = layout(
    "We've received your enquiry",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${escape(e.contactName.split(" ")[0] ?? e.contactName)},</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Thank you for your enquiry about <strong>${escape(e.projectName)}</strong>. A member of our team will review the details and come back to you to discuss scope and next steps.</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">If anything changes in the meantime, reply to this email.</p>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:8px;">
      ${row("Company", e.companyName)}${row("Project", e.projectName)}${row("Location", e.location)}${row("Services", serviceLabels(e.services))}
     </table>
     <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">${escape(site.name)}</p>`,
  );
  const text = `Thank you for your enquiry about ${e.projectName}. A member of our team will review the details and come back to you.\n\n${site.name}`;
  return { subject: `Your enquiry — ${e.projectName}`, html, text };
}

export function contactInternalAlert(m: ContactMessage) {
  const html = layout(
    `Website message — ${m.name}`,
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      ${row("Name", m.name)}${row("Email", m.email)}${row("Company", m.company)}
    </table>
    <p style="margin:24px 0 0;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escape(m.message)}</p>`,
  );
  return { subject: `Website message — ${m.name}${m.company ? ` (${m.company})` : ""}`, html, text: `${m.name} <${m.email}>\n\n${m.message}` };
}
