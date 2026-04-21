"use client"
import { MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

interface EngagementStreamProps {
  lead: any;
  internalNote: string;
  setInternalNote: (note: string) => void;
  saveCurrentNote: (note: string) => void;
  sessionNotes: { id: string; text: string; time: string }[];
  owner: string;
}

export default function EngagementStream({ 
  lead, 
  internalNote, 
  setInternalNote, 
  saveCurrentNote, 
  sessionNotes,
  owner
}: EngagementStreamProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6 flex flex-col h-full">
       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Engagement stream</h3>
       
       {/* Notes Input */}
       <div className="space-y-3 flex-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1"> Notes</label>
          <div className="relative flex flex-col gap-2 h-full">
            <textarea 
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none min-h-[120px] shadow-inner"
              placeholder="Type a private note here..."
            />
            <button 
              onClick={() => {
                saveCurrentNote(internalNote);
                setInternalNote("");
                toast.success("Note Captured", { style: { background: '#0f172a', color: '#fff' } });
              }}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
            >
              Save Engagement Note
            </button>
          </div>
       </div>

       {/* Latest Activity Snippet */}
       <div className="pt-4 border-t border-slate-50 space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-100">
          {/* CURRENT SESSION SAVED NOTES */}
          {sessionNotes.map((note) => (
            <div key={note.id} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-500">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 text-white font-bold text-[9px]">
                {owner.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between mb-1">
                   <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Last Activity</p>
                   <span className="text-[8px] font-bold text-slate-500 uppercase">{note.time}</span>
                 </div>
                 <p className="text-[9px] font-semibold text-blue-600 mb-1">by {owner}</p>
                 <p className="text-[12px] text-slate-700 font-medium border-l-2 border-slate-900 pl-3 py-1 bg-slate-50 rounded-r-lg">
                   {note.text}
                 </p>
              </div>
            </div>
          ))}

          {/* HISTORICAL ACTIVITY */}
          <div className={`flex gap-3 transition-opacity duration-500 ${sessionNotes.length > 0 ? 'opacity-50' : 'opacity-100'}`}>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400 font-bold text-[9px]">
              {(lead.owner || owner).split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between mb-1">
                 <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tighter">
                   {sessionNotes.length > 0 ? "Previous Activity" : "Last Activity"}
                 </p>
                 <span className="text-[8px] font-bold text-slate-400 uppercase">{lead.date}</span>
               </div>
               <p className="text-[9px] font-semibold text-slate-400 mb-1">by {lead.owner || owner}</p>
               <p className="text-[12px] text-slate-500 italic truncate border-l-2 border-slate-100 pl-3 py-1">
                 {lead.lastActivity}
               </p>
            </div>
          </div>
       </div>
    </div>
  );
}
