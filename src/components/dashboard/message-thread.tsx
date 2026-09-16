import { RelativeTime } from "./relative-time";
import { cn } from "@/lib/utils/cn";

type Message = {
  id: string; body: string; sender_id: string | null; created_at: string;
  document_id: string | null; documents?: unknown;
};

/** A conversation, oldest first, with the reader's own messages on the right. */
export function MessageThread({ messages, currentUserId, nameFor }: {
  messages: Message[]; currentUserId: string; nameFor: (userId: string | null) => string;
}) {
  if (!messages.length) {
    return <p className="rounded-lg border border-dashed border-graphite/20 px-4 py-10 text-center text-sm text-muted-light">No messages yet. Say something.</p>;
  }
  return (
    <ol className="space-y-3">
      {messages.map((m, i) => {
        const mine = m.sender_id === currentUserId;
        // First message of a calendar day gets a date separator.
        const newDay = i === 0 || m.created_at.slice(0, 10) !== messages[i - 1].created_at.slice(0, 10);
        const doc = m.documents as { id: string; name: string } | null;
        return (
          <li key={m.id}>
            {newDay ? (
              <p className="my-4 text-center text-xs text-muted-light">
                <RelativeTime value={m.created_at} />
              </p>
            ) : null}
            <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[70%]",
                mine ? "bg-obsidian text-ivory" : "bg-white/70 border border-graphite/10")}>
                {!mine ? <p className="mb-0.5 text-xs font-medium text-copper-dark">{nameFor(m.sender_id)}</p> : null}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                {doc ? (
                  <a href={`/api/documents/${doc.id}`} className={cn("mt-2 block text-xs underline", mine ? "text-ivory/80" : "")}>
                    {doc.name}
                  </a>
                ) : null}
                <p className={cn("mt-1 text-[0.6875rem]", mine ? "text-ivory/60" : "text-muted-light")}>
                  {m.created_at.slice(11, 16)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
