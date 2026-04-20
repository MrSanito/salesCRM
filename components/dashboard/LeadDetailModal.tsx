"use client"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Building2, Phone, Mail, CalendarCheck, ChevronDown } from "lucide-react";
import { PIPELINE_STAGES, SUB_STATUSES, PRIORITY_STYLES, Lead, LeadContext } from "@/lib/data";
import toast from "react-hot-toast";

// Sub-components
import EngagementStream from "./lead-detail/EngagementStream";
import IntelligenceDossier from "./lead-detail/IntelligenceDossier";
import GatekeeperProtocol from "./lead-detail/GatekeeperProtocol";
import ScheduleFollowupModal from "./lead-detail/ScheduleFollowupModal";

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  isLoading: boolean;
  onSwitch: (dir: 'next' | 'prev') => void;
  onUpdateClick: () => void;
}

export default function LeadDetailModal({ lead, onClose, isLoading, onSwitch, onUpdateClick }: LeadDetailModalProps) {
  const router = useRouter();
  
  // State management
  const [context, setContext] = useState(lead?.contextSummary || {
    wholeSummary: "",
    requirement: "",
    useCase: "",
    scope: "",
    constraints: "",
    drivers: "",
    objections: "",
    commitments: ""
  });

  const updateContext = (field: string, val: string) => {
    setContext(prev => ({ ...prev, [field]: val }));
  };

  const [checklist, setChecklist] = useState(lead?.checklist || {
    contactVerified: false,
    requirementDefined: false,
    dataReceived: false,
    orderConfirmed: false,
    proposalSigned: false
  });

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: "", time: "", note: "", method: "phone" });
  const [internalNote, setInternalNote] = useState("");
  const [sessionNotes, setSessionNotes] = useState<{ id: string; text: string; time: string }[]>([]);
  const [status, setStatus] = useState(lead?.status);
  const [subStatus, setSubStatus] = useState(lead?.subStatus);
  const [expandedField, setExpandedField] = useState<string | null>("wholeSummary");
  const [isDossierOpen, setIsDossierOpen] = useState(true);
  const [isRequirementEditable, setIsRequirementEditable] = useState(false);
  const [dealValue, setDealValue] = useState(lead?.value || "");
  const [isValueEditable, setIsValueEditable] = useState(false);
  const [owner, setOwner] = useState(lead?.owner || "Sahil Mehta");

  const saveCurrentNote = (text: string) => {
    if (!text.trim()) return;
    setSessionNotes(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, ...prev]);
  };

  const toggleChecklist = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id as keyof typeof checklist] }));
  };

  const handleScheduleSubmit = () => {
    if (scheduleData.note) {
      saveCurrentNote(`[Scheduled Followup - ${scheduleData.method.toUpperCase()}]: ${scheduleData.note} (Target: ${scheduleData.date} ${scheduleData.time})`);
    }
    setShowSchedule(false);
    toast.success("Follow-up Protocol Initialized", { icon: '📅' });
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-transparent backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="h-16 bg-white border-b border-slate-50 flex items-center justify-between px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
              <X size={22} />
            </button>
            <div className="h-6 w-[1px] bg-slate-100 mx-1" />
            <div className="flex items-center gap-1">
              <button 
                onClick={() => onSwitch('prev')}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-95"
              >
                <ChevronLeft size={22} />
              </button>
              <span className="text-[10px] font-bold text-slate-300 font-mono uppercase tracking-[0.2em] px-2">
                LD-{lead.id}
              </span>
              <button 
                onClick={() => onSwitch('next')}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-95"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>

          {!isLoading && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl">
                 <a 
                   href={lead.primaryMobile ? `tel:${lead.primaryMobile.replace(/\s+/g, '')}` : '#'} 
                   className="p-2 bg-white text-green-600 rounded-lg shadow-sm border border-slate-200 hover:bg-green-50 transition-all flex items-center justify-center"
                   title="Dial Pulse"
                 >
                   <Phone size={14} strokeWidth={2.5} />
                 </a>
                 <div className="w-[1px] h-3 bg-slate-200 mx-1" />
                 <a 
                   href={lead.email ? `mailto:${lead.email}` : '#'} 
                   className="p-2 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-200 hover:bg-blue-50 transition-all flex items-center justify-center"
                   title="Log Protocol"
                 >
                   <Mail size={14} strokeWidth={2.5} />
                 </a>
              </div>

              <button 
                onClick={onUpdateClick}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-slate-800 transition-all active:scale-95"
              >
                Update Data
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Intelligence...</p>
            </div>
          ) : (
            <div className="p-8 sm:p-10 pt-4">
              {/* Lead Info Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <div onClick={() => router.push(`/lead/${lead.id}`)} className="cursor-pointer group/name inline-block">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                        ID: LD-{lead.id}
                      </span>
                      <h1 className="text-3xl font-bold text-slate-900 tracking-tight group-hover/name:text-blue-600 transition-colors">{lead.name}</h1>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Building2 size={16} className="text-slate-400 group-hover/name:text-blue-400" />
                      <span className="text-base font-semibold group-hover/name:text-slate-700">{lead.company}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end text-right">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Lead Owner</p>
                   <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {owner.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="relative">
                        <select 
                          value={owner}
                          onChange={(e) => {
                            setOwner(e.target.value);
                            toast.success(`Protocol: Lead Assigned to ${e.target.value}`, { icon: '👤' });
                          }}
                          className="text-lg font-bold text-slate-800 bg-transparent focus:outline-none appearance-none cursor-pointer pr-6 hover:text-slate-600 transition-colors"
                        >
                          {["Sahil Mehta", "Anjali Sharma", "Rahul Verma", "Priya Das", "Vikram Singh"].map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1.5 text-slate-400 pointer-events-none" />
                      </div>
                   </div>
                </div>
              </div>

              {/* Contact & Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-12">
                <div className="space-y-6">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-50 pb-2">Contact Protocol</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 border border-orange-100">
                            <Phone size={16} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Primary Mobile</p>
                            <a href={`tel:${lead.primaryMobile}`} className="text-base font-bold text-slate-700 tracking-tight hover:text-blue-600 transition-colors">
                              {lead.primaryMobile}
                            </a>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center flex-shrink-0">
                            <Phone size={16} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Secondary Mobile</p>
                            <p className="text-base font-semibold text-slate-400 tracking-tight">{lead.secondaryMobile || "Not Provided"}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                            <Mail size={16} strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email ID</p>
                            <a href={`mailto:${lead.email}`} className="text-[15px] font-bold text-slate-700 tracking-tight lowercase truncate hover:text-blue-600 transition-colors block">
                              {lead.email}
                            </a>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center flex-shrink-0">
                            <Mail size={16} strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Secondary Email</p>
                            <p className="text-[15px] font-semibold text-slate-400 tracking-tight lowercase truncate">contact@mehta.com</p>
                          </div>
                      </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-50 pb-2">Engagement Metrics</h3>
                    <div className="grid grid-cols-2 gap-y-6">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Interested In</p>
                        <p className="text-[14px] font-bold text-slate-700 leading-tight">{lead.interestedIn || "Enterprise CRM Suite"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source</p>
                        <p className="text-[14px] font-bold text-slate-700 leading-tight">{lead.source}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created On</p>
                        <p className="text-[14px] font-bold text-slate-700">{lead.createdOn}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider mb-1">Last Communication</p>
                        <p className="text-[14px] font-bold text-orange-600">{lead.date}</p>
                      </div>
                    </div>
                </div>
              </div>

              {/* Action Layer */}
              <div className="space-y-6">
                {/* Protocol Quick Actions */}
                <div className="flex flex-wrap items-center gap-4">
                  <button className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 group hover:border-orange-200 hover:bg-orange-50 transition-all active:scale-[0.98] shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 group-hover:scale-110 transition-transform">
                      <Phone size={14} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Direct Call</p>
                      <p className="text-[11px] font-black text-slate-700 tracking-tight uppercase">Initiate Call</p>
                    </div>
                  </button>

                  <button className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 group hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-[0.98] shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                      <Mail size={14} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Email Lead</p>
                      <p className="text-[11px] font-black text-slate-700 tracking-tight uppercase">Send Message</p>
                    </div>
                  </button>

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
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer pr-10 shadow-lg shadow-slate-200"
                      >
                        {PIPELINE_STAGES.map(s => <option key={s} className="bg-slate-900" value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1 -translate-y-1 text-white pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 text-center block">Sub Status</label>
                    <div className="relative">
                      <select 
                        value={subStatus}
                        onChange={(e) => setSubStatus(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all appearance-none cursor-pointer pr-10"
                      >
                        {SUB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1 -translate-y-1 text-slate-400 pointer-events-none" />
                    </div>
                    <button 
                      onClick={() => {
                        if (status === "Won") {
                          setIsValueEditable(true);
                          setIsRequirementEditable(true);
                          toast.success("Protocol: Won. Fields Unlocked", { icon: '💰' });
                        } else {
                          toast.success("Status Synchronized", { icon: '✅' });
                        }
                      }}
                      className="mt-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-md"
                    >
                      Process & Submit
                    </button>
                  </div>
                </div>

                {/* DEAL VALUE - VISIBLE ONLY IF WON */}
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <div className={`border rounded-2xl p-4 flex flex-col gap-2 transition-all ${status === 'Won' ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <label className={`text-[9px] font-bold uppercase tracking-widest ${status === 'Won' ? 'text-slate-600' : 'text-slate-400'}`}>Deal Value</label>
                        {status !== 'Won' && <span className="text-[7px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">INACTIVE PROTOCOL</span>}
                      </div>
                      {!isValueEditable && <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">(Locked until submit)</span>}
                    </div>
                    <input 
                      type="text"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      readOnly={!isValueEditable}
                      className={`w-full border rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        isValueEditable 
                          ? "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 shadow-sm" 
                          : "border-slate-100 text-slate-400 cursor-not-allowed bg-slate-50 bg-opacity-50"
                      }`}
                      placeholder="e.g. ₹5,00,000"
                    />
                  </div>
                </div>

                {/* Gatekeeper Protocol Section */}
                <GatekeeperProtocol checklist={checklist} toggleChecklist={toggleChecklist} />

                {/* Split Layer: Engagement Stream & Intelligence Dossier */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                  <EngagementStream 
                    lead={lead}
                    internalNote={internalNote}
                    setInternalNote={setInternalNote}
                    saveCurrentNote={saveCurrentNote}
                    sessionNotes={sessionNotes}
                  />

                  <IntelligenceDossier 
                    context={context}
                    updateContext={updateContext}
                    isDossierOpen={isDossierOpen}
                    setIsDossierOpen={setIsDossierOpen}
                    expandedField={expandedField}
                    setExpandedField={setExpandedField}
                    isRequirementEditable={isRequirementEditable}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-50 px-10 py-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                toast.success("Pushed to Production!", {
                  icon: '🚀',
                  style: {
                    borderRadius: '12px',
                    background: '#0f172a',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  },
                });
              }}
              className="px-12 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              Push Changes
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Modal Overlay */}
      <ScheduleFollowupModal 
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        data={scheduleData}
        setData={setScheduleData}
        onSubmit={handleScheduleSubmit}
      />
    </div>
  );
}
