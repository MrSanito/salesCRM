"use client"
import { Users2, Mail, UserPlus, Phone, ShieldCheck, GitGraph, LayoutGrid, ChevronRight, UserCircle2, ArrowRight, Award, ShieldAlert, ArrowDown, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AddEmployeeModal from "./AddEmployeeModal";
import ManageUserModal from "./ManageUserModal";
import { useAuth } from "@/components/auth/AuthContext";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
  managerId: string | null;
  _count?: {
    ownedLeads: number;
  };
}

interface TeamViewProps {
  defaultView?: "grid" | "graph";
}

export default function TeamView({ defaultView = "graph" }: TeamViewProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<"grid" | "graph">(defaultView);
  const [addingSubTo, setAddingSubTo] = useState<{ id: string, name: string } | null>(null);
  const [managingMemberId, setManagingMemberId] = useState<string | null>(null);

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      } else {
        toast.error("Failed to load team data");
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "CEO": return "CEO";
      case "ORG_ADMIN": return "Org Admin";
      case "MANAGER": return "Supervisor";
      case "SALES_REP": return "Specialist";
      case "LEAD": return "Team Lead";
      default: return r;
    }
  };

  const renderGraph = () => {
    // 1. Classify members into levels
    const roots = members.filter(m => m.role === "CEO" || m.role === "ORG_ADMIN" || !m.managerId);
    const managers = members.filter(m => m.role === "MANAGER" && !roots.some(r => r.id === m.id));
    const individualReps = members.filter(m => !roots.some(r => r.id === m.id) && !managers.some(mgr => mgr.id === m.id));

    if (members.length === 0) {
      return (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
           <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6 border border-slate-100">
             <GitGraph size={40} />
           </div>
           <h2 className="text-xl font-bold text-slate-800">No Hierarchy Defined</h2>
           <p className="text-slate-400 text-sm mt-2">Designate supervisors to generate the organizational structure.</p>
        </div>
      );
    }

    return (
      <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 sm:p-12 min-h-[700px] overflow-x-auto flex flex-col items-center">
        {/* NETWORK TREE WORKSPACE */}
        <div className="flex flex-col items-center min-w-max pb-12 w-full space-y-12">
          
          {/* LEVEL 1: EXECUTIVE COMMAND tier */}
          <div className="flex flex-col items-center space-y-4 w-full">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Executive Board & Owners</span>
            
            <div className="relative p-6 bg-slate-900 rounded-[3rem] border border-slate-800 flex gap-8 items-center justify-center shadow-2xl">
              {/* Outer Glowing Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-600 to-blue-600 rounded-[3rem] blur-lg opacity-25" />
              
              {roots.map(root => (
                <div 
                  key={root.id} 
                  onClick={() => setManagingMemberId(root.id)}
                  className="relative z-10 p-5 bg-white/5 border border-white/10 rounded-2xl w-64 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group hover:-translate-y-0.5 active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                      {root.initials}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="font-extrabold text-white text-xs truncate">{root.name}</h4>
                      <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider mt-0.5">{getRoleLabel(root.role)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-white/50">
                    <span>Leads Managed: {root._count?.ownedLeads || 0}</span>
                    <span className="text-amber-400 group-hover:translate-x-1 transition-transform">Configure ⚡</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DUAL CONNECTOR GRAPHICS */}
          {managers.length > 0 && (
            <div className="w-full max-w-4xl relative h-16 flex flex-col items-center justify-center">
              {/* Converging Vertical Lines */}
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300 -translate-x-1/2" />
              
              {roots.length >= 2 && (
                <div className="absolute top-0 w-3/4 h-[2px] bg-slate-300 rounded-full" />
              )}
              
              {/* Converging node label indicator */}
              <div className="relative bg-blue-50 border border-blue-100 rounded-full px-4 py-1 flex items-center gap-1.5 z-10 shadow-sm">
                <ShieldCheck size={10} className="text-blue-600 animate-pulse" />
                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Shared Corporate Direction Channel</span>
              </div>

              {managers.length >= 2 && (
                <div className="absolute bottom-0 w-3/4 h-[2px] bg-slate-300 rounded-full" />
              )}
            </div>
          )}

          {/* LEVEL 2: MANAGEMENT & SUPERVISOR TIER */}
          {managers.length > 0 && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Supervisors (Directly Managed by All Admins)</span>
              
              <div className="flex gap-12 items-start justify-center">
                {managers.map(mgr => {
                  const subordinates = individualReps.filter(rep => rep.managerId === mgr.id);
                  
                  return (
                    <div key={mgr.id} className="flex flex-col items-center space-y-6">
                      {/* Manager Card */}
                      <div 
                        onClick={() => setManagingMemberId(mgr.id)}
                        className="p-5 bg-white border border-slate-200 rounded-[2rem] w-64 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer group hover:-translate-y-0.5 active:scale-95 text-center flex flex-col items-center relative"
                      >
                        {/* Upper Connector line */}
                        <div className="absolute -top-6 left-1/2 w-px h-6 bg-slate-300 -translate-x-1/2" />
                        
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-3">
                          {mgr.initials}
                        </div>
                        
                        <h4 className="font-extrabold text-slate-900 text-sm truncate w-full">{mgr.name}</h4>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full mt-1.5 inline-block">
                          {getRoleLabel(mgr.role)}
                        </span>
                        
                        <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span>Team Members: {subordinates.length}</span>
                          <span className="text-blue-600 group-hover:translate-x-1 transition-transform">Inspect 📈</span>
                        </div>

                        {/* Add employee directly under this manager */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddingSubTo({ id: mgr.id, name: mgr.name });
                          }}
                          className="mt-4 w-full py-2 bg-slate-900 text-white hover:bg-blue-600 transition-colors font-bold text-[9px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <UserPlus size={12} />
                          Add Subordinate
                        </button>
                      </div>

                      {/* Level 3: Representative Tier under this Manager */}
                      {subordinates.length > 0 && (
                        <div className="flex flex-col items-center w-full relative pt-6">
                          {/* Manager-Subordinate drop line */}
                          <div className="absolute top-0 left-1/2 w-px h-6 bg-slate-300 -translate-x-1/2" />
                          
                          <div className="flex gap-4 items-start justify-center">
                            {subordinates.map(rep => (
                              <div 
                                key={rep.id} 
                                onClick={() => setManagingMemberId(rep.id)}
                                className="p-4 bg-white border border-slate-100 rounded-2xl w-48 shadow-md hover:shadow-lg hover:border-emerald-400 transition-all cursor-pointer group text-center flex flex-col items-center relative hover:-translate-y-0.5 active:scale-95"
                              >
                                {/* Top vertical line to representative */}
                                <div className="absolute -top-6 left-1/2 w-px h-6 bg-slate-300 -translate-x-1/2" />
                                
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-extrabold text-sm flex items-center justify-center mb-2">
                                  {rep.initials}
                                </div>
                                <h5 className="font-extrabold text-slate-800 text-xs truncate w-full">{rep.name}</h5>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{getRoleLabel(rep.role)}</p>
                                
                                <div className="mt-3 pt-2.5 border-t border-slate-50 w-full text-[9px] font-bold text-slate-400 flex items-center justify-between">
                                  <span>Leads: {rep._count?.ownedLeads || 0}</span>
                                  <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">Edit ⚙️</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEVEL 3: DIRECT INDEPENDENT REPORTS (if any sales rep or team lead is not mapped to a supervisor) */}
          {individualReps.filter(rep => !rep.managerId || roots.some(r => r.id === rep.managerId)).length > 0 && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Direct Accounts & Specialists</span>
              <div className="flex gap-4 flex-wrap justify-center">
                {individualReps
                  .filter(rep => !rep.managerId || roots.some(r => r.id === rep.managerId))
                  .map(rep => (
                    <div 
                      key={rep.id} 
                      onClick={() => setManagingMemberId(rep.id)}
                      className="p-4 bg-white border border-slate-100 rounded-2xl w-52 shadow-md hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer group text-center flex flex-col items-center hover:-translate-y-0.5 active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-extrabold text-sm flex items-center justify-center mb-2">
                        {rep.initials}
                      </div>
                      <h5 className="font-extrabold text-slate-800 text-xs truncate w-full">{rep.name}</h5>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full mt-1.5 inline-block">
                        {getRoleLabel(rep.role)}
                      </span>
                      <div className="mt-3 pt-2.5 border-t border-slate-50 w-full text-[9px] font-bold text-slate-400 flex items-center justify-between">
                        <span>Leads: {rep._count?.ownedLeads || 0}</span>
                        <span className="text-blue-500">Edit Profile ⚡</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor, inspect, and configure access hierarchies live.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewType("grid")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewType === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              <LayoutGrid size={14} />
              Grid
            </button>
            <button 
              onClick={() => setViewType("graph")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewType === "graph" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              <GitGraph size={14} />
              Hierarchy
            </button>
          </div>

          {(user?.role === "MANAGER" || user?.role === "ORG_ADMIN" || user?.role === "CEO") && (
            <button 
              onClick={() => setAddingSubTo({ id: "", name: "" })} // General add
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
            >
              <UserPlus size={14} />
              Add Employee
            </button>
          )}
        </div>
      </header>

      {viewType === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group border-b-4 border-b-transparent hover:border-b-blue-500 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-xl font-black shadow-inner`}>
                    {member.initials}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    member.role === 'CEO' 
                      ? 'bg-amber-100 text-amber-800' 
                      : member.role === 'ORG_ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : member.role === 'MANAGER' 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'bg-slate-50 text-slate-500'
                  }`}>
                    {getRoleLabel(member.role)}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{member.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <ShieldCheck size={12} className="text-blue-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Active Access Protocol</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Leads</span>
                      <span className="text-lg font-black text-slate-900">{member._count?.ownedLeads || 0}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold truncate">{member.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setManagingMemberId(member.id)}
                className="w-full mt-6 py-3 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
              >
                Inspect & Manage
              </button>
            </div>
          ))}

          <button 
            onClick={() => setAddingSubTo({ id: "", name: "" })}
            className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all group min-h-[280px]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-all">
              <Users2 size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Provision Account</span>
          </button>
        </div>
      ) : (
        renderGraph()
      )}

      {addingSubTo && (
        <AddEmployeeModal 
          preselectedManagerId={addingSubTo.id}
          preselectedManagerName={addingSubTo.name}
          onClose={() => {
            setAddingSubTo(null);
            fetchTeam(); // Refresh after adding
          }}
        />
      )}

      {managingMemberId && (
        <ManageUserModal
          memberId={managingMemberId}
          onClose={() => setManagingMemberId(null)}
          onUpdate={fetchTeam}
        />
      )}
    </div>
  );
}
