"use client"
import { useState, useEffect } from "react";
import { User, Mail, Shield, Save, ArrowLeft, Camera, Fingerprint, Plus, Trash2, LayoutPanelLeft, Filter, X, Settings2, Activity, ArrowUp, ArrowDown, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import toast from "react-hot-toast";
import { useTablePreferences, ColumnId } from "@/hooks/useTablePreferences";

const STATUS_OPTIONS = [
  { value: "", label: "Any Status" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "COLD_CHATTING", label: "Cold Chatting" },
  { value: "MEETING_SET", label: "Meeting Set" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
];

const ALL_COLUMNS: Record<ColumnId, { label: string; desc: string; isBase: boolean }> = {
  lead: { label: 'Lead / Contact Name', desc: 'Main contact info', isBase: true },
  company: { label: 'Company', desc: 'Company name', isBase: true },
  industry: { label: 'Industry', desc: 'Sector', isBase: true },
  stage: { label: 'Status (Stage)', desc: 'Pipeline stage', isBase: true },
  subStatus: { label: 'Substatus', desc: 'Detailed status', isBase: true },
  city: { label: 'City', desc: 'Lead\'s city', isBase: false },
  state: { label: 'State', desc: 'Lead\'s state', isBase: false },
  phone: { label: 'Phone / Email', desc: 'Contact details', isBase: true },
  source: { label: 'Source', desc: 'Lead origin', isBase: true },
  owner: { label: 'Owner', desc: 'Assigned user', isBase: true },
  createdAt: { label: 'Created On', desc: 'Date added', isBase: false },
  dealValueInr: { label: 'Deal Value', desc: 'Deal size (INR)', isBase: false },
  followUpAt: { label: 'Follow-Up Date', desc: 'Next follow-up', isBase: false },
};

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
  ownerId?: string | null;
  owner?: { name: string } | null;
}

export default function SettingsView() {
  const { user, checkUser } = useAuth();
  const { triggerRefresh } = useDashboard();
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'sidebar' | 'pipeline' | 'table'>('profile');
  const { columnPreferences, updateColumnPreferences, isLoaded: tablePrefsLoaded } = useTablePreferences();
  const [localColumnPreferences, setLocalColumnPreferences] = useState(columnPreferences);

  useEffect(() => {
    setLocalColumnPreferences(columnPreferences);
  }, [columnPreferences]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...localColumnPreferences.columnOrder];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setLocalColumnPreferences(prev => ({ ...prev, columnOrder: newOrder }));
  };

  const handleMoveDown = (index: number) => {
    if (index === localColumnPreferences.columnOrder.length - 1) return;
    const newOrder = [...localColumnPreferences.columnOrder];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setLocalColumnPreferences(prev => ({ ...prev, columnOrder: newOrder }));
  };

  const handleToggleVisibility = (colId: ColumnId, checked: boolean) => {
    switch (colId) {
      case 'city': setLocalColumnPreferences(prev => ({ ...prev, showCity: checked })); break;
      case 'state': setLocalColumnPreferences(prev => ({ ...prev, showState: checked })); break;
      case 'createdAt': setLocalColumnPreferences(prev => ({ ...prev, showCreatedOn: checked })); break;
      case 'dealValueInr': setLocalColumnPreferences(prev => ({ ...prev, showDealValue: checked })); break;
      case 'followUpAt': setLocalColumnPreferences(prev => ({ ...prev, showFollowUp: checked })); break;
    }
  };

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
    ownerId: "",
  });
  const [industries, setIndustries] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Pipeline customization state
  const [pipelineStatuses, setPipelineStatuses] = useState<any[]>([]);
  const [pipelineSubStatuses, setPipelineSubStatuses] = useState<any[]>([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [activePipelineTab, setActivePipelineTab] = useState<'status' | 'substatus'>('status');
  const [showAddPipelineForm, setShowAddPipelineForm] = useState(false);
  const [newPipelineItem, setNewPipelineItem] = useState({ value: "", label: "", color: "blue" });
  const [pipelineSaving, setPipelineSaving] = useState(false);

  // High-fidelity delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "filter" | "pipeline";
    id: string;
    label: string;
  }>({
    isOpen: false,
    type: "filter",
    id: "",
    label: "",
  });

  const fetchPipelineData = async () => {
    setPipelineLoading(true);
    try {
      const res = await fetch("/api/settings/pipeline");
      if (res.ok) {
        const data = await res.json();
        setPipelineStatuses(data.statuses || []);
        setPipelineSubStatuses(data.subStatuses || []);
      }
    } catch (err) {
      console.error("Failed to load custom statuses", err);
    } finally {
      setPipelineLoading(false);
    }
  };

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

      fetchPipelineData();

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

      // Fetch team members if user is an admin
      if (user.role === "CEO" || user.role === "ORG_ADMIN") {
        fetch("/api/team")
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data)) setTeamMembers(data);
          })
          .catch(console.error);
      }
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
          ownerId: newFilter.ownerId || null,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setSidebarFilters((prev) => [...prev, created]);
        setNewFilter({ name: "", statuses: [], subStatuses: [], industries: [], sources: [], dealSize: "", alphabet: "", color: "blue", ownerId: "" });
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

  const handleAddPipelineItem = async () => {
    if (!newPipelineItem.value.trim() || !newPipelineItem.label.trim()) {
      toast.error("Both internal code and display label are required");
      return;
    }
    setPipelineSaving(true);
    try {
      const res = await fetch("/api/settings/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activePipelineTab,
          value: newPipelineItem.value.trim().toUpperCase(),
          label: newPipelineItem.label.trim(),
          color: newPipelineItem.color,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        if (activePipelineTab === "status") {
          setPipelineStatuses((prev) => [...prev, created]);
        } else {
          setPipelineSubStatuses((prev) => [...prev, created]);
        }
        setNewPipelineItem({ value: "", label: "", color: "blue" });
        setShowAddPipelineForm(false);
        toast.success(`"${created.label}" added to pipeline configuration`);
        triggerRefresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add pipeline option");
      }
    } catch {
      toast.error("Network or server synchronization error");
    } finally {
      setPipelineSaving(false);
    }
  };

  const handleTogglePipelineItem = async (id: string, isEnabled: boolean, currentLabel: string) => {
    try {
      const res = await fetch("/api/settings/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activePipelineTab,
          id,
          isEnabled,
        }),
      });

      if (res.ok) {
        toast.success(`"${currentLabel}" ${isEnabled ? "enabled" : "disabled"}`);
        fetchPipelineData();
        triggerRefresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update option status");
      }
    } catch {
      toast.error("Failed to sync option state with server");
    }
  };

  const handleReorderPipelineItem = async (index: number, direction: 'up' | 'down') => {
    const list = activePipelineTab === "status" ? [...pipelineStatuses] : [...pipelineSubStatuses];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= list.length) return;

    const tempIndex = list[index].orderIndex;
    list[index].orderIndex = list[targetIndex].orderIndex;
    list[targetIndex].orderIndex = tempIndex;

    try {
      await Promise.all([
        fetch("/api/settings/pipeline", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: activePipelineTab, id: list[index].id, orderIndex: list[index].orderIndex }),
        }),
        fetch("/api/settings/pipeline", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: activePipelineTab, id: list[targetIndex].id, orderIndex: list[targetIndex].orderIndex }),
        })
      ]);
      toast.success("Order index updated");
      fetchPipelineData();
      triggerRefresh();
    } catch {
      toast.error("Failed to save new order priority");
    }
  };

  const handleDeletePipelineItem = async (id: string, currentLabel: string) => {
    try {
      const res = await fetch(`/api/settings/pipeline?type=${activePipelineTab}&id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`"${currentLabel}" permanently deleted`);
        fetchPipelineData();
        triggerRefresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete pipeline option");
      }
    } catch {
      toast.error("Failed to delete option due to network error");
    }
  };

  const triggerDeleteFilter = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: "filter",
      id,
      label: name,
    });
  };

  const triggerDeletePipelineItem = (id: string, label: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: "pipeline",
      id,
      label,
    });
  };

  const handleConfirmDelete = async () => {
    const { type, id, label } = deleteConfirm;
    setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
    if (type === "filter") {
      await handleDeleteFilter(id, label);
    } else {
      await handleDeletePipelineItem(id, label);
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
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Banner and Navigation */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50/80 rounded-full border border-indigo-100/50 mb-3 w-fit">
            ⚙️ SYSTEM SETTINGS V2
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Configuration Console</h1>
          <p className="text-sm text-slate-500 mt-1">Manage user identity, customize sidebar shortcuts, and define lead workflow rules.</p>
        </div>
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all duration-300"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1.5 transition-transform duration-300" /> Back to Dashboard
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar & Short Specs Profile */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col space-y-6 shadow-xl shadow-slate-200/40">
            {/* User profile avatar section */}
            <div className="flex flex-col items-center text-center p-4 rounded-3xl bg-slate-50/40 border border-slate-50 relative group">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-200 relative z-10 group-hover:scale-105 transition-transform duration-300">
                  {user?.initials}
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[1.3rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                <button className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-xl border-4 border-white shadow-lg transform translate-x-1/4 translate-y-1/4 hover:scale-110 active:scale-95 transition-all duration-300 z-20">
                  <Camera size={14} />
                </button>
              </div>

              <div className="mt-5">
                <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                <span className="inline-block text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md mt-1">
                  {user?.role.replace("ORG_", "").replace("_", " ")}
                </span>
              </div>

              <div className="w-full h-px bg-slate-100 my-5" />

              {/* Mini details list */}
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-left p-3.5 bg-white rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ACCESS CREDENTIALS</p>
                    <p className="text-xs font-bold text-slate-700">#{user?.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <Fingerprint size={16} className="text-indigo-500/80" />
                </div>
              </div>
            </div>

            {/* Navigation Tabs Menu */}
            <nav className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-left transition-all duration-300 ${activeTab === "profile"
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
              >
                <User size={16} />
                <span>Identity & Profile</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => setActiveTab("sidebar")}
                  className={`flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-left transition-all duration-300 ${activeTab === "sidebar"
                      ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                >
                  <LayoutPanelLeft size={16} />
                  <span>Sidebar Shortcuts</span>
                </button>
              )}

              {user && (user.role === "CEO" || user.role === "ORG_ADMIN") && (
                <button
                  type="button"
                  onClick={() => setActiveTab("pipeline")}
                  className={`flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-left transition-all duration-300 ${activeTab === "pipeline"
                      ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                >
                  <Layers size={16} />
                  <span>Lead Pipeline Stages</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("table")}
                className={`flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-left transition-all duration-300 ${activeTab === "table"
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
              >
                <Settings2 size={16} />
                <span>Table Configuration</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content Pane of Selected Tab */}
        <div className="lg:col-span-8">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-850">Identity & Account Settings</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Manage your personal credentials</p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Legal Name</label>
                    <div className="relative group">
                      <User size={15} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-300" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full pl-13 pr-6 py-4.5 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all duration-300"
                        placeholder="Full Legal Name"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 px-1 italic">This name is visible to all members inside your active organization.</p>
                  </div>

                  {/* Primary Email */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Email Address</label>
                    <div className="relative group">
                      <Mail size={15} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-300" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-13 pr-6 py-4.5 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all duration-300"
                        placeholder="Primary Email Address"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 px-1">This email address will be utilized for critical notifications and authentication checks.</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-450 italic">Sync state updated: Just now</span>
                  <button
                    type="submit"
                    disabled={loading || (name === user?.name && email === user?.email)}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 active:scale-[0.97] transition-all duration-300 shadow-xl shadow-slate-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    <Save size={14} />
                    {loading ? "Synchronizing..." : "Update Identity"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SIDEBAR SHORTCUTS TAB */}
          {activeTab === "sidebar" && user && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                    <LayoutPanelLeft size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-850">Sidebar Protocols</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Customize global organization shortcuts</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all duration-300 active:scale-95 ${showAddForm
                      ? "bg-slate-100 text-slate-600 border border-slate-200/60"
                      : "bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800"
                    }`}
                >
                  {showAddForm ? <X size={12} /> : <Plus size={12} />}
                  {showAddForm ? "Cancel" : "Add Shortcut"}
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-8 bg-slate-50 rounded-2xl p-4.5 border border-slate-100">
                Setup high-priority database filters that appear natively inside the Sidebar of all <span className="font-bold text-slate-700">Supervisors</span> and <span className="font-bold text-slate-700">Sales Reps</span> in the organization.
              </p>

              {/* Add New Filter Accordion Form */}
              {showAddForm && (
                <div className="bg-slate-50/60 rounded-3xl border border-slate-200/40 p-6 mb-8 animate-in slide-in-from-top-3 fade-in duration-300 space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">NEW SHORTCUT PROTOCOL</h4>

                  <div className="space-y-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Shortcut Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Big Hot Deals, Active Leads"
                        value={newFilter.name}
                        onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500 transition-all duration-300"
                      />
                    </div>

                    {/* Status Selectors */}
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Status Blockers (Multiple)</label>
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
                              className={`px-4 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border transition-all duration-300 active:scale-95 ${isSelected
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                                  : "bg-white text-slate-500 border-slate-200/80 hover:bg-slate-100"
                                }`}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sub-status Selectors */}
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sub-status Blockers (Multiple)</label>
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
                              className={`px-4 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border transition-all duration-300 active:scale-95 ${isSelected
                                  ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100"
                                  : "bg-white text-slate-500 border-slate-200/80 hover:bg-slate-100"
                                }`}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Industries Selectors */}
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Industries (Multiple)</label>
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
                              className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all duration-300 active:scale-95 ${isSelected
                                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100"
                                  : "bg-white text-slate-500 border-slate-200/80 hover:bg-slate-100"
                                }`}
                            >
                              {ind}
                            </button>
                          );
                        })}
                        {industries.length === 0 && <p className="text-[10px] text-slate-400 italic py-1">No industries captured inside database yet.</p>}
                      </div>
                    </div>

                    {/* Sources Selectors */}
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sources (Multiple)</label>
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
                              className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all duration-300 active:scale-95 ${isSelected
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                                  : "bg-white text-slate-500 border-slate-200/80 hover:bg-slate-100"
                                }`}
                            >
                              {src}
                            </button>
                          );
                        })}
                        {sources.length === 0 && <p className="text-[10px] text-slate-400 italic py-1">No sources captured inside database yet.</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Deal Size Range */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Deal Size Range</label>
                        <div className="relative">
                          <select
                            value={newFilter.dealSize}
                            onChange={(e) => setNewFilter({ ...newFilter, dealSize: e.target.value })}
                            className="w-full px-5 py-4.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500 transition-all duration-300 cursor-pointer appearance-none"
                          >
                            {DEAL_SIZE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4.5 text-slate-400">
                            ▼
                          </div>
                        </div>
                      </div>

                      {/* Lead Owner Select Dropdown - CEO/ORG_ADMIN only */}
                      {(user.role === "CEO" || user.role === "ORG_ADMIN") && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lead Owner</label>
                          <div className="relative">
                            <select
                              value={newFilter.ownerId}
                              onChange={(e) => setNewFilter({ ...newFilter, ownerId: e.target.value })}
                              className="w-full px-5 py-4.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500 transition-all duration-300 cursor-pointer appearance-none"
                            >
                              <option value="">Any Owner (No constraint)</option>
                              {teamMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name} ({member.role.replace("ORG_", "").replace("_", " ")})
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4.5 text-slate-400">
                              ▼
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Accent Color */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Accent Protocol Color</label>
                        <div className="flex items-center gap-2.5 py-3.5">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setNewFilter({ ...newFilter, color: c.value })}
                              className={`w-7.5 h-7.5 rounded-full ${c.bg} transition-all duration-300 flex items-center justify-center ${newFilter.color === c.value
                                  ? "ring-4 ring-offset-2 ring-slate-900 scale-110"
                                  : "opacity-60 hover:opacity-100 hover:scale-105"
                                }`}
                            >
                              {newFilter.color === c.value && (
                                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md animate-ping" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Alphabet Switch */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alphabetical Range Lock (Lead Contact)</label>
                      <div className="flex flex-wrap gap-1 mt-1 bg-white p-3 rounded-2xl border border-slate-200/70">
                        {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map(char => (
                          <button
                            key={char}
                            type="button"
                            onClick={() => setNewFilter({ ...newFilter, alphabet: newFilter.alphabet === char ? "" : char })}
                            className={`w-7.5 h-7.5 flex items-center justify-center rounded-xl text-[10.5px] font-extrabold border transition-all duration-300 ${newFilter.alphabet === char
                                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                : "bg-white text-slate-500 border-slate-100 hover:border-slate-350 hover:bg-slate-50"
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
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all duration-300 active:scale-[0.98] shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} />
                    {saving ? "Initiating Shortcut Protocol..." : "Activate Global Shortcut"}
                  </button>
                </div>
              )}

              {/* Existing Shortcuts List */}
              {filtersLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gathering Active Protocols...</p>
                </div>
              ) : sidebarFilters.length === 0 ? (
                <div className="text-center py-14 bg-slate-50/40 rounded-3xl border border-dashed border-slate-200">
                  <LayoutPanelLeft size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">No Custom Sidebar Shortcuts</p>
                  <p className="text-xs text-slate-400 mt-1">Configure database filters above to display custom shortcuts on all teammate screens.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sidebarFilters.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-4.5 bg-white rounded-3xl border border-slate-100 hover:border-slate-200/80 hover:shadow-lg hover:shadow-slate-100/40 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-2xl ${getColorClass(f.color)} text-white flex items-center justify-center shadow-lg`}>
                          <Filter size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{f.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {f.statuses && f.statuses.length > 0 && (
                              <div className="flex items-center gap-1">
                                {f.statuses.map(s => (
                                  <span key={s} className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100 uppercase tracking-widest">
                                    {getStatusLabel(s)}
                                  </span>
                                ))}
                              </div>
                            )}
                            {f.subStatuses && f.subStatuses.length > 0 && (
                              <div className="flex items-center gap-1">
                                {f.subStatuses.map(ss => (
                                  <span key={ss} className="text-[8px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg border border-purple-100 uppercase tracking-widest">
                                    {getSubStatusLabel(ss)}
                                  </span>
                                ))}
                              </div>
                            )}
                            {(f.dealSizeMin || f.dealSizeMax) && (
                              <span className="text-[8px] font-black bg-green-50 text-green-600 px-2 py-0.5 rounded-lg border border-green-100 uppercase tracking-widest">
                                {getDealSizeLabel(f.dealSizeMin, f.dealSizeMax)}
                              </span>
                            )}
                            {f.industries && f.industries.length > 0 && (
                              <div className="flex items-center gap-1">
                                {f.industries.map(ind => (
                                  <span key={ind} className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-100 uppercase tracking-widest">
                                    {ind}
                                  </span>
                                ))}
                              </div>
                            )}
                             {f.alphabet && (
                              <span className="text-[8px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg border border-rose-100 uppercase tracking-widest">
                                {f.alphabet}*
                              </span>
                            )}
                            {f.sources && f.sources.length > 0 && (
                              <div className="flex items-center gap-1">
                                {f.sources.map(src => (
                                  <span key={src} className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-widest">
                                    {src}
                                  </span>
                                ))}
                              </div>
                            )}
                            {f.owner && (
                              <span className="text-[8px] font-black bg-teal-50 text-teal-600 px-2 py-0.5 rounded-lg border border-teal-100 uppercase tracking-widest">
                                Owner: {f.owner.name}
                              </span>
                            )}
                            {!f.statuses?.length && !f.subStatuses?.length && !f.dealSizeMin && !f.dealSizeMax && !f.industries?.length && !f.alphabet && !f.sources?.length && !f.ownerId && (
                              <span className="text-[8px] font-black bg-slate-50 text-slate-450 px-2 py-0.5 rounded-lg border border-slate-100 uppercase tracking-widest">
                                Open Access Filter
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => triggerDeleteFilter(f.id, f.name)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 active:scale-90"
                        title="Remove Filter Shortcut"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC PIPELINE TAB */}
          {activeTab === "pipeline" && user && (user.role === "CEO" || user.role === "ORG_ADMIN") && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-850">Pipeline Architecture</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Customize lead status phases</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddPipelineForm(!showAddPipelineForm);
                    setNewPipelineItem({ value: "", label: "", color: "blue" });
                  }}
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all duration-300 active:scale-95 ${showAddPipelineForm
                      ? "bg-slate-100 text-slate-600 border border-slate-200/60"
                      : "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                    }`}
                >
                  {showAddPipelineForm ? <X size={12} /> : <Plus size={12} />}
                  {showAddPipelineForm ? "Cancel" : "Add Custom Stage"}
                </button>
              </div>

              {/* Tab Selector Switcher */}
              <div className="flex bg-slate-100/60 p-1.5 rounded-2xl mb-8 max-w-xs border border-slate-200/20">
                <button
                  type="button"
                  onClick={() => {
                    setActivePipelineTab("status");
                    setShowAddPipelineForm(false);
                  }}
                  className={`flex-1 text-center py-2.5 text-[9px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-300 ${activePipelineTab === "status"
                      ? "bg-white text-indigo-600 shadow-md shadow-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  Primary Phases
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePipelineTab("substatus");
                    setShowAddPipelineForm(false);
                  }}
                  className={`flex-1 text-center py-2.5 text-[9px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-300 ${activePipelineTab === "substatus"
                      ? "bg-white text-indigo-600 shadow-md shadow-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  Sub-statuses
                </button>
              </div>

              {/* Add Custom Stage Form Accordion */}
              {showAddPipelineForm && (
                <div className="mb-8 p-6 bg-slate-50/60 rounded-3xl border border-slate-250/20 space-y-5 animate-in fade-in slide-in-from-top-3 duration-300">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    ADD CUSTOM {activePipelineTab === "status" ? "PRIMARY STATUS" : "SUB-STATUS"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                        System Identifier Code (Uppercase)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MEETING_SET, ON_HOLD"
                        value={newPipelineItem.value}
                        onChange={(e) =>
                          setNewPipelineItem((prev) => ({
                            ...prev,
                            value: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                          }))
                        }
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      />
                      <p className="text-[9px] text-slate-400 px-1">Unique database identifier token (e.g. WON, CHATTING).</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                        Friendly Layout Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Meeting Set, Warm Lead"
                        value={newPipelineItem.label}
                        onChange={(e) =>
                          setNewPipelineItem((prev) => ({
                            ...prev,
                            label: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      />
                      <p className="text-[9px] text-slate-400 px-1">Readable tag visible to sales representatives.</p>
                    </div>
                  </div>

                  {/* Theme Accent Color */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                      Accent Color Theme
                    </label>
                    <div className="flex flex-wrap gap-2 bg-white p-3 rounded-2xl border border-slate-200/70">
                      {["blue", "cyan", "purple", "indigo", "pink", "rose", "amber", "orange", "red", "green", "slate"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewPipelineItem((prev) => ({ ...prev, color: c }))}
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${newPipelineItem.color === c ? "border-slate-800 scale-110 shadow-lg shadow-slate-200" : "border-slate-200 hover:scale-105"
                            }`}
                          style={{
                            backgroundColor:
                              c === "blue" ? "#3b82f6" :
                                c === "cyan" ? "#06b6d4" :
                                  c === "purple" ? "#a855f7" :
                                    c === "indigo" ? "#6366f1" :
                                      c === "pink" ? "#ec4899" :
                                        c === "rose" ? "#f43f5e" :
                                          c === "amber" ? "#f59e0b" :
                                            c === "orange" ? "#f97316" :
                                              c === "red" ? "#ef4444" :
                                                c === "green" ? "#22c55e" :
                                                  "#64748b",
                          }}
                        >
                          {newPipelineItem.color === c && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md animate-scale" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddPipelineItem}
                      disabled={pipelineSaving}
                      className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all duration-300 disabled:opacity-50"
                    >
                      {pipelineSaving ? "Activating Stage..." : `Create Custom ${activePipelineTab === "status" ? "Status" : "Sub-status"}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Pipeline Options list */}
              {pipelineLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-7 h-7 border-3 border-indigo-650 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuring pipelines on database...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(activePipelineTab === "status" ? pipelineStatuses : pipelineSubStatuses).length === 0 ? (
                    <div className="text-center py-14 bg-slate-50/40 rounded-3xl border border-dashed border-slate-200">
                      <Activity className="mx-auto text-slate-350 mb-3 animate-pulse" size={28} />
                      <p className="text-sm font-bold text-slate-700">No active custom pipeline filters detected</p>
                      <p className="text-xs text-slate-400 mt-1">Deploy new custom pipeline statuses using the action button above.</p>
                    </div>
                  ) : (
                    (activePipelineTab === "status" ? pipelineStatuses : pipelineSubStatuses).map((item, index, arr) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4.5 pl-6 bg-white rounded-3xl border border-y border-r border-slate-100 hover:border-slate-250/60 hover:shadow-lg hover:shadow-slate-100/40 transition-all duration-300"
                        style={{
                          borderLeftWidth: "6px",
                          borderLeftColor:
                            item.color === "blue" ? "#3b82f6" :
                              item.color === "cyan" ? "#06b6d4" :
                                item.color === "purple" ? "#a855f7" :
                                  item.color === "indigo" ? "#6366f1" :
                                    item.color === "pink" ? "#ec4899" :
                                      item.color === "rose" ? "#f43f5e" :
                                        item.color === "amber" ? "#f59e0b" :
                                          item.color === "orange" ? "#f97316" :
                                            item.color === "red" ? "#ef4444" :
                                              item.color === "green" ? "#22c55e" :
                                                "#64748b",
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm font-extrabold text-slate-800">{item.label}</span>
                              <span className="text-[9px] font-black bg-slate-100/70 text-slate-500 px-2 py-0.5 rounded-lg uppercase tracking-wide border border-slate-200/40">
                                {item.value}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-extrabold mt-1.5 uppercase tracking-wider">
                              PRIORITY SORT INDEX: {item.orderIndex}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Ordering priority arrow controls */}
                          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200/50">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleReorderPipelineItem(index, "up")}
                              className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                              title="Raise Priority Index"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={index === arr.length - 1}
                              onClick={() => handleReorderPipelineItem(index, "down")}
                              className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                              title="Lower Priority Index"
                            >
                              <ArrowDown size={13} />
                            </button>
                          </div>

                          {/* Visbility switch badge toggle */}
                          <button
                            type="button"
                            onClick={() => handleTogglePipelineItem(item.id, !item.isEnabled, item.label)}
                            className={`text-[9px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl border transition-all duration-300 ${item.isEnabled
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100/80 hover:bg-emerald-100"
                                : "bg-slate-50 text-slate-400 border-slate-200/60 hover:bg-slate-100"
                              }`}
                          >
                            {item.isEnabled ? "Active" : "Disabled"}
                          </button>

                          {/* Delete Stage Trigger */}
                          <button
                            type="button"
                            onClick={() => triggerDeletePipelineItem(item.id, item.label)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300"
                            title="Delete pipeline option"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TABLE TAB */}
          {activeTab === "table" && tablePrefsLoaded && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                  <Settings2 size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-850">Table Columns Setup</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Customize columns and their order</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-widest">Column Order & Visibility</h4>
                  <p className="text-xs text-slate-500 mb-4 font-medium">Toggle optional columns and use the arrows to reorder them in the table.</p>

                  <div className="space-y-2">
                    {localColumnPreferences.columnOrder.map((colId, index) => {
                      const colDef = ALL_COLUMNS[colId];
                      if (!colDef) return null;

                      let isChecked = true;
                      if (!colDef.isBase) {
                        switch (colId) {
                          case 'city': isChecked = localColumnPreferences.showCity; break;
                          case 'state': isChecked = localColumnPreferences.showState; break;
                          case 'createdAt': isChecked = localColumnPreferences.showCreatedOn; break;
                          case 'dealValueInr': isChecked = localColumnPreferences.showDealValue; break;
                          case 'followUpAt': isChecked = localColumnPreferences.showFollowUp; break;
                        }
                      }

                      return (
                        <div key={colId} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                              >
                                <ArrowUp size={14} strokeWidth={3} />
                              </button>
                              <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === localColumnPreferences.columnOrder.length - 1}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                              >
                                <ArrowDown size={14} strokeWidth={3} />
                              </button>
                            </div>
                            <div className="space-y-0.5">
                              <span className="block text-sm font-black text-slate-800">{colDef.label} {colDef.isBase && <span className="ml-1 text-[10px] uppercase text-blue-500 tracking-wider font-bold bg-blue-50 px-1.5 py-0.5 rounded">Base</span>}</span>
                              <span className="block text-xs text-slate-500 font-medium">{colDef.desc}</span>
                            </div>
                          </div>

                          <label className={`flex items-center cursor-pointer ${colDef.isBase ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => !colDef.isBase && handleToggleVisibility(colId, e.target.checked)}
                              disabled={colDef.isBase}
                              className={`w-5 h-5 accent-blue-600 rounded ${colDef.isBase ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        updateColumnPreferences(localColumnPreferences);
                        toast.success("Table preferences saved successfully");
                      }}
                      className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all duration-300 shadow-lg shadow-indigo-100"
                    >
                      Save Table Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Elegant Glassmorphic Confirm Deletion Dialogue Popup Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] max-w-md w-full shadow-2xl p-6 md:p-8 space-y-6 transform animate-in zoom-in-95 duration-350">
            <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-4.5 rounded-2xl w-fit">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Confirm Deletion</h3>
                <p className="text-xs text-rose-500 font-bold uppercase tracking-wider mt-0.5">Permanent Database Action</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you absolutely certain you want to permanently delete the stage <span className="font-bold text-slate-900">"{deleteConfirm.label}"</span>?
              </p>
              {deleteConfirm.type === "pipeline" && (
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  Note: The server will verify if any active leads are currently occupying this pipeline phase before executing the request.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors"
                style={{ color: '#475569' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-5 py-4 rounded-2xl bg-rose-650 hover:bg-rose-700 !text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-250 active:scale-[0.98] transition-all"
                style={{ color: '#ffffff', backgroundColor: '#e11d48' }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
