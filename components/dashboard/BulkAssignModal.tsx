"use client"
import { useState, useEffect } from "react";
import { X, ChevronRight, User, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export default function BulkAssignModal({ isOpen, onClose, selectedIds, onSuccess }: BulkAssignModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");

  useEffect(() => {
    if (isOpen) {
      axios.get("/api/team")
        .then(res => { if (Array.isArray(res.data)) setUsers(res.data); })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedOwnerId) {
      toast.error("Please select an owner to assign the leads to");
      return;
    }

    setLoading(true);
    try {
      await axios.patch("/api/leads/bulk", {
        ids: selectedIds,
        data: { ownerId: selectedOwnerId }
      });

      toast.success(`Successfully reassigned ${selectedIds.length} leads`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to reassign leads");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        {/* Modal Header */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Bulk Assign <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">{selectedIds.length} Leads</span>
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Mass Owner Assignment</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={12} className="text-indigo-500" /> Select New Owner
            </label>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            >
              <option value="">Select a team member...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'CEO' ? 'CEO' : u.role === 'ORG_ADMIN' ? 'Org Admin' : u.role === 'MANAGER' ? 'Supervisor' : 'Specialist'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedOwnerId}
            className="flex-[2] h-12 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : (
              <>
                Confirm Assignment <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
