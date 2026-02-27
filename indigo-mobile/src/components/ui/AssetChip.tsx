/**
 * AssetChip
 * Compact pill showing a colored asset icon + amount in native denomination.
 * Never merges across assets — each fund's balance is shown independently.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { PrivacyValue } from './PrivacyValue';

// Brand colors per asset — extend as needed
const ASSET_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  USDT: '#26A17B',
  USDC: '#2775CA',
  SOL: '#9945FF',
  XRP: '#00AAE4',
  ADA: '#0033AD',
  MATIC: '#8247E5',
  DOT: '#E6007A',
  AVAX: '#E84142',
};

export function getAssetColor(symbol: string): string {
  return ASSET_COLORS[symbol.toUpperCase()] ?? '#6B7280';
}

interface AssetChipProps {
  symbol: string;
  amount: string; // formatted string, e.g. "12,500.00"
  fundName?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Show fund name below the amount */
  showFundName?: boolean;
  /** Override icon size */
  iconSize?: number;
  style?: object;
}

export function AssetChip({
  symbol,
  amount,
  fundName,
  size = 'md',
  showFundName = false,
  style,
}: AssetChipProps) {
  const color = getAssetColor(symbol);
  const s = sizeMap[size];

  return (
    <View style={[styles.container, style]}>
      {/* Colored icon */}
      <View style={[styles.icon, { backgroundColor: `${color}22`, width: s.icon, height: s.icon, borderRadius: s.icon / 2 }]}>
        <Text style={{ ...styles.ticker, color, fontSize: s.tickerSize }}>
          {symbol.slice(0, 3)}
        </Text>
      </View>

      {/* Amount + label */}
      <View style={styles.info}>
        <PrivacyValue
          value={`${amount} ${symbol}`}
          variant={size === 'lg' ? 'financialLarge' : size === 'sm' ? 'caption' : 'value'}
        />
        {showFundName && fundName && (
          <Text variant="caption" color="muted" numberOfLines={1}>
            {fundName}
          </Text>
        )}
      </View>
    </View>
  );
}

/** Stacked list of per-asset balances — use in hero cards */
interface AssetBalanceListProps {
  positions: Array<{ asset_symbol: string; total_value: string; fund_name?: string }>;
  size?: 'sm' | 'md' | 'lg';
  showFundName?: boolean;
  style?: object;
}

export function AssetBalanceList({ positions, size = 'md', showFundName = false, style }: AssetBalanceListProps) {
  if (!positions.length) {
    return (
      <Text variant="caption" color="muted">
        No holdings
      </Text>
    );
  }

  return (
    <View style={[styles.list, style]}>
      {positions.map((pos, idx) => (
        <AssetChip
          key={`${pos.asset_symbol}-${idx}`}
          symbol={pos.asset_symbol}
          amount={pos.total_value}
          fundName={pos.fund_name}
          size={size}
          showFundName={showFundName}
        />
      ))}
    </View>
  );
}

const sizeMap = {
  sm: { icon: 28, tickerSize: 9 },
  md: { icon: 36, tickerSize: 11 },
  lg: { icon: 44, tickerSize: 13 },
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticker: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  info: {
    gap: 2,
  },
  list: {
    gap: 14,
  },
});
