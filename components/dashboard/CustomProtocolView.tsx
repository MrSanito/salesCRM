"use client"
import LeadsTable from "@/components/dashboard/LeadsTable";

interface SidebarFilter {
  id: string;
  name: string;
  statuses: string[];
  subStatuses: string[];
  dealSizeMin: string | null;
  dealSizeMax: string | null;
  industries: string[];
  sources: string[];
  alphabet: string | null;
  color?: string;
}

interface CustomProtocolViewProps {
  filter: SidebarFilter;
  onLeadClick: (id: string, allIds?: string[]) => void;
  refreshKey?: number;
}

export default function CustomProtocolView({ filter, onLeadClick, refreshKey }: CustomProtocolViewProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-slate-50/50 pt-6">
      <LeadsTable
        activeNav={filter.name}
        onLeadClick={onLeadClick}
        refreshKey={refreshKey}
        sidebarFilter={filter}
      />
    </div>
  );
}