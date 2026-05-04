"use client"
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardView from "@/components/dashboard/DashboardView";
import CustomProtocolView from "@/components/dashboard/CustomProtocolView";
import LeadDetailModal from "@/components/dashboard/LeadDetailModal";
import AddLeadModal from "@/components/dashboard/AddLeadModal";
import AddEmployeeModal from "@/components/dashboard/AddEmployeeModal";
import AddLeadChoiceModal from "@/components/dashboard/AddLeadChoiceModal";
import ImportExcelModal from "@/components/dashboard/ImportExcelModal";

export interface SidebarFilterConfig {
  id: string;
  name: string;
  status: string | null;
  subStatus: string | null;
  dealSizeMin: string | null;
  dealSizeMax: string | null;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const sfId = searchParams.get("sf");
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilterConfig | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

  // Fetch sidebar filter config when ?sf= is present
  useEffect(() => {
    if (sfId) {
      fetch("/api/sidebar-filters")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const found = data.find((f: any) => f.id === sfId);
            setSidebarFilter(found || null);
          }
        })
        .catch(console.error);
    } else {
      setSidebarFilter(null);
    }
  }, [sfId]);

  // Handle ?id= to open lead detail automatically (Global Search)
  useEffect(() => {
    const leadId = searchParams.get("id");
    if (leadId) {
      setSelectedLeadId(leadId);
    }
  }, [searchParams]);

  return (
    <>
      {sidebarFilter ? (
        <CustomProtocolView 
          filter={sidebarFilter} 
          onLeadClick={(id, allIds) => openLeadModal(id, allIds)}
          refreshKey={refreshKey}
        />
      ) : (
        <DashboardView
          onAddLead={() => setIsAddChoiceModalOpen(true)}
          onAddEmployee={() => setIsAddEmployeeModalOpen(true)}
          onLeadClick={(id, allIds) => openLeadModal(id, allIds)}
          activeNav="Dashboard"
          refreshKey={refreshKey}
          sidebarFilter={sidebarFilter}
        />
      )}

      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          isLoading={isModalLoading}
          onClose={() => setSelectedLeadId(null)}
          onSwitch={switchLead}
          onUpdate={triggerRefresh}
        />
      )}


      {isAddChoiceModalOpen && (
        <AddLeadChoiceModal 
          onClose={() => setIsAddChoiceModalOpen(false)}
          onFormChoice={() => setIsAddModalOpen(true)}
          onExcelChoice={() => setIsImportModalOpen(true)}
        />
      )}

      {isImportModalOpen && (
        <ImportExcelModal 
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={triggerRefresh}
        />
      )}

      {isAddModalOpen && (
        <AddLeadModal onClose={() => setIsAddModalOpen(false)} onSuccess={triggerRefresh} />
      )}

      {isAddEmployeeModalOpen && (
        <AddEmployeeModal onClose={() => setIsAddEmployeeModalOpen(false)} />
      )}
    </>
  );
}
