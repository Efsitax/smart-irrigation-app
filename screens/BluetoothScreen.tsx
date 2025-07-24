import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bluetooth, RotateCcw } from 'lucide-react-native';
import { useBluetoothStore } from '../stores/bluetooth-store';
import DeviceScanner from '../components/DeviceScanner';
import WiFiCredentialsForm from '../components/WiFiCredentialsForm';
import ConnectionStatus from '../components/ConnectionStatus';
import InfoTooltip from '../components/InfoTooltip';
import Button from '../components/Button';
import colors from '../constants/colors';
import { useThemeStore } from '../stores/theme-store';

export default function BluetoothScreen() {
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;
  
  const {
    devices,
    selectedDevice,
    connectionStatus,
    isScanning,
    error,
    startScan,
    selectDevice,
    sendWiFiCredentials,
    resetConnection,
    clearError,
  } = useBluetoothStore();

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSendCredentials = (credentials: { ssid: string; password: string }) => {
    sendWiFiCredentials(credentials);
  };

  const isFormDisabled = !selectedDevice || 
    connectionStatus.status === 'connecting' || 
    connectionStatus.status === 'sending';

  return (
    <LinearGradient
      colors={[theme.background, theme.backgroundSecondary]}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Device Setup</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Connect your ESP32 to Wi-Fi
              </Text>
            </View>
            <View style={styles.headerActions}>
              <InfoTooltip
                title="Why Bluetooth?"
                content="We use Bluetooth to securely send your Wi-Fi credentials to the ESP32 device. This ensures your network password is transmitted safely without exposing it over the internet. Once connected, the device will communicate directly with your Wi-Fi network."
              />
            </View>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: colors.secondary + '20' }]}>
            <Bluetooth size={24} color={colors.secondary} />
          </View>
        </View>

        {/* Web Warning */}
        {Platform.OS === 'web' && (
          <View style={[styles.warningCard, { backgroundColor: colors.warning + '10', borderColor: colors.warning }]}>
            <Text style={[styles.warningText, { color: colors.warning }]}>
              ⚠️ Bluetooth functionality requires a mobile device. Please use the mobile app for device setup.
            </Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.danger + '10', borderColor: colors.danger }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Connection Status */}
        <ConnectionStatus status={connectionStatus} />

        {/* Device Scanner */}
        <DeviceScanner
          devices={devices}
          selectedDevice={selectedDevice}
          isScanning={isScanning}
          onSelectDevice={selectDevice}
          onStartScan={startScan}
        />

        {/* Wi-Fi Credentials Form */}
        <WiFiCredentialsForm
          onSubmit={handleSendCredentials}
          isLoading={connectionStatus.status === 'connecting' || connectionStatus.status === 'sending'}
          disabled={isFormDisabled}
        />

        {/* Reset Button */}
        {(connectionStatus.status === 'success' || connectionStatus.status === 'error') && (
          <View style={styles.resetContainer}>
            <Button
              title="Reset & Try Again"
              onPress={resetConnection}
              variant="outline"
              style={styles.resetButton}
            />
          </View>
        )}

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.instructionsTitle, { color: theme.text }]}>
            Setup Instructions
          </Text>
          <View style={styles.instructionsList}>
            <Text style={[styles.instructionItem, { color: theme.textSecondary }]}>
              1. Make sure your ESP32 device is powered on and in setup mode
            </Text>
            <Text style={[styles.instructionItem, { color: theme.textSecondary }]}>
              2. Tap "Scan" to search for nearby ESP32 devices
            </Text>
            <Text style={[styles.instructionItem, { color: theme.textSecondary }]}>
              3. Select your device from the list (usually named "ESP32_Config")
            </Text>
            <Text style={[styles.instructionItem, { color: theme.textSecondary }]}>
              4. Enter your Wi-Fi network name and password
            </Text>
            <Text style={[styles.instructionItem, { color: theme.textSecondary }]}>
              5. Tap "Send Credentials" to configure the device
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    marginLeft: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: -0.2,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  warningCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  resetButton: {
    paddingHorizontal: 32,
  },
  instructionsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});