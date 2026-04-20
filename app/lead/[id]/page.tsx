"use client";
import React, { useState } from 'react';
import { ALL_LEADS, PIPELINE_STAGES, SUB_STATUSES } from "@/lib/data";
import Link from "next/link";
import { 
  Building2, Phone, Mail, Briefcase, Globe, Tag, History, LineChart, 
  MessageSquare, TrendingDown, Edit, Activity, CalendarCheck, ChevronLeft,
  LayoutDashboard, CheckSquare, ShieldCheck, Target, Info, TrendingUp, ChevronDown
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
  
  const [context, setContext] = useState(lead?.contextSummary || {
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

  const toggleChecklist = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id as keyof typeof checklist] }));
  };

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
                    <div className="relative">
                      <select 
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer pr-10"
                      >
                         {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
                 <div className="flex flex-col w-full sm:w-56">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1">Sub Status</label>
                    <div className="relative">
                      <select 
                        value={subStatus}
                        onChange={(e) => setSubStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer pr-10"
                      >
                         {SUB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
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

            {/* INTELLIGENCE HUB (COMPACT & EDITABLE) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-12">
              {[
                { id: "requirement", label: "Requirement", icon: <Target size={14} /> },
                { id: "useCase", label: "Use Case", icon: <Info size={14} /> },
                { id: "scope", label: "Scope", icon: <Briefcase size={14} /> },
                { id: "constraints", label: "Constraints", icon: <Edit size={14} /> },
                { id: "drivers", label: "Drivers", icon: <TrendingUp size={14} /> },
                { id: "objections", label: "Objections", icon: <MessageSquare size={14} /> },
              ].map((field) => (
                <div key={field.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
                  <div className="flex items-center gap-2 mb-2 text-slate-400 group-hover:text-slate-900 transition-colors">
                    {field.icon}
                    <span className="text-[10px] font-bold uppercase tracking-widest">{field.label}</span>
                  </div>
                  <textarea 
                    value={context[field.id as keyof typeof context]}
                    onChange={(e) => updateContext(field.id, e.target.value)}
                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 focus:outline-none resize-none min-h-[40px] leading-snug"
                    placeholder="Enter intel..."
                  />
                </div>
              ))}
            </div>

            {/* GATEKEEPER BAR (PROTOCOL COMPLIANCE) */}
            <div className="bg-slate-900 rounded-2xl p-5 shadow-xl flex flex-col xl:flex-row items-center justify-between gap-6 mb-12 border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-all duration-1000" />
               <div className="flex items-center gap-4 relative z-10">
                 <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                    <ShieldCheck size={20} className="text-white" />
                 </div>
                 <div>
                    <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] leading-none mb-1">Gatekeeper</h3>
                    <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Protocol Sync</p>
                 </div>
               </div>
               <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
                 {[
                   { id: "contactVerified", label: "Contact", short: "CV" },
                   { id: "requirementDefined", label: "Requirement", short: "RD" },
                   { id: "dataReceived", label: "Data", short: "DR" },
                   { id: "orderConfirmed", label: "Order", short: "OC" },
                   { id: "proposalSigned", label: "Proposal", short: "PS" },
                 ].map((item) => (
                   <button 
                     key={item.id}
                     onClick={() => toggleChecklist(item.id)}
                     className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                       checklist[item.id as keyof typeof checklist] 
                       ? "bg-white text-slate-900 border-white shadow-lg scale-105" 
                       : "bg-white/5 text-white/30 border-white/5 hover:border-white/15"
                     }`}
                   >
                      {checklist[item.id as keyof typeof checklist] && <CheckSquare size={12} strokeWidth={3} />}
                      {item.label}
                   </button>
                 ))}
               </div>
               <div className="flex items-center gap-4 relative z-10">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Progress</p>
                    <p className="text-xl font-black text-white leading-none">
                      {Math.round((Object.values(checklist).filter(v => v).length / Object.values(checklist).length) * 100)}%
                    </p>
                  </div>
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
