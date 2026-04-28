"use client"
import { Users2, Mail, UserPlus, Phone, ShieldCheck, GitGraph, LayoutGrid, ChevronRight, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AddEmployeeModal from "./AddEmployeeModal";
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

  const renderMemberNode = (member: TeamMember, level: number = 0) => {
    const subordinates = members.filter(m => m.managerId === member.id);
    const isOrgAdmin = member.role === "ORG_ADMIN";
    const isManager = member.role === "MANAGER";
    
    // Mock lead activity for the "graph form" requirement
    const activityData = [40, 70, 45, 90, 65, 80, 50]; 

    return (
      <div key={member.id} className="flex flex-col items-center">
        {/* Node Card Container */}
        <div className="relative px-8">
          {/* Top Connector Line */}
          {level > 0 && (
            <div className="absolute -top-12 left-1/2 w-px h-12 bg-slate-200 -translate-x-1/2" />
          )}

          <div className="relative group">
            {/* Ambient Background Glow for Leaders */}
            {(isOrgAdmin || isManager) && (
              <div className={`absolute -inset-2 bg-gradient-to-r ${isOrgAdmin ? 'from-amber-400 to-orange-500' : 'from-blue-600 to-indigo-600'} rounded-[2rem] blur-xl opacity-0 group-hover:opacity-20 transition duration-1000`} />
            )}
            
            <div className={`relative z-10 p-5 rounded-[2rem] shadow-xl w-72 border transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl ${
              isOrgAdmin 
                ? 'bg-slate-900 text-white border-white/10' 
                : isManager 
                  ? 'bg-white border-slate-200 text-slate-900' 
                  : 'bg-slate-50/50 border-slate-100 text-slate-800'
            }`}>
              {/* Header: Avatar & Info */}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform transition-transform group-hover:rotate-3 ${
                  isOrgAdmin 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-orange-500/20' 
                    : isManager
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-white border border-slate-100 text-slate-600'
                }`}>
                  {member.initials}
                </div>
                <div className="text-left">
                  <h3 className={`font-bold text-sm truncate w-40 ${isOrgAdmin ? 'text-white' : 'text-slate-900'}`}>
                    {member.name}
                  </h3>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full inline-block ${
                    isOrgAdmin 
                      ? 'bg-amber-400/20 text-amber-400' 
                      : isManager 
                        ? 'bg-blue-600/10 text-blue-600' 
                        : 'bg-slate-200/50 text-slate-500'
                  }`}>
                    {isOrgAdmin ? 'Org Director' : isManager ? 'Team Leader' : 'Sales Representative'}
                  </p>
                </div>
              </div>

              {/* Stats & Activity Graph */}
              <div className={`mt-6 p-4 rounded-2xl flex flex-col gap-3 ${
                isOrgAdmin ? 'bg-white/5' : 'bg-white border border-slate-100'
              }`}>
                  <div className="flex flex-col items-start">
                    <span className={`text-[8px] font-bold uppercase tracking-tighter ${isOrgAdmin ? 'text-white/40' : 'text-slate-400'}`}>Active Leads</span>
                    <span className={`text-sm font-black ${isOrgAdmin ? 'text-white' : 'text-slate-900'}`}>
                      {member._count?.ownedLeads || 0}
                    </span>
                  </div>

              </div>

              {/* Add Subordinate Button */}
              {(isOrgAdmin || isManager) && (
                <button 
                  onClick={() => setAddingSubTo({ id: member.id, name: member.name })}
                  className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                    isOrgAdmin 
                      ? 'bg-white text-slate-900 border-transparent hover:bg-amber-400 hover:text-white' 
                      : 'bg-slate-900 text-white border-transparent hover:bg-blue-600 shadow-lg shadow-blue-100'
                  }`}
                >
                  <UserPlus size={14} />
                  Provision Subordinate
                </button>
              )}
            </div>
          </div>

          {/* Bottom Connector Line */}
          {subordinates.length > 0 && (
            <div className="w-px h-12 bg-slate-200 mx-auto" />
          )}
        </div>

        {/* Subordinates Container */}
        {subordinates.length > 0 && (
          <div className="relative">
            {/* Horizontal Bridge Line */}
            {subordinates.length > 1 && (
              <div 
                className="absolute top-0 h-px bg-slate-200" 
                style={{ 
                  left: `${100 / subordinates.length / 2}%`, 
                  right: `${100 / subordinates.length / 2}%` 
                }}
              />
            )}
            
            <div className="flex items-start justify-center">
              {subordinates.map(sub => renderMemberNode(sub, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGraph = () => {
    // Top-level users are those with no managerId
    const roots = members.filter(m => !m.managerId);

    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 sm:p-12 min-h-[600px] overflow-x-auto">
        <div className="flex flex-col items-center min-w-max pb-12">
          {roots.length > 0 ? (
            <div className="flex gap-16 items-start justify-center">
              {roots.map(root => renderMemberNode(root))}
            </div>
          ) : (
            <div className="text-center py-20">
               <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6 border border-slate-100">
                 <GitGraph size={40} />
               </div>
               <h2 className="text-xl font-bold text-slate-800">No Hierarchy Defined</h2>
               <p className="text-slate-400 text-sm mt-2">Designate supervisors to generate the organizational structure.</p>
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
          <p className="text-sm text-slate-500 mt-1">Monitor and manage your high-performance sales unit.</p>
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

          {(user?.role === "MANAGER" || user?.role === "ORG_ADMIN") && (
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
            <div key={member.id} className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group border-b-4 border-b-transparent hover:border-b-blue-500">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-xl font-black shadow-inner`}>
                  {member.initials}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${member.role === 'MANAGER' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                  {member.role === 'MANAGER' ? 'Supervisor' : 'Specialist'}
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
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-xs font-semibold truncate">{member.email}</span>
                </div>
              </div>
              </div>

              <button className="w-full mt-6 py-3 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95">
                View Analytics
              </button>
            </div>
          ))}

          <button className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all group min-h-[280px]">
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
    </div>
  );
}
