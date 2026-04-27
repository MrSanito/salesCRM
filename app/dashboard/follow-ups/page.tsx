"use client"
import { useState, useEffect, useCallback } from "react";
import { 
  Phone, Mail, MessageCircle, CalendarClock, 
  CheckCircle2, Clock, AlertCircle, RefreshCcw,
  Search, Filter, Calendar as CalendarIcon, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthContext";

interface Reminder {
  id: string;
  type: string;
  description: string | null;
  scheduledAt: string;
  status: string;
  lead: { id: string, contactName: string; company: string } | null;
  user: { name: string; initials: string };
}

const TYPE_META: Record<string, { Icon: any; color: string; label: string; bgColor: string }> = {
  CALL:     { Icon: Phone,          color: "text-blue-600",    bgColor: "bg-blue-50 border-blue-100",    label: "Call" },
  EMAIL:    { Icon: Mail,           color: "text-purple-600",  bgColor: "bg-purple-50 border-purple-100", label: "Email" },
  WHATSAPP: { Icon: MessageCircle,  color: "text-green-600",   bgColor: "bg-green-50 border-green-100",  label: "WhatsApp" },
  MEETING:  { Icon: CalendarClock,  color: "text-orange-600",  bgColor: "bg-orange-50 border-orange-100", label: "Meeting" },
};

export default function FollowUpsPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/reminders");
      const d = await r.json();
      if (Array.isArray(d)) setReminders(d);
    } catch (error) {
      toast.error("Failed to fetch reminders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const markDone = async (id: string) => {
    setCompleting(id);
    try {
      const res = await fetch(`/api/reminders/${id}/complete`, { method: "PATCH" });
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
        toast.success("Task completed!");
      } else {
        toast.error("Update failed");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setCompleting(null);
    }
  };

  const filtered = reminders.filter(r => {
    const matchesType = filterType === "ALL" || r.type === filterType;
    const matchesSearch = 
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lead?.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lead?.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const grouped = {
    overdue: filtered.filter(r => new Date(r.scheduledAt) < new Date()),
    today: filtered.filter(r => {
      const d = new Date(r.scheduledAt);
      const now = new Date();
      return d >= now && d.toLocaleDateString() === now.toLocaleDateString();
    }),
    future: filtered.filter(r => {
      const d = new Date(r.scheduledAt);
      const now = new Date();
      const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
      return d > todayEnd;
    })
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Engagement Tasks</h1>
          <p className="text-slate-500 text-sm">Stay on top of your follow-ups and meetings</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchReminders}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20">
            <CalendarIcon size={18} />
            Schedule Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search tasks, leads, or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "CALL", "EMAIL", "WHATSAPP", "MEETING"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                filterType === type 
                  ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Task Sections */}
      <div className="space-y-8">
        {grouped.overdue.length > 0 && (
          <Section 
            title="Overdue Tasks" 
            count={grouped.overdue.length} 
            color="text-red-600" 
            tasks={grouped.overdue} 
            onComplete={markDone}
            completingId={completing}
          />
        )}
        
        <Section 
          title="Today's Schedule" 
          count={grouped.today.length} 
          color="text-orange-600" 
          tasks={grouped.today} 
          onComplete={markDone}
          completingId={completing}
          emptyMsg="No more tasks for today! Take a breather. ☕"
        />

        <Section 
          title="Upcoming Follow-ups" 
          count={grouped.future.length} 
          color="text-blue-600" 
          tasks={grouped.future} 
          onComplete={markDone}
          completingId={completing}
        />
      </div>
    </div>
  );
}

function Section({ title, count, color, tasks, onComplete, completingId, emptyMsg = "No tasks found" }: any) {
  if (tasks.length === 0 && !emptyMsg) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</h2>
        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{count}</span>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center justify-center text-slate-400">
          <CheckCircle2 size={32} className="mb-2 opacity-20" />
          <p className="text-xs font-medium">{emptyMsg}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task: Reminder) => {
            const meta = TYPE_META[task.type] || TYPE_META["CALL"];
            const Icon = meta.Icon;
            const isBusy = completingId === task.id;

            return (
              <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.bgColor}`}>
                    <Icon className={meta.color} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                      {task.description || `${meta.label} with ${task.lead?.contactName}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{task.lead?.company || "No company"}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-600">
                      {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(task.scheduledAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onComplete(task.id)}
                    disabled={isBusy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-green-600 hover:bg-green-50 transition-colors border border-green-100"
                  >
                    {isBusy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Complete
                  </button>
                </div>

                {/* Overdue Indicator */}
                {new Date(task.scheduledAt) < new Date() && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase">Overdue</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

