"use client"
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // If not loading and no user, don't show anything (AuthContext will redirect)
  if (!loading && !user) return null;
  
  // Map pathname to activeNav label
  const getActiveNav = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/dashboard/team") return "Team";
    if (pathname === "/dashboard/alerts") return "Alerts";
    if (pathname === "/dashboard/users") return "Users";
    if (pathname === "/dashboard/leads") return "New Leads";
    if (pathname === "/dashboard/follow-ups") return "Follow Ups";
    return "Dashboard";
  };

  const activeNav = getActiveNav();

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      {/* ── Top Navbar ── */}
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} activeNav={activeNav} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <Sidebar 
          activeNav={activeNav} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
        />

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
