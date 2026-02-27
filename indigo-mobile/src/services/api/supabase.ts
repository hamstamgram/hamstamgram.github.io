/**
 * Supabase Client Configuration
 */
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { STORAGE_KEYS } from '@/utils/constants';

// Environment configuration — Expo injects EXPO_PUBLIC_* vars at bundle time
const SUPABASE_URL: string =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ??
  'https://nkfimvovosdehmyyjubn.supabase.co';
const SUPABASE_ANON_KEY: string =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZmltdm92b3NkZWhteXlqdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTQ1OTgsImV4cCI6MjA2MjAzMDU5OH0.pZrIyCCd7dlvvNMGdW8-71BxSVfoKhxs9a5Ezbkmjgg';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Custom storage adapter for React Native using SecureStore
const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

// Create Supabase client with secure storage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Not needed for mobile
  },
});

// Export types from Supabase client
export type { Session, User, AuthError } from '@supabase/supabase-js';

/**
 * Check if we have an active session
 */
export async function hasActiveSession(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Generic RPC call helper with error handling
 */
export async function callRPC<T>(
  functionName: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const { data, error } = await supabase.rpc(functionName, params);

  if (error) {
    console.error(`RPC ${functionName} error:`, error);
    throw new Error(error.message || `RPC call failed: ${functionName}`);
  }

  return data as T;
}
