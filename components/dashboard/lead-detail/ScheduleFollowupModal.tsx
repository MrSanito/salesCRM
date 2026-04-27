"use client"
import { useState } from "react";
import { CalendarCheck, X, Phone, Mail, MessageCircle, CalendarClock, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ScheduleFollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName?: string;
  onSaved?: () => void;
}

const METHODS = [
  { key: "CALL",     Icon: Phone,         label: "Phone Call",  color: "text-blue-600 bg-blue-50 border-blue-200" },
  { key: "EMAIL",    Icon: Mail,          label: "Email",        color: "text-purple-600 bg-purple-50 border-purple-200" },
  { key: "WHATSAPP", Icon: MessageCircle, label: "WhatsApp",     color: "text-green-600 bg-green-50 border-green-200" },
  { key: "MEETING",  Icon: CalendarClock, label: "Meeting",      color: "text-orange-600 bg-orange-50 border-orange-200" },
];

export default function ScheduleFollowupModal({
  isOpen, onClose, leadId, leadName, onSaved
}: ScheduleFollowupModalProps) {
  const [method, setMethod] = useState("CALL");
  const [date, setDate]     = useState("");
  const [time, setTime]     = useState("");
  const [note, setNote]     = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!date || !time) {
      toast.error("Please set a date and time");
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    setSaving(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          type: method,
          description: note || null,
          scheduledAt,
        }),
      });

      if (res.ok) {
        setSaved(true);
        toast.success("Follow-up scheduled!", {
          icon: "📅",
          style: { background: "#0f172a", color: "#fff", borderRadius: "12px" },
        });
        onSaved?.();
        setTimeout(() => {
          setSaved(false);
          setDate(""); setTime(""); setNote(""); setMethod("CALL");
          onClose();
        }, 1200);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to schedule follow-up");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setSaving(false);
    }
  };

  // Minimum date = today
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">

        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <CalendarCheck size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Schedule Follow-up</h3>
              {leadName && <p className="text-slate-400 text-[10px] mt-0.5">{leadName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Contact Method */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contact Method</label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(({ key, Icon, label, color }) => (
                <button
                  key={key}
                  onClick={() => setMethod(key)}
                  className={`py-2.5 px-3 rounded-xl border-2 flex items-center gap-2 transition-all text-left ${
                    method === key
                      ? `${color} border-current shadow-sm`
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Objective (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What's the goal of this follow-up?"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all resize-none"
            />
          </div>

          {/* Preview */}
          {date && time && (
            <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 animate-in fade-in duration-200">
              <CalendarCheck size={14} className="text-blue-500 flex-shrink-0" />
              <p className="text-[11px] text-blue-700 font-semibold">
                {METHODS.find(m => m.key === method)?.label} on{" "}
                {new Date(`${date}T${time}`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at{" "}
                {new Date(`${date}T${time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || saved || !date || !time}
            className={`w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
              saved
                ? "bg-green-500 text-white shadow-green-100"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {saved ? (
              <><CheckCircle2 size={14} /> Scheduled!</>
            ) : saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><CalendarCheck size={14} /> Confirm Follow-up</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
