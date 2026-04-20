"use client"
import { X } from "lucide-react";
import { PIPELINE_FLOW_STATS } from "@/lib/data";

interface UpdateIntelligenceModalProps {
  onClose: () => void;
}

export default function UpdateIntelligenceModal({ onClose }: UpdateIntelligenceModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-8 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">Update Intelligence</h2>
          <button className="p-2 -mr-2 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all" onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        <div className="p-8 pt-4 space-y-6">
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Lead Status</label>
             <select className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 appearance-none transition-all">
               {PIPELINE_FLOW_STATS.map(stage => (
                 <option key={stage.label}>{stage.label}</option>
               ))}
             </select>
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Next Action Type</label>
             <div className="flex gap-3">
               <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all focus:ring-2 focus:ring-blue-500/20 active:scale-95">
                 EMAIL
               </button>
               <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all focus:ring-2 focus:ring-blue-500/20 active:scale-95">
                 CALL
               </button>
               <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95">
                 OTHER
               </button>
             </div>
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Next Action Date</label>
             <input type="datetime-local" className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 transition-all" />
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Internal Notes</label>
             <textarea className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 h-32 resize-none transition-all" placeholder="Enter latest updates, insights, or tasks..."></textarea>
          </div>
        </div>
        <div className="p-8 pt-0 flex gap-4">
          <button className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-all active:scale-95" onClick={onClose}>Discard</button>
          <button className="flex-1 py-4 bg-blue-600 text-white font-bold text-sm rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95" onClick={onClose}>Save Protocol</button>
        </div>
      </div>
    </div>
  );
}
