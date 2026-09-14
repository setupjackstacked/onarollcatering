import type { Permission } from "@/lib/auth/permissions";

export type NavItem = {
  label: string;
  href: string;
  permission?: Permission;
  /** Phase in which the module ships. Undefined = available now. */
  phase?: number;
  icon: "home" | "leads" | "clients" | "quotes" | "projects" | "sites" | "tasks" | "documents" | "employees" | "rota" | "timesheets" | "leave" | "invoices" | "payments" | "expenses" | "payroll" | "suppliers" | "equipment" | "reports" | "settings" | "enquiries";
};

export type NavSection = { label?: string; items: NavItem[] };

/** Sidebar structure from the spec §33. Items with `phase` render disabled until built. */
export const DASHBOARD_NAV: NavSection[] = [
  { items: [{ label: "Overview", href: "/dashboard", icon: "home" }] },
  {
    label: "Sales",
    items: [
      { label: "Enquiries", href: "/dashboard/enquiries", icon: "enquiries", permission: "sales.read" },
      { label: "Leads", href: "/dashboard/leads", icon: "leads", permission: "sales.read" },
      { label: "Clients", href: "/dashboard/clients", icon: "clients", permission: "sales.read" },
      { label: "Quotes", href: "/dashboard/quotes", icon: "quotes", permission: "sales.read" },
    ],
  },
  {
    label: "Projects",
    items: [
      { label: "Projects", href: "/dashboard/projects", icon: "projects", permission: "projects.read" },
      { label: "Sites", href: "/dashboard/sites", icon: "sites", permission: "projects.read" },
      { label: "Tasks", href: "/dashboard/tasks", icon: "tasks", permission: "projects.read" },
      { label: "Documents", href: "/dashboard/documents", icon: "documents", permission: "projects.read" },
    ],
  },
  {
    label: "Workforce",
    items: [
      { label: "Employees", href: "/dashboard/employees", icon: "employees", permission: "workforce.read", phase: 8 },
      { label: "Rota", href: "/dashboard/rota", icon: "rota", permission: "workforce.read", phase: 8 },
      { label: "Timesheets", href: "/dashboard/timesheets", icon: "timesheets", permission: "workforce.read", phase: 8 },
      { label: "Leave", href: "/dashboard/leave", icon: "leave", permission: "workforce.read", phase: 8 },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Invoices", href: "/dashboard/invoices", icon: "invoices", permission: "finance.read" },
      { label: "Payments", href: "/dashboard/payments", icon: "payments", permission: "finance.read" },
      { label: "Expenses", href: "/dashboard/expenses", icon: "expenses", permission: "finance.read", phase: 7 },
      { label: "Payroll", href: "/dashboard/payroll", icon: "payroll", permission: "finance.read", phase: 9 },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Suppliers", href: "/dashboard/suppliers", icon: "suppliers", permission: "projects.read", phase: 10 },
      { label: "Equipment", href: "/dashboard/equipment", icon: "equipment", permission: "projects.read", phase: 10 },
    ],
  },
  {
    items: [
      { label: "Reports", href: "/dashboard/reports", icon: "reports", permission: "reports.read", phase: 11 },
      { label: "Settings", href: "/dashboard/settings", icon: "settings" },
    ],
  },
];

/** Mobile bottom bar (spec §76). */
export const MOBILE_NAV: { label: string; href: string; icon: NavItem["icon"]; permission?: Permission; phase?: number }[] = [
  { label: "Home", href: "/dashboard", icon: "home" },
  { label: "Projects", href: "/dashboard/projects", icon: "projects", permission: "projects.read" },
  { label: "Sales", href: "/dashboard/leads", icon: "leads", permission: "sales.read" },
  { label: "Staff", href: "/dashboard/employees", icon: "employees", permission: "workforce.read", phase: 8 },
];
