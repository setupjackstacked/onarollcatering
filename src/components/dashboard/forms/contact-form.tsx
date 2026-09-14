"use client";

import { Form, FormRow, TextField, TextArea, CheckboxField, SubmitButton, FormActions, Hidden } from "../form";
import { saveContact } from "@/features/clients/actions";
import type { Tables } from "@/lib/supabase/types";
import { ActionLink } from "../entity";

export function ContactForm({ clientId, contact }: { clientId: string; contact?: Tables<"client_contacts"> | null }) {
  return (
    <Form action={saveContact.bind(null, contact?.id ?? null)}>
      <Hidden name="client_id" value={clientId} />
      <FormRow>
        <TextField name="first_name" label="First name" defaultValue={contact?.first_name} required autoFocus />
        <TextField name="last_name" label="Last name" optional defaultValue={contact?.last_name ?? ""} />
        <TextField name="job_title" label="Job title" optional defaultValue={contact?.job_title ?? ""} />
        <TextField name="email" label="Email" type="email" optional defaultValue={contact?.email ?? ""} />
        <TextField name="mobile" label="Mobile" type="tel" optional defaultValue={contact?.mobile ?? ""} />
        <TextField name="phone" label="Phone" type="tel" optional defaultValue={contact?.phone ?? ""} />
      </FormRow>
      <FormRow cols={3}>
        <CheckboxField name="is_primary" label="Primary contact" defaultChecked={contact?.is_primary} />
        <CheckboxField name="is_finance" label="Finance contact" hint="Receives invoices" defaultChecked={contact?.is_finance} />
        <CheckboxField name="is_project" label="Project contact" defaultChecked={contact?.is_project} />
      </FormRow>
      <TextArea name="notes" label="Notes" optional defaultValue={contact?.notes ?? ""} rows={3} />
      <FormActions>
        <SubmitButton>{contact ? "Save contact" : "Add contact"}</SubmitButton>
        <ActionLink href={`/dashboard/clients/${clientId}/contacts`}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}
