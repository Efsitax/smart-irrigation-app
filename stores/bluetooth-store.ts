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
  
  // Sends a command (JSON string or shorthand like "ON")
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

    // --- Simulation Mode Logic ---
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

    // --- Real Scan Logic ---
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
          // Prevent duplicates
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

    // Stop scanning automatically after 10 seconds
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

    // --- Simulation Connection ---
    if (SIMULATION_MODE) {
        setTimeout(() => {
            set({ 
                connectedDevice: { id: deviceId, name: 'ESP32-Smart-Garden' } as any, 
                connectionStatus: { status: 'success', message: 'Connected to Simulator!' } 
            });

            setTimeout(() => {
                set({ connectionStatus: { status: 'idle' } });
            }, 1000);

            // Mock Data Generation
            const interval = setInterval(() => {
                set((state) => ({
                    telemetry: {
                        ...state.telemetry,
                        moisture: Math.floor(Math.random() * (85 - 30 + 1)) + 30,
                        battery: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
                    }
                }));
            }, 5000);

            set({ simulationInterval: interval });

        }, 1500);
        return;
    }

    // --- Real Connection ---
    try {
      const device = await manager.connectToDevice(deviceId);

      // Increase MTU on Android to prevent data truncation
      if (Platform.OS === 'android') {
        try {
            await device.requestMTU(512);
        } catch (e) {
            console.log("MTU Request Failed (Not Critical):", e);
        }
      }

      const discovered = await device.discoverAllServicesAndCharacteristics();
      
      set({ 
        connectedDevice: discovered, 
        connectionStatus: { status: 'success', message: 'Connected!' } 
      });

      // Clear success message after 2 seconds
      setTimeout(() => {
         set({ connectionStatus: { status: 'idle' } });
      }, 2000);

      let dataBuffer = ""; 

      // --- Monitor Incoming Data ---
      discovered.monitorCharacteristicForService(
        SERVICE_UUID,
        TX_UUID,
        (error, characteristic) => {
          if (error) {
            console.log("Monitor Error:", error);
            if(error.errorCode === 201 || error.message?.includes('disconnected') || error.message?.includes('uuid')) {
                set({ 
                    connectedDevice: null, 
                    connectionStatus: { status: 'error', message: 'Device Disconnected' } 
                });
            }
            return;
          }

          // Decode Base64
          let rawData = "";
          try {
             rawData = atob(characteristic?.value || '');
          } catch (e) {
             console.log("Base64 Decode Error:", e);
             return;
          }

          dataBuffer += rawData;

          // Process full lines (delimited by \n)
          if (dataBuffer.includes('\n')) {
             const parts = dataBuffer.split('\n');
             // The last part might be incomplete, put it back in the buffer
             dataBuffer = parts.pop() || ""; 

             for (const part of parts) {
               const cleanPart = part.trim();
               if (cleanPart.length === 0) continue;

               try {
                 const parsed = JSON.parse(cleanPart);
                 console.log("Parsed Data from ESP32:", parsed);

                 // Update State based on ESP32 keys: 'm' (moisture), 'b' (battery), 'isPumpOn'/'status'
                 set((state) => {
                   // Determine pump status from either explicit boolean or status string
                   const incomingPumpState = parsed.isPumpOn ?? (
                       parsed.status === 'ON' ? true : 
                       (parsed.status === 'OFF' ? false : undefined)
                   );

                   return {
                     telemetry: {
                       moisture: parsed.m !== undefined ? parsed.m : state.telemetry.moisture,
                       battery: parsed.b !== undefined ? parsed.b : state.telemetry.battery,
                       isPumpOn: incomingPumpState !== undefined ? incomingPumpState : state.telemetry.isPumpOn
                     }
                   };
                 });

               } catch (e) {
                 console.log('JSON Parse Error:', e, 'Raw Part:', cleanPart);
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

  sendCommand: async (commandOrJson: string, duration?: number) => {
    const { connectedDevice } = get();
    if (!connectedDevice && !SIMULATION_MODE) {
        Alert.alert("Error", "Device not connected");
        return;
    }

    // 1. Prepare Payload
    let payload = commandOrJson;

    // Convert simple commands (e.g., "ON") to JSON format
    if (!commandOrJson.startsWith('{')) {
        payload = JSON.stringify({ command: commandOrJson, duration: duration || 0 });
    }

    // 2. Simulation Mode
    if (SIMULATION_MODE) {
        set({ connectionStatus: { status: 'sending', message: 'Sending command...' } });
        
        try {
            const parsed = JSON.parse(payload);
            if (parsed.command === 'ON') {
                set((state) => ({ telemetry: { ...state.telemetry, isPumpOn: true } }));
                
                // Simulate auto-off
                const dur = parsed.duration || 5;
                const timeout = setTimeout(() => {
                    set((state) => ({ telemetry: { ...state.telemetry, isPumpOn: false } }));
                }, dur * 1000);
                set({ simulationPumpTimeout: timeout });
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