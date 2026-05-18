"use client"
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardView from "@/components/dashboard/DashboardView";
import CustomProtocolView from "@/components/dashboard/CustomProtocolView";
import dynamic from "next/dynamic";

// Lazy-load heavy modal components to reduce initial JS bundle
const LeadDetailModal = dynamic(() => import("@/components/dashboard/LeadDetailModal"), { ssr: false });
const AddLeadModal = dynamic(() => import("@/components/dashboard/AddLeadModal"), { ssr: false });
const AddEmployeeModal = dynamic(() => import("@/components/dashboard/AddEmployeeModal"), { ssr: false });
const AddLeadChoiceModal = dynamic(() => import("@/components/dashboard/AddLeadChoiceModal"), { ssr: false });
const ImportExcelModal = dynamic(() => import("@/components/dashboard/ImportExcelModal"), { ssr: false });

export interface SidebarFilterConfig {
  id: string;
  name: string;
  statuses: string[];
  subStatuses: string[];
  dealSizeMin: string | null;
  dealSizeMax: string | null;
  industries: string[];
  sources: string[];
  alphabet: string | null;
}

import { useDashboard } from "@/components/dashboard/DashboardContext";

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const sfId = searchParams.get("sf");
  const { filters: customFilters, refreshKey, triggerRefresh } = useDashboard();
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilterConfig | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);

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

  // Sync sidebarFilter from customFilters
  useEffect(() => {
    if (sfId && customFilters.length > 0) {
      const found = customFilters.find((f: any) => f.id === sfId);
      setSidebarFilter(found || null);
    } else {
      setSidebarFilter(null);
    }
  }, [sfId, customFilters]);

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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Loading CRM Dashboard...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
