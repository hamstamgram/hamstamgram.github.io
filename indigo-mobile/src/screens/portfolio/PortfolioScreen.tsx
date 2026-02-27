/**
 * PortfolioScreen
 * Holdings and performance overview
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
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { getAssetColor } from '@/components/ui/AssetChip';
import { getPortfolioSummary } from '@/services/portfolio/portfolioService';
import { formatAmount, parseAmount } from '@/utils/formatting/currency';
import type { PortfolioSummary, FundPosition } from '@/types/domains/position';

type Tab = 'Holdings' | 'Performance';

// ─── Fund Card ────────────────────────────────────────────────────────────────
// One card per fund. Balance shown in native asset. Nothing is converted or merged.

function FundCard({ position }: { position: FundPosition }) {
  const { theme } = useTheme();
  const color = getAssetColor(position.asset_symbol);
  const pnl = parseAmount(position.unrealized_pnl);
  const pnlPositive = pnl.gte(0);
  const pnlColor = pnlPositive ? theme.success : theme.destructive;

  const styles = makeStyles(theme);

  return (
    <Card style={styles.positionCard}>
      <View style={styles.positionRow}>
        {/* Asset icon — colored circle with ticker */}
        <View style={[styles.assetIcon, { backgroundColor: `${color}20` }]}>
          <Text variant="label" style={{ ...styles.assetSymbol, color }}>
            {position.asset_symbol.slice(0, 3)}
          </Text>
        </View>

        {/* Fund name + asset type */}
        <View style={styles.positionInfo}>
          <Text variant="label" numberOfLines={1}>{position.fund_name}</Text>
          <Text variant="caption" color="muted">{position.asset_symbol} · {position.asset_type}</Text>
        </View>

        {/* Balance in native asset — never converted to USDT */}
        <View style={styles.positionRight}>
          <PrivacyValue
            value={`${formatAmount(position.current_value, position.asset_symbol)} ${position.asset_symbol}`}
            variant="value"
          />
          <Text variant="caption" style={{ ...styles.pnlText, color: pnlColor }}>
            {pnlPositive ? '+' : ''}{formatAmount(pnl, position.asset_symbol)} {position.asset_symbol}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ─── Performance stat row ─────────────────────────────────────────────────────

function StatRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.statRow}>
      <Text variant="body" color="muted">
        {label}
      </Text>
      <Text variant="value" style={{ color: positive ? theme.success : theme.destructive }}>
        {positive ? '+' : ''}{value}
      </Text>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyHoldings() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.emptyState}>
      <Ionicons name="wallet-outline" size={48} color={theme.textMuted} />
      <Text variant="body" color="muted" style={styles.emptyText}>
        No holdings found
      </Text>
      <Text variant="caption" color="muted">
        Your portfolio positions will appear here.
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function PortfolioScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Holdings');
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getPortfolioSummary();
      setSummary(data);
    } catch {
      setError('Unable to load portfolio. Tap to retry.');
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

  const fundPositions = summary?.fund_positions ?? [];

  if (loading) {
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
        <Button onPress={load} variant="outline">
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={activeTab === 'Holdings' ? fundPositions : []}
        keyExtractor={(item) => item.fund_id}
        renderItem={({ item }) => <FundCard position={item} />}
        ListEmptyComponent={activeTab === 'Holdings' ? <EmptyHoldings /> : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* ── Header — no merged total; funds have different assets ── */}
            <View style={styles.header}>
              <Text variant="h3" style={styles.title}>Portfolio</Text>
              <Text variant="caption" color="muted">
                {fundPositions.length} {fundPositions.length === 1 ? 'fund' : 'funds'} · balances in native asset
              </Text>
            </View>

            {/* ── Tabs ── */}
            <View style={styles.tabBar}>
              {(['Holdings', 'Performance'] as Tab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && { borderBottomColor: theme.primary }]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text
                    variant="label"
                    style={{ ...styles.tabText, color: activeTab === tab ? theme.primary : theme.textMuted }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Performance tab — per-fund, native asset ── */}
            {activeTab === 'Performance' && (
              fundPositions.length === 0 ? (
                <Text variant="caption" color="muted" style={{ marginTop: 8 }}>No positions</Text>
              ) : (
                fundPositions.map((pos) => {
                  const pnl = parseAmount(pos.unrealized_pnl);
                  const basis = parseAmount(pos.cost_basis);
                  const pnlPositive = pnl.gte(0);
                  const pnlPct = basis.gt(0)
                    ? pnl.div(basis).times(100).toFixed(2) + '%'
                    : '—';
                  return (
                    <Card key={pos.fund_id} style={styles.performanceCard}>
                      <Text variant="h4" style={styles.performanceTitle} numberOfLines={1}>
                        {pos.fund_name}
                      </Text>
                      <Text variant="caption" color="muted" style={{ marginBottom: 8 }}>
                        {pos.asset_symbol}
                      </Text>
                      <StatRow
                        label="Current Value"
                        value={`${formatAmount(pos.current_value, pos.asset_symbol)} ${pos.asset_symbol}`}
                        positive={true}
                      />
                      <View style={styles.statDivider} />
                      <StatRow
                        label="Cost Basis"
                        value={`${formatAmount(pos.cost_basis, pos.asset_symbol)} ${pos.asset_symbol}`}
                        positive={true}
                      />
                      <View style={styles.statDivider} />
                      <StatRow
                        label="P&L"
                        value={`${pnlPositive ? '+' : ''}${formatAmount(pnl, pos.asset_symbol)} ${pos.asset_symbol}`}
                        positive={pnlPositive}
                      />
                      <View style={styles.statDivider} />
                      <StatRow
                        label="P&L %"
                        value={pnlPct}
                        positive={pnlPositive}
                      />
                    </Card>
                  );
                })
              )
            )}

            {/* ── Holdings section header ── */}
            {activeTab === 'Holdings' && (
              <Text variant="label" color="muted" style={styles.listLabel}>
                {fundPositions.length} {fundPositions.length === 1 ? 'fund' : 'funds'}
              </Text>
            )}
          </View>
        }
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
    listContent: {
      padding: 16,
      paddingBottom: 32,
      gap: 12,
    },
    header: {
      marginBottom: 20,
      gap: 8,
    },
    title: {
      color: theme.text,
    },

    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabText: {
      fontWeight: '600',
    },
    positionCard: {
      marginBottom: 0,
    },
    positionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    assetIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    assetSymbol: {
      fontWeight: '700',
    },
    positionInfo: {
      flex: 1,
      gap: 2,
    },
    positionRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    pnlText: {
      fontSize: 12,
      fontWeight: '600',
    },
    performanceCard: {
      marginBottom: 16,
      gap: 4,
    },
    performanceTitle: {
      color: theme.text,
      marginBottom: 12,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    statDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
    },
    listLabel: {
      marginBottom: 8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      gap: 12,
    },
    emptyText: {
      marginTop: 4,
    },
    errorMsg: {
      textAlign: 'center',
      marginVertical: 12,
    },
  });
}
