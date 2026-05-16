import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface FollowUpModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  leadName?: string;
  phone?: string;
  note?: string;
  leadId?: string;
  notificationId?: string;
  reminderId?: string;
  onActionComplete?: () => void;
}

export default function FollowUpModal({
  isOpen = true,
  onClose,
  leadName = "Amit Sharma",
  phone = "+91 98765 43210",
  note = "Interested in premium plan. Need pricing and demo details.",
  leadId,
  notificationId,
  reminderId,
  onActionComplete,
}: FollowUpModalProps) {
  const [activeTab, setActiveTab] = useState<"action" | "ignore">("action");
  const [dismissed, setDismissed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleClose = () => {
    setDismissed(true);
    onClose?.();
  };

  const handleActionTaken = async () => {
    setIsProcessing(true);
    try {
      // 1. Mark notification as read if present
      if (notificationId) {
        await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
      }

      // 2. Mark reminder as complete
      // If we don't have reminderId, we might want to find the first pending one for the lead
      let targetReminderId = reminderId;
      if (!targetReminderId && leadId) {
        const leadRes = await fetch(`/api/leads/${leadId}`);
        const leadData = await leadRes.json();
        const pendingReminder = leadData.reminders?.find((r: any) => r.status === "PENDING");
        if (pendingReminder) targetReminderId = pendingReminder.id;
      }

      if (targetReminderId) {
        const res = await fetch(`/api/reminders/${targetReminderId}/complete`, {
          method: "PATCH",
        });
        if (res.ok) {
          toast.success("Follow-up marked as complete");
        } else {
          toast.error("Failed to update reminder status");
        }
      } else {
        toast.success("Action recorded");
      }

      onActionComplete?.();
      handleClose();
    } catch (err) {
      console.error("Failed to process action:", err);
      toast.error("Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIgnore = async () => {
    setIsProcessing(true);
    try {
      if (notificationId) {
        await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
      }
      toast.success("Reminder dismissed");
      onActionComplete?.();
      handleClose();
    } catch (err) {
      toast.error("Failed to dismiss reminder");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToLead = () => {
    if (leadId) {
      router.push(`/dashboard/leads?id=${leadId}`);
      handleClose();
    } else {
      toast.error("Lead information unavailable");
    }
  };

  if (!isOpen || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 shadow-sm border border-orange-100">
            <span className="text-2xl animate-bounce">🔔</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Follow-Up Reminder
              <span className="text-xl">⚠️</span>
            </h2>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Immediate Attention Required</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-700 text-[15px] leading-relaxed">
            Follow up scheduled with{" "}
            <span className="text-blue-600 font-bold">"{leadName}"</span>{" "}
            {phone && <span className="text-slate-400 font-medium ml-1">({phone})</span>}
          </p>
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 italic text-[13px] text-slate-600">
            "{note}"
          </div>
        </div>

        {/* Action / Ignore Toggle */}
        <div className="px-6 pb-4 flex gap-3">
          <button
            disabled={isProcessing}
            onClick={() => setActiveTab("action")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-[15px] transition-all duration-200 ${
              activeTab === "action"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Action Taken
          </button>

          <button
            disabled={isProcessing}
            onClick={() => setActiveTab("ignore")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-[15px] border transition-all duration-200 ${
              activeTab === "ignore"
                ? "bg-gray-100 text-gray-700 border-gray-300 active:scale-95"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
            Ignore
          </button>
        </div>

        {/* Submit Button (if action/ignore selected) */}
        <div className="px-6 pb-6">
          <button
            disabled={isProcessing}
            onClick={activeTab === "action" ? handleActionTaken : handleIgnore}
            className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
              activeTab === "action"
                ? "bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-blue-700"
                : "bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-slate-800"
            }`}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Confirm {activeTab === "action" ? "Action" : "Dismissal"}</>
            )}
          </button>
        </div>

        {/* Quick Actions Divider */}
        <div className="px-6 flex items-center gap-4 mb-4">
          <div className="h-[1px] flex-1 bg-gray-100" />
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">More Options</span>
          <div className="h-[1px] flex-1 bg-gray-100" />
        </div>

        {/* Quick Actions */}
        <div className="mx-6 mb-6 rounded-2xl border border-gray-100 bg-gray-50/60 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {/* Go to Lead */}
            <button 
              onClick={handleGoToLead}
              className="flex flex-col items-center gap-2 p-4 hover:bg-white transition-colors duration-150 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gray-800 font-bold text-[11px] leading-tight">View Lead</p>
              </div>
            </button>

            {/* Reschedule */}
            <button 
              onClick={() => {
                toast("Rescheduling directly... Redirecting to Lead Detail.");
                handleGoToLead();
              }}
              className="flex flex-col items-center gap-2 p-4 hover:bg-white transition-colors duration-150 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gray-800 font-bold text-[11px] leading-tight">Reschedule</p>
              </div>
            </button>

            {/* Status & Sub Status */}
            <button 
              onClick={handleGoToLead}
              className="flex flex-col items-center gap-2 p-4 hover:bg-white transition-colors duration-150 group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-violet-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gray-800 font-bold text-[11px] leading-tight">Status</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}