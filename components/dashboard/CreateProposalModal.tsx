"use client"
import React, { useState, useEffect } from "react";
import { X, FileText, Sparkles, Send, Download, HelpCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    contactName: string;
    company: string;
    industry?: string | null;
    requirement?: string | null;
    city?: string | null;
    state?: string | null;
    context?: {
      wholeSummary?: string | null;
      requirement?: string | null;
      useCase?: string | null;
      scope?: string | null;
      constraints?: string | null;
      drivers?: string | null;
      objections?: string | null;
      commitments?: string | null;
    } | null;
  } | null;
  onGenerated: () => void;
}

export default function CreateProposalModal({ isOpen, onClose, lead, onGenerated }: CreateProposalModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_company_name: "",
    proposal_date: "",
    industry: "",
    contact_person: "",
    team_size: "15",
    current_tools: "Excel, WhatsApp",
    business_model: "B2B SaaS",
    pain_points: "",
    desired_outcomes: "",
    scope_of_work: "Lead Management, Pipeline View, Custom Dashboard, Follow-up Reminders, Performance Analytics",
    recommended_automations: "Auto-assign new leads via round-robin, Trigger follow-up notification on status change, WhatsApp alerts on lead creation",
    deployment_timeline: "4–6 weeks",
    package_name: "Growth Package",
    pricing: "₹1,20,000 / year",
    addons: "WhatsApp API Integration – ₹10,000",
    support_duration: "90 days",
  });

  // Pre-fill form from lead details when opened
  useEffect(() => {
    if (lead) {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      setFormData((prev) => ({
        ...prev,
        client_company_name: lead.company || "",
        proposal_date: formattedDate,
        contact_person: lead.contactName || "",
        industry: lead.industry || "",
        pain_points: lead.context?.requirement || lead.requirement || "Operational fragmentation and lack of automated pipeline tracking.",
        desired_outcomes: lead.context?.drivers || "Streamlined sales operations, 100% lead follow-up accountability, and real-time dashboard visibility.",
        scope_of_work: lead.context?.scope || "Full Pipeline Management CRM, Custom Status Tracking, WhatsApp communication triggers, Role-based user controls.",
      }));
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate proposal");

      toast.success("Proposal generated and saved to Cloudinary!");

      // Trigger automatic local download of the generated proposal
      try {
        const downloadRes = await fetch(data.fileUrl);
        const blob = await downloadRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `proposal_${formData.client_company_name.replace(/\s+/g, "_")}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error("Local download failed, fallback to direct tab open:", err);
        window.open(data.fileUrl, "_blank");
      }

      onGenerated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate proposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">Create Custom CRM Proposal</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Dynamic SoloBuild Template Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
          
          {/* Section 1: Overview & Contact details */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              1. Proposal Metadata &amp; Client Overview
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Client Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.client_company_name}
                  onChange={(e) => setFormData({...formData, client_company_name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Person</label>
                <input
                  type="text"
                  required
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="Riya Patel"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Proposal Date</label>
                <input
                  type="text"
                  required
                  value={formData.proposal_date}
                  onChange={(e) => setFormData({...formData, proposal_date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="18 May 2025"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Client Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="E-Commerce"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Team Size</label>
                <input
                  type="text"
                  value={formData.team_size}
                  onChange={(e) => setFormData({...formData, team_size: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="12"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Business Model</label>
                <select
                  value={formData.business_model}
                  onChange={(e) => setFormData({...formData, business_model: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                >
                  <option value="B2B SaaS">B2B SaaS</option>
                  <option value="B2C E-Commerce">B2C E-Commerce</option>
                  <option value="B2B Manufacturing">B2B Manufacturing</option>
                  <option value="Agency / Services">Agency / Services</option>
                  <option value="Traditional Retail">Traditional Retail</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Tooling</label>
                <input
                  type="text"
                  value={formData.current_tools}
                  onChange={(e) => setFormData({...formData, current_tools: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="Excel, WhatsApp, Tally"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pain Points & Outcomes */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              2. Core Operational Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Operational Pain Points</label>
                <textarea
                  required
                  rows={4}
                  value={formData.pain_points}
                  onChange={(e) => setFormData({...formData, pain_points: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 resize-y"
                  placeholder="Fragmented lead channels, manual reminders, missing deals..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Desired Strategic Outcomes</label>
                <textarea
                  required
                  rows={4}
                  value={formData.desired_outcomes}
                  onChange={(e) => setFormData({...formData, desired_outcomes: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 resize-y"
                  placeholder="Centralized view, automated messaging triggers, robust metrics..."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Scope of work & Automation */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              3. Proposed Scope &amp; Workflow Automations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Scope of Work (Selected Modules)</label>
                <textarea
                  required
                  rows={3}
                  value={formData.scope_of_work}
                  onChange={(e) => setFormData({...formData, scope_of_work: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 resize-y"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommended Workflow Automations</label>
                <textarea
                  required
                  rows={3}
                  value={formData.recommended_automations}
                  onChange={(e) => setFormData({...formData, recommended_automations: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 resize-y"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Package, pricing & delivery */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              4. Packaging &amp; Commercial Terms
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  value={formData.package_name}
                  onChange={(e) => setFormData({...formData, package_name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="Growth Package"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Package Pricing</label>
                <input
                  type="text"
                  required
                  value={formData.pricing}
                  onChange={(e) => setFormData({...formData, pricing: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="₹1,20,000 / year"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Optional Add-ons</label>
                <input
                  type="text"
                  value={formData.addons}
                  onChange={(e) => setFormData({...formData, addons: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="WhatsApp API – ₹10,000"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Deployment Timeline</label>
                <input
                  type="text"
                  value={formData.deployment_timeline}
                  onChange={(e) => setFormData({...formData, deployment_timeline: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="4–6 weeks"
                />
              </div>

              <div className="lg:col-span-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hypercare Support Duration</label>
                <select
                  value={formData.support_duration}
                  onChange={(e) => setFormData({...formData, support_duration: e.target.value})}
                  className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                >
                  <option value="30 days">30 days</option>
                  <option value="60 days">60 days</option>
                  <option value="90 days">90 days</option>
                  <option value="180 days">180 days</option>
                  <option value="1 year">1 year</option>
                </select>
              </div>
            </div>
          </div>

        </form>

        {/* Footer controls */}
        <div className="px-8 py-6 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 transition-all active:scale-95"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate &amp; Deliver
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
