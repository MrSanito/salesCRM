"use client"
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface DbNote {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string; initials: string; role: string };
}

interface EngagementStreamProps {
  leadId: string;
  ownerName: string; // current logged-in user's name for display
}

export default function EngagementStream({ leadId, ownerName }: EngagementStreamProps) {
  const [notes, setNotes] = useState<DbNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  // Load existing notes from DB
  useEffect(() => {
    if (!leadId) return;
    fetch(`/api/notes?leadId=${leadId}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setNotes(d); })
      .catch(() => {});
  }, [leadId]);

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, content: noteText }),
      });
      if (res.ok) {
        const saved: DbNote = await res.json();
        setNotes((prev) => [saved, ...prev]);
        setNoteText("");
        toast.success("Note Captured", { style: { background: "#0f172a", color: "#fff" } });
      } else {
        toast.error("Failed to save note");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setSaving(false);
    }
  };

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return `Today, ${formatTime(dateStr)}`;
    if (diffDays === 1) return `Yesterday, ${formatTime(dateStr)}`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + `, ${formatTime(dateStr)}`;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6 flex flex-col h-full">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Engagement Stream</h3>

      {/* Notes Input */}
      <div className="space-y-3 flex-1">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Notes</label>
        <div className="relative flex flex-col gap-2 h-full">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none min-h-[120px] shadow-inner"
            placeholder="Type a private note here..."
          />
          <button
            onClick={handleSave}
            disabled={saving || !noteText.trim()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Engagement Note"}
          </button>
        </div>
      </div>

      {/* Saved Notes List */}
      <div className="pt-4 border-t border-slate-50 space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {notes.length === 0 && (
          <p className="text-[11px] text-slate-400 italic text-center py-2">No notes yet. Add the first one.</p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-500">
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 text-white font-bold text-[9px]">
              {note.user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex flex-col">
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter leading-none">{note.user.name}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {note.user.role === "ORG_ADMIN" ? "Organization Admin" : 
                     note.user.role === "MANAGER" ? "Sales Manager" : 
                     note.user.role === "SALES_REP" ? "Sales Representative" : 
                     note.user.role}
                  </p>
                </div>
                <span className="text-[8px] font-bold text-slate-500 uppercase">{formatDate(note.createdAt)}</span>
              </div>
              <p className="text-[12px] text-slate-700 font-medium border-l-2 border-slate-900 pl-3 py-1 bg-slate-50 rounded-r-lg">
                {note.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
