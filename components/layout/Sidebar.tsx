"use client"
import { useState } from "react";
import {
  AlertTriangle, LayoutDashboard, UserPlus, Phone, CheckCircle2,
  FileText, CalendarCheck, XCircle, BarChart2, Activity, PieChart,
  Users2, Users, Puzzle, Settings, X
} from "lucide-react";

const SIDEBAR_ITEMS = [
  {
    items: [
      { icon: AlertTriangle, label: "Alerts", badge: 5, badgeColor: "bg-red-500" },
      { icon: LayoutDashboard, label: "Dashboard", active: true },
    ],
  },
  {
    section: "LEADS",
    items: [
      { icon: UserPlus, label: "New Leads", badge: 32, badgeColor: "bg-blue-500" },
      { icon: Phone, label: "Follow Ups", badge: 18, badgeColor: "bg-orange-500" },
      { icon: CheckCircle2, label: "Closed Won" },
      { icon: FileText, label: "Proposed" },
      { icon: CalendarCheck, label: "Meeting Set" },
      { icon: XCircle, label: "Closed " },
    ],
  },
  {
    section: "REPORTS",
    items: [
      { icon: BarChart2, label: "Pipeline" },
      { icon: Activity, label: "Performance" },
      { icon: PieChart, label: "Source Report" },
    ],
  },
  {
    section: "SETTINGS",
    items: [
      { icon: Users2, label: "Users" },
      { icon: Users, label: "Team" },
      { icon: Puzzle, label: "Integrations" },
      { icon: Settings, label: "Settings" },
    ],
  },
];

interface SidebarProps {
  activeNav?: string;
  setActiveNav?: (nav: string) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ 
  activeNav = "Dashboard", 
  setActiveNav = () => {}, 
  isOpen = false, 
  setIsOpen = () => {} 
}: SidebarProps) {
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
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#111827] flex flex-col flex-shrink-0 overflow-y-auto transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-wide">SALES PORTAL</span>
          </div>
          {/* Mobile close button */}
          <button 
            className="md:hidden p-1 text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 px-3 py-3 space-y-5">
          {SIDEBAR_ITEMS.map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-2 mb-1">
                  {group.section}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.label;
                  return (
                    <li key={item.label}>
                      <button
                        onClick={() => {
                          setActiveNav(item.label);
                          setIsOpen(false); // Close mobile menu when clicked
                        }}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 group ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={15} className="flex-shrink-0" />
                          <span className="text-[13px] font-medium">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${
                              isActive ? "bg-white/30" : item.badgeColor ?? "bg-slate-600"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="px-3 py-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">AM</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-[12px] font-medium truncate">Arjun Mehta</p>
              <p className="text-slate-500 text-[10px]">Sales Owner</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
