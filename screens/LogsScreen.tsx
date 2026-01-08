import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useLogsStore } from '../stores/logs-store';
import LogItem from '../components/LogItem';
import AppColors from '../constants/colors';
import { useThemeStore } from '../stores/theme-store';

export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  
  const themeColors = AppColors[theme === 'dark' ? 'dark' : 'light'];

  const { logs, isLoading, error, fetchLogs } = useLogsStore();

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [])
  );

  const renderContent = () => (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text }]}>
        Irrigation Logs
      </Text>

      {error ? (
         <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: AppColors.danger }]}>
              {error}
            </Text>
         </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
          renderItem={({ item }) => <LogItem log={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchLogs}
              colors={[AppColors.primary]}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No logs found. Irrigation events will appear here.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={[themeColors.background, themeColors.backgroundSecondary]}
      style={{ flex: 1, paddingBottom: insets.bottom }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {renderContent()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: { fontSize: 16, textAlign: 'center' },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50
  },
  emptyText: { fontSize: 16, textAlign: 'center' },
});