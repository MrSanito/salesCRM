"use client"
import { useState } from "react";
import {
  AlertTriangle, CircleDollarSign, Clock, User,
  Truck, Building2, Zap, Sprout,
  CheckCircle, XCircle, ArrowRight,
  Phone, Archive, Shield, Users,
  RefreshCw, Wrench, CreditCard, BarChart4,
  CalendarOff, AlertCircle, Tag,
  Droplets, ThumbsDown, Info, Flame,
  ArrowUp, ArrowDown, Search, X,
  Eye, EyeOff, Repeat
} from "lucide-react";

/* ── DATA ─────────────────────────────────────────────────────────────────── */
const ALERT_DATA = [
  { id:"ALT-001",category:"Lead Status",severity:"HIGH",status:"active",icon:Clock,iconBg:"bg-orange-100",iconColor:"text-orange-600",title:"Lead Neglect — Arjun Mehta (LD-342)",desc:"Lead unaddressed for 48 hours. Client was expecting a quote by yesterday.",impact:"₹3.8L deal at risk",impactColor:"text-orange-600",order:"LD-342",client:"StyleCraft",time:"Today · 10:30 AM",action:"Call Now",actionStyle:"bg-orange-600 hover:bg-orange-700 text-white",delay:"48 hrs",tags:["Neglect","Priority"]},
  { id:"ALT-002",category:"Meetings",severity:"MEDIUM",status:"active",icon:Users,iconBg:"bg-blue-100",iconColor:"text-blue-600",title:"Follow-up Missed — 4 leads today",desc:"4 scheduled calls missed this morning. Rescheduling required.",impact:"₹1.4L potential delay",impactColor:"text-blue-600",order:"Various",client:"Multiple",time:"Today · 12:00 PM",action:"Reschedule",actionStyle:"bg-blue-600 hover:bg-blue-700 text-white",delay:"4 calls",tags:["Schedule","Sales"]},
  { id:"ALT-003",category:"Pipeline",severity:"HIGH",status:"active",icon:Flame,iconBg:"bg-red-100",iconColor:"text-red-600",title:"Proposal ORD-2405 stuck in 'Sent' for 8 days",desc:"Client 'StyleCraft' hasn't opened the proposal for 5 days. Decision likely delayed.",impact:"₹2.1L revenue shortfall",impactColor:"text-red-600",order:"ORD-2405",client:"StyleCraft",time:"Today · 09:00 AM",action:"Follow Up",actionStyle:"bg-red-600 hover:bg-red-700 text-white",delay:"8 days",tags:["Pipeline","Stuck"]},
  { id:"ALT-004",category:"Relationship",severity:"LOW",status:"watching",icon:Repeat,iconBg:"bg-slate-100",iconColor:"text-slate-600",title:"Low Engagement — Urban Threads",desc:"Response time from client increased by 40% this month. Potential churn signal.",impact:"Churn Risk: ₹5.2L/yr",impactColor:"text-slate-600",order:"—",client:"Urban Threads",time:"Yesterday · 06:00 PM",action:"Review",actionStyle:"bg-slate-900 hover:bg-slate-800 text-white",delay:null,tags:["Relationship","Retention"]},
  { id:"ALT-005",category:"Lead Status",severity:"MEDIUM",status:"active",icon:Archive,iconBg:"bg-blue-100",iconColor:"text-blue-600",title:"Stale Intelligence — RD-901 update needed",desc:"Modern Apparel needs sub-status update after their warehouse visit today.",impact:"₹38K quote pending",impactColor:"text-blue-600",order:"RD-901",client:"Modern Apparel",time:"Today · 11:00 AM",action:"Update",actionStyle:"bg-blue-600 hover:bg-blue-700 text-white",delay:null,tags:["Intelligence"]},
  { id:"ALT-006",category:"Payment",severity:"HIGH",status:"active",icon:CircleDollarSign,iconBg:"bg-red-100",iconColor:"text-red-600",title:"Payment Overdue — ORD-2404 (₹2.3L)",desc:"Payment overdue by 7 days. Production holds will apply in 24 hours.",impact:"₹2.3L Cash flow blocked",impactColor:"text-red-600",order:"ORD-2404",client:"Cash Trivete",time:"March 31",action:"Remind",actionStyle:"bg-red-600 hover:bg-red-700 text-white",delay:"7 days",tags:["Finance","Receivable"]},
  { id:"ALT-016",category:"Client Risk",severity:"HIGH",status:"active",icon:User,iconBg:"bg-orange-100",iconColor:"text-orange-600",title:"Approval Delay — ORD-2412 (18 days)",desc:"StyleCraft postponed design approval by 18 days. Production slot wasted.",impact:"₹4.2L revenue delayed",impactColor:"text-orange-600",order:"ORD-2412",client:"StyleCraft",time:"March 28",action:"Escalate",actionStyle:"bg-orange-600 hover:bg-orange-700 text-white",delay:"18 days",tags:["Client","Revenue"]},
  { id:"ALT-017",category:"Pipeline",severity:"HIGH",status:"active",icon:Sprout,iconBg:"bg-red-100",iconColor:"text-red-600",title:"Pipeline Stagnation — No new leads in 15 days",desc:"Stagnant top-of-funnel since April 5th. Inbound volume down 60%.",impact:"Growth Risk · ₹8L Projected Gap",impactColor:"text-red-600",order:"—",client:"Global",time:"April 1",action:"Campaign",actionStyle:"bg-red-600 hover:bg-red-700 text-white",delay:null,tags:["Growth","Marketing"]},
];

