/**
 * Root Navigator
 * Main navigation container with auth flow
 */

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';

// Navigators
import { MainTabNavigator } from './MainTabNavigator';

// Auth Screens
import { LoginScreen } from '../../screens/auth/LoginScreen';

// Detail Screens
import { TransactionDetailScreen } from '../../screens/transactions/TransactionDetailScreen';
import { WithdrawalDetailScreen } from '../../screens/withdrawals/WithdrawalDetailScreen';
import { CreateWithdrawalScreen } from '../../screens/withdrawals/CreateWithdrawalScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Linking configuration for deep links
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linking: any = {
  prefixes: ['indigo://', 'https://app.indigoyield.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Portfolio: 'portfolio',
          Transactions: 'transactions',
          Withdrawals: 'withdrawals',
          Settings: 'settings',
        },
      },
      TransactionDetail: 'transactions/:transactionId',
      WithdrawalDetail: 'withdrawals/:withdrawalId',
      CreateWithdrawal: 'withdraw',
    },
  },
};

export function RootNavigator() {
  const { isReady } = useAuth();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { theme, isDarkMode } = useTheme();

  // Show loading screen while checking auth
  if (!isReady || isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      linking={linking}
      theme={
        {
          dark: isDarkMode,
          colors: {
            primary: theme.primary,
            background: theme.background,
            card: theme.surface,
            text: theme.text,
            border: theme.border,
            notification: theme.destructive,
          },
        } as any
      }
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        {isAuthenticated ? (
          // Authenticated flow
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="TransactionDetail"
              component={TransactionDetailScreen}
              options={{
                headerShown: true,
                title: 'Transaction Details',
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.text,
              }}
            />
            <Stack.Screen
              name="WithdrawalDetail"
              component={WithdrawalDetailScreen}
              options={{
                headerShown: true,
                title: 'Withdrawal Details',
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.text,
              }}
            />
            <Stack.Screen
              name="CreateWithdrawal"
              component={CreateWithdrawalScreen}
              options={{
                headerShown: true,
                title: 'New Withdrawal',
                presentation: 'modal',
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.text,
              }}
            />
          </>
        ) : (
          // Auth flow
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
