import {
  Bell, Search, ChevronDown, Users, UserPlus, Phone, Trophy,
  Snowflake, TrendingDown, IndianRupee, LayoutDashboard,
  AlertTriangle, CheckCircle2, FileText,
  CalendarCheck, XCircle, BarChart2, Activity, PieChart,
  Settings, Users2, Puzzle, Mail, MessageCircle, RefreshCcw
} from "lucide-react";

export const SIDEBAR_ITEMS = [
  {
    items: [
      { icon: AlertTriangle, label: "Alerts", badge: 5, badgeColor: "bg-red-500" },
      { icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    section: "LEADS",
    items: [
      { icon: UserPlus, label: "New Leads", badge: 32, badgeColor: "bg-blue-500" },
      { icon: Phone, label: "Follow Ups", badge: 18, badgeColor: "bg-orange-500" },
      { icon: CheckCircle2, label: "Closed Won" },
      { icon: FileText, label: "Proposed" },
      { icon: CalendarCheck, label: "Meeting Set" },
      { icon: XCircle, label: "Closed Lost" },
    ],
  },
];

export const KPI_CARDS = [
  {
    label: "Total Leads",
    value: "1,234",
    change: "+18.6%",
    sub: "vs last 30 days",
    up: true,
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    label: "New Leads (This Week)",
    value: "245",
    change: "+12.4%",
    sub: "vs last week",
    up: true,
    icon: UserPlus,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
  },
  {
    label: "Follow Ups",
    value: "18",
    change: "+5.2%",
    sub: "due today",
    up: true,
    icon: Phone,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    label: "Won Deals",
    value: "32",
    change: "+23.1%",
    sub: "vs last 30 days",
    up: true,
    icon: Trophy,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
  {
    label: "Cold Leads",
    value: "87",
    change: "-4.3%",
    sub: "vs last 30 days",
    up: false,
    icon: Snowflake,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-400",
  },
  {
    label: "Inbound Leads",
    value: "156",
    change: "+9.8%",
    sub: "vs last 30 days",
    up: true,
    icon: TrendingDown,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
  },
  {
    label: "Pipeline Value",
    value: "₹1.68 Cr",
    change: "+15.7%",
    sub: "vs last 30 days",
    up: true,
    icon: IndianRupee,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    wide: true,
  },
];

export const PIPELINE_STAGES = [
  { label: "New", count: 245, value: "₹18,40,000", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Contacted", count: 310, value: "₹24,60,000", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { label: "Qualified", count: 210, value: "₹36,75,000", color: "bg-teal-100 text-teal-700 border-teal-200" },
  { label: "Proposal Sent", count: 128, value: "₹28,20,000", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "Negotiation", count: 62, value: "₹16,80,000", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "Won", count: 32, value: "₹14,50,000", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "Lost", count: 45, value: "₹6,10,000", color: "bg-red-100 text-red-700 border-red-200" },
];

export const REMINDERS = [
  {
    icon: MessageCircle,
    iconColor: "text-green-500 bg-green-50",
    name: "Call Mr. Rohit Sharma",
    time: "Today, 03:00 PM",
    company: "Sharma Industries",
  },
  {
    icon: Phone,
    iconColor: "text-blue-500 bg-blue-50",
    name: "Follow up with Priya Patel",
    time: "Today, 04:30 PM",
    company: "Patel & Co.",
  },
  {
    icon: Mail,
    iconColor: "text-purple-500 bg-purple-50",
    name: "Send proposal to Amit Kumar",
    time: "Tomorrow, 11:00 AM",
    company: "Kumar Enterprises",
  },
];

export const ALL_LEADS = [
  { initials: "RS", name: "Rohit Sharma", company: "Sharma Industries", stage: "Negotiation", value: "₹4,20,000", owner: "Arjun Mehta", priority: "High", date: "Today, 03:00 PM" },
  { initials: "PP", name: "Priya Patel", company: "Patel & Co.", stage: "Proposal Sent", value: "₹2,80,000", owner: "Neha Singh", priority: "High", date: "Today, 04:30 PM" },
  { initials: "AK", name: "Amit Kumar", company: "Kumar Enterprises", stage: "Qualified", value: "₹6,50,000", owner: "Vikram Rao", priority: "Medium", date: "Tomorrow, 11:00 AM" },
  { initials: "SC", name: "Sneha Choudhary", company: "Choudhary Solutions", stage: "Contacted", value: "₹1,90,000", owner: "Neha Singh", priority: "Medium", date: "Tomorrow, 03:30 PM" },
  { initials: "VS", name: "Vikas Singh", company: "Singh Traders", stage: "New", value: "₹3,10,000", owner: "Arjun Mehta", priority: "Low", date: "14 May, 10:00 AM" },
  { initials: "RV", name: "Rahul Verma", company: "Verma Tech", stage: "Won", value: "₹8,75,000", owner: "Pooja Mehta", priority: "High", date: "13 May, 02:00 PM" },
  { initials: "NK", name: "Nisha Kapoor", company: "Kapoor & Sons", stage: "Closed Lost", value: "₹2,30,000", owner: "Arjun Mehta", priority: "Low", date: "12 May, 09:00 AM" },
];

export const priorityStyle = {
  High: "bg-red-50 text-red-600 border border-red-200",
  Medium: "bg-amber-50 text-amber-600 border border-amber-200",
  Low: "bg-green-50 text-green-600 border border-green-200",
};

export const stageStyle = {
  New: "bg-blue-50 text-blue-600",
  Contacted: "bg-cyan-50 text-cyan-600",
  Qualified: "bg-teal-50 text-teal-700",
  "Proposal Sent": "bg-amber-50 text-amber-700",
  Negotiation: "bg-orange-50 text-orange-600",
  Won: "bg-green-50 text-green-700",
  "Closed Lost": "bg-red-50 text-red-600",
};

export const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-green-100 text-green-700",
];
