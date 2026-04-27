"use client"
import KpiGrid from "@/components/dashboard/KpiGrid";
import PipelineFunnel from "@/components/dashboard/PipelineFunnel";
import RemindersList from "@/components/dashboard/RemindersList";
import LeadsTable from "@/components/dashboard/LeadsTable";
import { useAuth } from "@/components/auth/AuthContext";
import { UserPlus, UserCircle2, Plus } from "lucide-react";

interface DashboardViewProps {
  onAddLead: () => void;
  onAddEmployee: () => void;
  onLeadClick: (id: number) => void;
  activeNav: string;
}

export default function DashboardView({ onAddLead, onAddEmployee, onLeadClick, activeNav }: DashboardViewProps) {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Dashboard Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200/50 group-hover:scale-105 transition-all">
             <UserCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Strategic Dashboard</p>
            <h1 className="text-[17px] text-slate-600 font-medium">
              Welcome back, <span className="font-bold text-slate-900">{user?.name || "Arjun Mehta"}</span> 👋
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(user?.role === "MANAGER" || user?.role === "ORG_ADMIN") && (
            <>
              <button 
                onClick={onAddEmployee}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
              >
                <UserPlus size={14} className="text-blue-500" />
                Add Employee
              </button>
              <button 
                onClick={onAddLead}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                <Plus size={14} className="text-blue-400" />
                Add Lead
              </button>
            </>
          )}
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
