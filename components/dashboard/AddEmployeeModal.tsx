"use client"
import { X, User, Mail, Lock, ChevronDown, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { useAuth } from "@/components/auth/AuthContext";

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface AddEmployeeModalProps {
  onClose: () => void;
  preselectedManagerId?: string;
  preselectedManagerName?: string;
}

export default function AddEmployeeModal({ onClose, preselectedManagerId, preselectedManagerName }: AddEmployeeModalProps) {
  const { user: currentUser } = useAuth();
  const [managers, setManagers] = useState<TeamMember[]>([]);
  const [fetchingManagers, setFetchingManagers] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SALES_REP",
    managerId: preselectedManagerId || "",
    organizationId: currentUser?.organizationId || ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch("/api/team");
        if (res.ok) {
          const data: TeamMember[] = await res.json();
          // Managers and Admins can be report-to targets
          const possibleManagers = data.filter(m => m.role === "MANAGER" || m.role === "ORG_ADMIN");
          setManagers(possibleManagers);
          
          // Auto-select current user if they are a manager/admin and no manager is preselected
          if (!formData.managerId && currentUser && (currentUser.role === "MANAGER" || currentUser.role === "ORG_ADMIN")) {
            setFormData(prev => ({ ...prev, managerId: currentUser.id }));
          }
        }
      } catch (err) {
        console.error("Failed to load managers");
      } finally {
        setFetchingManagers(false);
      }
    };
    fetchTeam();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Sales Rep MUST have a manager
    if (formData.role === "SALES_REP" && !formData.managerId) {
      toast.error("Please assign a manager first. If none exist, create a Manager profile first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Employee Added Successfully!");
        onClose();
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Provision Employee</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Expanding Team Intelligence</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Designation Role</label>
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "SALES_REP" })}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${formData.role === "SALES_REP" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Sales Rep
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "MANAGER" })}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${formData.role === "MANAGER" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Manager
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400"><User size={18} /></span>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="Arjun Mehta"
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="arjun@solobuild.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Initial Password</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400"><Lock size={18} /></span>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Manager Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Reporting To {formData.role === "SALES_REP" && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none pr-10"
                disabled={fetchingManagers}
              >
                <option value="">Select a Manager...</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
              <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
            
            {formData.role === "SALES_REP" && managers.length === 0 && !fetchingManagers && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl mt-2 border border-red-100">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[10px] font-bold text-red-600 leading-tight uppercase tracking-wider">
                  Critical: No managers found. You must create a Manager profile first to assign Sales Reps.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || (formData.role === "SALES_REP" && managers.length === 0)}
              className="flex-1 py-4 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Add Subordinate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
