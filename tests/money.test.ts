import { describe, expect, it } from "vitest";
import { toPence, toDecimalString, formatGBP, marginPct } from "@/lib/money";

describe("money", () => {
  it("parses numeric strings from Postgres without float error", () => {
    expect(toPence("185000.00")).toBe(18500000);
    expect(toPence("0.1")).toBe(10);
    expect(toPence("19.99")).toBe(1999);
    expect(toPence("-5.05")).toBe(-505);
    expect(toPence(null)).toBe(0);
  });
  it("round-trips to decimal strings", () => {
    expect(toDecimalString(1999)).toBe("19.99");
    expect(toDecimalString(5)).toBe("0.05");
    expect(toDecimalString(-505)).toBe("-5.05");
    expect(toDecimalString(toPence("142000.00"))).toBe("142000.00");
  });
  it("rejects garbage", () => {
    expect(() => toPence("12.345")).toThrow();
    expect(() => toPence("abc")).toThrow();
  });
  it("formats GBP", () => {
    expect(formatGBP(18500000)).toBe("£185,000.00");
    expect(formatGBP(18500000, { showPence: false })).toBe("£185,000");
  });
  it("computes margin matching the SQL view", () => {
    expect(marginPct(18500000, 14200000)).toBe(23.24);
    expect(marginPct(0, 100)).toBeNull();
  });
});
