import { describe, expect, it } from "vitest";
import { formatDateUK } from "@/lib/dates";

describe("formatDateUK", () => {
  it("renders DD/MM/YYYY", () => {
    expect(formatDateUK("2026-09-22")).toBe("22/09/2026");
    expect(formatDateUK("2026-09-22T14:05:00.000Z", true)).toMatch(/^22\/09\/2026 \d{2}:\d{2}$/);
  });
  it("handles empty and invalid values", () => {
    expect(formatDateUK(null)).toBe("");
    expect(formatDateUK("nope")).toBe("");
  });
});
