"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ALL_LEADS, PIPELINE_STAGES, SUB_STATUSES, LEAD_SOURCES, Lead } from "@/lib/data";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import toast from "react-hot-toast";
import {
  ChevronLeft, Save, User, Building2, Phone, Mail,
  Briefcase, Globe, Tag, DollarSign, AlertTriangle,
  FileText, Target, Info, TrendingUp, MessageSquare, Shield
} from "lucide-react";

const PRIORITIES = ["High", "Medium", "Low"];
const OWNERS = ["Sahil Mehta", "Anjali Sharma", "Rahul Verma", "Priya Das", "Vikram Singh", "Arjun Mehta", "Neha Singh", "Vikram Rao", "Pooja Mehta"];

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = parseInt(params.id as string);
  const original = ALL_LEADS.find(l => l.id === leadId) as Lead | undefined;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [form, setForm] = useState({
    name: original?.name || "",
    company: original?.company || "",
    primaryMobile: original?.primaryMobile || "",
    secondaryMobile: original?.secondaryMobile || "",
    email: original?.email || "",
    secondaryEmail: original?.secondaryEmail || "",
    interestedIn: original?.interestedIn || "",
    source: original?.source || "",
    status: original?.status || "New",
    subStatus: original?.subStatus || "",
    priority: original?.priority || "Medium",
    value: original?.value || "",
    owner: original?.owner || "",
    lastActivity: original?.lastActivity || "",
    createdOn: original?.createdOn || "",
    // Intelligence context
    requirement: original?.contextSummary?.requirement || "",
    useCase: original?.contextSummary?.useCase || "",
    scope: original?.contextSummary?.scope || "",
    constraints: original?.contextSummary?.constraints || "",
    drivers: original?.contextSummary?.drivers || "",
    objections: original?.contextSummary?.objections || "",
    commitments: original?.contextSummary?.commitments || "",
  });

  const set = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  if (!original) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-2xl font-black text-slate-800 mb-2">Lead Not Found</p>
          <p className="text-sm text-slate-400 mb-6">LD-{leadId} does not exist.</p>
          <button onClick={() => router.back()} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    toast.success("Lead updated successfully!", {
      icon: "✅",
      style: { background: "#0f172a", color: "#fff", fontSize: "12px", fontWeight: "bold" },
    });
    router.back();
  };

  const Field = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
        <span className="text-slate-300">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-all placeholder:text-slate-300";
  const selectCls = inputCls + " appearance-none cursor-pointer";

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activeNav="Dashboard" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} activeNav="Edit Lead" />

        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 sm:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-400 pb-20">

            {/* Page Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Lead</h1>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono uppercase">
                      LD-{leadId}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{original.name} · {original.company}</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200"
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>

            {/* Section 1: Identity */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-3 flex items-center gap-2">
                <User size={12} className="text-slate-300" /> Lead Identity
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Full Name" icon={<User size={11} />}>
                  <input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Rohit Sharma" />
                </Field>
                <Field label="Company" icon={<Building2 size={11} />}>
                  <input className={inputCls} value={form.company} onChange={e => set("company", e.target.value)} placeholder="e.g. Sharma Industries" />
                </Field>
                <Field label="Lead Owner" icon={<User size={11} />}>
                  <select className={selectCls} value={form.owner} onChange={e => set("owner", e.target.value)}>
                    {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Priority" icon={<AlertTriangle size={11} />}>
                  <select className={selectCls} value={form.priority} onChange={e => set("priority", e.target.value)}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Section 2: Contact */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-3 flex items-center gap-2">
                <Phone size={12} className="text-slate-300" /> Contact Protocol
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Primary Mobile" icon={<Phone size={11} />}>
                  <input className={inputCls} value={form.primaryMobile} onChange={e => set("primaryMobile", e.target.value)} placeholder="+91 98765 43210" />
                </Field>
                <Field label="Secondary Mobile" icon={<Phone size={11} />}>
                  <input className={inputCls} value={form.secondaryMobile} onChange={e => set("secondaryMobile", e.target.value)} placeholder="Optional" />
                </Field>
                <Field label="Primary Email" icon={<Mail size={11} />}>
                  <input type="email" className={inputCls} value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@company.com" />
                </Field>
                <Field label="Secondary Email" icon={<Mail size={11} />}>
                  <input type="email" className={inputCls} value={form.secondaryEmail} onChange={e => set("secondaryEmail", e.target.value)} placeholder="Optional" />
                </Field>
              </div>
            </div>

            {/* Section 3: Engagement */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-3 flex items-center gap-2">
                <Briefcase size={12} className="text-slate-300" /> Engagement Metrics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Interested In" icon={<Briefcase size={11} />}>
                  <input className={inputCls} value={form.interestedIn} onChange={e => set("interestedIn", e.target.value)} placeholder="e.g. Enterprise CRM Suite" />
                </Field>
                <Field label="Lead Source" icon={<Globe size={11} />}>
                  <select className={selectCls} value={form.source} onChange={e => set("source", e.target.value)}>
                    {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Pipeline Status" icon={<Tag size={11} />}>
                  <select className={selectCls} value={form.status} onChange={e => set("status", e.target.value)}>
                    {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Sub Status" icon={<Tag size={11} />}>
                  <select className={selectCls} value={form.subStatus} onChange={e => set("subStatus", e.target.value)}>
                    {SUB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Deal Value" icon={<DollarSign size={11} />}>
                  <input className={inputCls} value={form.value} onChange={e => set("value", e.target.value)} placeholder="e.g. ₹5,00,000" />
                </Field>
                <Field label="Last Activity" icon={<FileText size={11} />}>
                  <input className={inputCls} value={form.lastActivity} onChange={e => set("lastActivity", e.target.value)} placeholder="e.g. Email Opened" />
                </Field>
              </div>
            </div>

            {/* Section 4: Intelligence Dossier */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-3 flex items-center gap-2">
                <Shield size={12} className="text-slate-300" /> Intelligence Dossier
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { key: "requirement", label: "Requirement", icon: <Target size={11} />, placeholder: "What does the lead need?" },
                  { key: "useCase", label: "Use Case", icon: <Info size={11} />, placeholder: "How will they use it?" },
                  { key: "scope", label: "Scope", icon: <Briefcase size={11} />, placeholder: "Project scope & size" },
                  { key: "constraints", label: "Constraints", icon: <AlertTriangle size={11} />, placeholder: "Budget, timeline, blockers" },
                  { key: "drivers", label: "Drivers", icon: <TrendingUp size={11} />, placeholder: "What's motivating them?" },
                  { key: "objections", label: "Objections", icon: <MessageSquare size={11} />, placeholder: "Concerns raised" },
                  { key: "commitments", label: "Commitments", icon: <FileText size={11} />, placeholder: "What we've promised" },
                ].map(({ key, label, icon, placeholder }) => (
                  <Field key={key} label={label} icon={icon}>
                    <textarea
                      rows={3}
                      className={inputCls + " resize-none leading-relaxed"}
                      value={(form as any)[key]}
                      onChange={e => set(key, e.target.value)}
                      placeholder={placeholder}
                    />
                  </Field>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => router.back()}
                className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-slate-900 text-white px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200"
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
