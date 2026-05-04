"use client"
import {
  AlertTriangle, LayoutDashboard, UserPlus, Phone, CheckCircle2,
  FileText, CalendarCheck, XCircle, BarChart2, Activity, PieChart,
  Users2, Users, Puzzle, Settings, X, History, Filter
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { useState, useEffect } from "react";

interface SidebarItem {
  icon: any;
  label: string;
  href: string;
  badge?: number;
  badgeColor?: string;
  active?: boolean;
  roles?: string[];
}

interface SidebarGroup {
  section?: string;
  items: SidebarItem[];
}

const SIDEBAR_ITEMS: SidebarGroup[] = [
  {
    items: [
      { icon: AlertTriangle, label: "Alerts", href: "/dashboard/alerts", badgeColor: "bg-red-500" },
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
    ],
  },
  {
    section: "LEADS",
    items: [
      { icon: UserPlus, label: "New Leads", href: "/dashboard/leads", badgeColor: "bg-blue-500" },
      { icon: Phone, label: "Follow Ups", href: "/dashboard/follow-ups", badgeColor: "bg-orange-500" },
      { icon: CheckCircle2, label: "Closed Won", href: "/dashboard/won" },
      { icon: FileText, label: "Proposed", href: "/dashboard/proposed" },
      { icon: CalendarCheck, label: "Meeting Set", href: "/dashboard/meetings" },
      { icon: XCircle, label: "Closed ", href: "/dashboard/closed" },
    ],
  },
  {
    section: "REPORTS",
    items: [
      { icon: BarChart2, label: "Pipeline", href: "/dashboard/pipeline" },
      { icon: Activity, label: "Performance", href: "/dashboard/performance" },
      { icon: PieChart, label: "Source Report", href: "/dashboard/sources" },
      { 
        icon: History, 
        label: "Audit Protocol", 
        href: "/dashboard/reports/audit",
        roles: ["ORG_ADMIN", "MANAGER"]
      },
    ],
  },
  {
    section: "SETTINGS",
    items: [
      { icon: Users2, label: "Users", href: "/dashboard/users" },
      { icon: Users, label: "Team", href: "/dashboard/team" },
      { icon: Puzzle, label: "Integrations", href: "/dashboard/integrations" },
      { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ],
  },
];

const COLOR_MAP: Record<string, string> = {
  blue: "from-blue-400 to-blue-600",
  green: "from-green-400 to-green-600",
  purple: "from-purple-400 to-purple-600",
  orange: "from-orange-400 to-orange-600",
  red: "from-red-400 to-red-600",
  cyan: "from-cyan-400 to-cyan-600",
  pink: "from-pink-400 to-pink-600",
  amber: "from-amber-400 to-amber-600",
};

const COLOR_BG_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  cyan: "bg-cyan-500",
  pink: "bg-pink-500",
  amber: "bg-amber-500",
};

interface CustomFilter {
  id: string;
  name: string;
  status: string | null;
  subStatus: string | null;
  dealSizeMin: string | null;
  dealSizeMax: string | null;
  color: string;
  orderIndex: number;
}

interface SidebarProps {
  activeNav?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ 
  activeNav = "Dashboard", 
  isOpen = false, 
  setIsOpen = () => {} 
}: SidebarProps) {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ alerts: 0, newLeads: 0, followUps: 0 });
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(r => r.json())
      .then(data => {
        if (data.kpis) {
          setCounts({
            alerts: data.kpis.alertsCount || 0,
            newLeads: data.kpis.newLeadsCount || 0,
            followUps: data.kpis.followUpsTotal || 0
          });
        }
      })
      .catch(console.error);
  }, []);

  // Fetch custom sidebar filters for all users
  useEffect(() => {
    fetch("/api/sidebar-filters")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCustomFilters(data);
      })
      .catch(console.error);
  }, []);

  // Build the dynamic sidebar items, injecting custom filters
  const buildSidebarGroups = (): SidebarGroup[] => {
    const base = SIDEBAR_ITEMS.map(group => ({
      ...group,
      items: group.items.map(item => {
        let badge = item.badge;
        if (item.label === "Alerts") badge = counts.alerts;
        if (item.label === "New Leads") badge = counts.newLeads;
        if (item.label === "Follow Ups") badge = counts.followUps;
        return { ...item, badge };
      }).filter(item => {
        if (!item.roles) return true;
        return user?.role && item.roles.includes(user.role);
      })
    })).filter(group => group.items.length > 0);

    // Insert custom filters section if any exist
    if (customFilters.length > 0) {
      const customItems = customFilters.map(f => ({
        icon: Filter,
        label: f.name,
        href: `/dashboard?sf=${f.id}`,
        badge: undefined as number | undefined,
        badgeColor: COLOR_BG_MAP[f.color] || "bg-blue-500",
      }));

      // Insert AFTER the LEADS section (index 1 in the base)
      const leadsIndex = base.findIndex(g => g.section === "LEADS");
      const insertAt = leadsIndex >= 0 ? leadsIndex + 1 : base.length;

      base.splice(insertAt, 0, {
        section: "QUICK FILTERS",
        items: customItems,
      });
    }

    return base;
  };

  const filteredItems = buildSidebarGroups();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-sidebar flex flex-col flex-shrink-0 overflow-y-auto transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-sidebar-foreground font-semibold text-sm tracking-wide">SOLO SALES</span>
          </div>
          {/* Mobile close button */}
          <button 
            className="md:hidden p-1 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 px-3 py-3 space-y-5">
          {filteredItems.map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 px-2 mb-1">
                  {group.section}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.label;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-300 group ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:pl-4"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={15} className="flex-shrink-0" />
                          <span className="text-[13px] font-medium">{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-sidebar-primary-foreground ${
                              isActive ? "bg-white/30" : item.badgeColor ?? "bg-sidebar-primary"
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">{user?.initials || "U"}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sidebar-foreground text-[12px] font-medium truncate">{user?.name || "User"}</p>
              <p className="text-sidebar-foreground/40 text-[10px] truncate">
                {user?.role ? user.role.replace("ORG_", "").replace("_", " ").toLowerCase() : "Sales Staff"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
