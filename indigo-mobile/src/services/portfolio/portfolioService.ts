/**
 * Portfolio Service
 * Handles investor positions and portfolio data
 */
import { supabase, getCurrentUserId } from '../api/supabase';
import { PositionWithFund, PortfolioSummary, PositionsByAsset, FundPosition } from '@/types/domains/position';
import { parseAmount, addAmounts } from '@/utils/formatting/currency';
import Decimal from 'decimal.js';

/**
 * Fetch all positions for the current investor
 */
export async function getPositions(): Promise<PositionWithFund[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('investor_positions')
    .select(`
      *,
      fund:funds (
        id,
        name,
        asset_symbol,
        asset_type,
        current_nav,
        description
      )
    `)
    .eq('investor_id', userId)
    .gt('units', 0)
    .order('current_value', { ascending: false });

  if (error) {
    console.error('Error fetching positions:', error);
    throw new Error('Failed to load portfolio positions');
  }

  return (data || []) as PositionWithFund[];
}

/**
 * Get portfolio summary with positions grouped by asset
 */
export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const positions = await getPositions();

  // Group positions by asset
  const assetGroups = new Map<string, PositionWithFund[]>();
  
  for (const position of positions) {
    const symbol = position.fund.asset_symbol;
    const existing = assetGroups.get(symbol) || [];
    assetGroups.set(symbol, [...existing, position]);
  }

  // Calculate totals per asset group
  const positionsByAsset: PositionsByAsset[] = [];
  let totalValue = new Decimal(0);
  let totalCostBasis = new Decimal(0);
  let totalUnrealizedPnl = new Decimal(0);

  for (const [assetSymbol, assetPositions] of assetGroups) {
    let groupValue = new Decimal(0);
    let groupCostBasis = new Decimal(0);
    let groupPnl = new Decimal(0);

    for (const pos of assetPositions) {
      groupValue = groupValue.plus(parseAmount(pos.current_value));
      groupCostBasis = groupCostBasis.plus(parseAmount(pos.cost_basis));
      groupPnl = groupPnl.plus(parseAmount(pos.unrealized_pnl));
    }

    positionsByAsset.push({
      asset_symbol: assetSymbol,
      asset_type: assetPositions[0].fund.asset_type,
      total_value: groupValue.toString(),
      total_cost_basis: groupCostBasis.toString(),
      total_unrealized_pnl: groupPnl.toString(),
      positions: assetPositions,
    });

    totalValue = totalValue.plus(groupValue);
    totalCostBasis = totalCostBasis.plus(groupCostBasis);
    totalUnrealizedPnl = totalUnrealizedPnl.plus(groupPnl);
  }

  // Sort by total value descending
  positionsByAsset.sort((a, b) => 
    parseAmount(b.total_value).minus(parseAmount(a.total_value)).toNumber()
  );

  // Calculate total P&L percentage
  const pnlPercentage = totalCostBasis.gt(0)
    ? totalUnrealizedPnl.dividedBy(totalCostBasis).times(100)
    : new Decimal(0);

  // Build per-fund flat list — this is what the UI should display
  const fund_positions: FundPosition[] = positions.map((p) => ({
    fund_id: p.fund_id,
    fund_name: p.fund.name,
    asset_symbol: p.fund.asset_symbol,
    asset_type: p.fund.asset_type,
    current_value: p.current_value,
    cost_basis: p.cost_basis,
    unrealized_pnl: p.unrealized_pnl,
    mtd_return: p.mtd_return ?? null,
    ytd_return: p.ytd_return ?? null,
  }));

  return {
    total_value: totalValue.toString(),
    total_cost_basis: totalCostBasis.toString(),
    total_unrealized_pnl: totalUnrealizedPnl.toString(),
    total_pnl_percentage: pnlPercentage.toString(),
    positions_by_asset: positionsByAsset,
    fund_positions,
  };
}

/**
 * Get a single position by ID
 */
export async function getPositionById(positionId: string): Promise<PositionWithFund | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('investor_positions')
    .select(`
      *,
      fund:funds (
        id,
        name,
        asset_symbol,
        asset_type,
        current_nav,
        description
      )
    `)
    .eq('id', positionId)
    .eq('investor_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching position:', error);
    throw new Error('Failed to load position');
  }

  return data as PositionWithFund;
}
