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
import colors from '../constants/colors';
import { useThemeStore } from '../stores/theme-store';

export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useThemeStore((state) => state.theme);
  const theme = scheme === 'dark' ? colors.dark : colors.light;

  const { logs, isLoading, error, fetchLogs } = useLogsStore();

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [fetchLogs])
  );

  if (error) {
    return (
      <LinearGradient
        colors={[theme.background, theme.backgroundSecondary]}
        style={{ flex: 1, paddingBottom: insets.bottom }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Irrigation Logs
            </Text>
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.background, theme.backgroundSecondary]}
      style={{ flex: 1, paddingBottom: insets.bottom }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Irrigation Logs
          </Text>

          <FlatList
            data={logs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <LogItem log={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchLogs}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No logs found. Irrigation events will appear here.
                </Text>
              </View>
            )}
          />
        </View>
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
    paddingHorizontal: 8,
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
  },
  emptyText: { fontSize: 16, textAlign: 'center' },
});