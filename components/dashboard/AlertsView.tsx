"use client"
import { useState, useEffect } from "react";
import { AlertCircle, Clock, CheckCircle2, AlertTriangle, Info, Bell, ShieldAlert, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const ICON_MAP: Record<string, any> = {
  FOLLOW_UP_DUE: Clock,
  LEAD_ASSIGNED: Info,
  STAGE_CHANGED: AlertTriangle,
  REMINDER_DUE: Bell,
  AI_REMINDER: AlertCircle,
  SYSTEM: ShieldAlert,
};

const COLOR_MAP: Record<string, string> = {
  FOLLOW_UP_DUE: 'bg-blue-50 text-blue-600',
  LEAD_ASSIGNED: 'bg-purple-50 text-purple-600',
  STAGE_CHANGED: 'bg-orange-50 text-orange-600',
  REMINDER_DUE: 'bg-red-50 text-red-600',
  AI_REMINDER: 'bg-green-50 text-green-600',
  SYSTEM: 'bg-slate-50 text-slate-600',
};

const STATUS_LABEL: Record<string, string> = {
  FOLLOW_UP_DUE: 'Followup',
  LEAD_ASSIGNED: 'New Lead',
  STAGE_CHANGED: 'Update',
  REMINDER_DUE: 'Priority',
  AI_REMINDER: 'AI Insight',
  SYSTEM: 'System',
};

export default function AlertsView() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAlerts(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const clearAll = async () => {
    try {
      const res = await fetch("/api/alerts", { method: "DELETE" });
      if (res.ok) {
        setAlerts([]);
        toast.success("Alerts cleared");
      }
    } catch (err) {
      toast.error("Failed to clear alerts");
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-800">Protocol Alerts</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">High-priority system notifications</p>
        </div>
        <button 
          onClick={clearAll}
          disabled={alerts.length === 0}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 flex items-center px-4 py-2.5">
          <div className="w-[30%] text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alert Type</div>
          <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Message Details</div>
          <div className="w-[15%] text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</div>
        </div>
        
        <div className="divide-y divide-slate-100 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-[11px] font-bold uppercase tracking-widest">Scanning protocols...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Bell size={32} strokeWidth={1.5} className="opacity-20" />
              <p className="text-[11px] font-bold uppercase tracking-widest">No active alerts</p>
              <p className="text-[10px] text-slate-400">Everything is under control</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const Icon = ICON_MAP[alert.type] || Info;
              const colorClass = COLOR_MAP[alert.type] || 'bg-slate-50 text-slate-600';
              return (
                <div key={alert.id} className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors group">
                  <div className="w-[30%] flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-800 truncate tracking-tight">{alert.title}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{formatTime(alert.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[11px] text-slate-600 truncate leading-relaxed">{alert.body}</p>
                  </div>

                  <div className="w-[15%] flex flex-col items-end gap-1">
                     <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        alert.type === 'FOLLOW_UP_DUE' ? 'bg-blue-100 text-blue-700' :
                        alert.type === 'REMINDER_DUE' ? 'bg-red-100 text-red-700' :
                        alert.type === 'STAGE_CHANGED' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                     }`}>
                       {STATUS_LABEL[alert.type] || 'Info'}
                     </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

