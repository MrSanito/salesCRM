"use client"
import { PIPELINE_FLOW_STATS } from "@/lib/data";

export default function PipelineFunnel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold text-slate-800">Sales Pipeline</h2>
        <select className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Quarter</option>
        </select>
      </div>
      {/* Funnel */}
      <div className="flex items-stretch gap-0.5 mb-3 overflow-x-auto pb-1">
        {PIPELINE_FLOW_STATS.map((stage, i) => (
          <div
            key={stage.label}
            className={`flex-1 min-w-[90px] rounded-lg border px-2.5 py-3 text-center cursor-pointer hover:opacity-90 transition-opacity ${stage.color}`}
            style={{ clipPath: i < PIPELINE_FLOW_STATS.length - 1 ? "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)" : "none" }}
          >
            <p className="text-[10px] font-semibold opacity-80 mb-1">{stage.label}</p>
            <p className="text-xl font-bold">{stage.count}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-[12px] text-slate-500">
          Total Pipeline Value: <span className="font-semibold text-blue-600">₹1,68,35,000</span>
        </span>
        <span className="text-[12px] text-slate-500">
          Conversion Rate: <span className="font-semibold text-green-600">12.5%</span>
        </span>
      </div>
    </div>
  );
}
