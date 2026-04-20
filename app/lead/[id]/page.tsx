"use client";
import React, { useState } from 'react';
import { ALL_LEADS, PIPELINE_STAGES, SUB_STATUSES } from "@/lib/data";
import Link from "next/link";
import { 
  Building2, Phone, Mail, Briefcase, Globe, Tag, History, LineChart, 
  MessageSquare, TrendingDown, Edit, Activity, CalendarCheck, ChevronLeft,
  LayoutDashboard, CheckSquare, ShieldCheck
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { useParams, useRouter } from "next/navigation";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = parseInt(params.id as string);
  const lead = ALL_LEADS.find(l => l.id === leadId);

  // States for interactive controls
  const [status, setStatus] = useState(lead?.status || "");
  const [subStatus, setSubStatus] = useState(lead?.subStatus || "");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!lead) {
     return <div className="p-20 text-center font-bold">Protocol Error: Lead Not Found</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-auto bg-slate-50/50 flex flex-col items-center">
          <div className="w-full max-w-4xl p-6 sm:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.back()}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                   <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Lead Details</h1>
                    <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-tighter bg-white px-2 py-1 rounded-md border border-slate-200">
                      LD-{lead.id}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                  <a href={lead?.primaryMobile ? `tel:${lead.primaryMobile.replace(/ /g, '')}` : '#'} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-100 shadow-sm" title="Call">
                    <Phone size={18} />
                  </a>
                 <a href={`mailto:${lead.email}`} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm" title="Email">
                   <Mail size={18} />
                 </a>
                 <Link href={`/lead/${lead.id}/edit`} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2">
                   <Edit size={16} /> Edit 
                 </Link>
              </div>
            </div>

            {/* Status & Sub-Status Quick Actions Bar (NEW) */}
            <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm space-y-4">
               <div className="flex flex-col lg:flex-row items-end gap-4">
                 <div className="flex flex-col w-full sm:w-48">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1">Lead Status</label>
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                    >
                       {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div className="flex flex-col w-full sm:w-56">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1">Sub Status</label>
                    <select 
                      value={subStatus}
                      onChange={(e) => setSubStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                    >
                       {SUB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <button className="h-9 px-6 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all active:scale-95">
                    Update Status
                 </button>
                 
                 <div className="h-9 w-px bg-slate-200 hidden lg:block mx-2" />

                 <div className="flex-1 flex flex-col w-full">
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button className="h-9 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-all flex items-center justify-center gap-2 px-2">
                           <Mail size={12} /> Email
                        </button>
                        <button className="h-9 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-orange-100 transition-all flex items-center justify-center gap-2 px-2">
                           <Phone size={12} /> Call
                        </button>
                        <button className="h-9 bg-blue-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm px-2">
                           <CalendarCheck size={12} /> Action
                        </button>
                     </div>
                 </div>
               </div>
            </div>

            {/* Main Cards */}
             <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-start justify-between mb-8 pb-8 border-b border-slate-100">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{lead.name}</h2>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Building2 size={18} />
                      <span className="text-base font-semibold">{lead.company}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Owner</p>
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">SM</div>
                      <span className="text-sm font-bold text-slate-900">{lead.owner}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Contact Info */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <LayoutDashboard size={14} className="text-slate-300" /> Contact Protocol
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                          <Phone size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Primary Mobile</p>
                          {lead?.primaryMobile ? (
                            <a href={`tel:${lead.primaryMobile.replace(/ /g, '')}`} className="text-sm font-semibold text-slate-800 hover:text-blue-600 hover:underline transition-colors block">
                              {lead.primaryMobile}
                            </a>
                          ) : (
                            <span className="text-sm font-semibold text-slate-300">Not Provided</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                          <Phone size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Secondary Mobile</p>
                          {lead.secondaryMobile ? (
                            <a href={`tel:${lead.secondaryMobile.replace(/ /g, '')}`} className="text-sm font-medium text-slate-500 font-mono hover:text-blue-600 hover:underline transition-colors block">
                              {lead.secondaryMobile}
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-slate-300">Not Provided</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Mail size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email ID</p>
                          <a href={`mailto:${lead.email}`} className="text-sm font-semibold text-slate-800 hover:text-blue-600 hover:underline transition-colors block">{lead.email}</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                          <Mail size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Secondary Email</p>
                          {lead.secondaryEmail ? (
                            <a href={`mailto:${lead.secondaryEmail}`} className="text-sm font-medium text-slate-500 hover:text-blue-600 hover:underline transition-colors block">
                              {lead.secondaryEmail}
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-slate-300">Not Provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Intelligence */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <LineChart size={14} className="text-slate-300" /> Engagement Metrics
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mt-0.5">
                          <Briefcase size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Interested In</p>
                          <p className="text-sm font-semibold text-slate-800">{lead.interestedIn}</p>
                        </div>
                      </div>
                       <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mt-0.5">
                          <Globe size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Source</p>
                          <p className="text-sm font-semibold text-slate-800">{lead.source}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mt-0.5">
                          <Activity size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                          <p className="text-sm font-semibold text-slate-800">{status}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mt-0.5">
                          <Tag size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sub Status</p>
                          <p className="text-sm font-semibold text-slate-800">{subStatus}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5">
                          <LineChart size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Last Activity</p>
                          <p className="text-sm font-semibold text-slate-800">{lead.lastActivity}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mt-0.5">
                          <MessageSquare size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Last Communicated</p>
                          <p className="text-sm font-semibold text-slate-800 font-mono">{lead.date}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mt-0.5">
                          <History size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Created On</p>
                          <p className="text-sm font-semibold text-slate-800 font-mono">{lead.createdOn}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* CONTEXT SUMMARY (CRITICAL BLOCK) */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
               <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Context Summary — Critical Intelligence</h3>
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-tighter border border-blue-100">Backbone</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 px-1 bg-slate-100/50 rounded-3xl p-1 border border-slate-100">
                 {[
                   { label: "Client Requirement", val: lead.contextSummary?.requirement, desc: "what they want" },
                   { label: "Use Case", val: lead.contextSummary?.useCase, desc: "why they need it" },
                   { label: "Scope Defined", val: lead.contextSummary?.scope, desc: "what is included" },
                   { label: "Constraints", val: lead.contextSummary?.constraints, desc: "budget / timeline / technical" },
                   { label: "Decision Drivers", val: lead.contextSummary?.drivers, desc: "price / speed / quality / relationship" },
                   { label: "Objections Raised", val: lead.contextSummary?.objections, desc: "concerns raised by client" },
                   { label: "Commitments Made", val: lead.contextSummary?.commitments, desc: "promises by sales team" },
                 ].map((field, idx) => (
                   <div key={idx} className="bg-white p-6 hover:bg-slate-50 transition-all border border-slate-50 relative group">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{field.label}</p>
                      <p className="text-[14px] font-medium text-slate-800 leading-relaxed min-h-[2rem] italic pr-4">
                        "{field.val || "Data pending intelligence update..."}"
                      </p>
                      <p className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter mt-3 group-hover:text-slate-400 transition-colors tracking-widest">Ref: {field.desc}</p>
                   </div>
                 ))}
                 <div className="bg-slate-900 p-6 flex flex-col justify-center items-center text-center rounded-2xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all" />
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Intelligence</p>
                    <p className="text-[12px] text-slate-400 max-w-xs font-medium">Auto-summarize for lead handoff.</p>
                    <button className="mt-4 px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">Regenerate</button>
                 </div>
               </div>
            </div>

            {/* DATA COMPLETENESS CHECK (GATEKEEPER) */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/5 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
               <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[80px]" />
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                     <ShieldCheck className="text-white w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-white tracking-tight">Gatekeeper: Data Completeness</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Mandatory checklist before marking as 'Won/Lost'</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <span className="text-[28px] font-black text-white">40%</span>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocol Sync</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                 {[
                   { id: "cv", label: "Contact verified", key: "contactVerified" },
                   { id: "rd", label: "Requirement defined", key: "requirementDefined" },
                   { id: "dr", label: "Data Received", key: "dataReceived" },
                   { id: "oc", label: "Order Confirmed", key: "orderConfirmed" },
                   { id: "ps", label: "Proposal Signed", key: "proposalSigned" },
                 ].map((item) => (
                   <div key={item.id} className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-4 group/item ${lead.checklist?.[item.key] ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5 hover:border-white/10"}`}>
                      <div className="flex items-center justify-between">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${lead.checklist?.[item.key] ? "bg-orange-500 shadow-lg shadow-orange-500/20" : "bg-white/5 border border-white/10 group-hover/item:border-white/30"}`}>
                          {lead.checklist?.[item.key] && <CheckSquare size={14} className="text-white" />}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">{item.id.toUpperCase()}</span>
                      </div>
                      <p className={`text-[12px] font-bold tracking-tight leading-none ${lead.checklist?.[item.key] ? "text-white" : "text-slate-400 group-hover/item:text-slate-300"}`}>{item.label}</p>
                   </div>
                 ))}
               </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                     <TrendingDown size={16} className="text-blue-600" />
                     Latest Activity Log
                   </h3>
                </div>
                <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100 flex gap-4 relative">
                   <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-xs shadow-sm">
                     AM
                   </div>
                   <div className="flex-1">
                     <div className="flex items-center gap-3 mb-1">
                       <p className="text-xs font-bold text-slate-900">Arjun Mehta</p>
                       <span className="text-[10px] font-mono text-slate-400">Today, 11:30 AM</span>
                     </div>
                     <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded text-[9px] font-bold uppercase tracking-wider">Email Response</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-bold uppercase tracking-wider">Follow-up Set</span>
                     </div>
                     <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm text-sm text-slate-600 leading-relaxed max-w-2xl">
                       <p className="mb-2"><strong className="text-slate-800 font-semibold">{lead.name.split(' ')[0]}</strong> responded to our initial enterprise proposal.</p>
                       <p>They are generally happy with the feature set and the proposed timeline, but would like to negotiate the implementation fees. I've assured them we can look into an annual contract discount.</p>
                       <p className="mt-3 text-slate-500 italic">Next Action: Prepare revised quote with 15% discount contingent on a 2-year commitment.</p>
                     </div>
                   </div>
                </div>

                {/* Add Note Section */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add a Note</h4>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-2">Quick Label:</span>
                        <button className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-all">Email Contact</button>
                        <button className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-full text-[9px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-all">Sub Status</button>
                        <button className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-full text-[9px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-all">Internal Note</button>
                     </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-700">SM</div>
                    <div className="flex-1">
                      <textarea 
                        className="w-full xl:w-2/3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 min-h-[100px] resize-y" 
                        placeholder="Log a call, add a note, or document an action item..."
                      ></textarea>
                      <div className="mt-3 flex items-center justify-end xl:w-2/3">
                        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-800 transition-all flex items-center gap-2">
                          Add Note
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
