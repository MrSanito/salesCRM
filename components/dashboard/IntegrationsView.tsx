"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Puzzle, Calendar, CheckCircle2, AlertCircle, Loader2, Link2, ExternalLink, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function IntegrationsView() {
  const router = useRouter();
  const { setGoogleConnected, triggerRefresh } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async (isPopupCallback = false) => {
    try {
      const res = await fetch("/api/integrations/google/status");
      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.isConnected);
        setGoogleConnected(data.isConnected);
        
        if (data.isConnected && isPopupCallback) {
          toast.success("Google account linked successfully!");
          triggerRefresh();
          // Wait a brief moment then navigate to show the calendar
          setTimeout(() => {
            router.push("/dashboard/calendar");
          }, 800);
        }
      }
    } catch (error) {
      console.error("Failed to check status", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/integrations/google/auth");
      if (res.ok) {
        const data = await res.json();
        
        // Open OAuth in a popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.url,
          "google-auth",
          `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
        );

        // Poll for popup closure
        const checkPopup = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            checkStatus(true);
            setConnecting(false);
          }
        }, 1000);
      } else {
        toast.error("Failed to start connection");
        setConnecting(false);
      }
    } catch (error) {
      toast.error("Connection error");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Google Calendar?")) return;
    
    setConnecting(true);
    try {
      const res = await fetch("/api/integrations/google/disconnect", { method: "POST" });
      if (res.ok) {
        setIsConnected(false);
        setGoogleConnected(false);
        triggerRefresh();
        toast.success("Google Calendar disconnected");
      } else {
        toast.error("Failed to disconnect");
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
          <Puzzle size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Integrations Hub</h1>
          <p className="text-slate-500 text-sm font-medium">Connect your favorite tools to automate your workflow</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Internal Integration Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-widest transition-all">
              <Puzzle size={16} />
              All Connectors
            </button>
            
            <div className="my-4 mx-4 border-t border-slate-100" />
            
            <p className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Link Google Calendars</p>
            
            <button 
              onClick={isConnected ? handleDisconnect : handleConnect}
              disabled={connecting}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                isConnected 
                  ? "text-red-600 bg-red-50/50 hover:bg-red-50" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar size={16} />
                <span className="font-bold text-xs uppercase tracking-widest">
                  {isConnected ? "Disconnect" : "Link with Google"}
                </span>
              </div>
              {isConnected ? (
                <XCircle size={14} className="text-red-500" />
              ) : connecting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Link2 size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-60">Status</h4>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-orange-500 animate-pulse"}`} />
              <p className="text-sm font-bold">{isConnected ? "System Connected" : "Action Required"}</p>
            </div>
            <p className="text-[10px] mt-3 leading-relaxed opacity-60 font-medium">
              {isConnected 
                ? "Your follow-ups are automatically synchronized with your Google Calendar." 
                : "Connect your Google account to enable real-time calendar synchronization."}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <Calendar size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Google Calendar Sync</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">Official</span>
                    {isConnected && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-green-100 text-green-700">Connected</span>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={connecting}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
                  isConnected
                    ? "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-slate-100"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100"
                }`}
              >
                {connecting ? <Loader2 size={14} className="animate-spin" /> : isConnected ? <XCircle size={14} /> : <Link2 size={14} />}
                {isConnected ? "Disconnect Account" : "Connect Account"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 shadow-sm mb-4">
                  <ExternalLink size={20} />
                </div>
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 mb-2">Bi-Directional Sync</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Automatically link scheduled follow-ups to your user's Google Calendar. Events created in Solo Sales appear instantly in your calendar.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 shadow-sm mb-4">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 mb-2">Cross-Device Persistence</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Tokens are stored securely in the cloud. Logout and re-login on any device without losing your connection.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-3xl border-2 border-dashed border-slate-100 flex items-center justify-center gap-4 text-slate-400">
              <AlertCircle size={16} />
              <p className="text-[11px] font-bold uppercase tracking-widest">Upcoming: Microsoft Outlook Integration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
