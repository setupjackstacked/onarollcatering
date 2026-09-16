"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { Form, FormRow, FormSection, TextField, TextArea, SelectField, DateField, MoneyField, SubmitButton, FormActions, Hidden } from "../form";
import { saveEmployee, saveShift, saveTimesheet, saveLeave, checkShift, linkEmployeeUser, rejectTimesheet } from "@/features/workforce/actions";
import { EMPLOYMENT_TYPES, EMPLOYEE_STATUSES, SHIFT_STATUSES, LEAVE_TYPES, shiftHours } from "@/features/workforce/schema";
import type { Tables } from "@/lib/supabase/types";
import { ActionLink } from "../entity";

type Opt = { value: string; label: string };
type Address = { line1?: string | null; city?: string | null; postcode?: string | null };
type Emergency = { name?: string | null; relationship?: string | null; phone?: string | null };

export function EmployeeForm({ employee, roles }: { employee?: Tables<"employees"> | null; roles: Opt[] }) {
  const addr = (employee?.address ?? {}) as Address;
  const emg = (employee?.emergency_contact ?? {}) as Emergency;
  return (
    <Form action={saveEmployee.bind(null, employee?.id ?? null)}>
      <FormSection title="Person">
        <FormRow>
          <TextField name="first_name" label="First name" defaultValue={employee?.first_name} required autoFocus />
          <TextField name="last_name" label="Last name" defaultValue={employee?.last_name} required />
        </FormRow>
        <FormRow>
          <TextField name="email" label="Email" type="email" optional defaultValue={employee?.email ?? ""} />
          <TextField name="phone" label="Phone" type="tel" optional defaultValue={employee?.phone ?? ""} />
        </FormRow>
        <FormRow cols={3}>
          <TextField name="address_line1" label="Address" optional defaultValue={addr.line1 ?? ""} />
          <TextField name="address_city" label="Town / city" optional defaultValue={addr.city ?? ""} />
          <TextField name="address_postcode" label="Postcode" optional defaultValue={addr.postcode ?? ""} />
        </FormRow>
      </FormSection>
      <FormSection title="Emergency contact">
        <FormRow cols={3}>
          <TextField name="emergency_name" label="Name" optional defaultValue={emg.name ?? ""} />
          <TextField name="emergency_relationship" label="Relationship" optional defaultValue={emg.relationship ?? ""} />
          <TextField name="emergency_phone" label="Phone" type="tel" optional defaultValue={emg.phone ?? ""} />
        </FormRow>
      </FormSection>
      <FormSection title="Employment">
        <FormRow cols={3}>
          <SelectField name="role_key" label="Role" options={roles} defaultValue={employee?.role_key ?? "kitchen-assistant"} />
          <SelectField name="employment_type" label="Employment type" options={EMPLOYMENT_TYPES} defaultValue={employee?.employment_type ?? "full_time"} />
          <SelectField name="status" label="Status" options={EMPLOYEE_STATUSES} defaultValue={employee?.status ?? "active"} />
        </FormRow>
        <FormRow cols={3}>
          <DateField name="start_date" label="Start date" optional defaultValue={employee?.start_date ?? ""} />
          <DateField name="end_date" label="End date" optional defaultValue={employee?.end_date ?? ""} />
          <MoneyField name="hourly_rate" label="Hourly rate" optional defaultValue={employee?.hourly_rate ?? ""} hint="Used for timesheet costing and payroll prep" />
        </FormRow>
        <FormRow>
          <MoneyField name="salary" label="Annual salary" optional defaultValue={employee?.salary ?? ""} hint="If salaried rather than hourly" />
        </FormRow>
      </FormSection>
      <FormSection title="Internal">
        <TextArea name="notes" label="Notes" optional defaultValue={employee?.notes ?? ""} rows={3} />
      </FormSection>
      <FormActions>
        <SubmitButton>{employee ? "Save employee" : "Add employee"}</SubmitButton>
        <ActionLink href={employee ? `/dashboard/employees/${employee.id}` : "/dashboard/employees"}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}

export function LinkAccountForm({ id, members, current }: { id: string; members: Opt[]; current: string | null }) {
  return (
    <Form action={linkEmployeeUser.bind(null, id)} className="flex flex-wrap items-end gap-3 space-y-0">
      <SelectField name="user_id" label="Staff portal login" optional options={members} placeholder="Not linked" defaultValue={current ?? ""} className="min-w-64" />
      <SubmitButton variant="outline">Save link</SubmitButton>
    </Form>
  );
}

/** Shift form with live conflict warnings (warn, never block — spec §48). */
export function ShiftForm({ shift, employees, projects, sites, roles, returnTo, defaults }: { shift?: Tables<"shifts"> | null; employees: Opt[]; projects: Opt[]; sites: Opt[]; roles: Opt[]; returnTo?: string; defaults?: { shift_date?: string; employee_id?: string; project_id?: string; site_id?: string } }) {
  const [employeeId, setEmployeeId] = useState(shift?.employee_id ?? defaults?.employee_id ?? employees[0]?.value ?? "");
  const [date, setDate] = useState(shift?.shift_date ?? defaults?.shift_date ?? "");
  const [start, setStart] = useState(shift?.start_time?.slice(0, 5) ?? "08:00");
  const [end, setEnd] = useState(shift?.end_time?.slice(0, 5) ?? "16:00");
  const [breakMins, setBreakMins] = useState(String(shift?.break_minutes ?? 30));
  const [warnings, setWarnings] = useState<{ kind: string; detail: string }[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!employeeId || !date || !start || !end) {
        if (!cancelled) setWarnings([]);
        return;
      }
      startTransition(async () => {
        const w = await checkShift({ employeeId, date, start, end, excludeShiftId: shift?.id });
        if (!cancelled) setWarnings(w);
      });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [employeeId, date, start, end, shift?.id]);

  const hours = start && end ? shiftHours(start, end, Number(breakMins) || 0) : 0;

  return (
    <Form action={saveShift.bind(null, shift?.id ?? null)}>
      {returnTo ? <Hidden name="return" value={returnTo} /> : null}
      <FormRow cols={3}>
        <SelectField name="employee_id" label="Employee" options={employees} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
        <SelectField name="project_id" label="Project" optional options={projects} placeholder="No project" defaultValue={shift?.project_id ?? defaults?.project_id ?? ""} />
        <SelectField name="site_id" label="Site" optional options={sites} placeholder="No site" defaultValue={shift?.site_id ?? defaults?.site_id ?? ""} />
      </FormRow>
      <FormRow cols={3}>
        <DateField name="shift_date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <TextField name="start_time" label="Start" type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
        <TextField name="end_time" label="Finish" type="time" value={end} onChange={(e) => setEnd(e.target.value)} required hint={end <= start ? "Overnight shift" : undefined} />
      </FormRow>
      <FormRow cols={3}>
        <TextField name="break_minutes" label="Break (minutes)" type="number" min={0} max={599} value={breakMins} onChange={(e) => setBreakMins(e.target.value)} />
        <SelectField name="role_key" label="Role on shift" optional options={roles} placeholder="Their usual role" defaultValue={shift?.role_key ?? ""} />
        <SelectField name="status" label="Status" options={SHIFT_STATUSES} defaultValue={shift?.status ?? "draft"} hint="Published shifts are visible to staff" />
      </FormRow>
      <p className="text-sm text-muted-light">Paid hours: <span className="num-lining font-medium text-graphite">{hours.toFixed(2)}</span></p>

      {warnings.length ? (
        <div role="status" className="rounded-md bg-status-warning/10 px-4 py-3 text-sm">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4" aria-hidden /> Check before saving</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.map((w, i) => <li key={i}>{w.detail}</li>)}
          </ul>
          <p className="mt-2 text-xs text-muted-light">You can still save — these are warnings, not blocks.</p>
        </div>
      ) : null}

      <TextArea name="notes" label="Notes" optional defaultValue={shift?.notes ?? ""} rows={2} />
      <FormActions>
        <SubmitButton>{shift ? "Save shift" : "Add shift"}</SubmitButton>
        <ActionLink href={returnTo ?? "/dashboard/rota"}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}

export function TimesheetForm({ timesheet, employees, projects, sites, returnTo, defaults, lockEmployee }: { timesheet?: Tables<"timesheets"> | null; employees: Opt[]; projects: Opt[]; sites: Opt[]; returnTo?: string; defaults?: { work_date?: string; employee_id?: string; project_id?: string; site_id?: string }; lockEmployee?: boolean }) {
  const [start, setStart] = useState(timesheet?.start_time?.slice(0, 5) ?? "08:00");
  const [end, setEnd] = useState(timesheet?.end_time?.slice(0, 5) ?? "16:00");
  const [breakMins, setBreakMins] = useState(String(timesheet?.break_minutes ?? 30));
  const hours = shiftHours(start, end, Number(breakMins) || 0);
  const employeeId = timesheet?.employee_id ?? defaults?.employee_id ?? "";
  return (
    <Form action={saveTimesheet.bind(null, timesheet?.id ?? null)}>
      {returnTo ? <Hidden name="return" value={returnTo} /> : null}
      {lockEmployee ? <Hidden name="employee_id" value={employeeId} /> : null}
      <FormRow cols={3}>
        {lockEmployee ? null : <SelectField name="employee_id" label="Employee" options={employees} defaultValue={employeeId} required />}
        <SelectField name="project_id" label="Project" optional options={projects} placeholder="No project" defaultValue={timesheet?.project_id ?? defaults?.project_id ?? ""} hint="Needed for project labour costs" />
        <SelectField name="site_id" label="Site" optional options={sites} placeholder="No site" defaultValue={timesheet?.site_id ?? defaults?.site_id ?? ""} />
      </FormRow>
      <FormRow cols={3}>
        <DateField name="work_date" label="Date" defaultValue={timesheet?.work_date ?? defaults?.work_date} required />
        <TextField name="start_time" label="Start" type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
        <TextField name="end_time" label="Finish" type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
      </FormRow>
      <FormRow cols={3}>
        <TextField name="break_minutes" label="Break (minutes)" type="number" min={0} max={599} value={breakMins} onChange={(e) => setBreakMins(e.target.value)} />
        <TextField name="overtime_hours" label="Overtime hours" type="number" min={0} max={24} step="0.25" defaultValue={timesheet?.overtime_hours ?? "0"} />
        <div className="sm:pt-7 text-sm text-muted-light">Hours worked: <span className="num-lining font-medium text-graphite">{hours.toFixed(2)}</span></div>
      </FormRow>
      <TextArea name="notes" label="Notes" optional defaultValue={timesheet?.notes ?? ""} rows={2} />
      <FormActions>
        <SubmitButton>{timesheet ? "Save" : "Log hours"}</SubmitButton>
        <ActionLink href={returnTo ?? "/dashboard/timesheets"}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}

export function RejectTimesheetForm({ id }: { id: string }) {
  return (
    <Form action={rejectTimesheet.bind(null, id)} className="flex flex-wrap items-end gap-3 space-y-0">
      <TextField name="rejection_note" label="Reason" required className="min-w-64 flex-1" placeholder="e.g. break not deducted" />
      <SubmitButton variant="danger">Return for correction</SubmitButton>
    </Form>
  );
}

export function LeaveForm({ leave, employees, returnTo, lockEmployee, defaults }: { leave?: Tables<"leave_requests"> | null; employees: Opt[]; returnTo?: string; lockEmployee?: string; defaults?: { employee_id?: string } }) {
  const [from, setFrom] = useState(leave?.start_date ?? "");
  const [to, setTo] = useState(leave?.end_date ?? "");
  const days = from && to && to >= from ? countWeekdays(from, to) : 0;
  return (
    <Form action={saveLeave.bind(null, leave?.id ?? null)}>
      {returnTo ? <Hidden name="return" value={returnTo} /> : null}
      {lockEmployee ? <Hidden name="employee_id" value={lockEmployee} /> : null}
      <FormRow cols={3}>
        {lockEmployee ? null : <SelectField name="employee_id" label="Employee" options={employees} defaultValue={leave?.employee_id ?? defaults?.employee_id ?? ""} required />}
        <SelectField name="leave_type" label="Type" options={LEAVE_TYPES} defaultValue={leave?.leave_type ?? "holiday"} />
        <DateField name="start_date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} required />
        <DateField name="end_date" label="To" value={to} onChange={(e) => setTo(e.target.value)} required />
      </FormRow>
      <FormRow>
        <TextField key={`d-${days}`} name="days" label="Days" type="number" min={0.5} step="0.5" defaultValue={leave?.days ?? (days || 1)} hint="Working days — adjust for half days" />
      </FormRow>
      <TextArea name="reason" label="Reason" optional defaultValue={leave?.reason ?? ""} rows={2} />
      <FormActions>
        <SubmitButton>{leave ? "Save request" : "Request leave"}</SubmitButton>
        <ActionLink href={returnTo ?? "/dashboard/leave"}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}

/** Mon–Fri between two ISO dates, inclusive. Bank holidays are not modelled. */
function countWeekdays(from: string, to: string) {
  let n = 0;
  for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) n++;
  }
  return n;
}
