import Link from "next/link";
import { requireStaff } from "@/features/staff/queries";
import { listEmployeeRoles } from "@/features/workforce/queries";
import { signOut } from "@/features/auth/actions";
import { ContactDetailsForm } from "@/components/staff/forms";
import { EMPLOYMENT_TYPES } from "@/features/workforce/schema";
import { formatDateUK } from "@/lib/dates";

export const metadata = { title: "Profile" };

export default async function StaffProfilePage() {
  const { ctx, employee } = await requireStaff("/staff/profile");
  const roles = await listEmployeeRoles(ctx);
  const emg = (employee.emergency_contact ?? {}) as { name?: string; relationship?: string; phone?: string };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display display-sm">{employee.first_name} {employee.last_name}</h1>
        <p className="mt-1 text-sm text-muted-light num-lining">{employee.employee_number}</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-graphite/10 bg-white/50 p-4 text-sm">
        <div><dt className="text-xs text-muted-light">Role</dt><dd>{roles.find((r) => r.key === employee.role_key)?.label ?? employee.role_key}</dd></div>
        <div><dt className="text-xs text-muted-light">Employment</dt><dd>{EMPLOYMENT_TYPES.find((t) => t.value === employee.employment_type)?.label}</dd></div>
        <div><dt className="text-xs text-muted-light">Started</dt><dd>{employee.start_date ? formatDateUK(employee.start_date) : "—"}</dd></div>
        <div><dt className="text-xs text-muted-light">Email</dt><dd className="truncate">{employee.email ?? ctx.user.email}</dd></div>
      </dl>

      <section>
        <h2 className="font-display text-xl">Your contact details</h2>
        <p className="mb-4 mt-1 text-sm text-muted-light">Keep these current — your manager uses them if plans change on site. Anything else is maintained by the office.</p>
        <ContactDetailsForm phone={employee.phone} emergency={emg} />
      </section>

      <section className="border-t border-graphite/10 pt-5">
        {ctx.can("workforce.read") ? <p className="mb-4 text-sm"><Link href="/dashboard" className="underline">Open the management dashboard</Link></p> : null}
        <form action={signOut}>
          <button type="submit" className="h-12 w-full rounded-full border border-graphite/25 text-sm font-medium">Sign out</button>
        </form>
      </section>
    </div>
  );
}
