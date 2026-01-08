import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useBluetoothStore } from '../stores/bluetooth-store';
import { useThemeStore } from '../stores/theme-store';
import Button from '../components/Button';
import AppColors from '../constants/colors';

import { BluetoothDevice } from '../types/bluetooth';

const BluetoothScreen = () => {
  const navigation = useNavigation();
  const { theme } = useThemeStore();
  
  const themeColors = AppColors[theme === 'dark' ? 'dark' : 'light'];

  const {
    devices,
    isScanning,
    connectionStatus,
    startScan,
    stopScan,
    connectToDevice,
    clearErrors
  } = useBluetoothStore();

  useEffect(() => {
    startScan();
    return () => {
      stopScan();
      clearErrors();
    };
  }, []);

  useEffect(() => {
    if (connectionStatus.status === 'success') {
       navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }], 
      });
    }
  }, [connectionStatus.status]);

  useEffect(() => {
    if (connectionStatus.status === 'error' && connectionStatus.message) {
      Alert.alert("Connection Error", connectionStatus.message, [
        { text: "OK", onPress: clearErrors }
      ]);
    }
  }, [connectionStatus]);

  const handleDevicePress = (device: BluetoothDevice) => {
    connectToDevice(device.id);
  };

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => (
    <TouchableOpacity
      style={[styles.deviceItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      onPress={() => handleDevicePress(item)}
      disabled={connectionStatus.status === 'connecting'}
    >
      <View style={styles.deviceInfo}>
        <Ionicons name="bluetooth" size={24} color={AppColors.primary} />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.deviceName, { color: themeColors.text }]}>
            {item.name || "Unknown Device"}
          </Text>
          <Text style={[styles.deviceId, { color: themeColors.textSecondary }]}>
            {item.id}
          </Text>
        </View>
      </View>
      
      {connectionStatus.status === 'connecting' ? (
         <ActivityIndicator size="small" color={AppColors.primary} />
      ) : (
         <Ionicons name="chevron-forward" size={20} color={themeColors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: themeColors.text }]}>Find Devices</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Scan and connect to your irrigation system
          </Text>
        </View>
        <TouchableOpacity 
            onPress={isScanning ? stopScan : startScan} 
            style={[styles.scanBtn, { backgroundColor: isScanning ? AppColors.danger : AppColors.primary }]}
        >
            {isScanning ? (
                <ActivityIndicator color="white" size="small" />
            ) : (
                <Ionicons name="refresh" size={20} color="white" />
            )}
        </TouchableOpacity>
      </View>

      {connectionStatus.status === 'connecting' && (
          <View style={[styles.statusBar, { backgroundColor: AppColors.info + '20' }]}>
              <Text style={{ color: AppColors.info }}>Connecting to device...</Text>
          </View>
      )}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDeviceItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isScanning ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bluetooth-outline" size={64} color={themeColors.textTertiary} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No devices found. Make sure your ESP32 is powered on.
              </Text>
              <Button 
                title="Scan Again" 
                onPress={startScan}
                style={{ marginTop: 20 }}
              />
            </View>
          ) : (
             <View style={styles.emptyContainer}>
                <Text style={{ color: themeColors.textSecondary }}>Scanning for devices...</Text>
             </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  scanBtn: {
      width: 40, height: 40, borderRadius: 20, 
      justifyContent: 'center', alignItems: 'center'
  },
  statusBar: { padding: 10, alignItems: 'center', marginBottom: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center' },
  deviceName: { fontSize: 16, fontWeight: '600' },
  deviceId: { fontSize: 12, marginTop: 2 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    maxWidth: '80%',
  },
});

export default BluetoothScreen;