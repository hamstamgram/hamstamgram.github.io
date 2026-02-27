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
import { LargePrivacyValue, PrivacyValue } from '@/components/ui/PrivacyValue';
import { getPortfolioSummary } from '@/services/portfolio/portfolioService';
import { getRecentActivity } from '@/services/transactions/transactionService';
import { formatAmount, formatPercentage, parseAmount } from '@/utils/formatting/currency';
import { formatDate } from '@/utils/formatting/date';
import type { PortfolioSummary, PositionsByAsset } from '@/types/domains/position';
import type { TransactionWithDetails } from '@/types/domains/transaction';
import type { RootStackParamList } from '@/app/navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ASSET_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  USDT: '#26A17B',
  USDC: '#2775CA',
  SOL: '#9945FF',
};

function getAssetColor(symbol: string): string {
  return ASSET_COLORS[symbol] ?? '#3F51B5';
}

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

// ─── Asset card ──────────────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: PositionsByAsset }) {
  const { theme } = useTheme();
  const color = getAssetColor(asset.asset_symbol);
  const value = formatAmount(asset.total_value, asset.asset_symbol);
  const pnl = parseAmount(asset.total_unrealized_pnl);
  const pnlPositive = pnl.gte(0);

  const styles = makeStyles(theme);

  return (
    <Card style={styles.assetCard}>
      <View style={styles.assetRow}>
        <View style={[styles.assetIcon, { backgroundColor: `${color}20` }]}>
          <Text variant="label" style={{ ...styles.assetSymbol, color }}>
            {asset.asset_symbol}
          </Text>
        </View>
        <View style={styles.assetInfo}>
          <Text variant="label" color="muted">
            {asset.asset_symbol}
          </Text>
          <PrivacyValue value={`${value} ${asset.asset_symbol}`} variant="value" />
        </View>
        <View style={styles.assetRight}>
          <Text
            variant="caption"
            style={{ ...styles.pnlText, color: pnlPositive ? theme.success : theme.destructive }}
          >
            {pnlPositive ? '+' : ''}
            {formatAmount(pnl, asset.asset_symbol)} {asset.asset_symbol}
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

  const topAssets = summary?.positions_by_asset.slice(0, 3) ?? [];
  const pnlPct = summary ? parseAmount(summary.total_pnl_percentage) : null;
  const pnlPositive = pnlPct ? pnlPct.gte(0) : true;

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

        {/* ── Hero card ── */}
        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text variant="caption" color="muted" style={styles.heroLabel}>
                Total Portfolio Value
              </Text>
              <LargePrivacyValue
                value={`${formatAmount(summary?.total_value, 'USDT')} USDT`}
              />
            </View>
            <View style={[styles.yieldChip, { backgroundColor: pnlPositive ? `${theme.success}20` : `${theme.destructive}20` }]}>
              <Ionicons
                name={pnlPositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={pnlPositive ? theme.success : theme.destructive}
              />
              <Text
                variant="caption"
                style={{ ...styles.yieldChipText, color: pnlPositive ? theme.success : theme.destructive }}
              >
                {pnlPct ? formatPercentage(pnlPct, { showSign: true }) : '—'} MTD
              </Text>
            </View>
          </View>
          <View style={styles.heroBadgeRow}>
            <Badge variant="outline">Invite-Only</Badge>
            <Badge variant="outline">Accredited Investors</Badge>
          </View>
        </Card>

        {/* ── Holdings ── */}
        {topAssets.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" style={styles.sectionTitle}>
              Holdings
            </Text>
            {topAssets.map((asset) => (
              <AssetCard key={asset.asset_symbol} asset={asset} />
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
      gap: 16,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    heroLabel: {
      marginBottom: 6,
    },
    yieldChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    yieldChipText: {
      fontWeight: '600',
      fontSize: 12,
    },
    heroBadgeRow: {
      flexDirection: 'row',
      gap: 8,
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
