"use client";

import { Form, FormRow, FormSection, TextField, TextArea, SelectField, DateField, SubmitButton, FormActions, Hidden } from "../form";
import { saveSite } from "@/features/clients/actions";
import { SITE_TYPES, SITE_STATUSES } from "@/features/clients/schema";
import type { Tables } from "@/lib/supabase/types";
import type { Address } from "@/lib/domain/address";
import { ActionLink } from "../entity";

export function SiteForm({ clientId, site, contacts, managers, returnTo }: { clientId: string; site?: Tables<"sites"> | null; contacts: { value: string; label: string }[]; managers?: { value: string; label: string }[]; returnTo?: string }) {
  const a = (site?.address ?? {}) as Partial<Address>;
  return (
    <Form action={saveSite.bind(null, site?.id ?? null)}>
      <Hidden name="client_id" value={clientId} />
      {returnTo ? <Hidden name="return" value={returnTo} /> : null}
      <TextField name="name" label="Site name" defaultValue={site?.name} required autoFocus placeholder="e.g. North Compound, Head Office" />
      <FormRow cols={3}>
        <SelectField name="site_type" label="Type" options={SITE_TYPES} defaultValue={site?.site_type ?? "kitchen"} />
        <SelectField name="status" label="Status" options={SITE_STATUSES} defaultValue={site?.status ?? "operating"} />
        <DateField name="opened_on" label="Opened" optional defaultValue={site?.opened_on ?? ""} />
      </FormRow>
      {managers ? (
        <FormSection title="Who runs it" description="Our manager is accountable for the site. The site contact is the client’s person on the ground.">
          <FormRow cols={3}>
            <SelectField name="oar_manager_id" label="On A Roll manager" optional options={managers} placeholder="Unassigned" defaultValue={site?.oar_manager_id ?? ""} />
            <TextField name="site_manager_name" label="Client site manager" optional defaultValue={site?.site_manager_name ?? ""} />
            <TextField name="site_manager_phone" label="Their phone" type="tel" optional defaultValue={site?.site_manager_phone ?? ""} />
          </FormRow>
          <TextField name="site_manager_email" label="Their email" type="email" optional defaultValue={site?.site_manager_email ?? ""} className="sm:max-w-md" />
        </FormSection>
      ) : null}
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
        <ActionLink href={returnTo ?? `/dashboard/clients/${clientId}/sites`}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}
