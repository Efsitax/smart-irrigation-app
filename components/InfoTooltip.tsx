// components/InfoTooltip.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Info, X } from 'lucide-react-native';
import colors from '../constants/colors';
import Card from './Card';
import Button from './Button';
import { useThemeStore } from '../stores/theme-store';

interface InfoTooltipProps {
  title: string;
  content: string;
  iconSize?: number;
}

export default function InfoTooltip({ title, content, iconSize = 16 }: InfoTooltipProps) {
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;

  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.info + '20' }]}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        <Info size={iconSize} color={colors.info} />
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="fade" onRequestClose={() => setIsVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Card variant="elevated" style={[styles.modal, { backgroundColor: theme.card }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.surface }]}
                  onPress={() => setIsVisible(false)}
                >
                  <X size={16} color={theme.text} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.content, { color: theme.textSecondary }]}>{content}</Text>

              <Button title="Got it" onPress={() => setIsVisible(false)} variant="primary" style={styles.button} />
            </Card>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modal: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    marginTop: 8,
  },
});