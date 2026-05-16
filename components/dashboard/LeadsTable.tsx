"use client"
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, ChevronDown, Download, Eye, MoreVertical, ChevronRight, XCircle, Edit, Trash2, X } from "lucide-react";
import * as XLSX from "xlsx";
import BulkUpdateModal from "./BulkUpdateModal";
import BulkDeleteModal from "./BulkDeleteModal";

const STAGE_STYLES: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-600",
  CONTACTED: "bg-cyan-50 text-cyan-600",
  NOT_INTERESTED: "bg-red-50 text-red-600",
  MEETING_SET: "bg-indigo-50 text-indigo-600",
  NEGOTIATION: "bg-amber-50 text-amber-700",
  COLD: "bg-slate-50 text-slate-600",
  CHATTING: "bg-slate-50 text-slate-600",
  CLIENT: "bg-blue-100 text-blue-700",
  WON: "bg-green-100 text-green-700",
};

const STAGE_LABEL: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  NOT_INTERESTED: "Not Interested",
  MEETING_SET: "Meeting Set",
  NEGOTIATION: "Negotiation",
  COLD: "Cold Chatting",
  CHATTING: "Cold Chatting",
  CLIENT: "Client",
  WON: "Won",
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-50 text-red-600 border border-red-200",
  MEDIUM: "bg-amber-50 text-amber-600 border border-amber-200",
  LOW: "bg-green-50 text-green-600 border border-green-200",
};

const SUB_STATUS_LABEL: Record<string, string> = {
  CHATTING: "Chatting",
  NOT_ANSWERED: "Not Answered",
  WRONG_NO: "Wrong No.",
  NO_REQUIREMENT: "No Requirement",
  BUDGET_LOW: "Budget Low",
  PROPOSAL_SENT: "Proposal Sent",
  WARM_LEAD: "Warm Lead",
  TEXTED: "Texted",
  BLANK: "Blank",
};

const SUB_STATUS_STYLES: Record<string, string> = {
  CHATTING: "bg-green-50 text-green-700 border border-green-200",
  NOT_ANSWERED: "bg-amber-50 text-amber-700 border border-amber-200",
  WRONG_NO: "bg-red-50 text-red-700 border border-red-200",
  NO_REQUIREMENT: "bg-slate-100 text-slate-500 border border-slate-200",
  BUDGET_LOW: "bg-red-50 text-red-600 border border-red-100",
  PROPOSAL_SENT: "bg-blue-50 text-blue-600 border border-blue-100",
  WARM_LEAD: "bg-orange-50 text-orange-600 border border-orange-100",
  TEXTED: "bg-cyan-50 text-cyan-600 border border-cyan-100",
  BLANK: "bg-slate-50 text-slate-400 border border-slate-100",
};

import toast from "react-hot-toast";

interface DbLead {
  id: string;
  contactName: string;
  company: string;
  industry: string | null;
  source: { name: string } | null;
  stage: string;
  subStatus: string;
  priority: string;
  dealValueInr: string;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  email2: string | null;
  city: string | null;
  state: string | null;
  followUpAt: string | null;
  requirement: string | null;
  createdAt: string;
  owner: { name: string; initials: string };
  lastCommunicatedAt?: string | null;
}

interface LeadsTableProps {
  onLeadClick: (id: string, allIds?: string[]) => void;
  activeNav: string;
  refreshKey?: number;
  sidebarFilter?: {
    id: string;
    name: string;
    statuses: string[];
    subStatuses: string[];
    dealSizeMin: string | null;
    dealSizeMax: string | null;
    industries: string[];
    sources: string[];
    alphabet: string | null;
  } | null;
  onStatsUpdate?: (stats: any) => void;
  initialData?: any;
}

