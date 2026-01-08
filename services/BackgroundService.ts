import BackgroundService from 'react-native-background-actions';
import { State } from 'react-native-ble-plx'; 
import { useBluetoothStore } from '../stores/bluetooth-store';
import { useSettingsStore } from '../stores/settings-store';
import { useScheduleStore } from '../stores/schedule-store';
import { addMotorLog } from './DatabaseService';
import { Platform } from 'react-native';
import { DayOfWeek } from '../types/irrigation';

const sleep = (time: number) => new Promise((resolve) => setTimeout(() => resolve(true), time));

const RECONNECT_INTERVAL = 3600000; 

const TARGET_DEVICE_NAME = 'ESP32-Smart-Garden';

const BATTERY_LOW_THRESHOLD = 20;

const irrigationTask = async (taskDataArguments?: any) => {
    const { delay } = taskDataArguments;
    
    let lastReconnectAttempt = 0; 
    let hasNotifiedLowBattery = false;

    await new Promise(async (resolve) => {
        for (let i = 0; BackgroundService.isRunning(); i++) {
            
            const btStore = useBluetoothStore.getState();
            const settings = useSettingsStore.getState();
            const scheduleStore = useScheduleStore.getState();
            const schedules = scheduleStore.schedules;

            if (!btStore.connectedDevice) {
                const now = Date.now();
                if (now - lastReconnectAttempt > RECONNECT_INTERVAL) {
                    console.log('[Background] 1 hour passed, attempting to reconnect...');
                    lastReconnectAttempt = now;

                    const btState = await btStore.manager.state();
                    if (btState === State.PoweredOn) {
                        await BackgroundService.updateNotification({ taskDesc: 'Searching for device...' });
                        
                        btStore.manager.startDeviceScan(null, null, (error, device) => {
                            if (error) return;
                            if (device && device.name === TARGET_DEVICE_NAME) {
                                btStore.manager.stopDeviceScan();
                                btStore.connectToDevice(device.id).catch(() => {});
                            }
                        });

                        await sleep(10000);
                        btStore.manager.stopDeviceScan();
                        
                        if (!useBluetoothStore.getState().connectedDevice) {
                             await BackgroundService.updateNotification({ taskDesc: 'Device not found. Will retry in 1 hour.' });
                        }
                    }
                }
            } 
            
            else {
                const telemetry = btStore.telemetry;
                const isPumpOff = !telemetry.isPumpOn;

                if (telemetry.battery < BATTERY_LOW_THRESHOLD) {
                    if (!hasNotifiedLowBattery) {
                        console.log(`[Background] Battery Critical: ${telemetry.battery}%`);
                        await BackgroundService.updateNotification({ 
                            taskDesc: `WARNING: Battery Level Critical (${telemetry.battery}%)!` 
                        });
                        hasNotifiedLowBattery = true;
                    }
                } else {
                    if (hasNotifiedLowBattery) {
                        hasNotifiedLowBattery = false;
                    }
                }

                if (settings.autoControl) {
                    const isDry = telemetry.moisture > 0 && telemetry.moisture < settings.moistureThreshold;
                    
                    if (isDry && isPumpOff) {
                        console.log(`[Background] Auto-Irrigation Starting (Moisture: ${telemetry.moisture}%)`);
                        
                        await BackgroundService.updateNotification({ 
                            taskDesc: `Auto-Irrigation in Progress (Moisture: ${telemetry.moisture}%)` 
                        });

                        await btStore.sendCommand('ON', settings.autoDurationSeconds);
                        
                        addMotorLog({
                            startTime: new Date().toISOString(),
                            durationSeconds: settings.autoDurationSeconds,
                            moistureAtTrigger: telemetry.moisture,
                            mode: 'AUTO_BG_MOISTURE'
                        });

                        await sleep(settings.autoDurationSeconds * 1000 + 5000);
                        await BackgroundService.updateNotification({ taskDesc: 'Monitoring sensors...' });
                    }
                } 
                else {
                    const isDry = telemetry.moisture > 0 && telemetry.moisture < settings.moistureThreshold;
                    
                    if (isDry && !hasNotifiedLowBattery) {
                         await BackgroundService.updateNotification({ 
                            taskDesc: `ATTENTION: Soil Dry (${telemetry.moisture}%). Irrigation Needed!` 
                        });
                    } else if (!hasNotifiedLowBattery) {
                        await BackgroundService.updateNotification({ taskDesc: 'Monitoring sensors (Manual Mode)...' });
                    }
                }

                const now = new Date();
                const currentDayIndex = now.getDay(); 
                const daysMap: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                const currentDayName = daysMap[currentDayIndex];
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();

                for (const schedule of schedules) {
                    if (!schedule.active) continue;
                    
                    const [sHour, sMinute] = schedule.time.split(':').map(Number);
                    
                    if (sHour === currentHour && sMinute === currentMinute) {
                        const isDayMatch = schedule.repeatDaily || schedule.days.includes(currentDayName);
                        
                        if (isDayMatch && isPumpOff) {
                            console.log(`[Background] Scheduled Irrigation Started (${schedule.time})`);
                            
                            await BackgroundService.updateNotification({ 
                                taskDesc: `Scheduled Irrigation in Progress...` 
                            });

                            await btStore.sendCommand('ON', schedule.durationInSeconds);
                            
                            addMotorLog({
                                startTime: new Date().toISOString(),
                                durationSeconds: schedule.durationInSeconds,
                                moistureAtTrigger: telemetry.moisture,
                                mode: 'AUTO_BG_SCHEDULE'
                            });

                            await sleep(60000); 
                            await BackgroundService.updateNotification({ taskDesc: 'Monitoring sensors...' });
                        }
                    }
                }
            }

            await sleep(delay);
        }
    });
};

const options = {
    taskName: 'SmartIrrigationTask',
    taskTitle: 'Smart Irrigation Control',
    taskDesc: 'Starting...',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#2196f3',
    linkingURI: 'smartirrigation://home', 
    parameters: {
        delay: 15000,
    },
};

export const startBackgroundService = async () => {
    if (Platform.OS === 'android') {
        try {
            if (!BackgroundService.isRunning()) {
                await BackgroundService.start(irrigationTask, options);
                console.log('Background service started!');
            }
        } catch (e) {
            console.log('Service start error:', e);
        }
    }
};

export const stopBackgroundService = async () => {
    if (Platform.OS === 'android') {
        await BackgroundService.stop();
        console.log('Background service stopped!');
    }
};