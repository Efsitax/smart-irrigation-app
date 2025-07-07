import axios from 'axios';
import { API_BASE } from './base';
import { TemperatureConfigDto } from '../types/irrigation';

export async function getTemperatureConfig(): Promise<TemperatureConfigDto> {
  const res = await axios.get<TemperatureConfigDto>(`${API_BASE}/temperature`);
  return res.data;
}

export async function updateTemperatureConfig(
  config: Pick<TemperatureConfigDto, 'threshold' | 'extraSeconds'>
): Promise<TemperatureConfigDto> {
  const res = await axios.put<TemperatureConfigDto>(`${API_BASE}/temperature`, config);
  return res.data;
}