"use client";

import { Form, SelectField, TextField, SubmitButton, FormRow } from "../form";
import { setLeadStatus, convertLead } from "@/features/leads/actions";
import { setProjectStatus } from "@/features/projects/actions";
import { convertEnquiry } from "@/features/enquiries/crm-actions";
import { LEAD_STATUSES, PROJECT_STATUSES } from "@/lib/domain/statuses";
import { MoneyField, DateField } from "../form";

type Opt = { value: string; label: string };

export function LeadStatusForm({ id, status }: { id: string; status: string }) {
  return (
    <Form action={setLeadStatus.bind(null, id)} className="flex flex-wrap items-end gap-2 space-y-0">
      <SelectField name="status" label="Stage" options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))} defaultValue={status} className="min-w-44" />
      <TextField name="lost_reason" label="Lost reason" optional className="min-w-44" placeholder="If lost" />
      <SubmitButton variant="outline">Update</SubmitButton>
    </Form>
  );
}

export function ProjectStatusForm({ id, status }: { id: string; status: string }) {
  return (
    <Form action={setProjectStatus.bind(null, id)} className="flex flex-wrap items-end gap-2 space-y-0">
      <SelectField name="status" label="Status" options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} defaultValue={status} className="min-w-44" />
      <SubmitButton variant="outline">Update</SubmitButton>
    </Form>
  );
}

export function ConvertEnquiryForm({ id, members }: { id: string; members: Opt[] }) {
  return (
    <Form action={convertEnquiry.bind(null, id)} className="flex flex-wrap items-end gap-2 space-y-0">
      <SelectField name="assignee" label="Assign lead to" optional options={members} placeholder="Unassigned" className="min-w-52" />
      <SubmitButton variant="copper">Convert to lead</SubmitButton>
    </Form>
  );
}

export function ConvertLeadForm({ id, title, value, start, sites, members }: { id: string; title: string; value: string | null; start: string | null; sites: Opt[]; members: Opt[] }) {
  return (
    <Form action={convertLead.bind(null, id)}>
      <TextField name="name" label="Project name" defaultValue={title} required />
      <FormRow>
        <SelectField name="site_id" label="Site" optional options={sites} placeholder="No site yet" />
        <SelectField name="project_manager_id" label="Project manager" optional options={members} placeholder="Unassigned" />
        <MoneyField name="contract_value" label="Contract value" optional defaultValue={value ?? ""} />
        <DateField name="start_date" label="Start date" optional defaultValue={start ?? ""} />
      </FormRow>
      <SubmitButton variant="copper">Create project from this lead</SubmitButton>
    </Form>
  );
}
