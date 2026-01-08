import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettingsStore } from '../stores/settings-store';
import { useTemperatureStore } from '../stores/temperature-store';
import { useThemeStore } from '../stores/theme-store';
import { useBluetoothStore } from '../stores/bluetooth-store'; // Bluetooth Store added

import Button from '../components/Button';
import Card from '../components/Card';
import ThresholdInput from '../components/ThresholdInput';
import AppColors from '../constants/colors';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, setTheme } = useThemeStore();
  const themeColors = AppColors[theme === 'dark' ? 'dark' : 'light'];

  // Get necessary functions from Bluetooth Store
  const { sendCommand, connectedDevice } = useBluetoothStore();

  const {
    autoControl,
    moistureThreshold,
    autoDurationSeconds,
    manualDurationSeconds,
    isLoading,
    error,
    loadSettings,
    saveSettings,
  } = useSettingsStore();

  const [localAutoControl, setLocalAutoControl] = useState<boolean | null>(null);
  const [localMoistureThreshold, setLocalMoistureThreshold] = useState<number | null>(null);
  const [localAutoDuration, setLocalAutoDuration] = useState<number | null>(null);
  const [localManualDuration, setLocalManualDuration] = useState<number | null>(null);

  // ... Temperature Store codes can remain the same (Not sending temperature to ESP32 for now) ...
  const {
    temperatureThreshold,
    extraSeconds,
    active,
    updatedAt,
    isLoading: tempLoading,
    error: tempError,
    fetchTemperatureConfig,
    saveTemperatureConfig,
  } = useTemperatureStore();

  const [localTempThreshold, setLocalTempThreshold] = useState<number | null>(null);
  const [localExtraDuration, setLocalExtraDuration] = useState<number | null>(null);
  const [localActive, setLocalActive] = useState<boolean | null>(null);

  useEffect(() => {
    loadSettings();
    fetchTemperatureConfig();
  }, []);

  useEffect(() => {
    if (autoControl !== undefined) setLocalAutoControl(autoControl);
    if (moistureThreshold !== undefined) setLocalMoistureThreshold(moistureThreshold);
    if (autoDurationSeconds !== undefined) setLocalAutoDuration(autoDurationSeconds);
    if (manualDurationSeconds !== undefined) setLocalManualDuration(manualDurationSeconds);
  }, [autoControl, moistureThreshold, autoDurationSeconds, manualDurationSeconds]);

  useEffect(() => {
    if (temperatureThreshold !== undefined) setLocalTempThreshold(temperatureThreshold);
    if (extraSeconds !== undefined) setLocalExtraDuration(extraSeconds);
    if (active !== undefined) setLocalActive(active);
  }, [temperatureThreshold, extraSeconds, active]);

  const handleMotorSave = async () => {
    if (
      localAutoControl === null ||
      localMoistureThreshold === null ||
      localAutoDuration === null ||
      localManualDuration === null
    ) return;

    const newMoisture = Number(localMoistureThreshold);
    const newAutoDur = Number(localAutoDuration);
    const newManualDur = Number(localManualDuration);

    if (isNaN(newMoisture) || isNaN(newAutoDur) || isNaN(newManualDur)) {
      Alert.alert("Invalid Input", "Please enter valid numbers.");
      return;
    }

    if (newAutoDur < 5 || newManualDur < 5) {
      Alert.alert("Validation Error", "Duration must be at least 5 seconds.");
      return;
    }

    // 1. Save to Database (Local)
    await saveSettings({
      autoControl: localAutoControl,
      moistureThreshold: newMoisture,
      autoDurationSeconds: newAutoDur,
      manualDurationSeconds: newManualDur,
    });

    // 2. Send to ESP32 (Remote)
    if (connectedDevice) {
      try {
        // JSON format expected by ESP32
        const payload = JSON.stringify({
          auto_ctrl: localAutoControl,
          threshold: newMoisture,
          auto_dur: newAutoDur,
          manual_dur: newManualDur
        });
        
        await sendCommand(payload);
        Alert.alert("Success", "Settings saved locally and synced to device!");
      } catch (err) {
        Alert.alert("Warning", "Saved locally but failed to sync with device.");
      }
    } else {
      Alert.alert("Saved Locally", "Device is not connected. Connect to sync settings.");
    }
  };

  const handleTempSave = async () => {
    if (localTempThreshold === null || localExtraDuration === null || localActive === null) return;

    const newThreshold = Number(localTempThreshold);
    const newExtra = Number(localExtraDuration);

    if (isNaN(newThreshold) || isNaN(newExtra)) {
      Alert.alert("Invalid Input", "Please enter valid numbers.");
      return;
    }

    await saveTemperatureConfig({
      threshold: newThreshold,
      extraSeconds: newExtra,
      active: localActive,
    });
    Alert.alert("Success", "Temperature settings saved.");
  };

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return 'Never';
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleString();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 90 + insets.bottom }]}
        style={{ backgroundColor: themeColors.background }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: themeColors.text }]}>Settings</Text>

        {/* ... Appearance Section ... */}
        <Card>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Appearance</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>Dark Mode</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ false: themeColors.border, true: AppColors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </Card>

        {error ? (
          <Card>
            <Text style={[styles.errorText, { color: AppColors.danger }]}>{error}</Text>
          </Card>
        ) : (
          <Card>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Motor & Automation</Text>
            
            <View style={{ marginBottom: 10 }}>
                <Text style={{ color: themeColors.textSecondary, fontSize: 12 }}>
                    These settings are synced to the device for offline automation.
                </Text>
            </View>

            {localAutoControl !== null && (
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>Auto Control (Offline)</Text>
                <Switch
                  value={localAutoControl}
                  onValueChange={setLocalAutoControl}
                  trackColor={{ false: themeColors.border, true: AppColors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            )}

            {localMoistureThreshold !== null && (
              <ThresholdInput
                label="Moisture Threshold (%)"
                value={localMoistureThreshold}
                onValueChange={setLocalMoistureThreshold}
                min={0}
                max={100}
                unit="%"
              />
            )}

            {localAutoDuration !== null && (
              <ThresholdInput
                label="Auto Duration"
                value={localAutoDuration}
                onValueChange={setLocalAutoDuration}
                min={5}
                max={600}
                unit="sec"
              />
            )}

            {localManualDuration !== null && (
              <ThresholdInput
                label="Manual Duration"
                value={localManualDuration}
                onValueChange={setLocalManualDuration}
                min={5}
                max={600}
                unit="sec"
              />
            )}

            <Button
              title="Save & Sync Settings"
              onPress={handleMotorSave}
              style={styles.saveButton}
              loading={isLoading}
            />
          </Card>
        )}

        {/* ... Temperature Section ... */}
        {tempError ? (
          <Card>
            <Text style={[styles.errorText, { color: AppColors.danger }]}>{tempError}</Text>
          </Card>
        ) : (
           <Card>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Temperature Control</Text>
            {localActive !== null && (
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>Active</Text>
                <Switch
                  value={localActive}
                  onValueChange={setLocalActive}
                  trackColor={{ false: themeColors.border, true: AppColors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            )}
            {localTempThreshold !== null && (
              <ThresholdInput
                label="Temperature Threshold (°C)"
                value={localTempThreshold}
                onValueChange={setLocalTempThreshold}
                min={0}
                max={60}
                unit="°C"
              />
            )}
            {localExtraDuration !== null && (
              <ThresholdInput
                label="Extra Duration"
                value={localExtraDuration}
                onValueChange={setLocalExtraDuration}
                min={0}
                max={300}
                unit="sec"
              />
            )}
            <Button
              title="Save Temperature Settings"
              onPress={handleTempSave}
              style={styles.saveButton}
              loading={tempLoading}
            />
             {updatedAt && (
              <Text style={[styles.lastUpdated, { color: themeColors.textSecondary }]}>
                Last updated: {formatTimestamp(updatedAt)}
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  settingLabel: { fontSize: 16, fontWeight: '500' },
  saveButton: { marginTop: 16 },
  lastUpdated: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  errorText: { fontSize: 16, textAlign: 'center' },
  aboutText: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  aboutSubtext: { fontSize: 14 },
});