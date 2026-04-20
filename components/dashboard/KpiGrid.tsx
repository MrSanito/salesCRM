"use client"
import { Users, UserPlus, Phone, Trophy, Snowflake, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

const KPI_DATA = [
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

export default function KpiGrid() {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      {KPI_DATA.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-2 sm:p-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
               <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-lg ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={14} className={`sm:w-[18px] sm:h-[18px] ${card.iconColor}`} />
              </div>
            </div>
            <div>
              <p className="text-[9px] sm:text-[11px] font-medium text-slate-500 mb-0.5 sm:mb-1 truncate">{card.label}</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-800 leading-tight">{card.value}</p>
              <div className="flex items-center gap-1 mt-1 sm:mt-1.5 flex-wrap">
                {card.up ? (
                  <ArrowUpRight size={12} className="text-green-500" />
                ) : (
                   <ArrowDownRight size={12} className="text-red-500" />
                )}
                <span className={`text-[10px] sm:text-[12px] font-semibold ${card.up ? "text-green-600" : "text-red-500"}`}>{card.change}</span>
                <span className="text-[9px] sm:text-[11px] text-slate-400 truncate max-w-full">{card.sub}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
