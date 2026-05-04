"use client"
import { useState, useEffect } from "react";
import { User, Mail, Shield, Save, ArrowLeft, Camera, Fingerprint, Plus, Trash2, LayoutPanelLeft, Filter, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
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
  { value: "WARM_LEAD", label: "Warm Lead" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "BUDGET_LOW", label: "Budget Low" },
  { value: "NO_REQUIREMENT", label: "No Requirement" },
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
  status: string | null;
  subStatus: string | null;
  dealSizeMin: string | null;
  dealSizeMax: string | null;
  icon: string;
  color: string;
  orderIndex: number;
  createdBy?: { name: string };
}

export default function SettingsView() {
  const { user, checkUser } = useAuth();
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
    status: "",
    subStatus: "",
    dealSize: "",
    color: "blue",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  // Fetch sidebar filters
  useEffect(() => {
    if (user?.role === "ORG_ADMIN") {
      setFiltersLoading(true);
      fetch("/api/sidebar-filters")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setSidebarFilters(data);
        })
        .catch(console.error)
        .finally(() => setFiltersLoading(false));
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
          status: newFilter.status || null,
          subStatus: newFilter.subStatus || null,
          dealSizeMin,
          dealSizeMax,
          color: newFilter.color,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setSidebarFilters((prev) => [...prev, created]);
        setNewFilter({ name: "", status: "", subStatus: "", dealSize: "", color: "blue" });
        setShowAddForm(false);
        toast.success(`"${created.name}" added to sidebar`);
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
      } else {
        toast.error("Failed to delete filter");
      }
    } catch {
      toast.error("Failed to delete filter");
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
          {user?.role === "ORG_ADMIN" && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="p-8 sm:p-10 border-b border-slate-50 bg-slate-50/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <LayoutPanelLeft size={14} className="text-purple-600" />
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Sidebar Customization</h3>
                      <span className="inline-block mt-1 text-[8px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-md uppercase tracking-widest">CEO Protocol</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95 ${
                      showAddForm
                        ? "bg-slate-100 text-slate-600 border border-slate-200"
                        : "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    }`}
                  >
                    {showAddForm ? <X size={12} /> : <Plus size={12} />}
                    {showAddForm ? "Cancel" : "Add Filter"}
                  </button>
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

                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                        <select
                          value={newFilter.status}
                          onChange={(e) => setNewFilter({ ...newFilter, status: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Sub-status */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sub-status</label>
                        <select
                          value={newFilter.subStatus}
                          onChange={(e) => setNewFilter({ ...newFilter, subStatus: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                        >
                          {SUB_STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Deal Size */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal Size</label>
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

                      {/* Color Picker */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accent Color</label>
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
                    </div>

                    <button
                      type="button"
                      onClick={handleAddFilter}
                      disabled={saving || !newFilter.name.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                      {saving ? "Creating..." : "Create Sidebar Filter"}
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
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {f.status && (
                                <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {getStatusLabel(f.status)}
                                </span>
                              )}
                              {f.subStatus && (
                                <span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {getSubStatusLabel(f.subStatus)}
                                </span>
                              )}
                              {(f.dealSizeMin || f.dealSizeMax) && (
                                <span className="text-[9px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {getDealSizeLabel(f.dealSizeMin, f.dealSizeMax)}
                                </span>
                              )}
                              {!f.status && !f.subStatus && !f.dealSizeMin && !f.dealSizeMax && (
                                <span className="text-[9px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  All Leads
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteFilter(f.id, f.name)}
                          className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
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
