"use client"
import KpiGrid from "@/components/dashboard/KpiGrid";
import PipelineFunnel from "@/components/dashboard/PipelineFunnel";
import RemindersList from "@/components/dashboard/RemindersList";
import LeadsTable from "@/components/dashboard/LeadsTable";
import { UserPlus } from "lucide-react";

interface DashboardViewProps {
  onAddLead: () => void;
  onLeadClick: (id: number) => void;
  activeNav: string;
}

export default function DashboardView({ onAddLead, onLeadClick, activeNav }: DashboardViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Dashboard Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-[15px] text-slate-600">
            Welcome back, <span className="font-semibold text-slate-800">Arjun Mehta</span> 👋
          </p>
          
        </div>
      </header>

      {/* Metrics and Pipeline Sections */}
      <KpiGrid />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <PipelineFunnel />
        </div>
        <RemindersList />
      </div>

      {/* Leads Management Section */}
      <LeadsTable 
        activeNav={activeNav} 
        onLeadClick={onLeadClick} 
      />
    </div>
  );
}
