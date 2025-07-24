import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  ColorValue,
  Platform,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'gradient' | 'glass';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  gradientColors,
}: ButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary, borderColor: colors.primary };
      case 'secondary':
        return { backgroundColor: colors.secondary, borderColor: colors.secondary };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 2 };
      case 'danger':
        return { backgroundColor: colors.danger, borderColor: colors.danger };
      case 'glass':
        return {
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderColor: 'rgba(255,255,255,0.3)',
          borderWidth: 1,
        };
      default:
        return { backgroundColor: colors.primary, borderColor: colors.primary };
    }
  };

  const getTextColor = () => (variant === 'outline' ? colors.primary : '#FFFFFF');

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 12, paddingHorizontal: 20, minHeight: 44 };
      case 'large':
        return { paddingVertical: 18, paddingHorizontal: 36, minHeight: 56 };
      default:
        return { paddingVertical: 16, paddingHorizontal: 28, minHeight: 52 };
    }
  };

  const getTextSize = () => (size === 'small' ? 14 : size === 'large' ? 18 : 16);

  const buttonContent = (
    loading ? (
      <ActivityIndicator color={getTextColor()} size="small" />
    ) : (
      <Text style={[styles.text, { color: getTextColor(), fontSize: getTextSize() }, textStyle]}>
        {title}
      </Text>
    )
  );

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.button,
          { borderWidth: 0 },
          style,
          disabled && styles.disabled,
        ]}
      >
        <LinearGradient
          colors={gradientColors || colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        />
        <View
          style={{
            paddingVertical: getButtonSize().paddingVertical,
            paddingHorizontal: getButtonSize().paddingHorizontal,
            minHeight: getButtonSize().minHeight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {buttonContent}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        getButtonSize(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});