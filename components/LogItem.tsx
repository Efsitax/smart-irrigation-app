// src/components/LogItem.tsx

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Clock, Droplets } from 'lucide-react-native';

import { MotorLogDto } from '../types/irrigation';
import Card from './Card';
import colors from '../constants/colors';
import { useThemeStore } from '../stores/theme-store';

interface LogItemProps {
  log: MotorLogDto;
}

export default function LogItem({ log }: LogItemProps) {
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;

  const formatDate = (s: string) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleString();
  };

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec} sec`;
    const m = Math.floor(sec / 60),
      sRem = sec % 60;
    return sRem > 0 ? `${m} min ${sRem} sec` : `${m} min`;
  };

  const normalizedMode = log.mode.toLowerCase(); // e.g. "MANUAL" -> "manual"

  const modeColor = (() => {
    switch (normalizedMode) {
      case 'manual':
        return colors.info;
      case 'auto':
        return colors.primary;
      case 'scheduled':
        return colors.accent;
      default:
        return colors.secondary;
    }
  })();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.modeBadge, { backgroundColor: modeColor }]}>
          <Text style={styles.modeText}>{normalizedMode}</Text>
        </View>
        <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
          {formatDate(log.startTime)}
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Clock size={16} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.text }]}>
            Duration: {formatDuration(log.durationSeconds)}
          </Text>
        </View>

        {normalizedMode !== 'manual' && log.moistureAtTrigger !== null && (
          <View style={styles.detailRow}>
            <Droplets size={16} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.text }]}>
              Moisture at trigger: {log.moistureAtTrigger}%
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 8, marginVertical: 4 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modeText: {
    color: 'white',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  timestamp: { fontSize: 14 },
  detailsContainer: { rowGap: 8 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  detailText: { fontSize: 14 },
});