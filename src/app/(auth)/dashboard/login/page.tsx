import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/dashboard/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/validation/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(safeNext(next));
  return (
    <LoginForm
      next={safeNext(next)}
      initialError={error === "link" ? "That link has expired or already been used. Request a new one below." : undefined}
    />
  );
}
