import axios from 'axios';
import { API_BASE } from './base';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleResponseDto
} from '../types/irrigation';

export async function getAllSchedules(): Promise<ScheduleResponseDto[]> {
  const res = await axios.get<ScheduleResponseDto[]>(`${API_BASE}/schedules`);
  return res.data;
}

export async function createSchedule(dto: CreateScheduleDto): Promise<ScheduleResponseDto> {
  const res = await axios.post<ScheduleResponseDto>(`${API_BASE}/schedules`, dto);
  return res.data;
}


export async function updateSchedule(
  id: number,
  dto: UpdateScheduleDto
): Promise<ScheduleResponseDto> {
  const res = await axios.put<ScheduleResponseDto>(`${API_BASE}/schedules/${id}`, dto);
  return res.data;
}

export async function deleteSchedule(id: number): Promise<void> {
  await axios.delete(`${API_BASE}/schedules/${id}`);
}

export async function deactivateSchedule(id: number): Promise<ScheduleResponseDto> {
  const res = await axios.patch<ScheduleResponseDto>(
    `${API_BASE}/schedules/${id}/deactivate`,
    {}
  );
  return res.data;
}