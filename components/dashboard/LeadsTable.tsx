"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Filter, ChevronDown, Download, Eye, MoreVertical, ChevronRight, XCircle, Edit, Trash2 } from "lucide-react";
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

interface LeadsTableProps {
  onLeadClick: (id: string, allIds?: string[]) => void;
  activeNav: string;
  refreshKey?: number;
}

export default function LeadsTable({ onLeadClick, activeNav, refreshKey = 0 }: LeadsTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<DbLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeLeadMenu, setActiveLeadMenu] = useState<string | null>(null);
  
  // New States for Pagination & Sorting
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

  const handleExportCSV = (dataToExport: DbLead[], filename: string) => {
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
    XLSX.writeFile(workbook, `${filename}.csv`, { bookType: "csv" });
  };

  const handleDeleteLead = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
        setShowDeleteConfirm(null);
        setActiveLeadMenu(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete lead");
      }
    } catch (e) {
      alert("An error occurred while deleting the lead");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLeads(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Handle Selection
  const toggleSelectAll = () => {
    if (selectedLeads.size === displayedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(displayedLeads.map(l => l.id)));
    }
  };

  const toggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  // Processing Leads (Filter -> Sort -> Paginate)
  let processedLeads = [...leads];

  // 1. Navigation Filters
  if (activeNav === "Alerts") processedLeads = processedLeads.filter((l) => l.priority === "HIGH");
  if (activeNav === "New Leads") processedLeads = processedLeads.filter((l) => l.stage === "NEW");

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
      } else {
        valA = (a as any)[sortConfig.key];
        valB = (b as any)[sortConfig.key];
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  } else {
    // Default sort: newest first
    processedLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const displayedLeads = processedLeads; // For selection and total count
  
  // 4. Pagination
  const totalPages = Math.ceil(displayedLeads.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeads = displayedLeads.slice(startIndex, startIndex + pageSize);

  const toggleColumnFilter = (column: string, value: string | string[]) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      const currentSet = new Set(next[column] || []);
      const values = Array.isArray(value) ? value : [value];
      
      const allExist = values.every(v => currentSet.has(v));
      if (allExist) {
        values.forEach(v => currentSet.delete(v));
      } else {
        values.forEach(v => currentSet.add(v));
      }
      
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

  // Helper to get unique values for filters
  const getUniqueValues = (key: keyof DbLead) => {
    const values = new Set<string>();
    leads.forEach(l => {
      if (l[key]) values.add(String(l[key]));
    });
    return Array.from(values).sort();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto text-red-500">
              <XCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Lead Protocol?</h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              This will permanently remove the lead data and all associated protocol history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                No, Keep it
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteLead(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-800 flex items-center gap-2">
            {activeNav === "New Leads" ? "New Leads Pipeline" : activeNav === "Alerts" ? "High Priority Alerts" : "All Leads Pipeline"}
            {(selectedLeads.size > 0 || (displayedLeads.length > 0 && displayedLeads.length < leads.length)) && (
              <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black border transition-all ${
                selectedLeads.size > 0 
                  ? "bg-blue-600 text-white border-blue-700 shadow-sm" 
                  : "bg-blue-50 text-blue-600 border-blue-100"
              }`}>
                {selectedLeads.size > 0 ? selectedLeads.size : displayedLeads.length}
              </span>
            )}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {loading ? "Loading..." : `${displayedLeads.length} lead${displayedLeads.length !== 1 ? "s" : ""} detected in current view`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Show</span>
            <input 
              type="number" 
              value={pageSize}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 20;
                setPageSize(val);
                setCurrentPage(1);
              }}
              className="w-10 bg-transparent border-none text-[12px] font-bold text-slate-700 focus:outline-none p-0"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-1.5 text-[12px] border px-3 py-1.5 rounded-lg transition-all ${showFilterMenu ? "bg-slate-100 border-slate-300 text-slate-900" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            >
              <Filter size={12} /> Global Sort
              <ChevronDown size={11} className={`text-slate-400 transition-transform ${showFilterMenu ? "rotate-180" : ""}`} />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Sorting</p>
                </div>
                <button onClick={() => { setSortConfig(null); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700">Newest Created (Default)</button>
                <button onClick={() => { setSortConfig({ key: 'createdAt', direction: 'asc' }); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Oldest Created</button>
                <button onClick={() => { setSortConfig({ key: 'dealValueInr', direction: 'desc' }); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Value: High to Low</button>
                <button onClick={() => { setSortConfig({ key: 'dealValueInr', direction: 'asc' }); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Value: Low to High</button>
                <div className="px-3 py-2 border-t border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Filters</p>
                </div>
                <button onClick={() => { setColumnFilters({}); setSortConfig(null); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-red-50 text-red-600 transition-colors font-bold border-t border-slate-50">Clear All Settings</button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`flex items-center gap-1.5 text-[12px] border px-3 py-1.5 rounded-lg transition-all ${showExportMenu ? "bg-slate-100 border-slate-300 text-slate-900" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            >
              <Download size={12} /> Export
              <ChevronDown size={11} className={`text-slate-400 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Export Options</p>
                </div>
                <button 
                  onClick={() => { handleExportExcel(leads, "All_Leads"); setShowExportMenu(false); }} 
                  className="w-full text-left px-3 py-2.5 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Excel (.xlsx) - All Leads
                </button>
                <button 
                  onClick={() => { handleExportExcel(displayedLeads, "Filtered_Leads"); setShowExportMenu(false); }} 
                  className="w-full text-left px-3 py-2.5 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Excel (.xlsx) - Filtered
                </button>
                <button 
                  onClick={() => { handleExportCSV(leads, "All_Leads"); setShowExportMenu(false); }} 
                  className="w-full text-left px-3 py-2.5 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  CSV (.csv) - All Leads
                </button>
              </div>
            )}
          </div>

          {selectedLeads.size > 1 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="w-[1px] h-6 bg-slate-200 mx-1" />
              <button
                onClick={() => setShowBulkUpdate(true)}
                className="flex items-center gap-1.5 text-[12px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
              >
                <Edit size={12} /> Bulk Update
              </button>
              <button
                onClick={() => setShowBulkDelete(true)}
                className="flex items-center gap-1.5 text-[12px] font-bold bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95"
              >
                <Trash2 size={12} /> Bulk Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <table className="w-full table-fixed text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="w-[40px] px-3 py-2.5">
                <input 
                  type="checkbox" 
                  checked={selectedLeads.size > 0 && selectedLeads.size === displayedLeads.length}
                  onChange={toggleSelectAll}
                  className="appearance-none w-4 h-4 rounded border-2 border-slate-400 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[10px] checked:after:font-bold checked:after:left-[1.5px] checked:after:top-[-1.5px]"
                />
              </th>
              {/* Interactive Headers */}
              <th 
                className="w-[15%] text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => setSortConfig(prev => ({ key: 'lead', direction: prev?.key === 'lead' && prev.direction === 'asc' ? 'desc' : 'asc' }))}
              >
                <div className="flex items-center gap-1">
                  Lead {sortConfig?.key === 'lead' && (sortConfig.direction === 'asc' ? "↑" : "↓")}
                </div>
              </th>
              <th 
                className="hidden md:table-cell w-[12%] text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => setSortConfig(prev => ({ key: 'company', direction: prev?.key === 'company' && prev.direction === 'asc' ? 'desc' : 'asc' }))}
              >
                <div className="flex items-center gap-1">
                  Company {sortConfig?.key === 'company' && (sortConfig.direction === 'asc' ? "↑" : "↓")}
                </div>
              </th>
              
              {/* Filterable Headers */}
              <th className="hidden lg:table-cell w-[10%] text-left px-2 py-2.5">
                <div className="relative inline-block">
                  <button 
                    onClick={() => setActiveColumnFilter(activeColumnFilter === 'industry' ? null : 'industry')}
                    className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 hover:text-slate-900 transition-colors ${columnFilters['industry']?.size ? "text-blue-600" : "text-slate-500"}`}
                  >
                    Industry <Filter size={10} />
                  </button>
                  {activeColumnFilter === 'industry' && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1">
                      <div className="px-3 py-1.5 border-b border-slate-50 mb-1">
                        <button onClick={() => setColumnFilters(prev => ({ ...prev, industry: new Set() }))} className="text-[9px] font-bold text-blue-600 uppercase">Clear</button>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {getUniqueValues('industry').map(v => (
                          <label key={v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={columnFilters['industry']?.has(v)} 
                              onChange={() => toggleColumnFilter('industry', v)}
                              className="appearance-none w-3.5 h-3.5 rounded border-2 border-slate-400 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[9px] checked:after:font-bold checked:after:left-[1px] checked:after:top-[-2px]"
                            />
                            <span className="text-[11px] text-slate-700 font-medium truncate">{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </th>

              <th className="w-[8%] text-left px-2 sm:px-3 py-2.5">
                <div className="relative inline-block">
                  <button 
                    onClick={() => setActiveColumnFilter(activeColumnFilter === 'stage' ? null : 'stage')}
                    className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 hover:text-slate-900 transition-colors ${columnFilters['stage']?.size ? "text-blue-600" : "text-slate-500"}`}
                  >
                    Status <Filter size={10} />
                  </button>
                  {activeColumnFilter === 'stage' && (
                    <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1">
                      <div className="px-3 py-1.5 border-b border-slate-50 mb-1">
                        <button onClick={() => setColumnFilters(prev => ({ ...prev, stage: new Set() }))} className="text-[9px] font-bold text-blue-600 uppercase">Clear</button>
                      </div>
                      {["NEW", "CONTACTED", "COLD", "MEETING_SET", "NEGOTIATION", "NOT_INTERESTED"].map(v => (
                        <label key={v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={columnFilters['stage']?.has(v)} 
                            onChange={() => toggleColumnFilter('stage', v === 'COLD' ? ['COLD', 'CHATTING'] : v)}
                            className="appearance-none w-3.5 h-3.5 rounded border-2 border-slate-400 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[9px] checked:after:font-bold checked:after:left-[1px] checked:after:top-[-2px]"
                          />
                          <span className="text-[11px] text-slate-700 font-medium">{v === 'COLD' ? 'Cold Chatting' : STAGE_LABEL[v]}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </th>

              <th className="w-[10%] text-left px-2 sm:px-3 py-2.5">
                <div className="relative inline-block">
                  <button 
                    onClick={() => setActiveColumnFilter(activeColumnFilter === 'subStatus' ? null : 'subStatus')}
                    className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 hover:text-slate-900 transition-colors ${columnFilters['subStatus']?.size ? "text-blue-600" : "text-slate-500"}`}
                  >
                    Sub-status <Filter size={10} />
                  </button>
                  {activeColumnFilter === 'subStatus' && (
                    <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1">
                      <div className="px-3 py-1.5 border-b border-slate-50 mb-1">
                        <button onClick={() => setColumnFilters(prev => ({ ...prev, subStatus: new Set() }))} className="text-[9px] font-bold text-blue-600 uppercase">Clear</button>
                      </div>
                      {Object.keys(SUB_STATUS_LABEL).map(v => (
                        <label key={v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={columnFilters['subStatus']?.has(v)} 
                            onChange={() => toggleColumnFilter('subStatus', v)}
                            className="appearance-none w-3.5 h-3.5 rounded border-2 border-slate-400 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[9px] checked:after:font-bold checked:after:left-[1px] checked:after:top-[-2px]"
                          />
                          <span className="text-[11px] text-slate-700 font-medium">{SUB_STATUS_LABEL[v]}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </th>

              <th className="hidden sm:table-cell w-[10%] text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 sm:px-3 py-2.5">Phone</th>
              <th className="hidden lg:table-cell w-[10%] text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5">Owner</th>
              <th className="hidden sm:table-cell w-[12%] text-left px-3 py-2.5">
                <div className="relative inline-block">
                  <button 
                    onClick={() => setActiveColumnFilter(activeColumnFilter === 'followup' ? null : 'followup')}
                    className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 hover:text-slate-900 transition-colors ${columnFilters['followup']?.size ? "text-blue-600" : "text-slate-500"}`}
                  >
                    Follow Up <Filter size={10} />
                  </button>
                  {activeColumnFilter === 'followup' && (
                    <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1">
                      <button onClick={() => { toggleColumnFilter('followup', 'OVERDUE'); setActiveColumnFilter(null); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 text-red-600 font-bold">Overdue Only</button>
                      <button onClick={() => { toggleColumnFilter('followup', 'TODAY'); setActiveColumnFilter(null); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 text-blue-600 font-bold border-t border-slate-50">Today Only</button>
                      <button onClick={() => { setColumnFilters(prev => ({ ...prev, followup: new Set() })); setActiveColumnFilter(null); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 text-slate-400 font-bold border-t border-slate-50">Clear Filter</button>
                    </div>
                  )}
                </div>
              </th>
              <th className="hidden xl:table-cell w-[6%] text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5">Value</th>
              <th className="hidden xl:table-cell w-[4%] text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5">Priority</th>
              <th className="w-[45px] text-right px-3 sm:px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr><td colSpan={11} className="text-center py-20">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Calibrating Pipeline...</p>
              </td></tr>
            )}
            {!loading && paginatedLeads.length === 0 && (
              <tr><td colSpan={11} className="text-center py-20 text-slate-400 text-[13px]">No leads matching protocol filters</td></tr>
            )}
            {paginatedLeads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
                className={`group hover:bg-slate-50 transition-all cursor-pointer ${selectedLeads.has(lead.id) ? "bg-blue-50/30" : ""}`}
              >
                <td className="px-3 py-3" onClick={(e) => toggleSelectLead(lead.id, e)}>
                  <input 
                    type="checkbox" 
                    checked={selectedLeads.has(lead.id)}
                    onChange={() => {}} // Handled by row click
                    className="appearance-none w-4 h-4 rounded border-2 border-slate-400 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[10px] checked:after:font-bold checked:after:left-[1.5px] checked:after:top-[-1.5px]"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0 group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-all">
                      {lead.contactName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate group-hover:text-blue-600 transition-colors">{lead.contactName}</span>
                      <span className="text-[10px] text-slate-400 font-medium block md:hidden truncate">{lead.company}</span>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 py-3 text-slate-600 font-medium truncate">{lead.company}</td>
                <td className="hidden lg:table-cell px-2 py-3 text-slate-400 text-[11px] font-semibold tracking-tight truncate">{lead.industry || "—"}</td>
                <td className="px-2 sm:px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${STAGE_STYLES[lead.stage] ?? "bg-slate-100 text-slate-600"}`}>
                    {STAGE_LABEL[lead.stage] || lead.stage}
                  </span>
                </td>
                <td className="px-2 sm:px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap border ${SUB_STATUS_STYLES[lead.subStatus] ?? "bg-slate-50 text-slate-400 border-slate-100"}`}>
                    {SUB_STATUS_LABEL[lead.subStatus] || lead.subStatus}
                  </span>
                </td>
                <td className="hidden sm:table-cell px-2 sm:px-3 py-3 font-bold text-slate-600 text-[11px] sm:text-[12px] font-mono">{lead.phone || "—"}</td>
                <td className="hidden lg:table-cell px-3 py-3 text-slate-500 font-medium truncate">{lead.owner?.name.split(" ")[0] || "—"}</td>
                <td className={`hidden sm:table-cell px-3 py-3 text-[12px] font-bold whitespace-nowrap ${lead.followUpAt && new Date(lead.followUpAt) < new Date() ? "text-red-500" : "text-slate-400"}`}>
                  {formatFollowUp(lead.followUpAt)}
                </td>
                <td className="hidden xl:table-cell px-3 py-3 text-slate-900 font-black text-[12px]">{formatValue(lead.dealValueInr)}</td>
                <td className="hidden xl:table-cell px-3 py-3 text-center">
                  <div className={`w-2 h-2 rounded-full mx-auto ${lead.priority === "HIGH" ? "bg-red-500" : lead.priority === "MEDIUM" ? "bg-amber-500" : "bg-green-500"}`} />
                </td>
                <td className="px-3 sm:px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end">
                    <div className="relative">
                      <button
                        onClick={() => setActiveLeadMenu(activeLeadMenu === lead.id ? null : lead.id)}
                        className={`p-1.5 rounded-lg transition-all ${activeLeadMenu === lead.id ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-100"}`}
                      >
                        <MoreVertical size={14} />
                      </button>
                      {activeLeadMenu === lead.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <button onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">View Details</button>
                          <button onClick={() => router.push(`/lead/${lead.id}/edit`)} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50">Edit Lead</button>
                          <button 
                            onClick={() => setShowDeleteConfirm(lead.id)}
                            className="w-full text-left px-4 py-2.5 text-[11px] font-black text-red-600 hover:bg-red-50 transition-colors border-t border-slate-50 uppercase tracking-widest"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/30 rounded-b-xl">
        <div className="flex items-center gap-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, displayedLeads.length)} of {displayedLeads.length}
          </p>
          {selectedLeads.size > 0 && (
            <div className="h-4 w-[1px] bg-slate-200" />
          )}
          {selectedLeads.size > 0 && (
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {selectedLeads.size} Selected
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Previous
          </button>
          
          <div className="flex items-center px-2">
            <span className="text-[11px] font-black text-slate-400">PAGE</span>
            <input 
              type="number"
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setCurrentPage(Math.min(Math.max(1, val), totalPages));
              }}
              className="w-8 text-center bg-transparent border-none text-[12px] font-black text-slate-900 focus:outline-none"
            />
            <span className="text-[11px] font-black text-slate-400 uppercase">OF {totalPages || 1}</span>
          </div>

          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Next
          </button>
        </div>
      </div>
      <BulkUpdateModal 
        isOpen={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        selectedIds={Array.from(selectedLeads)}
        onSuccess={() => {
          setSelectedLeads(new Set());
          router.refresh();
          // Trigger refresh of leads list
          fetch("/api/leads")
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setLeads(d); });
        }}
      />

      <BulkDeleteModal 
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        selectedIds={Array.from(selectedLeads)}
        onSuccess={() => {
          setSelectedLeads(new Set());
          router.refresh();
          // Trigger refresh of leads list
          fetch("/api/leads")
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setLeads(d); });
        }}
      />
    </div>
  );
}
