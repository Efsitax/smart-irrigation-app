// stores/dashboard-store.ts
import { create } from 'zustand';
import {
  fetchMoistureData,
  fetchBatteryData
} from '../api/irrigationService';

interface DashboardState {
  moisture: number | null;
  battery: number | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  fetchData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  moisture: null,
  battery: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [{ soilMoisturePercent }, { batteryPercent }] = await Promise.all([
        fetchMoistureData(),
        fetchBatteryData(),
      ]);
      set({
        moisture: soilMoisturePercent,
        battery: batteryPercent,
        lastUpdated: new Date().toISOString(),
        isLoading: false
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch dashboard data',
        isLoading: false
      });
    }
  },
}));