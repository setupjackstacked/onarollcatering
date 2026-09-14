/**
 * Money helpers. Postgres stores numeric(12,2) and returns it as a string
 * through PostgREST. Internally we work in integer pence to avoid float error.
 */
export type Pence = number; // integer

export function toPence(value: string | number | null | undefined): Pence {
  if (value === null || value === undefined || value === "") return 0;
  const s = typeof value === "number" ? value.toFixed(2) : String(value).trim();
  const m = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) throw new Error(`Invalid money value: ${value}`);
  const sign = m[1] ? -1 : 1;
  const pounds = Number(m[2]);
  const frac = (m[3] ?? "0").padEnd(2, "0");
  return sign * (pounds * 100 + Number(frac));
}

/** Pence → "1234.56" for writing back to numeric columns. */
export function toDecimalString(p: Pence): string {
  const sign = p < 0 ? "-" : "";
  const abs = Math.abs(Math.round(p));
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function formatGBP(p: Pence, opts: { currency?: string; showPence?: boolean } = {}) {
  const { currency = "GBP", showPence = true } = opts;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: showPence ? 2 : 0,
    maximumFractionDigits: showPence ? 2 : 0,
  }).format(p / 100);
}

/** Margin % (2dp) from revenue and cost in pence; null when revenue is 0. */
export function marginPct(revenue: Pence, cost: Pence): number | null {
  if (revenue <= 0) return null;
  return Math.round(((revenue - cost) / revenue) * 10000) / 100;
}
