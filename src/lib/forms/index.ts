import type { z } from "zod";

/** Standard server-action state for progressive-enhancement forms. */
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: string;
  /** Set by actions that want the client to navigate after success. */
  redirectTo?: string;
};

export const initialFormState: FormState = {};

/**
 * FormData → plain object → zod.
 * Conventions: `name[]` collects multiple values; `on` checkboxes become booleans
 * when the schema field is boolean; blank strings are kept (schemas decide).
 */
export function parseForm<S extends z.ZodTypeAny>(schema: S, formData: FormData):
  | { ok: true; data: z.output<S> }
  | { ok: false; state: FormState } {
  const raw: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$")) continue; // Next internals
    if (key.endsWith("[]")) {
      raw[key.slice(0, -2)] = formData.getAll(key).map(String);
    } else {
      const v = formData.get(key);
      raw[key] = v instanceof File ? v : (v ?? "");
    }
  }
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const flat = parsed.error.flatten();
  return {
    ok: false,
    state: {
      error: flat.formErrors[0] ?? "Please check the highlighted fields.",
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    },
  };
}

/** Coerce blank → null for optional text columns. */
export const nullable = (v: string | undefined | null) => (v && v.trim() ? v.trim() : null);

/** zod helpers shared by domain schemas. */
export { z } from "zod";
