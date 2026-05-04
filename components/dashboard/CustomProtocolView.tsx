"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Filter, ChevronDown, Download, Eye, MoreVertical, 
  ChevronRight, XCircle, Edit, Trash2, Target, Sparkles, Bell
} from "lucide-react";
import * as XLSX from "xlsx";
import BulkUpdateModal from "./BulkUpdateModal";
import BulkDeleteModal from "./BulkDeleteModal";

// Stage/priority style maps — kept in sync with schema enums
const STAGE_STYLES: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-600",
  CONTACTED: "bg-cyan-50 text-cyan-600",
  NOT_INTERESTED: "bg-red-50 text-red-600",
  MEETING_SET: "bg-indigo-50 text-indigo-600",
  NEGOTIATION: "bg-amber-50 text-amber-700",
  COLD: "bg-slate-50 text-slate-600",
  CHATTING: "bg-green-50 text-green-700",
};

const STAGE_LABEL: Record<string, string> = {
  NEW: "New", 
  CONTACTED: "Contacted", 
  NOT_INTERESTED: "Not Interested",
  MEETING_SET: "Meeting Set", 
  NEGOTIATION: "Negotiation",
  COLD: "Cold Chatting", 
  CHATTING: "Cold Chatting",
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-50 text-red-600 border border-red-200",
  MEDIUM: "bg-amber-50 text-amber-600 border border-amber-200",
  LOW: "bg-green-50 text-green-600 border border-green-200",
};

const SUB_STATUS_LABEL: Record<string, string> = {
  NO_REQUIREMENT: "No Requirement",
  BUDGET_LOW: "Budget Low",
  PROPOSAL_SENT: "Proposal Sent",
  WARM_LEAD: "Warm Lead",
  BLANK: "Blank",
};

const SUB_STATUS_STYLES: Record<string, string> = {
  NO_REQUIREMENT: "bg-slate-100 text-slate-500 border border-slate-200",
  BUDGET_LOW: "bg-red-50 text-red-600 border border-red-100",
  PROPOSAL_SENT: "bg-blue-50 text-blue-600 border border-blue-100",
  WARM_LEAD: "bg-orange-50 text-orange-600 border border-orange-100",
  BLANK: "bg-slate-50 text-slate-400 border border-slate-100",
};

interface DbLead {
  id: string;
  contactName: string;
  company: string;
  industry: string | null;
  stage: string;
  subStatus: string;
  priority: string;
  dealValueInr: string;
  phone: string | null;
  email: string | null;
  followUpAt: string | null;
  requirement: string | null;
  createdAt: string;
  owner: { name: string; initials: string };
}

interface CustomProtocolViewProps {
  filter: {
    id: string;
    name: string;
    status: string | null;
    subStatus: string | null;
    dealSizeMin: string | null;
    dealSizeMax: string | null;
  };
  onLeadClick: (id: string, allIds?: string[]) => void;
  refreshKey?: number;
}

