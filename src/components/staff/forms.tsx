"use client";

import { useState } from "react";
import { Form, FormRow, TextField, TextArea, SelectField, DateField, SubmitButton, Hidden } from "@/components/dashboard/form";
import { submitMyHours, requestMyLeave, updateMyContactDetails } from "@/features/staff/actions";
import { LEAVE_TYPES, shiftHours } from "@/features/workforce/schema";

type Opt = { value: string; label: string };

export function LogHoursForm({ projects, sites, defaults }: { projects: Opt[]; sites: Opt[]; defaults?: { work_date?: string; start?: string; end?: string; breakMinutes?: number; project_id?: string; site_id?: string; shift_id?: string } }) {
  const [start, setStart] = useState(defaults?.start ?? "08:00");
  const [end, setEnd] = useState(defaults?.end ?? "16:00");
  const [breakMins, setBreakMins] = useState(String(defaults?.breakMinutes ?? 30));
  const [submitNow, setSubmitNow] = useState(true);
  const hours = shiftHours(start, end, Number(breakMins) || 0);
  return (
    <Form action={submitMyHours}>
      {defaults?.shift_id ? <Hidden name="shift_id" value={defaults.shift_id} /> : null}
      <Hidden name="submit_now" value={String(submitNow)} />
      <DateField name="work_date" label="Date" defaultValue={defaults?.work_date} required />
      <FormRow>
        <TextField name="start_time" label="Start" type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
        <TextField name="end_time" label="Finish" type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
      </FormRow>
      <FormRow>
        <TextField name="break_minutes" label="Break (minutes)" type="number" min={0} max={599} value={breakMins} onChange={(e) => setBreakMins(e.target.value)} />
        <TextField name="overtime_hours" label="Overtime hours" type="number" min={0} max={24} step="0.25" defaultValue="0" />
      </FormRow>
      <p className="rounded-md bg-copper/10 px-4 py-3 text-sm">You worked <span className="num-lining font-medium">{hours.toFixed(2)}</span> hours.</p>
      <SelectField name="project_id" label="Project" optional options={projects} placeholder="Not on a project" defaultValue={defaults?.project_id ?? ""} />
      <SelectField name="site_id" label="Site" optional options={sites} placeholder="No site" defaultValue={defaults?.site_id ?? ""} />
      <TextArea name="notes" label="Notes" optional rows={2} placeholder="Anything your manager should know" />
      <div className="flex flex-col gap-2">
        <SubmitButton variant="copper" className="h-12 w-full" onClick={() => setSubmitNow(true)}>Send for approval</SubmitButton>
        <SubmitButton variant="outline" className="h-12 w-full" onClick={() => setSubmitNow(false)}>Save as draft</SubmitButton>
      </div>
    </Form>
  );
}

export function RequestLeaveForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const days = from && to && to >= from ? weekdays(from, to) : 1;
  return (
    <Form action={requestMyLeave}>
      <SelectField name="leave_type" label="Type" options={LEAVE_TYPES} defaultValue="holiday" />
      <FormRow>
        <DateField name="start_date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} required />
        <DateField name="end_date" label="To" value={to} onChange={(e) => setTo(e.target.value)} required />
      </FormRow>
      <TextField key={days} name="days" label="Working days" type="number" min={0.5} step="0.5" defaultValue={days} hint="Adjust if you’re taking half days" />
      <TextArea name="reason" label="Reason" optional rows={2} />
      <SubmitButton variant="copper" className="h-12 w-full">Send request</SubmitButton>
    </Form>
  );
}

export function ContactDetailsForm({ phone, emergency }: { phone: string | null; emergency: { name?: string | null; relationship?: string | null; phone?: string | null } }) {
  return (
    <Form action={updateMyContactDetails}>
      <TextField name="phone" label="Your phone" type="tel" optional defaultValue={phone ?? ""} />
      <TextField name="emergency_name" label="Emergency contact" optional defaultValue={emergency.name ?? ""} />
      <FormRow>
        <TextField name="emergency_relationship" label="Relationship" optional defaultValue={emergency.relationship ?? ""} />
        <TextField name="emergency_phone" label="Their phone" type="tel" optional defaultValue={emergency.phone ?? ""} />
      </FormRow>
      <SubmitButton className="h-12 w-full">Save details</SubmitButton>
    </Form>
  );
}

function weekdays(from: string, to: string) {
  let n = 0;
  for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) n++;
  }
  return n || 1;
}
