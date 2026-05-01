"use client"
import { useState, useEffect } from "react";
import { History, User, Terminal, Clock } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  field: string | null;
  beforeValue: string | null;
  afterValue: string | null;
  actorName: string | null;
  note: string | null;
  createdAt: string;
}

export default function AuditLogs({ leadId }: { leadId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leads/${leadId}/audit`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch audit logs:", err);
        setLoading(false);
      });
  }, [leadId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Loading History...</p>
    </div>
  );

  if (logs.length === 0) return (
    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
      <History size={24} className="mx-auto text-slate-300 mb-3" />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Protocol Logs Recorded</p>
    </div>
  );

  return (
    <div className="space-y-4 h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2 mb-4 flex items-center gap-2">
        <Terminal size={12} /> Protocol Execution Logs
      </h3>
      
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all group">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <User size={12} />
                </div>
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{log.actorName || "System"}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Clock size={10} />
                <span className="text-[9px] font-bold">{new Date(log.createdAt).toLocaleString("en-IN", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            
            <div className="pl-8 space-y-2">
              <p className="text-[11px] font-bold text-slate-700">
                <span className="text-blue-600 uppercase tracking-tighter mr-2">{log.action.replace(/_/g, ' ')}</span>
              </p>
              
              {log.note && (
                <p className="text-[12px] font-medium text-slate-800 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50 leading-relaxed italic">
                  "{log.note}"
                </p>
              )}
              
              {(log.beforeValue || log.afterValue) && (
                <div className="flex items-center gap-2 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  {log.field && (
                    <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">{log.field}:</span>
                  )}
                  {log.beforeValue && (
                    <span className="text-[10px] text-slate-400 line-through truncate max-w-[100px]">{log.beforeValue}</span>
                  )}
                  {log.beforeValue && log.afterValue && (
                    <span className="text-slate-300">→</span>
                  )}
                  {log.afterValue && (
                    <span className="text-[10px] text-blue-600 font-bold truncate max-w-[100px]">{log.afterValue}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
