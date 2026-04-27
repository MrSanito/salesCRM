"use client";

import { useState } from "react";
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
  const { user, logout } = useAuth();

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
            className="pl-8 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400 transition-all"
            placeholder="Search by name, company, phone..."
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] drop-shadow-sm font-medium text-slate-400 bg-slate-200 rounded px-1">⌘K</span>
        </div>

        {/* Mobile Search Icon */}
        <button className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <Search size={18} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-1.5 rounded-lg transition-colors ${showNotifications ? "bg-slate-100 text-slate-800" : "hover:bg-slate-100 text-slate-500"}`}
          >
            <Bell size={18} className="sm:w-4 sm:h-4" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold border-2 border-white">
              5
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

