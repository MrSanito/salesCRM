"use client"
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import LeadsTable from "@/components/dashboard/LeadsTable";
import LeadDetailModal from "@/components/dashboard/LeadDetailModal";
import AddLeadModal from "@/components/dashboard/AddLeadModal";
import { Plus, Download, Users, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import * as XLSX from "xlsx";

export default function LeadsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const [ownerDetails, setOwnerDetails] = useState<{id: string, name: string}[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [isOwnerInitialized, setIsOwnerInitialized] = useState(false);
  const { user } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    const leadId = searchParams.get("id");
    if (leadId) setSelectedLeadId(leadId);
  }, [searchParams]);

  // Set default owner to current user on first load
  useEffect(() => {
    if (user?.id && !isOwnerInitialized) {
      setSelectedOwner(user.id);
      setIsOwnerInitialized(true);
    }
  }, [user?.id, isOwnerInitialized]);

  // Fetch owners for the filter dropdown
  useEffect(() => {
    fetch("/api/leads/distinct-filters")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error && data.ownerDetails) {
          setOwnerDetails(data.ownerDetails);
        }
      })
      .catch(console.error);
  }, []);

  const switchLead = (dir: "next" | "prev") => {
    if (!selectedLeadId || leadIds.length === 0) return;
    const currentIndex = leadIds.indexOf(selectedLeadId);
    let newIndex = dir === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = leadIds.length - 1;
    if (newIndex >= leadIds.length) newIndex = 0;
    setSelectedLeadId(leadIds[newIndex]);
  };

  const canAddLead = user?.role === "CEO" || user?.role === "MANAGER";
  const canFilterOwner = user?.role === "CEO" || user?.role === "ORG_ADMIN";

  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/leads");
      const leads = await res.json();
      if (!Array.isArray(leads)) return;

      const worksheetData = leads.map((lead: any) => ({
        "Contact Name": lead.contactName,
        "Company": lead.company,
        "Industry": lead.industry || "",
        "Stage": lead.stage,
        "Phone": lead.phone || "",
        "Email": lead.email || "",
        "Deal Value (INR)": lead.dealValueInr,
        "Priority": lead.priority,
        "Owner": lead.owner?.name || "",
        "Created At": new Date(lead.createdAt).toLocaleDateString("en-IN")
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      XLSX.writeFile(workbook, "New_Leads_Pipeline.csv", { bookType: "csv" });
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const handleLeadClick = (id: string, allIds?: string[]) => {
    setSelectedLeadId(id);
    if (allIds) setLeadIds(allIds);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Leads Pipeline</h1>
          <p className="text-slate-500 text-sm">Review and qualify incoming sales opportunities</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Owner Filter Dropdown - Only for Admins */}
          {canFilterOwner && (
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <select 
                id="owner-filter"
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer min-w-[160px]"
              >
                <option value="">All Owners</option>
                {ownerDetails.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          )}

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
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

      <LeadsTable 
        refreshKey={refreshKey} 
        onLeadClick={handleLeadClick} 
        activeNav="New Leads"
        stageFilter="NEW"
        ownerFilter={selectedOwner === "" ? undefined : selectedOwner}
        apiUrl="/api/leads/new-list"
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
