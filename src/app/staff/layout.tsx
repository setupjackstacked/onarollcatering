import Link from "next/link";
import { Logo } from "@/components/marketing/logo";
import { requireUser } from "@/lib/auth/session";
import { StaffTabs } from "@/components/staff/shell";

export const metadata = { title: { default: "Staff portal", template: "%s · On A Roll" }, robots: { index: false, follow: false } };

/** Mobile-first staff portal (spec §77). Separate shell from the dashboard. */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/staff");
  return (
    <div className="min-h-dvh bg-ivory text-graphite">
      <header className="surface-dark sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/staff"><Logo variant="horizontal" className="h-7" /></Link>
          <Link href="/staff/profile" className="text-xs uppercase tracking-wider text-copper">Profile</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">{children}</main>
      <StaffTabs />
    </div>
  );
}
