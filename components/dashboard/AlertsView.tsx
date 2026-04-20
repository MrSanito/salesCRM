"use client"
import { AlertCircle, Clock, CheckCircle2, AlertTriangle, Info, Bell } from "lucide-react";

export default function AlertsView() {
  const alerts = [
    { id: 1, type: 'warning', icon: AlertTriangle, title: 'Verify phone number', msg: 'Please check the new phone number added for TechNova.', time: '2 hours ago', status: 'Priority' },
    { id: 2, type: 'success', icon: CheckCircle2, title: 'Note saved successfully', msg: 'Your lead summary has been saved and backed up.', time: '4 hours ago', status: 'Done' },
    { id: 3, type: 'info', icon: Info, title: 'Vikram wants this lead', msg: 'Vikram Singh has asked to take over this lead.', time: '1 day ago', status: 'Waiting' },
    { id: 4, type: 'error', icon: AlertCircle, title: 'Missed a follow-up', msg: 'You missed a scheduled call with GlobalScale yesterday.', time: '2 days ago', status: 'Action Needed' },
    { id: 5, type: 'info', icon: Bell, title: 'Add deal value now', msg: 'The value field is now open for your "Won" leads.', time: '3 days ago', status: 'System' }
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-800">Protocol Alerts</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">High-priority system notifications</p>
        </div>
        <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg transition-all">
          Clear All
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 flex items-center px-4 py-2.5">
          <div className="w-[30%] text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alert Type</div>
          <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Message Details</div>
          <div className="w-[15%] text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div key={alert.id} className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors group">
                <div className="w-[30%] flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.type === 'warning' ? 'bg-orange-50 text-orange-600' :
                    alert.type === 'success' ? 'bg-green-50 text-green-600' :
                    alert.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-slate-800 truncate tracking-tight">{alert.title}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{alert.time}</p>
                  </div>
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[11px] text-slate-600 truncate leading-relaxed">{alert.msg}</p>
                </div>

                <div className="w-[15%] flex flex-col items-end gap-1">
                   <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                      alert.status === 'Priority' ? 'bg-orange-100 text-orange-700' :
                      alert.status === 'Action Needed' ? 'bg-red-100 text-red-700' :
                      alert.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                   }`}>
                     {alert.status}
                   </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
