// stores/logs-store.ts
import { create } from 'zustand';
import { getMotorLogs } from '../api/motorService';
import { MotorLogDto } from '../types/irrigation';

interface LogsState {
  logs: MotorLogDto[] | null;
  isLoading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: null,
  isLoading: false,
  error: null,

  fetchLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getMotorLogs();
      set({ logs: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch logs', isLoading: false });
    }
  },
}));