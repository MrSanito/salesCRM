"use client"
import React from "react";
import { Filter } from "lucide-react";
import { DbLead, SortConfig, STAGE_LABEL, SUB_STATUS_LABEL } from "./types";
import { useAuth } from "@/components/auth/AuthContext";
import { useSearchParams } from "next/navigation";
import { ColumnPreferences } from "@/hooks/useTablePreferences";

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
  distinctFilters?: {
    industries: string[];
    sources: string[];
    cities: string[];
    states: string[];
    owners?: string[];
    ownerDetails?: { id: string; name: string }[];
  };

  columnPreferences: ColumnPreferences;
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
  distinctFilters,
  columnPreferences,
}: TableHeaderProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  
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

  
  const renderHeaderCell = (colId: string) => {
    switch (colId) {
      case 'lead':
        return (
          <th key="lead" className="text-left px-2 py-2 cursor-pointer select-none group" onClick={() => handleSort('lead')}>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors flex items-center gap-1">
              Lead {sortConfig?.key === 'lead' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
            </span>
          </th>
        );
      case 'company':
        return (
          <th key="company" className="text-left px-2 py-2 cursor-pointer select-none group" onClick={() => handleSort('company')}>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors flex items-center gap-1">
              Company {sortConfig?.key === 'company' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
            </span>
          </th>
        );
      case 'industry':
        return (
          <th key="industry" className="text-left px-2 py-2">
            <div className="flex items-center gap-1">
              <div className="relative inline-block">
                <button
                  onClick={() => setActiveColumnFilter(activeColumnFilter === 'industry' ? null : 'industry')}
                  className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['industry']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Industry <Filter size={9} />
                </button>
                <FilterDropdown column="industry">
                  <div className="max-h-44 overflow-y-auto">
                    {((distinctFilters?.industries && distinctFilters.industries.length > 0) ? distinctFilters.industries : Array.from(new Set(leads.map(l => l.industry).filter(Boolean))).sort()).map(v => (
                      <label key={v as string} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columnFilters['industry']?.has(v as string)}
                          onChange={() => toggleColumnFilter('industry', v as string)}
                          className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]"
                        />
                        <span className="text-[11px] font-semibold text-slate-700 truncate">{v as string}</span>
                      </label>
                    ))}
                  </div>
                </FilterDropdown>
              </div>
              <button
                onClick={() => handleSort('industry')}
                className={`p-1 rounded hover:bg-slate-100 transition-colors flex-shrink-0 ${sortConfig?.key === 'industry' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
              >
                {sortConfig?.key === 'industry' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
              </button>
            </div>
          </th>
        );
      case 'stage':
        return (
          <th key="stage" className="text-left px-2 py-2">
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
                      <span className="text-[11px] font-semibold text-slate-700">{v === 'COLD' ? 'Cold/Chatting' : STAGE_LABEL[v as any]}</span>
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
        );
      case 'subStatus':
        return (
          <th key="subStatus" className="text-left px-2 py-2">
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
                      <span className="text-[11px] font-semibold text-slate-700">{SUB_STATUS_LABEL[v as any]}</span>
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
        );
      case 'city':
        if (!columnPreferences.showCity) return null;
        return (
          <th key="city" className="text-left px-2 py-2">
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
                    {((distinctFilters?.cities && distinctFilters.cities.length > 0) ? distinctFilters.cities : Array.from(new Set(leads.map(l => l.city).filter(Boolean))).sort()).map(v => (
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
        );
      case 'state':
        if (!columnPreferences.showState) return null;
        return (
          <th key="state" className="text-left px-2 py-2">
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
                    {((distinctFilters?.states && distinctFilters.states.length > 0) ? distinctFilters.states : Array.from(new Set(leads.map(l => l.state).filter(Boolean))).sort()).map(v => (
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
        );
      case 'phone':
        return (
          <th key="phone" className="text-left px-2 py-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Phone</span>
          </th>
        );
      case 'source':
        return (
          <th key="source" className="text-left px-2 py-2">
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
                    {((distinctFilters?.sources && distinctFilters.sources.length > 0) ? distinctFilters.sources : Array.from(new Set(leads.map(l => l.source?.name).filter(Boolean))).sort()).map(v => (
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
        );
      case 'owner':
        return (
          <th key="owner" className="text-left px-2 py-2">
            <div className="flex items-center gap-1">
              <div className="relative inline-block">
                <button
                  onClick={() => setActiveColumnFilter(activeColumnFilter === 'ownerId' ? null : 'ownerId')}
                  className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors ${columnFilters['ownerId']?.size ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Owner <Filter size={9} />
                </button>
                <FilterDropdown column="ownerId">
                  <div className="max-h-44 overflow-y-auto">
                    {((distinctFilters?.ownerDetails && distinctFilters.ownerDetails.length > 0) ? distinctFilters.ownerDetails : Array.from(new Set(leads.map(l => l.owner).filter(Boolean))).map(o => ({ id: (o as any).id, name: o!.name })))
                      .reduce((acc, curr) => {
                        if (!acc.find(x => x.id === curr.id)) acc.push(curr);
                        return acc;
                      }, [] as {id: string, name: string}[])
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(v => (
                      <label key={v.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columnFilters['ownerId']?.has(v.id)}
                          onChange={() => toggleColumnFilter('ownerId', v.id)}
                          className="appearance-none w-3 h-3 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[0.5px] checked:after:top-[-2px]"
                        />
                        <span className="text-[11px] font-semibold text-slate-700 truncate">{v.name}</span>
                      </label>
                    ))}
                  </div>
                </FilterDropdown>
              </div>
              <button
                onClick={() => handleSort('owner' as any)}
                className={`p-1 rounded hover:bg-slate-100 transition-colors flex-shrink-0 ${sortConfig?.key === ('owner' as any) ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
              >
                {sortConfig?.key === ('owner' as any) ? (sortConfig?.direction === 'asc' ? "↑" : "↓") : "↕"}
              </button>
            </div>
          </th>
        );
      case 'createdAt':
        if (!columnPreferences.showCreatedOn) return null;
        return (
          <th key="createdAt" className="text-left px-2 py-2">
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
        );
      case 'dealValueInr':
        if (!columnPreferences.showDealValue) return null;
        return (
          <th key="dealValueInr" className="text-left px-2 py-2 cursor-pointer select-none group" onClick={() => handleSort('dealValueInr')}>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors flex items-center gap-1">
              Value {sortConfig?.key === 'dealValueInr' ? (sortConfig.direction === 'asc' ? "↑" : "↓") : "↕"}
            </span>
          </th>
        );
      case 'followUpAt':
        if (!columnPreferences.showFollowUp) return null;
        return (
          <th key="followUpAt" className="text-left px-2 py-2 cursor-pointer select-none group" onClick={() => handleSort('followUpAt' as any)}>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors flex items-center gap-1">
              Follow-up {sortConfig?.key === 'followUpAt' as any ? (sortConfig?.direction === 'asc' ? "↑" : "↓") : "↕"}
            </span>
          </th>
        );
      default:
        return null;
    }
  };

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

        {columnPreferences.columnOrder.map(renderHeaderCell)}

        {/* Actions spacer */}
        <th className="px-2 py-2" />
      </tr>
    </thead>
  );
}
