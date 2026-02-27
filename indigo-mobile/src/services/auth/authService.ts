/**
 * Authentication Service
 */
import { supabase, Session, User, AuthError } from '../api/supabase';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { STORAGE_KEYS } from '@/utils/constants';
import type { Profile } from '@/types/domains/profile';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  authenticationType: LocalAuthentication.AuthenticationType[];
}

// ─── Individual exported functions ───────────────────────────────────────────

/**
 * Sign in with email and password
 */
export async function signInFn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.session || !data.user) {
      return { success: false, error: 'Authentication failed' };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Sign out the current user
 */
export async function signOutFn(): Promise<void> {
  await supabase.auth.signOut();
  await SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check biometric availability
 */
export async function checkBiometricStatus(): Promise<BiometricStatus> {
  const isAvailable = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

  return {
    isAvailable,
    isEnrolled,
    authenticationType: supportedTypes,
  };
}

/**
 * Check if biometric login is enabled
 */
export async function isBiometricEnabledFn(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
  return value === 'true';
}

/**
 * Enable or disable biometric login
 */
export async function setBiometricEnabledFn(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometricFn(): Promise<AuthResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access Indigo Yield',
      fallbackLabel: 'Use Password',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      const session = await getSession();
      const user = await getCurrentUser();

      if (session && user) {
        return { success: true, session, user };
      }

      return { success: false, error: 'Session expired. Please sign in again.' };
    }

    return { success: false, error: 'error' in result ? result.error : 'Authentication cancelled' };
  } catch (error) {
    console.error('Biometric auth error:', error);
    return { success: false, error: 'Biometric authentication failed' };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Failed to send reset email' };
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// ─── authService object — used by authStore ────────────────────────────────

export const authService = {
  /**
   * Sign in — returns { user: Profile | null, error: { message: string } | null }
   */
  signIn: async (email: string, password: string): Promise<{ user: Profile | null; error: { message: string } | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { user: null, error: { message: error.message } };
    }

    if (!data.session || !data.user) {
      return { user: null, error: { message: 'Authentication failed' } };
    }

    // Fetch profile
    const profile = await authService.getProfile();
    return { user: profile, error: null };
  },

  /**
   * Sign out
   */
  signOut: async (): Promise<void> => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
  },

  /**
   * Check if there's an active session
   */
  hasSession: async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
  },

  /**
   * Get current user profile from profiles table
   */
  getProfile: async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;
    return data as Profile;
  },

  /**
   * Check if biometric is enabled
   */
  isBiometricEnabled: async (): Promise<boolean> => {
    const value = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return value === 'true';
  },

  /**
   * Check if biometric is supported on this device
   */
  isBiometricSupported: async (): Promise<boolean> => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  /**
   * Get biometric label (Face ID / Touch ID / Biometric)
   */
  getBiometricLabel: async (): Promise<string> => {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    return 'Biometric';
  },

  /**
   * Enable or disable biometric
   */
  setBiometricEnabled: async (enabled: boolean): Promise<void> => {
    if (enabled) {
      await SecureStore.setItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
    }
  },

  /**
   * Authenticate with biometric — returns { success: boolean, error?: string }
   */
  authenticateWithBiometric: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Indigo Yield',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: 'error' in result ? result.error : 'Authentication cancelled',
      };
    } catch {
      return { success: false, error: 'Biometric authentication failed' };
    }
  },
};
