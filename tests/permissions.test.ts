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
  // "Manager" is a site manager running a kitchen, not a fit-out project
  // manager. They get their site, its people and its trading position — and
  // deliberately not the sales pipeline, contracts or client invoicing.
  it("a manager runs their site, not the sales pipeline", () => {
    expect(hasPermission("project_manager", "sites.read")).toBe(true);
    expect(hasPermission("project_manager", "sites.write")).toBe(true);
    expect(hasPermission("project_manager", "workforce.read")).toBe(true);
    expect(hasPermission("project_manager", "reports.read")).toBe(true);

    expect(hasPermission("project_manager", "sales.read")).toBe(false);
    expect(hasPermission("project_manager", "projects.read")).toBe(false);
    expect(hasPermission("project_manager", "projects.write")).toBe(false);
    expect(hasPermission("project_manager", "finance.read")).toBe(false);
    expect(hasPermission("project_manager", "workforce.write")).toBe(false);
  });
  it("a manager sees their kitchen's takings; staff never see money", () => {
    expect(hasPermission("project_manager", "trading.read")).toBe(true);
    expect(hasPermission("project_manager", "trading.write")).toBe(true);
    expect(hasPermission("staff", "trading.read")).toBe(false);
    expect(hasPermission("staff", "trading.write")).toBe(false);
    expect(hasPermission("read_only", "trading.write")).toBe(false);
  });
  it("staff have no dashboard permissions at all", () => {
    expect(hasPermission("staff", "projects.read")).toBe(false);
    expect(hasPermission("staff", "sites.read")).toBe(false);
    expect(hasPermission("staff", "workforce.read")).toBe(false);
  });
  it("assertPermission throws a typed error", () => {
    expect(() => assertPermission("finance", "workforce.write")).toThrow(PermissionError);
    expect(() => assertPermission(null, "sales.read")).toThrow(PermissionError);
  });
});
