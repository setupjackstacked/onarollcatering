"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { DOC_ACCEPT, DOC_MAX_BYTES } from "@/features/documents/shared";
import { archiveDocument } from "@/features/documents/actions";
import { formatDateUK } from "@/lib/dates";
import { ConfirmAction } from "./confirm";
import { cn } from "@/lib/utils/cn";

type Doc = { id: string; name: string; category_key: string; mime_type: string; size_bytes: number; expiry_date: string | null; created_at: string };

export function DocumentsPanel({
  entityType, entityId, documents, categories, canWrite, revalidate, showExpiry,
}: { entityType: string; entityId: string; documents: Doc[]; categories: { key: string; label: string }[]; canWrite: boolean; revalidate: string; showExpiry?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(categories[0]?.key ?? "other");
  const [expiry, setExpiry] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", entityType);
      fd.append("entityId", entityId);
      fd.append("category", category);
      if (expiry) fd.append("expiryDate", expiry);
      const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(`${file.name}: ${j.error ?? "upload failed"}`);
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  };

  const label = (k: string) => categories.find((c) => c.key === k)?.label ?? k;
  const expired = (d: Doc) => d.expiry_date && d.expiry_date < new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {canWrite ? (
        <div className="rounded-lg border border-graphite/10 bg-white/40 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted-light">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-graphite/20 bg-white/70 px-2 text-sm">
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </label>
            {showExpiry ? (
              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted-light">Expiry date (optional)</span>
                <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="h-10 w-full rounded-md border border-graphite/20 bg-white/70 px-2 text-sm" />
              </label>
            ) : null}
            <label
              className={cn("flex h-10 cursor-pointer items-center justify-center gap-2 self-end rounded-full border border-dashed border-graphite/30 px-4 text-sm hover:border-copper", busy && "opacity-60")}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); void upload(e.dataTransfer.files); }}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4 text-copper-dark" />}
              {busy ? "Uploading…" : "Upload files"}
              <input ref={inputRef} type="file" multiple accept={DOC_ACCEPT} className="sr-only" disabled={busy} onChange={(e) => void upload(e.target.files)} />
            </label>
          </div>
          <p className="mt-2 text-xs text-muted-light">PDF, Word, Excel, images, DWG, ZIP up to {DOC_MAX_BYTES / 1024 / 1024} MB each.</p>
          {error ? <p role="alert" className="mt-2 text-sm text-status-danger">{error}</p> : null}
        </div>
      ) : null}

      {documents.length ? (
        <ul className="divide-y divide-graphite/10 rounded-lg border border-graphite/10 bg-white/40">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="size-5 shrink-0 text-copper-dark" aria-hidden />
              <div className="min-w-0 flex-1">
                <a href={`/api/documents/${d.id}`} className="block truncate text-sm font-medium hover:underline">{d.name}</a>
                <p className="text-xs text-muted-light">
                  {label(d.category_key)} · {(d.size_bytes / 1024 / 1024).toFixed(2)} MB · {formatDateUK(d.created_at)}
                  {d.expiry_date ? <span className={cn("ml-2", expired(d) ? "text-status-danger" : "")}>{expired(d) ? "Expired" : "Expires"} {formatDateUK(d.expiry_date)}</span> : null}
                </p>
              </div>
              {canWrite ? <ConfirmAction action={archiveDocument.bind(null, d.id, revalidate)} label="Remove" title={`Remove ${d.name}?`} description="The file is archived, not permanently deleted." confirmLabel="Remove" className="h-8 px-3 text-xs" /> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-light">No documents yet.</p>
      )}
    </div>
  );
}
