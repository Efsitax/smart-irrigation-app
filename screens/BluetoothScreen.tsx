import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useBluetoothStore } from '../stores/bluetooth-store';
import { useThemeStore } from '../stores/theme-store';
import Button from '../components/Button';
import AppColors from '../constants/colors';

// Tipi artık merkezi types dosyasından alıyoruz
import { BluetoothDevice } from '../types/bluetooth';

const BluetoothScreen = () => {
  const navigation = useNavigation();
  const { theme } = useThemeStore();
  
  const themeColors = theme === 'dark' ? AppColors.dark : AppColors.light;

  const {
    devices,
    isScanning,
    connectionStatus,
    startScan,
    stopScan,
    connectToDevice,
    clearErrors
  } = useBluetoothStore();

  // Ekran açıldığında otomatik tarama başlat
  useEffect(() => {
    startScan();
    return () => {
      stopScan();
      clearErrors();
    };
  }, []);

  // Bağlantı başarılı olduğunda ana ekrana yönlendir
  useEffect(() => {
    if (connectionStatus.status === 'success') {
       // DÜZELTME BURADA YAPILDI: 'Main' yerine 'HomeTabs'
       navigation.reset({
        index: 0,
        routes: [{ name: 'HomeTabs' as never }], 
      });
    }
  }, [connectionStatus.status]);

  // Hata durumlarını kullanıcıya bildir
  useEffect(() => {
    if (connectionStatus.status === 'error' && connectionStatus.message) {
      Alert.alert("Connection Error", connectionStatus.message, [
        { text: "OK", onPress: clearErrors }
      ]);
    }
  }, [connectionStatus]);

  const handleDevicePress = (device: BluetoothDevice) => {
    if (connectionStatus.status === 'connecting') return;
    connectToDevice(device.id);
  };

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => {
    // Sadece bu cihaza bağlanılıyorsa spinner göster
    const isConnectingToThis = connectionStatus.status === 'connecting' && connectionStatus.message?.includes('Connecting'); 

    return (
      <TouchableOpacity
        style={[styles.deviceItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        onPress={() => handleDevicePress(item)}
        disabled={connectionStatus.status === 'connecting'}
      >
        <View style={styles.deviceInfo}>
          <View style={[styles.iconContainer, { backgroundColor: AppColors.primary + '20' }]}>
             <Ionicons name="bluetooth" size={24} color={AppColors.primary} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.deviceName, { color: themeColors.text }]}>
              {item.name || "Unknown Device"}
            </Text>
            <Text style={[styles.deviceId, { color: themeColors.textSecondary }]}>
              {item.id}
            </Text>
            {item.rssi && (
               <Text style={[styles.rssiText, { color: themeColors.textTertiary }]}>
                 Signal: {item.rssi} dBm
               </Text>
            )}
          </View>
        </View>
        
        {isConnectingToThis ? (
           <ActivityIndicator size="small" color={AppColors.primary} />
        ) : (
           <Ionicons name="chevron-forward" size={20} color={themeColors.textTertiary} />
        )}
      </TouchableOpacity>
    );
  };

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

      {/* Dinamik Durum Çubuğu */}
      {(connectionStatus.status === 'connecting' || connectionStatus.status === 'scanning') && connectionStatus.message && (
          <View style={[styles.statusBar, { backgroundColor: AppColors.info + '15' }]}>
              <ActivityIndicator size="small" color={AppColors.info} style={{ marginRight: 8 }} />
              <Text style={{ color: AppColors.info, fontWeight: '500' }}>
                  {connectionStatus.message}
              </Text>
          </View>
      )}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDeviceItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isScanning && connectionStatus.status !== 'connecting' ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconData, { backgroundColor: themeColors.border }]}>
                 <Ionicons name="bluetooth-outline" size={48} color={themeColors.textTertiary} />
              </View>
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Devices Found</Text>
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                Make sure your ESP32 device is powered on and within range.
              </Text>
              <Button 
                title="Scan Again" 
                onPress={startScan}
                style={{ marginTop: 24, minWidth: 200 }}
                variant="outline"
              />
            </View>
          ) : (
             <View style={styles.emptyContainer}>
                {/* Liste boşken ve tarama sürüyorken burası görünür */}
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
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4, fontWeight: '500' },
  scanBtn: {
      width: 44, height: 44, borderRadius: 22, 
      justifyContent: 'center', alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
  },
  statusBar: { 
      flexDirection: 'row',
      padding: 12, 
      alignItems: 'center', 
      justifyContent: 'center',
      marginBottom: 10,
      marginHorizontal: 20,
      borderRadius: 12
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    // Hafif gölge efekti
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
      width: 48, height: 48, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center'
  },
  deviceName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  deviceId: { fontSize: 12, fontFamily: 'monospace', opacity: 0.7 },
  rssiText: { fontSize: 11, marginTop: 4 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40
  },
  emptyIconData: {
      width: 80, height: 80, borderRadius: 40,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 16
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
});

export default BluetoothScreen;