export default function CustomProtocolView({ filter, onLeadClick, refreshKey = 0 }: CustomProtocolViewProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<DbLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLeadMenu, setActiveLeadMenu] = useState<string | null>(null);
  
  // States for Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof DbLead | 'lead', direction: 'asc' | 'desc' } | null>(null);
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const fetchLeads = () => {
    setLoading(true);
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLeads(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [refreshKey]);

  useEffect(() => {
    setSelectedLeads(new Set());
    setCurrentPage(1);
  }, [filter.id]);

  const handleExportExcel = (dataToExport: DbLead[], filename: string) => {
    const worksheetData = dataToExport.map(lead => ({
      "Contact Name": lead.contactName,
      "Company": lead.company,
      "Stage": STAGE_LABEL[lead.stage] || lead.stage,
      "Phone": lead.phone || "",
      "Email": lead.email || "",
      "Deal Value (INR)": lead.dealValueInr,
      "Priority": lead.priority,
      "Requirement": lead.requirement || "",
      "Owner": lead.owner?.name || "",
      "Created At": new Date(lead.createdAt).toLocaleDateString("en-IN")
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handleDeleteLead = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
        setShowDeleteConfirm(null);
        setActiveLeadMenu(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === processedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(processedLeads.map(l => l.id)));
    }
  };

  const toggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  // Processing Leads
  let processedLeads = [...leads];

  // 1. Sidebar Filter (The main focus of this view)
  if (filter.status) processedLeads = processedLeads.filter(l => l.stage === filter.status);
  if (filter.subStatus) processedLeads = processedLeads.filter(l => l.subStatus === filter.subStatus);
  if (filter.dealSizeMin) {
    const min = parseFloat(filter.dealSizeMin);
    processedLeads = processedLeads.filter(l => parseFloat(l.dealValueInr || "0") >= min);
  }
  if (filter.dealSizeMax) {
    const max = parseFloat(filter.dealSizeMax);
    processedLeads = processedLeads.filter(l => parseFloat(l.dealValueInr || "0") <= max);
  }

  // 2. Column Filters
  Object.keys(columnFilters).forEach(key => {
    const activeValues = columnFilters[key];
    if (activeValues.size > 0) {
      processedLeads = processedLeads.filter(l => activeValues.has(String((l as any)[key])));
    }
  });

  // 3. Sorting
  if (sortConfig) {
    processedLeads.sort((a, b) => {
      let valA: any, valB: any;
      if (sortConfig.key === 'lead') {
        valA = a.contactName.toLowerCase();
        valB = b.contactName.toLowerCase();
      } else if (sortConfig.key === 'dealValueInr') {
        valA = parseFloat(a.dealValueInr || "0");
        valB = parseFloat(b.dealValueInr || "0");
      } else {
        valA = (a as any)[sortConfig.key];
        valB = (b as any)[sortConfig.key];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
      }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  } else {
    processedLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 4. Pagination
  const totalPages = Math.ceil(processedLeads.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeads = processedLeads.slice(startIndex, startIndex + pageSize);

  const toggleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      const currentSet = new Set(next[column] || []);
      if (currentSet.has(value)) currentSet.delete(value);
      else currentSet.add(value);
      next[column] = currentSet;
      return next;
    });
    setCurrentPage(1);
  };

  function formatFollowUp(dateStr: string | null) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const now = new Date();
    const diffH = Math.round((d.getTime() - now.getTime()) / 3600000);
    if (diffH < 0) return "Overdue";
    if (diffH < 24) return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffH < 48) return "Tomorrow";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function formatValue(v: string) {
    const n = parseFloat(v);
    if (!n) return "—";
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString("en-IN")}`;
  }

  const getUniqueValues = (key: keyof DbLead) => {
    const values = new Set<string>();
    leads.forEach(l => { if (l[key]) values.add(String(l[key])); });
    return Array.from(values).sort();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Focused Protocol Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
              <Target size={20} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {filter.name}
              <Sparkles size={16} className="text-orange-400" />

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
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1 rounded-xl animate-bounce ml-4 shadow-sm">
                    <Bell size={12} className="fill-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Protocol Alert: {randomUser} follow-up at {randomTime}
                    </span>
                  </div>
                );
              })()}
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium ml-11">
            {loading ? "Syncing protocol..." : `${processedLeads.length} leads detected in this active view`}
          </p>
        </div>

        <div className="flex items-center gap-3 ml-11 md:ml-0">
          {selectedLeads.size > 0 && (
            <div className="flex items-center gap-2 pr-3 border-r border-slate-100 mr-2 animate-in fade-in slide-in-from-right-2 duration-300">
              <button 
                onClick={() => setShowBulkUpdate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 text-[12px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all active:scale-95"
              >
                <Edit size={12} /> Bulk Update ({selectedLeads.size})
              </button>
              <button 
                onClick={() => setShowBulkDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-[12px] font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all active:scale-95"
              >
                <Trash2 size={12} /> Bulk Delete
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 mr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Show</span>
            <input 
              type="number" 
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value) || 20);
                setCurrentPage(1);
              }}
              className="w-10 bg-transparent border-none text-[12px] font-bold text-slate-700 focus:outline-none p-0"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              <Download size={14} /> Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button onClick={() => { handleExportExcel(processedLeads, filter.name); setShowExportMenu(false); }} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">Excel (.xlsx)</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* High Fidelity Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-[40px] px-3 py-3">
                  <input 
                    type="checkbox" 
                    checked={selectedLeads.size > 0 && selectedLeads.size === paginatedLeads.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="w-[15%] text-left text-[11px] font-bold text-slate-500 uppercase px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setSortConfig({ key: 'lead', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' })}>
                  Lead
                </th>
                <th className="hidden md:table-cell w-[12%] text-left text-[11px] font-bold text-slate-500 uppercase px-4 py-3">Company</th>
                <th className="w-[10%] text-left text-[11px] font-bold text-slate-500 uppercase px-3 py-3">Status</th>
                <th className="w-[10%] text-left text-[11px] font-bold text-slate-500 uppercase px-3 py-3">Sub-status</th>
                <th className="hidden sm:table-cell w-[10%] text-left text-[11px] font-bold text-slate-500 uppercase px-3 py-3">Phone</th>
                <th className="hidden lg:table-cell w-[10%] text-left text-[11px] font-bold text-slate-500 uppercase px-3 py-3">Owner</th>
                <th className="hidden xl:table-cell w-[12%] text-left text-[11px] font-bold text-slate-500 uppercase px-3 py-3">Value</th>
                <th className="w-[45px] text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-20 animate-pulse text-slate-400 font-bold uppercase text-[10px]">Syncing protocol...</td></tr>
              ) : paginatedLeads.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-20 text-slate-400">No matching leads in this view</td></tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    onClick={() => onLeadClick(lead.id, processedLeads.map(l => l.id))}
                    className={`group hover:bg-slate-50 transition-all cursor-pointer ${selectedLeads.has(lead.id) ? "bg-blue-50/30" : ""}`}
                  >
                    <td className="px-3 py-3" onClick={(e) => toggleSelectLead(lead.id, e)}>
                      <input type="checkbox" checked={selectedLeads.has(lead.id)} readOnly className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-all">
                          {lead.contactName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{lead.contactName}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-slate-600 font-medium truncate">{lead.company}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${STAGE_STYLES[lead.stage] ?? "bg-slate-100 text-slate-600"}`}>
                        {STAGE_LABEL[lead.stage] || lead.stage}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap border ${SUB_STATUS_STYLES[lead.subStatus] ?? "bg-slate-50 text-slate-400 border-slate-100"}`}>
                        {SUB_STATUS_LABEL[lead.subStatus] || lead.subStatus}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 text-slate-600 text-[11px] font-mono">{lead.phone || "—"}</td>
                    <td className="hidden lg:table-cell px-3 py-3 text-slate-500 font-medium truncate">{lead.owner?.name.split(" ")[0] || "—"}</td>
                    <td className="hidden xl:table-cell px-3 py-3 text-slate-900 font-black text-[12px]">{formatValue(lead.dealValueInr)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-slate-900 transition-all">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, processedLeads.length)} of {processedLeads.length}
          </p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold disabled:opacity-30">Previous</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold disabled:opacity-30">Next</button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto text-red-500"><XCircle size={24} /></div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Lead Protocol?</h3>
            <p className="text-slate-500 text-center text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 text-sm font-semibold border rounded-xl">Cancel</button>
              <button onClick={() => handleDeleteLead(showDeleteConfirm)} className="flex-1 px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}

      <BulkUpdateModal 
        isOpen={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        selectedIds={Array.from(selectedLeads)}
        onSuccess={() => { setSelectedLeads(new Set()); fetchLeads(); }}
      />
      <BulkDeleteModal 
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        selectedIds={Array.from(selectedLeads)}
        onSuccess={() => { setSelectedLeads(new Set()); fetchLeads(); }}
      />
    </div>
  );
}
