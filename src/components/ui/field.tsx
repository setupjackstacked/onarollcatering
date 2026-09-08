import { cn } from "@/lib/utils/cn";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Accessible field wrapper: label, control, hint and error with aria wiring. */
export function Field({ label, htmlFor, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-sm font-medium text-graphite">
        <span>{label}</span>
        {optional ? <span className="text-xs font-normal text-muted-light">Optional</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-status-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-light">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-graphite/20 bg-white/60 px-4 py-3 text-base text-graphite placeholder:text-muted-light/70 transition-colors focus:border-copper focus:bg-white focus:outline-none focus-visible:outline-none aria-invalid:border-status-danger min-h-12";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-32 resize-y", props.className)} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputClass, "appearance-none", props.className)}>
      {children}
    </select>
  );
}

export function CheckboxTile({
  id,
  label,
  description,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; description?: string }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-md border border-graphite/15 bg-white/40 p-4 transition-colors has-checked:border-copper has-checked:bg-copper/6 hover:border-graphite/40"
    >
      <input id={id} type="checkbox" className="mt-1 size-4 accent-copper" {...props} />
      <span className="flex flex-col">
        <span className="text-[0.9375rem] font-medium leading-tight">{label}</span>
        {description ? <span className="mt-1 text-xs text-muted-light">{description}</span> : null}
      </span>
    </label>
  );
}
