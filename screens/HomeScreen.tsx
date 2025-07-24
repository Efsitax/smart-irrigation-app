import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Droplets, Activity, Wifi } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDashboardStore } from '../stores/dashboard-store';
import { useThemeStore } from '../stores/theme-store';
import MoistureIndicator from '../components/MoistureIndicator';
import BatteryIndicator from '../components/BatteryIndicator';
import Card from '../components/Card';
import colors from '../constants/colors';

export default function HomeScreen() {
  const theme = useThemeStore((state) => state.theme);
  const themeColors = theme === 'dark' ? colors.dark : colors.light;

  const {
    moisture,
    battery,
    isLoading,
    error,
    fetchData,
    lastUpdated,
  } = useDashboardStore();

  // Ekran odaklandığında ve her 60 saniyede bir veriyi çek
  useFocusEffect(
    useCallback(() => {
      fetchData();
      const interval = setInterval(fetchData, 60_000);
      return () => clearInterval(interval);
    }, [fetchData])
  );

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return 'Never';
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleString();
  };

  const getStatusInfo = () => {
    const val = moisture ?? 0;
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
      colors={[themeColors.background, themeColors.backgroundSecondary]} // 💡 updated
      style={{ flex: 1, paddingBottom: insets.bottom }} // ✅ Home Indicator alanına gradient uygulanır
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
              <Text style={[styles.title, { color: themeColors.text }]}> {/* 💡 updated */}
                Smart Garden
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}> {/* 💡 updated */}
                Irrigation System Dashboard
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
                <MoistureIndicator value={moisture ?? 0} size={220} />
                <View style={styles.timestampContainer}>
                  <Text style={[styles.timestampLabel, { color: themeColors.textSecondary }]}> {/* 💡 updated */}
                    Last reading
                  </Text>
                  <Text style={[styles.timestampText, { color: themeColors.text }]}> {/* 💡 updated */}
                    {formatTimestamp(lastUpdated)}
                  </Text>
                </View>
              </Card>

              {/* System Status */}
              <Card variant="gradient" gradientColors={status.gradient}>
                <View style={styles.systemStatus}>
                  <Text style={styles.systemTitle}>System Status</Text>
                  <BatteryIndicator level={battery ?? 0} size={28} />
                  <View style={styles.statusDetails}>
                    <Text style={styles.statusDetailText}>
                      Battery updated: {formatTimestamp(lastUpdated)}
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
                    <Text style={[styles.statValue, { color: themeColors.text }]}> {/* 💡 updated */}
                      {moisture ?? 0}%
                    </Text>
                    <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}> {/* 💡 updated */}
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
                    <Text style={[styles.statValue, { color: themeColors.text }]}> {/* 💡 updated */}
                      {battery ?? 0}%
                    </Text>
                    <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}> {/* 💡 updated */}
                      Battery
                    </Text>
                  </View>
                </Card>
              </View>

              {/* Last Update */}
              <View style={styles.lastUpdateContainer}>
                <Text style={[styles.lastUpdateText, { color: themeColors.textTertiary }]}> {/* 💡 updated */}
                  Dashboard updated: {formatTimestamp(lastUpdated)}
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