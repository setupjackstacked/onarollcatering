import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getEnquiry } from "@/features/enquiries/queries";
import { setEnquiryStatus } from "@/features/enquiries/crm-actions";
import { listMembers, memberOptions } from "@/features/shared/members";
import { EntityHeader, DescriptionList } from "@/components/dashboard/entity";
import { Panel } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { ConvertEnquiryForm } from "@/components/dashboard/forms/status-forms";
import { EnquiryBadge } from "@/lib/domain/badges";
import { formatDateUK } from "@/lib/dates";
import { SERVICE_OPTIONS } from "@/lib/validation/enquiry";

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/enquiries/${id}`);
  if (!ctx.can("sales.read")) redirect("/dashboard");
  const e = await getEnquiry(ctx, id);
  if (!e) notFound();
  const members = memberOptions(await listMembers(ctx));
  const svc = (k: string) => SERVICE_OPTIONS.find((o) => o.value === k)?.label ?? k;
  const cat = (e.catering_details ?? {}) as Record<string, unknown>;
  const kit = (e.kitchen_details ?? {}) as Record<string, unknown>;
  const attachments = (e.attachments as { name: string; size: number }[]) ?? [];
  const yn = (v: unknown) => (v === true ? "Yes" : v === false ? "No" : typeof v === "string" && v ? v : null);

  return (
    <>
      <EntityHeader
        back={{ href: "/dashboard/enquiries", label: "Enquiries" }}
        eyebrow={`Enquiry · ${formatDateUK(e.created_at, true)}`}
        title={e.project_name}
        badge={<EnquiryBadge status={e.status} />}
        meta={<><span>{e.company_name}</span><span>{e.contact_name}</span><span>{e.location}</span></>}
        actions={
          ctx.can("sales.write") && e.status !== "converted" ? (
            <>
              {e.status === "new" ? <ConfirmAction action={setEnquiryStatus.bind(null, e.id, "reviewed")} label="Mark reviewed" title="Mark as reviewed?" variant="outline" confirmLabel="Mark reviewed" /> : null}
              <ConfirmAction action={setEnquiryStatus.bind(null, e.id, "spam")} label="Spam" title="Mark as spam?" description="It will be hidden from the inbox." confirmLabel="Mark spam" />
              <ConfirmAction action={setEnquiryStatus.bind(null, e.id, "archived")} label="Archive" title="Archive this enquiry?" variant="outline" confirmLabel="Archive" />
            </>
          ) : null
        }
      />

      {e.lead_id ? (
        <p className="mb-6 rounded-md bg-status-success/10 px-4 py-3 text-sm text-status-success">
          Converted — <Link href={`/dashboard/leads/${e.lead_id}`} className="underline">open the lead</Link>.
        </p>
      ) : ctx.can("sales.write") ? (
        <Panel title="Convert" className="mb-6">
          <p className="mb-4 text-sm text-muted-light">Creates a lead, and a client + contact if they don’t already exist (matched by company name or contact email). Attachments carry across.</p>
          <ConvertEnquiryForm id={e.id} members={members} />
        </Panel>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Project">
            <DescriptionList items={[
              { label: "Project", value: e.project_name }, { label: "Location", value: e.location },
              { label: "Required start", value: e.required_start_date ? formatDateUK(e.required_start_date) : null }, { label: "Expected duration", value: e.expected_duration },
              { label: "Services", value: e.services.map(svc).join(", ") },
            ]} />
            <p className="mt-5 whitespace-pre-wrap border-t border-graphite/10 pt-4 text-sm">{e.description}</p>
          </Panel>
          {Object.keys(cat).length ? (
            <Panel title="Catering requirements">
              <DescriptionList cols={3} items={[
                { label: "Diners / workforce", value: yn(cat.estimatedDiners) }, { label: "Meals per day", value: yn(cat.mealsPerDay) },
                { label: "Meals", value: ["breakfast", "lunch", "dinner"].filter((k) => cat[k]).join(", ") || null },
                { label: "7-day service", value: yn(cat.sevenDay) }, { label: "Operating hours", value: yn(cat.operatingHours) }, { label: "Contract duration", value: yn(cat.contractDuration) },
                { label: "Existing kitchen", value: yn(cat.existingKitchen) }, { label: "Temporary facility", value: yn(cat.temporaryFacility) },
              ]} />
            </Panel>
          ) : null}
          {Object.keys(kit).length ? (
            <Panel title="Kitchen requirements">
              <DescriptionList cols={3} items={[
                { label: "Type", value: Array.isArray(kit.kitchenType) ? (kit.kitchenType as string[]).join(", ") : null }, { label: "Approx. size", value: yn(kit.approximateSize) },
                { label: "Throughput", value: yn(kit.requiredThroughput) }, { label: "Completion date", value: typeof kit.requiredCompletionDate === "string" && kit.requiredCompletionDate ? formatDateUK(kit.requiredCompletionDate) : null },
                { label: "Existing drawings", value: yn(kit.existingDrawings) }, { label: "Existing equipment", value: yn(kit.existingEquipment) },
              ]} />
            </Panel>
          ) : null}
        </div>
        <div className="space-y-6">
          <Panel title="Contact">
            <DescriptionList cols={1} items={[
              { label: "Company", value: e.company_name }, { label: "Name", value: e.contact_name }, { label: "Job title", value: e.job_title },
              { label: "Email", value: <a href={`mailto:${e.email}`} className="underline">{e.email}</a> }, { label: "Phone", value: <a href={`tel:${e.phone}`} className="underline">{e.phone}</a> },
            ]} />
          </Panel>
          <Panel title={`Attachments (${attachments.length})`}>
            {attachments.length ? (
              <ul className="space-y-2 text-sm">{attachments.map((a, i) => <li key={i}>{a.name} <span className="text-muted-light">· {(a.size / 1024 / 1024).toFixed(1)} MB</span></li>)}</ul>
            ) : <p className="text-sm text-muted-light">None</p>}
            {attachments.length && !e.lead_id ? <p className="mt-3 text-xs text-muted-light">Files become downloadable once the enquiry is converted to a lead.</p> : null}
          </Panel>
        </div>
      </div>
    </>
  );
}
