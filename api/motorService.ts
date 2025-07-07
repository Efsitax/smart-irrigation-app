// smart-irrigation-app/api/motorService.ts
import axios from 'axios';
import { API_BASE } from './base';
import {
  UpdateMotorStateDto,
  MotorStateDto,
  MotorLogDto
} from '../types/irrigation';

export async function manualMotorControl(): Promise<void> {
  await axios.post(`${API_BASE}/motor/manual`);
}

export async function getMotorState(): Promise<MotorStateDto> {
  const res = await axios.get<MotorStateDto>(`${API_BASE}/motor/state`);
  return res.data;
  
}

export async function updateMotorState(
  payload: UpdateMotorStateDto
): Promise<void> {
  await axios.put(`${API_BASE}/motor/state`, payload);
}

export async function getMotorLogs(): Promise<MotorLogDto[]> {
  const res = await axios.get<MotorLogDto[]>(`${API_BASE}/motor/logs`);
  return res.data;
}