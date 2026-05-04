"use client"
import KpiGrid from "@/components/dashboard/KpiGrid";
import PipelineFunnel from "@/components/dashboard/PipelineFunnel";
import RemindersList from "@/components/dashboard/RemindersList";
import LeadsTable from "@/components/dashboard/LeadsTable";
import { useAuth } from "@/components/auth/AuthContext";
import { UserPlus, UserCircle2, Plus, Bell } from "lucide-react";
import { useState } from "react";
import FollowUpModal from "@/components/dashboard/FollowupModal";
import type { SidebarFilterConfig } from "@/app/dashboard/page";

interface DashboardViewProps {
  onAddLead: () => void;
  onAddEmployee: () => void;
  onLeadClick: (id: string, allIds?: string[]) => void;
  activeNav: string;
  refreshKey?: number;
  sidebarFilter?: SidebarFilterConfig | null;
}

export default function DashboardView({ onAddLead, onAddEmployee, onLeadClick, activeNav, refreshKey = 0, sidebarFilter }: DashboardViewProps) {
  const { user } = useAuth();
  const [showFollowup, setShowFollowup] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Dashboard Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200/50 group-hover:scale-105 transition-all">
             <UserCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 truncate">Strategic Dashboard</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-[15px] sm:text-[17px] text-slate-600 font-medium">
                Welcome, <span className="font-bold text-slate-900">{user?.name?.split(" ")[0] || "Arjun"}</span> 👋
              </h1>
              
              {/* Conditional Reminder at .45 minute */}
              {(() => {
                const now = new Date();
                const is45 = now.getMinutes() === 45;
                if (!is45) return null;

                const users = ["Rahul", "Priya", "Suresh", "Anita", "Vikram", "Deepa"];
                const times = ["10:30 AM", "2:45 PM", "11:15 AM", "4:20 PM", "9:00 AM"];
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const randomTime = times[Math.floor(Math.random() * times.length)];

                return (
                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-600 px-2 py-1 rounded-lg animate-bounce shadow-sm">
                    <Bell size={10} className="fill-orange-500 flex-shrink-0" />
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider whitespace-nowrap">
                      {randomUser}: {randomTime}
                    </span>
                  </div>
                );
              })()}

              <button 
                onClick={() => setShowFollowup(true)}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-all active:scale-95 border border-blue-100 shadow-sm shadow-blue-100/50"
              >
                <Bell size={10} className="animate-bounce" />
                Test
              </button>
            </div>
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
      <KpiGrid refreshKey={refreshKey} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <PipelineFunnel refreshKey={refreshKey} />
        </div>
        <RemindersList refreshKey={refreshKey} />
      </div>

      {/* Leads Management Section */}
      <LeadsTable 
        activeNav={activeNav} 
        onLeadClick={onLeadClick} 
        refreshKey={refreshKey}
        sidebarFilter={sidebarFilter}
      />
      {/* Follow Up Modal Triggered by Test Button */}
      {showFollowup && (
        <FollowUpModal 
          isOpen={true} 
          onClose={() => setShowFollowup(false)} 
        />
      )}
    </div>
  );
}
