import { describe, expect, it } from "vitest";
import { safeNext, resetPasswordSchema } from "@/lib/validation/auth";

describe("safeNext", () => {
  it("only allows in-app relative paths", () => {
    expect(safeNext("/dashboard/leads")).toBe("/dashboard/leads");
    expect(safeNext("/staff/shifts")).toBe("/staff/shifts");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/")).toBe("/dashboard");
    expect(safeNext(undefined)).toBe("/dashboard");
  });
});

describe("resetPasswordSchema", () => {
  it("requires matching passwords of 10+ chars", () => {
    expect(resetPasswordSchema.safeParse({ password: "short", confirm: "short" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "longenough1", confirm: "different1" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "longenough1", confirm: "longenough1" }).success).toBe(true);
  });
});
