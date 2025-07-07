// stores/schedule-store.ts
import { create } from 'zustand';
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  deactivateSchedule
} from '../api/scheduleService';
import {
  ScheduleResponseDto,
  CreateScheduleDto,
  UpdateScheduleDto
} from '../types/irrigation';

interface ScheduleState {
  schedules: ScheduleResponseDto[];
  isLoading: boolean;
  error: string | null;
  fetchSchedules: () => Promise<void>;
  addSchedule: (dto: CreateScheduleDto) => Promise<void>;
  editSchedule: (id: number, dto: UpdateScheduleDto) => Promise<void>;
  removeSchedule: (id: number) => Promise<void>;
  disableSchedule: (id: number) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  isLoading: false,
  error: null,

  fetchSchedules: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getAllSchedules();
      set({ schedules: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addSchedule: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      await createSchedule(dto);
      await getAllSchedules().then(data => set({ schedules: data }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  editSchedule: async (id, dto) => {
    set({ isLoading: true, error: null });
    try {
      await updateSchedule(id, dto);
      await getAllSchedules().then(data => set({ schedules: data }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  removeSchedule: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteSchedule(id);
      await getAllSchedules().then(data => set({ schedules: data }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  disableSchedule: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deactivateSchedule(id);
      await getAllSchedules().then(data => set({ schedules: data }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));