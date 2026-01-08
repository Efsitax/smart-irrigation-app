import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Power, Settings as SettingsIcon } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMotorState, updateMotorState, addMotorLog } from '../services/DatabaseService';
import { useBluetoothStore } from '../stores/bluetooth-store';
import { useThemeStore } from '../stores/theme-store';

import Button from '../components/Button';
import Card from '../components/Card';
import ThresholdInput from '../components/ThresholdInput';
import colors from '../constants/colors';

export default function MotorControlScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;

  // connectionStatus ve clearErrors eklendi
  const { sendCommand, connectedDevice, telemetry, connectionStatus, clearErrors } = useBluetoothStore();
  const isOn = telemetry?.isPumpOn || false; 
  
  const [autoControl, setAutoControl] = useState(false);
  const [moistureThreshold, setMoistureThreshold] = useState(30);
  const [autoDurationSeconds, setAutoDurationSeconds] = useState(10);
  const [manualDurationSeconds, setManualDurationSeconds] = useState(10);
  
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null); // İsim çakışmasını önlemek için localError

  const fetchSettings = () => {
    try {
      const state = getMotorState();
      if (state) {
        setAutoControl(state.autoControl);
        setMoistureThreshold(state.moistureThreshold);
        setAutoDurationSeconds(state.autoDurationSeconds);
        setManualDurationSeconds(state.manualDurationSeconds);
      }
    } catch (err: any) {
      console.log("Error fetching settings:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [])
  );

  // Bluetooth Bağlantı Hatalarını Dinle (Simülasyon veya Gerçek)
  useEffect(() => {
    if (connectionStatus.status === 'error' && connectionStatus.message) {
      Alert.alert("Connection Error", connectionStatus.message, [
        { text: "OK", onPress: clearErrors }
      ]);
    }
  }, [connectionStatus]);

  const handleToggleMotor = async () => {
    if (!connectedDevice) {
        Alert.alert("Connection Error", "Device not connected. Please connect via Bluetooth first.");
        return;
    }

    if (isOn) return;

    try {
      setIsLoading(true);
      setLocalError(null);

      // Komut gönder (Store'daki simülasyon veya gerçek BLE)
      await sendCommand("ON", manualDurationSeconds);
      
      // Log kaydı oluştur
      try {
          addMotorLog({
              startTime: new Date().toISOString(),
              durationSeconds: manualDurationSeconds,
              moistureAtTrigger: telemetry.moisture || 0,
              mode: 'MANUAL'
          });
      } catch (e) {
          console.log("Log error:", e);
      }

      fetchSettings();
      
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send command');
    } finally {
      // Simülasyon modunda komut çok hızlı dönebilir, UI akışını bozmaz.
      setIsLoading(false);
    }
  };

  const saveLocalSettings = (newSettings: any) => {
      try {
          // Setting saving is instantaneous mostly, but kept async pattern if needed
          updateMotorState(newSettings);
          
          if (newSettings.autoControl !== undefined) setAutoControl(newSettings.autoControl);
          if (newSettings.moistureThreshold !== undefined) setMoistureThreshold(newSettings.moistureThreshold);
          if (newSettings.autoDurationSeconds !== undefined) setAutoDurationSeconds(newSettings.autoDurationSeconds);
          if (newSettings.manualDurationSeconds !== undefined) setManualDurationSeconds(newSettings.manualDurationSeconds);
          
      } catch (err: any) {
          setLocalError("Failed to save settings");
      }
  }

  const handleToggleAutoControl = (val: boolean) => {
      saveLocalSettings({ autoControl: val });
  };

  const motorInfo = autoControl
    ? { color: colors.secondary, gradient: colors.gradients.secondary, text: 'Auto Mode' }
    : isOn
      ? { color: colors.primary,   gradient: colors.gradients.primary,   text: 'Running' }
      : { color: colors.danger,    gradient: colors.gradients.danger,    text: 'Stopped' };

  return (
    <LinearGradient
      colors={[theme.background, theme.backgroundSecondary]}
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Motor Control</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Manage your irrigation system
              </Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: motorInfo.color + '20' }]}>
              <Power size={16} color={motorInfo.color} />
            </View>
          </View>

          {localError ? (
            <Card variant="elevated">
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{localError}</Text>
              </View>
            </Card>
          ) : (
            <>
              <Card variant="gradient" gradientColors={motorInfo.gradient}>
                <View style={styles.motorStatusContainer}>
                  <View style={styles.motorStatusHeader}>
                    <View style={styles.motorIcon}>
                      <Power size={32} color="white" />
                    </View>
                    <View style={styles.motorStatusInfo}>
                      <Text style={styles.motorStatusTitle}>Motor Status</Text>
                      <Text style={styles.motorStatusValue}>{motorInfo.text}</Text>
                    </View>
                  </View>
                  <Button
                    title={isOn ? "Motor Running" : "Start Motor"}
                    onPress={handleToggleMotor}
                    variant="glass"
                    loading={isLoading || connectionStatus.status === 'sending'}
                    disabled={isOn || autoControl} 
                    style={styles.motorButton}
                  />
                  {autoControl && (
                      <Text style={{color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8}}>
                          Disable Auto Mode to control manually
                      </Text>
                  )}
                </View>
              </Card>

              <Card variant="elevated">
                <View style={styles.autoControlHeader}>
                  <View style={styles.autoControlTitleContainer}>
                    <SettingsIcon size={20} color={colors.secondary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Auto Control</Text>
                  </View>
                  <Switch
                    value={autoControl}
                    onValueChange={handleToggleAutoControl}
                    trackColor={{ false: theme.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingsContainer, !autoControl && styles.disabledSettings]}>
                  <View style={styles.settingsGrid}>
                    <ThresholdInput
                      label="Moisture Threshold"
                      value={moistureThreshold}
                      onValueChange={(val) => saveLocalSettings({ moistureThreshold: val })}
                      min={0}
                      max={100}
                      unit="%"
                    />
                    <ThresholdInput
                      label="Auto Duration"
                      value={autoDurationSeconds}
                      onValueChange={(val) => saveLocalSettings({ autoDurationSeconds: val })}
                      min={5}
                      max={600}
                      unit="sec"
                    />
                    <ThresholdInput
                      label="Manual Duration"
                      value={manualDurationSeconds}
                      onValueChange={(val) => saveLocalSettings({ manualDurationSeconds: val })}
                      min={5}
                      max={600}
                      unit="sec"
                    />
                  </View>
                </View>
              </Card>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 90 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24,
  },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: 16, fontWeight: '500', marginTop: 4, letterSpacing: -0.2 },
  statusIndicator: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  motorStatusContainer: { alignItems: 'center' },
  motorStatusHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
  },
  motorIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  motorStatusInfo: { flex: 1 },
  motorStatusTitle: { fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 4 },
  motorStatusValue: { fontSize: 24, fontWeight: '800', color: 'white', letterSpacing: -0.5 },
  motorButton: { marginTop: 20, minWidth: 200 },
  autoControlHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  autoControlTitleContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  settingsContainer: { marginTop: 8 },
  disabledSettings: { opacity: 0.5 },
  settingsGrid: { gap: 16, marginBottom: 24 },
  saveButton: { marginTop: 8 },
  errorContainer: { alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, textAlign: 'center', fontWeight: '500' },
});