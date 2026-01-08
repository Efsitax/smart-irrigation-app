import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// YENİ: Database Service Import
import { getTemperatureConfig, updateTemperatureConfig } from '../services/DatabaseService';

interface TemperatureStore {
  temperatureThreshold: number;
  extraSeconds: number;
  active: boolean;
  updatedAt?: string;
  isLoading: boolean;
  error: string | null;
  fetchTemperatureConfig: () => Promise<void>;
  saveTemperatureConfig: (cfg: {
    threshold: number;
    extraSeconds: number;
    active: boolean;
  }) => Promise<void>;
}

export const useTemperatureStore = create<TemperatureStore>()(
  persist(
    (set) => ({
      temperatureThreshold: 30,
      extraSeconds: 0,
      active: false,
      updatedAt: undefined,
      isLoading: false,
      error: null,

      fetchTemperatureConfig: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = getTemperatureConfig();
          set({
            temperatureThreshold: res.threshold,
            extraSeconds: res.extraSeconds,
            active: res.active,
            updatedAt: res.updatedAt,
            isLoading: false
          });
        } catch (err: any) {
          set({ error: 'Failed to load temp config', isLoading: false });
        }
      },

      saveTemperatureConfig: async (cfg) => {
        set({ isLoading: true, error: null });
        try {
          updateTemperatureConfig(cfg);
          set({ 
              temperatureThreshold: cfg.threshold,
              extraSeconds: cfg.extraSeconds,
              active: cfg.active,
              updatedAt: new Date().toISOString(), 
              isLoading: false 
          });
        } catch (err: any) {
          set({ error: 'Failed to save temp config', isLoading: false });
        }
      }
    }),
    {
      name: 'temperature-store',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);