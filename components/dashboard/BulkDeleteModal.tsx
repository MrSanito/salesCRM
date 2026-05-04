"use client"
import { useState } from "react";
import { X, Trash2, AlertCircle, ChevronRight } from "lucide-react";

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export default function BulkDeleteModal({ isOpen, onClose, selectedIds, onSuccess }: BulkDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/leads/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete leads");
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
      <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="px-8 py-6 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-red-900 flex items-center gap-2">
              Batch Deletion <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">{selectedIds.length} Leads</span>
            </h2>
            <p className="text-xs text-red-400 font-bold uppercase tracking-widest mt-1">Irreversible Data Purge</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-red-400 hover:text-red-900 border border-transparent hover:border-red-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <p className="text-sm text-amber-900 font-medium leading-relaxed">
              You are about to delete <span className="font-black underline">{selectedIds.length} leads</span>. This will permanently erase their protocol history, communication logs, and associated intelligence notes.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block text-center">
              Type <span className="text-red-600">DELETE</span> to confirm purge
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE..."
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-center text-sm font-black text-red-600 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none tracking-widest uppercase"
            />
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95"
          >
            Abort
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== "DELETE"}
            className="flex-[2] h-12 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95 disabled:opacity-30 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? "Purging..." : (
              <>
                Execute Deletion <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
