import { useEffect } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { registerDeviceToken } from '../api/notificationService';

async function requestAndroidNotificationPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (status !== PermissionsAndroid.RESULTS.GRANTED) {
      console.warn('Notification permission denied on Android 13+');
    }
  }
}

export default function useFirebaseMessaging() {
  useEffect(() => {
    // Initialize FCM: permissions, token registration
    const initFCM = async () => {
      try {
        // Request Android 13+ POST_NOTIFICATIONS permission
        await requestAndroidNotificationPermission();

        // Request FCM permission (iOS prompts, Android auto-grants)
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          Alert.alert(
            'Notification Permission',
            'Push notifications are disabled on this device.'
          );
          return;
        }

        // Get FCM token
        const token = await messaging().getToken();
        console.log('FCM Token:', token);

        // Register token with backend
        await registerDeviceToken({ token });
        console.log('👉 Device token registered successfully');
      } catch (error) {
        console.error('⚠️ FCM initialization error:', error);
      }
    };

    initFCM();

    // Handle foreground messages
    const unsubscribeOnMessage = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const { title, body } = remoteMessage.notification || {};
        Alert.alert(title ?? 'Notification', body ?? '');
      }
    );

    // Handle background & quit-state messages
    messaging().setBackgroundMessageHandler(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('📥 Background message:', remoteMessage);
      }
    );

    // Handle app opened by notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('🚀 App opened by notification:', remoteMessage);
        }
      });

    return () => {
      unsubscribeOnMessage();
    };
  }, []);
}
