"use client"
import { Users, UserPlus, Phone, Trophy, TrendingDown, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

interface KpiData {
  totalLeads: number;
  newLeadsThisWeek: number;
  followUpsDueToday: number;
  wonDeals: number;
  totalPipelineValue: number;
}

function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

interface KpiGridProps {
  refreshKey?: number;
}

export default function KpiGrid({ refreshKey = 0 }: KpiGridProps) {
  const [kpis, setKpis] = useState<KpiData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => { if (d.kpis) setKpis(d.kpis); })
      .catch(() => {});
  }, [refreshKey]);

  const cards = [
    { label: "Total Leads", value: kpis ? String(kpis.totalLeads) : "—", icon: Users, iconBg: "bg-blue-50", iconColor: "text-blue-500", change: "Pipeline", up: true },
    { label: "New This Week", value: kpis ? String(kpis.newLeadsThisWeek) : "—", icon: UserPlus, iconBg: "bg-teal-50", iconColor: "text-teal-500", change: "This week", up: true },
    { label: "Follow Ups Today", value: kpis ? String(kpis.followUpsDueToday) : "—", icon: Phone, iconBg: "bg-orange-50", iconColor: "text-orange-500", change: "Due today", up: kpis ? kpis.followUpsDueToday === 0 : true },
    { label: "Won Deals", value: kpis ? String(kpis.wonDeals) : "—", icon: Trophy, iconBg: "bg-purple-50", iconColor: "text-purple-500", change: "Total won", up: true },
    { label: "Pipeline Value", value: kpis ? formatINR(kpis.totalPipelineValue) : "—", icon: TrendingDown, iconBg: "bg-green-50", iconColor: "text-green-500", change: "Total value", up: true },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      {cards.map((card) => {
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
              <div className="flex items-center gap-1 mt-1 sm:mt-1.5">
                <ArrowUpRight size={12} className="text-green-500" />
                <span className="text-[9px] sm:text-[11px] text-slate-400 truncate">{card.change}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
