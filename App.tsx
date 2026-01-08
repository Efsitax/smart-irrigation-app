import 'react-native-gesture-handler'; 
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';
import { initDatabase } from './services/DatabaseService';
import { startBackgroundService } from './services/BackgroundService';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        initDatabase();
        
        if (Platform.OS === 'android') {
          await requestAndroidPermissions();
        }

        await startBackgroundService();
        
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  const requestAndroidPermissions = async () => {
    try {
      if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        const allGranted = 
          result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;

        if (!allGranted) {
           console.log("Bluetooth permissions denied. Background service may not work correctly.");
        }
      } 
      else if (Platform.OS === 'android') {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
      }
    } catch (err) {
      console.warn("Permission request error:", err);
    }
  };

  if (!isReady) {
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