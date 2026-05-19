"use client"
import { X, User, Mail, ShieldAlert, Award, Briefcase, ChevronDown, BarChart3, Coins, Users2, TrendingUp, PieChart, Layers, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthContext";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface ManageUserModalProps {
  memberId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ManageUserModal({ memberId, onClose, onUpdate }: ManageUserModalProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"edit" | "stats">("edit");
  
  // Edit state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SALES_REP");
  const [managerId, setManagerId] = useState("");
  const [managers, setManagers] = useState<TeamMember[]>([]);
  
  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Fetch users/managers lists and user stats
  useEffect(() => {
    const fetchManagersList = async () => {
      try {
        const res = await fetch("/api/team");
        if (res.ok) {
          const data: TeamMember[] = await res.json();
          // Filter to show possible managers (exclude this user themselves)
          const possibleManagers = data.filter(m => m.id !== memberId && (m.role === "MANAGER" || m.role === "ORG_ADMIN" || m.role === "CEO"));
          setManagers(possibleManagers);
        }
      } catch (err) {
        console.error("Failed to load managers");
      }
    };

    const fetchUserStats = async () => {
      setLoadingStats(true);
      try {
        const res = await fetch(`/api/team?userId=${memberId}`);
        if (res.ok) {
          const data = await res.json();
          setName(data.user.name);
          setEmail(data.user.email);
          setRole(data.user.role);
          setManagerId(data.user.managerId || "");
          setStats(data.stats);
        } else {
          toast.error("Failed to fetch user dossier");
        }
      } catch (err) {
        toast.error("Connection error");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchManagersList();
    fetchUserStats();
  }, [memberId]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: memberId,
          name,
          email,
          role,
          managerId
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("User access protocol updated!");
        onUpdate();
        onClose();
      } else {
        toast.error(data.error || "Update protocol failed");
      }
    } catch (err) {
      toast.error("Network sync failure");
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "CEO": return "Chief Executive Officer";
      case "ORG_ADMIN": return "Organization Admin";
      case "MANAGER": return "Team Supervisor";
      case "SALES_REP": return "Sales Specialist";
      case "LEAD": return "Team Lead";
      default: return r;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-2xl h-[85vh] rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.18)] border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users2 className="text-blue-600" size={20} />
              Manage Member Profile
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure access & inspect analytics</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Tabs Navigation */}
        <div className="flex bg-slate-50 border-b border-slate-100 px-8 py-2 flex-shrink-0 gap-4">
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "edit"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <ShieldAlert size={14} />
            Identity & Designation
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "stats"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <BarChart3 size={14} />
            Advanced Statistics
          </button>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {loadingStats ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing User Dossier...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Edit & Designation Form */}
              {activeTab === "edit" && (
                <form onSubmit={handleSaveChanges} className="space-y-6 max-w-lg mx-auto">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-400"><User size={18} /></span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Corporate Email</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-400"><Mail size={18} /></span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        placeholder="john@organization.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Designation Role</label>
                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none pr-10"
                      >
                        <option value="CEO">Chief Executive Officer (CEO)</option>
                        <option value="ORG_ADMIN">Organization Admin</option>
                        <option value="MANAGER">Supervisor / Team Leader</option>
                        <option value="SALES_REP">Sales Representative / Specialist</option>
                        <option value="LEAD">Team Lead / Account Manager</option>
                      </select>
                      <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Reporting Supervisor</label>
                    <div className="relative">
                      <select
                        value={managerId}
                        onChange={(e) => setManagerId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none pr-10"
                      >
                        <option value="">No Direct Manager (Top Level Owner)</option>
                        {managers.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({getRoleLabel(m.role)})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95" 
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={updating}
                      className="flex-1 py-4 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
                    >
                      {updating ? "Syncing..." : "Save Designation"}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Advanced Statistics View */}
              {activeTab === "stats" && stats && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Top summary cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Leads</p>
                        <p className="text-xl font-black text-slate-900">{stats.totalLeads}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Coins size={20} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Pipeline</p>
                        <p className="text-base font-black text-slate-900 truncate w-28">{formatCurrency(stats.totalValue)}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Avg Deal Size</p>
                        <p className="text-base font-black text-slate-900 truncate w-28">{formatCurrency(stats.avgValue)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Graph Data Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Stage breakdown */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-50">
                        <Layers size={14} className="text-blue-500" />
                        Stage Allocation
                      </h3>
                      {stats.stageBreakdown.length > 0 ? (
                        <div className="space-y-3">
                          {stats.stageBreakdown.map((item: any) => {
                            const percentage = stats.totalLeads > 0 ? Math.round((item.count / stats.totalLeads) * 100) : 0;
                            return (
                              <div key={item.stage} className="flex flex-col">
                                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                  <span className="text-slate-700">{item.stage}</span>
                                  <span className="text-slate-400 font-bold">{item.count} leads ({percentage}%)</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percentage}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold italic">No stage mapping telemetry</p>
                      )}
                    </div>

                    {/* Priority breakdown */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-50">
                        <PieChart size={14} className="text-emerald-500" />
                        Priority Distribution
                      </h3>
                      {stats.priorityBreakdown.length > 0 ? (
                        <div className="space-y-3">
                          {stats.priorityBreakdown.map((item: any) => {
                            const percentage = stats.totalLeads > 0 ? Math.round((item.count / stats.totalLeads) * 100) : 0;
                            return (
                              <div key={item.priority} className="flex flex-col">
                                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                  <span className="text-slate-700">{item.priority}</span>
                                  <span className="text-slate-400 font-bold">{item.count} leads ({percentage}%)</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${
                                    item.priority === 'HIGH' 
                                      ? 'bg-red-500' 
                                      : item.priority === 'MEDIUM' 
                                        ? 'bg-amber-500' 
                                        : 'bg-blue-500'
                                  }`} style={{ width: `${percentage}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold italic">No priority telemetry mapped</p>
                      )}
                    </div>
                  </div>

                  {/* User Activity Streams */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-50">
                      <Clock size={14} className="text-indigo-500" />
                      Recent Access & Activity Log
                    </h3>
                    {stats.recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {stats.recentActivity.map((log: any) => (
                          <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0 animate-pulse" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-700 leading-normal">{log.action}</p>
                              {log.field && (
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-tight">
                                  Field: {log.field} ({log.beforeValue || 'None'} → {log.afterValue || 'None'})
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(log.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-semibold italic">No recent logged protocol transactions</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
