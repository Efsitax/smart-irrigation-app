// stores/settings-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UpdateMotorStateDto } from '../types/irrigation';
import { updateMotorState, getMotorState } from '../api/motorService';

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
    set => ({
      autoControl: false,
      moistureThreshold: 50,
      autoDurationSeconds: 10,
      manualDurationSeconds: 5,
      isLoading: false,
      error: null,

      loadSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const cfg = await getMotorState();
          set({ ...cfg, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      saveSettings: async cfg => {
        set({ isLoading: true, error: null });
        try {
          await updateMotorState(cfg);
          set({ ...cfg, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);