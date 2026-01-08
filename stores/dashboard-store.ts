import { create } from 'zustand';
import { getLatestSensorHistory } from '../services/DatabaseService';

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
      // SQLite'dan son verileri çek (Senkron çalışır ama async sarmalayıcı içinde tutuyoruz)
      const history = getLatestSensorHistory();
      
      if (history && history.length > 0) {
        // En güncel kayıt (listede 0. index)
        const latest = history[0];
        set({
          moisture: latest.soilMoisturePercent,
          battery: latest.batteryPercent,
          lastUpdated: latest.timestamp,
          isLoading: false
        });
      } else {
        // Hiç veri yoksa
        set({ 
            moisture: 0, 
            battery: 0, 
            lastUpdated: null, 
            isLoading: false 
        });
      }
    } catch (err: any) {
      console.error(err);
      set({
        error: 'Failed to load local dashboard data',
        isLoading: false
      });
    }
  },
}));