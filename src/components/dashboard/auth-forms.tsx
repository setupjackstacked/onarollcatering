"use client";

import Link from "next/link";
import { signIn, requestPasswordReset, updatePassword } from "@/features/auth/actions";
import { AuthForm, AuthField } from "./auth-form";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  return (
    <AuthForm
      action={signIn}
      title="Sign in"
      description="Dashboard access is by invitation only."
      submitLabel="Sign in"
      initialError={initialError}
      footer={
        <Link href="/dashboard/forgot-password" className="underline-offset-4 hover:text-ivory hover:underline">
          Forgotten your password?
        </Link>
      }
    >
      {({ fieldError }) => (
        <>
          <input type="hidden" name="next" value={next} />
          <AuthField label="Email" name="email" type="email" autoComplete="email" inputMode="email" required error={fieldError("email")} />
          <AuthField label="Password" name="password" type="password" autoComplete="current-password" required error={fieldError("password")} />
        </>
      )}
    </AuthForm>
  );
}

export function ForgotPasswordForm() {
  return (
    <AuthForm
      action={requestPasswordReset}
      title="Reset your password"
      description="Enter your email and we’ll send a link to set a new password."
      submitLabel="Send reset link"
      footer={
        <Link href="/dashboard/login" className="underline-offset-4 hover:text-ivory hover:underline">
          Back to sign in
        </Link>
      }
    >
      {({ fieldError }) => <AuthField label="Email" name="email" type="email" autoComplete="email" required error={fieldError("email")} />}
    </AuthForm>
  );
}

export function ResetPasswordForm({ email }: { email: string }) {
  return (
    <AuthForm action={updatePassword} title="Choose a new password" description={`Signed in as ${email}.`} submitLabel="Update password">
      {({ fieldError }) => (
        <>
          <AuthField label="New password" name="password" type="password" autoComplete="new-password" required minLength={10} error={fieldError("password")} />
          <AuthField label="Confirm password" name="confirm" type="password" autoComplete="new-password" required error={fieldError("confirm")} />
        </>
      )}
    </AuthForm>
  );
}
