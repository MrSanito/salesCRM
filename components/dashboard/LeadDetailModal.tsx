"use client"
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Building2, Phone, Mail, CalendarCheck, ChevronDown, MessageCircle, ShieldAlert, Target } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import toast from "react-hot-toast";

import EngagementStream from "./lead-detail/EngagementStream";
import IntelligenceDossier from "./lead-detail/IntelligenceDossier";
import GatekeeperProtocol from "./lead-detail/GatekeeperProtocol";
import ScheduleFollowupModal from "./lead-detail/ScheduleFollowupModal";
import AuditLogs from "./lead-detail/AuditLogs";

const STAGE_LABEL: Record<string, string> = {
  NEW: "New", 
  CONTACTED: "Contacted", 
  NOT_INTERESTED: "Not Interested",
  MEETING_SET: "Meeting Set", 
  NEGOTIATION: "Negotiation",
  COLD: "Cold Chatting", 
  CHATTING: "Cold Chatting",
};

const PIPELINE_STAGES = ["NEW", "CONTACTED", "CHATTING", "MEETING_SET", "NEGOTIATION", "NOT_INTERESTED"];

const SUB_STATUS_LABEL: Record<string, string> = {
  NO_REQUIREMENT: "No Requirement",
  BUDGET_LOW: "Budget Low",
  PROPOSAL_SENT: "Proposal Sent",
  WARM_LEAD: "Warm Lead",
  BLANK: "Blank",
};

export interface DbLead {
  id: string;
  contactName: string;
  company: string;
  email: string | null;
  email2: string | null;
  phone: string | null;
  phone2: string | null;
  stage: string;
  subStatus: string;
  industry: string | null;
  priority: string;
  dealValueInr: string;
  requirement: string | null;
  followUpAt: string | null;
  createdAt: string;
  ownerId: string;
  owner: { name: string; initials: string };
}

interface LeadDetailModalProps {
  leadId: string;
  onClose: () => void;
  isLoading?: boolean;
  onSwitch?: (dir: "next" | "prev") => void;
  onUpdate?: () => void;
}

