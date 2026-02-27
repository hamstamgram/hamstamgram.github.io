/**
 * Auth Provider
 * Handles auth state initialization and session management
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { usePrivacyStore } from '../../stores/privacyStore';
import { supabase } from '../../services/api/supabase';

interface AuthContextType {
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType>({ isReady: false });

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const { checkSession, isAuthenticated } = useAuthStore();
  const { autoHideOnBackground, hideBalances } = usePrivacyStore();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      await checkSession();
      setIsReady(true);
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        await checkSession();
      } else if (event === 'SIGNED_OUT') {
        await checkSession();
      } else if (event === 'TOKEN_REFRESHED') {
        // Session was refreshed, no action needed
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle app state changes for privacy mode
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (autoHideOnBackground && isAuthenticated) {
          hideBalances();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [autoHideOnBackground, isAuthenticated]);

  return <AuthContext.Provider value={{ isReady }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
