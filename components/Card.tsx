import React, { ReactNode } from 'react';
import { View, StyleSheet, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../constants/colors';
import { useThemeStore } from '../stores/theme-store';

interface CardProps {
  children: ReactNode;
  style?: object;
  variant?: 'default' | 'gradient' | 'elevated' | 'glass';
  gradientColors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
}

export default function Card({ 
  children, 
  style, 
  variant = 'default',
  gradientColors 
}: CardProps) {
  const colorScheme = useThemeStore((state) => state.theme);
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const getCardStyle = () => {
    switch (variant) {
      case 'gradient':
        return [styles.card, styles.gradientCard];
      case 'elevated':
        return [styles.card, styles.elevatedCard, { backgroundColor: theme.card }];
      case 'glass':
        return [styles.card, styles.glassCard, { backgroundColor: theme.overlay }];
      default:
        return [styles.card, { backgroundColor: theme.card }];
    }
  };

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={gradientColors || colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[getCardStyle(), style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[
      getCardStyle(),
      { 
        borderColor: theme.borderLight,
        shadowColor: theme.shadow,
      },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    marginVertical: 8,
    borderWidth: 1,
  },
  gradientCard: {
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  elevatedCard: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 0,
  },
  glassCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
});