import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Battery, BatteryLow, Zap } from 'lucide-react-native';
import colors from '../constants/colors';

interface BatteryIndicatorProps {
  level: number; // 0-100
  size?: number;
}

export default function BatteryIndicator({ level, size = 24 }: BatteryIndicatorProps) {
  const colorScheme = useColorScheme() || 'light';
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  
  // Ensure level is between 0-100
  const safeLevel = Math.max(0, Math.min(100, level));
  
  // Determine colors and icon based on battery level
  let gradientColors: readonly [ColorValue, ColorValue] = colors.gradients.primary;
  let IconComponent = Battery;
  
  if (safeLevel < 20) {
    gradientColors = colors.gradients.danger;
    IconComponent = BatteryLow;
  } else if (safeLevel < 50) {
    gradientColors = colors.gradients.accent;
  } else if (safeLevel > 90) {
    IconComponent = Zap;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.surface, theme.surfaceSecondary] as readonly [ColorValue, ColorValue]}
        style={styles.batteryContainer}
      >
        <View style={[styles.iconContainer, { backgroundColor: String(gradientColors[0]) + '20' }]}>
          <IconComponent size={size} color={String(gradientColors[0])} />
        </View>
        
        <View style={styles.levelContainer}>
          <Text style={[styles.level, { color: theme.text }]}>{safeLevel}%</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Battery</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBackground, { backgroundColor: theme.border }]}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${safeLevel}%` }
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  levelContainer: {
    flex: 1,
  },
  level: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  progressContainer: {
    width: 80,
    marginLeft: 16,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});