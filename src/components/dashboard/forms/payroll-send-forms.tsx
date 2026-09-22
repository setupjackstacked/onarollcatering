"use client";

import { useState } from "react";
import { Form, FormRow, TextField, TextArea, SubmitButton } from "../form";
import { sendPayrollReport, savePayrollRecipient } from "@/features/payroll/reporting";

type Recipient = { id: string; name: string; email: string; role_note: string | null };

/**
 * Send the period to the saved payroll recipients.
 *
 * Every recipient is ticked by default — the usual case is "send it to
 * everyone who always gets it" — but each can be unticked, and the addresses
 * are shown in full rather than hidden behind a name, because this is pay data
 * and the person pressing Send should see exactly where it is going.
 */
export function SendPayrollForm({
  periodId,
  recipients,
  unapprovedSheets,
  unapprovedHours,
}: {
  periodId: string;
  recipients: Recipient[];
  unapprovedSheets: number;
  unapprovedHours: number;
}) {
  const [chosen, setChosen] = useState<string[]>(recipients.map((r) => r.email));

  const toggle = (email: string) =>
    setChosen((c) => (c.includes(email) ? c.filter((e) => e !== email) : [...c, email]));

  if (!recipients.length) {
    return (
      <p className="rounded-md bg-status-warning/10 px-4 py-3 text-sm">
        No payroll recipients saved yet. Add your payroll company or accountant in{" "}
        <a href="/dashboard/settings/payroll" className="underline">Settings → Payroll recipients</a> first.
      </p>
    );
  }

  return (
    <Form action={sendPayrollReport.bind(null, periodId)}>
      {unapprovedSheets > 0 ? (
        <p className="rounded-md bg-status-warning/10 px-4 py-3 text-sm">
          <strong>{unapprovedSheets} timesheet{unapprovedSheets === 1 ? "" : "s"}</strong> in this period
          {unapprovedSheets === 1 ? " is" : " are"} still unapproved — {unapprovedHours.toFixed(2)} hours are
          <strong> not</strong> in these figures. You can still send; the report says so on its face.
        </p>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Send to</legend>
        {recipients.map((r) => (
          <label
            key={r.id}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-graphite/15 bg-white/40 px-3 py-2.5 has-checked:border-copper"
          >
            <input
              type="checkbox"
              name="recipients[]"
              value={r.email}
              checked={chosen.includes(r.email)}
              onChange={() => toggle(r.email)}
              className="mt-1 size-4 accent-copper"
            />
            <span>
              <span className="block text-sm font-medium">{r.name}{r.role_note ? ` — ${r.role_note}` : ""}</span>
              <span className="block text-xs text-muted-light">{r.email}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <TextArea name="note" label="Note for the recipient" optional rows={2} hint="Appears in the email, not on the report" />

      <SubmitButton variant="copper" disabled={chosen.length === 0}>
        {chosen.length === 0 ? "Choose a recipient" : `Send to ${chosen.length} recipient${chosen.length === 1 ? "" : "s"}`}
      </SubmitButton>
    </Form>
  );
}

/** Who payroll reports go to. Finance only. */
export function PayrollRecipientForm() {
  return (
    <Form action={savePayrollRecipient}>
      <FormRow cols={3}>
        <TextField name="name" label="Name" required placeholder="Murphy & Co Payroll" />
        <TextField name="email" label="Email" type="email" required />
        <TextField name="role_note" label="Role" optional placeholder="Payroll bureau" />
      </FormRow>
      <SubmitButton>Add recipient</SubmitButton>
    </Form>
  );
}