const AI_PRIORITY_ACTIONS = [
  { icon: Phone,            iconColor: "text-orange-500", bg: "bg-orange-100", title: "Immediate Follow-up LD-342", sub: "Impact: ₹3.8L deal recovery · 48 hrs late", action: "Call", style: "bg-orange-600 hover:bg-orange-700 text-white" },
  { icon: CircleDollarSign, iconColor: "text-red-500",    bg: "bg-red-100",    title: "Send Payment Reminder for ORD-2404", sub: "Impact: ₹2.3L due · Milestone delayed", action: "Remind", style: "bg-red-600 hover:bg-red-700 text-white" },
  { icon: Archive,          iconColor: "text-blue-500",   bg: "bg-blue-100",   title: "Update Intelligence for RD-901", sub: "Impact: ₹38K quote depends on visit", action: "Update", style: "bg-blue-600 hover:bg-blue-700 text-white" },
];

const CATEGORIES = ["All","Lead Status","Meetings","Pipeline","Relationship","Payment","Client Risk"];

const SEV_STYLE = {
  HIGH:   "bg-orange-100 text-orange-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  LOW:    "bg-slate-100 text-slate-600",
};

const CAT_ICONS = {
  "Lead Status": Clock, Meetings: Users, Pipeline: BarChart4,
  Relationship: Repeat, Payment: CircleDollarSign, "Client Risk": User,
};

