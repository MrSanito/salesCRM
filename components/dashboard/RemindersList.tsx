"use client"
import { MessageCircle, Phone, Mail, RefreshCcw } from "lucide-react";
import { REMINDERS } from "@/lib/data";

const iconMap = {
  call: Phone,
  email: Mail,
  followup: MessageCircle,
};

const colorMap = {
  call: "text-blue-500 bg-blue-50",
  email: "text-purple-500 bg-purple-50",
  followup: "text-green-500 bg-green-50",
};

export default function RemindersList() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-semibold text-slate-800">Upcoming Reminders</h2>
        <button className="text-[11px] text-blue-500 hover:text-blue-700 font-medium">View All</button>
      </div>
      <div className="space-y-3 flex-1">
        {REMINDERS.map((r, i) => {
          const Icon = iconMap[r.type as keyof typeof iconMap] || RefreshCcw;
          const colors = colorMap[r.type as keyof typeof colorMap] || "text-slate-500 bg-slate-50";
          return (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colors}`}>
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-700 truncate">{r.name}</p>
                <p className="text-[11px] text-orange-500 font-medium">{r.time}</p>
                <p className="text-[11px] text-slate-400">{r.company}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg">
          <RefreshCcw size={13} className="text-blue-500 flex-shrink-0" />
          <p className="text-[11px] text-blue-600 font-medium flex-1">AI extracted 5 reminders from recent notes</p>
          <button className="text-[11px] text-blue-600 font-semibold hover:underline">Review</button>
        </div>
      </div>
    </div>
  );
}
