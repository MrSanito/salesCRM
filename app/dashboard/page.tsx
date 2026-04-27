"use client"
import { useState } from "react";
import DashboardView from "@/components/dashboard/DashboardView";
import LeadDetailModal from "@/components/dashboard/LeadDetailModal";
import UpdateIntelligenceModal from "@/components/dashboard/UpdateIntelligenceModal";
import AddLeadModal from "@/components/dashboard/AddLeadModal";
import AddEmployeeModal from "@/components/dashboard/AddEmployeeModal";
import { ALL_LEADS } from "@/lib/data";

export default function DashboardPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);

  const displayedLeads = ALL_LEADS;
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

  return (
    <>
      <DashboardView 
        onAddLead={() => setIsAddModalOpen(true)} 
        onAddEmployee={() => setIsAddEmployeeModalOpen(true)}
        onLeadClick={openLeadModal}
        activeNav="Dashboard"
      />

      {/* ── Overlays and Modals ── */}
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

      {isAddEmployeeModalOpen && (
        <AddEmployeeModal 
          onClose={() => setIsAddEmployeeModalOpen(false)} 
        />
      )}
    </>
  );
}
