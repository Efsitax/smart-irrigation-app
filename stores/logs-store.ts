import { create } from 'zustand';
import { getMotorLogs, MotorLog } from '../services/DatabaseService';

interface LogsState {
  logs: MotorLog[] | null;
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
      const data = getMotorLogs(); 
      set({ logs: data, isLoading: false });
    } catch (err: any) {
      console.error("Log hatası:", err);
      set({ error: 'Geçmiş veriler yüklenemedi.', isLoading: false });
    }
  },
}));