"use client";
import React, { useState, useEffect, use } from 'react';
import { useRouter } from "next/navigation";
import { 
  Building2, Phone, User, Save, X, ArrowLeft, ChevronDown, Mail, ShieldAlert
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/components/auth/AuthContext";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import toast from "react-hot-toast";
import axios from "axios";

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
  CHATTING: "Chatting",
  NOT_ANSWERED: "Not Answered",
  WRONG_NO: "Wrong Number",
  NO_REQUIREMENT: "No Requirement",
  BUDGET_LOW: "Budget Low",
  PROPOSAL_SENT: "Proposal Sent",
  WARM_LEAD: "Warm Lead",
  TEXTED: "Texted",
  BLANK: "Blank",
};

const SUB_STATUS_OPTIONS = ["BLANK", "CHATTING", "NOT_ANSWERED", "WRONG_NO", "NO_REQUIREMENT", "BUDGET_LOW", "PROPOSAL_SENT", "WARM_LEAD", "TEXTED"];

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
    notes: "",
    industry: "",
    phone2: "",
    email2: "",
    subStatus: "BLANK",
    project: "",
    followUpAt: "",
    closedAt: "",
    source: ""
  });

  const canAssign = user?.role === "ORG_ADMIN" || user?.role === "MANAGER";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadRes, teamRes] = await Promise.all([
          axios.get(`/api/leads/${leadId}`),
          axios.get("/api/team")
        ]);
        
        const leadData = leadRes.data;
        if (leadData.id) {
          setFormData({
            contactName: leadData.contactName,
            company: leadData.company,
            phone: leadData.phone || "",
            email: leadData.email || "",
            stage: leadData.stage,
            priority: leadData.priority,
            dealValueInr: leadData.dealValueInr?.toString() || "0",
            ownerId: leadData.ownerId,
            requirement: leadData.requirement || "",
            notes: leadData.notes?.[0]?.content || "",
            industry: leadData.industry || "",
            phone2: leadData.phone2 || "",
            email2: leadData.email2 || "",
            subStatus: leadData.subStatus || "BLANK",
            project: leadData.project || "",
            followUpAt: leadData.followUpAt ? new Date(leadData.followUpAt).toISOString().split('T')[0] : "",
            closedAt: leadData.closedAt ? new Date(leadData.closedAt).toISOString().split('T')[0] : "",
            source: leadData.source?.name || ""
          });
        }

        if (Array.isArray(teamRes.data)) setTeam(teamRes.data);

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
      await axios.patch(`/api/leads/${leadId}`, formData);
      toast.success("Intelligence Synchronized");
      router.push("/dashboard/leads");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Protocol Update Failed");
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
    <DashboardProvider>
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Edit Lead Protocol</h1>
                    <span className="text-[10px] font-bold text-blue-600 font-mono uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                      PROTOCOL ID: {leadId.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => router.back()} className="bg-white text-slate-500 px-6 py-3 rounded-2xl text-[10px] font-black shadow-sm border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2 uppercase tracking-widest">
                     <X size={14} /> Discard
                   </button>
                   <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2 uppercase tracking-[0.2em] active:scale-95 disabled:opacity-50"
                   >
                     {saving ? "Synchronizing..." : "Commit Changes"} <Save size={14} />
                   </button>
                </div>
              </div>

              {/* Form */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                 {/* ────── BASIC IDENTITY ────── */}
                 <div className="p-8 sm:p-10 border-b border-slate-50 bg-slate-50/30">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                          <User size={14} />
                       </div>
                       Identity Parameters
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Legal Name</label>
                         <input type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                       </div>
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Corporate Entity</label>
                         <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                       </div>
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sector / Industry</label>
                         <input type="text" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g. Fintech, E-commerce" />
                       </div>
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Project Identifier</label>
                         <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g. Cloud Infrastructure Phase 1" />
                       </div>
                       <div className="space-y-2 sm:col-span-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assigned Protocol Officer</label>
                         {canAssign ? (
                            <div className="relative">
                              <select 
                                value={formData.ownerId} 
                                onChange={e => setFormData({...formData, ownerId: e.target.value})} 
                                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer pr-12"
                              >
                                {team.map(m => (
                                  <option key={m.id} value={m.id}>{m.name} ({m.role.replace("ORG_", "")})</option>
                                ))}
                              </select>
                              <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                         ) : (
                           <div className="w-full px-6 py-4 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 flex items-center justify-between">
                              <span>{team.find(m => m.id === formData.ownerId)?.name || "Access Restricted"}</span>
                              <ShieldAlert size={14} />
                           </div>
                         )}
                       </div>
                    </div>
                 </div>

                 {/* ────── CONTACT PROTOCOL ────── */}
                 <div className="p-8 sm:p-10 border-b border-slate-50">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                          <Phone size={14} />
                       </div>
                       Communication Matrix
                    </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Mobile</label>
                         <div className="relative">
                          <Phone size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono" />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Secondary Mobile</label>
                         <div className="relative">
                          <Phone size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-200" />
                          <input type="text" value={formData.phone2} onChange={e => setFormData({...formData, phone2: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono" />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Email</label>
                         <div className="relative">
                          <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Secondary Email</label>
                         <div className="relative">
                          <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-200" />
                          <input type="email" value={formData.email2} onChange={e => setFormData({...formData, email2: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                         </div>
                       </div>
                    </div>
                 </div>

                 {/* ────── INTELLIGENCE STREAM ────── */}
                 <div className="p-8 sm:p-10 bg-slate-50/20">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                          <Building2 size={14} />
                       </div>
                       Intelligence Dossier
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pipeline Stage</label>
                         <div className="relative">
                           <select value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} className="w-full px-6 py-4 bg-slate-900 text-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer pr-12 shadow-xl shadow-slate-200">
                             {PIPELINE_STAGES.map(s => (
                               <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                             ))}
                           </select>
                           <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Sub-Status</label>
                         <div className="relative">
                           <select value={formData.subStatus} onChange={e => setFormData({...formData, subStatus: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer pr-12">
                             {SUB_STATUS_OPTIONS.map(s => (
                               <option key={s} value={s}>{SUB_STATUS_LABEL[s]}</option>
                             ))}
                           </select>
                           <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Priority Level</label>
                         <div className="relative">
                           <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer pr-12">
                               <option value="HIGH">CRITICAL / HIGH</option>
                               <option value="MEDIUM">STANDARD / MEDIUM</option>
                               <option value="LOW">MAINTENANCE / LOW</option>
                           </select>
                           <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contract Value (INR)</label>
                         <div className="relative">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</div>
                          <input type="text" value={formData.dealValueInr} onChange={e => setFormData({...formData, dealValueInr: e.target.value})} className="w-full pl-10 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono" />
                         </div>
                       </div>
                        <div className="space-y-2 sm:col-span-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lead Source</label>
                          <input type="text" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="e.g. Website, LinkedIn, Personal Referral" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Requirement Summary</label>
                          <textarea 
                            value={formData.requirement} 
                            onChange={e => setFormData({...formData, requirement: e.target.value})} 
                            onKeyDown={e => { if (e.key === 'Enter') e.stopPropagation(); }}
                            rows={6}
                            className="w-full px-6 py-5 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-h-[150px] resize-y shadow-inner"
                            placeholder="What is the lead specifically looking for?"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Private Internal Notes</label>
                          <textarea 
                            value={formData.notes} 
                            onChange={e => setFormData({...formData, notes: e.target.value})} 
                            onKeyDown={e => { if (e.key === 'Enter') e.stopPropagation(); }}
                            rows={6}
                            className="w-full px-6 py-5 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-h-[150px] resize-y shadow-inner"
                            placeholder="Internal insights, background info, or strategy..."
                          />
                        </div>
                    </div>
                 </div>

                 {/* ────── TIMELINE PROTOCOL ────── */}
                 <div className="p-8 sm:p-10 border-t border-slate-50 bg-white">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-200">
                          <Save size={14} />
                       </div>
                       Timeline Protocol
                    </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Next Follow-up Protocol</label>
                          <input type="date" value={formData.followUpAt} onChange={e => setFormData({...formData, followUpAt: e.target.value})} className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Target Closing Date</label>
                          <input type="date" value={formData.closedAt} onChange={e => setFormData({...formData, closedAt: e.target.value})} className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" />
                        </div>
                     </div>
              </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-10 pb-12 px-4">
                 <button onClick={() => router.back()} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">
                   Discard Changes
                 </button>
                 <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black shadow-2xl shadow-slate-300 hover:bg-slate-800 transition-all flex items-center gap-3 uppercase tracking-[0.2em] active:scale-95 disabled:opacity-50"
                 >
                   {saving ? "SAVING..." : "COMMIT CHANGES"} <Save size={16} />
                 </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}

