import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import colors from '../constants/colors';
import { useThemeStore } from '../stores/theme-store';

interface ThresholdInputProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}

export default function ThresholdInput({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  unit = '',
}: ThresholdInputProps) {
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;

  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  
  const handleChange = (text: string) => {
    setInputValue(text);
    
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue)) {
      // Clamp value between min and max
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onValueChange(clampedValue);
    }
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    // Ensure the displayed value is valid when input loses focus
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) {
      setInputValue(value.toString());
    } else {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      setInputValue(clampedValue.toString());
      onValueChange(clampedValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: theme.background,
          borderColor: isFocused ? colors.primary : theme.border,
        },
        isFocused && styles.focused
      ]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={inputValue}
          onChangeText={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          keyboardType="numeric"
          maxLength={5}
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
        />
        {unit && (
          <View style={[styles.unitContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.unit, { color: theme.textSecondary }]}>{unit}</Text>
          </View>
        )}
      </View>
      <View style={styles.rangeText}>
        <Text style={[styles.rangeLabel, { color: theme.textSecondary }]}>
          Range: {min} - {max}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  focused: {
    shadowColor: "#28A745",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  unitContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 0,
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
  },
  rangeText: {
    marginTop: 6,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});