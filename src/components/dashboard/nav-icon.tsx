import {
  LayoutDashboard, Inbox, Target, Building2, FileText, FolderKanban, MapPin, CheckSquare, Files, Users,
  CalendarDays, Clock, Plane, Receipt, CreditCard, Wallet, Banknote, Truck, Wrench, BarChart3, Settings,
} from "lucide-react";
import type { NavItem } from "@/features/dashboard/navigation";

const MAP: Record<NavItem["icon"], React.ComponentType<{ className?: string }>> = {
  home: LayoutDashboard, enquiries: Inbox, leads: Target, clients: Building2, quotes: FileText, projects: FolderKanban,
  sites: MapPin, tasks: CheckSquare, documents: Files, employees: Users, rota: CalendarDays, timesheets: Clock,
  leave: Plane, invoices: Receipt, payments: CreditCard, expenses: Wallet, payroll: Banknote, suppliers: Truck,
  equipment: Wrench, reports: BarChart3, settings: Settings,
};

export function NavIcon({ name, className }: { name: NavItem["icon"]; className?: string }) {
  const Icon = MAP[name];
  return <Icon className={className} aria-hidden />;
}
