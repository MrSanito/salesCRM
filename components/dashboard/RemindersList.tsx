"use client"
import { MessageCircle, Phone, Mail, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface Reminder {
  id: string;
  type: string;
  description: string | null;
  scheduledAt: string;
  lead: { contactName: string; company: string } | null;
}

const iconMap: Record<string, any> = {
  CALL: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  MEETING: RefreshCcw,
};
const colorMap: Record<string, string> = {
  CALL: "text-blue-500 bg-blue-50",
  EMAIL: "text-purple-500 bg-purple-50",
  WHATSAPP: "text-green-500 bg-green-50",
  MEETING: "text-orange-500 bg-orange-50",
};

function formatScheduledAt(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH = Math.round(diffMs / (1000 * 60 * 60));
  if (diffH < 0) return "Overdue";
  if (diffH === 0) return "< 1 hour";
  if (diffH < 24) return `In ${diffH}h`;
  const diffDays = Math.round(diffH / 24);
  if (diffDays === 1) return "Tomorrow";
  return `In ${diffDays} days`;
}

export default function RemindersList() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setReminders(d); })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-semibold text-slate-800">Upcoming Reminders</h2>
        <button className="text-[11px] text-blue-500 hover:text-blue-700 font-medium">View All</button>
      </div>
      <div className="space-y-3 flex-1">
        {reminders.length === 0 && (
          <p className="text-[12px] text-slate-400 text-center py-4">No pending reminders</p>
        )}
        {reminders.slice(0, 4).map((r) => {
          const Icon = iconMap[r.type] || RefreshCcw;
          const colors = colorMap[r.type] || "text-slate-500 bg-slate-50";
          return (
            <div key={r.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colors}`}>
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-700 truncate">
                  {r.description || `${r.type} • ${r.lead?.contactName}`}
                </p>
                <p className="text-[11px] text-orange-500 font-medium">{formatScheduledAt(r.scheduledAt)}</p>
                <p className="text-[11px] text-slate-400">{r.lead?.company || "—"}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg">
          <RefreshCcw size={13} className="text-blue-500 flex-shrink-0" />
          <p className="text-[11px] text-blue-600 font-medium flex-1">
            {reminders.length} active reminder{reminders.length !== 1 ? "s" : ""} synced from DB
          </p>
        </div>
      </div>
    </div>
  );
}
