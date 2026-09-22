import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { removePayrollRecipient } from "@/features/payroll/reporting";
import { PageHeader, Panel, StatusBadge } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { PayrollRecipientForm } from "@/components/dashboard/forms/payroll-send-forms";

export const metadata = { title: "Payroll recipients" };

/**
 * Who payroll reports are sent to. Saved once, ticked each week — a retyped
 * address is one typo away from pay data reaching a stranger, and that cannot
 * be recalled.
 */
export default async function PayrollRecipientsPage() {
  const ctx = await requireOrgContext("/dashboard/settings/payroll");
  if (!ctx.can("finance.write")) redirect("/dashboard/settings");

  const { data: recipients } = await ctx.supabase
    .from("payroll_recipients")
    .select("id, name, email, role_note, active")
    .eq("organisation_id", ctx.organisation.id)
    .order("name");

  const active = (recipients ?? []).filter((r) => r.active);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Payroll recipients"
        description="The payroll company and accountant who receive the weekly hours report."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Add a recipient">
          <p className="mb-4 text-sm text-muted-light">
            Reports can only be sent to an address saved here. Check it carefully — a payroll report carries pay
            rates and gross pay for every employee.
          </p>
          <PayrollRecipientForm />
        </Panel>

        <Panel title="Receiving reports">
          {active.length ? (
            <ul className="divide-y divide-graphite/10">
              {active.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.name}</span>
                    <span className="block truncate text-xs text-muted-light">{r.email}</span>
                  </span>
                  {r.role_note ? <StatusBadge label={r.role_note} tone="grey" /> : null}
                  <ConfirmAction
                    action={removePayrollRecipient.bind(null, r.id)}
                    label="Remove"
                    title={`Stop sending payroll to ${r.name}?`}
                    description="They stop receiving future reports. Reports already sent to them stay in the history."
                    confirmLabel="Remove"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-light">
              Nobody yet. Until a recipient is saved, payroll reports can be downloaded but not emailed.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
