"use client"
import { ShieldCheck, CheckSquare } from "lucide-react";

interface GatekeeperProtocolProps {
  checklist: any;
  toggleChecklist: (id: string) => void;
}

export default function GatekeeperProtocol({ checklist, toggleChecklist }: GatekeeperProtocolProps) {
  const items = [
    { id: "contactVerified", label: "Contact" },
    { id: "requirementDefined", label: "Lead Requirement" },
    { id: "dataReceived", label: "Data" },
    { id: "orderConfirmed", label: "Order" },
    { id: "proposalSigned", label: "Proposal" },
  ];

  return (
    <div className="bg-slate-900 rounded-2xl p-5 shadow-xl flex flex-col xl:flex-row items-center justify-between gap-6 border border-white relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-slate-800 to-slate-950 opacity-0 group-hover:opacity-100 transition-all duration-1000" />
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-white shadow-inner">
            <ShieldCheck size={20} className="text-slate-900" />
        </div>
        
        <div>
            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] leading-none mb-1">Gatekeeper</h3>
            <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Protocol Sync</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
        {items.map((item) => (
          <button 
            key={item.id}
            onClick={() => toggleChecklist(item.id)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
              checklist[item.id as keyof typeof checklist] 
              ? "bg-white text-slate-900 border-white shadow-lg scale-105" 
              : "bg-transparent text-white border-white/20 hover:border-white/40"
            }`}
          >
              {checklist[item.id as keyof typeof checklist] && <CheckSquare size={12} strokeWidth={3} />}
              {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
