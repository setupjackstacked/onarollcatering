import { NextResponse } from "next/server";
import { storeEnquiryUpload, UploadError } from "@/lib/storage/enquiry-uploads";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * POST multipart/form-data { file, session }
 * Stores one attachment for the quote enquiry. Returns { name, path, size, mime }.
 * The path is later included in the enquiry submission; nothing is publicly readable.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`upload:${ip}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const session = form.get("session");
    if (!(file instanceof File) || typeof session !== "string") {
      return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
    }
    const stored = await storeEnquiryUpload(file, session);
    return NextResponse.json(stored);
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.error("upload.unhandled", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
