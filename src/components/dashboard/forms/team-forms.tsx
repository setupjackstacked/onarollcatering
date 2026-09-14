"use client";

import { Form, FormRow, TextField, SelectField, SubmitButton } from "../form";
import { inviteMember, changeMemberRole } from "@/features/team/actions";

export const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "administrator", label: "Administrator" },
  { value: "finance", label: "Finance" },
  { value: "project_manager", label: "Project Manager" },
  { value: "staff", label: "Staff (portal only)" },
  { value: "read_only", label: "Read only" },
];

export function InviteForm({ canGrantOwner }: { canGrantOwner: boolean }) {
  const roles = canGrantOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value !== "owner");
  return (
    <Form action={inviteMember}>
      <FormRow cols={3}>
        <TextField name="full_name" label="Name" optional />
        <TextField name="email" label="Email" type="email" required />
        <SelectField name="role" label="Role" options={roles} defaultValue="project_manager" />
      </FormRow>
      <SubmitButton>Send invitation</SubmitButton>
    </Form>
  );
}

export function RoleForm({ memberId, role, canGrantOwner }: { memberId: string; role: string; canGrantOwner: boolean }) {
  const roles = canGrantOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value !== "owner");
  return (
    <Form action={changeMemberRole.bind(null, memberId)} className="flex items-end gap-2 space-y-0">
      <SelectField name="role" label="Role" options={roles} defaultValue={role} className="min-w-40" />
      <SubmitButton variant="outline" className="h-11">Update</SubmitButton>
    </Form>
  );
}
