import "server-only";

import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { UPLOAD } from "@/lib/validation/enquiry";
import { isSupabaseConfigured } from "@/lib/env";

export const ENQUIRY_BUCKET = "enquiry-uploads";

/** Magic-byte sniffing so MIME can't simply be spoofed by the client. */
function sniff(bytes: Uint8Array): string | null {
  const hex = (n: number) => Array.from(bytes.slice(0, n)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex(4) === "25504446") return "application/pdf"; // %PDF
  if (hex(3) === "ffd8ff") return "image/jpeg";
  if (hex(8) === "89504e470d0a1a0a") return "image/png";
  if (hex(4) === "504b0304") return "application/zip"; // docx/xlsx are zip containers
  return null;
}

export type StoredUpload = { name: string; path: string; size: number; mime: string };

export class UploadError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

/**
 * Validates and stores a single enquiry attachment in the private bucket.
 * Files are grouped under a per-session token so the enquiry can reference them.
 */
export async function storeEnquiryUpload(file: File, sessionToken: string): Promise<StoredUpload> {
  if (!/^[a-f0-9-]{36}$/.test(sessionToken)) throw new UploadError("Invalid upload session.");
  if (file.size === 0) throw new UploadError("The file is empty.");
  if (file.size > UPLOAD.maxBytes) throw new UploadError(`Files must be under ${UPLOAD.maxBytes / 1024 / 1024} MB.`);

  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  const declared = file.type;
  const allowedExts = UPLOAD.allowed[declared];
  if (!allowedExts || !allowedExts.includes(ext)) {
    throw new UploadError("Only PDF, DOCX, XLSX, JPG and PNG files are accepted.");
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniff(buffer);
  const zipOk = sniffed === "application/zip" && (ext === ".docx" || ext === ".xlsx");
  if (!(sniffed === declared || zipOk)) {
    throw new UploadError("The file contents don't match its type.");
  }

  if (!isSupabaseConfigured) {
    throw new UploadError("File uploads are not available right now. Please submit without attachments and email documents to us.", 503);
  }

  const safeName = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  const path = `${sessionToken}/${randomUUID()}-${safeName}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(ENQUIRY_BUCKET).upload(path, buffer, {
    contentType: declared,
    upsert: false,
  });
  if (error) throw new UploadError("Upload failed. Please try again.", 500);

  return { name: file.name, path, size: file.size, mime: declared };
}
