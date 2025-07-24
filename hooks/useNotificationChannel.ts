import { useEffect } from 'react';
import { Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';

export default function useCreateNotificationChannel() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });
    }
  }, []);
}