import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  useColorScheme
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettingsStore } from '../stores/settings-store';
import { useTemperatureStore } from '../stores/temperature-store';
import { useThemeStore } from '../stores/theme-store';

import Button from '../components/Button';
import Card from '../components/Card';
import ThresholdInput from '../components/ThresholdInput';
import colors from '../constants/colors';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets(); // 👈 alt boşluk
  const systemScheme = useColorScheme() || 'light';
  const { theme, setTheme } = useThemeStore();
  const activeTheme = theme || systemScheme;
  const themeColors = activeTheme === 'dark' ? colors.dark : colors.light;

  // MOTOR SETTINGS
  const {
    autoControl,
    moistureThreshold,
    autoDurationSeconds,
    manualDurationSeconds,
    isLoading,
    error,
    loadSettings,
    saveSettings
  } = useSettingsStore();

  const [localAutoControl, setLocalAutoControl] = useState(autoControl);
  const [localMoistureThreshold, setLocalMoistureThreshold] = useState(moistureThreshold);
  const [localAutoDuration, setLocalAutoDuration] = useState(autoDurationSeconds);
  const [localManualDuration, setLocalManualDuration] = useState(manualDurationSeconds);

  // TEMPERATURE SETTINGS
  const {
    temperatureThreshold,
    extraSeconds,
    active,
    updatedAt,
    isLoading: tempLoading,
    error: tempError,
    fetchTemperatureConfig,
    saveTemperatureConfig
  } = useTemperatureStore();

  const [localTempThreshold, setLocalTempThreshold] = useState(temperatureThreshold);
  const [localExtraDuration, setLocalExtraDuration] = useState(extraSeconds);
  const [localActive, setLocalActive] = useState(active);

  useEffect(() => {
    loadSettings();
    fetchTemperatureConfig();
  }, []);

  useEffect(() => {
    setLocalAutoControl(autoControl);
    setLocalMoistureThreshold(moistureThreshold);
    setLocalAutoDuration(autoDurationSeconds);
    setLocalManualDuration(manualDurationSeconds);
  }, [autoControl, moistureThreshold, autoDurationSeconds, manualDurationSeconds]);

  useEffect(() => {
    setLocalTempThreshold(temperatureThreshold);
    setLocalExtraDuration(extraSeconds);
    setLocalActive(active);
  }, [temperatureThreshold, extraSeconds, active]);

  const handleMotorSave = () => {
    saveSettings({
      autoControl: localAutoControl,
      moistureThreshold: localMoistureThreshold,
      autoDurationSeconds: localAutoDuration,
      manualDurationSeconds: localManualDuration
    });
  };

  const handleTempSave = () => {
    saveTemperatureConfig({
      threshold: localTempThreshold,
      extraSeconds: localExtraDuration,
      active: localActive
    });
  };

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return 'Never';
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleString();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 40 + insets.bottom }]}
        style={{ backgroundColor: themeColors.background }}
      >
        <Text style={[styles.title, { color: themeColors.text }]}>Settings</Text>

        {/* Appearance */}
        <Card>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Appearance</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>Dark Mode</Text>
            <Switch
              value={activeTheme === 'dark'}
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ false: themeColors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </Card>

        {/* Motor Settings */}
        {error ? (
          <Card>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </Card>
        ) : (
          <Card>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Motor Control</Text>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Auto Control</Text>
              <Switch
                value={localAutoControl}
                onValueChange={setLocalAutoControl}
                trackColor={{ false: themeColors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>

            <ThresholdInput
              label="Moisture Threshold (%)"
              value={localMoistureThreshold}
              onValueChange={setLocalMoistureThreshold}
              min={0}
              max={100}
              unit="%"
            />
            <ThresholdInput
              label="Auto Duration"
              value={localAutoDuration}
              onValueChange={setLocalAutoDuration}
              min={5}
              max={600}
              unit="sec"
            />
            <ThresholdInput
              label="Manual Duration"
              value={localManualDuration}
              onValueChange={setLocalManualDuration}
              min={5}
              max={600}
              unit="sec"
            />

            <Button
              title="Save Motor Settings"
              onPress={handleMotorSave}
              style={styles.saveButton}
              loading={isLoading}
            />
          </Card>
        )}

        {/* Temperature Settings */}
        {tempError ? (
          <Card>
            <Text style={[styles.errorText, { color: colors.danger }]}>{tempError}</Text>
          </Card>
        ) : (
          <Card>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Temperature Control</Text>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Active</Text>
              <Switch
                value={localActive}
                onValueChange={setLocalActive}
                trackColor={{ false: themeColors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>

            <ThresholdInput
              label="Temperature Threshold (°C)"
              value={localTempThreshold}
              onValueChange={setLocalTempThreshold}
              min={0}
              max={60}
              unit="°C"
            />
            <ThresholdInput
              label="Extra Duration"
              value={localExtraDuration}
              onValueChange={setLocalExtraDuration}
              min={0}
              max={300}
              unit="sec"
            />

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

        {/* About */}
        <Card>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>About</Text>
          <Text style={[styles.aboutText, { color: themeColors.text }]}>
            Smart Irrigation System v1.0.0
          </Text>
          <Text style={[styles.aboutSubtext, { color: themeColors.textSecondary }]}>
            A modern solution for efficient irrigation management
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500'
  },
  saveButton: {
    marginTop: 16
  },
  lastUpdated: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center'
  },
  aboutText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4
  },
  aboutSubtext: {
    fontSize: 14
  }
});