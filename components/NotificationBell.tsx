"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import FollowUpModal from "@/components/dashboard/FollowupModal";
import { useDashboard } from "./dashboard/DashboardContext";

export function NotificationBell() {
  const { notifications, unreadCount, markRead, clearAll, activeModalAlert, setActiveModalAlert } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRefresh } = useDashboard();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleNotificationClick = async (id: string, leadId: string | null) => {
    await markRead(id);
    setIsOpen(false);
    if (leadId) {
      router.push(`/leads/${leadId}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col max-h-[24rem]">
          <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-gray-500">
                <span className="text-sm">You're all caught up 🎉</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id, notif.leadId)}
                  className="flex flex-col p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors border-b border-transparent hover:border-gray-100"
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-medium text-sm text-gray-800 line-clamp-1">{notif.title}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(notif.createdAt)}</span>
                  </div>
                  {notif.body && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1">{notif.body}</p>
                  )}
                  {notif.contactName && (
                    <span className="text-xs font-medium text-blue-600">
                      Lead: {notif.contactName}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeModalAlert && (
        <FollowUpModal 
          isOpen={true} 
          onClose={() => setActiveModalAlert(null)} 
          leadName={activeModalAlert.contactName || "Unknown Lead"}
          note={activeModalAlert.body || "Follow-up required"}
          leadId={activeModalAlert.leadId || undefined}
          notificationId={activeModalAlert.id}
          onActionComplete={triggerRefresh}
        />
      )}
    </div>
  );
}
