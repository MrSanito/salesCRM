"use client"
import { X } from "lucide-react";

interface AddLeadModalProps {
  onClose: () => void;
}

export default function AddLeadModal({ onClose }: AddLeadModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Protocol</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Initiating Lead Intelligence</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Client Name</label>
              <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Company</label>
              <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" placeholder="e.g. Acme Corp" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Mobile Number</label>
              <input type="tel" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" placeholder="+91 XXXX XXXX" />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email ID</label>
              <input type="email" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" placeholder="email@domain.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Expected Value</label>
              <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" placeholder="₹ Amount" />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Source</label>
              <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all appearance-none">
                <option>Direct Referral</option>
                <option>Website Lead</option>
                <option>LinkedIn</option>
                <option>Cold Outreach</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Initial Requirement</label>
            <textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all h-20 resize-none" placeholder="Describe the product or service interest..."></textarea>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Internal Notes</label>
            <textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all h-20 resize-none" placeholder="Private internal insights or status notes..."></textarea>
          </div>
        </div>
        <div className="p-8 pt-0 flex gap-4">
          <button className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-all active:scale-95" onClick={onClose}>Cancel</button>
          <button className="flex-1 py-4 bg-blue-600 text-white font-bold text-sm rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95" onClick={onClose}>Create Lead</button>
        </div>
      </div>
    </div>
  );
}
