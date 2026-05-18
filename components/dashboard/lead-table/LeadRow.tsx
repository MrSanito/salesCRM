"use client"
import React from "react";
import { MoreVertical, Edit2, Trash2, Calendar, Phone, Mail } from "lucide-react";
import { DbLead, STAGE_STYLES, STAGE_LABEL, PRIORITY_STYLES, SUB_STATUS_LABEL, SUB_STATUS_STYLES, formatValue, formatFollowUp } from "./types";

interface LeadRowProps {
  lead: DbLead;
  selectedLeads: Set<string>;
  toggleSelectLead: (id: string) => void;
  onLeadClick: (id: string, allIds?: string[]) => void;
  activeLeadMenu: string | null;
  setActiveLeadMenu: (id: string | null) => void;
  onEditLead: (lead: DbLead) => void;
  onDeleteLeadConfirm: (id: string) => void;
  displayedLeads: DbLead[];
}

export default function LeadRow({
  lead,
  selectedLeads,
  toggleSelectLead,
  onLeadClick,
  activeLeadMenu,
  setActiveLeadMenu,
  onEditLead,
  onDeleteLeadConfirm,
  displayedLeads,
}: LeadRowProps) {
  const isSelected = selectedLeads.has(lead.id);

  // Safely get formatted follow-up message
  const getFollowUpStatus = (dateStr: string | null) => {
    if (!dateStr) return { text: "—", className: "text-slate-400 font-medium" };
    const d = new Date(dateStr);
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Overdue (${Math.abs(diffDays)}d)`, className: "text-red-600 font-bold bg-red-50/70 px-2 py-0.5 rounded border border-red-100" };
    }
    if (diffDays === 0) {
      return { text: "Today", className: "text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100" };
    }
    if (diffDays === 1) {
      return { text: "Tomorrow", className: "text-indigo-600 font-semibold bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-100" };
    }
    return {
      text: d.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }),
      className: "text-slate-600 font-medium"
    };
  };

  return (
    <tr
      className={`hover:bg-slate-50/70 transition-all border-b border-slate-100 group ${
        isSelected ? "bg-blue-50/20" : ""
      }`}
    >
      {/* Checkbox column */}
      <td className="px-2 py-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelectLead(lead.id)}
          className="appearance-none w-3.5 h-3.5 rounded border-2 border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[8px] checked:after:font-black checked:after:left-[1px] checked:after:top-[-2px]"
        />
      </td>

      {/* Contact Name & Requirement column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <div>
          <p className="text-[12px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">
            {lead.contactName}
          </p>
          {lead.requirement ? (
            <p className="text-[9px] text-slate-400 font-medium truncate max-w-[140px] mt-0.5">
              {lead.requirement}
            </p>
          ) : (
            <p className="text-[9px] text-slate-300 italic font-medium mt-0.5">No requirement specified</p>
          )}
        </div>
      </td>

      {/* Company Column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <span className="text-[11px] font-black text-slate-700 truncate block max-w-[104px]">
          {lead.company || "—"}
        </span>
      </td>

      {/* Industry Column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <span className="text-[11px] font-bold text-slate-600 truncate block max-w-[110px]">
          {lead.industry || "—"}
        </span>
      </td>

      {/* Stage (Status) column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <span
          className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded ${
            STAGE_STYLES[lead.stage] ?? "bg-slate-50 text-slate-600"
          }`}
        >
          {STAGE_LABEL[lead.stage] || lead.stage}
        </span>
      </td>

      {/* Sub status column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <span
          className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
            SUB_STATUS_STYLES[lead.subStatus] ?? "bg-slate-50 text-slate-600 border border-slate-200"
          }`}
        >
          {SUB_STATUS_LABEL[lead.subStatus] || lead.subStatus}
        </span>
      </td>

      {/* City column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <span className="text-[11px] font-bold text-slate-600 truncate block max-w-[80px]">
          {lead.city || "—"}
        </span>
      </td>

      {/* State column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <span className="text-[11px] font-bold text-slate-600 truncate block max-w-[80px]">
          {lead.state || "—"}
        </span>
      </td>

      {/* Phone & Communications column */}
      <td className="px-2 py-2 align-middle" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          {lead.phone ? (
            <a
              href={`tel:${lead.phone}`}
              className="text-[11px] font-bold text-slate-700 hover:text-blue-600 flex items-center gap-0.5 group/phone"
            >
              <Phone size={10} className="text-slate-400 group-hover/phone:text-blue-600 transition-colors" />
              <span>{lead.phone}</span>
            </a>
          ) : (
            <span className="text-[11px] text-slate-300 font-bold">—</span>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} title={lead.email}>
              <Mail size={10} className="text-slate-400 hover:text-blue-600 transition-colors" />
            </a>
          )}
        </div>
      </td>

      {/* Source column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <span className="text-[11px] font-black text-indigo-600 bg-indigo-50/70 border border-indigo-100/50 px-1.5 py-0.5 rounded text-center block max-w-[110px] truncate">
          {lead.source?.name || "—"}
        </span>
      </td>

      {/* Owner column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-5.5 h-5.5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            <span className="text-[8px] font-black text-slate-600">
              {lead.owner?.initials?.toUpperCase() || lead.owner?.name?.[0]?.toUpperCase() || "—"}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-600 truncate max-w-[65px] hidden xl:inline">
            {lead.owner?.name || "—"}
          </span>
        </div>
      </td>

      {/* Created On column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap block">
          {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
        </span>
      </td>



      {/* Value column */}
      <td
        className="px-2 py-2 cursor-pointer align-middle"
        onClick={() => onLeadClick(lead.id, displayedLeads.map(l => l.id))}
      >
        <span className="text-[12px] font-black text-slate-900 block text-right">
          {formatValue(lead.dealValueInr)}
        </span>
      </td>

      {/* Actions (Inline menu) column */}
      <td className="px-2 py-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
        <div className="relative inline-block">
          <button
            onClick={() => setActiveLeadMenu(activeLeadMenu === lead.id ? null : lead.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <MoreVertical size={12} />
          </button>
          {activeLeadMenu === lead.id && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setActiveLeadMenu(null)} />
              <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 py-1 overflow-hidden">
                <button
                  onClick={() => {
                    onEditLead(lead);
                    setActiveLeadMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Edit2 size={10} /> Edit Info
                </button>
                <button
                  onClick={() => {
                    onDeleteLeadConfirm(lead.id);
                    setActiveLeadMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-[11px] font-black text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 flex items-center gap-1.5"
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
