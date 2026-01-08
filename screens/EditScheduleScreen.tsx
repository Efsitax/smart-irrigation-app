import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { DayOfWeek } from '../types/irrigation';
import { useScheduleStore } from '../stores/schedule-store';
import Button from '../components/Button';
import ThresholdInput from '../components/ThresholdInput';
import colors from '../constants/colors';
import { useThemeStore } from '../stores/theme-store';

// Navigation Param Listesi (AppNavigator ile uyumlu olmalı)
type RootStackParamList = {
  EditSchedule: { id: number }; // ID number olarak geliyor
};

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
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;
  const navigation = useNavigation();
  
  // Route params handling
  const route = useRoute<RouteProp<RootStackParamList, 'EditSchedule'>>();
  const { id } = route.params || {};

  const { schedules, editSchedule, isLoading, fetchSchedules } = useScheduleStore();

  // Find existing schedule
  const existing = schedules.find(s => s.id === id);

  const [time, setTime] = useState(existing?.time || '08:00');
  const [duration, setDuration] = useState(existing?.durationInSeconds || 60);
  const [days, setDays] = useState<DayOfWeek[]>(existing?.days || []);
  const [repeat, setRepeat] = useState(existing?.repeatDaily ?? true);
  const [specificDate, setSpecificDate] = useState(existing?.specificDate || '');
  const [active, setActive] = useState(existing?.active ?? true);

  useFocusEffect(
    useCallback(() => {
      // Refresh data when screen comes into focus
      fetchSchedules();
    }, [])
  );

  // Update state if 'existing' data loads/changes
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
    
    try {
      await editSchedule(existing.id, {
        time,
        durationInSeconds: duration,
        days,
        repeatDaily: repeat,
        specificDate: repeat ? undefined : specificDate,
        active
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update schedule");
    }
  };

  if (!existing) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: colors.danger }}>Schedule not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} style={{marginTop: 20}} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[theme.background, theme.backgroundSecondary]}
        style={{ flex: 1, paddingBottom: insets.bottom }}
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
                <Text style={[styles.label, { color: theme.text }]}>Time (HH:mm)</Text>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numbers-and-punctuation"
                  maxLength={8}
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
                          days.includes(d.id) && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={() => toggleDay(d.id)}
                      >
                        <Text style={{ color: days.includes(d.id) ? '#fff' : theme.text, fontSize: 12, fontWeight: '600' }}>
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

            {/* Active Status */}
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
              <Button 
                title="Cancel" 
                onPress={() => navigation.goBack()} 
                variant="outline" 
                style={{ flex: 1, marginRight: 10 }}
              />
              <Button 
                title="Save Changes" 
                onPress={onSave} 
                loading={isLoading} 
                style={{ flex: 1 }}
              />
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
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 16, letterSpacing: -0.5 },
  group: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, opacity: 0.8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dayBtn: {
    borderWidth: 1,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20
  }
});