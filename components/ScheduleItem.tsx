import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Calendar, Repeat, Edit, Trash2, Power, Droplets } from 'lucide-react-native';
import { ScheduleResponseDto } from '../types/irrigation';
import colors from '../constants/colors';
import Card from './Card';
import { useThemeStore } from '../stores/theme-store';

interface ScheduleItemProps {
  schedule: ScheduleResponseDto;
  onEdit: (schedule: ScheduleResponseDto) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, active: boolean) => void;
}

export default function ScheduleItem({ 
  schedule, 
  onEdit, 
  onDelete,
  onToggleActive
}: ScheduleItemProps) {
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;
  
  // Format days of week
  const formatDays = (days: string[]) => {
    if (days.length === 7) return "Every day";
    if (days.length === 0) return "No days selected";
    
    const dayMap: Record<string, string> = {
      MONDAY: 'Mon',
      TUESDAY: 'Tue',
      WEDNESDAY: 'Wed',
      THURSDAY: 'Thu',
      FRIDAY: 'Fri',
      SATURDAY: 'Sat',
      SUNDAY: 'Sun',
    };
    
    return days.map(day => dayMap[day] || day).join(', ');
  };
  
  // Format duration in seconds to minutes
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  };

  const gradientColors: readonly [ColorValue, ColorValue] = schedule.active 
    ? colors.gradients.primary 
    : [theme.surface, theme.surfaceSecondary] as readonly [ColorValue, ColorValue];

  return (
    <Card variant="elevated" style={[styles.card, !schedule.active && styles.inactiveCard]}>
      {/* Header with time and actions */}
      <View style={styles.header}>
        <LinearGradient
          colors={schedule.active ? colors.gradients.primary : [theme.border, theme.borderLight] as readonly [ColorValue, ColorValue]}
          style={styles.timeContainer}
        >
          <Text style={[
            styles.time, 
            { color: schedule.active ? 'white' : theme.textSecondary }
          ]}>
            {schedule.time}
          </Text>
        </LinearGradient>
        
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.scheduleTitle, { color: theme.text }]}>
              Irrigation Schedule
            </Text>
            {!schedule.active && (
              <View style={styles.inactiveBadge}>
                <Power size={10} color="white" />
                <Text style={styles.inactiveText}>Off</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.surface }]} 
            onPress={() => onEdit(schedule)}
            activeOpacity={0.7}
          >
            <Edit size={16} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.danger + '15' }]} 
            onPress={() => onDelete(schedule.id)}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: colors.primary + '20' }]}>
              <Droplets size={14} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Duration
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {formatDuration(schedule.durationInSeconds)}
              </Text>
            </View>
          </View>
          
          {schedule.repeatDaily ? (
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Repeat size={14} color={colors.secondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Repeat
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {formatDays(schedule.days)}
                </Text>
              </View>
            </View>
          ) : schedule.specificDate ? (
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: colors.accent + '20' }]}>
                <Calendar size={14} color={colors.accent} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Date
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {schedule.specificDate}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
      
      {/* Toggle Button */}
      <TouchableOpacity 
        onPress={() => onToggleActive(schedule.id, !schedule.active)}
        activeOpacity={0.8}
        style={styles.toggleContainer}
      >
        <LinearGradient
          colors={schedule.active ? colors.gradients.danger : colors.gradients.primary}
          style={styles.toggleButton}
        >
          <Power size={16} color="white" />
          <Text style={styles.toggleText}>
            {schedule.active ? 'Deactivate' : 'Activate'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 20,
  },
  inactiveCard: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  timeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  time: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  inactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  inactiveText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  toggleContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  toggleText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.2,
  },
});