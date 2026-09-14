import { RelativeTime } from "./relative-time";
import { addNote, deleteNote } from "@/features/notes/actions";
import { Form, TextArea, SubmitButton, Hidden } from "./form";
import { ConfirmAction } from "./confirm";
import { Panel } from "./primitives";

export type NoteRow = { id: string; body: string; created_at: string; created_by: string | null; author?: { full_name: string | null; email: string | null } | null };

/** Internal notes on any entity. Server component; add form is a client Form. */
export function NotesPanel({ entityType, entityId, notes, canWrite, currentUserId, revalidate }: { entityType: string; entityId: string; notes: NoteRow[]; canWrite: boolean; currentUserId: string; revalidate: string }) {
  return (
    <Panel title="Notes">
      {canWrite ? (
        <Form action={addNote} className="mb-5">
          <Hidden name="entityType" value={entityType} />
          <Hidden name="entityId" value={entityId} />
          <Hidden name="revalidate" value={revalidate} />
          <TextArea name="body" label="Add a note" placeholder="Internal — not visible to the client" rows={3} />
          <SubmitButton variant="outline">Add note</SubmitButton>
        </Form>
      ) : null}
      {notes.length ? (
        <ul className="divide-y divide-graphite/10">
          {notes.map((n) => (
            <li key={n.id} className="py-3 first:pt-0 last:pb-0">
              <p className="whitespace-pre-wrap text-sm">{n.body}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-light">
                <span>{n.author?.full_name ?? n.author?.email ?? "Unknown"}</span>
                <RelativeTime value={n.created_at} />
                {canWrite && n.created_by === currentUserId ? (
                  <ConfirmAction action={deleteNote.bind(null, n.id, revalidate)} label="Delete" title="Delete this note?" confirmLabel="Delete" className="h-7 border-0 px-2 text-xs" />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-light">No notes yet.</p>
      )}
    </Panel>
  );
}
