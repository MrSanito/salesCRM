"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, ChevronDown, Menu, CheckCircle2, AlertCircle, Clock } from "lucide-react";
interface NavbarProps {
  onMenuClick?: () => void;
  activeNav?: string;
}

import { useAuth } from "@/components/auth/AuthContext";

export default function Navbar({ onMenuClick = () => {}, activeNav = "Dashboard" }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(r => r.json())
      .then(data => {
        if (data.kpis) setAlertsCount(data.kpis.alertsCount || 0);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const timeout = setTimeout(() => {
      fetch(`/api/leads?search=${searchQuery}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Filter locally just in case the API doesn't support search param yet
            const filtered = data.filter(l => 
              l.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.phone?.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 6);
            setSearchResults(filtered);
          }
        })
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-5 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick} 
          className="md:hidden p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">{activeNav}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="pl-8 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400 transition-all"
            placeholder="Search by name, company, phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] drop-shadow-sm font-medium text-slate-400 bg-slate-200 rounded px-1 pointer-events-none">⌘K</span>

          {/* Search Dropdown */}
          {showSearchResults && (searchQuery.length >= 2) && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setShowSearchResults(false)} />
              <div className="absolute left-0 top-full mt-2 w-[340px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Search</span>
                  {isSearching && <span className="text-[9px] font-bold text-blue-500 animate-pulse">Searching...</span>}
                </div>
                <div className="max-h-[400px] overflow-y-auto py-1">
                  {searchResults.length === 0 && !isSearching ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs font-semibold text-slate-400">No results for "{searchQuery}"</p>
                    </div>
                  ) : (
                    searchResults.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/dashboard/leads?id=${lead.id}`}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {lead.contactName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{lead.contactName}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{lead.company} • {lead.phone || "No phone"}</p>
                        </div>
                        <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                  <Link 
                    href="/dashboard/leads" 
                    onClick={() => setShowSearchResults(false)}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 rounded-lg transition-all"
                  >
                    View All Leads Pipeline <ChevronRight size={10} />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile Search Icon */}
        <button 
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Search size={18} />
        </button>

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-top duration-300">
            <div className="h-14 border-b border-slate-200 flex items-center px-4 gap-3">
              <button 
                onClick={() => {
                  setShowMobileSearch(false);
                  setSearchQuery("");
                }}
                className="p-1 text-slate-500"
              >
                <ChevronDown className="rotate-90" size={24} />
              </button>
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-0 placeholder:text-slate-400"
                  placeholder="Search leads, company, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {searchQuery.length >= 2 ? (
                <div className="p-2">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Results</span>
                    {isSearching && <span className="text-[9px] font-bold text-blue-500 animate-pulse">Searching...</span>}
                  </div>
                  {searchResults.length === 0 && !isSearching ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-bold text-slate-400 italic">No results for "{searchQuery}"</p>
                    </div>
                  ) : (
                    searchResults.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/dashboard/leads?id=${lead.id}`}
                        onClick={() => {
                          setShowMobileSearch(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 border-b border-slate-100"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                          {lead.contactName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">{lead.contactName}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{lead.company} • {lead.phone || "No phone"}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </Link>
                    ))
                  )}
                </div>
              ) : (
                <div className="px-8 py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-slate-300" size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Enter at least 2 characters</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-1.5 rounded-lg transition-colors ${showNotifications ? "bg-slate-100 text-slate-800" : "hover:bg-slate-100 text-slate-500"}`}
          >
            <Bell size={18} className="sm:w-4 sm:h-4" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold border-2 border-white">
              {alertsCount}
            </span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <p className="text-xs font-bold text-slate-800">Alerts</p>
                <button className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {[
                  { id: 1, type: 'warning', msg: 'Verify new phone number', time: '2h ago', bg: 'bg-orange-50', text: 'text-orange-600' },
                  { id: 2, type: 'success', msg: 'Summary saved successfully', time: '4h ago', bg: 'bg-green-50', text: 'text-green-600' },
                  { id: 3, type: 'info', msg: 'Vikram wants this lead', time: '1d ago', bg: 'bg-blue-50', text: 'text-blue-600' },
                  { id: 4, type: 'error', msg: 'Missed a follow-up call', time: '2d ago', bg: 'bg-red-50', text: 'text-red-600' },
                  { id: 5, type: 'info', msg: 'Add deal value now', time: '3d ago', bg: 'bg-blue-50', text: 'text-blue-600' }
                ].map(alert => (
                  <button key={alert.id} className="w-full text-left p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 flex gap-3">
                    <div className={`mt-0.5 w-6 h-6 rounded-full ${alert.bg} ${alert.text} flex items-center justify-center flex-shrink-0`}>
                      <AlertCircle size={12} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 tracking-tight">{alert.msg}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock size={10} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{alert.time}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-1 sm:pl-2 pr-1 sm:pr-3 py-1 rounded-lg hover:bg-slate-100 sm:border border-slate-200 transition-colors"
          >
            <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-[10px] sm:text-[9px] font-bold">{user?.initials || "U"}</span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[12px] font-medium text-slate-700 leading-tight">{user?.name || "Guest"}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{user?.role || "Designation"}</p>
            </div>
            <ChevronDown size={12} className="text-slate-400 ml-1 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <Link href="/dashboard/profile" className="block w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Profile Settings
              </Link>
              <Link href="/dashboard/team" className="block w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Team View
              </Link>
              <hr className="my-1 border-slate-100" />
              <button 
                onClick={logout}
                className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ChevronRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

