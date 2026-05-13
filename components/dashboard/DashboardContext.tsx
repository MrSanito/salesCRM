"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

interface DashboardStats {
  kpis: {
    totalLeads: number;
    newLeadsThisWeek: number;
    followUpsDueToday: number;
    wonDeals: number;
    totalPipelineValue: number;
    alertsCount: number;
    newLeadsCount: number;
    followUpsTotal: number;
  };
  pipeline: any[];
}

interface CustomFilter {
  id: string;
  name: string;
  color: string;
  statuses: string[];
  subStatuses: string[];
  industries: string[];
  sources: string[];
  dealSizeMin: string | null;
  dealSizeMax: string | null;
  alphabet: string | null;
}

interface DashboardContextType {
  stats: DashboardStats | null;
  filters: CustomFilter[];
  loading: boolean;
  refresh: (force?: boolean) => Promise<void>;
  refreshKey: number;
  triggerRefresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [filters, setFilters] = useState<CustomFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const pathname = usePathname();

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetch < 10000) return; // Throttled to 10s

    setLastFetch(now);
    try {
      const [statsRes, filtersRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/sidebar-filters")
      ]);
      
      const statsData = await statsRes.json();
      const filtersData = await filtersRes.json();
      
      setStats(statsData);
      if (Array.isArray(filtersData)) setFilters(filtersData);
    } catch (err) {
      console.error("DashboardContext fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [lastFetch]);

  useEffect(() => {
    fetchData();
  }, [pathname, refreshKey]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <DashboardContext.Provider value={{ 
      stats, 
      filters, 
      loading, 
      refresh: fetchData, 
      refreshKey,
      triggerRefresh 
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
