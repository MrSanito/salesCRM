"use client"
import { useState, useEffect } from "react";
import { X, CheckCircle2, User, ChevronRight, Layout, BarChart3, AlertTriangle } from "lucide-react";

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
}

const STAGES = [
  { id: "NEW", label: "New" },
  { id: "CONTACTED", label: "Contacted" },
  { id: "CHATTING", label: "Cold Chatting" },
  { id: "MEETING_SET", label: "Meeting Set" },
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "NOT_INTERESTED", label: "Not Interested" },
];

const SUB_STATUSES = [
  { id: "BLANK", label: "Blank" },
  { id: "WARM_LEAD", label: "Warm Lead" },
  { id: "PROPOSAL_SENT", label: "Proposal Sent" },
  { id: "BUDGET_LOW", label: "Budget Low" },
  { id: "NO_REQUIREMENT", label: "No Requirement" },
];

const PRIORITIES = [
  { id: "LOW", label: "Low" },
  { id: "MEDIUM", label: "Medium" },
  { id: "HIGH", label: "High" },
];

export default function BulkUpdateModal({ isOpen, onClose, selectedIds, onSuccess }: BulkUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [updateData, setUpdateData] = useState({
    stage: "",
    subStatus: "",
    priority: "",
    ownerId: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/team")
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setUsers(d); })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    // Filter out empty values
    const data: any = {};
    if (updateData.stage) data.stage = updateData.stage;
    if (updateData.subStatus) data.subStatus = updateData.subStatus;
    if (updateData.priority) data.priority = updateData.priority;
    if (updateData.ownerId) data.ownerId = updateData.ownerId;

    if (Object.keys(data).length === 0) {
      alert("Please select at least one field to update");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leads/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, data })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update leads");
      }
    } catch (e) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Batch Update <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{selectedIds.length} Leads</span>
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Mass Protocol Modification</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Stage */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layout size={12} className="text-blue-500" /> Update Lead Status
            </label>
            <select
              value={updateData.stage}
              onChange={(e) => setUpdateData(prev => ({ ...prev, stage: e.target.value }))}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            >
              <option value="">Keep Existing Status</option>
              {STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Sub Status */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={12} className="text-green-500" /> Update Sub-status
            </label>
            <select
              value={updateData.subStatus}
              onChange={(e) => setUpdateData(prev => ({ ...prev, subStatus: e.target.value }))}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            >
              <option value="">Keep Existing Status</option>
              {SUB_STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={12} className="text-amber-500" /> Update Priority
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PRIORITIES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setUpdateData(prev => ({ ...prev, priority: prev.priority === p.id ? "" : p.id }))}
                  className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    updateData.priority === p.id 
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={12} className="text-indigo-500" /> Reassign Owner
            </label>
            <select
              value={updateData.ownerId}
              onChange={(e) => setUpdateData(prev => ({ ...prev, ownerId: e.target.value }))}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            >
              <option value="">Keep Current Owners</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || Object.values(updateData).every(v => v === "")}
            className="flex-[2] h-12 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : (
              <>
                Confirm Batch Update <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
