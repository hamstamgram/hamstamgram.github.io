/**
 * SettingsScreen
 * App settings, profile, security, privacy, notifications, sign out
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { usePrivacyStore } from '@/stores/privacyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// ─── Avatar (initials) ────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.avatar}>
      <Text variant="h3" style={styles.avatarText}>
        {initials || '?'}
      </Text>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <Text variant="caption" color="muted" style={styles.sectionHeader}>
      {title.toUpperCase()}
    </Text>
  );
}

// ─── Settings row — toggle ────────────────────────────────────────────────────

function ToggleRow({
  icon,
  label,
  value,
  onValueChange,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  iconColor?: string;
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const color = iconColor ?? theme.primary;

  return (
    <View style={styles.settingsRow}>
      <View style={[styles.rowIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text variant="label" style={styles.rowLabel}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.elevated, true: `${theme.primary}80` }}
        thumbColor={value ? theme.primary : theme.textMuted}
        ios_backgroundColor={theme.elevated}
      />
    </View>
  );
}

// ─── Settings row — navigation/action ────────────────────────────────────────

function ActionRow({
  icon,
  label,
  onPress,
  iconColor,
  destructive,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconColor?: string;
  destructive?: boolean;
  value?: string;
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const color = destructive ? theme.destructive : iconColor ?? theme.primary;

  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text
        variant="label"
        style={{ ...styles.rowLabel, ...(destructive ? { color: theme.destructive } : {}) }}
      >
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value ? (
          <Text variant="caption" color="muted">
            {value}
          </Text>
        ) : null}
        {!destructive && (
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function RowDivider() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return <View style={styles.rowDivider} />;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { theme } = useTheme();

  const { user, signOut, biometricEnabled, biometricLabel, setBiometricEnabled } = useAuthStore();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacyStore();
  const { notifications, setNotificationSetting } = useSettingsStore();

  const [signingOut, setSigningOut] = useState(false);

  const fullName = user?.full_name ?? 'Investor';
  const email = user?.email ?? '';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  const handleBiometricToggle = useCallback(
    async (enabled: boolean) => {
      await setBiometricEnabled(enabled);
    },
    [setBiometricEnabled]
  );

  const handlePrivacyToggle = useCallback(() => {
    togglePrivacyMode();
  }, [togglePrivacyMode]);

  const handleContactSupport = useCallback(() => {
    Linking.openURL('mailto:support@indigoyield.com?subject=Support%20Request').catch(() => {
      Alert.alert('Error', 'Unable to open email client.');
    });
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Indigo Yield?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await signOut();
            setSigningOut(false);
          },
        },
      ]
    );
  }, [signOut]);

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="h3" style={styles.title}>
          Settings
        </Text>

        {/* ── Profile ── */}
        <Card style={styles.profileCard}>
          <View style={styles.profileContent}>
            <Avatar name={fullName} />
            <View style={styles.profileInfo}>
              <Text variant="h4">{fullName}</Text>
              <Text variant="caption" color="muted">
                {email}
              </Text>
              <Badge variant="success" style={styles.roleBadge}>
                {user?.role === 'admin' ? 'Admin' : 'Investor'}
              </Badge>
            </View>
          </View>
        </Card>

        {/* ── Security ── */}
        <SectionHeader title="Security" />
        <Card padding="none" style={styles.section}>
          <ToggleRow
            icon="finger-print-outline"
            label={`${biometricLabel} Login`}
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
          />
        </Card>

        {/* ── Privacy ── */}
        <SectionHeader title="Privacy" />
        <Card padding="none" style={styles.section}>
          <ToggleRow
            icon="eye-off-outline"
            label="Hide Sensitive Values"
            value={isPrivacyMode}
            onValueChange={handlePrivacyToggle}
            iconColor={theme.warning}
          />
        </Card>

        {/* ── Notifications ── */}
        <SectionHeader title="Notifications" />
        <Card padding="none" style={styles.section}>
          <ToggleRow
            icon="swap-horizontal-outline"
            label="Transactions"
            value={notifications.transactions}
            onValueChange={(v) => setNotificationSetting('transactions', v)}
          />
          <RowDivider />
          <ToggleRow
            icon="cash-outline"
            label="Withdrawals"
            value={notifications.withdrawals}
            onValueChange={(v) => setNotificationSetting('withdrawals', v)}
          />
          <RowDivider />
          <ToggleRow
            icon="trending-up-outline"
            label="Yield Updates"
            value={notifications.yield}
            onValueChange={(v) => setNotificationSetting('yield', v)}
            iconColor={theme.success}
          />
          <RowDivider />
          <ToggleRow
            icon="shield-outline"
            label="Security Alerts"
            value={notifications.security}
            onValueChange={(v) => setNotificationSetting('security', v)}
            iconColor={theme.warning}
          />
        </Card>

        {/* ── Account ── */}
        <SectionHeader title="Account" />
        <Card padding="none" style={styles.section}>
          <ActionRow
            icon="person-outline"
            label="Account Type"
            onPress={() => {}}
            value={user?.role === 'admin' ? 'Admin' : 'Investor'}
          />
          <RowDivider />
          <ActionRow
            icon="calendar-outline"
            label="Member Since"
            onPress={() => {}}
            value={memberSince}
          />
        </Card>

        {/* ── Support ── */}
        <SectionHeader title="Support" />
        <Card padding="none" style={styles.section}>
          <ActionRow
            icon="mail-outline"
            label="Contact Support"
            onPress={handleContactSupport}
            iconColor={theme.primary}
          />
          <RowDivider />
          <ActionRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://indigoyield.com/terms')}
            iconColor={theme.textMuted}
          />
          <RowDivider />
          <ActionRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://indigoyield.com/privacy')}
            iconColor={theme.textMuted}
          />
        </Card>

        {/* ── Danger zone ── */}
        <SectionHeader title="Danger Zone" />
        <Card padding="none" style={styles.section}>
          <ActionRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
            destructive
          />
        </Card>

        {/* Version footer */}
        <Text variant="caption" color="muted" style={styles.versionText}>
          Indigo Yield · Invite-Only · Accredited Investors
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scroll: {
      padding: 16,
      paddingBottom: 48,
      gap: 8,
    },
    title: {
      color: theme.text,
      marginBottom: 8,
    },
    profileCard: {
      marginBottom: 8,
    },
    profileContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: `${theme.primary}30`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: theme.primary,
      fontWeight: '700',
    },
    profileInfo: {
      flex: 1,
      gap: 4,
    },
    roleBadge: {
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    sectionHeader: {
      marginTop: 16,
      marginBottom: 6,
      marginLeft: 4,
      letterSpacing: 0.8,
    },
    section: {
      overflow: 'hidden',
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowLabel: {
      flex: 1,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 62,
    },
    versionText: {
      textAlign: 'center',
      marginTop: 24,
    },
  });
}
