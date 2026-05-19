"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
  googleConnected: boolean;
  setGoogleConnected: React.Dispatch<React.SetStateAction<boolean>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [filters, setFilters] = useState<CustomFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const lastFetchRef = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const pathname = usePathname();

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 10000) return; // Throttled to 10s

    lastFetchRef.current = now;
    try {
      const [statsRes, filtersRes, googleRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/sidebar-filters"),
        fetch("/api/integrations/google/status").catch(() => null)
      ]);
      
      const statsData = await statsRes.json();
      const filtersData = await filtersRes.json();
      
      setStats(statsData);
      if (Array.isArray(filtersData)) setFilters(filtersData);

      if (googleRes && googleRes.ok) {
        const googleData = await googleRes.json();
        setGoogleConnected(!!googleData?.isConnected);
      }
    } catch (err) {
      console.error("DashboardContext fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, pathname, refreshKey]);

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
      triggerRefresh,
      googleConnected,
      setGoogleConnected
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
