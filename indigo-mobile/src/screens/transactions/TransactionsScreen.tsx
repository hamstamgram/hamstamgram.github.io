/**
 * TransactionsScreen
 * Transaction history with filter chips
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
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
import { getTransactions } from '@/services/transactions/transactionService';
import { formatAmount, parseAmount } from '@/utils/formatting/currency';
import { formatDate } from '@/utils/formatting/date';
import type { TransactionWithDetails, TransactionType } from '@/types/domains/transaction';
import type { RootStackParamList } from '@/app/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type FilterKey = 'All' | 'Deposits' | 'Withdrawals' | 'Yield';

const FILTERS: FilterKey[] = ['All', 'Deposits', 'Withdrawals', 'Yield'];

const FILTER_TO_TYPE: Partial<Record<FilterKey, TransactionType>> = {
  Deposits: 'DEPOSIT',
  Withdrawals: 'WITHDRAWAL',
  Yield: 'YIELD',
};

const TX_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  DEPOSIT: 'arrow-down-circle-outline',
  WITHDRAWAL: 'arrow-up-circle-outline',
  YIELD: 'trending-up-outline',
  INTEREST: 'trending-up-outline',
  FEE: 'remove-circle-outline',
  ADJUSTMENT: 'swap-horizontal-outline',
};

const STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#00C853',
  failed: '#EF4444',
  cancelled: '#94A3B8',
};

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({
  tx,
  onPress,
}: {
  tx: TransactionWithDetails;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const isPositive = tx.type === 'DEPOSIT' || tx.type === 'YIELD' || tx.type === 'INTEREST';
  const amountColor = isPositive ? theme.success : theme.destructive;
  const iconName = TX_ICONS[tx.type] ?? 'ellipse-outline';
  const statusColor = STATUS_COLORS[tx.status] ?? theme.textMuted;
  const styles = makeStyles(theme);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.txIcon, { backgroundColor: `${amountColor}15` }]}>
        <Ionicons name={iconName} size={22} color={amountColor} />
      </View>

      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text variant="label">{tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}</Text>
          <PrivacyValue
            value={`${isPositive ? '+' : '-'}${formatAmount(tx.amount, tx.fund?.asset_symbol)} ${tx.fund?.asset_symbol ?? ''}`}
            variant="value"
            style={{ color: amountColor }}
          />
        </View>
        <View style={styles.rowBottom}>
          <Text variant="caption" color="muted">
            {formatDate(tx.effective_date)}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text variant="caption" style={{ color: statusColor }}>
            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyTransactions({ filter }: { filter: FilterKey }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
      <Text variant="body" color="muted" style={styles.emptyTitle}>
        No transactions found
      </Text>
      <Text variant="caption" color="muted" style={styles.emptySubtitle}>
        {filter === 'All'
          ? 'Your transaction history will appear here.'
          : `No ${filter.toLowerCase()} found.`}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function TransactionsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavProp>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const load = useCallback(async (pg: number = 0, filter: FilterKey = activeFilter) => {
    try {
      setError(null);
      const typeFilter = FILTER_TO_TYPE[filter];
      const result = await getTransactions(
        typeFilter ? { type: typeFilter } : {},
        pg
      );

      if (pg === 0) {
        setTransactions(result.transactions);
      } else {
        setTransactions((prev) => [...prev, ...result.transactions]);
      }
      setHasMore(result.hasMore);
      setPage(pg);
    } catch {
      setError('Unable to load transactions. Tap to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    load(0, activeFilter);
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(0, activeFilter);
  }, [load, activeFilter]);

  const onLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    load(page + 1, activeFilter);
  }, [hasMore, loadingMore, page, load, activeFilter]);

  const styles = makeStyles(theme);

  if (loading && transactions.length === 0) {
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
      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              activeFilter === f && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              variant="label"
              style={{ color: activeFilter === f ? '#fff' : theme.textMuted }}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionRow
            tx={item}
            onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyTransactions filter={activeFilter} />}
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
    filterBar: {
      maxHeight: 56,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    filterContent: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      alignItems: 'center',
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: 32,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      backgroundColor: theme.background,
    },
    txIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowInfo: {
      flex: 1,
      gap: 4,
    },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 68,
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
