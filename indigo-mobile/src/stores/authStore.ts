/**
 * Auth Store
 * Manages authentication state with Zustand
 */

import { create } from 'zustand';
import type { Profile } from '../types/domains/profile';
import { authService } from '../services/auth/authService';
import { registerPushToken, deregisterPushToken } from '../services/notifications';

interface AuthState {
  // State
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
  biometricLabel: string;

  // Actions
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  loadProfile: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  checkBiometricSupport: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  biometricEnabled: false,
  biometricLabel: 'Biometric',

  // Sign in with email/password
  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    const { user, error } = await authService.signIn(email, password);

    if (error) {
      set({ isLoading: false, error: error.message });
      return false;
    }

    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    // Register push token after successful sign-in (best-effort, non-blocking)
    registerPushToken().catch(() => undefined);

    return true;
  },

  // Sign out
  signOut: async () => {
    set({ isLoading: true });
    await deregisterPushToken().catch(() => undefined);
    await authService.signOut();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  // Check if there's an active session
  checkSession: async () => {
    set({ isLoading: true });

    const hasSession = await authService.hasSession();

    if (hasSession) {
      const profile = await authService.getProfile();
      const biometricEnabled = await authService.isBiometricEnabled();
      const biometricSupported = await authService.isBiometricSupported();
      const biometricLabel = biometricSupported
        ? await authService.getBiometricLabel()
        : 'Biometric';

      set({
        user: profile,
        isAuthenticated: profile !== null,
        isLoading: false,
        biometricEnabled: biometricEnabled && biometricSupported,
        biometricLabel,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Load user profile
  loadProfile: async () => {
    const profile = await authService.getProfile();
    set({ user: profile });
  },

  // Enable/disable biometric login
  setBiometricEnabled: async (enabled: boolean) => {
    await authService.setBiometricEnabled(enabled);
    set({ biometricEnabled: enabled });
  },

  // Check biometric support
  checkBiometricSupport: async () => {
    const supported = await authService.isBiometricSupported();
    const enabled = await authService.isBiometricEnabled();
    const label = supported ? await authService.getBiometricLabel() : 'Biometric';

    set({
      biometricEnabled: supported && enabled,
      biometricLabel: label,
    });
  },

  // Authenticate with biometric
  authenticateWithBiometric: async () => {
    const { success, error } = await authService.authenticateWithBiometric();

    if (!success && error) {
      set({ error });
    }

    return success;
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
