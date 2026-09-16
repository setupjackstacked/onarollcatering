"use client";

import { createContext, useActionState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils/cn";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const FormCtx = createContext<{ state: FormState; pending: boolean }>({ state: {}, pending: false });

/**
 * Server-action form with inline errors. Works without JS. On success with
 * `redirectTo`, navigates client-side (so server actions don't need redirect()).
 */
export function Form({
  action,
  children,
  className,
  onSuccess,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const router = useRouter();

  useEffect(() => {
    if (state.redirectTo) router.push(state.redirectTo);
    if (state.success && onSuccess) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <FormCtx.Provider value={{ state, pending }}>
      <form action={formAction} noValidate className={cn("space-y-5", className)}>
        {children}
        {state.error ? (
          <p role="alert" className="rounded-md bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
            {state.error}
          </p>
        ) : null}
        {state.success && !state.redirectTo ? (
          <p role="status" className="rounded-md bg-status-success/10 px-4 py-3 text-sm text-status-success">
            {state.success}
          </p>
        ) : null}
      </form>
    </FormCtx.Provider>
  );
}

export function useFieldError(name: string) {
  return useContext(FormCtx).state.fieldErrors?.[name]?.[0];
}
export function useFormPending() {
  return useContext(FormCtx).pending;
}

const control =
  "w-full rounded-md border border-graphite/20 bg-white/70 px-3 py-2.5 text-[0.9375rem] text-graphite placeholder:text-muted-light/60 focus:border-copper focus:bg-white focus:outline-none aria-invalid:border-status-danger min-h-11 disabled:opacity-60";

function Wrap({ name, label, hint, optional, children, className }: { name: string; label: string; hint?: string; optional?: boolean; children: React.ReactNode; className?: string }) {
  const error = useFieldError(name);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={`f-${name}`} className="flex items-baseline justify-between text-sm font-medium">
        <span>{label}</span>
        {optional ? <span className="text-xs font-normal text-muted-light">Optional</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-status-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-light">{hint}</p>
      ) : null}
    </div>
  );
}

type BaseProps = { name: string; label: string; hint?: string; optional?: boolean; className?: string };

export function TextField({ name, label, hint, optional, className, ...props }: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const error = useFieldError(name);
  return (
    <Wrap name={name} label={label} hint={hint} optional={optional} className={className}>
      <input id={`f-${name}`} name={name} aria-invalid={!!error} className={control} {...props} />
    </Wrap>
  );
}

export function TextArea({ name, label, hint, optional, className, ...props }: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const error = useFieldError(name);
  return (
    <Wrap name={name} label={label} hint={hint} optional={optional} className={className}>
      <textarea id={`f-${name}`} name={name} aria-invalid={!!error} className={cn(control, "min-h-28")} rows={4} {...props} />
    </Wrap>
  );
}

export function SelectField({
  name, label, hint, optional, className, options, placeholder, ...props
}: BaseProps & React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
  const error = useFieldError(name);
  return (
    <Wrap name={name} label={label} hint={hint} optional={optional} className={className}>
      <select id={`f-${name}`} name={name} aria-invalid={!!error} className={control} {...props}>
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

export function MoneyField({ name, label, hint, optional, className, ...props }: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const error = useFieldError(name);
  return (
    <Wrap name={name} label={label} hint={hint} optional={optional} className={className}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-light">€</span>
        <input id={`f-${name}`} name={name} inputMode="decimal" aria-invalid={!!error} className={cn(control, "pl-7 num-lining")} placeholder="0.00" {...props} />
      </div>
    </Wrap>
  );
}

export function DateField(props: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return <TextField type="date" {...props} />;
}

export function CheckboxField({ name, label, hint, className, ...props }: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={`f-${name}`} className={cn("flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-graphite/15 bg-white/40 px-3 py-2.5 has-checked:border-copper", className)}>
      <input id={`f-${name}`} name={name} type="checkbox" className="mt-1 size-4 accent-copper" {...props} />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="block text-xs text-muted-light">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Hidden({ name, value }: { name: string; value: string | number | null | undefined }) {
  return <input type="hidden" name={name} value={value ?? ""} />;
}

export function FormRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return <div className={cn("grid grid-cols-1 gap-4", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-3")}>{children}</div>;
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-graphite/10 pt-5 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-xs text-muted-light">{description}</p> : null}
      </div>
      {children}
    </fieldset>
  );
}

export function SubmitButton({ children, variant = "obsidian", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "obsidian" | "copper" | "outline" | "danger" }) {
  const pending = useFormPending();
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-60",
        variant === "obsidian" && "bg-obsidian text-ivory hover:bg-graphite",
        variant === "copper" && "bg-copper text-ivory hover:bg-copper-dark",
        variant === "outline" && "border border-graphite/25 text-graphite hover:border-graphite",
        variant === "danger" && "border border-status-danger/40 text-status-danger hover:bg-status-danger/10",
        className,
      )}
      {...props}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 border-t border-graphite/10 pt-5">{children}</div>;
}
