/**
 * Push Notification Service
 * Registers Expo push token with Supabase; handles foreground notification display.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../api/supabase';

// Show notifications when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request permission and register Expo push token with the backend.
 * Call once after the user successfully signs in.
 */
export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) return; // Skip simulators

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('[push] Missing EAS projectId — push registration skipped');
    return;
  }

  const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId });
  const platform = Platform.OS as 'ios' | 'android';

  // Upsert so re-installs don't create duplicate rows
  const { error } = await supabase.from('investor_device_tokens').upsert(
    { expo_token: tokenData, platform },
    { onConflict: 'investor_id,expo_token' }
  );

  if (error) {
    console.error('[push] Token registration failed:', error.message);
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('yield-alerts', {
      name: 'Yield Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C4962A',
    });
  }
}

/**
 * Remove the device token on logout so stale tokens don't accumulate.
 */
export async function deregisterPushToken(): Promise<void> {
  if (!Device.isDevice) return;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from('investor_device_tokens').delete().eq('expo_token', data);
  } catch {
    // Best-effort; don't block logout
  }
}
