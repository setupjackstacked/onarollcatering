"use client";

import { Form, FormRow, TextField, SelectField, DateField, CheckboxField, SubmitButton } from "../form";
import { assignToSite } from "@/features/sites/actions";

type Opt = { value: string; label: string };

/**
 * Puts a team member on a site. `people` are organisation members — they need a
 * login to use the portal. Their employee record is matched server-side.
 */
export function AssignToSiteForm({ siteId, people }: { siteId: string; people: Opt[] }) {
  return (
    <Form action={assignToSite.bind(null, siteId)}>
      <FormRow cols={3}>
        <SelectField name="user_id" label="Person" options={people} placeholder="Select a team member" required />
        <SelectField name="role" label="Role here" options={[{ value: "staff", label: "Staff" }, { value: "manager", label: "Site manager" }]} defaultValue="staff" />
        <DateField name="starts_on" label="From" optional />
      </FormRow>
      <FormRow>
        <TextField name="notes" label="Note" optional placeholder="e.g. covers Tuesdays and Thursdays" />
        <CheckboxField name="is_primary" label="This is their base site" value="true" hint="Shows on their staff profile and pre-fills their timesheets" />
      </FormRow>
      <SubmitButton>Add to site</SubmitButton>
    </Form>
  );
}

/**
 * A site belongs to a client, so the client is chosen first. Kept as its own
 * step rather than a field so the address and contact list can follow it.
 */
export function NewSiteClientPicker({ clients }: { clients: Opt[] }) {
  return (
    <form action="/dashboard/sites/new" className="space-y-5">
      <label htmlFor="f-client" className="block text-sm font-medium">Which client is this site for?</label>
      <select id="f-client" name="client" required defaultValue=""
        className="min-h-11 w-full rounded-md border border-graphite/20 bg-white/70 px-3 py-2.5 text-[0.9375rem] focus:border-copper focus:bg-white focus:outline-none">
        <option value="" disabled>Select a client</option>
        {clients.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <p className="text-xs text-muted-light">Sites are always attached to a client so invoices, projects and documents line up.</p>
      <button type="submit" className="inline-flex h-11 items-center rounded-full bg-obsidian px-5 text-sm font-medium text-ivory hover:bg-graphite">Continue</button>
    </form>
  );
}
