/**
 * LoginScreen
 * Full-screen auth for invite-only accredited investors
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginScreen() {
  const { theme } = useTheme();
  const { signIn, authenticateWithBiometric, biometricEnabled, biometricLabel, error, clearError, isLoading } =
    useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Animated orbs
  const orb1Anim = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1Anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(orb1Anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Anim, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(orb2Anim, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ])
    ).start();
  }, [orb1Anim, orb2Anim]);

  const orb1Translate = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const orb2Translate = orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

  const displayedError = localError ?? error;

  const handleSignIn = async () => {
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    await signIn(email.trim(), password);
  };

  const handleBiometric = async () => {
    setLocalError(null);
    clearError();
    const success = await authenticateWithBiometric();
    if (!success) {
      setLocalError('Biometric authentication failed.');
    }
  };

  const styles = makeStyles(theme);

  return (
    <View style={styles.root}>
      {/* Animated gradient orbs */}
      <Animated.View
        style={[styles.orb, styles.orb1, { transform: [{ translateY: orb1Translate }] }]}
      />
      <Animated.View
        style={[styles.orb, styles.orb2, { transform: [{ translateY: orb2Translate }] }]}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoSection}>
              <Text variant="h1" style={styles.logoText}>
                INDIGO
              </Text>
              <Text variant="caption" style={styles.tagline}>
                MEET YOUR FUTURE
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text variant="h3" style={styles.formTitle}>
                Sign In
              </Text>
              <Text variant="bodySmall" color="muted" style={styles.formSubtitle}>
                Welcome back. Your portfolio awaits.
              </Text>

              <View style={styles.inputs}>
                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="you@example.com"
                  leftIcon={
                    <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
                  }
                />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="••••••••"
                  leftIcon={
                    <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
                  }
                  rightIcon={
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={theme.textMuted}
                    />
                  }
                  onRightIconPress={() => setShowPassword((v) => !v)}
                />

                {displayedError ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color={theme.destructive} />
                    <Text variant="caption" color="destructive" style={styles.errorText}>
                      {displayedError}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Button
                onPress={handleSignIn}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                size="lg"
              >
                Sign In
              </Button>

              <Text variant="caption" color="muted" style={styles.disclaimer}>
                Invite-only · For accredited investors
              </Text>

              {/* Biometric option */}
              {biometricEnabled && (
                <TouchableOpacity
                  style={styles.biometricBtn}
                  onPress={handleBiometric}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="finger-print-outline"
                    size={28}
                    color={theme.primary}
                  />
                  <Text variant="caption" color="muted" style={styles.biometricLabel}>
                    Sign in with {biometricLabel}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Ionicons name="shield-checkmark-outline" size={14} color={theme.textMuted} />
              <Text variant="caption" color="muted" style={styles.footerText}>
                256-bit encrypted · SOC 2 compliant
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 40,
      justifyContent: 'center',
    },
    orb: {
      position: 'absolute',
      borderRadius: 999,
    },
    orb1: {
      width: 300,
      height: 300,
      backgroundColor: 'rgba(63, 81, 181, 0.12)',
      top: -80,
      right: -80,
    },
    orb2: {
      width: 240,
      height: 240,
      backgroundColor: 'rgba(0, 200, 83, 0.08)',
      bottom: 60,
      left: -60,
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoText: {
      color: theme.text,
      letterSpacing: 8,
      fontWeight: '800',
    },
    tagline: {
      letterSpacing: 4,
      marginTop: 6,
      color: theme.textMuted,
    },
    formCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    formTitle: {
      color: theme.text,
      marginBottom: 6,
    },
    formSubtitle: {
      marginBottom: 24,
    },
    inputs: {
      marginBottom: 8,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
      padding: 10,
      backgroundColor: `${theme.destructive}15`,
      borderRadius: 8,
    },
    errorText: {
      flex: 1,
    },
    disclaimer: {
      textAlign: 'center',
      marginTop: 16,
    },
    biometricBtn: {
      alignItems: 'center',
      marginTop: 24,
      paddingTop: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      gap: 6,
    },
    biometricLabel: {
      marginTop: 4,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 32,
      gap: 6,
    },
    footerText: {
      marginLeft: 4,
    },
  });
}
