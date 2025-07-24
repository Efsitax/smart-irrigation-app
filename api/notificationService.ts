// src/api/notificationService.ts
import axios from 'axios';
import { API_BASE } from './base';
import { DeviceTokenDto } from '../types/notification';

/// Register the device’s FCM token with your backend
export async function registerDeviceToken(
  dto: DeviceTokenDto
): Promise<void> {
  await axios.post<void>(`${API_BASE}/device-tokens`, dto);
}