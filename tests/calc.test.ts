import { describe, expect, it } from "vitest";
import { calcTotals, calcLine, round2ToPence } from "@/lib/money/calc";

// Mirrors supabase/tests/30_quotes_invoices.test.sql fixture exactly.
const lines = [
  { quantity: 2, sellPrice: "15000.00", costPrice: "10000.00", discountPct: 0, vatRate: 20 },
  { quantity: 37.5, sellPrice: "45.00", costPrice: "20.00", discountPct: 10, vatRate: 20 },
  { quantity: 1, sellPrice: "12000.00", costPrice: "8000.00", discountPct: 0, vatRate: 0 },
];

describe("calc", () => {
  it("rounds like Postgres", () => {
    expect(round2ToPence(1518.75)).toBe(151875);
    expect(round2ToPence(0.005)).toBe(1);
    expect(round2ToPence(2.675)).toBe(268);
  });
  it("matches the SQL totals without a document discount", () => {
    const t = calcTotals(lines, 0);
    expect(t.subtotal).toBe(4351875);
    expect(t.vatAmount).toBe(630375);
    expect(t.total).toBe(4982250);
    expect(t.costTotal).toBe(2875000);
    expect(t.discountAmount).toBe(0);
  });
  it("matches the SQL totals with a 5% document discount", () => {
    const t = calcTotals(lines, 5);
    expect(t.discountAmount).toBe(217594);
    expect(t.vatAmount).toBe(598856);
    expect(t.total).toBe(4733137);
  });
  it("computes a single line", () => {
    const l = calcLine({ quantity: 37.5, sellPrice: 45, discountPct: 10, vatRate: 20 }, 5);
    expect(l.net).toBe(144281);
    expect(l.vat).toBe(28856);
  });
});
