import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getPayPeriod, listPayrollEntries, payPeriodTotals, unbuiltTimesheetCount } from "@/features/payroll/queries";
import { buildPeriod, finalisePeriod, reopenPeriod, deletePayPeriod, deleteAdjustment, markExported } from "@/features/payroll/actions";
import { employeeMap } from "@/features/workforce/queries";
import { PAY_PERIOD_STATUSES, ADJUSTMENT_KINDS, DEFAULT_OVERTIME_MULTIPLIER } from "@/features/payroll/schema";
import { EntityHeader, ActionLink, DescriptionList } from "@/components/dashboard/entity";
import { Panel, Metric, StatusBadge } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { RedirectingAction } from "@/components/dashboard/redirecting-action";
import { AdjustmentForm, PayPeriodForm } from "@/components/dashboard/forms/payroll-forms";
import { SendPayrollForm } from "@/components/dashboard/forms/payroll-send-forms";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";

const TONE: Record<string, "grey" | "amber" | "green" | "copper"> = { draft: "grey", review: "amber", finalised: "green", exported: "copper" };

export default async function PayPeriodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/payroll/${id}`);
  if (!ctx.can("finance.read")) redirect("/dashboard");
  const period = await getPayPeriod(ctx, id);
  if (!period) notFound();
  const [entries, totals, unbuilt, emap, { data: unapprovedRows }, { data: recipients }, { data: sends }] = await Promise.all([
    listPayrollEntries(ctx, id), payPeriodTotals(ctx, id), unbuiltTimesheetCount(ctx, period), employeeMap(ctx),
    ctx.supabase.rpc("payroll_unapproved", { p_period_id: id }),
    ctx.supabase.from("payroll_recipients").select("id, name, email, role_note").eq("organisation_id", ctx.organisation.id).eq("active", true).order("name"),
    ctx.supabase.from("payroll_sends").select("id, recipients, created_at, employee_count, total_hours, total_gross, unapproved_count, note").eq("pay_period_id", id).order("created_at", { ascending: false }),
  ]);
  const unapproved = (unapprovedRows ?? []) as unknown as { employee_name: string; sheets: number; hours: string }[];
  const unapprovedSheets = unapproved.reduce((a, u) => a + Number(u.sheets), 0);
  const unapprovedHours = unapproved.reduce((a, u) => a + Number(u.hours), 0);
  const canWrite = ctx.can("finance.write");
  const locked = period.status === "finalised" || period.status === "exported";
  return (
    <>
      <EntityHeader back={{ href: "/dashboard/payroll", label: "Payroll" }} eyebrow={`${formatDateUK(period.start_date)} – ${formatDateUK(period.end_date)}`} title={period.name}
        badge={<StatusBadge label={PAY_PERIOD_STATUSES.find((s) => s.value === period.status)?.label ?? period.status} tone={TONE[period.status] ?? "grey"} />}
        meta={<>{period.pay_date ? <span>Pay date {formatDateUK(period.pay_date)}</span> : null}{period.finalised_at ? <span>Finalised {formatDateUK(period.finalised_at, true)}</span> : null}</>}
        actions={<>
          {entries.length ? <ActionLink href={`/dashboard/payroll/${id}/export`}>Download CSV</ActionLink> : null}
          {canWrite && !locked ? <RedirectingAction action={buildPeriod.bind(null, id)} label={entries.length ? "Rebuild from timesheets" : "Build from timesheets"} variant="copper" /> : null}
          {canWrite && !locked && entries.length ? <ConfirmAction action={finalisePeriod.bind(null, id)} label="Finalise" title="Finalise this pay period?" description="Included timesheets are marked paid and locked. You can reopen it if something needs correcting." variant="outline" confirmLabel="Finalise" /> : null}
          {ctx.can("org.manage") && locked ? <ConfirmAction action={reopenPeriod.bind(null, id)} label="Reopen" title="Reopen this pay period?" description="Timesheets return to approved so they can be corrected and rebuilt." confirmLabel="Reopen" /> : null}
          {canWrite && !locked ? <ConfirmAction action={deletePayPeriod.bind(null, id)} label="Delete" title="Delete this pay period?" description="Entries and adjustments are deleted. Timesheets are not affected." confirmLabel="Delete" /> : null}
        </>} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric label="Employees" value={totals.employees} />
        <Metric label="Standard hours" value={totals.hours.toFixed(2)} />
        <Metric label="Overtime hours" value={totals.overtime.toFixed(2)} hint={`at ${DEFAULT_OVERTIME_MULTIPLIER}×`} />
        <Metric label="Gross pay" value={formatMoney(totals.gross, { showPence: false })} hint="Before PAYE, NI and pension" />
        <Metric label="Reimbursements" value={formatMoney(totals.expenses, { showPence: false })} hint="Paid separately, not taxable" />
      </div>

      {unbuilt > 0 && !locked ? (
        <p className="mb-6 rounded-md bg-status-warning/10 px-4 py-3 text-sm">{unbuilt} approved timesheet{unbuilt === 1 ? "" : "s"} in this period {unbuilt === 1 ? "is" : "are"} not included yet — build the period to pick {unbuilt === 1 ? "it" : "them"} up.</p>
      ) : null}

      <div className="space-y-6">
        <Panel title={`Pay entries (${entries.length})`}>
          {entries.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-light">
                  <tr><th className="py-2 pr-3 font-medium">Employee</th><th className="py-2 pr-3 text-right font-medium">Hours</th><th className="py-2 pr-3 text-right font-medium">Rate</th><th className="py-2 pr-3 text-right font-medium">Overtime</th><th className="py-2 pr-3 text-right font-medium">Adjustments</th><th className="py-2 pr-3 text-right font-medium">Gross</th><th className="py-2 text-right font-medium">Expenses</th></tr>
                </thead>
                <tbody className="divide-y divide-graphite/10">
                  {entries.map((e) => {
                    const adjustments = (e.payroll_adjustments ?? []) as unknown as { id: string; kind: string; label: string; amount: string }[];
                    return (
                      <tr key={e.id} className="align-top">
                        <td className="py-2 pr-3">
                          {emap.get(e.employee_id)?.full_name ?? "Employee"}
                          <span className="block text-xs text-muted-light">{e.timesheet_count} timesheet{e.timesheet_count === 1 ? "" : "s"}</span>
                          {adjustments.length ? (
                            <ul className="mt-1 space-y-0.5 text-xs text-muted-light">
                              {adjustments.map((a) => (
                                <li key={a.id} className="flex items-center gap-2">
                                  <span>{ADJUSTMENT_KINDS.find((k) => k.value === a.kind)?.label ?? a.kind}: {a.label} {formatMoney(toPence(a.amount))}</span>
                                  {canWrite && !locked ? <ConfirmAction action={deleteAdjustment.bind(null, a.id, id)} label="Remove" title="Remove this adjustment?" confirmLabel="Remove" className="h-6 px-2 text-[0.6875rem]" /> : null}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {canWrite && !locked ? <div className="mt-2"><AdjustmentForm entryId={e.id} /></div> : null}
                        </td>
                        <td className="py-2 pr-3 text-right num-lining">{Number(e.standard_hours).toFixed(2)}</td>
                        <td className="py-2 pr-3 text-right num-lining">{formatMoney(toPence(e.hourly_rate))}</td>
                        <td className="py-2 pr-3 text-right num-lining">{Number(e.overtime_hours).toFixed(2)}{Number(e.overtime_hours) > 0 ? <span className="block text-xs text-muted-light">{formatMoney(toPence(e.overtime_pay))}</span> : null}</td>
                        <td className="py-2 pr-3 text-right num-lining">{formatMoney(toPence(e.adjustments))}</td>
                        <td className="py-2 pr-3 text-right num-lining font-medium">{formatMoney(toPence(e.gross_pay))}</td>
                        <td className="py-2 text-right num-lining text-muted-light">{formatMoney(toPence(e.expenses))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-light">No entries yet. {canWrite ? "Build the period to pull in every approved timesheet dated inside it." : "Finance can build this period from approved timesheets."}</p>
          )}
        </Panel>

        {entries.length && canWrite ? (
          <Panel title="Send to payroll">
            <p className="mb-4 text-sm text-muted-light">
              A PDF of every employee&rsquo;s hours, rates and gross pay, grouped by site. Check it first — what you
              download here is byte-for-byte what the recipient receives.
            </p>
            <div className="mb-5 flex flex-wrap gap-2">
              <ActionLink href={`/dashboard/payroll/${id}/report`} variant="copper">Download PDF</ActionLink>
              <ActionLink href={`/dashboard/payroll/${id}/export`}>Download CSV</ActionLink>
              {period.status === "finalised" ? (
                <ConfirmAction action={markExported.bind(null, id)} label="Mark exported" title="Mark this period as exported?" description="Use this if you sent it by some other route. Emailing it from here marks it automatically." variant="outline" confirmLabel="Mark exported" />
              ) : null}
            </div>
            <SendPayrollForm
              periodId={id}
              recipients={(recipients ?? []).map((r) => ({ id: r.id, name: r.name, email: r.email, role_note: r.role_note }))}
              unapprovedSheets={unapprovedSheets}
              unapprovedHours={unapprovedHours}
            />
          </Panel>
        ) : null}

        {unapproved.length && canWrite ? (
          <Panel title={`Not included — ${unapprovedSheets} unapproved timesheet${unapprovedSheets === 1 ? "" : "s"}`}>
            <p className="mb-3 text-sm text-muted-light">
              These hours fall inside the period but nobody has approved them, so they are in no figure on this page.
              Approve them and rebuild, or send without them — the report states the exclusion either way.
            </p>
            <ul className="divide-y divide-graphite/10 text-sm">
              {unapproved.map((u, i) => (
                <li key={i} className="flex items-center justify-between py-2">
                  <span>{u.employee_name}</span>
                  <span className="num-lining text-muted-light">{Number(u.hours).toFixed(2)} hrs · {u.sheets} sheet(s)</span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {sends?.length ? (
          <Panel title="Already sent">
            <ul className="divide-y divide-graphite/10 text-sm">
              {sends.map((sd) => (
                <li key={sd.id} className="py-3 first:pt-0 last:pb-0">
                  <span className="block">{formatDateUK(sd.created_at, true)} — {sd.recipients.join(", ")}</span>
                  <span className="block text-xs text-muted-light num-lining">
                    {sd.employee_count} employees · {Number(sd.total_hours).toFixed(2)} hrs · {formatMoney(toPence(sd.total_gross))} gross
                    {sd.unapproved_count ? ` · ${sd.unapproved_count} unapproved excluded` : ""}
                  </span>
                  {sd.note ? <span className="block text-xs text-muted-light">&ldquo;{sd.note}&rdquo;</span> : null}
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {canWrite && !locked ? (
          <Panel title="Period details"><div className="max-w-3xl"><PayPeriodForm period={period} /></div></Panel>
        ) : (
          <Panel title="Period details">
            <DescriptionList cols={3} items={[{ label: "From", value: formatDateUK(period.start_date) }, { label: "To", value: formatDateUK(period.end_date) }, { label: "Pay date", value: period.pay_date ? formatDateUK(period.pay_date) : null }, { label: "Notes", value: period.notes }]} />
          </Panel>
        )}
      </div>
    </>
  );
}
