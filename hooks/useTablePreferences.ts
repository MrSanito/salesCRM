import { useState, useEffect } from "react";

export type ColumnId = 'lead' | 'company' | 'industry' | 'stage' | 'subStatus' | 'city' | 'state' | 'phone' | 'source' | 'owner' | 'createdAt' | 'dealValueInr' | 'followUpAt';

export interface ColumnPreferences {
  showCity: boolean;
  showState: boolean;
  showCreatedOn: boolean;
  showDealValue: boolean;
  showFollowUp: boolean;
  columnOrder: ColumnId[];
}

export const defaultColumnOrder: ColumnId[] = [
  'lead',
  'company',
  'industry',
  'stage',
  'subStatus',
  'city',
  'state',
  'phone',
  'source',
  'owner',
  'createdAt',
  'dealValueInr',
  'followUpAt'
];

export const defaultColumnPreferences: ColumnPreferences = {
  showCity: false,
  showState: false,
  showCreatedOn: false,
  showDealValue: true,
  showFollowUp: true,
  columnOrder: defaultColumnOrder,
};

export function useTablePreferences() {
  const [columnPreferences, setColumnPreferences] = useState<ColumnPreferences>(defaultColumnPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount and listen to changes
  useEffect(() => {
    const loadPrefs = () => {
      try {
        const stored = localStorage.getItem("salescrm_table_columns");
        if (stored) {
          const parsed = JSON.parse(stored);
          // Ensure columnOrder exists (backwards compatibility)
          if (!parsed.columnOrder || !Array.isArray(parsed.columnOrder) || parsed.columnOrder.length === 0) {
            parsed.columnOrder = defaultColumnOrder;
          } else {
            // Ensure all default columns are present in the parsed order just in case new ones were added
            const missing = defaultColumnOrder.filter(c => !parsed.columnOrder.includes(c));
            parsed.columnOrder = [...parsed.columnOrder, ...missing];
          }
          setColumnPreferences({ ...defaultColumnPreferences, ...parsed });
        }
      } catch (e) {
        console.error("Failed to parse table column preferences from localStorage", e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadPrefs();

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ColumnPreferences>;
      if (customEvent.detail) {
        setColumnPreferences(customEvent.detail);
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "salescrm_table_columns") {
        loadPrefs();
      }
    };

    window.addEventListener("salescrm_table_columns_updated", handleCustomEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("salescrm_table_columns_updated", handleCustomEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  // Save to local storage when changed
  const updateColumnPreferences = (newPrefs: Partial<ColumnPreferences>) => {
    setColumnPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem("salescrm_table_columns", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("salescrm_table_columns_updated", { detail: updated }));
      } catch (e) {
        console.error("Failed to save table column preferences to localStorage", e);
      }
      return updated;
    });
  };

  return { columnPreferences, updateColumnPreferences, isLoaded };
}

