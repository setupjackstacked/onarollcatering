import { requireUser } from "@/lib/auth/session";

/** Staff portal (Phase 12). Route reserved; authentication enforced. */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/staff");
  return <div className="surface-light min-h-dvh">{children}</div>;
}
