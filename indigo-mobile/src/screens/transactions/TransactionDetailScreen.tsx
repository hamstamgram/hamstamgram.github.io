/**
 * TransactionDetailScreen
 * Full detail view for a single transaction
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { getTransactionById } from '@/services/transactions/transactionService';
import { formatAmount, parseAmount } from '@/utils/formatting/currency';
import { formatDateTime } from '@/utils/formatting/date';
import type { TransactionWithDetails, TransactionStatus } from '@/types/domains/transaction';
import type { RootScreenProps } from '@/app/navigation/types';

type Props = RootScreenProps<'TransactionDetail'>;

const STATUS_BADGE_VARIANT: Record<TransactionStatus, 'success' | 'warning' | 'destructive' | 'default'> = {
  pending: 'warning',
  confirmed: 'success',
  failed: 'destructive',
  cancelled: 'default',
};

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

function TimelineStep({
  label,
  date,
  active,
  isLast,
}: {
  label: string;
  date: string | null;
  active: boolean;
  isLast: boolean;
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.timelineStep}>
      <View style={styles.timelineLeft}>
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor: active ? theme.primary : theme.elevated,
              borderColor: active ? theme.primary : theme.border,
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
            Pending
          </Text>
        )}
      </View>
    </View>
  );
}

export function TransactionDetailScreen({ route }: Props) {
  const { theme } = useTheme();
  const { transactionId } = route.params;

  const [tx, setTx] = useState<TransactionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getTransactionById(transactionId);
      if (!data) {
        setError('Transaction not found.');
      } else {
        setTx(data);
      }
    } catch {
      setError('Unable to load transaction details.');
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    load();
  }, [load]);

  const styles = makeStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (error || !tx) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
        <Text variant="body" color="muted" style={styles.errorMsg}>
          {error ?? 'Transaction not found.'}
        </Text>
        <Button onPress={load} variant="outline">
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  const isPositive = tx.type === 'DEPOSIT' || tx.type === 'YIELD' || tx.type === 'INTEREST';
  const amountColor = isPositive ? theme.success : theme.destructive;
  const badgeVariant = STATUS_BADGE_VARIANT[tx.status] ?? 'default';

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Amount hero ── */}
        <View style={styles.amountHero}>
          <View style={[styles.txTypeIcon, { backgroundColor: `${amountColor}20` }]}>
            <Ionicons
              name={isPositive ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={36}
              color={amountColor}
            />
          </View>
          <Text variant="caption" color="muted" style={styles.txTypeLabel}>
            {tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}
          </Text>
          <PrivacyValue
            value={`${isPositive ? '+' : '-'}${formatAmount(tx.amount, tx.fund?.asset_symbol)} ${tx.fund?.asset_symbol ?? 'USDT'}`}
            variant="valueLarge"
            style={{ color: amountColor }}
          />
          <Badge variant={badgeVariant} style={styles.statusBadge}>
            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
          </Badge>
        </View>

        {/* ── Details card ── */}
        <Card>
          <CardHeader>
            <Text variant="h4">Details</Text>
          </CardHeader>
          <CardContent style={styles.detailsContent}>
            <DetailRow label="Asset" value={tx.fund?.asset_symbol ?? '—'} />
            <View style={styles.rowDivider} />
            <DetailRow label="Fund" value={tx.fund?.name ?? '—'} />
            <View style={styles.rowDivider} />
            <DetailRow
              label="Amount"
              value={`${formatAmount(tx.amount, tx.fund?.asset_symbol)} ${tx.fund?.asset_symbol ?? ''}`}
            />
            {tx.unit_price && (
              <>
                <View style={styles.rowDivider} />
                <DetailRow
                  label="Unit Price"
                  value={`${formatAmount(tx.unit_price, 'USDT')} USDT`}
                />
              </>
            )}
            {tx.units && (
              <>
                <View style={styles.rowDivider} />
                <DetailRow label="Units" value={formatAmount(tx.units)} />
              </>
            )}
            {tx.reference_id && (
              <>
                <View style={styles.rowDivider} />
                <DetailRow label="Reference ID" value={tx.reference_id} />
              </>
            )}
            {tx.description && (
              <>
                <View style={styles.rowDivider} />
                <DetailRow label="Description" value={tx.description} />
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Timeline ── */}
        <Card>
          <CardHeader>
            <Text variant="h4">Timeline</Text>
          </CardHeader>
          <CardContent>
            <TimelineStep
              label="Created"
              date={tx.created_at}
              active={true}
              isLast={false}
            />
            <TimelineStep
              label="Effective Date"
              date={tx.effective_date}
              active={tx.status === 'confirmed' || tx.status === 'failed'}
              isLast={true}
            />
          </CardContent>
        </Card>
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
    txTypeIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    txTypeLabel: {
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
      alignItems: 'center',
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
