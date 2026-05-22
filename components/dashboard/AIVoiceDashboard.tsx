"use client";

import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from "recharts";

import { useDashboard } from "@/components/dashboard/DashboardContext";

const callsOverTime: any[] = [];
const topIssues: any[] = [];
const distributors: any[] = [];
const regionIssues: any[] = [];
const languageDist: any[] = [];
const liveActivity: any[] = [];

const statCards = [
  { label: "Total Calls", value: "0", icon: "📞", iconBg: "bg-purple-100", change: "0%", up: true },
  { label: "Answered Calls", value: "0", icon: "📲", iconBg: "bg-green-100", change: "0%", up: true },
  { label: "Avg. Call Duration", value: "00:00", icon: "⏱️", iconBg: "bg-orange-100", change: "0", up: false },
  { label: "Unique Contacts", value: "0", icon: "👤", iconBg: "bg-blue-100", change: "0%", up: true },
  { label: "Issues Flagged", value: "0", icon: "🚩", iconBg: "bg-red-100", change: "0%", up: true },
  { label: "Est. AI Cost", value: "₹ 0", icon: "₹", iconBg: "bg-red-100", change: "0%", up: false },
  { label: "Tokens Used (LLM)", value: "0", icon: "💬", iconBg: "bg-teal-100", change: "0%", up: true },
  { label: "Minutes Used", value: "0", icon: "📞", iconBg: "bg-yellow-100", change: "0%", up: true },
];

