"use client";

import { Form, FormRow, TextField, TextArea, SelectField, SubmitButton, FormActions, Hidden } from "../form";
import { saveSite } from "@/features/clients/actions";
import type { Tables } from "@/lib/supabase/types";
import type { Address } from "@/lib/domain/address";
import { ActionLink } from "../entity";

export function SiteForm({ clientId, site, contacts }: { clientId: string; site?: Tables<"sites"> | null; contacts: { value: string; label: string }[] }) {
  const a = (site?.address ?? {}) as Partial<Address>;
  return (
    <Form action={saveSite.bind(null, site?.id ?? null)}>
      <Hidden name="client_id" value={clientId} />
      <TextField name="name" label="Site name" defaultValue={site?.name} required autoFocus placeholder="e.g. North Compound, Head Office" />
      <FormRow>
        <TextField name="line1" label="Address line 1" optional defaultValue={a.line1 ?? ""} />
        <TextField name="line2" label="Address line 2" optional defaultValue={a.line2 ?? ""} />
        <TextField name="city" label="Town / city" optional defaultValue={a.city ?? ""} />
        <TextField name="county" label="County" optional defaultValue={a.county ?? ""} />
        <TextField name="postcode" label="Postcode" optional defaultValue={site?.postcode ?? a.postcode ?? ""} />
        <SelectField name="site_contact_id" label="Site contact" optional options={contacts} placeholder="None" defaultValue={site?.site_contact_id ?? ""} />
      </FormRow>
      <TextArea name="access_details" label="Access details" optional hint="Gate codes, induction requirements, delivery windows" defaultValue={site?.access_details ?? ""} rows={3} />
      <TextArea name="notes" label="Notes" optional defaultValue={site?.notes ?? ""} rows={3} />
      <FormActions>
        <SubmitButton>{site ? "Save site" : "Add site"}</SubmitButton>
        <ActionLink href={`/dashboard/clients/${clientId}/sites`}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}
