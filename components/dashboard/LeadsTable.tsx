"use client"
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useTablePreferences, defaultColumnPreferences } from "@/hooks/useTablePreferences";

// Sub-components
import {
  DbLead,
  SortConfig,
  STAGE_LABEL,
  STAGE_STYLES,
  SUB_STATUS_LABEL,
  SUB_STATUS_STYLES,
} from "./lead-table/types";
import TableToolbar from "./lead-table/TableToolbar";
import TableHeader from "./lead-table/TableHeader";
import LeadRow from "./lead-table/LeadRow";
import TablePagination from "./lead-table/TablePagination";
import BulkUpdateModal from "./BulkUpdateModal";
import BulkDeleteModal from "./BulkDeleteModal";
import BulkAssignModal from "./BulkAssignModal";

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
  minWidthClass?: string;
  /** Force filter by a specific stage (e.g. "NEW") */
  stageFilter?: string;
  /** Filter by owner name */
  ownerFilter?: string;
  /** Custom API endpoint */
  apiUrl?: string;
}

// Calculate col spans dynamically
const getActiveColumnsCount = (prefs: typeof defaultColumnPreferences) => {
  return prefs.columnOrder.filter(colId => {
    switch (colId) {
      case 'city': return prefs.showCity;
      case 'state': return prefs.showState;
      case 'createdAt': return prefs.showCreatedOn;
      case 'dealValueInr': return prefs.showDealValue;
      case 'followUpAt': return prefs.showFollowUp;
      default: return true;
    }
  }).length;
};

