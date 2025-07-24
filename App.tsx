import 'react-native-gesture-handler'; 
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';
import useFirebaseMessaging from './hooks/useFireMessaging';
import useCreateNotificationChannel from './hooks/useNotificationChannel';

export default function App() {
  useFirebaseMessaging();
  useCreateNotificationChannel();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}