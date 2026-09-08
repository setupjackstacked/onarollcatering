import { describe, expect, it } from "vitest";
import { hasPermission, assertPermission, PermissionError } from "@/lib/auth/permissions";

describe("permissions", () => {
  it("owner has everything", () => {
    expect(hasPermission("owner", "finance.write")).toBe(true);
    expect(hasPermission("owner", "org.manage")).toBe(true);
  });
  it("read_only cannot mutate", () => {
    expect(hasPermission("read_only", "sales.read")).toBe(true);
    expect(hasPermission("read_only", "sales.write")).toBe(false);
    expect(hasPermission("read_only", "finance.write")).toBe(false);
  });
  it("project managers cannot access finance", () => {
    expect(hasPermission("project_manager", "finance.read")).toBe(false);
    expect(hasPermission("project_manager", "projects.write")).toBe(true);
  });
  it("staff role has no dashboard permissions in Phase 0", () => {
    expect(hasPermission("staff", "projects.read")).toBe(false);
  });
  it("assertPermission throws a typed error", () => {
    expect(() => assertPermission("finance", "workforce.write")).toThrow(PermissionError);
    expect(() => assertPermission(null, "sales.read")).toThrow(PermissionError);
  });
});
