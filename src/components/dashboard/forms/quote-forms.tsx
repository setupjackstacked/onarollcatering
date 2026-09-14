"use client";

import { Form, FormRow, FormSection, TextField, TextArea, SelectField, DateField, SubmitButton, FormActions } from "../form";
import { saveQuoteHeader, sendQuote, convertQuoteToProject, createInvoiceFromQuote, saveQuoteLines } from "@/features/quotes/actions";
import { LineBuilder, type BuilderLine, type CatalogueOption, type VatOption } from "../line-builder";
import { DEFAULT_TERMS } from "@/features/quotes/schema";
import type { Tables } from "@/lib/supabase/types";
import { isoDateOffset } from "@/lib/dates";
import { ActionLink } from "../entity";

type Opt = { value: string; label: string };

export function QuoteHeaderForm({ quote, clients, contacts, projects, defaults }: { quote?: Tables<"quotes"> | null; clients: Opt[]; contacts: Opt[]; projects: Opt[]; defaults?: { client_id?: string; lead_id?: string; project_id?: string; title?: string } }) {
  const today = isoDateOffset(0);
  const in30 = isoDateOffset(30);
  return (
    <Form action={saveQuoteHeader.bind(null, quote?.id ?? null)}>
      {defaults?.lead_id ? <input type="hidden" name="lead_id" value={defaults.lead_id} /> : null}
      <FormSection title="Quotation">
        <TextField name="title" label="Title" defaultValue={quote?.title ?? defaults?.title} required autoFocus placeholder="e.g. Modular kitchen and catering — North Compound" />
        <FormRow cols={3}>
          <SelectField name="client_id" label="Client" options={clients} placeholder="Select a client" defaultValue={quote?.client_id ?? defaults?.client_id ?? ""} required />
          <SelectField name="contact_id" label="Contact" optional options={contacts} placeholder="None" defaultValue={quote?.contact_id ?? ""} hint="Save to refresh after changing client" />
          <SelectField name="project_id" label="Project" optional options={projects} placeholder="No project yet" defaultValue={quote?.project_id ?? defaults?.project_id ?? ""} />
        </FormRow>
        <FormRow cols={3}>
          <DateField name="issue_date" label="Issue date" defaultValue={quote?.issue_date ?? today} required />
          <DateField name="expiry_date" label="Valid until" defaultValue={quote?.expiry_date ?? in30} required />
          <TextField name="discount_pct" label="Quote-level discount %" type="number" min={0} max={100} step="0.01" defaultValue={quote?.discount_pct ?? "0"} hint="Applied to every line before VAT" />
        </FormRow>
      </FormSection>
      <FormSection title="Customer-facing text">
        <TextArea name="scope_notes" label="Scope notes" optional defaultValue={quote?.scope_notes ?? ""} rows={4} hint="Shown on the PDF and customer page" />
        <TextArea name="terms" label="Terms" optional defaultValue={quote?.terms ?? DEFAULT_TERMS} rows={5} />
      </FormSection>
      <FormSection title="Internal">
        <TextArea name="internal_notes" label="Internal notes" optional defaultValue={quote?.internal_notes ?? ""} rows={3} />
      </FormSection>
      <FormActions>
        <SubmitButton>{quote ? "Save details" : "Create quote and add lines"}</SubmitButton>
        <ActionLink href={quote ? `/dashboard/quotes/${quote.id}` : "/dashboard/quotes"}>{quote ? "Back to quote" : "Cancel"}</ActionLink>
      </FormActions>
    </Form>
  );
}

export function QuoteLines({ quoteId, initial, vatRates, catalogue, discountPct, disabled }: { quoteId: string; initial: BuilderLine[]; vatRates: VatOption[]; catalogue: CatalogueOption[]; discountPct: number; disabled?: boolean }) {
  return <LineBuilder initial={initial} vatRates={vatRates} catalogue={catalogue} docDiscountPct={discountPct} showCost onSave={(lines) => saveQuoteLines(quoteId, lines)} disabled={disabled} />;
}

export function SendQuoteForm({ id, defaultTo }: { id: string; defaultTo: string }) {
  return (
    <Form action={sendQuote.bind(null, id)}>
      <FormRow>
        <TextField name="to" label="Send to" type="email" defaultValue={defaultTo} required />
        <TextField name="cc" label="Cc" type="email" optional />
      </FormRow>
      <TextArea name="message" label="Message" optional rows={3} placeholder="Optional note included in the email" />
      <SubmitButton variant="copper">Send quotation</SubmitButton>
    </Form>
  );
}

export function ConvertQuoteForm({ id, members, sites }: { id: string; members: Opt[]; sites: Opt[] }) {
  return (
    <Form action={convertQuoteToProject.bind(null, id)} className="flex flex-wrap items-end gap-2 space-y-0">
      <SelectField name="project_manager_id" label="Project manager" optional options={members} placeholder="Unassigned" className="min-w-48" />
      <SelectField name="site_id" label="Site" optional options={sites} placeholder="None" className="min-w-48" />
      <SubmitButton variant="copper">Create project</SubmitButton>
    </Form>
  );
}

export function InvoiceFromQuoteForm({ id }: { id: string }) {
  return (
    <Form action={createInvoiceFromQuote.bind(null, id)} className="flex flex-wrap items-end gap-2 space-y-0">
      <SelectField name="kind" label="Invoice type" options={[{ value: "standard", label: "Full invoice" }, { value: "deposit", label: "Deposit" }, { value: "milestone", label: "Milestone" }, { value: "final", label: "Final balance" }]} defaultValue="standard" className="min-w-44" />
      <TextField name="percent" label="% of quote" type="number" min={1} max={100} defaultValue={100} className="w-32" />
      <SubmitButton variant="outline">Create draft invoice</SubmitButton>
    </Form>
  );
}
