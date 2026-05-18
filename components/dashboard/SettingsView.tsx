"use client"
import { useState, useEffect } from "react";
import { User, Mail, Shield, Save, ArrowLeft, Camera, Fingerprint, Plus, Trash2, LayoutPanelLeft, Filter, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "", label: "Any Status" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "COLD", label: "Cold Chatting" },
  { value: "CHATTING", label: "Cold Chatting" },
  { value: "MEETING_SET", label: "Meeting Set" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
];

const SUB_STATUS_OPTIONS = [
  { value: "", label: "Any Sub-status" },
  { value: "BLANK", label: "Blank" },
  { value: "CHATTING", label: "Chatting" },
  { value: "NOT_ANSWERED", label: "Not Answered" },
  { value: "WRONG_NO", label: "Wrong No." },
  { value: "WARM_LEAD", label: "Warm Lead" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "BUDGET_LOW", label: "Budget Low" },
  { value: "NO_REQUIREMENT", label: "No Requirement" },
  { value: "TEXTED", label: "Texted" },
];

const DEAL_SIZE_OPTIONS = [
  { value: "", label: "Any Deal Size" },
  { value: "0-50000", label: "₹0 – ₹50K" },
  { value: "50000-200000", label: "₹50K – ₹2L" },
  { value: "200000-500000", label: "₹2L – ₹5L" },
  { value: "500000-1000000", label: "₹5L – ₹10L" },
  { value: "1000000-", label: "₹10L+" },
];

const COLOR_OPTIONS = [
  { value: "blue", bg: "bg-blue-500" },
  { value: "green", bg: "bg-green-500" },
  { value: "purple", bg: "bg-purple-500" },
  { value: "orange", bg: "bg-orange-500" },
  { value: "red", bg: "bg-red-500" },
  { value: "cyan", bg: "bg-cyan-500" },
  { value: "pink", bg: "bg-pink-500" },
  { value: "amber", bg: "bg-amber-500" },
];

interface SidebarFilterItem {
  id: string;
  name: string;
  statuses: string[];
  subStatuses: string[];
  industries: string[];
  sources: string[];
  dealSizeMin: string | null;
  dealSizeMax: string | null;
  alphabet: string | null;
  icon: string;
  color: string;
  orderIndex: number;
  createdBy?: { name: string };
}

