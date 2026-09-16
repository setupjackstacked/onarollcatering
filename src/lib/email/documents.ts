import "server-only";

import { site } from "@/content/site";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#F3EFE8;font-family:Inter,Helvetica,Arial,sans-serif;color:#171717;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
<tr><td style="background:#0A0A0A;padding:28px 32px;"><img src="${site.url}/brand/logo-copper.png" alt="${esc(site.name)}" height="56" style="height:56px;width:auto;display:block;"></td></tr>
<tr><td style="background:#fff;padding:32px;"><h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:500;font-size:26px;">${esc(title)}</h1>${body}</td></tr>
<tr><td style="padding:20px 32px;font-size:12px;color:#66615A;">${esc(site.legalName)} · <a href="${site.url}" style="color:#C96A32;">${site.url.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) => `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:#C96A32;color:#F3EFE8;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:500;">${esc(label)}</a></p>`;

export function quoteEmail(p: { number: string; revision: number; title: string; clientName: string; total: string; expiry: string; url: string; message: string }) {
  const ref = p.revision ? `${p.number} (rev ${p.revision})` : p.number;
  const html = shell(`Quotation ${ref}`, `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Please find our quotation <strong>${esc(ref)}</strong> for <strong>${esc(p.title)}</strong>.</p>
    ${p.message ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(p.message)}</p>` : ""}
    <p style="margin:0;font-size:15px;line-height:1.6;">Total (inc. VAT): <strong>${formatMoney(toPence(p.total))}</strong><br>Valid until: ${formatDateUK(p.expiry)}</p>
    ${button(p.url, "View and respond to the quotation")}
    <p style="margin:0;font-size:13px;color:#66615A;">You can download a PDF, accept or decline from that page. If you have questions, reply to this email.</p>`);
  const text = `Quotation ${ref} — ${p.title}\nTotal inc. VAT: ${formatMoney(toPence(p.total))}\nValid until ${formatDateUK(p.expiry)}\n\nView: ${p.url}\n\n${p.message}`;
  return { subject: `Quotation ${ref} — ${p.title} — ${site.name}`, html, text };
}

export function invoiceEmail(p: { number: string; title: string; total: string; due: string | null; url: string; message: string; isCredit: boolean }) {
  const kind = p.isCredit ? "Credit note" : "Invoice";
  const html = shell(`${kind} ${p.number}`, `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Please find ${p.isCredit ? "our credit note" : "our invoice"} <strong>${esc(p.number)}</strong> for <strong>${esc(p.title)}</strong>.</p>
    ${p.message ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(p.message)}</p>` : ""}
    <p style="margin:0;font-size:15px;line-height:1.6;">Amount: <strong>${formatMoney(toPence(p.total))}</strong>${p.due && !p.isCredit ? `<br>Due: ${formatDateUK(p.due)}` : ""}</p>
    ${button(p.url, `View ${kind.toLowerCase()}`)}
    <p style="margin:0;font-size:13px;color:#66615A;">Payment details are on the document. Reply to this email with any queries.</p>`);
  const text = `${kind} ${p.number} — ${p.title}\nAmount: ${formatMoney(toPence(p.total))}${p.due ? `\nDue ${formatDateUK(p.due)}` : ""}\n\nView: ${p.url}\n\n${p.message}`;
  return { subject: `${kind} ${p.number} — ${p.title} — ${site.name}`, html, text };
}
