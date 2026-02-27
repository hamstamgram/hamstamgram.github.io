/**
 * Position types for Indigo Yield Mobile
 * Mirrors web application types
 */

export interface Position {
  id: string;
  investor_id: string;
  fund_id: string;
  units: string; // NUMERIC stored as string
  cost_basis: string; // NUMERIC stored as string
  current_value: string; // NUMERIC stored as string
  unrealized_pnl: string; // NUMERIC stored as string
  mtd_return: string | null; // NUMERIC stored as string
  ytd_return: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined relations
  fund?: {
    id: string;
    name: string;
    asset_symbol: string;
    asset_type: string;
    current_nav: string;
  };
}

export interface PositionWithFund extends Position {
  fund: {
    id: string;
    name: string;
    asset_symbol: string;
    asset_type: string;
    current_nav: string;
    description: string | null;
  };
}

// Positions grouped by asset for portfolio display
export interface PositionsByAsset {
  asset_symbol: string;
  asset_type: string;
  total_value: string;
  total_cost_basis: string;
  total_unrealized_pnl: string;
  positions: PositionWithFund[];
}

/**
 * Flat per-fund view — balance is per fund, each fund has one asset.
 * Use this for display; never merge across funds or assets.
 */
export interface FundPosition {
  fund_id: string;
  fund_name: string;
  asset_symbol: string;
  asset_type: string;
  current_value: string;     // in native asset
  cost_basis: string;        // in native asset
  unrealized_pnl: string;    // in native asset
  mtd_return: string | null;
  ytd_return: string | null;
}

// Portfolio summary
export interface PortfolioSummary {
  /** Do NOT display as a single number — assets can't be merged */
  total_value: string;
  total_cost_basis: string;
  total_unrealized_pnl: string;
  total_pnl_percentage: string;
  /** Grouped by asset symbol — use for aggregated per-asset views */
  positions_by_asset: PositionsByAsset[];
  /** Flat list per fund — use for display (one card per fund with asset icon) */
  fund_positions: FundPosition[];
}
