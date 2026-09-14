"use client";

import { useActionState } from "react";
import type { AuthFormState } from "@/features/auth/actions";

type Props = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  title: string;
  description?: string;
  submitLabel: string;
  children: (helpers: { fieldError: (name: string) => string | undefined; pending: boolean }) => React.ReactNode;
  footer?: React.ReactNode;
  initialError?: string;
};

/** Progressive-enhancement auth form: works without JS, shows inline errors with it. */
export function AuthForm({ action, title, description, submitLabel, children, footer, initialError }: Props) {
  const [state, formAction, pending] = useActionState(action, initialError ? { error: initialError } : {});
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">{title}</h1>
      {description ? <p className="mt-2 text-sm text-ivory/60">{description}</p> : null}

      {state.success ? (
        <p role="status" className="mt-6 rounded-md border border-copper/40 bg-copper/10 px-4 py-3 text-sm text-ivory">
          {state.success}
        </p>
      ) : (
        <form action={formAction} className="mt-8 space-y-5" noValidate>
          {children({ fieldError, pending })}
          {state.error ? (
            <p role="alert" className="rounded-md border border-status-danger/40 bg-status-danger/10 px-4 py-3 text-sm text-ivory">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center rounded-full bg-copper text-[0.9375rem] font-medium text-ivory transition-colors hover:bg-copper-dark disabled:opacity-60"
          >
            {pending ? "Please wait…" : submitLabel}
          </button>
        </form>
      )}
      {footer ? <div className="mt-6 text-center text-sm text-ivory/60">{footer}</div> : null}
    </div>
  );
}

export function AuthField({
  label,
  name,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string }) {
  const id = `f-${name}`;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-ivory/85">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-12 w-full rounded-md border border-ivory/20 bg-ivory/5 px-4 text-ivory placeholder:text-ivory/35 focus:border-copper focus:bg-ivory/8 focus:outline-none aria-invalid:border-status-danger"
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-[#e59a95]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
