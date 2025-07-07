import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function NewScheduleScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;
  const navigation = useNavigation();
  const { addSchedule, isLoading } = useScheduleStore();

  const [time, setTime] = useState('12:00:00');
  const [duration, setDuration] = useState(60);
  const [days, setDays] = useState<DayOfWeek[]>([]);
  const [repeat, setRepeat] = useState(true);
  const [specificDate, setSpecificDate] = useState('');

  const toggleDay = (d: DayOfWeek) =>
    setDays(days.includes(d) ? days.filter(x => x !== d) : [...days, d]);

  const onSave = async () => {
    await addSchedule({
      time,
      durationInSeconds: duration,
      days,
      repeatDaily: repeat,
      specificDate: repeat ? undefined : specificDate
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: 90 + insets.bottom }]}
      >
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.section, { color: theme.text }]}>Time & Duration</Text>
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.text }]}>Time</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              value={time}
              onChangeText={setTime}
              placeholder="HH:mm:ss"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.text }]}>Duration</Text>
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

        <View style={styles.buttons}>
          <Button title="Create" onPress={onSave} loading={isLoading} />
          <Button title="Cancel" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    gap: 20,
  },
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