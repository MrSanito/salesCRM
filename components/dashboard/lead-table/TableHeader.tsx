"use client"
import React from "react";
import { Filter } from "lucide-react";
import { DbLead, SortConfig, STAGE_LABEL, SUB_STATUS_LABEL } from "./types";

interface TableHeaderProps {
  leads: DbLead[];
  displayedLeads: DbLead[];
  selectedLeads: Set<string>;
  toggleSelectAll: () => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig | ((p: SortConfig) => SortConfig)) => void;
  columnFilters: Record<string, Set<string>>;
  toggleColumnFilter: (col: string, val: string | string[]) => void;
  setColumnFilters: (filters: Record<string, Set<string>> | ((p: Record<string, Set<string>>) => Record<string, Set<string>>)) => void;
  activeColumnFilter: string | null;
  setActiveColumnFilter: (col: string | null) => void;
  uniqueDates: [string, string][];
}

export default function TableHeader({
  leads,
  displayedLeads,
  selectedLeads,
  toggleSelectAll,
  sortConfig,
  setSortConfig,
  columnFilters,
  toggleColumnFilter,
  setColumnFilters,
  activeColumnFilter,
  setActiveColumnFilter,
  uniqueDates,
}: TableHeaderProps) {
  
  const handleSort = (key: keyof DbLead | 'lead') => {
    setSortConfig(p => ({
      key,
      direction: p?.key === key && p.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const FilterDropdown = ({ column, children }: { column: string; children: React.ReactNode }) => (
    activeColumnFilter === column ? (
      <>
        <div className="fixed inset-0 z-20" onClick={() => setActiveColumnFilter(null)} />
        <div className="absolute left-0 top-full mt-1 min-w-[160px] bg-white border border-slate-200 rounded-xl shadow-2xl z-30 py-1 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                setColumnFilters(prev => ({ ...prev, [column]: new Set() }));
                setActiveColumnFilter(null);
              }}
              className="text-[9px] font-black text-blue-600 uppercase tracking-wider"
            >
              Clear
            </button>
          </div>
          {children}
        </div>
      </>
    ) : null
  );

  return (
    <thead>
      <tr className="bg-slate-50 border-b border-slate-100">
        <th className="px-2 py-2 text-center">
          <input
            type="checkbox"
            checked={selectedLeads.size > 0 && selectedLeads.size === displayedLeads.length}
            onChange={toggleSelectAll}
            className="appearance-none w-3.5 h-3.5 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[1px] checked:after:top-[-2px]"
          />
        </th>

        {/* Lead Column */}
        <th className="text-left px-2 py-2 cursor-pointer select-none group" onClick={() => handleSort('lead')}>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors flex items-center gap-1">
            Lead {sortConfig?.key === 'lead' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
          </span>
        </th>

        {/* Company Column */}
        <th className="text-left px-2 py-2 cursor-pointer select-none group" onClick={() => handleSort('company')}>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors flex items-center gap-1">
            Company {sortConfig?.key === 'company' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
          </span>
        </th>

        {/* Status Column */}
        <th className="text-left px-2 py-2">
          <div className="flex items-center gap-1">
            <div className="relative inline-block">
              <button
                onClick={() => setActiveColumnFilter(activeColumnFilter === 'stage' ? null : 'stage')}
                className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['stage']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
              >
                Status <Filter size={9} />
              </button>
              <FilterDropdown column="stage">
                {["NEW", "CONTACTED", "COLD", "MEETING_SET", "NEGOTIATION", "CLIENT", "NOT_INTERESTED"].map(v => (
                  <label key={v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters['stage']?.has(v)}
                      onChange={() => toggleColumnFilter('stage', v === 'COLD' ? ['COLD', 'CHATTING'] : v)}
                      className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">{v === 'COLD' ? 'Cold/Chatting' : STAGE_LABEL[v]}</span>
                  </label>
                ))}
              </FilterDropdown>
            </div>
            <button
              onClick={() => handleSort('stage')}
              className={`p-1 rounded hover:bg-slate-100 transition-colors flex-shrink-0 ${sortConfig?.key === 'stage' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
            >
              {sortConfig?.key === 'stage' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
            </button>
          </div>
        </th>

        {/* Sub-status Column */}
        <th className="text-left px-2 py-2">
          <div className="flex items-center gap-1">
            <div className="relative inline-block">
              <button
                onClick={() => setActiveColumnFilter(activeColumnFilter === 'subStatus' ? null : 'subStatus')}
                className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['subStatus']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
              >
                Sub-status <Filter size={9} />
              </button>
              <FilterDropdown column="subStatus">
                {Object.keys(SUB_STATUS_LABEL).map(v => (
                  <label key={v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters['subStatus']?.has(v)}
                      onChange={() => toggleColumnFilter('subStatus', v)}
                      className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">{SUB_STATUS_LABEL[v]}</span>
                  </label>
                ))}
              </FilterDropdown>
            </div>
            <button
              onClick={() => handleSort('subStatus')}
              className={`p-1 rounded hover:bg-slate-100 transition-colors flex-shrink-0 ${sortConfig?.key === 'subStatus' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
            >
              {sortConfig?.key === 'subStatus' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
            </button>
          </div>
        </th>

        {/* City Column */}
        <th className="text-left px-2 py-2">
          <div className="flex items-center gap-1">
            <div className="relative inline-block">
              <button
                onClick={() => setActiveColumnFilter(activeColumnFilter === 'city' ? null : 'city')}
                className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['city']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
              >
                City <Filter size={9} />
              </button>
              <FilterDropdown column="city">
                <div className="max-h-44 overflow-y-auto">
                  {Array.from(new Set(leads.map(l => l.city).filter(Boolean))).sort().map(v => (
                    <label key={v as string} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={columnFilters['city']?.has(v as string)}
                        onChange={() => toggleColumnFilter('city', v as string)}
                        className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 truncate">{v as string}</span>
                    </label>
                  ))}
                </div>
              </FilterDropdown>
            </div>
            <button
              onClick={() => handleSort('city')}
              className={`p-1 rounded hover:bg-slate-100 transition-colors ${sortConfig?.key === 'city' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
            >
              {sortConfig?.key === 'city' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
            </button>
          </div>
        </th>

        {/* State Column */}
        <th className="text-left px-2 py-2">
          <div className="flex items-center gap-1">
            <div className="relative inline-block">
              <button
                onClick={() => setActiveColumnFilter(activeColumnFilter === 'state' ? null : 'state')}
                className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['state']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
              >
                State <Filter size={9} />
              </button>
              <FilterDropdown column="state">
                <div className="max-h-44 overflow-y-auto">
                  {Array.from(new Set(leads.map(l => l.state).filter(Boolean))).sort().map(v => (
                    <label key={v as string} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={columnFilters['state']?.has(v as string)}
                        onChange={() => toggleColumnFilter('state', v as string)}
                        className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 truncate">{v as string}</span>
                    </label>
                  ))}
                </div>
              </FilterDropdown>
            </div>
            <button
              onClick={() => handleSort('state')}
              className={`p-1 rounded hover:bg-slate-100 transition-colors ${sortConfig?.key === 'state' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
            >
              {sortConfig?.key === 'state' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
            </button>
          </div>
        </th>

        {/* Phone Column */}
        <th className="text-left px-2 py-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Phone</span>
        </th>

        {/* Source Column */}
        <th className="text-left px-2 py-2">
          <div className="flex items-center gap-1">
            <div className="relative inline-block">
              <button
                onClick={() => setActiveColumnFilter(activeColumnFilter === 'source' ? null : 'source')}
                className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['source']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
              >
                Source <Filter size={9} />
              </button>
              <FilterDropdown column="source">
                <div className="max-h-44 overflow-y-auto">
                  {Array.from(new Set(leads.map(l => l.source?.name).filter(Boolean))).sort().map(v => (
                    <label key={v as string} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={columnFilters['source']?.has(v as string)}
                        onChange={() => toggleColumnFilter('source', v as string)}
                        className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 truncate">{v as string}</span>
                    </label>
                  ))}
                </div>
              </FilterDropdown>
            </div>
            <button
              onClick={() => handleSort('source')}
              className={`p-1 rounded hover:bg-slate-100 transition-colors flex-shrink-0 ${sortConfig?.key === 'source' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
            >
              {sortConfig?.key === 'source' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
            </button>
          </div>
        </th>

        {/* Owner Column */}
        <th className="text-left px-2 py-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Owner</span>
        </th>

        {/* Created On Column */}
        <th className="text-left px-2 py-2">
          <div className="flex items-center gap-1">
            <div className="relative inline-block">
              <button
                onClick={() => setActiveColumnFilter(activeColumnFilter === 'createdAt' ? null : 'createdAt')}
                className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['createdAt']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
              >
                Created On <Filter size={9} />
              </button>
              <FilterDropdown column="createdAt">
                <div className="max-h-44 overflow-y-auto">
                  {uniqueDates.map(([iso, display]) => (
                    <label key={iso} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={columnFilters['createdAt']?.has(iso)}
                        onChange={() => toggleColumnFilter('createdAt', iso)}
                        className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">{display}</span>
                    </label>
                  ))}
                </div>
              </FilterDropdown>
            </div>
            <button
              onClick={() => handleSort('createdAt')}
              className={`p-1 rounded hover:bg-slate-100 transition-colors flex-shrink-0 ${sortConfig?.key === 'createdAt' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
            >
              {sortConfig?.key === 'createdAt' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
            </button>
          </div>
        </th>

        {/* Follow-up Column */}
        <th className="text-left px-2 py-2">
          <div className="relative inline-block">
            <button
              onClick={() => setActiveColumnFilter(activeColumnFilter === 'followup' ? null : 'followup')}
              className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['followup']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
            >
              Follow-up <Filter size={9} />
            </button>
            {activeColumnFilter === 'followup' && (
              <>
                <div className="fixed inset-0 z-[40]" onClick={() => setActiveColumnFilter(null)} />
                <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-2xl z-[50] overflow-hidden">
                  <button
                    onClick={() => {
                      toggleColumnFilter('followup', 'OVERDUE');
                      setActiveColumnFilter(null);
                    }}
                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Overdue
                  </button>
                  <button
                    onClick={() => {
                      toggleColumnFilter('followup', 'TODAY');
                      setActiveColumnFilter(null);
                    }}
                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-50"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setColumnFilters(prev => ({ ...prev, followup: new Set() }));
                      setActiveColumnFilter(null);
                    }}
                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-400 hover:bg-slate-50 transition-colors border-t border-slate-100"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
        </th>

        {/* Value Column */}
        <th className="text-left px-2 py-2 cursor-pointer select-none group" onClick={() => handleSort('dealValueInr')}>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors flex items-center gap-1">
            Value {sortConfig?.key === 'dealValueInr' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
          </span>
        </th>

        {/* Actions spacer */}
        <th className="px-2 py-2" />
      </tr>
    </thead>
  );
}