/* ── ALERT CARD ─────────────────────────────────────────────────────────────── */
function AlertCard({ alert, onIgnore }: { alert: any, onIgnore: (id: string) => void }) {
  const Icon = alert.icon;
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 hover:shadow-lg hover:border-slate-300 transition-all ${alert.status === "resolved" ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${alert.iconBg} border border-white shadow-sm`}>
          <Icon className={`w-5 h-5 ${alert.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${SEV_STYLE[alert.severity as keyof typeof SEV_STYLE]}`}>{alert.severity}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${alert.status === "active" ? "bg-green-100 text-green-600" : alert.status === "resolved" ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"}`}>
              {alert.status}
            </span>
            {alert.delay && (
              <span className="text-[9px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
                <Clock size={10} className="shrink-0" />{alert.delay}
              </span>
            )}
          </div>
          <p className="text-[15px] font-bold text-slate-900 leading-snug">{alert.title}</p>
          <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{alert.desc}</p>
        </div>
      </div>

      {/* IMPACT */}
      <div className={`text-[12px] font-bold ${alert.impactColor} bg-slate-50 rounded-xl px-4 py-2 flex items-center justify-between border border-slate-100`}>
        <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 opacity-40 text-slate-400" /> 
            <span>Value at Risk: {alert.impact}</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{alert.order}</span>
      </div>

      {/* META + ACTIONS */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">
          Client: <span className="font-bold text-slate-700">{alert.client}</span> · {alert.time}
        </p>
        <div className="flex items-center gap-3">
          {alert.status !== "resolved" && (
            <button onClick={() => onIgnore(alert.id)} className="text-[11px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest transition-colors">
              Ignore
            </button>
          )}
          <button className={`px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 ${alert.actionStyle}`}>
            {alert.action}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN ───────────────────────────────────────────────────────────────────── */
export default function Alerts() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All Severity");
  const [statusFilter,   setStatusFilter]   = useState("All Status");
  const [query,          setQuery]           = useState("");
  const [ignoredIds,     setIgnoredIds]      = useState<string[]>([]);
  const [showAI,         setShowAI]          = useState(true);
  const [showResolved,   setShowResolved]    = useState(false);

  const handleIgnore = (id: string) => setIgnoredIds(prev => [...prev, id]);

  const filtered = ALERT_DATA.filter(a => {
    if (ignoredIds.includes(a.id)) return false;
    if (!showResolved && a.status === "resolved") return false;
    if (categoryFilter !== "All" && a.category !== categoryFilter) return false;
    if (severityFilter !== "All Severity" && a.severity !== severityFilter) return false;
    if (statusFilter   !== "All Status"   && a.status   !== statusFilter)   return false;
    if (query) {
      const q = query.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.order.toLowerCase().includes(q) ||
             a.client.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const grouped = CATEGORIES.slice(1).reduce((acc: any, cat) => {
    const items = filtered.filter(a => a.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  const highCount = ALERT_DATA.filter(a => a.severity === "HIGH").length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence & Alerts</h1>
        <p className="text-sm text-slate-500">AI-driven risk assessment and sales protocol notifications.</p>
      </div>

      {/* AI PRIORITY ACTIONS */}
      <div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden mb-8 border border-white/5">
        <button onClick={() => setShowAI(!showAI)}
          className="w-full flex items-center justify-between px-8 py-6 hover:bg-slate-800 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Zap className="text-white w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white text-lg tracking-tight">Sales AI: Priority Actions</p>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-[0.15em] mt-0.5">Suggested interventions to prevent revenue loss</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] bg-red-500 text-white px-3 py-1 rounded-full font-bold uppercase tracking-widest">{AI_PRIORITY_ACTIONS.length} URGENT</span>
            <ArrowRight className={`text-slate-500 transition-transform ${showAI ? "rotate-90" : "-rotate-90"}`} size={20} />
          </div>
        </button>
        {showAI && (
          <div className="divide-y divide-white/5 border-t border-white/5 bg-slate-800/20">
            {AI_PRIORITY_ACTIONS.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-center gap-4 px-8 py-5 hover:bg-white/5 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.bg} border border-white/10`}>
                    <Icon className={`w-5 h-5 ${a.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-white tracking-tight">{a.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{a.sub}</p>
                  </div>
                  <button className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] shrink-0 transition-all active:scale-95 shadow-lg ${a.style}`}>{a.action}</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label:"Revenue at Risk",     value:`₹8.4L`,  sub:`${highCount} High Priority`,       color:"text-orange-600",    bg:"bg-orange-50",    icon:AlertTriangle    },
          { label:"Leads at Risk",       value:"12",     sub:"48hr+ since last comm",            color:"text-blue-600",      bg:"bg-blue-50",      icon:Clock            },
          { label:"Blocked Capital",     value:"₹9.4L",  sub:"Awaiting approval/payment",        color:"text-red-500",       bg:"bg-red-50",       icon:CircleDollarSign },
          { label:"Funnel Loss",         value:"4.1%",   sub:"Conversion drop vs Q4",            color:"text-slate-800",     bg:"bg-slate-100",    icon:ArrowDown        },
        ].map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                  <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
               </div>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.bg} border border-white shadow-sm`}>
                <k.icon className={`w-5 h-5 ${k.color}`} strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight opacity-70">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* TOP FILTERS */}
      <div className="flex flex-col xl:flex-row gap-4 mb-8">
        <div className="flex-1 flex items-center border border-slate-200 rounded-2xl px-5 py-3 bg-white gap-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
          <Search className="text-slate-400 shrink-0" size={18} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search triggers, lead IDs, or client tags..."
            className="outline-none w-full bg-transparent text-sm font-medium placeholder:text-slate-400" />
          {query && <button onClick={() => setQuery("")} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="text-slate-400 w-4 h-4" /></button>}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="border border-slate-200 rounded-2xl px-5 py-3 text-xs font-bold text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer min-w-[140px]">
            {["All Severity","HIGH","MEDIUM","LOW"].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-2xl px-5 py-3 text-xs font-bold text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer min-w-[120px]">
            {["All Status","active","watching","resolved"].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => setShowResolved(!showResolved)}
            className={`px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 border shadow-sm transition-all whitespace-nowrap active:scale-95 ${showResolved ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            {showResolved ? <EyeOff size={14} /> : <Eye size={14} />}{showResolved ? "Hide Resolved" : "Resolved Items"}
          </button>
        </div>
      </div>

      {/* CATEGORY PILLS */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map(cat => {
            const isActive = categoryFilter === cat;
            return (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                    className={`text-[10px] font-bold px-4 py-2 rounded-xl border transition-all uppercase tracking-widest ${isActive ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-105" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:border-slate-300"}`}>
                    {cat}{cat !== "All" && <span className={`ml-2 opacity-60 ${isActive ? "text-white" : "text-slate-400"}`}>{ALERT_DATA.filter(a => a.category === cat).length}</span>}
                </button>
            );
        })}
      </div>

      {/* GROUPED ALERTS */}
      {Object.keys(grouped).length === 0 && (
        <div className="bg-white border border-slate-100 rounded-[32px] p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-2">Protocol All Clear</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">No alerts match your current filters. Your sales pipeline is operating within expected parameters.</p>
          <button onClick={() => { setCategoryFilter("All"); setSeverityFilter("All Severity"); setQuery(""); }} className="mt-8 text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline">Reset Filters</button>
        </div>
      )}

      <div className="space-y-12 pb-20">
        {Object.entries(grouped).map(([cat, alerts]: [any, any]) => {
            const CatIcon = CAT_ICONS[cat as keyof typeof CAT_ICONS] || AlertCircle;
            const highItems = alerts.filter((a: any) => a.severity === "HIGH").length;
            return (
            <div key={cat} className="animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex items-center justify-between mb-5 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                            <CatIcon size={16} />
                        </div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{cat}</h2>
                            <span className="h-4 w-px bg-slate-200" />
                            <span className="text-[11px] font-bold text-slate-400">{alerts.length} Trigger{alerts.length > 1 ? "s" : ""}</span>
                        </div>
                    </div>
                    {highItems > 0 && (
                        <span className="text-[9px] bg-orange-100 text-orange-600 px-3 py-0.5 rounded-full font-black uppercase tracking-widest border border-orange-200">{highItems} Critical</span>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {alerts.map((alert: any) => <AlertCard key={alert.id} alert={alert} onIgnore={handleIgnore} />)}
                </div>
            </div>
            );
        })}
      </div>

      {/* BOTTOM CTA: SUMMARY */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-center relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-orange-500 to-red-500" />
        <ArrowUp className="w-10 h-10 text-blue-400 mx-auto mb-4 opacity-50" />
        <p className="text-2xl font-bold text-white mb-2 tracking-tight tracking-tight">Systematic Recovery — Initiated</p>
        <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Every risk identified above has a defined protocol for resolution. By systematically addressing these alerts, we can recover an estimated <span className="text-white font-bold">₹8.4L</span> in blocked or at-risk revenue this cycle.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-2xl text-sm transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                Generate Full Protocol Audit
            </button>
            <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-bold px-10 py-4 rounded-2xl text-sm transition-all active:scale-95 border border-white/10">
                Ignore Minor Items
            </button>
        </div>
      </div>
    </div>
  );
}