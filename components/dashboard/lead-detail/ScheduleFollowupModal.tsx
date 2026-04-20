"use client"
import { CalendarCheck, X, Phone, Mail } from "lucide-react";

interface ScheduleFollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { date: string; time: string; note: string };
  setData: (data: any) => void;
  onSubmit: () => void;
}

export default function ScheduleFollowupModal({ isOpen, onClose, data, setData, onSubmit }: ScheduleFollowupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-transparent backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white bg-opacity-10 flex items-center justify-center">
              <CalendarCheck size={16} className="text-white" />
            </div>
            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em]">Schedule Followup</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Target Date</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all font-sans"
                value={data.date}
                onChange={(e) => setData((prev: any) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Target Time</label>
              <input 
                type="time"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all font-sans"
                value={data.time}
                onChange={(e) => setData((prev: any) => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Contact Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setData((prev: any) => ({ ...prev, method: 'phone' }))}
                className={`py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  data.method === 'phone' 
                    ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200" 
                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                }`}
              >
                <Phone size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Phone Call</span>
              </button>
              <button 
                onClick={() => setData((prev: any) => ({ ...prev, method: 'email' }))}
                className={`py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  data.method === 'email' 
                    ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200" 
                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                }`}
              >
                <Mail size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Email Support</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Followup Context</label>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-opacity-10 transition-all resize-none min-h-[80px]"
              placeholder="What is the objective of this followup?"
              value={data.note}
              onChange={(e) => setData((prev: any) => ({ ...prev, note: e.target.value }))}
            />
          </div>
          <button 
            onClick={onSubmit}
            className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-100"
          >
            Confirm Protocol Sync
          </button>
        </div>
      </div>
    </div>
  );
}
