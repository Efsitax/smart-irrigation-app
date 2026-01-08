import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Types
import { DayOfWeek } from '../types/irrigation';

// Stores
import { useScheduleStore } from '../stores/schedule-store';
import { useThemeStore } from '../stores/theme-store';

// Components & Constants
import Button from '../components/Button';
import ThresholdInput from '../components/ThresholdInput';
import colors from '../constants/colors';

// Helper for UI rendering
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
  
  // Theme Handling
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;
  
  const navigation = useNavigation();
  
  // Schedule Store (Offline Logic)
  const { addSchedule, isLoading } = useScheduleStore();

  // Local State
  const [time, setTime] = useState('08:00'); // Default time simplified
  const [duration, setDuration] = useState(60);
  const [days, setDays] = useState<DayOfWeek[]>([]);
  const [repeat, setRepeat] = useState(true);
  const [specificDate, setSpecificDate] = useState('');

  const toggleDay = (d: DayOfWeek) =>
    setDays(days.includes(d) ? days.filter(x => x !== d) : [...days, d]);

  const onSave = async () => {
    // Basic Validation
    if (!time) {
        Alert.alert("Validation Error", "Please enter a valid time.");
        return;
    }
    if (repeat && days.length === 0) {
        Alert.alert("Validation Error", "Please select at least one day for repeating schedule.");
        return;
    }
    if (!repeat && !specificDate) {
        Alert.alert("Validation Error", "Please enter a specific date.");
        return;
    }

    try {
        await addSchedule({
          time: time.length === 5 ? `${time}:00` : time, // Ensure HH:mm:ss format if needed
          durationInSeconds: duration,
          days: days, // Pass array, store will handle JSON conversion
          repeatDaily: repeat,
          specificDate: repeat ? null : specificDate,
          active: true // New schedules are active by default
        });
        
        navigation.goBack();
    } catch (error) {
        Alert.alert("Error", "Failed to save schedule.");
        console.error(error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: 90 + insets.bottom }]}
      >
        {/* Time & Duration Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.section, { color: theme.text }]}>Time & Duration</Text>
          
          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.text }]}>Time (HH:mm)</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              value={time}
              onChangeText={setTime}
              placeholder="08:00"
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

        {/* Pattern Section */}
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

        {/* Action Buttons */}
        <View style={styles.buttons}>
          <Button 
            title="Cancel" 
            onPress={() => navigation.goBack()} 
            variant="outline" 
            style={{ flex: 1, marginRight: 10 }}
          />
          <Button 
            title="Create Schedule" 
            onPress={onSave} 
            loading={isLoading} 
            style={{ flex: 1 }}
          />
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
    borderRadius: 16, // Slightly more rounded for modern look
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
    fontSize: 16,
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