export default function SettingsView() {
  const { user, checkUser } = useAuth();
  const { triggerRefresh } = useDashboard();
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  // Sidebar customization state
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilterItem[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFilter, setNewFilter] = useState({
    name: "",
    statuses: [] as string[],
    subStatuses: [] as string[],
    industries: [] as string[],
    sources: [] as string[],
    dealSize: "",
    alphabet: "",
    color: "blue",
  });
  const [industries, setIndustries] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  // Fetch sidebar filters
  useEffect(() => {
    if (user) {
      setFiltersLoading(true);
      fetch("/api/sidebar-filters")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setSidebarFilters(data);
        })
        .catch(console.error)
        .finally(() => setFiltersLoading(false));

      // Fetch unique industries
      fetch("/api/leads/industries")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setIndustries(data);
        })
        .catch(console.error);

      // Fetch unique sources
      fetch("/api/leads/sources")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setSources(data.map((s: any) => s.name));
        })
        .catch(console.error);
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (res.ok) {
        toast.success("Identity Updated Successfully");
        await checkUser();
      } else {
        const data = await res.json();
        toast.error(data.error || "Update failed");
      }
    } catch (err) {
      toast.error("Network synchronization error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFilter = async () => {
    if (!newFilter.name.trim()) {
      toast.error("Filter name is required");
      return;
    }
    setSaving(true);

    // Parse deal size range
    let dealSizeMin = null;
    let dealSizeMax = null;
    if (newFilter.dealSize) {
      const parts = newFilter.dealSize.split("-");
      dealSizeMin = parts[0] || null;
      dealSizeMax = parts[1] || null;
    }

    try {
      const res = await fetch("/api/sidebar-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFilter.name,
          statuses: newFilter.statuses,
          subStatuses: newFilter.subStatuses,
          industries: newFilter.industries,
          sources: newFilter.sources,
          dealSizeMin,
          dealSizeMax,
          alphabet: newFilter.alphabet || null,
          color: newFilter.color,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setSidebarFilters((prev) => [...prev, created]);
        setNewFilter({ name: "", statuses: [], subStatuses: [], industries: [], sources: [], dealSize: "", alphabet: "", color: "blue" });
        setShowAddForm(false);
        toast.success(`"${created.name}" added to sidebar`);
        triggerRefresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create filter");
      }
    } catch {
      toast.error("Failed to save filter");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFilter = async (id: string, filterName: string) => {
    try {
      const res = await fetch(`/api/sidebar-filters?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSidebarFilters((prev) => prev.filter((f) => f.id !== id));
        toast.success(`"${filterName}" removed from sidebar`);
        triggerRefresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete filter");
      }
    } catch {
      toast.error("Failed to delete filter due to network or server issues");
    }
  };

  const getStatusLabel = (val: string | null) => STATUS_OPTIONS.find((o) => o.value === val)?.label || "Any";
  const getSubStatusLabel = (val: string | null) => SUB_STATUS_OPTIONS.find((o) => o.value === val)?.label || "Any";
  const getDealSizeLabel = (min: string | null, max: string | null) => {
    if (!min && !max) return "Any";
    const key = `${min || "0"}-${max || ""}`;
    return DEAL_SIZE_OPTIONS.find((o) => o.value === key)?.label || `₹${min || "0"} – ₹${max || "∞"}`;
  };
  const getColorClass = (color: string) => COLOR_OPTIONS.find((o) => o.value === color)?.bg || "bg-blue-500";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security & Identity</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your professional profile and access protocols.</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col items-center text-center shadow-xl shadow-slate-200/50">
            <div className="relative group">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200 relative z-10">
                {user?.initials}
              </div>
              <div className="absolute -inset-2 bg-blue-500 rounded-[2.2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <button className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-xl border-4 border-white shadow-lg transform translate-x-1/4 translate-y-1/4 hover:scale-110 transition-all active:scale-95 z-20">
                <Camera size={14} />
              </button>
            </div>
            
            <div className="mt-6">
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mt-1">{user?.role.replace("ORG_", "").replace("_", " ")}</p>
            </div>

            <div className="w-full h-px bg-slate-50 my-6" />

            <div className="w-full space-y-4">
               <div className="flex items-center justify-between text-left p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee ID</p>
                    <p className="text-xs font-bold text-slate-700">#{user?.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <Fingerprint size={16} className="text-blue-500" />
               </div>
            </div>
          </div>
        </div>

        {/* Edit Form + Sidebar Customization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <form onSubmit={handleUpdate} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
             <div className="p-8 sm:p-10 border-b border-slate-50 bg-slate-50/30">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <User size={14} className="text-blue-600" /> Profile & Identity
                </h3>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Legal Name</label>
                      <div className="relative">
                        <User size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                          placeholder="Full Name"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 px-1 italic">This name will be visible to all members of your organization.</p>
                   </div>

                   <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address (Primary)</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 px-1">This email will be used for all system notifications and login.</p>
                   </div>
                </div>
             </div>

             <div className="p-8 sm:p-10 flex items-center justify-between bg-white">
                <div className="hidden sm:block">
                   <p className="text-xs font-bold text-slate-400">Last synced: Just now</p>
                </div>
                <button 
                  type="submit"
                  disabled={loading || (name === user?.name && email === user?.email)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 disabled:shadow-none"
                >
                  <Save size={16} />
                  {loading ? "Updating..." : "Update Email & Profile"}
                </button>
             </div>
          </form>

          {/* ────── Sidebar Customization (CEO Only) ────── */}
          {user && (
            <div id="sidebar-filters" className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden scroll-mt-6">
              <div className="p-6 sm:p-10 border-b border-slate-50 bg-slate-50/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                    <LayoutPanelLeft size={14} className="text-purple-600" /> Sidebar Protocols
                  </h3>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(!showAddForm)}
                      className={`w-full sm:w-auto flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all active:scale-95 ${
                        showAddForm
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-slate-900 text-white shadow-lg shadow-slate-200"
                      }`}
                    >
                      {showAddForm ? <X size={12} /> : <Plus size={12} />}
                      {showAddForm ? "Cancel" : "Add Filter"}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
                  Create custom sidebar shortcuts that will appear for all <span className="font-bold text-slate-700">Supervisors</span> and <span className="font-bold text-slate-700">Sales Reps</span> in your organization. 
                  Each filter becomes a clickable icon in the sidebar that instantly filters the leads table.
                </p>

                {/* ── Add New Filter Form ── */}
                {showAddForm && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* Name */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Hot Leads, Big Deals, Warm Pipeline"
                          value={newFilter.name}
                          onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                        />
                      </div>

                      {/* Multi-Status */}
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lead Statuses (Select Multiple)</label>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.filter(o => o.value).map((o) => {
                            const isSelected = newFilter.statuses.includes(o.value);
                            return (
                              <button
                                key={o.value}
                                type="button"
                                onClick={() => {
                                  const next = isSelected 
                                    ? newFilter.statuses.filter(s => s !== o.value)
                                    : [...newFilter.statuses, o.value];
                                  setNewFilter({ ...newFilter, statuses: next });
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                  isSelected 
                                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {o.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Multi-Sub-status */}
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sub-statuses (Select Multiple)</label>
                        <div className="flex flex-wrap gap-2">
                          {SUB_STATUS_OPTIONS.filter(o => o.value).map((o) => {
                            const isSelected = newFilter.subStatuses.includes(o.value);
                            return (
                              <button
                                key={o.value}
                                type="button"
                                onClick={() => {
                                  const next = isSelected 
                                    ? newFilter.subStatuses.filter(s => s !== o.value)
                                    : [...newFilter.subStatuses, o.value];
                                  setNewFilter({ ...newFilter, subStatuses: next });
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                  isSelected 
                                    ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100" 
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {o.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Multi-Industry */}
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Industries (Select Multiple)</label>
                        <div className="flex flex-wrap gap-2">
                          {industries.map((ind) => {
                            const isSelected = newFilter.industries.includes(ind);
                            return (
                              <button
                                key={ind}
                                type="button"
                                onClick={() => {
                                  const next = isSelected 
                                    ? newFilter.industries.filter(i => i !== ind)
                                    : [...newFilter.industries, ind];
                                  setNewFilter({ ...newFilter, industries: next });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                  isSelected 
                                    ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100" 
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {ind}
                              </button>
                            );
                          })}
                          {industries.length === 0 && <p className="text-[10px] text-slate-400 italic">No industries detected in database yet.</p>}
                        </div>
                      </div>

                      {/* Multi-Source */}
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sources (Select Multiple)</label>
                        <div className="flex flex-wrap gap-2">
                          {sources.map((src) => {
                            const isSelected = newFilter.sources.includes(src);
                            return (
                              <button
                                key={src}
                                type="button"
                                onClick={() => {
                                  const next = isSelected 
                                    ? newFilter.sources.filter(s => s !== src)
                                    : [...newFilter.sources, src];
                                  setNewFilter({ ...newFilter, sources: next });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                  isSelected 
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {src}
                              </button>
                            );
                          })}
                          {sources.length === 0 && <p className="text-[10px] text-slate-400 italic">No sources detected in database yet.</p>}
                        </div>
                      </div>

                      {/* Deal Size */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal Size Range</label>
                        <select
                          value={newFilter.dealSize}
                          onChange={(e) => setNewFilter({ ...newFilter, dealSize: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                        >
                          {DEAL_SIZE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Accent Color */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Accent Color</label>
                        <div className="flex items-center gap-2 py-2">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setNewFilter({ ...newFilter, color: c.value })}
                              className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
                                newFilter.color === c.value
                                  ? "ring-2 ring-offset-2 ring-slate-900 scale-110"
                                  : "opacity-60 hover:opacity-100 hover:scale-105"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Alphabet Filter */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alphabetical Lock (Contact Name)</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map(char => (
                            <button
                              key={char}
                              type="button"
                              onClick={() => setNewFilter({ ...newFilter, alphabet: newFilter.alphabet === char ? "" : char })}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold border transition-all ${
                                newFilter.alphabet === char
                                  ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-100"
                                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {char}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddFilter}
                      disabled={saving || !newFilter.name.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                      {saving ? "Initiating Protocol..." : "Activate Sidebar Protocol"}
                    </button>
                  </div>
                )}

                {/* ── Existing Filters List ── */}
                {filtersLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  </div>
                ) : sidebarFilters.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <LayoutPanelLeft size={28} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">No sidebar filters yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">Click "Add Filter" above to create custom sidebar shortcuts for your team.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sidebarFilters.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${getColorClass(f.color)} text-white flex items-center justify-center shadow-md`}>
                            <Filter size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{f.name}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {f.statuses && f.statuses.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {f.statuses.map(s => (
                                      <span key={s} className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100 uppercase tracking-tighter">
                                        {getStatusLabel(s)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {f.subStatuses && f.subStatuses.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {f.subStatuses.map(ss => (
                                      <span key={ss} className="text-[8px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg border border-purple-100 uppercase tracking-tighter">
                                        {getSubStatusLabel(ss)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {(f.dealSizeMin || f.dealSizeMax) && (
                                  <span className="text-[8px] font-black bg-green-50 text-green-600 px-2 py-0.5 rounded-lg border border-green-100 uppercase tracking-tighter">
                                    {getDealSizeLabel(f.dealSizeMin, f.dealSizeMax)}
                                  </span>
                                )}
                                {f.industries && f.industries.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {f.industries.map(ind => (
                                      <span key={ind} className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-100 uppercase tracking-tighter">
                                        {ind}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {f.alphabet && (
                                  <span className="text-[8px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg border border-rose-100 uppercase tracking-tighter">
                                    {f.alphabet}*
                                  </span>
                                )}
                                {f.sources && f.sources.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {f.sources.map(src => (
                                      <span key={src} className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-tighter">
                                        {src}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {!f.statuses?.length && !f.subStatuses?.length && !f.dealSizeMin && !f.dealSizeMax && !f.industries?.length && !f.alphabet && !f.sources?.length && (
                                  <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-100 uppercase tracking-tighter">
                                    Full Access Protocol
                                  </span>
                                )}
                              </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteFilter(f.id, f.name)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-90 opacity-60 hover:opacity-100"
                          title="Remove filter"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
