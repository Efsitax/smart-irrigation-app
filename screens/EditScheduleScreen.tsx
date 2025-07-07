// src/screens/EditScheduleScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // 💡 eklendi
import { LinearGradient } from 'expo-linear-gradient'; // 💡 eklendi

import { DayOfWeek } from '../types/irrigation';
import { useScheduleStore } from '../stores/schedule-store';
import Button from '../components/Button';
import ThresholdInput from '../components/ThresholdInput';
import colors from '../constants/colors';
import { useThemeStore } from '../stores/theme-store';

const DAYS_OF_WEEK: { id: DayOfWeek; label: string; short: string }[] = [
  { id: 'MONDAY', label: 'Monday', short: 'M' },
  { id: 'TUESDAY', label: 'Tuesday', short: 'T' },
  { id: 'WEDNESDAY', label: 'Wednesday', short: 'W' },
  { id: 'THURSDAY', label: 'Thursday', short: 'T' },
  { id: 'FRIDAY', label: 'Friday', short: 'F' },
  { id: 'SATURDAY', label: 'Saturday', short: 'S' },
  { id: 'SUNDAY', label: 'Sunday', short: 'S' },
];

export default function EditScheduleScreen() {
  const insets = useSafeAreaInsets(); // 💡 eklendi
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as { id: string }) || {};

  const { schedules, editSchedule, isLoading, fetchSchedules } = useScheduleStore();

  const { id: routeId } = (route.params as { id: string }) || {};
  const numericId = parseInt(routeId, 10);
  const existing = schedules.find(s => s.id === numericId);

  const [time, setTime] = useState(existing?.time || '12:00');
  const [duration, setDuration] = useState(existing?.durationInSeconds || 60);
  const [days, setDays] = useState<DayOfWeek[]>(existing?.days || []);
  const [repeat, setRepeat] = useState(existing?.repeatDaily ?? true);
  const [specificDate, setSpecificDate] = useState(existing?.specificDate || '');
  const [active, setActive] = useState(existing?.active ?? true);

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );

  useEffect(() => {
    if (existing) {
      setTime(existing.time);
      setDuration(existing.durationInSeconds);
      setDays(existing.days);
      setRepeat(existing.repeatDaily);
      setSpecificDate(existing.specificDate || '');
      setActive(existing.active);
    }
  }, [existing]);

  const toggleDay = (d: DayOfWeek) =>
    setDays(days.includes(d) ? days.filter(x => x !== d) : [...days, d]);

  const onSave = async () => {
    if (!existing) return;
    await editSchedule(existing.id, {
      time,
      durationInSeconds: duration,
      days,
      repeatDaily: repeat,
      specificDate: repeat ? undefined : specificDate,
    });
    navigation.goBack();
  };

  if (!existing) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: colors.danger }}>Schedule not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[theme.background, theme.backgroundSecondary]}
        style={{ flex: 1, paddingBottom: insets.bottom }} // 💡 alt boşluğu gradientle ört
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
          >
            {/* Time & Duration */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.section, { color: theme.text }]}>Time & Duration</Text>
              <View style={styles.group}>
                <Text style={[styles.label, { color: theme.text }]}>Time</Text>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.group}>
                <Text style={[styles.label, { color: theme.text }]}>Duration (sec)</Text>
                <ThresholdInput
                  label=""
                  value={duration}
                  onValueChange={setDuration}
                  min={5}
                  max={600}
                  unit="sec"
                />
              </View>
            </View>

            {/* Pattern */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.section, { color: theme.text }]}>Pattern</Text>
              <View style={styles.group}>
                <View style={styles.switchRow}>
                  <Text style={[styles.label, { color: theme.text }]}>Repeat Weekly</Text>
                  <Switch
                    value={repeat}
                    onValueChange={setRepeat}
                    trackColor={{ false: theme.border, true: colors.primary }}
                    thumbColor="#FFF"
                  />
                </View>
              </View>
              {repeat ? (
                <View style={styles.group}>
                  <Text style={[styles.label, { color: theme.text }]}>Days</Text>
                  <View style={styles.days}>
                    {DAYS_OF_WEEK.map(d => (
                      <TouchableOpacity
                        key={d.id}
                        style={[
                          styles.dayBtn,
                          { borderColor: theme.border },
                          days.includes(d.id) && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => toggleDay(d.id)}
                      >
                        <Text style={{ color: days.includes(d.id) ? '#fff' : theme.text }}>
                          {d.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.group}>
                  <Text style={[styles.label, { color: theme.text }]}>Specific Date</Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                    value={specificDate}
                    onChangeText={setSpecificDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              )}
            </View>

            {/* Active */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.section, { color: theme.text }]}>Status</Text>
              <View style={styles.group}>
                <View style={styles.switchRow}>
                  <Text style={[styles.label, { color: theme.text }]}>Active</Text>
                  <Switch
                    value={active}
                    onValueChange={setActive}
                    trackColor={{ false: theme.border, true: colors.primary }}
                    thumbColor="#FFF"
                  />
                </View>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <Button title="Save" onPress={onSave} loading={isLoading} />
              <Button title="Cancel" onPress={() => navigation.goBack()} variant="outline" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 90,
    gap: 20,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16
  },
  section: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  group: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayBtn: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 8,
    minWidth: 32,
    alignItems: 'center'
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24
  }
});