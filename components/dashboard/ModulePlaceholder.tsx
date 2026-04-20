"use client"
import { Layout } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
}

export default function ModulePlaceholder({ title }: ModulePlaceholderProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-6 border border-slate-200 shadow-inner">
        <Layout size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title} Tab</h2>
      <p className="text-sm text-slate-400 mt-2 font-medium uppercase tracking-widest">Protocol [ {title.toUpperCase()} ] Initiated</p>
      <div className="mt-8 flex gap-3">
         <div className="w-12 h-1 bg-blue-600 rounded-full opacity-20" />
         <div className="w-12 h-1 bg-blue-600 rounded-full opacity-40" />
         <div className="w-12 h-1 bg-blue-600 rounded-full opacity-20" />
      </div>
    </div>
  );
}
