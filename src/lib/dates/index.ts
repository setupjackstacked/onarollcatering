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

/** Monday of the week containing `iso` (ISO date string). */
export function startOfWeekISO(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

/** `count` consecutive ISO dates starting at `iso`. */
export function isoRange(iso: string, count: number) {
  const out: string[] = [];
  const d = new Date(`${iso}T00:00:00Z`);
  for (let i = 0; i < count; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** "Mon 14" style day label for rota columns. */
export function dayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()]} ${d.getUTCDate()}`;
}

/** "08:00" from a Postgres time value. */
export const hhmm = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");
