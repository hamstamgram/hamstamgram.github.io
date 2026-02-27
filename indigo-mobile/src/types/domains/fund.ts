/**
 * Fund types for Indigo Yield Mobile
 * Mirrors web application types
 */

export type AssetType = 'crypto' | 'stablecoin' | 'fiat';

export interface Fund {
  id: string;
  name: string;
  description: string | null;
  asset_symbol: string;
  asset_type: AssetType;
  current_nav: string; // NUMERIC stored as string
  inception_date: string;
  is_active: boolean;
  min_investment: string | null;
  created_at: string;
  updated_at: string;
}

export interface FundWithBalance extends Fund {
  available_balance: string;
}

// Asset symbol to decimal precision mapping
export const assetPrecision: Record<string, number> = {
  BTC: 8,
  ETH: 8,
  SOL: 8,
  USDT: 2,
  USDC: 2,
  USD: 2,
  EUR: 2,
};

export function getAssetPrecision(symbol: string): number {
  return assetPrecision[symbol] ?? 8;
}
