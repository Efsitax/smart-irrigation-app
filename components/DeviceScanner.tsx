import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Bluetooth, Wifi, Signal, Check } from 'lucide-react-native';
import { BluetoothDevice } from '../types/bluetooth';
import colors from '../constants/colors';
import Card from './Card';
import { useThemeStore } from '../stores/theme-store';

interface DeviceScannerProps {
  devices: BluetoothDevice[];
  selectedDevice: BluetoothDevice | null;
  isScanning: boolean;
  onSelectDevice: (device: BluetoothDevice) => void;
  onStartScan: () => void;
}

export default function DeviceScanner({
  devices,
  selectedDevice,
  isScanning,
  onSelectDevice,
  onStartScan,
}: DeviceScannerProps) {
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;

  const getSignalStrength = (rssi?: number) => {
    if (rssi == null) return 'weak';
    if (rssi > -50) return 'strong';
    if (rssi > -70) return 'medium';
    return 'weak';
  };

  const getSignalColor = (rssi?: number) => {
    const strength = getSignalStrength(rssi);
    switch (strength) {
      case 'strong': return colors.primary;
      case 'medium': return colors.accent;
      default: return colors.danger;
    }
  };

  return (
    <Card variant="elevated">
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: colors.secondary + '20' }]}> 
            <Bluetooth size={20} color={colors.secondary} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.text }]}>Bluetooth Devices</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>        
              {isScanning ? 'Scanning...' : `${devices.length} device${devices.length !== 1 ? 's' : ''} found`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.scanButton,
            { backgroundColor: isScanning ? theme.border : colors.secondary + '20' },
          ]}
          onPress={onStartScan}
          disabled={isScanning}
          activeOpacity={0.7}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color={colors.secondary} />
          ) : (
            <Signal size={16} color={colors.secondary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.deviceList}>
        {devices.length === 0 && !isScanning ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No devices found. Tap the scan button to search for ESP32 devices.</Text>
          </View>
        ) : (
          devices.map((device) => {
            const isSelected = selectedDevice?.id === device.id;
            return (
              <TouchableOpacity
                key={device.id}
                style={[
                  styles.deviceItem,
                  {
                    backgroundColor: isSelected ? colors.primary + '10' : theme.surface,
                    borderColor: isSelected ? colors.primary : theme.border,
                  }
                ]}
                onPress={() => onSelectDevice(device)}
                activeOpacity={0.7}
              >
                <View style={styles.deviceInfo}>
                  <View style={styles.deviceHeader}>
                    <View
                      style={[
                        styles.deviceIcon,
                        { backgroundColor: device.name.includes('ESP32') ? colors.primary + '20' : theme.border }
                      ]}
                    >
                      <Wifi size={16} color={device.name.includes('ESP32') ? colors.primary : theme.textSecondary} />
                    </View>
                    <View style={styles.deviceDetails}>
                      <Text style={[styles.deviceName, { color: theme.text }]}>{device.name}</Text>
                      <Text style={[styles.deviceId, { color: theme.textSecondary }]}>ID: {device.id}</Text>
                    </View>
                  </View>
                  <View style={styles.deviceMeta}>
                    {device.rssi != null && (
                      <View style={styles.signalContainer}>
                        <Signal size={12} color={getSignalColor(device.rssi)} />
                        <Text style={[styles.signalText, { color: getSignalColor(device.rssi) }]}>
                          {device.rssi}dBm
                        </Text>
                      </View>
                    )}
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}> 
                        <Check size={12} color="white" />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceList: {
    // spacing handled in deviceItem via marginBottom
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  deviceItem: {
    alignSelf: 'stretch',       // fill full width of container
    width: '100%',
    marginBottom: 12,           // spacing between items
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  deviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  deviceId: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  signalText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});