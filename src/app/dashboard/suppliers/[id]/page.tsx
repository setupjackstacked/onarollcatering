import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getSupplier, listSupplierContacts, supplierSpend, listEquipment } from "@/features/suppliers/queries";
import { archiveSupplier, archiveSupplierContact } from "@/features/suppliers/actions";
import { listExpenses } from "@/features/expenses/queries";
import { categoryLabel } from "@/features/expenses/schema";
import { supplierCategoryLabel } from "@/features/suppliers/schema";
import { documentCategories } from "@/features/documents/queries";
import { listEntityDocuments } from "@/features/documents/queries";
import { EntityHeader, DescriptionList, ActionLink } from "@/components/dashboard/entity";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { DataTable } from "@/components/dashboard/data-table";
import { DocumentsPanel } from "@/components/dashboard/documents";
import { SupplierContactForm } from "@/components/dashboard/forms/supplier-forms";
import { ExpenseBadge } from "@/lib/domain/badges";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { formatAddress, type Address } from "@/lib/domain/address";

export default async function SupplierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/suppliers/${id}`);
  if (!ctx.can("projects.read")) redirect("/dashboard");
  const supplier = await getSupplier(ctx, id);
  if (!supplier) notFound();
  const sp = await searchParams;
  const canWrite = ctx.can("finance.write");
  const canSeeCosts = ctx.can("finance.read");
  const [contacts, spend, equipment, expenses, docs, categories] = await Promise.all([
    listSupplierContacts(ctx, id),
    canSeeCosts ? supplierSpend(ctx, id) : Promise.resolve({ committed: "0", actual: "0", count: 0 }),
    listEquipment(ctx, {}, { supplierId: id }),
    canSeeCosts ? listExpenses(ctx, sp, { supplierId: id }) : Promise.resolve({ rows: [], total: 0, page: 1, size: 25 }),
    listEntityDocuments(ctx, "supplier", id), documentCategories(ctx, "supplier"),
  ]);
  const path = `/dashboard/suppliers/${id}`;
  return (
    <>
      <EntityHeader back={{ href: "/dashboard/suppliers", label: "Suppliers" }} eyebrow={supplierCategoryLabel(supplier.category)} title={supplier.name}
        meta={<>{supplier.email ? <span>{supplier.email}</span> : null}{supplier.phone ? <span>{supplier.phone}</span> : null}<span>{supplier.payment_terms_days}-day terms</span>{supplier.website ? <a href={supplier.website} target="_blank" rel="noreferrer" className="underline">Website</a> : null}</>}
        actions={canWrite ? <>
          <ActionLink href={`${path}/edit`} variant="obsidian">Edit</ActionLink>
          <ConfirmAction action={archiveSupplier.bind(null, id)} label="Archive" title="Archive this supplier?" description="Costs and equipment keep pointing at them; they’re hidden from lists." confirmLabel="Archive" />
        </> : null} />

      {canSeeCosts ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Actual spend (net)" value={formatMoney(toPence(spend.actual), { showPence: false })} />
          <Metric label="Committed (net)" value={formatMoney(toPence(spend.committed), { showPence: false })} />
          <Metric label="Cost records" value={spend.count} />
          <Metric label="Equipment lines" value={equipment.total} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Details">
            <DescriptionList cols={2} items={[
              { label: "Category", value: supplierCategoryLabel(supplier.category) },
              { label: "VAT number", value: supplier.vat_number }, { label: "Our account number", value: supplier.account_number },
              { label: "Address", value: formatAddress(supplier.address as Address) || null }, { label: "Notes", value: supplier.notes },
            ]} />
          </Panel>

          {equipment.rows.length ? (
            <Panel title="Equipment" action={canWrite ? <ActionLink href={`/dashboard/equipment/new?supplier=${id}`} className="h-8 px-3 text-xs">Add item</ActionLink> : undefined}>
              <DataTable rows={equipment.rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/equipment/${r.id}`}
                columns={[
                  { key: "n", header: "Item", render: (r) => <span>{r.name}{r.supplier_sku ? <span className="block text-xs text-muted-light">SKU {r.supplier_sku}</span> : null}</span> },
                  ...(canSeeCosts ? [{ key: "c", header: "Cost", align: "right" as const, render: (r: typeof equipment.rows[number]) => formatMoney(toPence(r.cost_price)) }] : []),
                  { key: "s", header: "Sell", align: "right", render: (r) => formatMoney(toPence(r.sell_price)) },
                ]}
                empty={{ title: "No equipment" }} />
            </Panel>
          ) : null}

          {canSeeCosts ? (
            <Panel title="Costs" action={canWrite ? <ActionLink href={`/dashboard/expenses/new?return=${encodeURIComponent(path)}`} className="h-8 px-3 text-xs">Record cost</ActionLink> : undefined}>
              <DataTable rows={expenses.rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/expenses/${r.id}`}
                columns={[
                  { key: "d", header: "Date", render: (r) => formatDateUK(r.expense_date) },
                  { key: "desc", header: "Description", render: (r) => r.description },
                  { key: "p", header: "Project", render: (r) => (r.projects as unknown as { name: string } | null)?.name ?? <span className="text-muted-light">Overhead</span> },
                  { key: "c", header: "Category", render: (r) => categoryLabel(r.category) },
                  { key: "s", header: "Status", render: (r) => <ExpenseBadge status={r.status} /> },
                  { key: "n", header: "Net", align: "right", render: (r) => formatMoney(toPence(r.net)) },
                ]}
                empty={{ title: "No costs recorded against this supplier" }} />
            </Panel>
          ) : null}

          <Panel title="Documents">
            <DocumentsPanel entityType="supplier" entityId={id} documents={docs} categories={categories} canWrite={canWrite} revalidate={path} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={`Contacts (${contacts.length})`}>
            {contacts.length ? (
              <ul className="divide-y divide-graphite/10 text-sm">
                {contacts.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-2 py-2 first:pt-0">
                    <span>
                      <span className="font-medium">{c.first_name} {c.last_name}</span>{c.is_primary ? <span className="ml-2 rounded-full bg-copper/15 px-2 py-0.5 text-xs text-copper-dark">Main</span> : null}
                      <span className="block text-xs text-muted-light">{[c.job_title, c.email, c.phone].filter(Boolean).join(" · ")}</span>
                    </span>
                    {canWrite ? <ConfirmAction action={archiveSupplierContact.bind(null, c.id, id)} label="Remove" title={`Remove ${c.first_name}?`} confirmLabel="Remove" className="h-8 px-3 text-xs" /> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-light">No contacts yet.</p>}
            {canWrite ? <div className="mt-4 border-t border-graphite/10 pt-4"><SupplierContactForm supplierId={id} /></div> : null}
          </Panel>
          <Panel title="Quotations">
            <p className="text-sm text-muted-light">Equipment published to the catalogue appears in the quotation line picker. <Link href="/dashboard/equipment" className="underline">Open the equipment catalogue</Link>.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
