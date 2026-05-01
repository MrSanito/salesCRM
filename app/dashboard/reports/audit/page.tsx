"use client"
import { useState, useEffect } from "react";
import { History, Search, Download, Filter, Terminal, Clock, User, ShieldCheck } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

interface AuditLog {
  id: string;
  leadId: string | null;
  actorType: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  field: string | null;
  beforeValue: string | null;
  afterValue: string | null;
  note: string | null;
  source: string;
  createdAt: string;
}

export default function AuditReportPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/reports/audit")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredLogs = logs.filter(log => 
    log.actorName?.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.leadId?.toLowerCase().includes(search.toLowerCase()) ||
    log.note?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200/50">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Execution Archive</p>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Organization Audit Trail
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm flex items-center gap-2">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by Actor, Lead ID, or Action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
          />
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200">
          <Filter size={14} /> Apply Filters
        </button>
      </div>

      {/* Report Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Lead ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Actor (Type)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Action</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Field</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Before &gt; After</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deciphering Protocol...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <History size={32} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Logs Found in Archive</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 border-r border-slate-50">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-600">
                          {new Date(log.createdAt).toLocaleString("en-IN", { 
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-50">
                      <span className="text-[10px] font-mono font-black text-slate-400 uppercase">
                        {log.leadId?.slice(0, 8) || "SYSTEM"}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
                          <User size={10} className="text-slate-600" />
                        </div>
                        <span className="text-[11px] font-black text-slate-900 uppercase">
                          {log.actorName || "Unknown"} 
                          <span className="ml-1 text-[9px] text-slate-400 font-bold">({log.actorType})</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-50">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                        log.action === "CREATE" ? "bg-green-100 text-green-700" :
                        log.action === "DELETE" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-50">
                      <span className="text-[11px] font-bold text-slate-500 italic">
                        {log.field || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-50 max-w-[200px]">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {log.beforeValue && (
                          <span className="text-[10px] text-slate-400 line-through truncate">{log.beforeValue}</span>
                        )}
                        {log.beforeValue && log.afterValue && (
                          <span className="text-slate-300">→</span>
                        )}
                        {log.afterValue && (
                          <span className="text-[10px] text-slate-800 font-black truncate">{log.afterValue}</span>
                        )}
                        {!log.beforeValue && !log.afterValue && (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Terminal size={10} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.source}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Note Preview Overlay on Hover */}
        <div className="bg-slate-50 border-t border-slate-100 p-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Terminal size={12} /> Execution Note Preview
          </p>
          <div className="mt-1 h-8 flex items-center">
            <p className="text-[11px] font-medium text-slate-600 italic">
              Hover over a row to see detailed execution notes...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
}
