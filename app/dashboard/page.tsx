"use client"
import { useState } from "react";
import DashboardView from "@/components/dashboard/DashboardView";
import LeadDetailModal from "@/components/dashboard/LeadDetailModal";
import AddLeadModal from "@/components/dashboard/AddLeadModal";
import AddEmployeeModal from "@/components/dashboard/AddEmployeeModal";

export default function DashboardPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openLeadModal = (id: string, allIds?: string[]) => {
    setSelectedLeadId(id);
    if (allIds) setLeadIds(allIds);
    setIsModalLoading(true);
    setTimeout(() => setIsModalLoading(false), 600);
  };

  const switchLead = (dir: "next" | "prev") => {
    if (!selectedLeadId || leadIds.length === 0) return;
    const currentIndex = leadIds.indexOf(selectedLeadId);
    let newIndex = dir === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = leadIds.length - 1;
    if (newIndex >= leadIds.length) newIndex = 0;
    setSelectedLeadId(leadIds[newIndex]);
    setIsModalLoading(true);
    setTimeout(() => setIsModalLoading(false), 600);
  };

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <>
      <DashboardView
        onAddLead={() => setIsAddModalOpen(true)}
        onAddEmployee={() => setIsAddEmployeeModalOpen(true)}
        onLeadClick={(id, allIds) => openLeadModal(id, allIds)}
        activeNav="Dashboard"
        refreshKey={refreshKey}
      />

      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          isLoading={isModalLoading}
          onClose={() => setSelectedLeadId(null)}
          onSwitch={switchLead}
          onUpdate={triggerRefresh}
        />
      )}

      {isAddModalOpen && (
        <AddLeadModal onClose={() => setIsAddModalOpen(false)} />
      )}

      {isAddEmployeeModalOpen && (
        <AddEmployeeModal onClose={() => setIsAddEmployeeModalOpen(false)} />
      )}
    </>
  );
}
