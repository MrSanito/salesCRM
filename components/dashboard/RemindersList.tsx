"use client"
import { useState, useEffect, useCallback } from "react";
import {
  Phone, Mail, MessageCircle, CalendarClock,
  CheckCircle2, Clock, AlertCircle, RefreshCcw,
  ChevronRight, BellRing, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

interface Reminder {
  id: string;
  type: string;
  description: string | null;
  scheduledAt: string;
  status: string;
  lead: { contactName: string; company: string } | null;
  user: { name: string; initials: string };
}

interface RemindersListProps {
  refreshKey?: number;
}

const TYPE_META: Record<string, { Icon: any; color: string; label: string }> = {
  CALL:     { Icon: Phone,          color: "text-blue-500 bg-blue-50 border-blue-100",    label: "Call" },
  EMAIL:    { Icon: Mail,           color: "text-purple-500 bg-purple-50 border-purple-100", label: "Email" },
  WHATSAPP: { Icon: MessageCircle,  color: "text-green-500 bg-green-50 border-green-100",  label: "WhatsApp" },
  MEETING:  { Icon: CalendarClock,  color: "text-orange-500 bg-orange-50 border-orange-100", label: "Meeting" },
};

function getGroup(dateStr: string): "overdue" | "today" | "upcoming" {
  const d = new Date(dateStr);
  const now = new Date();
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  if (d < now) return "overdue";
  if (d <= todayEnd) return "today";
  return "upcoming";
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffMin = Math.floor((diffMs % 3600000) / 60000);

  if (diffMs < 0) {
    const ago = Math.abs(diffMs);
    const h = Math.floor(ago / 3600000);
    if (h >= 24) return `${Math.floor(h / 24)}d overdue`;
    if (h > 0) return `${h}h overdue`;
    return `${Math.floor(ago / 60000)}min overdue`;
  }
  if (diffH === 0) return `in ${Math.max(1, diffMin)}min`;
  if (diffH < 24) return `in ${diffH}h ${diffMin > 0 ? `${diffMin}m` : ""}`;
  const diffDays = Math.floor(diffH / 24);
  if (diffDays === 1) {
    return `Tomorrow ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function RemindersList({ refreshKey = 0 }: RemindersListProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [tab, setTab] = useState<"overdue" | "today" | "upcoming">("today");

  const fetchReminders = useCallback(() => {
    setLoading(true);
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setReminders(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchReminders();
    // Auto-refresh every 60s
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [fetchReminders, refreshKey]);

  const markDone = async (id: string) => {
    setCompleting(id);
    try {
      const res = await fetch(`/api/reminders/${id}/complete`, { method: "PATCH" });
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
        toast.success("Reminder marked as done! ✅", {
          style: { background: "#0f172a", color: "#fff", borderRadius: "12px" },
        });
      } else {
        toast.error("Failed to update reminder");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setCompleting(null);
    }
  };

  const grouped = {
    overdue:  reminders.filter((r) => getGroup(r.scheduledAt) === "overdue"),
    today:    reminders.filter((r) => getGroup(r.scheduledAt) === "today"),
    upcoming: reminders.filter((r) => getGroup(r.scheduledAt) === "upcoming"),
  };

  const tabConfig = [
    { key: "overdue" as const,  label: "Overdue",  count: grouped.overdue.length,  dotColor: "bg-red-500" },
    { key: "today" as const,    label: "Today",    count: grouped.today.length,    dotColor: "bg-orange-500" },
    { key: "upcoming" as const, label: "Upcoming", count: grouped.upcoming.length, dotColor: "bg-blue-500" },
  ];

  const activeList = grouped[tab];

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BellRing size={15} className="text-slate-600" />
            <h2 className="text-[14px] font-semibold text-slate-800">Reminders</h2>
            {grouped.overdue.length > 0 && (
              <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                {grouped.overdue.length} OVERDUE
              </span>
            )}
          </div>
          <button
            onClick={fetchReminders}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
          >
            <RefreshCcw size={13} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-100">
          {tabConfig.map(({ key, label, count, dotColor }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold border-b-2 transition-all -mb-px ${
                tab === key
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} opacity-${tab === key ? "100" : "50"}`} />
              {label}
              <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 ${
                tab === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[380px]">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        )}

        {!loading && activeList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <CheckCircle2 size={32} className="text-green-300 mb-2" />
            <p className="text-[12px] font-semibold text-slate-400">
              {tab === "overdue" ? "No overdue reminders 🎉" :
               tab === "today" ? "Clear for today!" :
               "No upcoming reminders scheduled"}
            </p>
          </div>
        )}

        {!loading && activeList.map((r) => {
          const meta = TYPE_META[r.type] || TYPE_META["CALL"];
          const Icon = meta.Icon;
          const group = getGroup(r.scheduledAt);
          const isOverdue = group === "overdue";
          const isBusy = completing === r.id;

          return (
            <div
              key={r.id}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group ${isOverdue ? "bg-red-50/30" : ""}`}
            >
              {/* Type icon */}
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.color}`}>
                <Icon size={13} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 truncate leading-snug">
                  {r.description || `${meta.label} with ${r.lead?.contactName}`}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{r.lead?.company || "—"}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {isOverdue ? (
                    <AlertCircle size={10} className="text-red-500 flex-shrink-0" />
                  ) : (
                    <Clock size={10} className="text-slate-400 flex-shrink-0" />
                  )}
                  <span className={`text-[10px] font-semibold ${isOverdue ? "text-red-500" : "text-orange-500"}`}>
                    {formatTime(r.scheduledAt)}
                  </span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[10px] text-slate-400 capitalize">{meta.label}</span>
                </div>
              </div>

              {/* Mark done */}
              <button
                onClick={() => markDone(r.id)}
                disabled={isBusy}
                className={`flex-shrink-0 p-1.5 rounded-lg border transition-all opacity-0 group-hover:opacity-100 ${
                  isBusy
                    ? "border-slate-200 text-slate-300 cursor-wait"
                    : "border-green-200 text-green-600 hover:bg-green-50 hover:border-green-400"
                }`}
                title="Mark as done"
              >
                {isBusy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between bg-slate-50/50">
        <p className="text-[10px] text-slate-400 font-medium">
          {reminders.length} active • auto-refreshes every 60s
        </p>
        <button className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 font-semibold transition-colors">
          View All <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}
