import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "./primitives";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  /** Hide on the mobile card (e.g. when it's the card title already). */
  hideOnCard?: boolean;
  align?: "left" | "right";
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  /** Card layout for < md. Defaults to first column as title + rest as key/value. */
  card?: (row: T) => React.ReactNode;
  empty: { title: string; description?: string; action?: { label: string; href: string } };
  pagination?: { page: number; size: number; total: number; hrefFor: (page: number) => string };
};

/**
 * Responsive record list: real <table> at md+, stacked cards below.
 * Server component — no client JS.
 */
export function DataTable<T>({ rows, columns, rowKey, rowHref, card, empty, pagination }: Props<T>) {
  if (!rows.length) return <EmptyState {...empty} />;
  const pages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.size)) : 1;

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-graphite/10 bg-white/40 md:block">
        <table className="w-full text-sm">
          <thead className="bg-graphite/[0.03] text-left text-xs uppercase tracking-wider text-muted-light">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn("px-4 py-3 font-medium", c.align === "right" && "text-right", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite/10">
            {rows.map((row) => (
              <tr key={rowKey(row)} className={cn("group", rowHref && "hover:bg-copper/5")}>
                {columns.map((c, i) => (
                  <td key={c.key} className={cn("px-4 py-3 align-top", c.align === "right" && "text-right num-lining", c.className)}>
                    {i === 0 && rowHref ? (
                      <Link href={rowHref(row)} className="font-medium text-graphite underline-offset-4 group-hover:underline">
                        {c.render(row)}
                      </Link>
                    ) : (
                      c.render(row)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => {
          const body = card ? (
            card(row)
          ) : (
            <>
              <p className="text-[0.9375rem] font-medium">{columns[0]!.render(row)}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {columns.slice(1).filter((c) => !c.hideOnCard).map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-xs text-muted-light">{c.header}</dt>
                    <dd className="truncate">{c.render(row)}</dd>
                  </div>
                ))}
              </dl>
            </>
          );
          const cls = "block rounded-lg border border-graphite/10 bg-white/40 p-4";
          return (
            <li key={rowKey(row)}>
              {rowHref ? (
                <Link href={rowHref(row)} className={cn(cls, "active:bg-copper/5")}>
                  {body}
                </Link>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {pagination && pages > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm text-muted-light" aria-label="Pagination">
          <span>
            {pagination.total} record{pagination.total === 1 ? "" : "s"} · page {pagination.page} of {pages}
          </span>
          <span className="flex gap-1">
            <PageLink href={pagination.hrefFor(pagination.page - 1)} disabled={pagination.page <= 1} label="Previous">
              <ChevronLeft className="size-4" />
            </PageLink>
            <PageLink href={pagination.hrefFor(pagination.page + 1)} disabled={pagination.page >= pages} label="Next">
              <ChevronRight className="size-4" />
            </PageLink>
          </span>
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  const cls = "inline-flex size-10 items-center justify-center rounded-full border border-graphite/15";
  return disabled ? (
    <span className={cn(cls, "opacity-40")} aria-disabled>
      {children}
    </span>
  ) : (
    <Link href={href} aria-label={label} className={cn(cls, "hover:border-graphite")}>
      {children}
    </Link>
  );
}
