"use client"
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import DashboardView from "@/components/dashboard/DashboardView";
import ModulePlaceholder from "@/components/dashboard/ModulePlaceholder";
import LeadDetailModal from "@/components/dashboard/LeadDetailModal";
import UpdateIntelligenceModal from "@/components/dashboard/UpdateIntelligenceModal";
import AddLeadModal from "@/components/dashboard/AddLeadModal";
import { ALL_LEADS } from "@/lib/data";

export default function SalesPortal() {
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter logic for displayed leads (used for modal switching)
  const displayedLeads = activeNav === "Alerts" 
    ? ALL_LEADS.filter(l => l.priority === "High" || l.status === "New") 
    : ALL_LEADS;

  const selectedLead = ALL_LEADS.find(l => l.id === selectedLeadId);

  const openLeadModal = (id: number) => {
    setSelectedLeadId(id);
    setIsModalLoading(true);
    setTimeout(() => {
      setIsModalLoading(false);
    }, 1500);
  };

  const switchLead = (dir: 'next' | 'prev') => {
    if (selectedLeadId === null) return;
    const currentIndex = displayedLeads.findIndex(l => l.id === selectedLeadId);
    let newIndex = dir === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex < 0) newIndex = displayedLeads.length - 1;
    if (newIndex >= displayedLeads.length) newIndex = 0;
    
    setSelectedLeadId(displayedLeads[newIndex].id);
    setIsModalLoading(true);
    setTimeout(() => {
      setIsModalLoading(false);
    }, 1000);
  };

  // Content Router
  const renderContent = () => {
    switch (activeNav) {
      case "Dashboard":
        return (
          <DashboardView 
            onAddLead={() => setIsAddModalOpen(true)} 
            onLeadClick={openLeadModal}
            activeNav={activeNav}
          />
        );
      case "Alerts":
        // Returning dummy as requested: "just keep dummy alert tab in middle it should say alert tab"
        return <ModulePlaceholder title="Alerts" />;
      default:
        // Use placeholder for all other sidebar elements as requested
        return <ModulePlaceholder title={activeNav} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      {/* ── Top Navbar ── */}
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <Sidebar 
          activeNav={activeNav} 
          setActiveNav={setActiveNav} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
        />

        {/* ── Main Dashboard Content ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* ── Overlays and Modals (Global) ── */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          isLoading={isModalLoading} 
          onClose={() => setSelectedLeadId(null)}
          onSwitch={switchLead}
          onUpdateClick={() => setIsUpdateModalOpen(true)}
        />
      )}

      {isUpdateModalOpen && (
        <UpdateIntelligenceModal 
          onClose={() => setIsUpdateModalOpen(false)} 
        />
      )}

      {isAddModalOpen && (
        <AddLeadModal 
          onClose={() => setIsAddModalOpen(false)} 
        />
      )}
    </div>
  );
}