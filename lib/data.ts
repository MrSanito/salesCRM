export const PIPELINE_STAGES = [
  "New", "Contacted", "Proposal", "Negotiation", "Won", "Lost"
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
    status: "Contacted", subStatus: "Meeting confirmed", value: "₹6,50,000", 
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
  { id: 1007, initials: "AJ", name: "Anil Jain", company: "Jain Logistics", status: "New", subStatus: "Meeting confirmed", value: "₹4,50,000", owner: "Vikram Rao", priority: "High", date: "Today, 12:00 PM", primaryMobile: "+91 98123 45678", email: "anil.jain@jainlogistics.com", interestedIn: "Fleet Management", source: "Email", lastActivity: "Inquiry Received", createdOn: "May 15, 08:30 AM" },
  { id: 1008, initials: "MS", name: "Megha Shah", company: "Shah Textiles", status: "Contacted", subStatus: "Meeting confirmed", value: "₹3,20,000", owner: "Neha Singh", priority: "Medium", date: "Tomorrow, 02:00 PM", primaryMobile: "+91 98234 56789", email: "megha.shah@shahtextiles.com", interestedIn: "E-commerce ERP", source: "Meta", lastActivity: "Meeting Confirmed", createdOn: "May 16, 02:15 PM" },
  { id: 1009, initials: "KP", name: "Karan Prasad", company: "Prasad Corp", status: "Proposal", subStatus: "No Response", value: "₹5,10,000", owner: "Arjun Mehta", priority: "High", date: "22 May, 11:30 AM", primaryMobile: "+91 98345 67890", email: "karan.p@prasadcorp.com", interestedIn: "Cloud Infrastructure", source: "WhatsApp", lastActivity: "Proposal Sent", createdOn: "May 10, 10:00 AM" },
  { id: 1010, initials: "SM", name: "Sanjay Mishra", company: "Mishra Global", status: "Negotiation", subStatus: "Meeting confirmed", value: "₹7,80,000", owner: "Vikram Rao", priority: "High", date: "Next Week, 10:00 AM", primaryMobile: "+91 98456 78901", email: "sanjay.m@mishraglobal.com", interestedIn: "AI Analytics", source: "Email", lastActivity: "Contract in Review", createdOn: "May 12, 01:20 PM" },
  { id: 1011, initials: "DB", name: "Deepak Bajaj", company: "Bajaj Motors", status: "Won", subStatus: "Meeting confirmed", value: "₹12,40,000", owner: "Pooja Mehta", priority: "High", date: "Completed", primaryMobile: "+91 98567 89012", email: "deepak.b@bajajmotors.in", interestedIn: "Full Stack CRM", source: "Manual", lastActivity: "Order Confirmed", createdOn: "Apr 20, 09:45 AM" },
  { id: 1012, initials: "RT", name: "Riya Thakur", company: "Thakur Designs", status: "Contacted", subStatus: "No Response", value: "₹1,50,000", owner: "Neha Singh", priority: "Low", date: "Today, 05:00 PM", primaryMobile: "+91 98678 90123", email: "riya.t@thakurdesigns.com", interestedIn: "UI/UX Audit", source: "Meta", lastActivity: "Follow-up Scheduled", createdOn: "May 18, 11:00 AM" },
  { id: 1013, initials: "AS", name: "Arvind Swamy", company: "Swamy Exports", status: "New", subStatus: "Budget Issue", value: "₹6,20,000", owner: "Arjun Mehta", priority: "Medium", date: "Tomorrow, 09:30 AM", primaryMobile: "+91 98789 01234", email: "arvind@swamyexports.com", interestedIn: "Export ERP", source: "WhatsApp", lastActivity: "Form Submitted", createdOn: "May 19, 04:30 PM" },
  { id: 1014, initials: "JN", name: "Jyoti Nair", company: "Nair Healthcare", status: "Proposal", subStatus: "Meeting confirmed", value: "₹4,10,000", owner: "Vikram Rao", priority: "High", date: "25 May, 03:00 PM", primaryMobile: "+91 98890 12345", email: "jyoti@nairhealth.com", interestedIn: "Patient Portal", source: "Manual", lastActivity: "Information Requested", createdOn: "May 14, 02:00 PM" },
  { id: 1015, initials: "RG", name: "Rohan Gupta", company: "Gupta Electronics", status: "Contacted", subStatus: "Budget Issue", value: "₹2,95,000", owner: "Neha Singh", priority: "Low", date: "Next Week", primaryMobile: "+91 98901 23456", email: "rohan@guptaelectronics.in", interestedIn: "POS System", source: "Email", lastActivity: "Price Check", createdOn: "May 11, 09:00 AM" },
  { id: 1016, initials: "SK", name: "Sunil Kothari", company: "Kothari Gems", status: "Negotiation", subStatus: "Meeting confirmed", value: "₹9,30,000", owner: "Arjun Mehta", priority: "High", date: "Tomorrow, 12:30 PM", primaryMobile: "+91 99012 34567", email: "sunil@kotharigems.com", interestedIn: "Inventory Mobile App", source: "Meta", lastActivity: "Demo Completed", createdOn: "May 08, 11:45 AM" },
  { id: 1017, initials: "BM", name: "Bina Malik", company: "Malik Foods", status: "Won", subStatus: "Meeting confirmed", value: "₹5,50,000", owner: "Pooja Mehta", priority: "Medium", date: "Completed", primaryMobile: "+91 99123 45678", email: "bina@malikfoods.com", interestedIn: "Supply Chain CRM", source: "WhatsApp", lastActivity: "Contract Signed", createdOn: "Apr 15, 03:30 PM" },
  { id: 1018, initials: "HC", name: "Harish Chawla", company: "Chawla Steels", status: "Contacted", subStatus: "No Response", value: "₹4,75,000", owner: "Vikram Rao", priority: "High", date: "Today, 06:15 PM", primaryMobile: "+91 99234 56789", email: "harish@chawlasteels.in", interestedIn: "Manufacturing ERP", source: "Manual", lastActivity: "Initial Call", createdOn: "May 17, 10:15 AM" },
  { id: 1019, initials: "SD", name: "Sangeeta Devi", company: "Devi Organics", status: "Contacted", subStatus: "Meeting confirmed", value: "₹1,80,000", owner: "Neha Singh", priority: "Low", date: "Tomorrow, 10:45 AM", primaryMobile: "+91 99345 67890", email: "sangeeta@deviorganics.com", interestedIn: "Retail CRM", source: "Email", lastActivity: "Follow-up Sent", createdOn: "May 19, 01:00 PM" },
  { id: 1020, initials: "RM", name: "Rakesh Maurya", company: "Maurya Infra", status: "Won", subStatus: "Meeting confirmed", value: "₹15,00,000", owner: "Arjun Mehta", priority: "High", date: "Completed", primaryMobile: "+91 99456 78901", email: "rakesh@mauryainfra.com", interestedIn: "Enterprise Real Estate Solution", source: "Meta", lastActivity: "Project Launch", createdOn: "Mar 10, 09:00 AM" },
  { id: 1021, initials: "LS", name: "Lata Singh", company: "Singh & Singh", status: "New", subStatus: "Budget Issue", value: "₹3,40,000", owner: "Vikram Rao", priority: "Medium", date: "Next Week", primaryMobile: "+91 99567 89012", email: "lata@singhllp.com", interestedIn: "Legal CRM", source: "WhatsApp", lastActivity: "Lead Created", createdOn: "May 20, 08:00 AM" },
  { id: 1022, initials: "AM", name: "Aditya Mehra", company: "Mehra Solns", status: "Proposal", subStatus: "No Response", value: "₹4,25,000", owner: "Neha Singh", priority: "High", date: "24 May, 05:00 PM", primaryMobile: "+91 99678 90123", email: "aditya@mehrasolns.in", interestedIn: "Cloud Dashboard", source: "Manual", lastActivity: "Proposal Pending", createdOn: "May 15, 11:30 AM" },
  { id: 1023, initials: "TN", name: "Tanvi Nair", company: "Nair Creative", status: "Contacted", subStatus: "Meeting confirmed", value: "₹2,10,000", owner: "Arjun Mehta", priority: "Low", date: "Tomorrow, 04:00 PM", primaryMobile: "+91 99789 01234", email: "tanvi@naircreative.com", interestedIn: "Portfolio CMS", source: "Email", lastActivity: "Call Scheduled", createdOn: "May 19, 05:45 PM" },
  { id: 1024, initials: "GS", name: "Gaurav Sen", company: "Sen FinTech", status: "won", subStatus: "Meeting confirmed", value: "₹11,00,000", owner: "Pooja Mehta", priority: "High", date: "Completed", primaryMobile: "+91 99890 12345", email: "gaurav@senfintech.com", interestedIn: "Payment Gateway Integration", source: "Meta", lastActivity: "Integration Finished", createdOn: "Apr 05, 10:15 AM" },
  { id: 1025, initials: "BV", name: "Bhuvan Ved", company: "Ved Agros", status: "Negotiation", subStatus: "Meeting confirmed", value: "₹6,80,000", owner: "Vikram Rao", priority: "High", date: "Today, 07:00 PM", primaryMobile: "+91 99901 23456", email: "bhuvan@vedagros.in", interestedIn: "Agro Supply Management", source: "WhatsApp", lastActivity: "Price Negotiation", createdOn: "May 13, 03:45 PM" },
  { id: 1026, initials: "CK", name: "Chetan Kohli", company: "Kohli Sports", status: "New", subStatus: "No Response", value: "₹1,20,000", owner: "Neha Singh", priority: "Low", date: "Tomorrow, 11:30 AM", primaryMobile: "+91 99012 34568", email: "chetan@kohlisports.com", interestedIn: "Inventory Lite", source: "Manual", lastActivity: "Email Follow-up", createdOn: "May 20, 09:15 AM" },
];
export const PIPELINE_FLOW_STATS = [
  { label: "New", count: 245, value: "₹18,40,000", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Contacted", count: 310, value: "₹24,60,000", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
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
