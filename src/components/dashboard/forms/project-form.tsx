"use client";

import { Form, FormRow, FormSection, TextField, TextArea, SelectField, MoneyField, DateField, SubmitButton, FormActions, Hidden } from "../form";
import { saveProject } from "@/features/projects/actions";
import { PROJECT_STATUSES } from "@/lib/domain/statuses";
import type { Tables } from "@/lib/supabase/types";
import { ActionLink } from "../entity";
import { ServiceChecks } from "./service-checks";

type Opt = { value: string; label: string };
export function ProjectForm({ project, clients, sites, members, services, defaults }: { project?: Tables<"projects"> | null; clients: Opt[]; sites: Opt[]; members: Opt[]; services: Opt[]; defaults?: Partial<{ client_id: string; lead_id: string; name: string }> }) {
  return (
    <Form action={saveProject.bind(null, project?.id ?? null)}>
      {defaults?.lead_id ? <Hidden name="lead_id" value={defaults.lead_id} /> : null}
      <FormSection title="Project">
        <TextField name="name" label="Project name" defaultValue={project?.name ?? defaults?.name} required autoFocus />
        <FormRow cols={3}>
          <SelectField name="client_id" label="Client" options={clients} placeholder="Select a client" defaultValue={project?.client_id ?? defaults?.client_id ?? ""} required disabled={!!project} />
          {project ? <Hidden name="client_id" value={project.client_id} /> : null}
          <SelectField name="site_id" label="Site" optional options={sites} placeholder="No site yet" defaultValue={project?.site_id ?? ""} />
          <SelectField name="status" label="Status" options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} defaultValue={project?.status ?? "approved"} />
        </FormRow>
        <ServiceChecks options={services} selected={project?.service_keys ?? []} />
        <TextArea name="description" label="Description" optional defaultValue={project?.description ?? ""} rows={4} />
      </FormSection>
      <FormSection title="Delivery">
        <FormRow cols={3}>
          <SelectField name="project_manager_id" label="Project manager" optional options={members} placeholder="Unassigned" defaultValue={project?.project_manager_id ?? ""} />
          <DateField name="start_date" label="Start date" optional defaultValue={project?.start_date ?? ""} />
          <DateField name="end_date" label="End date" optional defaultValue={project?.end_date ?? ""} />
        </FormRow>
      </FormSection>
      <FormSection title="Commercials" description="Estimated cost drives the estimated margin until actual costs are recorded.">
        <FormRow>
          <MoneyField name="contract_value" label="Contract value" optional defaultValue={project?.contract_value ?? ""} />
          <MoneyField name="estimated_cost" label="Estimated cost" optional defaultValue={project?.estimated_cost ?? ""} />
        </FormRow>
        <TextArea name="notes" label="Internal notes" optional defaultValue={project?.notes ?? ""} rows={3} />
      </FormSection>
      <FormActions>
        <SubmitButton>{project ? "Save changes" : "Create project"}</SubmitButton>
        <ActionLink href={project ? `/dashboard/projects/${project.id}` : "/dashboard/projects"}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}
