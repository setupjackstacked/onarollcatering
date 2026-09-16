import { FileText, Banknote, ArrowRight, MessageSquare, Package } from "lucide-react";
import { stageLabel } from "@/features/invoices/schema";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";

type Event = {
  id: string; action: string; from_stage: string | null; to_stage: string | null;
  note: string | null; amount: string | null; user_id: string | null; created_at: string;
  documents?: unknown;
};

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  stage_changed: ArrowRight, document_added: FileText, payment_recorded: Banknote, note: MessageSquare, pack_generated: Package,
};

/**
 * The case history: who did what, when. Append-only in the database — this is
 * the record of how a payment was agreed, so nothing here can be edited away.
 */
export function InvoiceTimeline({ events, nameFor }: { events: Event[]; nameFor: (userId: string | null) => string }) {
  if (!events.length) return <p className="text-sm text-muted-light">Nothing has happened on this invoice yet.</p>;

  return (
    <ol className="space-y-4">
      {events.map((e) => {
        const Icon = ICON[e.action] ?? MessageSquare;
        const doc = e.documents as { id: string; name: string } | null;
        return (
          <li key={e.id} className="flex gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-graphite/8">
              <Icon className="size-4 text-graphite" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {e.action === "stage_changed" ? (
                  <>
                    {e.from_stage ? <span className="text-muted-light">{stageLabel(e.from_stage)} → </span> : null}
                    <span className="font-medium">{stageLabel(e.to_stage ?? "")}</span>
                  </>
                ) : e.action === "payment_recorded" ? (
                  <><span className="font-medium">Payment received</span>{e.amount ? <span className="num-lining"> — {formatMoney(toPence(e.amount))}</span> : null}</>
                ) : e.action === "document_added" ? (
                  <span className="font-medium">Document added</span>
                ) : e.action === "pack_generated" ? (
                  <span className="font-medium">Final payment pack generated</span>
                ) : (
                  <span className="font-medium">Note</span>
                )}
              </p>
              {e.note ? <p className="text-sm text-muted-light">{e.note}</p> : null}
              {doc ? <p className="text-sm"><a href={`/api/documents/${doc.id}`} className="underline">{doc.name}</a></p> : null}
              <p className="mt-0.5 text-xs text-muted-light">
                {formatDateUK(e.created_at, true)} · {nameFor(e.user_id)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
