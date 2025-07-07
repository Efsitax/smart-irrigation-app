// stores/motor-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  updateMotorState,
  getMotorLogs
} from '../api/motorService';
import {
  UpdateMotorStateDto,
  MotorLogDto
} from '../types/irrigation';

interface MotorStore {
  logs: MotorLogDto[] | null;
  isLoading: boolean;
  error: string | null;
  applySettings: (cfg: UpdateMotorStateDto) => Promise<void>;
  fetchLogs: () => Promise<void>;
}

export const useMotorStore = create<MotorStore>()(
  persist(
    (set) => ({
      logs: null,
      isLoading: false,
      error: null,

      applySettings: async (cfg) => {
        set({ isLoading: true, error: null });
        try {
          await updateMotorState(cfg);
          set({ isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Failed to update motor', isLoading: false });
        }
      },

      fetchLogs: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await getMotorLogs();
          set({ logs: data, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch logs', isLoading: false });
        }
      },
    }),
    {
      name: 'motor-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ /* sadece istersen persist edilecek alanlar */ })
    }
  )
);