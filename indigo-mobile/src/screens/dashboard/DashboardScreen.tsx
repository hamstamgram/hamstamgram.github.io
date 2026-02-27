/**
 * DashboardScreen
 * Main dashboard — portfolio overview, recent activity, quick actions
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { AssetChip, getAssetColor } from '@/components/ui/AssetChip';
import { getPortfolioSummary } from '@/services/portfolio/portfolioService';
import { getRecentActivity } from '@/services/transactions/transactionService';
import { formatAmount, parseAmount } from '@/utils/formatting/currency';
import { formatDate } from '@/utils/formatting/date';
import type { PortfolioSummary, FundPosition } from '@/types/domains/position';
import type { TransactionWithDetails } from '@/types/domains/transaction';
import type { RootStackParamList } from '@/app/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Skeleton placeholders ────────────────────────────────────────────────────

function SkeletonBox({ style }: { style?: object }) {
  return <View style={[skeletonStyles.box, style]} />;
}

const skeletonStyles = StyleSheet.create({
  box: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    opacity: 0.6,
  },
});

// ─── Fund card ───────────────────────────────────────────────────────────────
// One card per fund — each fund has its own asset; balances are NEVER merged.

function FundCard({ position }: { position: FundPosition }) {
  const { theme } = useTheme();
  const color = getAssetColor(position.asset_symbol);
  const pnl = parseAmount(position.unrealized_pnl);
  const pnlPositive = pnl.gte(0);

  const styles = makeStyles(theme);

  return (
    <Card style={styles.assetCard}>
      <View style={styles.assetRow}>
        {/* Asset icon */}
        <View style={[styles.assetIcon, { backgroundColor: `${color}20` }]}>
          <Text variant="label" style={{ ...styles.assetSymbol, color }}>
            {position.asset_symbol.slice(0, 3)}
          </Text>
        </View>

        {/* Fund name + asset ticker */}
        <View style={styles.assetInfo}>
          <Text variant="label" numberOfLines={1}>{position.fund_name}</Text>
          <Text variant="caption" color="muted">{position.asset_symbol}</Text>
        </View>

        {/* Balance in native asset — no USDT conversion */}
        <View style={styles.assetRight}>
          <PrivacyValue
            value={`${formatAmount(position.current_value, position.asset_symbol)} ${position.asset_symbol}`}
            variant="value"
          />
          <Text
            variant="caption"
            style={{ color: pnlPositive ? theme.success : theme.destructive }}
          >
            {pnlPositive ? '+' : ''}
            {formatAmount(pnl, position.asset_symbol)} {position.asset_symbol}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TxRow({
  tx,
  onPress,
}: {
  tx: TransactionWithDetails;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const isPositive = tx.type === 'DEPOSIT' || tx.type === 'YIELD' || tx.type === 'INTEREST';
  const amountColor = isPositive ? theme.success : theme.destructive;

  const txTypeIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
    DEPOSIT: 'arrow-down-circle-outline',
    WITHDRAWAL: 'arrow-up-circle-outline',
    YIELD: 'trending-up-outline',
    INTEREST: 'trending-up-outline',
    FEE: 'remove-circle-outline',
    ADJUSTMENT: 'swap-horizontal-outline',
  };

  const iconName = txTypeIcon[tx.type] ?? 'ellipse-outline';
  const styles = makeStyles(theme);

  return (
    <TouchableOpacity style={styles.txRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.txIcon, { backgroundColor: `${amountColor}15` }]}>
        <Ionicons name={iconName} size={20} color={amountColor} />
      </View>
      <View style={styles.txInfo}>
        <Text variant="label">{tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}</Text>
        <Text variant="caption" color="muted">
          {formatDate(tx.effective_date)}
        </Text>
      </View>
      <PrivacyValue
        value={`${isPositive ? '+' : '-'}${formatAmount(tx.amount, tx.fund?.asset_symbol)} ${tx.fund?.asset_symbol ?? 'USDT'}`}
        variant="value"
        style={{ color: amountColor }}
      />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { user } = useAuthStore();

  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [recentTxs, setRecentTxs] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.full_name?.split(' ')[0] ?? 'Investor';

  const load = useCallback(async () => {
    try {
      setError(null);
      const [portfolioData, txData] = await Promise.all([
        getPortfolioSummary(),
        getRecentActivity(3),
      ]);
      setSummary(portfolioData);
      setRecentTxs(txData);
    } catch {
      setError('Unable to load portfolio data. Tap to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const styles = makeStyles(theme);

  // Per-fund positions — these are the source of truth for display
  const fundPositions = summary?.fund_positions ?? [];
  const topFunds = fundPositions.slice(0, 4);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
        <Text variant="body" color="muted" style={styles.errorMsg}>
          {error}
        </Text>
        <Button onPress={load} variant="outline">
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text variant="h3" style={styles.greeting}>
              {getGreeting()}, {firstName}
            </Text>
            <Text variant="caption" color="muted">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <Badge variant="outline">Accredited</Badge>
        </View>

        {/* ── Hero card — balances per fund, never merged ── */}
        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text variant="caption" color="muted" style={styles.heroLabel}>
              {fundPositions.length === 1 ? 'Your Fund' : `Your Funds (${fundPositions.length})`}
            </Text>
            <Badge variant="outline">Accredited</Badge>
          </View>

          {/* Per-fund balance rows with asset icons */}
          {topFunds.length === 0 ? (
            <Text variant="caption" color="muted">No active positions</Text>
          ) : (
            topFunds.map((pos) => {
              const color = getAssetColor(pos.asset_symbol);
              return (
                <View key={pos.fund_id} style={styles.heroFundRow}>
                  <View style={[styles.assetIcon, { backgroundColor: `${color}22`, width: 36, height: 36, borderRadius: 18 }]}>
                    <Text style={{ ...styles.assetSymbol, color, fontSize: 10 }}>
                      {pos.asset_symbol.slice(0, 3)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="caption" color="muted" numberOfLines={1}>{pos.fund_name}</Text>
                  </View>
                  <PrivacyValue
                    value={`${formatAmount(pos.current_value, pos.asset_symbol)} ${pos.asset_symbol}`}
                    variant="value"
                  />
                </View>
              );
            })
          )}

          {fundPositions.length > 4 && (
            <Text variant="caption" color="muted" style={{ textAlign: 'center' }}>
              +{fundPositions.length - 4} more in Portfolio
            </Text>
          )}
        </Card>

        {/* ── Fund holdings ── */}
        {topFunds.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" style={styles.sectionTitle}>Holdings</Text>
            {topFunds.map((pos) => (
              <FundCard key={pos.fund_id} position={pos} />
            ))}
          </View>
        )}

        {/* ── Recent Transactions ── */}
        {recentTxs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text variant="h4" style={styles.sectionTitle}>
                Recent Activity
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Main', { screen: 'Transactions' } as never)}
              >
                <Text variant="caption" style={{ color: theme.primary }}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>
            <Card padding="none">
              {recentTxs.map((tx, idx) => (
                <View key={tx.id}>
                  <TxRow
                    tx={tx}
                    onPress={() => navigation.navigate('TransactionDetail', { transactionId: tx.id })}
                  />
                  {idx < recentTxs.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* ── Quick actions ── */}
        <View style={styles.actions}>
          <Button
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Main', { screen: 'Portfolio' } as never)}
          >
            View Portfolio
          </Button>
          <Button
            variant="outline"
            style={styles.actionBtn}
            onPress={() => navigation.navigate('CreateWithdrawal', undefined)}
          >
            Request Withdrawal
          </Button>
        </View>
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
      paddingBottom: 32,
      gap: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    greeting: {
      color: theme.text,
      marginBottom: 2,
    },
    heroCard: {
      backgroundColor: theme.surface,
      gap: 14,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroLabel: {
      marginBottom: 2,
    },
    heroFundRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    section: {
      gap: 10,
    },
    sectionTitle: {
      color: theme.text,
    },
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    assetCard: {
      marginBottom: 0,
    },
    assetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    assetIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    assetSymbol: {
      fontWeight: '700',
    },
    assetInfo: {
      flex: 1,
      gap: 2,
    },
    assetRight: {
      alignItems: 'flex-end',
    },
    pnlText: {
      fontWeight: '600',
      fontSize: 12,
    },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    txIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    txInfo: {
      flex: 1,
      gap: 2,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 64,
    },
    actions: {
      gap: 10,
    },
    actionBtn: {
      width: '100%',
    },
    errorMsg: {
      textAlign: 'center',
      marginVertical: 12,
    },
  });
}
