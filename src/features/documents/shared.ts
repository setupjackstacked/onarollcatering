import type { DocumentEntity } from "@/lib/supabase/types";

export const DOC_BUCKETS: Record<DocumentEntity, string> = {
  client: "client-documents",
  project: "project-documents",
  employee: "employee-documents",
  quote: "quote-documents",
  invoice: "invoice-documents",
  supplier: "client-documents",
  lead: "client-documents",
  site: "project-documents",
};

export const DOC_MAX_BYTES = 25 * 1024 * 1024;
export const DOC_ALLOWED: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/heic": [".heic"],
  "application/zip": [".zip"],
  "application/acad": [".dwg"],
  "image/vnd.dwg": [".dwg"],
  "text/csv": [".csv"],
};
export const DOC_ACCEPT = Object.values(DOC_ALLOWED).flat().join(",");
