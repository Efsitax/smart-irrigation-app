// src/screens/MotorControlScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Power, Settings as SettingsIcon } from 'lucide-react-native';
import { useThemeStore } from '../stores/theme-store';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getMotorState,
  manualMotorControl,
  updateMotorState
} from '../api/motorService';

import Button from '../components/Button';
import Card from '../components/Card';
import ThresholdInput from '../components/ThresholdInput';
import colors from '../constants/colors';

export default function MotorControlScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;

  const [isOn, setIsOn] = useState(false);
  const [moistureThreshold, setMoistureThreshold] = useState(30);
  const [manualDuration, setManualDuration] = useState(60);
  const [autoDuration, setAutoDuration] = useState(120);
  const [autoControl, setAutoControl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMotorState = async () => {
    try {
      setIsLoading(true);
      const state = await getMotorState();
      setIsOn(state.isOn);
      setAutoControl(state.autoControl);
      setMoistureThreshold(state.moistureThreshold);
      setManualDuration(state.manualDurationSeconds);
      setAutoDuration(state.autoDurationSeconds);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch motor state');
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMotorState();
      const iv = setInterval(fetchMotorState, 5000);
      return () => clearInterval(iv);
    }, [])
  );

  const handleToggleMotor = async () => {
    try {
      setIsLoading(true);
      await manualMotorControl();
      await fetchMotorState();
    } catch (err: any) {
      setError(err.message || 'Failed to start motor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoControl = async (val: boolean) => {
    setAutoControl(val);
    try {
      setIsLoading(true);
      await updateMotorState({
        autoControl: val,
        moistureThreshold,
        autoDurationSeconds: autoDuration,
        manualDurationSeconds: manualDuration
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update auto control setting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      await updateMotorState({
        autoControl,
        moistureThreshold,
        autoDurationSeconds: autoDuration,
        manualDurationSeconds: manualDuration
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const motorInfo = isOn
    ? { color: colors.primary, gradient: colors.gradients.primary, text: 'Running' }
    : { color: colors.danger, gradient: colors.gradients.danger, text: 'Stopped' };

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

          {error ? (
            <Card variant="elevated">
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
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
                    title="Start Motor"
                    onPress={handleToggleMotor}
                    variant="glass"
                    loading={isLoading}
                    style={styles.motorButton}
                  />
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
                      onValueChange={setMoistureThreshold}
                      min={0}
                      max={100}
                      unit="%"
                    />
                    <ThresholdInput
                      label="Auto Duration"
                      value={autoDuration}
                      onValueChange={setAutoDuration}
                      min={5}
                      max={600}
                      unit="sec"
                    />
                    <ThresholdInput
                      label="Manual Duration"
                      value={manualDuration}
                      onValueChange={setManualDuration}
                      min={5}
                      max={600}
                      unit="sec"
                    />
                  </View>

                  <Button
                    title="Save Settings"
                    onPress={handleSaveSettings}
                    variant="gradient"
                    gradientColors={colors.gradients.primary}
                    loading={isLoading}
                    style={styles.saveButton}
                  />
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
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
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