"use client";
import React, { useState, useEffect, use } from 'react';
import { ALL_LEADS, PIPELINE_STAGES, Lead } from "@/lib/data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Building2, Phone, User, Save, X, ArrowLeft, ChevronDown
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const leadId = parseInt(resolvedParams.id);
  const initialLead = ALL_LEADS.find(l => l.id === leadId) as Lead | undefined;

  // In a real app we'd fetch this from API and not use a hardcoded fallback if not found, 
  // but for the frontend demo we can just redirect.
  useEffect(() => {
    if (!initialLead) {
      router.push('/');
    }
  }, [initialLead, router]);

  const [formData, setFormData] = useState<Lead>(initialLead || {
    id: 0, 
    initials: '', 
    name: '', 
    company: '', 
    status: '', 
    subStatus: '', 
    owner: '', 
    value: '', 
    priority: '', 
    date: '',
    primaryMobile: '',
    secondaryMobile: '',
    email: '',
    secondaryEmail: '',
    interestedIn: '',
    source: ''
  });

  if (!initialLead) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col sm:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 sm:ml-64">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button onClick={() => router.back()} className="text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-2 transition-colors">
                  <ArrowLeft size={16} /> Back to Lead Detail
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Edit Lead</h1>
                  <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-tighter bg-white px-2 py-1 rounded-md border border-slate-200">
                    LD-{initialLead.id}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <Link href={`/lead/${initialLead.id}`} className="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
                   <X size={16} /> Cancel
                 </Link>
                 <button onClick={() => router.push(`/lead/${initialLead.id}`)} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2">
                   <Save size={16} /> Save Changes
                 </button>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 md:p-8 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <User size={18} className="text-blue-500" /> Basic Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client Name</label>
                       <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
                       <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lead Owner</label>
                       <input type="text" value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                     </div>
                  </div>
               </div>

               <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Phone size={18} className="text-orange-500" /> Contact Protocol
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Mobile</label>
                       <input type="text" value={formData.primaryMobile || ""} onChange={e => setFormData({...formData, primaryMobile: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Secondary Mobile</label>
                       <input type="text" value={formData.secondaryMobile || ""} onChange={e => setFormData({...formData, secondaryMobile: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email ID</label>
                       <input type="email" value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Secondary Email ID</label>
                       <input type="email" value={formData.secondaryEmail || ""} onChange={e => setFormData({...formData, secondaryEmail: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                     </div>
                  </div>
               </div>

               <div className="p-6 md:p-8">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Building2 size={18} className="text-emerald-500" /> Pipeline Alignment
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                       <div className="relative">
                         <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer pr-10">
                           {PIPELINE_STAGES.map(stage => (
                             <option key={stage} value={stage}>{stage}</option>
                           ))}
                         </select>
                         <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sub Status</label>
                       <input type="text" value={formData.subStatus} onChange={e => setFormData({...formData, subStatus: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Value</label>
                       <input type="text" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                       <div className="relative">
                         <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer pr-10">
                             <option value="High">High</option>
                             <option value="Medium">Medium</option>
                             <option value="Low">Low</option>
                         </select>
                         <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>
                     </div>
                  </div>
               </div>

                <div className="p-6 md:p-8 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Building2 size={18} className="text-purple-500" /> Intelligence
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interested In</label>
                       <input type="text" value={formData.interestedIn || ""} onChange={e => setFormData({...formData, interestedIn: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Source</label>
                       <input type="text" value={formData.source || ""} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold" />
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
