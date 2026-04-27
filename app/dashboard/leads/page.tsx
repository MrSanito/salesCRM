"use client"
import { useState } from "react";
import LeadsTable from "@/components/dashboard/LeadsTable";
import LeadDetailModal from "@/components/dashboard/LeadDetailModal";
import AddLeadModal from "@/components/dashboard/AddLeadModal";
import { Plus, Search, Filter, Download } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

export default function LeadsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const { user } = useAuth();

  const switchLead = (dir: "next" | "prev") => {
    if (!selectedLeadId || leadIds.length === 0) return;
    const currentIndex = leadIds.indexOf(selectedLeadId);
    let newIndex = dir === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = leadIds.length - 1;
    if (newIndex >= leadIds.length) newIndex = 0;
    setSelectedLeadId(leadIds[newIndex]);
  };

  // Only CEO and Manager can add leads based on previous instructions, 
  // but let's check if the user is authorized.
  const canAddLead = user?.role === "CEO" || user?.role === "MANAGER";

  const handleLeadClick = (id: string, allIds?: string[]) => {
    setSelectedLeadId(id);
    if (allIds) setLeadIds(allIds);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leads Pipeline</h1>
          <p className="text-slate-500 text-sm">Manage and track all your sales opportunities</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download size={16} />
            Export CSV
          </button>
          
          {canAddLead && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
            >
              <Plus size={18} />
              Add Lead
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search leads by name, email, or company..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
        <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option>All Stages</option>
          <option>New</option>
          <option>Contacted</option>
          <option>Qualified</option>
          <option>Proposal Sent</option>
          <option>Negotiation</option>
          <option>Won</option>
          <option>Lost</option>
        </select>
        <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option>All Owners</option>
          {/* We could fetch owners here, but for now just placeholder */}
        </select>
      </div>

      <LeadsTable 
        refreshKey={refreshKey} 
        onLeadClick={handleLeadClick} 
        activeNav="Leads" 
      />

      {selectedLeadId && (
        <LeadDetailModal 
          leadId={selectedLeadId} 
          onClose={() => setSelectedLeadId(null)} 
          onUpdate={() => setRefreshKey(prev => prev + 1)}
          onSwitch={switchLead}
        />
      )}

      {showAddModal && (
        <AddLeadModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
}
