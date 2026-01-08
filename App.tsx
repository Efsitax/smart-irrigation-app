import 'react-native-gesture-handler'; 
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';
import { initDatabase } from './services/DatabaseService';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    initDatabase();
    setIsDbReady(true);
  }, []);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}