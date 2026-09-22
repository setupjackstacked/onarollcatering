"use client";

import { Form, FormRow, TextField, SelectField, SubmitButton } from "../form";
import { inviteEmployee, resendEmployeeInvite, sendTestEmail } from "@/features/workforce/invite";
import { ROLE_LABEL, PRIMARY_ROLES, SECONDARY_ROLES } from "@/lib/auth/roles";

const opt = (r: string) => ({ value: r, label: ROLE_LABEL[r as keyof typeof ROLE_LABEL] ?? r });
const ROLE_OPTIONS = [...PRIMARY_ROLES.map(opt), ...SECONDARY_ROLES.map(opt), { value: "owner", label: ROLE_LABEL.owner }];

/**
 * Add an employee's email address and send them their welcome email. The role
 * is pre-selected from their job title but whoever sends it decides.
 */
export function EmployeeInviteForm({
  employeeId,
  suggestedRole,
  defaultEmail,
  canGrantOwner,
}: {
  employeeId: string;
  suggestedRole: string;
  defaultEmail?: string | null;
  canGrantOwner: boolean;
}) {
  const roles = canGrantOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value !== "owner");
  return (
    <Form action={inviteEmployee.bind(null, employeeId)}>
      <FormRow cols={2}>
        <TextField name="email" label="Email address" type="email" required defaultValue={defaultEmail ?? ""} hint="Where the welcome email goes" />
        <SelectField
          name="role"
          label="Access level"
          options={roles}
          defaultValue={suggestedRole}
          hint="Staff get the mobile portal; Managers run their site; Admins run everything"
        />
      </FormRow>
      <SubmitButton>Send welcome email</SubmitButton>
    </Form>
  );
}

/** Another password link for someone who never opened the first one. */
export function ResendInviteForm({ employeeId }: { employeeId: string }) {
  return (
    <Form action={resendEmployeeInvite.bind(null, employeeId)} className="space-y-3">
      <SubmitButton variant="outline">Send the link again</SubmitButton>
    </Form>
  );
}

/** Proves Resend is wired up. Sends to the signed-in admin, nobody else. */
export function TestEmailForm() {
  return (
    <Form action={sendTestEmail} className="space-y-3">
      <SubmitButton variant="outline">Send a test email to me</SubmitButton>
    </Form>
  );
}
