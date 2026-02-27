/**
 * WithdrawalDetailScreen
 * Full detail and status timeline for a withdrawal request
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { getWithdrawalById, cancelWithdrawal } from '@/services/withdrawals/withdrawalService';
import { formatAmount } from '@/utils/formatting/currency';
import { formatDateTime } from '@/utils/formatting/date';
import type { WithdrawalRequestWithDetails, WithdrawalStatus } from '@/types/domains/withdrawal';
import type { RootScreenProps } from '@/app/navigation/types';

type Props = RootScreenProps<'WithdrawalDetail'>;

const STATUS_CONFIG: Record<
  WithdrawalStatus,
  { label: string; variant: 'warning' | 'success' | 'destructive' | 'default' }
> = {
  pending_approval: { label: 'Pending Approval', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  processing: { label: 'Processing', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

// ─── Timeline step ────────────────────────────────────────────────────────────

function TimelineStep({
  label,
  date,
  active,
  isLast,
  rejected,
}: {
  label: string;
  date: string | null;
  active: boolean;
  isLast: boolean;
  rejected?: boolean;
}) {
  const { theme } = useTheme();
  const dotColor = rejected
    ? theme.destructive
    : active
    ? theme.primary
    : theme.elevated;
  const styles = makeStyles(theme);

  return (
    <View style={styles.timelineStep}>
      <View style={styles.timelineLeft}>
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor: dotColor,
              borderColor: active || rejected ? dotColor : theme.border,
            },
          ]}
        />
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />}
      </View>
      <View style={styles.timelineContent}>
        <Text variant="label" style={{ color: active ? theme.text : theme.textMuted }}>
          {label}
        </Text>
        {date ? (
          <Text variant="caption" color="muted">
            {formatDateTime(date)}
          </Text>
        ) : (
          <Text variant="caption" color="muted">
            {active ? 'In progress' : 'Pending'}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.detailRow}>
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="label" style={styles.detailValue} selectable>
        {value}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function WithdrawalDetailScreen({ route }: Props) {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { withdrawalId } = route.params;

  const [withdrawal, setWithdrawal] = useState<WithdrawalRequestWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getWithdrawalById(withdrawalId);
      if (!data) {
        setError('Withdrawal not found.');
      } else {
        setWithdrawal(data);
      }
    } catch {
      setError('Unable to load withdrawal details.');
    } finally {
      setLoading(false);
    }
  }, [withdrawalId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Withdrawal',
      'Are you sure you want to cancel this withdrawal request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelWithdrawal(withdrawalId);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to cancel withdrawal. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }, [withdrawalId, navigation]);

  const styles = makeStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (error || !withdrawal) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
        <Text variant="body" color="muted" style={styles.errorMsg}>
          {error ?? 'Withdrawal not found.'}
        </Text>
        <Button onPress={load} variant="outline">
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  const statusCfg = STATUS_CONFIG[withdrawal.status];
  const isRejected = withdrawal.status === 'rejected';
  const isCompleted = withdrawal.status === 'completed';
  const isPending = withdrawal.status === 'pending_approval';

  // Timeline steps
  const requestedActive = true;
  const underReviewActive = withdrawal.status !== 'pending_approval';
  const finalActive = isCompleted || isRejected || withdrawal.status === 'cancelled';

  const finalLabel = isRejected ? 'Rejected' : withdrawal.status === 'cancelled' ? 'Cancelled' : 'Completed';
  const finalDate = isRejected
    ? withdrawal.rejected_date
    : isCompleted
    ? withdrawal.completed_date
    : null;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Amount hero ── */}
        <View style={styles.amountHero}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}15` }]}>
            <Ionicons name="arrow-up-circle" size={36} color={theme.primary} />
          </View>
          <Text variant="caption" color="muted" style={styles.heroLabel}>
            Withdrawal Request
          </Text>
          <PrivacyValue
            value={`${formatAmount(withdrawal.amount, withdrawal.fund?.asset_symbol)} ${withdrawal.fund?.asset_symbol ?? 'USDT'}`}
            variant="valueLarge"
            style={{ color: theme.destructive }}
          />
          <Badge variant={statusCfg.variant} style={styles.statusBadge}>
            {statusCfg.label}
          </Badge>
        </View>

        {/* ── Details ── */}
        <Card>
          <CardHeader>
            <Text variant="h4">Details</Text>
          </CardHeader>
          <CardContent style={styles.detailsContent}>
            <DetailRow label="Asset" value={withdrawal.fund?.asset_symbol ?? '—'} />
            <View style={styles.rowDivider} />
            <DetailRow label="Fund" value={withdrawal.fund?.name ?? '—'} />
            <View style={styles.rowDivider} />
            <DetailRow
              label="Amount"
              value={`${formatAmount(withdrawal.amount, withdrawal.fund?.asset_symbol)} ${withdrawal.fund?.asset_symbol ?? ''}`}
            />
            {withdrawal.notes && (
              <>
                <View style={styles.rowDivider} />
                <DetailRow label="Notes" value={withdrawal.notes} />
              </>
            )}
            {isRejected && withdrawal.rejection_reason && (
              <>
                <View style={styles.rowDivider} />
                <View style={styles.rejectionBox}>
                  <Ionicons name="warning-outline" size={14} color={theme.destructive} />
                  <Text variant="caption" color="destructive" style={styles.rejectionText}>
                    {withdrawal.rejection_reason}
                  </Text>
                </View>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Timeline ── */}
        <Card>
          <CardHeader>
            <Text variant="h4">Status Timeline</Text>
          </CardHeader>
          <CardContent>
            <TimelineStep
              label="Requested"
              date={withdrawal.created_at}
              active={requestedActive}
              isLast={false}
            />
            <TimelineStep
              label="Under Review"
              date={withdrawal.approved_date}
              active={underReviewActive}
              isLast={!finalActive}
            />
            {finalActive && (
              <TimelineStep
                label={finalLabel}
                date={finalDate ?? null}
                active={true}
                isLast={true}
                rejected={isRejected || withdrawal.status === 'cancelled'}
              />
            )}
          </CardContent>
        </Card>

        {/* ── Cancel button ── */}
        {isPending && (
          <Button
            variant="destructive"
            onPress={handleCancel}
            loading={cancelling}
            disabled={cancelling}
            fullWidth
          >
            Cancel Request
          </Button>
        )}
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
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    scroll: {
      padding: 16,
      paddingBottom: 40,
      gap: 16,
    },
    amountHero: {
      alignItems: 'center',
      paddingVertical: 24,
      gap: 8,
    },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    heroLabel: {
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    statusBadge: {
      marginTop: 4,
    },
    detailsContent: {
      gap: 0,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 10,
    },
    detailValue: {
      flex: 1,
      textAlign: 'right',
      marginLeft: 16,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
    },
    rejectionBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: `${theme.destructive}10`,
      borderRadius: 8,
      marginTop: 4,
    },
    rejectionText: {
      flex: 1,
    },
    timelineStep: {
      flexDirection: 'row',
      gap: 12,
      minHeight: 60,
    },
    timelineLeft: {
      alignItems: 'center',
      width: 20,
    },
    timelineDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      marginTop: 4,
    },
    timelineLine: {
      flex: 1,
      width: 2,
      marginTop: 4,
    },
    timelineContent: {
      flex: 1,
      paddingBottom: 16,
      gap: 2,
    },
    errorMsg: {
      textAlign: 'center',
      marginVertical: 12,
    },
  });
}
