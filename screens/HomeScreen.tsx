import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Droplets, Activity, Wifi, WifiOff } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Stores
import { useDashboardStore } from '../stores/dashboard-store';
import { useBluetoothStore } from '../stores/bluetooth-store';
import { useThemeStore } from '../stores/theme-store';

// Services
import { saveSensorData } from '../services/DatabaseService';

// Components
import MoistureIndicator from '../components/MoistureIndicator';
import BatteryIndicator from '../components/BatteryIndicator';
import Card from '../components/Card';
import colors from '../constants/colors';

export default function HomeScreen() {
  const theme = useThemeStore((state) => state.theme);
  const themeColors = theme === 'dark' ? colors.dark : colors.light;

  // 1. OFFLINE DATA (DB)
  const {
    moisture: dbMoisture,
    battery: dbBattery,
    isLoading,
    error,
    fetchData,
    lastUpdated,
  } = useDashboardStore();

  const { connectedDevice, telemetry } = useBluetoothStore();
  const isConnected = !!connectedDevice;

  const currentMoisture = isConnected ? telemetry.moisture : (dbMoisture ?? 0);
  const currentBattery = isConnected ? telemetry.battery : (dbBattery ?? 0);
  
  const displayTimestamp = isConnected 
    ? 'Live Data' 
    : (lastUpdated ? new Date(lastUpdated).toLocaleString() : 'No Data');

  const telemetryRef = useRef(telemetry);

  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // AUTO SAVE LOGIC (FIXED)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isConnected) {
        // Sayaç sadece bağlantı durumuna göre başlar, veri değişiminde sıfırlanmaz.
        interval = setInterval(() => {
            const currentData = telemetryRef.current;
            
            // Sadece geçerli veri varsa kaydet
            if (currentData.moisture > 0 || currentData.battery > 0) {
                console.log("Saving live data to DB...", currentData);
                saveSensorData(currentData.moisture, currentData.battery);
                fetchData(); // DB'den son veriyi çekerek UI'daki "Last Saved" bilgisini güncelle
            }
        }, 60000); // 1 Dakika
    }

    return () => clearInterval(interval);
  }, [isConnected]); // telemetry bağımlılıktan çıkarıldı


  const getStatusInfo = () => {
    if (!isConnected && !lastUpdated) {
        return {
            color: themeColors.textSecondary, 
            text: 'No Connection',
            icon: WifiOff,
            gradient: ['#9ca3af', '#4b5563'] as const,
        };
    }

    const val = currentMoisture;
    if (val < 30) {
      return {
        color: colors.danger,
        text: 'Needs Water',
        icon: Droplets,
        gradient: colors.gradients.danger,
      };
    } else if (val < 60) {
      return {
        color: colors.warning,
        text: 'Moderate',
        icon: Activity,
        gradient: colors.gradients.accent,
      };
    } else {
      return {
        color: colors.primary,
        text: 'Optimal',
        icon: Wifi,
        gradient: colors.gradients.primary,
      };
    }
  };

  const status = getStatusInfo();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[themeColors.background, themeColors.backgroundSecondary]}
      style={{ flex: 1, paddingBottom: insets.bottom }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchData}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: themeColors.text }]}>
                Smart Garden
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                {isConnected ? 'System Connected' : 'Offline Mode'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: status.color + '20' },
              ]}
            >
              <status.icon size={16} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
          </View>

          {error ? (
            <Card variant="elevated">
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            </Card>
          ) : (
            <>
              {/* Main Moisture */}
              <Card variant="elevated" style={styles.moistureCard}>
                <MoistureIndicator value={currentMoisture} size={220} />
                <View style={styles.timestampContainer}>
                  <Text style={[styles.timestampLabel, { color: themeColors.textSecondary }]}>
                    {isConnected ? 'Live Reading' : 'Last Reading'}
                  </Text>
                  <Text style={[styles.timestampText, { color: themeColors.text }]}>
                    {displayTimestamp}
                  </Text>
                </View>
              </Card>

              {/* System Status */}
              <Card variant="gradient" gradientColors={status.gradient as any}>
                <View style={styles.systemStatus}>
                  <Text style={styles.systemTitle}>System Status</Text>
                  <BatteryIndicator level={currentBattery} size={28} />
                  <View style={styles.statusDetails}>
                    <Text style={styles.statusDetailText}>
                       {isConnected 
                         ? `Signal: ${connectedDevice?.rssi || '-55'} dBm`
                         : `Battery Last Info: ${currentBattery}%`
                       }
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Quick Stats */}
              <View style={styles.statsGrid}>
                <Card variant="glass" style={styles.statCard}>
                  <View style={styles.statContent}>
                    <View
                      style={[
                        styles.statIcon,
                        { backgroundColor: colors.primary + '20' },
                      ]}
                    >
                      <Droplets size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.statValue, { color: themeColors.text }]}>
                      {currentMoisture}%
                    </Text>
                    <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                      Moisture
                    </Text>
                  </View>
                </Card>

                <Card variant="glass" style={styles.statCard}>
                  <View style={styles.statContent}>
                    <View
                      style={[
                        styles.statIcon,
                        { backgroundColor: colors.secondary + '20' },
                      ]}
                    >
                      <Activity size={20} color={colors.secondary} />
                    </View>
                    <Text style={[styles.statValue, { color: themeColors.text }]}>
                      {currentBattery}%
                    </Text>
                    <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                      Battery
                    </Text>
                  </View>
                </Card>
              </View>

              {/* Footer Info */}
              <View style={styles.lastUpdateContainer}>
                <Text style={[styles.lastUpdateText, { color: themeColors.textTertiary }]}>
                  {isConnected 
                    ? "Saving data automatically every minute..."
                    : "Connect via Bluetooth for live updates"
                  }
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 90,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: { fontSize: 14, fontWeight: '600' },
  moistureCard: { alignItems: 'center', marginBottom: 20 },
  timestampContainer: { alignItems: 'center', marginTop: 16 },
  timestampLabel: { fontSize: 14, fontWeight: '500' },
  timestampText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  systemStatus: { alignItems: 'center' },
  systemTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  statusDetails: { marginTop: 12, alignItems: 'center' },
  statusDetailText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 20 },
  statContent: { alignItems: 'center' },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  errorContainer: { alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, textAlign: 'center', fontWeight: '500' },
  lastUpdateContainer: { alignItems: 'center', marginTop: 8 },
  lastUpdateText: { fontSize: 12, fontWeight: '500' },
});