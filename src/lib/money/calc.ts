/**
 * Quote / invoice arithmetic — MUST match recalculate_quote() / recalculate_invoice()
 * in supabase/migrations. Used for live previews in the builder and for tests;
 * the database remains the source of truth for stored totals.
 *
 * All inputs are decimal strings or numbers; internal maths uses integer
 * hundredths (pence) with half-up rounding like Postgres round(numeric, 2).
 */
export type LineInput = { quantity: string | number; sellPrice: string | number; costPrice?: string | number; discountPct?: string | number; vatRate: string | number };
export type LineResult = { net: number; vat: number; total: number; grossNet: number; cost: number }; // pence
export type DocTotals = { subtotal: number; discountAmount: number; vatAmount: number; total: number; costTotal: number; lines: LineResult[] };

const num = (v: string | number | undefined) => (v === undefined || v === "" ? 0 : Number(v));

/** round(x, 2) with half-away-from-zero like Postgres numeric rounding. Returns pence. */
export function round2ToPence(x: number): number {
  const scaled = x * 100;
  const r = Math.round(Math.abs(scaled) + 1e-9) * Math.sign(scaled);
  return r === 0 ? 0 : r;
}

export function calcLine(line: LineInput, docDiscountPct: string | number = 0): LineResult {
  const qty = num(line.quantity), sell = num(line.sellPrice), cost = num(line.costPrice), ld = num(line.discountPct), dd = num(docDiscountPct), rate = num(line.vatRate);
  const grossNet = round2ToPence(qty * sell * (1 - ld / 100));
  const net = round2ToPence(qty * sell * (1 - ld / 100) * (1 - dd / 100));
  const vat = round2ToPence((net / 100) * (rate / 100));
  return { net, vat, total: net + vat, grossNet, cost: round2ToPence(qty * cost) };
}

export function calcTotals(lines: LineInput[], docDiscountPct: string | number = 0): DocTotals {
  const results = lines.map((l) => calcLine(l, docDiscountPct));
  const subtotal = results.reduce((s, l) => s + l.grossNet, 0);
  const netSum = results.reduce((s, l) => s + l.net, 0);
  const vatAmount = results.reduce((s, l) => s + l.vat, 0);
  const costTotal = results.reduce((s, l) => s + l.cost, 0);
  return { subtotal, discountAmount: subtotal - netSum, vatAmount, total: netSum + vatAmount, costTotal, lines: results };
}

export function marginFromTotals(t: Pick<DocTotals, "subtotal" | "discountAmount" | "costTotal">) {
  const revenue = t.subtotal - t.discountAmount;
  if (revenue <= 0) return null;
  return Math.round(((revenue - t.costTotal) / revenue) * 10000) / 100;
}
