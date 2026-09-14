"use client";

import { Form, FormRow, FormSection, TextField, TextArea, SelectField, DateField, SubmitButton, FormActions } from "../form";
import { saveInvoiceHeader, saveInvoiceLines, issueInvoice, recordPayment, cancelInvoice, sendInvoice } from "@/features/invoices/actions";
import { LineBuilder, type BuilderLine, type CatalogueOption, type VatOption } from "../line-builder";
import { DEFAULT_INVOICE_TERMS, PAYMENT_METHODS } from "@/features/invoices/schema";
import type { Tables } from "@/lib/supabase/types";
import { ActionLink } from "../entity";

type Opt = { value: string; label: string };

const KINDS: Opt[] = [
  { value: "standard", label: "Standard invoice" }, { value: "deposit", label: "Deposit" }, { value: "milestone", label: "Milestone" }, { value: "final", label: "Final balance" }, { value: "credit_note", label: "Credit note" },
];

export function InvoiceHeaderForm({ invoice, clients, contacts, projects, defaults }: { invoice?: Tables<"invoices"> | null; clients: Opt[]; contacts: Opt[]; projects: Opt[]; defaults?: { client_id?: string; project_id?: string; title?: string } }) {
  const draft = !invoice || invoice.status === "draft";
  return (
    <Form action={saveInvoiceHeader.bind(null, invoice?.id ?? null)}>
      <FormSection title="Invoice" description={draft ? undefined : "Issued invoices are locked — only internal fields can change. Cancel or raise a credit note to correct amounts."}>
        <TextField name="title" label="Title" defaultValue={invoice?.title ?? defaults?.title} required autoFocus disabled={!draft} placeholder="e.g. Catering services — August 2026" />
        <FormRow cols={3}>
          <SelectField name="kind" label="Type" options={KINDS} defaultValue={invoice?.kind ?? "standard"} disabled={!draft} />
          <SelectField name="client_id" label="Client" options={clients} placeholder="Select a client" defaultValue={invoice?.client_id ?? defaults?.client_id ?? ""} required disabled={!draft} />
          <SelectField name="contact_id" label="Contact" optional options={contacts} placeholder="None" defaultValue={invoice?.contact_id ?? ""} hint="Save to refresh after changing client" />
        </FormRow>
        <FormRow cols={3}>
          <SelectField name="project_id" label="Project" optional options={projects} placeholder="No project" defaultValue={invoice?.project_id ?? defaults?.project_id ?? ""} />
          <TextField name="reference" label="Customer reference / PO" optional defaultValue={invoice?.reference ?? ""} />
          <TextField name="discount_pct" label="Invoice-level discount %" type="number" min={0} max={100} step="0.01" defaultValue={invoice?.discount_pct ?? "0"} disabled={!draft} />
        </FormRow>
      </FormSection>
      <FormSection title="Customer-facing text">
        <TextArea name="notes" label="Notes" optional defaultValue={invoice?.notes ?? ""} rows={3} hint="Shown on the PDF and customer page" disabled={!draft} />
        <TextArea name="terms" label="Payment terms" optional defaultValue={invoice?.terms ?? DEFAULT_INVOICE_TERMS} rows={4} disabled={!draft} />
      </FormSection>
      <FormSection title="Internal">
        <TextArea name="internal_notes" label="Internal notes" optional defaultValue={invoice?.internal_notes ?? ""} rows={3} />
      </FormSection>
      {!draft && invoice ? (<>
        <input type="hidden" name="title" value={invoice.title} /><input type="hidden" name="kind" value={invoice.kind} /><input type="hidden" name="client_id" value={invoice.client_id} /><input type="hidden" name="discount_pct" value={invoice.discount_pct} />
      </>) : null}
      <FormActions>
        <SubmitButton>{invoice ? "Save details" : "Create invoice and add lines"}</SubmitButton>
        <ActionLink href={invoice ? `/dashboard/invoices/${invoice.id}` : "/dashboard/invoices"}>{invoice ? "Back to invoice" : "Cancel"}</ActionLink>
      </FormActions>
    </Form>
  );
}

export function InvoiceLines({ invoiceId, initial, vatRates, catalogue, discountPct, disabled }: { invoiceId: string; initial: BuilderLine[]; vatRates: VatOption[]; catalogue: CatalogueOption[]; discountPct: number; disabled?: boolean }) {
  return <LineBuilder initial={initial} vatRates={vatRates} catalogue={catalogue} docDiscountPct={discountPct} showCost={false} onSave={(lines) => saveInvoiceLines(invoiceId, lines)} disabled={disabled} />;
}

export function IssueInvoiceForm({ id, defaultIssue, termsDays }: { id: string; defaultIssue: string; termsDays: number }) {
  return (
    <Form action={issueInvoice.bind(null, id)} className="flex flex-wrap items-end gap-3 space-y-0">
      <DateField name="issue_date" label="Issue date" defaultValue={defaultIssue} required className="w-44" />
      <DateField name="due_date" label="Due date" optional hint={`Blank = issue date + ${termsDays} days (client terms)`} className="w-56" />
      <SubmitButton variant="copper">Issue invoice</SubmitButton>
    </Form>
  );
}

export function RecordPaymentForm({ id, balance, today }: { id: string; balance: string; today: string }) {
  return (
    <Form action={recordPayment.bind(null, id)}>
      <FormRow cols={3}>
        <TextField name="amount" label="Amount (£)" inputMode="decimal" defaultValue={balance} required />
        <DateField name="paid_on" label="Received on" defaultValue={today} required />
        <SelectField name="method" label="Method" options={PAYMENT_METHODS} defaultValue="bank_transfer" />
      </FormRow>
      <FormRow>
        <TextField name="reference" label="Reference" optional placeholder="Remittance / transaction ref" />
        <TextField name="notes" label="Notes" optional />
      </FormRow>
      <SubmitButton>Record payment</SubmitButton>
    </Form>
  );
}

export function CancelInvoiceForm({ id }: { id: string }) {
  return (
    <Form action={cancelInvoice.bind(null, id)} className="flex flex-wrap items-end gap-3 space-y-0">
      <TextField name="reason" label="Reason for cancelling" required className="min-w-64 flex-1" placeholder="e.g. raised in error — replaced by OAR-INV-…" />
      <SubmitButton variant="danger">Cancel invoice</SubmitButton>
    </Form>
  );
}

export function SendInvoiceForm({ id, defaultTo }: { id: string; defaultTo: string }) {
  return (
    <Form action={sendInvoice.bind(null, id)}>
      <TextField name="to" label="Send to" type="email" defaultValue={defaultTo} required />
      <TextArea name="message" label="Message" optional rows={3} placeholder="Optional note included in the email" />
      <SubmitButton variant="copper">Send invoice</SubmitButton>
    </Form>
  );
}
