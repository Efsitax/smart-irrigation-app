// src/screens/ScheduleScreen.tsx

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFocusEffect,
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScheduleStore } from '../stores/schedule-store';
import ScheduleItem from '../components/ScheduleItem';
import Button from '../components/Button';
import colors from '../constants/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useThemeStore } from '../stores/theme-store';

// Tab navigator parametreleri
type TabParamList = {
  Home: undefined;
  Motor: undefined;
  Logs: undefined;
  Schedule: undefined;
  Settings: undefined;
};

type RootNav = NativeStackNavigationProp<RootStackParamList, 'EditSchedule'>;
type TabNav = BottomTabNavigationProp<TabParamList, 'Schedule'>;
type ScheduleNavProp = CompositeNavigationProp<TabNav, RootNav>;

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;
  const navigation = useNavigation<ScheduleNavProp>();

  const {
    schedules,
    isLoading,
    error,
    fetchSchedules,
    editSchedule,
    removeSchedule,
    disableSchedule
  } = useScheduleStore();

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );

  const openNew = () => navigation.navigate('NewSchedule');
  const openEdit = (id: number) => navigation.navigate('EditSchedule', { id });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={[theme.background, theme.backgroundSecondary]}
          style={styles.container}
        >
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: theme.text }]}>Schedules</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Automated irrigation planning
                </Text>
              </View>
              <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
                <CalendarIcon size={24} color={colors.primary} />
              </View>
            </View>
            <Button
              title="New Schedule"
              onPress={openNew}
              variant="gradient"
              gradientColors={colors.gradients.primary}
              size="small"
              style={styles.newButton}
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={schedules}
              renderItem={({ item }) => (
                <ScheduleItem
                  schedule={item}
                  onEdit={() => openEdit(item.id)}
                  onDelete={() => removeSchedule(item.id)}
                  onToggleActive={(id, active) => {
                    if (!active) {
                      disableSchedule(id);
                    } else {
                      editSchedule(id, {
                        time: item.time,
                        days: item.days,
                        durationInSeconds: item.durationInSeconds,
                        repeatDaily: item.repeatDaily,
                        specificDate: item.specificDate,
                      });
                    }
                  }}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: 70 + insets.bottom },
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={fetchSchedules}
                  tintColor={colors.primary}
                />
              }
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <LinearGradient colors={colors.gradients.primary} style={styles.emptyIcon}>
                    <CalendarIcon size={40} color="white" />
                  </LinearGradient>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>No schedules yet</Text>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Create your first irrigation schedule to automate your garden watering and keep your plants healthy.
                  </Text>
                  <Button
                    title="Create First Schedule"
                    onPress={openNew}
                    variant="gradient"
                    gradientColors={colors.gradients.primary}
                    style={styles.emptyButton}
                  />
                </View>
              }
            />
          )}
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    gap: 16
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  newButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20
  },
  listContent: {
    padding: 4
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 300,
    fontWeight: '500'
  },
  emptyButton: {
    paddingHorizontal: 32
  }
});