export default function AIVoiceDashboard() {
  const { stats } = useDashboard();
  
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch("/api/leads?pageSize=1000");
        if (res.ok) {
          const data = await res.json();
          setLeads(data);
        }
      } catch (err) {
        console.error("Error fetching leads:", err);
      } finally {
        setLoadingLeads(false);
      }
    }
    fetchLeads();
  }, []);

  const customerLeads = leads.filter((lead: any) => lead.stage === "CLIENT");

  const clientCount = stats?.pipeline?.find((p: any) => p.label === "Client" || p.stage === "CLIENT")?.count || 0;
  const otherCount = (stats?.kpis?.totalLeads || 0) - clientCount;
  
  const callOutcomes = stats?.kpis?.totalLeads ? [
    { name: "Customer", value: clientCount, color: "#8b5cf6", pct: `${((clientCount / stats.kpis.totalLeads) * 100).toFixed(0)}%` },
    { name: "Other Leads", value: otherCount, color: "#e2e8f0", pct: `${((otherCount / stats.kpis.totalLeads) * 100).toFixed(0)}%` }
  ] : [];
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Voice - Dashboard</h1>
          <p className="text-sm text-gray-500">Performance, Usage, Analytics &amp; Operations Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm text-gray-700">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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
      <div className="grid grid-cols-8 gap-3 mb-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col gap-1 shadow-sm">
            <div className={`w-8 h-8 rounded-full ${s.iconBg} flex items-center justify-center text-base`}>{s.icon}</div>
            <p className="text-xs text-gray-500 leading-tight mt-1">{s.label}</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">{s.value}</p>
            <p className={`text-xs ${s.up ? "text-green-600" : "text-red-500"}`}>
              {s.up ? "↑" : "↓"} {s.change} vs last 7 days
            </p>
          </div>
        ))}
      </div>

      {/* Row 2: Call Outcomes | Calls Over Time | Top Issue Categories */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Call Outcomes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800">Call Outcomes</h2>
            <button className="text-blue-500 text-xs hover:underline">View Details</button>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={callOutcomes} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={2}>
                  {callOutcomes.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => v?.toLocaleString?.() || v} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-base font-bold text-gray-900">{(stats?.kpis?.totalLeads || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">Total Leads</p>
            </div>
          </div>
          <div className="space-y-1 mt-1">
            {callOutcomes.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ background: c.color }}></span>
                  <span className="text-gray-600">{c.name}</span>
                </div>
                <span className="text-gray-500">{c.value.toLocaleString()} ({c.pct})</span>
              </div>
            ))}
          </div>

          {/* Customers List */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Customers ({customerLeads.length})</span>
              <span className="text-[10px] text-gray-400">Status: Client</span>
            </div>
            {loadingLeads ? (
              <div className="text-xs text-gray-400 py-1">Loading customer list...</div>
            ) : customerLeads.length === 0 ? (
              <div className="text-xs text-gray-400 py-1">No customer leads found.</div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                {customerLeads.map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-purple-50/50 border border-transparent transition-colors">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-gray-800 truncate">{lead.contactName}</span>
                      <span className="text-[10px] text-gray-400 truncate">{lead.company || "No Company"}</span>
                    </div>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                      {lead.dealValueInr ? `₹${Number(lead.dealValueInr).toLocaleString('en-IN')}` : '₹0'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calls Over Time */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800">Calls Over Time</h2>
            <select className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600">
              <option>Daily ily</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={callsOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="calls" stroke="#8b5cf6" strokeWidth={2} fill="url(#callsGrad)" dot={{ fill: "#8b5cf6", r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Issue Categories */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Top Issue Categories</h2>
            <button className="text-blue-500 text-xs hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {topIssues.map((issue) => (
              <div key={issue.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">{issue.name}</span>
                  <span className="text-gray-500">{issue.value} ({issue.pct})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: issue.pct, background: issue.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Distributor | Issues by Region | Language Dist | Retry */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {/* Distributor Performance */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm">Distributor Performance (by Issue Rate)</h2>
            <button className="text-blue-500 text-xs hover:underline">View All</button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left pb-1.5 font-medium">Distributor</th>
                <th className="text-left pb-1.5 font-medium">Total Calls</th>
                <th className="text-left pb-1.5 font-medium">Issues Flagged</th>
                <th className="text-left pb-1.5 font-medium">Issue Rate</th>
              </tr>
            </thead>
            <tbody>
              {distributors.map((d) => (
                <tr key={d.name} className="border-b border-gray-50 last:border-0">
                  <td className="py-1.5 text-gray-700">{d.name}</td>
                  <td className="py-1.5 text-gray-600">{d.calls.toLocaleString()}</td>
                  <td className="py-1.5 text-gray-600">{d.issues}</td>
                  <td className={`py-1.5 font-semibold ${d.rateColor}`}>{d.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Issues by Region */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm">Issues by State</h2>
            <button className="text-blue-500 text-xs hover:underline">View All</button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left pb-1.5 font-medium">State</th>
                <th className="text-left pb-1.5 font-medium">Total Calls</th>
                <th className="text-left pb-1.5 font-medium">Issues</th>
                <th className="text-left pb-1.5 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {regionIssues.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-1.5 text-gray-700">{r.state}</td>
                  <td className="py-1.5 text-gray-600">{r.calls}</td>
                  <td className="py-1.5 text-gray-600">{r.issues}</td>
                  <td className={`py-1.5 font-semibold ${r.rateColor}`}>{r.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Language Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm">Language Distribution</h2>
            <button className="text-blue-500 text-xs hover:underline">View Details</button>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={languageDist} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" paddingAngle={2}>
                  {languageDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => v?.toLocaleString?.() || v} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-sm font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-400">Total Calls</p>
            </div>
          </div>
          <div className="space-y-1 mt-1">
            {languageDist.map((l) => (
              <div key={l.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ background: l.color }}></span>
                  <span className="text-gray-600">{l.name}</span>
                </div>
                <span className="text-gray-500">{l.value.toLocaleString()} ({l.pct})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Retry & Follow-up */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Retry &amp; Follow-up</h2>
          <div className="space-y-3">
            {[
              { label: "Total Calls Requiring Retry", value: "0", icon: "🔄", color: "text-blue-500" },
              { label: "Calls in Retry Queue", value: "0", icon: "⏳", color: "text-purple-500" },
              { label: "Avg. Retry Attempts", value: "0", icon: "📊", color: "text-orange-500" },
              { label: "Next Retry Window", value: "-", icon: "⏰", color: "text-green-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`text-base ${item.color}`}>{item.icon}</span>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="text-blue-500 text-xs hover:underline mt-3 block">View Details</button>
        </div>
      </div>

      {/* Row 4: Usage Monitoring | WhatsApp Escalations | Recent Live Activity */}
      <div className="grid grid-cols-3 gap-4">
        {/* Usage Monitoring */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Usage Monitoring</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Minutes Used", value: "0 min", change: "0%", up: true, icon: "⏱️", total: "of 0 min", pct: 0 },
              { label: "Tokens Used (LLM)", value: "0", change: "0%", up: true, icon: "💬", total: "of 0 tokens", pct: 0 },
              { label: "TTS Characters", value: "0", change: "0%", up: true, icon: "🔊", total: "of 0 chars", pct: 0 },
              { label: "Est. AI Cost", value: "₹0", change: "0%", up: false, icon: "₹", total: "of ₹0", pct: 0 },
            ].map((u) => (
              <div key={u.label}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{u.icon}</span>
                  <p className="text-xs text-gray-500">{u.label}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{u.value} <span className={`text-xs font-normal ${u.up ? "text-green-600" : "text-red-500"}`}>{u.up ? "↑" : "↓"} {u.change}</span></p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                  <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${u.pct}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{u.total}</p>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Escalations */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-500 text-lg">💬</span>
            <h2 className="font-semibold text-gray-800">WhatsApp Escalations</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Escalated to WhatsApp", value: "0", icon: "📤", iconColor: "text-green-500" },
              { label: "Responses Received", value: "0", icon: "📥", iconColor: "text-blue-500" },
              { label: "Pending Responses", value: "0", icon: "⏳", iconColor: "text-yellow-500" },
            ].map((w) => (
              <div key={w.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-base ${w.iconColor}`}>{w.icon}</span>
                  <span className="text-sm text-gray-600">{w.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{w.value}</span>
              </div>
            ))}
          </div>
          <button className="text-blue-500 text-xs hover:underline mt-4 block">View Details</button>
        </div>

        {/* Recent Live Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Live Activity</h2>
          <div className="space-y-2">
            {liveActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-400 w-14 flex-shrink-0">{a.time}</span>
                <span className="text-gray-600 flex-1 mx-2">{a.text}</span>
                <span className={`font-semibold flex-shrink-0 ${a.statusColor}`}>{a.status}</span>
              </div>
            ))}
          </div>
          <button className="text-blue-500 text-xs hover:underline mt-3 block">View All Activity</button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
        <span>All times are in Asia/Kolkata (IST)</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
          Auto refresh in 30s
        </div>
      </div>
    </div>
  );
}
