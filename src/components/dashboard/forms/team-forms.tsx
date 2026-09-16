"use client";

import { Form, FormRow, TextField, SelectField, SubmitButton } from "../form";
import { inviteMember, changeMemberRole } from "@/features/team/actions";
import { ROLE_LABEL, PRIMARY_ROLES, SECONDARY_ROLES } from "@/lib/auth/roles";

const opt = (r: string) => ({ value: r, label: ROLE_LABEL[r as keyof typeof ROLE_LABEL] ?? r });
/** Admin, Manager, Staff first; the two specialist roles after them. */
export const ROLE_OPTIONS = [
  ...PRIMARY_ROLES.map(opt),
  ...SECONDARY_ROLES.map(opt),
  { value: "owner", label: ROLE_LABEL.owner },
];

export function InviteForm({ canGrantOwner }: { canGrantOwner: boolean }) {
  const roles = canGrantOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value !== "owner");
  return (
    <Form action={inviteMember}>
      <FormRow cols={3}>
        <TextField name="full_name" label="Name" optional />
        <TextField name="email" label="Email" type="email" required />
        <SelectField name="role" label="Role" options={roles} defaultValue="staff" hint="Staff get the mobile portal; Managers run their sites; Admins run everything" />
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
