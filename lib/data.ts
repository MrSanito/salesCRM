export const PIPELINE_STAGES = [
  "New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"
];

export const LEAD_SOURCES = [
  "Email", "Meta", "WhatsApp", "Manual"
];

export const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-50 text-red-600 border border-red-200",
  Medium: "bg-amber-50 text-amber-600 border border-amber-200",
  Low: "bg-green-50 text-green-600 border border-green-200",
};

export const STAGE_STYLES: Record<string, string> = {
  New: "bg-blue-50 text-blue-600",
  Contacted: "bg-cyan-50 text-cyan-600",
  Qualified: "bg-teal-50 text-teal-700",
  Proposal: "bg-amber-50 text-amber-700",
  Negotiation: "bg-orange-50 text-orange-600",
  Won: "bg-green-50 text-green-700",
  Lost: "bg-red-50 text-red-600",
};

export const SUB_STATUSES = [
  "Meeting confirmed", "No Response", "Budget Issue"
];

export const ALL_LEADS = [
  { 
    id: 1000, initials: "RS", name: "Rohit Sharma", company: "Sharma Industries", 
    status: "Negotiation", subStatus: "Meeting confirmed", value: "₹4,20,000", 
    owner: "Arjun Mehta", priority: "High", date: "Today, 03:00 PM", 
    primaryMobile: "+91 98765 43210", email: "rohit.sharma@sharmaindustries.com", 
    interestedIn: "Enterprise CRM", source: "Email", lastActivity: "Email Opened", 
    createdOn: "Mar 24, 10:30 AM",
    checklist: { contactVerified: true, requirementDefined: true, dataReceived: false, orderConfirmed: false, proposalSigned: false },
    contextSummary: {
      requirement: "Complete ERP migration from legacy system.",
      useCase: "Scaling production by 40% this year.",
      scope: "Modules for HR, Inventory, and Sales.",
      constraints: "Budget capped at ₹5L; Go-live by Q3.",
      drivers: "Speed and reliability are top priorities.",
      objections: "Initial setup fees are 20% higher than competitors.",
      commitments: "Free training sessions for first 10 users."
    }
  },
  { 
    id: 1001, initials: "PP", name: "Priya Patel", company: "Patel & Co.", 
    status: "Proposal", subStatus: "No Response", value: "₹2,80,000", 
    owner: "Neha Singh", priority: "High", date: "Today, 04:30 PM", 
    primaryMobile: "+91 91234 56780", email: "priya@patelco.in", 
    interestedIn: "Cloud Storage", source: "Meta", lastActivity: "Proposal Viewed", 
    createdOn: "Apr 02, 02:15 PM" 
  },
  { 
    id: 1002, initials: "AK", name: "Amit Kumar", company: "Kumar Enterprises", 
    status: "Qualified", subStatus: "Meeting confirmed", value: "₹6,50,000", 
    owner: "Vikram Rao", priority: "Medium", date: "Tomorrow, 11:00 AM", 
    primaryMobile: "+91 99887 76655", email: "amit.kumar@kumarent.com", 
    interestedIn: "Sales Automation", source: "WhatsApp", lastActivity: "Meeting Confirmed", 
    createdOn: "Apr 10, 11:00 AM" 
  },
  { 
    id: 1003, initials: "SC", name: "Sneha Choudhary", company: "Choudhary Solutions", 
    status: "Contacted", subStatus: "No Response", value: "₹1,90,000", 
    owner: "Neha Singh", priority: "Medium", date: "Tomorrow, 03:30 PM", 
    primaryMobile: "+91 98712 34567", email: "sneha.c@csolutions.com", 
    interestedIn: "Basic CRM", source: "Manual", lastActivity: "Requested Information", 
    createdOn: "Apr 15, 04:45 PM" 
  },
  { id: 1004, initials: "VS", name: "Vikas Singh", company: "Singh Traders", status: "New", subStatus: "Budget Issue", value: "₹3,10,000", owner: "Arjun Mehta", priority: "Low", date: "14 May, 10:00 AM", primaryMobile: "+91 88990 11223", email: "vikas.singh@singhtraders.in", interestedIn: "Inventory API", source: "Manual", lastActivity: "Form Submitted", createdOn: "May 13, 09:30 AM" },
  { id: 1005, initials: "RV", name: "Rahul Verma", company: "Verma Tech", status: "Won", subStatus: "Meeting confirmed", value: "₹8,75,000", owner: "Pooja Mehta", priority: "High", date: "13 May, 02:00 PM", primaryMobile: "+91 77665 54433", email: "rahul.v@vermatech.com", interestedIn: "Enterprise CRM", source: "Email", lastActivity: "Payment Received", createdOn: "Feb 10, 10:00 AM" },
  { id: 1006, initials: "NK", name: "Nisha Kapoor", company: "Kapoor & Sons", status: "Lost", subStatus: "Budget Issue", value: "₹2,30,000", owner: "Arjun Mehta", priority: "Low", date: "12 May, 09:00 AM", primaryMobile: "+91 99001 12233", email: "nisha.kapoor@kapoorsons.com", interestedIn: "Sales Automation", source: "Meta", lastActivity: "Unsubscribed", createdOn: "Mar 05, 03:20 PM" },
];
export const PIPELINE_FLOW_STATS = [
  { label: "New", count: 245, value: "₹18,40,000", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Contacted", count: 310, value: "₹24,60,000", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { label: "Qualified", count: 210, value: "₹36,75,000", color: "bg-teal-100 text-teal-700 border-teal-200" },
  { label: "Proposal", count: 128, value: "₹28,20,000", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "Negotiation", count: 62, value: "₹16,80,000", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "Won", count: 32, value: "₹14,50,000", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "Lost", count: 45, value: "₹6,10,000", color: "bg-red-100 text-red-700 border-red-200" },
];

export const REMINDERS = [
  {
    name: "Call Mr. Rohit Sharma",
    time: "Today, 03:00 PM",
    company: "Sharma Industries",
    type: "call"
  },
  {
    name: "Follow up with Priya Patel",
    time: "Today, 04:30 PM",
    company: "Patel & Co.",
    type: "followup"
  },
  {
    name: "Send proposal to Amit Kumar",
    time: "Tomorrow, 11:00 AM",
    company: "Kumar Enterprises",
    type: "email"
  },
];
