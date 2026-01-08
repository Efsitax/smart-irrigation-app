import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import colors from '../constants/colors';

export default function MotorControlScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;

  const { sendCommand, connectedDevice, telemetry, clearErrors } = useBluetoothStore();
  
  // --- TELEMETRY DATA ---
  const currentMoisture = telemetry?.moisture ?? 0; 
  const realIsOn = telemetry?.isPumpOn || false;

  // --- UI STATE ---
  const [optimisticOn, setOptimisticOn] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const displayIsOn = realIsOn || optimisticOn;

  const [autoControl, setAutoControl] = useState(false);
  const [manualDurationSeconds, setManualDurationSeconds] = useState(10);
  
  // New States: We hold these values to sync them when Auto Mode is toggled
  const [storedThreshold, setStoredThreshold] = useState(30);
  const [storedAutoDuration, setStoredAutoDuration] = useState(10);
  
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // --- FETCH SETTINGS ---
  const fetchSettings = () => {
    try {
      const state = getMotorState();
      if (state) {
        setAutoControl(state.autoControl);
        setManualDurationSeconds(state.manualDurationSeconds);
        // Important: Fetch hidden values to ensure we send the latest data
        setStoredThreshold(state.moistureThreshold);
        setStoredAutoDuration(state.autoDurationSeconds);
      }
    } catch (err: any) {
      console.log("Error fetching settings:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [])
  );

  useEffect(() => {
    if (realIsOn) {
      setOptimisticOn(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [realIsOn]);

  // --- MANUAL MOTOR CONTROL ---
  const handleToggleMotor = async () => {
    if (!connectedDevice) {
        Alert.alert("Connection Error", "Device not connected. Please connect first.");
        return;
    }
    if (displayIsOn) {
        Alert.alert("Info", "Motor is already running.");
        return;
    }

    setOptimisticOn(true);
    setIsLoading(true);
    setLocalError(null);

    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      const payload = JSON.stringify({
        command: "ON",
        duration: manualDurationSeconds
      });
      await sendCommand(payload);
      
      addMotorLog({
          startTime: new Date().toISOString(),
          durationSeconds: manualDurationSeconds,
          moistureAtTrigger: currentMoisture,
          mode: 'MANUAL'
      });

      timerRef.current = setTimeout(() => {
        setOptimisticOn(false);
      }, (manualDurationSeconds * 1000) + 2000);
      
    } catch (err: any) {
      setOptimisticOn(false); 
      setLocalError(err.message || 'Failed to send command');
      Alert.alert("Error", "Failed to send command");
    } finally {
      setIsLoading(false);
    }
  };

  // --- AUTO MODE CONTROL (SAFEST METHOD) ---
  const handleToggleAutoControl = async (val: boolean) => {
      // 1. Update Local State and Database
      setAutoControl(val);
      updateMotorState({ autoControl: val });

      // 2. Send to Device (Full Synchronization)
      if (connectedDevice) {
        try {
          // SAFETY: We send the stored threshold and duration along with the auto_ctrl command.
          // This ensures the device has the correct values even if they weren't synced in SettingsScreen.
          const payload = JSON.stringify({ 
            auto_ctrl: val,
            threshold: storedThreshold,
            auto_dur: storedAutoDuration
          });
          
          await sendCommand(payload);
          
        } catch (e) {
          Alert.alert("Error", "Failed to send auto mode settings to device.");
          setAutoControl(!val);
          updateMotorState({ autoControl: !val });
        }
      } else {
        Alert.alert("Warning", "Device not connected. Setting saved locally but not synced. Please retry when connected.");
      }
  };

  const motorInfo = autoControl
    ? { color: colors.secondary, gradient: colors.gradients.secondary, text: 'Auto Mode' }
    : displayIsOn
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
                Current Moisture: {currentMoisture}%
              </Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: motorInfo.color + '20' }]}>
              <Power size={16} color={motorInfo.color} />
            </View>
          </View>

          {localError && (
            <Card variant="elevated">
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{localError}</Text>
              </View>
            </Card>
          )}

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
                  title={displayIsOn ? `Running...` : `Start Motor (${manualDurationSeconds}s)`}
                  onPress={handleToggleMotor}
                  variant="glass"
                  loading={isLoading}
                  disabled={displayIsOn || autoControl} 
                  style={styles.motorButton}
                />
                
                {autoControl && (
                    <Text style={{color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8, textAlign: 'center'}}>
                        Device manages irrigation automatically based on Settings.
                        {"\n"}(Threshold: {storedThreshold}%, Duration: {storedAutoDuration}s)
                    </Text>
                )}
            </View>
          </Card>

          <Card variant="elevated">
            <View style={styles.autoControlHeader}>
                <View style={styles.autoControlTitleContainer}>
                <SettingsIcon size={20} color={colors.secondary} />
                <View>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Auto Control</Text>
                  <Text style={{fontSize:10, color: theme.textSecondary}}>Device-side automation</Text>
                </View>
                </View>
                <Switch
                value={autoControl}
                onValueChange={handleToggleAutoControl}
                trackColor={{ false: theme.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                />
            </View>
            
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: theme.textSecondary, fontStyle: 'italic', fontSize: 13 }}>
                * Thresholds are synced automatically when enabling Auto Mode. Configure values in Settings tab.
              </Text>
            </View>
          </Card>

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
  errorContainer: { alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, textAlign: 'center', fontWeight: '500' },
});