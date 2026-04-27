"use client"
import { useEffect, useState } from "react";

interface PipelineStage {
  label: string;
  count: number;
  color: string;
}

function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

interface PipelineFunnelProps {
  refreshKey?: number;
}

export default function PipelineFunnel({ refreshKey = 0 }: PipelineFunnelProps) {
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.pipeline) setPipeline(d.pipeline);
        if (d.kpis?.totalPipelineValue) setTotalValue(d.kpis.totalPipelineValue);
      })
      .catch(() => {});
  }, [refreshKey]);

  const totalLeads = pipeline.reduce((s, p) => s + p.count, 0);
  const wonCount = pipeline.find((p) => p.label === "Won")?.count || 0;
  const convRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold text-slate-800">Sales Pipeline</h2>
        <span className="text-[11px] text-slate-400 font-medium">Live Data</span>
      </div>
      {/* Funnel */}
      <div className="flex items-stretch gap-0.5 mb-3 overflow-x-auto pb-1">
        {pipeline.map((stage, i) => (
          <div
            key={stage.label}
            className={`flex-1 min-w-[80px] rounded-lg border px-2.5 py-3 text-center cursor-pointer hover:opacity-90 transition-opacity ${stage.color}`}
            style={{ clipPath: i < pipeline.length - 1 ? "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)" : "none" }}
          >
            <p className="text-[10px] font-semibold opacity-80 mb-1">{stage.label}</p>
            <p className="text-xl font-bold">{stage.count}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-[12px] text-slate-500">
          Total Pipeline Value: <span className="font-semibold text-blue-600">{formatINR(totalValue)}</span>
        </span>
        <span className="text-[12px] text-slate-500">
          Conversion Rate: <span className="font-semibold text-green-600">{convRate}%</span>
        </span>
      </div>
    </div>
  );
}
