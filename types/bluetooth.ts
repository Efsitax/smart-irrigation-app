export interface BluetoothDevice {
  id: string;
  name: string;
  rssi?: number;
  isConnectable?: boolean;
}

export interface WiFiCredentials {
  ssid: string;
  password: string;
}

export interface ConnectionStatus {
  status: 'idle' | 'scanning' | 'connecting' | 'sending' | 'success' | 'error';
  message?: string;
  progress?: number;
}

export interface ESP32Response {
  success: boolean;
  message: string;
  ip?: string;
}