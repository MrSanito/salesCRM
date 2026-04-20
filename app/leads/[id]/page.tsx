"use client"
import { useState } from "react";
import { 
  ChevronLeft, ChevronRight, ArrowLeft, Phone, Mail, 
  Calendar, Clock, User, Building2, Tag, 
  MessageSquare, History, ExternalLink, MoreVertical,
  Briefcase, Globe, Database, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LeadDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const leadId = params.id;

  // Mock Lead Data
  const lead = {
    id: `LD-${1000 + parseInt(leadId)}`,
    name: "Arjun Mehta",
    company: "Mehta Industrial Solutions",
    phone: "+91 98765 43210",
    secondaryPhone: "+91 98765 99999",
    email: "arjun@mehtasolutions.com",
    secondaryEmail: "contact@mehtasolutions.com",
    createdOn: "Mar 24, 2024",
    source: "Direct Referral",
    lastActivity: "2 hours ago",
    lastCommunicated: "Yesterday, 04:30 PM",
    productInterested: "Enterprise CRM Suite v2",
    latestNote: "Client is interested in bulk licensing for their sales team of 50+. Requested a demo for next Thursday.",
    status: "Qualified",
    subStatus: "Proposal Sent",
    owner: "Siddharth Malhotra",
    priority: "High"
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Top Navigation / Header ── */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className="h-6 w-[1px] bg-slate-200 mx-2" />
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-bold text-slate-900 font-mono tracking-tight">{lead.id}</span>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                {lead.status}
              </span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-all">
                Update Status
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ── Left Column: Detailed Info ── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Lead Primary Profile */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{lead.name}</h1>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Building2 size={18} />
                    <span className="text-lg font-medium">{lead.company}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Owner</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">SM</div>
                    <span className="text-sm font-bold text-slate-900">{lead.owner}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                {/* Contact Section */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Contact Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Phone size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile</p>
                        <p className="text-sm font-bold text-slate-900">{lead.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group cursor-pointer grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Phone size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secondary Phone</p>
                        <p className="text-sm font-bold text-slate-900 font-mono">{lead.secondaryPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email ID</p>
                        <p className="text-sm font-bold text-slate-900">{lead.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group cursor-pointer grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secondary Email</p>
                        <p className="text-sm font-bold text-slate-900">{lead.secondaryEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engagement Section */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Lead Intelligence</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Briefcase size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interested Service</p>
                        <p className="text-sm font-bold text-slate-900">{lead.productInterested}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Globe size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Source</p>
                        <p className="text-sm font-bold text-slate-900">{lead.source}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Tag size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub-Status</p>
                        <p className="text-sm font-bold text-slate-900">{lead.subStatus}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                        <History size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created On</p>
                        <p className="text-sm font-bold text-slate-900 font-mono">{lead.createdOn}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timelines / Activity Logging */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare size={20} className="text-blue-600" />
                  Latest Activity Log
                </h3>
                <button className="text-blue-600 text-sm font-bold hover:underline">View History</button>
              </div>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                   <Clock size={18} className="text-slate-400" />
                 </div>
                 <div className="flex-1">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lead.lastActivity}</span>
                     <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">NOTE</span>
                   </div>
                   <p className="text-slate-700 leading-relaxed font-medium">{lead.latestNote}</p>
                 </div>
              </div>
              <div className="mt-6 flex gap-3">
                <input 
                  type="text" 
                  placeholder="Add a quick note..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                  Log Activity
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Column: Metadata & Quick Actions ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-900 px-6 py-4">
                <h3 className="text-white text-xs font-bold uppercase tracking-[0.2em]">Quick Metrics</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-sm font-semibold text-slate-400">Last Communicated</span>
                  <span className="text-sm font-bold text-slate-700">{lead.lastCommunicated}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-sm font-semibold text-slate-400">Response Rate</span>
                  <span className="text-sm font-bold text-green-600">High (85%)</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-semibold text-slate-400">Lead Health</span>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    Stable
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
               <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Associated Tasks</h3>
               <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="w-5 h-5 rounded border border-slate-300 bg-white" />
                   <span className="text-sm font-medium text-slate-700">Follow up on pricing</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="w-5 h-5 rounded border border-slate-300 bg-white" />
                   <span className="text-sm font-medium text-slate-700">Send enterprise demo link</span>
                 </div>
               </div>
               <button className="w-full mt-4 py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all">
                 + Add Task
               </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