export default function LeadsTable({
  onLeadClick,
  activeNav,
  refreshKey = 0,
  sidebarFilter,
  onStatsUpdate,
  minWidthClass,
  stageFilter,
  ownerFilter,
  apiUrl = "/api/leads/super-list"
}: LeadsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const { columnPreferences, isLoaded: tablePrefsLoaded } = useTablePreferences();
  const [leads, setLeads] = useState<DbLead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeLeadMenu, setActiveLeadMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [distinctFilters, setDistinctFilters] = useState<{
    industries: string[];
    sources: string[];
    cities: string[];
    states: string[];
    owners?: string[];
    ownerDetails?: { id: string; name: string }[];
  }>({ industries: [], sources: [], cities: [], states: [], owners: [] });

  const handleExportExcel = async (dataToExport: DbLead[], filename: string) => {
    try {
      const XLSX = await import("xlsx");
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
    } catch (e) {
      toast.error("Failed to export Excel file");
    }
  };

  const [prevView, setPrevView] = useState(view);
  const [prevActiveNav, setPrevActiveNav] = useState(activeNav);
  const [prevSidebarFilterId, setPrevSidebarFilterId] = useState(sidebarFilter?.id);

  if (view !== prevView || activeNav !== prevActiveNav || sidebarFilter?.id !== prevSidebarFilterId) {
    setPrevView(view);
    setPrevActiveNav(activeNav);
    setPrevSidebarFilterId(sidebarFilter?.id);
    setSelectedLeads(new Set());
    setColumnFilters({});
    setCurrentPage(1);
  }

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
        } else if (key === 'industry') {
          result = result.filter(l => l.industry && values.has(l.industry));
        } else if (key === 'source') {
          result = result.filter(l => l.source && values.has(l.source.name));
        } else if (key === 'ownerId') {
          result = result.filter(l => l.owner && values.has((l.owner as any).id));
        }
      }
    });
    if (result.length === 0 && leads.length > 0 && isRefreshing) return leads;
    return result;
  }, [leads, loading, isRefreshing, searchQuery, columnFilters]);

  const fetchLeads = useCallback(async () => {
    if (leadsRef.current.length === 0) setLoading(true);
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize.toString());
      if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
      if (sortConfig) { params.set("sortBy", sortConfig.key); params.set("sortDir", sortConfig.direction); }
      if (sidebarFilter) params.set("sidebarFilterId", sidebarFilter.id);
      // Apply forced stage filter (e.g. "NEW" for the New Leads page)
      if (stageFilter) {
        params.set("filter_stage", stageFilter);
      }
      // Apply owner filter from the page-level dropdown
      if (ownerFilter) {
        params.set("filter_ownerId", ownerFilter);
      }
      Object.entries(columnFilters).forEach(([key, values]) => {
        if (values.size > 0) {
          // Don't override the forced stage filter from props
          if (key === "stage" && stageFilter) return;
          params.set(`filter_${key}`, Array.from(values).join(","));
        }
      });
      if (view) params.set("view", view);
      if (currentPage === 1) params.set("includeStats", "true");
      const res = await fetch(`${apiUrl}?${params.toString()}`);
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
      const count = data.pagination?.totalCount ?? data.pagination?.total ?? 0;
      setTotalCount(count);
      if (data.stats && onStatsUpdate) onStatsUpdate(data.stats);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, pageSize, debouncedSearchQuery, sortConfig, columnFilters, onStatsUpdate, sidebarFilter?.id, view, stageFilter, ownerFilter, apiUrl]);

  useEffect(() => { fetchLeads(); }, [fetchLeads, refreshKey, activeNav]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (view) params.set("view", view);
    fetch(`/api/leads/distinct-filters?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setDistinctFilters(data);
        }
      })
      .catch(console.error);
  }, [refreshKey, activeNav, view]);

  // initialData is no longer needed because LeadsTable manages fetching on mount

  const toggleSelectAll = () => {
    if (selectedLeads.size === displayedLeads.length) setSelectedLeads(new Set());
    else setSelectedLeads(new Set(displayedLeads.map(l => l.id)));
  };

  const toggleSelectLead = (id: string) => {
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

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 flex flex-col h-full overflow-hidden shadow-xl shadow-slate-200/50">
      
      {/* Deletion confirmation modal overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-3 mx-auto text-red-500">
              <X size={20} />
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

      {/* Premium Table Toolbar */}
      <TableToolbar
        sidebarFilter={sidebarFilter}
        activeNav={activeNav}
        selectedLeadsCount={selectedLeads.size}
        loading={loading}
        isRefreshing={isRefreshing}
        totalCount={totalCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setShowSearchDropdown={setShowSearchDropdown}
        showSearchDropdown={showSearchDropdown}
        searchResults={searchResults}
        onLeadClick={onLeadClick}
        leads={leads}
        displayedLeads={displayedLeads}
        pageSize={pageSize}
        setPageSize={setPageSize}
        setCurrentPage={setCurrentPage}
        showFilterMenu={showFilterMenu}
        setShowFilterMenu={setShowFilterMenu}
        showExportMenu={showExportMenu}
        setShowExportMenu={setShowExportMenu}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
        onBulkUpdate={() => setShowBulkUpdate(true)}
        onBulkDelete={() => setShowBulkDelete(true)}
        onBulkAssign={view === "subordinates" ? () => setShowBulkAssign(true) : undefined}
        handleExportExcel={handleExportExcel}
      />

      {/* actual table element and scroll wrapper */}
      <div className="flex-1 overflow-auto relative min-h-[300px]">
        {(loading || isRefreshing) && leads.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/10 z-20 overflow-hidden">
            <div className="h-full bg-blue-600 animate-pulse w-full" />
          </div>
        )}
        
        <table className={`w-full text-[12px] table-fixed ${minWidthClass || "min-w-[1200px]"}`}>
          <colgroup><col style={{ width: "38px" }} />{columnPreferences.columnOrder.map(colId => {
              if (colId === 'city' && !columnPreferences.showCity) return null;
              if (colId === 'state' && !columnPreferences.showState) return null;
              if (colId === 'createdAt' && !columnPreferences.showCreatedOn) return null;
              if (colId === 'dealValueInr' && !columnPreferences.showDealValue) return null;
              if (colId === 'followUpAt' && !columnPreferences.showFollowUp) return null;
              let width = "9%";
              switch (colId) {
                case 'lead': width = "120px"; break;
                case 'company': width = "100px"; break;
                case 'industry': width = "9%"; break;
                case 'stage': width = "9%"; break;
                case 'subStatus': width = "7%"; break;
                case 'city': width = "7%"; break;
                case 'state': width = "7%"; break;
                case 'phone': width = "10%"; break;
                case 'source': width = "7%"; break;
                case 'owner': width = "11%"; break;
                case 'createdAt': width = "9%"; break;
                case 'dealValueInr': width = "7%"; break;
                case 'followUpAt': width = "9%"; break;
              }
              return <col key={colId} style={{ width }} />;
            })}<col style={{ width: "32px" }} /></colgroup>

          {/* Premium Header */}
           <TableHeader
            leads={leads}
            displayedLeads={displayedLeads}
            selectedLeads={selectedLeads}
            toggleSelectAll={toggleSelectAll}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            columnFilters={columnFilters}
            toggleColumnFilter={toggleColumnFilter}
            setColumnFilters={setColumnFilters}
            activeColumnFilter={activeColumnFilter}
            setActiveColumnFilter={setActiveColumnFilter}
            uniqueDates={uniqueDates}
            distinctFilters={distinctFilters}
            columnPreferences={columnPreferences}
          />

          {/* Body items */}
          <tbody className="divide-y divide-slate-50">
            {(loading || isRefreshing || !tablePrefsLoaded) && leads.length === 0 && (
              <tr>
                <td colSpan={getActiveColumnsCount(columnPreferences) + 2} className="text-center py-24 bg-white">
                  <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading leads pipeline…</p>
                </td>
              </tr>
            )}
            {!loading && !isRefreshing && tablePrefsLoaded && displayedLeads.length === 0 && (
              <tr>
                <td colSpan={getActiveColumnsCount(columnPreferences) + 2} className="text-center py-24 bg-white text-[12px] font-semibold text-slate-400">
                  No leads match current filters
                </td>
              </tr>
            )}

            {!loading && tablePrefsLoaded && displayedLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                selectedLeads={selectedLeads}
                toggleSelectLead={toggleSelectLead}
                onLeadClick={onLeadClick}
                activeLeadMenu={activeLeadMenu}
                setActiveLeadMenu={setActiveLeadMenu}
                onEditLead={(l) => router.push(`/lead/${l.id}/edit`)}
                onDeleteLeadConfirm={setShowDeleteConfirm}
                displayedLeads={displayedLeads}
                columnPreferences={columnPreferences}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <TablePagination
        startIndex={startIndex + 1}
        pageSize={pageSize}
        totalCount={totalCount}
        selectedLeadsCount={selectedLeads.size}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

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

      <BulkAssignModal
        isOpen={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        selectedIds={Array.from(selectedLeads)}
        onSuccess={() => { setSelectedLeads(new Set()); fetchLeads(); }}
      />
    </div>
  );
}