/**
 * Privacy Store
 * Manages privacy mode (hide/show balances)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacyState {
  // State
  isPrivacyMode: boolean;
  autoHideOnBackground: boolean;

  // Actions
  togglePrivacyMode: () => void;
  setPrivacyMode: (enabled: boolean) => void;
  setAutoHideOnBackground: (enabled: boolean) => void;
  showBalances: () => void;
  hideBalances: () => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      // Initial state - balances hidden by default per requirements
      isPrivacyMode: true,
      autoHideOnBackground: true,

      // Toggle privacy mode
      togglePrivacyMode: () => {
        set((state) => ({ isPrivacyMode: !state.isPrivacyMode }));
      },

      // Set privacy mode explicitly
      setPrivacyMode: (enabled: boolean) => {
        set({ isPrivacyMode: enabled });
      },

      // Set auto-hide on background
      setAutoHideOnBackground: (enabled: boolean) => {
        set({ autoHideOnBackground: enabled });
      },

      // Show balances (turn off privacy mode)
      showBalances: () => {
        set({ isPrivacyMode: false });
      },

      // Hide balances (turn on privacy mode)
      hideBalances: () => {
        set({ isPrivacyMode: true });
      },
    }),
    {
      name: 'privacy-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
