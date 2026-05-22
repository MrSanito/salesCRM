"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const flagData: any[] = [];
const alerts: any[] = [];
const callHistory: any[] = [];
const transcript: any[] = [];

export default function AlertsDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500">Flags, Transcripts, Call History &amp; AI Summariser</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm text-gray-700">
            <span>25 May 2025 - 31 May 2025</span>
          </div>
          <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm text-gray-700 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
            Filters
          </button>
          <button className="border border-gray-200 rounded-lg p-2 bg-white hover:bg-gray-50">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Alerts", value: "0", icon: "🚩", iconBg: "bg-red-100", change: "0%", up: true },
          { label: "High Priority", value: "0", icon: "⬇️", iconBg: "bg-orange-100", change: "0%", up: true },
          { label: "Medium Priority", value: "0", icon: "🏳️", iconBg: "bg-yellow-100", change: "0%", up: true },
          { label: "Low Priority", value: "0", icon: "📗", iconBg: "bg-green-100", change: "0%", up: false },
          { label: "Total Resolved", value: "0", icon: "📋", iconBg: "bg-purple-100", change: "0%", up: true },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-full ${s.iconBg} flex items-center justify-center text-lg flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className={`text-xs ${s.up ? "text-green-600" : "text-red-500"}`}>
                {s.up ? "↑" : "↓"} {s.change} vs last 7 days
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Alerts / Flags Table */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Alerts / Flags</h2>
            <button className="text-blue-500 text-sm hover:underline">View All Alerts</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Priority</th>
                <th className="text-left pb-2 font-medium">Flag</th>
                <th className="text-left pb-2 font-medium">Retailer</th>
                <th className="text-left pb-2 font-medium">Distributor / MR</th>
                <th className="text-left pb-2 font-medium">Time</th>
                <th className="text-left pb-2 font-medium">Summary</th>
                <th className="text-left pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5">
                    <span className={`text-xs font-semibold ${a.priorityColor}`}>{a.priority}</span>
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${a.flagColor}`}>{a.flag}</span>
                  </td>
                  <td className="py-2.5 text-gray-700">{a.retailer}</td>
                  <td className="py-2.5 text-gray-700">{a.dist}</td>
                  <td className="py-2.5 text-gray-500 text-xs whitespace-pre-line">{a.time}</td>
                  <td className="py-2.5 text-gray-600 text-xs max-w-[140px]">{a.summary}</td>
                  <td className="py-2.5">
                    <button className="text-blue-500 text-xs hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts by Flag Type */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800">Alerts by Flag Type</h2>
            <button className="text-blue-500 text-sm hover:underline">View All</button>
          </div>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={flagData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {flagData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => v?.toLocaleString?.() || v} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute mt-16 text-center pointer-events-none">
              <p className="text-xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Total Alerts</p>
            </div>
          </div>
          <div className="mt-1 space-y-1">
            {flagData.map((f) => (
              <div key={f.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: f.color }}></span>
                  <span className="text-gray-600">{f.name}</span>
                </div>
                <span className="text-gray-500">{f.value.toLocaleString()} ({f.pct})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Transcripts & AI Summariser */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Transcripts &amp; AI Summariser</h2>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">📞</span>
              <span className="text-sm font-medium text-gray-700">Call ID: -</span>
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">-</span>
            </div>
            <span className="ml-auto text-xs text-gray-400">Duration: 00:00</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Transcript */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Transcript</p>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {transcript.map((t, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${t.role === "AI Voice Rep" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{t.role}</span>
                      <span className="text-xs text-gray-400">{t.time}</span>
                    </div>
                    <p className="text-xs text-gray-700 ml-0.5">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* AI Summariser */}
            <div className="border-l border-gray-100 pl-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">AI Summariser</p>
              <div className="space-y-2">
                {[
                  { label: "Short Summary", text: "-" },
                  { label: "Issue Summary", text: "-" },
                  { label: "Customer Response", text: "-" },
                  { label: "Root Cause (AI)", text: "-" },
                  { label: "Action Needed", text: "-" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-semibold text-gray-600">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.text}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600 font-medium">Priority</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-semibold">-</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 font-medium">Flag</span>
                  <span className="text-gray-500 text-xs font-bold bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Call History (Retailer: Shree Medical Store)</h2>
            <button className="text-blue-500 text-sm hover:underline">View All History</button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Date &amp; Time</th>
                <th className="text-left pb-2 font-medium">Call ID</th>
                <th className="text-left pb-2 font-medium">Duration</th>
                <th className="text-left pb-2 font-medium">Status</th>
                <th className="text-left pb-2 font-medium">Agent</th>
                <th className="text-left pb-2 font-medium">Flag</th>
              </tr>
            </thead>
            <tbody>
              {callHistory.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-600">{c.date}</td>
                  <td className="py-2 text-gray-700 font-medium">{c.id}</td>
                  <td className="py-2 text-gray-600">{c.dur}</td>
                  <td className={`py-2 font-medium ${c.statusColor}`}>{c.status}</td>
                  <td className="py-2 text-gray-600">{c.agent}</td>
                  <td className="py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${c.flagColor}`}>{c.flag}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Total Calls: 0</span>
            <button className="text-blue-500 text-xs hover:underline">View Full History</button>
          </div>
        </div>
      </div>
    </div>
  );
}
