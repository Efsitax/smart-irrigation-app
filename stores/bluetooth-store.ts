import { create } from 'zustand';
import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';
import { BluetoothDevice, WiFiCredentials, ConnectionStatus } from '../types/bluetooth';

const { ClassicBluetoothModule } = NativeModules;
const BluetoothEvents = new NativeEventEmitter(ClassicBluetoothModule);

interface BluetoothState {
  devices: BluetoothDevice[];
  selectedDevice: BluetoothDevice | null;
  connectionStatus: ConnectionStatus;
  isScanning: boolean;
  error: string | null;

  startScan: () => Promise<void>;
  stopScan: () => void;
  selectDevice: (device: BluetoothDevice) => void;
  sendWiFiCredentials: (credentials: WiFiCredentials) => Promise<void>;
  resetConnection: () => void;
  clearError: () => void;
}

export const useBluetoothStore = create<BluetoothState>((set, get) => ({
  devices: [],
  selectedDevice: null,
  connectionStatus: { status: 'idle' },
  isScanning: false,
  error: null,

  startScan: async () => {
    if (Platform.OS === 'android') {
      const permissions = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted = Object.values(permissions).every(
        (res) => res === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        set({ error: 'Bluetooth or location permission denied.' });
        return;
      }
    }

    set({ isScanning: true, devices: [], error: null });

    try {
      ClassicBluetoothModule.startScan();

      BluetoothEvents.removeAllListeners('DeviceFound');
      BluetoothEvents.addListener('DeviceFound', (device: any) => {
        const newDevice: BluetoothDevice = {
        id: device.id,
        name: device.name || 'Unknown Device',
        rssi: device.rssi,
        isConnectable: true,
        };
        
        set((state) => {
          const exists = state.devices.some((d) => d.id === newDevice.id);
          if (exists) return state;

          return {
            devices: [...state.devices, newDevice],
          };
        });
      });

      setTimeout(() => {
        ClassicBluetoothModule.stopScan();
        set({ isScanning: false });
      }, 8000);
    } catch (err: any) {
      set({
        error: err?.message || 'Failed to start Bluetooth scan.',
        isScanning: false,
      });
    }
  },

  stopScan: () => {
    ClassicBluetoothModule.stopScan();
    set({ isScanning: false });
  },

  selectDevice: (device) => {
    set({ selectedDevice: device, error: null });
  },

  sendWiFiCredentials: async (credentials) => {
    const { selectedDevice } = get();

    if (!selectedDevice) {
      set({ error: 'No device selected.' });
      return;
    }

    if (!credentials.ssid.trim()) {
      set({ error: 'SSID is required.' });
      return;
    }

    set({
      connectionStatus: { status: 'connecting', message: 'Connecting to device...', progress: 0 },
      error: null,
    });

    try {
      await ClassicBluetoothModule.connectToDevice(selectedDevice.id);

      set({
        connectionStatus: {
          status: 'sending',
          message: 'Sending Wi-Fi credentials...',
          progress: 50,
        },
      });

      const payload = `${credentials.ssid},${credentials.password}`;
      await ClassicBluetoothModule.sendData(payload);

      set({
        connectionStatus: {
          status: 'success',
          message: 'Wi-Fi credentials sent successfully!',
          progress: 100,
        },
      });

      ClassicBluetoothModule.disconnect();
    } catch (err: any) {
      set({
        connectionStatus: { status: 'error', message: 'Connection failed.' },
        error: err?.message || 'Bluetooth error occurred.',
      });
    }
  },

  resetConnection: () => {
    set({
      devices: [],
      selectedDevice: null,
      connectionStatus: { status: 'idle' },
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));