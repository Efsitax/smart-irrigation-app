import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UpdateMotorStateDto } from '../types/irrigation';

import { getMotorState, updateMotorState } from '../services/DatabaseService';

interface SettingsState {
  autoControl: boolean;
  moistureThreshold: number;
  autoDurationSeconds: number;
  manualDurationSeconds: number;
  isLoading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  saveSettings: (cfg: UpdateMotorStateDto) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      autoControl: false,
      moistureThreshold: 50,
      autoDurationSeconds: 10,
      manualDurationSeconds: 5,
      isLoading: false,
      error: null,

      loadSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const cfg = getMotorState();
          set({ 
            autoControl: cfg.autoControl,
            moistureThreshold: cfg.moistureThreshold,
            autoDurationSeconds: cfg.autoDurationSeconds,
            manualDurationSeconds: cfg.manualDurationSeconds,
            isLoading: false 
          });
        } catch (err: any) {
          console.error(err);
          set({ error: 'Failed to load settings', isLoading: false });
        }
      },

      saveSettings: async (cfg) => {
        set({ isLoading: true, error: null });
        try {
          updateMotorState(cfg);
          
          set({ ...cfg, isLoading: false });
        } catch (err: any) {
          console.error(err);
          set({ error: 'Failed to save settings', isLoading: false });
        }
      },
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);