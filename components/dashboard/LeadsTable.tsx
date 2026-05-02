"use client"
import { useState, useEffect } from "react";
import { Filter, ChevronDown, Download, Eye, MoreVertical, ChevronRight, XCircle } from "lucide-react";
import * as XLSX from "xlsx";

// Stage/priority style maps — kept in sync with schema enums
const STAGE_STYLES: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-600",
  CONTACTED: "bg-cyan-50 text-cyan-600",
  QUALIFIED: "bg-indigo-50 text-indigo-600",
  PROPOSAL_SENT: "bg-amber-50 text-amber-700",
  NEGOTIATION: "bg-orange-50 text-orange-600",
  WON: "bg-green-50 text-green-700",
  CLOSED_LOST: "bg-red-50 text-red-600",
};

const STAGE_LABEL: Record<string, string> = {
  NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal", NEGOTIATION: "Negotiation",
  WON: "Won", CLOSED_LOST: "Lost",
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-50 text-red-600 border border-red-200",
  MEDIUM: "bg-amber-50 text-amber-600 border border-amber-200",
  LOW: "bg-green-50 text-green-600 border border-green-200",
};

const SUB_STATUS_LABEL: Record<string, string> = {
  CHATTING: "Chatting",
  FOLLOW_UP: "Follow up",
  NOT_ANSWERED: "Not Answered",
  MEETING_DONE: "Meeting Done",
  FIFTY_FIFTY: "50/50",
};

const SUB_STATUS_STYLES: Record<string, string> = {
  CHATTING: "bg-blue-50 text-blue-600 border border-blue-100",
  FOLLOW_UP: "bg-orange-50 text-orange-600 border border-orange-100",
  NOT_ANSWERED: "bg-red-50 text-red-600 border border-red-100",
  MEETING_DONE: "bg-green-50 text-green-600 border border-green-100",
  FIFTY_FIFTY: "bg-purple-50 text-purple-600 border border-purple-100",
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
  const [leads, setLeads] = useState<DbLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeLeadMenu, setActiveLeadMenu] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  let displayedLeads = [...leads];
  if (activeNav === "Alerts") displayedLeads = displayedLeads.filter((l) => l.priority === "HIGH");
  if (activeNav === "New Leads") displayedLeads = displayedLeads.filter((l) => l.stage === "NEW");
  if (filterPriority) displayedLeads = displayedLeads.filter((l) => l.priority === filterPriority);
  displayedLeads.sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? -diff : diff;
  });

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

      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-800">{activeNav === "New Leads" ? "New Leads Pipeline" : activeNav === "Alerts" ? "High Priority Alerts" : "All Leads Pipeline"}</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {loading ? "Loading..." : `${displayedLeads.length} lead${displayedLeads.length !== 1 ? "s" : ""} detected in current view`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-1.5 text-[12px] border px-3 py-1.5 rounded-lg transition-all ${showFilterMenu ? "bg-slate-100 border-slate-300 text-slate-900" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            >
              <Filter size={12} /> Filter
              <ChevronDown size={11} className={`text-slate-400 transition-transform ${showFilterMenu ? "rotate-180" : ""}`} />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort By</p>
                </div>
                <button onClick={() => { setSortOrder("newest"); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700">Newest to Oldest</button>
                <button onClick={() => { setSortOrder("oldest"); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Oldest to Newest</button>
                <div className="px-3 py-2 border-t border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter By Priority</p>
                </div>
                <button onClick={() => { setFilterPriority(null); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">All Priorities</button>
                <button onClick={() => { setFilterPriority("HIGH"); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-red-600 border-t border-slate-50">High Priority Only</button>
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
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 sm:px-4 py-2.5">Lead</th>
              <th className="hidden md:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Company</th>
              <th className="hidden lg:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Industry</th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 sm:px-4 py-2.5">Stage</th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 sm:px-4 py-2.5">Sub Status</th>
              <th className="hidden sm:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 sm:px-4 py-2.5">Phone</th>
              <th className="hidden lg:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Owner</th>
              <th className="hidden sm:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Follow Up</th>
              <th className="hidden xl:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Value</th>
              <th className="hidden xl:table-cell text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Priority</th>
              <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 sm:px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="text-center py-12 text-slate-400 text-[13px]">Loading leads...</td></tr>
            )}
            {!loading && displayedLeads.length === 0 && (
              <tr><td colSpan={9} className="text-center py-12 text-slate-400 text-[13px]">No leads found</td></tr>
            )}
            {displayedLeads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <td className="px-3 sm:px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                      {lead.contactName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-700 block truncate max-w-[100px] sm:max-w-none">{lead.contactName}</span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-slate-500">{lead.company}</td>
                <td className="hidden lg:table-cell px-4 py-3 text-slate-400 text-[12px] italic">{lead.industry || "—"}</td>
                <td className="px-3 sm:px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium whitespace-nowrap ${STAGE_STYLES[lead.stage] ?? "bg-slate-100 text-slate-600"}`}>
                    {STAGE_LABEL[lead.stage] || lead.stage}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold whitespace-nowrap ${SUB_STATUS_STYLES[lead.subStatus] ?? "bg-slate-50 text-slate-400 border border-slate-100"}`}>
                    {SUB_STATUS_LABEL[lead.subStatus] || lead.subStatus}
                  </span>
                </td>
                <td className="hidden sm:table-cell px-3 sm:px-4 py-3 font-medium text-slate-600 text-[11px] sm:text-[12px] font-mono">{lead.phone || "—"}</td>
                <td className="hidden lg:table-cell px-4 py-3 text-slate-500">{lead.owner?.name || "—"}</td>
                <td className={`hidden sm:table-cell px-4 py-3 text-[12px] font-medium ${lead.followUpAt && new Date(lead.followUpAt) < new Date() ? "text-red-500" : "text-slate-400"}`}>
                  {formatFollowUp(lead.followUpAt)}
                </td>
                <td className="hidden xl:table-cell px-4 py-3 text-slate-600 font-semibold text-[12px]">{formatValue(lead.dealValueInr)}</td>
                <td className="hidden xl:table-cell px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${PRIORITY_STYLES[lead.priority] || "bg-slate-100 text-slate-600"}`}>
                    {lead.priority.charAt(0) + lead.priority.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Eye size={13} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setActiveLeadMenu(activeLeadMenu === lead.id ? null : lead.id)}
                        className={`p-1.5 rounded-lg transition-colors ${activeLeadMenu === lead.id ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                      >
                        <MoreVertical size={13} />
                      </button>
                      {activeLeadMenu === lead.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                          <button onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))} className="w-full text-left px-3 py-2.5 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700">View Details</button>
                          <button className="w-full text-left px-3 py-2.5 text-[11px] hover:bg-slate-50 transition-colors font-semibold text-slate-700 border-t border-slate-50">Edit Status</button>
                          <button 
                            onClick={() => setShowDeleteConfirm(lead.id)}
                            className="w-full text-left px-3 py-2.5 text-[11px] hover:bg-red-50 text-red-600 transition-colors font-bold border-t border-slate-50"
                          >
                            Delete Lead
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

      <div className="px-5 py-3 flex items-center justify-between border-t border-slate-100">
        <p className="text-[12px] text-slate-400">Showing {displayedLeads.length} lead{displayedLeads.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-lg text-[12px] font-medium bg-blue-600 text-white">1</button>
          <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] text-slate-500 hover:bg-slate-100 transition-colors">
            Next <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
