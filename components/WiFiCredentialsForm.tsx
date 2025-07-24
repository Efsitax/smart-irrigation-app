import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, useColorScheme, TouchableOpacity } from 'react-native';
import { Wifi, Eye, EyeOff, Lock, Router } from 'lucide-react-native';
import { WiFiCredentials } from '../types/bluetooth';
import colors from '../constants/colors';
import Card from './Card';
import Button from './Button';
import { useThemeStore } from '../stores/theme-store';

interface WiFiCredentialsFormProps {
  onSubmit: (credentials: WiFiCredentials) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function WiFiCredentialsForm({ onSubmit, isLoading, disabled }: WiFiCredentialsFormProps) {
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;

  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    onSubmit({ ssid: ssid.trim(), password });
  };

  const isValid = ssid.trim().length > 0;

  return (
    <Card variant="elevated">
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
          <Wifi size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>Wi-Fi Credentials</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter your network details
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Network Name (SSID)</Text>
          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: theme.background,
              borderColor: theme.border,
            }
          ]}>
            <Router size={16} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={ssid}
              onChangeText={setSsid}
              placeholder="Enter Wi-Fi network name"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!disabled}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Password</Text>
          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: theme.background,
              borderColor: theme.border,
            }
          ]}>
            <Lock size={16} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter Wi-Fi password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!disabled}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={16} color={theme.textSecondary} />
              ) : (
                <Eye size={16} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Leave empty for open networks
          </Text>
        </View>

        <Button
          title="Send Credentials"
          onPress={handleSubmit}
          variant="gradient"
          gradientColors={colors.gradients.primary}
          loading={isLoading}
          disabled={!isValid || disabled}
          style={styles.submitButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
  },
});