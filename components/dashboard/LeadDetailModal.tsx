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
  NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent", NEGOTIATION: "Negotiation",
  WON: "Won", CLOSED_LOST: "Closed Lost",
};

const PIPELINE_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "CLOSED_LOST"];

export interface DbLead {
  id: string;
  contactName: string;
  company: string;
  email: string | null;
  phone: string | null;
  stage: string;
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

  // Fetch lead and team
  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    
    const fetchData = async () => {
      try {
        const leadRes = await fetch(`/api/leads/${leadId}`);
        const leadData = await leadRes.json();
        if (leadData.id) {
          setLead(leadData);
          setStage(leadData.stage);
          setDealValue(leadData.dealValueInr || "");
          setOwnerId(leadData.ownerId);
          setContext(prev => ({
            ...prev,
            requirement: leadData.requirement || "",
          }));
        }

        if (canChangeOwner) {
          const teamRes = await fetch("/api/team");
          const teamData = await teamRes.json();
          if (Array.isArray(teamData)) setTeam(teamData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId, canChangeOwner]);

  const handleUpdate = async (overrideStage?: string, overrideOwner?: string) => {
    setUpdating(true);
    try {
      const payload = {
        stage: overrideStage || stage,
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
        toast.error("Protocol Update Failed");
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
        <div className="h-16 bg-white border-b border-slate-50 flex items-center justify-between px-8 flex-shrink-0 z-20">
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
            <div className="p-8 sm:p-10 pt-4">
              {/* Lead Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                      {STAGE_LABEL[lead.stage] || lead.stage}
                    </span>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{lead.contactName}</h1>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 size={16} className="text-slate-400" />
                    <span className="text-base font-semibold">{lead.company}</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-6">
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
                      
                      {lead.requirement && (
                        <div className="flex items-start gap-3 pl-1">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 border border-slate-100">
                            <Target size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Key Requirement</p>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                              {lead.requirement}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                        <Mail size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email ID</p>
                        <a href={`mailto:${lead.email}`} className="text-[14px] font-bold text-slate-700 tracking-tight lowercase truncate hover:text-blue-600 transition-colors block">
                          {lead.email || "Not Provided"}
                        </a>
                      </div>
                    </div>
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
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deal Value</p>
                      <p className="text-[14px] font-bold text-slate-700">
                        ₹{parseFloat(lead.dealValueInr).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created On</p>
                      <p className="text-[14px] font-bold text-slate-700">
                        {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider mb-1">Follow Up</p>
                      <p className="text-[14px] font-bold text-orange-600">
                        {lead.followUpAt
                          ? new Date(lead.followUpAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                          : "Not Set"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Layer */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
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
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 text-center block">Update Stage</label>
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
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 text-center block">Deal Value (₹)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dealValue}
                        onChange={(e) => setDealValue(e.target.value)}
                        readOnly={stage !== "WON" && !isValueEditable}
                        className={`w-full border rounded-xl px-4 py-3 text-sm font-bold transition-all ${stage === "WON" || isValueEditable ? "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 shadow-sm" : "border-slate-100 text-slate-400 cursor-not-allowed bg-slate-50"}`}
                        placeholder="e.g. 500000"
                      />
                    </div>
                    <button
                      onClick={() => handleUpdate()}
                      disabled={updating}
                      className="mt-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-md disabled:opacity-50"
                    >
                      {updating ? "Syncing..." : "Process & Submit"}
                    </button>
                  </div>
                </div>

                {/* Gatekeeper */}
                <GatekeeperProtocol checklist={checklist} toggleChecklist={toggleChecklist} />

                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-100 pb-px">
                  <button 
                    onClick={() => setActiveTab("INTEL")}
                    className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === "INTEL" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                  >
                    Intelligence & Engagement
                  </button>
                  <button 
                    onClick={() => setActiveTab("AUDIT")}
                    className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === "AUDIT" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                  >
                    Protocol History
                  </button>
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 gap-6 pb-12 min-h-[450px]">
                  {activeTab === "INTEL" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <EngagementStream leadId={lead.id} ownerName={user?.name || "You"} />
                      <IntelligenceDossier
                        context={context}
                        updateContext={updateContext}
                        isDossierOpen={isDossierOpen}
                        setIsDossierOpen={setIsDossierOpen}
                        expandedField={expandedField}
                        setExpandedField={setExpandedField}
                        isRequirementEditable={true}
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 h-full">
                      <AuditLogs leadId={lead.id} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-50 px-10 py-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success("Pushed to Production!", { icon: "🚀", style: { borderRadius: "12px", background: "#0f172a", color: "#fff", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" } })}
              className="px-12 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              Push
            </button>
          </div>
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
