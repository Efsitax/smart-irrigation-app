import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, useColorScheme, Animated } from 'react-native';
import { CheckCircle, XCircle, Loader, Wifi, AlertCircle } from 'lucide-react-native';
import { ConnectionStatus as ConnectionStatusType } from '../types/bluetooth';
import colors from '../constants/colors';
import Card from './Card';
import { useThemeStore } from '../stores/theme-store';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;
 
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status.status === 'success') {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (status.status === 'connecting' || status.status === 'sending') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [status.status]);

  const getStatusInfo = () => {
    switch (status.status) {
      case 'scanning':
        return {
          icon: Loader,
          color: colors.secondary,
          title: 'Scanning for devices...',
          description: 'Looking for ESP32 devices nearby',
        };
      case 'connecting':
        return {
          icon: Wifi,
          color: colors.accent,
          title: 'Connecting...',
          description: status.message || 'Establishing connection',
        };
      case 'sending':
        return {
          icon: Loader,
          color: colors.info,
          title: 'Sending credentials...',
          description: status.message || 'Transmitting Wi-Fi information',
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: colors.success,
          title: 'Connection successful!',
          description: status.message || 'ESP32 is now connected to Wi-Fi',
        };
      case 'error':
        return {
          icon: XCircle,
          color: colors.danger,
          title: 'Connection failed',
          description: status.message || 'Please check your credentials and try again',
        };
      default:
        return {
          icon: AlertCircle,
          color: theme.textSecondary,
          title: 'Ready to connect',
          description: 'Select a device and enter Wi-Fi credentials to begin',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  if (status.status === 'idle') {
    return null;
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Card variant="elevated">
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.iconWrapper,
              { 
                backgroundColor: statusInfo.color + '20',
                transform: [
                  { scale: scaleAnim },
                  ...(status.status === 'connecting' || status.status === 'sending' 
                    ? [{ rotate: spin }] 
                    : []
                  ),
                ],
              }
            ]}
          >
            <IconComponent size={32} color={statusInfo.color} />
          </Animated.View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>
            {statusInfo.title}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {statusInfo.description}
          </Text>

          {status.progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBackground, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { 
                      backgroundColor: statusInfo.color,
                      width: `${status.progress}%`,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                {status.progress}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 12,
    gap: 8,
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});