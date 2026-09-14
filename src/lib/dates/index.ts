import { format, parseISO, isValid } from "date-fns";

/** UK business date formats (spec §64). Accepts ISO strings or Dates; returns "" for null. */
export function formatDateUK(value: string | Date | null | undefined, withTime = false) {
  if (!value) return "";
  const d = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(d)) return "";
  return format(d, withTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");
}

/** For <time dateTime> attributes. */
export function isoDate(value: string | Date | null | undefined) {
  if (!value) return undefined;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d.toISOString() : undefined;
}

/** ISO date (YYYY-MM-DD) for today ± days. Lives outside components to keep them pure. */
export function isoDateOffset(days = 0, from: Date = new Date()) {
  return new Date(from.getTime() + days * 864e5).toISOString().slice(0, 10);
}
