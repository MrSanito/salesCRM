"use client"
import React from "react";
import { Search, Filter, Download, X, Edit, Trash2, ChevronRight, UserPlus } from "lucide-react";
import { DbLead, SortConfig, STAGE_LABEL, STAGE_STYLES } from "./types";

interface TableToolbarProps {
  sidebarFilter: any;
  activeNav: string;
  selectedLeadsCount: number;
  loading: boolean;
  isRefreshing: boolean;
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setShowSearchDropdown: (show: boolean) => void;
  showSearchDropdown: boolean;
  searchResults: DbLead[];
  onLeadClick: (id: string, allIds?: string[]) => void;
  leads: DbLead[];
  displayedLeads: DbLead[];
  pageSize: number;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  showFilterMenu: boolean;
  setShowFilterMenu: (show: boolean) => void;
  showExportMenu: boolean;
  setShowExportMenu: (show: boolean) => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig | ((p: SortConfig) => SortConfig)) => void;
  columnFilters: Record<string, Set<string>>;
  setColumnFilters: (filters: Record<string, Set<string>> | ((p: Record<string, Set<string>>) => Record<string, Set<string>>)) => void;
  onBulkUpdate: () => void;
  onBulkDelete: () => void;
  onBulkAssign?: () => void;
  handleExportExcel: (data: DbLead[], name: string) => void;
}

export default function TableToolbar({
  sidebarFilter,
  activeNav,
  selectedLeadsCount,
  loading,
  isRefreshing,
  totalCount,
  searchQuery,
  setSearchQuery,
  setShowSearchDropdown,
  showSearchDropdown,
  searchResults,
  onLeadClick,
  leads,
  displayedLeads,
  pageSize,
  setPageSize,
  setCurrentPage,
  showFilterMenu,
  setShowFilterMenu,
  showExportMenu,
  setShowExportMenu,
  sortConfig,
  setSortConfig,
  columnFilters,
  setColumnFilters,
  onBulkUpdate,
  onBulkDelete,
  onBulkAssign,
  handleExportExcel,
}: TableToolbarProps) {
  const hasActiveFilters = Object.keys(columnFilters).some(key => columnFilters[key]?.size > 0) || searchQuery || sortConfig;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-slate-100 gap-2.5 flex-shrink-0 bg-white">
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        <div className="min-w-0">
          <h2 className="text-[13px] font-black text-slate-900 flex items-center gap-1.5 leading-tight truncate">
            {sidebarFilter ? `🔍 ${sidebarFilter.name}` : activeNav === "New Leads" ? "New Leads" : activeNav === "Alerts" ? "High Priority" : "All Leads"}
            {selectedLeadsCount > 0 && (
              <span className="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{selectedLeadsCount}</span>
            )}
          </h2>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-none">
            {loading || isRefreshing ? "Loading…" : `${totalCount.toLocaleString()} lead${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Quick Search */}
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onFocus={() => setShowSearchDropdown(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
              setShowSearchDropdown(true);
            }}
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
                    <button
                      key={result.id}
                      onClick={() => {
                        onLeadClick(result.id, leads.map(l => l.id));
                        setShowSearchDropdown(false);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors group text-left border-b border-slate-50 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-[9px] font-black text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all flex-shrink-0">
                        {result.contactName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{result.contactName}</p>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${STAGE_STYLES[result.stage] ?? "bg-slate-50 text-slate-600"}`}>
                            {STAGE_LABEL[result.stage] || result.stage}
                          </span>
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

        {/* Page Size Config */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Show</span>
          <input
            type="number"
            min="1"
            max="100"
            value={pageSize}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val > 0) {
                setPageSize(val);
                setCurrentPage(1);
              }
            }}
            className="w-10 bg-transparent text-[12px] font-black text-slate-700 outline-none text-center"
          />
        </div>

        {/* Sort Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-1 text-[11px] font-bold border px-2.5 py-1.5 rounded-lg transition-all ${
              showFilterMenu || sortConfig || Object.keys(columnFilters).some(k => columnFilters[k]?.size > 0)
                ? "bg-slate-900 text-white border-slate-900"
                : "text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Filter size={11} /> Filter
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sort by</p>
                </div>
                <button
                  onClick={() => {
                    setSortConfig(null);
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Newest First
                </button>
                <button
                  onClick={() => {
                    setSortConfig({ key: 'dealValueInr', direction: 'desc' });
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50"
                >
                  Value: High → Low
                </button>
                <button
                  onClick={() => {
                    setColumnFilters({});
                    setSortConfig(null);
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[11px] font-black text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100"
                >
                  Clear All Filters
                </button>
              </div>
            </>
          )}
        </div>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className={`flex items-center gap-1 text-[11px] font-bold border px-2.5 py-1.5 rounded-lg transition-all ${
              showExportMenu ? "bg-slate-900 text-white border-slate-900" : "text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Download size={11} /> Export
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] overflow-hidden">
                <button
                  onClick={() => {
                    handleExportExcel(leads, "All_Leads");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Excel — All Leads
                </button>
                <button
                  onClick={() => {
                    handleExportExcel(displayedLeads, "Filtered_Leads");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50"
                >
                  Excel — Filtered
                </button>
              </div>
            </>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setColumnFilters({});
              setSearchQuery("");
              setSortConfig(null);
            }}
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all"
          >
            <X size={11} /> Clear
          </button>
        )}

        {/* Bulk Action Controls */}
        {selectedLeadsCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-px h-5 bg-slate-200" />
            {onBulkAssign && (
              <button
                onClick={onBulkAssign}
                title="Bulk Assign"
                className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center animate-in zoom-in-50 duration-200"
              >
                <UserPlus size={11} />
              </button>
            )}
            <button
              onClick={onBulkUpdate}
              title="Bulk Update"
              className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
            >
              <Edit size={11} />
            </button>
            <button
              onClick={onBulkDelete}
              title="Bulk Delete"
              className="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
