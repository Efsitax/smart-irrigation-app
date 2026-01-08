import { create } from 'zustand';
import { BleManager, Device } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { decode as atob, encode as btoa } from 'base-64';
import { BluetoothDevice, ConnectionStatus } from '../types/bluetooth';

const SIMULATION_MODE = false;

const SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const RX_UUID      = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"; 
const TX_UUID      = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"; 

// Type definition for Telemetry data
interface TelemetryData {
  moisture: number; 
  battery: number; 
  isPumpOn: boolean;
  // If you want to support raw data from ESP32 (m, b), you can add optional fields here, 
  // but it's cleanest to transform data within the store.
}

interface BluetoothState {
  manager: BleManager;
  devices: BluetoothDevice[];
  connectedDevice: Device | null;
  connectionStatus: ConnectionStatus;
  isScanning: boolean;
  
  simulationInterval: ReturnType<typeof setInterval> | null;
  simulationPumpTimeout: ReturnType<typeof setTimeout> | null;

  telemetry: TelemetryData;

  startScan: () => Promise<void>;
  stopScan: () => void;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnect: () => void;
  
  // Made the command sending function flexible.
  // command: Can be a JSON string or a simple command like "ON".
  sendCommand: (commandOrJson: string, duration?: number) => Promise<void>;
  
  clearErrors: () => void;
}

export const useBluetoothStore = create<BluetoothState>((set, get) => ({
  manager: new BleManager(),
  devices: [],
  connectedDevice: null,
  connectionStatus: { status: 'idle' },
  isScanning: false,
  simulationInterval: null,
  simulationPumpTimeout: null,
  telemetry: { moisture: 0, battery: 0, isPumpOn: false },

  startScan: async () => {
    const { manager } = get();

    if (SIMULATION_MODE) {
      console.log('[Simulation] Starting scan...');
      set({ isScanning: true, devices: [], connectionStatus: { status: 'scanning', message: 'Simulating Scan...' } });
      
      setTimeout(() => {
        set({
          devices: [
            {
              id: 'MOCK-DEVICE-01',
              name: 'ESP32-Smart-Garden',
              rssi: -55,
              isConnectable: true,
            },
          ],
          isScanning: false, 
          connectionStatus: { status: 'idle' }
        });
        console.log('[Simulation] Device found: ESP32-Smart-Garden');
      }, 1500);
      return;
    }

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
    if (SIMULATION_MODE) {
       set({ isScanning: false, connectionStatus: { status: 'idle' } });
       return;
    }
    get().manager.stopDeviceScan();
    set({ isScanning: false, connectionStatus: { status: 'idle' } });
  },

  connectToDevice: async (deviceId: string) => {
    get().stopScan();
    const { manager } = get();

    set({ connectionStatus: { status: 'connecting', message: 'Connecting...' } });

    if (SIMULATION_MODE) {
        setTimeout(() => {
            set({ 
                connectedDevice: { id: deviceId, name: 'ESP32-Smart-Garden' } as any, 
                connectionStatus: { status: 'success', message: 'Connected to Simulator!' } 
            });

            setTimeout(() => {
                set({ connectionStatus: { status: 'idle' } });
            }, 1000);

            const interval = setInterval(() => {
                set((state) => ({
                    telemetry: {
                        ...state.telemetry,
                        moisture: Math.floor(Math.random() * (85 - 30 + 1)) + 30,
                        battery: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
                    }
                }));
            }, 5000); // Send simulation data every 5 seconds

            set({ simulationInterval: interval });

        }, 1500);
        return;
    }

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

      let dataBuffer = ""; 

      // Monitor Data
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
          dataBuffer += rawData;

          if (dataBuffer.includes('\n')) {
             const parts = dataBuffer.split('\n');
             dataBuffer = parts.pop() || ""; 

             for (const part of parts) {
               if (part.trim().length === 0) continue;

               try {
                 const parsed = JSON.parse(part);
                 console.log("Parsed Data from ESP32:", parsed);

                 // Mapping ESP32 keys "m", "b" to our "moisture", "battery" structure.
                 // Also checking for "status" messages for pump state.
                 
                 const isPumpOn = parsed.isPumpOn ?? (parsed.status === 'ON' ? true : (parsed.status === 'OFF' ? false : undefined));

                 set((state) => ({
                   telemetry: {
                     moisture: parsed.m ?? state.telemetry.moisture,
                     battery: parsed.b ?? state.telemetry.battery,
                     isPumpOn: isPumpOn !== undefined ? isPumpOn : state.telemetry.isPumpOn
                   }
                 }));

               } catch (e) {
                 console.log('JSON Parse Error:', e, 'Raw Part:', part);
               }
             }
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
    const { connectedDevice, simulationInterval, simulationPumpTimeout } = get();

    if (simulationInterval) clearInterval(simulationInterval);
    if (simulationPumpTimeout) clearTimeout(simulationPumpTimeout);

    if (connectedDevice && !SIMULATION_MODE) {
      connectedDevice.cancelConnection();
    }

    set({ 
        connectedDevice: null, 
        connectionStatus: { status: 'idle' },
        simulationInterval: null,
        simulationPumpTimeout: null,
        telemetry: { moisture: 0, battery: 0, isPumpOn: false }
    });
  },

  // UPDATED SEND COMMAND
  // Now supports both ("ON", 10) format and ('{"auto_ctrl": true}') format.
  sendCommand: async (commandOrJson: string, duration?: number) => {
    const { connectedDevice } = get();
    if (!connectedDevice && !SIMULATION_MODE) {
        Alert.alert("Error", "Device not connected");
        return;
    }

    // 1. Prepare Payload to Send
    let payload = commandOrJson;

    // If parameter is not in JSON format (e.g., just "ON"), convert to legacy JSON format
    if (!commandOrJson.startsWith('{')) {
        payload = JSON.stringify({ command: commandOrJson, duration: duration || 0 });
    }

    // 2. Simulation Mode
    if (SIMULATION_MODE) {
        set({ connectionStatus: { status: 'sending', message: 'Sending command...' } });
        
        // Update pump state in simulation
        try {
            const parsed = JSON.parse(payload);
            if (parsed.command === 'ON') {
                set((state) => ({ telemetry: { ...state.telemetry, isPumpOn: true } }));
                
                // Auto-off simulation
                const dur = parsed.duration || 5;
                setTimeout(() => {
                    set((state) => ({ telemetry: { ...state.telemetry, isPumpOn: false } }));
                }, dur * 1000);
            }
        } catch (e) {}

        setTimeout(() => {
            set({ connectionStatus: { status: 'success', message: 'Command Simulated!' } });
            setTimeout(() => set({ connectionStatus: { status: 'idle' } }), 1000);
        }, 800);
        return;
    }

    // 3. Real Mode (BLE Write)
    try {
        set({ connectionStatus: { status: 'sending', message: 'Sending command...' } });
        
        console.log("Sending BLE Payload:", payload);

        await connectedDevice!.writeCharacteristicWithResponseForService(
            SERVICE_UUID,
            RX_UUID,
            btoa(payload)
        );

        set({ connectionStatus: { status: 'success', message: 'Sent!' } });
        
        setTimeout(() => {
            set((state) => ({
                 connectionStatus: state.connectionStatus.status === 'success' 
                 ? { status: 'idle' } 
                 : state.connectionStatus 
            }));
        }, 1500);

    } catch (error) {
        console.log('Send Error:', error);
        set({ connectionStatus: { status: 'error', message: 'Failed to send' } });
    }
  },
  
  clearErrors: () => {
      set({ connectionStatus: { status: 'idle' } });
  }
}));