export default function LeadsTable({
  onLeadClick,
  activeNav,
  refreshKey = 0,
  sidebarFilter,
  onStatsUpdate,
  initialData
}: LeadsTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<DbLead[]>(initialData?.leads || []);
  const [totalCount, setTotalCount] = useState(initialData?.pagination?.totalCount || 0);
  const [loading, setLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeLeadMenu, setActiveLeadMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
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
      "Person Name": lead.contactName,
      "Company": lead.company,
      "Industry": lead.industry || "",
      "Source": lead.source?.name || "",
      "Stage": STAGE_LABEL[lead.stage] || lead.stage,
      "City": lead.city || "",
      "State": lead.state || "",
      "Primary Phone": lead.phone || "",
      "Secondary Phone": lead.phone2 || "",
      "Primary Email": lead.email || "",
      "Secondary Email": lead.email2 || "",
      "Deal Value (INR)": lead.dealValueInr,
      "Priority": lead.priority,
      "Requirement": lead.requirement || "",
      "Internal Notes": (lead as any).notes || "",
      "Owner": lead.owner?.name || "",
      "Created At": new Date(lead.createdAt).toLocaleDateString("en-IN")
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  useEffect(() => {
    setSelectedLeads(new Set());
    setCurrentPage(1);
  }, [sidebarFilter?.id, activeNav]);

  const handleDeleteLead = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Lead deleted successfully");
        setLeads(prev => prev.filter(l => l.id !== id));
        setShowDeleteConfirm(null);
        setActiveLeadMenu(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete lead");
      }
    } catch (e) {
      toast.error("An error occurred while deleting the lead");
    } finally {
      setIsDeleting(false);
    }
  };

  const isFirstRun = useRef(true);
  const leadsRef = useRef(leads);
  useEffect(() => { leadsRef.current = leads; }, [leads]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const optimisticLeads = useMemo(() => {
    if (!loading && !isRefreshing) return leads;
    
    let result = [...leads];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.contactName.toLowerCase().includes(q) || 
        l.company.toLowerCase().includes(q) || 
        (l.phone && l.phone.includes(q)) || 
        (l.email && l.email.toLowerCase().includes(q))
      );
    }
    
    Object.entries(columnFilters).forEach(([key, values]) => {
      if (values.size > 0) {
        if (key === 'stage') {
          result = result.filter(l => {
            if (values.has('COLD') && (l.stage === 'COLD' || l.stage === 'CHATTING')) return true;
            return values.has(l.stage);
          });
        } else if (key === 'subStatus') {
          result = result.filter(l => values.has(l.subStatus));
        } else if (key === 'source') {
          result = result.filter(l => l.source && values.has(l.source.name));
        }
      }
    });
    
    if (result.length === 0 && leads.length > 0 && isRefreshing) {
      return leads;
    }
    
    return result;
  }, [leads, loading, isRefreshing, searchQuery, columnFilters]);

  const fetchLeads = useCallback(async () => {
    if (isFirstRun.current && initialData) {
      isFirstRun.current = false;
      if (onStatsUpdate && initialData.stats) onStatsUpdate(initialData.stats);
      setLoading(false);
      return;
    }
    if (isFirstRun.current && !initialData && !sidebarFilter) return;
    isFirstRun.current = false;
    
    if (leadsRef.current.length === 0) setLoading(true);
    setIsRefreshing(true);

    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize.toString());
      if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
      if (sortConfig) { params.set("sortBy", sortConfig.key); params.set("sortDir", sortConfig.direction); }
      if (sidebarFilter) params.set("sidebarFilterId", sidebarFilter.id);
      Object.entries(columnFilters).forEach(([key, values]) => {
        if (values.size > 0) params.set(`filter_${key}`, Array.from(values).join(","));
      });

      if (currentPage === 1) {
        params.set("includeStats", "true");
      }

      const res = await fetch(`/api/leads/super-list?${params.toString()}`);
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
      if (data.pagination?.total) setTotalCount(data.pagination.total);
      if (data.stats && onStatsUpdate) onStatsUpdate(data.stats);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, pageSize, debouncedSearchQuery, sortConfig, columnFilters, onStatsUpdate, sidebarFilter?.id]);

  useEffect(() => { fetchLeads(); }, [fetchLeads, refreshKey, activeNav]);

  useEffect(() => {
    if (initialData) {
      if (initialData.leads) setLeads(initialData.leads);
      if (initialData.pagination?.total) setTotalCount(initialData.pagination.total);
      if (initialData.stats && onStatsUpdate) onStatsUpdate(initialData.stats);
      setLoading(false);
    }
  }, [initialData, onStatsUpdate]);

  const toggleSelectAll = () => {
    if (selectedLeads.size === displayedLeads.length) setSelectedLeads(new Set());
    else setSelectedLeads(new Set(displayedLeads.map(l => l.id)));
  };

  const toggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedLeads(next);
  };

  const searchResults = searchQuery.length >= 2 ? leads.filter(l => {
    const q = searchQuery.toLowerCase();
    return l.contactName.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.phone?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q);
  }).slice(0, 8) : [];

  const startIndex = (currentPage - 1) * pageSize;
  const displayedLeads = optimisticLeads;
  const totalPages = Math.ceil(totalCount / pageSize);

  const toggleColumnFilter = (column: string, value: string | string[]) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      const currentSet = new Set(next[column] || []);
      const values = Array.isArray(value) ? value : [value];
      const allExist = values.every(v => currentSet.has(v));
      if (allExist) values.forEach(v => currentSet.delete(v)); else values.forEach(v => currentSet.add(v));
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
    if (diffH < 24) return `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffH < 48) return "Tomorrow";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function formatValue(v: string) {
    const n = parseFloat(v);
    if (!n) return "—";
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString("en-IN")}`;
  }

  const uniqueDates = useMemo(() => {
    const dates = new Map<string, string>();
    leads.forEach(l => {
      const d = new Date(l.createdAt);
      const iso = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
      dates.set(iso, display);
    });
    return Array.from(dates.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [leads]);

  const getUniqueValues = (key: keyof DbLead) => {
    const values = new Set<string>();
    leads.forEach(l => { if (l[key]) values.add(String(l[key])); });
    return Array.from(values).sort();
  };

  const FilterDropdown = ({ column, children }: { column: string; children: React.ReactNode }) => (
    activeColumnFilter === column ? (
      <div className="absolute left-0 top-full mt-1 min-w-[160px] bg-white border border-slate-200 rounded-xl shadow-2xl z-30 py-1 overflow-hidden">
        <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
          <button onClick={() => setColumnFilters(prev => ({ ...prev, [column]: new Set() }))} className="text-[9px] font-black text-blue-600 uppercase tracking-wider">Clear</button>
        </div>
        {children}
      </div>
    ) : null
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-full">

      {/* ── Delete Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-3 mx-auto text-red-500">
              <XCircle size={20} />
            </div>
            <h3 className="text-base font-black text-slate-900 text-center mb-1">Delete this lead?</h3>
            <p className="text-slate-400 text-center text-xs mb-5">This permanently removes the lead and all its history. Cannot be undone.</p>
            <div className="flex gap-2">
              <button disabled={isDeleting} onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50">Keep it</button>
              <button disabled={isDeleting} onClick={() => handleDeleteLead(showDeleteConfirm)} className="flex-1 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 transition-all shadow-md shadow-red-100 active:scale-95 disabled:opacity-50">
                {isDeleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-slate-100 gap-2.5 flex-shrink-0">
        {/* Left: Title */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-[13px] font-black text-slate-900 flex items-center gap-1.5 leading-tight truncate">
              {sidebarFilter ? `🔍 ${sidebarFilter.name}` : activeNav === "New Leads" ? "New Leads" : activeNav === "Alerts" ? "High Priority" : "All Leads"}
              {selectedLeads.size > 0 && (
                <span className="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{selectedLeads.size}</span>
              )}
            </h2>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-none">
              {loading || isRefreshing ? "Loading…" : `${totalCount.toLocaleString()} lead${totalCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Right: Controls — wrap on small screens */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onFocus={() => setShowSearchDropdown(true)}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); setShowSearchDropdown(true); }}
              className="w-full sm:w-44 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all"
            />
            {showSearchDropdown && searchResults.length > 0 && (
              <>
                <div className="fixed inset-0 z-[65]" onClick={() => setShowSearchDropdown(false)} />
                <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-[70] overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quick Results</span>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{searchResults.length} found</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button key={result.id} onClick={() => { onLeadClick(result.id, leads.map(l => l.id)); setShowSearchDropdown(false); setSearchQuery(""); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors group text-left border-b border-slate-50 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-[9px] font-black text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all flex-shrink-0">
                          {result.contactName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[11px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{result.contactName}</p>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${STAGE_STYLES[result.stage]}`}>{STAGE_LABEL[result.stage] || result.stage}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium truncate">{result.company} · {result.owner?.name}</p>
                        </div>
                        <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Show count — bigger input */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Show</span>
            <input
              type="number"
              min="1"
              max="100"
              value={pageSize}
              onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val > 0) { setPageSize(val); setCurrentPage(1); } }}
              className="w-10 bg-transparent text-[12px] font-black text-slate-700 outline-none text-center"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <button onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-1 text-[11px] font-bold border px-2.5 py-1.5 rounded-lg transition-all ${showFilterMenu || sortConfig || Object.keys(columnFilters).length > 0 ? "bg-slate-900 text-white border-slate-900" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
              <Filter size={11} /> Filter
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sort by</p>
                </div>
                <button onClick={() => { setSortConfig(null); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">Newest First</button>
                <button onClick={() => { setSortConfig({ key: 'dealValueInr', direction: 'desc' }); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50">Value: High → Low</button>
                <button onClick={() => { setColumnFilters({}); setSortConfig(null); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] font-black text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100">Clear All Filters</button>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)}
              className={`flex items-center gap-1 text-[11px] font-bold border px-2.5 py-1.5 rounded-lg transition-all ${showExportMenu ? "bg-slate-900 text-white border-slate-900" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
              <Download size={11} /> Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] overflow-hidden">
                <button onClick={() => { handleExportExcel(leads, "All_Leads"); setShowExportMenu(false); }} className="w-full text-left px-3 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">Excel — All Leads</button>
                <button onClick={() => { handleExportExcel(displayedLeads, "Filtered_Leads"); setShowExportMenu(false); }} className="w-full text-left px-3 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50">Excel — Filtered</button>
              </div>
            )}
          </div>

          {(Object.keys(columnFilters).length > 0 || searchQuery) && (
            <button
              onClick={() => { setColumnFilters({}); setSearchQuery(""); setSortConfig(null); }}
              className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all"
            >
              <X size={11} /> Clear
            </button>
          )}

          {/* Bulk actions */}
          {selectedLeads.size > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-px h-5 bg-slate-200" />
              <button onClick={() => setShowBulkUpdate(true)} title="Bulk Update"
                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center">
                <Edit size={11} />
              </button>
              <button onClick={() => setShowBulkDelete(true)} title="Bulk Delete"
                className="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center">
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Table — horizontally scrollable on mobile ── */}
      <div className="flex-1 overflow-auto relative">
        {(loading || isRefreshing) && leads.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/10 z-20 overflow-hidden">
            <div className="h-full bg-blue-600 animate-pulse w-full" />
          </div>
        )}
        <div className="min-w-[900px]">
          <table className="w-full text-[12px]" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: 36 }} />
            </colgroup>

            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-2 py-2">
                  <input type="checkbox" checked={selectedLeads.size > 0 && selectedLeads.size === displayedLeads.length} onChange={toggleSelectAll}
                    className="appearance-none w-3.5 h-3.5 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[1px] checked:after:top-[-2px]" />
                </th>

                <th className="text-left px-2 py-2 cursor-pointer select-none group" onClick={() => setSortConfig(p => ({ key: 'lead', direction: p?.key === 'lead' && p.direction === 'asc' ? 'desc' : 'asc' }))}>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors flex items-center gap-1">
                    Lead {sortConfig?.key === 'lead' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
                  </span>
                </th>

                <th className="text-left px-2 py-2 cursor-pointer select-none group" onClick={() => setSortConfig(p => ({ key: 'company', direction: p?.key === 'company' && p.direction === 'asc' ? 'desc' : 'asc' }))}>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors flex items-center gap-1">
                    Company {sortConfig?.key === 'company' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
                  </span>
                </th>

                <th className="text-left px-2 py-2">
                  <div className="relative inline-block">
                    <button onClick={() => setActiveColumnFilter(activeColumnFilter === 'stage' ? null : 'stage')}
                      className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['stage']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
                      Status <Filter size={9} />
                    </button>
                    <button
                      onClick={() => setSortConfig(p => ({ key: 'stage', direction: p?.key === 'stage' && p.direction === 'asc' ? 'desc' : 'asc' }))}
                      className={`p-1 rounded hover:bg-slate-100 transition-colors ${sortConfig?.key === 'stage' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                    >
                      {sortConfig?.key === 'stage' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
                    </button>
                    <FilterDropdown column="stage">
                      {["NEW", "CONTACTED", "COLD", "MEETING_SET", "NEGOTIATION", "CLIENT", "NOT_INTERESTED"].map(v => (
                        <label key={v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" checked={columnFilters['stage']?.has(v)} onChange={() => toggleColumnFilter('stage', v === 'COLD' ? ['COLD', 'CHATTING'] : v)}
                            className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]" />
                          <span className="text-[11px] font-semibold text-slate-700">{v === 'COLD' ? 'Cold/Chatting' : STAGE_LABEL[v]}</span>
                        </label>
                      ))}
                    </FilterDropdown>
                  </div>
                </th>

                <th className="text-left px-2 py-2">
                  <div className="relative inline-block">
                    <button onClick={() => setActiveColumnFilter(activeColumnFilter === 'subStatus' ? null : 'subStatus')}
                      className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['subStatus']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
                      Sub-status <Filter size={9} />
                    </button>
                    <button
                      onClick={() => setSortConfig(p => ({ key: 'subStatus', direction: p?.key === 'subStatus' && p.direction === 'asc' ? 'desc' : 'asc' }))}
                      className={`p-1 rounded hover:bg-slate-100 transition-colors ${sortConfig?.key === 'subStatus' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                    >
                      {sortConfig?.key === 'subStatus' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
                    </button>
                    <FilterDropdown column="subStatus">
                      {Object.keys(SUB_STATUS_LABEL).map(v => (
                        <label key={v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" checked={columnFilters['subStatus']?.has(v)} onChange={() => toggleColumnFilter('subStatus', v)}
                            className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]" />
                          <span className="text-[11px] font-semibold text-slate-700">{SUB_STATUS_LABEL[v]}</span>
                        </label>
                      ))}
                    </FilterDropdown>
                  </div>
                </th>

                <th className="text-left px-2 py-2">
                  <div className="flex items-center gap-1">
                    <div className="relative inline-block">
                      <button onClick={() => setActiveColumnFilter(activeColumnFilter === 'city' ? null : 'city')}
                        className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['city']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
                        City <Filter size={9} />
                      </button>
                      <FilterDropdown column="city">
                        <div className="max-h-44 overflow-y-auto">
                          {Array.from(new Set(leads.map(l => l.city).filter(Boolean))).sort().map(v => (
                            <label key={v as string} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                              <input type="checkbox" checked={columnFilters['city']?.has(v as string)} onChange={() => toggleColumnFilter('city', v as string)}
                                className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" />
                              <span className="text-[11px] font-semibold text-slate-700 truncate">{v as string}</span>
                            </label>
                          ))}
                        </div>
                      </FilterDropdown>
                    </div>
                    <button
                      onClick={() => setSortConfig(p => ({ key: 'city', direction: p?.key === 'city' && p.direction === 'asc' ? 'desc' : 'asc' }))}
                      className={`p-1 rounded hover:bg-slate-100 transition-colors ${sortConfig?.key === 'city' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                    >
                      {sortConfig?.key === 'city' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
                    </button>
                  </div>
                </th>

                <th className="text-left px-2 py-2">
                  <div className="flex items-center gap-1">
                    <div className="relative inline-block">
                      <button onClick={() => setActiveColumnFilter(activeColumnFilter === 'state' ? null : 'state')}
                        className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['state']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
                        State <Filter size={9} />
                      </button>
                      <FilterDropdown column="state">
                        <div className="max-h-44 overflow-y-auto">
                          {Array.from(new Set(leads.map(l => l.state).filter(Boolean))).sort().map(v => (
                            <label key={v as string} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                              <input type="checkbox" checked={columnFilters['state']?.has(v as string)} onChange={() => toggleColumnFilter('state', v as string)}
                                className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" />
                              <span className="text-[11px] font-semibold text-slate-700 truncate">{v as string}</span>
                            </label>
                          ))}
                        </div>
                      </FilterDropdown>
                    </div>
                    <button
                      onClick={() => setSortConfig(p => ({ key: 'state', direction: p?.key === 'state' && p.direction === 'asc' ? 'desc' : 'asc' }))}
                      className={`p-1 rounded hover:bg-slate-100 transition-colors ${sortConfig?.key === 'state' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                    >
                      {sortConfig?.key === 'state' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
                    </button>
                  </div>
                </th>

                <th className="text-left px-2 py-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Phone</span>
                </th>

                <th className="text-left px-2 py-2">
                  <div className="relative inline-block">
                    <button onClick={() => setActiveColumnFilter(activeColumnFilter === 'source' ? null : 'source')}
                      className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['source']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
                      Source <Filter size={9} />
                    </button>
                    <button
                      onClick={() => setSortConfig(p => ({ key: 'source', direction: p?.key === 'source' && p.direction === 'asc' ? 'desc' : 'asc' }))}
                      className={`p-1 rounded hover:bg-slate-100 transition-colors ${sortConfig?.key === 'source' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                    >
                      {sortConfig?.key === 'source' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
                    </button>
                    <FilterDropdown column="source">
                      <div className="max-h-44 overflow-y-auto">
                        {Array.from(new Set(leads.map(l => l.source?.name).filter(Boolean))).sort().map(v => (
                          <label key={v as string} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={columnFilters['source']?.has(v as string)} onChange={() => toggleColumnFilter('source', v as string)}
                              className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" />
                            <span className="text-[11px] font-semibold text-slate-700 truncate">{v as string}</span>
                          </label>
                        ))}
                      </div>
                    </FilterDropdown>
                  </div>
                </th>

                <th className="text-left px-2 py-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Owner</span>
                </th>

                <th className="text-left px-2 py-2">
                  <div className="relative inline-block">
                    <button onClick={() => setActiveColumnFilter(activeColumnFilter === 'createdAt' ? null : 'createdAt')}
                      className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['createdAt']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
                      Created On <Filter size={9} />
                    </button>
                    <button
                      onClick={() => setSortConfig(p => ({ key: 'createdAt', direction: p?.key === 'createdAt' && p.direction === 'asc' ? 'desc' : 'asc' }))}
                      className={`p-1 rounded hover:bg-slate-100 transition-colors ${sortConfig?.key === 'createdAt' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                    >
                      {sortConfig?.key === 'createdAt' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
                    </button>
                    <FilterDropdown column="createdAt">
                      <div className="max-h-44 overflow-y-auto">
                        {uniqueDates.map(([iso, display]) => (
                          <label key={iso} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={columnFilters['createdAt']?.has(iso)} onChange={() => toggleColumnFilter('createdAt', iso)}
                              className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]" />
                            <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">{display}</span>
                          </label>
                        ))}
                      </div>
                    </FilterDropdown>
                  </div>
                </th>

                <th className="text-left px-2 py-2">
                  <div className="relative inline-block">
                    <button onClick={() => setActiveColumnFilter(activeColumnFilter === 'followup' ? null : 'followup')}
                      className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['followup']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
                      Follow-up <Filter size={9} />
                    </button>
                    {activeColumnFilter === 'followup' && (
                      <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 overflow-hidden">
                        <button onClick={() => { toggleColumnFilter('followup', 'OVERDUE'); setActiveColumnFilter(null); }} className="w-full text-left px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors">Overdue</button>
                        <button onClick={() => { toggleColumnFilter('followup', 'TODAY'); setActiveColumnFilter(null); }} className="w-full text-left px-3 py-2 text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-50">Today</button>
                        <button onClick={() => { setColumnFilters(prev => ({ ...prev, followup: new Set() })); setActiveColumnFilter(null); }} className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-400 hover:bg-slate-50 transition-colors border-t border-slate-100">Clear</button>
                      </div>
                    )}
                  </div>
                </th>

                <th className="text-left px-2 py-2 cursor-pointer select-none group" onClick={() => setSortConfig(p => ({ key: 'dealValueInr', direction: p?.key === 'dealValueInr' && p.direction === 'asc' ? 'desc' : 'asc' }))}>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors flex items-center gap-1">
                    Value {sortConfig?.key === 'dealValueInr' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
                  </span>
                </th>

                <th className="px-2 py-2" />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {(loading || isRefreshing) && leads.length === 0 && (
                <tr>
                  <td colSpan={14} className="text-center py-16">
                    <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading pipeline…</p>
                  </td>
                </tr>
              )}
              {!loading && !isRefreshing && displayedLeads.length === 0 && (
                <tr>
                  <td colSpan={14} className="text-center py-16 text-[12px] font-semibold text-slate-400">No leads match current filters</td>
                </tr>
              )}

              {displayedLeads.map((lead) => {
                const isOverdue = lead.followUpAt && new Date(lead.followUpAt) < new Date();
                return (
                  <tr key={lead.id} onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
                    className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${selectedLeads.has(lead.id) ? "bg-blue-50/40" : ""}`}>

                    <td className="px-2 py-2" onClick={(e) => toggleSelectLead(lead.id, e)}>
                      <input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => {}}
                        className="appearance-none w-3.5 h-3.5 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[1px] checked:after:top-[-2px]" />
                    </td>

                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-600 flex-shrink-0 group-hover:bg-white group-hover:border group-hover:border-slate-200 transition-all">
                          {lead.contactName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-[12px] text-slate-900 truncate group-hover:text-blue-600 transition-colors leading-tight">{lead.contactName}</span>
                      </div>
                    </td>

                    <td className="px-2 py-2">
                      <span className="text-[11px] font-semibold text-slate-600 truncate block">{lead.company}</span>
                    </td>

                    <td className="px-2 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight whitespace-nowrap ${STAGE_STYLES[lead.stage] ?? "bg-slate-100 text-slate-500"}`}>
                        {STAGE_LABEL[lead.stage] || lead.stage}
                      </span>
                    </td>

                    <td className="px-2 py-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap border ${SUB_STATUS_STYLES[lead.subStatus] ?? "bg-slate-50 text-slate-400 border-slate-100"}`}>
                        {SUB_STATUS_LABEL[lead.subStatus] || lead.subStatus}
                      </span>
                    </td>

                    <td className="px-2 py-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight truncate block">
                        {lead.city || "—"}
                      </span>
                    </td>

                    <td className="px-2 py-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight truncate block">
                        {lead.state || "—"}
                      </span>
                    </td>

                    <td className="px-2 py-2">
                      <span className="text-[11px] font-bold text-slate-600 font-mono tracking-tight">{lead.phone || "—"}</span>
                    </td>

                    <td className="px-2 py-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight truncate block">{lead.source?.name || "—"}</span>
                    </td>

                    <td className="px-2 py-2">
                      <span className="text-[11px] font-semibold text-slate-500 truncate block">{lead.owner?.name.split(" ")[0] || "—"}</span>
                    </td>

                    <td className="px-2 py-2">
                      <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap block">
                        {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })} {new Date(lead.createdAt).toLocaleTimeString("en-IN", { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}
                      </span>
                    </td>

                    <td className="px-2 py-2">
                      <span className={`text-[11px] font-bold whitespace-nowrap ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                        {formatFollowUp(lead.followUpAt)}
                      </span>
                    </td>

                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${lead.priority === "HIGH" ? "bg-red-500" : lead.priority === "MEDIUM" ? "bg-amber-400" : "bg-green-400"}`} />
                        <span className="text-[11px] font-black text-slate-800">{formatValue(lead.dealValueInr)}</span>
                      </div>
                    </td>

                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="relative flex justify-end">
                        <button onClick={() => setActiveLeadMenu(activeLeadMenu === lead.id ? null : lead.id)}
                          className={`p-1 rounded-lg transition-all ${activeLeadMenu === lead.id ? "bg-slate-900 text-white" : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"}`}>
                          <MoreVertical size={13} />
                        </button>
                        {activeLeadMenu === lead.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 overflow-hidden">
                            <button onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))} className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">View Details</button>
                            <button onClick={() => router.push(`/lead/${lead.id}/edit`)} className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50">Edit Lead</button>
                            <button onClick={() => setShowDeleteConfirm(lead.id)} className="w-full text-left px-3 py-2 text-[11px] font-black text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100 uppercase tracking-wider">Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/40 rounded-b-xl flex-shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {startIndex + 1}–{Math.min(startIndex + pageSize, totalCount)} of {totalCount.toLocaleString()}
          </p>
          {selectedLeads.size > 0 && (
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider">
              {selectedLeads.size} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wide">
            Prev
          </button>
          <div className="flex items-center gap-0.5 px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Pg</span>
            <input type="number" value={currentPage}
              onChange={(e) => { const val = parseInt(e.target.value) || 1; setCurrentPage(Math.min(Math.max(1, val), totalPages)); }}
              className="w-7 text-center bg-transparent border-none text-[11px] font-black text-slate-900 focus:outline-none" />
            <span className="text-[10px] font-black text-slate-400 uppercase">/ {totalPages || 1}</span>
          </div>
          <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wide">
            Next
          </button>
        </div>
      </div>

      <BulkUpdateModal isOpen={showBulkUpdate} onClose={() => setShowBulkUpdate(false)} selectedIds={Array.from(selectedLeads)}
        onSuccess={() => { setSelectedLeads(new Set()); fetchLeads(); }} />
      <BulkDeleteModal isOpen={showBulkDelete} onClose={() => setShowBulkDelete(false)} selectedIds={Array.from(selectedLeads)}
        onSuccess={() => { setSelectedLeads(new Set()); fetchLeads(); }} />
    </div>
  );
}