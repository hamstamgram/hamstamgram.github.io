/**
 * Settings Store
 * Manages app settings and preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface NotificationSettings {
  transactions: boolean;
  withdrawals: boolean;
  yield: boolean;
  security: boolean;
}

interface SettingsState {
  // Theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  // Notifications
  notifications: NotificationSettings;
  setNotificationSetting: (key: keyof NotificationSettings, enabled: boolean) => void;
  setAllNotifications: (enabled: boolean) => void;

  // Display
  defaultCurrency: string;
  setDefaultCurrency: (currency: string) => void;

  // Biometric
  requireBiometricForWithdrawal: boolean;
  setRequireBiometricForWithdrawal: (required: boolean) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;

  // Last refresh
  lastRefreshTime: number | null;
  setLastRefreshTime: (time: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Theme - default to system
      themeMode: 'system',
      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
      },

      // Notifications - all enabled by default
      notifications: {
        transactions: true,
        withdrawals: true,
        yield: true,
        security: true,
      },
      setNotificationSetting: (key: keyof NotificationSettings, enabled: boolean) => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: enabled,
          },
        }));
      },
      setAllNotifications: (enabled: boolean) => {
        set({
          notifications: {
            transactions: enabled,
            withdrawals: enabled,
            yield: enabled,
            security: enabled,
          },
        });
      },

      // Display
      defaultCurrency: 'USD',
      setDefaultCurrency: (currency: string) => {
        set({ defaultCurrency: currency });
      },

      // Biometric - require for withdrawals by default
      requireBiometricForWithdrawal: true,
      setRequireBiometricForWithdrawal: (required: boolean) => {
        set({ requireBiometricForWithdrawal: required });
      },

      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (completed: boolean) => {
        set({ hasCompletedOnboarding: completed });
      },

      // Last refresh
      lastRefreshTime: null,
      setLastRefreshTime: (time: number) => {
        set({ lastRefreshTime: time });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
