import { useState } from "react";

interface FollowUpModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  leadName?: string;
  phone?: string;
  note?: string;
}

export default function FollowUpModal({
  isOpen = true,
  onClose,
  leadName = "Amit Sharma",
  phone = "+91 98765 43210",
  note = "Interested in premium plan. Need pricing and demo details.",
}: FollowUpModalProps) {
  const [activeTab, setActiveTab] = useState<"action" | "ignore">("action");
  const [dismissed, setDismissed] = useState(false);

  if (!isOpen || dismissed) return null;

  const handleClose = () => {
    setDismissed(true);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
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
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-2xl">🔔</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Follow-Up Reminder
              <span className="text-xl">⚠️</span>
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-700 text-[15px] leading-relaxed">
            Follow up scheduled with{" "}
            <span className="text-blue-600 font-semibold">"{leadName}"</span>{" "}
            <span className="text-blue-600 font-medium">{phone}</span>{" "}
            for "{note}"
          </p>
        </div>

        {/* Action / Ignore Toggle */}
        <div className="px-6 pb-4 flex gap-3">
          <button
            onClick={() => setActiveTab("action")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-[15px] transition-all duration-200 ${
              activeTab === "action"
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {activeTab === "action" ? (
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
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
            )}
            Action Taken
          </button>

          <button
            onClick={() => setActiveTab("ignore")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-[15px] border transition-all duration-200 ${
              activeTab === "ignore"
                ? "bg-gray-100 text-gray-700 border-gray-300"
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

        {/* Quick Actions */}
        <div className="mx-6 mb-6 rounded-2xl border border-gray-100 bg-gray-50/60 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {/* Go to Lead */}
            <button className="flex flex-col items-center gap-3 p-5 hover:bg-white transition-colors duration-150 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-blue-500"
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
                <p className="text-gray-800 font-semibold text-[13px] leading-tight">Go to Lead</p>
                <p className="text-gray-400 text-[11px] mt-0.5">View lead details</p>
              </div>
            </button>

            {/* Reschedule */}
            <button className="flex flex-col items-center gap-3 p-5 hover:bg-white transition-colors duration-150 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-emerald-500"
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
                <p className="text-gray-800 font-semibold text-[13px] leading-tight">Reschedule</p>
                <p className="text-gray-400 text-[11px] mt-0.5">Change follow-up time</p>
              </div>
            </button>

            {/* Status & Sub Status */}
            <button className="flex flex-col items-center gap-3 p-5 hover:bg-white transition-colors duration-150 group">
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-violet-500"
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
                <p className="text-gray-800 font-semibold text-[13px] leading-tight">Status & Sub Status</p>
                <p className="text-gray-400 text-[11px] mt-0.5">Update status</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}