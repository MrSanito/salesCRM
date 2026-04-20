"use client"
import { useState } from "react";
import {
  Bell, Search, ChevronDown, Users, UserPlus, Phone, Trophy,
  Snowflake, TrendingDown, IndianRupee, LayoutDashboard,
  AlertTriangle, UserCheck, CheckCircle2, FileText, Handshake,
  CalendarCheck, XCircle, BarChart2, Activity, PieChart,
  Settings, Users2, Puzzle, ChevronRight, MoreVertical,
  Mail, MessageCircle, StickyNote, RefreshCcw, Circle,
  ArrowUpRight, ArrowDownRight, Filter, Download, Eye
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
      { icon: XCircle, label: "Closed Lost" },
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

const KPI_CARDS = [
  {
    label: "Total Leads",
    value: "1,234",
    change: "+18.6%",
    sub: "vs last 30 days",
    up: true,
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    label: "New Leads (This Week)",
    value: "245",
    change: "+12.4%",
    sub: "vs last week",
    up: true,
    icon: UserPlus,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
  },
  {
    label: "Follow Ups",
    value: "18",
    change: "+5.2%",
    sub: "due today",
    up: true,
    icon: Phone,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    label: "Won Deals",
    value: "32",
    change: "+23.1%",
    sub: "vs last 30 days",
    up: true,
    icon: Trophy,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
  {
    label: "Cold Leads",
    value: "87",
    change: "-4.3%",
    sub: "vs last 30 days",
    up: false,
    icon: Snowflake,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-400",
  },
  {
    label: "Inbound Leads",
    value: "156",
    change: "+9.8%",
    sub: "vs last 30 days",
    up: true,
    icon: TrendingDown,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
  },
];

const PIPELINE_STAGES = [
  { label: "New", count: 245, value: "₹18,40,000", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Contacted", count: 310, value: "₹24,60,000", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { label: "Qualified", count: 210, value: "₹36,75,000", color: "bg-teal-100 text-teal-700 border-teal-200" },
  { label: "Proposal Sent", count: 128, value: "₹28,20,000", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "Negotiation", count: 62, value: "₹16,80,000", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "Won", count: 32, value: "₹14,50,000", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "Lost", count: 45, value: "₹6,10,000", color: "bg-red-100 text-red-700 border-red-200" },
];

const REMINDERS = [
  {
    icon: MessageCircle,
    iconColor: "text-green-500 bg-green-50",
    name: "Call Mr. Rohit Sharma",
    time: "Today, 03:00 PM",
    company: "Sharma Industries",
  },
  {
    icon: Phone,
    iconColor: "text-blue-500 bg-blue-50",
    name: "Follow up with Priya Patel",
    time: "Today, 04:30 PM",
    company: "Patel & Co.",
  },
  {
    icon: Mail,
    iconColor: "text-purple-500 bg-purple-50",
    name: "Send proposal to Amit Kumar",
    time: "Tomorrow, 11:00 AM",
    company: "Kumar Enterprises",
  },
];

const ALL_LEADS = [
  { initials: "RS", name: "Rohit Sharma", company: "Sharma Industries", stage: "Negotiation", value: "₹4,20,000", owner: "Arjun Mehta", priority: "High", date: "Today, 03:00 PM" },
  { initials: "PP", name: "Priya Patel", company: "Patel & Co.", stage: "Proposal Sent", value: "₹2,80,000", owner: "Neha Singh", priority: "High", date: "Today, 04:30 PM" },
  { initials: "AK", name: "Amit Kumar", company: "Kumar Enterprises", stage: "Qualified", value: "₹6,50,000", owner: "Vikram Rao", priority: "Medium", date: "Tomorrow, 11:00 AM" },
  { initials: "SC", name: "Sneha Choudhary", company: "Choudhary Solutions", stage: "Contacted", value: "₹1,90,000", owner: "Neha Singh", priority: "Medium", date: "Tomorrow, 03:30 PM" },
  { initials: "VS", name: "Vikas Singh", company: "Singh Traders", stage: "New", value: "₹3,10,000", owner: "Arjun Mehta", priority: "Low", date: "14 May, 10:00 AM" },
  { initials: "RV", name: "Rahul Verma", company: "Verma Tech", stage: "Won", value: "₹8,75,000", owner: "Pooja Mehta", priority: "High", date: "13 May, 02:00 PM" },
  { initials: "NK", name: "Nisha Kapoor", company: "Kapoor & Sons", stage: "Closed Lost", value: "₹2,30,000", owner: "Arjun Mehta", priority: "Low", date: "12 May, 09:00 AM" },
];

const priorityStyle = {
  High: "bg-red-50 text-red-600 border border-red-200",
  Medium: "bg-amber-50 text-amber-600 border border-amber-200",
  Low: "bg-green-50 text-green-600 border border-green-200",
};

const stageStyle = {
  New: "bg-blue-50 text-blue-600",
  Contacted: "bg-cyan-50 text-cyan-600",
  Qualified: "bg-teal-50 text-teal-700",
  "Proposal Sent": "bg-amber-50 text-amber-700",
  Negotiation: "bg-orange-50 text-orange-600",
  Won: "bg-green-50 text-green-700",
  "Closed Lost": "bg-red-50 text-red-600",
};

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-green-100 text-green-700",
];

export default function SalesPortal() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-[#111827] flex flex-col flex-shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">SALES PORTAL</span>
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
                        onClick={() => setActiveNav(item.label)}
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
        <div className="px-3 py-3 border-t border-white/10">
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

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top Bar ── */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 flex-shrink-0">
          <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="pl-8 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400"
                placeholder="Search by name, company, phone..."
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-200 rounded px-1">⌘K</span>
            </div>
            {/* Notifications */}
            <button className="relative p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <Bell size={16} />
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">6</span>
            </button>
            {/* User */}
            <button className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg hover:bg-slate-100 border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">AM</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[12px] font-medium text-slate-700 leading-tight">Arjun Mehta</p>
                <p className="text-[10px] text-slate-500 leading-tight">Sales Owner</p>
              </div>
              <ChevronDown size={12} className="text-slate-400 ml-1" />
            </button>
          </div>
        </header>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-auto">
          <div className="p-5 space-y-5">
            {/* Welcome */}
            <p className="text-[15px] text-slate-600">
              Welcome back, <span className="font-semibold text-slate-800">Arjun Mehta</span> 👋
            </p>

            {/* ── KPI Row 1 ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {KPI_CARDS.slice(0, 4).map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between hover:shadow-sm transition-shadow">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 mb-1">{card.label}</p>
                      <p className="text-2xl font-bold text-slate-800 leading-tight">{card.value}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {card.up ? (
                          <ArrowUpRight size={13} className="text-green-500" />
                        ) : (
                          <ArrowDownRight size={13} className="text-red-500" />
                        )}
                        <span className={`text-[12px] font-semibold ${card.up ? "text-green-600" : "text-red-500"}`}>{card.change}</span>
                        <span className="text-[11px] text-slate-400">{card.sub}</span>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={card.iconColor} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── KPI Row 2 ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {KPI_CARDS.slice(4).map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between hover:shadow-sm transition-shadow">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 mb-1">{card.label}</p>
                      <p className="text-2xl font-bold text-slate-800 leading-tight">{card.value}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {card.up ? (
                          <ArrowUpRight size={13} className="text-green-500" />
                        ) : (
                          <ArrowDownRight size={13} className="text-red-500" />
                        )}
                        <span className={`text-[12px] font-semibold ${card.up ? "text-green-600" : "text-red-500"}`}>{card.change}</span>
                        <span className="text-[11px] text-slate-400">{card.sub}</span>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={card.iconColor} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Sales Pipeline + Reminders ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Pipeline */}
              <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-semibold text-slate-800">Sales Pipeline</h2>
                  <select className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>This Quarter</option>
                  </select>
                </div>
                {/* Funnel */}
                <div className="flex items-stretch gap-0.5 mb-3 overflow-x-auto pb-1">
                  {PIPELINE_STAGES.map((stage, i) => (
                    <div
                      key={stage.label}
                      className={`flex-1 min-w-[90px] rounded-lg border px-2.5 py-3 text-center cursor-pointer hover:opacity-90 transition-opacity ${stage.color}`}
                      style={{ clipPath: i < PIPELINE_STAGES.length - 1 ? "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)" : "none" }}
                    >
                      <p className="text-[10px] font-semibold opacity-80 mb-1">{stage.label}</p>
                      <p className="text-xl font-bold">{stage.count}</p>
                      <p className="text-[10px] font-medium opacity-70 mt-0.5">{stage.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[12px] text-slate-500">
                    Total Pipeline Value: <span className="font-semibold text-blue-600">₹1,68,35,000</span>
                  </span>
                  <span className="text-[12px] text-slate-500">
                    Conversion Rate: <span className="font-semibold text-green-600">12.5%</span>
                  </span>
                </div>
              </div>

              {/* Reminders */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[14px] font-semibold text-slate-800">Upcoming Reminders</h2>
                  <button className="text-[11px] text-blue-500 hover:text-blue-700 font-medium">View All</button>
                </div>
                <div className="space-y-3 flex-1">
                  {REMINDERS.map((r, i) => {
                    const Icon = r.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${r.iconColor}`}>
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-700 truncate">{r.name}</p>
                          <p className="text-[11px] text-orange-500 font-medium">{r.time}</p>
                          <p className="text-[11px] text-slate-400">{r.company}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg">
                    <RefreshCcw size={13} className="text-blue-500 flex-shrink-0" />
                    <p className="text-[11px] text-blue-600 font-medium flex-1">AI extracted 5 reminders from recent notes</p>
                    <button className="text-[11px] text-blue-600 font-semibold hover:underline">Review</button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── All Leads ── */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                <div>
                  <h2 className="text-[14px] font-semibold text-slate-800">All Leads</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Your assigned leads pipeline</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 text-[12px] text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <Filter size={12} />
                    Filter
                  </button>
                  <button className="flex items-center gap-1.5 text-[12px] text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <Download size={12} />
                    Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Lead", "Company", "Stage", "Value", "Owner", "Follow Up", "Priority", ""].map((h) => (
                        <th key={h} className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_LEADS.map((lead, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-700">{lead.name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{lead.company}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${stageStyle[lead.stage] ?? "bg-slate-100 text-slate-600"}`}>
                            {lead.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{lead.value}</td>
                        <td className="px-4 py-3 text-slate-500">{lead.owner}</td>
                        <td className={`px-4 py-3 ${lead.date.startsWith("Today") ? "text-orange-500 font-medium" : "text-slate-400"}`}>
                          {lead.date}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${priorityStyle[lead.priority]}`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                              <Eye size={13} />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                              <MoreVertical size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 flex items-center justify-between border-t border-slate-100">
                <p className="text-[12px] text-slate-400">Showing {ALL_LEADS.length} of 1,234 leads</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, "...", 42].map((p, i) => (
                    <button
                      key={i}
                      className={`w-7 h-7 rounded-lg text-[12px] font-medium transition-colors ${
                        p === 1 ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] text-slate-500 hover:bg-slate-100 transition-colors">
                    Next <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}