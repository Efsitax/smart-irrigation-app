import { create } from 'zustand';
import {
  getSchedules as getSchedulesFromDb,
  addSchedule as addScheduleToDb,
  deleteSchedule as deleteScheduleFromDb,
  toggleSchedule as toggleScheduleInDb,
  updateSchedule as updateScheduleInDb
} from '../services/DatabaseService';
import {
  ScheduleResponseDto,
  CreateScheduleDto,
  UpdateScheduleDto,
  DayOfWeek
} from '../types/irrigation';

interface ScheduleState {
  schedules: ScheduleResponseDto[];
  isLoading: boolean;
  error: string | null;
  fetchSchedules: () => Promise<void>;
  addSchedule: (dto: CreateScheduleDto) => Promise<void>;
  editSchedule: (id: number, dto: UpdateScheduleDto) => Promise<void>;
  removeSchedule: (id: number) => Promise<void>;
  disableSchedule: (id: number, isActive: boolean) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  isLoading: false,
  error: null,

  fetchSchedules: async () => {
    set({ isLoading: true, error: null });
    try {
      const rawSchedules = getSchedulesFromDb();
      const mappedSchedules: ScheduleResponseDto[] = rawSchedules.map((s) => ({
        id: s.id,
        time: s.time,
        days: s.days ? (JSON.parse(s.days) as DayOfWeek[]) : [],
        durationInSeconds: s.durationInSeconds,
        repeatDaily: s.repeatDaily,
        specificDate: s.specificDate || undefined,
        active: s.active
      }));
      set({ schedules: mappedSchedules, isLoading: false });
    } catch (err: any) {
      set({ error: 'Failed to load schedules', isLoading: false });
    }
  },

  addSchedule: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      addScheduleToDb({
        time: dto.time,
        days: JSON.stringify(dto.days),
        durationInSeconds: dto.durationInSeconds,
        repeatDaily: dto.repeatDaily,
        specificDate: dto.specificDate || null,
        active: dto.active ?? true
      });
      get().fetchSchedules();
    } catch (err: any) {
      set({ error: 'Failed to create schedule', isLoading: false });
    }
  },

  editSchedule: async (id, dto) => {
    set({ isLoading: true, error: null });
    try {
      updateScheduleInDb(id, {
        time: dto.time,
        days: dto.days ? JSON.stringify(dto.days) : undefined,
        durationInSeconds: dto.durationInSeconds,
        repeatDaily: dto.repeatDaily,
        specificDate: dto.specificDate || null,
        active: dto.active
      });
      get().fetchSchedules();
    } catch (err: any) {
       console.error(err);
       set({ error: 'Failed to update schedule', isLoading: false });
    }
  },

  removeSchedule: async (id) => {
    try {
      deleteScheduleFromDb(id);
      get().fetchSchedules();
    } catch (err: any) {
      set({ error: 'Failed to delete schedule', isLoading: false });
    }
  },

  disableSchedule: async (id, isActive) => {
    try {
      toggleScheduleInDb(id, isActive);
      get().fetchSchedules();
    } catch (err: any) {
      set({ error: 'Failed to update status', isLoading: false });
    }
  },
}));