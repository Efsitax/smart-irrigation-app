import { create } from 'zustand';
import { BleManager, Device } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { decode as atob, encode as btoa } from 'base-64';
import { BluetoothDevice, ConnectionStatus } from '../types/bluetooth';

const SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const RX_UUID      = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"; 
const TX_UUID      = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"; 

interface BluetoothState {
  manager: BleManager;
  devices: BluetoothDevice[];
  connectedDevice: Device | null;
  connectionStatus: ConnectionStatus;
  isScanning: boolean;
  
  telemetry: { 
    moisture: number; 
    battery: number; 
    isPumpOn: boolean;
  };

  startScan: () => Promise<void>;
  stopScan: () => void;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnect: () => void;
  sendCommand: (command: string, duration?: number) => Promise<void>;
  clearErrors: () => void;
}

export const useBluetoothStore = create<BluetoothState>((set, get) => ({
  manager: new BleManager(),
  devices: [],
  connectedDevice: null,
  connectionStatus: { status: 'idle' },
  isScanning: false,
  telemetry: { moisture: 0, battery: 0, isPumpOn: false },

  startScan: async () => {
    const { manager } = get();

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      if (
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.DENIED ||
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.DENIED
      ) {
        set({ connectionStatus: { status: 'error', message: 'Bluetooth permission denied' } });
        return;
      }
    }

    set({ isScanning: true, devices: [], connectionStatus: { status: 'scanning', message: 'Scanning devices...' } });

    manager.startDeviceScan([SERVICE_UUID], null, (error, device) => {
      if (error) {
        console.log('Scan Error:', error);
        set({ isScanning: false, connectionStatus: { status: 'error', message: 'Scan failed' } });
        return;
      }

      if (device && device.name) {
        set((state) => {
          if (state.devices.some((d) => d.id === device.id)) return state;
          return {
            devices: [
              ...state.devices,
              {
                id: device.id,
                name: device.name || 'Unknown Device',
                rssi: device.rssi || -1,
                isConnectable: device.isConnectable,
              },
            ],
          };
        });
      }
    });

    setTimeout(() => {
      get().stopScan();
    }, 10000);
  },

  stopScan: () => {
    get().manager.stopDeviceScan();
    set({ isScanning: false, connectionStatus: { status: 'idle' } });
  },

  connectToDevice: async (deviceId: string) => {
    get().stopScan();
    const { manager } = get();

    set({ connectionStatus: { status: 'connecting', message: 'Connecting...' } });

    try {
      const device = await manager.connectToDevice(deviceId);
      const discovered = await device.discoverAllServicesAndCharacteristics();
      
      set({ 
        connectedDevice: discovered, 
        connectionStatus: { status: 'success', message: 'Connected!' } 
      });

      setTimeout(() => {
         set({ connectionStatus: { status: 'idle' } });
      }, 2000);

      discovered.monitorCharacteristicForService(
        SERVICE_UUID,
        TX_UUID,
        (error, characteristic) => {
          if (error) {
            if(error.errorCode === 201 || error.message?.includes('disconnected')) {
                set({ 
                    connectedDevice: null, 
                    connectionStatus: { status: 'error', message: 'Device Disconnected' } 
                });
            }
            return;
          }

          const rawData = atob(characteristic?.value || '');
          try {
            if (rawData.includes('{') && rawData.includes('}')) {
               const cleanJson = rawData.substring(rawData.indexOf('{'), rawData.lastIndexOf('}') + 1);
               const parsed = JSON.parse(cleanJson);

               set((state) => ({
                 telemetry: {
                   moisture: parsed.moisture ?? state.telemetry.moisture,
                   battery: parsed.battery ?? state.telemetry.battery,
                   isPumpOn: parsed.command === 'ON' ? true : (parsed.command === 'OFF' ? false : state.telemetry.isPumpOn)
                 }
               }));
            }
          } catch (e) {
            console.log('JSON Parse Error:', e);
          }
        }
      );

    } catch (error: any) {
      console.log('Connection Error:', error);
      set({ 
          connectedDevice: null, 
          connectionStatus: { status: 'error', message: 'Failed to connect' } 
      });
    }
  },

  disconnect: () => {
    const { connectedDevice } = get();
    if (connectedDevice) {
      connectedDevice.cancelConnection();
    }
    set({ 
        connectedDevice: null, 
        connectionStatus: { status: 'idle' },
        telemetry: { moisture: 0, battery: 0, isPumpOn: false }
    });
  },

  sendCommand: async (command: string, duration = 0) => {
    const { connectedDevice } = get();
    if (!connectedDevice) {
        Alert.alert("Error", "Device not connected");
        return;
    }

    const payload = JSON.stringify({ command, duration });

    try {
        set({ connectionStatus: { status: 'sending', message: 'Sending command...' } });
        
        await connectedDevice.writeCharacteristicWithResponseForService(
            SERVICE_UUID,
            RX_UUID,
            btoa(payload)
        );

        set({ connectionStatus: { status: 'success', message: 'Command sent!' } });
        
        setTimeout(() => {
            set((state) => ({
                 connectionStatus: state.connectionStatus.status === 'success' 
                 ? { status: 'idle' } 
                 : state.connectionStatus 
            }));
        }, 2000);

    } catch (error) {
        console.log('Send Error:', error);
        set({ connectionStatus: { status: 'error', message: 'Failed to send command' } });
    }
  },
  
  clearErrors: () => {
      set({ connectionStatus: { status: 'idle' } });
  }
}));