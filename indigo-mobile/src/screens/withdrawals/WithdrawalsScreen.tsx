/**
 * WithdrawalsScreen
 * List of withdrawal requests with FAB to create new
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { getWithdrawals } from '@/services/withdrawals/withdrawalService';
import { formatAmount } from '@/utils/formatting/currency';
import { formatDate } from '@/utils/formatting/date';
import type { WithdrawalRequestWithDetails, WithdrawalStatus } from '@/types/domains/withdrawal';
import type { RootStackParamList } from '@/app/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_CONFIG: Record<
  WithdrawalStatus,
  { label: string; variant: 'warning' | 'success' | 'destructive' | 'default' }
> = {
  pending_approval: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  processing: { label: 'Processing', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

// ─── Withdrawal Row ───────────────────────────────────────────────────────────

function WithdrawalRow({
  withdrawal,
  onPress,
}: {
  withdrawal: WithdrawalRequestWithDetails;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const statusCfg = STATUS_CONFIG[withdrawal.status];
  const styles = makeStyles(theme);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.icon, { backgroundColor: `${theme.primary}15` }]}>
        <Ionicons name="arrow-up-circle-outline" size={22} color={theme.primary} />
      </View>

      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text variant="label">Withdrawal</Text>
          <PrivacyValue
            value={`${formatAmount(withdrawal.amount, withdrawal.fund?.asset_symbol)} ${withdrawal.fund?.asset_symbol ?? 'USDT'}`}
            variant="value"
            style={{ color: theme.destructive }}
          />
        </View>
        <View style={styles.rowBottom}>
          <Text variant="caption" color="muted">
            {formatDate(withdrawal.created_at)}
          </Text>
          <Badge variant={statusCfg.variant} style={styles.statusBadge}>
            {statusCfg.label}
          </Badge>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyWithdrawals({ onRequest }: { onRequest: () => void }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.emptyState}>
      <Ionicons name="cash-outline" size={48} color={theme.textMuted} />
      <Text variant="body" color="muted" style={styles.emptyTitle}>
        No withdrawal requests
      </Text>
      <Text variant="caption" color="muted" style={styles.emptySubtitle}>
        Your withdrawal history will appear here.
      </Text>
      <Button onPress={onRequest} style={styles.emptyBtn}>
        Request Withdrawal
      </Button>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function WithdrawalsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavProp>();

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const load = useCallback(async (pg: number = 0) => {
    try {
      setError(null);
      const result = await getWithdrawals(pg);
      if (pg === 0) {
        setWithdrawals(result.withdrawals);
      } else {
        setWithdrawals((prev) => [...prev, ...result.withdrawals]);
      }
      setHasMore(result.hasMore);
      setPage(pg);
    } catch {
      setError('Unable to load withdrawals. Tap to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(0);
  }, [load]);

  const onLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    load(page + 1);
  }, [hasMore, loadingMore, page, load]);

  const goToCreate = useCallback(() => {
    navigation.navigate('CreateWithdrawal', undefined);
  }, [navigation]);

  const styles = makeStyles(theme);

  if (loading && withdrawals.length === 0) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
        <Text variant="body" color="muted" style={styles.errorMsg}>
          {error}
        </Text>
        <Button onPress={() => load(0)} variant="outline">
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={withdrawals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WithdrawalRow
            withdrawal={item}
            onPress={() => navigation.navigate('WithdrawalDetail', { withdrawalId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyWithdrawals onRequest={goToCreate} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* ── FAB ── */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={goToCreate} activeOpacity={0.85}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
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
    listContent: {
      flexGrow: 1,
      paddingBottom: 100,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      backgroundColor: theme.background,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowInfo: {
      flex: 1,
      gap: 6,
    },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      alignSelf: 'flex-start',
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 68,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    emptyState: {
      alignItems: 'center',
      paddingTop: 80,
      paddingHorizontal: 32,
      gap: 8,
    },
    emptyTitle: {
      marginTop: 8,
    },
    emptySubtitle: {
      textAlign: 'center',
    },
    emptyBtn: {
      marginTop: 16,
    },
    loadingMore: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    errorMsg: {
      textAlign: 'center',
      marginVertical: 12,
    },
  });
}
