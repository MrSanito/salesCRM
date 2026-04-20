import { Search, Bell, ChevronDown, Menu } from "lucide-react";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
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
        <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
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

        {/* Mobile Search Icon (only visible on mobile) */}
        <button className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button className="relative p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <Bell size={18} className="sm:w-4 sm:h-4" />
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold border-2 border-white">
            6
          </span>
        </button>

        {/* User Profile */}
        <button className="flex items-center gap-2 pl-1 sm:pl-2 pr-1 sm:pr-3 py-1 rounded-lg hover:bg-slate-100 sm:border border-slate-200 transition-colors">
          <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-white text-[10px] sm:text-[9px] font-bold">AM</span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[12px] font-medium text-slate-700 leading-tight">Arjun Mehta</p>
            <p className="text-[10px] text-slate-500 leading-tight">Sales Owner</p>
          </div>
          <ChevronDown size={12} className="text-slate-400 ml-1 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
