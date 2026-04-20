import React from 'react';
import { PIPELINE_STAGES } from '@/lib/data';

export const Pipeline = () => {
  return (
    <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[13.5px] font-semibold text-slate-900 tracking-[-0.01em]">Sales Pipeline</h2>
        <select className="text-[12px] border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-bold transition-all hover:border-slate-300">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Quarter</option>
        </select>
      </div>

      {/* Stage funnel */}
      <div className="flex items-stretch gap-1 mb-5 overflow-x-auto pb-2 custom-scrollbar">
        {PIPELINE_STAGES.map((stage, i) => (
          <div
            key={stage.label}
            className={`flex-1 min-w-[100px] rounded-lg border px-3 py-4 text-center cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] ${stage.color} shadow-sm`}
            style={{ clipPath: i < PIPELINE_STAGES.length - 1 ? "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)" : "none" }}
          >
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] opacity-80 mb-2">{stage.label}</p>
            <p className="text-[22px] font-bold leading-none tracking-[-0.01em] font-mono">{stage.count}</p>
            <p className="text-[11px] font-medium opacity-70 mt-2 font-mono">{stage.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-[13px] text-slate-500 font-medium">
          Total Value: <span className="font-bold text-slate-900 font-mono ml-1">₹1,68,35,000</span>
        </span>
        <span className="text-[13px] text-slate-500 font-medium">
          Conversion Rate: <span className="font-bold text-green-600 font-mono ml-1">12.5%</span>
        </span>
      </div>
    </div>
  );
};
