"use client"
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Building2, Phone, Mail, CalendarCheck, ChevronDown, MessageCircle, ShieldAlert, Target, CalendarClock, Info, Pencil, Sparkles, Trash2, Download, FileText, Plus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import toast from "react-hot-toast";

import EngagementStream from "./lead-detail/EngagementStream";
import IntelligenceDossier from "./lead-detail/IntelligenceDossier";
import GatekeeperProtocol from "./lead-detail/GatekeeperProtocol";
import ScheduleFollowupModal from "./lead-detail/ScheduleFollowupModal";
import CreateProposalModal from "./CreateProposalModal";

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

const PIPELINE_STAGES = ["NEW", "CONTACTED", "CHATTING", "MEETING_SET", "NEGOTIATION", "CLIENT", "NOT_INTERESTED", "COLD", "WON"];

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
  city: string | null;
  state: string | null;
  followUpAt: string | null;
  createdAt: string;
  ownerId: string;
  owner: { name: string; initials: string };
  source: { name: string } | null;
  reminders?: any[];
  lastCommunicatedAt?: string | null;
  updatedAt: string;
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
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [isSelectingNoteForProposal, setIsSelectingNoteForProposal] = useState(false);
  const [selectedNoteIdsForProposal, setSelectedNoteIdsForProposal] = useState<string[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(true);
  const [expandedField, setExpandedField] = useState<string | null>("wholeSummary");
  
  const [contactName, setContactName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [email2, setEmail2] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  
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
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [notesSummary, setNotesSummary] = useState<string | null>(null);
  const [generatingProposalNoteId, setGeneratingProposalNoteId] = useState<string | null>(null);

  const fetchProposals = async () => {
    setProposalsLoading(true);
    try {
      const res = await fetch(`/api/proposals?leadId=${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this proposal? This will remove the Cloudinary asset too.")) return;
    try {
      const res = await fetch(`/api/proposals?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Proposal deleted successfully!");
        fetchProposals();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete proposal");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Unified API call: Lead + Notes + Team all in one
      const leadRes = await fetch(`/api/leads/${leadId}`);
      if (!leadRes.ok) throw new Error("Failed to fetch lead dossier");
      
      const leadData = await leadRes.json();
      console.log(`[LeadDetailModal] Unified Fetch Success: ${leadData.id}`);

      if (leadData.id) {
        setLead(leadData);
        setStage(leadData.stage);
        setSubStatus(leadData.subStatus || "BLANK");
        setIndustry(leadData.industry || "");
        setDealValue(leadData.dealValueInr || "");
        setOwnerId(leadData.ownerId);
        setContactName(leadData.contactName || "");
        setCompany(leadData.company || "");
        setEmail(leadData.email || "");
        setEmail2(leadData.email2 || "");
        setPhone(leadData.phone || "");
        setPhone2(leadData.phone2 || "");
        setCity(leadData.city || "");
        setState(leadData.state || "");
        setContext(prev => ({
          ...prev,
          requirement: leadData.requirement || "",
        }));

        // Notes and Team are now part of the lead data response
        if (Array.isArray(leadData.notes)) {
          setNotes(leadData.notes);
        }
        
        if (Array.isArray(leadData.team_members)) {
          setTeam(leadData.team_members);
        }
      }
    } catch (err) {
      console.error("[LeadDetailModal] Fetch Error:", err);
      toast.error("Failed to sync intelligence");
    } finally {
      setLoading(false);
    }
  };

  // Fetch lead and team
  useEffect(() => {
    if (!leadId) return;
    fetchData();
    fetchProposals();
  }, [leadId, canChangeOwner]);

  const handleCompleteFollowup = async (reminderId: string) => {
    try {
      const res = await fetch(`/api/reminders/${reminderId}/complete`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Follow-up Completed");
        fetchData(false); // Refresh data without full loader
      } else {
        toast.error("Failed to complete follow-up");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

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

  const getParsedNotePreview = (content: string) => {
    const getField = (field: string) => {
      const escapedField = field.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\*\\*${escapedField}\\*\\*\\s*:\\s*(.*)`, 'i');
      const match = content.match(regex);
      return match ? match[1].trim() : "";
    };

    return {
      clientCompanyName: getField("Client Company Name"),
      contactPerson: getField("Contact Person"),
      proposalDate: getField("Proposal Date"),
      industry: getField("Industry"),
      teamSize: getField("Team Size"),
      currentTooling: getField("Current Tooling"),
      businessModel: getField("Business Model"),
      painPoints: getField("Pain Points"),
      desiredOutcomes: getField("Desired Outcomes"),
      scopeOfWork: getField("Scope of Work"),
      automationsRecommended: getField("Automations Recommended"),
      deploymentTimeline: getField("Deployment Timeline"),
      packageSelected: getField("Package Selected"),
      totalPricing: getField("Total Pricing"),
      optionalAddons: getField("Optional Addons"),
      supportDuration: getField("Support Duration"),
    };
  };

  const handleCopyTemplate = () => {
    if (!lead) return;
    const formatTemplate = `### Proposal Specifications
- **Client Company Name**: ${lead.company || "Client Company"}
- **Contact Person**: ${lead.contactName || "Contact Person"}
- **Proposal Date**: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
- **Industry**: ${lead.industry || "General Services"}
- **Team Size**: 10
- **Current Tooling**: Excel & Manual Sheets
- **Business Model**: B2B Services
- **Pain Points**: Manual lead tracking, delayed customer communication
- **Desired Outcomes**: Accelerated pipelines, structured team hierarchy
- **Scope of Work**: Setup CRM platform, dynamic supervisor mapping
- **Automations Recommended**: Automated reminder notifications, shared team calendar
- **Deployment Timeline**: 2 weeks
- **Package Selected**: Enterprise Growth
- **Total Pricing**: INR 45,000
- **Optional Addons**: 3 Months Premium Support
- **Support Duration**: Hypercare Phase`;

    navigator.clipboard.writeText(formatTemplate);
    toast.success("Proposal template format copied to clipboard!");
  };

  const handleAutoFillTemplate = () => {
    if (!lead) return;
    const formatTemplate = `### Proposal Specifications
- **Client Company Name**: ${lead.company || "Client Company"}
- **Contact Person**: ${lead.contactName || "Contact Person"}
- **Proposal Date**: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
- **Industry**: ${lead.industry || "General Services"}
- **Team Size**: 10
- **Current Tooling**: Excel & Manual Sheets
- **Business Model**: B2B Services
- **Pain Points**: Manual lead tracking, delayed customer communication
- **Desired Outcomes**: Accelerated pipelines, structured team hierarchy
- **Scope of Work**: Setup CRM platform, dynamic supervisor mapping
- **Automations Recommended**: Automated reminder notifications, shared team calendar
- **Deployment Timeline**: 2 weeks
- **Package Selected**: Enterprise Growth
- **Total Pricing**: INR 45,000
- **Optional Addons**: 3 Months Premium Support
- **Support Duration**: Hypercare Phase`;

    setNoteInput(formatTemplate);
    toast.success("Proposal template pasted into note field!");
  };

  const handleGenerateProposalFromNote = async (noteId: string | string[], noteContent: string) => {
    if (!lead) return;
    const primaryNoteId = Array.isArray(noteId) ? noteId[0] : noteId;
    setGeneratingProposalNoteId(primaryNoteId);
    
    const getField = (field: string) => {
      const escapedField = field.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\\\*\\\\*${escapedField}\\\\*\\\\*\\\\s*:\\\\s*(.*)`, 'i');
      const match = noteContent.match(regex);
      return match ? match[1].trim() : "";
    };

    const clientName = getField("Client Company Name") || lead.company;
    const contactPerson = getField("Contact Person") || lead.contactName;

    const proposalPayload = {
      leadId: lead.id,
      client_company_name: clientName,
      proposal_date: getField("Proposal Date") || new Date().toLocaleDateString("en-IN"),
      industry: getField("Industry") || lead.industry || "",
      contact_person: contactPerson,
      team_size: getField("Team Size") || "10",
      current_tools: getField("Current Tooling") || "Excel",
      business_model: getField("Business Model") || "B2B",
      pain_points: getField("Pain Points") || "Manual overhead",
      desired_outcomes: getField("Desired Outcomes") || "Automation",
      scope_of_work: getField("Scope of Work") || "CRM Setup",
      recommended_automations: getField("Automations Recommended") || "Workflow alerts",
      deployment_timeline: getField("Deployment Timeline") || "2 weeks",
      package_name: getField("Package Selected") || "Growth Plan",
      pricing: getField("Total Pricing") || "INR 45,000",
      addons: getField("Optional Addons") || "None",
      support_duration: getField("Support Duration") || "3 Months",
    };

    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proposalPayload),
      });

      if (res.ok) {
        toast.success("Proposal successfully compiled and generated in Vault!");
        fetchProposals();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate proposal");
      }
    } catch (err: any) {
      console.error("Proposal creation error:", err);
      toast.error(err.message || "Failed to compile proposal");
    } finally {
      setGeneratingProposalNoteId(null);
    }
  };

  const handleSummarizeNotes = async () => {
    if (notes.length === 0) return;
    setIsSummarizing(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/summarize-notes`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setNotesSummary(data.summary);
        toast.success("Notes summarized");
      } else {
        toast.error("Failed to summarize notes");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;
    setIsUpdatingNote(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingNoteContent.trim() }),
      });
      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(notes.map(n => n.id === noteId ? updatedNote : n));
        setEditingNoteId(null);
        setEditingNoteContent("");
        toast.success("Note intelligence updated");
      } else {
        toast.error("Failed to update note");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsUpdatingNote(false);

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
        contactName,
        company,
        email,
        email2,
        phone,
        phone2,
        city,
        state,
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
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, type })
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[LeadDetailModal] Interaction Logged Success:`, data);
        toast.success(`${type} Protocol Logged`);
        await fetchData(false); // Refresh lead data to show updated lastCommunicatedAt
        onUpdate?.(); // Refresh parent table
      } else {
        const err = await res.json();
        console.error(`[LeadDetailModal] Interaction Logged Error:`, err);
        toast.error(err.error || "Logging Failed");
      }
    } catch (err) {
      console.error("Failed to log interaction:", err);
    }
  };


  if (!lead && !loading && !isLoading) return null;

  const activeReminder = lead?.reminders?.find(r => r.status === "PENDING");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-transparent backdrop-blur-[2px] animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100 flex flex-col mx-auto">

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

          <div className="flex items-center gap-6">
            {lead && (
              <div className="text-right hidden sm:block">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Last Edited</p>
                <p className="text-[10px] font-black text-slate-700">
                  {new Date(lead.updatedAt).toLocaleString("en-IN", { 
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" 
                  })}
                </p>
              </div>
            )}
            {!loading && !isLoading && (
              <button
                onClick={() => router.push(`/lead/${leadId}/edit`)}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-slate-800 transition-all active:scale-95"
              >
                Edit Details
              </button>
            )}
          </div>
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
                    <input
                      type="text"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      onBlur={() => handleUpdate()}
                      className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-100 rounded px-1 -ml-1 w-full"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400" />
                      <input
                        type="text"
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                        onBlur={() => handleUpdate()}
                        className="text-base font-semibold text-slate-700 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-100 rounded px-1 -ml-1 w-full max-w-[12rem]"
                      />
                    </div>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg text-[11px] text-slate-900 border border-slate-200">
                      <span className="font-bold uppercase tracking-widest text-[9px] text-slate-500">Industry:</span>
                      <input 
                        type="text" 
                        value={industry}
                        onChange={e => setIndustry(e.target.value)}
                        onBlur={() => handleUpdate()}
                        className="bg-transparent border-none outline-none font-bold w-full max-w-[8rem] placeholder:text-slate-300"
                        placeholder="Set Industry"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg text-[11px] text-slate-900 border border-slate-200">
                      <span className="font-bold uppercase tracking-widest text-[9px] text-slate-500">Location:</span>
                      <input 
                        type="text" 
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        onBlur={() => handleUpdate()}
                        className="bg-transparent border-none outline-none font-bold w-full max-w-[5rem] placeholder:text-slate-300"
                        placeholder="City"
                      />
                      <span className="text-slate-300">/</span>
                      <input 
                        type="text" 
                        value={state}
                        onChange={e => setState(e.target.value)}
                        onBlur={() => handleUpdate()}
                        className="bg-transparent border-none outline-none font-bold w-full max-w-[5rem] placeholder:text-slate-300"
                        placeholder="State"
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
                                {member.name} ({member.role === 'CEO' ? 'CEO' : member.role === 'ORG_ADMIN' ? 'Org Admin' : member.role === 'MANAGER' ? 'Supervisor' : 'Specialist'})
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-10 mb-12">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Contact Protocol</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 border border-orange-100">
                        <Phone size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Primary Mobile</p>
                        <a 
                          href={`tel:${lead.phone}`} 
                          onClick={() => logInteraction("CALL")}
                          className="text-[14px] font-bold text-slate-700 tracking-tight hover:text-blue-600 transition-colors block truncate"
                        >
                          {lead.phone || "Not Provided"}
                        </a>
                        <input
                          type="text"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          onBlur={() => handleUpdate()}
                          className="text-[11px] text-slate-400 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-50 rounded w-full"
                          placeholder="Edit Phone"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                        <Mail size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Primary Email</p>
                        <a 
                          href={`mailto:${lead.email}`} 
                          onClick={() => logInteraction("EMAIL")}
                          className="text-[14px] font-bold text-slate-700 tracking-tight lowercase truncate hover:text-blue-600 transition-colors block"
                        >
                          {lead.email || "—"}
                        </a>
                        <input
                          type="text"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onBlur={() => handleUpdate()}
                          className="text-[11px] text-slate-400 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-50 rounded w-full"
                          placeholder="Edit Email"
                        />
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
                        <input
                          type="text"
                          value={phone2}
                          onChange={e => setPhone2(e.target.value)}
                          onBlur={() => handleUpdate()}
                          className="text-[11px] text-slate-400 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-50 rounded w-full"
                          placeholder="Edit Secondary Phone"
                        />
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
                        <input
                          type="text"
                          value={email2}
                          onChange={e => setEmail2(e.target.value)}
                          onBlur={() => handleUpdate()}
                          className="text-[11px] text-slate-400 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-50 rounded w-full"
                          placeholder="Edit Secondary Email"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center flex-shrink-0 border border-slate-100">
                        <Info size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Source</p>
                        <span className="text-[14px] font-bold text-slate-700 tracking-tight block truncate">
                          {lead.source?.name || "Not Specified"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                        <CalendarClock size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Last Communication</p>
                        <span className="text-[14px] font-bold text-slate-700 tracking-tight block truncate">
                          {lead.lastCommunicatedAt ? new Date(lead.lastCommunicatedAt).toLocaleString("en-IN", { 
                            day: "numeric", 
                            month: "short", 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          }) : "Never"}
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
                          <p className="text-[12px] text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                            {lead.requirement}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Engagement Metrics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
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
                        {new Date(lead.createdAt).toLocaleString("en-IN", { 
                          day: "numeric", 
                          month: "short", 
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                      <p className="text-[14px] font-bold text-slate-700">
                        {city || state ? `${city}${city && state ? ", " : ""}${state}` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Edited</p>
                      <p className="text-[14px] font-bold text-slate-700">
                        {new Date(lead.updatedAt).toLocaleString("en-IN", { 
                          day: "numeric", 
                          month: "short", 
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                    onClick={() => setShowProposalForm(true)}
                    className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 group hover:border-indigo-200 hover:bg-indigo-50 transition-all active:scale-[0.98] shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-transform">
                      <FileText size={14} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Proposal</p>
                      <p className="text-[11px] font-black text-slate-700 tracking-tight uppercase">Create Proposal</p>
                    </div>
                  </button>

                  <button
                    onClick={() => !activeReminder && setShowSchedule(true)}
                    disabled={!!activeReminder}
                    className={`flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] shadow-sm ${
                      activeReminder 
                        ? "opacity-60 cursor-not-allowed bg-slate-50" 
                        : "hover:border-purple-200 hover:bg-purple-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-transform ${
                      activeReminder 
                        ? "bg-slate-100 text-slate-400 border-slate-200" 
                        : "bg-purple-50 text-purple-600 border-purple-100 group-hover:scale-110"
                    }`}>
                      <CalendarCheck size={14} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Pipeline</p>
                      <p className={`text-[11px] font-black tracking-tight uppercase ${activeReminder ? "text-slate-400" : "text-slate-700"}`}>
                        {activeReminder ? "Follow-up Active" : "Schedule Followup"}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Active Follow-up Display */}
                {activeReminder && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm">
                        <CalendarClock size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-orange-400 uppercase tracking-[0.2em] leading-none mb-1">Active Follow-up</p>
                        <p className="text-[12px] font-black text-slate-900">
                          {activeReminder.type} on {new Date(activeReminder.scheduledAt).toLocaleString("en-IN", { 
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" 
                          })}
                        </p>
                        {activeReminder.description && (
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 italic line-clamp-1">"{activeReminder.description}"</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCompleteFollowup(activeReminder.id)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-100 flex items-center gap-2"
                    >
                      <CalendarCheck size={12} /> Complete
                    </button>
                  </div>
                )}

                {/* Status Updaters */}
                <div className="pt-6 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
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
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Gatekeeper */}
                <GatekeeperProtocol checklist={checklist} toggleChecklist={toggleChecklist} />

                {/* Notes Section */}
                <div className="pt-8 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Add a Note</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleCopyTemplate}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1"
                      >
                        📋 Copy Proposal Template
                      </button>
                      <button
                        onClick={handleAutoFillTemplate}
                        className="bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1"
                      >
                        ✍️ Auto-Fill Template
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 mb-6">
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Append new Information about this lead"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium resize-y min-h-[100px]"
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleSummarizeNotes}
                        disabled={isSummarizing || notes.length === 0}
                        className="bg-purple-600 text-white px-4 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-1.5 w-full md:w-auto"
                      >
                        <Sparkles size={14} />
                        {isSummarizing ? "Summarizing..." : "Summarize"}
                      </button>
                      <button
                        onClick={handleAddNote}
                        disabled={isAddingNote || !noteInput.trim()}
                        className="bg-slate-900 text-white px-4 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95 w-full md:w-auto"
                      >
                        {isAddingNote ? "Adding..." : "Add Note"}
                      </button>
                    </div>
                  </div>

                  {isSummarizing && (
                    <div className="mb-6 p-8 bg-purple-50/50 border border-purple-100 rounded-xl flex flex-col items-center justify-center gap-3 animate-pulse">
                      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.2em]">AI is analyzing notes...</p>
                    </div>
                  )}

                  {notesSummary && !isSummarizing && (
                    <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl relative animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => setNotesSummary(null)} 
                        className="absolute top-3 right-3 p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                      <h4 className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                        <Sparkles size={12}/> AI Summary
                      </h4>
                      <p className="text-sm text-purple-900 font-medium whitespace-pre-wrap leading-relaxed pr-6">{notesSummary}</p>
                    </div>
                  )}

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
                              {new Date(note.updatedAt).toLocaleString("en-IN", { 
                                day: "numeric", 
                                month: "short", 
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          {editingNoteId === note.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editingNoteContent}
                                onChange={(e) => setEditingNoteContent(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium resize-y min-h-[80px]"
                                rows={3}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingNoteId(null)}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateNote(note.id)}
                                  disabled={isUpdatingNote || !editingNoteContent.trim()}
                                  className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
                                >
                                  {isUpdatingNote ? "Updating..." : "Update Note"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-slate-700 font-medium leading-relaxed pr-8 whitespace-pre-wrap">{note.content}</p>
                              {note.content?.includes("### Proposal Specifications") && (
                                <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                                    ✨ Valid Proposal Format
                                  </span>
                                  <button
                                    onClick={() => handleGenerateProposalFromNote(note.id, note.content)}
                                    disabled={generatingProposalNoteId !== null}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                                  >
                                    {generatingProposalNoteId === note.id ? (
                                      <>
                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Compiling...
                                      </>
                                    ) : (
                                      <>
                                        <FileText size={12} strokeWidth={3} />
                                        Generate Proposal
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                              <button 
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditingNoteContent(note.content);
                                }}
                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <Pencil size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Proposal Vault Section */}
                <div className="pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <FileText size={12} strokeWidth={2.5} /> Proposal Vault
                    </h3>
                    <button
                      onClick={() => {
                        setIsSelectingNoteForProposal(!isSelectingNoteForProposal);
                        setSelectedNoteIdsForProposal([]);
                      }}
                      className={`${isSelectingNoteForProposal ? "bg-red-50 text-red-600 border border-red-100" : "bg-indigo-50 border border-indigo-100 text-indigo-600"} px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100/50 transition-all active:scale-95 flex items-center gap-1`}
                    >
                      {isSelectingNoteForProposal ? (
                        <>Cancel Selection</>
                      ) : (
                        <>
                          <Plus size={12} strokeWidth={3} /> New Proposal
                        </>
                      )}
                    </button>
                  </div>

                  {isSelectingNoteForProposal && (
                    <div className="mb-6 p-5 bg-indigo-50/40 border border-indigo-100/80 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[9px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                          📋 Select Source Note for Proposal
                        </h4>
                      </div>

                      {notes.length === 0 ? (
                        <div className="p-4 bg-white border border-slate-100 rounded-xl text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            No Notes Found
                          </p>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                            Please log some notes first before generating a proposal from them. Use the "Auto-Fill Template" if you need a structural starting point.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                              Select Notes to Include as Context
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-white border border-slate-200 rounded-xl">
                              {notes.map(n => (
                                <label key={n.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                                  <input
                                    type="checkbox"
                                    checked={selectedNoteIdsForProposal.includes(n.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedNoteIdsForProposal([...selectedNoteIdsForProposal, n.id]);
                                      } else {
                                        setSelectedNoteIdsForProposal(selectedNoteIdsForProposal.filter(id => id !== n.id));
                                      }
                                    }}
                                    className="mt-1 flex-shrink-0 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-slate-700 truncate">
                                      {n.user?.name} <span className="text-slate-400 font-normal ml-1">on {new Date(n.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                    </p>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{n.content}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          {selectedNoteIdsForProposal.length > 0 && (() => {
                            const combinedContent = selectedNoteIdsForProposal
                              .map(id => notes.find(n => n.id === id)?.content || "")
                              .join("\n\n---\n\n");
                            const parsed = getParsedNotePreview(combinedContent);
                            
                            const isCompanyValid = !!parsed.clientCompanyName;
                            const isPriceValid = !!parsed.totalPricing;
                            const isContactValid = !!parsed.contactPerson;
                            const isValid = isCompanyValid && isPriceValid && isContactValid;
                            
                            const missingFields = [];
                            if (!isCompanyValid) missingFields.push("Client Company Name");
                            if (!isContactValid) missingFields.push("Contact Person");
                            if (!isPriceValid) missingFields.push("Total Pricing");

                            return (
                              <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-4 animate-in fade-in duration-200">
                                <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5">
                                  🔎 Proposal Parameter Validation Preview
                                </h5>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                  <div>
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Client Company</span>
                                    <span className={`text-[11px] font-black ${isCompanyValid ? "text-slate-800" : "text-red-500"}`}>
                                      {parsed.clientCompanyName || "[Missing client company name]"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</span>
                                    <span className={`text-[11px] font-black ${isContactValid ? "text-slate-800" : "text-red-500"}`}>
                                      {parsed.contactPerson || "[Missing contact person]"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Package / Pricing</span>
                                    <span className={`text-[11px] font-black ${isPriceValid ? "text-slate-800" : "text-red-500"}`}>
                                      {parsed.packageSelected || "General"} – {parsed.totalPricing || "[Missing pricing]"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Timeline / Support</span>
                                    <span className="text-[11px] font-black text-slate-800">
                                      {parsed.deploymentTimeline || "2 weeks"} ({parsed.supportDuration || "Hypercare"})
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2.5 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="text-[9px] font-bold flex-1">
                                    {isValid ? (
                                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                        ✓ Validation Successful
                                      </span>
                                    ) : (
                                      <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 flex items-center gap-1.5">
                                        ⚠ {missingFields.join(", ")} {missingFields.length === 1 ? "is" : "are"} not mentioned. Please check and update.
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={async () => {
                                      await handleGenerateProposalFromNote(selectedNoteIdsForProposal, combinedContent);
                                      setIsSelectingNoteForProposal(false);
                                      setSelectedNoteIdsForProposal([]);
                                    }}
                                    disabled={!isValid || generatingProposalNoteId !== null}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                                  >
                                    {generatingProposalNoteId ? (
                                      <>
                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Generating...
                                      </>
                                    ) : (
                                      "Confirm & Create Proposal"
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 mb-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {proposalsLoading ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Accessing Vault...</span>
                      </div>
                    ) : proposals.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2">
                        <FileText className="text-slate-300" size={24} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No proposals generated</p>
                      </div>
                    ) : (
                      proposals.map((prop) => (
                        <div key={prop.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-4 relative group/prop hover:border-indigo-100 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-indigo-600 flex items-center justify-center shadow-sm">
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-black text-slate-800 truncate leading-none mb-1">
                                {prop.clientCompanyName} Proposal
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                                {prop.packageName} – {prop.pricing}
                              </p>
                              <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                                Prepared by {prop.createdBy?.name || "System"} on {new Date(prop.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={prop.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center shadow-sm transition-all active:scale-95"
                              title="Download Word Proposal"
                            >
                              <Download size={14} />
                            </a>
                            <button
                              onClick={() => handleDeleteProposal(prop.id)}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center shadow-sm transition-all active:scale-95"
                              title="Delete Proposal"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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
        onSaved={() => fetchData(false)}
      />
    </div>
  );
}
