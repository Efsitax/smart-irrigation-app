import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Droplets } from 'lucide-react-native';

import colors from '../constants/colors';
import { useThemeStore } from '../stores/theme-store';

interface MoistureIndicatorProps {
  value: number; // 0-100
  size?: number;
}

export default function MoistureIndicator({ value, size = 200 }: MoistureIndicatorProps) {
  const theme = useThemeStore((state) => state.theme);
  const themeColors = theme === 'dark' ? colors.dark : colors.light;

  // Ensure value is between 0-100
  const safeValue = Math.max(0, Math.min(100, value));

  // Circle calculations
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - safeValue / 100);

  // Moisture level colors
  let gradientColors = colors.gradients.primary;
  if (safeValue < 30) {
    gradientColors = colors.gradients.danger;
  } else if (safeValue < 60) {
    gradientColors = colors.gradients.accent;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[themeColors.card, themeColors.surfaceSecondary]} // ✅ düzeltildi
        style={[styles.indicatorContainer, { width: size + 40, height: size + 40 }]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </SvgLinearGradient>
          </Defs>

          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={themeColors.border}
            fill="none"
            opacity={0.3}
          />

          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="url(#progressGradient)"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          />
        </Svg>

        <View style={styles.centerContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: String(gradientColors[0]) + '20' }
            ]}
          >
            <Droplets size={size / 8} color={gradientColors[0]} />
          </View>
          <Text style={[styles.percentage, { color: themeColors.text, fontSize: size / 6 }]}> {/* ✅ */}
            {safeValue}%
          </Text>
          <Text style={[styles.label, { color: themeColors.textSecondary }]}> {/* ✅ */}
            Soil Moisture
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  indicatorContainer: {
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  percentage: {
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});