"use client";

import { Form, FormRow, FormSection, TextField, TextArea, SelectField, MoneyField, DateField, SubmitButton, FormActions } from "../form";
import { saveLead } from "@/features/leads/actions";
import { LEAD_STATUSES } from "@/lib/domain/statuses";
import type { Tables } from "@/lib/supabase/types";
import { ActionLink } from "../entity";
import { ServiceChecks } from "./service-checks";

type Opt = { value: string; label: string };
export function LeadForm({ lead, clients, members, sources, services, contacts }: { lead?: Tables<"leads"> | null; clients: Opt[]; members: Opt[]; sources: Opt[]; services: Opt[]; contacts: Opt[] }) {
  return (
    <Form action={saveLead.bind(null, lead?.id ?? null)}>
      <FormSection title="Opportunity">
        <TextField name="title" label="Title" defaultValue={lead?.title} required autoFocus placeholder="e.g. Site canteen — Leeds compound" />
        <FormRow cols={3}>
          <SelectField name="status" label="Stage" options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))} defaultValue={lead?.status ?? "new"} />
          <SelectField name="source_key" label="Source" options={sources} placeholder="Select" defaultValue={lead?.source_key ?? "other"} />
          <SelectField name="assigned_user_id" label="Assigned to" optional options={members} placeholder="Unassigned" defaultValue={lead?.assigned_user_id ?? ""} />
        </FormRow>
        <ServiceChecks options={services} selected={lead?.service_keys ?? []} />
      </FormSection>
      <FormSection title="Client" description="Link an existing client, or capture the company details until one exists.">
        <FormRow>
          <SelectField name="client_id" label="Existing client" optional options={clients} placeholder="Not yet a client" defaultValue={lead?.client_id ?? ""} />
          <SelectField name="contact_id" label="Contact" optional options={contacts} placeholder="None" defaultValue={lead?.contact_id ?? ""} hint="Contacts of the selected client (save to refresh)" />
          <TextField name="company_name" label="Company name" optional defaultValue={lead?.company_name ?? ""} />
          <TextField name="contact_name" label="Contact name" optional defaultValue={lead?.contact_name ?? ""} />
          <TextField name="contact_email" label="Contact email" type="email" optional defaultValue={lead?.contact_email ?? ""} />
          <TextField name="contact_phone" label="Contact phone" type="tel" optional defaultValue={lead?.contact_phone ?? ""} />
        </FormRow>
      </FormSection>
      <FormSection title="Project">
        <FormRow cols={3}>
          <MoneyField name="estimated_value" label="Estimated value" optional defaultValue={lead?.estimated_value ?? ""} />
          <TextField name="project_location" label="Location" optional defaultValue={lead?.project_location ?? ""} />
          <DateField name="expected_start_date" label="Expected start" optional defaultValue={lead?.expected_start_date ?? ""} />
        </FormRow>
        <TextArea name="notes" label="Brief / notes" optional defaultValue={lead?.notes ?? ""} rows={5} />
      </FormSection>
      <FormActions>
        <SubmitButton>{lead ? "Save changes" : "Create lead"}</SubmitButton>
        <ActionLink href={lead ? `/dashboard/leads/${lead.id}` : "/dashboard/leads"}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}
