// smart-irrigation-app/api/irrigationService.ts
import axios from 'axios';
import { API_BASE } from './base';
import { SensorDataDto } from '../types/irrigation';

export async function getLatestSensorData(): Promise<SensorDataDto> {
  const res = await axios.get<SensorDataDto>(`${API_BASE}/sensor-data/latest`);
  return res.data;
}

// DashboardStore için yardımcı:
export async function fetchMoistureData(): Promise<{ soilMoisturePercent: number }> {
  const { soilMoisturePercent } = await getLatestSensorData();
  return { soilMoisturePercent };
}

export async function fetchBatteryData(): Promise<{ batteryPercent: number }> {
  const { batteryPercent } = await getLatestSensorData();
  return { batteryPercent };
}