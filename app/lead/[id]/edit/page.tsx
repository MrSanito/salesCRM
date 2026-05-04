"use client";
import React, { useState, useEffect, use } from 'react';
import { useRouter } from "next/navigation";
import { 
  Building2, Phone, User, Save, X, ArrowLeft, ChevronDown, Mail, ShieldAlert
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/components/auth/AuthContext";
import toast from "react-hot-toast";

const STAGE_LABEL: Record<string, string> = {
  NEW: "New", 
  CONTACTED: "Contacted", 
  NOT_INTERESTED: "Not Interested",
  MEETING_SET: "Meeting Set", 
  NEGOTIATION: "Negotiation",
  COLD: "Cold", 
  CHATTING: "Chatting",
};

const PIPELINE_STAGES = ["NEW", "CONTACTED", "NOT_INTERESTED", "MEETING_SET", "NEGOTIATION", "COLD", "CHATTING"];

const SUB_STATUS_LABEL: Record<string, string> = {
  NO_REQUIREMENT: "No Requirement",
  BUDGET_LOW: "Budget Low",
  PROPOSAL_SENT: "Proposal Sent",
  WARM_LEAD: "Warm Lead",
  BLANK: "Blank",
};

export default function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    contactName: "",
    company: "",
    phone: "",
    email: "",
    stage: "",
    priority: "MEDIUM",
    dealValueInr: "0",
    ownerId: "",
    requirement: "",
    industry: "",
    phone2: "",
    email2: ""
  });

  const canAssign = user?.role === "ORG_ADMIN" || user?.role === "MANAGER";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leadRes = await fetch(`/api/leads/${leadId}`);
        const leadData = await leadRes.json();
        
        if (leadData.id) {
          setFormData({
            contactName: leadData.contactName,
            company: leadData.company,
            phone: leadData.phone || "",
            email: leadData.email || "",
            stage: leadData.stage,
            priority: leadData.priority,
            dealValueInr: leadData.dealValueInr || "0",
            ownerId: leadData.ownerId,
            requirement: leadData.requirement || "",
            industry: leadData.industry || "",
            phone2: leadData.phone2 || "",
            email2: leadData.email2 || ""
          });
        }

        const teamRes = await fetch("/api/team");
        const teamData = await teamRes.json();
        if (Array.isArray(teamData)) setTeam(teamData);

      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Intelligence Synchronized");
        router.push("/dashboard/leads");
      } else {
        toast.error("Protocol Update Failed");
      }
    } catch (err) {
      toast.error("Network Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col sm:flex-row">
      <Sidebar activeNav="New Leads" />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 sm:ml-64">
        <Navbar activeNav="Edit Intelligence" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button onClick={() => router.back()} className="text-sm font-bold text-slate-400 hover:text-slate-700 flex items-center gap-2 mb-2 transition-colors uppercase tracking-widest">
                  <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Edit Lead</h1>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-tighter bg-white px-2 py-1 rounded-md border border-slate-200">
                    ID: {leadId.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={() => router.back()} className="bg-white text-slate-500 px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 uppercase tracking-widest">
                   <X size={16} /> Cancel
                 </button>
                 <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                 >
                   {saving ? "Saving..." : "Save Changes"} <Save size={16} />
                 </button>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
               <div className="p-8 md:p-10 border-b border-slate-50">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                     <User size={14} className="text-blue-500" /> Basic Identity
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Client Name</label>
                       <input type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                     </div>
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Company Entity</label>
                       <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                     </div>
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Industry</label>
                       <input type="text" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all shadow-inner" placeholder="e.g. Software, Manufacturing" />
                     </div>
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Lead Owner</label>
                       {canAssign ? (
                          <div className="relative">
                            <select 
                              value={formData.ownerId} 
                              onChange={e => setFormData({...formData, ownerId: e.target.value})} 
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer pr-12 shadow-inner"
                            >
                              {team.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.role.replace("ORG_", "")})</option>
                              ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                       ) : (
                         <div className="w-full px-5 py-4 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 flex items-center justify-between">
                            <span>{team.find(m => m.id === formData.ownerId)?.name || "Restricted Access"}</span>
                            <ShieldAlert size={14} />
                         </div>
                       )}
                     </div>
                  </div></div>

               <div className="p-8 md:p-10 border-b border-slate-50 bg-slate-50/30">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                     <Phone size={14} className="text-orange-500" /> Contact Protocol
                  </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Primary Mobile</label>
                       <div className="relative">
                        <Phone size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all font-mono" />
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Secondary Mobile</label>
                       <div className="relative">
                        <Phone size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-200" />
                        <input type="text" value={formData.phone2} onChange={e => setFormData({...formData, phone2: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all font-mono" />
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Primary Email ID</label>
                       <div className="relative">
                        <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all" />
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Secondary Email ID</label>
                       <div className="relative">
                        <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-200" />
                        <input type="email" value={formData.email2} onChange={e => setFormData({...formData, email2: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all" />
                       </div>
                     </div>
                  </div>
               </div>

               <div className="p-8 md:p-10">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                     <Building2 size={14} className="text-emerald-500" /> Intelligence Stream
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Pipeline Stage</label>
                       <div className="relative">
                         <select value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} className="w-full px-5 py-4 bg-slate-900 text-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer pr-12 shadow-lg shadow-slate-200">
                           {PIPELINE_STAGES.map(s => (
                             <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                           ))}
                         </select>
                         <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Lead Priority</label>
                       <div className="relative">
                         <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all appearance-none cursor-pointer pr-12">
                             <option value="HIGH">High Priority</option>
                             <option value="MEDIUM">Medium Priority</option>
                             <option value="LOW">Low Priority</option>
                         </select>
                         <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Contract Value (INR)</label>
                       <input type="text" value={formData.dealValueInr} onChange={e => setFormData({...formData, dealValueInr: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono" />
                     </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Lead Requirement</label>
                       <textarea 
                         value={formData.requirement} 
                         onChange={e => setFormData({...formData, requirement: e.target.value})} 
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all shadow-inner h-32 resize-none"
                         placeholder="What is the client's core requirement?"
                       />
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
