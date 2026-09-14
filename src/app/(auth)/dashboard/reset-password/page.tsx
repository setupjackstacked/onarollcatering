import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/dashboard/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

/** Reached via the emailed link (after /dashboard/auth/callback sets a session). */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div>
        <h1 className="font-display text-3xl text-ivory">Link expired</h1>
        <p className="mt-2 text-sm text-ivory/60">Password reset links only work once and expire after a short time.</p>
        <Link href="/dashboard/forgot-password" className="mt-6 inline-block text-sm text-ivory underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm email={user.email ?? ""} />;
}
