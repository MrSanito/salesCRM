"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

export type AlertPayload = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  leadId: string | null;
  contactName?: string;
  createdAt: string;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AlertPayload[]>([]);
  const [activeModalAlert, setActiveModalAlert] = useState<AlertPayload | null>(null);

  useEffect(() => {
    let es: EventSource;
    let reconnectDelay = 1000;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/notifications/stream");

      es.onopen = () => {
        reconnectDelay = 1000; // Reset backoff on successful connection
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          const processAlert = (alert: AlertPayload) => {
            setNotifications((prev) => {
              if (prev.some(p => p.id === alert.id)) return prev;
              return [alert, ...prev];
            });
            
            if (alert.type === "FOLLOW_UP_DUE" || alert.type === "REMINDER_DUE") {
              setActiveModalAlert(alert);
            }
            
            toast((t) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm">{alert.title}</span>
                {alert.body && <span className="text-xs text-gray-600">{alert.body}</span>}
              </div>
            ));
          };

          if (Array.isArray(payload)) {
            payload.forEach(processAlert);
          } else if (payload && payload.id) {
            processAlert(payload);
          }
        } catch (err) {
          // Ignore heartbeat
        }
      };

      es.onerror = () => {
        es.close();
        // Reconnect with exponential backoff (max 30s)
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      };
    }

    connect();

    return () => {
      es?.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  const unreadCount = notifications.length;

  const markRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to mark alert as read", err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    // Batch clear all notifications in parallel instead of sequential awaits
    await Promise.all(notifications.map(n => markRead(n.id)));
  }, [notifications, markRead]);

  return {
    notifications,
    unreadCount,
    markRead,
    clearAll,
    activeModalAlert,
    setActiveModalAlert
  };
}
