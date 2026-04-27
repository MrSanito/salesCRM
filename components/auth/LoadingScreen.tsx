"use client"
import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center space-y-6">
      {/* Brand Logo or Icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-500/20 animate-bounce">
          <span className="text-white text-2xl font-black italic">S</span>
        </div>
        <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      </div>

      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Securing Connection
          </p>
        </div>
        <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-progress-fast" />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress-fast {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress-fast {
          animation: progress-fast 1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
