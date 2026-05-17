export interface DbLead {
  id: string;
  contactName: string;
  company: string;
  industry: string | null;
  source: { name: string } | null;
  stage: string;
  subStatus: string;
  priority: string;
  dealValueInr: string;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  email2: string | null;
  city: string | null;
  state: string | null;
  followUpAt: string | null;
  requirement: string | null;
  createdAt: string;
  owner: { name: string; initials: string };
  lastCommunicatedAt?: string | null;
}

export type SortConfig = {
  key: keyof DbLead | 'lead';
  direction: 'asc' | 'desc';
} | null;

export const STAGE_STYLES: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-600",
  CONTACTED: "bg-cyan-50 text-cyan-600",
  NOT_INTERESTED: "bg-red-50 text-red-600",
  MEETING_SET: "bg-indigo-50 text-indigo-600",
  NEGOTIATION: "bg-amber-50 text-amber-700",
  COLD: "bg-slate-50 text-slate-600",
  CHATTING: "bg-slate-50 text-slate-600",
  CLIENT: "bg-blue-100 text-blue-700",
  WON: "bg-green-100 text-green-700",
};

export const STAGE_LABEL: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  NOT_INTERESTED: "Not Interested",
  MEETING_SET: "Meeting Set",
  NEGOTIATION: "Negotiation",
  COLD: "Cold/Chatting",
  CHATTING: "Cold/Chatting",
  CLIENT: "Client",
  WON: "Won",
};

export const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-50 text-red-600 border border-red-200",
  MEDIUM: "bg-amber-50 text-amber-600 border border-amber-200",
  LOW: "bg-green-50 text-green-600 border border-green-200",
};

export const SUB_STATUS_LABEL: Record<string, string> = {
  CHATTING: "Chatting",
  NOT_ANSWERED: "Not Answered",
  WRONG_NO: "Wrong No.",
  NO_REQUIREMENT: "No Requirement",
  BUDGET_LOW: "Budget Low",
  PROPOSAL_SENT: "Proposal Sent",
  WARM_LEAD: "Warm Lead",
  TEXTED: "Texted",
  BLANK: "Blank",
};

export const SUB_STATUS_STYLES: Record<string, string> = {
  CHATTING: "bg-green-50 text-green-700 border border-green-200",
  NOT_ANSWERED: "bg-amber-50 text-amber-700 border border-amber-200",
  WRONG_NO: "bg-red-50 text-red-700 border border-red-200",
  NO_REQUIREMENT: "bg-slate-100 text-slate-500 border border-slate-200",
  BUDGET_LOW: "bg-red-50 text-red-600 border border-red-100",
  PROPOSAL_SENT: "bg-blue-50 text-blue-600 border border-blue-100",
  WARM_LEAD: "bg-orange-50 text-orange-600 border border-orange-100",
  TEXTED: "bg-cyan-50 text-cyan-600 border border-cyan-100",
  BLANK: "bg-slate-50 text-slate-400 border border-slate-100",
};

export function formatValue(v: string) {
  const n = parseFloat(v);
  if (!n) return "—";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatFollowUp(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `Overdue (${Math.abs(diffDays)}d)`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
}
