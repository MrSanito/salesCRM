"use client"
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ArrowUpRight, Building2, Phone, Mail, CalendarCheck, CheckSquare, ShieldCheck } from "lucide-react";
import { PIPELINE_STAGES, SUB_STATUSES, PRIORITY_STYLES, STAGE_STYLES } from "@/lib/data";

interface LeadDetailModalProps {
  lead: any;
  onClose: () => void;
  isLoading: boolean;
  onSwitch: (dir: 'next' | 'prev') => void;
  onUpdateClick: () => void;
}

export default function LeadDetailModal({ lead, onClose, isLoading, onSwitch, onUpdateClick }: LeadDetailModalProps) {
  const router = useRouter();

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100 flex flex-col">
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
              <Link 
                href={`/lead/${lead.id}`}
                className="bg-white text-slate-700 px-6 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
              >
                See Full Page <ArrowUpRight size={14} />
              </Link>
              <button 
                onClick={onUpdateClick}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
              >
                Update Lead
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Intelligence...</p>
            </div>
          ) : (
            <div className="p-8 sm:p-10 pt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                      ID: LD-{lead.id}
                    </span>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{lead.name}</h1>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 size={16} className="text-slate-400" />
                    <span className="text-base font-semibold">{lead.company}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end text-right">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Lead Owner</p>
                   <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">SM</div>
                      <span className="text-lg font-bold text-slate-800">{lead.owner}</span>
                   </div>
                </div>
              </div>

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
                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider mb-1">Last Comm.</p>
                        <p className="text-[14px] font-bold text-orange-600">{lead.date}</p>
                      </div>
                    </div>
                </div>
              </div>

              {/* CONTEXT SUMMARY (CRITICAL BLOCK) */}
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Context Summary — Critical Intelligence</h3>
                   <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-tighter border border-blue-100">Backbone</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 px-1 bg-slate-100/50 rounded-3xl p-1 border border-slate-100">
                  {[
                    { label: "Client Requirement", val: lead.contextSummary?.requirement, desc: "what they want" },
                    { label: "Use Case", val: lead.contextSummary?.useCase, desc: "why they need it" },
                    { label: "Scope Defined", val: lead.contextSummary?.scope, desc: "what is included" },
                    { label: "Constraints", val: lead.contextSummary?.constraints, desc: "budget / timeline / technical" },
                    { label: "Decision Drivers", val: lead.contextSummary?.drivers, desc: "price / speed / quality / relationship" },
                    { label: "Objections Raised", val: lead.contextSummary?.objections, desc: "concerns raised by client" },
                    { label: "Commitments Made", val: lead.contextSummary?.commitments, desc: "promises by sales team" },
                  ].map((field, idx) => (
                    <div key={idx} className="bg-white p-5 hover:bg-slate-50 transition-all border border-slate-50 relative group">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{field.label}</p>
                       <p className="text-[13px] font-medium text-slate-800 leading-relaxed min-h-[1.5rem] italic pr-4">
                         "{field.val || "Data pending intelligence update..."}"
                       </p>
                       <p className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter mt-2 group-hover:text-slate-400 transition-colors tracking-widest">Ref: {field.desc}</p>
                    </div>
                  ))}
                  <div className="bg-slate-900 p-5 flex flex-col justify-center items-center text-center rounded-2xl md:col-span-2 lg:col-span-2 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all" />
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Intelligence Generation</p>
                     <p className="text-[13px] text-slate-400 max-w-xs font-medium">Auto-summarize meeting transcripts and email threads into this critical block.</p>
                     <button className="mt-4 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">Regenerate Analysis</button>
                  </div>
                </div>
              </div>

              {/* DATA COMPLETENESS CHECK (GATEKEEPER) */}
              <div className="mb-10 bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[80px]" />
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                      <ShieldCheck className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Gatekeeper: Data Completeness</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Mandatory checklist before marking as 'Won/Lost'</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[24px] font-black text-white">40%</span>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Protocol Sync</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { id: "cv", label: "Contact verified", key: "contactVerified" },
                    { id: "rd", label: "Requirement defined", key: "requirementDefined" },
                    { id: "dr", label: "Data Received", key: "dataReceived" },
                    { id: "oc", label: "Order Confirmed", key: "orderConfirmed" },
                    { id: "ps", label: "Proposal Signed", key: "proposalSigned" },
                  ].map((item) => (
                    <div key={item.id} className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 group/item ${lead.checklist?.[item.key] ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5 hover:border-white/10"}`}>
                       <div className="flex items-center justify-between">
                         <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${lead.checklist?.[item.key] ? "bg-orange-500 shadow-lg shadow-orange-500/20" : "bg-white/5 border border-white/10 group-hover/item:border-white/30"}`}>
                           {lead.checklist?.[item.key] && <CheckSquare size={12} className="text-white" />}
                         </div>
                         <span className="text-[8px] font-bold text-slate-500 tracking-widest uppercase">{item.id.toUpperCase()}</span>
                       </div>
                       <p className={`text-[11px] font-bold tracking-tight leading-none ${lead.checklist?.[item.key] ? "text-white" : "text-slate-400 group-hover/item:text-slate-300"}`}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-8">
                <div className="flex flex-col lg:flex-row items-end gap-3 pb-8 border-b border-slate-200/50">
                   <div className="space-y-2 w-full lg:w-40">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Lead Status</label>
                      <select 
                        defaultValue={lead.status}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98] transition-all appearance-none cursor-pointer"
                      >
                         {PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2 w-full lg:w-48">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Sub Status</label>
                      <select 
                        defaultValue={lead.subStatus}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98] transition-all appearance-none cursor-pointer"
                      >
                         {SUB_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                   </div>
                   <button className="h-9 px-4 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
                      Update
                   </button>

                   <div className="h-4 w-px bg-slate-200 hidden lg:block mx-1 mb-2.5" />

                   <div className="flex-1 flex gap-2 w-full">
                      <a 
                        href={`mailto:${lead.email}`}
                        className="flex-1 h-9 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                      >
                         <Mail size={12} /> Email
                      </a>
                      <a 
                        href={`tel:${lead.primaryMobile}`}
                        className="flex-1 h-9 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center justify-center gap-2"
                      >
                         <Phone size={12} /> Call
                      </a>
                      <button 
                        className="flex-1 h-9 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.95] flex items-center justify-center gap-2"
                        onClick={onUpdateClick}
                      >
                       <CalendarCheck size={12} /> Schedule Followup
                      </button>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Add Internal Note</label>
                      <div className="flex gap-2">
                        <textarea 
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all h-20 resize-none shadow-sm"
                          placeholder="Type a private note here..."
                        />
                        <button className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 border border-slate-900 h-20">
                          Save Note
                        </button>
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4 border-t border-slate-200/50">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-[10px] shadow-sm">AM</div>
                      <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[12px] font-bold text-slate-900">Arjun Mehta</p>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Today, 11:30 AM</span>
                          </div>
                          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-[14px] text-slate-600 italic leading-relaxed">
                            "{lead.lastActivity}"
                          </div>
                      </div>
                   </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-50 px-10 py-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push(`/lead/${lead.id}/edit`)}
              className="px-8 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Edit 
            </button>
          </div>
          <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${PRIORITY_STYLES[lead.priority]}`}>
                {lead.priority} Priority
              </span>
              <div className="h-8 w-[1px] bg-slate-100 mx-2" />
              <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${STAGE_STYLES[lead.status]}`}>
                {lead.status}
              </span>
          </div>
        </div>
      </div>
    </div>
  );
}
