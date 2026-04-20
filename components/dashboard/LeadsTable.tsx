"use client"
import { useState } from "react";
import { Filter, ChevronDown, Download, Eye, MoreVertical, ChevronRight } from "lucide-react";
import { ALL_LEADS, PRIORITY_STYLES, STAGE_STYLES } from "@/lib/data";

interface LeadsTableProps {
  onLeadClick: (id: number) => void;
  activeNav: string;
}

export default function LeadsTable({ onLeadClick, activeNav }: LeadsTableProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeLeadMenu, setActiveLeadMenu] = useState<number | null>(null);

  const displayedLeads = activeNav === "Alerts" 
    ? ALL_LEADS.filter(l => l.priority === "High" || l.status === "New") 
    : ALL_LEADS;

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-800">All Leads</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Your assigned leads pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-1.5 text-[12px] border px-3 py-1.5 rounded-lg transition-all ${
                showFilterMenu ? "bg-slate-100 border-slate-300 text-slate-900" : "text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Filter size={12} />
              Filter
              <ChevronDown size={11} className={`text-slate-400 transition-transform ${showFilterMenu ? "rotate-180" : ""}`} />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort By</p>
                </div>
                <button className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700">Newest to Oldest</button>
                <button className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Oldest to Newest</button>
                <button className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Highest Value (₹)</button>
                <button className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Lowest Value (₹)</button>
                <div className="px-3 py-2 border-t border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter By</p>
                </div>
                <button className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Action Needed</button>
                <button className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">High Priority Only</button>
              </div>
            )}
          </div>
          <button className="flex items-center gap-1.5 text-[12px] text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <Download size={12} />
            Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 sm:px-4 py-2.5">Lead</th>
              <th className="hidden md:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Company</th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 sm:px-4 py-2.5">Status</th>
              <th className="hidden md:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 sm:px-4 py-2.5">Sub Status</th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 sm:px-4 py-2.5">Value</th>
              <th className="hidden lg:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Owner</th>
              <th className="hidden sm:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Follow Up</th>
              <th className="hidden xl:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Priority</th>
              <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 sm:px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {displayedLeads.map((lead, i) => (
              <tr 
                key={lead.id} 
                onClick={() => onLeadClick(lead.id)}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <td className="px-3 sm:px-4 py-3">
                  <span className="font-semibold text-slate-700 block truncate max-w-[100px] sm:max-w-none">{lead.name}</span>
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-slate-500">{lead.company}</td>
                <td className="px-3 sm:px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium whitespace-nowrap ${STAGE_STYLES[lead.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="hidden md:table-cell px-3 sm:px-4 py-3 text-[11px] font-medium text-slate-500">
                  {lead.subStatus}
                </td>
                <td className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-[12px] sm:text-[13px]">{lead.value}</td>
                <td className="hidden lg:table-cell px-4 py-3 text-slate-500">{lead.owner}</td>
                <td className={`hidden sm:table-cell px-4 py-3 ${lead.date.startsWith("Today") ? "text-orange-500 font-medium" : "text-slate-400"}`}>
                  {lead.date}
                </td>
                <td className="hidden xl:table-cell px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${PRIORITY_STYLES[lead.priority]}`}>
                    {lead.priority}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Eye size={13} />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveLeadMenu(activeLeadMenu === i ? null : i)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          activeLeadMenu === i ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        }`}
                      >
                        <MoreVertical size={13} />
                      </button>
                      {activeLeadMenu === i && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                          <button className="w-full text-left px-3 py-2.5 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700">View Details</button>
                          <button className="w-full text-left px-3 py-2.5 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Edit Status</button>
                          <button className="w-full text-left px-3 py-2.5 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Mark as Hot</button>
                          <button className="w-full text-left px-3 py-2.5 text-[11px] hover:bg-red-50 text-red-600 transition-colors font-bold border-t border-slate-50">Archive Lead</button>
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
      <div className="px-5 py-3 flex items-center justify-between border-t border-slate-100">
        <p className="text-[12px] text-slate-400">Showing {displayedLeads.length} of 1,234 leads</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, "...", 42].map((p, i) => (
            <button
              key={i}
              className={`w-7 h-7 rounded-lg text-[12px] font-medium transition-colors ${
                p === 1 ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] text-slate-500 hover:bg-slate-100 transition-colors">
            Next <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