export default function LeadDetailModal({ leadId, onClose, isLoading, onSwitch, onUpdate }: LeadDetailModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const canChangeOwner = user?.role === "ORG_ADMIN" || user?.role === "MANAGER";

  const [lead, setLead] = useState<DbLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [industry, setIndustry] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [team, setTeam] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(true);
  const [expandedField, setExpandedField] = useState<string | null>("wholeSummary");
  const [activeTab, setActiveTab] = useState<"INTEL" | "AUDIT">("INTEL");
  const [context, setContext] = useState({
    wholeSummary: "", requirement: "", useCase: "", scope: "",
    constraints: "", drivers: "", objections: "", commitments: ""
  });
  const [checklist, setChecklist] = useState({
    contactVerified: false, requirementDefined: false,
    dataReceived: false, orderConfirmed: false, proposalSigned: false,
  });
  const [dealValue, setDealValue] = useState("");
  const [isValueEditable, setIsValueEditable] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch lead and team
  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    
    const fetchData = async () => {
      try {
        const [leadRes, teamRes, notesRes] = await Promise.all([
          fetch(`/api/leads/${leadId}`),
          canChangeOwner ? fetch("/api/team") : Promise.resolve(null),
          fetch(`/api/notes?leadId=${leadId}`)
        ]);

        const leadData = await leadRes.json();
        if (leadData.id) {
          setLead(leadData);
          setStage(leadData.stage);
          setSubStatus(leadData.subStatus || "BLANK");
          setIndustry(leadData.industry || "");
          setDealValue(leadData.dealValueInr || "");
          setOwnerId(leadData.ownerId);
          setContext(prev => ({
            ...prev,
            requirement: leadData.requirement || "",
          }));
        }

        if (teamRes) {
          const teamData = await teamRes.json();
          if (Array.isArray(teamData)) setTeam(teamData);
        }

        if (notesRes) {
          const notesData = await notesRes.json();
          if (Array.isArray(notesData)) setNotes(notesData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId, canChangeOwner]);

  const handleAddNote = async () => {
    if (!noteInput.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, content: noteInput.trim() }),
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes([newNote, ...notes]);
        setNoteInput("");
        toast.success("Note synchronized with intelligence");
      }
    } catch (err) {
      toast.error("Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleUpdate = async (overrideStage?: string, overrideOwner?: string, overrideSubStatus?: string) => {
    setUpdating(true);
    try {
      const payload = {
        stage: overrideStage || stage,
        subStatus: overrideSubStatus || subStatus,
        industry: industry,
        dealValueInr: parseFloat(dealValue) || 0,
        ownerId: overrideOwner || (ownerId !== lead?.ownerId ? ownerId : undefined),
        requirement: context.requirement,
      };

      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Intelligence Synchronized");
        const updated = await res.json();
        setLead(updated);
        onUpdate?.(); // Notify parent to refresh
      } else {
        const err = await res.json();
        toast.error(err.error || "Protocol Update Failed");
      }
    } catch (err) {
      toast.error("Network Error");
    } finally {
      setUpdating(false);
    }
  };

  const toggleChecklist = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id as keyof typeof checklist] }));
  };
  const updateContext = (field: string, val: string) => {
    setContext((prev) => ({ ...prev, [field]: val }));
  };

  const logInteraction = async (type: "CALL" | "EMAIL" | "WHATSAPP") => {
    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, type })
      });
      // Optionally refresh audit logs if the tab is active
      if (activeTab === "AUDIT") {
        // We could trigger a re-render of AuditLogs by updating a state or using a key
      }
    } catch (err) {
      console.error("Failed to log interaction:", err);
    }
  };

  if (!lead && !loading && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-transparent backdrop-blur-[2px] animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100 flex flex-col">

        {/* Header */}
        <div className="h-16 bg-white border-b border-slate-50 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
              <X size={22} />
            </button>
            <div className="h-6 w-[1px] bg-slate-100 mx-1" />
            <div className="flex items-center gap-1">
              {onSwitch && (
                <button onClick={() => onSwitch("prev")} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-95">
                  <ChevronLeft size={22} />
                </button>
              )}
              <span className="text-[10px] font-bold text-slate-300 font-mono uppercase tracking-[0.2em] px-2">
                {lead?.id.slice(0, 8).toUpperCase() || "—"}
              </span>
              {onSwitch && (
                <button onClick={() => onSwitch("next")} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-95">
                  <ChevronRight size={22} />
                </button>
              )}
            </div>
          </div>

          {!loading && !isLoading && (
            <button
              onClick={() => router.push(`/lead/${leadId}/edit`)}
              className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-slate-800 transition-all active:scale-95"
            >
              Edit Details
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {(loading || isLoading) ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Intelligence...</p>
            </div>
          ) : lead && (
            <div className="p-5 sm:p-10 pt-4">
              {/* Lead Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                      {STAGE_LABEL[lead.stage] || lead.stage}
                    </span>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{lead.contactName}</h1>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400" />
                      <span className="text-base font-semibold">{lead.company}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg text-[11px] text-slate-900 border border-slate-200">
                      <span className="font-bold uppercase tracking-widest text-[9px] text-slate-500">Industry:</span>
                      <input 
                        type="text" 
                        value={industry}
                        onChange={e => setIndustry(e.target.value)}
                        onBlur={() => handleUpdate()}
                        className="bg-transparent border-none outline-none font-bold w-32 placeholder:text-slate-300"
                        placeholder="Set Industry"
                      />
                    </div>
                  </div>
                </div>

                {/* Lead Owner */}
                <div className="flex flex-col items-end text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Lead Owner</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {team.find(t => t.id === ownerId)?.initials || lead.owner?.initials || "—"}
                    </div>
                    <div className="relative group/owner">
                      {canChangeOwner ? (
                        <div className="relative">
                          <select
                            value={ownerId}
                            onChange={(e) => {
                              const newOwnerId = e.target.value;
                              setOwnerId(newOwnerId);
                              handleUpdate(undefined, newOwnerId);
                            }}
                            className="bg-transparent text-lg font-bold text-slate-800 focus:outline-none appearance-none pr-6 cursor-pointer"
                          >
                            {team.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-slate-400">
                            {lead.owner?.name || "—"}
                          </span>
                          <ShieldAlert size={12} className="inline ml-1 text-slate-300 opacity-0 group-hover/owner:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact & Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-12">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Contact Protocol</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 border border-orange-100">
                        <Phone size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Primary Mobile</p>
                        <a href={`tel:${lead.phone}`} className="text-[14px] font-bold text-slate-700 tracking-tight hover:text-blue-600 transition-colors block truncate">
                          {lead.phone || "Not Provided"}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                        <Mail size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Primary Email</p>
                        <a href={`mailto:${lead.email}`} className="text-[14px] font-bold text-slate-700 tracking-tight lowercase truncate hover:text-blue-600 transition-colors block">
                          {lead.email || "—"}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 border border-orange-100 opacity-70">
                        <Phone size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Secondary Mobile</p>
                        <span className="text-[14px] font-bold text-slate-700 tracking-tight block truncate">
                          {lead.phone2 || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100 opacity-70">
                        <Mail size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Secondary Email</p>
                        <span className="text-[14px] font-bold text-slate-700 tracking-tight lowercase truncate block">
                          {lead.email2 || "-"}
                        </span>
                      </div>
                    </div>

                    {lead.requirement && (
                      <div className="col-span-1 sm:col-span-2 flex items-start gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-white text-slate-400 flex items-center justify-center flex-shrink-0 border border-slate-200">
                          <Target size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lead Requirement </p>
                          <p className="text-[12px] text-slate-700 font-bold leading-relaxed">
                            {lead.requirement}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Engagement Metrics</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                      <p className="text-[14px] font-bold text-slate-700">{lead.priority.charAt(0) + lead.priority.slice(1).toLowerCase()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deal Value (Editable)</p>
                      <div className="flex items-center gap-1 group/value">
                        <span className="text-[14px] font-black text-slate-400 group-hover/value:text-blue-500 transition-colors">₹</span>
                        <input 
                          type="text"
                          value={dealValue}
                          onChange={e => setDealValue(e.target.value)}
                          onBlur={() => handleUpdate()}
                          className="text-[14px] font-bold text-slate-700 bg-transparent border-none outline-none w-24 focus:text-blue-600 transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created On</p>
                      <p className="text-[14px] font-bold text-slate-700">
                        {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    {lead.followUpAt && (
                      <div>
                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider mb-1">Follow Up</p>
                        <p className="text-[14px] font-bold text-orange-600">
                          {new Date(lead.followUpAt).toLocaleDateString("en-IN", { 
                            day: "numeric", 
                            month: "short", 
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Layer */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <a 
                    href={`tel:${lead.phone}`} 
                    onClick={() => logInteraction("CALL")}
                    className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 group hover:border-orange-200 hover:bg-orange-50 transition-all active:scale-[0.98] shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 group-hover:scale-110 transition-transform">
                      <Phone size={14} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Direct Call</p>
                      <p className="text-[11px] font-black text-slate-700 tracking-tight uppercase">Initiate Call</p>
                    </div>
                  </a>

                  <a 
                    href={`mailto:${lead.email}`} 
                    onClick={() => logInteraction("EMAIL")}
                    className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 group hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-[0.98] shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                      <Mail size={14} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Email Lead</p>
                      <p className="text-[11px] font-black text-slate-700 tracking-tight uppercase">Send Message</p>
                    </div>
                  </a>

                  <a
                    href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => logInteraction("WHATSAPP")}
                    className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 group hover:border-green-200 hover:bg-green-50 transition-all active:scale-[0.98] shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100 group-hover:scale-110 transition-transform">
                      <MessageCircle size={14} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">WhatsApp</p>
                      <p className="text-[11px] font-black text-slate-700 tracking-tight uppercase">Open Chat</p>
                    </div>
                  </a>

                  <button
                    onClick={() => setShowSchedule(true)}
                    className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 group hover:border-purple-200 hover:bg-purple-50 transition-all active:scale-[0.98] shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform">
                      <CalendarCheck size={14} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Pipeline</p>
                      <p className="text-[11px] font-black text-slate-700 tracking-tight uppercase">Schedule Followup</p>
                    </div>
                  </button>
                </div>

                {/* Status Updaters */}
                <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 text-center block">Update Status</label>
                    <div className="relative">
                      <select
                        value={stage}
                        onChange={(e) => {
                          const newStage = e.target.value;
                          setStage(newStage);
                          handleUpdate(newStage);
                        }}
                        className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer pr-10 shadow-lg shadow-slate-200"
                      >
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s} className="bg-slate-900" value={s}>{STAGE_LABEL[s]}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1 -translate-y-1 text-white pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 text-center block">Sub-status</label>
                    <div className="relative">
                      <select
                        value={subStatus}
                        onChange={(e) => {
                          const newSubStatus = e.target.value;
                          setSubStatus(newSubStatus);
                          handleUpdate(undefined, undefined, newSubStatus);
                        }}
                        className="w-full bg-blue-50 text-blue-700 border border-blue-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer pr-10"
                      >
                        {Object.keys(SUB_STATUS_LABEL).map(s => (
                          <option key={s} value={s}>{SUB_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1 -translate-y-1 text-blue-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 text-center block">Deal Value (₹)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dealValue}
                        onChange={(e) => setDealValue(e.target.value)}
                        onBlur={() => handleUpdate()}
                        className="w-full border rounded-xl px-4 py-3 text-sm font-bold bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 shadow-sm"
                        placeholder="e.g. 500000"
                      />
                    </div>
                  </div>
                </div>

                {/* Gatekeeper */}
                <GatekeeperProtocol checklist={checklist} toggleChecklist={toggleChecklist} />

                {/* Notes Section */}
                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Add a Note</h3>
                  <div className="flex gap-2 mb-6">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Append new Information about this lead"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                      onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={isAddingNote || !noteInput.trim()}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {isAddingNote ? "Adding..." : "Add Note"}
                    </button>
                  </div>

                  <div className="space-y-4 mb-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {notes.length === 0 ? (
                      <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No  notes logged</p>
                    ) : (
                      notes.map((note) => (
                        <div key={note.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl relative group/note">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-[8px] font-black text-blue-600 flex items-center justify-center">
                                {note.user?.initials}
                              </div>
                              <span className="text-[10px] font-bold text-slate-900">{note.user?.name}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Context Summary Section (Restored to original Dossier style) */}
                <div className="pt-8 border-t border-slate-100 pb-12">
                  <IntelligenceDossier
                    context={context}
                    updateContext={(field, val) => {
                      updateContext(field, val);
                    }}
                    onBlur={() => handleUpdate()}
                    isDossierOpen={isDossierOpen}
                    setIsDossierOpen={setIsDossierOpen}
                    expandedField={expandedField}
                    setExpandedField={setExpandedField}
                    isRequirementEditable={true}
                  />
                </div>

                {/* Protocol History Section (Always Visible Now) */}
                <div className="pt-8 border-t border-slate-100 pb-20">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Protocol History</h3>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
                    <AuditLogs leadId={lead.id} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <ScheduleFollowupModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        leadId={lead?.id || ""}
        leadName={lead?.contactName}
      />
    </div>
  );
}
